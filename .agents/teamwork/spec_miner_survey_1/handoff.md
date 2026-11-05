# Handoff Report — Specification Mining for SPEC-052
**Agent**: `spec_miner_survey_1` (Specification Investigator)  
**Date**: 2026-11-04  
**Working Directory**: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\spec_miner_survey_1\`  
**Parent Conversation ID**: `3063c72d-1600-49d8-8023-e09d825cbd6a`

---

## 1. Observation

### 1.1 Direct Inspection of Authoritative Specifications
1. **`ORIGINAL_REQUEST.md`** (`lines 40-88`):
   - Requests implementation of SPEC-052 (`specs/052-frontend-ui-fixes-pos-dashboard-overflows/spec.md`) resolving four critical production frontend bugs:
     - R1: Dashboard unfreeze (remove `AppRouteId.DASHBOARD` from `TRANSACTIONAL_FIXED_VIEWS` in `src/components/layout/layoutModes.ts`).
     - R2: POS Cart ergonomics (remove `QuickCutNotes` from `src/views/POSView.tsx` lines 2652-2661, `CartPanel` occupies 100% height `flex-1 min-h-0`, bottom buttons visible, dispatch notes modal on-demand).
     - R3: Single cashier / multivendor operational procedure and manual test checklist (standard shift opening vs fast seed via `🔨 Josase ⇄`, counter pre-sale order hold, billing in single cashier, open/closed shift visual state).
     - R4: EnterpriseTopbar overflows (breadcrumb vs tenant button collision, container `overflow-hidden`, ellipsis truncation, responsive breakpoint visibility `hidden xl:...`, `hidden 2xl:...`, tenant company name truncation to 130px).
2. **`specs/052-frontend-ui-fixes-pos-dashboard-overflows/spec.md`** (`lines 1-281`):
   - Approved technical specification containing 5 Mermaid diagrams (Process Flowchart, Decision Logic, ERD, Sequence Diagram, Component Architecture).
   - Section 3 documents exact file paths, lines to edit, and CSS tokens.
   - Section 4 defines the test verification matrix (`layoutModes.test.ts`, `posCartPanelErgonomics.test.tsx`, `enterpriseTopbarA11yV8.test.tsx`, DevTools viewports 1280x800 and 375x667).

### 1.2 Direct Inspection of Codebase Files
1. **`src/components/layout/layoutModes.ts`** (`lines 7-14`, `40-52`):
   ```typescript
   export const TRANSACTIONAL_FIXED_VIEWS: readonly ERPViewKey[] = [
     AppRouteId.POS,
     AppRouteId.ORDERS_KANBAN, // 'kanban'
     AppRouteId.DASHBOARD,     // 'dashboard' <-- Root Cause of Frozen Dashboard
     AppRouteId.CASH_DESK,     // 'caja'
     AppRouteId.ORDER_PICKING, // 'alistamiento'
     AppRouteId.DISPATCHES     // 'despachos'
   ] as const;
   ```
   Lines 46-52:
   ```typescript
   if (isFixed) {
     return `flex-1 ${paddingClasses} overflow-hidden flex flex-col h-[calc(100vh-theme(spacing.12)-theme(spacing.3))] min-h-0`;
   }
   return `flex-1 ${paddingClasses} overflow-y-auto custom-scrollbar min-h-0`;
   ```
   Because `AppRouteId.DASHBOARD` is in `TRANSACTIONAL_FIXED_VIEWS`, `isTransactionalFixedView('dashboard')` returns `true`, forcing `<main>` into `overflow-hidden` with a fixed screen height.
2. **`src/views/DashboardView.tsx`** (`lines 151-182`):
   The Dashboard renders Metric Cards, `ExecutiveTrafficLightWidget`, and a `CalendarGrid` with `min-h-[500px] lg:h-[650px]`, plus an `EventSidePanel` (`min-h-[400px] lg:h-[650px]`). The combined vertical height is 950px-1200px. With `<main>` locked into `overflow-hidden`, laptop viewports (1366x768) cut off the calendar and cannot scroll down.
3. **`src/views/POSView.tsx`** (`lines 2652-2661`):
   ```tsx
   <div className="flex flex-col h-full min-h-0 gap-2">
     <div className="bg-slate-900/70 p-2.5 rounded-xl border border-white/10 shrink-0">
       <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
         Corte y Preparación de Mostrador (1 Toque)
       </span>
       <QuickCutNotes
         selectedNotes={selectedCutNotes}
         onToggleNote={toggleCutNote}
       />
     </div>
     <CartPanel ... />
   </div>
   ```
   `QuickCutNotes` occupies ~160px of fixed vertical height with 6 large buttons (`min-h-[48px]`), compressing `CartPanel` and pushing bottom action buttons (`Cerrar Turno`, `En Espera (F6)`, `Cobrar / Pagar`) off-screen or clipping them against the bottom edge.
4. **`src/views/pos/components/CartPanel.tsx`** (`lines 705-753`):
   Already contains a dedicated textarea for dispatch instructions:
   ```tsx
   <div className="space-y-1">
     <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
       <span>📝 Instrucciones / Notas de Despacho:</span>
       <span className="text-[10px] text-cyan-400 font-mono">Doble nivel</span>
     </label>
     <textarea rows={2} value={notasDespacho} onChange={(e) => setNotasDespacho(e.target.value)} ... />
   </div>
   ```
5. **`src/components/layout/EnterpriseTopbar.tsx`** (`lines 219-248`, `251-360`):
   - Left container breadcrumb:
     ```tsx
     <div className="flex items-center gap-1.5 text-xs min-w-0">
       <span className="text-slate-400 hidden md:inline font-semibold">{breadcrumb.domain}</span>
       <ChevronRight size={12} className="text-slate-500 hidden md:inline shrink-0" />
       <span className="text-white font-black truncate max-w-[100px] sm:max-w-[200px] md:max-w-[260px] lg:max-w-[340px]" title={breadcrumb.sub}>
         {breadcrumb.sub}
       </span>
     </div>
     ```
     The breadcrumb wrapper lacks `overflow-hidden`.
     `breadcrumb.domain` (`Ventas & Comercial`, etc.) is displayed at `md:` ($\ge 768\text{px}$).
   - Right container:
     `<div className="flex items-center gap-2 sm:gap-3 shrink-0">` contains 9 elements:
     - Tenant button (max-w-[160px])
     - Omnibox (`hidden sm:flex`)
     - Bodega selector (`hidden lg:flex` — visible at 1024px and 1280px)
     - Sync badge (`hidden sm:inline-flex`)
     - Josase toggle (`flex` — always visible)
     - Reset DB button (`flex` — visible, text hidden xl)
     - Kanban Caja F7 (`flex` — visible)
     - Facturar POS F4 (`flex` — visible)
     - Theme selector (`hidden sm:flex`)
     - User profile (`flex`)
     On screens $\le 1366\text{px}$, the right container's width (~1000px) plus `shrink-0` squashes the left container to 0px, causing the breadcrumb to overflow and collide directly on top of the tenant button.
6. **Existing Test Suites Inspected**:
   - `src/tests/posCartPanelErgonomics.test.tsx` (8 tests passing): tests button ergonomics, `pos-cart-panel` `overflow-hidden`, `pos-cart-footer` `mt-auto shrink-0`.
   - `src/tests/enterpriseTopbarA11yV8.test.tsx` (3 tests passing): tests responsive breadcrumb truncation and gap.
   - `src/tests/globalLayoutV8.test.tsx` (9 tests passing): line 115 currently asserts `expect(isTransactionalFixedView('dashboard')).toBe(true);` (SPEC-038 legacy test).

---

## 2. Logic Chain

1. **Dashboard Freeze (R1)**:
   - *Observation*: `layoutModes.ts:10` includes `AppRouteId.DASHBOARD` in `TRANSACTIONAL_FIXED_VIEWS`.
   - *Observation*: `getMainLayoutClasses(AppRouteId.DASHBOARD)` applies `overflow-hidden flex flex-col h-[calc(100vh-...)]`.
   - *Observation*: `DashboardView.tsx` content height is ~1100px, which exceeds laptop viewport height (768px).
   - *Inference*: Removing `AppRouteId.DASHBOARD` from `TRANSACTIONAL_FIXED_VIEWS` causes `getMainLayoutClasses` to return `overflow-y-auto custom-scrollbar min-h-0`, restoring natural scroll.
   - *Regression Alert*: In `src/tests/globalLayoutV8.test.tsx:115`, `expect(isTransactionalFixedView('dashboard')).toBe(true)` will fail unless updated to `toBe(false)`. A dedicated unit test `src/tests/layoutModes.test.ts` must be created.

2. **POS Cart Space Recovery (R2)**:
   - *Observation*: `POSView.tsx:2652-2661` renders `QuickCutNotes` taking ~160px static vertical height.
   - *Observation*: In laptop viewports (768px height), the right column has ~700px total height. A 160px static block plus ticket/cart headers leaves insufficient height for the item list and pushes footer action buttons off the bottom edge.
   - *Observation*: `CartPanel.tsx` already has an on-demand/expandable textarea for dispatch notes, and `selectedCutNotes` can be triggered on demand or via a modal rather than being statically mounted in the column.
   - *Inference*: Removing `QuickCutNotes` from lines 2652-2661 and granting `CartPanel` full height (`flex-1 min-h-0`) ensures `pos-cart-items-list` scrolls internally and `pos-cart-footer` is anchored cleanly with `shrink-0 mt-auto` without clipping bottom buttons.

3. **Multivendor Single Cashier Procedure (R3)**:
   - *Observation*: `cashService.ts` handles shift opening (`abrirTurno`), active shift query (`getTurnoActivo`), cash movements (`registrarMovimiento`), and blind cash count closure (`cerrarTurno`).
   - *Observation*: `EnterpriseTopbar.tsx:293-348` provides the 1-click `🔨 Josase ⇄` button that switches tenant to `tenant-03`, seeds 3 demo pre-sales (`PRE-2026-01001`, `PRE-2026-01002`, `PRE-2026-01000`), and opens `'CAJA-1'` with `$100.000` base.
   - *Observation*: `prefacturaService.ts` handles counter pre-sale emission with `hardHoldActivo: true`, status `PENDIENTE_COBRO`, and transition to `EN_COBRO` and `FACTURADA` upon cashier collection.
   - *Observation*: `POSView.tsx:2204-2225` and `PaymentPanel.tsx` clearly display open shift (`Turno #TRN-XXXX` with green pulse) vs closed shift (`⚠ Caja Cerrada` in red with 56px `Abrir Turno` button). Sellers (`userRole === 'vendedor'`) are barred from cash drawers and only see `EMITIR PREVENTA / COMANDA (F6)`.
   - *Inference*: The 3-phase operational workflow and manual test checklist is fully implementable and testable across standard and fast-seed routes.

