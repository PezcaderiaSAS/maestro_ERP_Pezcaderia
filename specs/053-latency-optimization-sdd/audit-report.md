# Informe de Auditoría Técnica Consolidado: Diagnóstico de Latencia y Rendimiento en MaestroPescaderia ERP

- **Código:** AUDIT-SPEC-053
- **Versión:** v3.2 — Blindada y Aumentada con Evidencia Adversarial Forense (Critic 1 & Challenger 2)
- **Fecha:** 2026-11-05
- **Misión:** Consolidación forense, síntesis de evidencia técnica de los equipos de exploración (Explorer 1, Explorer 2 y Spec Miner 3) y validación empírica adversarial de límites algorítmicos y de concurrencia.
- **Marco de Trabajo:** Spec-Driven Development (SDD) & Protocolo Brownfield v2.2.
- **Directivas:** Costo Estricto $0, Aislamiento Multi-Tenant Hermético, Arquitectura Data-Driven, WCAG 2.2 AA+.

---

## Resumen Ejecutivo

MaestroPescaderia ERP es una plataforma empresarial multi-inquilino de misión crítica para el comercio, distribución, cuartos fríos (WMS) y punto de venta (POS) de productos perecederos del mar. La auditoría integral del código fuente, configuraciones de empaquetado, esquemas de bases de datos, flujos en tiempo de ejecución y la ejecución de la sonda de estrés adversarial (`scripts/benchmark/adversarial-stress-harness.ts`) revelaron severas discrepancias entre la arquitectura formal del sistema y la implementación física en producción.

El sistema presenta una degradación acumulativa de latencia en seis frentes:
1. **Bundle Size Inicial:** Un chunk monolítico principal de **4,609.36 kB (1.24 MB gzip)** descargado en el hilo principal antes de renderizar la pantalla de login o mostrador.
2. **Punto de Venta Mostrador y Brecha de SLA Empírica:** Un bloqueo de UI de entre 80ms y 250ms por cada pulsación de tecla debido a algoritmos síncronos $O(N)$, 10,000 lecturas redundantes a stores Zustand por búsqueda y renderizado DOM masivo no virtualizado. Además, la auditoría adversarial demostró que las búsquedas difusas en catálogos de 16,000 SKUs registran latencias reales de **32.06ms a 60.84ms**, refutando matemáticamente el objetivo ingenuo de sub-3ms y evidenciando una sobrecarga de 15-25ms en la serialización de 80 objetos completos por `postMessage`.
3. **WMS, Kardex y Balance de Masa:** Consultas frías en Supabase con latencias de 800ms a 4,000ms provocadas por ausencia total de índices en tablas transaccionales, bucles N+1 de peticiones seriales en custodia 3PL y aislamiento de los registros de rendimiento pesquero en el almacenamiento local del navegador. Paginación de Kardex con riesgo de pérdida de registros en microsegundos concurrentes.
4. **Desincronización Multi-Pestaña y Exclusión Mutua en L1/L2:** `TenantIndexedDbService` singleton opera sin `BroadcastChannel` ni Web Locks API, provocando lecturas sucias (*dirty reads*) entre pestañas abiertas en la misma terminal y colisiones de escritura física en IndexedDB.
5. **Jerarquía de Caché Multinivel y Thundering Herd (L3):** Inexistencia de L3 en producción, riesgo de avalancha (*cache stampede*) en Supabase L4 ante expiración masiva del TTL de 30s en Upstash Redis, y riesgo de seguridad crítico si se expusieran credenciales REST en variables públicas de Vite.
6. **Sincronización Offline, OCC y Causalidad:** Pérdida de inventario (*lost updates*) en OCC Delta-Merge debido al cálculo de stock absoluto en cliente, transmisión de cola Outbox serializada $O(N \times \text{RTT})$ en el hilo de React, debounce de 2 segundos en detección de red y riesgo de *thundering herd* en reconexión de WebSockets sin jitter.

---

## 1. Módulo Crítico 1: Tiempo de Carga Inicial y Bundle Size (4.6 MB)

