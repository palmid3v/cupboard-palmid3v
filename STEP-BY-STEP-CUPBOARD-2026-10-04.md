
# STEP-BY-STEP-CUPBOARD-2026-10-04

Operational history and next-phase implementation checklist for Cupboard.

This file is the chronological handoff document for another developer. Completed architecture work stays visible; new reliability/product work is appended as new phases.

## Final runtime architecture

    productCatalog/{barcode}
            │
            ▼
    households/{householdId}/inventory/{barcode}
            │
            ▼
    households/{householdId}/movements/{movementId}

## Phase history

### 🟢 FASE 1 — Shared product catalog
Completed.

- Defined productCatalog/{barcode} as reusable product identity.
- Kept household-specific stock separate.
- Added catalog lookup/creation service.

### 🟢 FASE 2 — Data-model audit
Completed.

- Audited the previous mixed household product representation.
- Defined responsibilities for catalog, inventory and movements.
- Documented the new model before runtime adoption.

### 🟢 FASE 3 — Inventory foundation
Completed.

- Added services/inventory.js.
- Added household-scoped inventory reads/writes.
- Preserved a small product facade for the UI.

### 🟢 FASE 4 — Runtime adoption
Completed.

- Runtime lookup checks inventory first, catalog second, new third.
- Product save composes catalog and household inventory.
- Inventory subscription hydrates products from catalog metadata.

### 🟢 FASE 5 — Movements
Completed.

- Initial stock and add/consume actions can create movement records.
- Inventory + initial movement can be written atomically in a batch.
- Movement history is household-scoped.

### 🟢 FASE 6 — Firebase Rules
Completed.

- Verified-email requirement enforced in Rules.
- Household membership enforced.
- Owner/editor/member roles enforced.
- Catalog access protected.
- Movement update/delete restricted to owner where applicable.

### 🟢 FASE 7 — Migration tooling
Completed.

- Added non-destructive migration/reset preparation tooling.
- Kept Firebase service-account credentials outside the repository.
- Established explicit destructive-operation safety gates.

### 🟢 FASE 8 — Regression validation
Completed.

Validated core architecture and authorization paths, including:
- owner access;
- invitation flow;
- member onboarding;
- catalog/inventory separation;
- movement writes;
- reset/bootstrap workflows.

### 🟢 FASE 9 — Reset + migration
Completed.

- Reset household/user/invite state under the documented safety gate.
- Preserved shared catalog data.
- Bootstrapped the owner again.
- Re-tested invited-member onboarding.

### 🟢 FASE 10 — Cleanup
Completed.

- Removed migration-only UI.
- Removed migration-only service boundaries.
- Retired the old mixed household product Rules boundary.
- Kept current catalog preparation because it remains a legitimate product workflow.
- Synchronized documentation with the final runtime model.

# New reliability and product phases

## 🟢 FASE 11 — Scanner startup reliability
Completed foundation.

### Problem
ZXing could have overlapping camera startups, especially with React StrictMode, retry actions, or restart tokens.

### Implemented
- serialize asynchronous camera startup;
- cancel obsolete scanner sessions;
- stop previous media tracks;
- prevent duplicate successful scans;
- surface interrupted startup errors;
- support retry without full page reload;
- attempt continuous focus when supported.

### Validation
Real-device testing on October 4 confirmed that the iPhone/camera-to-Windows test path can initialize the scanner and successfully decode a barcode.

### Remaining
- broader iOS/Safari coverage;
- Android coverage;
- camera positioning/focus UX;
- slow-focus behavior when the code remains in frame longer.

## 🟢 FASE 12 — Save-flow correctness
Completed foundation.

### Problem
The previous handleSave catch block covered both the primary Firestore save and a secondary loadProducts refresh.

That allowed:

    saveProduct() ✅
          ↓
    secondary refresh ❌
          ↓
    UI says save failed ❌

### Implemented
- primary save and post-save UI flow are separated;
- removed the unnecessary immediate full inventory reload;
- inventory subscription remains responsible for updating the visible list;
- common permission/network/precondition errors receive dedicated messages;
- a successful product write is no longer judged by a second read.

### Validation
PC testing confirmed the tested product save path completes and the document appears in Firestore.

### Remaining
- clearer catalog-success versus household-inventory failure messaging;
- role-aware write guidance;
- more granular mobile error states.

## 🟡 FASE 13 — Role-aware inventory UX

### Goal
Prevent users from filling the product form only to discover that their household role cannot write inventory.

### Current permission model
- owner/admin → administrative control;
- editor → household inventory writes;
- member → household reads without editor write privileges.

### Planned work
- detect role before entering save flow;
- explain write restrictions before form submission;
- use a dedicated permission state instead of generic save failure;
- keep Firestore Rules as the final authorization boundary.

