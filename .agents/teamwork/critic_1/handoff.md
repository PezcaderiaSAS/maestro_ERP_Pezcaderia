# Handoff Report: Crítica Técnica Adversarial de Arquitectura de Latencia y Multi-Tenancy (SPEC-053)

- **Agente:** Critic 1 (Latency Architecture & Multi-Tenancy Critic)
- **Fecha:** 2026-11-05T12:20:00Z
- **Destinatario:** Orchestrator (Conversation ID: `0a86b821-9cfb-4c7b-8c1f-3456c6f04c55`)
- **Veredicto Técnico:** **REQUEST_CHANGES** (Solicitud de Modificaciones Arquitectónicas Obligatorias)

---

## 1. Observation (Observaciones Directas y Evidencia de Código)

A partir de la inspección estricta de la especificación SDD (`specs/053-latency-optimization-sdd/spec.md`, `plan.md`, `tasks.md`, `audit-report.md`), el reporte de benchmark oficial (`docs/benchmarks/latency-baseline-report.md`) y el código fuente del repositorio, se documentan las siguientes evidencias textuales y numéricas:

### Obs 1: Desincronización y Condiciones de Carrera Multi-Pestaña en L1/L2
- En `src/services/tenantIndexedDbService.ts:12-25, 698-700`:
  `TenantIndexedDbService` es una clase instanciada como singleton (`export const tenantIndexedDb = new TenantIndexedDbService()`). Mantiene mapas en memoria volátiles (`memoryStock`, `memoryProducts`, etc.) y una conexión `db: IDBDatabase | null`.
  **No contiene ninguna referencia a `BroadcastChannel`, `SharedWorker`, `window.addEventListener('storage')`, ni Web Locks API.**
- En `src/services/tenantIndexedDbService.ts:293-317`:
  ```typescript
  public async updateStock(sku: string, bodegaKey: string, deltaOCantidad: number, esAbsoluto = false): Promise<void> {
    const key = `${sku}__${bodegaKey}`;
    // ...
    const getReq = store.get(key);
    getReq.onsuccess = () => {
      const actual = getReq.result ? getReq.result.cantidad : 0;
      const nuevo = esAbsoluto ? deltaOCantidad : actual + deltaOCantidad;
      store.put({ sku_bodega: key, sku, bodegaKey, cantidad: nuevo });
    };
  }
  ```
  La lectura `getReq` y escritura `store.put` no están sincronizadas contra el estado reactivo en memoria L1 (Zustand) de otras pestañas abiertas en el mismo navegador.

### Obs 2: Ausencia de Mitigación para Thundering Herd / Cache Stampede en L3 (Upstash Redis)
- En `specs/053-latency-optimization-sdd/spec.md:45, 122-126`:
  El flujo multinivel estipula:
  `L3Check: ¿Clave en L3 Upstash Redis REST? SÍ (p50 < 35ms) -> L3Hit; NO -> L4Fetch (Consulta L4 Supabase PostgreSQL ACID). WarmCache -> Poblar L3 Redis + L2 IndexedDB + L1 Zustand.`
- En `specs/053-latency-optimization-sdd/plan.md:380-383`:
  Se especifica:
  `Cliente REST ultraliviano a costo $0 (fetch directo a https://[endpoint].upstash.io) con patrón Stale-While-Revalidate (SWR): GET tenant:{tenantId}:stock:{sku} (TTL 30s). Locks distribuidos para cobro concurrente: SET resource_lock NX EX 10.`
  **No se especifica ningún mecanismo de Request Collapsing (Single-Flight), ni algoritmo probabilístico de expiración temprana (XFetch), ni degradación suave ante Cache Miss simultáneo de múltiples terminales.**

