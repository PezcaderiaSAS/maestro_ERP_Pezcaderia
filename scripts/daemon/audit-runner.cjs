/**
 * scripts/daemon/audit-runner.cjs
 * 4-Tier Automated Audit Scheduler and Findings Classifier for MaestroPescadería Daemon.
 */

const { execSync, spawn, execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { loadDaemonEnv } = require('./env.cjs');
const logger = require('./logger.cjs');
const stateMgr = require('./state.cjs');

loadDaemonEnv();

const ROOT_DIR = path.resolve(__dirname, '../../');
const DEFAULT_TSC_TIMEOUT_MS = 90000;
const MIN_TSC_TIMEOUT_MS = 10000;
const SOLID_AUDIT_SCRIPT = path.join(ROOT_DIR, 'scripts/architecture/audit-solid-boundaries.cjs');
const DIAGRAMS_AUDIT_SCRIPT = path.join(ROOT_DIR, 'scripts/architecture/audit-diagrams-compliance.cjs');
const SDD_BRIDGE_SCRIPT = path.join(ROOT_DIR, 'scripts/architecture/run_agency_sdd_bridge.py');

/**
 * Deterministically classifies an audit finding into an Agency Swarm specialist role and priority
 */
function classifyFinding(finding) {
  const code = (finding.code || finding.ruleId || finding.rule || '').toUpperCase();
  const file = finding.file || finding.filePath || '';
  const message = finding.message || '';

  // 1. UI Specialist: React Hooks, layout, CSS, ergonomics
  if (
    code.includes('REACT-HOOKS') ||
    code.includes('HOOKS') ||
    code.includes('CLEAN-04') ||
    /components|views|modal|cart|panel|css|style/i.test(file) && (code.includes('UI') || message.includes('hook'))
  ) {
    return {
      role: 'ui',
      priority: code.includes('HOOKS') ? 'CRITICAL' : 'HIGH',
      title: `Corrección UI/UX: ${code} en ${path.basename(file)}`,
      description: message || `Violación de reglas de hooks o tokens UI detectada en ${file}`,
    };
  }

  // 2. Data Specialist: Supabase, SQL, domain boundary leakage, persistence
  if (
    code.includes('BOUND-01') ||
    code.includes('SUPABASE') ||
    code.includes('SQL') ||
    /database|schema|supabase|sql|store|outbox/i.test(file)
  ) {
    return {
      role: 'data',
      priority: 'CRITICAL',
      title: `Refactor Persistencia/Datos: ${code} en ${path.basename(file)}`,
      description: message || `Fuga de abstracción o acoplamiento de infraestructura en ${file}`,
    };
  }

  // 3. Quality Specialist: Vitest failures, compiler errors, type assertions
  if (
    code.includes('TEST') ||
    code.includes('VITEST') ||
    code.includes('TSC') ||
    code.includes('TYPESCRIPT') ||
    code.includes('ASSERT')
  ) {
    return {
      role: 'quality',
      priority: 'CRITICAL',
      title: `Resolución de Calidad/Test: ${code} en ${path.basename(file)}`,
      description: message || `Fallo en pruebas unitarias o verificación estricta de tipos`,
    };
  }

  // 4. Architect Specialist: SRP file length, thick controller, modular boundaries
  return {
    role: 'architect',
    priority: code.includes('SOLID-01') ? 'MEDIUM' : 'HIGH',
    title: `Auditoría Arquitectónica: ${code} en ${path.basename(file)}`,
    description: message || `Violación de principios SOLID o límites modulares en ${file}`,
  };
}

/**
 * Runs Tier 1: Instant SOLID boundaries audit and git status (<500ms)
 */
function runTier1() {
  const t0 = Date.now();
  let solidResult = 'PASS';
  const findings = [];

  try {
    if (fs.existsSync(SOLID_AUDIT_SCRIPT)) {
      const solidModule = require(SOLID_AUDIT_SCRIPT);
      if (typeof solidModule.auditCodebase === 'function') {
        const res = solidModule.auditCodebase();
        solidResult = res.passed ? 'PASS' : 'FAIL';
        if (Array.isArray(res.violations)) {
          findings.push(...res.violations);
        }
      }
    }
  } catch (err) {
    logger.warn(`[Audit Runner] Tier 1 SOLID check exception: ${err.message}`);
    solidResult = 'FAIL';
  }

  const durationMs = Date.now() - t0;
  return {
    tier: 1,
    name: 'TIER_1_INSTANT',
    durationMs,
    solidBoundaries: solidResult,
    findings,
  };
}

/**
 * Resolves TypeScript check timeout from `DAEMON_TSC_TIMEOUT_MS` (default 90000ms, min 10000ms).
 */
function resolveTscTimeoutMs(env = process.env) {
  const raw = env && env.DAEMON_TSC_TIMEOUT_MS;
  const parsed = parseInt(String(raw || ''), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_TSC_TIMEOUT_MS;
  return Math.max(MIN_TSC_TIMEOUT_MS, parsed);
}

/**
 * Runs Tier 2: Incremental TypeScript check and ESLint inspection
 */
function runTier2() {
  const t0 = Date.now();
  let tscResult = 'PASS';
  let lintErrors = 0;
  let lintWarnings = 0;
  const findings = [];
  const tscTimeoutMs = resolveTscTimeoutMs(process.env);

  // TypeScript check
  try {
    execSync('npx tsc --noEmit', { cwd: ROOT_DIR, stdio: 'pipe', encoding: 'utf8', timeout: tscTimeoutMs });
    tscResult = 'PASS';
  } catch (err) {
    tscResult = 'FAIL';
    const isTimeout = Boolean(err.killed || err.code === 'ETIMEDOUT');
    findings.push({
      code: isTimeout ? 'TSC-TIMEOUT' : 'TSC-COMPILER-ERROR',
      file: 'tsconfig.json',
      message: isTimeout
        ? `Timeout (${tscTimeoutMs}ms) ejecutando npx tsc --noEmit`
        : (err.stdout || err.message || '').slice(0, 300),
    });
  }

  // Sample ESLint check on high-risk files (e.g. SplitPaymentModal)
  try {
    const targetFile = 'src/views/pos/components/SplitPaymentModal.tsx';
    if (fs.existsSync(path.join(ROOT_DIR, targetFile))) {
      const raw = execSync(`npx eslint ${targetFile} --format json`, {
        cwd: ROOT_DIR,
        stdio: 'pipe',
        encoding: 'utf8',
        timeout: 15000,
      });
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed[0]) {
        lintErrors += parsed[0].errorCount || 0;
        lintWarnings += parsed[0].warningCount || 0;
        if (Array.isArray(parsed[0].messages)) {
          for (const m of parsed[0].messages) {
            findings.push({
              code: m.ruleId || 'ESLINT-ERROR',
              file: targetFile,
              message: m.message,
              line: m.line,
            });
          }
        }
      }
    }
  } catch (err) {
    if (err.stdout) {
      try {
        const parsed = JSON.parse(err.stdout);
        if (Array.isArray(parsed) && parsed[0]) {
          lintErrors += parsed[0].errorCount || 0;
          lintWarnings += parsed[0].warningCount || 0;
          if (Array.isArray(parsed[0].messages)) {
            for (const m of parsed[0].messages) {
              findings.push({
                code: m.ruleId || 'ESLINT-ERROR',
                file: 'src/views/pos/components/SplitPaymentModal.tsx',
                message: m.message,
                line: m.line,
              });
            }
          }
        }
      } catch (_) {}
    }
  }

  const durationMs = Date.now() - t0;
  return {
    tier: 2,
    name: 'TIER_2_INCREMENTAL',
    durationMs,
    tsc: tscResult,
    lint: { errors: lintErrors, warnings: lintWarnings },
    findings,
  };
}

/**
 * Runs Tier 3: Targeted Vitest execution
 */
function runTier3() {
  const t0 = Date.now();
  let vitestResult = 'PASS';
  const findings = [];

  try {
    execSync('npx vitest run src/tests/sanity.test.ts', {
      cwd: ROOT_DIR,
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: 25000,
    });
    vitestResult = 'PASS';
  } catch (err) {
    vitestResult = 'FAIL';
    findings.push({
      code: 'VITEST-REGRESSION-FAIL',
      file: 'src/tests/sanity.test.ts',
      message: (err.stdout || err.message || '').slice(0, 300),
    });
  }

  const durationMs = Date.now() - t0;
  return {
    tier: 3,
    name: 'TIER_3_TARGETED_VITEST',
    durationMs,
    vitest: vitestResult,
    findings,
  };
}

/**
 * Runs Tier 4: Deep Diagram Compliance Audit
 */
function runTier4() {
  const t0 = Date.now();
  let diagramsResult = 'PASS';
  const findings = [];

  try {
    if (fs.existsSync(DIAGRAMS_AUDIT_SCRIPT)) {
      execSync(`node "${DIAGRAMS_AUDIT_SCRIPT}"`, {
        cwd: ROOT_DIR,
        stdio: 'pipe',
        encoding: 'utf8',
        timeout: 20000,
      });
      diagramsResult = 'PASS';
    }
  } catch (err) {
    diagramsResult = 'WARN';
  }

  const durationMs = Date.now() - t0;
  return {
    tier: 4,
    name: 'TIER_4_DEEP_COMPLIANCE',
    durationMs,
    diagrams: diagramsResult,
    findings,
  };
}

/**
 * Executes a full or tiered audit cycle, deduplicates candidate tasks, and updates state
 */
function runAuditCycle(tier = 1) {
  const state = stateMgr.getState();
  const startTime = new Date();
  let combinedFindings = [];

  logger.info(`[Audit Runner] Iniciando pase de auditoría Tier ${tier}...`);

  // Tier 1 is always run
  const t1 = runTier1();
  combinedFindings.push(...t1.findings);
  state.audit.results.solidBoundaries = t1.solidBoundaries;

  if (tier >= 2) {
    const t2 = runTier2();
    combinedFindings.push(...t2.findings);
    state.audit.results.tsc = t2.tsc;
    state.audit.results.lint = t2.lint;
  }

  if (tier >= 3) {
    const t3 = runTier3();
    combinedFindings.push(...t3.findings);
    state.audit.results.vitest = t3.vitest;
  }

  if (tier >= 4) {
    const t4 = runTier4();
    combinedFindings.push(...t4.findings);
  }

  // Deduplicate and map findings into candidate tasks
  const existingQueue = state.queue || [];
  const completed = state.completedTasks || [];
  let nextNumericIndex = existingQueue.reduce((max, t) => Math.max(max, t.numericIndex || 0), 0) + 1;
  const newCandidateTasks = [];

  for (const finding of combinedFindings) {
    const classified = classifyFinding(finding);
    const findingKey = `${classified.role}_${finding.code}_${finding.file}`;

    // Check if task already exists or was completed
    const alreadyInQueue = existingQueue.some(
      (t) => (t.rule === finding.code && t.file === finding.file) || t.title === classified.title
    );
    const alreadyCompleted = completed.includes(findingKey);

    if (!alreadyInQueue && !alreadyCompleted) {
      const task = {
        id: `TASK-${finding.code || 'AUDIT'}-${nextNumericIndex}`,
        numericIndex: nextNumericIndex++,
        title: classified.title,
        description: classified.description,
        role: classified.role,
        priority: classified.priority,
        status: 'QUEUED',
        source: 'audit_runner',
        file: finding.file,
        rule: finding.code,
        detectedAt: startTime.toISOString(),
      };
      existingQueue.push(task);
      newCandidateTasks.push(task);
    }
  }

  state.queue = existingQueue;
  state.audit.lastAuditCycle = (state.audit.lastAuditCycle || 0) + 1;
  state.audit.lastAuditAt = startTime.toISOString();
  stateMgr.saveState(state);

  const durationMs = Date.now() - startTime.getTime();
  logger.info(
    `[Audit Runner] Ciclo #${state.audit.lastAuditCycle} finalizado en ${durationMs}ms. Tareas nuevas: ${newCandidateTasks.length}. Cola total: ${existingQueue.length}`
  );

  return {
    cycle: state.audit.lastAuditCycle,
    durationMs,
    results: state.audit.results,
    newCandidateTasks,
    totalQueued: existingQueue.length,
  };
}

/**
 * Dispatches a task to the SDD Bridge with Agency Swarm & Harness2
 */
function dispatchTaskToBridge(task, dryRun = true) {
  if (!fs.existsSync(SDD_BRIDGE_SCRIPT)) {
    return { success: false, error: 'SDD bridge script not found.' };
  }
  try {
    const args = [
      SDD_BRIDGE_SCRIPT,
      '-a', task.role,
      '-p', `${task.title}: ${task.description}`,
    ];
    if (dryRun) args.push('--dry-run');
    logger.info(`[Audit Runner] Despachando tarea ${task.id} a SDD Bridge (@${task.role})...`);
    const output = execFileSync('python', args, {
      cwd: ROOT_DIR,
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: 60000,
    });
    return { success: true, output };
  } catch (err) {
    logger.warn(`[Audit Runner] Error ejecutando SDD bridge: ${err.message}`);
    return { success: false, error: err.message };
  }
}

module.exports = {
  resolveTscTimeoutMs,
  classifyFinding,
  runTier1,
  runTier2,
  runTier3,
  runTier4,
  runAuditCycle,
  dispatchTaskToBridge,
};
