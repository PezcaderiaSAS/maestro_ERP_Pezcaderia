# Handoff Report: R2 (POS Cart Ergonomics) & R3 (Single Cashier / Multivendor SOP)

- **Investigator**: `explorer_survey_3` (Codebase Investigator - POS and Cashier)
- **Target Specification**: `specs/052-frontend-ui-fixes-pos-dashboard-overflows/spec.md` (SPEC-052)
- **Scope**: Requirements R2 & R3
- **Date**: 2026-11-04

---

## 1. Observation

### 1.1 POS Column & CartPanel Layout Observations (`src/views/POSView.tsx` & `src/views/pos/components/CartPanel.tsx`)
1. **CartPanel Real Path**:
   - `src/components/pos/CartPanel.tsx` does **not** exist (PowerShell `Test-Path` returned `False`).
   - The canonical component is located at `src/views/pos/components/CartPanel.tsx` (imported at `src/views/POSView.tsx:16`).
2. **Static Space Consumption of QuickCutNotes**:
   - In `src/views/POSView.tsx:2652-2661`:
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
   - `QuickCutNotes` (`src/views/pos/components/QuickCutNotes.tsx`) renders 6 touch buttons (`min-h-[48px]`), wrapping into 2–3 rows. With container padding (`p-2.5`), header text, and gaps, it consumes **~160px of rigid, non-shrinkable vertical height** (`shrink-0`).
3. **Vertical Space Deficit on Standard Displays (1366x768 & 1024x768)**:
   - Total viewport height: **768px**.
   - Fixed deductions: EnterpriseTopbar (**48px**) + main layout padding (**~16px**) = **~704px** available for POS layout.
   - Inside the right column (`lg:w-[380px] xl:w-[420px]`):
     - `QuickCutNotes`: **~160px**
     - `pos-cart-header` (Client selector, F6, Borradores): **~60px**
     - `pos-cart-footer` (Totals, DiscountPanel, PaymentPanel / MostradorPanel): **~360px – 400px**
     - Total fixed overhead: $160 + 60 + 380 = \mathbf{600px}$.
     - Remaining space for product list: $\approx \mathbf{104px}$ (barely space for 1 product row).
     - Result: Any additional cart items push the footer downwards, causing the bottom action buttons (`Cerrar Turno`, `En Espera (F6)`, `Cobrar / Pagar`) to be clipped against the screen boundary or hidden off-viewport.
4. **Missing `min-h-0` on Cart Items Scroll Container**:
   - In `src/views/pos/components/CartPanel.tsx:620`:
     ```tsx
     <div
       data-testid="cart-items-container"
       className={`pos-cart-items-list flex-1 overflow-y-auto overscroll-contain pr-1 space-y-1.5 ${isCompactMode ? 'hidden' : ''}`}
     ...
     ```
   - The flex child has `flex-1 overflow-y-auto` but **lacks `min-h-0`**. Under standard CSS Flexbox rules, `min-height` defaults to `auto`, which prevents flex children from shrinking below their content size in certain browser layout passes.
5. **Dispatch Notes Data Flow**:
   - In `src/views/POSView.tsx:2686`:
     ```tsx
     onGuardarBorrador={(notas) => handleGuardarBorrador(selectedCutNotes.length > 0 ? `${notas || ''} [${selectedCutNotes.join(', ')}]`.trim() : notas)}
     ```
   - In `POSView.tsx:931-1060` (`handleGuardarBorrador`):
     - The formatted string is saved into `newDraft.alias`, `newDraft.notas`, and `newDraft.detallesDespacho`.
     - It is passed to `prefacturaService.emitirPrefactura({ ..., notas: aliasParam })`.
     - It is broadcast via `supabaseRealtimePreventasService.broadcastPulse` & `broadcastEvent`.
   - In `CartPanel.tsx:711-725`:
     - When `isMostradorAuto` is true, a static `<textarea rows={2} value={notasDespacho} ... />` is rendered in the footer, consuming another ~70px.

---

