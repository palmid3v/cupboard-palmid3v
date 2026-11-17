// src/services/inventory.js

import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  runTransaction,
  serverTimestamp,
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

function normalizeWorkspaceId(workspaceId = getActiveWorkspaceId()) {
  return workspaceId === "sandwichies" ? "sandwichies" : "home";
}

function inventoryCollection(workspaceId = getActiveWorkspaceId()) {
  const householdId = requireHouseholdId();
  return normalizeWorkspaceId(workspaceId) === "sandwichies"
    ? collection(db, "households", householdId, "workspaces", "sandwichies", "inventory")
    : collection(db, "households", householdId, "inventory");
}

function inventoryRef(barcode, workspaceId = getActiveWorkspaceId()) {
  return doc(inventoryCollection(workspaceId), String(barcode).trim());
}

function normalizeInventory(id, data = {}) {
  const portions = Math.max(0, Number(data.portions) || 0);
  const reservedPortions = Math.max(0, Number(data.reservedPortions) || 0);
  return {
    id,
    portions,
    reservedPortions,
    availablePortions: Math.max(0, portions - reservedPortions),
    unit: typeof data.unit === "string" && data.unit.trim() ? data.unit.trim() : "porciones",
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
 * Product identity belongs to productCatalog/{productId}; barcode is a separate attribute.
 */
export async function getInventoryProduct(barcode, workspaceId = getActiveWorkspaceId()) {
  const normalizedBarcode = String(barcode || "").trim();

  if (!normalizedBarcode) return null;

  const snapshot = await getDoc(inventoryRef(normalizedBarcode, workspaceId));

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeInventory(snapshot.id, snapshot.data());
}

export async function getAllInventory(workspaceId = getActiveWorkspaceId()) {
  const snapshot = await getDocs(inventoryCollection(workspaceId));

  return snapshot.docs.map((inventoryDoc) =>
    normalizeInventory(inventoryDoc.id, inventoryDoc.data()),
  );
}

export function subscribeToInventory(onData, onError, workspaceId = getActiveWorkspaceId()) {
  return onSnapshot(
    inventoryCollection(workspaceId),
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

export async function saveInventoryProduct(barcode, data = {}, workspaceId = getActiveWorkspaceId()) {
  const normalizedBarcode = String(barcode || "").trim();

  if (!normalizedBarcode) {
    throw new Error("BARCODE_REQUIRED");
  }

  const ref = inventoryRef(normalizedBarcode, workspaceId);
  const inventoryData = {
    portions: Math.max(0, Number(data.portions) || 0),
    unit: String(data.unit || "porciones").trim() || "porciones",
    expiryDate: data.expiryDate || null,
    minStock: Math.max(0, Number(data.minStock) || 5),
    notes: data.notes?.trim() ?? "",
  };

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (snapshot.exists()) {
      const reserved = Math.max(0, Number(snapshot.data().reservedPortions) || 0);
      if (inventoryData.portions < reserved) throw new Error("INVENTORY_PORTIONS_RESERVED");
      transaction.update(ref, {
        ...inventoryData,
        unit: String(data.unit || snapshot.data().unit || "porciones").trim() || "porciones",
        updatedAt: serverTimestamp(),
      });
      return;
    }
    transaction.set(ref, { ...inventoryData, reservedPortions: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  });
}

export async function updateInventoryPortions(barcode, newPortions, workspaceId = getActiveWorkspaceId()) {
  const ref = inventoryRef(barcode, workspaceId);
  const requested = Math.max(0, Number(newPortions) || 0);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error("INVENTORY_PRODUCT_MISSING");
    const reserved = Math.max(0, Number(snapshot.data().reservedPortions) || 0);
    if (requested < reserved) throw new Error("INVENTORY_PORTIONS_RESERVED");
    transaction.update(ref, { portions: requested, updatedAt: serverTimestamp() });
  });
}


function movementRef(workspaceId = getActiveWorkspaceId()) {
  const householdId = requireHouseholdId();
  const movements = normalizeWorkspaceId(workspaceId) === "sandwichies"
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
  workspaceId = getActiveWorkspaceId(),
) {
  const normalizedBarcode = String(barcode || "").trim();

  if (!normalizedBarcode) {
    throw new Error("BARCODE_REQUIRED");
  }

  const ref = inventoryRef(normalizedBarcode, workspaceId);
  const inventoryData = {
    portions: Math.max(0, Number(data.portions) || 0),
    unit: String(data.unit || "porciones").trim() || "porciones",
    expiryDate: data.expiryDate || null,
    minStock: Math.max(0, Number(data.minStock) || 5),
    notes: data.notes?.trim() ?? "",
  };

  const movementDocument = movement && Number(movement.quantity) > 0 ? movementRef(workspaceId) : null;
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (snapshot.exists()) {
      const reserved = Math.max(0, Number(snapshot.data().reservedPortions) || 0);
      inventoryData.unit = String(data.unit || snapshot.data().unit || "porciones").trim() || "porciones";
      if (inventoryData.portions < reserved) throw new Error("INVENTORY_PORTIONS_RESERVED");
      transaction.update(ref, { ...inventoryData, updatedAt: serverTimestamp() });
    } else {
      transaction.set(ref, { ...inventoryData, reservedPortions: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    }
    if (movementDocument) transaction.set(movementDocument, movementData({ productId: normalizedBarcode, ...movement }));
  });
}

/**
 * Updates household stock and its movement record atomically.
 */
export async function updateInventoryPortionsWithMovement(
  barcode,
  newPortions,
  movement = null,
  workspaceId = getActiveWorkspaceId(),
) {
  const ref = inventoryRef(barcode, workspaceId);
  const movementDocument = movement && Number(movement.quantity) > 0 ? movementRef(workspaceId) : null;
  const requested = Math.max(0, Number(newPortions) || 0);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error("INVENTORY_PRODUCT_MISSING");
    const current = Math.max(0, Number(snapshot.data().portions) || 0);
    const reserved = Math.max(0, Number(snapshot.data().reservedPortions) || 0);
    const movementQuantity = Number(movement?.quantity);
    const next = movementQuantity > 0 && movement?.type === "consume"
      ? current - movementQuantity
      : movementQuantity > 0 && movement?.type === "add"
        ? current + movementQuantity
        : requested;
    if (next < reserved) throw new Error("INVENTORY_PORTIONS_RESERVED");
    if (next < 0) throw new Error("INVENTORY_STOCK_INSUFFICIENT");
    transaction.update(ref, { portions: next, updatedAt: serverTimestamp() });
    if (movementDocument) transaction.set(movementDocument, movementData({ productId: String(barcode).trim(), ...movement }));
  });
}
