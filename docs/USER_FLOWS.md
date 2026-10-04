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

## 2. Search and filter

Search matches product name or barcode/document ID.

Current filters:
- All;
- Low stock → portions <= 5;
- Available → portions > 0.

The result is combined with the active sort.

## 3. Sort inventory

Current options:
- Nombre A-Z;
- Más recientes;
- Menor stock;
- Mayor stock.

Recent sorting uses `updatedAt` when available.

The sort control is a custom dark dropdown rather than the browser's native select menu.

## 4. Add or consume a portion

```text
Product
  ↓
Tap +1 or -1
  ↓
Calculate next quantity
  ↓
Update React state immediately
  ↓
Persist with updatePortions()
  ↓
Success → keep new value
Failure → rollback + show error
```

Negative quantities are prevented.

The action does not reload the complete inventory.

## 5. Register by barcode

```text
Open Scanner
    ↓
Prepare camera
    ↓
Request camera access
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

The scanner accepts one successful result during a session.

### Scanner recovery

If camera startup fails, the scanner can show permission, missing-camera, camera-busy, or generic startup guidance.

The user can retry without reloading the page.

ZXing callback errors while searching for a barcode are not treated as repeated user-facing failures.

## 6. Manual barcode registration

The user can enter a barcode without the camera.

If the barcode already exists, the current manual flow prevents creating a duplicate registration.

## 7. Product form and save

Fields:
- Name;
- Description;
- Weight;
- Portions;
- Image URL.

Validation:
- barcode required;
- name required;
- portions >= 0;
- weight, when provided, >= 0.

Save flow:

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

## 8. Product images

When an image URL exists, inventory cards reserve a consistent image area and contain the image inside a bounded frame using `object-contain`.

If the remote image fails, the card falls back to a package placeholder.

The source image itself is not modified.

## 9. Theme

The current UI is dark-only.

There is no active light/dark/system selector.

## 10. “Inventario conectado”

The connected indicator reflects browser network state and Firestore snapshot metadata.

It distinguishes connected, offline/cache-backed, and connection-error states.

## Image URL

Product registration accepts a remote image URL. Local file uploads are deferred until Firebase Storage is enabled.

## UX rule

The user should always know:
1. where they are;
2. what happened;
3. what they can do next;
4. whether an action succeeded;
5. how to recover from an error.

Users should never need to understand Firestore, database IDs, or implementation details.
