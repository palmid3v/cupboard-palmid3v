import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

if (existsSync(".env")) process.loadEnvFile(".env");

const projectId = String(process.env.CUPBOARD_PROJECT_ID || "").trim();
const householdId = String(process.env.CUPBOARD_HOUSEHOLD_ID || "").trim();
const apply = process.argv.includes("--apply");
const manifestUrl = new URL("../data/product-identity-map.v2.json", import.meta.url);
const batchLimit = 400;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function commitChunks(db, operations) {
  for (let i = 0; i < operations.length; i += batchLimit) {
    const batch = db.batch();
    for (const operation of operations.slice(i, i + batchLimit)) operation(batch);
    await batch.commit();
  }
}

async function main() {
  assert(projectId && householdId, "Define CUPBOARD_PROJECT_ID y CUPBOARD_HOUSEHOLD_ID en app/.env.");
  assert(!householdId.includes("/"), "CUPBOARD_HOUSEHOLD_ID no puede contener '/'.");
  const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));
  assert(manifest.householdId === householdId, "CUPBOARD_HOUSEHOLD_ID no coincide con el hogar de la extracción: " + manifest.householdId);
  assert(manifest.sourceProject === projectId, "CUPBOARD_PROJECT_ID no coincide con el proyecto de la extracción: " + manifest.sourceProject);
  const records = manifest.records;
  assert(records.length === 44, "El manifiesto debe contener los 44 productos extraídos.");
  assert(new Set(records.map((item) => item.legacyId)).size === records.length, "Hay IDs legacy duplicados.");
  assert(new Set(records.map((item) => item.productId)).size === records.length, "Hay nuevos IDs duplicados.");
  for (const item of records) {
    assert(/^(HD|N)-[0-9]{7}$/.test(item.productId), "ID nuevo inválido: " + item.productId);
    assert((item.workspaceId === "home" && item.productId.startsWith("HD-"))
      || (item.workspaceId === "sandwichies" && item.productId.startsWith("N-")), "Prefijo y espacio no coinciden: " + item.productId);
  }

  const appName = "cupboard-product-identity-v2";
  const app = getApps().find((item) => item.name === appName)
    || initializeApp({ credential: applicationDefault(), projectId }, appName);
  const db = getFirestore(app);
  const householdRef = db.doc("households/" + householdId);
  const household = await householdRef.get();
  assert(household.exists && household.data()?.ownerUid, "No se encontró el hogar configurado o su ownerUid.");

  const homeInventory = db.collection("households/" + householdId + "/inventory");
  const businessInventory = db.collection("households/" + householdId + "/workspaces/sandwichies/inventory");
  const homeMovements = db.collection("households/" + householdId + "/movements");
  const businessMovements = db.collection("households/" + householdId + "/workspaces/sandwichies/movements");
  const [catalogSnapshots, homeStocks, businessStocks, homeHistory, businessHistory] = await Promise.all([
    Promise.all(records.map((item) => db.doc("productCatalog/" + item.legacyId).get())),
    homeInventory.get(),
    businessInventory.get(),
    homeMovements.get(),
    businessMovements.get(),
  ]);

  const catalogByLegacy = new Map(records.map((item, index) => [item.legacyId, catalogSnapshots[index]]));
  const homeStockByLegacy = new Map(homeStocks.docs.map((doc) => [doc.id, doc]));
  const businessStockByLegacy = new Map(businessStocks.docs.map((doc) => [doc.id, doc]));
  const operations = [];
  const stats = {
    catalog: { expected: records.length, present: 0, create: 0, aliases: 0 },
    inventory: {
      existingHome: homeStocks.size,
      existingBusiness: businessStocks.size,
      create: 0,
      rekey: 0,
      homeProductsWithSourceStock: 0,
      businessProductsWithSourceStock: 0,
    },
    movements: { home: homeHistory.size, business: businessHistory.size, relink: 0 },
  };

  for (const item of records) {
    const legacyCatalog = catalogByLegacy.get(item.legacyId);
    assert(legacyCatalog.exists, "Falta el producto original en productCatalog: " + item.legacyId);
    const targetCatalogRef = db.doc("productCatalog/" + item.productId);
    const targetCatalog = await targetCatalogRef.get();
    const oldData = legacyCatalog.data();
    const canonicalData = {
      ...oldData,
      barcode: item.barcode,
      workspaceId: item.workspaceId,
      identityVersion: 2,
      legacyIds: [item.legacyId],
      ...(item.ingredientId ? { ingredientId: item.ingredientId, unit: item.unit, sourceApp: "sandwichies" } : {}),
      migratedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (!targetCatalog.exists) {
      operations.push((batch) => batch.create(targetCatalogRef, canonicalData));
      stats.catalog.create += 1;
    } else {
      assert(targetCatalog.data()?.legacyIds?.includes(item.legacyId)
        || targetCatalog.data()?.legacyId === item.legacyId,
      "El nuevo ID ya existe y no corresponde al producto esperado: " + item.productId);
      stats.catalog.present += 1;
    }

    const expectedSourceStocks = item.workspaceId === "sandwichies"
      ? businessStockByLegacy
      : homeStockByLegacy;
    const unexpectedSourceStocks = item.workspaceId === "sandwichies"
      ? homeStockByLegacy
      : businessStockByLegacy;
    assert(!unexpectedSourceStocks.has(item.legacyId),
      "El producto " + item.legacyId + " tiene existencias en el espacio incorrecto; requiere conciliación manual.");
    const sourceStock = expectedSourceStocks.get(item.legacyId);
    const destinationCollection = item.workspaceId === "sandwichies" ? businessInventory : homeInventory;
    const destinationRef = destinationCollection.doc(item.productId);
    const destination = await destinationRef.get();
    assert(!sourceStock || !destination.exists, "Conflicto: existen simultáneamente inventario legacy y nuevo para " + item.legacyId);
    if (sourceStock) {
      if (item.workspaceId === "sandwichies") stats.inventory.businessProductsWithSourceStock += 1;
      else stats.inventory.homeProductsWithSourceStock += 1;
    }
    const sourceData = sourceStock?.data() || {};
    const inventoryData = {
      portions: sourceStock ? Math.max(0, Number(sourceData.portions) || 0) : 0,
      unit: String(sourceData.unit || item.unit || "porciones").trim() || "porciones",
      expiryDate: sourceData.expiryDate ?? null,
      minStock: Math.max(0, Number(sourceData.minStock) || 5),
      notes: sourceData.notes || "",
      productId: item.productId,
      workspaceId: item.workspaceId,
      legacyId: item.legacyId,
      createdAt: sourceData.createdAt || FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      ...(item.workspaceId === "sandwichies" ? { sandwichiesInventoryRevision: 0 } : {}),
    };
    if (!destination.exists) {
      operations.push((batch) => batch.create(destinationRef, inventoryData));
      stats.inventory.create += 1;
      if (sourceStock) {
        operations.push((batch) => batch.delete(sourceStock.ref));
        stats.inventory.rekey += 1;
      }
    }
    operations.push((batch) => batch.update(db.doc("productCatalog/" + item.legacyId), {
      migratedTo: item.productId,
      migrationStatus: "legacy-alias",
      updatedAt: FieldValue.serverTimestamp(),
    }));
    stats.catalog.aliases += 1;
  }

  const idMap = new Map(records.map((item) => [item.legacyId, item.productId]));
  for (const movementDoc of [...homeHistory.docs, ...businessHistory.docs]) {
    const data = movementDoc.data();
    const oldProductId = String(data.productId || "").trim();
    const newProductId = idMap.get(oldProductId);
    if (!newProductId || oldProductId === newProductId) continue;
    operations.push((batch) => batch.update(movementDoc.ref, {
      productId: newProductId,
      legacyProductId: oldProductId,
      updatedAt: data.updatedAt || FieldValue.serverTimestamp(),
    }));
    stats.movements.relink += 1;
  }

  const unresolvedMovementRefs = [...homeHistory.docs, ...businessHistory.docs]
    .filter((doc) => doc.data().productId && !idMap.has(doc.data().productId) && !records.some((item) => item.productId === doc.data().productId));
  assert(unresolvedMovementRefs.length === 0,
    "Hay movimientos que apuntan a productos fuera del manifiesto: " + unresolvedMovementRefs.map((doc) => doc.id).join(", "));

  console.log(JSON.stringify({
    mode: apply ? "APPLY" : "PLAN_ONLY",
    projectId,
    householdId,
    assignment: { home: records.filter((item) => item.workspaceId === "home").length, business: records.filter((item) => item.workspaceId === "sandwichies").length },
    stats,
    writes: operations.length,
    note: "Los documentos productCatalog legacy se conservan como alias; los movimientos mantienen su ID y guardan legacyProductId.",
  }, null, 2));

  if (!apply) {
    console.log("No se escribieron datos. Ejecuta con --apply para confirmar la migración.");
    return;
  }
  await commitChunks(db, operations);
  console.log("Migración completada. Verifica los 44 IDs y las cantidades antes de borrar cualquier alias legacy.");
}

main().catch((error) => {
  console.error("Migración de identidad Cupboard:", error.message || String(error));
  process.exitCode = 1;
});
