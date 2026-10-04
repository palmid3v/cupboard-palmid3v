// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
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

const app = initializeApp(firebaseConfig);

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

export { db };
