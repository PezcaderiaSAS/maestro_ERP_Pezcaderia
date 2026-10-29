## 2026-10-29T16:29:15Z
You are worker_m2_gen2, an implementation worker subagent for Milestone M2: POS Multivendedor & Ergonomía.

Working Directory: c:\Users\Personal\Documents\Yurgen\Maestro_Pezcaderia_ERP\maestro_ERP_Pezcaderia\.agents\teamwork\worker_m2_gen2\
Parent Orchestrator Conversation ID: e42ef4de-8a0f-405a-9bf6-e0fafd6d44e7

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY SPECIFICATIONS TO READ BEFORE WRITING ANY CODE:
1. ORIGINAL_REQUEST.md path:
   c:\Users\Personal\Documents\Yurgen\Maestro_Pezcaderia_ERP\maestro_ERP_Pezcaderia\.agents\teamwork\ORIGINAL_REQUEST.md
2. Survey 1 Layout & Overflow Findings:
   c:\Users\Personal\Documents\Yurgen\Maestro_Pezcaderia_ERP\maestro_ERP_Pezcaderia\.agents\teamwork\teamwork_explorer_survey_1\handoff.md (Read Section B and Section 5.2)
3. Survey 2 UX Laws & Ergonomics Findings:
   c:\Users\Personal\Documents\Yurgen\Maestro_Pezcaderia_ERP\maestro_ERP_Pezcaderia\.agents\teamwork\teamwork_explorer_survey_2\handoff.md (Read Section 1.1 and Section 5)
4. Master Architecture:
   c:\Users\Personal\Documents\Yurgen\Maestro_Pezcaderia_ERP\maestro_ERP_Pezcaderia\PROJECT.md

YOUR EXCLUSIVE WRITE OWNERSHIP:
You own and may ONLY edit:
- `src/views/POSView.tsx`
- `src/views/pos/components/ProductSearchPanel.tsx`
- `src/views/pos/components/CartPanel.tsx`
- `src/views/pos/components/ParkedOrdersBar.tsx`
- `src/views/pos/components/LineaVentaRow.tsx`
- `src/views/pos/components/TerminalVendorBadge.tsx`
- `src/views/pos/components/PaymentPanel.tsx`
- `src/views/pos/components/PendingOrdersDrawer.tsx`
- `src/tests/m2POSMultivendor.test.tsx`
Do NOT modify files outside this set.

SCOPE & REQUIRED IMPLEMENTATION (Features F5–F10):
1. **F5: POS Mobile Switcher (Catálogo/Carrito) on `< lg` in `POSView.tsx`**:
   - In `POSView.tsx:2276`, on screens `< lg` (e.g. mobile 375px), implement a clean, accessible mobile tab switcher: `[Catálogo]` / `[Carrito (N)]`.
   - When `catalogo` tab is active, render the product search and catalog panel with `flex-1`; when `carrito` tab is active, render `CartPanel` with `flex-1`.
   - On desktop / large screens (`lg:` and up), preserve the existing side-by-side grid (`lg:grid lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]`).
   - This eliminates the issue where the cart is buried below the fold inside `overflow-hidden`.
2. **F6: POS Asesores de Mostrador Fitts's Law in `POSView.tsx`**:
   - In `POSView.tsx:1990-2015`, counter vendor buttons (`btn-vendedor-${v.id}`) currently use `py-1 text-xs` (24px height).
   - Change to `min-h-[44px] px-3.5 py-2.5` with legible text and accessible touch target >= 44x44px.
3. **F7: POS Badges y Botones de Acción Fitts's Law**:
   - In `TerminalVendorBadge.tsx:50-101`, adjust `btn-toggle-terminal-select` and `btn-cambiar-vendedor` to have `min-h-[44px] px-3 py-2`.
   - In `PaymentPanel.tsx:407-416`, adjust the `+ Split` button to `min-h-[44px] px-3 py-2 text-xs font-bold`.
   - In `POSView.tsx:2100-2162`, ensure the quick action buttons (Comandas drawer, Balanza, Más acciones) meet `min-h-[44px]` touch height.
4. **F8: POS Barcode & Búsqueda Wrap in `ProductSearchPanel.tsx`**:
   - In `ProductSearchPanel.tsx:109-148`, make the barcode input + scan button form wrap responsively (`flex-wrap gap-2`) so it does not exceed 375px viewport width.
   - Ensure the search input and barcode input have `min-h-[44px]`.
5. **F9: POS Parked Orders Bar Wrap in `ParkedOrdersBar.tsx`**:
   - In `ParkedOrdersBar.tsx:26-46`, add `flex-wrap gap-2` to the header container so "Ventas en Espera & Multicliente" and "Suspender & Nueva Venta" do not cause horizontal overflow at 375px (`scrollWidth <= clientWidth`).
6. **F10: POS Doherty (<400ms) & Miller (Chunking) Optimization**:
   - In `ProductSearchPanel.tsx`, apply debouncing (200ms) to the product search input to prevent synchronous re-filtering on every keystroke.
   - In product catalog cards (`ProductSearchPanel.tsx:248-298`), simplify the card presentation: show total stock clearly, and hide the detailed 3-warehouse breakdown (`Bod. Principal`, `Bod. Secundaria`, `Bod. Averías`) by default, revealing it on user tap/toggle.
7. **Responsive SweetAlert2 Modals in POS**:
   - Ensure any Swal modals in `POSView.tsx` (such as client link at line 418) use responsive width (`width: window.innerWidth < 640 ? '92vw' : '520px'`) avoiding fixed 550px overflow.

VERIFICATION REQUIREMENTS:
1. Write unit and component tests in `src/tests/m2POSMultivendor.test.tsx` verifying:
   - Mobile view switcher switches between catalog and cart on mobile viewports.
   - Counter vendor buttons and action buttons have `min-h-[44px]`.
   - Search debouncing is applied.
   - Parked orders bar and barcode form do not blow out horizontal width.
2. Run build verification: `npx tsc --noEmit`
3. Run test verification: `npx vitest run src/tests/m2POSMultivendor.test.tsx` and `npx vitest run src/tests/m1ShellAndTokens.test.tsx`
4. Document all verification commands and exact passing outputs in `handoff.md`.
5. Update your `progress.md` after each step and deliver `handoff.md` in your working directory.
6. When done, call `send_message` to parent orchestrator (`e42ef4de-8a0f-405a-9bf6-e0fafd6d44e7`).
