// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  enableNetwork,
  disableNetwork,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDi9ay_3fljNM1qnL5nLvl4tjLnwuq7FZQ",
  authDomain: "cupboard-app-ce528.firebaseapp.com",
  projectId: "cupboard-app-ce528",
  storageBucket: "cupboard-app-ce528.firebasestorage.app",
  messagingSenderId: "465408129943",
  appId: "1:465408129943:web:916e4f81c1c3d94aa7e2d2",
  measurementId: "G-JG7W1BDNXS",
};

export const app = initializeApp(firebaseConfig);

let db;

try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch (error) {
  console.warn(
    "No se pudo activar la persistencia local de Firestore. Continuando con caché en memoria.",
    error,
  );
  db = initializeFirestore(app);
}

export const auth = getAuth(app);

export { db };


export async function connectFirestore() {
  await enableNetwork(db);
  if (typeof window !== "undefined") {
    window.localStorage.setItem("cupboard.firestoreNetwork", "online");
    window.dispatchEvent(new CustomEvent("cupboard:firestore-network", { detail: "online" }));
  }
}

export async function disconnectFirestore() {
  await disableNetwork(db);
  if (typeof window !== "undefined") {
    window.localStorage.setItem("cupboard.firestoreNetwork", "offline");
    window.dispatchEvent(new CustomEvent("cupboard:firestore-network", { detail: "offline" }));
  }
}
