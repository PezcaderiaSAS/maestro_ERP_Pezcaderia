## 2026-11-09T11:49:03Z

Eres el Worker Implementador TDD para el Hito M3 (Tarea 3: Trigger Táctil de Pesaje Manual `ManualWeightModal` para Ítems a Granel / KG Balanza, F10 y F11).

## Ubicación y Estado
- Working directory: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia
- State folder: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\worker_m3_weight
- Dispatch spec: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\worker_m3_weight\DISPATCH.md
- Parent Conversation ID: 214a0168-c4c8-4555-84a8-e65c4fad7287

## Insumos Mandatorios
Lee antes de comenzar:
1. ORIGINAL_REQUEST.md: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md
2. PROJECT.md: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\PROJECT.md
3. Reporte Explorer TDD: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m3_explorer_tdd\handoff.md
4. Reporte Explorer Modal UI: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m3_explorer_modal_ui\handoff.md
5. Reporte Explorer View Integration: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m3_explorer_view_integration\handoff.md

## Propiedad Exclusiva de Escritura (Write Ownership)
Tienes permiso de modificación y creación EXCLUSIVO sobre:
1. `src/tests/posManualWeightModal.test.tsx` (Actualización y expansión de la suite TDD con los 8 bloques funcionales diseñados por `m3_explorer_tdd`)
2. `src/views/pos/components/ManualWeightModal.tsx` (Teclado táctil numérico en pantalla >=48px/56px, botón Limpiar 'C', chips de acceso rápido con `chip-weight-*`, visor con badge KG, cálculo dinámico subtotal en COP y soporte dual de testids para compatibilidad con suites previas)
3. `src/views/pos/components/POSMultivendorView.tsx` (Intercepción automática de ítems pesables `unidad_medida === 'KG'` al hacer clic en catálogo o escanear código de barras, montaje de `ManualWeightModal`, y pasaje de peso en kg a `onAddToCart(product, pesoKg)`)

## Protocolo TDD Quirúrgico
1. **Fase RED**: Actualiza `src/tests/posManualWeightModal.test.tsx` con los nuevos casos diseñados por `m3_explorer_tdd`. Ejecuta `npx vitest run src/tests/posManualWeightModal.test.tsx` usando `run_command` y documenta que fallan los nuevos casos debido a la falta de implementación.
2. **Fase GREEN**: Implementa `src/views/pos/components/ManualWeightModal.tsx` siguiendo el reporte de `m3_explorer_modal_ui` e implementa la intercepción en `src/views/pos/components/POSMultivendorView.tsx` siguiendo el reporte de `m3_explorer_view_integration`. Ejecuta `npx vitest run src/tests/posManualWeightModal.test.tsx` hasta que el 100% de los tests pasen en verde.
3. **Fase VERIFY**: Ejecuta `npx tsc --noEmit` y `npx vitest run src/tests/posManualWeightModal.test.tsx src/tests/posTouchErgonomics.test.tsx src/tests/posGlobalDiscount.test.tsx src/tests/posCartEditableRow.test.tsx src/tests/posMultivendorLightSaaS.test.tsx`. Asegura 0 errores de compilación y 0 regresiones.

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Entregables
- Escribe tu reporte en `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\worker_m3_weight\handoff.md` detallando comandos ejecutados, salida de pruebas y verificación de layout.
- Notifica al orquestador vía `send_message`.
