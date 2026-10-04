# STEP-BY-STEP-CUPBOARD-2026-10-04

Operational implementation checklist for the October 2026 inventory architecture migration.

## Architecture target

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
- 🟢 FASE 6 — Firebase Rules implementation + deployment checklist
- 🟢 FASE 7 — Non-destructive migration tooling
- 🟡 FASE 8 — Regression validation
- 🔴 FASE 9 — Reset + migration

**Blocked until FASE 8 regression passes.**
- ⏳ FASE 10 — Cleanup

## FASE 4 — Runtime adoption

Implemented in `app/src/services/products.js` through `app/src/services/inventory.js`.

The existing UI-facing product API is retained as a compatibility facade, but its persistence boundary is now:

- shared identity → `productCatalog/{barcode}`;
- household stock → `households/{householdId}/inventory/{barcode}`.

Runtime coverage:

1. Scanner lookup checks household inventory first.
2. If absent, scanner checks shared catalog.
3. Catalog recognition pre-fills product identity and starts household stock at zero.
4. Inventory dashboard reads the dedicated inventory collection.
5. Search, filters and sorting operate on the inventory-backed product view.
6. Product detail combines catalog identity with household inventory state.
7. Portion changes write to dedicated inventory.
8. Product registration writes catalog identity when missing and household inventory state.
9. The legacy `households/{householdId}/products` collection is no longer the runtime source of truth.

## FASE 5 — Movements

Movements remain household-scoped:

`households/{householdId}/movements/{movementId}`

Implemented movement behavior:

- registering a new/catalog product with initial portions creates an `add` movement;
- increasing portions creates an `add` movement;
- decreasing portions creates a `consume` movement;
- movement quantity is the absolute inventory delta;
- movement reason identifies the workflow;
- movement records include the authenticated user ID when available.

## FASE 6 — Rules

The repository now contains the required inventory rule boundary:

`households/{householdId}/inventory/{barcode}`

Rules:

- verified household members can read;
- admins/editors can create, update and delete;
- non-members are denied;
- verified-email requirement remains enforced.

Deploy the committed rules manually, then execute the regression matrix in FASE 8. Repository implementation is complete; live Firebase validation remains an operational checkpoint.

## FASE 7 — Migration tooling

Implemented in `app/src/services/migration.js` and exposed to the owner under **Centro → Catálogo**.

Workflow:

1. **Analizar migración** reads legacy household products and compares target catalog/inventory coverage.
2. **Copiar datos faltantes** creates only missing catalog and inventory records.
3. Existing target records are never overwritten.
4. Legacy `households/{householdId}/products` records are never modified or deleted.
5. **Verification** confirms catalog and inventory coverage after the copy.
6. The operation is idempotent and can be safely rerun.

Batch writes are chunked below Firestore's 500-write batch limit. citeturn0search5turn0search0

No destructive operation belongs in this phase.

## FASE 8 — Regression

Required flows:

- owner login + verified email;
- invite member + verified email;
- inventory list;
- scanner existing inventory;
- scanner shared catalog;
- scanner new product;
- manual registration;
- add portion;
- consume portion;
- movement history;
- offline/cache behavior;
- permissions across owner/editor/member roles.

## FASE 9 — Reset + migration

This phase is blocked.

Do not delete, reset or clear Firebase data yet.

Only when FASES 6–8 are complete and the migration has been reviewed, show the explicit gate:

> ⚠️ **AHORA SÍ: RESET + MIGRACIÓN**

Only after that warning is destructive migration authorized.

## FASE 10 — Cleanup

After successful migration and regression:

- remove legacy runtime compatibility;
- remove obsolete `products` reads/writes;
- remove migration-only helpers;
- update documentation;
- verify no production path depends on the legacy collection.

---

**Cupboard · PALMI-D3V · October 2026**
