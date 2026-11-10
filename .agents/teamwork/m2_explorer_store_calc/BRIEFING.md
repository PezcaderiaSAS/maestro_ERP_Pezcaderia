# BRIEFING — 2026-11-08T15:22:00Z

## Mission
Investigar y diseñar la lógica de estado y cálculo financiero para el Descuento Global de Comanda F4 [% / $] con recálculo sub-10ms en Zustand.

## 🔒 My Identity
- Archetype: explorer
- Roles: Read-only investigation, Store and Financial Calculation Analysis
- Working directory: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia
- State folder: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m2_explorer_store_calc
- Original parent: 214a0168-c4c8-4555-84a8-e65c4fad7287
- Milestone: Hito M2 - Tarea 2: Motor de Descuento Global de Comanda F4 [% / $] y Recálculo Sub-10ms en Zustand

## 🔒 Key Constraints
- Read-only investigation — do NOT implement code directly
- Write only to state folder: .agents/teamwork/m2_explorer_store_calc/
- No source code or tests in .agents/teamwork/
- Must follow 5-component handoff report protocol
- Communicate via send_message to caller agent

## Current Parent
- Conversation ID: 214a0168-c4c8-4555-84a8-e65c4fad7287
- Updated: 2026-11-08T15:15:00Z

## Investigation State
- **Explored paths**: `src/stores/useMultiVendorPosStore.ts`, `src/hooks/usePOSCart.ts`, `src/services/posService.ts`, `src/views/pos/components/POSMultivendorCart.tsx`, `src/views/pos/components/POSMultivendorView.tsx`, `src/tests/useMultiVendorPosStore.test.ts`, `src/tests/posCartEditableRow.test.tsx`, `src/tests/pos.test.ts`.
- **Key findings**:
  1. `useMultiVendorPosStore.ts` carece actualmente de `descuentoGlobal` y solo calcula descuentos por ítem.
  2. `usePOSCart.ts` usa dos estados separados (`descuentoGlobalPct` y `descuentoGlobalValor`) que sufren de sombreado cuando se cambia entre monto y porcentaje.
  3. `calcularTotalesPedido` previene totales negativos (`descuento > subtotal`) pero requiere saneamiento de entradas negativas (`valor < 0`).
  4. La complejidad en memoria para $N \le 50$ ítems es $O(N)$ y toma $< 0.02$ms, garantizando con holgura el SLA $< 10$ms siempre que las acciones sean estrictamente síncronas.
  5. Se diseñaron las firmas completas de `aplicarDescuentoGlobal` y `limpiarDescuentoGlobal` con control comercial de supervisor.
- **Unexplored areas**: None for Store/Calculation scope. Ready for implementation.

## Key Decisions Made
- Definir unión discriminada `tipo: 'porcentaje' | 'monto'` para modelar `descuentoGlobal`.
- Mantener retrocompatibilidad total con `obtenerTotalCart()` mientras se expone `obtenerTotalesCart()` para el desglose completo.
- Acotar el cálculo de `totalFinal` con `Math.max(0, subtotal - descuento)` para imposibilitar totales negativos.

## Artifact Index
- DISPATCH.md — Received prompt
- BRIEFING.md — Working memory and context
- progress.md — Liveness heartbeat
- handoff.md — Final investigation handoff report (5 sections complete)
