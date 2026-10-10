# Lista de Tareas Brownfield SDD 007: Alquiler de Frío — Cajas Peso Fijo, Granel & Salida Rápida

- [x] **Tarea 1: Algoritmos Deterministas en Schema Zod**
  - [x] Implementar `calcularPesoCajasNominal(cantidadCajas, pesoNominalKg, taraUnitariaKg)`.
  - [x] Implementar `calcularEstimacionProporcionalSalida(pesoNetoActual, bultosActuales, bultosARetirar)`.
  - [x] Exportar funciones y tipados en `packages/validation-schemas/src/coldStorageRental.schema.ts`.
  - [x] *Checkpoint:* Pruebas unitarias de las funciones matemáticas en Vitest.

- [x] **Tarea 2: Lógica de Servicio WMS en `coldStorageRentalService.ts`**
  - [x] Asegurar persistencia y descuento exacto de bultos y kilos en retiros parciales de granel.
  - [x] Soportar retiro total atómico (`es_retiro_total = true`) dejando bultos y saldo en 0.
  - [x] Sincronizar persistencia bidireccional (Supabase + localStorage).

- [x] **Tarea 3: Interfaz de Báscula y Entrada de Cajas de Peso Fijo en `ColdStorageRentalView.tsx`**
  - [x] En la sección de pesaje de la partida actual, detectar si el producto es `PESO_ESTABLE` o permitir marcar modo "Caja Peso Fijo".
  - [x] Al seleccionar caja de peso fijo, mostrar input de "Peso Nominal por Caja (Kg)" y autocalcular peso neto y bruto en tiempo real al escribir las cajas.
  - [x] Permitir agregar directamente a la planilla sin forzar báscula física si el peso es nominal.

- [x] **Tarea 4: Interfaz de Despacho, Salida Parcial Proporcional y Botones de Salida Rápida**
  - [x] En el checklist de despacho, al cambiar `bultos_a_retirar` para producto a granel o mixto, autocalcular y sugerir el peso neto proporcional editable.
  - [x] Agregar botón táctil `[⚡ Retirar Restante]` en cada fila de lote del checklist.
  - [x] Agregar botón táctil `[⚡ Despachar Todo el Saldo]` en la cabecera del cliente para marcar todos los lotes activos al 100% en 1 clic.
  - [x] Actualizar totales de despacho en vivo reflejando bultos físicos y kilos netos.

- [x] **Tarea 5: Pruebas Automatizadas y Validación TDD**
  - [x] Agregar pruebas específicas en `src/tests/coldStorageRental.test.ts` para el caso de uso del usuario:
    - Entrada de 40 canastillas de capón de carne con 843.3 kg.
    - Salida parcial de 30 canastillas (sugerido 632.48 kg, ajustado a 630 kg).
    - Salida rápida del saldo restante de 10 canastillas y 213.3 kg.
    - Entrada rápida de 50 cajas de papas fritas de 10 kg (500 kg netos).

- [x] **Tarea 6: Bucle DevTools MCP en Vivo & Cierre**
  - [x] Auditar consola JS en `pageId: 3` (0 errores).
  - [x] Auditar viewport móvil en 375 px.
  - [x] Actualizar memoria y changelog.