### Acceptance criteria
- members understand why a write is unavailable;
- editors/admins can save normally;
- client UI never bypasses Rules;
- permission errors remain understandable.

## 🟡 FASE 14 — Save state and error taxonomy

### Goal
Make the save experience explicit and debuggable.

Target states:

    SCANNING
    LOOKING_UP
    FOUND_IN_INVENTORY
    FOUND_IN_CATALOG
    NEW_PRODUCT
    SAVING
    SAVED
    SAVE_PERMISSION_ERROR
    SAVE_NETWORK_ERROR
    SAVE_UNKNOWN_ERROR

### Planned work
- separate scanner, lookup, validation and save errors;
- replace generic error copy with user-oriented messages;
- keep technical detail in console logs;
- make retry actions contextual.

## 🟡 FASE 15 — Performance and data-access efficiency

### Current concern
Inventory hydration currently reads catalog metadata once per inventory item.

For a small household this is acceptable. As the inventory grows it creates avoidable reads and latency.

### Planned work
- reduce N+1 catalog reads;
- reuse catalog data between listener updates where safe;
- avoid duplicate reads for the same barcode;
- measure scan-to-result latency on real mobile connections.

### Acceptance criteria
- inventory stays responsive as product count grows;
- lookup latency is measurable;
- catalog and inventory ownership remain unchanged.

## 🟡 FASE 16 — Offline and PWA hardening

### Goal
Make the existing offline/cache foundation predictable on real devices.

### Planned work
- validate reconnect behavior after network loss;
- validate pending write visibility;
- document conflict expectations;
- verify PWA install/update behavior on iPhone and desktop;
- finalize manifest icons;
- test scanner recovery after reconnect;
- verify manual recovery from temporary Firebase Auth unavailability.

### Note
The October 4 test encountered a transient Firebase Authentication HTTP 503. It recovered without a code change. This should be treated as a recoverable availability condition, not as a scanner or Firestore authorization failure.

## 🟡 FASE 17 — Automated regression coverage

### Goal
Turn today's manual validation into repeatable checks.

### Planned coverage
- Auth verification gate;
- invite onboarding;
- member/editor/admin authorization;
- catalog-only barcode recognition;
- new product save;
- existing inventory lookup;
- movement creation;
- permission-denied save;
- Firestore Rules boundaries;
- scanner state behavior where practical.

### Acceptance criteria
A contributor can change the data model or save flow and run repeatable checks before manual device testing.

## 🟡 FASE 18 — Incremental architecture extraction

### Goal
Reduce the weight of App.jsx without introducing unnecessary architecture.

### Candidates
- inventory list/cards;
- scanner workflow container;
- product form;
- settings/navigation;
- focused hooks.

### Rule
Extract only when state ownership becomes clearer. Do not create generic abstractions simply to reduce file length.

# Validation matrix

## Authentication
- [ ] Owner login
- [ ] Email verification
- [ ] Invite signup
- [ ] Invite expiry
- [ ] Firebase Auth temporary-unavailable recovery

## Scanner
- [x] Camera startup
- [x] Successful iPhone scan in real-device test
- [x] Startup race protection
- [x] Retry after interruption
- [ ] Permission denied → granted recovery
- [ ] More iOS/Safari coverage
- [ ] Android coverage
- [ ] Long-distance / slow-focus behavior

## Product recognition
- [x] Existing household inventory
- [x] Shared catalog recognition
- [x] New product state
- [ ] Measure lookup latency across mobile networks

## Saving
- [x] Product persisted from tested PC flow
- [x] Initial movement supported
- [x] False-success refresh bug removed
- [ ] Member permission UX
- [ ] Dedicated network/permission error states

## Inventory
- [x] Add portion
- [x] Consume portion
- [x] Optimistic update
- [x] Rollback on failed write
- [x] Movement history

## Data and security
- [x] Catalog/inventory separation
- [x] Household scoping
- [x] Verified-email Rules gate
- [x] Role-aware Rules
- [ ] Automated Rules regression suite

## Build
- [ ] npm run lint
- [ ] npm run build
- [ ] Device regression after latest local pull

# October 4 implementation checkpoint

Relevant commits:

- ea5eddf52e6b93f1b0c906ff59c116a0b2fdd996 — prevent camera startup race
- c31341e5e02cbae651c9807c4d606fe9910ba98e — surface interrupted camera errors
- 437fedabbfd648b23a5f2f4db9aa7bedfb3eafdb — avoid false product save errors

Current core loop:

    iPhone / Browser
          ↓
       Camera
          ↓
         ZXing
          ↓
    Barcode recognition
          ↓
    Household inventory lookup
          ↓
     Shared catalog fallback
          ↓
      Product form
          ↓
     Firestore save
          ↓
    Realtime inventory update

