# CONTEXT — Cupboard

## Identity
- Product: Cupboard
- Repository: `palmid3v/cupboard-palmid3v`
- Owner: PALMI-D3V
- Type: Multi-workspace inventory web application with a central admin view
- Stage: Functional MVP / active development / reliability hardening
- Experience: Mobile-first with responsive desktop support
- Current visual direction: dark-only, warm, calm, green-centered

## Product intent

Cupboard helps manage household inventory and, for the administrator, provides a central view over the separate Cupboard (home) and Sandwichies (business) inventories without merging their stock or movement records.

Core qualities:

**familiar · calm · practical · organized · quick · approachable**

## Implemented capabilities

- Firestore-backed inventory
- Product search by name/barcode
- All / low-stock / available filters
- Name / recent / low-stock / high-stock sorting
- Inventory summaries
- Product detail view
- Optimistic add/consume portion actions
- Error rollback for failed portion updates
- Camera barcode scanning
- Manual barcode entry
- Existing-product lookup
- New-product registration
- Product validation
- Optional product image URL
- Responsive desktop/mobile navigation
- Dark-only visual theme
- PWA configuration

## Stack

React 19 · Vite 8 · Tailwind CSS 4 · Firebase 12 · Firestore · @zxing/browser · html5-qrcode · vite-plugin-pwa · ESLint 9

## Runtime architecture

```text
UI
└── App.jsx
    ├── Inventory
    ├── Scanner
    ├── Product registration
    └── Settings

Scanner
└── BarcodeScanner.jsx
    └── @zxing/browser

Data access
└── services/
    ├── products.js
    ├── catalog.js
    └── inventory.js
             └── Firestore
            ├── productCatalog/{barcode}
            ├── households/{householdId}/inventory/{barcode}
            └── households/{householdId}/movements/{movementId}
```

## Data identity

Firestore model:

```text
productCatalog/{barcode}
households/{householdId}/inventory/{barcode}
households/{householdId}/movements/{movementId}
```

The barcode is the document ID for both catalog and inventory records. Shared identity and household state are intentionally separated.

## Important behavior

### Portion updates

The inventory UI changes the selected product locally first, then calls `updatePortions()`.

On success, the optimistic value remains.

On failure, the previous value is restored and an error is shown.

The action does **not** reload the entire inventory.

### Scanner

`BarcodeScanner.jsx` owns camera startup, cleanup, retry, successful-scan deduplication, and camera-specific error presentation.

The parent receives successful scans through `onScan(code)`.

### Theme

The current UI is dark-only. There is no active light/system theme selector in the current implementation.

## Central admin inventory — October 2026

- Admin sees Home/Cupboard and Sandwichies inventory together, with per-workspace filters and visible destination labels.
- Product registration requires an explicit destination choice: `home` or `sandwichies`.
- Existing products retain their current destination during editing. Moving stock between workspaces is not implicit and needs a dedicated transfer operation.
- Shared product identity remains in `productCatalog/{barcode}`; stock and movements remain in their existing workspace-specific collections.
- Only the admin/household owner can create inventory records or edit product metadata and inventory configuration. Editors may adjust Home quantities only; Firestore Rules restrict their inventory updates to `portions` and `updatedAt`.
- The admin UI listens to both inventory collections. Non-admin access remains scoped to the workspace granted to that account.

### Initial Sandwichies inventory import

The source Sandwichies app stores a projection in `inventoryBalances` and history in `inventoryTransactions`. Its trusted backend is already designed to apply new manual/order movements to Cupboard's `workspaces/sandwichies` inventory and mirror the resulting balance back to Sandwichies.

For legacy data, `app/scripts/import-sandwichies-inventory.mjs` imports only missing balances that are not marked with `cupboardInventoryRevision`, and imports legacy movement history idempotently. It defaults to dry-run and requires ADC permissions across both Firebase projects. Do not claim the live stock is unified until the dry-run has been reviewed, the import has been applied, and Sandwichies' deployed ingredient mapping points to the `sandwichies-*` catalog IDs.

## “Inventario conectado” status

The sidebar/header indicator is backed by the active Firestore inventory listener, browser online/offline events, and Firestore snapshot metadata.

States:
- 🟢 connected — server-backed inventory snapshot;
- 🟡 offline — browser offline or cached data;
- 🔴 error — listener/access failure;
- 🟡 connecting — startup or reconnection in progress.

The owner can also explicitly enable or disable the Firestore network connection for the current browser from Centro → Equipo. This is a client-local control, not a global Firebase switch.

## Current boundaries

Implemented foundation:
- authentication;
- multi-user households;
- authorization/permissions;
- offline-first Firestore persistence;
- live connectivity monitoring;
- expiry;
- movement/history;
- shopping lists;
- recipes;
- basic analytics;
- external product catalog enrichment;
- image URLs.

Deferred:
- Firebase Storage uploads and local image processing until a billing-enabled Firebase plan is acceptable.

## Documentation rule

When documentation conflicts with implementation, inspect the code first and update the documentation. Never document a planned feature as implemented.

## Development

