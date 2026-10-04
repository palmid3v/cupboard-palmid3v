import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import { db } from "../firebase";
import { auth } from "./auth";

export function setActiveHouseholdId(householdId) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("cupboard.householdId", householdId);
  }
}

export function getActiveHouseholdId() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("cupboard.householdId");
}

export async function getUserProfile(uid) {
  const snapshot = await getDoc(doc(db, "users", uid));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

async function migrateLegacyProducts(householdId) {
  const legacy = await getDocs(collection(db, "products"));

  if (legacy.empty) return false;

  for (let index = 0; index < legacy.docs.length; index += 450) {
    const batch = writeBatch(db);

    legacy.docs.slice(index, index + 450).forEach((product) => {
      batch.set(
        doc(db, "households", householdId, "products", product.id),
        {
          ...product.data(),
          migratedFromLegacy: true,
          migratedAt: serverTimestamp(),
        },
        { merge: true },
      );
    });

    await batch.commit();
  }

  for (let index = 0; index < legacy.docs.length; index += 450) {
    const batch = writeBatch(db);

    legacy.docs.slice(index, index + 450).forEach((product) => {
      batch.delete(doc(db, "products", product.id));
    });

    await batch.commit();
  }

  return true;
}

export async function createHouseholdForUser(user) {
  const householdId = crypto.randomUUID();
  const householdRef = doc(db, "households", householdId);
  const userRef = doc(db, "users", user.uid);

  const household = {
    name: "Mi alacena",
    ownerUid: user.uid,
    members: {
      [user.uid]: "admin",
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(householdRef, household);
  await setDoc(doc(db, "households", householdId, "members", user.uid), {
    uid: user.uid,
    role: "admin",
    email: user.email || "",
    displayName: user.displayName || user.email?.split("@")[0] || "Admin",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await setDoc(userRef, {
    displayName: user.displayName || user.email?.split("@")[0] || "Admin",
    email: user.email || "",
    householdId,
    role: "admin",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  setActiveHouseholdId(householdId);

  try {
    await migrateLegacyProducts(householdId);
    await updateDoc(householdRef, {
      legacyInventoryMigratedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn("Legacy inventory migration skipped:", error);
  }

  return {
    id: householdId,
    ...household,
    role: "admin",
  };
}

export async function getHousehold(householdId) {
  const snapshot = await getDoc(doc(db, "households", householdId));
  return snapshot.exists()
    ? { id: snapshot.id, ...snapshot.data() }
    : null;
}

export async function ensureHouseholdForUser(user) {
  const profile = await getUserProfile(user.uid);

  if (!profile?.householdId) {
    throw new Error("HOUSEHOLD_INVITE_REQUIRED");
  }

  const household = await getHousehold(profile.householdId);

  if (!household) {
    throw new Error("HOUSEHOLD_NOT_FOUND");
  }

  setActiveHouseholdId(household.id);

  if (!household.legacyInventoryMigratedAt && household.ownerUid === user.uid) {
    try {
      const migrated = await migrateLegacyProducts(household.id);

      if (migrated) {
        await updateDoc(doc(db, "households", household.id), {
          legacyInventoryMigratedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        household.legacyInventoryMigratedAt = true;
      }
    } catch (error) {
      console.warn("Legacy inventory migration skipped:", error);
    }
  }

  return {
    ...household,
    role: profile.role || household.members?.[user.uid] || "member",
    isOwner: household.ownerUid === user.uid,
  };
}

export async function createInvite(householdId) {
  const code = crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();

  await setDoc(doc(db, "householdInvites", code), {
    householdId,
    role: "member",
    createdAt: serverTimestamp(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    createdBy: auth.currentUser?.uid || null,
  });

  return code;
}

export async function joinHouseholdByCode(user, code) {
  const normalized = code.trim().toUpperCase();
  const inviteRef = doc(db, "householdInvites", normalized);
  const inviteSnapshot = await getDoc(inviteRef);

  if (!inviteSnapshot.exists()) {
    throw new Error("INVITE_NOT_FOUND");
  }

  const invite = inviteSnapshot.data();

  if (invite.expiresAt?.toDate?.() < new Date()) {
    throw new Error("INVITE_EXPIRED");
  }

  const householdRef = doc(db, "households", invite.householdId);
  const householdSnapshot = await getDoc(householdRef);

  if (!householdSnapshot.exists()) {
    throw new Error("HOUSEHOLD_NOT_FOUND");
  }

  const role = "member";

  const batch = writeBatch(db);
  const memberRef = doc(db, "households", invite.householdId, "members", user.uid);
  const userRef = doc(db, "users", user.uid);

  batch.set(memberRef, {
    uid: user.uid,
    role,
    email: user.email || "",
    displayName: user.displayName || user.email?.split("@")[0] || "Miembro",
    inviteCode: normalized,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.set(
    userRef,
    {
      displayName: user.displayName || user.email?.split("@")[0] || "Miembro",
      email: user.email || "",
      householdId: invite.householdId,
      role,
      inviteCode: normalized,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  await batch.commit();

  setActiveHouseholdId(invite.householdId);

  return {
    id: householdSnapshot.id,
    ...householdSnapshot.data(),
    role,
    isOwner: householdSnapshot.data().ownerUid === user.uid,
  };
}