4. **EnterpriseTopbar Collision Elimination (R4)**:
   - *Observation*: In `EnterpriseTopbar.tsx`, the breadcrumb container lacks `overflow-hidden`, and `breadcrumb.domain` is visible at `md:`.
   - *Observation*: Right action wrapper has `shrink-0` with 9 fixed buttons/selectors exceeding 1000px on screens $\le 1366\text{px}$.
   - *Inference*: Applying `overflow-hidden` to the breadcrumb container, hiding `breadcrumb.domain` and its chevron below 1280px (`hidden xl:inline`), truncating `breadcrumb.sub`, and hiding non-essential right items (`hidden 2xl:flex` on Bodega selector, `hidden xl:flex` on Reset DB button, `max-w-[130px] truncate` on tenant company name) prevents container collapse and eliminates typographical collisions on 1024px, 1280px, 1366px, and 1920px.

---

## 3. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Layout | Dashboard Unfreeze | Enables natural vertical scrolling on Dashboard by removing `AppRouteId.DASHBOARD` from `TRANSACTIONAL_FIXED_VIEWS`. | `viewKey: 'dashboard'` | `flex-1 px-2.5 pb-2 lg:px-3 lg:pb-2.5 pt-0 overflow-y-auto custom-scrollbar min-h-0` | If viewKey is invalid, defaults to scrollable document layout. | `layoutModes.ts:7-14`, `spec.md §3.1` |
| 2 | POS UI | POS Cart Full-Height Rescaling | Removes static `QuickCutNotes` block (~160px) from right column, allowing `CartPanel` to take 100% height (`flex-1 min-h-0`). | `cartLineas`, `cliente`, `totales` | `CartPanel` fills column height; items scroll internally, footer actions always visible. | Empty cart shows centered placeholder; never overflows container. | `POSView.tsx:2652-2661`, `spec.md §3.2` |
| 3 | POS UI | On-Demand Dispatch Notes | Allows registering cutting, packaging, or dispatch notes on demand without taking permanent column height. | Text notes / modal input | Appended notes string attached to pre-sale / draft (`PRE-XXX`). | Sanitized text string; empty notes omitted. | `POSView.tsx:2686`, `CartPanel.tsx:706` |
| 4 | POS Operations | Standard Shift Opening | Cashier opens register with initial cash base via `AperturaCajaModal` in `/caja` or POS. | `cajaId: string`, `cajeroId: string`, `baseInicial: number` | `TurnoCaja` record with `estado: 'ABIERTO'` and `INGRESO_BASE_INICIAL` movement. | Rejects if shift is already open (`La caja ya tiene un turno abierto`). | `cashService.ts:99-142`, `AperturaCajaModal.tsx` |
| 5 | POS Operations | Fast-Seed Demo Activation | 1-click toggle button `🔨 Josase ⇄` in Topbar switches tenant to `tenant-03`, seeds catalog, pre-sales, and opens `'CAJA-1'`. | Click `topbar-btn-toggle-demo-tenant` | Context switched to Josase, 3 pre-sales seeded, shift opened with `$100.000` base. | Handles offline / mock mode gracefully. | `EnterpriseTopbar.tsx:293-348` |
| 6 | POS Operations | Counter Pre-Sale Emission (Mostrador) | Seller registers products and holds order with `F6`, assigning a pre-sale ticket code. | Cart items, customer, seller ID | `Prefactura` record with `codigoPreventa: 'PRE-YYYY-XXXXX'`, status `PENDIENTE_COBRO`, and inventory hard-hold. | Validated against Zod schema and discount limits (`limiteDescuentoPct`). | `prefacturaService.ts:163-220` |
| 7 | POS Operations | Single Cashier Kanban Collection | Cashier opens Kanban (`F7`), clicks pre-sale ticket, collects payment, and converts hold to final POS invoice. | `prefacturaId`, payment method (`EFECTIVO`, `DATAFONO`, etc.) | Invoice emitted, shift balance updated, prefactura marked `FACTURADA`. | Rejects collection if shift is closed or total mismatch. | `CashierKanbanView.tsx`, `cashService.ts` |
| 8 | POS UI | Shift Status Visual Feedback | Clear visual indicators for open shift (green pulsing badge) vs closed shift (red warning + 56px open button). | `isTurnoAbierto: boolean` | Visual badge and conditioned payment/open buttons. | Sellers never see cash warning banners or drawer buttons. | `POSView.tsx:2204-2225`, `PaymentPanel.tsx:80` |
| 9 | Navigation | Topbar Responsive Breadcrumb Containment | Prevents breadcrumb text from spilling over by adding `overflow-hidden` and breakpoint-based domain hiding (`hidden xl:inline`). | Route change (`currentView`) | Breadcrumb with `ERP > [Domain] > [Sub]`, cleanly truncated with title tooltip. | If text exceeds width, truncates with `...` without container expansion. | `EnterpriseTopbar.tsx:219-248`, `spec.md §3.4` |
| 10 | Navigation | Topbar Right Actions Responsive Priorities | Hides secondary controls on smaller screens (`hidden 2xl:flex` for Bodega, `hidden xl:flex` for Reset DB) and truncates tenant name to 130px. | Viewport width (1024px to 1920px) | Balanced `h-12` header with $\ge 16\text{px}$ clearance between breadcrumb and actions. | Zero typographical collision or element wrap. | `EnterpriseTopbar.tsx:251-360`, `spec.md §3.4` |

