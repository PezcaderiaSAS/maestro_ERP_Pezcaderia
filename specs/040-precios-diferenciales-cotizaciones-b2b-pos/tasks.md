# Tareas Atómicas de Implementación: SPEC-040
## Arquitectura Enterprise Cero-Latencia para Catálogos Masivos con Precios Diferenciales y Cotizaciones B2B

- **Código:** SPEC-040
- **Fase:** Spec Kit SDD v3.0 — `/speckit.tasks`
- **Gobernanza:** Flujo Continuo Kanban (Límite estricto `WIP = 1`). TDD Quirúrgico.
- **Fecha:** 2026-10-28

```
[TASK-040-01: Esquemas Zod & Contratos] ───► [TASK-040-02: TenantIndexedDbService] ───► [TASK-040-03: Web Worker Search] ───► [TASK-040-04: Hook VirtualGrid 120FPS] ───► [TASK-040-05: Precios Diferenciales] ───► [TASK-040-06: Cotizaciones B2B & Conversión POS] ───► [TASK-040-07: Ingesta 3X & Quality Gate DevTools]
```

---

### [x] TASK-040-01: Esquemas Zod y Contratos TypeScript de Precios Duales, Cotizaciones B2B y Almacenamiento Local - COMPLETADO ✅
- **Objetivo:** Definir contratos tipados y validadores estrictos en `src/schemas/` y `src/types/` para productos con `precioDetal`, `precioMayorista`, `cantidadMinimaMayorista`, perfiles de cliente B2B, estructura de cotización formal y modelos de IndexedDB.
- **Archivos:** `src/schemas/differentialPricing.schema.ts`, `src/types/differentialPricing.types.ts`, `src/types/b2bQuotation.types.ts`, `src/types/indexedDb.types.ts`, `src/tests/differentialPricing.schema.test.ts`.
- **Criterio de Aceptación:** Validación de precios positivos, margen mínimo, cálculo de vencimiento de cotización, 100% pruebas en verde en `differentialPricing.schema.test.ts` (12/12 tests pasando) y 0 errores en `tsc --noEmit`.

---

### [x] TASK-040-02: Servicio `tenantIndexedDbService.ts` y Almacenamiento Aislado por Empresa - COMPLETADO ✅
- **Objetivo:** Implementar la base de datos IndexedDB física segregada por empresa (`PezcaderiaERP_${tenantId}`) con almacenes de objetos para `productos`, `clientes`, `stock` y `outbox`. Soporte para transacciones asíncronas masivas (`bulkUpsert`) e ingesta inicial Pareto ABC Top 100 en $< 150\text{ ms}$.
- **Archivos:** `src/services/tenantIndexedDbService.ts`, `src/services/progressiveHydrationService.ts`, `src/tests/tenantIndexedDbService.test.ts`.
- **Criterio de Aceptación:** Aislamiento 100% entre `tenant-01` y `tenant-03`, inserción masiva en chunks de 1.000 sin bloqueo del bucle de eventos, fallback seguro en memoria si IndexedDB está restringido, 100% pruebas verdes (6/6 tests pasando, 18/18 acumuladas) y 0 errores en `tsc`.

---

### [x] TASK-040-03: Motor de Búsqueda Off-Thread y Web Worker (`catalogSearch.worker.ts`) - COMPLETADO ✅
- **Objetivo:** Desarrollar el Web Worker modular de búsqueda difusa y tokenización off-thread. Indexar en background los 16.000 productos y 30.000 clientes, respondiendo a consultas en $\le 2\text{ ms}$ con tolerancia a errores tipográficos y búsqueda por código de barras.
- **Archivos:** `src/workers/catalogSearch.worker.ts`, `src/workers/searchEngineCore.ts`, `src/hooks/useCatalogSearchWorker.ts`, `src/tests/searchEngineCore.test.ts`.
- **Criterio de Aceptación:** Tiempo de respuesta de búsqueda $< 2\text{ ms}$, ranking de relevancia exacto (SKU > Nombre exacto > Fuzzy), cero bloqueo del hilo principal de React y 100% pruebas unitarias pasando (8/8 tests en `searchEngineCore.test.ts`, 26/26 acumulados en SPEC-040) y 0 errores en `tsc`.

