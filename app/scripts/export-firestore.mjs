
import { initializeApp, applicationDefault, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID;

if (!projectId) {
  throw new Error("Define FIREBASE_PROJECT_ID antes de ejecutar.");
}

if (!getApps().length) {
  initializeApp({
    credential: applicationDefault(),
    projectId,
  });
}

const db = getFirestore();
const outputDir = path.resolve("exports/firestore");

function serialize(value) {
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, serialize(item)])
    );
  }
  return value;
}

async function exportCollection(collectionRef, parentPath = "") {
  const snapshot = await collectionRef.get();
  const documents = [];

  for (const doc of snapshot.docs) {
    const data = serialize(doc.data());
    const documentPath = doc.ref.path;

    documents.push({
      id: doc.id,
      path: documentPath,
      data,
    });

    // Recorre también las subcolecciones de cada documento.
    const subcollections = await doc.ref.listCollections();

    for (const subcollection of subcollections) {
      await exportCollection(subcollection, documentPath);
    }
  }

  const collectionPath = collectionRef.path;
  const safeName = collectionPath.replaceAll("/", "__");

  await writeFile(
    path.join(outputDir, `${safeName}.json`),
    JSON.stringify({
      projectId,
      collection: collectionPath,
      total: documents.length,
      documents,
    }, null, 2),
    "utf8"
  );

  console.log(`${collectionPath}: ${documents.length} documentos`);
}

await mkdir(outputDir, { recursive: true });

const householdSnapshot = await db.collection("households").get();

await exportCollection(db.collection("productCatalog"));

for (const household of householdSnapshot.docs) {
  await exportCollection(household.ref.collection("inventory"));
  await exportCollection(household.ref.collection("movements"));

  const sandwichiesWorkspace = household.ref
  .collection("workspaces")
  .doc("sandwichies");

await exportCollection(
  sandwichiesWorkspace.collection("inventory")
);

await exportCollection(
  sandwichiesWorkspace.collection("movements")
);
    }

console.log(`\nExtracción finalizada: ${outputDir}`);