import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase";
import { getActiveHouseholdId } from "./households";

function scopedCollection(name) {
  const householdId = getActiveHouseholdId();
  if (!householdId) throw new Error("HOUSEHOLD_REQUIRED");
  return collection(db, "households", householdId, name);
}

export function subscribeFeature(name, onData, onError, sortField = "updatedAt") {
  return onSnapshot(
    query(scopedCollection(name), orderBy(sortField, "desc")),
    { includeMetadataChanges: true },
    (snapshot) => onData(
      snapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
      snapshot.metadata,
    ),
    onError,
  );
}

export async function createFeatureItem(name, data) {
  return addDoc(scopedCollection(name), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateFeatureItem(name, id, data) {
  return updateDoc(doc(scopedCollection(name), id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteFeatureItem(name, id) {
  return deleteDoc(doc(scopedCollection(name), id));
}

export async function getFeatureItems(name) {
  const snapshot = await getDocs(scopedCollection(name));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function addMovement({
  productId,
  type,
  quantity,
  reason = "",
  userId = null,
}) {
  return createFeatureItem("movements", {
    productId,
    type,
    quantity: Number(quantity) || 0,
    reason,
    userId,
  });
}

export async function lookupProductByBarcode(barcode) {
  const response = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`,
    {
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error("CATALOG_UNAVAILABLE");
  }

  const payload = await response.json();

  if (payload.status !== 1 || !payload.product) {
    return null;
  }

  const product = payload.product;

  return {
    name: product.product_name || product.product_name_es || "",
    description: product.generic_name || product.generic_name_es || "",
    imageUrl:
      product.image_front_url ||
      product.image_front_small_url ||
      product.image_url ||
      "",
    brand: product.brands || "",
    category: product.categories || "",
    quantity: product.quantity || "",
  };
}