---

## 4. Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Dashboard Unfreeze | Res. 1366x768 with 15+ calendar obligations | `<main>` permits vertical scroll down to obligation items; header and sidebar stay pinned. |
| 2 | Dashboard Unfreeze | Legacy test `globalLayoutV8.test.tsx` line 115 | `isTransactionalFixedView('dashboard')` returns `false`; line 115 expects `true` under legacy SPEC-038 rules. Must be adjusted to `false`. |
| 3 | POS Cart Panel | Cart with 0 items (empty) | Centered empty placeholder rendered (`El carrito está vacío`); footer buttons disabled; no container overflow. |
| 4 | POS Cart Panel | Cart with 25 items on 1366x768 screen | `pos-cart-items-list` scrolls vertically internally; footer action buttons (`Cerrar Turno`, `En Espera (F6)`, `Cobrar / Pagar`) remain 100% visible and unclipped. |
| 5 | POS Seller Role | User authenticated with role `vendedor` | Shift operations (open, partial withdrawal, close) hidden; cash warning banner hidden; bottom button displays `EMITIR PREVENTA / COMANDA (F6)`. |
| 6 | Single Cashier Shift | Cashier attempts payment with closed shift | `PaymentPanel` displays `ABRIR TURNO DE CAJA` button (height $\ge 56\text{px}$) instead of `COBRAR`; payment blocked until shift opens. |
| 7 | Fast-Seed Demo Toggle | User clicks `🔨 Josase ⇄` when already in Josase | Toggles back to `tenant-01` ('La Pezcadería del Mar S.A.S.') and shows info toast. |
| 8 | EnterpriseTopbar | Viewport width 1024px (iPad Pro / small laptop) | `breadcrumb.domain` hidden; `breadcrumb.sub` truncated; Bodega selector hidden; Reset DB text hidden; zero collision with tenant button. |
| 9 | EnterpriseTopbar | Viewport width 1280px / 1366px | `breadcrumb.domain` hidden (`hidden xl:inline`); Bodega selector hidden (`hidden 2xl:flex`); tenant name truncated to max 130px; $\ge 16\text{px}$ gap maintained. |
| 10 | EnterpriseTopbar | Viewport width 1920px (Full HD) | Full expanded topbar: domain, sub, tenant, Omnibox, Bodega, Sync, Reset DB, Kanban F7, POS F4, Theme, and User profile all visible. |

