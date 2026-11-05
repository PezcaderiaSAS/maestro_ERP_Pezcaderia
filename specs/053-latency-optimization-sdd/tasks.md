# Plan de Tareas Atómicas de Implementación: SPEC-053

- **Código:** TASKS-SPEC-053
- **Versión:** v3.2 — Blindada y Calibrada Post-Auditoría Adversarial (Critic 1 & Challenger 2)
- **Fase:** Spec Kit SDD v3.0 — `/speckit.tasks`
- **Gobernanza:** Flujo Continuo Kanban (`WIP = 1`). TDD Quirúrgico estricto (RED -> GREEN -> REFACTOR).
- **Estado:** PENDIENTE DE APROBACIÓN HUMANA
- **Directiva:** Cada tarea es atómica, verificable de forma independiente y no introduce regresiones operativas.

---

### Tablero Kanban de Implementación (Límite Estricto WIP = 1)

```
┌──────────────────────────────────────┬──────────────────────────────────────┬──────────────────────────────────────┐
│         EN PROCESO (WIP = 0)         │              POR HACER               │              TERMINADO               │
├──────────────────────────────────────┼──────────────────────────────────────┼──────────────────────────────────────┤
│ (Ninguna tarea activa)               │ • FASE 1: T-053-01 a T-053-04        │ (Fase de Especificación y Diseño     │
│                                      │ • FASE 2: T-053-05 a T-053-08        │  blindada y calibrada al 100%)       │
│                                      │ • FASE 3: T-053-09 a T-053-12        │                                      │
│                                      │ • FASE 4: T-053-13 a T-053-16        │                                      │
│                                      │ • FASE 5: T-053-17 a T-053-20        │                                      │
└──────────────────────────────────────┴──────────────────────────────────────┴──────────────────────────────────────┘
```

---

## FASE 1: Optimización de Bundle, Code Splitting y Reducción de Carga Inicial (< 450 kB)

### `T-053-01`: Configuración Canónica de Rollup `manualChunks` en Vite
- **Objetivo:** Configurar `vite.config.ts` para particionar las dependencias externas (vendors) en chunks separados e inmutables, evitando que librerías estables se re-descarguen cuando cambie el código de la aplicación.
- **Archivos Afectados:**
  - `vite.config.ts`
- **Entradas / Salidas:**
  - *Entrada:* Archivo de configuración actual sin sección `build.rollupOptions`.
  - *Salida:* Configuración con partición explícita (`vendor-react`, `vendor-state`, `vendor-supabase`, `vendor-ui-icons`, `vendor-swal`, `vendor-utils`).
- **Criterio de Aceptación:**
  - [ ] `dist/assets/` contiene chunks específicos de vendors separados del código de la aplicación.
  - [ ] Ningún chunk de vendor excede el límite de 500 kB uncompressed (salvo suites especializadas aisladas).
  - [ ] Verificado con chrome-devtools MCP (consola limpia sin errores JS + vista móvil 375 px + flujo interactivo probado).
- **Validación Independiente:**
  ```powershell
  npx vite build
  node -e "const fs = require('fs'); const files = fs.readdirSync('dist/assets'); console.log(files.filter(f => f.startsWith('vendor-')));"
  ```

---

### `T-053-02`: Enrutamiento Dinámico con `React.lazy()` y Service Worker Runtime Caching (Workbox)
- **Objetivo:** Convertir las 25 importaciones estáticas de vistas en importaciones asíncronas bajo demanda (`React.lazy`) con `<Suspense>`, e integrar reglas de runtime caching en el Service Worker (Workbox / CacheStorage) para chunks dinámicos (`/assets/*.js`), asegurando operatividad offline continua y eliminando errores `ChunkLoadError`.
- **Archivos Afectados:**
  - `src/App.tsx`
  - `src/components/common/RouteLoadingFallback.tsx` (nuevo)
  - `vite.config.ts` (configuración del plugin PWA / Workbox)
  - `src/sw.ts` o Service Worker registration
- **Entradas / Salidas:**
  - *Entrada:* 25 imports estáticos en `src/App.tsx:4-28` sin caché offline para rutas.
  - *Salida:* 25 funciones `React.lazy(() => import(...))` con fallback layout estable y Service Worker interceptando peticiones de chunks mediante estrategia `StaleWhileRevalidate` o `CacheFirst`.
- **Criterio de Aceptación:**
  - [ ] El archivo de entrada `dist/assets/index-*.js` reduce su tamaño de 4.6 MB a menos de 450 kB (gzip < 120 kB).
  - [ ] Al desconectar la red (Modo Offline) y navegar entre vistas críticas (`POSView`, `InventoryView`, `CashierKanbanView`), la interfaz carga con éxito desde CacheStorage sin arrojar `ChunkLoadError`.
  - [ ] Verificado con chrome-devtools MCP (consola limpia sin errores JS + vista móvil 375 px + simulación offline en Network tab probada).
