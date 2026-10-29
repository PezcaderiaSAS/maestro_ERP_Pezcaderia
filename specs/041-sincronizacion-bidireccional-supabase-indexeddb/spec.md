# Especificación Funcional & Técnica: SPEC-041
## Sincronización Bidireccional Supabase <-> IndexedDB (Outbox Worker Resiliente, Control de Concurrencia Optimista OCC & Transmisión en Lotes Off-Thread)

- **Código:** SPEC-041
- **Fase:** Spec Kit SDD v3.0 — `/speckit.specify`
- **Estado:** Especificación Base Generada con Co-Ejecución Swarm + Harness² (Aprobación Pendiente)
- **Gobernanza:** Flujo Continuo Kanban (`WIP = 1`). TDD Quirúrgico.
- **Tenants Operativos:** `tenant-03` (Ferretería Josase S.A.S. - 5.351 ítems, 9.550 clientes, dimensionado a **escala 3X: 16.000 ítems y 30.000 clientes**) y `tenant-01` (La Pezcadería S.A.S.).
- **Presupuesto & Costo:** **Costo Estricto $0** (Web Workers nativos de navegador, IndexedDB asíncrono, Supabase REST API Free Tier; cero servicios SaaS de pago).
- **Estándar Visual:** Dark Glassmorphism V8 (`#070A10`), retícula de 8px, composite GPU 120 FPS, WCAG 2.2 AA+.

---

### 1. El "Qué" y el "Por Qué" (Business Problem & Technical Requirements)

#### 1.1. Contexto Operativo y Diagnóstico del Problema
En entornos comerciales e industriales reales (como mostradores de ferretería con múltiples asesores táctiles y bodegas de despacho):
1. **Inestabilidad de Red y Latencia Fluctuante:** La conectividad WiFi/4G en mostradores físicos sufre microcortes o caídas prolongadas. Si el sistema dependiera de llamadas síncronas a Supabase para emitir ventas, reservar inventario o actualizar cotizaciones, la atención al cliente se congelaría.
2. **Impacto en el Hilo Principal (Main UI Thread):** La transmisión masiva de catálogos y transacciones (5.351 a 16.000 productos) deserializados en el hilo de React bloquea los 120 FPS de la interfaz.
3. **Colisiones y Conflictos de Datos (Race Conditions & Concurrency):** Múltiples terminales operando offline u online simultáneamente pueden modificar el mismo registro de stock o cotización. Sin un control de concurrencia optimista (OCC) determinista con marcas de versión, se producirían sobreescrituras silenciosas (*lost updates*) o inconsistencias de inventario (*ghost stock*).
4. **Desconexión y Reintentos Caóticos:** Sin un patrón Outbox transaccional estructurado, los reintentos descontrolados generan duplicación de operaciones fiscales o saturación del ancho de banda.

#### 1.2. Solución de Ingeniería Enterprise a Costo $0
1. **Patrón Outbox Resiliente en IndexedDB:** Toda mutación local (ventas POS, reservas de stock, cambios de precio, cotizaciones B2B) se almacena instantáneamente ($\le 5\text{ ms}$) en la tabla local `outbox_transactions` dentro de la base aislada `PezcaderiaERP_{tenantId}` con estado `PENDIENTE` e `idempotencyKey` determinista.
2. **Web Worker Dedicado Off-Thread (`syncWorker.worker.ts`):** La sincronización upstream (Outbox -> Supabase) y downstream (Supabase -> IndexedDB Delta) se ejecuta en un hilo secundario del navegador, procesando lotes de máximo 500 registros con backoff exponencial sin degradar la UI.
3. **Control de Concurrencia Optimista (OCC):**
   - Cada entidad sincronizable incluye una columna `version: number` y `updated_at: string`.
   - Reglas de resolución deterministas:
     - **Ventas POS & Prefacturas:** *Client-Wins* con registro de auditoría (el dinero cobrado en mostrador prevalece y se concilia).
     - **Maestros de Productos & Precios:** *Server-Wins* si `server.version > client.version`.
     - **Stock / Inventario:** Conciliación delta atómica (se descuenta la cantidad consumida localmente, sin sobreescribir el absoluto).
     - **Cotizaciones B2B:** Si hay divergencia de versión, se marca en estado `CONFLICTO_CONCURRENCIA` y se almacena en el store para resolución visual asistida.
4. **Sincronización Delta Bidireccional:** El cliente solo solicita a Supabase registros modificados desde `sync_metadata.lastSyncTimestamp` (`updated_at > lastSync`), reduciendo la transferencia de datos en más del 95%.

