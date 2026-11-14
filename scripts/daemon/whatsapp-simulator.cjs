/**
 * scripts/daemon/whatsapp-simulator.cjs
 * Local simulator client to test WhatsApp Webhook interactions without requiring live Meta credentials.
 */

const http = require('http');
const crypto = require('crypto');

const DEFAULT_PORT = 3005;
const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_SECRET = process.env.WHATSAPP_APP_SECRET || 'test_meta_app_secret_12345';
const DEFAULT_PHONE = '573001234567';

/**
 * Generates an HMAC-SHA256 hex digest for request body buffer
 */
function computeSignature(payloadBuffer, secret = DEFAULT_SECRET) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payloadBuffer);
  return `sha256=${hmac.digest('hex')}`;
}

/**
 * Builds standard Meta Graph API payload
 */
function buildMetaPayload(text, from = DEFAULT_PHONE, messageId = null) {
  const id = messageId || `wamid.SIMULATED_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '109283746592817',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: from,
                phone_number_id: '109283746592817',
              },
              contacts: [{ profile: { name: 'Admin Developer' }, wa_id: from }],
              messages: [
                {
                  from,
                  id,
                  timestamp: String(Math.floor(Date.now() / 1000)),
                  text: { body: text },
                  type: 'text',
                },
              ],
            },
            field: 'messages',
          },
        ],
      },
    ],
  };
}

/**
 * Sends a simulated WhatsApp POST webhook request
 */
function sendSimulatedMessage({
  text = 'ESTADO',
  from = DEFAULT_PHONE,
  messageId = null,
  appSecret = DEFAULT_SECRET,
  customHeaders = {},
  rawPayload = null,
  port = DEFAULT_PORT,
  host = DEFAULT_HOST,
}) {
  return new Promise((resolve, reject) => {
    const payload = rawPayload || buildMetaPayload(text, from, messageId);
    const bodyStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const bodyBuffer = Buffer.from(bodyStr, 'utf8');

    const signature = appSecret ? computeSignature(bodyBuffer, appSecret) : null;

    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': bodyBuffer.length,
      ...customHeaders,
    };
    if (signature && !headers['X-Hub-Signature-256'] && !headers['x-hub-signature-256']) {
      headers['X-Hub-Signature-256'] = signature;
    }

    const req = http.request(
      {
        hostname: host,
        port,
        path: '/api/whatsapp/webhook',
        method: 'POST',
        headers,
      },
      (res) => {
        let respData = '';
        res.on('data', (chunk) => {
          respData += chunk;
        });
        res.on('end', () => {
          let parsed = respData;
          try {
            parsed = JSON.parse(respData);
          } catch (_) {}
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed,
            rawBody: respData,
          });
        });
      }
    );

    req.on('error', (err) => reject(err));
    req.write(bodyBuffer);
    req.end();
  });
}

/**
 * Tests Meta Graph API GET verification challenge handshake
 */
function sendVerifyChallenge({
  verifyToken = 'la_pezcaderia_daemon_webhook_token_2026',
  challenge = '1158201444',
  port = DEFAULT_PORT,
  host = DEFAULT_HOST,
}) {
  return new Promise((resolve, reject) => {
    const query = `hub.mode=subscribe&hub.verify_token=${encodeURIComponent(
      verifyToken
    )}&hub.challenge=${encodeURIComponent(challenge)}`;
    const path = `/api/whatsapp/webhook?${query}`;

    http.get(
      {
        hostname: host,
        port,
        path,
      },
      (res) => {
        let respData = '';
        res.on('data', (chunk) => {
          respData += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: respData,
          });
        });
      }
    ).on('error', (err) => reject(err));
  });
}

// CLI execution handler
if (require.main === module) {
  const args = process.argv.slice(2);
  const commandText = args[0] || 'ESTADO';
  const customSecret = process.env.WHATSAPP_APP_SECRET || DEFAULT_SECRET;

  console.log(`[Simulator] Enviando comando: "${commandText}" a http://${DEFAULT_HOST}:${DEFAULT_PORT}/api/whatsapp/webhook...`);
  sendSimulatedMessage({ text: commandText, appSecret: customSecret })
    .then((res) => {
      console.log(`[Simulator] Respuesta HTTP ${res.statusCode}:`, res.body);
    })
    .catch((err) => {
      console.error(`[Simulator] Error de conexión:`, err.message);
      process.exit(1);
    });
}

module.exports = {
  DEFAULT_PORT,
  DEFAULT_HOST,
  DEFAULT_SECRET,
  DEFAULT_PHONE,
  computeSignature,
  buildMetaPayload,
  sendSimulatedMessage,
  sendVerifyChallenge,
};
