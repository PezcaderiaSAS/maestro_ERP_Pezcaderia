# BRIEFING — 2026-11-08T15:20:00Z

## Mission
Diseñar la estrategia de UI/UX y la especificación técnica para incorporar en `POSMultivendorCart.tsx` el botón permanente anclado `+ Descuento (F4)`, selector interactivo [% / $], presets rápidos, desglose visual de descuento y preservación del layout flexbox.

## 🔒 My Identity
- Archetype: explorer
- Roles: UI/UX Explorer, Cart Footer Analyst
- Working directory: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia
- State folder: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m2_explorer_cart_footer
- Original parent: 214a0168-c4c8-4555-84a8-e65c4fad7287
- Milestone: M2 - Tarea 2: Motor de Descuento Global de Comanda F4 [% / $] y Recálculo Sub-10ms en Zustand

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Write only to .agents/teamwork/m2_explorer_cart_footer/
- Spanish (es-419) language for interaction/documentation
- Focus strictly on POSMultivendorCart.tsx footer UI/UX, F4 trigger, discount selector, and flexbox preservation

## Current Parent
- Conversation ID: 214a0168-c4c8-4555-84a8-e65c4fad7287
- Updated: 2026-11-08T15:20:00Z

## Investigation State
- **Explored paths**:
  - `src/views/pos/components/POSMultivendorCart.tsx` (Estructura de footer líneas 305-385 y props)
  - `src/views/pos/components/POSMultivendorView.tsx` (Contenedor y renderizado en Main)
  - `src/stores/useMultiVendorPosStore.ts` (Lógica de store y recálculo financiero)
  - `src/hooks/usePOSCart.ts` & `src/services/posService.ts` (`calcularTotalesPedido`)
  - `src/tests/posCartEditableRow.test.tsx` (Suite existente verde con 10 tests)
  - `specs/spec_057_pos_integral_refactor_frontend.md` (Secciones 2.2, 3.5, 4.2)
  - `PROJECT.md` & `ORIGINAL_REQUEST.md` (Features F7, F8, F9)
- **Key findings**:
  1. El pie de carrito actual (`shrink-0 mt-auto`) contiene notas opcionales, subtotal, descuento condicional y total a pagar.
  2. Integrar el selector inline duplicaría la altura del footer (de 186px a 346px), reduciendo drásticamente el espacio de la lista de ítems. La solución arquitectónica óptima es un **Popover flotante superior** (`absolute bottom-full left-0 right-0 mb-2 z-30`), que preserva exactamente la altura del footer y el 85% de espacio útil para la lista.
  3. El botón anclado permanente `+ Descuento (F4)` con `data-testid="btn-descuento-global-f4"` se ubica entre el Subtotal y el Total, y se transforma dinámicamente en badge de descuento activo con acceso a re-edición o eliminación.
  4. Selector con pestañas toggle [% / $], chips preset (5%, 10%, 15% / $2.000, $5.000, $10.000 COP), input numérico controlado con auto-selección en foco y botones "Remover" y "Aplicar".
  5. Desglose con fila `data-testid="cart-discount-breakdown-row"`, badge `badge-descuento-global` y botón de descarte rápido `btn-remover-descuento-global`.
  6. Props backward-compatible: `descuentoGlobalTipo?`, `descuentoGlobalValor?`, `onApplyGlobalDiscount?`, `onRemoveGlobalDiscount?`, `isDiscountOpen?`, `onToggleDiscountOpen?`.
- **Unexplored areas**: Implementación de código en src/ (delegada al worker implementador).

## Key Decisions Made
- Seleccionar Popover flotante anclado sobre el botón (`absolute bottom-full`) en lugar de acordeón inline o modal a pantalla completa, logrando cero layout shift y recálculo en vivo visible sub-10ms.
- Soportar atajos locales de teclado: F4 para abrir/cerrar y Escape para cerrar.

## Artifact Index
- handoff.md — Reporte final exhaustivo de análisis UI/UX y especificación de implementación
- progress.md — Registro de liveness y progreso continuo
- DISPATCH.md — Registro de despachos recibidos
