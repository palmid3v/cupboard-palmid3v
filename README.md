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
- ✨ Opens an animated product detail experience with stock, expiry, weight, barcode, category, and minimum-stock context.
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
- category
- expiry date
- minimum stock threshold

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

Cupboard can enrich products from an external barcode catalog. Product images are currently handled through remote image URLs; local file uploads are deferred until Firebase Storage is enabled.

### Theme
The current application uses a **dark-only Cupboard visual theme**. The settings screen presents this as a fixed theme.

There is no implemented light/dark/system theme switch in the current UI.

### PWA
`vite-plugin-pwa` is configured for standalone behavior and auto-update registration.

PWA icon finalization remains pending because the manifest icon list is not yet complete.

## 🔌 What “Inventario conectado” means

The **Inventario conectado** treatment is now a real Firestore/inventory availability indicator.

It exposes three runtime states:
- 🟢 **Inventario conectado** — Firestore available.
- 🟡 **Sin conexión** — showing locally available data from the Firestore cache.
- 🔴 **No se pudo conectar** — Firestore could not be reached; review the connection.

The app also listens to `navigator.onLine` so the UI can react immediately when the browser loses or regains network access. Firestore metadata (`fromCache`) is used to distinguish server-backed snapshots from cached data.

The web client uses persistent Firestore local cache, so previously used inventory data can remain available offline and synchronize when connectivity returns. Authenticated users work inside a household-scoped inventory, with role-aware access and real online/offline/error states.

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
             └── services/
       ├── products.js
       ├── auth.js
       ├── households.js
       └── features.js
                    └── Firebase
                           ├── Authentication
                           └── Firestore
                                └── households/{householdId}/inventory/{barcode}
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
│   ├── SECURITY.md
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

The active runtime data model is split by responsibility:

```text
productCatalog/{barcode}
households/{householdId}/inventory/{barcode}
households/{householdId}/movements/{movementId}
```

The legacy `households/{householdId}/products/{barcode}` collection remains only as migration input.

Authentication and membership are stored under users/{uid} and households/{householdId}/members/{uid}. Firestore access requires a verified Firebase Authentication email.

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

The original MVP boundaries have now been implemented as the next Cupboard foundation:

- ✅ authentication with Firebase Authentication;
- ✅ multi-user households with admin/editor roles and invitation codes;
- ✅ Firestore Security Rules for household-scoped access;
- ✅ offline-first Firestore persistence;
- ✅ live connectivity monitoring with connected/offline/error states;
- ✅ expiry dates and low-stock thresholds;
- ✅ movement/history tracking;
- ✅ shopping lists;
- ✅ recipe storage;
- ✅ basic inventory analytics;
- ✅ external barcode catalog enrichment;
- ✅ automatic product image lookup;
- 🟡 production rollout requires Email/Password Authentication, verified owner/member emails, and deployment of the committed Firebase Security Rules.
- ⏸️ Firebase Storage uploads are intentionally deferred until a paid/billing-enabled Firebase plan is acceptable; image URLs remain supported.

## Development principle

Cupboard should remain understandable.

Prefer small, explicit changes that improve the household inventory experience over adding infrastructure or abstractions simply because larger applications commonly use them.

---

**PALMI-D3V · Cupboard · README synchronized with the October 2026 implementation**


## 🔐 Access model and administration

Cupboard now uses invitation-only household access. The household owner is the **Administrador general / Propietario** and is the only person allowed to generate new access codes. New invited accounts enter as `member`; they cannot generate invitations or promote themselves. Registration without an invitation code is rejected.

The owner can manage this from **Centro → Equipo**, including the local Firestore connection controls. Every account must verify its email before household data can be read or written.

### 🟢 Firestore connection control

The owner can see whether this browser is connected, connecting, offline/cache-backed, or in an error state. The owner can explicitly connect or disconnect this browser's Firestore network access. This does **not** shut down Firebase for other users. Firestore supports persistent local cache and explicit network enable/disable controls. citeturn7search0

