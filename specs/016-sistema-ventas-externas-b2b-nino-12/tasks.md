# Tareas Granulares de Implementación (/speckit.tasks)

**Código:** SPEC-016  
**Título:** Desglose Atómico de Tareas — Sistema de Ventas Externas B2B para Bodega Principal (Regla del Niño de 12 Años)  
**Estado:** APPROVED_READY_FOR_IMPLEMENTATION (Validado por los Agentes de Agency Swarm)  
**Fecha:** 2026-10-15  
**Fase de Ciclo:** Spec Kit v3.0 — Post `/speckit.analyze`  
**Gobernanza:** Continuous-Kanban-Flow (Límite Estricto WIP = 1)  

---

## Matriz de Tareas Secuenciales (WIP = 1)

```
[TASK-016-01] Contrato y Servicio Transaccional de Venta Externa B2B (b2bIntegrationService + AppRoute)
     │
     ▼
[TASK-016-02] Terminal Vendedor B2B — Paso 1: Selector de Cliente y Semáforo de Crédito a la Vista
     │
     ▼
[TASK-016-03] Terminal Vendedor B2B — Paso 2: Catálogo Visual con Stock Bodega 1 y Catch Weight Dual
     │
     ▼
[TASK-016-04] Terminal Vendedor B2B — Paso 3: Carrito Rápido, Envío Directo y Vista Contenedora
     │
     ▼
[TASK-016-05] Alistamiento WMS Asistido en Cuarto Frío, Validación Calibre y Remisión con Precinto
     │
     ▼
[TASK-016-06] Entrega con Firma Táctil, Devolución a Cuarentena y Suite Integral E2E Vitest
```

---

### [x] TASK-016-01: Contrato y Servicio Transaccional de Venta Externa B2B (COMPLETADA)
* **Estado:** COMPLETADA ✅ (100% tests pasando, tsc 0 errores, DevTools 0 errores JS)
* **Objetivo:** Registrar la ruta `AppRouteId.B2B_EXTERNAL_SALES = 'ventas_b2b'` en `src/routes/AppRoute.ts` e implementar el método `crearPedidoVentaExternaB2B()` en `src/services/b2bIntegrationService.ts`.
* **Archivos Afectados:**
  - `src/routes/AppRoute.ts`
  - `src/services/b2bIntegrationService.ts`
  - `src/tests/b2bExternalSalesService.test.ts` (nueva suite TDD)
* **Entregables Realizados:**
  - Registro de la ruta en el dominio comercial para roles `VENDEDOR`, `ADMIN`, `COMERCIAL`.
  - Método `crearPedidoVentaExternaB2B(input)` con:
    - Validación de cupo de crédito (`verificarCupoCredito`).
    - Asignación obligatoria a Bodega Principal (`bodegaId = '1'`).
    - Cálculo de peso nominal estimado para líneas Catch Weight Dual (piezas x calibre).
    - Estado `CREADO` (si cupo OK o pago Contado) o `PAUSADO_POR_CREDITO` (si cupo excedido).
    - Liquidación de retenciones NIIF automáticas y publicación de evento inmutable en `useEventStore`.
* **Criterio de Éxito Superado:** Suite `b2bExternalSalesService.test.ts` pasando al 100% (7/7 tests), `appRoute.test.ts` pasando al 100% (9/9 tests), suites B2B pasando (21 tests) y `tsc --noEmit` en 0 errores.

---

### TASK-016-02: Terminal Vendedor B2B — Paso 1: Selector de Cliente y Semáforo de Crédito
* **Objetivo:** Crear el componente `B2BClientSelectorStep.tsx` bajo la Regla del Niño de 12 Años con búsqueda predictiva instantánea y visualización prominente del cupo de crédito.
* **Archivos Afectados:**
  - `src/views/b2b/components/B2BClientSelectorStep.tsx` (nuevo)
* **Entregables:**
  - Buscador predictivo auto-enfocado con target size táctil $\ge 48\text{ px}$.
  - Tarjeta de cliente seleccionado con barra cromática de cupo de crédito (Verde $\le 75\%$, Amarillo $76-99\%$, Rojo $\ge 100\%$) y saldo disponible en COP en texto destacado.
  - Toggle de 1 toque: `Condición: CRÉDITO` vs `Condición: CONTADO`.
* **Criterio de Éxito:** Renderizado visual sin errores, targets $\ge 48\text{ px}$ y contraste WCAG 2.2 AA+ verificado.

---

### TASK-016-03: Terminal Vendedor B2B — Paso 2: Catálogo Visual con Stock Bodega 1 y Catch Weight Dual
* **Objetivo:** Crear el componente `B2BProductCatalogStep.tsx` con chips de categoría táctiles, stock real de Bodega Principal y selector asistido de piezas y calibre en gramos.
* **Archivos Afectados:**
  - `src/views/b2b/components/B2BProductCatalogStep.tsx` (nuevo)
