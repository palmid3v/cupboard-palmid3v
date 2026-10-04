import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
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

  // An invited user is not a household member yet, so it cannot read
  // households/{householdId} under the current Firestore rules.
  // The invite itself is the authorization to perform the onboarding write.
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

  const household = await getHousehold(invite.householdId);

  if (!household) {
    throw new Error("HOUSEHOLD_NOT_FOUND");
  }

  setActiveHouseholdId(invite.householdId);

  return {
    ...household,
    role,
    isOwner: household.ownerUid === user.uid,
  };
}