### 1.2 Single Cashier / Multivendor Architecture Observations
1. **Shift Opening/Closing Mechanisms**:
   - **Standard Production Path**:
     - Accessed via Cash module (`src/views/cash/CashFlowView.tsx`) or via POS hamburger menu (`POSView.tsx:2453`) $\rightarrow$ opens `AperturaCajaModal.tsx`.
     - Validates available non-open cashboxes in the warehouse (`cashService.getCajas()`), sets initial cash base (`baseDirecta`, e.g., $100.000 COP), and invokes `cashService.abrirTurno(cajaId, cajeroId, baseInicial)`.
     - Closing: accessed via `POSView.tsx:2468` or `CartPanel.tsx:556` $\rightarrow$ opens `ArqueoCajaModal.tsx` $\rightarrow$ inputs physical cash/vouchers $\rightarrow$ invokes `cashService.cerrarTurno()`.
   - **1-Click Test & Seed Path (Josase)**:
     - In `src/components/layout/EnterpriseTopbar.tsx:293-347`:
       ```tsx
       <button id="topbar-btn-toggle-demo-tenant" data-testid="topbar-btn-toggle-demo-tenant" ...>
       ```
     - Clicking `🔨 Josase ⇄` automatically:
       1. Switches active tenant to `tenant-03` (*Ferretería & Eléctricos Josase S.A.S.*).
       2. Purges local DB while retaining session (`conservarSesionTurno: true`).
       3. Calls `prefacturaService.asegurarPreventasSemillaDemo('tenant-03')` (seeds 3 demo prefacturas).
       4. Checks `cashService.getTurnoActivo('CAJA-1')`. If none exists, invokes:
          `cashService.abrirTurno('CAJA-1', 'user-josase-01', 100000, undefined, 'Apertura Demo Josase')`.
2. **Visual Representation of Shift Status**:
   - Header badge (`src/views/POSView.tsx:2215-2224`):
     - Open: `<span className="... bg-emerald-500/15 text-emerald-300 border-emerald-500/30"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Turno #ACTIVO</span>`
     - Closed: `<span className="... bg-rose-500/15 text-rose-300 border-rose-500/30"><AlertCircle size={11} /> Caja Cerrada</span>`
   - Global Alert Banner (`POSView.tsx:2204-2208`):
     - Visible only if shift is closed AND user is NOT a seller: `⚠ CAJA CERRADA — Debes abrir un turno antes de cobrar`.
   - CartPanel & PaymentPanel Buttons:
     - `CartPanel.tsx:552`: "Cerrar Turno" button appears only when `isTurnoAbierto && onCerrarTurnoClick`.
     - `PaymentPanel.tsx:765-790`: If shift is closed, the main action button becomes an amber button `Abrir Turno Caja`; if open, it displays the green `btn-cobrar` (`Cobrar: $...`).
3. **Multivendor Mostrador $\rightarrow$ Single Cashier Flow**:
   - **Seller Mostrador Mode**:
     - In `CartPanel.tsx:109-115` & `POSView.tsx:2696`: `isMostradorAuto` activates if tenant is `tenant-03`, or `userRole === 'vendedor'`, or cargo contains `mostrador`.
     - In `CartPanel.tsx:691-753`: Instead of `PaymentPanel`, the panel renders "Puesto de Mostrador - Cobro en Ventanilla".
     - The primary action is `EMITIR PREVENTA / COMANDA (F6)` (`data-testid="btn-emitir-preventa-mostrador"`). Direct cashier settlement buttons are absent.
     - Cashier management options in the hamburger menu (`POSView.tsx:2449`) are completely hidden from sellers.
   - **Prefactura Emission & Realtime Broadcast**:
     - `prefacturaService.emitirPrefactura` assigns code (e.g., `PRE-102`), creates record in state `EN_COLA`, and calls `supabaseRealtimePreventasService.broadcastPulse` & `broadcastEvent` in `<50ms`.
   - **Single Cashier Claim & Settlement**:
     - Cashier opens `CashierKanbanView` via Topbar button `topbar-btn-comandas-kanban` (shortcut `F7`, `EnterpriseTopbar.tsx:365`) or via Cash module tab `Comandas & Preventas (Kanban)` (shortcut `F9`, `CashFlowView.tsx:243`).
     - Realtime listener receives `PRE-102` in "En Espera" column.
     - Cashier clicks `btn-iniciar-cobro-${pref.id}` or drags card to "En Cobro" (`ATENDIENDO`).
     - Cashier clicks `btn-confirmar-cobro-${pref.id}` $\rightarrow$ opens `QuickPaymentMixedModal` (or `SplitPaymentModal`).
     - Cashier selects payment method (Efectivo, Tarjeta, Nequi, Daviplata, QR Bancolombia, Mixto), confirms collection, transitions status to `FACTURADA`, and issues the receipt/invoice.
   - **Seller Read-Only Kanban Monitoring**:
     - When seller opens Kanban, `isVendedor` is true (`CashierKanbanView.tsx:54-56`).
     - `badge-modo-monitor-vendedor` is displayed. Drag-and-drop is disabled (`draggable={!isVendedor}`).
     - Action buttons `btn-iniciar-cobro-${pref.id}` and `btn-confirmar-cobro-${pref.id}` are replaced with passive status badges (`badge-en-espera-${pref.id}`, `badge-en-cobro-${pref.id}`).

