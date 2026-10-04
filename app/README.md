# Cupboard App

This directory contains the runnable React/Vite application.

For project context, start with [../README.md](../README.md).

## Responsibilities
- inventory presentation
- product registration
- barcode scanning
- product lookup
- portion changes
- search/filter/sort
- theme selection
- responsive navigation
- PWA configuration

## Source structure

```text
app/
├── package.json
├── vite.config.js
├── public/
└── src/
    ├── App.jsx
    ├── App.css
    ├── index.css
    ├── main.jsx
    ├── firebase.js
    ├── components/
    │   └── BarcodeScanner.jsx
    ├── services/
    │   └── products.js
    └── assets/
```

## Main files

### src/App.jsx
The current application shell and most UI state live here. It coordinates views, inventory loading, search/filter/sort, scanner flow, product form state, portion updates, and theme preferences.

This file is currently large and is a future refactoring point. Refactor incrementally while preserving existing flows.

### src/components/BarcodeScanner.jsx
Owns camera/scanner behavior, successful-scan handling, focus configuration, and camera error/retry states.

### src/services/products.js
The Firestore data-access boundary.

Current operations:
```js
getProduct(barcode)
saveProduct(barcode, data)
getAllProducts()
updatePortions(barcode, newPortions)
```

Prefer this service boundary instead of scattering Firestore calls throughout UI code.

### src/firebase.js
Initializes Firebase and exports the Firestore database instance. Firebase Authentication is not currently implemented.

## Vite and PWA

vite.config.js configures React, basic SSL, Tailwind CSS, and vite-plugin-pwa.

Basic SSL supports local development scenarios where browser camera APIs require a secure context.

The PWA currently uses standalone display and auto-update registration. The manifest icon list is still empty.

## Commands

```bash
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

## Working rules

Before changing behavior, read the relevant documentation in ../docs.

For data changes, read DATA_MODEL.md. For UI changes, read DESIGN_PRINCIPLES.md. For user flows, read USER_FLOWS.md.

Run lint and build after meaningful changes.

Update documentation when behavior changes.