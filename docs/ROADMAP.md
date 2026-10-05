
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
- Explain member/editor/admin write capabilities before save.
- Avoid unauthorized members reaching a generic save failure.
- Keep Firestore Rules as the final authorization boundary.

## 🟡 FASE 14 — Save states and error taxonomy
- Split scanner, lookup, validation, permission, network and unknown errors.
- Introduce explicit SAVING, SAVED, permission and network states.
- Keep technical diagnostics in logs.

## 🟡 FASE 15 — Performance
- Reduce N+1 catalog reads during inventory hydration.
- Reuse known catalog data where safe.
- Measure mobile scan-to-result latency.
- Avoid duplicate reads after successful writes.

## 🟡 FASE 16 — Offline/PWA hardening
- Validate reconnect and pending-write behavior.
- Test PWA install/update on target devices.
- Finalize manifest icons.
- Define realistic conflict expectations.
- Test recovery from temporary Auth/Firestore unavailability.

## 🟡 FASE 17 — Automated regression coverage
- Auth and email verification tests.
- Household invitation tests.
- Firestore Rules tests.
- Catalog/inventory recognition tests.
- Save/permission/network scenarios.
- Movement persistence checks.
- Scanner state checks where practical.

## 🟡 FASE 18 — Incremental architecture extraction
- Reduce App.jsx responsibility where ownership becomes clearer.
- Extract inventory UI, scanner workflow, product form and focused hooks incrementally.
- Avoid unnecessary abstraction.

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
