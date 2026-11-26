# 📚 Documentation status — 2026-11-26

## 🎯 Product ownership
Cupboard is the source of truth for physical inventory quantities, product identity within inventory spaces and stock movement history. It serves household and business workspaces without mixing their balances.

## ✨ Current documented scope
- Product catalog, quantities, units, minimum stock and expiry dates.
- Optional editable purchase price in COP, scoped to product/workspace; it is not portion cost or sale price.
- Inventory cards and detail views.
- Traceable stock entries, consumption, purchases, adjustments and reversals.
- Household/business workspace separation and shared access controls.
- Barcode search/scanning, shopping and recipe support, PWA interface.
- Sandwichies integration through authorized, traceable inventory operations.

## 🧱 Documented stack
React 19 · Vite 8 · Tailwind CSS 4 · Firebase 12 · Firestore · Firebase Authentication · Firestore Rules · ZXing · html5-qrcode · vite-plugin-pwa.

## 📍 Status and integration boundaries
The README and source documentation describe Cupboard as inventory authority. Sandwichies owns commercial catalog/order flows; Financial-D3V does not automatically receive purchase prices or private vault data. Cross-project operations require explicit contracts, idempotency, compensation and reconciliation.

The current README includes editable purchase-price and improved movement descriptions. These are documented product behaviors, not evidence that the local validation commands have passed in this review.

## 🧪 Validation
No new lint, regression tests, Firestore Rules emulator tests, build, migration, import, production data operation or deployment was executed for this update. Existing checkpoints are historical evidence.

## 🔐 Data-operation guardrails
Review import/migration/reset script behavior before execution. Do not run destructive resets, real imports or identity migrations without an approved plan and backup.

## 📂 Documentation inventory
- `docs/PRODUCT.md`
- `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`
- `docs/SECURITY.md`, `docs/USER_FLOWS.md`
- `docs/DESIGN_PRINCIPLES.md`, `docs/ROADMAP.md`
- `docs/CONTRIBUTING.md`
- `QUALITY-CHECKPOINT-2026-11-12.md`
- `docs/EXECUTION-REPORT-2026-11-16.md`
- `CONTEXT.md`

## 🔭 Next documentation gate
Record local results for lint, regression, Firestore Rules emulator and build. Reconcile price persistence, workspace isolation, movement reversals and Sandwichies cross-project retries against tests before declaring the release gate closed.

---
*PALMI-D3V · 🧺 Build · Create · Improve · Validate.*