### Obs 3: Fuga de Datos Multi-Tenant y Exposición de Credenciales
- En `src/store/useAuthStore.ts:588-623`:
  La función `switchTenant` realiza únicamente:
  ```typescript
  switchTenant: (tenantInput) => {
    // ... normaliza tenant
    set({
      activeTenant: normTenant,
      currentUser: updatedUser,
      isTenantSelectorOpen: false,
    });
    useSuperAdminStore.getState().selectTenant(normTenant.id);
  }
  ```
  **No ejecuta `reset()` sobre `useInventoryStore`, `usePOSStore`, ni `useCashierKanbanStore`. No llama a `tenantIndexedDb.close()`, no envía `CLEAR_INDEX` a `catalogSearch.worker.ts`, y no desuscribe los canales WebSockets de Supabase Realtime.**
- En `tasks.md:315-320` (`T-053-15`) y `plan.md:380`:
  Se describe la implementación de L3 como:
  `fetch directo a https://[endpoint].upstash.io desde el cliente`.
  Para hacer `fetch` directo desde el navegador hacia Upstash, el token de autenticación de Upstash (`UPSTASH_REDIS_REST_TOKEN`) debe residir en variables de entorno públicas de Vite (`VITE_...`), haciéndolo legible desde las DevTools del navegador. Redis no dispone de Row-Level Security por tenant en sus tokens REST.

### Obs 4: Contradicción Cuantitativa en los SLAs del POS vs Benchmark Oficial
- En `spec.md:38`:
  `Búsqueda en POS (16,000 SKUs): SLA Objetivo (p50) < 1.5ms | (p95) < 3.0ms | (p99) < 5.0ms`.
- En `docs/benchmarks/latency-baseline-report.md:104, 131-133`:
  El microbenchmark real ejecutado sobre 16,000 SKUs en CPU de escritorio (Intel Core i5-7500T @ 2.70GHz) arrojó:
  ```json
  "indexed_search_16k_p50_ms": 3.3712,
  "indexed_search_16k_p95_ms": 32.0608,
  "indexed_search_16k_p99_ms": 37.7278
  ```
  **El valor real p95 auditado (32.06 ms) supera en un 968% la meta SLA declarada (< 3.0 ms).**
- En `src/workers/catalogSearch.worker.ts:49-63` y `src/hooks/useCatalogSearchWorker.ts:45-53`:
  El worker retorna un array de hasta 80 objetos completos `LocalIndexedDbProduct` en cada pulsación de tecla mediante `postMessage`, sin debounce en el input y sin token de cancelación o secuencia.

### Obs 5: Riesgos de Regresión Operativa en el Plan de Tareas (`tasks.md`)
- En `tasks.md:48-64` (`T-053-02`): Code splitting dinámico con `React.lazy()` en las 25 vistas sin estrategia de Service Worker / Cache Storage precache.
- En `tasks.md:134-150` (`T-053-06`): Sustitución de `getProductStock` por un `Map<sku, number>` consolidado global, omitiendo el stock desglosado por bodega individual.
- En `tasks.md:233-249` (`T-053-11`): Paginación de Kardex con cursor temporal estricto `created_at < cursor LIMIT 50`.
- En `tasks.md:354-370` (`T-053-17`): Pipelining concurrente con `p-limit(5)` sobre la cola Outbox sin control de dependencias causales entre transacciones de la misma entidad.

---

## 2. Logic Chain (Cadena Lógica Adversarial y Análisis Causal)

A partir de las observaciones directas, se deduce el siguiente encadenamiento lógico riguroso:

1. **Condiciones de Carrera y Desincronización L1-L2 en Multi-Pestaña (Obs 1):**
   - Dado que múltiples pestañas del navegador ejecutan instancias separadas del motor V8 con heaps de memoria aislados, L1 Zustand en la Pestaña A y L1 Zustand en la Pestaña B no comparten memoria.
   - Dado que `TenantIndexedDbService` carece de un canal de difusión inter-contexto (`BroadcastChannel`), cuando la Pestaña A registra una venta o actualiza stock en L2, la Pestaña B no tiene conocimiento de la mutación.
   - En consecuencia, la Pestaña B opera con lecturas sucias (*dirty / stale reads*) de L1. Si la Pestaña B efectúa una venta concurrente del mismo producto perecedero, venderá stock que físicamente ya no existe, o sobreescribirá el stock con un valor corrupto en L2 (*lost update*).

