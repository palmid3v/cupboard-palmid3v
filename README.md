# 🗄️ Cupboard

Cupboard is a home-first inventory app for keeping products in a kitchen or household organized without turning the experience into a complicated management system.

> Product direction: **hommie · familiar · calm · organized · practical**

## Current status

**Functional MVP · active development · real-device validation in progress**

The repository currently contains a React/Vite application with Firestore persistence, browser barcode scanning, manual barcode registration, responsive inventory workflows, optimistic portion updates, a custom dark UI, and PWA configuration.

The source of truth for behavior is the code in `app/src/`. Documentation is synchronized with the implemented behavior and separates **current**, **pending**, and **future** work. The active priority is reliability of the scan → recognize → save → inventory loop, especially on real mobile devices.

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
The current application uses a **dark-only Retro-Digital visual theme**.

The visual language uses:
- deep black / blue-black surfaces;
- white text;
- electric blue primary actions;
- explicit state colors;
- monospace typography;
- rectangular controls and minimal radii;
- restrained hard shadows;
- subtle digital grid texture.

There is no light/dark/system theme switch.

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
       ├── InventoryView.jsx
       ├── ScannerView.jsx
       ├── ProductForm.jsx
       ├── SettingsPanel.jsx
       └── hooks/
            ├── useInventorySubscription.js
            └── useCupboardSettings.js
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

The retired mixed household product model is no longer part of the runtime.

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

Implemented foundation:

- ✅ Firebase Authentication and email verification;
- ✅ invitation-only households and role-aware membership;
- ✅ Firestore Security Rules;
- ✅ shared catalog + household inventory separation;
- ✅ movement/history records;
- ✅ offline/cache-backed Firestore behavior;
- ✅ expiry tracking;
- ✅ shopping list;
- ✅ recipe storage;
- ✅ basic analytics;
- ✅ external barcode catalog lookup;
- ✅ remote image URLs;
- ✅ scanner startup-race protection and retry;
- ✅ responsive mobile/desktop inventory flow;
- ✅ false-success save-flow fix.

Pending:

- 🟡 broader iOS/Safari and Android scanner coverage;
- 🟡 camera focus/positioning UX hardening;
- 🟡 role-aware write guidance;
- 🟡 finer-grained save/error states;
- 🟡 reduce N+1 catalog hydration reads;
- 🟡 automated Firebase Rules/Auth regression coverage;
- 🟡 final PWA icon/install/update validation;
- 🟡 deeper offline/reconnect/conflict testing.

Deferred:

- ⏸️ Firebase Storage uploads until a billing-enabled Firebase plan is acceptable.


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

Cupboard separates **product identity** from **household inventory**.

- `productCatalog/{barcode}` stores reusable product metadata.
- `households/{householdId}/inventory/{barcode}` stores household-specific stock and state.
- `households/{householdId}/movements/{movementId}` stores inventory history.
- Scanning checks household inventory first, then the shared catalog, then treats the barcode as new.
- A known catalog product can be added to a household without duplicating canonical identity data.
- The owner can prepare the shared catalog from current inventory through **Centro → Catálogo**.

## 🧭 October 2026 — final architecture

```text
productCatalog/{barcode}
        │
        ▼
households/{householdId}/inventory/{barcode}
        │
        ▼
households/{householdId}/movements/{movementId}
```

The catalog/inventory migration has completed. The former mixed household product model is no longer used by the runtime or Firestore Rules.

### Phase status

- 🟢 FASE 1 — Shared catalog
- 🟢 FASE 2 — Data-model audit
- 🟢 FASE 3 — Inventory foundation
- 🟢 FASE 4 — Runtime adoption
- 🟢 FASE 5 — Movements
- 🟢 FASE 6 — Rules
- 🟢 FASE 7 — Migration tooling
- 🟢 FASE 8 — Regression
- 🟢 FASE 9 — Reset + migration
- 🟢 FASE 10 — Cleanup
- 🟢 FASE 11 — Scanner startup reliability foundation
- 🟢 FASE 12 — Save-flow correctness foundation
- 🟢 FASE 13 — Role-aware inventory UX
- 🟢 FASE 14 — Save states and error taxonomy
- 🟢 FASE 15 — Performance
- 🟢 FASE 16 — Offline/PWA hardening
- 🟢 FASE 17 — Automated regression coverage
- 🟢 FASE 18 — Incremental architecture extraction
- 🟢 FASE 19 — Retro-Digital / modern 8-bit visual redesign
- 🟢 FASE 20 — Settings & user preferences

