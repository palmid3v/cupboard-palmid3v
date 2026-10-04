import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase";

function catalogRef(barcode) {
  return doc(db, "productCatalog", String(barcode).trim());
}

export function normalizeCatalogProduct(id, data = {}) {
  return {
    id,
    name: data.name ?? "",
    description: data.description ?? "",
    brand: data.brand ?? "",
    weight: Number(data.weight) || 0,
    imageUrl: data.imageUrl ?? "",
    category: data.category ?? "",
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

export async function getCatalogProduct(barcode) {
  const normalizedBarcode = String(barcode || "").trim();
  if (!normalizedBarcode) return null;

  const snapshot = await getDoc(catalogRef(normalizedBarcode));

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeCatalogProduct(snapshot.id, snapshot.data());
}

export async function createCatalogProductIfMissing(barcode, data) {
  const normalizedBarcode = String(barcode || "").trim();
  if (!normalizedBarcode) {
    throw new Error("BARCODE_REQUIRED");
  }

  const ref = catalogRef(normalizedBarcode);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);

    if (snapshot.exists()) {
      return;
    }

    transaction.set(ref, {
      name: data.name?.trim() ?? "",
      description: data.description?.trim() ?? "",
      brand: data.brand?.trim() ?? "",
      weight: Number(data.weight) || 0,
      imageUrl: data.imageUrl?.trim() ?? "",
      category: data.category?.trim() ?? "",
      createdBy: data.createdBy ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  return getCatalogProduct(normalizedBarcode);
}

export async function seedCatalogFromProducts(products = []) {
  const results = [];

  for (const product of products) {
    const catalogProduct = await createCatalogProductIfMissing(product.id, product);
    results.push(catalogProduct);
  }

  return results;
}
