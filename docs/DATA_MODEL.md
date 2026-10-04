# Cupboard — Data Model

## Firestore collection

```text
products
```

Each product uses its barcode as the Firestore document ID:

```text
products/{barcode}
```

## Product document

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| document ID | string | yes | Product barcode |
| name | string | yes for registration | Product name |
| description | string | no | Optional description |
| weight | number | no | Weight in grams |
| portions | number | yes for registration | Current number of portions |
| imageUrl | string | no | Optional product image URL |
| createdAt | timestamp | generated | Creation time |
| updatedAt | timestamp | generated | Last update time |

## Save behavior

`saveProduct(barcode, data)` checks whether the document exists.

### Existing barcode

Updates name, description, weight, portions, imageUrl, and updatedAt.

### New barcode

Creates the product fields plus createdAt and updatedAt.

## Portion behavior

`updatePortions(barcode, newPortions)` prevents negative quantities.

The UI changes the quantity by exactly one portion per action.

The current UI performs the local optimistic update first and then persists the resulting value.

If persistence fails, the UI restores the previous value.

## Normalization

`services/products.js` normalizes Firestore data before returning it to the UI.

The normalized product exposes:
- id;
- name;
- description;
- weight;
- portions;
- imageUrl;
- createdAt;
- updatedAt.

Numeric fields are normalized to numbers and missing values receive safe defaults.

## Images

`imageUrl` is an optional remote URL supplied by the product data.

The application presents that URL inside bounded image containers.

Cupboard does not currently upload image files. Firebase Storage is deferred until a billing-enabled plan is acceptable.

External image URLs are not guaranteed to remain available.

## Missing data defaults

- name → empty string
- description → empty string
- weight → 0
- portions → 0
- imageUrl → empty string
- timestamps → null

## Future model considerations

If Cupboard becomes a shared household application, the model may eventually need user identity, household identity, ownership, product locations, units, expiration, movement history, or shopping state.

Do not add these fields preemptively without a product requirement.

## Data-model rule

Keep the product document small until the product actually needs more information.


## Household ownership

The household owner is the general administrator. New users join through invitation codes and receive member access. Role and household ownership fields are protected by Firestore Rules.


## Authentication state

Firebase Authentication remains the identity source. Household Firestore access requires the Firebase ID token claim `email_verified == true`.

## Product fields used by the current detail experience

```text
name
 description
weight
portions
imageUrl
category
expiryDate
minStock
updatedAt
```

Existing products are intentionally preserved as the current development dataset. No database reset or product deletion is part of this implementation.


## Shared product catalog

The new global catalog is:

```text
productCatalog/{barcode}
```

It stores stable product identity metadata:

| Field | Meaning |
| --- | --- |
| document ID | Barcode |
| name | Canonical product name |
| description | Product description |
| brand | Brand when known |
| weight | Reference weight in grams |
| imageUrl | Optional product image |
| category | Product category |
| createdBy | User who first created the catalog entry |
| createdAt | Catalog creation time |
| updatedAt | Last catalog metadata update |

It intentionally does **not** store household stock, portions, expiry date, or minimum stock.

The current household inventory remains:

```text
households/{householdId}/products/{barcode}
```

This is intentionally temporary. Existing products are being preserved as the working dataset until the explicit reset + migration checkpoint.

### Recognition rule

A barcode is treated as:

1. **Existing inventory** when the household already has the barcode.
2. **Known catalog product** when the global catalog has the barcode but the household does not.
3. **New product** when neither location contains the barcode.

A known catalog product is never copied as a second global product. Its canonical metadata is reused and only household-specific inventory fields are created for the new household.

### Current catalog bootstrap

The owner can use **Centro → Catálogo → Preparar catálogo** to create missing catalog entries from the current household products. This operation is non-destructive: it does not update, delete, or reset the existing household inventory.
