# Handoff Report — Milestone M3: Single Cashier / Multivendor SOP & Manual Testing Checklist

**Agent**: `worker_m3` (Documentation & SOP Worker)  
**Parent Conversation ID**: `3063c72d-1600-49d8-8023-e09d825cbd6a`  
**Working Directory**: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\worker_m3\`  
**Milestone**: M3 (Single Cashier / Multivendor Documentation & SOP)  
**Deliverable File**: `docs/sop/single_cashier_multivendor_manual_testing.md`  
**Date**: 2026-11-04  

---

## 1. Observation

1. **Target Specification & Requirements**:
   - `ORIGINAL_REQUEST.md` (lines 56-58, 73-78) and `specs/052-frontend-ui-fixes-pos-dashboard-overflows/spec.md` (§1.1.3, §3.3) require an authoritative, operational step-by-step SOP and manual testing checklist for the multivendor to single cashier architecture.
   - The document must cover:
     1. Cash drawer shift lifecycle (standard manual opening, 1-touch demo fast-seed opening via `🔨 Josase ⇄`, and blind cash counting closure).
     2. Counter pre-sale order hold emission (`F6`, dispatch notes, role restrictions, realtime broadcast in $<50\text{ ms}$).
     3. Single cashier settlement in Kanban (`F7`/`F9`, card claiming, multi-method payment modal, and invoice issuance).
     4. Vendor read-only monitor mode (monitor badge, disabled drag-and-drop, passive status badges).
     5. Shift status visual indicators (green pulse active shift vs red warning closed shift, conditioned $\ge 56\text{ px}$ button).
     6. Acceptance manual test checklist (CP-01 through CP-08 with Preconditions, Steps, Expected Results, and Pass Criteria).

2. **Codebase Findings & Implementation Grounding**:
   - In `src/components/layout/EnterpriseTopbar.tsx` (lines 293-348), the 1-click toggle button `topbar-btn-toggle-demo-tenant` (`🔨 Josase ⇄`):
     ```tsx
     useAuthStore.getState().switchTenant({ id: 'tenant-03', razonSocial: 'Ferretería & Eléctricos Josase S.A.S.', ... });
     await databasePurgeService.purgeLocalDatabase({ tenantId: 'tenant-03', conservarSesionTurno: true, limpiarRemotoSupabase: false });
     prefacturaService.asegurarPreventasSemillaDemo('tenant-03');
     const t = cashService.getTurnoActivo('CAJA-1');
     if (!t) {
       cashService.abrirTurno('CAJA-1', 'user-josase-01', 100000, undefined, 'Apertura Demo Josase');
     }
     ```
   - In `src/views/POSView.tsx` (lines 2204-2225 and 2449-2475):
     - Line 2204: Global alert banner `⚠ CAJA CERRADA — Debes abrir un turno antes de cobrar` is displayed only when `userRole !== 'vendedor' && !currentUser?.cargo?.toLowerCase().includes('mostrador')`.
     - Lines 2215-2224: Shift badge displays emerald green with pulsating dot (`bg-emerald-500/15 text-emerald-300 border-emerald-500/30` and `w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse Turno #ACTIVO`) when open, or carmine red with alert icon (`bg-rose-500/15 text-rose-300 border-rose-500/30 Caja Cerrada`) when closed.
     - Lines 2449-2475: Hamburger menu items `Abrir Turno`, `Arqueo Parcial / Retiro`, and `Cerrar Turno` are completely omitted from the DOM for vendors.
   - In `src/views/pos/components/CartPanel.tsx` (lines 691-753):
     - In counter mode (`isMostradorAuto`), `PaymentPanel` is replaced by the "Puesto de Mostrador - Cobro en Ventanilla" panel with on-demand dispatch notes and the primary action button `EMITIR PREVENTA / COMANDA (F6)` (`data-testid="btn-emitir-preventa-mostrador"`).
   - In `src/views/pos/components/PaymentPanel.tsx` (lines 765-790):
     - When shift is closed (`!isTurnoAbierto`), the main action button is amber `bg-amber-500 text-slate-950 min-h-[56px] h-14` with text `Abrir Turno Caja` (shortcut `Enter`).
     - When shift is open, it renders the emerald button `data-testid="btn-cobrar"` (`Cobrar: $...`) with shortcut `F2 / ↵`.
   - In `src/views/pos/components/CashierKanbanView.tsx` (lines 472-480, 599-616, 670-688):
     - For vendors (`isVendedor = true`), `data-testid="badge-modo-monitor-vendedor"` renders `Modo Monitor: Visualizando el avance de ventas (Solo Lectura)`.
     - Card dragging is disabled (`draggable={!isVendedor}`).
     - Action buttons `btn-iniciar-cobro-${pref.id}` and `btn-confirmar-cobro-${pref.id}` are replaced with passive badges `data-testid="badge-en-espera-${pref.id}"` ("⏳ En Espera de Cobro en Caja") and `data-testid="badge-en-cobro-${pref.id}"` ("⏳ Atendiendo en Ventanilla").
   - Test execution:
     - `npm run test:run -- src/tests/multiVendorCashierIntegrationE2E.test.tsx` was executed in the workspace and passed 4/4 tests cleanly in 1.40s.

