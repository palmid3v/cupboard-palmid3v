# 🗄️ Cupboard

Cupboard is a browser-based inventory control application focused on fast product registration, barcode scanning, stock visibility, and portion management.

## ✨ Current Features

- 📦 Inventory view
- 🔎 Search
- 🧮 Filters and sorting
- 📷 Barcode scanning
- ⌨️ Manual barcode entry
- ➕ Add portions
- ➖ Consume portions
- 🧾 Product detail view
- 🖼️ Product image URL support
- ⚠️ Low-stock filtering
- 🌓 Light, dark, and system themes
- 🔥 Firestore persistence
- 📱 PWA configuration

## 📷 Barcode Stack

The current dependency set includes @zxing/browser and html5-qrcode. The scanner can look up an existing product or start a new-product workflow.

## 🔥 Data Model

Firestore uses the products collection and the barcode as the document ID.

~~~text
products/{barcode}
├── name
├── description
├── weight
├── portions
├── imageUrl
├── createdAt
└── updatedAt
~~~

Current operations:
- getProduct
- saveProduct
- getAllProducts
- updatePortions

## 🧱 Stack

- React 19.2.x
- Vite 8.0.1
- Tailwind CSS 4.3.x
- Firebase 12.11.x
- vite-plugin-pwa
- basic SSL plugin

## 🏗️ Architecture

~~~text
Scanner / Manual Entry
        ↓
React application
        ↓
services/products.js
        ↓
Firebase Firestore
~~~

## 📱 PWA

VitePWA is configured with autoUpdate and standalone display. The current manifest still has an empty icons array, so the install icon set remains unfinished.

## ▶️ Scripts

~~~bash
npm install
npm run dev
npm run lint
npm run build
npm run preview
~~~

## 🧭 Current Boundaries

Authentication, multi-user inventory, expiry workflows, movement history, shopping workflows, and richer analytics are not core functionality yet.