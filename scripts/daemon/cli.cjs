/**
 * scripts/daemon/cli.cjs
 * Unified Command-Line Interface controller for MaestroPescadería 24/7 Daemon.
 * Commands: start [--detached], stop, restart, status, logs [--cycles] [--lines N].
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { loadDaemonEnv } = require('./env.cjs');
const stateMgr = require('./state.cjs');
const logger = require('./logger.cjs');

loadDaemonEnv();

const ROOT_DIR = path.resolve(__dirname, '../../');
const SUPERVISOR_SCRIPT = path.join(__dirname, 'supervisor.cjs');
const PLACEHOLDER_VALUES = new Set([
  'tu_api_key_de_evolution_aqui',
  'tu_secreto_webhook_evolution',
  'tu_api_key_de_google_ai_studio_aqui',
]);
const PLACEHOLDER_PHONES = new Set(['573001234567', '573109876543']);

function isMissingOrPlaceholder(val) {
  const trimmed = String(val || '').trim();
  return !trimmed || PLACEHOLDER_VALUES.has(trimmed);
}

/**
 * Evaluates Evolution API and daemon runtime readiness without exposing secret values.
 */
function inspectEvolutionReadiness(env = process.env) {
  const missing = [];
  const apiUrl = String((env && env.EVOLUTION_API_URL) || '').trim();
  const apiKey = String((env && env.EVOLUTION_API_KEY) || '').trim();
  const instance = String((env && env.EVOLUTION_INSTANCE) || '').trim();

  if (isMissingOrPlaceholder(apiUrl)) missing.push('EVOLUTION_API_URL');
  if (isMissingOrPlaceholder(apiKey)) missing.push('EVOLUTION_API_KEY');
  if (isMissingOrPlaceholder(instance)) missing.push('EVOLUTION_INSTANCE');

  let apiHost = 'N/A';
  if (!isMissingOrPlaceholder(apiUrl)) {
    try {
      apiHost = new URL(apiUrl).host || apiUrl;
    } catch (_) {
      apiHost = 'URL inválida';
    }
  }

  const webhookPort = parseInt(String((env && env.WHATSAPP_WEBHOOK_PORT) || '3005'), 10) || 3005;
  const tscTimeoutMs = Math.max(
    10000,
    parseInt(String((env && env.DAEMON_TSC_TIMEOUT_MS) || '90000'), 10) || 90000
  );
  const dryRun = String((env && env.DAEMON_SDD_DRY_RUN) || 'true').trim().toLowerCase() !== 'false';
  const adminPhones = String((env && env.WHATSAPP_ADMIN_PHONES) || '')
    .split(',')
    .map((p) => p.replace(/\D/g, '') || p.trim())
    .filter((p) => Boolean(p) && !PLACEHOLDER_PHONES.has(p));
  const allowSelfChat = String((env && env.EVOLUTION_ALLOW_SELF_CHAT) || 'false').trim().toLowerCase() === 'true';

  return {
    configured: missing.length === 0,
    missing,
    apiHost,
    instance: isMissingOrPlaceholder(instance) ? 'N/A' : instance,
    webhookSecretConfigured: !isMissingOrPlaceholder(env && env.EVOLUTION_WEBHOOK_SECRET),
    adminPhonesConfigured: adminPhones.length > 0,
    adminPhonesCount: adminPhones.length,
    allowSelfChat,
    webhookPort,
    dryRun,
    tscTimeoutMs,
  };
}

function getRunningProcessInfo() {
  const pidInfo = stateMgr.readPid();
  if (!pidInfo) {
    const st = stateMgr.getState();
    if (st.daemon && st.daemon.status === 'RUNNING') {
      st.daemon.status = 'STOPPED';
      st.daemon.supervisorPid = 0;
      st.daemon.workerPid = 0;
      stateMgr.saveState(st);
    }
    return null;
  }

  const supAlive = stateMgr.isProcessAlive(pidInfo.supervisorPid);
  const wrkAlive = stateMgr.isProcessAlive(pidInfo.workerPid);

  if (!supAlive && !wrkAlive) {
    stateMgr.clearPid();
    const st = stateMgr.getState();
    st.daemon.status = 'STOPPED';
    st.daemon.supervisorPid = 0;
    st.daemon.workerPid = 0;
    stateMgr.saveState(st);
    return null;
  }

  return {
    supervisorPid: pidInfo.supervisorPid,
    workerPid: pidInfo.workerPid,
    supervisorAlive: supAlive,
    workerAlive: wrkAlive,
  };
}

