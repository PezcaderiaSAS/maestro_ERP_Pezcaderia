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

### TASK-015-01: Tipos y Contratos TypeScript (Trazabilidad de 3 Actores y Catch Weight)
* **Objetivo:** Ampliar y asegurar el tipado estricto en `src/types/orders.types.ts` y `src/store/useOrderStore.ts` para soportar la trazabilidad completa y los campos de pesaje real en frío.
* **Archivos Afectados:**
  - `src/types/orders.types.ts`
  - `src/store/useOrderStore.ts`
* **Entregables:**
  - En `Pedido`: campos `vendedorId`, `vendedorNombre`, `cotizacionIdOriginal`, `operarioAlistadorId`, `operarioAlistadorNombre`, `horaInicioAlistamiento`, `horaFinAlistamiento`, `remisionId`, `tokenQrRemision`, `precintoCanastilla`, `conductorRepartidorId`, `conductorRepartidorNombre`, `manifiestoRutaId`, `retefuenteValor`, `reteicaValor`.
  - En `LineaPedido`: campos `pesoReal`, `variacionPesoPct`, `toleranciaAceptada`, `subtotalRealAjustado`, `temperaturaC`, `loteSeleccionado`.
  - En `Cotizacion`: estado `'CONVERTIDA_A_PEDIDO'`, `vendedorId`, `vendedorNombre`.
* **Criterio de Éxito:** `npx tsc --noEmit` compila con 0 errores.

---

### TASK-015-02: Orquestador B2B: Fase 1 Comercial (Cotización $\rightarrow$ Pedido)
* **Objetivo:** Implementar el módulo comercial en `src/services/b2bIntegrationService.ts` que valida cupo de crédito, liquida retenciones NIIF y convierte cotizaciones en pedidos formales con estampa de `vendedorId`.
* **Archivos Afectados:**
  - `src/services/b2bIntegrationService.ts` (nuevo)
  - `src/tests/b2bCommercialFlow.test.ts` (nueva suite)
* **Entregables:**
  - Función `convertirCotizacionAPedido(input)`.
  - Validación de cupo con `B2BSalesService.verificarCupoCredito`.
  - Desglose NIIF con `B2BSalesService.calcularTotalesCotizacionNIIF`.
  - Publicación de evento inmutable en `useEventStore`.
* **Criterio de Éxito:** Suite `b2bCommercialFlow.test.ts` pasando al 100% en Vitest.

---

### TASK-015-03: Orquestador B2B: Fase 2 WMS (Alistamiento, Pesaje Real FEFO & Remisión)
* **Objetivo:** Implementar los métodos de alistamiento en bodega: toma del pedido por operario, pesaje real en báscula de cuarto frío con política FEFO, conciliación de catch weight $\pm 5\%$, recálculo automático de precio exacto por kg, cálculo de mermas de picking y emisión de Remisión WMS con QR y precinto.
* **Archivos Afectados:**
  - `src/services/b2bIntegrationService.ts`
  - `src/tests/b2bPickingFlow.test.ts` (nueva suite)
* **Entregables:**
  - Funciones `iniciarAlistamiento()`, `registrarPesajeLinea()` y `finalizarAlistamiento()`.
  - Integración con `b2bDispatchService.conciliarPesajeB2B` y `B2BSalesService.calcularAjusteMermasPicking`.
  - Generación de `WmsDispatchRemision` y pase a estado `LISTO`.
* **Criterio de Éxito:** Suite `b2bPickingFlow.test.ts` pasando al 100% en Vitest.

---

### TASK-015-04: Orquestador B2B: Fase 3 Despacho (Manifiesto, Entrega en Sitio & Cuarentena)
* **Objetivo:** Implementar la orquestación de transporte y rutas: consolidación en manifiesto con check-in de furgón refrigerado ($-18^\circ\text{C}$ / $\le 4^\circ\text{C}$), estampa de `conductorRepartidorId`, entrega en sitio con firma digital táctil, cobro en efectivo/digital, descuento de devoluciones y segregación física a `CUARENTENA_CALIDAD`.
* **Archivos Afectados:**
  - `src/services/b2bIntegrationService.ts`
  - `src/tests/b2bDeliveryFlow.test.ts` (nueva suite)
* **Entregables:**
  - Funciones `crearYDespacharManifiesto()`, `registrarEntregaEnSitio()` y `liquidarManifiestoRuta()`.
  - Integración con `deliveryRouteService` y `cashService`.
* **Criterio de Éxito:** Suite `b2bDeliveryFlow.test.ts` pasando al 100% en Vitest.

---

### TASK-015-05: UI & Kanban Integration (Badges de 3 Actores y Controles Táctiles)
* **Objetivo:** Actualizar la presentación visual en `OrderKanbanView.tsx` y componentes de alistamiento para mostrar con claridad los 3 actores operativos y proporcionar botones de acción táctiles ergonómicos $\ge 48\text{ px}$.
* **Archivos Afectados:**
  - `src/views/OrderKanbanView.tsx`
  - `src/views/inventory/components/WeightPackingModal.tsx`
* **Entregables:**
  - Badges de color accesible (Light Mode WCAG AA+) mostrando: Vendedor, Operario Alistador y Conductor Repartidor con sus estados.
  - Indicador de peso real vs nominal con semáforo de tolerancia ($\pm 5\%$).
  - Targets táctiles $\ge 48\text{ px}$ en botones de acción operativa.
* **Criterio de Éxito:** Renderizado visual sin errores y 0 fallos de contraste.

---

### TASK-015-06: Suite Integral E2E Vitest & Quality Gate DevTools MCP
* **Objetivo:** Construir la suite end-to-end global que valida el ciclo completo de los 3 actores encadenados y verificar el Quality Gate con TypeScript y Chrome DevTools MCP.
* **Archivos Afectados:**
  - `src/tests/b2bIntegrationFlowE2E.test.ts` (nueva suite completa)
* **Entregables:**
  - Suite E2E con 8 tests de integración cubriendo desde la cotización hasta el arqueo final.
  - Verificación `tsc --noEmit` con 0 errores.
  - Validación con Chrome DevTools MCP en `http://localhost:3000/` (0 errores en consola JS, vista 375 px y 1280 px).
* **Criterio de Éxito:** 100% de tests verdes en Vitest, consola limpia y sincronización en `MEMORY.md`.

---

**Siguiente Paso del Flujo:** Esperar aprobación del usuario sobre estas Tareas (`/speckit.tasks`) para proceder con el Control de Calidad 2 (`/speckit.analyze`).
