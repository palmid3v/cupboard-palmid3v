import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";

import { app } from "../firebase";

export const auth = getAuth(app);

export async function signIn(email, password) {
  await setPersistence(auth, browserLocalPersistence);
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function signUp(email, password, displayName) {
  await setPersistence(auth, browserLocalPersistence);

  const credential = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  );

  if (displayName?.trim()) {
    await updateProfile(credential.user, {
      displayName: displayName.trim(),
    });
  }

  await sendEmailVerification(credential.user);

  return credential;
}

export function watchAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function resetPassword(email) {
  return sendPasswordResetEmail(auth, email.trim());
}

export async function logout() {
  return signOut(auth);
}


export async function resendVerificationEmail(user = auth.currentUser) {
  if (!user) throw new Error("AUTH_REQUIRED");
  return sendEmailVerification(user);
}

export async function refreshCurrentUser() {
  if (!auth.currentUser) return null;
  await reload(auth.currentUser);
  await auth.currentUser.getIdToken(true);
  return auth.currentUser;
}