function startDaemon(detached = true) {
  const existing = getRunningProcessInfo();
  if (existing) {
    console.log(`⚠️  El daemon ya se encuentra en ejecución.`);
    console.log(`   Supervisor PID: ${existing.supervisorPid} (Activo: ${existing.supervisorAlive})`);
    console.log(`   Worker PID:     ${existing.workerPid} (Activo: ${existing.workerAlive})`);
    return;
  }

  const evo = inspectEvolutionReadiness(process.env);
  if (!evo.configured) {
    console.log(
      `⚠️  Evolution API sin configurar (${evo.missing.join(', ')}). El webhook operará en modo HTTP local pasivo sin envío WhatsApp.`
    );
  }
  if (!evo.adminPhonesConfigured) {
    console.log(
      `⚠️  WHATSAPP_ADMIN_PHONES sin configurar en .env.local. Los mensajes entrantes serán bloqueados hasta definir tu número real.`
    );
  }

  stateMgr.clearStopSignal();
  logger.ensureLogsDir();

  if (detached) {
    console.log('🚀 Iniciando MaestroPescadería Daemon 24/7 en segundo plano...');

    const child = spawn(process.execPath, [SUPERVISOR_SCRIPT], {
      cwd: ROOT_DIR,
      stdio: 'ignore',
      detached: true,
      windowsHide: true,
    });

    child.unref();

    // Brief poll to confirm PID file creation
    let attempts = 0;
    const maxAttempts = 15;
    const interval = setInterval(() => {
      attempts++;
      const pids = stateMgr.readPid();
      if (pids && pids.supervisorPid) {
        clearInterval(interval);
        console.log(`✅ Daemon 24/7 desplegado y persistente exitosamente.`);
        console.log(`   Supervisor PID: ${pids.supervisorPid}`);
        console.log(`   Worker PID:     ${pids.workerPid || 'Iniciando...'}`);
        console.log(`   Webhook Port:   ${evo.webhookPort}`);
        console.log(`   Logs:           ${logger.STDOUT_LOG}`);
        console.log(`   Tablero Kanban: DOCS/AUTONOMOUS_KANBAN.md\n`);
        process.exit(0);
      }
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        console.log(`✅ Daemon spawn enviado con PID supervisor inicial: ${child.pid}`);
        process.exit(0);
      }
    }, 200);
  } else {
    console.log('🚀 Iniciando daemon en primer plano (Foreground)...');
    require('./supervisor.cjs').startSupervisor();
  }
}

function stopDaemon(onStopped = null) {
  const existing = getRunningProcessInfo();
  if (!existing) {
    console.log('ℹ️  El daemon no se encuentra en ejecución.');
    stateMgr.clearStopSignal();
    if (typeof onStopped === 'function') {
      onStopped();
    } else {
      process.exit(0);
    }
    return;
  }

  console.log(`🛑 Solicitando detención elegante de daemon...`);
  console.log(`   Supervisor PID: ${existing.supervisorPid}, Worker PID: ${existing.workerPid}`);

  stateMgr.requestStop();

  let waited = 0;
  const timeoutMs = 8000;
  const pollInterval = 400;

  const timer = setInterval(() => {
    waited += pollInterval;
    const supAlive = stateMgr.isProcessAlive(existing.supervisorPid);
    const wrkAlive = stateMgr.isProcessAlive(existing.workerPid);

    if (!supAlive && !wrkAlive) {
      clearInterval(timer);
      stateMgr.clearPid();
      stateMgr.clearStopSignal();
      const st = stateMgr.getState();
      st.daemon.status = 'STOPPED';
      st.daemon.supervisorPid = 0;
      st.daemon.workerPid = 0;
      stateMgr.saveState(st);
      console.log('✅ Daemon detenido limpiamente.');
      if (typeof onStopped === 'function') {
        onStopped();
      } else {
        process.exit(0);
      }
      return;
    }

    if (waited >= timeoutMs) {
      clearInterval(timer);
      console.log('⚠️  Tiempo de espera agotado. Forzando detención de procesos...');
      if (supAlive) {
        try {
          process.platform === 'win32'
            ? execSync(`taskkill /F /PID ${existing.supervisorPid}`, { stdio: 'ignore' })
            : process.kill(existing.supervisorPid, 'SIGKILL');
        } catch (_) {}
      }
      if (wrkAlive) {
        try {
          process.platform === 'win32'
            ? execSync(`taskkill /F /PID ${existing.workerPid}`, { stdio: 'ignore' })
            : process.kill(existing.workerPid, 'SIGKILL');
        } catch (_) {}
      }
      stateMgr.clearPid();
      stateMgr.clearStopSignal();
      const st = stateMgr.getState();
      st.daemon.status = 'STOPPED';
      st.daemon.supervisorPid = 0;
      st.daemon.workerPid = 0;
      stateMgr.saveState(st);
      console.log('✅ Procesos finalizados forzosamente.');
      if (typeof onStopped === 'function') {
        onStopped();
      } else {
        process.exit(0);
      }
      return;
    }
  }, pollInterval);
}

