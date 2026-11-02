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

import { defaultThemeId, getThemeById, isValidThemeId, themes } from "../src/theme-engine/themes.js";

test("shared theme catalog exposes valid unique semantic presets", () => {
  assert.equal(defaultThemeId, "palmi");
  assert.equal(isValidThemeId("cupboard"), true);
  assert.equal(getThemeById("cupboard")?.colors.primary, "#78a85b");
  assert.equal(isValidThemeId("unknown-theme"), false);
  assert.equal(getThemeById("unknown-theme"), null);
  const ids = themes.map((theme) => theme.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const theme of themes) {
    assert.ok(theme.name);
    assert.match(theme.gradient, /linear-gradient/);
    for (const token of ["background", "surface", "text", "muted", "primary", "secondary", "accent", "border"]) {
      assert.match(theme.colors[token], /^#[0-9a-f]{6}$/i, `${theme.id} missing ${token}`);
    }
  }
});

test("theme engine remains presentation-only and app-scoped", async () => {
  const provider = await read("../src/theme-engine/ThemeProvider.jsx");
  const main = await read("../src/main.jsx");
  const settings = await read("../src/components/SettingsPanel.jsx");
  assert.match(provider, /storageKey = STORAGE_KEY/);
  const adapter = await read("../src/theme-engine/CupboardThemeAdapter.jsx");
  assert.match(adapter, /--cupboard-primary/);
  assert.match(adapter, /--cupboard-bg/);
  assert.match(main, /CupboardThemeAdapter/);
  assert.match(main, /storageKey="cupboard-theme"/);
  assert.match(settings, /useThemeEngine/);
  assert.match(settings, /setMode/);
  assert.match(settings, /setTheme/);
});

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
  assert.match(rules, /allow read: if canAccessWorkspace\(householdId, "home"\)/);
  assert.match(rules, /allow create, delete: if owner\(householdId\)/);
  assert.match(rules, /affectedKeys\(\)\.hasOnly\(\[\x27portions\x27, \x27updatedAt\x27\]\)/);
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

test("Sandwichies import defaults to dry-run and preserves authoritative Cupboard data", async () => {
  const source = await read("../scripts/import-sandwichies-inventory.mjs");

  assert.match(source, /SANDWICHIES_PROJECT_ID/);
  assert.match(source, /process\.argv\.includes\("--apply"\)/);
  assert.match(source, /cupboardInventoryRevision !== undefined/);
  assert.match(source, /if \(destinationSnapshot\.exists\)/);
  assert.match(source, /batch\.create\(operation\.ref, operation\.data\)/);
  assert.match(source, /sandwichies-import-/);
});

test("admin inventory view combines workspaces and keeps destination explicit", async () => {
  const app = await read("../src/App.jsx");
  const hook = await read("../src/hooks/useInventorySubscription.js");
  const products = await read("../src/services/products.js");
  const inventoryView = await read("../src/components/InventoryView.jsx");
  const productForm = await read("../src/components/ProductForm.jsx");

  assert.match(app, /const canManageProducts = userRole === "admin"/);
  assert.match(app, /targetWorkspaceId/);
  assert.match(hook, /\["home", "sandwichies"\]/);
  assert.match(products, /saveProduct\(barcode, data = \{\}, movement = null, workspaceId = "home"\)/);
  assert.match(products, /updatePortions\(barcode, newPortions, movement = null, workspaceId\)/);
  assert.match(inventoryView, /showWorkspaceFilter/);
  assert.match(inventoryView, /item\.workspaceId === "sandwichies"/);
  assert.match(productForm, /product-destination/);
});

test("settings contracts remain local and bounded", async () => {
  const source = await read("../src/hooks/useCupboardSettings.js");
  const panel = await read("../src/components/SettingsPanel.jsx");
  const app = await read("../src/App.jsx");
  const themeCatalog = await read("../src/theme-engine/themes.js");

  assert.match(source, /cupboard\.settings/);
  assert.match(source, /minStockDefault/);
  assert.match(source, /inventorySort/);
  assert.match(source, /inventoryFilter/);
  assert.match(source, /localStorage/);

  assert.match(panel, /auth\.currentUser/);
  assert.match(panel, /logout/);
  assert.match(panel, /themes\.map/);
  assert.match(themeCatalog, /name: .Cupboard./);
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

test("Sandwichies inventory is owner-only and not assignable to members", async () => {
  const rules = await read("../../firestore.rules");
  assert.ok(rules.includes('match /workspaces/{workspaceId}/{document=**}'));
  assert.match(rules, /allow read, write: if workspaceId == "sandwichies" && owner\(householdId\)/);
  assert.ok(!rules.includes("allow create, update, delete: if workspaceId == \"sandwichies\" && editor(householdId)"));
});
