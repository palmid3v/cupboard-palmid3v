// src/services/products.js

import { createCatalogProductIfMissing, getCatalogProduct } from "./catalog";
import {
  getAllInventory,
  getInventoryProduct,
  saveInventoryProduct,
  subscribeToInventory,
  updateInventoryPortions,
} from "./inventory";

function normalizeProduct(id, catalog = {}, inventory = {}) {
  return {
    id,
    name: catalog.name ?? "",
    description: catalog.description ?? "",
    weight: Number(catalog.weight) || 0,
    portions: Number(inventory.portions) || 0,
    imageUrl: catalog.imageUrl ?? "",
    category: catalog.category ?? "",
    expiryDate: inventory.expiryDate ?? null,
    minStock: Math.max(0, Number(inventory.minStock) || 5),
    notes: inventory.notes ?? "",
    createdAt: inventory.createdAt ?? null,
    updatedAt: inventory.updatedAt ?? null,
  };
}

async function hydrateInventory(inventory) {
  const products = await Promise.all(
    inventory.map(async (item) => {
      const catalog = await getCatalogProduct(item.id);

      if (!catalog) {
        return normalizeProduct(item.id, {}, item);
      }

      return normalizeProduct(item.id, catalog, item);
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
export async function getProduct(barcode) {
  const normalizedBarcode = String(barcode || "").trim();

  if (!normalizedBarcode) return null;

  const inventory = await getInventoryProduct(normalizedBarcode);

  if (!inventory) {
    return null;
  }

  const catalog = await getCatalogProduct(normalizedBarcode);

  return normalizeProduct(normalizedBarcode, catalog || {}, inventory);
}

export async function findProductByBarcode(barcode) {
  const householdProduct = await getProduct(barcode);

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

export async function saveProduct(barcode, data = {}) {
  const normalizedBarcode = String(barcode || "").trim();

  if (!normalizedBarcode) {
    throw new Error("BARCODE_REQUIRED");
  }

  await createCatalogProductIfMissing(normalizedBarcode, data);

  await saveInventoryProduct(normalizedBarcode, {
    portions: data.portions,
    expiryDate: data.expiryDate,
    minStock: data.minStock,
    notes: data.notes,
  });
}

export async function getAllProducts() {
  const inventory = await getAllInventory();

  return hydrateInventory(inventory);
}

export function subscribeToProducts(onData, onError) {
  return subscribeToInventory(
    (inventory, metadata) => {
      hydrateInventory(inventory)
        .then((products) => onData(products, metadata))
        .catch(onError);
    },
    onError,
  );
}

export async function updatePortions(barcode, newPortions) {
  return updateInventoryPortions(barcode, newPortions);
}
