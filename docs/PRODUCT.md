# Cupboard — Product

## Product statement

**Cupboard is a friendly home inventory app that helps people know what they have, how much is left, and what needs attention.**

It is deliberately smaller and more human than a warehouse-management application.

## Core job to be done

> When I need to know what I have at home, I want to check it quickly and update it without friction.

## Current MVP promise

Today Cupboard can authenticate verified users, connect invited users to households, register products by barcode/manual entry, recognize household or shared-catalog products, show inventory with search/filter/sort, identify low stock and expiry, add/consume portions optimistically, record movements, show product details, display remote product images, manage shopping items and simple recipes, expose basic analytics, persist to Firestore with local cache, and run as a configured PWA.

## Central inventory for two independent products

Cupboard's admin experience can inspect both product inventories in one place:

- **Cupboard / Home** — household stock and movements.
- **Sandwichies / Business** — business stock and movements.

The catalog identity can be shared, but stock is not shared. During registration, the admin explicitly selects the destination. Product cards and details identify that destination. Existing items remain assigned to their current workspace when edited; changing destinations must not silently duplicate or relocate stock.

## Product loop

```text
Find
  ↓
Check quantity
  ↓
Use / add
  ↓
Keep inventory current
```

Registration extends the loop:

```text
Scan / enter barcode
        ↓
Find existing product?
     ↙        ↘
   Yes         No
    ↓           ↓
Review       Register
    ↓           ↓
    └──── Update inventory ────┘
```

## Who it is for

Cupboard is for a person or household that wants to stay organized.

It should not assume inventory-management expertise.

## Product personality

Cupboard should feel:
- 🏠 hommie;
- 🌿 calm;
- 📦 organized;
- 👨‍👩‍👧‍👦 household-friendly;
- ✨ simple;
- 🧹 tidy rather than corporate.

## Current boundaries

The product is intentionally focused on household inventory.

Implemented supporting workflows:
- authentication and email verification;
- invitation-only households;
- owner/editor/member roles;
- expiry tracking;
- movements/history;
- shopping list;
- recipes;
- basic analytics;
- external barcode lookup;
- shared product catalog;
- remote product images;
- offline/cache foundation;
- PWA configuration.

Pending:
- richer role-aware save guidance;
- stronger scanner/device coverage;
- finer-grained save/error states;
- performance improvements for larger inventories;
- deeper offline/PWA validation;
- automated regression coverage.

Deferred:
- Firebase Storage uploads until a billing-enabled Firebase plan is acceptable.

Not currently a core direction:
- warehouse/ERP workflows;
- supplier management;
- enterprise procurement;
- social features;
- AI features without a concrete household problem.

## Product success

At this stage, success is not feature count.

A successful experience lets a user:
1. open the app;
2. understand the inventory immediately;
3. find a product quickly;
4. change a quantity with minimal effort;
5. register a new product without confusion;
6. leave knowing the intended inventory update was persisted.

## Future product test

Before adding a feature, ask:

> Does this help a household stay organized without making Cupboard feel like enterprise software?

If not, it needs a strong reason to exist.

## Reliability direction

The next product work prioritizes the core loop:

```text
Scan → Recognize → Understand → Edit → Save → See result
```

The October 4 checkpoint showed that real mobile behavior should be treated as a first-class product validation surface, not only a later QA step.