---

### 2. Requisitos en Notación EARS (Easy Approach to Requirements Syntax)

- **UBIQUITOUS (Siempre Activo):**
  - **REQ-UBI-01:** El sistema DEBE garantizar aislamiento estricto de datos por tenant en IndexedDB (`PezcaderiaERP_{tenantId}`), impidiendo cualquier fuga cross-tenant.
  - **REQ-UBI-02:** El sistema DEBE operar con costo $0, utilizando exclusivamente Web Workers estándar y Supabase REST.

- **EVENT-DRIVEN (Disparado por Eventos):**
  - **REQ-EVE-01:** CUANDO el operador confirme una venta POS o cotización B2B, el sistema DEBE persistir la transacción en `outbox_transactions` en menos de 5 ms y notificar al worker de fondo.
  - **REQ-EVE-02:** CUANDO el navegador detecte restauración de conectividad (`navigator.onLine` o heartbeat exitoso), el sistema DEBE activar el ciclo de transmisión Outbox inmediatamente sin esperar el intervalo de sondeo.
  - **REQ-EVE-03:** CUANDO Supabase retorne un código de error de colisión de versión (OCC HTTP 409 o divergencia de `version`), el sistema DEBE registrar el incidente en `sync_conflicts` y aplicar la política de resolución correspondiente.

- **STATE-DRIVEN (Dependiente del Estado):**
  - **REQ-STA-01:** MIENTRAS el estado de conectividad sea `OFFLINE`, el sistema DEBE acumular operaciones en la cola Outbox local y continuar permitiendo ventas y reservas en modo optimista.
  - **REQ-STA-02:** MIENTRAS se esté ejecutando una sincronización delta masiva (hasta 16.000 ítems), el Web Worker DEBE procesar en fragmentos (*chunks*) de 500 registros, emitiendo progreso porcentual a la UI sin bloquear los 120 FPS.

- **UNWANTED BEHAVIOUR (Manejo de Errores y Fallos):**
  - **REQ-UNW-01:** SI una petición de sincronización falla por error de red transitorio (timeout, HTTP 500/503), ENTONCES el sistema DEBE aplicar backoff exponencial (1s, 2s, 4s, 8s, 16s, máx 60s) hasta un máximo de 5 intentos antes de marcar `ERROR_REINTENTO`.
  - **REQ-UNW-02:** SI una transacción de la Outbox contiene datos inválidos o esquema incompatible (HTTP 422), ENTONCES el sistema DEBE marcarla como `ERROR_FATAL_DATOS`, aislarla de la cola activa y generar alerta en la consola de sincronización para evitar bucles infinitos de reintento.

---

### 3. Mandatory Multi-Phase System Modeling (5 Diagramas Mermaid)

#### 3.1. Diagrama 1: Flujo de Procesos y Ciclo de Vida Secuencial (`1_process_flowcharts`)

```mermaid
flowchart TD
    A["Operador emite Venta / Cotización / Ajuste en Mostrador"] --> B["Guardado Local Inmediato en IndexedDB (< 5ms)"]
    B --> C["Inserción en outbox_transactions (Estado: PENDIENTE)"]
    C --> D["Actualización Optimista de UI en React (120 FPS)"]
    
    D --> E{"¿Conexión de Red Online?"}
    E -- "No (Modo Offline)" --> F["Transacción permanece en cola Outbox local"]
    F --> G["Monitoreo de Heartbeat de Conectividad (NetworkStatus)"]
    G --> E
    
    E -- "Sí (Online)" --> H["Disparo de Notificación al Web Worker (syncWorker)"]
    H --> I["Lectura de Lote Outbox (Máx 500 registros FIFO)"]
    I --> J["Transmisión por Lotes a Supabase REST con Idempotency-Key"]
    
    J --> K{"¿Respuesta de Supabase?"}
    K -- "HTTP 200/201 (Éxito)" --> L["Actualizar outbox_transactions a SINCRONIZADO"]
    K -- "HTTP 409 (Conflicto OCC)" --> M["Manejador OCC: Comparar versiones y aplicar regla"]
    K -- "Error Transitorio Red (5xx/Timeout)" --> N["Incrementar contador de intentos y calcular Backoff"]
    K -- "Error Validación (422)" --> O["Marcar ERROR_FATAL_DATOS y aislar"]
    
    L --> P["Descarga Delta de Supabase (updated_at > lastSyncTimestamp)"]
    M --> P
    N --> G
    O --> G
    
    P --> Q["Actualización de Almacenes Locales en IndexedDB en Chunks"]
    Q --> R["Actualización de SyncMetadata (lastSyncTimestamp = now)"]
    R --> S["Notificación al Store React useOutboxSyncStore"]
```

