# Cupboard — Design Principles

## The feeling

Cupboard should feel like opening a clean, well-organized cupboard at home.

Everything has a place. Nothing is shouting for attention.

The interface should communicate:

> I know where everything is.

## 1. Home first

The product is designed for homes and households.

Prefer language such as products, portions, inventory, available, low stock, add, and consume.

Avoid unnecessary enterprise terminology.

## 2. Organized, not corporate

Use clear sections, strong hierarchy, consistent spacing, useful cards, concise summaries, and predictable controls.

Avoid excessive charts, dense tables, KPI walls, complicated filter panels, and decorative complexity.

## 3. Friendly, not childish

Cupboard can be warm without becoming a toy.

Icons and subtle visual personality are welcome, but the interface should remain mature and useful.

## 4. Calm visual hierarchy

The existing visual direction uses a green-centered palette and CSS variables for surfaces, text, borders, states, and shadows.

Future visual work should preserve semantic hierarchy for primary actions, secondary actions, success, warning, danger, and muted information.

Prefer existing semantic variables over arbitrary new colors.

## 5. Mobile matters

The scanner makes the phone a primary device.

Therefore:

- touch interactions matter
- controls must be easy to tap
- forms should remain comfortable
- important information should survive narrow screens
- bottom navigation should remain understandable

Desktop should feel like an expanded version of the same product.

## 6. One obvious next action

Every screen should make the next useful action easy to identify.

Examples:

- inventory → open a product or search
- scanner → scan a barcode
- new product → complete required information
- product detail → add or consume
- error → retry or recover

## 7. Feedback matters

Actions should communicate their result through loading states, disabled states, success feedback, error messages, and retry actions.

Never make a user wonder whether an action worked.

## 8. Accessibility is part of organization

Preserve semantic buttons, labels for inputs, focus states, meaningful aria attributes, readable contrast, keyboard access where applicable, and status/error messaging.

## 9. Do not hide important behavior

A contributor should be able to understand why an action exists.

Avoid UI behavior that depends on unexplained magic.

## 10. Allow different ideas

Cupboard is intentionally open to visual and UX reinterpretation.

A contributor may propose a different card layout, navigation model, visual hierarchy, empty state, or interaction pattern.

The proposal should still preserve:

**home-first + organized + calm + practical + easy to understand.**

## Design review checklist

Before merging a visual change:

- Does it work on a phone?
- Does the primary action stand out?
- Can a family member understand it without technical knowledge?
- Does it feel organized?
- Does it reduce cognitive load?
- Does it respect light/dark/system themes?
- Does it preserve accessible labels and states?
- Is it solving a real user problem?

If mostly yes, the design is likely moving in the right direction.
