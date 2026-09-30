# 🗄️ Cupboard — App Context

## 🎯 Purpose
Inventory management focused on fast product registration, barcode scanning, stock visibility, and portion tracking.

## ✨ Current features
- 📦 Inventory
- 🔎 Search/filter/sort
- 📷 Barcode scanning
- ⌨️ Manual barcode entry
- ➕ Add portions / ➖ consume portions
- 🧾 Product detail
- 🖼️ Product image URL
- ⚠️ Low-stock filtering
- 🌓 Light/dark/system themes
- 🔥 Firestore persistence
- 📱 PWA configuration

## 📷 Scanner
The dependency set includes `@zxing/browser` and `html5-qrcode`. The scanner supports existing-product lookup and new-product registration flow.

## 🔥 Data layer
Firestore collection: `products`. Barcode is used as the document ID.

Main service operations: `getProduct`, `saveProduct`, `getAllProducts`, `updatePortions`.

## 🧱 Stack
React 19 · Vite 8 · Tailwind CSS 4 · Firebase 12 · Firestore · vite-plugin-pwa.

## 📱 PWA boundary
Standalone PWA behavior is configured, but the manifest icon set still needs finalization.

## ▶️ Commands
```bash
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

## 📌 Status
Active local-first inventory application; authentication, multi-user inventory, expiry workflows, movement history, shopping workflows, and advanced analytics are outside the current core scope.