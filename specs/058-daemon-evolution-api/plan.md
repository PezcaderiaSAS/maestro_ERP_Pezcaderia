# SPEC-058 Plan Técnico de Implementación (`/speckit.plan`)

- **Especificación base:** [spec.md](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/specs/058-daemon-evolution-api/spec.md)
- **Principios:** Cero dependencias npm nuevas, arquitectura 100% local CommonJS (`scripts/daemon/*.cjs`), funciones puras y modulares (< 50 líneas por función cuando sea práctico), compatibilidad regresiva con pruebas y simulador existentes.

---

## 1. Diseño Modular por Archivo

### 1.1 `scripts/daemon/env.cjs` *(Nuevo módulo)*
- **Responsabilidad:** Cargar `.env` y `.env.local` desde la raíz del repositorio (`path.resolve(__dirname, '../../')`) sin librerías externas.
- **Lógica de precedencia:**
  1. Registrar `const protectedKeys = new Set(Object.keys(process.env))` al primer llamado (o aceptar `options.rootDir` para pruebas unitarias).
  2. Parsear `.env` si existe y asignar `process.env[k] = v` si `!protectedKeys.has(k)`.
  3. Parsear `.env.local` si existe y sobrescribir `process.env[k] = v` si `!protectedKeys.has(k)` (así `.env.local` gana sobre `.env`, pero `process.env` previo de PM2/shell/Vitest nunca se pisa).
- **Parser robusto:** Soporta comentarios (`# ...`), líneas vacías, CRLF, prefijo `export `, comillas dobles/simples (removiendo solo envolventes y decodificando `\n` en comillas dobles) y valores con múltiples `=`.

### 1.2 `scripts/daemon/webhook-server.cjs` *(Refactor + Adaptador Evolution API)*
- **Configuración dinámica:** Reemplazar constantes estáticas capturadas al `require()` por un helper `resolveRuntimeConfig(options)` que lee `process.env` dinámicamente tras llamar `loadDaemonEnv()`, permitiendo inyección de opciones en pruebas (`port`, `verifyToken`, `appSecret`, `evolutionApiUrl`, `evolutionApiKey`, `evolutionInstance`, `evolutionWebhookSecret`, `evolutionApiVersion`, `adminPhones`, `fetchImpl` / sender injectable o mock HTTP local).
- **Autenticación dual constante (`isAuthorizedPost`):**
  1. **Evolution Shared Secret (`safeCompare`):** Evaluar token candidato desde:
     - `req.headers['apikey']`
     - `req.headers['x-webhook-secret']`
     - `req.headers['authorization']` (limpiando `Bearer `)
     - `parsedBody?.apikey` (solo si el JSON se parsea y existe secreto configurado en Evolution)
     Validar contra `expectedEvolutionSecret = config.evolutionWebhookSecret || config.evolutionApiKey` usando `crypto.timingSafeEqual` seguro en longitud.
  2. **Meta HMAC-SHA256 Fallback (`verifySignature`):** Si existe `x-hub-signature-256`, validar con HMAC-SHA256 contra `config.appSecret` (`WHATSAPP_APP_SECRET`).
  3. **Regla estricta:** Si ninguno pasa -> responder `401 Unauthorized` + log `WARN`. (Nota: si `expectedEvolutionSecret` está vacío, una cabecera vacía no autentica; Meta HMAC sigue funcionando para tests existentes).
- **Rutas HTTP soportadas:**
  - `GET /health` -> JSON de salud/uptime.
  - `GET /api/whatsapp/webhook` y `GET /api/whatsapp/webhook/messages-upsert` -> handshake Meta / ping informativo (`200 OK` si Evolution ping sin `hub.mode`, `200 challenge` o `403` si `hub.mode === 'subscribe'`).
  - `POST /api/whatsapp/webhook` y `POST /api/whatsapp/webhook/messages-upsert` -> ingesta de eventos.
- **Extracción normalizada (`extractMessages(payload)`):**
  - **Eventos Evolution API v1/v2:** Normalizar `payload.event` (`String(payload.event || '').toLowerCase().replace(/[-_]/g, '.') === 'messages.upsert'`) para aceptar `messages.upsert`, `MESSAGES_UPSERT` y `MESSAGES-UPSERT`, así como payloads con `data.key`.
    - Soporta `payload.data` como objeto único o arreglo.
    - Para cada ítem:
      - Si `key.fromMe === true` -> registrar en resultado `{ ignored: true, reason: 'from_me' }` y omitir ejecución.
      - Determinar JID: `rawJid = key.remoteJidAlt || key.remoteJid || payload.sender || ''`.
      - Si `(key.remoteJid || '').endsWith('@g.us')` -> `{ ignored: true, reason: 'group_message' }`.
      - Normalizar teléfono: quitar `@...`, quitar sufijo `:device` de WhatsApp multi-device (`573001234567:12@s.whatsapp.net`), dejar dígitos (`replace(/\D/g, '')`).
      - Extraer texto de `message.conversation`, `message.extendedTextMessage.text`, `message.imageMessage.caption`, `message.documentMessage.caption`, o `message.buttonsResponseMessage.selectedDisplayText`.
      - Construir `{ id: key.id || ..., from: normalizedPhone, rawJid, text, source: 'evolution', fromMe: Boolean(key.fromMe) }`.
  - **Eventos Meta / Simulador:** Conserva intacta la extracción actual (`payload.entry[].changes[].value.messages[]` y fallback `{ from, text, id }`).
