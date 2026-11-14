/**
 * scripts/daemon/state.cjs
 * State persistence, PID tracking, and Kanban synchronization for MaestroPescadería Daemon.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../');
const STATE_DIR = path.join(ROOT_DIR, '.daemon');
const STATE_FILE = path.join(STATE_DIR, 'state.json');
const LOGS_DIR = path.join(ROOT_DIR, 'logs/daemon');
const PID_FILE = path.join(LOGS_DIR, '.daemon.pid');
const STOP_SIGNAL_FILE = path.join(LOGS_DIR, '.stop_signal');
const KANBAN_FILE = path.join(ROOT_DIR, 'DOCS/AUTONOMOUS_KANBAN.md');

function ensureDirectories() {
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
  const docsDir = path.dirname(KANBAN_FILE);
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
}

const DEFAULT_STATE = {
  daemon: {
    status: 'STOPPED',
    supervisorPid: 0,
    workerPid: 0,
    startedAt: new Date().toISOString(),
    uptimeSeconds: 0,
    lastHeartbeat: new Date().toISOString(),
  },
  audit: {
    lastAuditAt: '',
    lastAuditCycle: 0,
    results: {
      tsc: 'PASS',
      solidBoundaries: 'PASS',
      lint: { errors: 0, warnings: 0 },
      vitest: 'PASS',
    },
  },
  queue: [],
  activeTask: null, // WIP = 1 enforcement
  completedTasks: [],
};

/**
 * Checks if a PID is alive without killing it
 */
function isProcessAlive(pid) {
  if (!pid || typeof pid !== 'number' || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === 'EPERM'; // Process exists but permission denied
  }
}

/**
 * Reads current state snapshot
 */