### Firebase Rules deployment

Rules are versioned in `firestore.rules` but are not deployed by `npm run dev`.

Deploy manually:

```powershell
firebase deploy --only firestore:rules
```

After deployment, validate owner/editor/member access, verified-email enforcement, inventory writes, movement writes, and denied non-member access.

## 🧭 FASE 10 — cleanup completed

FASE 10 removed the migration-only UI and service, retired the obsolete household product Rules boundary, and synchronized the documentation with the final runtime model.

The remaining work is normal product maintenance: scanner/browser coverage, PWA verification, offline-sync polish, architecture extraction, and future household workflows.

## October 4, 2026 checkpoint

Today's reliability work added scanner startup-race protection, explicit interrupted-camera recovery, real-device iPhone barcode validation, and a save-flow fix that prevents a secondary refresh problem from being reported as a primary write failure.

Relevant commits:
- `ea5eddf52e6b93f1b0c906ff59c116a0b2fdd996` — prevent camera startup race
- `c31341e5e02cbae651c9807c4d606fe9910ba98e` — surface interrupted camera errors
- `437fedabbfd648b23a5f2f4db9aa7bedfb3eafdb` — avoid false product save errors

The next phases are FASE 13–18 in `docs/ROADMAP.md` and `STEP-BY-STEP-CUPBOARD-2026-10-04.md`.



# 7. October 5, 2026 — Settings & user preferences

## FASE 19 — Settings & user preferences

Settings is now formally defined as the **personal behavior and preference center** of Cupboard.

```text
Inventario = qué tengo
Scanner    = qué estoy agregando
Centro     = qué puedo hacer con mi inventario
Ajustes    = cómo quiero que Cupboard funcione para mí
```

### Settings v1

**Cuenta**
- Current account identity.
- Email verification status.
- Logout/session.

**Inventario**
- Default minimum stock for newly registered products.
- Default sort: Nombre A-Z / Más recientes / Menor stock / Mayor stock.
- Default filter: Todos / Stock bajo / Disponibles.

**Apariencia**
- Cupboard Dark remains fixed.
- No Light/System selector.

**Aplicación**
- Version/application information.
- PWA information only when the state is accurate.

### Persistence

Start with local persistence for personal preferences:

```text
cupboard.settings
├── minStockDefault
├── inventorySort
└── inventoryFilter
```

Cross-device synchronization is out of scope for v1.

### Important inventory consistency rule

The current default minimum stock is **5**. When Settings makes this configurable:

- new products inherit the configured default;
- existing products retain their stored `minStock`;
- all user-facing low-stock checks must use the product threshold where available;
- hard-coded `portions <= 5` comparisons must be audited.

### Outside Settings

Household invitations, roles, membership, Firestore connection controls, shared catalog administration, analytics, shopping, recipes, expiry, and movement history remain in **Centro**.

Notifications are also out of scope until a real notification system exists.

### Acceptance criteria

- Settings contains no fake controls.
- Account state comes from Firebase Auth.
- Logout works.
- Default min stock persists and is used for new products.
- Existing product thresholds are not overwritten.
- Sort/filter preferences persist.
- Dark theme remains unchanged.
- Low-stock UI is consistent with product `minStock`.
- Centro remains the operational/admin workspace.
- `npm run lint` and `npm run build` pass.


## October 5, 2026 — FASE 13–16 hardening checkpoint

The hardening branch `feature/phases-13-16-hardening` implements the approved FASE 13–16 foundation:

- role-aware inventory write UX for owner/editor/member;
- explicit permission, network, unknown and saving states;
- product-level read-only behavior for members;
- Firestore pending-write/synchronization visibility;
- reconnect handling that distinguishes intentional Firestore disconnect from temporary cache state;
- session-scoped catalog metadata caching to reduce repeated catalog reads during realtime hydration;
- PWA Workbox cache cleanup and dark manifest colors.

The branch still requires lint/build and real-device/offline validation before merge.


## October 5, 2026 — FASE 19–20 checkpoint

### FASE 19
Cupboard now uses the approved Retro-Digital / modern 8-bit visual direction without changing the React, Vite, Firebase, Firestore, ZXing, or PWA stack.

### FASE 20
Settings now provides:
- Firebase account identity and verification state;
- logout;
- default minimum stock for new products;
- persistent inventory sort and filter preferences;
- fixed Cupboard Dark theme;
- application version and PWA state.

Preferences are stored locally under `cupboard.settings`. Existing product `minStock` values are preserved.

CI validation remains the source of truth for lint, build, and automated regression status.
