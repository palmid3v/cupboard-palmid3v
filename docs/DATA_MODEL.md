# Cupboard — Data Model

## Current Firestore model

Cupboard separates shared product identity from household state.

```text
productCatalog/{barcode}
        │
        ├── canonical product identity
        │
        ▼
households/{householdId}/inventory/{barcode}
        │
        ├── portions
        ├── expiryDate
        ├── minStock
        └── notes
        │
        ▼
households/{householdId}/movements/{movementId}
```

## Shared product catalog

`productCatalog/{barcode}`

| Field | Meaning |
| --- | --- |
| document ID | Barcode |
| name | Canonical product name |
| description | Product description |
| brand | Brand when known |
| weight | Reference weight in grams |
| imageUrl | Optional remote image |
| category | Product category |
| createdBy | User who created the catalog entry |
| createdAt | Creation timestamp |
| updatedAt | Last catalog metadata update |

Catalog data does not contain household stock.

Verified signed-in users can read catalog metadata. Catalog creation/update is protected by Firestore Rules.

## Household inventory

`households/{householdId}/inventory/{barcode}`

| Field | Meaning |
| --- | --- |
| document ID | Barcode |
| portions | Current household quantity |
| expiryDate | Household-specific expiry |
| minStock | Household-specific low-stock threshold |
| notes | Household-specific notes |
| createdAt | Inventory record creation |
| updatedAt | Inventory state update |

A barcode can exist once in the shared catalog and independently in multiple households.

## Business inventory workspace

Sandwichies stock is stored in a separate Cupboard workspace and must not be mixed with Home:

`households/{householdId}/workspaces/sandwichies/inventory/{productId}`

Movement history uses:

`households/{householdId}/workspaces/sandwichies/movements/{movementId}`

The product ID is mapped from Sandwichies ingredient IDs to shared catalog entries such as `sandwichies-base`. The Sandwichies app's `inventoryBalances` collection is a projection used by its existing admin UI; Cupboard is the source of truth for mapped business stock once the cross-project bridge is configured.

Initial legacy balances and historical transactions can be imported with `npm run cupboard:inventory-import` from the `app` directory. The command is non-destructive and defaults to dry-run. It imports only missing records, skips balances already marked as mirrored from Cupboard, and never overwrites existing Cupboard stock.

## Movements

`households/{householdId}/movements/{movementId}`

Movement records describe inventory deltas.

| Field | Meaning |
| --- | --- |
| productId | Barcode affected |
| type | `add` or `consume` |
| quantity | Positive absolute delta |
| reason | Workflow context |
| userId | Authenticated actor when available |
| createdAt | Movement creation |
| updatedAt | Movement update |

Inventory changes and their movement records are persisted atomically.

## Authentication and membership

`users/{uid}` stores the application profile.

Household membership lives under:

`households/{householdId}/members/{uid}`

Invitations live under:

`householdInvites/{inviteCode}`

Verified Firebase Authentication email is required before household Firestore access.

## Service boundaries

The UI-facing compatibility API remains intentionally small:

```js
getProduct(barcode)
saveProduct(barcode, data)
getAllProducts()
updatePortions(barcode, newPortions)
```

Internally it composes:

- `catalog.js` for shared identity;
- `inventory.js` for household state;
- movement persistence for inventory deltas.

## Recognition rule

When scanning a barcode:

1. Existing household inventory wins.
2. Otherwise the shared catalog is checked.
3. Otherwise the barcode is treated as a new product.

A known catalog product can therefore be added to a household without duplicating canonical identity data.

## Images

`imageUrl` is a remote URL.

Cupboard does not upload image files. Firebase Storage remains deferred until a billing-enabled plan is acceptable.

## Data-model rule

Keep shared identity reusable, household state private to the household, and movement history household-scoped. Avoid adding fields without a concrete product requirement.

## Migration history

The October 2026 architecture work separated the former mixed product representation into the catalog/inventory model above. The migration is complete and the former household product collection is no longer an application data boundary.

## Save semantics

The product save operation composes two responsibilities:

1. ensure `productCatalog/{barcode}` exists;
2. create/update `households/{householdId}/inventory/{barcode}`.

When the workflow includes an initial movement, the inventory write and movement record are committed in the same Firestore batch.

A catalog-only recognition therefore does not mean the product is already in the current household. It means the shared identity exists and can be reused.

## Known scale consideration

The current product facade hydrates catalog metadata per inventory item. This is acceptable at MVP scale but is an identified N+1-read optimization target for FASE 15.
