# Tareas Granulares de Implementación (/speckit.tasks)

**Código:** SPEC-015  
**Título:** Desglose Atómico de Tareas — Flujo Completo de Integración B2B (Cotizaciones $\rightarrow$ Pedidos $\rightarrow$ Alistamiento $\rightarrow$ Rutas de Entrega)  
**Estado:** APPROVED_READY_FOR_IMPLEMENTATION (Validado por los 4 Agentes de Agency Swarm)  
**Fecha:** 2026-10-15  
**Fase de Ciclo:** Spec Kit v3.0 — Post `/speckit.analyze`  
**Gobernanza:** Continuous-Kanban-Flow (Límite Estricto WIP = 1)  

---

## Matriz de Tareas Secuenciales (WIP = 1)

```
[TASK-015-01] Tipos y Contratos TypeScript (Pedido, LineaPedido, Cotizacion)
     │
     ▼
[TASK-015-02] Orquestador B2B: Fase 1 Comercial (Cotización -> Pedido con Cupo & NIIF)
     │
     ▼
[TASK-015-03] Orquestador B2B: Fase 2 WMS (Alistamiento, Pesaje Real FEFO & Remisión)
     │
     ▼
[TASK-015-04] Orquestador B2B: Fase 3 Despacho (Manifiesto, Entrega en Sitio & Cuarentena)
     │
     ▼
[TASK-015-05] UI & Kanban Integration (Badges de 3 Actores y Controles Táctiles >= 48px)
     │
     ▼
[TASK-015-06] Suite Integral E2E Vitest & Quality Gate DevTools MCP
```

---

### TASK-015-01: Tipos y Contratos TypeScript (Trazabilidad de 3 Actores y Catch Weight) [COMPLETADA]
* **Objetivo:** Ampliar y asegurar el tipado estricto en `src/types/orders.types.ts` y `src/store/useOrderStore.ts` para soportar la trazabilidad completa y los campos de pesaje real en frío.
* **Archivos Afectados:**
  - `src/types/orders.types.ts`
  - `src/store/useOrderStore.ts`
  - `src/services/b2bService.ts`
  - `src/tests/b2bContracts.test.ts`
* **Entregables:**
  - En `Pedido`: campos `vendedorId`, `vendedorNombre`, `cotizacionIdOriginal`, `operarioAlistadorId`, `operarioAlistadorNombre`, `horaInicioAlistamiento`, `horaFinAlistamiento`, `remisionId`, `tokenQrRemision`, `precintoCanastilla`, `conductorRepartidorId`, `conductorRepartidorNombre`, `manifiestoRutaId`, `retefuenteValor`, `reteicaValor`.
  - En `LineaPedido`: campos `pesoReal`, `variacionPesoPct`, `toleranciaAceptada`, `subtotalRealAjustado`, `temperaturaC`, `loteSeleccionado`.
  - En `Cotizacion`: estado `'CONVERTIDA_A_PEDIDO'`, `vendedorId`, `vendedorNombre`.
* **Resultado:** 100% implementado, `npx tsc --noEmit` con 0 errores y suite `src/tests/b2bContracts.test.ts` pasando al 100% (2/2 tests verdes).

---

### TASK-015-02: Orquestador B2B: Fase 1 Comercial (Cotización $\rightarrow$ Pedido) [COMPLETADA]
* **Objetivo:** Implementar el módulo comercial en `src/services/b2bIntegrationService.ts` que valida cupo de crédito, liquida retenciones NIIF y convierte cotizaciones en pedidos formales con estampa de `vendedorId`.
* **Archivos Afectados:**
  - `src/services/b2bIntegrationService.ts` (nuevo)
  - `src/tests/b2bCommercialFlow.test.ts` (nueva suite)
  - `src/services/b2bSalesService.ts` (ajuste de redondeo Math.round en retenciones NIIF)
  - `src/store/useOrderStore.ts` (manejo defensivo de operaciones asíncronas)