```bash
cd app
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

## Status

Cupboard is an active functional MVP. The current priority is reliability of the scan → recognize → save → inventory loop, especially on real mobile devices, followed by permissions UX, error taxonomy, performance, offline/PWA hardening, automated regression, and incremental component extraction.


## Access model

Cupboard now treats the household owner as the Administrador general / Propietario. Only the owner can generate invitation codes. New accounts require an invitation and enter as member. Firestore Rules protect role and household ownership fields.

## Connection model

The owner can control the Firestore network connection for the current browser from Centro → Equipo. Connected, connecting, offline/cache, and error states are surfaced in the UI. This is a client-local connection control, not a global Firebase shutdown.


## October 2026 security and UX checkpoint

- Email verification is now required before household Firestore access.
- Firebase verification email is sent at signup; AuthGate supports resend and explicit refresh/check.
- Pending household invitations remain stored locally until verification succeeds.
- Firestore Rules independently require `request.auth.token.email_verified == true` and bind profile/member email to the verified Firebase email.
- Product detail has been extracted into `app/src/components/ProductDetail.jsx` with animated stock feedback, expiry state, product image treatment, category, weight, barcode, and minimum-stock metadata.
- Firebase users, households, invites, catalog, inventory, and movements are preserved. The catalog/inventory migration is complete.

## October 2026 architecture checkpoint

### Approved phases

- 🟢 FASE 1 — Shared product catalog
- 🟢 FASE 2 — Data-model audit
- 🟢 FASE 3 — Inventory service foundation
- 🟢 FASE 4 — Runtime adoption
- 🟢 FASE 5 — Movements
- 🟢 FASE 6 — Rules implementation
- 🟢 FASE 7 — Non-destructive migration tooling
- 🟢 FASE 8 — Regression validation
- 🟢 FASE 9 — Reset + migration
- 🟢 FASE 10 — Cleanup

### Target data model

```text
productCatalog/{barcode}
households/{householdId}/inventory/{barcode}
households/{householdId}/movements/{movementId}
```

### New service

`app/src/services/inventory.js` defines the final household inventory boundary with:

- `getInventoryProduct`
- `getAllInventory`
- `subscribeToInventory`
- `saveInventoryProduct`
- `updateInventoryPortions`

The application now uses dedicated catalog/inventory collections at runtime. The legacy household product model has been retired from the runtime and Rules.

### Safety gate

The migration gate was completed after runtime adoption, movements, Rules, migration preparation, and regression validation passed. FASE 10 cleanup is complete.

## October 4, 2026 checkpoint

Scanner startup-race protection and interrupted-camera recovery are implemented. Real-device iPhone scanning has been validated. The save flow was corrected so a secondary refresh cannot falsely report that the primary product write failed. A transient Firebase Auth HTTP 503 was observed during testing and recovered without a code change; Auth availability remains a recoverable runtime condition.

Next phases: scanner hardening, role-aware save UX, save-state taxonomy, performance, offline/PWA validation, automated regression, and incremental App.jsx extraction.


## Documentation checkpoint — 2026-10-18

README.md actualizado para MVP de inventario doméstico. Prioridad vigente: endurecer el flujo escaneo → reconocimiento → registro → inventario en móviles reales y comprobar rollback ante errores Firestore. No afirmar validación completa en dispositivos reales sin evidencia.

Public README states the product scope and release limits. Use the source code, tests and latest audit reports to decide whether a milestone is actually complete.

## Ecosystem handoff — 2026-11-01

Cupboard is one of four independent PALMI-D3V repositories started by [PALMI-D3V Connected Workspace](https://github.com/palmid3v/PALMI-D3V-Connected-Workspace). Local URL: `https://127.0.0.1:5181`; app directory: `app/`; workspace root: `D:\\PALMI-D3V\\projects`. The other apps are DayFlow (5180), Sandwichies (5182) and Financial-D3v (5183).

**Domain ownership:** Cupboard is the inventory source of truth. Shared product identity is separate from workspace-specific stock and movements. Household and Sandwichies business balances must never be merged accidentally. Sandwichies owns order lifecycle; Cupboard owns authoritative inventory.

**Current stack (package/context):** React 19, Vite 8, Tailwind CSS 4, Firebase 12 / Firestore, Firebase Admin 14.5 for trusted tooling/integration, @zxing/browser, html5-qrcode, vite-plugin-pwa, ESLint 9 and Firebase Rules unit testing. Confirm current `app/package.json` before changing versions.

**Current model:** `productCatalog/{barcode}`; household inventory at `households/{householdId}/inventory/{barcode}`; household movement history at `households/{householdId}/movements/{movementId}`. Business inventory remains a distinct workspace. Admin chooses Home or Sandwichies destination explicitly. Household editors do not gain access to business inventory; Sandwichies inventory is owner-only.

**Implemented foundations documented:** multi-user households/invitations, verified-email access, role-based Firestore Rules, offline persistence, connection status, expiry, movement history, shopping lists, recipes, basic analytics, barcode scanning, product registration/detail, central admin view and theme engine. Verify source and Rules before assuming every subflow is production-ready.

**Important scripts:** `npm run lint`, `npm run build`, `npm run test:regression`, `npm run test:rules`, `npm run cupboard:inventory-import`. Import is dry-run by default; `--apply` mutates real data and requires explicit authorization. Never run `reset:data` or apply import without an approved plan.

**Pending cross-app gate:** verify `CUPBOARD_PROJECT_ID`, `CUPBOARD_HOUSEHOLD_ID`, `CUPBOARD_INGREDIENT_MAP_JSON`, ingredient mapping and least-privilege cross-project access. A previous preflight found 11 unmapped ingredients; re-run current preflight to establish current status. Do not state the stock integration is live until import, mappings, permissions and end-to-end tests are verified.

For all four app responsibilities, launch scripts, safety rules and continuation priorities, read the [PALMI-D3V AI handoff](https://github.com/palmid3v/PALMI-D3V-Connected-Workspace/blob/main/AI-HANDOFF-2026-11-01.md).