---

### 1.3 Existing Unit Tests
1. `src/tests/posCartPanelErgonomics.test.tsx`:
   - 8 unit tests covering button dimensions ($\ge 56\text{px}$ for Cobrar/Abrir Turno, $\ge 48\text{px}$ for Borrador), COP formatting, root `overflow-hidden`, and mostrador prefactura emission.
   - All 8 tests currently pass (`vitest run src/tests/posCartPanelErgonomics.test.tsx`).
2. `src/tests/multiVendorCashierIntegrationE2E.test.tsx`:
   - 4 integration tests covering:
     1. Seller in Kanban sees monitor mode without collection buttons.
     2. Seller cannot drag cards or confirm payments in Ventanilla column.
     3. Switching role to Cashier/Admin enables F9 collection buttons and payment modal.
     4. EnterpriseTopbar keyboard shortcuts F4 (POS) and F7 (Kanban).
   - All 4 tests currently pass (`vitest run src/tests/multiVendorCashierIntegrationE2E.test.tsx`).
3. Additional relevant tests:
   - `src/tests/cashierKanban.test.tsx`
   - `src/tests/kanbanErgonomicsLaptopV8.test.tsx`
   - `src/tests/m3CashAndKanban.test.tsx`

---

## 2. Logic Chain

1. **Space Reclamation Logic**:
   - *Premise*: POS operates within a fixed vertical window (`h-full overflow-hidden`, ~704px on 768px laptop displays).
   - *Observation*: `QuickCutNotes` resides outside `CartPanel` inside `POSView.tsx:2653-2661` as a static block consuming ~160px.
   - *Inference*: Removing `QuickCutNotes` from the static column restores 160px of vertical space to `CartPanel`.
   - *Consequence*: With 160px restored, `CartPanel` product list expands from ~104px to ~264px (displaying 4–5 items simultaneously), and the sticky/bottom action buttons never get clipped against the viewport edge.
2. **Internal Scrollability Logic**:
   - *Observation*: `.pos-cart-items-list` in `CartPanel.tsx:620` has `flex-1 overflow-y-auto` but lacks `min-h-0`.
   - *Inference*: In CSS Flexbox column layouts, omitting `min-h-0` on a flex child causes it to calculate `min-height: auto`, which can prevent it from shrinking below its contents, causing footer overflow.
   - *Resolution*: Adding `min-h-0` ensures the product list container absorbs all overflow internally with vertical scroll while the footer remains docked at the bottom (`mt-auto shrink-0`).
3. **On-Demand Dispatch Notes Modal Design**:
   - *Requirement*: Cut notes and dispatch instructions must remain available without consuming permanent static column space.
   - *Solution*: An on-demand modal (e.g., `DespachoNotasModal.tsx` or a dialog triggered via an ergonomic button `📝 Notas de Despacho`) renders the 6 quick-cut buttons from `QuickCutNotes` alongside an instruction textarea.
   - *Benefit*: 0px permanent vertical space consumed in the column. Seller clicks the button only when instructions are needed, formats the text, and confirms.
4. **Single Cashier / Multivendor SOP Validation**:
   - *Observation*: The business logic and role segregation are already implemented in `prefacturaService.ts`, `useCashierKanbanStore.ts`, `CashierKanbanView.tsx`, and `POSView.tsx`.
   - *Deficiency*: There is no unified, operational SOP document providing explicit manual test procedures for kitchen/counter sellers, single cashier shift management, and Kanban verification.
   - *Resolution*: Documenting the exact step-by-step SOP and manual testing checklist directly fulfills Requirement R3 and provides a reliable test protocol.

