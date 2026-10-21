# Especificación Técnica Formal: SPEC-025

**Código:** SPEC-025  
**Título:** Dispatcher HTTP Real SIIGO Nube API v2 (Autenticación Bearer, Transmisor Outbox, Validación Fiscal DIAN y Modo Simulación)  
**Versión:** 1.0.0  
**Fecha:** 2026-10-21  
**Autor:** @coordinator & @planner (Spec Kit v3.0)  
**Gobernanza:** Flujo Continuo Kanban (Límite estricto `WIP = 1`). Protocolo Brownfield v2.2.  
**Estado:** PROPUESTA / ESPECIFICACIÓN BASE (`/speckit.specify` — Checkpoint de Aprobación Humana)

---

## 1. Resumen Ejecutivo y Justificación ("El Qué" y "El Por Qué")

### 1.1 El Problema Actual
En la especificación `SPEC-020`, La Pezcadería ERP implementó el sistema de resoluciones duales (control interno `VTA-` y facturación fiscal `FEVP-`), el mapeador canónico de payloads para SIIGO (`siigoPayloadMapper.ts`) y la exportación masiva contable. Posteriormente, en `SPEC-021`, se construyó la infraestructura resiliente de cola Outbox (`caja_outbox_v2` en IndexedDB), el detector de conectividad dual (`NetworkConnectivityService`) y el despachador en background (`BackgroundSyncWorker.ts`).

No obstante, el método de transmisión (`defaultTransmit`) opera actualmente con un simulador en memoria que genera números de CUFE y URLs de consulta DIAN sintéticas. No existe una capa de cliente HTTP real contra los endpoints de producción de SIIGO Nube (`https://api.siigo.com/v1/`), ni un gestor seguro del ciclo de vida del token Bearer (adquisición con `username` y `access_key`, caché en memoria con expiración y renovación transparente ante 401 Unauthorized).

### 1.2 La Solución Propuesta (SPEC-025)
Construir el **Dispatcher HTTP Real para SIIGO Nube API v2** mediante una arquitectura desacoplada y modular:
1. **`SiigoAuthService`:** Gestor de autenticación y tokens Bearer. Consume `POST https://api.siigo.com/auth` con credenciales corporativas, almacena el JWT en memoria/sesión con TTL de 24 horas y provee refresco transparente con mutex para evitar condiciones de carrera por peticiones simultáneas.
2. **`SiigoHttpDispatcher`:** Cliente de red HTTP (usando `axios` ya disponible en dependencias sin agregar paquetes de terceros). Conecta como transmisor oficial (`OutboxTransmitterFn`) dentro de `BackgroundSyncWorker.setTransmitter(...)`.
3. **Manejo Estructurado de Respuestas y Clasificación de Errores HTTP:**
   - **200/201 Creado:** Extrae `id`, `name` (consecutivo fiscal real emitido por SIIGO), `stamp.cufe` y `stamp.qr`. Actualiza la resolución fiscal y asocia la respuesta al comprobante.
   - **400 Bad Request:** Datos fiscales inválidos (e.g., NIT erróneo, DANE no reconocido). Clasifica inmediatamente como `ERROR_FATAL_DATOS` en la outbox sin bloquear la cola de otras ventas.
   - **401 Unauthorized:** Invalida el token en caché, renueva credenciales con SIIGO y reintenta la petición.
   - **429 Too Many Requests / 5xx Server Error:** Desencadena reintento exponencial con jitter (`ERROR_REINTENTO`).
4. **Modo Dual (Producción vs. Sandbox / Simulación):**
   - Si no se configuran credenciales válidas o el flag `isSandbox` está activo, conmuta de forma transparente a un motor de simulación fiscal sin fallar las operaciones de caja ni interrumpir el POS.
5. **Panel Táctil de Monitoreo y Diagnóstico SIIGO (Ergonomía "Regla del Niño de 12 Años"):**
   - Modal accesible de diagnóstico rápido con botón de ping "Probar Conexión", estado del token (activo/expirado/simulado) y visualización del log de los últimos 10 despachos.

---

## 2. Requisitos del Sistema en Notación EARS

### 2.1 Requisitos Ubicuos (Ubiquitous Requirements)
- **EARS-UBI-01:** El sistema SIEMPRE autenticará las peticiones a SIIGO Nube API v2 utilizando el encabezado HTTP estándar `Authorization: Bearer <access_token>` y el header identificador de empresa `Partner-Id: LaPezcaderiaERP`.
- **EARS-UBI-02:** El sistema NUNCA almacenará claves secretas (`access_key`) en texto plano en repositorios ni en logs del navegador.