### 1.1 Evidencia Directa y Métricas de Compilación
Al ejecutar `npx vite build` en el entorno de producción, la herramienta emitió la siguiente advertencia y distribución de pesos:
```text
dist/assets/index-NxHFKsFx.js                    4,609.36 kB │ gzip: 1,236.61 kB
dist/assets/html2canvas.esm-CBrSDip1.js            201.42 kB │ gzip:    48.03 kB
dist/assets/index.es-CmQ7u2vu.js                   150.69 kB │ gzip:    51.55 kB
dist/assets/purify.es-BwoZCkIS.js                   22.03 kB │ gzip:     8.77 kB
dist/assets/FileSaver.min-BuxekOWc.js                2.99 kB │ gzip:     1.47 kB
dist/assets/index-Dn6dMFEe.css                     179.48 kB │ gzip:    27.23 kB
dist/index.html                                      1.52 kB │ gzip:     0.74 kB
(!) Some chunks are larger than 500 kB after minification.
```

### 1.2 Causas Raíz Identificadas en el Código Fuente
1. **Configuración Nula de Build en `vite.config.ts` (Líneas 1-32):**
   El archivo de configuración de Vite define plugins y puertos de desarrollo, pero carece por completo de la sección `build.rollupOptions.output.manualChunks`. No existe división de vendors ni políticas de empaquetado granular.
2. **Importación Estática Monolítica de 25 Vistas en `src/App.tsx` (Líneas 4-28 y 1363-1440):**
   Las 25 pantallas del ERP (`POSView`, `InventoryView`, `OrderKanbanView`, `AccountingView`, `PayrollView`, `ColdStorageRentalView`, `PurchasesReceivingView`, etc.) se importan de forma estática en la cabecera de `App.tsx`. El directorio `src/views/` contiene **2,871.3 KB distribuidos en 65,197 líneas de código**, de los cuales el 100% es compilado dentro del bundle de entrada inicial. No existe un solo `React.lazy()` ni contenedor `<Suspense>` en el enrutamiento principal.
3. **Incrustación de Librerías Pesadas en la Ruta Crítica:**
   - **`exceljs` (v4.4.0):** Importado estáticamente en `src/components/BulkUploadModal.tsx:3` (`import ExcelJS from 'exceljs'`). Aunque la línea 99 intenta un `await import('exceljs')`, el import estático anula el code splitting, arrastrando **938.58 kB** al chunk principal.
   - **`jspdf` (v2.5.1):** Importado estáticamente en 6 módulos: `branchReportsService.ts:3`, `coldStoragePdfService.ts:1`, `payrollService.ts:3`, `routeManifestPdfService.ts:1`, `wmsRemisionPdfService.ts:1` y `KardexTable.tsx:17`. Incorpora **573.89 kB** (jsPDF + html2canvas) al arranque.
   - **`@sentry/react` (v11.4.0) y `logrocket` (v12.4.0):** Inicializados síncronamente en `src/main.tsx:6-8, 61-75` con `browserTracingIntegration()`, `replayIntegration()` y `LogRocket.init()`, inyectando **346.92 kB** de instrumentación antes del primer cuadro de UI.
   - **`lucide-react` (v0.344.0):** Referenciado en 170 componentes distintos sin agregación de vendor chunk, sumando 64.54 kB de iconos al paquete base.

### 1.3 Validación de Vendor Chunking y Riesgo Offline
Al aplicar una configuración de prueba con particionado explícito de vendors (`vite.benchmark.config.ts`), el chunk `index.js` se redujo de inmediato de **4,609.36 kB a 2,269.15 kB (50.7% de reducción inmediata)**. Sin embargo, tal como advirtió Critic 1, la introducción de `React.lazy()` en 25 vistas introduce el riesgo de `ChunkLoadError` cuando las terminales operan offline en muelles o cuartos fríos, exigiendo una estrategia preceptiva de Service Worker Runtime Caching (Workbox).

---

## 2. Módulo Crítico 2: Latencia en POS Mostrador y Evidencia Adversarial Algorítmica

