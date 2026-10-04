# 🗄️ Cupboard

Cupboard is a home-first inventory app for keeping products in a kitchen or household organized without turning the experience into a complicated management system.

> Product direction: hommie · familiar · calm · organized · practical

## What Cupboard is

Cupboard helps people know what they have, find it quickly, and keep quantities up to date.

Current capabilities include:
- 📦 inventory visibility
- 📷 barcode scanning
- ⌨️ manual barcode entry
- 📝 product registration
- 🔎 search, filtering, and sorting
- ➕ adding portions
- ➖ consuming portions
- 🧾 product details
- 🖼️ optional product image URLs
- ⚠️ low-stock visibility
- 🌓 light, dark, and system themes
- 📱 PWA configuration

## Current status

**Active functional MVP / active development.**

The current implementation has a React/Vite frontend, Firestore persistence, barcode scanning, responsive inventory workflows, theme preferences, and PWA configuration.

Some product areas remain outside the current scope. See [ROADMAP.md](docs/ROADMAP.md).

## 🧭 Product philosophy

Cupboard should feel friendly, calm, fast, organized, and appropriate for a home or family.

It is not intended to feel like warehouse-management software.

See [PRODUCT.md](docs/PRODUCT.md) and [DESIGN_PRINCIPLES.md](docs/DESIGN_PRINCIPLES.md).

## ✨ Current functionality

### Inventory
- Load products from Firestore
- Search by product name or barcode
- Filter all / low stock / available stock
- Sort by name, stock level, or recent update
- Show inventory summaries
- Open product details
- Add or consume one portion

### Product registration
Products can be registered through camera barcode scanning or manual barcode entry.

Current fields:
- name
- description
- weight in grams
- portions
- optional image URL

### Barcode scanner
The scanner uses @zxing/browser and browser camera access. It prevents duplicate handling during one scan session and attempts continuous focus when supported.

### Themes
Light, dark, and system themes are supported. The selected preference is stored locally in the browser.

### PWA
vite-plugin-pwa is configured with standalone behavior and auto-update registration. The manifest icon list is currently empty, so PWA icon finalization remains pending.

## 🛠️ Technology

| Technology | Purpose |
| --- | --- |
| React 19 | UI and application state |
| Vite 8 | Development/build tooling |
| Tailwind CSS 4 | Styling |
| Firebase 12 | Backend SDK |
| Firestore | Product persistence |
| @zxing/browser | Barcode scanning |
| html5-qrcode | Scanner dependency currently present |
| vite-plugin-pwa | PWA generation |
| ESLint 9 | Code quality |

See [ARCHITECTURE.md](docs/ARCHITECTURE.md).

## 📁 Repository structure

```text
cupboard-palmid3v/
├── README.md
├── CONTEXT.md
├── docs/
│   ├── PRODUCT.md
│   ├── ARCHITECTURE.md
│   ├── DATA_MODEL.md
│   ├── USER_FLOWS.md
│   ├── CONTRIBUTING.md
│   ├── ROADMAP.md
│   └── DESIGN_PRINCIPLES.md
├── app/
│   ├── README.md
│   ├── package.json
│   ├── vite.config.js
│   └── src/
└── archive/
```

## 🚀 Development

```bash
cd app
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

## 🔥 Data

Firestore uses a products collection. The barcode is the document ID.

Main service operations:
- getProduct(barcode)
- saveProduct(barcode, data)
- getAllProducts()
- updatePortions(barcode, newPortions)

See [DATA_MODEL.md](docs/DATA_MODEL.md).

## 🧩 Documentation map

| Document | Purpose |
| --- | --- |
| [PRODUCT.md](docs/PRODUCT.md) | Product vision and scope |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Technical architecture |
| [DATA_MODEL.md](docs/DATA_MODEL.md) | Firestore model |
| [USER_FLOWS.md](docs/USER_FLOWS.md) | Main user flows |
| [DESIGN_PRINCIPLES.md](docs/DESIGN_PRINCIPLES.md) | Visual and UX direction |
| [CONTRIBUTING.md](docs/CONTRIBUTING.md) | How to modify the project |
| [ROADMAP.md](docs/ROADMAP.md) | Current, pending, and future work |
| [CONTEXT.md](CONTEXT.md) | Consolidated project context |

## 📌 Current boundaries

Authentication, multi-user households, expiry tracking, movement history, shopping workflows, recipes, meal planning, advanced analytics, and automatic product catalog enrichment are not current core features.

**PALMI-D3V · Cupboard · Documentation refreshed October 2026**