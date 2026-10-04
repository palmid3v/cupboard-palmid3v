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
└── services/products.js
    └── Firestore
        └── products collection
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

The sidebar/header connected indicators are currently visual status labels.

They are **not** backed by a live Firebase connection listener or health check.

Actual Firestore availability is discovered when a Firestore operation succeeds or fails.

Do not describe the green indicator as real-time connectivity monitoring.

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