- **Validación Independiente:**
  ```powershell
  npx vite build
  node -e "const fs = require('fs'); const stats = fs.statSync(fs.readdirSync('dist/assets').map(f => 'dist/assets/' + f).find(f => f.includes('index-') && f.endsWith('.js'))); console.log('Index JS (kB):', (stats.size / 1024).toFixed(2));"
  ```

---

### `T-053-03`: Externalización Asíncrona de `exceljs` y `jspdf`
- **Objetivo:** Eliminar las importaciones estáticas de `exceljs` (938 kB) y `jspdf` (573 kB) de la ruta crítica de arranque, cargándolas dinámicamente solo cuando el usuario active una acción de importación masiva o generación de reportes PDF.
- **Archivos Afectados:**
  - `src/components/BulkUploadModal.tsx`
  - `src/services/branchReportsService.ts`
  - `src/services/coldStoragePdfService.ts`
  - `src/services/payrollService.ts`
  - `src/services/routeManifestPdfService.ts`
  - `src/services/wmsRemisionPdfService.ts`
  - `src/views/inventory/components/KardexTable.tsx`
- **Entradas / Salidas:**
  - *Entrada:* Imports estáticos `import ExcelJS from 'exceljs'` y `import jsPDF from 'jspdf'`.
  - *Salida:* Imports dinámicos `await import('exceljs')` y `await import('jspdf')` encapsulados en los manejadores de eventos correspondientes.
- **Criterio de Aceptación:**
  - [ ] Ni `exceljs` ni `jspdf` aparecen dentro del contenido del chunk principal `index-*.js`.
  - [ ] La exportación a Excel en `BulkUploadModal` y la generación de remisiones PDF en WMS funcionan con total normalidad.
  - [ ] Verificado con chrome-devtools MCP (consola limpia sin errores JS + vista móvil 375 px + flujo interactivo probado).
- **Validación Independiente:**
  ```powershell
  npx vite build
  node -e "const fs = require('fs'); const mainChunk = fs.readFileSync(fs.readdirSync('dist/assets').map(f => 'dist/assets/' + f).find(f => f.includes('index-') && f.endsWith('.js')), 'utf8'); console.log('ExcelJS en main:', mainChunk.includes('ExcelJS'), 'jsPDF en main:', mainChunk.includes('jsPDF'));"
  ```

---

### `T-053-04`: Prefetching Inteligente Post-Login y Carga Diferida de Telemetría
- **Objetivo:** Configurar `requestIdleCallback` tras la autenticación exitosa para precargar en segundo plano los módulos del mostrador (`POSView`) e inventario (`InventoryView`), y diferir la inicialización de Sentry Replay y LogRocket para no penalizar el First Contentful Paint (FCP).
- **Archivos Afectados:**
  - `src/App.tsx`
  - `src/main.tsx`
- **Entradas / Salidas:**
  - *Entrada:* Inicialización síncrona de Sentry/LogRocket en `main.tsx:61-75` y navegación reactiva sin prefetch.
  - *Salida:* Inicialización ociosa con `window.requestIdleCallback` y prefetching de chunks críticos post-login.
- **Criterio de Aceptación:**
  - [ ] El primer cuadro de la interfaz (FCP) se pinta en menos de 1.2 segundos en redes simuladas Fast 3G.
  - [ ] La primera navegación a `POSView` es instantánea (< 50ms) debido al prefetch en memoria del navegador.
  - [ ] Verificado con chrome-devtools MCP (consola limpia sin errores JS + vista móvil 375 px + flujo interactivo probado).
- **Validación Independiente:**
  ```powershell
  npx vitest run src/tests/bundleCodeSplitting.test.ts
  ```

---

## FASE 2: Motor de Latencia Cero en POS Mostrador (p95 Exacto < 2ms, Fuzzy <= 35ms)

### `T-053-05`: Optimización Algorítmica con Prefix Index, Payload Ligero y Debounce en `SearchEngineCore`
- **Objetivo:** Actualizar `SearchEngineCore` y `catalogSearch.worker.ts` incorporando un mapa auxiliar de prefijos de 3 caracteres (`prefixMap: Map<string, Set<string>>`) para acotar el espacio de búsqueda Levenshtein a < 50 palabras, truncar tokens adversariales (> 30 caracteres, máx 6 tokens), aplicar debounce de 50ms con token de secuencia/`AbortController` en el hook, y retornar exclusivamente un array ligero de identificadores `results: string[]` acotado a 30 SKUs en lugar de 80 objetos completos.
- **Archivos Afectados:**
  - `src/workers/searchEngineCore.ts`
  - `src/workers/catalogSearch.worker.ts`
  - `src/hooks/useCatalogSearchWorker.ts`
  - `src/views/pos/components/ProductSearchPanel.tsx`
