# 🗄️ Cupboard

Cupboard is a home-first inventory app for keeping products in a kitchen or household organized without turning the experience into a complicated management system.

> Product direction: **hommie · familiar · calm · organized · practical**

## Current status

**Functional MVP · active development**

The repository currently contains a React/Vite application with Firestore persistence, browser barcode scanning, manual barcode registration, responsive inventory workflows, optimistic portion updates, a custom dark UI, and PWA configuration.

The source of truth for behavior is the code in `app/src/`. Documentation is synchronized with the implemented behavior and separates **current**, **pending**, and **future** work.

## What Cupboard does today

### Inventory
- 📦 Loads products from Firestore.
- 🔎 Searches by product name or barcode.
- 🏷️ Filters **Todos / Stock bajo / Disponibles**.
- ↕️ Sorts by **Nombre A-Z / Más recientes / Menor stock / Mayor stock**.
- 📊 Shows inventory summaries.
- 🧾 Opens product details.
- ➕ Adds one portion.
- ➖ Consumes one portion.
- ⚡ Updates the visible quantity optimistically without reloading the whole inventory.
- ↩️ Rolls the UI back if the Firestore update fails.

### Product registration
Products can be registered through:
- 📷 camera barcode scanning;
- ⌨️ manual barcode entry.

Current product fields:
- name
- description
- weight in grams
- portions
- optional image URL

A barcode is the Firestore document identity.

### Barcode scanner
The scanner uses `@zxing/browser` and browser camera access.

Current scanner behavior includes:
- one successful scan per scanner session;
- camera stream cleanup;
- safe restart/retry behavior;
- protection against overlapping scanner sessions;
- continuous focus when supported by the device;
- dedicated permission, missing-camera, and camera-busy messaging;
- a visual scanning frame and detected-code state.

ZXing can emit non-fatal errors while it is looking for a barcode. Those callback errors are intentionally not shown as repeated user-facing failures.

### Product images
Product images are optional URLs supplied with the product.

Cards keep a fixed visual image area and contain the supplied image inside a bounded product-photo frame so very different source images do not change the card layout.

Cupboard does **not** currently download, normalize, remove backgrounds from, or automatically enrich product images.

### Theme
The current application uses a **dark-only Cupboard visual theme**. The settings screen presents this as a fixed theme.

There is no implemented light/dark/system theme switch in the current UI.

### PWA
`vite-plugin-pwa` is configured for standalone behavior and auto-update registration.

PWA icon finalization remains pending because the manifest icon list is not yet complete.

## 🔌 What “Inventario conectado” means

The green **Inventario conectado / ACTIVO** indicator is currently a **UI status indicator**, not a live Firestore connectivity monitor.

It does **not** currently:
- listen for Firebase connection state;
- run a health check;
- use `navigator.onLine`;
- prove that Firestore is reachable at that exact moment.

The actual data connection happens when the application calls the Firestore service functions in `app/src/services/products.js`.

This distinction is intentional: **do not treat the current green indicator as a real-time connectivity guarantee.**

A future connectivity state can be implemented separately if the product needs offline/online visibility.

## 🧱 Architecture at a glance

```text
Browser
  │
  ▼
React UI
  │
  └── App.jsx
       ├── Inventory
       ├── Scanner flow
       ├── Product registration
       └── Settings
             │
             ├── BarcodeScanner.jsx
             │      └── @zxing/browser
             │
             └── services/products.js
                    └── Firebase Firestore
                           └── products/{barcode}
```

The application intentionally has no separate backend API layer.

## 🛠️ Technology

| Technology | Purpose |
| --- | --- |
| React 19 | UI and application state |
| Vite 8 | Development/build tooling |
| Tailwind CSS 4 | Styling |
| Firebase 12 | Firebase SDK |
| Firestore | Product persistence |
| @zxing/browser | Barcode scanning |
| html5-qrcode | Present dependency; not the active scanner boundary |
| vite-plugin-pwa | PWA generation |
| ESLint 9 | Code quality |

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
│   ├── DESIGN_PRINCIPLES.md
│   ├── CONTRIBUTING.md
│   └── ROADMAP.md
├── app/
│   ├── README.md
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── firebase.js
│       ├── index.css
│       ├── components/
│       │   └── BarcodeScanner.jsx
│       └── services/
│           └── products.js
└── archive/
```

## 🚀 Local development

From the repository root:

```bash
cd app
npm install
npm run dev
```

Quality checks:

```bash
npm run lint
npm run build
npm run preview
```

The development configuration includes local SSL support, which is useful because browser camera APIs require a secure context.

## 🔥 Firestore data layer

The current collection is:

```text
products/{barcode}
```

Service boundary:

```js
getProduct(barcode)
saveProduct(barcode, data)
getAllProducts()
updatePortions(barcode, newPortions)
```

Keep Firestore access behind this service boundary where practical.

## 📚 Documentation map

| Document | Purpose |
| --- | --- |
| [PRODUCT.md](docs/PRODUCT.md) | Product purpose, audience, promise, and boundaries |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Runtime architecture and technical boundaries |
| [DATA_MODEL.md](docs/DATA_MODEL.md) | Firestore product model and persistence behavior |
| [USER_FLOWS.md](docs/USER_FLOWS.md) | Implemented user journeys and interaction states |
| [DESIGN_PRINCIPLES.md](docs/DESIGN_PRINCIPLES.md) | Visual, UX, responsive, and accessibility direction |
| [CONTRIBUTING.md](docs/CONTRIBUTING.md) | How another developer should modify the project |
| [ROADMAP.md](docs/ROADMAP.md) | Current, pending, and future work |
| [CONTEXT.md](CONTEXT.md) | Compact project context for handoff |

## 🚧 Current boundaries

The following are **not implemented**:
- authentication;
- multi-user households;
- permissions;
- offline-first inventory;
- live connectivity monitoring;
- expiry tracking;
- movement/history tracking;
- shopping lists;
- recipes or meal planning;
- analytics;
- external product catalog enrichment;
- automatic product image lookup/background removal.

## Development principle

Cupboard should remain understandable.

Prefer small, explicit changes that improve the household inventory experience over adding infrastructure or abstractions simply because larger applications commonly use them.

---

**PALMI-D3V · Cupboard · README synchronized with the October 2026 implementation**
