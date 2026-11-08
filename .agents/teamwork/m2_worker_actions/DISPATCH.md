# Dispatch: m2_worker_actions
Milestone M2: Desacoplamiento de Operaciones Secundarias a Menú/Modal de Caja (POSSecondaryActionsModal.tsx)


## 2026-11-07T19:14:37Z
Read ORIGINAL_REQUEST.md at c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md.
Read PROJECT.md at c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\PROJECT.md.

You are m2_worker_actions.
Your mission is to implement Milestone M2: Desacoplamiento de Operaciones Secundarias a Menú/Modal de Caja.

Exclusive Write Ownership:
- src/views/pos/components/POSSecondaryActionsModal.tsx (create)
- src/views/pos/components/CartPanel.tsx (edit)

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Detailed Tasks:
1. Create `src/views/pos/components/POSSecondaryActionsModal.tsx`:
   - Design a clean, high-contrast modal or dropdown popover following `erp-pos-design-tokens` (Light Mode / SaaS style with Dark Glassmorphism V8 accents).
   - House secondary operations cleanly:
     - "Cerrar Turno de Caja" (calls `onCerrarTurnoClick` if provided).
     - "Ventas en Espera & Multicliente" (lists current `drafts`, displays client/time/total, allows switching active draft, creating parked sale, deleting draft).
     - "Notas de Corte" (calls `onOpenNotasModal` if provided).
     - "Vaciar Carrito" (calls `onLimpiarCarrito`).
   - Clean keyboard accessible: Escape closes the modal, backdrop click closes.

2. Integrate into `src/views/pos/components/CartPanel.tsx`:
   - In the compact top bar (`.pos-cart-header`):
     - Keep the customer display (`👤 CONSUMIDOR FINAL` / customer name) compact.
     - Add an actions button `[⋮]` or popover trigger that opens `POSSecondaryActionsModal`.
     - If `drafts.length > 0`, show a compact badge `data-testid="badge-pedidos-espera"` `⏸ ${drafts.length} en espera` that opens the modal on click without pushing down the line-items container.
   - Ensure `pos-cart-items-list` retains 75% to 80% vertical height completely unobstructed.

3. Run verification tests:
   - `npx vitest run src/tests/posParkedSalesFlow.test.tsx`
   - `npx vitest run src/tests/posCartPanelErgonomics.test.tsx`
   - `npx vitest run src/tests/posCartDrafts.test.ts`
   - `npx vitest run src/tests/posCart12ItemsScroll.test.tsx`
   - `npx tsc --noEmit`
   Ensure 100% tests pass with 0 TypeScript compiler errors.

Deliverable:
Write a comprehensive handoff report to:
`c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m2_worker_actions\handoff.md`
Include:
- Files modified / created
- Summary of changes
- Verbatim Vitest and tsc test execution outputs.
Update progress.md in your state folder.
When complete, send a message to your parent orchestrator with a concise summary.