- **Entradas / Salidas:**
  - *Entrada:* Bucle lineal $O(T \times |V|)$ en vocabulario completo, retorno de 80 objetos completos por `postMessage` y ausencia de debounce.
  - *Salida:* PrefixMap + Trie acotado, retorno de `results: string[]` (máx 30 SKUs), debounce de 50ms y resolución $O(1)$ en UI.
- **Criterio de Aceptación:**
  - [ ] Búsqueda exacta en catálogo de 16,000 SKUs reporta p95 < 2.0ms; búsqueda difusa/fuzzy reporta p95 <= 35.0ms en 1,000 búsquedas masivas.
  - [ ] La transferencia por `postMessage` toma menos de 1.5ms (cero penalización de Structured Clone en hilo principal).
  - [ ] Respuestas obsoletas son descartadas limpiamente mediante token de secuencia.
  - [ ] Verificado con chrome-devtools MCP (consola limpia sin errores JS + vista móvil 375 px + escritura rápida sin lag en campo de búsqueda).
- **Validación Independiente:**
  ```powershell
  npx tsx scripts/benchmark/adversarial-stress-harness.ts
  npx vitest run src/tests/searchEngineCore.test.ts
  ```

---

### `T-053-06`: Precomputación y Caché $O(1)$ de Stock con Granularidad por Bodega
- **Objetivo:** Erradicar las 10,000 lecturas síncronas a `useWarehouseStore.getState().bodegas` y las búsquedas en arrays dentro del ciclo de renderizado de productos, implementando un mapa reactivo en memoria que respete la granularidad física por `${sku}__${warehouse_id}`.
- **Archivos Afectados:**
  - `src/views/POSView.tsx`
  - `src/views/pos/components/ProductSearchPanel.tsx`
  - `src/store/useInventoryStore.ts`
- **Entradas / Salidas:**
  - *Entrada:* Función `getProductStock` iterando bodegas síncronamente en cada frame de render.
  - *Salida:* Mapa indexado `Map<string, number>` por clave compuesta `${sku}__${warehouse_id}` precomputado reactivamente ante mutaciones.
- **Criterio de Aceptación:**
  - [ ] El stock específico de la bodega de mostrador y el stock global agregado se resuelven en menos de 0.2 milisegundos para 5,000 SKUs en tiempo $O(1)$.
  - [ ] El filtro `hideOutOfStock` opera de forma instantánea sin degradar el frame rate.
  - [ ] Verificado con chrome-devtools MCP (consola limpia sin errores JS + vista móvil 375 px + flujo interactivo probado).
- **Validación Independiente:**
  ```powershell
  node -e "const { performance } = require('perf_hooks'); const map = new Map(); for(let i=0; i<16000; i++) map.set('SKU-'+i+'__bodega-01', 25); const t0 = performance.now(); for(let i=0; i<5000; i++) map.get('SKU-'+i+'__bodega-01'); console.log('5,000 lookups granulares (ms):', (performance.now()-t0).toFixed(3));"
  ```

---

### `T-053-07`: Integración de la Grilla Virtualizada `VirtualCatalogGrid.tsx`
- **Objetivo:** Reemplazar el contenedor estático de 80 elementos en `ProductSearchPanel.tsx` por el componente `VirtualCatalogGrid.tsx`, manteniendo en el DOM únicamente entre 12 y 24 tarjetas visibles.
- **Archivos Afectados:**
  - `src/views/pos/components/ProductSearchPanel.tsx`
  - `src/views/pos/components/VirtualCatalogGrid.tsx`
- **Entradas / Salidas:**
  - *Entrada:* Grilla con 80 tarjetas completas (`filteredProducts.slice(0, 80).map(...)`) y más de 1,200 nodos DOM.
  - *Salida:* Renderizado virtualizado con `useVirtualGrid` y `requestAnimationFrame` a 60-120 FPS.
- **Criterio de Aceptación:**
  - [ ] El árbol DOM del catálogo contiene menos de 200 nodos durante el scroll continuo.
  - [ ] Tasa de refresco constante de 60 a 120 FPS sin frames caídos (*jank*) en desplazamiento táctil.
  - [ ] Verificado con chrome-devtools MCP (consola limpia sin errores JS + vista móvil 375 px + desplazamiento fluido en grid).
- **Validación Independiente:**
  ```powershell
  npx vitest run src/tests/virtualGrid.test.tsx
  ```

---

