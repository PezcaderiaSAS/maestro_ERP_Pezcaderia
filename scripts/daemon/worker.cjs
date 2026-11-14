/**
 * scripts/daemon/worker.cjs
 * Main 24/7 Infinite Control Loop Worker for MaestroPescadería Autonomous Agency.
 * Coordinates recurrent multi-tier audits, WhatsApp webhook server, Kanban state (WIP=1),
 * and structured cycle logging.
 */

const { loadDaemonEnv } = require('./env.cjs');
const logger = require('./logger.cjs');
const stateMgr = require('./state.cjs');
const auditRunner = require('./audit-runner.cjs');
const webhookServer = require('./webhook-server.cjs');

loadDaemonEnv();

const CYCLE_INTERVAL_MS = parseInt(process.env.CYCLE_INTERVAL_SECONDS || '60', 10) * 1000;
const WEBHOOK_PORT = parseInt(process.env.WHATSAPP_WEBHOOK_PORT || '3005', 10);
const SUPERVISOR_PID = parseInt(process.env.MAESTRO_SUPERVISOR_PID || '0', 10);

/**
 * Resolves SDD bridge dry-run mode dynamically (`true` unless `DAEMON_SDD_DRY_RUN === 'false'`).
 */
function resolveDryRunMode(env = process.env) {
  const raw = String((env && env.DAEMON_SDD_DRY_RUN) || 'true').trim().toLowerCase();
  return raw !== 'false';
}

/**
 * Dispatches an authorized Kanban task to the SDD bridge and notifies admin WhatsApp when configured.
 */
function dispatchStartedTask(task, deps = { auditRunner, webhookServer, logger }) {
  const dryRun = resolveDryRunMode(process.env);
  const bridgeResult = deps.auditRunner.dispatchTaskToBridge(task, dryRun);
  if (deps.webhookServer && typeof deps.webhookServer.sendEvolutionNotification === 'function') {
    const modeLabel = dryRun ? 'simulación (--dry-run)' : 'ejecución SDD';
    const statusIcon = bridgeResult && bridgeResult.success ? '⚡' : '⚠️';
    const msg = `${statusIcon} *Tarea [#${task.numericIndex}]* "${task.title}" (@${task.role}) despachada en modo ${modeLabel}.`;
    void deps.webhookServer.sendEvolutionNotification(msg);
  }
  return { dryRun, bridgeResult };
}

let webhookHandle = null;
let isStopping = false;
let immediateAuditRequested = false;
let loopTimer = null;
let cycleCounter = 0;

function handleAuditRequest() {
  logger.info('[Worker] Solicitud de auditoría inmediata recibida vía WhatsApp.');
  immediateAuditRequested = true;
  if (loopTimer) {
    clearTimeout(loopTimer);
    setImmediate(runControlLoopStep);
  }
}

async function startWebhook() {
  try {
    webhookHandle = await webhookServer.createWebhookServer({
      port: WEBHOOK_PORT,
      onAuditRequested: handleAuditRequest,
    });
    logger.info(`[Worker] Servidor de WhatsApp Webhook activo en puerto ${WEBHOOK_PORT}`);
  } catch (err) {
    logger.error(`[Worker] Error iniciando Webhook Server: ${err.message}`);
  }
}