function getState() {
  ensureDirectories();
  if (!fs.existsSync(STATE_FILE)) {
    saveState(DEFAULT_STATE);
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
}

/**
 * Atomically saves state snapshot to disk and syncs Kanban
 */
function saveState(state) {
  ensureDirectories();
  const tmpFile = `${STATE_FILE}.tmp`;
  const serialized = JSON.stringify(state, null, 2);
  fs.writeFileSync(tmpFile, serialized, 'utf8');

  // Retry loop for Windows / OneDrive transient EPERM locks (RN-23)
  let attempts = 5;
  while (attempts > 0) {
    try {
      fs.renameSync(tmpFile, STATE_FILE);
      break;
    } catch (err) {
      attempts--;
      if (attempts === 0) throw err;
      try {
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
      } catch (_) {
        const until = Date.now() + 50;
        while (Date.now() < until) {}
      }
    }
  }

  // Also mirror to logs/daemon/daemon.state.json for CLI compatibility
  try {
    const mirrorFile = path.join(LOGS_DIR, 'daemon.state.json');
    fs.writeFileSync(mirrorFile, serialized, 'utf8');
  } catch (_) {}

  // Sync Markdown Kanban board
  syncKanbanMarkdown(state);
}

/**
 * Updates daemon heartbeat and calculates uptime
 */
function updateHeartbeat(supervisorPid, workerPid, status = 'RUNNING') {
  const state = getState();
  const now = new Date();
  state.daemon.status = status;
  if (supervisorPid) state.daemon.supervisorPid = supervisorPid;
  if (workerPid) state.daemon.workerPid = workerPid;
  state.daemon.lastHeartbeat = now.toISOString();

  if (state.daemon.startedAt) {
    const startMs = new Date(state.daemon.startedAt).getTime();
    state.daemon.uptimeSeconds = Math.max(0, Math.floor((now.getTime() - startMs) / 1000));
  }
  saveState(state);
}

/**
 * Generates and writes DOCS/AUTONOMOUS_KANBAN.md strictly enforcing WIP = 1
 */
function syncKanbanMarkdown(state) {
  try {
    const activeTask = state.queue.find((t) => t.id === state.activeTask);
    const inReview = state.queue.filter((t) => t.status === 'AUTHORIZED');
    const todoTasks = state.queue.filter((t) => t.status === 'DETECTED' || t.status === 'QUEUED');
    const completed = state.completedTasks || [];

    const lines = [
      '# Autonomous Agency — Continuous Kanban Board',
      '',
      `> **Última sincronización:** ${state.daemon.lastHeartbeat || new Date().toISOString()}`,
      `> **Estado Daemon:** \`${state.daemon.status}\` | **Supervisor PID:** \`${state.daemon.supervisorPid}\` | **Worker PID:** \`${state.daemon.workerPid}\``,
      `> **Límite WIP:** \`1\` tarea activa simultánea estricta.`,
      '',
      '## 📋 Tablero de Flujo Continuo',
      '',
      '### 1. 📥 Por Hacer / Backlog (To Do)',
      todoTasks.length === 0 ? '_No hay tareas pendientes en cola._' : '',
    ];

    todoTasks.forEach((t) => {
      lines.push(`- **[#${t.numericIndex}] ${t.title}**`);
      lines.push(`  - **ID:** \`${t.id}\` | **Rol:** \`@${t.role}\` | **Prioridad:** \`${t.priority}\``);
      lines.push(`  - **Origen:** \`${t.source}\` | **Detectado:** ${t.detectedAt}`);
    });

    lines.push('');
    lines.push('### 2. ⚡ En Proceso (In Progress - WIP = 1)');
    if (activeTask) {
      lines.push(`- **[#${activeTask.numericIndex}] ${activeTask.title}** (ACTIVA)`);
      lines.push(`  - **ID:** \`${activeTask.id}\` | **Rol:** \`@${activeTask.role}\` | **Prioridad:** \`${activeTask.priority}\``);
      lines.push(`  - **Estado:** \`${activeTask.status}\` | **Iniciado:** ${activeTask.detectedAt}`);
    } else {
      lines.push('_Ninguna tarea en progreso activo._');
    }

    lines.push('');
    lines.push('### 3. 🔍 En Revisión / Autorizadas (In Review)');
    if (inReview.length === 0) {
      lines.push('_No hay tareas en revisión._');
    } else {
      inReview.forEach((t) => {
        lines.push(`- **[#${t.numericIndex}] ${t.title}** (\`AUTORIZADA - ESPERANDO TURNO WIP=1\`)`);
        lines.push(`  - **ID:** \`${t.id}\` | **Rol:** \`@${t.role}\``);
      });
    }

    lines.push('');
    lines.push('### 4. ✅ Terminado (Done)');
    if (completed.length === 0) {
      lines.push('_No hay tareas terminadas aún._');
    } else {
      completed.slice(-10).forEach((tId) => {
        lines.push(`- \`${tId}\``);
      });
    }

    lines.push('');
    lines.push('---');
    lines.push('### 📊 Resumen de Última Auditoría');
    lines.push(`- **Ciclo:** #${state.audit.lastAuditCycle} (${state.audit.lastAuditAt || 'N/A'})`);
    lines.push(`- **TypeScript (tsc):** \`${state.audit.results.tsc}\``);
    lines.push(`- **SOLID Boundaries:** \`${state.audit.results.solidBoundaries}\``);
    lines.push(`- **ESLint:** ${state.audit.results.lint.errors} errores, ${state.audit.results.lint.warnings} advertencias`);
    lines.push(`- **Vitest:** \`${state.audit.results.vitest}\``);
    lines.push('');

    fs.writeFileSync(KANBAN_FILE, lines.join('\n'), 'utf8');
  } catch (err) {
    // Fail silently in markdown sync so core execution is uninterrupted
  }
}

/**
 * Reorders tasks in queue based on numeric indices or IDs
 */
function reorderQueue(orderedIndices) {
  const state = getState();
  if (!Array.isArray(orderedIndices)) return state;
  const queue = state.queue;
  const newQueue = [];
  const invalidIndices = [];

  for (const idx of orderedIndices) {
    const found = queue.find((t) => t.numericIndex === idx || t.id === String(idx));
    if (found) {
      if (!newQueue.some((q) => q.id === found.id)) {
        newQueue.push(found);
      }
    } else {
      invalidIndices.push(idx);
    }
  }

  // Append remaining tasks not mentioned in order
  for (const t of queue) {
    if (!newQueue.some((q) => q.id === t.id)) {
      newQueue.push(t);
    }
  }

  state.queue = newQueue;
  saveState(state);
  return { success: true, invalidIndices, reorderedCount: newQueue.length };
}

/**
 * Marks a task as AUTHORIZED by user
 */
function authorizeTask(identifier) {
  const state = getState();
  const task = state.queue.find(
    (t) => t.numericIndex === Number(identifier) || t.id === String(identifier)
  );
  if (!task) {
    return { success: false, error: `Tarea ${identifier} no encontrada.` };
  }
  task.status = 'AUTHORIZED';
  task.authorizedAt = new Date().toISOString();
  saveState(state);
  return { success: true, task };
}

/**
 * Discards or rejects a task
 */
function discardTask(identifier) {
  const state = getState();
  const taskIdx = state.queue.findIndex(
    (t) => t.numericIndex === Number(identifier) || t.id === String(identifier)
  );
  if (taskIdx === -1) {
    return { success: false, error: `Tarea ${identifier} no encontrada.` };
  }
  const [removed] = state.queue.splice(taskIdx, 1);
  removed.status = 'DISCARDED';
  if (state.activeTask === removed.id || state.activeTask === String(identifier)) {
    state.activeTask = null;
  }
  saveState(state);
  return { success: true, task: removed };
}

/**
 * Enforces WIP = 1: picks the next authorized task and starts it if idle
 */
function startNextTask() {
  const state = getState();
  if (state.activeTask) {
    return { started: false, reason: 'WIP_LIMIT_REACHED', activeTaskId: state.activeTask };
  }
  const next = state.queue.find((t) => t.status === 'AUTHORIZED');
  if (!next) {
    return { started: false, reason: 'NO_AUTHORIZED_TASKS' };
  }
  next.status = 'IN_PROGRESS';
  state.activeTask = next.id;
  saveState(state);
  return { started: true, task: next };
}

/**
 * Completes the currently active task
 */
function completeTask(taskId) {
  const state = getState();
  const idx = state.queue.findIndex((t) => t.id === taskId);
  if (idx !== -1) {
    state.queue[idx].status = 'COMPLETED';
    state.queue[idx].completedAt = new Date().toISOString();
    state.completedTasks.push(taskId);
    state.queue.splice(idx, 1);
  }
  if (state.activeTask === taskId) {
    state.activeTask = null;
  }
  saveState(state);
  return { success: true };
}

/**
 * PID file management
 */
function writePid(supervisorPid, workerPid) {
  ensureDirectories();
  const data = {
    supervisorPid,
    workerPid,
    startedAt: new Date().toISOString(),
  };
  fs.writeFileSync(PID_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function readPid() {
  ensureDirectories();
  if (!fs.existsSync(PID_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(PID_FILE, 'utf8'));
  } catch {
    return null;
  }
}

function clearPid() {
  if (fs.existsSync(PID_FILE)) {
    try {
      fs.unlinkSync(PID_FILE);
    } catch (_) {}
  }
}

/**
 * Stop signal sentinel
 */
function requestStop() {
  ensureDirectories();
  fs.writeFileSync(STOP_SIGNAL_FILE, new Date().toISOString(), 'utf8');
}

function shouldStop() {
  return fs.existsSync(STOP_SIGNAL_FILE);
}

function clearStopSignal() {
  if (fs.existsSync(STOP_SIGNAL_FILE)) {
    try {
      fs.unlinkSync(STOP_SIGNAL_FILE);
    } catch (_) {}
  }
}

module.exports = {
  STATE_DIR,
  STATE_FILE,
  PID_FILE,
  STOP_SIGNAL_FILE,
  KANBAN_FILE,
  isProcessAlive,
  getState,
  saveState,
  writeState: saveState,
  updateHeartbeat,
  syncKanbanMarkdown,
  reorderQueue,
  authorizeTask,
  discardTask,
  startNextTask,
  completeTask,
  writePid,
  readPid,
  clearPid,
  requestStop,
  shouldStop,
  clearStopSignal,
};
