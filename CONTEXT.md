# CONTEXT — Cupboard

**Document review:** 2026-11-17  
**Repository:** `palmid3v/cupboard-palmid3v`  
**Owner:** PALMI-D3V  
**Stage:** Functional MVP / active development / reliability hardening

## Product purpose

Cupboard centralizes product identity and inventory operations for two separated contexts: **Hogar** and **Negocio → Sandwichies**. The owner can view/manage both contexts while keeping balances, expiry records and movement histories independent.

## Product capabilities

- Firestore-backed product inventory and product details.
- Product lookup by name/barcode; camera scanning and manual barcode entry.
- Availability and low-stock filters, sorting and inventory summaries.
- Quantity/portion additions, consumption and adjustments with error handling.
- Minimum-stock and expiry tracking.
- Shopping lists, recipes and basic inventory analytics.
- Shared product identity with workspace-specific quantities and movements.
- Household membership, invitations, roles and protected access.
- Responsive web interface and PWA installation support.

## Domain ownership

- Cupboard owns product identity and stock balances/movements for authorized workspaces.
- Sandwichies owns commercial products/prices, customer orders and their lifecycle. It requests stock consumption; it does not own a duplicate stock ledger.
- DayFlow may display planning signals derived from Cupboard events, but does not own inventory.
- Financial-D3V may receive future minimized commercial events under an explicit contract; it does not receive private personal financial data from Cupboard.

Home and Business inventory data must never be mixed. Household members do not gain access to Sandwichies business inventory unless explicitly authorized under its business access policy.

## Architecture and stack

- React 19, Vite 8 and Tailwind CSS 4.
- Firebase Authentication and Cloud Firestore.
- Firestore Security Rules enforce workspace membership and role access.
- ZXing and html5-qrcode support barcode/camera workflows.
- vite-plugin-pwa provides PWA support.
- Regression tests, Rules emulator tests, ESLint and build scripts.

The runnable app is under `app/`; exact dependencies and scripts are in `app/package.json`.

## Import and migration safety

Inventory identity migrations and initial imports must be reviewed before applying. Use dry-run to inspect mappings and expected mutations. An actual apply requires a reviewed mapping, backup and explicit owner authorization. No destructive reset, migration or real inventory write during documentation-only maintenance.

## Quality evidence — checkpoint 2026-11-12

Functional regression 19/19, Firestore Rules emulator 8/8, lint, production build and theme-engine validation passed. The high/critical dependency audit gate failed intentionally: 25 findings in the full dependency tree (1 critical, 9 high); production-only audit reported 6 (1 critical, 5 high). This is historical evidence, not a new run on 2026-11-17. Functional checks alone do not establish release readiness.

## Current priorities

1. Resolve high/critical dependency vulnerabilities without reducing test coverage or weakening the audit gate.
2. Complete device/browser and responsive verification.
3. Verify workspace membership, business isolation and backend permissions.
4. Validate import/migration with dry-run, backup and reconciliation before applying.
5. Verify Sandwichies integration with isolated emulators and idempotency/retry scenarios.

## Canonical documentation

- `docs/PRODUCT.md`
- `docs/ARCHITECTURE.md`
- `docs/SECURITY.md`
- `docs/ROADMAP.md`
- `QUALITY-CHECKPOINT-2026-11-12.md`
- `app/README.md`

Keep dated QA reports immutable; record later results in a new dated checkpoint.

---
**Cupboard · PALMI-D3V**