The next phases should strengthen this loop before adding large new product features.

---

**Cupboard · PALMI-D3V · October 4, 2026**



# October 5, 2026 — FASE 19: Settings & user preferences

## Objective

Implement Ajustes as the personal behavior/preferences center without turning it into a second Centro.

## Implementation order

```text
Settings UI
   ↓
Preference storage
   ↓
Inventory sort/filter persistence
   ↓
Default minStock integration
   ↓
Low-stock consistency audit
   ↓
Account/session
   ↓
Application information
   ↓
Lint/build
   ↓
Real-device validation
```

## Step 19.1 — Settings UI

Create only:
- Cuenta;
- Inventario;
- Apariencia;
- Aplicación.

Keep household administration in Centro → Equipo.

## Step 19.2 — Preference storage

Start with local persistence:

```text
cupboard.settings
├── minStockDefault
├── inventorySort
└── inventoryFilter
```

Safe defaults:
- `minStockDefault = 5`;
- `inventorySort = name`;
- `inventoryFilter = all`.

## Step 19.3 — Default minimum stock

Replace hard-coded `minStock: 5` initialization for new products with the configured default.

The setting is a default, not a global rewrite of existing products.

## Step 19.4 — Inventory preferences

Initialize Inventory with saved sort/filter values and persist subsequent changes.

## Step 19.5 — Low-stock consistency audit

Search for hard-coded comparisons such as `portions <= 5`.

Where the product already has `minStock`, use that value for user-facing low-stock behavior.

Validate:
- inventory cards;
- low-stock filter;
- summaries;
- product detail;
- registration defaults.

## Step 19.6 — Account/session

Read account state from Firebase Auth.

Expose verification status accurately and provide logout.

## Step 19.7 — Application information

Show version/application information. Do not invent PWA installation/update state.

## Step 19.8 — Explicitly do not implement

- Light/System themes;
- notification toggles without notification infrastructure;
- offline connection controls in Settings;
- Firestore connection controls in Settings;
- household roles/invitations in Settings;
- cross-device preference synchronization;
- inventory unit/portion model redesign.

## Step 19.9 — Done checklist

- [ ] Settings has only real functionality or clearly informational content.
- [ ] Firebase Auth identity/verification is accurate.
- [ ] Logout works.
- [ ] Default min stock persists.
- [ ] New products use the configured default.
- [ ] Existing products keep their own minStock.
- [ ] Inventory sort persists.
- [ ] Inventory filter persists.
- [ ] Dark theme is unchanged.
- [ ] Hard-coded low-stock thresholds are audited.
- [ ] Centro remains the operational/admin workspace.
- [ ] npm run lint passes.
- [ ] npm run build passes.
- [ ] Real-device smoke test passes.



# October 5, 2026 — FASE 13–16 implementation checkpoint

Branch: `feature/phases-13-16-hardening`

## FASE 13 — Role-aware inventory UX
**🟢 Implemented · validation pending**

- Added client-side role resolution from the existing user profile.
- Members receive a clear read-only state.
- Member add/consume controls are disabled.
- Member product editing is disabled.
- Product save is blocked before submission when the known role is `member`.
- Owner/editor flows remain writable.
- Firestore Rules remain authoritative.

## FASE 14 — Save states and error taxonomy
**🟢 Implemented foundation · validation pending**

- Added explicit save state tracking.
- Distinguishes permission, network and unknown save failures.
- Keeps form data available for retry.
- Adds clearer permission messaging.
- Existing scanner/lookup errors remain separate from the save operation.

## FASE 15 — Performance
**🟢 Implemented foundation · measurement pending**

- Added session-scoped catalog metadata caching.
- Realtime inventory hydration reuses previously resolved catalog products.
- No new backend layer was introduced.
- Existing catalog/inventory ownership remains unchanged.

## FASE 16 — Offline/PWA hardening
**🟢 Implemented foundation · device validation pending**

- Added a visible Firestore synchronization state for pending writes/cache-backed online startup.
- Preserves intentional local Firestore disconnect behavior.
- Reconnect restarts the inventory listener.
- Enabled Workbox outdated-cache cleanup.
- Aligned PWA manifest colors with the current dark UI.

## Validation required before merge

- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Owner can add/edit/consume.
- [ ] Editor can add/edit/consume.
- [ ] Member can read but cannot write.
- [ ] Rules reject unauthorized writes.
- [ ] Save permission error is understandable.
- [ ] Save network error is understandable.
- [ ] Pending write becomes synchronized.
- [ ] Browser reconnect restores live inventory.
- [ ] Intentional Firestore disconnect remains offline.
- [ ] PWA install/update smoke test on target devices.
- [ ] iPhone offline/reconnect smoke test.
- [ ] Android offline/reconnect smoke test.
