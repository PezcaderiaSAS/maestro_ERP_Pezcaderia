/**
 * ============================================================================
 * ACCIÓN LIFECYCLE: SETUP Y SINCRONIZACIÓN INTERACTIVA DE HARNESS² (POST-PULL)
 * ============================================================================
 * Ubicación: scripts/lifecycle/setup-harness2-env.cjs
 * Ejecutado en: scripts/lifecycle/post-pull.cjs (Paso previo a la verificación)
 * 
 * Función:
 * - Detecta si las credenciales de Harness² (Google AI Studio) están configuradas.
 * - Sincroniza bidireccionalmente entre `.env.local` raíz y `tools/harness2/.env`.
 * - Si falta la clave GEMINI_API_KEY y la terminal es interactiva (TTY),
 *   solicita la clave al desarrollador y crea la configuración automáticamente.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT_DIR = path.resolve(__dirname, '../../');
const HARNESS2_DIR = path.join(ROOT_DIR, 'tools/harness2');
const HARNESS2_ENV_PATH = path.join(HARNESS2_DIR, '.env');
const HARNESS2_EXAMPLE_PATH = path.join(HARNESS2_DIR, '.env.example');
const ROOT_ENV_LOCAL_PATH = path.join(ROOT_DIR, '.env.local');
const ROOT_ENV_PATH = path.join(ROOT_DIR, '.env');

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (match) {
      let val = match[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[match[1]] = val;
    }
  }
  return env;
}

function writeHarnessEnv(apiKey) {
  const content = `# ==============================================================================
# HARNESS2 CONFIGURACIÓN LOCAL A COSTO $0 - ENTORNO ANTIGRAVITY IDE (es-419)
# ==============================================================================

# Proveedor y Mapeo de Modelos
MODEL_PROVIDER=google_ai_studio
PRIMARY_MODEL_ID=gemini-3.8-flash
IDE_AUTOMATION_MODEL=antigravity-preview-09-2026

# Modelos para Harness2 Runner
HARNESS2_SOLVER_MODEL=google_ai_studio/gemini-3.8-flash
HARNESS2_IMPROVER_MODEL=google_ai_studio/gemini-3.8-flash
HARNESS2_JUDGE_MODEL=gemini-3.8-flash

# Credenciales de API (Costo $0 - Google AI Studio)
GEMINI_API_KEY=${apiKey}
GOOGLE_API_KEY=${apiKey}

# Parámetros de Ejecución y Lenguaje
HARNESS2_LANGUAGE=es-419
HARNESS2_RUNS_DIR=runs
`;

  if (!fs.existsSync(HARNESS2_DIR)) {
    fs.mkdirSync(HARNESS2_DIR, { recursive: true });
  }
  fs.writeFileSync(HARNESS2_ENV_PATH, content, 'utf-8');
  console.log(`✅ [HARNESS²] Configuración guardada exitosamente en ${path.relative(ROOT_DIR, HARNESS2_ENV_PATH)}`);
}

function appendToRootEnvLocal(apiKey) {
  let content = '';
  if (fs.existsSync(ROOT_ENV_LOCAL_PATH)) {
    content = fs.readFileSync(ROOT_ENV_LOCAL_PATH, 'utf-8');
  }

  if (!content.includes('GEMINI_API_KEY=')) {
    const appendBlock = `\n# ---------------------------------------------------------\n# INTELIGENCIA ARTIFICIAL A COSTO $0 (Google AI Studio / Harness²)\n# ---------------------------------------------------------\nGEMINI_API_KEY=${apiKey}\nGOOGLE_API_KEY=${apiKey}\nMODEL_PROVIDER=google_ai_studio\nPRIMARY_MODEL_ID=gemini-3.8-flash\nIDE_AUTOMATION_MODEL=antigravity-preview-09-2026\nHARNESS2_LANGUAGE=es-419\n`;
    fs.writeFileSync(ROOT_ENV_LOCAL_PATH, content + appendBlock, 'utf-8');
    console.log(`✅ [HARNESS²] Variables sincronizadas en ${path.relative(ROOT_DIR, ROOT_ENV_LOCAL_PATH)}`);
  }
}

async function promptApiKey() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log('\n======================================================================');
    console.log('🤖 [HARNESS² SETUP] Configuración Requerida de Inteligencia Artificial');
    console.log('======================================================================');
    console.log('Para ejecutar la autorreflexión de arneses y Agency Swarm a Costo $0,');
    console.log('se requiere una API Key de Google AI Studio (gratuita).');
    console.log('👉 Obtenla en: https://aistudio.google.com/app/apikey\n');

    rl.question('🔑 Ingrese su GEMINI_API_KEY (presione Enter para omitir temporalmente): ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const rootEnvLocal = parseEnv(ROOT_ENV_LOCAL_PATH);
  const rootEnv = parseEnv(ROOT_ENV_PATH);
  const harnessEnv = parseEnv(HARNESS2_ENV_PATH);

  const existingKey = 
    harnessEnv.GEMINI_API_KEY || 
    harnessEnv.GOOGLE_API_KEY || 
    rootEnvLocal.GEMINI_API_KEY || 
    rootEnvLocal.GOOGLE_API_KEY || 
    rootEnv.GEMINI_API_KEY || 
    rootEnv.GOOGLE_API_KEY ||
    process.env.GEMINI_API_KEY;

  const isPlaceholder = !existingKey || existingKey.includes('tu_api_key') || existingKey.length < 10;

  if (!isPlaceholder) {
    // Sincronizar si harness2/.env no existe o le falta la clave
    if (!fs.existsSync(HARNESS2_ENV_PATH) || !harnessEnv.GEMINI_API_KEY) {
      writeHarnessEnv(existingKey);
    }
    appendToRootEnvLocal(existingKey);
    return;
  }

  // Si no está configurada y la terminal es interactiva
  if (process.stdin.isTTY) {
    const inputKey = await promptApiKey();
    if (inputKey && inputKey.length > 10) {
      writeHarnessEnv(inputKey);
      appendToRootEnvLocal(inputKey);
    } else {
      console.warn('⚠️ [HARNESS²] No se ingresó API Key válida. Se usará la plantilla por defecto.');
      if (!fs.existsSync(HARNESS2_ENV_PATH)) {
        if (fs.existsSync(HARNESS2_EXAMPLE_PATH)) {
          fs.copyFileSync(HARNESS2_EXAMPLE_PATH, HARNESS2_ENV_PATH);
        } else {
          writeHarnessEnv('tu_api_key_de_google_ai_studio_aqui');
        }
      }
    }
  } else {
    // Modo no interactivo (CI/Scripts automáticos)
    if (!fs.existsSync(HARNESS2_ENV_PATH)) {
      if (fs.existsSync(HARNESS2_EXAMPLE_PATH)) {
        fs.copyFileSync(HARNESS2_EXAMPLE_PATH, HARNESS2_ENV_PATH);
      } else {
        writeHarnessEnv('tu_api_key_de_google_ai_studio_aqui');
      }
      console.log('ℹ️ [HARNESS²] tools/harness2/.env inicializado desde plantilla en modo no interactivo.');
    }
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('❌ Error en setup-harness2-env:', err);
    process.exit(0); // No bloqueante
  });
}

module.exports = { main };
