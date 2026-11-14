/**
 * scripts/daemon/supervisor.cjs
 * Detached background supervisor process for MaestroPescadería Daemon.
 * Spawns and monitors worker.cjs with exponential backoff and circuit-breaker crash recovery,
 * persisting 24/7 across terminal and editor closures.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { loadDaemonEnv } = require('./env.cjs');
const logger = require('./logger.cjs');
const stateMgr = require('./state.cjs');

loadDaemonEnv();

const ROOT_DIR = path.resolve(__dirname, '../../');
const WORKER_SCRIPT = path.join(__dirname, 'worker.cjs');

const BACKOFF_DELAYS = [5000, 15000, 30000, 60000];
const MAX_RESTARTS_PER_HOUR = 10;
const restartTimestamps = [];

let currentWorkerProcess = null;
let restartCount = 0;
let isStopping = false;

function cleanRestartHistory() {
  const oneHourAgo = Date.now() - 3600000;
  while (restartTimestamps.length > 0 && restartTimestamps[0] < oneHourAgo) {
    restartTimestamps.shift();
  }
}

function spawnWorker() {
  if (isStopping) return;

  cleanRestartHistory();
  if (restartTimestamps.length >= MAX_RESTARTS_PER_HOUR) {
    logger.error(
      `[Supervisor] Circuit Breaker Activado: Demasiados reinicios (${restartTimestamps.length} en 1 hora). Deteniendo supervisor para proteger el sistema.`
    );
    stateMgr.clearPid();
    process.exit(1);
  }

  logger.info(`[Supervisor] Spawneando worker.cjs... (Intento #${restartCount + 1})`);

  // Open log file descriptors for worker stdio
  logger.ensureLogsDir();
  const outFd = fs.openSync(logger.STDOUT_LOG, 'a');
  const errFd = fs.openSync(logger.STDERR_LOG, 'a');

  const env = {
    ...process.env,
    MAESTRO_SUPERVISOR_PID: String(process.pid),
    NODE_ENV: 'production',
  };

  const child = spawn(process.execPath, [WORKER_SCRIPT], {
    cwd: ROOT_DIR,
    env,
    stdio: ['ignore', outFd, errFd],
    windowsHide: true,
  });

  currentWorkerProcess = child;
  const workerPid = child.pid;
  logger.info(`[Supervisor] Worker iniciado con PID: ${workerPid}`);

  // Write PID file for CLI inspection
  stateMgr.writePid(process.pid, workerPid);
  stateMgr.updateHeartbeat(process.pid, workerPid, 'RUNNING');

  child.on('exit', (code, signal) => {
    fs.closeSync(outFd);
    fs.closeSync(errFd);
    currentWorkerProcess = null;

    logger.info(`[Supervisor] Worker (PID: ${workerPid}) finalizó con código: ${code}, señal: ${signal}`);

    if (code === 0 || isStopping || stateMgr.shouldStop()) {
      logger.info('[Supervisor] Detención limpia del worker. Finalizando supervisor...');
      stateMgr.clearPid();
      stateMgr.clearStopSignal();
      process.exit(0);
    }

    // Unexpected crash -> apply backoff
    restartTimestamps.push(Date.now());
    const delay = BACKOFF_DELAYS[Math.min(restartCount, BACKOFF_DELAYS.length - 1)];
    restartCount++;
    logger.warn(`[Supervisor] Reiniciando worker en ${delay / 1000}s tras caída inesperada...`);

    setTimeout(spawnWorker, delay);
  });

  child.on('error', (err) => {
    logger.error(`[Supervisor] Error en proceso worker: ${err.message}`);
  });
}

function handleStopSignal() {
  if (isStopping) return;
  isStopping = true;
  logger.info('[Supervisor] Señal de terminación recibida. Cerrando worker...');

  if (currentWorkerProcess) {
    try {
      stateMgr.requestStop();
      // Give worker 5 seconds to gracefully stop
      setTimeout(() => {
        if (currentWorkerProcess) {
          try {
            process.kill(currentWorkerProcess.pid);
          } catch (_) {}
        }
        stateMgr.clearPid();
        process.exit(0);
      }, 5000);
    } catch (_) {}
  } else {
    stateMgr.clearPid();
    process.exit(0);
  }
}

function registerSupervisorHandlers() {
  process.on('SIGTERM', handleStopSignal);
  process.on('SIGINT', handleStopSignal);
}

function startSupervisor() {
  logger.info(`[Supervisor] Supervisor activo 24/7 (PID: ${process.pid}). Directorio: ${ROOT_DIR}`);
  spawnWorker();
}

if (require.main === module) {
  registerSupervisorHandlers();
  startSupervisor();
}

module.exports = {
  spawnWorker,
  handleStopSignal,
  startSupervisor,
};