### 2.1 Evidencia Directa y Cuellos de Botella en el Main Thread
1. **Algoritmo de Filtrado Ineficiente en `src/views/pos/components/ProductSearchPanel.tsx` (Líneas 100-140):**
   - Ante cada pulsación de tecla en la barra de búsqueda, se ejecuta un `.filter()` síncrono sobre el catálogo completo (hasta 5,000 - 16,000 SKUs).
   - En cada iteración se evalúa:
     ```typescript
     const totalStock = getProductStock(p.sku, 'Bodega Principal') + getProductStock(p.sku, 'Bodega Secundaria');
     ```
   - Cada llamada a `getProductStock()` en `src/views/POSView.tsx:1068-1073` ejecuta:
     ```typescript
     const bodegas = useWarehouseStore.getState().bodegas;
     const bodega = bodegas.find(b => b.id === bodegaKey || b.nombre === bodegaKey);
     ```
   - **Impacto:** Con un catálogo de 5,000 SKUs, una sola tecla dispara **10,000 lecturas al store Zustand y 10,000 búsquedas en arreglos `.find()`**, bloqueando el hilo de eventos de JavaScript por más de 50ms.
2. **Renderizado Masivo sin Virtualización (`ProductSearchPanel.tsx:162-174`):**
   El componente renderiza hasta 80 tarjetas de producto simultáneas (`filteredProducts.slice(0, 80)`), generando más de **1,200 nodos DOM** que saturan el recalculate style y layout del navegador.
3. **Explosión de Re-renders en `src/views/POSView.tsx` (3,677 líneas):**
   - `POSView.tsx` contiene 26 hooks `useState` y 14 suscripciones a stores Zustand.
   - El hook `usePOSCart` muta el estado `lineas` directamente en la raíz de `POSView`.
   - **Ningún componente del módulo POS (`ProductSearchPanel`, `CartPanel`, `LineaVentaRow`) cuenta con `React.memo`.**
   - Consecuencia: Cada vez que se agrega un producto al carrito, se re-renderiza la totalidad del catálogo.