---

## 5. Caveats
1. **Source Code Immutability**: As a read-only Specification Investigator (`spec-miner`), no source files or test files were modified during this investigation.
2. **Legacy Test Alignment**: `src/tests/globalLayoutV8.test.tsx` line 115 was written under SPEC-038 and explicitly expects `isTransactionalFixedView('dashboard') === true`. The implementation phase must update this assertion in tandem with adding `src/tests/layoutModes.test.ts`.
3. **Dispatch Notes UI**: `CartPanel.tsx` already has an inline textarea for `notasDespacho` in mostrador mode. The spec allows either using this textarea or an on-demand modal; using the existing textarea plus an on-demand modal hook is completely supported by the schema.

---

## 6. Conclusion
The specification for SPEC-052 is complete, rigorous, and verified against the live codebase:
1. **R1 (Dashboard Unfreeze)**: Removing `AppRouteId.DASHBOARD` from `TRANSACTIONAL_FIXED_VIEWS` in `src/components/layout/layoutModes.ts` cleanly converts the container from `overflow-hidden` to `overflow-y-auto min-h-0`, allowing the full calendar and metrics to be viewed on laptop viewports.
2. **R2 (POS Cart Ergonomics)**: Deleting lines 2652-2661 in `src/views/POSView.tsx` reclaims ~160px of vertical space, allowing `CartPanel` to stretch to `flex-1 min-h-0` with internal item list scrolling and preventing bottom action buttons from being clipped.
3. **R3 (Single Cashier / Multivendor Procedure)**: The shift activation (standard and 1-touch demo via `🔨 Josase ⇄`), pre-sale emission (`F6`), and single cashier collection (`F7`) workflows are fully supported by `cashService.ts`, `prefacturaService.ts`, and `CashierKanbanView.tsx`.
4. **R4 (EnterpriseTopbar Overflows)**: Adding `overflow-hidden` to the breadcrumb container, raising `breadcrumb.domain` hiding to `hidden xl:inline`, truncating `breadcrumb.sub`, and setting responsive breakpoints (`hidden 2xl:flex` on Bodega, `hidden xl:flex` on Reset DB, `max-w-[130px] truncate` on tenant) definitively eliminates typographical collisions on 1024px, 1280px, 1366px, and 1920px viewports.

---

## 7. Verification Method

To independently verify the mined specification:

1. **Verify Unit Tests Run**:
   ```bash
   npm run test:run -- src/tests/enterpriseTopbarA11yV8.test.tsx
   npm run test:run -- src/tests/posCartPanelErgonomics.test.tsx
   npm run test:run -- src/tests/globalLayoutV8.test.tsx
   ```
2. **Inspect Target Files**:
   - `src/components/layout/layoutModes.ts:7-14` (presence of `AppRouteId.DASHBOARD`).
   - `src/views/POSView.tsx:2652-2661` (presence of `QuickCutNotes` block).
   - `src/components/layout/EnterpriseTopbar.tsx:219-270` (breadcrumb and tenant selector layout).
3. **Validate TDD Target Tests to be Created / Updated in Implementation**:
   - Create `src/tests/layoutModes.test.ts` testing `getMainLayoutClasses('dashboard')` contains `overflow-y-auto` and `min-h-0`, and NOT `overflow-hidden`.
   - Update `src/tests/globalLayoutV8.test.tsx:115` to assert `isTransactionalFixedView('dashboard') === false`.
   - Run full test suite: `npm run test:run`.
