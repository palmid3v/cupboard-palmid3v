// src/services/inventory.js

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
import { getActiveHouseholdId } from "./households";

function requireHouseholdId() {
  const householdId = getActiveHouseholdId();

  if (!householdId) {
    throw new Error("HOUSEHOLD_REQUIRED");
  }

  return householdId;
}

function inventoryCollection() {
  return collection(db, "households", requireHouseholdId(), "inventory");
}

function inventoryRef(barcode) {
  return doc(inventoryCollection(), String(barcode).trim());
}

function normalizeInventory(id, data = {}) {
  return {
    id,
    portions: Number(data.portions) || 0,
    expiryDate: data.expiryDate ?? null,
    minStock: Math.max(0, Number(data.minStock) || 5),
    notes: data.notes ?? "",
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

/**
 * Final household inventory boundary.
 *
 * This collection stores household-specific stock state only.
 * Product identity belongs to productCatalog/{barcode}.
 */
export async function getInventoryProduct(barcode) {
  const normalizedBarcode = String(barcode || "").trim();

  if (!normalizedBarcode) return null;

  const snapshot = await getDoc(inventoryRef(normalizedBarcode));

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeInventory(snapshot.id, snapshot.data());
}

export async function getAllInventory() {
  const snapshot = await getDocs(inventoryCollection());

  return snapshot.docs.map((inventoryDoc) =>
    normalizeInventory(inventoryDoc.id, inventoryDoc.data()),
  );
}

export function subscribeToInventory(onData, onError) {
  return onSnapshot(
    inventoryCollection(),
    { includeMetadataChanges: true },
    (snapshot) => {
      const data = snapshot.docs.map((inventoryDoc) =>
        normalizeInventory(inventoryDoc.id, inventoryDoc.data()),
      );

      onData(data, {
        fromCache: snapshot.metadata.fromCache,
        hasPendingWrites: snapshot.metadata.hasPendingWrites,
      });
    },
    onError,
  );
}

export async function saveInventoryProduct(barcode, data = {}) {
  const normalizedBarcode = String(barcode || "").trim();

  if (!normalizedBarcode) {
    throw new Error("BARCODE_REQUIRED");
  }

  const ref = inventoryRef(normalizedBarcode);
  const snapshot = await getDoc(ref);

  const inventoryData = {
    portions: Math.max(0, Number(data.portions) || 0),
    expiryDate: data.expiryDate || null,
    minStock: Math.max(0, Number(data.minStock) || 5),
    notes: data.notes?.trim() ?? "",
  };

  if (snapshot.exists()) {
    await updateDoc(ref, {
      ...inventoryData,
      updatedAt: serverTimestamp(),
    });
    return;
  }

  await setDoc(ref, {
    ...inventoryData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateInventoryPortions(barcode, newPortions) {
  const ref = inventoryRef(barcode);

  await updateDoc(ref, {
    portions: Math.max(0, Number(newPortions) || 0),
    updatedAt: serverTimestamp(),
  });
}
