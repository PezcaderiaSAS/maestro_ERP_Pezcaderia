# Original User Request

## Initial Request — 2026-11-08T14:21:42Z

Por favor, orquestar el equipo multi-agente de Teamwork para ejecutar este plan de trabajo de manera secuencial y quirúrgica, comenzando por la Tarea 1. Plan Integral de Refactorización y Desarrollo Frontend: Interfaz POS — La Pezcadería S.A.S. bajo metodología SDD v3.0 (SPEC-057).

Integrity mode: development

## Verification Resources
- Especificación: `specs/spec_057_pos_integral_refactor_frontend.md`
- Plan y Checklist: `specs/spec_057_plan_checklist.md`
- Pruebas y verificación: `src/tests/posCartEditableRow.test.tsx`, `npx tsc --noEmit`, `vitest`

## Requirements

### R1. Fila de Carrito con Navegación [Tab] y Edición en Línea (Tarea 1)
Estructurar el carrito en `src/views/pos/components/POSMultivendorCart.tsx` con filas editables donde Cantidad y Precio Unitario sean navegables continuamente mediante la tecla [Tab], botón micro [+ Desc] para descuento por ítem, flexbox vertical estricto (85% espacio para ítems) y suite de pruebas TDD en `src/tests/posCartEditableRow.test.tsx`.

### R2. Motor de Descuento Global de Comanda (Tarea 2)
Implementar botón anclado `+ Descuento (F4)` en el pie del carrito/zona de totales con selector [% / $] y recálculo financiero reactivo instantáneo (<10ms) en Zustand.

### R3. Trigger Táctil de Pesaje Manual (Tarea 3)
Desplegar inmediatamente el modal de teclado numérico táctil en pantalla (`ManualWeightModal`) para digitación manual rápida en kilogramos al hacer clic o escanear productos a granel (KG Balanza) en `src/views/pos/POSMultivendorView.tsx`.

### R4. Interceptor Global de Atajos de Teclado (Tarea 4)
Implementar interceptor global de atajos de teclado para POS: F8, Ctrl+K, F6, F2, F9 y Esc.

### R5. Validación Comercial y PIN de Supervisor (Tarea 5)
Aplicar fluidamente la edición de precio unitario o descuento en línea si está dentro de margen. Si el Descuento > 10% o el Precio Propuesto < Costo Base + 15%, exigir obligatoriamente PIN de supervisor (4 dígitos) vía `SupervisorPinModal`.

### R6. Calidad, Virtualización y Quality Gate Final (Tarea 6)
Mantener la botonera inferior de paginación `< Anterior 1 2 3 ... Siguiente >` para la matriz de 18 tarjetas (6×3) virtualizando el dataset en memoria para transiciones < 16ms (60 FPS). Validar con `tsc --noEmit`, suite Vitest 100% verde y validación responsive.

## Acceptance Criteria

### Carrito Editable y TDD (Tarea 1)
- [ ] Cada fila del carrito en `src/views/pos/components/POSMultivendorCart.tsx` contiene inputs numéricos continuos de Cantidad y Precio Unitario que permiten navegación continua con la tecla [Tab].
- [ ] Cada fila del carrito cuenta con un botón micro [+ Desc] para aplicar descuento por ítem.
- [ ] El contenedor de ítems del carrito utiliza flexbox vertical estricto ocupando el 85% del espacio vertical.
- [ ] La suite TDD `src/tests/posCartEditableRow.test.tsx` está implementada y pasa al 100% con Vitest.

### Descuento Global (Tarea 2)
- [ ] El botón anclado `+ Descuento (F4)` en la zona de totales permite seleccionar descuento por porcentaje (%) o monto fijo ($).
- [ ] El recálculo de totales en Zustand toma menos de 10ms tras aplicar el descuento.

### Pesaje Manual KG Balanza (Tarea 3)
- [ ] Al seleccionar o escanear un ítem a granel / balanza, se abre automáticamente `ManualWeightModal` con teclado táctil numérico para ingresar el peso en kg en `src/views/pos/POSMultivendorView.tsx`.

### Atajos de Teclado (Tarea 4)
- [ ] Los atajos de teclado F8, Ctrl+K, F6, F2, F9 y Esc ejecutan las acciones de navegación y comanda correspondientes sin colisionar con atajos del navegador.

### Control Comercial y PIN (Tarea 5)
- [ ] Si Descuento <= 10% y Precio Propuesto >= Costo Base + 15%, la edición de precio o descuento se aplica directamente sin requerir PIN.
- [ ] Si Descuento > 10% o Precio Propuesto < Costo Base + 15%, se bloquea la confirmación hasta validar un PIN de 4 dígitos en `SupervisorPinModal`.

### Quality Gate y Rendimiento (Tarea 6)
- [ ] La matriz de catálogo de 18 tarjetas (6×3) mantiene la botonera inferior de paginación `< Anterior 1 2 3 ... Siguiente >` virtualizando el dataset en memoria con transiciones de página a 60 FPS (< 16ms).
- [ ] `npx tsc --noEmit` ejecuta sin ningún error de tipado TypeScript.
- [ ] Todos los tests de Vitest pasan en verde (0 fallos).
- [ ] La interfaz se renderiza correctamente sin desbordamientos en responsive (375px móvil y desktop).


## Follow-up — 2026-11-08T15:12:55Z

El usuario ha confirmado la aprobación del Hito M1 y autoriza continuar con la Tarea 2 (Hito M2): Motor de Descuento Global de Comanda (+ Descuento F4) en el pie del carrito y recálculo financiero reactivo (<10ms) en Zustand.

Por favor proceder con la ejecución secuencial quirúrgica bajo SDD v3.0 / TDD.


## Follow-up — 2026-11-09T11:35:34Z

El usuario ha aprobado formalmente la continuación del proyecto. Por favor proceder inmediatamente con la ejecución secuencial quirúrgica de la **Tarea 3 (Hito M3)** bajo SDD v3.0 / TDD:

**Tarea 3 (Hito M3)**:
- Trigger táctil de pesaje manual con teclado numérico en pantalla (`ManualWeightModal.tsx`) para productos de peso variable (`KG Balanza`) al hacer clic o escanearlos en `src/views/pos/components/POSMultivendorView.tsx` y catálogo.
- Apertura inmediata del teclado táctil numérico con botones grandes (>= 48px) para digitación manual rápida en kg.
- Suite de pruebas TDD en `src/tests/posManualWeightModal.test.tsx` (o equivalente canónico) verificando apertura, confirmación de peso, recálculo en carrito y cierre.
- Verificación de tipos `tsc --noEmit` y suite Vitest.


## Follow-up — 2026-11-09T12:24:03Z

El usuario ha confirmado la aprobación del Hito M3 y autoriza continuar con la **Tarea 4 (Hito M4: Interceptor Global de Atajos de Teclado F8, Ctrl+K, F6, F2, F9, Esc)** bajo metodología SDD v3.0 / TDD.

Por favor proceder con la ejecución secuencial quirúrgica y reportar los avances.