* **Entregables:**
  - Filtrado rápido por chips táctiles (Pescados Enteros, Filetes, Mariscos, Congelados).
  - Tarjetas de producto mostrando fotografía/icono, precio/kg y badge de stock en Bodega Principal.
  - Selector táctil Catch Weight Dual: contador de piezas (`+` / `-` de $48 \times 48\text{ px}$), chips de calibre (`350-400g`, `400-450g`, `450-500g`, `500-600g`, `600g+`), cálculo de peso nominal estimado y leyenda clara de facturación por kilo real de báscula.
* **Criterio de Éxito:** Interacción fluida en móvil sin scroll horizontal y selección de calibre en menos de 2 toques.

---

### TASK-016-04: Terminal Vendedor B2B — Paso 3: Carrito Rápido, Envío Directo y Vista Contenedora
* **Objetivo:** Crear el componente `B2BCartSummaryStep.tsx` y la vista integradora `B2BExternalSalesView.tsx` con stepper táctil de 3 pasos y botón gigante de confirmación.
* **Archivos Afectados:**
  - `src/views/b2b/components/B2BCartSummaryStep.tsx` (nuevo)
  - `src/views/b2b/B2BExternalSalesView.tsx` (nuevo)
  - `src/tests/b2bExternalSalesView.test.tsx` (nueva suite TDD)
* **Entregables:**
  - Resumen claro de ítems con detalle de piezas, calibre y peso nominal estimado.
  - Selector de fecha de entrega pactada y jornada (`MAÑANA` / `TARDE`).
  - Botón prominente de confirmación $\ge 56\text{ px}$ (`h-14`):
    - Verde: *"ENVIAR PEDIDO A BODEGA PRINCIPAL"* (Pasa a `CREADO`).
    - Rojo/Ámbar: *"ENVIAR PARA APROBACIÓN DE CRÉDITO"* (Pasa a `PAUSADO_POR_CREDITO`).
  - Integración completa con la navegación central de `AppRoute.ts`.
* **Criterio de Éxito:** Suite `b2bExternalSalesView.test.tsx` pasando al 100% en Vitest.

---

### TASK-016-05: Alistamiento WMS Asistido en Cuarto Frío, Validación Calibre y Remisión con Precinto
* **Objetivo:** Actualizar el modal de alistamiento `WeightPackingModal.tsx` para mostrar las especificaciones de piezas y calibre pactado por el vendedor, validar el calibre en tiempo real al digitar el peso de báscula y generar la Remisión WMS con precinto numerado de canastilla.
* **Archivos Afectados:**
  - `src/views/inventory/components/WeightPackingModal.tsx`
* **Entregables:**
  - Visualización en la línea del pedido: `5 piezas (calibre 450-500g)`.
  - Input numérico decimal auto-enfocado para digitar el peso real de la báscula física de cuarto frío (ej. `2.45 kg`).
  - Validación de Calibre automática: $2450 / 5 = 490\text{ g/pieza} \rightarrow$ Check verde dentro de rango y recálculo exacto del valor total en COP ($\text{peso\_real} \times \text{precio\_kg}$).
  - Checklist de calidad de 3 checks (temperatura, empaque y precinto numerado de canastilla).
  - Emisión de Remisión WMS con código QR y pase a estado `LISTO`.
* **Criterio de Éxito:** Pesaje y verificación de empaque fluidos con 0 errores en consola JS.

---

### TASK-016-06: Entrega con Firma Táctil, Devolución a Cuarentena y Suite Integral E2E Vitest
* **Objetivo:** Implementar la captura de firma digital táctil del cliente en la app de entrega del conductor, descuento en vivo del cobro ante devolución parcial, reingreso automático al Kardex de la bodega `CUARENTENA_CALIDAD` y suite E2E global.
* **Archivos Afectados:**
  - `src/views/inventory/components/RouteManifestBuilderModal.tsx`
  - `src/tests/b2bCatchWeightWarehouseAndReturn.test.ts` (nueva suite E2E)
* **Entregables:**
  - Firma digital táctil del cliente en pantalla móvil.
  - Registro de devoluciones con descuento inmediato en el monto cobrado (efectivo/digital).
  - Reingreso de devoluciones al Kardex con destino a `CUARENTENA_CALIDAD`.
  - Suite de pruebas completa `b2bCatchWeightWarehouseAndReturn.test.ts` pasando al 100% en Vitest.
  - Verificación `tsc --noEmit` en 0 errores y bucle Chrome DevTools MCP en móvil (375 px) y desktop (1280 px).
* **Criterio de Éxito:** Quality Gate 100% superado y sincronización en `MEMORY.md`.

---

**Siguiente Paso del Flujo:** Esperar aprobación del usuario sobre estas Tareas (`/speckit.tasks`) para proceder con el Control de Calidad 2 (`/speckit.analyze`).
