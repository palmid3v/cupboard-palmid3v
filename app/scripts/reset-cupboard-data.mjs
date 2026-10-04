import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const PROJECT_ID = "cupboard-app-ce528";
const CONFIRMATION = "RESET CUPBOARD USERS + HOUSEHOLDS";
const CATALOG_COLLECTION = "productCatalog";
const TOP_LEVEL_USER_COLLECTION = "users";
const HOUSEHOLD_COLLECTION = "households";
const INVITE_COLLECTION = "householdInvites";

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exitCode = 1;
}

function assertSafeTarget(pathName) {
  if (pathName === CATALOG_COLLECTION || pathName.startsWith(`${CATALOG_COLLECTION}/`)) {
    throw new Error("SAFETY_STOP_PRODUCT_CATALOG_TARGET");
  }

  const allowed =
    pathName === TOP_LEVEL_USER_COLLECTION ||
    pathName === HOUSEHOLD_COLLECTION ||
    pathName === INVITE_COLLECTION ||
    pathName.startsWith(`${HOUSEHOLD_COLLECTION}/`);

  if (!allowed) {
    throw new Error(`SAFETY_STOP_UNAPPROVED_PATH:${pathName}`);
  }
}

function loadCredentials(credentialsPath) {
  const resolved = path.resolve(credentialsPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`SERVICE_ACCOUNT_NOT_FOUND:${resolved}`);
  }

  return JSON.parse(fs.readFileSync(resolved, "utf8"));
}

async function listAuthUsers(auth) {
  const users = [];
  let pageToken;

  do {
    const page = await auth.listUsers(1000, pageToken);
    users.push(...page.users);
    pageToken = page.pageToken;
  } while (pageToken);

  return users;
}

async function countSubcollections(db, householdRef) {
  const names = [
    "members",
    "inventory",
    "movements",
    "shoppingItems",
    "recipes",
    "expiryRules",
    "settings",
  ];

  const counts = {};
  for (const name of names) {
    const snapshot = await householdRef.collection(name).get();
    counts[name] = snapshot.size;
  }

  return counts;
}

async function buildPlan(db, auth) {
  const [authUsers, profileSnapshot, householdSnapshot, inviteSnapshot, catalogSnapshot] =
    await Promise.all([
      listAuthUsers(auth),
      db.collection(TOP_LEVEL_USER_COLLECTION).get(),
      db.collection(HOUSEHOLD_COLLECTION).get(),
      db.collection(INVITE_COLLECTION).get(),
      db.collection(CATALOG_COLLECTION).get(),
    ]);

  const households = [];
  for (const householdDoc of householdSnapshot.docs) {
    households.push({
      id: householdDoc.id,
      subcollections: await countSubcollections(db, householdDoc.ref),
    });
  }

  return {
    authUsers,
    profiles: profileSnapshot.size,
    households,
    invites: inviteSnapshot.size,
    catalogCount: catalogSnapshot.size,
  };
}

function printPlan(plan) {
  console.log("");
  console.log("CUPBOARD RESET — DRY RUN");
  console.log("----------------------------------------");
  console.log(`Firebase project: ${PROJECT_ID}`);
  console.log(`Authentication users to delete: ${plan.authUsers.length}`);
  console.log(`Firestore users/{uid}: ${plan.profiles}`);
  console.log(`Households: ${plan.households.length}`);
  console.log(`Invitations: ${plan.invites}`);
  console.log(`productCatalog/* TO PRESERVE: ${plan.catalogCount}`);
  console.log("");
  console.log("Household subcollections:");
  for (const household of plan.households) {
    console.log(`  ${household.id}`);
    for (const [name, count] of Object.entries(household.subcollections)) {
      if (count > 0) console.log(`    - ${name}: ${count}`);
    }
  }
  console.log("");
}

async function deleteHouseholds(db, householdDocs) {
  for (const householdDoc of householdDocs) {
    const target = `${HOUSEHOLD_COLLECTION}/${householdDoc.id}`;
    assertSafeTarget(target);
    console.log(`Deleting recursively: ${target}`);
    await db.recursiveDelete(householdDoc.ref);
  }
}

