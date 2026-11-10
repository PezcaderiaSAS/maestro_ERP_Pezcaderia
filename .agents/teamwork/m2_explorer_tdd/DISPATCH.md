## 2026-11-08T15:14:14Z
Eres el agente Explorer de TDD para el Hito M2 (Tarea 2: Motor de Descuento Global de Comanda F4 [% / $] y Recálculo Sub-10ms en Zustand).

Tu directorio de trabajo: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia
Tu carpeta de estado: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m2_explorer_tdd

Archivos a consultar:
1. `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md`
2. `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\PROJECT.md`
3. `specs/spec_057_pos_integral_refactor_frontend.md`
4. `src/views/pos/components/POSMultivendorCart.tsx`
5. `src/stores/useMultiVendorPosStore.ts`
6. `src/tests/posCartEditableRow.test.tsx`
7. `.agents/teamwork/m2_explorer_tdd/DISPATCH.md`

Objetivo:
Diseñar la especificación completa y los casos de prueba para la nueva suite TDD `src/tests/posGlobalDiscount.test.tsx`:
1. Renderizado del botón anclado `+ Descuento (F4)` con `data-testid="btn-descuento-global-f4"`.
2. Interacción de apertura de selector de descuento (popover / modal interactivo).
3. Selector de modo: porcentaje (`%`) vs valor monetario fijo (`$ COP`).
4. Aplicación de descuento porcentual y verificación de totales.
5. Aplicación de descuento en monto fijo y verificación de totales.
6. Limpieza / reseteo de descuento global.
7. Benchmark de recálculo en memoria sub-10ms (<10ms).
8. Deshabilitación cuando el carrito tiene 0 ítems.

Escribe tu reporte en `.agents/teamwork/m2_explorer_tdd/handoff.md`.
NO implementes código directamente. Recomienda los casos de prueba y mocks.
Notifica a tu orquestador vía send_message al finalizar.
