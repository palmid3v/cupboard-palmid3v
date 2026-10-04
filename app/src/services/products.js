// src/services/products.js

import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase";

// 🧩 Normalize product data
function normalizeProduct(id, data = {}) {
  return {
    id,

    name: data.name ?? "",
    description: data.description ?? "",
    weight: Number(data.weight) || 0,
    portions: Number(data.portions) || 0,
    imageUrl: data.imageUrl ?? "",

    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

// 🔍 Get product
export async function getProduct(barcode) {
  const ref = doc(db, "products", barcode);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return null;
  }

  return normalizeProduct(snap.id, snap.data());
}

// 💾 Save product
export async function saveProduct(barcode, data) {
  const ref = doc(db, "products", barcode);
  const snap = await getDoc(ref);

  const productData = {
    name: data.name?.trim() ?? "",
    description: data.description?.trim() ?? "",
    weight: Number(data.weight) || 0,
    portions: Number(data.portions) || 0,
    imageUrl: data.imageUrl?.trim() ?? "",
  };

  if (snap.exists()) {
    await updateDoc(ref, {
      ...productData,
      updatedAt: serverTimestamp(),
    });

    return;
  }

  await setDoc(ref, {
    ...productData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// 📦 Get all products
export async function getAllProducts() {
  const querySnapshot = await getDocs(collection(db, "products"));

  return querySnapshot.docs.map((productDoc) =>
    normalizeProduct(productDoc.id, productDoc.data()),
  );
}

// 🔄 Subscribe to inventory changes and connection metadata
export function subscribeToProducts(onData, onError) {
  return onSnapshot(
    collection(db, "products"),
    { includeMetadataChanges: true },
    (snapshot) => {
      const data = snapshot.docs.map((productDoc) =>
        normalizeProduct(productDoc.id, productDoc.data()),
      );

      onData(data, {
        fromCache: snapshot.metadata.fromCache,
        hasPendingWrites: snapshot.metadata.hasPendingWrites,
      });
    },
    onError,
  );
}

// ➕➖ Update portions
export async function updatePortions(barcode, newPortions) {
  const ref = doc(db, "products", barcode);

  await updateDoc(ref, {
    portions: Math.max(0, Number(newPortions) || 0),
    updatedAt: serverTimestamp(),
  });
}
