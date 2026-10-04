// src/services/migration.js

import {
  collection,
  doc,
  getDocs,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase";
import { auth } from "./auth";
import { getActiveHouseholdId } from "./households";
import { getCatalogProduct } from "./catalog";

const BATCH_LIMIT = 400;

function requireHouseholdId() {
  const householdId = getActiveHouseholdId();

  if (!householdId) {
    throw new Error("HOUSEHOLD_REQUIRED");
  }

  return householdId;
}

function legacyProductsCollection() {
  return collection(db, "households", requireHouseholdId(), "products");
}

function inventoryRef(barcode) {
  return doc(db, "households", requireHouseholdId(), "inventory", String(barcode).trim());
}

function normalizeLegacyProduct(id, data = {}) {
  return {
    id,
    name: data.name?.trim() ?? "",
    description: data.description?.trim() ?? "",
    brand: data.brand?.trim() ?? "",
    weight: Number(data.weight) || 0,
    imageUrl: data.imageUrl?.trim() ?? "",
    category: data.category?.trim() ?? "",
    portions: Math.max(0, Number(data.portions) || 0),
    expiryDate: data.expiryDate || null,
    minStock: Math.max(0, Number(data.minStock) || 5),
    notes: data.notes?.trim() ?? "",
  };
}

async function readLegacyProducts() {
  const snapshot = await getDocs(legacyProductsCollection());

  return snapshot.docs.map((productDoc) =>
    normalizeLegacyProduct(productDoc.id, productDoc.data()),
  );
}

async function readInventorySnapshot(barcodes) {
  const householdId = requireHouseholdId();

  const refs = barcodes.map((barcode) =>
    doc(db, "households", householdId, "inventory", barcode),
  );

  const snapshots = await Promise.all(refs.map((ref) => getDocs(collection(ref))));
  return snapshots;
}

async function buildMigrationPlan(legacyProducts) {
  const householdId = requireHouseholdId();

  const plan = await Promise.all(
    legacyProducts.map(async (product) => {
      const catalog = await getCatalogProduct(product.id);
      const inventorySnapshot = await getDocs(
        collection(db, "households", householdId, "inventory"),
      );
      const inventory = inventorySnapshot.docs.find((item) => item.id === product.id);

      return {
        product,
        catalogExists: Boolean(catalog),
        inventoryExists: Boolean(inventory),
      };
    }),
  );

  return plan;
}

/**
 * Reads legacy household products and reports what the non-destructive
 * migration would create. It never writes or deletes data.
 */
export async function previewLegacyInventoryMigration() {
  const legacyProducts = await readLegacyProducts();
  const plan = await buildMigrationPlan(legacyProducts);

  return {
    total: plan.length,
    catalogMissing: plan.filter((item) => !item.catalogExists).length,
    inventoryMissing: plan.filter((item) => !item.inventoryExists).length,
    ready: plan.length > 0,
    items: plan,
  };
}

function createCatalogData(product) {
  return {
    name: product.name,
    description: product.description,
    brand: product.brand,
    weight: product.weight,
    imageUrl: product.imageUrl,
    category: product.category,
    createdBy: auth.currentUser?.uid ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

function createInventoryData(product) {
  return {
    portions: product.portions,
    expiryDate: product.expiryDate,
    minStock: product.minStock,
    notes: product.notes,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

async function commitOperations(operations) {
  for (let index = 0; index < operations.length; index += BATCH_LIMIT) {
    const chunk = operations.slice(index, index + BATCH_LIMIT);
    const batch = writeBatch(db);

    chunk.forEach((operation) => {
      if (operation.type === "catalog") {
        batch.set(operation.ref, operation.data);
      }

      if (operation.type === "inventory") {
        batch.set(operation.ref, operation.data);
      }
    });

    await batch.commit();
  }
}

/**
 * Copies only missing catalog/inventory records.
 *
 * Existing target records are left untouched. Legacy products are never
 * deleted or modified. Running this function again is safe.
 */
export async function migrateLegacyProductsToInventory() {
  const preview = await previewLegacyInventoryMigration();
  const operations = [];

  for (const item of preview.items) {
    if (!item.catalogExists) {
      operations.push({
        type: "catalog",
        ref: doc(db, "productCatalog", item.product.id),
        data: createCatalogData(item.product),
      });
    }

    if (!item.inventoryExists) {
      operations.push({
        type: "inventory",
        ref: inventoryRef(item.product.id),
        data: createInventoryData(item.product),
      });
    }
  }

  await commitOperations(operations);

  return {
    ...preview,
    operations: operations.length,
    migrated: {
      catalog: operations.filter((item) => item.type === "catalog").length,
      inventory: operations.filter((item) => item.type === "inventory").length,
    },
  };
}

/**
 * Verifies that every legacy product has corresponding catalog and inventory
 * records. It does not modify either source or target data.
 */
export async function verifyLegacyInventoryMigration() {
  const preview = await previewLegacyInventoryMigration();

  return {
    total: preview.total,
    catalogComplete: preview.catalogMissing === 0,
    inventoryComplete: preview.inventoryMissing === 0,
    complete: preview.catalogMissing === 0 && preview.inventoryMissing === 0,
    catalogMissing: preview.catalogMissing,
    inventoryMissing: preview.inventoryMissing,
  };
}