- **Respuesta Saliente Bidireccional (`sendEvolutionText` & `formatWhatsAppReply`):**
  - Construir mensaje claro y conciso para WhatsApp según `executionResult` (`STATUS`, `AUDIT`, `APPROVE`, `REJECT`, `REORDER`, `CUSTOM_TASK`, `PAUSE`, `RESUME`, `HELP`, `UNKNOWN`).
  - Despachar vía `http.request` / `https.request` a `POST ${baseUrl}/message/sendText/${encodeURIComponent(instance)}` con timeout `8000` ms, cabeceras `Content-Type: application/json` y `apikey: config.evolutionApiKey`, sin bloquear `res.end(JSON.stringify(...))`.

### 1.3 `scripts/daemon/audit-runner.cjs` *(Timeout `tsc` 90s)*
- Invocar `loadDaemonEnv()` al inicio.
- Reemplazar `timeout: 30000` en `execSync('npx tsc --noEmit', ...)` por `const tscTimeoutMs = Math.max(10000, parseInt(process.env.DAEMON_TSC_TIMEOUT_MS || '90000', 10) || 90000);`.
- Propagar distinción clara en el mensaje si `tsc` falla por timeout (`err.killed` / `ETIMEDOUT`) vs error real de compilación TS.

### 1.4 `scripts/daemon/worker.cjs` *(Modo `--dry-run` configurable + `.env`)*
- Invocar `loadDaemonEnv()` antes de importar configuraciones dependientes del entorno.
- Reemplazar `auditRunner.dispatchTaskToBridge(startResult.task, true)` por:
  `const isDryRun = process.env.DAEMON_SDD_DRY_RUN !== 'false';`
  `const bridgeResult = auditRunner.dispatchTaskToBridge(startResult.task, isDryRun);`
- Emitir notificación proactiva opcional por Evolution API (`webhookServer.sendEvolutionNotification`) cuando esté configurado Evolution API y una tarea inicie/complete o falle el bridge, respetando siempre `WHATSAPP_ADMIN_PHONES[0]`.

### 1.5 `scripts/daemon/cli.cjs`, `scripts/daemon/supervisor.cjs` y `.env.example`
- Cargar `require('./env.cjs').loadDaemonEnv()` al inicio de `cli.cjs` y `supervisor.cjs`.
- En `cli.cjs start`: verificar si faltan `EVOLUTION_API_URL`, `EVOLUTION_API_KEY` o `EVOLUTION_INSTANCE` y mostrar aviso claro en consola sobre la configuración faltante de WhatsApp bidireccional (modo HTTP local pasivo si no está configurada). En `cli.cjs status`: mostrar estado resumido de integración Evolution API configurada/no configurada sin exponer el valor de `EVOLUTION_API_KEY`.
- Actualizar `.env.example` añadiendo bloque `# 6. DAEMON AUTÓNOMO 24/7 & EVOLUTION API (WhatsApp)` sin incluir secretos reales.

### 1.6 `tests/daemon/daemon-control-loop.test.ts` *(Cobertura TDD SPEC-058)*
- Agregar suites unitarias e integración para:
  1. `env.cjs`: carga ordenada `.env` + `.env.local` sin pisar variables padre ni corromper `=`.
  2. Evolution API webhook `POST`: autenticación `apikey` / `x-webhook-secret`, rechazo `401` con secreto erróneo, ingesta `messages.upsert` en `/api/whatsapp/webhook` y `/api/whatsapp/webhook/messages-upsert`, soporte `remoteJidAlt` (LID), rechazo anti-bucle `fromMe: true`, rechazo grupo `@g.us`.
  3. Servidor HTTP mock local de Evolution API verificando entrega real de `POST /message/sendText/{instance}` con cabecera `apikey` y JSON `{ number, text }` tras comando `ESTADO`.
  4. `audit-runner.cjs`: verificación de configuración `DAEMON_TSC_TIMEOUT_MS` y `worker.cjs` respetando `DAEMON_SDD_DRY_RUN`.

---

## 2. Riesgos y Mitigaciones
- **Riesgo 1 — Fuga de credenciales en logs/respuestas:** Nunca registrar `EVOLUTION_API_KEY` ni `EVOLUTION_WEBHOOK_SECRET` en `logger.cjs` o respuestas HTTP.
- **Riesgo 2 — Bloqueo del webhook si Evolution API está caída:** El envío `sendEvolutionText` corre desacoplado de `res.end()` con timeout `8000` ms y `try/catch` / evento `error`.
- **Riesgo 3 — Ruptura de tests Meta HMAC actuales:** `verifySignature` y parsing de payloads Meta quedan intactos cuando llegan headers `X-Hub-Signature-256`.