---

#### 3.2. Diagrama 2: Lógica de Decisión y Resolución de Conflictos OCC (`2_decision_logic_diagrams`)

```mermaid
flowchart TD
    InPayload["Lote de Transacción Outbox recibido para Replicación"] --> CheckType{"¿Tipo de Operación Outbox?"}
    
    CheckType -- "VENTA_POS / PREFACTURA" --> PosResolve["Política: CLIENT_WINS (Mostrador Físico Prevalece)"]
    PosResolve --> ExecSupabasePos["Insertar Venta en Supabase con IdempotencyKey"]
    ExecSupabasePos --> SchedStockAdj["Disparar Ajuste de Stock Delta en Postgres"]
    
    CheckType -- "CAMBIO_PRECIO / CATALOGO" --> CatOCC{"¿server.version > client.version?"}
    CatOCC -- "Sí" --> ServerWinsCat["Política: SERVER_WINS (Rechazar cambio local y actualizar IndexedDB)"]
    CatOCC -- "No" --> ApplyPrice["Aplicar precio en Supabase e incrementar versión"]
    
    CheckType -- "RESERVA_STOCK / MERMA" --> StockOCC{"¿Stock en Supabase suficiente para reserva?"}
    StockOCC -- "Sí" --> DeductDelta["Descontar cantidad delta atómicamente"]
    StockOCC -- "No" --> PartialStock["Alerta: Stock insuficiente remoto. Notificar supervisor"]
    
    CheckType -- "COTIZACION_B2B" --> QuotOCC{"¿Versión de Cotización coincide?"}
    QuotOCC -- "Coincide" --> UpdateQuot["Actualizar Cotización en Supabase y version++"]
    QuotOCC -- "Diverge" --> ConflictRecord["Registrar en sync_conflicts (Estado: REVISION_MANUAL)"]
    
    DeductDelta --> FinalOk["Confirmar Transacción Sincronizada"]
    ApplyPrice --> FinalOk
    ExecSupabasePos --> FinalOk
    ServerWinsCat --> FinalAlert["Log de Sobreescritura Servidor"]
    PartialStock --> FinalAlert
    ConflictRecord --> FinalAlert
```

---

#### 3.3. Diagrama 3: Modelo Entidad-Relación (`3_entity_relationship_diagrams`)

```mermaid
erDiagram
    OUTBOX_TRANSACTION {
        string id PK "UUID autogenerado localmente"
        string tenantId "Aislamiento estricto de empresa"
        string idempotencyKey "SHA-256 único de la operación"
        string tipoOperacion "VENTA_POS, RESERVA_STOCK, COTIZACION, PRECIO"
        string entidadId "ID o SKU de la entidad modificada"
        int versionEntidad "Versión local al momento de la mutación"
        string estado "PENDIENTE, EN_PROCESO, SINCRONIZADO, ERROR_REINTENTO, ERROR_FATAL"
        int intentos "Contador de intentos de transmisión"
        int maxIntentos "Límite de reintentos (def: 5)"
        string payload "JSON serializado con los datos de mutación"
        string creadoEn "ISO 8601 de creación local"
        string proximoReintentoEn "ISO 8601 con cálculo de backoff"
        string ultimoError "Detalle del error en caso de fallo"
        string sincronizadoEn "ISO 8601 de confirmación en Supabase"
    }

    SYNC_METADATA {
        string tenantId PK "Identificador único del tenant"
        string lastSyncTimestamp "Marca temporal de la última sincronización delta"
        int totalProductosSincronizados "Contador total de productos locales"
        int totalClientesSincronizados "Contador total de clientes locales"
        int versionEsquema "Versión de esquemas de datos"
        string ultimoEstadoSync "EXITOSO, PARCIAL, ERROR"
        string actualizadoEn "ISO 8601"
    }

    SYNC_CONFLICT {
        string id PK "UUID del conflicto"
        string tenantId "Aislamiento por tenant"
        string outboxTransactionId FK "Referencia a outbox_transactions"
        string entidadNombre "productos, cotizaciones, stock"
        string entidadId "Identificador de la fila en conflicto"
        int versionCliente "Versión que intentó aplicar el cliente"
        int versionServidor "Versión existente en Supabase"
        string payloadCliente "Datos emitidos por el cliente"
        string payloadServidor "Datos actuales en Supabase"
        string resolucion "PENDIENTE, CLIENT_WINS, SERVER_WINS, MANUAL"
        string resueltoPor "ID del usuario o MOTOR_OCC"
        string resueltoEn "ISO 8601"
    }

    DELTA_SYNC_LOG {
        string id PK "UUID del log"
        string tenantId "Tenant"
        string direccion "UPSTREAM (Outbox->Cloud) o DOWNSTREAM (Cloud->IDB)"
        int registrosProcesados "Cantidad de registros del lote"
        int duracionMs "Tiempo transcurrido en el lote"
        string estado "EXITO, ERROR"
        string timestamp "ISO 8601"
    }

    OUTBOX_TRANSACTION ||--o| SYNC_CONFLICT : "genera si hay colisión OCC"
    SYNC_METADATA ||--o{ DELTA_SYNC_LOG : "registra historial de lotes"
```

