# BRIEFING — 2026-11-08T15:23:00Z

## Mission
Diseñar la especificación completa y los casos de prueba para la nueva suite TDD `src/tests/posGlobalDiscount.test.tsx` del Hito M2 (Descuento Global F4 y Recálculo Sub-10ms en Zustand).

## 🔒 My Identity
- Archetype: explorer
- Roles: [explorer, tdd-designer]
- Working directory: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia
- State folder: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m2_explorer_tdd
- Original parent: 214a0168-c4c8-4555-84a8-e65c4fad7287
- Milestone: M2 - Motor de Descuento Global de Comanda F4 [% / $] y Recálculo Sub-10ms en Zustand

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Design complete specification and test cases for `src/tests/posGlobalDiscount.test.tsx`
- Follow project testing standards (Vitest, React Testing Library, Zustand, WCAG AA, data-testids)

## Current Parent
- Conversation ID: 214a0168-c4c8-4555-84a8-e65c4fad7287
- Updated: 2026-11-08T15:23:00Z

## Investigation State
- **Explored paths**:
  - `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md`
  - `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\PROJECT.md`
  - `specs/spec_057_pos_integral_refactor_frontend.md`
  - `src/views/pos/components/POSMultivendorCart.tsx` (líneas 1-385)
  - `src/views/pos/components/POSMultivendorView.tsx` (líneas 1-209)
  - `src/stores/useMultiVendorPosStore.ts` (líneas 1-265)
  - `src/services/posService.ts` (`calcularTotalesPedido`, líneas 47-81)
  - `src/hooks/usePOSCart.ts` (líneas 1-237)
  - `src/tests/posCartEditableRow.test.tsx` (10 tests pasando)
  - `.agents/teamwork/m2_explorer_cart_footer/handoff.md`
- **Key findings**:
  - Diseñada la suite completa `src/tests/posGlobalDiscount.test.tsx` compuesta por 8 bloques y 19 casos de prueba.
  - Se mapearon todos los `data-testid` canónicos (`btn-descuento-global-f4`, `pos-discount-popover`, `btn-modo-porcentaje`, `btn-modo-monto`, `input-descuento-global-valor`, `btn-preset-desc-*`, `btn-aplicar-descuento-global`, `btn-remover-descuento-global`, `cart-discount-breakdown-row`, `badge-descuento-global`, `btn-quick-remove-discount`, `pos-cart-total-amount`).
  - Se modeló la interacción tanto a nivel de componente (`POSMultivendorCart`) como a nivel de store de Zustand (`useMultiVendorPosStore`) y benchmark sub-10ms con 50 líneas y ráfaga de 100 recálculos sub-1ms.
- **Unexplored areas**: Implementación en código de producción (reservada para el worker de implementación).

## Key Decisions Made
- Estructurar la suite en 8 bloques temáticos cubriendo los 8 requerimientos mandatorios del orquestador.
- Diseñar la suite como una prueba de dos niveles: Pruebas de integración visual de componentes + Pruebas unitarias de motor financiero de store + Benchmark determinista.

## Artifact Index
- handoff.md — Reporte final de handoff con la especificación completa y código de tests para src/tests/posGlobalDiscount.test.tsx
- progress.md — Registro de liveness y estado de tareas
- DISPATCH.md — Mensaje de despacho original recibido
