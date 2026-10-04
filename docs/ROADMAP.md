# Cupboard — Roadmap

## Status legend

- ✅ Current — implemented in the application.
- 🟡 Pending — known improvement or incomplete work.
- 🔵 Future — product idea, not committed implementation.

## Current foundation

### Inventory
- ✅ Product inventory from Firestore
- ✅ Search by name/barcode
- ✅ All / low-stock / available filters
- ✅ Name / recent / low-stock / high-stock sorting
- ✅ Inventory summary
- ✅ Product detail view
- ✅ Optimistic +1 / -1 portion updates
- ✅ Rollback when a portion write fails
- ✅ Low-stock visibility

### Registration
- ✅ Camera barcode scanning
- ✅ Manual barcode entry
- ✅ Existing-product lookup
- ✅ New-product registration
- ✅ Product validation
- ✅ Optional image URL
- ✅ Camera permission/error/retry states

### UI/UX
- ✅ Responsive desktop/mobile layout
- ✅ Sticky desktop navigation/status area
- ✅ Mobile bottom navigation
- ✅ Custom dark sort dropdown
- 🟡 Finalize product-image presentation across more real-world image sources
- 🟡 Further visual refinement as real product images expose edge cases

### Platform
- ✅ React/Vite application
- ✅ Firestore persistence
- ✅ PWA configuration
- 🟡 Final PWA icon set
- 🟡 Full install/update verification on target devices

## Near-term technical work

### Scanner reliability
- 🟡 Test camera startup/retry across supported browsers and mobile devices.
- 🟡 Test permission-denied → permission-granted recovery.
- 🟡 Test repeated scanner sessions after successful scans.
- 🟡 Decide whether scanner dependency cleanup is needed; `html5-qrcode` is present but `@zxing/browser` is the active scanner implementation.

### Architecture
- 🟡 Extract focused inventory components from `App.jsx`.
- 🟡 Extract product form and product detail UI.
- 🟡 Extract settings/navigation where it improves maintainability.
- 🟡 Introduce hooks only where they make state ownership clearer.

### Data safety
- 🟡 Review Firebase configuration strategy.
- 🟡 Document and review Firestore security rules.
- 🟡 Define deployment configuration.
- 🟡 Establish backup/data-recovery expectations.

### Connectivity
- 🟡 If product requirements justify it, replace the static “Inventario conectado” treatment with an explicit online/offline/Firestore availability state.
- 🟡 Decide whether offline-first behavior is needed before implementing connectivity UX.

## Product opportunities

These are ideas, not current implementation commitments.

### Household collaboration
- 🔵 authentication
- 🔵 shared household
- 🔵 family members
- 🔵 permissions

### Inventory intelligence
- 🔵 expiry dates
- 🔵 stock history
- 🔵 quantity trends
- 🔵 smarter low-stock rules

### Household workflows
- 🔵 shopping list
- 🔵 need-to-buy state
- 🔵 recurring household items
- 🔵 product locations

### Kitchen assistance
- 🔵 recipes from available products
- 🔵 meal planning
- 🔵 ingredient usage

## Avoid feature creep

Cupboard does not need to become a warehouse management system, procurement platform, ERP, analytics-heavy dashboard, social network, or AI feature collection.

AI can be useful later only when it solves a concrete household problem.

## Suggested evolution

```text
Current MVP
   ↓
Polish + reliability
   ↓
Better PWA experience
   ↓
Cleaner architecture
   ↓
Optional connectivity/offline strategy
   ↓
Household sharing, if needed
   ↓
Smarter home workflows
```

Build trust in the basic inventory experience before adding complexity.