---

#### 3.4. Diagrama 4: Diagrama de Secuencia Temporal (`4_sequence_diagrams`)

```mermaid
sequenceDiagram
    autonumber
    actor Operador as Operador de Mostrador
    participant UI as Vista POS / Cotizaciones React
    participant Store as useOutboxSyncStore (Zustand)
    participant IDB as TenantIndexedDbService
    participant Worker as syncWorker (Web Worker Off-Thread)
    participant Supabase as Supabase REST API & Postgres

    Operador->>UI: Realiza acción (ej. Venta POS / Reserva)
    UI->>Store: dispatchAction(mutationPayload)
    Store->>IDB: insertOutboxTransaction(idempotencyKey, payload, version)
    IDB-->>Store: Confirmación de persistencia local (< 5ms)
    Store-->>UI: Actualización visual optimista instantánea (120 FPS)
    
    Store->>Worker: postMessage({ action: "SYNC_OUTBOX", tenantId })
    Worker->>IDB: getPendingTransactions(batchSize: 500)
    IDB-->>Worker: Retorna lote de 500 transacciones PENDIENTES
    
    loop Para cada chunk de 500 registros
        Worker->>Supabase: POST /rest/v1/rpc/sync_batch_outbox (con Idempotency)
        alt Éxito HTTP 200
            Supabase-->>Worker: { success: true, processedCount: 500, newVersion: X }
            Worker->>IDB: markAsSynchronized(ids, timestamp)
        else Conflicto OCC (HTTP 409)
            Supabase-->>Worker: { error: "OCC_VERSION_MISMATCH", serverRecord }
            Worker->>IDB: recordConflict(conflictData)
            Worker->>Store: postMessage({ event: "OCC_CONFLICT_DETECTED", conflictData })
        else Error Red / 5xx
            Supabase-->>Worker: Error HTTP o Timeout
            Worker->>IDB: updateRetryBackoff(id, backoffSeconds)
        end
    end
    
    Worker->>Supabase: GET /rest/v1/productos?updated_at=gt.{lastSync}&limit=500
    Supabase-->>Worker: Retorna deltas modificados downstream
    Worker->>IDB: bulkPutProductos(deltas)
    Worker->>IDB: updateSyncMetadata(now)
    Worker->>Store: postMessage({ event: "SYNC_CYCLE_COMPLETED", summary })
    Store-->>UI: Actualiza badge en EnterpriseTopbar (Sincronizado)
```

---

#### 3.5. Diagrama 5: Arquitectura de Componentes por Capas (`5_component_architecture_diagrams`)

