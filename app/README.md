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
cupboard-palmid3v/
├── scripts/
│   └── validate.ps1
├── .github/
│   └── workflows/
│       └── regression.yml
└── app/
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
        │   ├── BarcodeScanner.jsx
        │   ├── InventoryView.jsx
        │   ├── ProductForm.jsx
        │   ├── ScannerView.jsx
        │   └── SettingsPanel.jsx
        ├── hooks/
        │   ├── useInventorySubscription.js
        │   └── useCupboardSettings.js
        ├── services/
        │   ├── products.js
        │   ├── auth.js
        │   ├── households.js
        │   ├── features.js
        │   └── regressionContracts.js
        └── assets/
```

## Main files

### `src/App.jsx`

The application shell lives here and coordinates the extracted UI modules.

It coordinates:
- navigation and view state;
- inventory/product actions;
- scanner workflow orchestration;
- product lookup and registration;
- settings integration;
- responsive navigation.

Inventory presentation, scanner UI, product form, and focused persistence hooks live in dedicated modules created during FASE 18–20.

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

From the repository root:

```powershell
.\scripts\validate.ps1
```

For direct frontend development:

```bash
cd app
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
