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
                    └── Firebase
                           ├── Authentication
                           └── Firestore
                                └── households/{householdId}/products/{barcode}
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

`src/firebase.js` initializes Firebase and exports Authentication and Firestore instances.

Firebase Authentication now gates the application. Email/password accounts identify each user, while Firestore member documents provide household roles.

### Connectivity status

The UI exposes a real inventory connectivity state based on browser network events and Firestore snapshot metadata.

Current states:
- 🟢 **Inventario conectado** — the active inventory listener has received server-backed data.
- 🟡 **Sin conexión** — the browser is offline or Firestore is serving the inventory from local cache.
- 🔴 **No se pudo conectar** — the inventory listener returned a connection/access error.

Implementation boundaries:
- `src/firebase.js` enables persistent Firestore local cache.
- `src/services/products.js` exposes `subscribeToProducts()` using `onSnapshot(..., { includeMetadataChanges: true })`.
- `src/App.jsx` combines Firestore metadata with `navigator.onLine` and renders the state.
- The listener is recreated when the browser reports that connectivity has returned.

This is intentionally a lightweight connectivity layer, not a separate health-check service.

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

Authentication and household-scoped authorization are now implemented. Firestore Security Rules enforce membership and role-aware access.

Firebase Storage is intentionally not part of the current runtime because image uploads are deferred until a billing-enabled plan is acceptable.

## Architectural rule

> **Keep the current system understandable.**

Do not add a backend, state-management library, database layer, or service architecture simply because larger applications commonly use one.


## Feature foundation

Cupboard now contains a shared operations layer for expiry tracking, movement/history, shopping lists, recipes, inventory analytics, barcode catalog enrichment, household invitations, and role-aware membership. Product images currently use remote URLs; Firebase Storage uploads are deferred.

The UI exposes these capabilities through `WorkspacePanel.jsx`, while data access remains behind service boundaries in `src/services/`.

## Motion system

The UI uses lightweight CSS animations for page entry, ambient background orbs, status transitions, and interactive elevation. Reduced-motion preferences disable non-essential animations.


## Authentication and ownership

The household owner is the general administrator. New registrations require an invitation and new invitations grant member access only. Firestore Rules protect role and household ownership fields from self-editing.

## Owner connection controls

WorkspacePanel exposes owner-only controls for generating invitation codes and enabling or disabling the Firestore network connection for the current browser. This is a client-local control, not a global Firebase shutdown. Cached data remains available while the network is disabled.
