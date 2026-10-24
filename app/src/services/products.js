// src/services/products.js

import { createCatalogProductIfMissing, getCatalogProduct, updateCatalogProduct } from "./catalog";

// Session-scoped catalog cache reduces duplicate catalog reads during
// realtime inventory hydration while preserving the existing service boundary.
const catalogCache = new Map();
import {
  getAllInventory,
  getInventoryProduct,
  saveInventoryProductWithMovement,
  subscribeToInventory,
  updateInventoryPortionsWithMovement,
} from "./inventory";

function normalizeProduct(id, catalog = {}, inventory = {}) {
  return {
    id,
    name: catalog.name ?? "",
    description: catalog.description ?? "",
    weight: Number(catalog.weight) || 0,
    portions: Number(inventory.portions) || 0,
    unit: inventory.unit || "porciones",
    imageUrl: catalog.imageUrl ?? "",
    category: catalog.category ?? "",
    expiryDate: inventory.expiryDate ?? null,
    minStock: Math.max(0, Number(inventory.minStock) || 5),
    notes: inventory.notes ?? "",
    createdAt: inventory.createdAt ?? null,
    updatedAt: inventory.updatedAt ?? null,
  };
}

async function getCachedCatalogProduct(barcode) {
  const normalizedBarcode = String(barcode || "").trim();

  if (!normalizedBarcode) return null;

  if (catalogCache.has(normalizedBarcode)) {
    return catalogCache.get(normalizedBarcode);
  }

  const catalog = await getCatalogProduct(normalizedBarcode);
  catalogCache.set(normalizedBarcode, catalog);

  return catalog;
}

async function hydrateInventory(inventory, workspaceId) {
  const products = await Promise.all(
    inventory.map(async (item) => {
      const catalog = await getCachedCatalogProduct(item.id);

      if (!catalog) {
        return { ...normalizeProduct(item.id, {}, item), workspaceId };
      }

      return { ...normalizeProduct(item.id, catalog, item), workspaceId };
    }),
  );

  return products;
}

/**
 * Runtime product facade.
 *
 * The UI can keep its existing product-oriented API while persistence is now
 * split between the shared catalog and household inventory collections.
 */
export async function getProduct(barcode, workspaceId) {
  const normalizedBarcode = String(barcode || "").trim();

  if (!normalizedBarcode) return null;

  const inventory = await getInventoryProduct(normalizedBarcode, workspaceId);

  if (!inventory) {
    return null;
  }

  const catalog = await getCachedCatalogProduct(normalizedBarcode);

  return { ...normalizeProduct(normalizedBarcode, catalog || {}, inventory), workspaceId };
}

export async function findProductByBarcode(barcode, workspaceId) {
  const householdProduct = await getProduct(barcode, workspaceId);

  if (householdProduct) {
    return {
      source: "inventory",
      product: householdProduct,
    };
  }

  const catalogProduct = await getCatalogProduct(barcode);

  if (catalogProduct) {
    return {
      source: "catalog",
      product: catalogProduct,
    };
  }

  return {
    source: "new",
    product: null,
  };
}

export async function saveProduct(barcode, data = {}, movement = null, workspaceId) {
  const normalizedBarcode = String(barcode || "").trim();

  if (!normalizedBarcode) {
    throw new Error("BARCODE_REQUIRED");
  }

  const existingCatalog = await getCatalogProduct(normalizedBarcode);\n  if (existingCatalog) {\n    await updateCatalogProduct(normalizedBarcode, data);\n  } else {\n    await createCatalogProductIfMissing(normalizedBarcode, data);\n  }\n  catalogCache.delete(normalizedBarcode);

  await saveInventoryProductWithMovement(
    normalizedBarcode,
    {
      portions: data.portions,
      unit: data.unit,
      expiryDate: data.expiryDate,
      minStock: data.minStock,
      notes: data.notes,
    },
    movement,
  );
}

export async function getAllProducts(workspaceId) {
  const inventory = await getAllInventory(workspaceId);

  return hydrateInventory(inventory, workspaceId);
}

export function subscribeToProducts(onData, onError, workspaceId) {
  return subscribeToInventory(
    (inventory, metadata) => {
      hydrateInventory(inventory, workspaceId)
        .then((products) => onData(products, metadata))
        .catch(onError);
    },
    onError,
  );
}

export async function updatePortions(barcode, newPortions, movement = null) {
  return updateInventoryPortionsWithMovement(barcode, newPortions, movement);
}
