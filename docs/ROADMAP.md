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
- ✅ Email verification before household access
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
- ✅ Animated product detail experience with stock, expiry, metadata, and product-image treatment
- 🟡 Finalize product-image presentation across more real-world image sources

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
- ✅ Require verified Firebase email identity in Firestore Rules
- 🟡 Review Firebase configuration strategy.
- 🟡 Document and review Firestore security rules.
- 🟡 Define deployment configuration.
- 🟡 Establish backup/data-recovery expectations.

### Connectivity
- ✅ Real online/offline/Firestore availability state in the UI.
- ✅ Firestore persistent local cache for previously used inventory data.
- ✅ Inventory listener with cache/server metadata.
- ✅ Household-scoped inventory and role-aware permissions.
- 🟡 Expand offline-first UX with clearer pending-sync feedback and edge-case recovery.
- 🟡 Review conflict-handling expectations as the product becomes multi-device.

## Product opportunities

These are ideas, not current implementation commitments.

### Household collaboration
- ✅ authentication
- ✅ shared household
- ✅ family members
- ✅ permissions

### Inventory intelligence
- ✅ expiry dates
- ✅ stock history
- 🟡 quantity trends
- 🟡 smarter low-stock rules

### Household workflows
- ✅ shopping list
- 🟡 need-to-buy state
- 🔵 recurring household items
- 🔵 product locations

### Kitchen assistance
- ✅ recipes from available products
- 🟡 meal planning
- 🟡 ingredient usage

### Image storage

- ⏸️ Firebase Storage uploads — deferred until a billing-enabled plan is acceptable.
- ✅ Remote image URLs remain supported.

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
Stronger offline-first experience
   ↓
Household sharing, if needed
   ↓
Smarter home workflows
```

Build trust in the basic inventory experience before adding complexity.


## Access and administration

- ✅ Owner / general administrator model
- ✅ Invitation-only registration for new household members
- ✅ New invitations grant member access
- ✅ Owner-only invitation controls
- 🟡 Member management: list, revoke, and role management where product policy allows
- 🟡 Invitation lifecycle: revoke and usage tracking

## Connectivity

- ✅ Connected/offline/error runtime state
- ✅ Firestore cache/server metadata
- ✅ Owner-facing connect/disconnect controls for the current browser
- 🟡 Better pending-write and synchronization feedback
- 🟡 Global service-health dashboard if Cupboard later needs monitoring across all clients
- 🔵 Multi-device/global presence monitoring

The current connection control is intentionally client-local. It does not turn Firebase on or off for every user.


## Current implementation checkpoint — October 2026

The project is intentionally **not being reset**. Existing household products remain available as a working test dataset while authentication, security, expiry behavior, and product-detail UX are being hardened. A future clean reset will be an explicit operational step and is not part of this implementation.


## Shared catalog checkpoint — October 2026

- ✅ Shared `productCatalog/{barcode}` service.
- ✅ Barcode recognition checks household inventory before shared catalog.
- ✅ Known catalog products can be added to a household without re-entering identity metadata.
- ✅ Existing household products can be seeded into the shared catalog from **Centro → Catálogo**.
- ✅ Catalog security rules require verified email and protect canonical metadata writes.
- 🟡 Migrate the current household `products` collection into the final household `inventory` model.
- 🟡 Define the explicit reset + migration operation.
- 🟡 Validate catalog recognition with a second household/member before reset.

### Reset + migration gate

**Not reached yet.**

The reset must wait until:

1. The current products have been successfully represented in `productCatalog`.
2. Barcode recognition has been tested with an existing product and a brand-new product.
3. The new household inventory model is implemented and tested.
4. Authentication, invitations, expiry, movements, and permissions pass the regression flow.
5. A migration procedure is prepared and reviewed.
6. The user explicitly receives the warning:

> ⚠️ **AHORA SÍ: RESET + MIGRACIÓN**

Only after that warning should any destructive Firebase operation be performed.
