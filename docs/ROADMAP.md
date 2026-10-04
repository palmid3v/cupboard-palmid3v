# Cupboard — Roadmap

## Status legend

- ✅ Current — implemented in the application.
- 🟡 Pending — known improvement or incomplete work.
- 🔵 Future — product idea, not committed implementation.

## Current foundation

### Inventory
- ✅ Household inventory from Firestore.
- ✅ Search by name/barcode.
- ✅ All / low-stock / available filters.
- ✅ Name / recent / low-stock / high-stock sorting.
- ✅ Inventory summary.
- ✅ Product detail.
- ✅ Optimistic +1 / -1 portion updates with rollback.
- ✅ Low-stock visibility.
- ✅ Household-scoped movement history.

### Registration
- ✅ Email verification before household access.
- ✅ Camera barcode scanning.
- ✅ Manual barcode entry.
- ✅ Existing-inventory lookup.
- ✅ Shared catalog lookup.
- ✅ New-product registration.
- ✅ Product validation.
- ✅ Optional remote image URL.
- ✅ Camera permission/error/retry states.

### Collaboration
- ✅ Firebase Authentication.
- ✅ Invitation-only household membership.
- ✅ Owner/admin and editor/member roles.
- ✅ Owner-only invitation controls.
- ✅ Household-scoped Firestore authorization.

### UI/UX
- ✅ Responsive desktop/mobile layout.
- ✅ Sticky desktop navigation/status area.
- ✅ Mobile bottom navigation.
- ✅ Custom dark sorting control.
- ✅ Animated product detail.
- ✅ Product image framing.
- 🟡 Finalize image presentation across more real-world image sources.

### Platform
- ✅ React 19 + Vite 8.
- ✅ Tailwind CSS 4.
- ✅ Firestore persistence.
- ✅ Persistent Firestore cache.
- ✅ PWA configuration.
- 🟡 Final PWA icon set.
- 🟡 Full install/update verification on target devices.

## Architecture

The current production data model is:

```text
productCatalog/{barcode}
        │
        ▼
households/{householdId}/inventory/{barcode}
        │
        ▼
households/{householdId}/movements/{movementId}
```

Product identity is shared. Stock, expiry, notes, and movement history are household-scoped.

The old mixed household product model has been retired from the runtime and from the Firestore Rules boundary.

## FASE 10 — Cleanup

**🟢 APPROVED / BUILT**

Completed cleanup:

- ✅ Removed migration-only UI from **Centro → Catálogo**.
- ✅ Removed the migration service from the application.
- ✅ Removed the retired household `products` Firestore Rules boundary.
- ✅ Kept the shared catalog preparation workflow.
- ✅ Kept runtime persistence on catalog + inventory.
- ✅ Kept movements household-scoped.
- ✅ Updated architecture, data-model, security, roadmap, context, and operational documentation.
- ✅ Updated the project status so FASE 10 is no longer presented as pending.

## Remaining technical work

### Scanner reliability
- 🟡 Test camera startup/retry across supported browsers and mobile devices.
- 🟡 Test permission-denied → permission-granted recovery.
- 🟡 Test repeated scanner sessions after successful scans.
- 🟡 Decide whether `html5-qrcode` should be removed; `@zxing/browser` is the active scanner.

### Architecture
- 🟡 Extract focused inventory components from `App.jsx`.
- 🟡 Extract product form/detail UI where it improves maintainability.
- 🟡 Extract settings/navigation where it improves maintainability.
- 🟡 Introduce hooks only where they make state ownership clearer.

### Connectivity
- 🟡 Expand pending-sync feedback and edge-case recovery.
- 🟡 Review conflict-handling expectations as multi-device use grows.

### Data safety
- 🟡 Review Firebase configuration strategy.
- 🟡 Establish backup/data-recovery expectations.
- 🟡 Keep Firestore Rules deployment as an explicit release operation.

## Product opportunities

These remain ideas, not committed implementation:

- 🟡 Quantity trends.
- 🟡 Smarter low-stock rules.
- 🟡 Need-to-buy state.
- 🟡 Meal planning.
- 🟡 Ingredient usage.
- 🔵 Recurring household items.
- 🔵 Product locations.
- 🔵 Multi-device/global presence.

Firebase Storage uploads remain deferred until a billing-enabled Firebase plan is acceptable. Remote image URLs remain supported.

## Avoid feature creep

Cupboard should remain a calm household inventory product, not a warehouse system, ERP, procurement platform, social network, or AI feature collection.

Build trust in the core inventory experience before adding complexity.

---

**PALMI-D3V · Cupboard · October 2026**
