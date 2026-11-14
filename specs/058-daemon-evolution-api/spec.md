# SPEC-058: Adaptador Bidireccional Evolution API v1/v2 y Robustecimiento del Daemon 24/7

- **Estado:** Borrador para Aprobación Humana (`/speckit.specify` - SDD v3.0)
- **Fecha:** 2026-11-11
- **Módulo:** `scripts/daemon/` (`webhook-server.cjs`, `worker.cjs`, `audit-runner.cjs`, `cli.cjs`, `supervisor.cjs`, `env.cjs`)
- **Referencias Arquitectónicas:**
  - Reporte Swarm + Harness²: `specs/sdd_verification_reports/sdd_bridge_coexecution_20261111_134029.json`
  - Infraestructura existente: `scripts/daemon/*`, `ecosystem.config.cjs`, `tests/daemon/daemon-control-loop.test.ts`, `DOCS/AUTONOMOUS_KANBAN.md`

---

## 1. Contexto, Problema y Alcance ("Qué" y "Por qué")

### 1.1 Motivación de Negocio e Ingeniería
El daemon autónomo 24/7 (`maestro-control-loop`) ya opera bajo el patrón Infinite Control Loop con cola Kanban WIP = 1 (`scripts/daemon/state.cjs`) y auditoría continua de 4 niveles (`scripts/daemon/audit-runner.cjs`). Sin embargo, la capa actual de control remoto vía WhatsApp (`scripts/daemon/webhook-server.cjs`) fue implementada asumiendo exclusivamente la **API directa de Meta Graph**, lo cual impone fricciones operativas (validación estricta de Meta Business, ausencia de envío saliente hacia WhatsApp y falta de carga automática de variables `.env`).

Adicionalmente, el diagnóstico del ciclo `#55` evidenció tres brechas técnicas que impiden pasar el daemon a operación productiva continua con **Evolution API**:
1. **Acoplamiento exclusivo a Meta Graph API:** `webhook-server.cjs` exige firma `X-Hub-Signature-256` en todas las peticiones `POST`, lee constantes de entorno estáticas al momento del `require()` y no parsea eventos `messages.upsert` ni responde vía HTTP hacia Evolution API (`/message/sendText/{instance}`).
2. **Ausencia de cargador `.env` / `.env.local`:** El proyecto no instala `dotenv` en `package.json`, por lo que `scripts/daemon/` ignora variables declaradas en `.env` o `.env.local` si se inicia fuera de un shell pre-exportado.
3. **Timeout insuficiente en `tsc` y ejecución bloqueada en simulación:** `scripts/daemon/audit-runner.cjs` corta `npx tsc --noEmit` a los `30000` ms (generando falsos positivos `TypeScript: FAIL` bajo carga), y `scripts/daemon/worker.cjs` fija `dispatchTaskToBridge(startResult.task, true)` sin bandera configurable por entorno.

### 1.2 Objetivos (In-Scope)
- Cargar `.env` y `.env.local` sin dependencias externas (`scripts/daemon/env.cjs`) respetando variables explícitas del sistema operativo / PM2.
- Adaptar `scripts/daemon/webhook-server.cjs` para recibir webhooks de **Evolution API v1/v2** (`messages.upsert` / `MESSAGES_UPSERT`) en `/api/whatsapp/webhook` y `/api/whatsapp/webhook/messages-upsert`, manteniendo compatibilidad regresiva con firmas HMAC-SHA256 de Meta y `scripts/daemon/whatsapp-simulator.cjs`.
- Implementar validación segura en tiempo constante (`crypto.timingSafeEqual`) mediante `apikey` / `x-webhook-secret` / `Authorization: Bearer` y protección anti-bucle ignorando mensajes propios (`fromMe === true`) o de grupos (`@g.us`).
- Enviar respuestas automáticas por WhatsApp mediante `POST {EVOLUTION_API_URL}/message/sendText/{EVOLUTION_INSTANCE}` de forma asíncrona y tolerante a fallos sin bloquear el ACK `200` del webhook.
- Hacer configurable el timeout de `npx tsc --noEmit` (por defecto `90000` ms via `DAEMON_TSC_TIMEOUT_MS`) y el modo `--dry-run` del puente SDD (`DAEMON_SDD_DRY_RUN`).
- Mantener el daemon apagado (`STOPPED`) hasta completar pruebas unitarias/integración y recibir las credenciales reales del usuario en `.env` / `.env.local`.

### 1.3 Fuera de Alcance (Out-of-Scope)
- No desplegar ni instalar servidores Docker nuevos de Evolution API (el usuario conectará su instancia Evolution existente local o VPS).
- No persistir conversaciones en tablas Supabase (`whatsapp_messages`); el estado sigue siendo 100% local en Node.js CommonJS (`.daemon/state.json` + logs JSONL) a costo `$0`.
- No ejecutar `npm run daemon:start` antes de configurar credenciales reales verificadas.

