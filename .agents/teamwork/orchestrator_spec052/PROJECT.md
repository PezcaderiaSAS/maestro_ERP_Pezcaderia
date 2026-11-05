# Project: SPEC-052 Frontend UI Fixes (POS, Dashboard & Shell Overflows)

## Architecture
- **Layer 1: Shell & Layout Modes** (`src/components/layout/layoutModes.ts`, `src/components/layout/EnterpriseTopbar.tsx`, `src/App.tsx`):
  Governs viewport sizing, fixed transactional view constraints, responsive headers, and main content scrolling.
- **Layer 2: Dashboard View** (`src/views/DashboardView.tsx`, `src/views/dashboard/CalendarGrid.tsx`):
  Executive metrics, traffic light KPI indicators, and full-month split calendar requiring vertical scrollability on laptop screens.
- **Layer 3: POS & Mostrador Ergonomics** (`src/views/POSView.tsx`, `src/views/pos/components/CartPanel.tsx`, `src/views/pos/components/DespachoNotasModal.tsx`):
  Full-height cart panel with internal item list scrolling (`min-h-0`), on-demand dispatch notes, and anchored bottom action buttons.
- **Layer 4: Single Cashier / Multivendor Workflow & SOP** (`docs/sop/single_cashier_multivendor_manual_testing.md`):
  Step-by-step procedures for cash drawer shift opening (standard & Josase fast seed), pre-sale emission at counter (`F6`), and single cashier settlement in Kanban (`F7`/`F9`).
- **Layer 5: Test Suites & Regression Verification** (`src/tests/`):
  Unit tests, accessibility assertions, invariant preservation, and full project Vitest suite execution.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source | Status |
|---|---------|-------------|-----------|--------|:------:|
| 1 | Dashboard Scroll Unfreeze | Remove `AppRouteId.DASHBOARD` from `TRANSACTIONAL_FIXED_VIEWS` in `layoutModes.ts` to assign `overflow-y-auto custom-scrollbar min-h-0`. Companion `min-h-full pb-4` in `DashboardView.tsx`. | M1 | Survey (R1) | DONE |
| 2 | POS Cart Full-Height Rescaling | Remove static `QuickCutNotes` block (~160px, lines 2652-2661) in `src/views/POSView.tsx`; expand `CartPanel` to 100% column height `flex-1 min-h-0`. | M2 | Survey (R2) | DONE |
| 3 | POS Cart Items Internal Scroll & Min-Height Fix | Add `min-h-0` to `.pos-cart-items-list` in `src/views/pos/components/CartPanel.tsx:620` and verify footer actions are pinned with `shrink-0 mt-auto` without clipping. | M2 | Survey (R2) | DONE |
| 4 | On-Demand Dispatch Notes Modal | Provide an on-demand modal/trigger (`DespachoNotasModal.tsx`) for dispatch and cutting notes without occupying permanent column height. | M2 | Survey (R2) | DONE |
| 5 | Single Cashier / Multivendor SOP & Checklist | Document operational procedure (standard shift opening, 1-touch demo opening via `🔨 Josase ⇄`, counter pre-sale hold `F6`, single cashier collection `F7`/`F9`, seller read-only monitoring) and manual verification checklist. | M3 | Survey (R3) | DONE |
| 6 | Shift Status Visual Feedback Consistency | Verify open shift vs closed shift badges and button conditioning in POS and Cash modules. | M3 | Survey (R3) | DONE |
| 7 | EnterpriseTopbar Breadcrumb Overflow Containment | Add `overflow-hidden` to left container and breadcrumb wrapper in `src/components/layout/EnterpriseTopbar.tsx`; set `hidden xl:inline` on `breadcrumb.domain` and adjacent chevron. | M4 | Survey (R4) | DONE |
| 8 | EnterpriseTopbar Dynamic Truncation | Truncate `breadcrumb.sub` (retaining `max-w-[100px]` mobile base token) and tenant button company name (`max-w-[80px]` base, `sm:max-w-[130px] font-semibold truncate`). | M4 | Survey (R4) | DONE |
| 9 | EnterpriseTopbar Secondary Actions Responsive Breakpoints | Hide Bodega selector on $< 1536\text{px}$ (`hidden 2xl:flex`), hide Reset DB button on $< 1280\text{px}$ (`hidden xl:flex`), hide user role text on $< 1280\text{px}$ (`hidden xl:flex`), maintaining $\ge 16\text{px}$ gap and 0 collision across 1024px–1920px. | M4 | Survey (R4) | DONE |
| 10 | Full Project Test Suite & Regression Protection | Execute all tests (`layoutModes.test.ts`, `posCartPanelErgonomics.test.tsx`, `enterpriseTopbarA11yV8.test.tsx`, `globalLayoutV8.test.tsx`, `multiVendorCashierIntegrationE2E.test.tsx`, etc.) with `npm run test:run` and strict TypeScript compilation (`npx tsc --noEmit`). | M5 | Survey (Acceptance Criteria) | DONE |

---

