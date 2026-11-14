/**
 * scripts/daemon/logger.cjs
 * Zero-dependency rotated logging and structured JSON Lines logger for MaestroPescadería Daemon.
 */

const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.resolve(__dirname, '../../logs/daemon');
const STDOUT_LOG = path.join(LOGS_DIR, 'daemon.stdout.log');
const STDERR_LOG = path.join(LOGS_DIR, 'daemon.stderr.log');
const CYCLES_JSONL = path.join(LOGS_DIR, 'cycles.jsonl');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_ROTATIONS = 3;

function ensureLogsDir() {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
}

/**
 * Checks file size and rotates if >= maxBytes
 */
function rotateIfNeeded(filePath, maxBytes = MAX_FILE_SIZE) {
  try {
    if (!fs.existsSync(filePath)) return;
    const stats = fs.statSync(filePath);
    if (stats.size < maxBytes) return;

    for (let i = MAX_ROTATIONS - 1; i >= 1; i--) {
      const src = `${filePath}.${i}`;
      const dst = `${filePath}.${i + 1}`;
      if (fs.existsSync(src)) {
        if (i + 1 > MAX_ROTATIONS) {
          fs.unlinkSync(src);
        } else {
          fs.renameSync(src, dst);
        }
      }
    }
    const firstBackup = `${filePath}.1`;
    fs.renameSync(filePath, firstBackup);
  } catch (err) {
    // Fail silently in rotation so logging continues
  }
}

function formatMessage(level, args) {
  const timestamp = new Date().toISOString();
  const msg = args
    .map((arg) => (typeof arg === 'object' && arg !== null ? JSON.stringify(arg) : String(arg)))
    .join(' ');
  return `[${timestamp}] [${level}] ${msg}\n`;
}

function writeToFile(filePath, content) {
  ensureLogsDir();
  rotateIfNeeded(filePath);
  fs.appendFileSync(filePath, content, { encoding: 'utf8' });
}

function info(...args) {
  const line = formatMessage('INFO', args);
  writeToFile(STDOUT_LOG, line);
  if (process.env.DAEMON_VERBOSE === 'true' || process.stdout.isTTY) {
    process.stdout.write(line);
  }
}

function warn(...args) {
  const line = formatMessage('WARN', args);
  writeToFile(STDERR_LOG, line);
  if (process.env.DAEMON_VERBOSE === 'true' || process.stderr.isTTY) {
    process.stderr.write(line);
  }
}

function error(...args) {
  const line = formatMessage('ERROR', args);
  writeToFile(STDERR_LOG, line);
  if (process.env.DAEMON_VERBOSE === 'true' || process.stderr.isTTY) {
    process.stderr.write(line);
  }
}

/**
 * Appends a structured cycle summary to cycles.jsonl
 */
function logCycle(cycleData) {
  ensureLogsDir();
  rotateIfNeeded(CYCLES_JSONL);
  const jsonLine = JSON.stringify({
    timestamp: new Date().toISOString(),
    ...cycleData,
  }) + '\n';
  fs.appendFileSync(CYCLES_JSONL, jsonLine, { encoding: 'utf8' });
}

/**
 * Returns the last N lines from a log file
 */
function getRecentLogs(type = 'stdout', lineCount = 50) {
  const target = type === 'stderr' ? STDERR_LOG : STDOUT_LOG;
  if (!fs.existsSync(target)) return [];
  const content = fs.readFileSync(target, 'utf8');
  const lines = content.trim().split('\n');
  return lines.slice(-lineCount);
}

/**
 * Returns the last N cycle records from cycles.jsonl
 */
function getRecentCycles(count = 10) {
  if (!fs.existsSync(CYCLES_JSONL)) return [];
  const content = fs.readFileSync(CYCLES_JSONL, 'utf8');
  const lines = content.trim().split('\n').filter(Boolean);
  return lines.slice(-count).map((l) => {
    try {
      return JSON.parse(l);
    } catch {
      return null;
    }
  }).filter(Boolean);
}

module.exports = {
  LOGS_DIR,
  STDOUT_LOG,
  STDERR_LOG,
  CYCLES_JSONL,
  MAX_FILE_SIZE,
  ensureLogsDir,
  rotateIfNeeded,
  info,
  warn,
  error,
  logCycle,
  getRecentLogs,
  getRecentCycles,
};
