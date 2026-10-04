# STEP-BY-STEP-CUPBOARD-2026-10-04

Operational checklist for the October 2026 Cupboard architecture migration and cleanup.

## Final architecture

```text
productCatalog/{barcode}
        │
        ▼
households/{householdId}/inventory/{barcode}
        │
        ▼
households/{householdId}/movements/{movementId}
```

## Phase status

- 🟢 FASE 1 — Shared catalog
- 🟢 FASE 2 — Data-model audit
- 🟢 FASE 3 — Inventory foundation
- 🟢 FASE 4 — Runtime adoption
- 🟢 FASE 5 — Movements
- 🟢 FASE 6 — Firebase Rules
- 🟢 FASE 7 — Migration tooling
- 🟢 FASE 8 — Regression validation
- 🟢 FASE 9 — Reset + migration
- 🟢 FASE 10 — Cleanup

## Runtime

The application now reads and writes:

- shared identity → `productCatalog/{barcode}`;
- household stock → `households/{householdId}/inventory/{barcode}`;
- inventory history → `households/{householdId}/movements/{movementId}`.

The old mixed household product collection is no longer a runtime source of truth or Rules boundary.

## FASE 10 — Cleanup completed

1. Removed migration controls from **Centro → Catálogo**.
2. Removed the migration service.
3. Removed the retired household product Rules boundary.
4. Kept catalog preparation because it is still a valid owner workflow for current inventory.
5. Kept the product service facade because it is the UI persistence boundary.
6. Updated documentation to describe only the current runtime model.
7. Kept the explicit Firebase Rules deployment operation.

## Final validation checklist

- [ ] Owner login + verified email.
- [ ] Invitation + verified member.
- [ ] Inventory list.
- [ ] Existing inventory barcode scan.
- [ ] Shared catalog barcode recognition.
- [ ] New product registration.
- [ ] Add portion.
- [ ] Consume portion.
- [ ] Movement history.
- [ ] Offline/cache behavior.
- [ ] Owner/editor/member permissions.
- [ ] Firebase Rules deployment.
- [ ] `npm run lint`.
- [ ] `npm run build`.

---

**Cupboard · PALMI-D3V · October 2026**