## Milestones
| # | Name | Scope | Dependencies | Status | Assigned Agent | Output / Artifacts |
|---|------|-------|-------------|--------|----------------|--------------------|
| M1 | Dashboard Scroll Unfreeze | `src/components/layout/layoutModes.ts`, `src/views/DashboardView.tsx`, `src/tests/layoutModes.test.ts`, `src/tests/globalLayoutV8.test.tsx:115` | none | DONE | worker_m1 (32095752-c855-4e25-b6bf-811cc47b8653) | `layoutModes.ts`, `DashboardView.tsx`, `layoutModes.test.ts`; 29/29 tests pass, tsc 0 errors |
| M2 | POS Cart Ergonomics & Notes Modal | `src/views/POSView.tsx`, `src/views/pos/components/CartPanel.tsx`, `src/views/pos/components/DespachoNotasModal.tsx`, `src/tests/posCartPanelErgonomics.test.tsx` | none | DONE | worker_m2 (eb0913c8-3e98-4898-875f-bc332eed8d0b) | `DespachoNotasModal.tsx`, `POSView.tsx`, `CartPanel.tsx`; 13/13 tests pass, tsc 0 errors |
| M3 | Single Cashier / Multivendor Documentation & SOP | `docs/sop/single_cashier_multivendor_manual_testing.md` | none | DONE | worker_m3 (741c55b6-00ba-480d-8d19-ecff00aae1a2) | `single_cashier_multivendor_manual_testing.md` (335 lines), 4/4 integration tests pass |
| M4 | EnterpriseTopbar Overflows & Breadcrumb Truncation | `src/components/layout/EnterpriseTopbar.tsx`, `src/tests/enterpriseTopbarA11yV8.test.tsx` | none | DONE | worker_m4 (20bf7b1f-c1a2-4ce4-b91e-e8388ba79bb5) | `EnterpriseTopbar.tsx`, `enterpriseTopbarA11yV8.test.tsx`; 37/37 tests pass, tsc 0 errors |
| M5 | E2E Regression Guard & Quality Gate | Full Vitest run (`npm run test:run`), strict TypeScript (`npx tsc --noEmit`), DevTools audits | M1, M2, M3, M4 | DONE | worker_m5 (080932a8-033c-4bd8-849d-5f0919bf07e8) | Full suite: 219/219 files, 1,471 tests passed. Playwright: 7/7 passed. `tsc --noEmit`: 0 errors. |

---

## Interface Contracts
### Layout Modes ↔ App Shell
- `isTransactionalFixedView(viewKey: string | undefined): boolean`
  - Input: `'dashboard'`, `'pos'`, `'kanban'`, etc.
  - Output: `false` for `'dashboard'`; `true` for `'pos'`, `'kanban'`, `'caja'`, `'alistamiento'`, `'despachos'`.
- `getMainLayoutClasses(viewKey: string | undefined): string`
  - Input: `'dashboard'`
  - Output: `flex-1 px-2.5 pb-2 lg:px-3 lg:pb-2.5 pt-0 overflow-y-auto custom-scrollbar min-h-0`

### POS View ↔ CartPanel ↔ Dispatch Notes Modal
- `CartPanelProps`:
  - `onGuardarBorrador?: (notas?: string) => void`
  - `selectedCutNotes?: string[]`
  - `onOpenNotasModal?: () => void`
- `DespachoNotasModal`:
  - `isOpen: boolean`, `onClose: () => void`
  - `selectedNotes: string[]`, `onToggleNote: (note: string) => void`
  - `customNotes: string`, `onCustomNotesChange: (text: string) => void`
  - `onConfirm: () => void`

### EnterpriseTopbar ↔ Responsive Container Breakpoints
- Left breadcrumb container:
  - Classes: `flex items-center gap-2 sm:gap-3 flex-1 min-w-0 overflow-hidden`
  - Breadcrumb domain: `hidden xl:inline`
  - Sub text: `truncate max-w-[100px] sm:max-w-[180px] md:max-w-[220px] lg:max-w-[260px] xl:max-w-[320px]`
- Right action container:
  - Tenant text: `truncate max-w-[80px] sm:max-w-[130px]`
  - Bodega selector: `hidden 2xl:flex`
  - Reset DB button: `hidden xl:flex`
  - User role text: `hidden xl:flex`

---

## Code Layout
- `src/components/layout/layoutModes.ts` — Owns `TRANSACTIONAL_FIXED_VIEWS` and `getMainLayoutClasses`.
- `src/views/DashboardView.tsx` — Owns root Dashboard layout and container paddings.
- `src/views/POSView.tsx` — Owns POS right column layout, removing static `QuickCutNotes`.
- `src/views/pos/components/CartPanel.tsx` — Owns cart item list flex scrollability (`min-h-0`) and on-demand modal triggers.
- `src/views/pos/components/DespachoNotasModal.tsx` — Owns on-demand modal for cutting & dispatch notes.
- `docs/sop/single_cashier_multivendor_manual_testing.md` — Owns authoritative single cashier SOP and checklist.
- `src/components/layout/EnterpriseTopbar.tsx` — Owns Topbar breadcrumb and responsive header actions.
- `src/tests/` — Owns unit and integration tests (`layoutModes.test.ts`, `posCartPanelErgonomics.test.tsx`, `enterpriseTopbarA11yV8.test.tsx`, `globalLayoutV8.test.tsx`).
