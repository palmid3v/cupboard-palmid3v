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
  writeBatch,
} from "firebase/firestore";

import { db } from "../firebase";
import { getActiveHouseholdId } from "./households";
import { getActiveWorkspaceId } from "./workspaces";

function requireHouseholdId() {
  const householdId = getActiveHouseholdId();

  if (!householdId) {
    throw new Error("HOUSEHOLD_REQUIRED");
  }

  return householdId;
}

function inventoryCollection() {
  const householdId = requireHouseholdId();
  return getActiveWorkspaceId() === "sandwichies"
    ? collection(db, "households", householdId, "workspaces", "sandwichies", "inventory")
    : collection(db, "households", householdId, "inventory");
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


function movementRef() {
  const householdId = requireHouseholdId();
  const movements = getActiveWorkspaceId() === "sandwichies"
    ? collection(db, "households", householdId, "workspaces", "sandwichies", "movements")
    : collection(db, "households", householdId, "movements");
  return doc(movements);
}

function movementData({ productId, type, quantity, reason = "", userId = null }) {
  return {
    productId,
    type,
    quantity: Number(quantity) || 0,
    reason,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

/**
 * Saves household inventory and its initial movement in one Firestore batch.
 */
export async function saveInventoryProductWithMovement(
  barcode,
  data = {},
  movement = null,
) {
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

  const batch = writeBatch(db);

  if (snapshot.exists()) {
    batch.update(ref, {
      ...inventoryData,
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.set(ref, {
      ...inventoryData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  if (movement && Number(movement.quantity) > 0) {
    batch.set(
      movementRef(),
      movementData({
        productId: normalizedBarcode,
        ...movement,
      }),
    );
  }

  await batch.commit();
}

/**
 * Updates household stock and its movement record atomically.
 */
export async function updateInventoryPortionsWithMovement(
  barcode,
  newPortions,
  movement = null,
) {
  const ref = inventoryRef(barcode);
  const batch = writeBatch(db);

  batch.update(ref, {
    portions: Math.max(0, Number(newPortions) || 0),
    updatedAt: serverTimestamp(),
  });

  if (movement && Number(movement.quantity) > 0) {
    batch.set(
      movementRef(),
      movementData({
        productId: String(barcode).trim(),
        ...movement,
      }),
    );
  }

  await batch.commit();
}
