# Contributing to Cupboard

This guide is for anyone who wants to understand or modify the project without needing the original author beside them.

## Before changing code

Read the smallest relevant set:
- Product idea → `PRODUCT.md`
- Architecture → `ARCHITECTURE.md`
- Data changes → `DATA_MODEL.md`
- User interaction → `USER_FLOWS.md`
- UI/UX → `DESIGN_PRINCIPLES.md`
- Planned work → `ROADMAP.md`

## Local setup

```bash
cd app
npm install
npm run dev
```

Before considering a meaningful change complete:

```bash
npm run lint
npm run build
```

Then manually test the affected flow.

## How to approach a change

### 1. Understand current behavior

Identify the current user flow, data flow, responsible component/service, validation, loading/success/error states, and whether the UI uses optimistic state.

If documentation and code disagree, inspect the code first. The implementation is the source of truth.

### 2. Make the smallest coherent change

Prefer existing React state where sufficient, focused components where useful, the existing Firestore service boundary, and explicit behavior.

Avoid infrastructure simply because it is common in larger applications.

### 3. Preserve the product personality

Ask:
- Does this make the app easier for a household?
- Is the language understandable?
- Does the UI feel calm and organized?
- Is the primary action obvious?
- Does the change reduce friction?
- Did we add unnecessary complexity?

## UI changes

Preserve mobile usability, comfortable touch targets, clear hierarchy, the current dark visual direction, useful feedback states, and predictable card geometry.

Product images are external inputs. Do not assume they share the same aspect ratio, background, or quality.

## Data changes

If modifying Firestore behavior:
1. update `DATA_MODEL.md`;
2. update `ARCHITECTURE.md` if the boundary changes;
3. update `USER_FLOWS.md` when the interaction changes;
4. check existing callers;
5. validate create/update behavior;
6. consider missing or legacy documents.

Keep Firestore access behind `src/services/products.js` where practical.

## Scanner changes

Test:
- camera startup;
- permission denied;
- permission granted;
- successful scan;
- one-scan deduplication;
- retry after failure;
- repeated scanner sessions;
- camera cleanup;
- mobile layout;
- slow-focus / poor-positioning behavior.

The active scanner is `@zxing/browser`.

When scanner startup changes, test at least one real mobile device. Desktop camera behavior is not equivalent to mobile Safari/Chrome.

ZXing may emit non-fatal callback errors while searching. Do not turn every callback error into a user-facing failure.

## Connectivity status

The **Inventario conectado** treatment is backed by browser online/offline events and Firestore snapshot metadata.

When changing this area:
- preserve the distinction between server-backed and cache-backed state;
- keep the owner connect/disconnect control scoped to the current browser;
- do not describe it as a backend health-check service.

## Documentation rule

Use these distinctions:
- **Current** — implemented in the code.
- **Pending** — known unfinished work.
- **Future** — idea or direction not implemented.

Never document future functionality as current.

## Change quality

A good change explains what changed, why it changed, which flow is affected, whether data behavior changed, and how it was validated.

Update documentation in the same change when behavior changes.

## Code ownership mindset

Treat the repository as something another developer should be able to inherit.

Favor clear names, small boundaries, explicit behavior, updated docs, and no hidden assumptions.

The goal is not only working code. It is a project that is easy for the next person to continue.

## 🧭 Data-model changes — October 2026

Cupboard now uses an explicit migration strategy for inventory data.

When changing inventory persistence:

1. Treat `productCatalog/{barcode}` as global product identity.
2. Treat `households/{householdId}/inventory/{barcode}` as household stock state.
3. Keep `movements` household-scoped.
4. Do not delete or rewrite the legacy `households/{householdId}/products` collection during normal feature development.
5. Update `DATA_MODEL.md`, `ARCHITECTURE.md`, `SECURITY.md`, and `ROADMAP.md` when the persistence boundary changes.
6. Run `npm run lint` and `npm run build`.
7. Perform manual regression before considering the change ready for migration.

### Migration rule

Never treat the existence of `inventory.js` as permission to reset Firebase.

The destructive operation is a separate, explicit milestone guarded by:

> ⚠️ **AHORA SÍ: RESET + MIGRACIÓN**
## Save-flow regression rule

When changing product save behavior, explicitly test the distinction between:
- primary Firestore write failure;
- permission-denied;
- temporary network/Auth availability;
- successful write followed by realtime inventory update.

Do not use an unnecessary second full inventory reload as the proof that a save succeeded.

## Operational phase tracking

Use `STEP-BY-STEP-CUPBOARD-2026-10-04.md` for the current phase sequence. New reliability work should advance the phase status there and in `docs/ROADMAP.md` so another developer can see what is implemented versus pending.