### `T-053-08`: Desacoplamiento de Estado de Carrito y Memoización Quirúrgica
- **Objetivo:** Aislar las mutaciones de líneas del carrito en `usePOSCart` para que agregar un producto o modificar una cantidad no provoque el re-renderizado de `POSView.tsx` ni de la columna de productos.
- **Archivos Afectados:**
  - `src/views/POSView.tsx`
  - `src/views/pos/components/ProductSearchPanel.tsx`
  - `src/views/pos/components/CartPanel.tsx`
  - `src/views/pos/components/LineaVentaRow.tsx`
- **Entradas / Salidas:**
  - *Entrada:* Componentes sin memoizar y callbacks recreados en cada render; mutación de `lineas` en la raíz de `POSView.tsx`.
  - *Salida:* Componentes envueltos en `React.memo`, callbacks protegidos con `useCallback` y estado de líneas encapsulado en store atómico.
- **Criterio de Aceptación:**
  - [ ] La adición de un producto al carrito se completa en menos de 5.0 milisegundos en p99.
  - [ ] La grilla de productos no se re-renderiza al modificar cantidades o eliminar líneas del carrito.
  - [ ] Verificado con chrome-devtools MCP (consola limpia sin errores JS + vista móvil 375 px + adición masiva de productos al carrito).
- **Validación Independiente:**
  ```powershell
  npx vitest run src/tests/posCartPerformance.test.tsx
  ```

---

## FASE 3: Aceleración de WMS, Kardex y Balance de Masa

### `T-053-09`: Migración DDL de Índices Compuestos en PostgreSQL
- **Objetivo:** Diseñar y desplegar la migración SQL con los índices compuestos requeridos para eliminar Sequential Scans en tablas transaccionales de inventario y habilitar ordenamiento FEFO acelerado (con documentación de `CONCURRENTLY` para entornos de producción).
- **Archivos Afectados:**
  - `supabase/migrations/20261105120000_wms_latency_indices.sql` (nuevo)
- **Entradas / Salidas:**
  - *Entrada:* Tablas `wms_movements`, `wms_batches`, `movimientos_custodia` y `wms_stock` sin índices compuestos.
  - *Salida:* Sentencias `CREATE INDEX IF NOT EXISTS` para `(tenant_id, created_at DESC, id DESC)`, `(tenant_id, expiration_date ASC)`, `(tenant_id, warehouse_id, sku)` y `(empresa_id, fecha_movimiento DESC, id DESC)`.
- **Criterio de Aceptación:**
  - [ ] El plan de ejecución de PostgreSQL (`EXPLAIN ANALYZE`) para ordenamiento FEFO muestra un Index Scan en lugar de Sequential Scan.
  - [ ] Las consultas frías de stock se ejecutan en menos de 50 milisegundos en p95.
  - [ ] Verificado con chrome-devtools MCP (consola limpia sin errores JS + vista móvil 375 px + flujo interactivo probado).
- **Validación Independiente:**
  ```powershell
  npx vitest run src/tests/wmsIndicesValidation.test.ts
  ```

---

### `T-053-10`: RPC Transaccional por Lotes para Despachos de Custodia 3PL
- **Objetivo:** Reemplazar el bucle N+1 serial de peticiones HTTP en `coldStorageRentalService.ts:1100-1145` por un RPC atómico en PostgreSQL que ejecute verificación, decremento e inserción en una sola transacción ACID.
- **Archivos Afectados:**
  - `supabase/migrations/20261105120100_rpc_custodia_batch.sql` (nuevo)
  - `src/services/coldStorageRentalService.ts`
- **Entradas / Salidas:**
  - *Entrada:* Bucle de 30 peticiones HTTP seriales para un despacho de 10 ítems (latencia 2.5s - 4.0s).
  - *Salida:* Invocación de `supabase.rpc('rpc_wms_despacho_custodia_batch', { p_empresa_id, p_items, p_actor_id })` en 1 solo RTT.
- **Criterio de Aceptación:**
  - [ ] El tiempo total de procesamiento de un despacho de 10 productos cae a menos de 120 milisegundos.
  - [ ] Si algún ítem carece de saldo suficiente, la transacción se revierte al 100% de forma atómica.
  - [ ] Verificado con chrome-devtools MCP (consola limpia sin errores JS + vista móvil 375 px + flujo interactivo probado).
- **Validación Independiente:**
  ```powershell
  npx vitest run src/tests/coldStorageRentalBatch.test.ts
  ```

---

### `T-053-11`: Paginación Keyset Cursor `(created_at, id)` para Historial de Kardex
- **Objetivo:** Refactorizar `KardexTable.tsx` e `inventoryService.ts` para implementar paginación mediante cursor compuesto keyset `(created_at, id) < (cursor_created_at, cursor_id) LIMIT 50`, eliminando pérdidas u omisiones de registros que compartan idéntico timestamp y suprimiendo la carga sincrónica del historial completo en memoria.
- **Archivos Afectados:**
  - `src/services/inventoryService.ts`
  - `src/views/inventory/components/KardexTable.tsx`
