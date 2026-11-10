# Dispatch de Asignación: Worker M2 Implementación TDD

- **Agente**: `worker_m2_actions`
- **Rol**: Worker Implementador TDD de Hito M2
- **Hito**: Milestone M2 — Tarea 2: Motor de Descuento Global de Comanda (F4) [% / $] y Recálculo Sub-10ms en Zustand
- **Fecha**: 2026-11-08

## Insumos y Fuentes de Verdad
1. `ORIGINAL_REQUEST.md`: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md`
2. `PROJECT.md`: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\PROJECT.md`
3. Reporte Explorer TDD: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m2_explorer_tdd\handoff.md`
4. Reporte Explorer UI Footer: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m2_explorer_cart_footer\handoff.md`
5. Reporte Explorer Store & Calc: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m2_explorer_store_calc\handoff.md`

## Propiedad Exclusiva de Archivos (Write Ownership)
Tienes permiso de modificación y creación EXCLUSIVO sobre:
1. `src/tests/posGlobalDiscount.test.tsx` (Creación de la suite TDD con los 19 casos)
2. `src/stores/useMultiVendorPosStore.ts` (Adición de `descuentoGlobal`, `aplicarDescuentoGlobal`, `limpiarDescuentoGlobal`, `obtenerDescuentoGlobalMonto`, `obtenerTotalesCart` y actualización de `obtenerTotalCart`)
3. `src/views/pos/components/POSMultivendorCart.tsx` (Integración del botón F4, selector popover flotante, fila de desglose y props `descuentoGlobal`, `onAplicarDescuentoGlobal`, `onLimpiarDescuentoGlobal`)

**PROHIBIDO** editar otros archivos de producción sin previa autorización.

## Metodología TDD Mandatoria (Red -> Green -> Verify)
1. **Fase RED**:
   - Crear `src/tests/posGlobalDiscount.test.tsx` con la especificación completa provista por `m2_explorer_tdd`.
   - Ejecutar la prueba con `npx vitest run src/tests/posGlobalDiscount.test.tsx` y documentar que falla limpiamente debido a la ausencia de la implementación.
2. **Fase GREEN**:
   - Implementar los tipos, estado y acciones en `src/stores/useMultiVendorPosStore.ts` siguiendo el reporte de `m2_explorer_store_calc`.
   - Implementar la UI, popover flotante, presets, atajo/botón F4 y fila de desglose en `src/views/pos/components/POSMultivendorCart.tsx` siguiendo el reporte de `m2_explorer_cart_footer`.
   - Ejecutar `npx vitest run src/tests/posGlobalDiscount.test.tsx` hasta que los 19 tests pasen en verde (0 fallos).
3. **Fase VERIFY & NO-REGRESSION**:
   - Ejecutar verificación de tipos: `npx tsc --noEmit` (debe retornar 0 errores).
   - Ejecutar suite conjunta de regresión: `npx vitest run src/tests/posGlobalDiscount.test.tsx src/tests/posCartEditableRow.test.tsx src/tests/posMultivendorLightSaaS.test.tsx`.
   - Confirmar que todos los tests preexistentes y nuevos pasen al 100%.

## Advertencia Mandatoria de Integridad (MANDATORY INTEGRITY WARNING)
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
