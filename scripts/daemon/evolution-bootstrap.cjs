/**
 * scripts/daemon/evolution-bootstrap.cjs
 * Zero-dependency local Docker & Evolution API v2.3.7 bootstrapper, webhook sync,
 * connection status inspector, and QR pairing helper for MaestroPescadería Daemon.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { loadDaemonEnv, parseEnvContent } = require('./env.cjs');

const ROOT_DIR = path.resolve(__dirname, '../../');
const COMPOSE_FILE = path.join(ROOT_DIR, 'docker-compose.evolution.yml');
const DEFAULT_HOST_PORT = '8085';
const DEFAULT_INSTANCE = 'maestro_pescaderia';
const DEFAULT_WEBHOOK_PORT = '3005';
const PLACEHOLDER_VALUES = new Set([
  'tu_api_key_de_evolution_aqui',
  'tu_secreto_webhook_evolution',
  'tu_api_key_de_google_ai_studio_aqui',
]);

function isUnsetOrPlaceholder(value) {
  const trimmed = String(value || '').trim();
  return !trimmed || PLACEHOLDER_VALUES.has(trimmed);
}

function generateSecretToken(prefix = 'evo') {
  return `${prefix}_${crypto.randomBytes(24).toString('hex')}`;
}

function resolveEnvFileArg(rootDir = ROOT_DIR) {
  const localPath = path.join(rootDir, '.env.local');
  if (fs.existsSync(localPath)) return localPath;
  const envPath = path.join(rootDir, '.env');
  if (fs.existsSync(envPath)) return envPath;
  return null;
}

/**
 * Ensures `.env.local` has all required Evolution API & daemon variables without overwriting existing real values.
 */
function ensureLocalEnvConfig({ rootDir = ROOT_DIR, envFileName = '.env.local' } = {}) {
  const targetPath = path.join(rootDir, envFileName);
  const baseEnvPath = path.join(rootDir, '.env');
  const existingContent = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf8') : '';
  const mergedMap = new Map();

  if (fs.existsSync(baseEnvPath)) {
    for (const [k, v] of parseEnvContent(fs.readFileSync(baseEnvPath, 'utf8'))) {
      mergedMap.set(k, v);
    }
  }
  for (const [k, v] of parseEnvContent(existingContent)) {
    mergedMap.set(k, v);
  }

  const hostPort = isUnsetOrPlaceholder(mergedMap.get('EVOLUTION_HOST_PORT'))
    ? DEFAULT_HOST_PORT
    : String(mergedMap.get('EVOLUTION_HOST_PORT')).trim();

  const desiredDefaults = [
    ['EVOLUTION_HOST_PORT', hostPort],
    ['EVOLUTION_API_URL', `http://127.0.0.1:${hostPort}`],
    ['EVOLUTION_API_KEY', generateSecretToken('evo_key')],
    ['EVOLUTION_INSTANCE', DEFAULT_INSTANCE],
    ['EVOLUTION_WEBHOOK_SECRET', generateSecretToken('evo_wh')],
    ['EVOLUTION_API_VERSION', 'v2'],
    ['WHATSAPP_WEBHOOK_PORT', DEFAULT_WEBHOOK_PORT],
    ['DAEMON_SDD_DRY_RUN', 'true'],
    ['DAEMON_TSC_TIMEOUT_MS', '180000'],
  ];

  const addedOrUpdatedKeys = [];
  let updatedContent = existingContent;

  const upsertLine = (key, value) => {
    const linePattern = new RegExp(`^\\s*(?:export\\s+)?${key}\\s*=.*$`, 'm');
    if (linePattern.test(updatedContent)) {
      updatedContent = updatedContent.replace(linePattern, `${key}=${value}`);
    } else {
      const prefix = updatedContent && !updatedContent.endsWith('\n') ? '\n' : '';
      updatedContent += `${prefix}${key}=${value}\n`;
    }
  };

  const missingOrPlaceholderEntries = [];
  for (const [key, fallbackValue] of desiredDefaults) {
    const current = mergedMap.get(key);
    if (isUnsetOrPlaceholder(current)) {
      mergedMap.set(key, fallbackValue);
      missingOrPlaceholderEntries.push([key, fallbackValue]);
      addedOrUpdatedKeys.push(key);
    }
  }

  if (missingOrPlaceholderEntries.length > 0) {
    if (!updatedContent.includes('# EVOLUTION API LOCAL (Docker)')) {
      const sep = updatedContent && !updatedContent.endsWith('\n') ? '\n\n' : '';
      updatedContent += `${sep}# ---------------------------------------------------------\n# EVOLUTION API LOCAL (Docker)\n# ---------------------------------------------------------\n`;
    }
    for (const [key, value] of missingOrPlaceholderEntries) {
      upsertLine(key, value);
    }
    if (!/WHATSAPP_ADMIN_PHONES\s*=/.test(updatedContent)) {
      updatedContent += '# WHATSAPP_ADMIN_PHONES=573001234567\n';
    }
    fs.writeFileSync(targetPath, updatedContent, 'utf8');
  } else if (!fs.existsSync(targetPath)) {
    const lines = desiredDefaults.map(([k, v]) => `${k}=${mergedMap.get(k) || v}`);
    lines.push('# WHATSAPP_ADMIN_PHONES=573001234567');
    fs.writeFileSync(targetPath, `${lines.join('\n')}\n`, 'utf8');
  }

  return {
    envPath: targetPath,
    addedOrUpdatedKeys,
    config: {
      hostPort: mergedMap.get('EVOLUTION_HOST_PORT'),
      apiUrl: mergedMap.get('EVOLUTION_API_URL'),
      apiKey: mergedMap.get('EVOLUTION_API_KEY'),
      instance: mergedMap.get('EVOLUTION_INSTANCE'),
      webhookSecret: mergedMap.get('EVOLUTION_WEBHOOK_SECRET'),
      apiVersion: mergedMap.get('EVOLUTION_API_VERSION'),
      webhookPort: mergedMap.get('WHATSAPP_WEBHOOK_PORT'),
    },
  };
}

