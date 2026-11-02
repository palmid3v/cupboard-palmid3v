import { createCatalogProductIfMissing, getCatalogProduct, updateCatalogProduct } from "./catalog";

// Session-scoped catalog cache reduces duplicate reads during realtime inventory hydration.
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
    brand: catalog.brand ?? "",
    barcode: catalog.barcode ?? null,
    workspaceId: catalog.workspaceId || (id.startsWith("N-") ? "sandwichies" : "home"),
    ingredientId: catalog.ingredientId ?? null,
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

async function getCachedCatalogProduct(identifier) {
  const normalized = String(identifier || "").trim();
  if (!normalized) return null;
  if (catalogCache.has(normalized)) return catalogCache.get(normalized);
  const catalog = await getCatalogProduct(normalized);
  catalogCache.set(normalized, catalog);
  if (catalog) catalogCache.set(catalog.id, catalog);
  return catalog;
}

async function hydrateInventory(inventory, workspaceId) {
  return Promise.all(inventory.map(async (item) => {
    const catalog = await getCachedCatalogProduct(item.id);
    return { ...normalizeProduct(item.id, catalog || {}, item), workspaceId };
  }));
}

export async function getProduct(identifier, workspaceId) {
  const normalized = String(identifier || "").trim();
  if (!normalized) return null;

  let inventory = await getInventoryProduct(normalized, workspaceId);
  let catalog = await getCachedCatalogProduct(normalized);

  if (!inventory && catalog) inventory = await getInventoryProduct(catalog.id, workspaceId);
  if (!catalog && inventory) catalog = await getCachedCatalogProduct(inventory.id);
  if (!inventory) return null;

  return { ...normalizeProduct(inventory.id, catalog || {}, inventory), workspaceId };
}

export async function findProductByBarcode(barcode, workspaceId) {
  const catalog = await getCachedCatalogProduct(barcode);
  if (!catalog) return { source: "new", product: null };

  const inventory = await getInventoryProduct(catalog.id, workspaceId || catalog.workspaceId);
  if (inventory) {
    return {
      source: "inventory",
      product: { ...normalizeProduct(catalog.id, catalog, inventory), workspaceId: workspaceId || catalog.workspaceId },
    };
  }

  return { source: "catalog", product: catalog };
}

export async function saveProduct(barcode, data = {}, movement = null, workspaceId = "home") {
  const normalizedBarcode = String(barcode || "").trim();
  if (!normalizedBarcode) throw new Error("BARCODE_REQUIRED");

  const existingCatalog = await getCatalogProduct(normalizedBarcode);
  const catalog = existingCatalog
    ? await updateCatalogProduct(existingCatalog.id, data)
    : await createCatalogProductIfMissing(normalizedBarcode, { ...data, workspaceId });

  catalogCache.delete(normalizedBarcode);
  catalogCache.set(catalog.id, catalog);

  await saveInventoryProductWithMovement(
    catalog.id,
    {
      portions: data.portions,
      unit: data.unit,
      expiryDate: data.expiryDate,
      minStock: data.minStock,
      notes: data.notes,
    },
    movement,
    workspaceId,
  );

  return { ...catalog, portions: Number(data.portions) || 0, workspaceId };
}

export async function getAllProducts(workspaceId) {
  return hydrateInventory(await getAllInventory(workspaceId), workspaceId);
}

export function subscribeToProducts(onData, onError, workspaceId) {
  return subscribeToInventory((inventory, metadata) => {
    hydrateInventory(inventory, workspaceId)
      .then((products) => onData(products, metadata))
      .catch(onError);
  }, onError, workspaceId);
}

export async function updatePortions(productId, newPortions, movement = null, workspaceId) {
  return updateInventoryPortionsWithMovement(productId, newPortions, movement, workspaceId);
}