function printStatus() {
  const existing = getRunningProcessInfo();
  const st = stateMgr.getState();
  const evo = inspectEvolutionReadiness(process.env);
  const isRunning = !!existing;

  console.log('\n======================================================');
  console.log('  MAESTRO PESCADERÍA — 24/7 INFINITE CONTROL LOOP STATUS');
  console.log('======================================================');
  console.log(`Estado:           ${isRunning ? '🟢 RUNNING (Activo 24/7)' : '🔴 STOPPED (Detenido)'}`);
  console.log(`Supervisor PID:   ${existing ? existing.supervisorPid : 'N/A'}`);
  console.log(`Worker PID:       ${existing ? existing.workerPid : 'N/A'}`);
  console.log(`Uptime:           ${Math.floor((st.daemon.uptimeSeconds || 0) / 60)} min (${st.daemon.uptimeSeconds || 0}s)`);
  console.log(`Último Heartbeat: ${st.daemon.lastHeartbeat || 'N/A'}`);
  console.log(`WhatsApp Webhook: http://127.0.0.1:${evo.webhookPort}/api/whatsapp/webhook`);
  console.log(
    `Evolution API:    ${evo.configured ? `✅ Configurada (Host: ${evo.apiHost}, Instancia: ${evo.instance})` : `⚠️ Pendiente (Faltan: ${evo.missing.join(', ')})`}`
  );
  console.log(
    `Admin WhatsApp:   ${evo.adminPhonesConfigured ? `✅ ${evo.adminPhonesCount} número(s) autorizado(s)` : '⚠️ Pendiente (Define WHATSAPP_ADMIN_PHONES en .env.local)'}`
  );
  console.log(
    `Self-Chat (fromMe): ${evo.allowSelfChat ? '✅ Habilitado (1 número con anti-bucle)' : '🔒 Desactivado (solo mensajes entrantes)'}`
  );
  console.log(`Puente SDD:       ${evo.dryRun ? '🛡️ Simulación (--dry-run)' : '🚀 Ejecución real'} | tsc timeout: ${evo.tscTimeoutMs}ms`);
  console.log('------------------------------------------------------');
  console.log('Auditorías Recientes:');
  console.log(`  Último Ciclo:   #${st.audit.lastAuditCycle} (${st.audit.lastAuditAt || 'N/A'})`);
  console.log(`  TypeScript:     ${st.audit.results.tsc}`);
  console.log(`  SOLID Bounds:   ${st.audit.results.solidBoundaries}`);
  console.log(`  ESLint:         ${st.audit.results.lint.errors} err, ${st.audit.results.lint.warnings} warn`);
  console.log(`  Vitest Tests:   ${st.audit.results.vitest}`);
  console.log('------------------------------------------------------');
  console.log('Gobernanza Lean Kanban (WIP = 1):');
  console.log(`  Tarea Activa:   ${st.activeTask ? `⚡ ${st.activeTask}` : 'Ninguna (En reposo)'}`);
  console.log(`  Tareas en Cola: ${st.queue.length}`);
  console.log(`  Completadas:    ${st.completedTasks.length}`);
  console.log('======================================================\n');
}

function showLogs(options = {}) {
  if (options.cycles) {
    const cycles = logger.getRecentCycles(options.lines || 10);
    console.log(`\n--- Últimos ${cycles.length} Ciclos de Control (cycles.jsonl) ---`);
    for (const c of cycles) {
      console.log(JSON.stringify(c, null, 2));
    }
  } else {
    const lines = logger.getRecentLogs('stdout', options.lines || 40);
    console.log(`\n--- Registro de Actividad (${logger.STDOUT_LOG}) ---`);
    if (lines.length === 0) {
      console.log('_No hay registros aún en el archivo de log._');
    } else {
      console.log(lines.join('\n'));
    }
  }
}

// CLI Arg Parsing
if (require.main === module) {
  const command = (process.argv[2] || 'status').toLowerCase();
  const flags = process.argv.slice(3);

  switch (command) {
    case 'start': {
      const isForeground = flags.includes('--foreground');
      startDaemon(!isForeground);
      break;
    }

    case 'stop': {
      stopDaemon();
      break;
    }

    case 'restart': {
      console.log('🔄 Reiniciando daemon...');
      stopDaemon(() => {
        startDaemon(true);
      });
      break;
    }

    case 'status': {
      printStatus();
      break;
    }

    case 'logs': {
      const isCycles = flags.includes('--cycles');
      const linesIdx = flags.indexOf('--lines');
      const lineCount = linesIdx !== -1 && flags[linesIdx + 1] ? parseInt(flags[linesIdx + 1], 10) : 40;
      showLogs({ cycles: isCycles, lines: lineCount });
      break;
    }

    default: {
      console.log(`Comando '${command}' no reconocido.`);
      console.log('Comandos disponibles: start [--detached|--foreground], stop, restart, status, logs [--cycles] [--lines N]');
      process.exit(1);
    }
  }
}

module.exports = {
  inspectEvolutionReadiness,
  startDaemon,
  stopDaemon,
  getRunningProcessInfo,
  printStatus,
  showLogs,
};
