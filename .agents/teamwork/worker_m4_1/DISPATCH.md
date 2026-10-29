## 2026-10-29T13:58:41Z
You are worker_m4_1, a teamwork_worker subagent assigned to Milestone M4: Catálogos de Clientes & Inventario.

## Working Directory
Your working directory is:
`c:\Users\Personal\Documents\Yurgen\Maestro_Pezcaderia_ERP\maestro_ERP_Pezcaderia\.agents\teamwork\worker_m4_1\`
Write all coordination files (DISPATCH.md, BRIEFING.md, progress.md, handoff.md) in your working directory. NEVER write agent metadata to source directories.

## Mandatory User Request & Scope Reference
You MUST read:
1. ORIGINAL_REQUEST.md at `c:\Users\Personal\Documents\Yurgen\Maestro_Pezcaderia_ERP\maestro_ERP_Pezcaderia\.agents\teamwork\ORIGINAL_REQUEST.md`
2. PROJECT.md at `c:\Users\Personal\Documents\Yurgen\Maestro_Pezcaderia_ERP\maestro_ERP_Pezcaderia\PROJECT.md`
3. Survey reports at:
   - `c:\Users\Personal\Documents\Yurgen\Maestro_Pezcaderia_ERP\maestro_ERP_Pezcaderia\.agents\teamwork\teamwork_explorer_survey_1\handoff.md` (Section 1.4: Catálogos de Clientes y Productos)
   - `c:\Users\Personal\Documents\Yurgen\Maestro_Pezcaderia_ERP\maestro_ERP_Pezcaderia\.agents\teamwork\teamwork_explorer_survey_2\handoff.md` (Section 1.4: Catálogos & Inventario)

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Write Ownership
You EXCLUSIVELY own and may modify:
- `src/views/ClientsView.tsx`
- `src/views/InventoryView.tsx`
- `src/views/inventory/components/*` (such as `ProductTable.tsx`, `StockMatrizTable.tsx`, `InventoryDataTable.tsx`, etc.)
- `src/tests/m4CatalogsAndInventory.test.tsx` (new unit & component test file)

You MUST NOT edit files owned by M1 (`src/index.css`, `src/components/layout/*`, `src/components/ui/Button.tsx`), M2 (`src/views/POSView.tsx`, `src/views/pos/components/*`), or M3 (`src/views/cash/*`, `src/views/OrderKanbanView.tsx`).

## Objectives & Feature Requirements (F19–F25)

1. **F19: Clientes Fix Desbordamiento 350px (Survey 1 §1.4)**:
   In `src/views/ClientsView.tsx`, eliminate fixed `flex: 0 0 350px` or fixed column widths without wrapping that cause a 347px overflow at 375px. Replace with responsive layout `flex flex-col lg:flex-row w-full min-w-0 overflow-hidden`. Both client list and detail panels must adapt to mobile viewports without forcing horizontal document scrolling (`scrollWidth <= clientWidth`).

2. **F20: Clientes Header Wrap & Fluid Padding (Survey 1 §1.4)**:
   Ensure the header actions, filters, search bar, and "Nuevo Cliente" button in `ClientsView.tsx` wrap gracefully (`flex flex-wrap items-center gap-2 sm:gap-3`), with fluid container padding `p-3 sm:p-6`, eliminating horizontal blowout.

3. **F21: Clientes Contraste WCAG AA+ (Survey 2 §1.4)**:
   Remove all hardcoded dark text colors such as `#0F172A` or `text-slate-900` applied over containers that may be dark in glass mode or styled with custom card backgrounds. Use semantic design tokens: `text-primary`, `text-secondary`, `bg-[var(--card-bg)]`, `border-[var(--border-color)]`, ensuring compliance with WCAG AA+ (>=4.5:1 text contrast).

4. **F22: Clientes Doherty Debounce & Memoization (Survey 2 §1.4)**:
   - Debounce search input (e.g. 200ms) so typing does not trigger aggressive UI re-renders or unthrottled scans.
   - Memoize O(N*M) debt / cartera calculations with `useMemo` so client filtering remains instantaneous (<400ms visual response).

5. **F23: Inventario Pestañas Chunks (Miller's Law - Survey 2 §1.4)**:
   In `src/views/InventoryView.tsx`, the 14 unorganized tabs overload cognitive capacity on mobile and small screens. Chunk them into 5 structured categories (e.g. Stock & Catálogo, Movimientos & Kárdex, Despiece & Mermas, Compras & Lotes, Configuración WMS) or provide a clean responsive category filter / dropdown for mobile viewports, while retaining full access to all 14 tab views.

6. **F24: Inventario Tabla Productos Móvil (Survey 1 §1.4)**:
   In `src/views/inventory/components/ProductTable.tsx` (and `StockMatrizTable.tsx` if applicable), add responsive mobile treatment (card view on `< sm/md` or responsive table wrapper `overflow-x-auto w-full max-w-full`) so that the table container does not stretch the page body past 375px. Ensure columns shrink and clip text (`truncate`, `min-w-0`) where appropriate.

7. **F25: Inventario WMS Hover Fix & Touch Targets (Jakob's Law - Survey 2 §1.4)**:
   In `src/views/inventory/components/InventoryDataTable.tsx` or related tables, actions like `Trasladar` and `Merma` must NOT be hidden behind desktop-only hover states on mobile touchscreens. They must be accessible via touch with minimum interactive area of at least 44x44px (or accessible row action menu).

8. **Verification & Tests**:
   - Create `src/tests/m4CatalogsAndInventory.test.tsx` testing:
     * Responsive layout rendering in `ClientsView.tsx` without negative fixed width constraints.
     * Debounced search and memoized calculation in `ClientsView.tsx`.
     * Semantic tokens usage in client components.
     * Inventory tabs chunking / navigation accessibility.
     * `ProductTable.tsx` responsive rendering and mobile card/wrapper behavior.
     * WMS action touch accessibility (>=44px touch targets).
   - Run typecheck: `npx tsc --noEmit` (must succeed with 0 errors).
   - Run unit tests: `npx vitest run src/tests/m4CatalogsAndInventory.test.tsx` (must pass 100%).
   - Verify that all previously passing tests continue to pass.