---

## 2. Requisitos Funcionales y de Calidad (Notación EARS)

| ID | Tipo EARS | Especificación Verificable |
| :--- | :--- | :--- |
| **REQ-01** | Ubiquitous | El módulo `scripts/daemon/env.cjs` **debe** cargar pares clave-valor desde `.env` y `.env.local` sin dependencias npm externas antes de que `cli.cjs`, `supervisor.cjs`, `worker.cjs` y `webhook-server.cjs` lean `process.env`, permitiendo que `.env.local` sobrescriba `.env` sin sobrescribir variables ya definidas explícitamente en el entorno del proceso padre. |
| **REQ-02** | Event-Driven | **Cuando** Evolution API envíe una petición `POST` a `/api/whatsapp/webhook` o `/api/whatsapp/webhook/messages-upsert`, `webhook-server.cjs` **debe** autenticar el secreto compartido (`EVOLUTION_WEBHOOK_SECRET` o `EVOLUTION_API_KEY`) en tiempo constante vía cabeceras `apikey`, `x-webhook-secret`, `authorization` o propiedad `payload.apikey`, rechazando con `401` cualquier petición sin credencial válida (salvo cuando incluya una firma Meta `X-Hub-Signature-256` válida contra `WHATSAPP_APP_SECRET`). |
| **REQ-03** | Unwanted Behavior | **Si** un evento `messages.upsert` contiene `key.fromMe === true` o un remitente de grupo (`remoteJid` terminado en `@g.us`), `webhook-server.cjs` **debe** descartarlo inmediatamente antes de evaluar comandos o emitir respuestas para prevenir bucles infinitos de auto-respuesta y comandos desde chats grupales. |
| **REQ-04** | Event-Driven | **Cuando** llegue un evento `messages.upsert` (o `MESSAGES_UPSERT`) válido en formato objeto o arreglo, `webhook-server.cjs` **debe** extraer el texto desde `message.conversation`, `message.extendedTextMessage.text`, `message.imageMessage.caption` o `message.documentMessage.caption`, normalizar el número desde `key.remoteJidAlt` o `key.remoteJid` (eliminando sufijos `@s.whatsapp.net`, `@c.us`, `@lid` y caracteres no numéricos) y verificar pertenencia a `WHATSAPP_ADMIN_PHONES`. |
| **REQ-05** | State-Driven | **Mientras** `EVOLUTION_API_URL`, `EVOLUTION_API_KEY` y `EVOLUTION_INSTANCE` estén configurados, **cuando** un comando válido (`ESTADO`, `AUDITAR`, `ORDEN`, `EJECUTAR`, `APROBAR`, `RECHAZAR`, `TAREA`, `PAUSAR`, etc.) produzca resultado, `webhook-server.cjs` **debe** despachar la respuesta textual por HTTP/HTTPS (`POST {EVOLUTION_API_URL}/message/sendText/{EVOLUTION_INSTANCE}`) en segundo plano con timeout acotado (`8000` ms) sin bloquear la respuesta `200 OK` al servidor webhook. |
| **REQ-06** | Ubiquitous | `scripts/daemon/audit-runner.cjs` **debe** ejecutar `npx tsc --noEmit` con un timeout configurable mediante `DAEMON_TSC_TIMEOUT_MS` cuyo valor por defecto sea `90000` ms en reemplazo de `30000` ms. |
| **REQ-07** | State-Driven | `scripts/daemon/worker.cjs` **debe** leer dinámicamente `DAEMON_SDD_DRY_RUN` en cada despacho (`startResult.started`): utilizar simulación (`dryRun = true`) por defecto mientras la variable no sea `'false'`, y ejecutar el puente SDD completo (`dryRun = false`) únicamente cuando `DAEMON_SDD_DRY_RUN === 'false'`. |
| **REQ-08** | Conditional | **Si** `cli.cjs start` se invoca sin `EVOLUTION_API_URL`, `EVOLUTION_API_KEY` o `EVOLUTION_INSTANCE` configurados, **debe** emitir una advertencia explícita indicando modo pasivo (solo HTTP local) sin fallar en arranques de diagnóstico, pero el protocolo operativo exige confirmación y credenciales reales en `.env` antes de iniciar `npm run daemon:start` en producción 24/7. |

---

## 3. Modelado del Sistema Multi-Fase (5 Diagramas Mermaid Obligatorios)

