# BRIEFING — 2026-10-29T13:57:00Z

## Mission
Implement Milestone M2 assignments (Features F5-F10) for POS Multivendor & Ergonomics: Mobile Switcher [Catálogo]/[Carrito], Touch Targets >= 44x44px, Form Flex-Wrap in ProductSearchPanel, Responsive Wrap in ParkedOrdersBar, and Doherty & Miller Optimizations (Debounce 200ms & Collapsible warehouse stock details).

## 🔒 My Identity
- Archetype: implementer, qa, specialist
- Roles: implementer, qa, specialist
- Working directory: c:\Users\Personal\Documents\Yurgen\Maestro_Pezcaderia_ERP\maestro_ERP_Pezcaderia\.agents\teamwork\worker_m2_1\
- Original parent: 893a38d8-5827-40f7-afd9-ff6dab5d7849
- Milestone: M2 - POS Multivendor & Ergonomics

## 🔒 Key Constraints
- Exclusive file ownership: `src/views/POSView.tsx`, `src/views/pos/components/*`, and test file `src/tests/m2POSMultivendor.test.tsx`.
- MUST NOT modify any files in `src/views/cash/`, `src/views/ClientsView.tsx`, or `src/views/InventoryView.tsx`.
- Follow strict integrity mandate: Genuine implementation, no hardcoding, real state.
- Light Mode WCAG AA+ tokens, Fitts's Law (>=44x44px targets), Doherty Threshold (<400ms feedback, 200ms debounce), Miller's Law (reduced cognitive load).
- All tests must pass, `npx tsc --noEmit` must exit code 0, no regressions in existing M1 tests.

## Current Parent
- Conversation ID: 893a38d8-5827-40f7-afd9-ff6dab5d7849
- Updated: not yet

## Task Summary
- **What to build**: F5-F10 POS Multivendor & Ergonomics features.
- **Success criteria**: Mobile switcher toggle between catalog and cart on <lg; >=44px touch targets on advisor selection buttons, TerminalVendorBadge, PaymentPanel (+Split and payment methods); responsive wrapping in ProductSearchPanel and ParkedOrdersBar; 200ms search debounce and collapsible warehouse details on product cards.
- **Interface contracts**: PROJECT.md
- **Code layout**: src/views/POSView.tsx, src/views/pos/components/*, src/tests/m2POSMultivendor.test.tsx

## Key Decisions Made
- [TBD]

## Artifact Index
- [TBD]

## Change Tracker
- **Files modified**: None yet
- **Build status**: Untested
- **Pending issues**: None

## Quality Status
- **Build/test result**: Not yet run
- **Lint status**: Clean
- **Tests added/modified**: Pending creation of src/tests/m2POSMultivendor.test.tsx

## Loaded Skills
- **Source**: erp-pos-design-tokens (c:\Users\Personal\Documents\Yurgen\Maestro_Pezcaderia_ERP\maestro_ERP_Pezcaderia\.agents\skills\erp-pos-design-tokens\SKILL.md)
  - **Local copy**: N/A
  - **Core methodology**: Light Mode WCAG AA+ tokens, minimum 44x44px touch targets, mobile responsiveness, clear visual hierarchy.
