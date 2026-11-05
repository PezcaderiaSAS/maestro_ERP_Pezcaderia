# BRIEFING — 2026-11-05T16:02:30Z

## Mission
Survey & Technical Root-Cause Investigation of POS Cart Panel (R1) vertical collapse, layout hierarchy, and multivendor-cashier ergonomics.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigation, synthesis
- Working directory: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\explorer_survey_cart\
- Original parent: e581d92b-b34a-4a1c-839f-2a3c9710cd5f
- Milestone: survey_cart_panel

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Must follow 5-component handoff report (Observation, Logic Chain, Caveats, Conclusion, Verification Method)
- Do not modify source code; record findings and proposed solutions in handoff

## Current Parent
- Conversation ID: e581d92b-b34a-4a1c-839f-2a3c9710cd5f
- Updated: 2026-11-05T16:02:30Z

## Investigation State
- **Explored paths**:
  - `src/App.tsx` & `src/components/layout/layoutModes.ts` (Fixed transactional 100vh constraint)
  - `src/views/POSView.tsx` (Top bars, grid/flex column split, CartPanel mounting)
  - `src/views/pos/components/CartPanel.tsx` (Full DOM hierarchy, GlassCard, pos-cart-header, ParkedOrdersBar, pos-cart-items-list, pos-cart-footer)
  - `src/views/pos/components/LineaVentaRow.tsx` (2-tier layout, touch button sizing, wrapping behavior)
  - `src/views/pos/components/PaymentPanel.tsx` (Inline 617px liquidator mounted in footer)
  - `src/views/pos/components/DiscountPanel.tsx` (Summary calculations)
  - `src/views/pos/components/ParkedOrdersBar.tsx` (Draft sales bar)
  - `src/views/pos/components/PendingOrdersDrawer.tsx` & `CashierSupermarketTerminal.tsx` (Multivendor queue)
  - Vitest test suite (`posCartPanelErgonomics.test.tsx`, `challengerPOSCartAndSOPStress.test.tsx`, `m2POSMultivendor.test.tsx`)
- **Key findings**:
  1. Root cause of collapse is vertical height deficit: On a 1366x768 laptop, available height for CartPanel is only ~470px. The footer with PaymentPanel demands ~773px (`shrink-0 mt-auto`). This mathematical deficit (-466px) forces the flex-1 items list to 0px height.
  2. In mostrador mode, footer is ~292px + headers ~163px = 455px, leaving only ~15-20px for the items list (less than 1 row).
  3. Visual crowding in `LineaVentaRow`: Right-side controls consume 226px out of 356px usable column width, forcing unit price, discounts, and stock badges into 3-4 cramped wrapped lines; row height is 130-160px.
  4. Redundant parked order controls appear in 3 vertical levels (POSView top bar, CartPanel header, and ParkedOrdersBar).
  5. Decoupling cart browsing from payment tender (modal/drawer for payment on F2/Enter) will restore 100% vertical space to the items list.
- **Unexplored areas**:
  - None for R1 survey scope. Complete evidence chain established.

## Key Decisions Made
- Concluded that minor CSS patches cannot solve a 466px deficit: an architectural decoupling of the cart item list from the inline payment liquidator is necessary.
- Formulated the "Decoupled Cart / Tender on Demand" architecture and high-density retail row layout.

## Artifact Index
- DISPATCH.md — incoming dispatch instructions
- BRIEFING.md — working memory and identity
- progress.md — liveness heartbeat and subtask tracking
- handoff.md — final 5-component survey report
