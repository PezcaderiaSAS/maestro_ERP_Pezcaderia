# BRIEFING — 2026-10-29T14:00:00Z

## Mission
Implement Milestone M4: Catálogos de Clientes & Inventario (Requirements F19–F25), resolving mobile viewport overflows at 375px, WCAG AA+ contrast, debounced search & memoized calculations, tabs chunking, responsive tables, and accessible touch targets.

## 🔒 My Identity
- Archetype: teamwork_worker
- Roles: implementer, qa, specialist
- Working directory: c:\Users\Personal\Documents\Yurgen\Maestro_Pezcaderia_ERP\maestro_ERP_Pezcaderia\.agents\teamwork\worker_m4_1
- Original parent: 893a38d8-5827-40f7-afd9-ff6dab5d7849
- Milestone: M4: Catálogos de Clientes & Inventario

## 🔒 Key Constraints
- Exclusively own and modify:
  * `src/views/ClientsView.tsx`
  * `src/views/InventoryView.tsx`
  * `src/views/inventory/components/*`
  * `src/tests/m4CatalogsAndInventory.test.tsx`
- MUST NOT edit files owned by M1, M2, or M3.
- All implementations must be genuine (no hardcoding, no mock facades).
- Must pass `npx tsc --noEmit` with 0 errors.
- Must pass `npx vitest run src/tests/m4CatalogsAndInventory.test.tsx` 100%.
- Maintain regression compatibility with existing test suite.

## Current Parent
- Conversation ID: 893a38d8-5827-40f7-afd9-ff6dab5d7849
- Updated: not yet

## Task Summary
- **What to build**:
  - F19: Fix 350px fixed overflow in `ClientsView.tsx` with responsive layout (`flex-col lg:flex-row`).
  - F20: Header wrap, fluid padding (`p-3 sm:p-6`), prevent horizontal blowout in `ClientsView.tsx`.
  - F21: WCAG AA+ semantic token usage (`text-primary`, `bg-[var(--card-bg)]`, etc.) in `ClientsView.tsx`.
  - F22: Debounced search (200ms) & memoized cartera/debt calculations in `ClientsView.tsx`.
  - F23: Chunk 14 inventory tabs into 5 logical categories (Miller's Law) with responsive dropdown/pills in `InventoryView.tsx`.
  - F24: Responsive mobile treatment for `ProductTable.tsx` / `StockMatrizTable.tsx` (card view / overflow wrapper, truncation, <=375px compliance).
  - F25: Fix hover-only actions in `InventoryDataTable.tsx` or related tables, ensuring touch-accessible targets >=44px.
  - Tests: comprehensive unit/component tests in `src/tests/m4CatalogsAndInventory.test.tsx`.
- **Success criteria**: 0 build/type errors, all tests pass, zero horizontal blowout at 375px, WCAG AA+ compliant.
- **Interface contracts**: `PROJECT.md`
- **Code layout**: `PROJECT.md`

## Key Decisions Made
- [TBD - Investigation phase]

## Artifact Index
- `.agents/teamwork/worker_m4_1/DISPATCH.md` — Assigned instructions
- `.agents/teamwork/worker_m4_1/BRIEFING.md` — Working memory and context
- `.agents/teamwork/worker_m4_1/progress.md` — Progress heartbeat
- `.agents/teamwork/worker_m4_1/handoff.md` — Final handoff report

## Change Tracker
- **Files modified**: None yet
- **Build status**: Untested
- **Pending issues**: None

## Quality Status
- **Build/test result**: Not run yet
- **Lint status**: Not run yet
- **Tests added/modified**: Pending `src/tests/m4CatalogsAndInventory.test.tsx`

## Loaded Skills
- **Source**: `c:\Users\Personal\Documents\Yurgen\Maestro_Pezcaderia_ERP\maestro_ERP_Pezcaderia\.agents\skills\erp-pos-design-tokens\SKILL.md`
- **Core methodology**: Light Mode WCAG AA+ design tokens for ERP POS/Inventory.
- **Source**: `c:\Users\Personal\Documents\Yurgen\Maestro_Pezcaderia_ERP\maestro_ERP_Pezcaderia\.agents\skills\ui-ux-pro-max\SKILL.md`
- **Core methodology**: Professional UI/UX SaaS design standards, responsive grids, touch targets, micro-interactions.
