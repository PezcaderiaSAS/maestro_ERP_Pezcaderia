# SPEC-058 Checklist de Calidad y Seguridad (`/speckit.checklist`)

## 1. Configuración y Carga de Entorno (`REQ-01`, `REQ-08`)
- [x] `scripts/daemon/env.cjs` no utiliza dependencias npm externas (`fs` + `path` únicamente).
- [x] Carga `.env` y luego `.env.local` (permitiendo que `.env.local` sobrescriba `.env`) sin sobrescribir variables ya presentes en `process.env` al arranque (PM2 / shell).
- [x] Soporta saltos CRLF (`\r\n`), comentarios `#`, prefijo opcional `export `, y comillas simples/dobles envolventes sin corromper tokens que contengan `=`.
- [x] Expone `loadDaemonEnv()` idempotente (o con flag `force`) invocada antes de leer configuraciones en `cli.cjs`, `supervisor.cjs`, `worker.cjs`, `webhook-server.cjs` y `audit-runner.cjs`.
- [x] `.env.example` documenta `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE`, `EVOLUTION_WEBHOOK_SECRET`, `EVOLUTION_API_VERSION`, `WHATSAPP_ADMIN_PHONES`, `WHATSAPP_WEBHOOK_PORT`, `DAEMON_SDD_DRY_RUN` y `DAEMON_TSC_TIMEOUT_MS`.

## 2. Seguridad del Webhook y Anti-Bucle (`REQ-02`, `REQ-03`, `REQ-04`)
- [x] Endpoints aceptados: `/api/whatsapp/webhook` y `/api/whatsapp/webhook/messages-upsert` (`GET` y `POST`).
- [x] Comparación en tiempo constante (`crypto.timingSafeEqual`, incluyendo control de longitud distinta) para `apikey`, `x-webhook-secret`, `authorization: Bearer <token>` y `payload.apikey`.
- [x] Se mantiene compatibilidad 100% regresiva con `X-Hub-Signature-256` (Meta Graph API y `whatsapp-simulator.cjs`) y se rechaza `POST` sin credencial válida con `HTTP 401`.
- [x] Mensajes con `data.key.fromMe === true` son descartados antes de parsear comandos o enviar respuestas (prevención de bucle infinito).
- [x] Mensajes de grupos (`remoteJid` terminado en `@g.us`) son descartados antes de ejecutar comandos.
- [x] Normalización de teléfono extrae dígitos desde `remoteJidAlt` (preferido si existe en Evolution v2 LID) o `remoteJid`, limpiando `@s.whatsapp.net`, `@c.us`, `@lid` y `:device`.
- [x] Solo números listados en `WHATSAPP_ADMIN_PHONES` pueden mutar `.daemon/state.json` (**endurecido fail-closed**: si `WHATSAPP_ADMIN_PHONES` está vacío o no configurado, bloquea con `ADMIN_PHONES_NOT_CONFIGURED`).
- [x] Idempotencia (`dedupCache` TTL 24h) evita re-ejecución ante reintentos de Evolution API.

## 3. Respuesta Bidireccional Evolution API (`REQ-05`)
- [x] `sendEvolutionText({ number, text, config })` usa `http` / `https` nativo hacia `POST {EVOLUTION_API_URL}/message/sendText/{EVOLUTION_INSTANCE}` con cabecera `apikey: {EVOLUTION_API_KEY}`.
- [x] Envía body `{ number, text }` para Evolution v2 (y `{ number, textMessage: { text } }` solo si `EVOLUTION_API_VERSION === 'v1'`).
- [x] Se ejecuta de forma asíncrona tras responder `HTTP 200 OK` al webhook y tiene timeout `8000` ms para nunca colgar el loop del daemon.
- [x] Errores de red o HTTP >= 400 se registran vía `logger.warn` sin derribar el worker ni romper la cola Kanban.

## 4. Resiliencia del Worker y Auditor (`REQ-06`, `REQ-07`, `REQ-08`)
- [x] `audit-runner.cjs` lee `DAEMON_TSC_TIMEOUT_MS` con valor por defecto `90000` ms.
- [x] `worker.cjs` lee dinámicamente `DAEMON_SDD_DRY_RUN` en cada despacho: `true` por defecto si no es `'false'`.
- [x] `cli.cjs start` advierte si faltan credenciales de Evolution API o `WHATSAPP_ADMIN_PHONES`, y el sistema permanece `STOPPED` hasta vinculación QR y autorización del usuario para `npm run daemon:start`.
- [x] Stack Docker local Evolution API v2.3.7 (`docker-compose.evolution.yml` + `scripts/daemon/evolution-bootstrap.cjs`) aprovisionado e idempotente (`maestro-evolution-api`, `maestro-evolution-postgres`, `maestro-evolution-redis` en estado `healthy`), con credenciales locales en `.env.local` (ignorado por Git).
- [x] Suite `npx vitest run tests/daemon/daemon-control-loop.test.ts` (48/48) y `npx tsc --noEmit` al `100%` en verde.
- [ ] Pendiente de intervención humana: definir `WHATSAPP_ADMIN_PHONES` real en `.env.local`, escanear QR de `maestro_pescaderia` y ejecutar `npm run daemon:start`.

