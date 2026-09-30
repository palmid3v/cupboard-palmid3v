# 🗄️ Cupboard

A browser-based inventory application for registering products, scanning barcodes, tracking portions, and monitoring stock.

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
- 🌓 Light, dark, and system themes
- 🔥 Firestore persistence
- 📱 PWA configuration

## 🧱 Stack

- React 19
- Vite 8
- Tailwind CSS 4
- Firebase / Firestore
- @zxing/browser
- html5-qrcode
- vite-plugin-pwa

## 🏗️ Repository structure

```text
cupboard/
├── app/       # Current application + documentation
└── archive/   # Historical material
```

The active source is under `app/src/` and the data layer is under `app/src/services/`.

## 🔥 Data model

Firestore uses the `products` collection with the barcode as document ID. Product data includes name, description, weight, portions, image URL, and timestamps.

## ▶️ Development

```bash
cd app
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

## 📱 PWA status

PWA support is configured. The current manifest still needs a finalized install-icon set.

## 📌 Project status

The repository has been reorganized around `app/` as the current source of truth and `archive/` as historical material.