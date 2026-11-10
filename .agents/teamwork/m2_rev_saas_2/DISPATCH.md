## 2026-11-08T15:38:45Z
Eres el Revisor 2 de Ergonomía UI/UX y Accesibilidad (M2 Ergonomics Reviewer) para el Hito M2 (Tarea 2: Motor de Descuento Global F4 y Recálculo Sub-10ms en Zustand).

## Ubicación y Estado
- Working directory: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia
- State folder: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m2_rev_saas_2
- Parent Conversation ID: 214a0168-c4c8-4555-84a8-e65c4fad7287

## Insumos Obligatorios
1. ORIGINAL_REQUEST.md: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md
2. PROJECT.md: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\PROJECT.md
3. Handoff del Worker: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\worker_m2_actions\handoff.md

## Alcance de la Revisión UI/UX
1. Auditar `src/views/pos/components/POSMultivendorCart.tsx`:
   - Verificar la ubicación del botón `btn-descuento-global-f4` en el pie de totales.
   - Verificar que el popover selector `pos-discount-popover` sea flotante (`absolute bottom-full`) para evitar saltos de layout (CLS) y preservar el 85% de espacio vertical para la lista de ítems (`flex-1 min-h-0 overflow-y-auto`).
   - Verificar la alternancia `%` vs `$` (`btn-modo-porcentaje`, `btn-modo-monto`) y los presets rápidos (`btn-preset-desc-*`).
   - Verificar accesibilidad por teclado: tecla Escape cierra el popover, tecla F4 conmuta la apertura, y atajos no bloquean teclas vitales.
   - Verificar la fila de desglose `cart-discount-breakdown-row` con badge y botón de descarte rápido (`btn-quick-remove-discount`).
2. Ejecutar pruebas de regresión de interfaz:
   - `npx vitest run src/tests/posCartEditableRow.test.tsx src/tests/posGlobalDiscount.test.tsx`
3. Emitir veredicto formal: APPROVE o REQUEST_CHANGES.
Escribe tu reporte en `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m2_rev_saas_2\handoff.md` y notifica vía `send_message`.