async function runControlLoopStep() {
  if (isStopping) return;

  // Check if stop was requested via sentinel file
  if (stateMgr.shouldStop()) {
    logger.info('[Worker] Señal de detención detectada (.stop_signal). Cerrando...');
    await gracefulShutdown();
    return;
  }

  cycleCounter++;
  const cycleStart = Date.now();
  logger.info(`[Worker] Iniciando Ciclo de Control #${cycleCounter}...`);

  // Update heartbeat in state
  stateMgr.updateHeartbeat(SUPERVISOR_PID, process.pid, 'RUNNING');

  // Determine audit tier:
  // - If manually requested: Tier 2 (includes tsc + lint)
  // - Every 5 cycles: Tier 2
  // - Every 20 cycles: Tier 3
  // - Otherwise: Tier 1 (Instant SOLID <500ms)
  let auditTier = 1;
  if (immediateAuditRequested) {
    auditTier = 2;
    immediateAuditRequested = false;
  } else if (cycleCounter % 20 === 0) {
    auditTier = 3;
  } else if (cycleCounter % 5 === 0) {
    auditTier = 2;
  }

  let auditSummary = null;
  try {
    auditSummary = auditRunner.runAuditCycle(auditTier);
  } catch (err) {
    logger.error(`[Worker] Error en auditoría de ciclo #${cycleCounter}: ${err.message}`);
  }

  // Check task execution status under Lean Kanban WIP = 1
  const currentState = stateMgr.getState();
  let actionTaken = 'IDLE_MONITORING';

  if (currentState.activeTask) {
    actionTaken = `TASK_ACTIVE_${currentState.activeTask}`;
    logger.info(`[Worker] Tarea activa en progreso (WIP = 1): ${currentState.activeTask}`);
  } else {
    // Attempt to start next authorized task
    const startResult = stateMgr.startNextTask();
    if (startResult.started) {
      actionTaken = `TASK_STARTED_${startResult.task.id}`;
      logger.info(
        `[Worker] Iniciando tarea autorizada: [#${startResult.task.numericIndex}] ${startResult.task.title} (Rol: @${startResult.task.role})`
      );
      dispatchStartedTask(startResult.task);
    }
  }

  const durationMs = Date.now() - cycleStart;

  // Structured cycle log entry in cycles.jsonl
  logger.logCycle({
    cycleId: cycleCounter,
    workerPid: process.pid,
    supervisorPid: SUPERVISOR_PID,
    durationMs,
    tier: auditTier,
    audit: auditSummary ? auditSummary.results : currentState.audit.results,
    newTasksDetected: auditSummary ? auditSummary.newCandidateTasks.length : 0,
    totalQueued: currentState.queue.length,
    activeTask: currentState.activeTask,
    actionTaken,
  });

  logger.info(`[Worker] Ciclo #${cycleCounter} completado en ${durationMs}ms. Acción: ${actionTaken}`);

  // Schedule next iteration
  if (!isStopping) {
    loopTimer = setTimeout(runControlLoopStep, CYCLE_INTERVAL_MS);
  }
}

async function gracefulShutdown() {
  if (isStopping) return;
  isStopping = true;
  logger.info('[Worker] Deteniendo worker y liberando recursos...');

  if (loopTimer) {
    clearTimeout(loopTimer);
    loopTimer = null;
  }

  if (webhookHandle && typeof webhookHandle.close === 'function') {
    try {
      await webhookHandle.close();
      logger.info('[Worker] Servidor HTTP cerrado correctamente.');
    } catch (_) {}
  }

  // Update state to STOPPED
  const state = stateMgr.getState();
  state.daemon.status = 'STOPPED';
  state.daemon.workerPid = 0;
  stateMgr.saveState(state);
  stateMgr.clearStopSignal();

  logger.info('[Worker] Worker detenido limpiamente. Saliendo con código 0.');
  process.exit(0);
}

function registerProcessHandlers() {
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  process.on('uncaughtException', (err) => {
    logger.error(`[Worker] Uncaught Exception: ${err.message}\n${err.stack}`);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error(`[Worker] Unhandled Rejection: ${reason}`);
    process.exit(1);
  });
}

// Initialization (only auto-start when invoked as process entry point)
if (require.main === module) {
  registerProcessHandlers();
  (async () => {
    logger.info(`[Worker] Iniciando Infinite Control Loop 24/7 (PID: ${process.pid})...`);
    await startWebhook();
    await runControlLoopStep();
  })();
}

module.exports = {
  resolveDryRunMode,
  dispatchStartedTask,
  runControlLoopStep,
  startWebhook,
  gracefulShutdown,
};
