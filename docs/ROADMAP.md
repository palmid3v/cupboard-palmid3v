
# Cupboard — Roadmap

## Status legend

- ✅ Current — implemented in the application.
- 🟡 Pending — known improvement or incomplete work.
- 🔵 Future — idea or direction not committed to implementation.

# 1. Current product foundation

## Inventory
- ✅ Household inventory from Firestore.
- ✅ Search by name/barcode.
- ✅ All / low-stock / available filters.
- ✅ Name / recent / low-stock / high-stock sorting.
- ✅ Inventory summary.
- ✅ Product detail.
- ✅ Optimistic +1 / -1 updates with rollback.
- ✅ Low-stock visibility.
- ✅ Household-scoped movement history.
- ✅ Expiry tracking.

## Registration
- ✅ Email verification before household access.
- ✅ Invitation-only onboarding.
- ✅ Camera barcode scanning.
- ✅ Manual barcode entry.
- ✅ Household inventory lookup.
- ✅ Shared catalog lookup.
- ✅ New-product registration.
- ✅ Product validation.
- ✅ Optional remote image URL.
- ✅ Camera permission/error/retry states.
- ✅ Startup-race protection.
- ✅ Real-device scanner validation baseline.

## Collaboration
- ✅ Firebase Authentication.
- ✅ Owner/editor/member role model.
- ✅ Owner-only invitation controls.
- ✅ Household-scoped Firestore authorization.

## Workspace
- ✅ Expiry tracking panel.
- ✅ Movement history.
- ✅ Shopping list.
- ✅ Recipes.
- ✅ Basic analytics.
- ✅ External barcode/product lookup.
- ✅ Shared catalog preparation.
- ✅ Owner-only Firestore network controls.

## UI/UX
- ✅ Responsive desktop/mobile layout.
- ✅ Mobile bottom navigation.
- ✅ Dark-only visual system.
- ✅ Product detail animation and feedback.
- ✅ Fixed product image area.
- ✅ Explicit scanner startup/error states.
- ✅ False-success save-flow fix.
- 🟡 More real-device scanner refinement.
- 🟡 More granular save/error feedback.
- 🟡 Role-aware write guidance.

## Platform
- ✅ React 19 + Vite 8.
- ✅ Tailwind CSS 4.
- ✅ Firestore persistence + local cache.
- ✅ PWA configuration.
- 🟡 Final PWA icon set.
- 🟡 Install/update verification on target devices.
- 🟡 Broader offline/reconnect validation.

# 2. Architecture state

The current runtime data model is:

    productCatalog/{barcode}
            │
            ▼
    households/{householdId}/inventory/{barcode}
            │
            ▼
    households/{householdId}/movements/{movementId}

Product identity is shared. Stock, expiry, notes and movement history are household-scoped.

The old mixed household product model is retired.

# 3. Completed architecture phases

### ✅ FASE 1 — Shared product catalog
### ✅ FASE 2 — Data-model audit
### ✅ FASE 3 — Inventory foundation
### ✅ FASE 4 — Runtime adoption
### ✅ FASE 5 — Movements
### ✅ FASE 6 — Firebase Rules
### ✅ FASE 7 — Migration tooling
### ✅ FASE 8 — Regression validation
### ✅ FASE 9 — Reset + migration
### ✅ FASE 10 — Cleanup

# 4. New reliability/product phases

## 🟢 FASE 11 — Scanner startup reliability
- ✅ Serialize overlapping camera starts.
- ✅ Clean previous media streams.
- ✅ Retry without page reload.
- ✅ Surface interrupted startup errors.
- ✅ Attempt supported continuous focus.
- ✅ Validate successful real-device iPhone scan.
- 🟡 Broader browser/device coverage.
- 🟡 Better focus/positioning guidance.

## 🟢 FASE 12 — Save-flow correctness
- ✅ Remove false save failures caused by secondary reloads.
- ✅ Keep the inventory listener as the post-save UI source.
- ✅ Separate primary save errors from post-save UI state.
- ✅ Add common permission/network/precondition messages.
- 🟡 Make catalog success versus household inventory failure explicit.

## 🟡 FASE 13 — Role-aware inventory UX
**Implementation: 🟢 foundation complete · validation pending**
- Explain member/editor/admin write capabilities before save.
- Members are treated as read-only in inventory controls and product editing.
- Unauthorized saves are blocked before Firestore submission when the client knows the role.
- Firestore Rules remain the final authorization boundary.
- Remaining: validate all role paths against deployed Rules on real accounts.

