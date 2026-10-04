# Cupboard — Roadmap

## Status legend

- ✅ Current — implemented
- 🟡 Pending — known improvement or incomplete area
- 🔵 Future — product idea, not committed implementation

## Current foundation

### Inventory
- ✅ Product inventory
- ✅ Search
- ✅ Filters
- ✅ Sorting
- ✅ Low-stock visibility
- ✅ Inventory summary
- ✅ Product details
- ✅ Add/consume portions

### Registration
- ✅ Barcode scanning
- ✅ Manual barcode entry
- ✅ Existing-product lookup
- ✅ New-product registration
- ✅ Product validation
- ✅ Optional image URL

### Preferences
- ✅ Light theme
- ✅ Dark theme
- ✅ System theme
- ✅ Local preference persistence

### Platform
- ✅ React/Vite application
- ✅ Firestore persistence
- ✅ Responsive layout
- ✅ PWA configuration
- 🟡 Final PWA icon set

## Near-term improvements

### Finish the PWA package
- 🟡 proper install icons
- 🟡 verify manifest metadata
- 🟡 test install/update behavior
- 🟡 verify standalone navigation

### Improve application structure
- 🟡 extract inventory UI into focused components
- 🟡 extract product form
- 🟡 extract settings
- 🟡 extract reusable navigation
- 🟡 introduce hooks only where they improve clarity

The goal is not abstraction for its own sake.

### Strengthen data safety
- 🟡 document Firestore security expectations
- 🟡 review Firebase configuration strategy
- 🟡 define deployment configuration
- 🟡 establish backup/data-recovery expectations

## Product opportunities

These are deliberately separated from implementation commitments.

### Household collaboration
- 🔵 authentication
- 🔵 shared household
- 🔵 family members
- 🔵 permissions

### Inventory intelligence
- 🔵 expiry dates
- 🔵 stock history
- 🔵 quantity trends
- 🔵 smarter low-stock rules

### Household workflows
- 🔵 shopping list
- 🔵 need-to-buy state
- 🔵 recurring household items
- 🔵 product locations

### Kitchen assistance
- 🔵 recipes from available products
- 🔵 meal planning
- 🔵 ingredient usage

Only add these when they strengthen the home-organization experience.

## Avoid feature creep

Cupboard does not need to become:

- a warehouse management system
- a procurement platform
- an ERP
- an analytics-heavy business dashboard
- a social network
- an AI feature collection

AI can be useful later only when it solves a concrete household problem.

## Suggested evolution

```text
Current MVP
   ↓
Polish + reliability
   ↓
Better PWA experience
   ↓
Cleaner architecture
   ↓
Household sharing, if needed
   ↓
Smarter home workflows
```

Build trust in the basic inventory experience before adding complexity.