function buildWebhookConfigPayload({ webhookPort = DEFAULT_WEBHOOK_PORT, webhookSecret = '' } = {}) {
  const cleanPort = parseInt(String(webhookPort || DEFAULT_WEBHOOK_PORT), 10) || 3005;
  const headers = webhookSecret ? { 'x-webhook-secret': webhookSecret } : {};
  return {
    webhook: {
      enabled: true,
      url: `http://host.docker.internal:${cleanPort}/api/whatsapp/webhook`,
      byEvents: false,
      base64: false,
      headers,
      events: ['MESSAGES_UPSERT'],
    },
  };
}

function buildCreateInstancePayload({ instanceName = DEFAULT_INSTANCE, webhookPort = DEFAULT_WEBHOOK_PORT, webhookSecret = '' } = {}) {
  const wh = buildWebhookConfigPayload({ webhookPort, webhookSecret }).webhook;
  return {
    instanceName,
    integration: 'WHATSAPP-BAILEYS',
    qrcode: false,
    webhook: {
      url: wh.url,
      byEvents: wh.byEvents,
      base64: wh.base64,
      headers: wh.headers,
      events: wh.events,
    },
  };
}

async function fetchEvolutionJson(baseUrl, apiPath, { method = 'GET', apiKey = '', body = null, timeoutMs = 10000 } = {}) {
  const cleanBase = String(baseUrl || '').trim().replace(/\/+$/, '');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = {};
    if (apiKey) headers.apikey = apiKey;
    if (body !== null) headers['Content-Type'] = 'application/json';
    const res = await fetch(`${cleanBase}${apiPath}`, {
      method,
      headers,
      body: body !== null ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (_) {
      json = { raw: text };
    }
    return { ok: res.ok, status: res.status, data: json };
  } finally {
    clearTimeout(timer);
  }
}

async function waitForEvolutionApi(baseUrl, timeoutMs = 150000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = 'timeout';
  while (Date.now() < deadline) {
    try {
      const res = await fetchEvolutionJson(baseUrl, '/', { timeoutMs: 3000 });
      if (res.ok) return res.data;
      lastError = `HTTP ${res.status}`;
    } catch (err) {
      lastError = err.message;
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error(`Evolution API no respondió en ${baseUrl} dentro de ${timeoutMs}ms (${lastError})`);
}

function runDockerCompose(composeArgs, { rootDir = ROOT_DIR, stdio = 'inherit' } = {}) {
  const envFile = resolveEnvFileArg(rootDir);
  const args = ['compose', '-f', path.join(rootDir, 'docker-compose.evolution.yml')];
  if (envFile) {
    args.push('--env-file', envFile);
  }
  args.push(...composeArgs);

  const res = spawnSync('docker', args, { cwd: rootDir, stdio, encoding: 'utf8' });
  if (res.error) {
    throw res.error;
  }
  if (res.status !== 0) {
    throw new Error(`docker ${args.join(' ')} finalizó con código ${res.status}`);
  }
  return res;
}

function redactSnapshot(snapshot, secrets = []) {
  let serialized = JSON.stringify(snapshot, null, 2);
  for (const s of secrets) {
    if (s && String(s).length >= 4) {
      serialized = serialized.split(String(s)).join('[REDACTED]');
    }
  }
  return serialized;
}

async function syncInstanceAndWebhook(cfg) {
  const apiUrl = cfg.apiUrl;
  const apiKey = cfg.apiKey;
  const instance = cfg.instance || DEFAULT_INSTANCE;
  const webhookSecret = cfg.webhookSecret || apiKey;

  const listRes = await fetchEvolutionJson(apiUrl, '/instance/fetchInstances', { apiKey });
  if (!listRes.ok) {
    throw new Error(`No se pudieron consultar instancias en Evolution API (HTTP ${listRes.status})`);
  }

  const instances = Array.isArray(listRes.data) ? listRes.data : [];
  const exists = instances.some((item) => item && (item.name === instance || (item.instance && item.instance.instanceName === instance)));

  let created = false;
  if (!exists) {
    const createBody = buildCreateInstancePayload({
      instanceName: instance,
      webhookPort: cfg.webhookPort,
      webhookSecret,
    });
    const createRes = await fetchEvolutionJson(apiUrl, '/instance/create', {
      method: 'POST',
      apiKey,
      body: createBody,
    });
    if (!createRes.ok) {
      throw new Error(`Error creando instancia ${instance} (HTTP ${createRes.status})`);
    }
    created = true;
  }

  const webhookBody = buildWebhookConfigPayload({
    webhookPort: cfg.webhookPort,
    webhookSecret,
  });
  const setWhRes = await fetchEvolutionJson(apiUrl, `/webhook/set/${encodeURIComponent(instance)}`, {
    method: 'POST',
    apiKey,
    body: webhookBody,
  });
  if (!setWhRes.ok) {
    throw new Error(`Error sincronizando webhook para ${instance} (HTTP ${setWhRes.status})`);
  }

  const stateRes = await fetchEvolutionJson(apiUrl, `/instance/connectionState/${encodeURIComponent(instance)}`, { apiKey });
  const whRes = await fetchEvolutionJson(apiUrl, `/webhook/find/${encodeURIComponent(instance)}`, { apiKey });

  return {
    created,
    instance,
    connectionState: (stateRes.data && stateRes.data.instance && stateRes.data.instance.state) || 'unknown',
    webhookUrl: whRes.data && whRes.data.url ? whRes.data.url : webhookBody.webhook.url,
    webhookEnabled: Boolean(whRes.data && whRes.data.enabled),
    webhookEvents: (whRes.data && whRes.data.events) || webhookBody.webhook.events,
  };
}

async function bootstrapEvolution({ rootDir = ROOT_DIR, skipCompose = false } = {}) {
  const envSummary = ensureLocalEnvConfig({ rootDir });
  loadDaemonEnv({ rootDir, force: true });

  if (!skipCompose) {
    console.log('🐳 Levantando stack Docker aislado de Evolution API (Postgres + Redis + Evolution v2.3.7)...');
    runDockerCompose(['up', '-d'], { rootDir, stdio: 'inherit' });
  }

  console.log(`⏳ Esperando salud de Evolution API en ${envSummary.config.apiUrl}...`);
  const rootInfo = await waitForEvolutionApi(envSummary.config.apiUrl, 150000);
  const syncResult = await syncInstanceAndWebhook(envSummary.config);

  return {
    envPath: envSummary.envPath,
    addedOrUpdatedKeys: envSummary.addedOrUpdatedKeys,
    version: rootInfo && rootInfo.version ? rootInfo.version : 'unknown',
    ...syncResult,
  };
}

async function getEvolutionStatus({ rootDir = ROOT_DIR } = {}) {
  loadDaemonEnv({ rootDir, force: true });
  const apiUrl = String(process.env.EVOLUTION_API_URL || `http://127.0.0.1:${DEFAULT_HOST_PORT}`).trim();
  const apiKey = String(process.env.EVOLUTION_API_KEY || '').trim();
  const instance = String(process.env.EVOLUTION_INSTANCE || DEFAULT_INSTANCE).trim();

  const rootRes = await fetchEvolutionJson(apiUrl, '/', { timeoutMs: 5000 });
  const stateRes = apiKey
    ? await fetchEvolutionJson(apiUrl, `/instance/connectionState/${encodeURIComponent(instance)}`, { apiKey, timeoutMs: 5000 })
    : { ok: false, status: 0, data: null };
  const whRes = apiKey
    ? await fetchEvolutionJson(apiUrl, `/webhook/find/${encodeURIComponent(instance)}`, { apiKey, timeoutMs: 5000 })
    : { ok: false, status: 0, data: null };

  return {
    apiUrl,
    apiAlive: rootRes.ok,
    version: rootRes.data && rootRes.data.version ? rootRes.data.version : 'N/A',
    instance,
    connectionState: (stateRes.data && stateRes.data.instance && stateRes.data.instance.state) || 'unknown',
    webhookUrl: (whRes.data && whRes.data.url) || 'N/A',
    webhookEnabled: Boolean(whRes.data && whRes.data.enabled),
    webhookEvents: (whRes.data && whRes.data.events) || [],
  };
}

async function getEvolutionQr({ rootDir = ROOT_DIR } = {}) {
  loadDaemonEnv({ rootDir, force: true });
  const apiUrl = String(process.env.EVOLUTION_API_URL || `http://127.0.0.1:${DEFAULT_HOST_PORT}`).trim();
  const apiKey = String(process.env.EVOLUTION_API_KEY || '').trim();
  const instance = String(process.env.EVOLUTION_INSTANCE || DEFAULT_INSTANCE).trim();

  if (!apiKey) {
    throw new Error('EVOLUTION_API_KEY no configurada. Ejecuta primero: npm run evolution:bootstrap');
  }

  const stateRes = await fetchEvolutionJson(apiUrl, `/instance/connectionState/${encodeURIComponent(instance)}`, { apiKey });
  const state = stateRes.data && stateRes.data.instance && stateRes.data.instance.state;
  if (state === 'open') {
    return { alreadyConnected: true, instance, state };
  }

  const connectRes = await fetchEvolutionJson(apiUrl, `/instance/connect/${encodeURIComponent(instance)}`, {
    apiKey,
    timeoutMs: 15000,
  });
  if (!connectRes.ok) {
    throw new Error(`Error solicitando QR de ${instance} (HTTP ${connectRes.status})`);
  }

  return {
    alreadyConnected: false,
    instance,
    state: state || 'close',
    pairingCode: connectRes.data && connectRes.data.pairingCode ? connectRes.data.pairingCode : null,
    hasCode: Boolean(connectRes.data && connectRes.data.code),
    hasBase64: Boolean(connectRes.data && connectRes.data.base64),
    managerUrl: `${apiUrl.replace(/\/+$/, '')}/manager`,
  };
}

async function main() {
  const subcommand = (process.argv[2] || 'bootstrap').toLowerCase();
  const restArgs = process.argv.slice(3);

  if (subcommand === 'compose') {
    if (restArgs.length === 0) {
      console.error('Uso: node scripts/daemon/evolution-bootstrap.cjs compose <up -d|down|logs ...>');
      process.exit(1);
    }
    runDockerCompose(restArgs, { rootDir: ROOT_DIR, stdio: 'inherit' });
    return;
  }

  if (subcommand === 'bootstrap' || subcommand === 'sync-webhook') {
    const result = await bootstrapEvolution({
      rootDir: ROOT_DIR,
      skipCompose: subcommand === 'sync-webhook' || restArgs.includes('--no-up'),
    });
    console.log('\n✅ Evolution API Local Bootstrap Completo:');
    console.log(`   Archivo entorno:  ${path.relative(ROOT_DIR, result.envPath)}`);
    console.log(`   Versión API:      ${result.version}`);
    console.log(`   Instancia:        ${result.instance} (${result.created ? 'creada' : 'existente'})`);
    console.log(`   Estado WhatsApp:  ${result.connectionState}`);
    console.log(`   Webhook activo:   ${result.webhookEnabled ? 'Sí' : 'No'} -> ${result.webhookUrl}`);
    console.log(`   Eventos:          ${(result.webhookEvents || []).join(', ')}`);
    console.log('   Siguiente paso:   Define WHATSAPP_ADMIN_PHONES en .env.local y ejecuta `npm run evolution:qr`.\n');
    return;
  }

  if (subcommand === 'status') {
    const status = await getEvolutionStatus({ rootDir: ROOT_DIR });
    console.log('\n=== Estado Evolution API Local ===');
    console.log(`API URL:          ${status.apiUrl} (${status.apiAlive ? `OK v${status.version}` : 'INACCESIBLE'})`);
    console.log(`Instancia:        ${status.instance}`);
    console.log(`Estado WhatsApp:  ${status.connectionState}`);
    console.log(`Webhook:          ${status.webhookEnabled ? 'Activo' : 'Inactivo'} -> ${status.webhookUrl}`);
    console.log(`Eventos:          ${status.webhookEvents.join(', ') || 'Ninguno'}\n`);
    return;
  }

  if (subcommand === 'qr') {
    const qr = await getEvolutionQr({ rootDir: ROOT_DIR });
    if (qr.alreadyConnected) {
      console.log(`\n✅ La instancia '${qr.instance}' ya está conectada (estado: open).\n`);
      return;
    }
    console.log(`\n📱 QR generado para la instancia '${qr.instance}' (estado actual: ${qr.state}).`);
    console.log(`   1. Abre Evolution Manager: ${qr.managerUrl} (usa tu EVOLUTION_API_KEY de .env.local)`);
    console.log(`   2. O mira el QR en terminal con: npm run evolution:logs`);
    if (qr.pairingCode) {
      console.log(`   Código de emparejamiento: ${qr.pairingCode}`);
    }
    console.log('');
    return;
  }

  console.error(`Subcomando desconocido '${subcommand}'. Usa: bootstrap | compose | status | qr | sync-webhook`);
  process.exit(1);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`❌ [Evolution Bootstrap] ${err.message}`);
    process.exit(1);
  });
}

module.exports = {
  COMPOSE_FILE,
  PLACEHOLDER_VALUES,
  isUnsetOrPlaceholder,
  resolveEnvFileArg,
  ensureLocalEnvConfig,
  buildWebhookConfigPayload,
  buildCreateInstancePayload,
  fetchEvolutionJson,
  waitForEvolutionApi,
  runDockerCompose,
  redactSnapshot,
  syncInstanceAndWebhook,
  bootstrapEvolution,
  getEvolutionStatus,
  getEvolutionQr,
};
