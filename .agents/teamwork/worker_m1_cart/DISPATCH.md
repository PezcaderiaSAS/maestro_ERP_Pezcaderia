## 2026-11-08T14:43:07Z
Eres el agente Worker de Implementación para el Hito M1 (Tarea 1: Fila de Carrito con Navegación [Tab] y Edición en Línea) bajo metodología SDD v3.0 / TDD.

Tu directorio de trabajo: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia
Tu carpeta de estado: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\worker_m1_cart

Archivos mandatorios a consultar antes de codificar:
1. `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md`
2. `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\PROJECT.md`
3. `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m1_explorer_tdd\handoff.md` (especificación completa de los 10 tests TDD)
4. `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m1_explorer_component\handoff.md` (diseño de JSX, inputs, tabIndex y flexbox)
5. `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m1_explorer_integration\handoff.md` (guarda de regresión y tipos opcionales)
6. `.agents/teamwork/worker_m1_cart/DISPATCH.md`

## PROPIEDAD DE ESCRITURA EXCLUSIVA
Posees la propiedad de escritura exclusiva y puedes modificar ÚNICAMENTE:
- `src/tests/posCartEditableRow.test.tsx` (creación de la suite TDD)
- `src/views/pos/components/POSMultivendorCart.tsx` (refactorización del componente)

NO toques ningún otro archivo fuente ni de test (especialmente NO toques `src/tests/posMultivendorLightSaaS.test.tsx`).

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Plan de Ejecución TDD Quirúrgico
Paso 1 (RED):
- Crea `src/tests/posCartEditableRow.test.tsx` con los 10 casos de prueba diseñados en `m1_explorer_tdd/handoff.md` (usando `@testing-library/react` y `jest-dom`, SIN `userEvent` ya que no está instalado).
- Ejecuta `npx vitest run src/tests/posCartEditableRow.test.tsx` y confirma la fase RED (deben fallar las asunciones de inputs que aún no existen en el componente).

Paso 2 (GREEN):
- Actualiza `src/views/pos/components/POSMultivendorCart.tsx` según las especificaciones de `m1_explorer_component/handoff.md` e `m1_explorer_integration/handoff.md`:
  - Nuevas props y tipos opcionales en `MultivendorCartItem` (`descuentoPct?: number;`) y `POSMultivendorCartProps` (`onSetQuantity?`, `onUpdatePrice?`, `onUpdateDiscount?`).
  - Inputs numéricos en línea: `data-testid="cart-qty-input-${index}"` y `data-testid="cart-unit-price-input-${index}"`.
  - Navegación [Tab] secuencial: `tabIndex={index * 2 + 1}` para cantidad, `tabIndex={index * 2 + 2}` para precio unitario, y `tabIndex={-1}` para steppers, botón eliminar y micro-descuento.
  - Auto-selección al recibir foco: `onFocus={(e) => e.target.select()}` en ambos inputs.
  - Micro-botón `[+ Desc]` con `data-testid="btn-cart-desc-${index}"` usando el icono `Tag`.
  - Span display retrocompatible: `<span data-testid="cart-qty-${index}" className="sr-only">{qty}</span>` para que `posMultivendorLightSaaS.test.tsx` pase al 100% sin tocar ese test.
  - Layout flexbox vertical estricto: `aside` con `flex flex-col h-full min-h-0`, lista de ítems con `flex-1 min-h-0 overflow-y-auto` (85% espacio útil), y pie anclado `shrink-0 mt-auto`.

Paso 3 (VERIFY):
- Ejecuta `npx tsc --noEmit` -> debe dar 0 errores (código de salida 0).
- Ejecuta `npx vitest run src/tests/posCartEditableRow.test.tsx src/tests/posMultivendorLightSaaS.test.tsx` -> los 10 nuevos tests y los 8 tests existentes deben pasar en verde al 100%.

Documenta todo en tu reporte `handoff.md` en `.agents/teamwork/worker_m1_cart/handoff.md` y notifica al orquestador vía `send_message`.
