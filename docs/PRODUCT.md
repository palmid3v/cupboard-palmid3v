# Cupboard — Product

## Product statement

**Cupboard is a friendly home inventory app that helps people know what they have, how much is left, and what needs attention.**

It is deliberately smaller and more human than a warehouse-management application.

## Core job to be done

> When I need to know what I have at home, I want to check it quickly and update it without friction.

## Current MVP promise

Today Cupboard can register products, scan barcodes, enter barcodes manually, find existing products, show inventory, search/filter/sort, identify low stock, add/consume portions, update quantities optimistically, recover from failed quantity persistence, show product details, display optional product images, persist products in Firestore, and run as a configured PWA.

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

Not implemented:
- authentication;
- household accounts;
- shared permissions;
- offline-first inventory;
- live Firestore connectivity status;
- expiry management;
- shopping automation;
- recipes;
- meal planning;
- analytics;
- purchase history;
- supplier management;
- automatic product catalog enrichment;
- automatic product image/background processing.

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
