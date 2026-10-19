import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  canWriteInventory,
  getSaveErrorMessage,
  getSaveErrorState,
  getStockState,
  resolveRecognitionSource,
  getScannerErrorState,
  movementIsAtomic,
} from "../src/services/regressionContracts.js";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("role matrix keeps members read-only", () => {
  assert.equal(canWriteInventory("admin"), true);
  assert.equal(canWriteInventory("editor"), true);
  assert.equal(canWriteInventory("member"), false);
  assert.equal(canWriteInventory(null), false);
});

test("save errors have stable permission/network/unknown taxonomy", () => {
  assert.equal(getSaveErrorState("permission-denied"), "permission");
  assert.equal(getSaveErrorState("unavailable"), "network");
  assert.equal(getSaveErrorState("network-request-failed"), "network");
  assert.equal(getSaveErrorState("failed-precondition"), "unknown");
  assert.match(getSaveErrorMessage("permission-denied"), /permisos/i);
  assert.match(getSaveErrorMessage("unavailable"), /conectar/i);
  assert.match(getSaveErrorMessage("unexpected"), /guardar/i);
});

test("low-stock state always respects product threshold", () => {
  assert.equal(getStockState(0, 12), "empty");
  assert.equal(getStockState(12, 12), "low");
  assert.equal(getStockState(13, 12), "warning");
  assert.equal(getStockState(30, 12), "available");
  assert.equal(getStockState(5, 5), "low");
  assert.equal(getStockState(6, 5), "warning");
});

test("barcode recognition keeps inventory before shared catalog before new", () => {
  assert.equal(resolveRecognitionSource({ inventory: {}, catalog: {} }), "inventory");
  assert.equal(resolveRecognitionSource({ inventory: null, catalog: {} }), "catalog");
  assert.equal(resolveRecognitionSource({ inventory: null, catalog: null }), "new");
});

test("scanner errors map to explicit recovery states", () => {
  assert.equal(getScannerErrorState({ name: "NotAllowedError" }).action, "Permitir acceso");
  assert.equal(getScannerErrorState({ name: "NotFoundError" }).action, "Revisar cámara");
  assert.equal(getScannerErrorState({ name: "NotReadableError" }).action, "Intentar nuevamente");
  assert.equal(getScannerErrorState({ name: "AbortError" }).action, "Reiniciar cámara");
  assert.equal(getScannerErrorState({ name: "UnknownError" }).action, "Intentar nuevamente");
});

test("movement writes remain atomic in the inventory service", async () => {
  const source = await read("../src/services/inventory.js");
  assert.equal(movementIsAtomic(source), true);
  assert.match(source, /saveInventoryProductWithMovement/);
  assert.match(source, /updateInventoryPortionsWithMovement/);
});

test("authentication regression contracts remain explicit", async () => {
  const source = await read("../src/services/auth.js");
  assert.match(source, /sendEmailVerification\(credential\.user\)/);
  assert.match(source, /export async function resendVerificationEmail/);
  assert.match(source, /await auth\.currentUser\.getIdToken\(true\)/);
});