### 3.1 Diagrama de Flujo de Procesos (`1_process_flowcharts`)
```mermaid
flowchart TD
    A["Inicio CLI o Supervisor"] --> B["Cargar env.cjs (.env y .env.local)"]
    B --> C["Iniciar Webhook HTTP en puerto WHATSAPP_WEBHOOK_PORT (3005)"]
    B --> D["Programar ciclo Worker cada CYCLE_INTERVAL_SECONDS"]
    C --> E["Recibir POST /api/whatsapp/webhook o /messages-upsert"]
    E --> F["Autenticar Evolution apikey o Meta X-Hub-Signature-256"]
    F --> G["Parsear payload y aplicar deduplicacion 24h"]
    G --> H["Validar fromMe falso, DM individual y WHATSAPP_ADMIN_PHONES"]
    H --> I["Parsear comando con command-parser.cjs y mutar state.json"]
    I --> J["Responder HTTP 200 OK inmediato a Evolution API"]
    I --> K["Despachar reply asincrono via POST /message/sendText/{instance}"]
    D --> L["Ejecutar auditoria 4 niveles (tsc timeout 90000 ms)"]
    L --> M["Despachar siguiente tarea autorizada WIP igual 1"]
    M --> N["Evaluar DAEMON_SDD_DRY_RUN y llamar SDD Bridge"]
```

### 3.2 Diagrama de Lógica de Decisión (`2_decision_logic_diagrams`)
```mermaid
flowchart TD
    A["Peticion HTTP POST entrante"] --> B{"Ruta valida (/api/whatsapp/webhook o /messages-upsert)?"}
    B -- No --> B1["Responder HTTP 404 Not Found"]
    B -- Si --> C{"Tiene apikey/x-webhook-secret valido en tiempo constante?"}
    C -- Si --> E["Autorizado Evolution API"]
    C -- No --> D{"Tiene X-Hub-Signature-256 valida con WHATSAPP_APP_SECRET?"}
    D -- No --> D1["Responder HTTP 401 Unauthorized y log WARN"]
    D -- Si --> E2["Autorizado Meta / Simulator"]
    E --> F["Extraer mensajes messages.upsert"]
    E2 --> F
    F --> G{"key.fromMe === true?"}
    G -- Si --> G1["Ignorar para evitar bucle infinito"]
    G -- No --> H{"remoteJid termina en @g.us (grupo)?"}
    H -- Si --> H1["Ignorar mensaje grupal"]
    H -- No --> I{"ID ya visto en dedupCache (TTL 24h)?"}
    I -- Si --> I1["Omitir duplicado"]
    I -- No --> J{"Numero normalizado esta en WHATSAPP_ADMIN_PHONES?"}
    J -- No --> J1["Registrar rechazo WARN y omitir"]
    J -- Si --> K["Ejecutar comando en state.cjs"]
    K --> L{"EVOLUTION_API_URL, KEY e INSTANCE configurados?"}
    L -- Si --> M["Enviar respuesta por Evolution sendText"]
    L -- No --> N["Registrar solo en respuesta HTTP y logs"]
```

### 3.3 Diagrama Entidad-Relación del Estado Local y Contratos (`3_entity_relationship_diagrams`)
```mermaid
erDiagram
    DAEMON_ENV_CONFIG {
        string EVOLUTION_API_URL
        string EVOLUTION_API_KEY
        string EVOLUTION_INSTANCE
        string EVOLUTION_WEBHOOK_SECRET
        string WHATSAPP_ADMIN_PHONES
        number WHATSAPP_WEBHOOK_PORT
        boolean DAEMON_SDD_DRY_RUN
        number DAEMON_TSC_TIMEOUT_MS
    }
    EVOLUTION_WEBHOOK_EVENT {
        string event
        string instance
        string apikey
        boolean fromMe
        string remoteJid
        string remoteJidAlt
        string messageId
        string textContent
    }
    DAEMON_STATE_FILE {
        string status
        number supervisorPid
        number workerPid
        string lastHeartbeat
        string activeTaskId
    }
    KANBAN_TASK {
        string id PK
        number numericIndex
        string title
        string role
        boolean authorized
        number priorityOrder
        string source
    }
    DEDUP_ENTRY {
        string messageId PK
        number expiresAtEpochMs
    }
    EVOLUTION_OUTBOUND_TEXT {
        string instance
        string number
        string text
        number statusCode
    }

    DAEMON_ENV_CONFIG ||--o{ EVOLUTION_WEBHOOK_EVENT : "autentica_y_filtra"
    EVOLUTION_WEBHOOK_EVENT ||--o| DEDUP_ENTRY : "verifica_idempotencia"
    EVOLUTION_WEBHOOK_EVENT ||--o{ KANBAN_TASK : "reordena_autoriza_o_crea"
    DAEMON_STATE_FILE ||--o{ KANBAN_TASK : "persiste_en_queue"
    EVOLUTION_WEBHOOK_EVENT ||--o| EVOLUTION_OUTBOUND_TEXT : "genera_confirmacion"
```

