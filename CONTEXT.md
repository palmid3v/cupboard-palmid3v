# CONTEXT — Cupboard

## Identity
- Product: Cupboard
- Repository: palmid3v/cupboard-palmid3v
- Owner: PALMI-D3V
- Type: Home-first inventory web application
- Stage: Functional MVP / active development
- Experience: Mobile-first with responsive desktop support

## Product intent

Cupboard helps a household keep track of products and portions with as little friction as possible.

The product should feel like a well-organized home helper, not an enterprise warehouse system.

Core qualities: familiar, calm, practical, organized, quick, approachable.

## Current features
- Firestore-backed inventory
- Search by name/barcode
- All / low-stock / available-stock filters
- Name / stock / recent sorting
- Inventory summary
- Product detail view
- Add/consume portions
- Camera barcode scanning
- Manual barcode entry
- Existing-product lookup
- New-product registration
- Name, description, weight, portions, image URL
- Light/dark/system themes
- Local theme persistence
- PWA configuration

## Stack

React 19 · Vite 8 · Tailwind CSS 4 · Firebase 12 · Firestore · @zxing/browser · html5-qrcode · vite-plugin-pwa · ESLint 9

## Runtime architecture

```text
UI
└── App.jsx
    ├── Inventory
    ├── Scanner
    ├── Product form
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

Firestore collection: products. Barcode is the document ID.

Product fields are name, description, weight, portions, imageUrl, createdAt, and updatedAt.

## Important behavior

saveProduct checks whether the barcode document exists. Existing documents are updated; new documents receive createdAt and updatedAt.

updatePortions prevents negative quantities.

The scanner prevents repeated handling of the same successful scan during one scanner session and attempts continuous focus when supported.

Theme preference is stored under the localStorage key cupboard-theme.

## Known boundaries

Authentication, multi-user households, permissions, expiry, product history, shopping lists, recipes, meal planning, analytics, external product databases, and automatic image lookup are outside the current implementation.

## Documentation rule

When documentation conflicts with implementation, inspect the code, verify the behavior, then update the documentation. Never document a planned feature as implemented.

See docs/ for product, architecture, data, flows, contribution, roadmap, and design documentation.

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

Cupboard is an active functional MVP. The next stage is product refinement, reliability, and clarity rather than uncontrolled feature growth.