---

## 3. Caveats

1. **File Path Correction**: The prompt referenced `src/components/pos/CartPanel.tsx`, but the actual file is `src/views/pos/components/CartPanel.tsx`. The implementer must edit `src/views/pos/components/CartPanel.tsx`.
2. **Drafts / Prefacturas Dual Storage**: The application saves drafts locally via `PosDraftService.saveDraft` AND emits prefacturas via `prefacturaService.emitirPrefactura`. This dual mechanism ensures offline persistence while feeding the live cashier Kanban. Any modifications to notes handling must preserve this dual persistence.
3. **Modal Component Placement**: `QuickCutNotes.tsx` currently exists as a standalone micro-component. It can be wrapped inside a new modal component `src/views/pos/components/DespachoNotasModal.tsx` or rendered inside a SweetAlert2 / dialog modal without deleting `QuickCutNotes.tsx` (preserving backward compatibility).

---

## 4. Conclusion & Actionable Proposals

### 4.1 Proposed Changes for R2 (POS Cart Ergonomics)
1. **In `src/views/POSView.tsx`**:
   - **Delete** the static `QuickCutNotes` wrapper at lines 2653-2661:
     ```tsx
     // REMOVE:
     <div className="bg-slate-900/70 p-2.5 rounded-xl border border-white/10 shrink-0">
       <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
         Corte y Preparación de Mostrador (1 Toque)
       </span>
       <QuickCutNotes selectedNotes={selectedCutNotes} onToggleNote={toggleCutNote} />
     </div>
     ```
   - Make `CartPanel` occupy the direct full height of the column (`h-full min-h-0 flex-1 flex flex-col`).
   - Add state `showDespachoModal` (or integrate inside `CartPanel`) to open an on-demand modal for dispatch instructions when needed.
2. **In `src/views/pos/components/CartPanel.tsx`**:
   - In line 620, update `.pos-cart-items-list` to include `min-h-0`:
     ```tsx
     className={`pos-cart-items-list flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1 space-y-1.5 ${isCompactMode ? 'hidden' : ''}`}
     ```
   - In Mostrador mode (lines 706-718), replace the static `textarea` with an on-demand button `📝 Notas de Despacho` (or provide modal trigger button), reclaiming another ~70px of vertical space.
   - Ensure the footer container (`pos-cart-footer`, line 662) maintains `shrink-0 mt-auto` so action buttons never get clipped.

---

### 4.2 Step-by-Step SOP & Manual Testing Checklist for R3 (Single Cashier / Multivendor)

#### Step 1: Turno de Caja (Apertura y Cierre)
1. **Apertura Vía Rápida (1 Toque - Modo Demo Josase)**:
   - En el Topbar, hacer clic en el botón `🔨 Josase ⇄` (`topbar-btn-toggle-demo-tenant`).
   - *Verificación*: Notificación toast "Empresa: Ferretería Josase. Catálogo y caja única activados."
   - *Verificación UI*: La insignia superior del POS muestra `Turno #ACTIVO` en verde esmeralda con punto pulsante.
2. **Apertura Vía Estándar (Cajero en Turno Real)**:
   - Iniciar sesión como Cajero o Administrador.
   - Ingresar a **Caja** (`/caja` o `CashFlowView`) o abrir el menú hamburguesa del POS y pulsar "Abrir Turno".
   - En el modal `AperturaCajaModal`, seleccionar la caja (`CAJA-1`), ingresar base inicial (ej. $100.000 COP) y notas de apertura.
   - Pulsar "Confirmar Apertura de Caja".
   - *Verificación*: El estado de turno cambia a `ABIERTO` en `cashService` y en el store `useCashStore`.

#### Step 2: Emisión de Preventas en Mostrador (Multivendedor)
1. Iniciar sesión como Vendedor (`userRole: 'vendedor'`) o conmutar al tenant Josase.
2. *Verificación de Permisos*:
   - En la cabecera del POS, NO aparece el aviso de "CAJA CERRADA".
   - En el menú hamburguesa, las opciones "Abrir Turno", "Cerrar Turno" y "Arqueo Parcial" están completamente ocultas.
   - En la columna derecha, el panel muestra "Puesto de Mostrador - Cobro en Ventanilla".