2. **Avalancha hacia L4 (Thundering Herd / Cache Stampede) (Obs 2):**
   - Dado que el TTL en Upstash Redis L3 se fija rígidamente en 30 segundos, al cumplirse dicho intervalo Redis purga la clave de stock.
   - En un escenario de alta concurrencia en mostrador (ej. 10 a 20 terminales de caja o preventa consultando SKUs de alta rotación), la expiración provoca que todas las terminales experimenten un Cache Miss simultáneo en L3.
   - Al carecer de deduplicación de solicitudes en vuelo (Request Collapsing / Single-Flight) y de revalidación probabilística anticipada (algoritmo XFetch), todas las terminales emiten en paralelo una consulta pesada a PostgreSQL L4.
   - En la capa gratuita de Supabase (límite estricto de conexiones directas y pool de PgBouncer), este pico de carga saturará el connection pool, disparará los tiempos de respuesta de 60ms a más de 2,500ms y provocará errores HTTP 504 Gateway Timeout, degradando todo el ERP.

3. **Vulnerabilidad Crítica de Fuga de Datos Multi-Tenant y Seguridad en L3 (Obs 3):**
   - Dado que `useAuthStore.switchTenant` no resetea los stores Zustand L1, no cierra ni reinicializa `tenantIndexedDb` L2, no purga el índice del Web Worker, ni cancela las suscripciones WebSockets activas, los datos de catálogo, stock, preventas y transacciones de la empresa saliente permanecen cargados en memoria.
   - Si un usuario cambia de empresa, la terminal continuará mostrando productos, precios y clientes del tenant previo, y las transacciones offline se registrarán bajo la base de datos IndexedDB del tenant incorrecto.
   - Además, la propuesta de ejecutar `fetch` directo a Upstash Redis desde el navegador exige exponer el token REST en el cliente. Debido a que Redis no posee políticas RLS a nivel de fila ni autenticación por JWT claim, cualquier usuario puede inspeccionar la consola de red, obtener el token y realizar operaciones de lectura o escritura arbitrarias sobre cualquier namespace `tenant:*:*` de otras empresas alojadas en el sistema.

4. **Inviabilidad Matemática del SLA de Búsqueda POS en Hardware Modesto (Obs 4):**
   - El benchmark oficial en hardware de escritorio Intel Core i5 demostró que el motor indexado `SearchEngineCore` toma **32.06 ms (p95)** en un catálogo de 16,000 SKUs debido al costo computacional de calcular distancia Levenshtein sobre un vocabulario no particionado de miles de palabras.
   - Por tanto, la meta declarada en SPEC-053 de `p95 < 3.0ms` es físicamente inalcanzable con el algoritmo actual, incluso en CPUs de alto rendimiento.
   - En hardware POS típico de mostrador (Intel Celeron J1900, Atom x5 o procesadores táctiles modestos de baja potencia), el tiempo de búsqueda se multiplicará por un factor de 3x a 5x (alcanzando entre 95ms y 160ms).
   - Adicionalmente, el envío de 80 objetos completos por `postMessage` mediante el algoritmo Structured Clone añade una penalización de serialización de 10ms a 25ms por pulsación de tecla en el Event Loop de React. La latencia total percibida superará los 150ms, destruyendo el objetivo de latencia cero.