### 2.2 Requisitos Basados en Eventos (Event-Driven Requirements)
- **EARS-EVT-01:** CUANDO el `BackgroundSyncWorker` procese un ítem de la cola Outbox con `tipoOperacion === 'FACTURA_ELECTRONICA_SIIGO'`, ENTONCES invocará al `SiigoHttpDispatcher.transmitirFactura(item)` para enviar el payload vía `POST /v1/invoices`.
- **EARS-EVT-02:** CUANDO SIIGO Nube retorne un código de estado `201 Created` con el nodo `stamp` diligenciado, ENTONCES el sistema capturará el CUFE, la URL del código QR y el consecutivo fiscal oficial, actualizando atómicamente el registro en `useResolucionStore` y marcando el ítem de la outbox como `SINCRONIZADO`.
- **EARS-EVT-03:** CUANDO el usuario presione el botón táctil "Probar Conexión con SIIGO", ENTONCES el sistema enviará un ping de autenticación a `POST /auth` y reportará en menos de 2.000 ms si las credenciales son válidas y la API está operativa.

### 2.3 Requisitos de Comportamiento no Deseado (Unwanted Behavior Requirements)
- **EARS-UWB-01:** SI SIIGO Nube responde con un error `400 Bad Request` debido a validaciones fiscales rechazadas (NIT inexistente, código DANE inválido o inconsistencia de impuestos), ENTONCES el sistema NO bloqueará el resto de la cola, SINO QUE marcará el registro afectado con estado `ERROR_FATAL_DATOS`, registrará el mensaje exacto devuelto por SIIGO en `ultimoError` y notificará al administrador.
- **EARS-UWB-02:** SI una petición falla con `401 Unauthorized` por expiración anticipada del token Bearer, ENTONCES el sistema invalidará de inmediato el token en memoria, obtendrá uno nuevo mediante `SiigoAuthService.refreshToken()` y reintentará la petición fallida una única vez antes de marcar error.
- **EARS-UWB-03:** SI se pierde la conexión a Internet o SIIGO devuelve `429 Too Many Requests` o `503 Service Unavailable`, ENTONCES el sistema conservará la factura en estado `ERROR_REINTENTO` con cálculo de retroceso exponencial y jitter, garantizando que ninguna venta se pierda.

### 2.4 Requisitos Basados en Estado (State-Driven Requirements)
- **EARS-STA-01:** MIENTRAS el sistema se encuentre en `Modo Simulación / Sandbox`, las solicitudes a SIIGO generarán respuestas estructuralmente idénticas a la API oficial con identificadores virtuales `SIM-SIIGO-*` y prefijo `FEVP-`, permitiendo pruebas y capacitación de cajeros sin timbrar documentos reales en la DIAN.
- **EARS-STA-02:** MIENTRAS el token de acceso sea válido y falten más de 10 minutos para su expiración, el sistema reutilizará el token en memoria sin generar llamadas redundantes al endpoint de autenticación.

---

## 3. Modelado Multi-Fase de Sistemas (5 Diagramas Mermaid Canónicos)

### 3.1 Diagrama 1: Flujo de Procesos y Ciclo de Vida (`1_process_flowcharts`)
```mermaid
flowchart TD
    Start([Venta POS Finalizada con Factura Electrónica]) --> Enqueue[Encolar en Outbox: caja_outbox_v2 con hash idempotente]
    Enqueue --> WorkerTrigger{BackgroundSyncWorker activo y Online?}
    
    WorkerTrigger -- No --> WaitQueue[Permanecer en IndexedDB PENDIENTE]
    WorkerTrigger -- Sí --> FetchFIFO[Obtener siguiente ítem PENDIENTE en orden FIFO]
    
    FetchFIFO --> CheckAuth{Token Bearer en memoria vigente?}
    CheckAuth -- No / Expirado --> AuthReq[Llamada POST /auth con username & access_key]
    AuthReq --> AuthSuccess{¿Autenticación exitosa?}
    AuthSuccess -- No --> MarkAuthError[Marcar ERROR_REINTENTO: Credenciales/Red]
    AuthSuccess -- Sí --> SaveToken[Almacenar Token Bearer con TTL 24h]
    SaveToken --> DispatchInvoice
    CheckAuth -- Sí --> DispatchInvoice[POST /v1/invoices con Payload Siigo y Bearer Token]
    
    DispatchInvoice --> HttpRespStatus{Código de Respuesta HTTP}
    
    HttpRespStatus -- 200/201 Creado --> ParseFiscal[Extraer CUFE, QR URL, ID Factura y Consecutivo]
    ParseFiscal --> UpdateStore[Actualizar useResolucionStore y marcar Outbox SINCRONIZADO]
    UpdateStore --> SuccessEnd([Factura Electrónica Validada en SIIGO / DIAN])
    
    HttpRespStatus -- 400 Bad Request --> FatalDataError[Marcar ERROR_FATAL_DATOS en Outbox]
    FatalDataError --> IsolateQueue[Aislar ítem y continuar con la siguiente factura]
    
    HttpRespStatus -- 401 Unauthorized --> RefreshToken[Invalidar Token + Reintentar 1 vez]
    
    HttpRespStatus -- 429 / 5xx / Timeout --> BackoffCalc[Calcular Retroceso Exponencial con Jitter]
    BackoffCalc --> MarkRetry[Marcar ERROR_REINTENTO con fecha de próximo intento]
```