3. Seleccionar productos del catálogo (ej. Tubo PVC, Mojarra Roja, Pintura).
4. (Opcional) Hacer clic en `📝 Notas de Despacho` y seleccionar opciones de corte (ej. Fileteado, Hielo Extra) o escribir notas.
5. Hacer clic en `EMITIR PREVENTA / COMANDA (F6)` (`data-testid="btn-emitir-preventa-mostrador"`).
6. *Verificación*:
   - El carrito se limpia automáticamente.
   - Se genera una prefactura en cola con prefijo `PRE-XXX` (ej. `PRE-102`).
   - El ticket aparece en la barra lateral del vendedor (`VendorTicketSidebar`).
   - El cliente recibe su código de preventa para acercarse a la Ventanilla de Caja Única.

#### Step 3: Cobro y Facturación en Caja Única (Ventanilla)
1. El cajero ingresa al tablero Kanban presionando **`F7`** (o clic en botón Topbar "Kanban Caja F7"), o dentro del módulo Caja presionando **`F9`** (pestaña "Comandas & Preventas").
2. *Verificación Reactiva*:
   - En la columna **"En Espera"**, aparece la tarjeta correspondiente a `PRE-XXX` con el nombre del cliente, total y vendedor.
3. El cajero hace clic en `Pasar a Cobro (F9)` (`btn-iniciar-cobro-${pref.id}`) o arrastra la tarjeta a la columna **"En Cobro"**.
   - *Verificación*: La preventa pasa a estado `ATENDIENDO`.
4. El cajero hace clic en `Confirmar Pago de Venta` (`btn-confirmar-cobro-${pref.id}`).
   - *Verificación*: Se despliega el modal `QuickPaymentMixedModal` (o `SplitPaymentModal`).
5. El cajero selecciona el método de pago (Efectivo con cálculo de vuelto, Transferencia Nequi/Daviplata/QR, Datáfono o Mixto).
6. Pulsar "Confirmar Cobro (F9)".
   - *Verificación*:
     - La preventa se marca como `FACTURADA`.
     - La tarjeta pasa a la columna "Facturadas / Pagadas".
     - Se imprime la tirilla POS y se actualiza el saldo de la caja.

#### Step 4: Verificación de Modo Monitor (Solo Lectura) para Vendedor
1. El vendedor accede al Kanban (`F7`).
2. *Verificación*:
   - Aparece la insignia `badge-modo-monitor-vendedor` ("Modo Monitor: Visualizando el avance de ventas").
   - Las tarjetas NO son arrastrables.
   - Los botones de cobro NO existen; en su lugar se observan pastillas pasivas `En Espera de Cobro en Caja` y `Atendiendo en Ventanilla`.

---

### 4.3 Proposed Unit Test Updates
In `src/tests/posCartPanelErgonomics.test.tsx`:
- Add test: `it('El contenedor pos-cart-items-list incluye flex-1, min-h-0 y overflow-y-auto')`.
- Add test: `it('En resolución estándar de laptop (768px vertical), CartPanel ocupa la altura completa disponible sin cortar botones de acción')`.
- Add test: `it('QuickCutNotes no se renderiza como bloque estático permanente en POSView, permitiendo activación modal bajo demanda')`.

---

## 5. Verification Method

To independently verify all findings and test suite integrity:

1. **Run Vitest Test Suites**:
   ```powershell
   npx vitest run src/tests/posCartPanelErgonomics.test.tsx
   npx vitest run src/tests/multiVendorCashierIntegrationE2E.test.tsx
   ```
2. **Inspect Code Files**:
   - `src/views/POSView.tsx`: verify lines 2652-2661 and lines 2686.
   - `src/views/pos/components/CartPanel.tsx`: verify line 510, line 620, lines 661-755.
   - `src/views/pos/components/CashierKanbanView.tsx`: verify lines 54-56 and lines 599-605.
3. **Invalidation Conditions**:
   - If `QuickCutNotes` was intentionally designed to stay permanently visible in POSView despite occupying 160px (invalidated by SPEC-052 Section 1.1 and 3.2 which mandates its removal from the static column).
   - If `CartPanel.tsx` were located in `src/components/pos/` (confirmed `False`, actual location is `src/views/pos/components/CartPanel.tsx`).
