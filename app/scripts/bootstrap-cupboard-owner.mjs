import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { stdin as input, stdout as output } from "node:process";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const PROJECT_ID = "cupboard-app-ce528";

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function loadCredentials(credentialsPath) {
  const resolved = path.resolve(credentialsPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`SERVICE_ACCOUNT_NOT_FOUND:${resolved}`);
  }
  return JSON.parse(fs.readFileSync(resolved, "utf8"));
}

async function promptHidden(question) {
  output.write(question);

  return await new Promise((resolve) => {
    let value = "";

    const cleanup = () => {
      process.stdin.removeListener("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      output.write("\n");
    };

    const onData = (chunk) => {
      const text = chunk.toString();

      if (text === "\u0003") {
        cleanup();
        process.exit(130);
      }

      if (text === "\r" || text === "\n") {
        cleanup();
        resolve(value);
        return;
      }

      for (const char of text) {
        if (char === "\u007f") {
          value = value.slice(0, -1);
        } else {
          value += char;
        }
      }
    };

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", onData);
  });
}

async function main() {
  const credentialsPath = arg("--credentials");
  const email = arg("--email");
  const displayName = arg("--name");

  if (!credentialsPath || !email || !displayName) {
    throw new Error(
      'Use --credentials <path> --email <owner-email> --name "<owner-name>".',
    );
  }

  const credentials = loadCredentials(credentialsPath);

  if (!getApps().length) {
    initializeApp({
      credential: cert(credentials),
      projectId: PROJECT_ID,
    });
  }

  const auth = getAuth();
  const db = getFirestore();

  const existingHouseholds = await db.collection("households").limit(1).get();
  const existingUsers = await db.collection("users").limit(1).get();

  if (!existingHouseholds.empty || !existingUsers.empty) {
    throw new Error("BOOTSTRAP_REQUIRES_EMPTY_USERS_AND_HOUSEHOLDS");
  }

  const password = await promptHidden("Password for the new owner: ");
  const passwordConfirmation = await promptHidden("Repeat password: ");

  if (password.length < 6) {
    throw new Error("PASSWORD_TOO_SHORT");
  }

  if (password !== passwordConfirmation) {
    throw new Error("PASSWORDS_DO_NOT_MATCH");
  }

  const user = await auth.createUser({
    email: email.trim(),
    password,
    displayName: displayName.trim(),
    emailVerified: false,
  });

  const householdId = crypto.randomUUID();
  const householdRef = db.collection("households").doc(householdId);
  const memberRef = householdRef.collection("members").doc(user.uid);
  const profileRef = db.collection("users").doc(user.uid);

  try {
    const batch = db.batch();

    batch.set(householdRef, {
      name: `${displayName.trim()}'s Cupboard`,
      ownerUid: user.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    batch.set(memberRef, {
      uid: user.uid,
      role: "admin",
      email: user.email,
      displayName: displayName.trim(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    batch.set(profileRef, {
      displayName: displayName.trim(),
      email: user.email,
      householdId,
      role: "admin",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();
  } catch (error) {
    await auth.deleteUser(user.uid).catch(() => {});
    throw error;
  }

  console.log("");
  console.log("CUPBOARD OWNER BOOTSTRAP COMPLETE");
  console.log("----------------------------------------");
  console.log(`Email: ${user.email}`);
  console.log(`UID: ${user.uid}`);
  console.log(`Household ID: ${householdId}`);
  console.log("");
  console.log("The owner must verify the email before using household data.");
  console.log("The shared product catalog was not modified.");
}

main().catch((error) => {
  console.error("");
  console.error(error);
  process.exitCode = 1;
});