---

## 2. Logic Chain

1. **Alignment with Specification & Operational Reality**:
   - *Observation*: The business logic for multivendor segregation and cashier collection is implemented across `cashService.ts`, `prefacturaService.ts`, `POSView.tsx`, and `CashierKanbanView.tsx`, but lacked a unified, standalone operational guide and testing checklist for operators and QA auditors.
   - *Inference*: Grounding the SOP directly in existing source code IDs, classes, testids, service methods, and keyboard shortcuts guarantees that operators and manual testers follow the exact workflows executed by the system.
2. **Exhaustive Coverage of Dispatch Requirements**:
   - *Requirement 1 (Turnos de Caja)*: Addressed in §3.1 with both Vía Rápida (1-touch `🔨 Josase ⇄`, switching to `tenant-03`, purge, demo pre-sales seeding, and `$100.000` shift opening on `CAJA-1`) and Vía Estándar (manual `AperturaCajaModal` with base count and `INGRESO_BASE_INICIAL` record) plus Cierre de Turno / Arqueo Ciego (`ArqueoCajaModal`).
   - *Requirement 2 (Preventas Mostrador)*: Addressed in §2 and §3.2 with vendor role restrictions (hidden drawer controls, hidden closed-box banner), cart product entry, on-demand dispatch/cut notes, `F6` comanda hold emission, `hardHoldActivo: true` stock reservation, and $<50\text{ ms}$ realtime broadcast.
   - *Requirement 3 (Cobro en Caja Única)*: Addressed in §3.3 with `F7`/`F9` Kanban navigation, 3-column architecture (En Espera $\rightarrow$ En Cobro $\rightarrow$ Pagado), claiming orders via `Pasar a Cobro (F9)` / `btn-iniciar-cobro-${id}`, payment modal `QuickPaymentMixedModal` (cash with change calculation, voucher dataphone, digital transfers, mixed payment), and invoice conversion.
   - *Requirement 4 (Modo Monitor)*: Addressed in §3.4 with `badge-modo-monitor-vendedor`, `draggable={false}`, sweetalert restriction on drag attempts, and passive status pills (`badge-en-espera-${id}`, `badge-en-cobro-${id}`).
   - *Requirement 5 (Indicadores de Turno)*: Addressed in §3.5 with pulsing green badge vs red warning badge, global banner visibility rules, and the $\ge 56\text{ px}$ conditional payment/open button.
   - *Requirement 6 (Manual Testing Checklist)*: Addressed in §4 with a structured acceptance table containing 8 test cases (CP-01 through CP-08), each detailing Preconditions, Execution Steps, Expected Results, and Pass/Fail Checkboxes.
3. **Operational Troubleshooting & Regression Guard**:
   - Added §5 (Common Errors, Diagnostic & Recovery Matrix) and §6 (Automated Verification CI Commands) to assist field technicians and developers during maintenance.

---

## 3. Caveats

- **No Caveats**: The delivered SOP file `docs/sop/single_cashier_multivendor_manual_testing.md` is strictly non-breaking, self-contained, and completely aligned with the code contracts established in `PROJECT.md` and verified in `src/tests/multiVendorCashierIntegrationE2E.test.tsx`.

---

## 4. Conclusion

Milestone M3 is complete. The operational guide and manual testing checklist `docs/sop/single_cashier_multivendor_manual_testing.md` (335 lines, 29 KB) has been authored and saved to its canonical path. It thoroughly documents all 6 required operational areas and provides an actionable, repeatable protocol for testing the multivendor single cashier architecture.

---

## 5. Verification Method

To independently verify the deliverable and the underlying system behavior:

1. **Verify File Existence & Structure**:
   ```powershell
   Test-Path docs/sop/single_cashier_multivendor_manual_testing.md
   Get-Content docs/sop/single_cashier_multivendor_manual_testing.md -TotalCount 45
   ```
2. **Run Automated Multivendor Test Suite**:
   ```bash
   npm run test:run -- src/tests/multiVendorCashierIntegrationE2E.test.tsx
   ```
3. **Invalidation Conditions**:
   - If the file `docs/sop/single_cashier_multivendor_manual_testing.md` does not exist or lacks sections §3.1 (Apertura de turno vía rápida y estándar), §3.2 (Emisión preventas F6), §3.3 (Cobro Kanban F7/F9), §3.4 (Modo monitor), §3.5 (Indicadores visuales), or §4 (Casos CP-01 a CP-08).
   - If `src/tests/multiVendorCashierIntegrationE2E.test.tsx` fails to pass 4/4 tests.