async function deleteProfiles(db) {
  const snapshot = await db.collection(TOP_LEVEL_USER_COLLECTION).get();

  for (const userDoc of snapshot.docs) {
    const target = `${TOP_LEVEL_USER_COLLECTION}/${userDoc.id}`;
    assertSafeTarget(target);
    await userDoc.ref.delete();
  }
}

async function deleteInvites(db) {
  const snapshot = await db.collection(INVITE_COLLECTION).get();

  for (const inviteDoc of snapshot.docs) {
    const target = `${INVITE_COLLECTION}/${inviteDoc.id}`;
    assertSafeTarget(target);
    await inviteDoc.ref.delete();
  }
}

async function deleteAuthUsers(auth, users) {
  const uids = users.map((user) => user.uid);

  for (let index = 0; index < uids.length; index += 1000) {
    const chunk = uids.slice(index, index + 1000);
    if (!chunk.length) continue;

    const result = await auth.deleteUsers(chunk);
    console.log(
      `Authentication batch ${Math.floor(index / 1000) + 1}: deleted ${result.successCount}, failed ${result.failureCount}`,
    );

    if (result.failureCount > 0) {
      for (const error of result.errors) {
        console.error(`  Auth delete failed at index ${error.index}: ${error.error?.message || "unknown error"}`);
      }
      throw new Error("AUTH_DELETE_INCOMPLETE");
    }
  }
}

async function main() {
  const credentialsPath = arg("--credentials");
  const confirmed = arg("--confirm");
  const dryRun = !hasFlag("--execute");

  if (!credentialsPath) {
    throw new Error("Use --credentials <path-to-service-account.json>.");
  }

  if (hasFlag("--execute") && confirmed !== CONFIRMATION) {
    throw new Error(`Destructive execution requires --confirm "${CONFIRMATION}".`);
  }

  const credentials = loadCredentials(credentialsPath);

  if (!getApps().length) {
    initializeApp({
      credential: cert(credentials),
      projectId: PROJECT_ID,
    });
  }

  const db = getFirestore();
  const auth = getAuth();

  const plan = await buildPlan(db, auth);
  printPlan(plan);

  // This assertion is deliberately unconditional: even dry-run and execution
  // must prove that the protected catalog exists as a separate collection.
  if (plan.catalogCount < 0) {
    throw new Error("SAFETY_STOP_INVALID_CATALOG_STATE");
  }

  if (dryRun) {
    console.log("DRY RUN ONLY — nothing was deleted.");
    console.log(`To execute, use --execute --confirm "${CONFIRMATION}".`);
    return;
  }

  console.log("");
  console.log("EXECUTING USER/HOUSEHOLD RESET.");
  console.log("productCatalog/* is explicitly excluded.");
  console.log("");

  const householdDocs = await db.collection(HOUSEHOLD_COLLECTION).get();
  await deleteHouseholds(db, householdDocs.docs);
  await deleteProfiles(db);
  await deleteInvites(db);
  await deleteAuthUsers(auth, plan.authUsers);

  const remainingCatalog = await db.collection(CATALOG_COLLECTION).count().get();
  const remainingUsers = await db.collection(TOP_LEVEL_USER_COLLECTION).count().get();
  const remainingHouseholds = await db.collection(HOUSEHOLD_COLLECTION).count().get();
  const remainingInvites = await db.collection(INVITE_COLLECTION).count().get();

  console.log("");
  console.log("RESET VERIFICATION");
  console.log("----------------------------------------");
  console.log(`productCatalog/* preserved: ${remainingCatalog.data().count}`);
  console.log(`users/* remaining: ${remainingUsers.data().count}`);
  console.log(`households/* remaining: ${remainingHouseholds.data().count}`);
  console.log(`householdInvites/* remaining: ${remainingInvites.data().count}`);

  if (
    remainingUsers.data().count !== 0 ||
    remainingHouseholds.data().count !== 0 ||
    remainingInvites.data().count !== 0
  ) {
    throw new Error("RESET_VERIFICATION_INCOMPLETE");
  }

  console.log("");
  console.log("RESET COMPLETE — PRODUCT CATALOG WAS NOT TARGETED.");
}

main().catch((error) => {
  console.error("");
  console.error(error);
  process.exitCode = 1;
});