- **Entradas / Salidas:**
  - *Entrada:* Paginación frágil por timestamp simple o carga total de `localStorage`.
  - *Salida:* Consulta paginada por cursor compuesto keyset respaldada por el índice `idx_wms_movements_tenant_created`.
- **Criterio de Aceptación:**
  - [ ] La tabla de Kardex se renderiza en menos de 30 milisegundos independientemente de que existan 100,000 movimientos históricos.
  - [ ] Cero duplicados u omisiones en despachos concurrentes masivos con timestamps idénticos.
  - [ ] Verificado con chrome-devtools MCP (consola limpia sin errores JS + vista móvil 375 px + scroll infinito en Kardex).
- **Validación Independiente:**
  ```powershell
  npx vitest run src/tests/kardexPagination.test.ts
  ```

---

### `T-053-12`: Persistencia ACID del Balance de Masa y Rendimiento Pesquero
- **Objetivo:** Conectar el servicio `fishYieldProductionService.ts` a las tablas relacionales `produccion_ordenes_despiece` y `produccion_salidas_cortes`, erradicando el almacenamiento de órdenes en `localStorage`.
- **Archivos Afectados:**
  - `src/services/fishYieldProductionService.ts`
  - `src/views/inventory/components/dock/DockSummaryReconciliation.tsx`
- **Entradas / Salidas:**
  - *Entrada:* Persistencia en `localStorage.setItem('fish_yield_orders', ...)` y conciliación de mermas en estado local React.
  - *Salida:* Llamada transaccional a Supabase persistiendo lote madre, kilos brutos, filetes obtenidos, vísceras/merma y factor de absorción de costos.
- **Criterio de Aceptación:**
  - [ ] Las órdenes de fileteo quedan registradas centralmente en PostgreSQL con trazabilidad multi-terminal.
  - [ ] La conciliación de liquidación en muelle actualiza el balance de masa en base de datos con confirmación ACID.
  - [ ] Verificado con chrome-devtools MCP (consola limpia sin errores JS + vista móvil 375 px + flujo interactivo probado).
- **Validación Independiente:**
  ```powershell
  npx vitest run src/tests/dockAndYield.test.ts src/tests/dockSummaryReconciliation.test.tsx
  ```

---

## FASE 4: Unificación de Jerarquía de Caché Multinivel L1-L4 Blindada

### `T-053-13`: Fusión Canónica de Stores Zustand de Inventario (L1) con Soporte de Purga
- **Objetivo:** Unificar `src/store/useInventoryStore.ts` y `src/stores/useInventoryStore.ts` en un único store canónico modular con selectores atómicos, eliminando el hardcodeo de `MOCK_TENANT_ID`, e integrando el método `reset()` para purga síncrona en cambio de inquilino.
- **Archivos Afectados:**
  - `src/store/useInventoryStore.ts`
  - `src/stores/useInventoryStore.ts`
  - `src/components/inventory/InventoryDataTable.tsx`
  - `src/components/inventory/TransferStockModal.tsx`
  - `src/components/inventory/ScrapAdjustmentModal.tsx`
- **Entradas / Salidas:**
  - *Entrada:* Dos stores de inventario disjuntos con estados y proveedores de datos diferentes.
  - *Salida:* Un único store unificado `useInventoryStore` con selectores atómicos, sincronización en tiempo real y función `reset()`.
- **Criterio de Aceptación:**
  - [ ] Una transferencia realizada en `TransferStockModal` se refleja inmediatamente en el stock visible por `POSView`.
  - [ ] Cero referencias a identificadores mock `00000000-0000-0000-0000-000000000000`.
  - [ ] Al invocar `reset()`, todo el catálogo en memoria se vacía inmediatamente.
  - [ ] Verificado con chrome-devtools MCP (consola limpia sin errores JS + vista móvil 375 px + flujo interactivo probado).
- **Validación Independiente:**
  ```powershell
  npx vitest run src/tests/useInventoryStore.test.ts
  ```

---

### `T-053-14`: Despliegue de Edge Function Proxy (`/functions/cache-proxy`) para Upstash Redis con JWT y Single-Flight
- **Objetivo:** Implementar la capa L3 como un Edge Function en Supabase (`/functions/cache-proxy`), validando el JWT del usuario (`tenant_id`), ejecutando peticiones server-side a Upstash Redis con credenciales secretas (cero variables `VITE_UPSTASH_*` en el cliente), implementando Single-Flight request collapsing y revalidación probabilística anticipada con el algoritmo XFetch.
- **Archivos Afectados:**
  - `supabase/functions/cache-proxy/index.ts` (nuevo)
  - `src/services/upstashCacheService.ts`
  - `src/services/stockAvailabilityService.ts`
