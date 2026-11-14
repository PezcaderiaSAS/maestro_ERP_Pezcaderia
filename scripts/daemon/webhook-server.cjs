/**
 * scripts/daemon/webhook-server.cjs
 * Native Node.js HTTP Webhook Server for Evolution API v1/v2 & Meta WhatsApp Cloud API.
 * Implements Evolution shared-secret auth + Meta HMAC-SHA256 verification (RN-21),
 * anti-loop protection (fromMe/@g.us), message deduplication (RN-22), and command dispatch.
 */

const http = require('http');
const https = require('https');
const url = require('url');
const crypto = require('crypto');
const { loadDaemonEnv } = require('./env.cjs');
const logger = require('./logger.cjs');
const stateMgr = require('./state.cjs');
const commandParser = require('./command-parser.cjs');

loadDaemonEnv();

function parseAdminPhones(rawPhones) {
  return String(rawPhones || '')
    .split(',')
    .map((p) => p.replace(/\D/g, '') || p.trim())
    .filter(Boolean);
}

const DEFAULT_PORT = parseInt(process.env.WHATSAPP_WEBHOOK_PORT || '3005', 10);
const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'la_pezcaderia_daemon_webhook_token_2026';
const APP_SECRET = process.env.WHATSAPP_APP_SECRET || 'test_meta_app_secret_12345';
const ADMIN_PHONES = parseAdminPhones(process.env.WHATSAPP_ADMIN_PHONES || '');

// 1MB payload buffer limit to prevent DoS memory exhaustion
const MAX_PAYLOAD_BYTES = 1024 * 1024;

// In-memory 24-hour deduplication cache for RN-22 & bounded FIFO outbound ID tracker (SPEC-059)
const DEDUP_TTL_MS = 24 * 60 * 60 * 1000;
const dedupCache = new Map(); // id -> timestamp
const MAX_OUTBOUND_IDS = 1000;
const outboundMessageIds = new Set();

const BOT_REPLY_PREFIXES = [
  '🤖 *MaestroPescadería',
  '🤖 MaestroPescadería',
  '🔍 *Reporte de Auditoría',
  '📖 *Guía de Comandos',
  '⚠️ *Comando ',
  '⚠️ *Mensaje vacío.',
  '⚠️ *Sintaxis inválida.',
  '⚠️ *Tarea [',
  '⚡ *Tarea [',
  '🚀 Auditoría completa solicitada.',
  '📋 *Cola Reordenada con Éxito.',
  '✅ Tarea ',
  '🗑️ Tarea ',
  '➕ *Nueva Tarea Agregada',
  '⏸️ *Agencia Pausada.',
  '▶️ *Agencia Reanudada.',
  '❌ ',
];

function recordOutboundMessageId(id) {
  const cleanId = typeof id === 'string' ? id.trim() : '';
  if (!cleanId) return;
  if (outboundMessageIds.size >= MAX_OUTBOUND_IDS) {
    const oldest = outboundMessageIds.values().next().value;
    if (oldest) outboundMessageIds.delete(oldest);
  }
  outboundMessageIds.add(cleanId);
  dedupCache.set(cleanId, Date.now());
}

function isBotGeneratedText(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return false;
  return BOT_REPLY_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
}

function cleanExpiredDedupEntries() {
  const now = Date.now();
  for (const [id, ts] of dedupCache.entries()) {
    if (now - ts > DEDUP_TTL_MS) {
      dedupCache.delete(id);
    }
  }
}

/**
 * Constant-time string comparison resistant to length timing leaks.
 */
function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Validates HMAC-SHA256 signature in constant time per RN-21
 */
function verifySignature(rawBodyBuffer, signatureHeader, secret = APP_SECRET) {
  if (!signatureHeader || typeof signatureHeader !== 'string') return false;
  const parts = signatureHeader.split('=');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'sha256') return false;

  const expectedHmac = crypto.createHmac('sha256', secret).update(rawBodyBuffer).digest('hex');
  const remoteSig = parts[1].toLowerCase();

  const expectedBuffer = Buffer.from(expectedHmac, 'utf8');
  const remoteBuffer = Buffer.from(remoteSig, 'utf8');

  if (expectedBuffer.length !== remoteBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, remoteBuffer);
}