---

### 3.2 Diagrama 2: Lógica de Decisiones y Casos de Borde (`2_decision_logic_diagrams`)
```mermaid
flowchart TD
    NodeA([Entrada a SiigoHttpDispatcher.transmitir]) --> NodeB{¿Modo Sandbox o Credenciales Vacías?}
    
    NodeB -- Sí (Sandbox) --> NodeC[Generar Respuesta Virtual Simulada: CUFE ficticio y QR VPFE]
    NodeC --> NodeD([Retornar TransmitterResult Exitoso Simulado])
    
    NodeB -- No (Producción) --> NodeE{¿Existe Conectividad ONLINE según Heartbeat?}
    NodeE -- No (Offline) --> NodeF[Lanzar NetworkOfflineError: No intentar HTTP]
    
    NodeE -- Sí (Online) --> NodeG{¿Existe Token Bearer Activo con margen > 10m?}
    NodeG -- No --> NodeH{¿Hay renovación de token en curso en paralelo?}
    NodeH -- Sí --> NodeI[Esperar promesa activa del mutex de autenticación]
    NodeH -- No --> NodeJ[Iniciar petición POST /auth y bloquear mutex]
    NodeJ --> NodeK{¿Respuesta /auth 200 OK?}
    NodeK -- No --> NodeL[Lanzar SiigoAuthException: Credenciales inválidas]
    NodeK -- Sí --> NodeM[Guardar nuevo access_token y liberar mutex]
    
    NodeI --> NodeN[Token disponible]
    NodeM --> NodeN
    NodeG -- Sí --> NodeN
    
    NodeN --> NodeO[Ejecutar Axios POST /v1/invoices con timeout 10.000 ms]
    NodeO --> NodeP{¿Respuesta HTTP?}
    
    NodeP -- Status 201 --> NodeQ{¿Contiene stamp.cufe?}
    NodeQ -- Sí --> NodeR[Extraer datos fiscales completos]
    NodeQ -- No --> NodeS[Tratar como timbrado asíncrono pendiente de DIAN]
    
    NodeP -- Status 400 --> NodeT{¿Error de duplicidad o idempotencia previa?}
    NodeT -- Sí (Ya existe) --> NodeU[Consultar factura existente y recuperar CUFE]
    NodeT -- No (Datos inválidos) --> NodeV[Lanzar SiigoFatalDataException: Rechazo DIAN]
    
    NodeP -- Status 401 --> NodeW{¿Ya se reintentó refresco de token?}
    NodeW -- No --> NodeX[Forzar re-autenticación y reintentar llamada]
    NodeW -- Sí --> NodeY[Lanzar SiigoAuthException persistente]
    
    NodeP -- Status 429 / 500 / 503 / NetworkError --> NodeZ[Lanzar SiigoTransientException: Reintentable con backoff]
```

---

