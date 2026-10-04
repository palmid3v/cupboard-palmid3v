# Cupboard — Architecture

## Overview

Cupboard is currently a small React application with a direct Firestore data layer.

The architecture intentionally stays lightweight.

```text
Browser
  │
  ▼
React UI
  │
  ├── Inventory
  ├── Scanner
  ├── Product form
  └── Settings
  │
  ▼
App.jsx
  │
  ▼
services/products.js
  │
  ▼
Firebase Firestore
  │
  ▼
products collection
```

## Frontend

React owns the UI and local interaction state.

The current application shell is concentrated in src/App.jsx. This is acceptable for the MVP, although it is a future refactoring point.

Tailwind CSS 4 provides styling. Global CSS variables and base styles live in src/index.css.

## Scanner boundary

Barcode scanning is isolated in src/components/BarcodeScanner.jsx.

The scanner communicates with the parent through the onScan(code) callback.

This keeps camera-specific behavior out of the product data service.

## Data boundary

Firestore access is concentrated in src/services/products.js.

Current service API:

```js
getProduct(barcode)
saveProduct(barcode, data)
getAllProducts()
updatePortions(barcode, newPortions)
```

Prefer this boundary instead of placing Firestore calls directly throughout the UI.

## Firebase

Firebase is initialized in src/firebase.js and exports a Firestore instance.

Authentication is not currently part of the application.

## PWA

PWA behavior is configured in vite.config.js using vite-plugin-pwa.

Current configuration includes auto-update registration, standalone display, manifest metadata, and theme/background colors.

The icon list is currently empty.

## Local state

Runtime interaction state is managed with React state.

Theme preference is stored in localStorage under cupboard-theme.

Firestore is the persistent source for products.

## Scanning data flow

```text
User opens Scanner
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
Existing product OR registration form
```

## Portion data flow

```text
User taps + / -
       ↓
App handler
       ↓
updatePortions()
       ↓
Firestore update
       ↓
reload inventory
       ↓
UI reflects new value
```

## Architectural strengths

- simple dependency graph
- clear scanner boundary
- clear Firestore service boundary
- small data model
- easy local development
- no unnecessary backend layer for the current scope

## Current debt

### Large App component

App.jsx contains a significant amount of UI and state management.

Future decomposition can include inventory components, product form, settings, navigation, product detail, and focused hooks.

Refactor incrementally.

### Firebase configuration

Firebase configuration currently lives directly in src/firebase.js.

Before production deployment patterns are expanded, review environment configuration and Firebase security rules.

### Firestore security

The current project does not document an authorization model.

Before multi-user functionality, define identity, ownership, household membership, read/write permissions, and security rules.

## Architectural rule

**Keep the current system understandable.**

Do not add a backend, state-management library, database layer, or service architecture simply because larger applications commonly use one.
