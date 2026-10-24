import { existsSync } from "node:fs";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

if (existsSync(".env")) process.loadEnvFile(".env");

const cupboardProjectId = String(process.env.CUPBOARD_PROJECT_ID || "").trim();
const cupboardHouseholdId = String(process.env.CUPBOARD_HOUSEHOLD_ID || "").trim();
const sandwichiesProjectId = String(process.env.SANDWICHIES_PROJECT_ID || "").trim();
const rawMapping = String(process.env.CUPBOARD_INGREDIENT_MAP_JSON || "").trim();
const applyChanges = process.argv.includes("--apply");
const batchLimit = 400;

function parseMapping(raw) {
  if (!raw) return {};
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("CUPBOARD_INGREDIENT_MAP_JSON debe ser un objeto JSON.");
  }

  return Object.fromEntries(Object.entries(parsed).map(([ingredientId, productId]) => {
    if (!ingredientId.trim() || typeof productId !== "string" || !productId.trim() || productId.includes("/")) {
      throw new Error("Cada asociación debe contener IDs no vacíos y sin '/'.");
    }
    return [ingredientId.trim(), productId.trim()];
  }));
}

function safeId(value) {
  return encodeURIComponent(String(value)).replaceAll("/", "%2F");
}

function destinationProductId(ingredientId, mapping) {
  return mapping[ingredientId] || "sandwichies-" + ingredientId;
}

function normalizeMovementType(sourceMovement, delta) {
  if (delta < 0 || sourceMovement.type === "consumption") return "consume";
  if (delta > 0) return "add";
  return "adjustment";
}

async function commitInChunks(db, operations) {
  for (let index = 0; index < operations.length; index += batchLimit) {
    const batch = db.batch();
    for (const operation of operations.slice(index, index + batchLimit)) {
      batch.create(operation.ref, operation.data);
    }
    await batch.commit();
  }
}

