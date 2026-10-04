# CONTEXT — Cupboard

## Identity
- Product: Cupboard
- Repository: `palmid3v/cupboard-palmid3v`
- Owner: PALMI-D3V
- Type: Home-first inventory web application
- Stage: Functional MVP / active development
- Experience: Mobile-first with responsive desktop support
- Current visual direction: dark-only, warm, calm, green-centered

## Product intent

Cupboard helps a household know what it has, find products quickly, and keep portions current without feeling like warehouse-management software.

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
    ├── inventory.js
    └── migration.js
        └── Firestore
            ├── productCatalog/{barcode}
            ├── households/{householdId}/inventory/{barcode}
            └── households/{householdId}/movements/{movementId}
```

## Data identity

Firestore collection:

```text
products/{barcode}
```

The barcode is the document ID.

Product fields:
- name
- description
- weight
- portions
- imageUrl
- createdAt
- updatedAt

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

Cupboard is an active functional MVP. The current priority is polish, reliability, scanner stability, visual consistency, and maintainable documentation.


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
- Existing Firebase users, households, invites, and products are intentionally preserved. No reset has been performed or approved as an operational step yet.

## October 2026 architecture checkpoint

### Approved phases

- 🟢 FASE 1 — Shared product catalog
- 🟢 FASE 2 — Data-model audit
- 🟢 FASE 3 — Inventory service foundation
- 🟢 FASE 4 — Runtime adoption
- 🟢 FASE 5 — Movements
- 🟢 FASE 6 — Rules implementation
- 🟢 FASE 7 — Non-destructive migration tooling
- 🟡 FASE 8 — Regression validation

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

The application now uses dedicated catalog/inventory collections at runtime. Legacy household `products` remains only as migration input until FASE 8 and the reset gate are complete.

### Safety gate

No reset or destructive migration is approved. FASE 9 remains blocked. The explicit gate remains:

> ⚠️ **AHORA SÍ: RESET + MIGRACIÓN**

Only after runtime adoption, movements, Rules, migration preparation, and regression validation pass.