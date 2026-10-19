import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";

const projectId = "demo-cupboard-rules";
let env;

before(async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error(
      "FIRESTORE_EMULATOR_HOST is required. Run this suite with Firebase Emulator Suite.",
    );
  }

  env = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: await readFile(new URL("../../firestore.rules", import.meta.url), "utf8"),
    },
  });

  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "households", "household-a"), {
      ownerUid: "admin-user",
    });
    await setDoc(doc(db, "households", "household-a", "members", "admin-user"), {
      uid: "admin-user",
      role: "admin",
    });
    await setDoc(doc(db, "households", "household-a", "members", "editor-user"), {
      uid: "editor-user",
      role: "editor",
    });
    await setDoc(doc(db, "households", "household-a", "members", "member-user"), {
      uid: "member-user",
      role: "member",
    });
    await setDoc(doc(db, "households", "household-a", "inventory", "home-item"), {
      portions: 4,
    });
    await setDoc(doc(db, "households", "household-a", "workspaces", "sandwichies", "inventory", "business-item"), {
      portions: 8,
    });
  });
});

after(async () => {
  if (env) await env.cleanup();
});

function user(uid, role, emailVerified = true) {
  return env.authenticatedContext(uid, {
    email: `${uid}@example.test`,
    email_verified: emailVerified,
    role,
  }).firestore();
}

test("member can read both household and Sandwichies inventory but cannot write", async () => {
  const db = user("member-user", "member");
  await assertSucceeds(getDoc(doc(db, "households", "household-a", "inventory", "home-item")));
  await assertSucceeds(getDoc(doc(db, "households", "household-a", "workspaces", "sandwichies", "inventory", "business-item")));
  await assertFails(setDoc(doc(db, "households", "household-a", "workspaces", "sandwichies", "inventory", "member-write"), { portions: 1 }));
});

test("editor can write Sandwichies inventory and movement records", async () => {
  const db = user("editor-user", "editor");
  await assertSucceeds(setDoc(doc(db, "households", "household-a", "workspaces", "sandwichies", "inventory", "editor-write"), { portions: 3 }));
  await assertSucceeds(setDoc(doc(db, "households", "household-a", "workspaces", "sandwichies", "movements", "editor-movement"), { quantity: 2, type: "consume" }));
});

test("users outside the household cannot read or write its business inventory", async () => {
  const db = user("outsider-user", "editor");
  const ref = doc(db, "households", "household-a", "workspaces", "sandwichies", "inventory", "business-item");
  await assertFails(getDoc(ref));
  await assertFails(setDoc(doc(db, "households", "household-a", "workspaces", "sandwichies", "inventory", "outsider-write"), { portions: 99 }));
});

test("unverified email cannot read or write Sandwichies inventory", async () => {
  const db = user("member-user", "member", false);
  const ref = doc(db, "households", "household-a", "workspaces", "sandwichies", "inventory", "business-item");
  await assertFails(getDoc(ref));
  await assertFails(setDoc(doc(db, "households", "household-a", "workspaces", "sandwichies", "inventory", "unverified-write"), { portions: 99 }));
});

test("workspace rules do not grant access to arbitrary workspace IDs", async () => {
  const db = user("editor-user", "editor");
  const ref = doc(db, "households", "household-a", "workspaces", "other", "inventory", "item");
  await assertFails(getDoc(ref));
  await assertFails(setDoc(ref, { portions: 1 }));
});
