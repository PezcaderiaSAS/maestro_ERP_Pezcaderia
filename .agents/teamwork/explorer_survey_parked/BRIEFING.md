# BRIEFING — 2026-11-05T16:05:00Z

## Mission
Survey & Ergonomic Investigation of Parked Orders and Multivendor-Caja Única Flow (R2)

## 🔒 My Identity
- Archetype: teamwork_explorer
- Roles: [investigator, analyst]
- Working directory: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\explorer_survey_parked\
- Original parent: e581d92b-b34a-4a1c-839f-2a3c9710cd5f
- Milestone: POS Ergonomics & Multivendor Caja Única Flow

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Write only to .agents/teamwork/explorer_survey_parked/
- Spanish (es-419) documentation standard
- Adhere to Teamwork protocol (Observation, Logic Chain, Caveats, Conclusion, Verification Method)

## Current Parent
- Conversation ID: e581d92b-b34a-4a1c-839f-2a3c9710cd5f
- Updated: 2026-11-05T16:05:00Z

## Investigation State
- **Explored paths**:
  - `src/views/pos/components/ParkedOrdersBar.tsx`
  - `src/views/pos/components/PendingOrdersDrawer.tsx`
  - `src/views/pos/components/TerminalVendorBadge.tsx`
  - `src/views/pos/components/CartPanel.tsx`
  - `src/views/pos/components/PaymentPanel.tsx`
  - `src/views/pos/components/DiscountPanel.tsx`
  - `src/views/pos/components/LineaVentaRow.tsx`
  - `src/views/POSView.tsx`
  - `src/App.tsx` and `src/components/layout/layoutModes.ts`
  - `src/services/posDraftService.ts`
  - `src/services/prefacturaService.ts`
  - `src/stores/useMultiVendorPosStore.ts`
  - `src/stores/useCashierKanbanStore.ts`
  - `src/stores/useOutboxSyncStore.ts`
  - `src/tests/posParkedSalesFlow.test.tsx`
  - `src/tests/pendingOrdersDrawer.test.tsx`
  - `src/tests/terminalVendorBadge.test.tsx`
  - `src/tests/m2POSMultivendor.test.tsx`
- **Key findings**:
  - Vertical collapse root cause: In counter laptop viewports (768px, ~590px net `<main>` height), the fixed vertical overhead inside `CartPanel` (GlassCard header 58px + `.pos-cart-header` 48px + `ParkedOrdersBar` 94px + Footer 273px = 473px) exceeds the available column height (358px after 5 header bars of 232px). Deficit is -115px, reducing cart items to 0px visible area!
  - `ParkedOrdersBar` acts as a 94px vertical penalty that appears dynamically when drafts > 0, causing abrupt layout shifts and squishing the cart.
  - Multivendor Caja Única workflow is fragmented across 4 separate UIs (ParkedOrdersBar, PendingOrdersDrawer, VendorTicketSidebar, SweetAlert Borradores).
  - Uncommitted changes in `POSView.tsx` shrank buttons to 36px to save space, violating Fitts's law (44px) and breaking 2 tests in `m2POSMultivendor.test.tsx`.
- **Unexplored areas**: None within the scope of R2 survey.

## Key Decisions Made
- Formulate concrete recommendations:
  1. Remove `ParkedOrdersBar` from cart vertical stack, transform into a compact cart header trigger or slide-over drawer / popover.
  2. Consolidate 5 header bars in `POSView` into a unified 2-row header (saving ~140px).
  3. Compact `DiscountPanel` to a 1-row summary (saving ~75px).
  4. Design compact retail density for `LineaVentaRow` (65px target height vs 125px).
  5. Restore 44px Fitts's law compliance on vendor and drawer trigger buttons.

## Artifact Index
- `DISPATCH.md` — Received dispatch message
- `BRIEFING.md` — Situational awareness
- `progress.md` — Liveness & progress heartbeat
- `handoff.md` — Final comprehensive 5-component handoff report