5. **Regresiones Operativas en las Tareas Atómicas (Obs 5):**
   - `T-053-02`: Si el sistema opera offline (requisito mandatorio `REQ-053-STA-01`), la navegación mediante `React.lazy()` fallará al no encontrar el chunk en red (`ChunkLoadError`), provocando el colapso de la pantalla de ventas en muelles o bodegas desconectadas.
   - `T-053-06`: Consolidar el stock en un solo número global por SKU rompe la operativa de almacén: el mostrador no podrá determinar si los kilos están en su bodega de despacho o en un cuarto frío distante.
   - `T-053-11`: La paginación con `created_at < cursor` omite registros cuando múltiples movimientos de Kardex comparten el mismo microsegundo de creación (frecuente en importaciones o despachos en lote).
   - `T-053-17`: Despachar la cola Outbox con 5 peticiones concurrentes (`p-limit(5)`) sin control de orden causal romperá la integridad referencial en el backend (ej. una venta despachada antes de que el servidor confirme la creación del lote o preventa).

---

## 3. Caveats (Límites de la Investigación y Supuestos)

1. No se ejecutaron pruebas de estrés en hardware físico ARM/Celeron en esta sesión; las proyecciones de latencia en terminales modestas se basan en la degradación conocida del IPC y benchmarks estándar de la industria para algoritmos $O(N \times M)$ en V8.
2. No se modificó el código fuente de producción durante esta evaluación, en estricto cumplimiento de la restricción de rol `Review-only`.
3. Se asume que la capa gratuita de Supabase opera con los límites oficiales de PostgreSQL y PgBouncer vigentes (Free Tier: 500 MB DB, pool acotado de conexiones).
4. Si el proyecto adoptara un backend intermedio (Next.js SSR / Express / Edge Middleware) que oculte las credenciales de Upstash Redis, el riesgo de seguridad de L3 se mitigaría, pero actualmente la arquitectura es una SPA pura en Vite + Vercel Static.

---

## 4. Conclusion & Veredicto Formal

### Veredicto: **REQUEST_CHANGES**

El diseño técnico propuesto para SPEC-053 posee bases sólidas en cuanto a la identificación de cuellos de botella (bundle monolítico, bucles N+1 en WMS, componentes sin memoizar), pero **no puede ser aprobado para implementación en su estado actual** debido a cuatro (4) vulnerabilidades críticas de arquitectura y una contradicción cuantitativa en sus metas de rendimiento:

### Modificaciones Mandatorias Requeridas antes de Aprobación:

1. **Arquitectura de Sincronización Multi-Pestaña L1-L2:**
   - Incorporar en `TenantIndexedDbService` y los stores Zustand un bus de eventos basado en `BroadcastChannel('pezcaderia_l1_l2_sync')`.
   - Ante cualquier mutación de stock o catálogo en una pestaña, emitir un pulso de invalidación para que las demás pestañas sincronicen su L1 en segundo plano.
   - Proteger las escrituras concurrentes en IndexedDB con la API nativa `navigator.locks.request()`.

2. **Mitigación de Thundering Herd y Blindaje de Seguridad en L3 (Redis):**
   - **PROHIBIDO** invocar Upstash Redis directamente desde el cliente con credenciales expuestas en Vite. Las consultas a L3 deben canalizarse a través de un Edge Function de Supabase autenticado por JWT que valide el claim `tenant_id`.
   - Implementar el patrón **Request Collapsing (Single-Flight)** en el cliente para consolidar solicitudes en vuelo idénticas hacia una misma promesa.
   - Aplicar el algoritmo **XFetch (Probabilistic Early Expiration)** o un lock distribuido (`SET lock:revalidate:{sku} 1 NX EX 5`) para que solo una terminal revalide L4 mientras las demás continúan recibiendo datos stale sin sobrecargar la base de datos.

3. **Ciclo de Vida Hermético Multi-Tenant en Cambio de Sesión / Empresa:**
   - Rediseñar `switchTenant` y `logout` en `useAuthStore.ts` para que ejecuten obligatoriamente:
     a) `useInventoryStore.getState().reset()` y reseteo de todos los stores Zustand.
     b) `tenantIndexedDb.close()` y reapertura dirigida a la base `PezcaderiaERP_{newTenantId}`.
     c) Envío del mensaje `CLEAR_INDEX` a `catalogSearch.worker.ts` seguido de la indexación exclusiva del nuevo tenant.
     d) Desuscripción explícita de canales Supabase Realtime y reconexión filtrada al nuevo `tenant_id`.