The main inventory indicator uses browser network state plus Firestore snapshot metadata to distinguish server-backed data from cached data. citeturn8search0

## 📧 Email verification

Cupboard now sends a Firebase verification email when an account is created and blocks household access until the address is verified. The verification screen supports resend and an explicit **Ya verifiqué mi correo** check. The pending invitation remains in local storage until verification completes, so the invite flow can resume without asking the user to enter the code again.


## 🏷️ Shared barcode catalog

Cupboard now distinguishes between **product identity** and **household inventory**.

- `productCatalog/{barcode}` stores reusable product metadata.
- `households/{householdId}/products/{barcode}` stores the current household's stock and household-specific fields.
- Scanning first checks the current household, then the shared catalog, then treats the barcode as a new product.
- A known catalog product can be added to a household without re-entering its identity information.
- The owner can seed the current inventory into the shared catalog from **Centro → Catálogo → Preparar catálogo**.

The current household product collection is intentionally preserved during this development phase. The final migration to the dedicated household `inventory` model will happen only after the explicit reset + migration gate is reached.

### ⚠️ Reset gate

No reset is currently authorized.

The destructive reset will happen only after the migration path and regression tests are ready and the project explicitly reaches:

> **⚠️ AHORA SÍ: RESET + MIGRACIÓN**

At that point the existing product data will be preserved as canonical catalog data and migrated into the new household inventory model before old structures are removed.

## 🧭 October 2026 — approved inventory architecture

Cupboard is now transitioning from the mixed household product model to a separated catalog/inventory model.

### Current

```text
productCatalog/{barcode}
        +
households/{householdId}/products/{barcode}  ← legacy live dataset
```

### Target

```text
productCatalog/{barcode}
        │
        ▼
households/{householdId}/inventory/{barcode}
        │
        ▼
households/{householdId}/movements/{movementId}
```

### New service foundation

The repository now contains:

```text
app/src/services/inventory.js
```

with:

```js
getInventoryProduct(barcode)
getAllInventory()
subscribeToInventory(onData, onError)
saveInventoryProduct(barcode, data)
updateInventoryPortions(barcode, newPortions)
```

The inventory service is now the runtime source of truth. Existing household products are preserved only as migration input while FASE 8 regression is completed.

### Step-by-step guide

The operational roadmap is now stored at the repository root:

```text
STEP-BY-STEP-CUPBOARD-2026-10-04.md
```

Use that document as the checklist for the architecture migration.

### Current phase status

- 🟢 FASE 1 — Catalog: approved.
- 🟢 FASE 2 — Audit: approved.
- 🟢 FASE 3 — Inventory foundation: approved.
- 🟢 FASE 4 — Runtime adoption.
- 🟢 FASE 5 — Movements.
- 🟢 FASE 6 — Rules implementation.
- 🟢 FASE 7 — Migration tooling.
- 🟡 FASE 8 — Regression validation.
- 🔴 Reset + migration: blocked.

> ⚠️ **AHORA SÍ: RESET + MIGRACIÓN** is not authorized yet.

The repository is intentionally preserving the current Firebase data until the migration procedure and regression suite are ready.

## 🧭 October 2026 migration tooling

Owner-only migration controls are available under **Centro → Catálogo**.

The workflow is intentionally non-destructive:

1. Analyze the legacy `products` collection.
2. Show missing catalog/inventory target records.
3. Copy only missing target records.
4. Verify target coverage.
5. Leave legacy products untouched.

The migration tool is idempotent and does not authorize the destructive reset. FASE 9 remains blocked until FASE 8 regression passes.

### Firebase Rules deployment

Rules are versioned in `firestore.rules` but are not deployed by `npm run dev`.

Deploy manually:

```powershell
firebase deploy --only firestore:rules
```

After deployment, validate owner/editor/member access, verified-email enforcement, inventory writes, movement writes, and denied non-member access before marking regression complete.