async function main() {
  if (!cupboardProjectId || !cupboardHouseholdId || !sandwichiesProjectId) {
    throw new Error("Define CUPBOARD_PROJECT_ID, CUPBOARD_HOUSEHOLD_ID y SANDWICHIES_PROJECT_ID en app/.env.");
  }
  if (cupboardProjectId === sandwichiesProjectId) {
    throw new Error("Cupboard y Sandwichies deben usar proyectos Firebase distintos.");
  }
  if (cupboardHouseholdId.includes("/")) {
    throw new Error("CUPBOARD_HOUSEHOLD_ID no puede contener '/'.");
  }

  const mapping = parseMapping(rawMapping);
  const mappedIds = Object.values(mapping);
  if (new Set(mappedIds).size !== mappedIds.length) {
    throw new Error("CUPBOARD_INGREDIENT_MAP_JSON asigna más de un ingrediente al mismo producto.");
  }

  const credential = applicationDefault();
  const cupboardApp = getApps().find((app) => app.name === "cupboard-inventory-import")
    || initializeApp({ credential, projectId: cupboardProjectId }, "cupboard-inventory-import");
  const sandwichiesApp = getApps().find((app) => app.name === "sandwichies-inventory-source")
    || initializeApp({ credential, projectId: sandwichiesProjectId }, "sandwichies-inventory-source");
  const cupboardDb = getFirestore(cupboardApp);
  const sandwichiesDb = getFirestore(sandwichiesApp);

  const householdSnapshot = await cupboardDb.doc("households/" + cupboardHouseholdId).get();
  if (!householdSnapshot.exists || !householdSnapshot.data()?.ownerUid) {
    throw new Error("No se encontró el hogar de Cupboard o su ownerUid.");
  }

  const [balanceSnapshot, movementSnapshot] = await Promise.all([
    sandwichiesDb.collection("inventoryBalances").get(),
    sandwichiesDb.collection("inventoryTransactions").get(),
  ]);

  const balanceStats = {
    sourceBalances: balanceSnapshot.size,
    create: [],
    alreadyPresent: [],
    alreadyMirroredFromCupboard: [],
    missingCatalog: [],
    invalid: [],
  };
  const movementStats = {
    sourceMovements: movementSnapshot.size,
    create: [],
    alreadyPresent: [],
    skippedCupboardMirror: [],
    missingCatalog: [],
    invalid: [],
  };
  const operations = [];
  const destinationCollection = "households/" + cupboardHouseholdId + "/workspaces/sandwichies";

  for (const balanceDoc of balanceSnapshot.docs) {
    const balance = balanceDoc.data();
    const ingredientId = String(balance.ingredientId || balanceDoc.id).trim();
    const productId = destinationProductId(ingredientId, mapping);
    const quantity = Number(balance.quantity);
    const destinationRef = cupboardDb.doc(destinationCollection + "/inventory/" + productId);
    const catalogRef = cupboardDb.doc("productCatalog/" + productId);

    if (!Number.isFinite(quantity) || quantity < 0) {
      balanceStats.invalid.push({ ingredientId, reason: "cantidad inválida" });
      continue;
    }

    // A balance carrying this marker was already mirrored from Cupboard.
    // Do not import it back over the authoritative Cupboard value.
    if (balance.cupboardInventoryRevision !== undefined && balance.cupboardInventoryRevision !== null) {
      balanceStats.alreadyMirroredFromCupboard.push({ ingredientId, productId });
      continue;
    }

    const [destinationSnapshot, catalogSnapshot] = await Promise.all([
      destinationRef.get(),
      catalogRef.get(),
    ]);

    if (destinationSnapshot.exists) {
      balanceStats.alreadyPresent.push({ ingredientId, productId });
      continue;
    }
    if (!catalogSnapshot.exists) {
      balanceStats.missingCatalog.push({ ingredientId, productId });
      continue;
    }

    balanceStats.create.push({ ingredientId, productId, quantity, unit: balance.unit || "porciones" });
    operations.push({
      ref: destinationRef,
      data: {
        portions: quantity,
        unit: String(balance.unit || "porciones").trim() || "porciones",
        expiryDate: null,
        minStock: 5,
        notes: "",
        sandwichiesInventoryRevision: 0,
        importedFrom: "sandwichies",
        createdAt: balance.createdAt || FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
    });
  }

  for (const movementDoc of movementSnapshot.docs) {
    const movement = movementDoc.data();
    if (movement.source === "cupboard-sync") {
      movementStats.skippedCupboardMirror.push(movementDoc.id);
      continue;
    }

    const ingredientId = String(movement.ingredientId || "").trim();
    if (!ingredientId) {
      movementStats.invalid.push({ movementId: movementDoc.id, reason: "falta ingredientId" });
      continue;
    }

    const productId = destinationProductId(ingredientId, mapping);
    const deltaValue = Number(movement.quantityDelta);
    const fallbackQuantity = Number(movement.quantity);
    const delta = Number.isFinite(deltaValue) && deltaValue !== 0
      ? deltaValue
      : (movement.type === "consumption" ? -Math.abs(fallbackQuantity) : Math.abs(fallbackQuantity));

    if (!Number.isFinite(delta) || delta === 0) {
      movementStats.invalid.push({ movementId: movementDoc.id, reason: "cantidad de movimiento inválida" });
      continue;
    }

    const destinationRef = cupboardDb.doc(destinationCollection + "/movements/sandwichies-import-" + safeId(movementDoc.id));
    const catalogRef = cupboardDb.doc("productCatalog/" + productId);
    const [destinationSnapshot, catalogSnapshot] = await Promise.all([
      destinationRef.get(),
      catalogRef.get(),
    ]);

    if (destinationSnapshot.exists) {
      movementStats.alreadyPresent.push(movementDoc.id);
      continue;
    }
    if (!catalogSnapshot.exists) {
      movementStats.missingCatalog.push({ movementId: movementDoc.id, ingredientId, productId });
      continue;
    }

    movementStats.create.push({
      movementId: movementDoc.id,
      ingredientId,
      productId,
      type: normalizeMovementType(movement, delta),
      quantity: Math.abs(delta),
    });
    operations.push({
      ref: destinationRef,
      data: {
        productId,
        ingredientId,
        ingredientName: movement.ingredientName || catalogSnapshot.data()?.name || ingredientId,
        type: normalizeMovementType(movement, delta),
        sourceType: movement.type || "legacy",
        quantity: Math.abs(delta),
        quantityDelta: delta,
        unit: movement.unit || balanceSnapshot.docs.find((item) => (item.data().ingredientId || item.id) === ingredientId)?.data().unit || "porciones",
        reason: String(movement.reason || "Movimiento histórico importado desde Sandwichies"),
        userId: movement.actorUid || movement.userId || movement.updatedBy || "sandwichies-import",
        sourceApp: "sandwichies",
        sourceMovementId: movementDoc.id,
        orderId: movement.orderId || null,
        createdAt: movement.createdAt || FieldValue.serverTimestamp(),
        updatedAt: movement.updatedAt || movement.createdAt || FieldValue.serverTimestamp(),
      },
    });
  }

  console.log(JSON.stringify({
    mode: applyChanges ? "apply" : "dry-run",
    cupboardProjectId,
    cupboardHouseholdId,
    sandwichiesProjectId,
    balances: balanceStats,
    movements: movementStats,
    writesPlanned: operations.length,
  }, null, 2));

  if (!applyChanges) {
    console.log("Simulación únicamente. Revisa el resumen y ejecuta con --apply para importar solo registros faltantes.");
    return;
  }

  await commitInChunks(cupboardDb, operations);
  console.log("Importación completada. Los documentos existentes y los saldos ya reflejados desde Cupboard no fueron sobrescritos.");
}

main().catch((error) => {
  console.error("Importación de inventario Sandwichies → Cupboard:", error.message || String(error));
  process.exitCode = 1;
});
