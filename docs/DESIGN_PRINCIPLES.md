# Cupboard — Design Principles

## The feeling

Cupboard should feel like opening a clean, well-organized cupboard at home.

> **I know where everything is.**

## 1. Home first

Prefer language such as products, portions, inventory, available, low stock, add, and consume.

Avoid unnecessary enterprise terminology.

## 2. Organized, not corporate

Use clear sections, strong hierarchy, consistent spacing, useful cards, concise summaries, and predictable controls.

Avoid excessive charts, dense tables, KPI walls, complicated filter panels, and decorative complexity without purpose.

## 3. Friendly, not childish

Cupboard can be warm without becoming a toy.

Icons and subtle visual personality are welcome, but the interface should remain mature and useful.

## 4. Calm visual hierarchy

The current visual direction uses dark surfaces, warm neutral backgrounds, a green-centered primary color, and semantic CSS variables for borders, text, states, and shadows.

Future visual work should preserve semantic hierarchy rather than introduce arbitrary colors.

## 5. Product cards and images

Cards should have predictable geometry.

Product images are external content and may have white backgrounds, very wide proportions, very tall proportions, transparent backgrounds, or failed URLs.

Therefore:
- reserve a fixed image area;
- contain images rather than stretch/crop them;
- use a bounded product-photo frame when appropriate;
- keep product information below the image;
- never let one source image determine card height.

## 6. Mobile matters

The scanner makes the phone a primary device.

Therefore:
- touch targets matter;
- controls must be easy to tap;
- forms should remain comfortable;
- important information must survive narrow screens;
- bottom navigation must remain understandable.

Desktop should feel like an expanded version of the same product.

## 7. One obvious next action

Examples:
- inventory → open/search a product;
- scanner → scan a barcode;
- new product → complete required information;
- product detail → add or consume;
- error → retry or recover.

## 8. Feedback matters

Actions should communicate their result through loading, disabled, immediate optimistic feedback where appropriate, success, error, and retry states.

Never make a user wonder whether an action worked.

## 9. Accessibility is part of organization

Preserve semantic buttons, labels for inputs, focus states, meaningful ARIA attributes, readable contrast, keyboard access where applicable, and status/error messaging.

## 10. Do not hide important behavior

A contributor should be able to understand why an action exists.

The **Inventario conectado** indicator is currently presentation-only. Documentation must not imply that it is a live connectivity monitor.

## 11. Allow different ideas

Cupboard is intentionally open to visual and UX reinterpretation.

A contributor may propose a different card layout, navigation model, visual hierarchy, empty state, or interaction pattern.

The proposal should still preserve:

**home-first + organized + calm + practical + easy to understand.**

## Design review checklist

Before merging a visual change:
- Does it work on a phone?
- Does the primary action stand out?
- Can a household member understand it without technical knowledge?
- Does it feel organized?
- Does it reduce cognitive load?
- Does it preserve the dark visual direction?
- Does it preserve accessible labels and states?
- Does it handle unusual product images gracefully?
- Is it solving a real user problem?

## 13. Mobile camera guidance

The scanner is a primary mobile workflow. When recognition takes time, the interface should help the user recover without guessing.

Prefer:
- clear camera-ready state;
- short positioning guidance;
- obvious retry after interruption;
- feedback when a barcode was detected;
- behavior that remains useful when autofocus is slow.

Do not assume the browser can force identical autofocus behavior across devices.

## 14. Permission-aware feedback

Different household roles can see the same product information while having different write capabilities.

The interface should explain permission limits before or during the save action when practical. The user should never need to understand Firestore Rules to understand why a write is unavailable.

## 15. Reliability over decorative complexity

When choosing between a richer animation and clearer action feedback, prefer the clearer feedback. The scan → recognize → save loop is more important than visual novelty.
