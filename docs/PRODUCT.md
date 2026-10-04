# Cupboard — Product

## Product statement

**Cupboard is a friendly home inventory app that helps people know what they have, how much is left, and what needs attention.**

It is deliberately smaller and more human than a warehouse-management application.

## The problem

Household inventory often lives in people's memory. That creates repeated friction: forgetting what is already at home, buying duplicates, not knowing how much remains, and having to inspect cupboards manually.

Cupboard turns that mental bookkeeping into a simple digital inventory.

## Who it is for

Cupboard is for a person or household that wants to stay organized.

Examples include someone managing a kitchen, a family keeping track of common products, roommates organizing shared supplies, or anyone who simply likes knowing what is available at home.

The product should not assume inventory-management expertise.

## Core job to be done

> When I need to know what I have at home, I want to check it quickly and update it without friction.

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

## Product personality

Cupboard should feel:

- 🏠 hommie
- 🌿 calm
- 📦 organized
- 👨‍👩‍👧‍👦 family-friendly
- ✨ simple
- 🧹 tidy rather than corporate

“Organized” does not mean “cold”.

## Current MVP promise

Today Cupboard can register products, find products by barcode, scan with a camera, manually enter barcodes, show inventory, search/filter/sort, identify low stock, add/consume portions, show product details, persist products in Firestore, remember appearance preferences, and run as a configured PWA.

## What Cupboard is not today

The following are not current functionality:

- household accounts
- authentication
- shared permissions
- expiration management
- shopping automation
- recipe intelligence
- meal planning
- analytics
- purchase history
- supplier management

Do not describe future ideas as existing features.

## Product success

For the current stage, success is not feature count.

A successful experience lets a user:

1. open the app;
2. understand the inventory immediately;
3. find a product quickly;
4. change a quantity with minimal effort;
5. register a new product without confusion;
6. leave knowing the inventory is up to date.

## Future product test

Before adding a feature, ask:

> Does this help a household stay organized without making Cupboard feel like enterprise software?

If not, it needs a strong reason to exist.
