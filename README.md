# 🗄️ Cupboard

A mobile-first inventory application for product registration, barcode scanning, portion tracking, search, stock visibility, and local kitchen/household inventory management.

> **Current status:** Active React/Vite inventory application with Firestore persistence, barcode scanning, PWA configuration, and responsive inventory workflows.

## 🎯 Product scope

Cupboard focuses on fast inventory interaction:

- Product registration
- Barcode lookup
- Inventory visibility
- Search/filter/sort
- Portion tracking
- Stock status
- Product details
- Mobile-first usage

## ✨ Current capabilities

- 📦 Inventory view
- 🔎 Search, filters, and sorting
- 📷 Barcode scanning
- ⌨️ Manual barcode entry
- ➕ Add portions
- ➖ Consume portions
- 🧾 Product detail workflow
- 🖼️ Product image URL support
- ⚠️ Low-stock filtering
- 🌓 Light/dark/system themes
- 🔥 Firestore persistence
- 📱 PWA configuration

## 📷 Barcode scanning

The project uses barcode-scanning support through @zxing/browser and html5-qrcode. The scanner supports existing-product lookup and new-product registration flows.

## 🔥 Data model

Firestore uses the products collection with barcode as the document ID.

Main service operations include:

- getProduct
- saveProduct
- getAllProducts
- updatePortions

## 🛠️ Technology

| Technology | Role |
| --- | --- |
| React 19 | UI |
| Vite 8 | Tooling |
| Tailwind CSS 4 | Styling |
| Firebase / Firestore | Persistence |
| @zxing/browser | Barcode scanning |
| html5-qrcode | Scanner support |
| vite-plugin-pwa | PWA |

## 📁 Repository structure

~~~text
cupboard-palmid3v/
├── app/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── README.md
├── archive/
├── CONTEXT.md
└── README.md
~~~

## 📱 PWA boundary

Standalone PWA behavior is configured. The install-icon set remains an area for finalization.

## 🚀 Development

~~~bash
cd app
npm install
npm run dev
npm run lint
npm run build
npm run preview
~~~

## 📌 Project boundary

Authentication, multi-user inventory, expiry workflows, movement history, shopping workflows, and advanced analytics are outside the current core scope.

## 📚 Project context

See CONTEXT.md for the consolidated product, data, scanner, PWA, and architecture context.

---

**PALMI-D3V** · Cupboard · 2026