- **Entradas / Salidas:**
  - *Entrada:* Cliente frontend intentando conectar directamente a Upstash con tokens públicos o ausencia de L3.
  - *Salida:* Proxy Edge autenticado por JWT con deduplicación Single-Flight de solicitudes en vuelo y XFetch probabilístico.
- **Criterio de Aceptación:**
  - [ ] Ningún token de Upstash es visible o accesible desde el frontend / DevTools del navegador.
  - [ ] Múltiples solicitudes simultáneas del mismo SKU desde distintas terminales generan una sola consulta a Upstash / L4.
  - [ ] La disponibilidad de stock en mostrador responde en menos de 40 milisegundos en p95.
  - [ ] Verificado con chrome-devtools MCP (consola limpia sin errores JS + vista móvil 375 px + inspección de red sin fugas de secretos).
- **Validación Independiente:**
  ```powershell
  npx vitest run src/tests/upstashCacheService.test.ts
  ```

---

### `T-053-15`: Sincronización Multi-Pestaña con `BroadcastChannel` y Web Locks en `TenantIndexedDbService`
- **Objetivo:** Incorporar en `TenantIndexedDbService` y los stores Zustand un bus de sincronización inter-contexto `BroadcastChannel('pezca_l1_cache')` y proteger las transacciones de escritura física en IndexedDB con la API nativa `navigator.locks.request()`.
- **Archivos Afectados:**
  - `src/services/tenantIndexedDbService.ts`
  - `src/store/useInventoryStore.ts`
  - `src/store/usePOSStore.ts`
- **Entradas / Salidas:**
  - *Entrada:* Mutaciones locales en Pestaña A que no son percibidas por Pestaña B, generando lecturas sucias y sobreescrituras en IndexedDB.
  - *Salida:* Propagación reactiva de eventos `STOCK_MUTATED` y `CATALOG_INVALIDATED` en < 15ms entre pestañas, con exclusión mutua de escritura.
- **Criterio de Aceptación:**
  - [ ] Cuando la Pestaña A vende un producto, la Pestaña B descuenta inmediatamente el stock en su L1 en memoria sin recargar la página.
  - [ ] Cero colisiones de escritura o bloqueos de IndexedDB en transacciones concurrentes simuladas.
  - [ ] Verificado con chrome-devtools MCP (consola limpia sin errores JS + dos pestañas abiertas interactuando simultáneamente).
- **Validación Independiente:**
  ```powershell
  npx vitest run src/tests/tenantIndexedDbService.test.ts
  ```

---

### `T-053-16`: Blindaje de Seguridad Multi-Tenant en RPCs con `public.get_tenant_id()` y OCC Delta-Merge Atómico Relativo
- **Objetivo:** Inyectar en todos los RPCs de WMS y sincronización outbox la validación canónica de identidad de inquilino `public.get_tenant_id()` y programar la resolución de stock en OCC como mutación algebraica relativa en servidor (`UPDATE wms_stock SET stock_disponible = stock_disponible + p_delta`), erradicando los lost updates por snapshots absolutos del cliente.
- **Archivos Afectados:**
  - `supabase/migrations/20261105120200_fix_wms_rpcs_security.sql` (nuevo)
  - `supabase/migrations/20261105120300_bulk_sync_outbox_rpc.sql` (nuevo)
  - `src/stores/useOutboxSyncStore.ts`
- **Entradas / Salidas:**
  - *Entrada:* RPCs que confían ciegamente en `p_tenant_id` y reemplazo de stock absoluto `stockDisponible = stockActual + deltaCliente` en cliente.
  - *Salida:* Verificación obligatoria `IF p_tenant_id != public.get_tenant_id()` y SQL atómico `SET stock_disponible = stock_disponible + p_delta`.
- **Criterio de Aceptación:**
  - [ ] Dos terminales offline vendiendo 10kg concurrentes de un lote de 100kg resultan exactamente en 80kg finales en base de datos.
  - [ ] Peticiones con `p_tenant_id` manipulado son rechazadas con excepción `P0001: Unauthorized tenant mismatch`.
  - [ ] Verificado con chrome-devtools MCP (consola limpia sin errores JS + vista móvil 375 px + flujo interactivo probado).
- **Validación Independiente:**
  ```powershell
  npx vitest run src/tests/wmsRpcSecurity.test.ts src/tests/outboxSyncOcc.test.ts
  ```

---

## FASE 5: Resiliencia de Outbox Sync y Realtime Anti-Thundering