test("invitation flow remains member-only and household-scoped", async () => {
  const source = await read("../src/services/households.js");
  assert.match(source, /const role = "member"/);
  assert.match(source, /households", invite\.householdId, "members"/);
  assert.match(source, /householdInvites/);
  assert.match(source, /batch\.commit\(\)/);
});

test("Firestore rules preserve verified-email and role boundaries", async () => {
  const rules = await read("../../firestore.rules");

  assert.match(rules, /request\.auth\.token\.email_verified == true/);
  assert.match(rules, /allow read: if member\(householdId\)/);
  assert.match(rules, /allow create, update, delete: if editor\(householdId\)/);
  assert.match(rules, /allow create: if owner\(request\.resource\.data\.householdId\)/);
  assert.match(rules, /request\.resource\.data\.role == 'member'/);
  assert.match(rules, /match \/productCatalog\/{barcode}/);
  assert.match(rules, /allow delete: if false;/);
});

test("architecture extraction keeps App focused on orchestration", async () => {
  const source = await read("../src/App.jsx");
  const inventoryView = await read("../src/components/InventoryView.jsx");
  const scannerView = await read("../src/components/ScannerView.jsx");
  const productForm = await read("../src/components/ProductForm.jsx");
  const inventoryHook = await read("../src/hooks/useInventorySubscription.js");

  assert.match(source, /import InventoryView from "\.\/components\/InventoryView"/);
  assert.match(source, /import ScannerView from "\.\/components\/ScannerView"/);
  assert.match(source, /import useInventorySubscription from "\.\/hooks\/useInventorySubscription"/);
  assert.doesNotMatch(source, /const inventorySummary = \{/);
  assert.doesNotMatch(source, /const filteredProducts =/);
  assert.match(inventoryView, /function InventoryView/);
  assert.match(scannerView, /function ScannerView/);
  assert.match(productForm, /function ProductForm/);
  assert.match(inventoryHook, /function useInventorySubscription/);
});

test("settings contracts remain local and bounded", async () => {
  const source = await read("../src/hooks/useCupboardSettings.js");
  const panel = await read("../src/components/SettingsPanel.jsx");
  const app = await read("../src/App.jsx");

  assert.match(source, /cupboard\.settings/);
  assert.match(source, /minStockDefault/);
  assert.match(source, /inventorySort/);
  assert.match(source, /inventoryFilter/);
  assert.match(source, /localStorage/);

  assert.match(panel, /auth\.currentUser/);
  assert.match(panel, /logout/);
  assert.match(panel, /Cupboard Dark/);
  assert.match(panel, /v\{APP_VERSION\}/);

  assert.match(app, /useCupboardSettings/);
  assert.match(app, /minStock: settings\.minStockDefault/);
  assert.match(app, /initialSort=\{settings\.inventorySort\}/);
  assert.match(app, /initialFilter=\{settings\.inventoryFilter\}/);
});

test("retro-digital design system remains present without changing the application stack", async () => {
  const css = await read("../src/index.css");
  const packageJson = await read("../package.json");

  assert.match(css, /Retro-Digital \/ modern 8-bit visual system/);
  assert.match(css, /#070b12/);
  assert.match(css, /#39a8ff/);
  assert.match(css, /Courier New/);
  assert.match(css, /prefers-reduced-motion/);

  assert.match(packageJson, /"react":/);
  assert.match(packageJson, /"firebase":/);
  assert.match(packageJson, /"vite":/);
  assert.match(packageJson, /"vite-plugin-pwa":/);
});

test("workspace selection is persistent and rejects unknown workspaces", async () => {
  const source = await read("../src/services/workspaces.js");
  assert.ok(source.includes('"cupboard.workspaceId"'));
  assert.ok(source.includes('new Set(["home", "sandwichies"])'));
  assert.ok(source.includes('throw new Error("INVALID_WORKSPACE")'));
  assert.ok(source.includes('localStorage.setItem(STORAGE_KEY, workspaceId)'));
});

test("Hogar retains legacy paths while Sandwichies uses isolated workspace paths", async () => {
  const inventory = await read("../src/services/inventory.js");
  const features = await read("../src/services/features.js");
  assert.ok(inventory.includes('collection(db, "households", householdId, "inventory")'));
  assert.ok(inventory.includes('"workspaces", "sandwichies", "inventory"'));
  assert.ok(inventory.includes('"workspaces", "sandwichies", "movements"'));
  assert.ok(features.includes('"workspaces", "sandwichies", name'));
  assert.ok(features.includes('getActiveWorkspaceId() === "sandwichies"'));
});

test("Sandwichies workspace rules restrict access to household members and editors", async () => {
  const rules = await read("../../firestore.rules");
  assert.ok(rules.includes('match /workspaces/{workspaceId}/{document=**}'));
  assert.ok(rules.includes('allow read: if workspaceId == "sandwichies" && member(householdId)'));
  assert.ok(rules.includes('allow create, update, delete: if workspaceId == "sandwichies" && editor(householdId)'));
});
