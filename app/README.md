# Cupboard App

This directory contains the runnable React/Vite application.

Start with [../README.md](../README.md) for the product and repository overview.

## Responsibilities

The app currently owns:
- inventory presentation;
- product registration;
- barcode scanning;
- product lookup;
- portion changes;
- search/filter/sort;
- product detail state;
- settings presentation;
- responsive navigation;
- PWA configuration.

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
    │   ├── products.js
    │   ├── auth.js
    │   ├── households.js
    │   └── features.js
    └── assets/
```

## Main files

### `src/App.jsx`

The current application shell and most UI state live here.

It coordinates:
- inventory loading;
- search, filters, and sorting;
- product detail state;
- optimistic portion changes;
- scanner flow;
- product lookup and registration;
- form validation;
- settings presentation;
- responsive navigation.

The file is intentionally still a large MVP shell and is a future refactoring point.

### `src/components/BarcodeScanner.jsx`

Owns camera/scanner behavior:
- camera startup;
- stream cleanup;
- successful-scan deduplication;
- retry/restart;
- camera error states;
- continuous focus when supported.

It communicates successful scans through `onScan(code)`.

### `src/services/products.js`

The Firestore data-access boundary.

Current operations:

```js
getProduct(barcode)
saveProduct(barcode, data)
getAllProducts()
updatePortions(barcode, newPortions)
```

Prefer this boundary instead of scattering Firestore calls throughout the UI.

### `src/firebase.js`

Initializes Firebase Authentication and Firestore.

Firebase Storage is intentionally not initialized because product image uploads are deferred. Remote image URLs remain supported. Product images currently use remote URLs.

## Vite and PWA

`vite.config.js` configures React, local SSL, Tailwind CSS, and `vite-plugin-pwa`.

Local SSL is useful for development scenarios where browser camera APIs require a secure context.

The PWA uses standalone display and auto-update registration. The final icon set is still pending.

## Commands

```bash
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

## Working rules

Before changing behavior, read the relevant document in `../docs/`.

- Data behavior → `DATA_MODEL.md`
- UI/UX → `DESIGN_PRINCIPLES.md`
- User flow → `USER_FLOWS.md`
- Architecture → `ARCHITECTURE.md`
- Planned work → `ROADMAP.md`

After meaningful code changes:
1. run lint;
2. run build;
3. manually test the affected flow;
4. update documentation if behavior changed.

## Important implementation rule

The green **Inventario conectado** indicator is backed by Firestore snapshot metadata and browser online/offline events.

Product image uploads are intentionally out of scope until Firebase Storage is enabled.


## Access model

New accounts join an existing household through an owner-generated invitation. The household owner is the general administrator and new invitations create members only.