## 🟡 FASE 14 — Save states and error taxonomy
**Implementation: 🟢 foundation complete · validation pending**
- Save flow now separates validation, saving, permission, network and unknown outcomes.
- Permission/network messages are user-oriented.
- Technical diagnostics remain in logs.
- Remaining: broader scanner/lookup state taxonomy and real-device error validation.

## 🟡 FASE 15 — Performance
**Implementation: 🟢 foundation complete · measurement pending**
- Added a session-scoped catalog metadata cache during inventory hydration.
- Known catalog data is reused across realtime inventory snapshots.
- Existing service boundaries remain unchanged.
- Remaining: measure mobile scan-to-result latency and evaluate cache freshness as catalog editing expands.

## 🟡 FASE 16 — Offline/PWA hardening
**Implementation: 🟢 foundation complete · device validation pending**
- Pending Firestore writes now surface as a synchronization state instead of being misclassified as offline.
- Intentional Firestore disconnect remains distinguishable from temporary cache-backed startup state.
- Reconnect listeners restart the inventory subscription.
- Workbox cleanup of outdated caches is enabled.
- Manifest theme/background colors match the current dark application.
- Remaining: PWA install/update device validation, final icons, reconnect/conflict testing, and temporary Auth/Firestore recovery testing.

## 🟡 FASE 17 — Automated regression coverage
- Auth and email verification tests.
- Household invitation tests.
- Firestore Rules tests.
- Catalog/inventory recognition tests.
- Save/permission/network scenarios.
- Movement persistence checks.
- Scanner state checks where practical.

## 🟢 FASE 17 — Automated regression coverage
**Implementation: 🟢 complete · CI validation pending**

Added a dependency-free Node regression suite covering the critical contracts of the core loop:

- Auth/email verification contract.
- Household invitation/member-only onboarding contract.
- Firestore Rules access boundaries and verified-email requirement.
- Inventory → catalog → new barcode recognition priority.
- Save permission/network/unknown error taxonomy.
- Product-specific low-stock threshold behavior.
- Movement persistence/atomic batch contract.
- Scanner permission/camera recovery states.
- GitHub Actions regression workflow with lint and build.

The suite runs with:

```bash
cd app
npm run test:regression
```

The CI workflow also runs `npm run lint` and `npm run build` on pushes and pull requests.

> The Rules assertions in this first regression layer are source-contract checks. Full Firestore Emulator/Auth integration tests remain the next hardening layer when the Local Emulator Suite is added to the repository toolchain.

## 🟢 FASE 18 — Incremental architecture extraction
**Implementation: 🟢 complete · CI validation pending**

App.jsx was reduced to application orchestration while ownership moved into focused modules:

- `components/InventoryView.jsx` owns inventory search, filters, sorting, summary, and inventory presentation.
- `components/ScannerView.jsx` owns the scanner workflow presentation and coordinates the product form.
- `components/ProductForm.jsx` owns the product editing/registration UI and field-level interaction.
- `hooks/useInventorySubscription.js` owns inventory realtime subscription, connection state, and role resolution.
- Existing persistence services, Firestore rules, role boundaries, scanner behavior, and PWA behavior remain unchanged.
- No new runtime dependency or framework was introduced.

Validation remains pending in CI/device environments:
- `npm run test:regression`
- `npm run lint`
- `npm run build`
- Real-device scanner/offline smoke tests.

# 5. Product opportunities

These remain ideas, not committed implementation:

- 🟡 smarter low-stock rules;
- 🟡 need-to-buy state;
- 🟡 quantity trends;
- 🟡 ingredient usage;
- 🔵 product locations;
- 🔵 recurring household items;
- 🔵 richer recipe/ingredient linking;
- 🔵 multi-device/global presence.

Firebase Storage uploads remain deferred until a billing-enabled Firebase plan is acceptable. Remote image URLs remain supported.

# 6. Definition of done for the core loop

Cupboard should treat this as the most important reliability target:

    Scan
      ↓
    Recognize
      ↓
    Understand current state
      ↓
    Edit
      ↓
    Save
      ↓
    See result in inventory

Before expanding product scope, this loop should be:
- reliable on mobile;
- explicit about permissions;
- explicit about save errors;
- responsive enough for common household inventories;
- covered by repeatable regression tests.