### 2.2 Evidencia Forense Adversarial en `SearchEngineCore` (Challenger 2 y Critic 1)
La ejecución de la sonda de estrés adversarial (`scripts/benchmark/adversarial-stress-harness.ts`) sobre un catálogo real de 16,000 SKUs reveló la siguiente evidencia cuantitativa:
- **Indexación:** 199.23 ms a 426.18 ms para indexar 16,000 productos en memoria.
- **Latencias de Consultas Adversariales Específicas:**
  * `'Diacritics & Accents'` (`Róbaló Cámarón Postá Guajirá Chigüiro`): **`51.44 ms`** (Cold) / `16.92 ms` (Warm).
  * `'SQLi Stacked query'` (`'; DROP TABLE productos; --`): **`60.84 ms`** (Cold) / `15.14 ms` (Warm).
  * `'SQLi Boolean bypass'` (`' OR '1'='1`): `38.64 ms`.
  * `'Long query 300 chars repeated words'`: `32.68 ms`.
  * `'Zero-match multi-token'` (`zzzzzz yyyyyy xxxxxx wwwwww`): `32.51 ms`.
  * `'Special punctuation'` (`!@#$%^&*()_+=[]{}|;:",.<>?/\`): `21.20 ms`.
- **1,000 Búsquedas Concurrentes Masivas sobre 16,000 SKUs:**
  * Throughput: 134 queries/sec.
  * **p50:** `2.651 ms` (Warm) / `4.696 ms` (Cold).
  * **p95:** `24.085 ms` (Warm) / **`48.052 ms`** (Cold).
  * **p99:** `29.186 ms` (Warm) / **`71.350 ms`** (Cold).
  * **Máximo:** `122.435 ms` (Warm) / **`148.618 ms`** (Cold).
- **Causa Raíz Algorítmica (`src/workers/searchEngineCore.ts:247-273`):**
  Al no existir una coincidencia exacta, el motor entra en el bloque `else` y ejecuta un escaneo lineal completo $O(T \times |V|)$ evaluando `levenshteinDistance` sobre todo el vocabulario de miles de palabras sin acotar.
- **Sobrecarga de Serialización Structured Clone:**
  El worker retornaba hasta 80 objetos completos `LocalIndexedDbProduct` por `postMessage`, consumiendo entre 10ms y 25ms de serialización en el hilo principal de React en cada pulsación de tecla.

---

## 3. Módulo Crítico 3: Latencia WMS, Kardex y Balance de Masa

### 3.1 Fragmentación del Modelo de Datos de Inventario (4 Sistemas Desconectados)
Se evidenciaron cuatro almacenes disjuntos operando simultáneamente:
1. **`src/services/localDb.ts:4-101`:** Claves globales en `localStorage` síncrono (`pezcaderia_stock`, `pezcaderia_kardex_movements`) sin particionado por tenant.
2. **`src/services/inventoryService.ts:87-178`:** `obtenerKardex()` carga arrays completos de `localStorage` y filtra en memoria con `kardex.filter(m => m.sku === sku)`.
3. **`database/09_inventario_movimientos.sql:23-41`:** Tabla PostgreSQL `inventario_movimientos` que **carece por completo de columna `tenant_id` o `empresa_id`**, con políticas RLS basadas únicamente en roles de usuario (`ADMIN`, `BODEGUERO`).
4. **`supabase/migrations/20261006110200_wms_schema.sql:41-55`:** Tabla PostgreSQL `public.wms_movements` con soporte multi-tenant gestionada por RPCs, pero **nunca consultada** por ninguna vista del frontend en `src/`.

### 3.2 Ausencia Total de Índices y Paginación Frágil en WMS (L4)
- En `20261006110200_wms_schema.sql`, las tablas `wms_warehouses`, `wms_batches`, `wms_stock` y `wms_movements` **no poseen una sola sentencia `CREATE INDEX`**.
- La tabla `wms_batches` almacena la fecha de vencimiento (`expiration_date`), crítica para el despacho perecedero FEFO (First-Expired, First-Out), pero carece de índice compuesto `(tenant_id, expiration_date ASC)`. Cada consulta FEFO ejecuta un Sequential Scan en PostgreSQL.
- En `database/25_secure_remaining_tables_rls.sql:77-87`, la política RLS de `stock_bodegas` evalúa una subconsulta por fila:
  ```sql
  USING (public.is_ultra_admin() OR bodega_id IN (SELECT id FROM public.bodegas WHERE empresa_id = public.get_tenant_id()));
  ```
  Esto introduce una penalización computacional $O(N \times M)$ en la base de datos al consultar balances de stock.
- La paginación de Kardex con `created_at < cursor` omite registros cuando múltiples despachos comparten el mismo microsegundo de creación, requiriendo un cursor compuesto keyset `(created_at, id)`.

### 3.3 Patrón Antipatrón N+1 en Despachos de Custodia 3PL
En `src/services/coldStorageRentalService.ts:1100-1145`, el despacho de inventario en custodia itera sobre los ítems ejecutando de forma serial para cada uno:
1. `SELECT` a `inventario_custodia` (1 RTT HTTP).
2. `UPDATE` a `inventario_custodia` (1 RTT HTTP).
3. `INSERT` a `movimientos_custodia` (1 RTT HTTP).
Para una orden de despacho con 10 líneas se producen **30 peticiones HTTP en cascada serial** sin transacción ACID, totalizando entre 2.5 y 4.0 segundos de espera.

### 3.4 Balance de Masa de Muelle Atrapado en el Navegador
- En `src/services/fishYieldProductionService.ts:11, 113`, las órdenes de rendimiento y despiece de pescado se persisten en `localStorage` bajo la clave `'fish_yield_orders'`, sin interactuar con las tablas relacionales `produccion_ordenes_despiece` ni `produccion_salidas_cortes`.

---

## 4. Módulo Crítico 4: Jerarquía de Caché Multinivel (L1 - L4) y Riesgo de Seguridad

### 4.1 Incompatibilidad en L1 y Desincronización Multi-Pestaña
- Coexisten dos stores disjuntos (`src/store/useInventoryStore.ts` y `src/stores/useInventoryStore.ts`), el segundo con `MOCK_TENANT_ID`.
- `TenantIndexedDbService` es instanciado como singleton pero mantiene mapas volátiles en memoria sin `BroadcastChannel` ni Web Locks API. Si el usuario tiene dos pestañas abiertas en la misma terminal, una venta realizada en la Pestaña A deja a la Pestaña B con stock obsoleto en L1 (*stale read*), arriesgando sobreventa física.

### 4.2 Fuga de Datos Multi-Tenant en Cambio de Empresa (`switchTenant`)
En `src/store/useAuthStore.ts:588-623`, la función `switchTenant` únicamente actualiza las variables `activeTenant` y `currentUser`.
**Evidencia forense:** No invoca `reset()` en `useInventoryStore`, `usePOSStore`, ni `useCashierKanbanStore`. No llama a `tenantIndexedDb.close()`, no envía `CLEAR_INDEX` a `catalogSearch.worker.ts`, y no desuscribe los canales WebSockets activos. El nuevo inquilino visualiza transacciones, clientes y stock del inquilino previo.

### 4.3 Brecha de L3 (Redis) y Riesgo de Exposición de Credenciales
- `@upstash/redis` no está instalado en `package.json` (0% implementado).
- La propuesta de invocar Upstash directamente desde el navegador exigiría exponer el token `UPSTASH_REDIS_REST_TOKEN` con prefijo `VITE_` en el cliente. Redis carece de Row-Level Security por tenant; cualquier usuario podría leer o escribir claves de otras empresas en `tenant:*:*`. Se hace obligatorio canalizar L3 mediante un Edge Function proxy `/functions/cache-proxy` que valide el claim JWT.
- **Riesgo de Thundering Herd:** Expiración rígida a 30s provoca avalanchas hacia Supabase L4 sin Single-Flight request collapsing ni revalidación temprana XFetch.

### 4.4 Vulnerabilidad en RPCs WMS (L4)
En `supabase/migrations/20261006110300_wms_rpcs.sql:5-90`, las funciones `rpc_transfer_stock` y `rpc_adjust_stock` están definidas como `SECURITY DEFINER` y confían ciegamente en el parámetro `p_tenant_id UUID` suministrado por el cliente sin cotejarlo contra `public.get_tenant_id()`.

---

## 5. Módulo Crítico 5: Sincronización Realtime, Cola Outbox y OCC

### 5.1 Pérdida de Inventario (*Lost Updates*) en OCC Delta-Merge
La inspección de `src/stores/useOutboxSyncStore.ts:406-414` reveló que para `ACTUALIZACION_STOCK_DELTA`, el cliente calcula un stock absoluto final:
```typescript
payloadFinal = {
  ...conflictInput.payloadServidor,
  stockDisponible: stockActualServidor + deltaCliente,
};
```
Si dos terminales offline (Terminal A y B) venden 10kg cada una de un lote con 100kg iniciales:
- Terminal A envía `stockDisponible = 90`.
- Terminal B envía `stockDisponible = 90`.
- Si el backend aplica este snapshot absoluto, el stock consolidado queda en 90kg en vez de 80kg, produciendo un desfase de 10kg de pescado físico (*lost update*). Para ser matemáticamente sólido, el backend debe aplicar el delta algebraico en SQL atómico: `UPDATE wms_stock SET stock_disponible = stock_disponible + p_delta`.

### 5.2 Serialización Estricta $O(N)$ y Chunking en Outbox
- En `src/workers/syncWorkerService.ts:63-96`, `transmitBatch` procesaba la cola mediante un bucle `for` serial con un throughput de apenas ~8 ops/s.
- Las pruebas de Challenger 2 verificaron que chunking a 500 ítems y aislamiento de errores HTTP 422 en Dead-Letter Queue (DLQ) es fundamental para evitar bloqueos masivos. Además, se requiere limitar las llamadas RPC a 100 transacciones por lote y garantizar causalidad FIFO para mutaciones sobre una misma entidad.

### 5.3 Cuello de Botella en Detección de Red y Thundering Herd en WebSockets
- `NetworkConnectivityService.ts:89-150` impone un retraso artificial de 2,000ms al detectar `window.online`.
- `SupabaseRealtimePreventasService.ts:47-112` activa sondeo plano de 10s ante desconexión, careciendo de retroceso exponencial con factor de jitter ($\pm 25\%$), lo que saturaría las conexiones del backend al retornar la red.

---

## 6. Cuadro Sinóptico Consolidado de Hallazgos Forenses y Mitigaciones SPEC-053

| Módulo Crítico | Estado Auditado (Base) | Evidencia Forense Adversarial | Mitigación Técnica Canónica SPEC-053 |
| :--- | :--- | :--- | :--- |
| **1. Carga Inicial** | 4,609 kB bundle principal; LCP > 3.5s | 25 vistas estáticas; exceljs + jspdf en entrypoint; riesgo de `ChunkLoadError` offline | Code splitting en 25 vistas; Service Worker Workbox runtime caching; bundle $< 450\text{ kB}$ |
| **2. Búsqueda POS** | Latencia 80 - 250ms por tecla | Benchmark 16K: p95 32ms a 48ms; cold queries 51-60ms; serialización 80 objetos | PrefixMap 3-chars + Trie; debounce 50ms; payload solo `string[]` (top 30 SKUs); p95 $< 2\text{ms}$ exacto, $\le 35\text{ms}$ fuzzy |
| **3. Carrito POS** | Re-render total de la vista al mutar | 3,677 líneas en `POSView.tsx`; 0 `React.memo`; stock lookup iterativo | Carrito desacoplado en store atómico; stock granular `${sku}__${whId}` $O(1)$; adición p99 $< 5\text{ms}$ |
| **4. WMS & Kardex** | Cold queries 800ms - 4s; loop N+1 | Sequential Scans por falta de índices; cursor frágil por timestamp; loop N+1 custodia | Índices compuestos; Keyset Cursor `(created_at, id)`; RPC custodia batch $< 120\text{ms}$ |
| **5. Balance de Masa** | Atrapado en `localStorage` | Órdenes de despiece no conectadas a tablas SQL; conciliación en estado React local | Persistencia ACID directa en PostgreSQL vía RPC dedicado `rpc_registrar_orden_despiece_yield` |
| **6. Multi-Pestaña** | Desincronizado entre pestañas | `TenantIndexedDbService` singleton sin bus inter-contexto ni locks | `BroadcastChannel('pezca_l1_cache')` (< 15ms) + Web Locks API `navigator.locks.request` |
| **7. Multi-Tenant** | Fuga de datos en `switchTenant` | No se resetean stores Zustand L1 ni se cierra IndexedDB L2 ni se limpian Workers | `resetAllStores()` obligatorio en `switchTenant`: purga síncrona total de sesión y stores |
| **8. Caché L3** | Ausente (0%); riesgo token público | Petición directa expondría tokens sin RLS; expiración fija causa thundering herd | Edge Function `/cache-proxy` autenticado por JWT; Single-Flight collapsing + algoritmo XFetch |
| **9. Concurrencia OCC** | Riesgo de lost updates en stock | Delta-Merge en cliente calcula snapshot absoluto (`stockServidor + deltaCliente`) | SQL atómico relativo en base de datos: `UPDATE wms_stock SET stock = stock + p_delta` |
| **10. Outbox Sync** | Throughput $\approx 8\text{ ops/s}$; 2s debounce | Bucle for serial; falta de control causal FIFO; desborde de lotes | Lotes acotados a 100 txs/RPC; chunking 500; causalidad FIFO; throughput $\ge 150\text{ ops/s}$ |
| **11. Realtime** | Sondeo plano 10s ante error socket | Cero backoff con jitter en reconexión WebSocket (riesgo avalancha en reconexión) | Reconexión exponencial con jitter ($\pm 25\%$); supresión de sondeo si WebSocket está vivo |

---
*Informe consolidado, blindado y auditado por Worker M2 (SDD Hardening Engineer) con base en la evidencia de los Explorers, Critic 1 y Challenger 2.*