### `T-053-17`: Pipelining Concurrente Acotado (Lotes de máx 100 txs/RPC, Chunking 500 y Causalidad FIFO)
- **Objetivo:** Actualizar `SyncWorkerService.ts` para procesar la cola Outbox respetando la causalidad FIFO estricta para mutaciones sobre la misma entidad, fragmentar internamente llamadas mayores a 500 registros, y limitar el tamaño máximo de lote a 100 transacciones por llamada a `bulk_sync_outbox`.
- **Archivos Afectados:**
  - `src/workers/syncWorkerService.ts`
  - `src/services/backgroundSyncWorker.ts`
- **Entradas / Salidas:**
  - *Entrada:* Pipelining ciego de 5 hilos que podía adelantar ventas a la creación de sus lotes o peticiones masivas desbordadas.
  - *Salida:* Segmentación causal: operaciones de la misma entidad en cola secuencial FIFO; operaciones disjuntas en lotes de máx 100 txs.
- **Criterio de Aceptación:**
  - [ ] Una cola de 1,750 transacciones se segmenta automáticamente en chunks de `[500, 500, 500, 250]` internamente.
  - [ ] Las dependencias de datos (ej. creación de lote antes de despacho) nunca fallan por desorden de red.
  - [ ] Throughput sostenido mayor o igual a 150 operaciones por segundo.
  - [ ] Verificado con chrome-devtools MCP (consola limpia sin errores JS + vista móvil 375 px + vaciado de cola outbox).
- **Validación Independiente:**
  ```powershell
  npx vitest run src/tests/syncWorkerBatch.test.ts
  ```

---

### `T-053-18`: Implementación Funcional del Web Worker de Sincronización (Off-Thread)
- **Objetivo:** Completar `src/workers/syncWorker.worker.ts` para que interactúe directamente con IndexedDB y realice las solicitudes de red en un hilo secundario real, liberando por completo el hilo principal de React.
- **Archivos Afectados:**
  - `src/workers/syncWorker.worker.ts`
  - `src/workers/syncWorkerService.ts`
- **Entradas / Salidas:**
  - *Entrada:* Worker stub de 48 líneas que no accede a IndexedDB ni realiza red en background.
  - *Salida:* Web Worker funcional con acceso a `IDBDatabase` y `fetch` en segundo plano con control de errores y DLQ.
- **Criterio de Aceptación:**
  - [ ] Las transferencias masivas de sincronización no producen ninguna degradación en el frame rate de la UI (60-120 FPS estables).
  - [ ] El worker comunica su progreso y métricas de throughput mediante `postMessage`.
  - [ ] Verificado con chrome-devtools MCP (consola limpia sin errores JS + vista móvil 375 px + monitoreo de Performance en DevTools).
- **Validación Independiente:**
  ```powershell
  npx vitest run src/tests/outboxSyncOcc.test.ts
  ```

---

### `T-053-19`: Reducción de Debounce en Detección de Red a 200ms y Purga Hermética en `switchTenant`
- **Objetivo:** Reducir el debounce de red a 200ms en `NetworkConnectivityService.ts` con ping liviano de 800ms, y blindar el cambio de empresa en `useAuthStore.ts:switchTenant` implementando `resetAllStores()` para purgar síncronamente los stores Zustand L1, cerrar IndexedDB L2, vaciar el índice del worker de búsqueda y desuscribir los canales WebSockets activos.
- **Archivos Afectados:**
  - `src/services/networkConnectivityService.ts`
  - `src/store/useAuthStore.ts`
- **Entradas / Salidas:**
  - *Entrada:* Debounce de 2 segundos al reconectar red, y cambio de empresa superficial que deja catálogos y transacciones del tenant anterior en memoria.
  - *Salida:* Reanudación reactiva en sub-300ms y purga total síncrona de sesión, evitando fuga de datos entre empresas.
- **Criterio de Aceptación:**
  - [ ] Al reconectar el cable de red, la cola Outbox inicia su vaciado en menos de 300 milisegundos.
  - [ ] Al cambiar de inquilino con `switchTenant`, la memoria no contiene ningún dato, precio ni producto de la empresa saliente.
  - [ ] Verificado con chrome-devtools MCP (consola limpia sin errores JS + vista móvil 375 px + cambio de tenant verificado en vivo).
- **Validación Independiente:**
  ```powershell
  npx vitest run src/tests/networkConnectivityService.test.ts src/tests/useAuthStore.test.ts
  ```

---

### `T-053-20`: Algoritmo de Reconexión con Backoff Exponencial y Jitter en Supabase Realtime Anti-Thundering Herd
- **Objetivo:** Implementar en `SupabaseRealtimePreventasService.ts` una estrategia de reconexión resiliente con factor de jitter ($\pm 25\%$) ante caídas de WebSocket, erradicando el riesgo de avalancha (*thundering herd*) contra la API REST y desactivando temporizadores de sondeo plano cuando el WebSocket está activo.
- **Archivos Afectados:**
  - `src/services/supabaseRealtimePreventasService.ts`
  - `src/stores/useCashierKanbanStore.ts`