### 3.3 Diagrama 3: Modelo Entidad-Relación (`3_entity_relationship_diagrams`)
```mermaid
erDiagram
    SIIGO_CREDENTIALS_CONFIG {
        string id PK "Identificador único de configuración"
        string tenantId "Aislamiento multi-inquilino"
        string username "Correo corporativo registrado en SIIGO"
        string accessKeyEncrypted "Clave API de acceso generada en SIIGO Nube"
        boolean isSandbox "Flag para forzar modo simulación local"
        string partnerId "Partner ID de integración oficial"
        string tokenEnMemoria "Access token Bearer en tiempo de ejecución"
        datetime tokenExpiracion "Timestamp de expiración del token"
        datetime ultimaPruebaConexion "Fecha del último ping exitoso"
    }

    OFFLINE_OUTBOX_ITEM {
        string id PK "UUID del elemento en cola"
        string idempotencyKey UK "Hash determinista (SHA-256)"
        string ventaId FK "Referencia a la venta POS o remisión B2B"
        string tipoOperacion "FACTURA_ELECTRONICA_SIIGO"
        string consecutivoInterno "Ej: VTA-1045"
        string consecutivoFiscal "Ej: FEVP-502"
        string estado "PENDIENTE, EN_PROCESO, SINCRONIZADO, ERROR_REINTENTO, ERROR_FATAL_DATOS"
        int intentos "Número de envíos ejecutados"
        int maxIntentos "Límite máximo (5)"
        json payload "Payload JSON mapeado para /v1/invoices"
        json respuestaFiscal "Datos fiscales retornados por SIIGO/DIAN"
        datetime proximoReintentoEn "Fecha calculada con backoff y jitter"
        string ultimoError "Detalle del error devuelto por la API"
    }

    RESOLUCION_VENTA {
        string id PK "UUID de la resolución"
        string prefijo "FEVP, VTA, etc."
        string tipo "FACTURA_ELECTRONICA_DIAN, CONTROL_INTERNO"
        int consecutivoActual "Último consecutivo emitido"
        int siigoDocumentId "ID del tipo de comprobante en SIIGO"
        int rangoDesde "Inicio del rango autorizado DIAN"
        int rangoHasta "Fin del rango autorizado DIAN"
        date fechaVencimiento "Vigencia legal autorizada por DIAN"
        boolean activa "Estado activo/inactivo"
    }

    FACTURA_ELECTRONICA_REGISTRO {
        string id PK "UUID del registro fiscal inmutable"
        string ventaId FK "Venta de origen"
        string resolucionId FK "Resolución DIAN aplicada"
        string consecutivoCompleto "Ej: FEVP-1542"
        string cufe "Código Único de Facturación Electrónica"
        string qrUrl "Enlace oficial a la consulta pública DIAN"
        string siigoInvoiceId "ID único de factura generado en SIIGO"
        string estadoSiigo "SINCRONIZADO, ERROR_FATAL, PENDIENTE"
        datetime fechaSincronizacion "Momento exacto del timbrado fiscal"
    }

    SIIGO_DISPATCH_LOG {
        string id PK "UUID del log de auditoría"
        string outboxItemId FK "Referencia al ítem de outbox"
        string httpMethod "POST"
        string endpoint "/v1/invoices o /auth"
        int httpStatusCode "201, 400, 401, 500, etc."
        int duracionMs "Tiempo de respuesta en milisegundos"
        json payloadEnviado "Payload sanitizado (sin claves)"
        json respuestaRecibida "Respuesta de la API de SIIGO"
        datetime timestamp "Fecha y hora del intento"
    }

    SIIGO_CREDENTIALS_CONFIG ||--o{ OFFLINE_OUTBOX_ITEM : "autentica despacho de"
    OFFLINE_OUTBOX_ITEM ||--|| FACTURA_ELECTRONICA_REGISTRO : "materializa en"
    RESOLUCION_VENTA ||--o{ FACTURA_ELECTRONICA_REGISTRO : "rige numeración de"
    OFFLINE_OUTBOX_ITEM ||--o{ SIIGO_DISPATCH_LOG : "genera registros de intento en"
```

---

### 3.4 Diagrama 4: Diagrama de Secuencia Temporal (`4_sequence_diagrams`)
```mermaid
sequenceDiagram
    autonumber
    participant Worker as BackgroundSyncWorker
    participant Outbox as OutboxSyncService (IndexedDB)
    participant Dispatcher as SiigoHttpDispatcher
    participant Auth as SiigoAuthService
    participant SiigoApi as SIIGO Nube API v2 (/v1/)
    participant Dian as DIAN (Validación Previa)
    participant Store as useResolucionStore

    Note over Worker, Dian: Ciclo de Sincronización Automática en Segundo Plano (Online)
    Worker->>Outbox: getItemsPendientes() [FIFO ordenado por fecha]
    Outbox-->>Worker: [item1 (FACTURA_ELECTRONICA_SIIGO)]
    Worker->>Outbox: updateItemEstado(item1.id, 'EN_PROCESO')

    Worker->>Dispatcher: transmitir(item1)
    
    Dispatcher->>Auth: getValidBearerToken()
    alt Token en memoria vigente
        Auth-->>Dispatcher: Bearer eyJhbGciOi...
    else Token vencido o inexistente
        Auth->>SiigoApi: POST /auth { username, access_key }
        SiigoApi-->>Auth: 200 OK { access_token, expires_in: 86400 }
        Auth-->>Dispatcher: Bearer eyJhbGciOi...
    end

    Dispatcher->>SiigoApi: POST /v1/invoices con Payload JSON y Bearer Token
    activate SiigoApi
    SiigoApi->>Dian: Timbrado y Validación Fiscal Electrónica
    Dian-->>SiigoApi: Aprobado { CUFE, QR, Consecutivo Fiscal }
    SiigoApi-->>Dispatcher: 201 Created { id: "siigo-uuid", name: "FEVP-502", stamp: { cufe, qr } }
    deactivate SiigoApi

    Dispatcher-->>Worker: TransmitterResult { cufe, qrUrl, siigoInvoiceId, numeroFiscal }
    
    Worker->>Store: actualizarEstadoSincronizacion(item1.ventaId, fiscalData)
    Worker->>Outbox: updateItemEstado(item1.id, 'SINCRONIZADO', fiscalData)
    Worker->>Worker: notifyComplete({ processed: 1, succeeded: 1, failed: 0 })
```

