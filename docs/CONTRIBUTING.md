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
- duplicate prevention;
- retry after failure;
- repeated scanner sessions;
- camera cleanup;
- mobile layout.

ZXing may emit non-fatal callback errors while searching. Do not turn every callback error into a user-facing failure.

## Connectivity status

The current green **Inventario conectado** treatment is presentation only.

Do not document it as live connectivity unless an explicit connectivity source of truth has been implemented.

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