* **Entregables:**
  - Función `convertirCotizacionAPedido(input)` con soporte para clientes contado y crédito.
  - Validación de cupo con `B2BSalesService.verificarCupoCredito` y transicionamiento a `PAUSADO_POR_CREDITO` si excede límite.
  - Desglose NIIF con `B2BSalesService.calcularTotalesCotizacionNIIF` (Retefuente 2.5%, ReteICA 0.414%, valor neto a cobrar).
  - Estampado inmutable de `vendedorId`, `vendedorNombre`, `cotizacionIdOriginal` y fecha ISO.
  - Publicación de evento inmutable en `useEventStore` (`QUOTE_STATUS_CHANGED` con metadata `b2b_pedido_creado_desde_cotizacion`).
* **Resultado:** 100% implementado, `npx tsc --noEmit` con 0 errores y suite `src/tests/b2bCommercialFlow.test.ts` pasando al 100% (6/6 tests verdes).

---

### TASK-015-03: Orquestador B2B: Fase 2 WMS (Alistamiento, Pesaje Real FEFO & Remisión) [COMPLETADA]
* **Objetivo:** Implementar los métodos de alistamiento en bodega: toma del pedido por operario, pesaje real en báscula de cuarto frío con política FEFO, conciliación de catch weight $\pm 5\%$, recálculo automático de precio exacto por kg, cálculo de mermas de picking y emisión de Remisión WMS con QR y precinto.
* **Archivos Afectados:**
  - `src/services/b2bIntegrationService.ts`
  - `src/services/b2bDispatchService.ts` (helper offline safeGetSupabaseClient)
  - `src/tests/b2bPickingFlow.test.ts` (nueva suite)
* **Entregables:**
  - `iniciarAlistamiento(input: IniciarAlistamientoInput)`: Transición a `EN_ALISTAMIENTO`, estampa de `operarioAlistadorId`, `operarioAlistadorNombre` y `horaInicioAlistamiento`.
  - `registrarPesajeLinea(input: RegistrarPesajeLineaInput)`: Conciliación en báscula de frío contra `b2bDispatchService.conciliarPesajeB2B`, asignación de lote FEFO y temperatura en empaque, tolerancia $\pm 5\%$ (pausa a `PAUSADO` si excede) y recálculo automático de subtotales y totales NIIF.
  - `finalizarAlistamiento(input: FinalizarAlistamientoInput)`: Validación estricta de que todas las líneas tengan peso real y lote FEFO, emisión de Remisión WMS (`WmsDispatchRemision`) con token QR único, número de precinto de canastilla, deducción de inventario (`inventarioDescontado: true`) y pase a estado `LISTO`.
* **Resultado:** 100% implementado, `npx tsc --noEmit` con 0 errores y suite `src/tests/b2bPickingFlow.test.ts` pasando al 100% (6/6 tests verdes). Acumulado B2B: 14/14 tests verdes.

---

### TASK-015-04: Orquestador B2B: Fase 3 Despacho (Manifiesto, Entrega en Sitio & Cuarentena) [COMPLETADA]
* **Objetivo:** Implementar la orquestación de transporte y rutas: consolidación en manifiesto con check-in de furgón refrigerado ($-18^\circ\text{C}$ / $\le 4^\circ\text{C}$), estampa de `conductorRepartidorId`, entrega en sitio con firma digital táctil, cobro en efectivo/digital, descuento de devoluciones y segregación física a `CUARENTENA_CALIDAD`.
* **Archivos Afectados:**
  - `src/services/b2bIntegrationService.ts`
  - `src/tests/b2bDeliveryFlow.test.ts` (nueva suite)
  - `src/types/orders.types.ts`
* **Entregables:**
  - `crearYDespacharManifiesto(input)`: Check-in térmico de furgón ($\le 4^\circ\text{C}$ / $-18^\circ\text{C}$), validación de pedidos en `LISTO`, estampa de `conductorRepartidorId`, `manifiestoRutaId` y transición a `EN_RUTA`.
  - `registrarEntregaEnSitio(input)`: Firma digital de cliente requerida, cobro en sitio, gestión de devoluciones por temperatura/calidad (`CADENA_FRIO`), segregación a `CUARENTENA_CALIDAD`, recálculo de valor recaudado y transición a `ENTREGADO`.
  - `liquidarManifiestoRuta(input)`: Cierre de ruta, odometría, balance de recaudos contra `cashService` (Tesorería) y pase a `LIQUIDADA`.
