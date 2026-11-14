/**
 * scripts/daemon/env.cjs
 * Zero-dependency loader for `.env` and `.env.local` in MaestroPescadería Daemon.
 * Precedence: existing process.env > .env.local > .env
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_ROOT_DIR = path.resolve(__dirname, '../../');
const DEFAULT_ENV_FILES = ['.env', '.env.local'];
const VALID_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

let processEnvLoaded = false;
let lastProcessSummary = { loadedFiles: [], loadedKeysCount: 0 };

/**
 * Unquotes and normalizes a raw `.env` assignment value.
 * Supports double quotes, single quotes, and unquoted inline `#` comments.
 */
function parseEnvValue(rawValue) {
  const trimmed = String(rawValue || '').trim();
  if (!trimmed) return '';

  const quote = trimmed[0];
  if ((quote === '"' || quote === "'") && trimmed.length >= 2 && trimmed[trimmed.length - 1] === quote) {
    const inner = trimmed.slice(1, -1);
    if (quote === '"') {
      return inner
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
    }
    return inner;
  }

  return trimmed.replace(/\s+#.*$/, '').trim();
}

/**
 * Parses `.env` file content into ordered `[key, value]` pairs.
 */
function parseEnvContent(content) {
  const entries = [];
  const lines = String(content || '').split(/\r?\n/);

  for (const rawLine of lines) {
    let line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    if (line.startsWith('export ')) {
      line = line.slice('export '.length).trim();
    }

    const eqIndex = line.indexOf('=');
    if (eqIndex <= 0) continue;

    const key = line.slice(0, eqIndex).trim();
    if (!VALID_KEY_PATTERN.test(key)) continue;

    const value = parseEnvValue(line.slice(eqIndex + 1));
    entries.push([key, value]);
  }

  return entries;
}

/**
 * Loads `.env` and `.env.local` into `targetEnv` without external dependencies.
 * Existing keys in `targetEnv` (e.g., PM2 or parent shell) are preserved unless `override: true`.
 */
function loadDaemonEnv(options = {}) {
  const rootDir = options.rootDir || DEFAULT_ROOT_DIR;
  const targetEnv = options.targetEnv || process.env;
  const files = Array.isArray(options.files) ? options.files : DEFAULT_ENV_FILES;
  const override = Boolean(options.override);
  const force = Boolean(options.force);
  const isDefaultProcessEnv = targetEnv === process.env && !options.rootDir && !options.files;

  if (isDefaultProcessEnv && processEnvLoaded && !force && !override) {
    return lastProcessSummary;
  }

  const protectedKeys = override ? new Set() : new Set(Object.keys(targetEnv));
  const loadedFiles = [];
  let loadedKeysCount = 0;

  for (const fileName of files) {
    const filePath = path.isAbsolute(fileName) ? fileName : path.join(rootDir, fileName);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, 'utf8');
    const entries = parseEnvContent(content);
    loadedFiles.push(fileName);

    for (const [key, value] of entries) {
      if (protectedKeys.has(key)) continue;
      targetEnv[key] = value;
      loadedKeysCount += 1;
    }
  }

  const summary = { loadedFiles, loadedKeysCount };
  if (isDefaultProcessEnv) {
    processEnvLoaded = true;
    lastProcessSummary = summary;
  }

  return summary;
}

module.exports = {
  DEFAULT_ROOT_DIR,
  DEFAULT_ENV_FILES,
  parseEnvValue,
  parseEnvContent,
  loadDaemonEnv,
};

