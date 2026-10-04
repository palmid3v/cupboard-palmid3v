# Cupboard — Architecture

## Overview

Cupboard is a small React application with a direct Firestore data layer.

```text
Browser
  │
  ▼
React UI
  │
  └── App.jsx
       ├── Inventory
       ├── Scanner flow
       ├── Product registration
       └── Settings
             │
             ├── BarcodeScanner.jsx
             │      └── @zxing/browser
             │
             └── services/products.js
                    └── Firebase Firestore
                           └── products/{barcode}
```

There is currently no separate backend API layer.

## Frontend boundary

React owns the UI and interaction state.

Most application state and orchestration remain in `src/App.jsx`. This is acceptable for the MVP and is the main architectural refactoring opportunity.

Tailwind CSS 4 provides component styling. Global variables and browser-level styles live in `src/index.css`.

## Scanner boundary

Barcode scanning is isolated in `src/components/BarcodeScanner.jsx`.

Responsibilities:
- request/start the camera;
- stop camera tracks;
- avoid overlapping scanner sessions;
- handle one successful scan per session;
- retry after camera errors;
- attempt continuous focus when supported;
- present camera-specific error states.

The scanner communicates with the parent through:

```js
onScan(code)
```

Camera-specific behavior should remain out of the product data service.

## Data boundary

Firestore access is concentrated in:

`src/services/products.js`

Current API:

```js
getProduct(barcode)
saveProduct(barcode, data)
getAllProducts()
updatePortions(barcode, newPortions)
```

Keep Firestore calls behind this boundary where practical.

## Firebase

`src/firebase.js` initializes Firebase and exports the Firestore instance.

Authentication is not currently part of the application.

### Connectivity status clarification

The UI contains a green **Inventario conectado / Conectado / ACTIVO** treatment.

This is currently presentation only.

There is no:
- Firebase realtime connection listener;
- `navigator.onLine` state integration;
- Firestore health-check request;
- offline cache state exposed to the UI.

Therefore the indicator must not be treated as a connectivity guarantee.

## PWA

PWA behavior is configured in `vite.config.js` using `vite-plugin-pwa`.

Current configuration includes standalone display, auto-update registration, manifest metadata, and theme/background colors.

The final manifest icon set is still pending.

## Local state

Runtime interaction state is managed with React state.

Firestore is the persistent source for products.

The current UI is dark-only.

## Inventory portion flow

The current flow is optimistic:

```text
User taps + / -
       ↓
Calculate next quantity
       ↓
Update React product state immediately
       ↓
Call updatePortions()
       ↓
     success ─────────────→ keep new value
       │
       └── failure ───────→ restore previous value + show error
```

The UI does not reload the entire inventory for each +1/-1 action.

## Scanner data flow

```text
Open Scanner
      ↓
BarcodeScanner starts camera
      ↓
ZXing detects code
      ↓
onScan(code)
      ↓
App.handleScan()
      ↓
getProduct(code)
      ↓
Firestore
      ↓
Existing product OR new-product form
```

## Product save flow

```text
Validate form
      ↓
saveProduct()
      ↓
Firestore create/update
      ↓
Reload inventory
      ↓
Return to inventory
```

Unlike +1/-1, saving a product intentionally reloads inventory because a new/edited product needs to be incorporated into the inventory collection.

## Current debt

### Large App component

`App.jsx` contains substantial UI and state management.

Future decomposition can include inventory components, product form, settings, navigation, product detail, and focused hooks.

Refactor incrementally rather than rewriting the application architecture.

### Firebase configuration

Firebase configuration currently lives directly in `src/firebase.js`.

Before broader deployment, review environment configuration and Firebase security rules.

### Firestore security

There is no authentication/authorization model in the current application.

Before multi-user functionality, define identity, ownership, household membership, read/write permissions, and security rules.

## Architectural rule

> **Keep the current system understandable.**

Do not add a backend, state-management library, database layer, or service architecture simply because larger applications commonly use one.
