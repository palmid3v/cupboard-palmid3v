import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../firebase";
import { auth } from "./auth";

function catalogRef(productId) {
  return doc(db, "productCatalog", String(productId).trim());
}

function normalizeCatalogProduct(id, data = {}) {
  return {
    id,
    name: data.name ?? "",
    description: data.description ?? "",
    brand: data.brand ?? "",
    weight: Number(data.weight) || 0,
    imageUrl: data.imageUrl ?? "",
    category: data.category ?? "",
    barcode: data.barcode ?? null,
    workspaceId: data.workspaceId || (id.startsWith("N-") ? "sandwichies" : "home"),
    ingredientId: data.ingredientId ?? null,
    legacyIds: Array.isArray(data.legacyIds) ? data.legacyIds : [],
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

async function canonicalSnapshot(identifier) {
  const normalized = String(identifier || "").trim();
  if (!normalized) return null;

  const direct = await getDoc(catalogRef(normalized));
  if (direct.exists()) {
    const data = direct.data();
    if (data.migratedTo) {
      const canonical = await getDoc(catalogRef(data.migratedTo));
      return canonical.exists() ? canonical : null;
    }
    return direct;
  }

  const byBarcode = await getDocs(query(
    collection(db, "productCatalog"),
    where("barcode", "==", normalized),
    limit(1),
  ));
  return byBarcode.docs[0] || null;
}

export async function getCatalogProduct(identifier) {
  const snapshot = await canonicalSnapshot(identifier);
  return snapshot?.exists() ? normalizeCatalogProduct(snapshot.id, snapshot.data()) : null;
}

export async function getAllCatalogProducts() {
  const snapshot = await getDocs(collection(db, "productCatalog"));
  return snapshot.docs
    .filter((item) => !item.data().migratedTo && item.data().migrationStatus !== "legacy-alias")
    .map((item) => normalizeCatalogProduct(item.id, item.data()))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}

function randomSevenDigitId() {
  const value = globalThis.crypto?.getRandomValues
    ? globalThis.crypto.getRandomValues(new Uint32Array(1))[0]
    : Math.floor(Math.random() * 0xffffffff);
  return String(1_000_000 + (value % 9_000_000));
}

async function allocateProductId(workspaceId) {
  const prefix = workspaceId === "sandwichies" ? "N-" : "HD-";
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const id = prefix + randomSevenDigitId();
    const snapshot = await getDoc(catalogRef(id));
    if (!snapshot.exists()) return id;
  }
  throw new Error("PRODUCT_ID_ALLOCATION_FAILED");
}

export async function createCatalogProductIfMissing(barcode, data = {}) {
  const normalizedBarcode = String(barcode || "").trim();
  if (!normalizedBarcode) throw new Error("BARCODE_REQUIRED");

  const existing = await getCatalogProduct(normalizedBarcode);
  if (existing) return existing;

  const workspaceId = data.workspaceId === "sandwichies" ? "sandwichies" : "home";
  const productId = await allocateProductId(workspaceId);
  const ref = catalogRef(productId);

  await setDoc(ref, {
    name: data.name?.trim() ?? "",
    description: data.description?.trim() ?? "",
    brand: data.brand?.trim() ?? "",
    weight: Number(data.weight) || 0,
    imageUrl: data.imageUrl?.trim() ?? "",
    category: data.category?.trim() ?? "",
    barcode: normalizedBarcode,
    workspaceId,
    identityVersion: 2,
    createdBy: data.createdBy ?? auth.currentUser?.uid ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return getCatalogProduct(productId);
}

export async function updateCatalogProduct(identifier, data = {}) {
  const normalized = String(identifier || "").trim();
  if (!normalized) throw new Error("PRODUCT_ID_REQUIRED");

  const existing = await getCatalogProduct(normalized);
  if (!existing) return createCatalogProductIfMissing(normalized, data);

  await updateDoc(catalogRef(existing.id), {
    name: data.name?.trim() ?? "",
    description: data.description?.trim() ?? "",
    brand: data.brand?.trim() ?? "",
    weight: Number(data.weight) || 0,
    imageUrl: data.imageUrl?.trim() ?? "",
    category: data.category?.trim() ?? "",
    updatedAt: serverTimestamp(),
  });

  return getCatalogProduct(existing.id);
}

export async function seedCatalogFromProducts(products = []) {
  const results = [];
  for (const product of products) {
    results.push(await createCatalogProductIfMissing(product.barcode || product.id, product));
  }
  return results;
}