---

### [x] TASK-040-04: Hook de Virtualización Headless `useVirtualGrid.ts` y Grilla Responsiva a 120 FPS - COMPLETADO ✅
- **Objetivo:** Implementar el hook de virtualización que calcula coordenadas de desplazamiento y recicla nodos DOM, renderizando exclusivamente 12-24 tarjetas visibles. Sustituir el renderizado plano en `ProductSearchPanel.tsx` para lograr 120 FPS continuos.
- **Archivos:** `src/hooks/useVirtualGrid.ts`, `src/views/pos/components/VirtualCatalogGrid.tsx`, `src/tests/virtualGrid.test.tsx`.
- **Criterio de Aceptación:** Menos de 50 nodos DOM activos durante scroll continuo de catálogo masivo (evaluado con 16.000 ítems), cero tirones o saltos de layout, 100% pruebas verdes (3/3 tests en `virtualGrid.test.tsx`, 29/29 acumulados en SPEC-040) y 0 errores en `tsc`.

---

### [x] TASK-040-05: Motor de Precios Diferenciales (Detal / Mayorista / Umbrales) - COMPLETADO ✅
- **Objetivo:** Implementar la lógica unificada de resolución de precios: cálculo automático de precio mayorista al superar `cantidadMinimaMayorista`, aplicación de tarifas por perfil de cliente B2B (`MAYORISTA`, `CONTRATISTA`) y validación de margen mínimo para prevenir pérdidas.
- **Archivos:** `src/services/differentialPricingService.ts`, `src/hooks/useDifferentialPrice.ts`, `src/views/pos/components/PriceTierBadge.tsx`, `src/tests/differentialPricing.test.ts`.
- **Criterio de Aceptación:** Conmutación automática instantánea de precio al cambiar cantidades, cálculo exacto de subtotales y ahorros, alertas de margen mínimo y 100% pruebas unitarias en verde (6/6 tests en `differentialPricing.test.ts`, 35/35 acumulados en SPEC-040) y 0 errores en `tsc`.

---

### [x] TASK-040-06: Módulo de Cotizaciones B2B y Conversión Atómica a Preventa POS - COMPLETADO ✅
- **Objetivo:** Construir la mesa de trabajo de cotizaciones B2B (`B2BQuotationView.tsx`) con selección de cliente, adición de ítems con tarifas diferenciales y el botón de 1-clic para convertir la cotización aprobada en preventa (`pos_prefacturas`) en el Kanban de Caja Central (SPEC-037).
- **Archivos:** `src/services/b2bQuotationService.ts`, `src/views/quotations/B2BQuotationView.tsx`, `src/views/quotations/ConvertToPosModal.tsx`, `src/tests/b2bQuotationService.test.ts`, `src/tests/b2bQuotationView.test.tsx`.
- **Criterio de Aceptación:** Generación de cotización con código `COT-YYYY-XXXXX`, transición a `CONVERTIDA`, reserva de stock en bodega (`Hard-Hold`), enlace con preventa en Kanban de Caja y 100% pruebas verdes (11/11 tests en `b2bQuotationService.test.ts` y `b2bQuotationView.test.tsx`, 46/46 acumulados en SPEC-040, 1.179 en suite completa).

---

### [ ] TASK-040-07: Ingesta Masiva Escala 3X (16.000 Ítems y 30.000 Clientes) y Quality Gate Final DevTools
- **Objetivo:** Validar la resiliencia del sistema completo con el dataset triplicado de Ferretería Josase (16.000 ítems y 30.000 clientes). Ejecutar auditoría integral: `tsc --noEmit` (0 errores), suite completa Vitest (100% verde), auditoría GitNexus blast radius y validación en vivo con Chrome DevTools (1366x768 y 375px móvil) con 0 errores de consola.
- **Archivos:** `src/services/ferreteriaJosaseService.ts`, `src/tests/scale3xPerformance.test.ts`, `MEMORY.md`.
- **Criterio de Aceptación:** Latencia de carga $< 150\text{ ms}$, búsqueda off-thread $< 2\text{ ms}$, scroll en 120 FPS, 0 errores en consola JS y certificación total de entrega.

