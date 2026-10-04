# Contributing to Cupboard

This guide is for anyone who wants to understand or modify the project without needing the original author beside them.

## Before changing code

Read the smallest relevant set:

- Product idea → PRODUCT.md
- Architecture → ARCHITECTURE.md
- Data changes → DATA_MODEL.md
- User interaction → USER_FLOWS.md
- UI/UX → DESIGN_PRINCIPLES.md
- Planned work → ROADMAP.md

## Local setup

```bash
cd app
npm install
npm run dev
```

Before considering a change complete:

```bash
npm run lint
npm run build
```

## How to approach a change

### 1. Understand current behavior

Identify the current user flow, data flow, responsible component/service, validation, and error states.

### 2. Make the smallest coherent change

Cupboard is intentionally small.

Prefer existing React state where sufficient, focused components where useful, and the existing Firestore service boundary.

Avoid infrastructure simply because it is common in larger applications.

### 3. Preserve the product personality

Ask:

- Does this make the app easier for a household?
- Is the language understandable?
- Does the UI feel calm and organized?
- Is the primary action obvious?
- Did we add unnecessary complexity?

## UI changes

Preserve mobile usability, comfortable touch targets, clear hierarchy, theme support, and useful loading/success/error states.

Avoid turning simple actions into multi-step workflows or turning Cupboard into a corporate dashboard.

## Data changes

If modifying Firestore behavior:

1. update DATA_MODEL.md;
2. update ARCHITECTURE.md if the boundary changes;
3. check existing callers;
4. validate create/update behavior;
5. consider missing or legacy documents.

Keep Firestore access behind src/services/products.js where practical.

## Scanner changes

Test camera startup, permissions, successful scan, duplicate prevention, retry after failure, and mobile layout.

ZXing may emit non-fatal scan errors while searching. Do not turn every callback error into a user-facing failure.

## Documentation rule

Use these distinctions:

- Current — implemented and verified.
- Pending — known unfinished work.
- Future — an idea or direction that is not implemented.

Never document future functionality as current.

## Change quality

A good change explains what changed, why it changed, which flow is affected, whether data behavior changed, and how it was validated.

Update documentation in the same change when behavior changes.

## Code ownership mindset

Treat the repository as something another developer should be able to inherit.

Favor clear names, small boundaries, explicit behavior, updated docs, and no hidden assumptions.

The goal is not only working code. It is a project that is easy for the next person to continue.
