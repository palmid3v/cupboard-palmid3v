# Cupboard — User Flows

## 1. Open inventory

```text
Open Cupboard
    ↓
Load products from Firestore
    ↓
Show inventory summary
    ↓
Show searchable/filterable product list
```

Inventory is the primary home of the application.

## 2. Search inventory

The search term is matched against product name and barcode/document ID.

The result is then combined with the active filter and sort order.

## 3. Filter inventory

Current filters:

- All
- Low stock
- Available

Low stock means portions <= 5.

Available means portions > 0.

## 4. Sort inventory

Current options include:

- name
- low stock
- high stock
- recent

Recent uses updatedAt when available.

## 5. Open a product

Selecting a product opens its detail state and exposes inventory actions.

## 6. Consume a portion

```text
Product
  ↓
Tap consume
  ↓
Current portions - 1
  ↓
Prevent negative value
  ↓
Update Firestore
  ↓
Refresh inventory
```

If the update fails, an error state is shown.

## 7. Add a portion

```text
Product
  ↓
Tap add
  ↓
Current portions + 1
  ↓
Update Firestore
  ↓
Refresh inventory
```

## 8. Register by barcode

```text
Open Scanner
    ↓
Camera starts
    ↓
Point camera at barcode
    ↓
Code detected
    ↓
Search Firestore
   ↙       ↘
Found      New
  ↓          ↓
Show data   Empty form
```

The scanner handles one successful scan during a scanner session.

## 9. Manual barcode registration

The user can enter a barcode without using the camera.

If the barcode already exists, the current flow prevents creating a duplicate manual registration and directs the user toward the existing product/inventory flow.

## 10. Product form

Current fields:

- Name
- Description
- Weight
- Portions
- Image URL

Validation includes:

- barcode required
- name required
- portions must be >= 0
- weight, when provided, must be >= 0

## 11. Save product

```text
Validate
   ↓
saveProduct()
   ↓
Firestore create/update
   ↓
Reload inventory
   ↓
Return to inventory
```

## 12. Camera error

When camera access fails, the scanner shows an error state, explains that browser permissions may need review, and provides a retry action.

Scanner failures should not crash the application.

## 13. Theme preference

```text
Open Settings
   ↓
Choose Light / Dark / System
   ↓
Store preference in localStorage
   ↓
Apply theme
```

System mode follows the browser/OS color preference.

## UX rule for flows

The user should always know:

1. where they are;
2. what happened;
3. what they can do next;
4. whether an action succeeded;
5. how to recover from an error.

Users should never need to understand Firestore, database IDs, or implementation details.