function extractBearerToken(authHeader) {
  if (typeof authHeader !== 'string') return '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

function normalizeEventName(eventName) {
  return String(eventName || '').trim().toLowerCase().replace(/[-_]/g, '.');
}

function normalizePhoneNumber(jidOrPhone) {
  const base = String(jidOrPhone || '').split('@')[0].split(':')[0];
  return base.replace(/\D/g, '');
}

/**
 * Resolves remote chat peer digits from Evolution v1/v2 `key` (never trusts `payload.sender` instance owner JID).
 * Rejects group (@g.us) and broadcast (@broadcast) chats.
 */
function resolveEvolutionSender(key) {
  const primaryJid = String(key.remoteJid || '').toLowerCase();
  if (primaryJid.endsWith('@g.us') || primaryJid.endsWith('@broadcast') || primaryJid === 'status@broadcast') {
    return null;
  }

  const candidates = [key.remoteJidAlt, key.remoteJid, key.participant].filter(Boolean);
  const directPhoneJid = candidates.find((jid) => /@(s\.whatsapp\.net|c\.us)$/i.test(String(jid)));
  const selectedJid = directPhoneJid || key.remoteJidAlt || key.remoteJid || '';
  const digits = normalizePhoneNumber(selectedJid);
  return digits || null;
}

/**
 * Extracts text content from Evolution API v1/v2 message containers.
 */
function extractEvolutionText(rawMessage) {
  if (!rawMessage || typeof rawMessage !== 'object') return '';
  const unwrapped =
    (rawMessage.ephemeralMessage && rawMessage.ephemeralMessage.message) ||
    (rawMessage.viewOnceMessage && rawMessage.viewOnceMessage.message) ||
    (rawMessage.viewOnceMessageV2 && rawMessage.viewOnceMessageV2.message) ||
    rawMessage;

  return (
    unwrapped.conversation ||
    (unwrapped.extendedTextMessage && unwrapped.extendedTextMessage.text) ||
    (unwrapped.imageMessage && unwrapped.imageMessage.caption) ||
    (unwrapped.documentMessage && unwrapped.documentMessage.caption) ||
    (unwrapped.videoMessage && unwrapped.videoMessage.caption) ||
    (unwrapped.buttonsResponseMessage && unwrapped.buttonsResponseMessage.selectedDisplayText) ||
    ''
  );
}

/**
 * Extracts incoming actionable messages from Evolution API v1/v2, Meta Graph API v21.0, or Simulator payload.
 * Drops self-originated (fromMe=true) by default unless `config.allowSelfChat` is enabled with strict anti-loop checks.
 */
function extractMessages(payload, config = {}) {
  const extracted = [];
  if (!payload || typeof payload !== 'object') return extracted;

  const allowSelfChat = Boolean(config && config.allowSelfChat);

  // 1. Evolution API v1/v2 webhook payload
  const hasEvolutionEnvelope = Boolean(payload.event) || (Boolean(payload.data) && !payload.object);
  if (hasEvolutionEnvelope) {
    if (payload.event && normalizeEventName(payload.event) !== 'messages.upsert') {
      return extracted;
    }

    const items = Array.isArray(payload.data) ? payload.data : payload.data ? [payload.data] : [];
    for (const item of items) {
      if (!item || typeof item !== 'object') continue;
      const key = item.key || {};
      const isFromMe = key.fromMe === true;

      if (isFromMe && !allowSelfChat) continue;

      if (isFromMe && key.id && (outboundMessageIds.has(key.id) || dedupCache.has(key.id))) {
        continue;
      }

      const from = resolveEvolutionSender(key);
      if (!from) continue;

      const text = extractEvolutionText(item.message);
      if (!text) continue;

      if (isFromMe && isBotGeneratedText(text)) {
        continue;
      }

      extracted.push({
        id: key.id || `evo_${Date.now()}_${extracted.length}`,
        from,
        fromMe: isFromMe,
        text,
        timestamp: String(item.messageTimestamp || Math.floor(Date.now() / 1000)),
        source: 'evolution',
      });
    }
    return extracted;
  }

  // 2. Meta Graph API structure
  if (payload.object === 'whatsapp_business_account' && Array.isArray(payload.entry)) {
    for (const entry of payload.entry) {
      if (Array.isArray(entry.changes)) {
        for (const change of entry.changes) {
          const val = change.value;
          if (val && Array.isArray(val.messages)) {
            for (const msg of val.messages) {
              const text = msg.text && msg.text.body ? msg.text.body : '';
              extracted.push({
                id: msg.id,
                from: msg.from,
                text,
                timestamp: msg.timestamp,
                source: 'meta',
              });
            }
          }
        }
      }
    }
  }

  // 3. Simplified simulator structure
  if (extracted.length === 0 && (payload.text || payload.body)) {
    extracted.push({
      id: payload.id || `wamid.SIMULATED_${Date.now()}`,
      from: payload.from || '573001234567',
      text: payload.text || payload.body || '',
      timestamp: String(Math.floor(Date.now() / 1000)),
      source: 'simulator',
    });
  }

  return extracted;
}

/**
 * Handles incoming WhatsApp commands and updates system state
 */
function executeCommandAction(cmd, from, onAuditRequested = null) {
  const currentState = stateMgr.getState();

  switch (cmd.type) {
    case 'STATUS': {
      const formatted = commandParser.formatStatusMessage(currentState);
      return { action: 'STATUS', responseText: formatted };
    }

    case 'AUDIT': {
      if (typeof onAuditRequested === 'function') {
        onAuditRequested();
      }
      return {
        action: 'AUDIT',
        responseText: '🚀 Auditoría completa solicitada. Iniciando ciclo de verificación inmediata...',
      };
    }

    case 'REORDER': {
      const result = stateMgr.reorderQueue(cmd.taskIds);
      let reply = `📋 *Cola Reordenada con Éxito.*\n`;
      reply += `Tareas procesadas: ${result.reorderedCount}\n`;
      if (result.invalidIndices.length > 0) {
        reply += `⚠️ Índices no encontrados: ${result.invalidIndices.join(', ')}\n`;
      }
      return { action: 'REORDER', result, responseText: reply };
    }

    case 'EXECUTE':
    case 'APPROVE': {
      const target = cmd.targetId;
      const authResult = stateMgr.authorizeTask(target);
      if (!authResult.success) {
        return { action: cmd.type, error: authResult.error, responseText: `❌ ${authResult.error}` };
      }
      const startResult = stateMgr.startNextTask();
      let reply = `✅ Tarea [#${authResult.task.numericIndex}] "${authResult.task.title}" AUTORIZADA.\n`;
      if (startResult.started) {
        reply += `⚡ Entró a ejecución inmediata (WIP = 1). Rol: @${authResult.task.role}.`;
      } else if (startResult.reason === 'WIP_LIMIT_REACHED') {
        reply += `⏳ Otra tarea está en progreso activo (\`${startResult.activeTaskId}\`). Se ejecutará en cuanto termine (Límite WIP = 1).`;
      }
      return { action: cmd.type, task: authResult.task, responseText: reply };
    }

    case 'REJECT': {
      const discardResult = stateMgr.discardTask(cmd.targetId);
      if (!discardResult.success) {
        return { action: 'REJECT', error: discardResult.error, responseText: `❌ ${discardResult.error}` };
      }
      return {
        action: 'REJECT',
        task: discardResult.task,
        responseText: `🗑️ Tarea [#${discardResult.task.numericIndex}] descartada correctamente.`,
      };
    }

    case 'CUSTOM_TASK': {
      const tasks = currentState.queue || [];
      const nextIndex = tasks.reduce((max, t) => Math.max(max, t.numericIndex || 0), 0) + 1;
      const role = cmd.suggestedRole || commandParser.detectRoleFromText(cmd.customPayload);
      const newTask = {
        id: `TASK-USER-${Date.now().toString().slice(-4)}`,
        numericIndex: nextIndex,
        title: cmd.customPayload,
        description: `Tarea manual inyectada por ${from} vía WhatsApp`,
        role,
        priority: 'HIGH',
        status: 'QUEUED',
        source: 'user_whatsapp',
        detectedAt: new Date().toISOString(),
      };
      tasks.push(newTask);
      currentState.queue = tasks;
      stateMgr.saveState(currentState);

      let reply = `➕ *Nueva Tarea Agregada [#${newTask.numericIndex}]*\n`;
      reply += `📌 *Título:* ${newTask.title}\n`;
      reply += `👤 *Rol Asignado:* @${newTask.role}\n`;
      reply += `👉 Responde \`EJECUTAR ${newTask.numericIndex}\` para iniciarla.`;
      return { action: 'CUSTOM_TASK', task: newTask, responseText: reply };
    }

    case 'PAUSE': {
      currentState.daemon.status = 'PAUSED';
      stateMgr.saveState(currentState);
      return {
        action: 'PAUSE',
        responseText: '⏸️ *Agencia Pausada.* No se iniciarán nuevas tareas hasta enviar `REANUDAR`.',
      };
    }

    case 'RESUME': {
      currentState.daemon.status = 'RUNNING';
      stateMgr.saveState(currentState);
      stateMgr.startNextTask();
      return {
        action: 'RESUME',
        responseText: '▶️ *Agencia Reanudada.* Control loop activo 24/7.',
      };
    }

    case 'HELP':
    default: {
      return { action: 'HELP', responseText: commandParser.formatHelpMessage(cmd.error) };
    }
  }
}

/**
 * Resolves runtime webhook settings dynamically from `.env` / `process.env` with option overrides.
 */
function resolveWebhookConfig(options = {}) {
  loadDaemonEnv();
  const rawAdminPhones = options.adminPhones !== undefined
    ? options.adminPhones
    : parseAdminPhones(process.env.WHATSAPP_ADMIN_PHONES || '');
  const rawAdminLids = options.adminLids !== undefined
    ? options.adminLids
    : parseAdminPhones(process.env.WHATSAPP_ADMIN_LIDS || '');
  const allowSelfChat = options.allowSelfChat !== undefined
    ? Boolean(options.allowSelfChat)
    : String(process.env.EVOLUTION_ALLOW_SELF_CHAT || 'false').trim().toLowerCase() === 'true';

  return {
    port: options.port !== undefined ? options.port : parseInt(process.env.WHATSAPP_WEBHOOK_PORT || String(DEFAULT_PORT), 10),
    appSecret: options.appSecret !== undefined ? options.appSecret : (process.env.WHATSAPP_APP_SECRET || APP_SECRET),
    verifyToken: options.verifyToken !== undefined ? options.verifyToken : (process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || VERIFY_TOKEN),
    evolutionWebhookSecret: options.evolutionWebhookSecret !== undefined
      ? options.evolutionWebhookSecret
      : (process.env.EVOLUTION_WEBHOOK_SECRET || process.env.EVOLUTION_API_KEY || ''),
    evolutionApiUrl: options.evolutionApiUrl !== undefined
      ? options.evolutionApiUrl
      : (process.env.EVOLUTION_API_URL || ''),
    evolutionApiKey: options.evolutionApiKey !== undefined
      ? options.evolutionApiKey
      : (process.env.EVOLUTION_API_KEY || ''),
    evolutionInstance: options.evolutionInstance !== undefined
      ? options.evolutionInstance
      : (process.env.EVOLUTION_INSTANCE || ''),
    evolutionApiVersion: options.evolutionApiVersion !== undefined
      ? options.evolutionApiVersion
      : (process.env.EVOLUTION_API_VERSION || 'v2'),
    allowSelfChat,
    adminPhones: Array.isArray(rawAdminPhones)
      ? rawAdminPhones.map((p) => String(p).replace(/\D/g, '') || String(p).trim()).filter(Boolean)
      : parseAdminPhones(rawAdminPhones),
    adminLids: Array.isArray(rawAdminLids)
      ? rawAdminLids.map((l) => String(l).replace(/\D/g, '') || String(l).trim()).filter(Boolean)
      : parseAdminPhones(rawAdminLids),
    onAuditRequested: options.onAuditRequested || null,
  };
}

/**
 * Builds the JSON request body for Evolution API `sendText` (`v2` default or legacy `v1`).
 */
function buildEvolutionSendPayload(number, text, apiVersion = 'v2') {
  const cleanNumber = normalizePhoneNumber(number) || String(number || '').trim();
  const cleanText = String(text || '');
  if (String(apiVersion).toLowerCase() === 'v1') {
    return { number: cleanNumber, textMessage: { text: cleanText } };
  }
  return { number: cleanNumber, text: cleanText };
}

/**
 * Dispatches an outbound WhatsApp text message via Evolution API (`POST /message/sendText/{instance}`).
 * Never throws; resolves status metadata and logs failures safely without exposing secrets.
 */
function sendEvolutionText({ number, text, config = null, timeoutMs = 8000 } = {}) {
  const cfg = config || resolveWebhookConfig();
  const baseUrl = String(cfg.evolutionApiUrl || '').trim().replace(/\/+$/, '');
  const apiKey = String(cfg.evolutionApiKey || '').trim();
  const instance = String(cfg.evolutionInstance || '').trim();
  const apiVersion = String(cfg.evolutionApiVersion || 'v2').trim();
  const cleanNumber = normalizePhoneNumber(number) || String(number || '').trim();

  if (!baseUrl || !apiKey || !instance || !cleanNumber || !text) {
    return Promise.resolve({ sent: false, skipped: true, reason: 'EVOLUTION_NOT_CONFIGURED' });
  }

  let parsedEndpoint;
  try {
    const endpoint = `${baseUrl}/message/sendText/${encodeURIComponent(instance)}`;
    parsedEndpoint = new URL(endpoint);
  } catch (err) {
    logger.warn(`[Evolution] URL inválida para sendText: ${err.message}`);
    return Promise.resolve({ sent: false, error: err.message });
  }

  const transport = parsedEndpoint.protocol === 'https:' ? https : http;
  const payload = JSON.stringify(buildEvolutionSendPayload(cleanNumber, text, apiVersion));

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const req = transport.request(
      parsedEndpoint,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          apikey: apiKey,
        },
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => {
          if (responseBody.length < 4096) responseBody += chunk;
        });
        res.on('end', () => {
          const statusCode = res.statusCode || 0;
          const sent = statusCode >= 200 && statusCode < 300;
          let messageId = null;
          if (sent && responseBody) {
            try {
              const parsed = JSON.parse(responseBody);
              messageId = (parsed && parsed.key && parsed.key.id) || (parsed && parsed.data && parsed.data.key && parsed.data.key.id) || null;
              if (messageId) {
                recordOutboundMessageId(messageId);
              }
            } catch (_) {}
          }
          if (!sent) {
            logger.warn(`[Evolution] sendText HTTP ${statusCode} hacia ${cleanNumber}`);
          }
          finish({ sent, statusCode, messageId, responseBody });
        });
      }
    );

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`Evolution sendText timeout (${timeoutMs}ms)`));
    });

    req.on('error', (err) => {
      logger.warn(`[Evolution] Error enviando sendText a ${cleanNumber}: ${err.message}`);
      finish({ sent: false, error: err.message });
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Convenience helper to send proactive notifications to the first configured admin WhatsApp phone.
 */
function sendEvolutionNotification(text, options = {}) {
  const cfg = resolveWebhookConfig(options);
  const recipient = options.number || cfg.adminPhones[0];
  if (!recipient) {
    return Promise.resolve({ sent: false, skipped: true, reason: 'ADMIN_PHONES_NOT_CONFIGURED' });
  }
  return sendEvolutionText({ number: recipient, text, config: cfg, timeoutMs: options.timeoutMs });
}

/**
 * Authenticates POST requests via Meta HMAC-SHA256 or Evolution API shared secret (constant time).
 */
function verifyWebhookRequest(req, rawBuffer, parsedPayload, config) {
  const sigHeader = req.headers['x-hub-signature-256'] || req.headers['X-Hub-Signature-256'];
  if (verifySignature(rawBuffer, sigHeader, config.appSecret)) {
    return { authorized: true, method: 'meta_hmac' };
  }

  if (config.evolutionWebhookSecret) {
    const headerCandidates = [
      req.headers['apikey'],
      req.headers['x-webhook-secret'],
      extractBearerToken(req.headers['authorization']),
      parsedPayload && typeof parsedPayload.apikey === 'string' ? parsedPayload.apikey : '',
    ].filter(Boolean);

    for (const candidate of headerCandidates) {
      if (safeCompare(String(candidate), config.evolutionWebhookSecret)) {
        return { authorized: true, method: 'evolution_apikey' };
      }
    }
  }

  return { authorized: false, method: 'none' };
}

/**
 * Creates and starts the HTTP webhook server
 */
function createWebhookServer(options = {}) {
  const config = resolveWebhookConfig(options);

  const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const rawPathname = parsedUrl.pathname || '/';
    const pathname = rawPathname.length > 1 && rawPathname.endsWith('/') ? rawPathname.slice(0, -1) : rawPathname;

    // Health check endpoint
    if (pathname === '/health' || pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', service: 'maestro-whatsapp-webhook', timestamp: new Date().toISOString() }));
      return;
    }

    // WhatsApp webhook routes (Meta & Evolution API webhook / webhookByEvents messages-upsert)
    if (pathname === '/api/whatsapp/webhook' || pathname === '/api/whatsapp/webhook/messages-upsert') {
      // 1. GET Handshake (Meta Challenge or Evolution endpoint check)
      if (req.method === 'GET') {
        const mode = parsedUrl.query['hub.mode'];
        const token = parsedUrl.query['hub.verify_token'];
        const challenge = parsedUrl.query['hub.challenge'];

        if (mode === 'subscribe' && token === config.verifyToken) {
          logger.info(`[Webhook] Challenge handshake exitoso. Challenge recibido: ${challenge}`);
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end(challenge || '');
        } else if (mode === 'subscribe' || token !== undefined) {
          logger.warn(`[Webhook] Intento de handshake rechazado. Token inválido: ${token}`);
          res.writeHead(403, { 'Content-Type': 'text/plain' });
          res.end('Forbidden: Invalid verification token');
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok', provider: 'evolution-and-meta-compatible' }));
        }
        return;
      }

      // 2. POST Message Ingestion
      if (req.method === 'POST') {
        const chunks = [];
        let receivedBytes = 0;
        let payloadTooLarge = false;

        req.on('data', (chunk) => {
          if (payloadTooLarge) return;
          receivedBytes += chunk.length;
          if (receivedBytes > MAX_PAYLOAD_BYTES) {
            payloadTooLarge = true;
            logger.warn(`[Webhook] Payload excede el límite de 1MB (${receivedBytes} bytes). Rechazando con HTTP 413.`);
            res.writeHead(413, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Payload Too Large: Maximum allowed payload is 1MB' }));
            req.destroy();
            return;
          }
          chunks.push(chunk);
        });

        req.on('end', () => {
          if (payloadTooLarge) return;
          const rawBuffer = Buffer.concat(chunks);

          let headerAuth = verifyWebhookRequest(req, rawBuffer, null, config);
          let payload = null;
          let jsonParseError = null;

          if (!headerAuth.authorized && config.evolutionWebhookSecret) {
            try {
              payload = JSON.parse(rawBuffer.toString('utf8'));
              headerAuth = verifyWebhookRequest(req, rawBuffer, payload, config);
            } catch (err) {
              jsonParseError = err;
            }
          }

          // Enforce RN-21: Mandatory Meta HMAC-SHA256 OR Evolution API shared secret
          if (!headerAuth.authorized) {
            logger.warn(`[Webhook] RN-21 Rechazo: Credencial Evolution API o firma HMAC-SHA256 inválida/ausente.`);
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized: Invalid webhook credentials or X-Hub-Signature-256' }));
            return;
          }

          if (payload === null) {
            if (jsonParseError) {
              logger.warn(`[Webhook] Error parseando JSON payload: ${jsonParseError.message}`);
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Malformed JSON payload' }));
              return;
            }
            try {
              payload = JSON.parse(rawBuffer.toString('utf8'));
            } catch (err) {
              logger.warn(`[Webhook] Error parseando JSON payload: ${err.message}`);
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Malformed JSON payload' }));
              return;
            }
          }

          const messages = extractMessages(payload, config);
          if (messages.length === 0) {
            // Acknowledge receipt fast even if empty, fromMe, group, or non-message event
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok', processed: 0 }));
            return;
          }

          cleanExpiredDedupEntries();
          const results = [];
          const outboundReplies = [];

          for (const msg of messages) {
            // Enforce RN-22: Deduplication via wamid / Evolution message ID
            if (msg.id && dedupCache.has(msg.id)) {
              logger.info(`[Webhook] RN-22 Deduplicación: Mensaje duplicado omitido (${msg.id})`);
              results.push({ id: msg.id, deduplicated: true });
              continue;
            }

            if (msg.id) {
              dedupCache.set(msg.id, Date.now());
            }

            // Whitelist check (fail-closed when WHATSAPP_ADMIN_PHONES is empty; strictly isolated for self-chat)
            const normalizedFrom = normalizePhoneNumber(msg.from) || String(msg.from || '').trim();
            const isPhoneAdmin = config.adminPhones.includes(normalizedFrom);
            const isLidAdmin = Array.isArray(config.adminLids) && config.adminLids.includes(normalizedFrom);
            const isAuthorized = config.adminPhones.length > 0 && (isPhoneAdmin || isLidAdmin);
            if (!isAuthorized) {
              const reason = config.adminPhones.length === 0
                ? 'ADMIN_PHONES_NOT_CONFIGURED'
                : msg.fromMe
                  ? 'SELF_CHAT_NOT_AUTHORIZED'
                  : 'UNAUTHORIZED_PHONE';
              logger.warn(
                config.adminPhones.length === 0
                  ? `[Webhook] WHATSAPP_ADMIN_PHONES no configurado; mensaje de ${normalizedFrom} bloqueado.`
                  : `[Webhook] Mensaje de número no autorizado omitido: ${normalizedFrom}`
              );
              results.push({ id: msg.id, authorized: false, reason });
              continue;
            }

            const parsedCmd = commandParser.parseCommand(msg.text);
            logger.info(`[Webhook] Comando de ${normalizedFrom} (${msg.source || 'unknown'}${msg.fromMe ? ', self-chat' : ''}): "${msg.text}" -> Tipo: ${parsedCmd.type}`);

            const executionResult = executeCommandAction(parsedCmd, normalizedFrom, config.onAuditRequested);
            results.push({ id: msg.id, command: parsedCmd.type, ...executionResult });

            if (msg.source === 'evolution' && executionResult && executionResult.responseText) {
              const replyNumber = isPhoneAdmin ? normalizedFrom : (config.adminPhones[0] || normalizedFrom);
              outboundReplies.push({ number: replyNumber, text: executionResult.responseText });
            }
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok', results }));

          if (outboundReplies.length > 0) {
            setImmediate(() => {
              for (const reply of outboundReplies) {
                void sendEvolutionText({ number: reply.number, text: reply.text, config });
              }
            });
          }
        });

        return;
      }

      // Method not allowed
      res.writeHead(405, { 'Content-Type': 'text/plain' });
      res.end('Method Not Allowed');
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  });

  return new Promise((resolve, reject) => {
    server.listen(config.port, () => {
      logger.info(`[Webhook Server] Escuchando en http://127.0.0.1:${config.port}`);
      resolve({
        server,
        port: config.port,
        close: () => new Promise((res) => server.close(res)),
      });
    });
    server.on('error', (err) => reject(err));
  });
}

module.exports = {
  DEFAULT_PORT,
  MAX_PAYLOAD_BYTES,
  VERIFY_TOKEN,
  APP_SECRET,
  ADMIN_PHONES,
  dedupCache,
  outboundMessageIds,
  recordOutboundMessageId,
  isBotGeneratedText,
  resolveEvolutionSender,
  safeCompare,
  normalizePhoneNumber,
  normalizeEventName,
  resolveWebhookConfig,
  buildEvolutionSendPayload,
  sendEvolutionText,
  sendEvolutionNotification,
  verifySignature,
  verifyWebhookRequest,
  extractMessages,
  executeCommandAction,
  createWebhookServer,
};
