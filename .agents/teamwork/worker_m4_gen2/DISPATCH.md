## 2026-10-29T16:30:10Z
You are worker_m4_gen2, an implementation worker subagent for Milestone M4: Catálogos de Clientes e Inventario.

Working Directory: c:\Users\Personal\Documents\Yurgen\Maestro_Pezcaderia_ERP\maestro_ERP_Pezcaderia\.agents\teamwork\worker_m4_gen2\
Parent Orchestrator Conversation ID: e42ef4de-8a0f-405a-9bf6-e0fafd6d44e7

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY SPECIFICATIONS TO READ BEFORE WRITING ANY CODE:
1. ORIGINAL_REQUEST.md path:
   c:\Users\Personal\Documents\Yurgen\Maestro_Pezcaderia_ERP\maestro_ERP_Pezcaderia\.agents\teamwork\ORIGINAL_REQUEST.md
2. Survey 1 Layout & Overflow Findings:
   c:\Users\Personal\Documents\Yurgen\Maestro_Pezcaderia_ERP\maestro_ERP_Pezcaderia\.agents\teamwork\teamwork_explorer_survey_1\handoff.md (Read Section E and Section 5.1)
3. Survey 2 UX Laws & Ergonomics Findings:
   c:\Users\Personal\Documents\Yurgen\Maestro_Pezcaderia_ERP\maestro_ERP_Pezcaderia\.agents\teamwork\teamwork_explorer_survey_2\handoff.md (Read Section 1.4 and Section 5)
4. Master Architecture:
   c:\Users\Personal\Documents\Yurgen\Maestro_Pezcaderia_ERP\maestro_ERP_Pezcaderia\PROJECT.md

YOUR EXCLUSIVE WRITE OWNERSHIP:
You own and may ONLY edit:
- `src/views/ClientsView.tsx`
- `src/views/InventoryView.tsx`
- `src/views/inventory/components/ProductTable.tsx`
- `src/views/inventory/components/StockMatrizTable.tsx`
- `src/views/inventory/components/InventoryDataTable.tsx`
- `src/tests/m4CatalogsAndInventory.test.tsx`
Do NOT modify files outside this set.

SCOPE & REQUIRED IMPLEMENTATION (Features F19–F25):
1. **F19: Clientes Fix Desbordamiento 350px in `ClientsView.tsx`**:
   - Lines 181–183 currently use rigid inline flex:
     `<div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>`
     `<div style={{ flex: '0 0 350px', display: 'flex', flexDirection: 'column', gap: '16px' }}>`
     This causes a severe 347px blowout on 375px mobile viewports!
   - Replace with responsive Tailwind layout:
     `className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-stretch lg:items-start w-full min-w-0"`
     and column: `className="w-full lg:w-[350px] lg:shrink-0 flex flex-col gap-4 min-w-0"`.
2. **F20: Clientes Header Wrap & Fluid Padding in `ClientsView.tsx`**:
   - In line 155, replace `style={{ padding: '24px' }}` with `className="p-3 sm:p-6 max-w-[1600px] mx-auto w-full overflow-hidden"`.
   - In line 157, replace the single-line header with `className="flex flex-wrap items-center justify-between gap-3 mb-6"`, allowing "Importar CSV" and "Nuevo Cliente" buttons to wrap gracefully on mobile screens.
3. **F21: Clientes Contraste WCAG AA+ in `ClientsView.tsx`**:
   - In lines 159, 223, 227, replace hardcoded inline `color: '#0F172A'` with semantic theme token classes (`text-slate-100 dark:text-slate-100` or `text-primary`), eliminating the illegible 1.1:1 contrast and ensuring WCAG AA+ compliance in both dark and light modes.
4. **F22: Clientes Doherty Debounce & Memo in `ClientsView.tsx`**:
   - In line 189, apply 200ms debounce to the search input.
   - In lines 206–208, memoize client debt calculations (`useMemo`) to eliminate O(N*M) heavy iteration on every keystroke.
5. **F23: Inventario Pestañas Chunks (Miller's Law) in `InventoryView.tsx`**:
   - In line 1659, organize the 14 horizontal tabs into structured chunks or provide a mobile category selector dropdown so mobile users do not have to swipe through 14 raw tabs.
6. **F24: Inventario Tabla Productos Móvil in `ProductTable.tsx`**:
   - Ensure header buttons wrap cleanly (`flex-wrap gap-2`). Wrap the table in `overflow-x-auto` and provide compact mobile formatting.
7. **F25: Inventario WMS Hover Fix (Jakob's Law) in `InventoryDataTable.tsx`**:
   - In lines 50–63, remove `opacity-0 group-hover:opacity-100` from `Trasladar` and `Merma` buttons. Ensure they are permanently accessible on touchscreens with touch target height >= 44px (`min-h-[44px]`).

VERIFICATION REQUIREMENTS:
1. Write unit and component tests in `src/tests/m4CatalogsAndInventory.test.tsx` verifying:
   - `ClientsView` layout is responsive and contains no rigid 350px blowout.
   - Header wraps on mobile.
   - Text color uses theme tokens (not hardcoded `#0F172A`).
   - Search input is debounced.
   - WMS action buttons are accessible without hover.
2. Run build verification: `npx tsc --noEmit`
3. Run test verification: `npx vitest run src/tests/m4CatalogsAndInventory.test.tsx`
4. Document all verification commands and exact passing outputs in `handoff.md`.
5. Update your `progress.md` after each step and deliver `handoff.md` in your working directory.
6. When done, call `send_message` to parent orchestrator (`e42ef4de-8a0f-405a-9bf6-e0fafd6d44e7`).