---

### 3.5 Diagrama 5: Arquitectura de Componentes por Capas (`5_component_architecture_diagrams`)
```mermaid
flowchart TD
    subgraph UI_Layer [Capa de Presentación & Ergonomía Táctil - Regla 12 Años]
        CompA[SiigoConfigModal.tsx: Configuración de Credenciales & Test Ping]
        CompB[SiigoStatusBadge.tsx: Badge Semáforo Conexión SIIGO]
        CompC[SiigoQueueMonitorModal.tsx: Monitor de Facturas & Reintento Manual]
    end

    subgraph Logic_Layer [Capa de Lógica de Negocio & Orquestación]
        LogicA[SiigoAuthService: Manejo de Tokens, Expiración y Mutex]
        LogicB[SiigoHttpDispatcher: Transmisor HTTP, Mapeo de Respuestas y Errores]
        LogicC[BackgroundSyncWorker: Despachador en Segundo Plano y Heartbeat]
        LogicD[SiigoSimulationEngine: Motor de Emulación Virtual para Sandbox]
    end

    subgraph Store_Layer [Capa de Estado Reactivo & Caché Local]
        StoreA[useResolucionStore: Resoluciones, Numeración Dual y Consecutivos]
        StoreB[useSiigoConfigStore: Parámetros de Integración & Modo Sandbox]
    end

    subgraph Data_Network_Layer [Capa de Persistencia & Transporte de Red]
        DataA[OutboxSyncService: IndexedDB caja_outbox_v2]
        DataB[AxiosClient: HTTP Transport con Timeouts y Headers]
        DataC[NetworkConnectivityService: Detección Online/Offline]
    end

    CompA --> StoreB
    CompA --> LogicA
    CompB --> StoreB
    CompC --> StoreA
    CompC --> LogicC

    LogicC --> LogicB
    LogicB --> LogicA
    LogicB --> LogicD
    LogicB --> DataB
    LogicC --> DataA
    LogicC --> DataC
    LogicC --> StoreA

    LogicA --> StoreB
    LogicA --> DataB
```

---

## 4. Criterios de Aceptación y Quality Gate (Métrica de Éxito)

1. **Autenticación e Idempotencia:**
   - Adquisición de token Bearer mediante `POST /auth`.
   - Caché en memoria con deduplicación de peticiones concurrentes (Mutex/Promise caching).
   - Manejo de token con TTL y renovación automática transparente ante código 401.
2. **Transmisión y Despacho:**
   - Implementación de `SiigoHttpDispatcher` conforme a la interfaz `OutboxTransmitterFn` de `BackgroundSyncWorker`.
   - Envío de comprobantes a `POST /v1/invoices` con mapeo exacto de items, cliente, impuestos y métodos de pago.
3. **Resiliencia ante Fallos:**
   - Errores 400 catalogados como `ERROR_FATAL_DATOS` sin detener la cola de ventas.
   - Errores de red, 429 y 5xx catalogados como `ERROR_REINTENTO` con retroceso exponencial.
4. **Modo Simulación / Sandbox:**
   - Ejecución 100% libre de fallos cuando no existen credenciales configuradas o se activa el flag `isSandbox`.
5. **Calidad de Código y Estándares:**
   - 0 dependencias externas añadidas (RULE-SDD-001; utiliza `axios` existente).
   - `tsc --noEmit` en 0 errores.
   - Auditoría Master Architect SOLID con 0 violaciones críticas (`passed = true`).
   - Cobertura de pruebas unitarias TDD $\ge 90\%$ con Vitest.
   - Verificación en vivo con Chrome DevTools (0 errores en consola JS).

---

*Fin del documento de especificación técnica formal SPEC-025.*