### 3.4 Diagrama de Secuencia Temporal (`4_sequence_diagrams`)
```mermaid
sequenceDiagram
    actor Admin as Administrador WhatsApp
    participant Evo as Evolution API (Local/VPS)
    participant WH as webhook-server.cjs (Puerto 3005)
    participant Parser as command-parser.cjs
    participant State as state.cjs (.daemon/state.json)
    participant Worker as worker.cjs / audit-runner.cjs

    Admin->>Evo: Envia "EJECUTAR #12"
    Evo->>WH: POST /api/whatsapp/webhook (header apikey, event messages.upsert)
    WH->>WH: Validar apikey con timingSafeEqual
    WH->>WH: Verificar fromMe=false, no grupo, dedup 24h y WHATSAPP_ADMIN_PHONES
    WH->>Parser: parseCommand("EJECUTAR #12")
    Parser-->>WH: { type: "EJECUTAR", taskNumber: 12 }
    WH->>State: authorizeTask(12) + reorderQueue(...)
    State-->>WH: Tarea autorizada y guardada atomica
    WH-->>Evo: HTTP 200 OK { status: "ok", processed: 1 }
    WH->>Evo: POST /message/sendText/{instance} (header apikey, number, text)
    Evo-->>Admin: Recibe confirmacion WhatsApp de ejecucion
    Worker->>State: startNextTask() en proximo tick (WIP = 1)
    Worker->>Worker: Leer DAEMON_SDD_DRY_RUN y ejecutar audit-runner.dispatchTaskToBridge()
```

### 3.5 Diagrama de Arquitectura de Componentes por Capas (`5_component_architecture_diagrams`)
```mermaid
flowchart LR
    subgraph Capa_Configuracion["Capa Configuracion y Entorno"]
        ENV_FILES[".env y .env.local"]
        ENV_MOD["scripts/daemon/env.cjs"]
        ENV_EXAMPLE[".env.example"]
    end

    subgraph Capa_Integracion_WhatsApp["Capa Integracion Bidireccional WhatsApp"]
        EVO_SRV["Evolution API v1/v2 Externa"]
        WH_MOD["scripts/daemon/webhook-server.cjs"]
        CMD_MOD["scripts/daemon/command-parser.cjs"]
        SIM_MOD["scripts/daemon/whatsapp-simulator.cjs"]
    end

    subgraph Capa_Orquestacion_Control["Capa Orquestacion Infinite Loop"]
        CLI_MOD["scripts/daemon/cli.cjs"]
        SUP_MOD["scripts/daemon/supervisor.cjs"]
        WRK_MOD["scripts/daemon/worker.cjs"]
        AUD_MOD["scripts/daemon/audit-runner.cjs"]
    end

    subgraph Capa_Persistencia_Agencias["Capa Estado Local y Agencias IA"]
        STATE_MOD["scripts/daemon/state.cjs (.daemon/state.json)"]
        LOG_MOD["scripts/daemon/logger.cjs (logs/daemon)"]
        KANBAN_DOC["DOCS/AUTONOMOUS_KANBAN.md"]
        BRIDGE_PY["scripts/architecture/run_agency_sdd_bridge.py"]
    end

    ENV_FILES --> ENV_MOD
    ENV_MOD --> CLI_MOD
    ENV_MOD --> SUP_MOD
    ENV_MOD --> WRK_MOD
    ENV_MOD --> WH_MOD
    EVO_SRV <--> WH_MOD
    SIM_MOD --> WH_MOD
    WH_MOD --> CMD_MOD
    WH_MOD --> STATE_MOD
    CLI_MOD --> SUP_MOD --> WRK_MOD
    WRK_MOD --> WH_MOD
    WRK_MOD --> AUD_MOD
    AUD_MOD --> BRIDGE_PY
    STATE_MOD --> KANBAN_DOC
    WRK_MOD --> LOG_MOD
    WH_MOD --> LOG_MOD
```

---

## 4. Criterios de Aceptación y Checkpoint SDD
1. Ningún archivo de producción ha sido modificado durante `/speckit.specify`.
2. La especificación cubre compatibilidad Evolution API v1/v2 + Meta HMAC + carga `.env`/`.env.local` + prevención de auto-bucle (`fromMe`) + `tsc` 90s + `DAEMON_SDD_DRY_RUN`.
3. **Checkpoint humano:** Esperar confirmación del usuario sobre `SPEC-058` para avanzar a `/speckit.clarify` / `/speckit.plan` / `/speckit.tasks` / `/speckit.implement`.

