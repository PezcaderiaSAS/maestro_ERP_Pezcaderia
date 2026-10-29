## 2026-10-29T16:29:49Z
You are worker_m3_gen2, an implementation worker subagent for Milestone M3: Caja Única & Tablero Kanban.

Working Directory: c:\Users\Personal\Documents\Yurgen\Maestro_Pezcaderia_ERP\maestro_ERP_Pezcaderia\.agents\teamwork\worker_m3_gen2\
Parent Orchestrator Conversation ID: e42ef4de-8a0f-405a-9bf6-e0fafd6d44e7

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY SPECIFICATIONS TO READ BEFORE WRITING ANY CODE:
1. ORIGINAL_REQUEST.md path:
   c:\Users\Personal\Documents\Yurgen\Maestro_Pezcaderia_ERP\maestro_ERP_Pezcaderia\.agents\teamwork\ORIGINAL_REQUEST.md
2. Survey 1 Layout & Overflow Findings:
   c:\Users\Personal\Documents\Yurgen\Maestro_Pezcaderia_ERP\maestro_ERP_Pezcaderia\.agents\teamwork\teamwork_explorer_survey_1\handoff.md (Read Section C and D)
3. Survey 2 UX Laws & Ergonomics Findings:
   c:\Users\Personal\Documents\Yurgen\Maestro_Pezcaderia_ERP\maestro_ERP_Pezcaderia\.agents\teamwork\teamwork_explorer_survey_2\handoff.md (Read Section 1.2 and 1.3)
4. Master Architecture:
   c:\Users\Personal\Documents\Yurgen\Maestro_Pezcaderia_ERP\maestro_ERP_Pezcaderia\PROJECT.md

YOUR EXCLUSIVE WRITE OWNERSHIP:
You own and may ONLY edit:
- `src/views/cash/CashFlowView.tsx`
- `src/views/pos/components/CashierKanbanView.tsx`
- `src/views/OrderKanbanView.tsx`
- `src/tests/m3CashAndKanban.test.tsx`
Do NOT modify files outside this set.

SCOPE & REQUIRED IMPLEMENTATION (Features F11–F18):
1. **F11: Caja Única Selectores Header Wrap in `CashFlowView.tsx`**:
   - In `CashFlowView.tsx:166-188`, the container with Bodega and Caja selectors lacks `flex-wrap` and measures ~340px, causing a 25px blowout on 375px mobile viewports.
   - Add `flex-wrap gap-2.5` and responsive width (`w-full sm:w-auto`) to eliminate horizontal overflow (`scrollWidth <= clientWidth`).
2. **F12: Caja Movimientos Responsive in `CashFlowView.tsx`**:
   - In `CashFlowView.tsx:380-450`, ensure the movements table is wrapped with `overflow-x-auto` and has compact responsive padding/styling for mobile viewports.
3. **F13: Caja Filtro Tabs Fitts's Law in `CashFlowView.tsx`**:
   - In `CashFlowView.tsx:304-369`, filter tabs (`TODO`, `VENTAS`, `GASTOS`, etc.) currently measure 28px (`py-1.5 text-xs`). Increase them to `min-h-[44px] px-3.5 py-2` meeting Fitts's Law (>=44x44px).
4. **F14: Caja Memoización de Ordenamiento in `CashFlowView.tsx`**:
   - In `CashFlowView.tsx:391`, eradicate the in-JSX mutating `.sort()`. Implement `useMemo` with non-mutating copy `[...movimientosFiltrados].sort(...)`.
5. **F15: Caja Única Integración Kanban in `CashFlowView.tsx`**:
   - Add a tab/mode switcher in `CashFlowView.tsx`: `[Flujo & Arqueo]` | `[Comandas & Preventas (Kanban)]`. When "Comandas & Preventas" is selected, render `CashierKanbanView` so the cashier can directly collect pre-sales in taquilla without navigating away.
6. **F16: Kanban Chips y Cobro Fitts's Law in `CashierKanbanView.tsx`**:
   - In `CashierKanbanView.tsx:158-185`, increase advisor filter chips from 24px (`py-1`) to `min-h-[44px] px-3 py-2 text-xs font-bold`.
   - In `CashierKanbanView.tsx:278-285`, increase `btn-iniciar-cobro-*` ("Pasar a Cobro (F9)") from 28px (`py-1.5`) to `min-h-[44px] py-2.5 px-4 font-bold`.
7. **F17: Kanban Search Input & Debounce in `OrderKanbanView.tsx`**:
   - In `OrderKanbanView.tsx:716-724`, fix the conflicting classes `min-h-[48px] h-10` to use consistent `min-h-[44px]`.
   - Apply 200ms debounce to the search input to protect the main thread from synchronous filtering on every keystroke.
8. **F18: Kanban Touch Actions in `OrderKanbanView.tsx`**:
   - Ensure Kanban cards have accessible touch action buttons to advance cards between columns on mobile screens where HTML5 drag-and-drop is inactive.
9. **Color & Theme Cleanliness**:
   - In `CashFlowView.tsx:159`, remove hardcoded `bg-[#070A10]` and use theme-compatible classes (`bg-slate-950/40 text-slate-100` or CSS variables) ensuring legible contrast in light and dark modes.

VERIFICATION REQUIREMENTS:
1. Write unit and component tests in `src/tests/m3CashAndKanban.test.tsx` verifying:
   - Header selectors wrap without blowout.
   - Movements sort is memoized without mutation.
   - Action buttons and filter tabs have `min-h-[44px]`.
   - Sub-tab switcher in Caja renders `CashierKanbanView`.
2. Run build verification: `npx tsc --noEmit`
3. Run test verification: `npx vitest run src/tests/m3CashAndKanban.test.tsx`
4. Document all verification commands and exact passing outputs in `handoff.md`.
5. Update your `progress.md` after each step and deliver `handoff.md` in your working directory.
6. When done, call `send_message` to parent orchestrator (`e42ef4de-8a0f-405a-9bf6-e0fafd6d44e7`).