## Avoid feature creep

Cupboard should remain a calm household inventory product, not a warehouse system, ERP, procurement platform, social network, or AI feature collection.

Build trust in the core inventory experience before adding complexity.

---

**PALMI-D3V · Cupboard · October 4, 2026**



# 7. October 5, 2026 — FASE 19–20 product polish

## 🟢 FASE 19 — Retro-Digital / modern 8-bit visual redesign
**Implementation: 🟢 complete · CI validation pending**

The visual system now uses a restrained Retro-Digital direction while preserving the existing product architecture and workflows.

### Visual system
- Deep black / blue-black surfaces.
- White primary text.
- Electric blue primary action color.
- Explicit green/yellow/red/blue state colors.
- Monospace system typography with a pixel-inspired digital feel.
- Rectangular controls and minimal radii.
- Hard, minimal shadows.
- Compact terminal/panel treatment.
- Subtle grid background and scanline-inspired texture.
- Discreet motion only; reduced-motion behavior remains supported.

### Scope completed
- Design tokens in the Cupboard shell.
- Core panels, buttons, inputs, cards, navigation, and status treatment.
- Inventory visual treatment.
- Scanner and product-registration visual treatment.
- Centro visual treatment through shared tokens.
- Responsive/mobile behavior preserved.
- Focus-visible and touch/keyboard behavior preserved.
- Existing React/Vite/Firebase/Firestore/ZXing/PWA stack preserved.
- No data-model or persistence changes.

---

## 🟢 FASE 20 — Settings & user preferences
**Implementation: 🟢 complete · CI validation pending**

Settings is the personal behavior and preference center:

```text
Inventario = qué tengo
Scanner    = qué estoy agregando
Centro     = qué puedo hacer con mi inventario
Ajustes    = cómo quiero que Cupboard funcione para mí
```

### Cuenta
- Current Firebase Auth identity.
- Email verification state.
- Logout/session action.

### Inventario
- Default minimum stock for newly registered products.
- Default sort:
  - Nombre A-Z
  - Más recientes
  - Menor stock
  - Mayor stock
- Default filter:
  - Todos
  - Stock bajo
  - Disponibles

### Apariencia
- Cupboard Dark remains fixed.
- Retro-Digital visual language is fixed.
- No Light/System selector.

### Aplicación
- Current application version.
- PWA state: browser vs installed standalone mode.

### Persistence

Personal preferences are stored locally:

```text
cupboard.settings
├── minStockDefault
├── inventorySort
└── inventoryFilter
```

Cross-device synchronization remains out of scope for v1.

### Inventory consistency
- Default minimum stock starts at 5.
- New products inherit `settings.minStockDefault`.
- Existing products retain their stored `minStock`.
- Low-stock UI continues to use each product's threshold.
- Hard-coded `portions <= 5` comparisons were audited out of the active UI path.

### Outside Settings
Household invitations, roles, membership, Firestore connection controls, shared catalog administration, analytics, shopping, recipes, expiry, and movement history remain in **Centro**.

Notifications remain out of scope until a real notification system exists.

### Acceptance criteria
- Settings contains no fake controls.
- Account state comes from Firebase Auth.
- Logout works.
- Default min stock persists and is used for new products.
- Existing product thresholds are not overwritten.
- Sort/filter preferences persist.
- Dark theme remains unchanged.
- Retro-Digital visual language is consistent.
- Low-stock UI is consistent with product `minStock`.
- Centro remains the operational/admin workspace.
- Scanner → Product → Inventory flow remains intact.
- `npm run test:regression`, `npm run lint`, and `npm run build` pass in CI.

# 8. FASE 13–16 branch checkpoint

Branch: `feature/phases-13-16-hardening`

The approved hardening work has been implemented as a reviewable branch. These phases should remain marked as validation-pending until `npm run lint`, `npm run build`, deployed Rules checks, and real-device/offline smoke tests pass.


## Documentation checkpoint — 2026-10-18

The current release focus remains reliability hardening of the mobile scan → recognize → register → inventory loop. The roadmap records implemented inventory, barcode scanning, household roles, movement history, expiry tracking and shopping/recipe workflows. Do not mark real-device validation as complete without current evidence; continue testing camera permissions, retry/cleanup, Firestore failures and optimistic-update rollback on supported phones.