* **Resultado:** 100% implementado, `npx tsc --noEmit` con 0 errores y suite `src/tests/b2bDeliveryFlow.test.ts` pasando al 100% (7/7 tests verdes). Acumulado B2B: 21/21 tests verdes.

---

### TASK-015-05: UI & Kanban Integration (Badges de 3 Actores y Controles Táctiles) [COMPLETADA]
* **Objetivo:** Actualizar la presentación visual en `OrderKanbanView.tsx` y componentes de alistamiento para mostrar con claridad los 3 actores operativos y proporcionar botones de acción táctiles ergonómicos $\ge 48\text{ px}$.
* **Archivos Afectados:**
  - `src/views/OrderKanbanView.tsx`
  - `src/views/inventory/components/WeightPackingModal.tsx`
  - `src/tests/orderKanbanView.test.tsx`
* **Entregables:**
  - Badges de color accesible (Light Mode WCAG AA+) mostrando: Vendedor (`V:` azul), Operario Alistador (`A:` ámbar) y Conductor Repartidor (`C:` esmeralda).
  - Indicador de peso real vs nominal con semáforo de tolerancia Catch Weight ($\pm 5\%$).
  - Targets táctiles $\ge 48\text{ px}$ en botones de acción operativa ("Pesar", "Avanzar a...", "Despachar WMS", teclado numérico y modal de pesaje) con `touch-manipulation`.
* **Resultado:** 100% implementado, `npx tsc --noEmit` con 0 errores y suite `src/tests/orderKanbanView.test.tsx` pasando al 100% (9/9 tests verdes). Acumulado B2B + Kanban: 55/55 tests verdes.

---

### TASK-015-06: Suite Integral E2E Vitest & Quality Gate DevTools MCP [COMPLETADA]
* **Objetivo:** Construir la suite end-to-end global que valida el ciclo completo de los 3 actores encadenados y verificar el Quality Gate con TypeScript y Chrome DevTools MCP.
* **Archivos Afectados:**
  - `src/tests/b2bIntegrationFlowE2E.test.ts` (nueva suite completa)
* **Entregables:**
  - Suite E2E con 6 pruebas integrales cubriendo desde la cotización hasta el arqueo final:
    1. Ciclo completo de 3 actores (Cotización -> Pedido -> Alistamiento FEFO -> Despacho -> Entrega con Firma -> Liquidación).
    2. Pausa automática si se excede cupo de crédito (`PAUSADO_POR_CREDITO`).
    3. Bloqueo en alistamiento si se excede la tolerancia Catch Weight ($\pm 5\%$) sin visto bueno.
    4. Bloqueo de despacho si la temperatura del termo-furgón excede $4^\circ\text{C}$.
    5. Bloqueo de entrega si falta la firma digital del cliente.
    6. Liquidación y cuadre de recaudo contra `cashService` (Tesorería).
  - Verificación `tsc --noEmit` con **0 errores**.
  - Validación con Chrome DevTools MCP en `http://localhost:3000/`:
    - 0 errores en consola JS.
    - Vista de escritorio (1280x800) y responsive móvil (375x812) certificadas.
    - Capturas y grabaciones WebP generadas en los artefactos del sistema.
* **Resultado:** 100% implementado. Suite E2E (6/6 tests verdes). Total ecosistema B2B: 61/61 tests verdes en 9 suites. Total global proyecto: 72 archivos / 480 tests pasando sin fallos.

---

## Certificación Final SPEC-015
* **Estado:** COMPLETADO AL 100% (CERTIFICADO)
* **Fecha de Cierre:** 2026-10-15
* **Cumplimiento:** 6/6 Tareas completadas bajo Continuous-Kanban-Flow (WIP = 1) y Spec Kit SDD v3.0.

