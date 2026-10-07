#!/usr/bin/env node
/**
 * Hindsight MCP Client & CLI Wrapper for MaestroPescaderia ERP
 * Vectorize.io Biomimetic Memory System
 */

const fs = require('fs');
const path = require('path');

const BANK_ID = process.env.HINDSIGHT_BANK_ID || 'pezcaderia-erp';

function loadEnvLocal() {
  try {
    const envPath = path.resolve(__dirname, '../../.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
        if (match && !process.env[match[1]]) {
          process.env[match[1]] = match[2];
        }
      }
    }
  } catch {}
}

loadEnvLocal();

function getMcpConfig() {
  try {
    const mcpPath = path.resolve(__dirname, '../../.mcp.json');
    if (fs.existsSync(mcpPath)) {
      const data = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
      if (data.mcpServers && data.mcpServers.hindsight) {
        let auth = data.mcpServers.hindsight.headers?.Authorization || '';
        auth = auth.replace('${HINDSIGHT_API_KEY}', process.env.HINDSIGHT_API_KEY || '');
        const key = auth.replace('Bearer ', '').trim();
        return { key, url: data.mcpServers.hindsight.serverUrl };
      }
    }
  } catch {}
  return {};
}

const config = getMcpConfig();
const API_KEY = process.env.HINDSIGHT_API_KEY || config.key || '';
const BASE_URL = process.env.HINDSIGHT_BASE_URL || config.url || `https://api.hindsight.vectorize.io/mcp/${BANK_ID}/`;

async function callTool(name, args = {}) {
  const payload = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: {
      name,
      arguments: args
    }
  };

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  const raw = await response.text();
  
  // Extract SSE message data
  const lines = raw.split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        const json = JSON.parse(line.substring(6));
        if (json.result && json.result.structuredContent) {
          return json.result.structuredContent;
        }
        if (json.result && json.result.content && json.result.content[0]) {
          try {
            return JSON.parse(json.result.content[0].text);
          } catch {
            return json.result.content[0].text;
          }
        }
        return json;
      } catch (err) {
        // Continue parsing
      }
    }
  }

  return { raw };
}

async function recall(query, options = {}) {
  return await callTool('recall', { query, ...options });
}

async function retain(content, context = 'general', tags = ['erp', 'roadmap']) {
  return await callTool('retain', { content, context, tags });
}

async function reflect(query, options = {}) {
  return await callTool('reflect', { query, ...options });
}

// CLI Execution
if (require.main === module) {
  const [,, command, ...rest] = process.argv;
  const input = rest.join(' ');

  if (!command) {
    console.log('Uso: node client.cjs [recall|retain|reflect] "<texto>" [contexto]');
    process.exit(1);
  }

  (async () => {
    try {
      if (command === 'recall') {
        const result = await recall(input || 'MaestroPescaderia ERP');
        console.log(JSON.stringify(result, null, 2));
      } else if (command === 'retain') {
        const context = process.argv[4] || 'general';
        const result = await retain(input, context);
        console.log(JSON.stringify(result, null, 2));
      } else if (command === 'reflect') {
        const result = await reflect(input || 'Estado del proyecto y prioridades del roadmap');
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.error('Comando desconocido:', command);
      }
    } catch (err) {
      console.error('Error en Hindsight:', err);
      process.exit(1);
    }
  })();
}

module.exports = { recall, retain, reflect, callTool };
