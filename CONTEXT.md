# CONTEXT — Cupboard

## Identity

- Product: Cupboard
- Type: Mobile-first inventory application
- Developer: PALMI-D3V

## Purpose

Fast product registration, barcode scanning, inventory visibility, and portion tracking.

## Current features

- Inventory
- Search/filter/sort
- Barcode scanning
- Manual barcode entry
- Add/consume portions
- Product detail
- Product image URL
- Low-stock filtering
- Light/dark/system themes
- Firestore persistence
- PWA configuration

## Scanner

Dependencies include @zxing/browser and html5-qrcode.

## Data layer

Firestore collection: products.

Barcode is the document ID.

Main service operations:
- getProduct
- saveProduct
- getAllProducts
- updatePortions

## Stack

React 19 · Vite 8 · Tailwind CSS 4 · Firebase / Firestore · vite-plugin-pwa.

## PWA

Standalone behavior is configured. Final install-icon work remains.

## Development

~~~bash
cd app
npm install
npm run dev
npm run lint
npm run build
npm run preview
~~~

## Boundary

Authentication, multi-user inventory, expiry, movement history, shopping workflows, and advanced analytics are outside the current core scope.

## Status

Active local-first inventory application.