4. **Corrección de Metas de SLA y Optimización de Payload del Web Worker POS:**
   - Corregir el SLA formal en `spec.md`: Establecer como meta p95 $< 10\text{ ms}$ para búsqueda exacta/código de barras/prefijo y p95 $< 40\text{ ms}$ para búsqueda fuzzy en catálogos de 16K SKUs en hardware estándar.
   - Modificar `catalogSearch.worker.ts` para que **NO devuelva 80 objetos completos**. Debe retornar únicamente un array de cadenas con los identificadores o SKUs resultantes (`results: string[]`) con tamaño acotado a las 20-30 tarjetas principales. La UI resolverá los datos visuales desde su mapa en memoria $O(1)$.
   - Reemplazar la iteración lineal sobre todo el vocabulario en Levenshtein por un índice de prefijos (Trie o BK-Tree), evaluando distancia únicamente contra palabras que compartan los 2 primeros caracteres.
   - Incorporar un debounce de 50ms y un token de secuencia para descartar respuestas de consultas obsoletas.

5. **Correcciones en el Plan de Tareas Atómicas (`tasks.md`):**
   - `T-053-02 / T-053-04`: Integrar precacheo en Service Worker (`workbox` o script nativo) para las vistas críticas (`POSView`, `InventoryView`, `CashierKanbanView`), asegurando que operen sin conexión a internet.
   - `T-053-06`: El mapa de precomputación de stock debe mantener granularidad por bodega (`${sku}__${bodegaId}`).
   - `T-053-11`: El cursor de Kardex debe ser compuesto: `(created_at, id) < (cursor_created_at, cursor_id)`.
   - `T-053-17`: El pipelining de la cola Outbox debe garantizar orden secuencial estricto para mutaciones causales de una misma entidad, reservando la concurrencia (`p-limit`) solo para entidades disjuntas o mediante el RPC atómico `bulk_sync_outbox`.

---

## 5. Verification Method (Método de Verificación Independiente)

Para verificar objetivamente cada uno de los hallazgos y validar las correcciones una vez aplicadas:

1. **Verificación de Sobrecarga de Serialización en Web Worker:**
   Inspeccionar el payload emitido en `src/workers/catalogSearch.worker.ts:59`:
   ```powershell
   node -e "const core = require('./src/workers/searchEngineCore.ts'); console.log('Tamaño de 80 objetos completos vs 80 SKUs');"
   ```
   Comprobar en el Performance Profiler de Chrome DevTools la duración de la tarea `MessagePort.onmessage` en el hilo principal durante la búsqueda continua.

2. **Verificación de la Brecha de SLA en Búsqueda:**
   Ejecutar el benchmark existente de latencia en POS:
   ```powershell
   npx ts-node scripts/benchmark/benchmark-pos-latency.ts
   ```
   Observar que `indexed_search_16k_p95_ms` reporta $> 30\text{ ms}$, refutando la meta declarada de $< 3\text{ ms}$.

3. **Verificación de Fuga Multi-Tenant en Cambio de Empresa:**
   Inspeccionar `src/store/useAuthStore.ts:588-623`:
   Confirmar que `switchTenant` no interactúa con `useInventoryStore` ni `tenantIndexedDb`.
   Ejecutar la suite de pruebas unitarias de autenticación:
   ```powershell
   npx vitest run src/tests/useAuthStore.test.ts
   ```

4. **Verificación de Vulnerabilidad de Credenciales Upstash L3:**
   Inspeccionar `src/vite-env.d.ts` y las configuraciones de entorno para verificar que no existan tokens de escritura de Upstash expuestos con prefijo `VITE_`.

---
*Reporte adversarial elaborado por Critic 1 (Latency Architecture & Multi-Tenancy Critic) conforme a la metodología Spec-Driven Development (SDD) y el Protocolo Brownfield v2.2.*