```mermaid
flowchart TB
    subgraph LayerPresentation ["1. Capa de Presentación (React UI - 120 FPS)"]
        POSView["POSView & Mesa de Cotizaciones B2B"]
        NetworkBadge["NetworkSyncStatusBadge (Topbar)"]
        ConflictDrawer["SyncConflictResolutionDrawer"]
    end

    subgraph LayerState ["2. Capa de Estado & Orquestación"]
        SyncStore["useOutboxSyncStore (Zustand)"]
        ZodValidators["deltaSync.schema.ts (Validadores Zod Estrictos)"]
        ConflictEngine["OCCConflictResolver (Reglas Deterministas)"]
    end

    subgraph LayerWorker ["3. Capa de Procesamiento Asíncrono Off-Thread"]
        SyncWebWorker["syncWorker.worker.ts (Dedicated Web Worker)"]
        BatchChunker["BatchChunker (500 registros por lote)"]
        BackoffTimer["ExponentialBackoffEngine (1s a 60s)"]
    end

    subgraph LayerPersistence ["4. Capa de Persistencia Aislada Local (Costo $0)"]
        IDBService["TenantIndexedDbService (DB: PezcaderiaERP_{tenantId})"]
        StoreOutbox["ObjectStore: outbox_transactions"]
        StoreProducts["ObjectStore: productos (5.351 a 16.000 ítems)"]
        StoreClients["ObjectStore: clientes (9.550 a 30.000 clientes)"]
        StoreMetadata["ObjectStore: sync_metadata"]
        StoreConflicts["ObjectStore: sync_conflicts"]
    end

    subgraph LayerBackend ["5. Capa Cloud Remota (Supabase Free Tier)"]
        SupaREST["Supabase REST API (PostgREST)"]
        SupaRPC["RPC batch_sync_outbox (Idempotente)"]
        PostgresTables["PostgreSQL (Tenants, Productos, Ventas, Stock)"]
        RLSPolicies["Row Level Security (RLS) estricto por tenant_id"]
    end

    LayerPresentation --> LayerState
    LayerState --> LayerWorker
    LayerState --> LayerPersistence
    LayerWorker --> LayerPersistence
    LayerWorker --> LayerBackend
    LayerPersistence -.-> LayerPersistence
```

---

### 4. Tareas Granulares de Implementación Planificadas (WIP = 1)

1. **`TASK-041-01`:** Esquemas Zod y validadores de deltas de sincronización ([`deltaSync.schema.ts`](file:///c:/Users/Personal/Documents/Yurgen/Maestro_Pezcaderia_ERP/maestro_ERP_Pezcaderia/src/types/deltaSync.schema.ts)):
   - Validación de contratos de entrada/salida para ítems Outbox, transacciones delta y conflictos OCC.
   - Pruebas unitarias de validación con Vitest (TDD).

2. **`TASK-041-02`:** Manejador de resolución de conflictos OCC (Optimistic Concurrency Control) en [`useOutboxSyncStore`](file:///c:/Users/Personal/Documents/Yurgen/Maestro_Pezcaderia_ERP/maestro_ERP_Pezcaderia/src/stores/useOutboxSyncStore.ts):
   - Motor de resolución con políticas `CLIENT_WINS`, `SERVER_WINS` y `MERGE_DELTA`.
   - Soporte para tabla de conflictos `sync_conflicts` en [`TenantIndexedDbService`](file:///c:/Users/Personal/Documents/Yurgen/Maestro_Pezcaderia_ERP/maestro_ERP_Pezcaderia/src/services/tenantIndexedDbService.ts).
   - Pruebas unitarias completas de escenarios de colisión.

3. **`TASK-041-03`:** Web Worker en background para transmisión en lotes de 500 registros sin bloqueo de UI ([`syncWorker.worker.ts`](file:///c:/Users/Personal/Documents/Yurgen/Maestro_Pezcaderia_ERP/maestro_ERP_Pezcaderia/src/workers/syncWorker.worker.ts)):
   - Chunking asíncrono de 500 registros, backoff exponencial ante fallos transitorios e integración con [`NetworkConnectivityService`](file:///c:/Users/Personal/Documents/Yurgen/Maestro_Pezcaderia_ERP/maestro_ERP_Pezcaderia/src/services/networkConnectivityService.ts).
   - Verificación de 0 impacto en los 120 FPS del hilo principal y 0 errores en consola JS con Chrome DevTools.

---

### 5. Verificación & Criterios de Aceptación

1. **Latencia Local Inmediata:** Toda mutación local en POS o cotizaciones se almacena en IndexedDB en $\le 5\text{ ms}$.
2. **Escala y No Bloqueo:** La sincronización de 5.351 a 16.000 ítems ocurre en chunks de 500 registros en el Web Worker sin degradar los 120 FPS del renderizado de React.
3. **Control de Concurrencia (OCC):** Ninguna sobreescritura silenciosa ocurre ante colisiones de versión; se aplica la política correspondiente y se audita el 100% de los incidentes.
4. **Resiliencia Offline:** En modo sin conexión, las transacciones se acumulan en `outbox_transactions` y se vacían ordenadamente al recuperar conectividad sin duplicación (idempotencia garantizada).
5. **Calidad de Código:** `tsc --noEmit` con 0 errores, suite Vitest 100% verde y 0 errores en consola Chromium DevTools (Desktop 1280px y Móvil 375px).

