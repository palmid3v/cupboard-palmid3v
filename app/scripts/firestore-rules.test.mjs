import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";

const projectId = "demo-cupboard-rules";
let env;
const homeItem = (db, id = "home-item") => doc(db, "households", "household-a", "inventory", id);
const businessItem = (db, id = "business-item") => doc(db, "households", "household-a", "workspaces", "sandwichies", "inventory", id);
const businessMovement = (db, id = "business-movement") => doc(db, "households", "household-a", "workspaces", "sandwichies", "movements", id);

before(async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error("FIRESTORE_EMULATOR_HOST is required. Run this suite with Firebase Emulator Suite.");
  env = await initializeTestEnvironment({
    projectId,
    firestore: { rules: await readFile(new URL("../../firestore.rules", import.meta.url), "utf8") },
  });
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "households", "household-a"), { ownerUid: "admin-user" });
    const members = [
      ["admin-user", "admin", ["home", "sandwichies"]],
      ["editor-user", "editor", ["home", "sandwichies"]],
      ["member-user", "member", ["home"]],
      ["business-assigned-user", "member", ["sandwichies"]],
      ["unassigned-user", "member", []],
    ];
    for (const [uid, role, workspaces] of members) {
      await setDoc(doc(db, "households", "household-a", "members", uid), { uid, role, workspaces });
    }
    await setDoc(homeItem(db), { portions: 4 });
    await setDoc(businessItem(db), { portions: 8 });
    await setDoc(doc(db, "productCatalog", "shared-product"), { name: "Producto compartido", createdBy: "admin-user" });
  });
});
after(async () => { if (env) await env.cleanup(); });
function user(uid, emailVerified = true) {
  return env.authenticatedContext(uid, { email: uid + "@example.test", email_verified: emailVerified }).firestore();
}
test("owner can read and write both inventories", async () => {
  const db = user("admin-user");
  await assertSucceeds(getDoc(homeItem(db)));
  await assertSucceeds(getDoc(businessItem(db)));
  await assertSucceeds(setDoc(businessItem(db), { portions: 9 }));
  await assertSucceeds(setDoc(businessMovement(db), { quantity: 1, type: "consume" }));
});
test("home-assigned member can read home inventory but remains read-only", async () => {
  const db = user("member-user");
  await assertSucceeds(getDoc(homeItem(db)));
  await assertFails(setDoc(homeItem(db, "member-write"), { portions: 1 }));
  await assertFails(getDoc(businessItem(db)));
  await assertFails(setDoc(businessItem(db, "member-business-write"), { portions: 1 }));
});
test("editor can write home inventory only when assigned to home", async () => {
  const db = user("editor-user");
  await assertSucceeds(getDoc(homeItem(db)));
  await assertSucceeds(setDoc(homeItem(db, "editor-home-write"), { portions: 3 }));
  await assertFails(getDoc(businessItem(db)));
  await assertFails(setDoc(businessItem(db, "editor-business-write"), { portions: 3 }));
});
test("legacy Sandwichies assignment never exposes business inventory", async () => {
  const db = user("business-assigned-user");
  await assertFails(getDoc(businessItem(db)));
  await assertFails(setDoc(businessItem(db, "assigned-business-write"), { portions: 99 }));
  await assertFails(getDoc(homeItem(db)));
});
test("members without assignment cannot read either inventory", async () => {
  const db = user("unassigned-user");
  await assertFails(getDoc(homeItem(db)));
  await assertFails(getDoc(businessItem(db)));
});
test("unverified email cannot read or write protected inventory", async () => {
  const db = user("member-user", false);
  await assertFails(getDoc(homeItem(db)));
  await assertFails(setDoc(homeItem(db, "unverified-home-write"), { portions: 99 }));
  await assertFails(getDoc(businessItem(db)));
  await assertFails(setDoc(businessItem(db, "unverified-business-write"), { portions: 99 }));
});
test("verified members can read shared product identity but cannot create catalog entries", async () => {
  const db = user("member-user");
  await assertSucceeds(getDoc(doc(db, "productCatalog", "shared-product")));
  await assertFails(setDoc(doc(db, "productCatalog", "member-product"), {
    name: "No autorizado", createdBy: "member-user", createdAt: new Date(), updatedAt: new Date(),
  }));
});
test("unknown workspace IDs are denied even to household editors", async () => {
  const db = user("editor-user");
  const ref = doc(db, "households", "household-a", "workspaces", "other", "inventory", "item");
  await assertFails(getDoc(ref));
  await assertFails(setDoc(ref, { portions: 1 }));
});
