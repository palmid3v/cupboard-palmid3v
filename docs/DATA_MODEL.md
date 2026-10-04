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