- **Entradas / Salidas:**
  - *Entrada:* Activación inmediata de sondeo plano de 10s en todas las terminales desconectadas sin jitter.
  - *Salida:* Secuencia de reintentos escalonados pseudoaleatorios y degradación suave a heartbeat de 15s.
- **Criterio de Aceptación:**
  - [ ] 20 clientes reconectándose simultáneamente distribuyen sus intentos a lo largo de una ventana de tiempo sin picos concurrentes.
  - [ ] La propagación de preventas tras reconexión exitosa se restablece en menos de 75 milisegundos.
  - [ ] Verificado con chrome-devtools MCP (consola limpia sin errores JS + vista móvil 375 px + reconexión de sockets probada).
- **Validación Independiente:**
  ```powershell
  npx vitest run src/tests/supabaseRealtimeService.test.ts src/tests/cashierKanbanRealtimeIntegration.test.tsx
  ```

---

## Matriz de Cobertura y Trazabilidad (Requisitos EARS vs Tareas Atómicas)

| Requisito EARS | Descripción de la Capacidad | Tareas Atómicas Asociadas |
| :--- | :--- | :--- |
| **REQ-053-UBI-01** | Aislamiento multi-tenant hermético en L1-L4 y purga total | `T-053-13`, `T-053-14`, `T-053-15`, `T-053-16`, `T-053-19` |
| **REQ-053-UBI-02** | Operación a Costo Estricto $0 | `T-053-01`, `T-053-02`, `T-053-14`, `T-053-17` |
| **REQ-053-UBI-03** | Tasa constante de 60-120 FPS y frame < 16ms | `T-053-05`, `T-053-07`, `T-053-08`, `T-053-18` |
| **REQ-053-UBI-04** | Accesibilidad WCAG 2.2 AA+ e inmutabilidad | `T-053-07`, `T-053-08` |
| **REQ-053-UBI-05** | Sincronización multi-pestaña con BroadcastChannel y Web Locks | `T-053-15` |
| **REQ-053-EVE-01** | Búsqueda off-thread sub-2ms exacto y <= 35ms fuzzy con payload ligero | `T-053-05`, `T-053-06`, `T-053-07` |
| **REQ-053-EVE-02** | Adición atómica al carrito sub-5ms y stock granular | `T-053-06`, `T-053-08` |
| **REQ-053-EVE-03** | Service Worker runtime caching y prefetching ocioso | `T-053-02`, `T-053-04` |
| **REQ-053-EVE-04** | Encolamiento Outbox local sub-2ms y orden causal FIFO | `T-053-15`, `T-053-17`, `T-053-18` |
| **REQ-053-EVE-05** | Reconexión de red rápida con 200ms debounce | `T-053-19` |
| **REQ-053-EVE-06** | Propagación Realtime sub-75ms e invalidación selectiva | `T-053-20` |
| **REQ-053-EVE-07** | Purga hermética de sesión en `switchTenant` | `T-053-13`, `T-053-19` |
| **REQ-053-STA-01** | Operatividad autónoma offline con Service Worker e IDB | `T-053-02`, `T-053-15`, `T-053-18` |
| **REQ-053-STA-02** | Throughput Outbox $\ge 150\text{ ops/s}$ y lotes acotados a 100 txs | `T-053-17`, `T-053-18` |
| **REQ-053-STA-03** | Silenciamiento de sondeo cuando socket está vivo | `T-053-20` |
| **REQ-053-STA-04** | Paginación Keyset Cursor `(created_at, id)` en Kardex | `T-053-09`, `T-053-11` |
| **REQ-053-STA-05** | Mitigación Thundering Herd en L3 (Single-Flight y XFetch) | `T-053-14` |
| **REQ-053-UNW-01** | Prevención de thundering herd en WebSockets con jitter | `T-053-20` |
| **REQ-053-UNW-02** | Aislamiento de fallos en Dead-Letter Queue | `T-053-17` |
| **REQ-053-UNW-03** | Prevención de fuga de memoria en L1 | `T-053-06`, `T-053-13` |
| **REQ-053-UNW-04** | Protección contra manipulación de tenant con `public.get_tenant_id()` | `T-053-16` |
| **REQ-053-UNW-05** | Prevención de pérdida de inventario con delta relativo SQL | `T-053-16` |
| **REQ-053-UNW-06** | Prohibición de credenciales Upstash directas en frontend | `T-053-14` |

---
*Desglose de tareas blindado y calibrado por Worker M2 conforme a la metodología Spec-Driven Development (SDD).*
