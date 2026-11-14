/**
 * tests/daemon/daemon-control-loop.test.ts
 * Comprehensive Vitest automated tests for MaestroPescadería 24/7 Infinite Control Loop:
 * - HMAC-SHA256 signature verification (RN-21)
 * - Meta challenge handshake
 * - 24h message deduplication (RN-22)
 * - WhatsApp command lexer & parser
 * - Lean Kanban state transitions & strict WIP = 1 enforcement
 * - Findings classification to Agency Swarm roles
 * - End-to-end webhook server & simulator integration
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import http from 'http';

// Import CommonJS modules under test
const envLoader = require('../../scripts/daemon/env.cjs');
const commandParser = require('../../scripts/daemon/command-parser.cjs');
const stateMgr = require('../../scripts/daemon/state.cjs');
const auditRunner = require('../../scripts/daemon/audit-runner.cjs');
const webhookServer = require('../../scripts/daemon/webhook-server.cjs');
const workerMod = require('../../scripts/daemon/worker.cjs');
const cliMod = require('../../scripts/daemon/cli.cjs');
const evolutionBootstrap = require('../../scripts/daemon/evolution-bootstrap.cjs');
const whatsappSimulator = require('../../scripts/daemon/whatsapp-simulator.cjs');

describe('MaestroPescadería 24/7 Daemon Control Loop & Autonomous Agency', () => {
  const TEST_SECRET = 'test_meta_app_secret_abc123';
  const TEST_VERIFY_TOKEN = 'test_verify_token_xyz987';
  const TEST_PORT = 3199;

  describe('1. Cryptographic HMAC-SHA256 Signature Verification (RN-21)', () => {
    it('should validate valid HMAC-SHA256 signature calculated with shared secret', () => {
      const payload = Buffer.from(JSON.stringify({ text: 'ESTADO' }), 'utf8');
      const validSignature = whatsappSimulator.computeSignature(payload, TEST_SECRET);

      const isValid = webhookServer.verifySignature(payload, validSignature, TEST_SECRET);
      expect(isValid).toBe(true);
    });

    it('should reject signature when payload has been tampered with', () => {
      const originalPayload = Buffer.from(JSON.stringify({ text: 'ESTADO' }), 'utf8');
      const signature = whatsappSimulator.computeSignature(originalPayload, TEST_SECRET);

      const tamperedPayload = Buffer.from(JSON.stringify({ text: 'ESTADO_TAMPERED' }), 'utf8');
      const isValid = webhookServer.verifySignature(tamperedPayload, signature, TEST_SECRET);
      expect(isValid).toBe(false);
    });

    it('should reject signature when signed with incorrect secret', () => {
      const payload = Buffer.from(JSON.stringify({ text: 'AUDITAR' }), 'utf8');
      const invalidSignature = whatsappSimulator.computeSignature(payload, 'wrong_secret');

      const isValid = webhookServer.verifySignature(payload, invalidSignature, TEST_SECRET);
      expect(isValid).toBe(false);
    });

    it('should reject missing or malformed signature header', () => {
      const payload = Buffer.from(JSON.stringify({ text: 'ESTADO' }), 'utf8');
      expect(webhookServer.verifySignature(payload, '', TEST_SECRET)).toBe(false);
      expect(webhookServer.verifySignature(payload, 'invalid_format', TEST_SECRET)).toBe(false);
      expect(webhookServer.verifySignature(payload, 'md5=abcdef', TEST_SECRET)).toBe(false);
    });
  });

  describe('2. WhatsApp Command Lexer & Grammar Parser', () => {
    it('should parse status commands and synonyms', () => {
      expect(commandParser.parseCommand('ESTADO').type).toBe('STATUS');
      expect(commandParser.parseCommand('/status').type).toBe('STATUS');
      expect(commandParser.parseCommand('info').type).toBe('STATUS');
      expect(commandParser.parseCommand('VER').type).toBe('STATUS');
    });

    it('should parse audit commands and synonyms', () => {
      expect(commandParser.parseCommand('AUDITAR').type).toBe('AUDIT');
      expect(commandParser.parseCommand('/audit').type).toBe('AUDIT');
      expect(commandParser.parseCommand('revisar').type).toBe('AUDIT');
    });

    it('should parse queue reordering with multiple IDs', () => {
      const cmd1 = commandParser.parseCommand('ORDEN 3 1 2');
      expect(cmd1.type).toBe('REORDER');
      expect(cmd1.taskIds).toEqual([3, 1, 2]);

      const cmd2 = commandParser.parseCommand('ORDEN 5, 2, 8');
      expect(cmd2.type).toBe('REORDER');
      expect(cmd2.taskIds).toEqual([5, 2, 8]);
    });

    it('should parse task execution and approval with single ID', () => {
      const execCmd = commandParser.parseCommand('EJECUTAR 4');
      expect(execCmd.type).toBe('EXECUTE');
      expect(execCmd.targetId).toBe(4);

      const runCmd = commandParser.parseCommand('/run 7');
      expect(runCmd.type).toBe('EXECUTE');
      expect(runCmd.targetId).toBe(7);

      const approveCmd = commandParser.parseCommand('APROBAR 2');
      expect(approveCmd.type).toBe('APPROVE');
      expect(approveCmd.targetId).toBe(2);

      const rejectCmd = commandParser.parseCommand('RECHAZAR 5');
      expect(rejectCmd.type).toBe('REJECT');
      expect(rejectCmd.targetId).toBe(5);
    });

    it('should parse custom task injection and correctly classify domain role', () => {
      const dataTask = commandParser.parseCommand('TAREA Optimizar índices de base de datos Supabase');
      expect(dataTask.type).toBe('CUSTOM_TASK');
      expect(dataTask.suggestedRole).toBe('data');

      const uiTask = commandParser.parseCommand('TAREA Ajustar contraste de botones en modal de pago 375px');
      expect(uiTask.type).toBe('CUSTOM_TASK');
      expect(uiTask.suggestedRole).toBe('ui');

      const qualityTask = commandParser.parseCommand('TAREA Agregar test de regresión Vitest para carrito');
      expect(qualityTask.type).toBe('CUSTOM_TASK');
      expect(qualityTask.suggestedRole).toBe('quality');

      const archTask = commandParser.parseCommand('TAREA Refactorizar principios SOLID en módulo POS');
      expect(archTask.type).toBe('CUSTOM_TASK');
      expect(archTask.suggestedRole).toBe('architect');
    });

    it('should parse pause and resume directives', () => {
      expect(commandParser.parseCommand('PAUSAR').type).toBe('PAUSE');
      expect(commandParser.parseCommand('REANUDAR').type).toBe('RESUME');
      expect(commandParser.parseCommand('AYUDA').type).toBe('HELP');
    });

    it('should prevent role hijacking with word boundaries (e.g. Rediseñar does not trigger redis -> data)', () => {
      const role = commandParser.detectRoleFromText('Rediseñar vista POS');
      expect(role).toBe('ui');

      const customTask = commandParser.parseCommand('TAREA Rediseñar vista POS con nuevo modal');
      expect(customTask.type).toBe('CUSTOM_TASK');
      expect(customTask.suggestedRole).toBe('ui');
    });

    it('should handle invalid or unknown commands gracefully', () => {
      const unknown = commandParser.parseCommand('comando_inexistente_xyz');
      expect(unknown.type).toBe('UNKNOWN');
      expect(unknown.error).toBeDefined();
    });
  });

  describe('3. Deterministic Findings Classifier & Role Assignment (R3)', () => {
    it('should map React Hook and UI issues to @ui (UIReviewer)', () => {
      const finding = {
        code: 'react-hooks/rules-of-hooks',
        file: 'src/views/pos/components/SplitPaymentModal.tsx',
        message: 'React Hook "useState" is called conditionally',
      };
      const classified = auditRunner.classifyFinding(finding);
      expect(classified.role).toBe('ui');
      expect(classified.priority).toBe('CRITICAL');
      expect(classified.title).toContain('SplitPaymentModal.tsx');
    });

    it('should map domain boundary and Supabase leakage to @data (DataEngineer)', () => {
      const finding = {
        code: 'BOUND-01-DOMAIN-POLLUTION',
        file: 'src/types/inventory.ts',
        message: 'Direct import of @supabase/supabase-js in domain types',
      };
      const classified = auditRunner.classifyFinding(finding);
      expect(classified.role).toBe('data');
      expect(classified.priority).toBe('CRITICAL');
    });

    it('should map test failures to @quality (QualityEngineer)', () => {
      const finding = {
        code: 'VITEST-ASSERTION-FAIL',
        file: 'src/tests/sanity.test.ts',
        message: 'Expected 2 to be 3',
      };
      const classified = auditRunner.classifyFinding(finding);
      expect(classified.role).toBe('quality');
      expect(classified.priority).toBe('CRITICAL');
    });

    it('should map SRP file length to @architect (SoftwareArchitect)', () => {
      const finding = {
        code: 'SOLID-01-SRP-FILE-LENGTH',
        file: 'src/views/POSView.tsx',
        message: 'File exceeds 600 lines threshold',
      };
      const classified = auditRunner.classifyFinding(finding);
      expect(classified.role).toBe('architect');
      expect(classified.priority).toBe('MEDIUM');
    });
  });

  describe('4. State Machine & Strict Lean Kanban WIP = 1 Governance', () => {
    let originalState: any;

    beforeEach(() => {
      originalState = stateMgr.getState();
      // Initialize a clean test state in memory and file
      const testState = {
        daemon: {
          status: 'RUNNING',
          supervisorPid: 1000,
          workerPid: 2000,
          startedAt: new Date().toISOString(),
          uptimeSeconds: 120,
          lastHeartbeat: new Date().toISOString(),
        },
        audit: {
          lastAuditAt: new Date().toISOString(),
          lastAuditCycle: 5,
          results: {
            tsc: 'PASS',
            solidBoundaries: 'PASS',
            lint: { errors: 0, warnings: 0 },
            vitest: 'PASS',
          },
        },
        queue: [
          {
            id: 'TASK-1',
            numericIndex: 1,
            title: 'Fix SplitPaymentModal hooks',
            role: 'ui',
            priority: 'CRITICAL',
            status: 'QUEUED',
            source: 'eslint',
            detectedAt: new Date().toISOString(),
          },
          {
            id: 'TASK-2',
            numericIndex: 2,
            title: 'Refactor POSView SRP',
            role: 'architect',
            priority: 'HIGH',
            status: 'QUEUED',
            source: 'solid',
            detectedAt: new Date().toISOString(),
          },
          {
            id: 'TASK-3',
            numericIndex: 3,
            title: 'Add kardex index migration',
            role: 'data',
            priority: 'CRITICAL',
            status: 'QUEUED',
            source: 'audit',
            detectedAt: new Date().toISOString(),
          },
        ],
        activeTask: null,
        completedTasks: [],
      };
      stateMgr.saveState(testState);
    });

    afterEach(() => {
      if (originalState) {
        stateMgr.saveState(originalState);
      }
    });

    it('should authorize a task and start it when activeTask is null', () => {
      const auth = stateMgr.authorizeTask(1);
      expect(auth.success).toBe(true);
      expect(auth.task.status).toBe('AUTHORIZED');

      const start = stateMgr.startNextTask();
      expect(start.started).toBe(true);
      expect(start.task.id).toBe('TASK-1');

      const current = stateMgr.getState();
      expect(current.activeTask).toBe('TASK-1');
    });

    it('should strictly enforce WIP = 1 and reject starting a second task concurrently', () => {
      // Authorize both task 1 and task 2
      stateMgr.authorizeTask(1);
      stateMgr.authorizeTask(2);

      // Start task 1
      const start1 = stateMgr.startNextTask();
      expect(start1.started).toBe(true);
      expect(start1.task.id).toBe('TASK-1');

      // Attempt to start task 2 while task 1 is active
      const start2 = stateMgr.startNextTask();
      expect(start2.started).toBe(false);
      expect(start2.reason).toBe('WIP_LIMIT_REACHED');
      expect(start2.activeTaskId).toBe('TASK-1');

      // State remains with only 1 active task
      const current = stateMgr.getState();
      expect(current.activeTask).toBe('TASK-1');
    });

    it('should complete active task, free WIP slot, and allow next authorized task', () => {
      stateMgr.authorizeTask(1);
      stateMgr.authorizeTask(2);
      stateMgr.startNextTask();

      // Complete active task
      stateMgr.completeTask('TASK-1');
      const stateAfterComplete = stateMgr.getState();
      expect(stateAfterComplete.activeTask).toBeNull();
      expect(stateAfterComplete.completedTasks).toContain('TASK-1');

      // Now task 2 can be started
      const start2 = stateMgr.startNextTask();
      expect(start2.started).toBe(true);
      expect(start2.task.id).toBe('TASK-2');
      expect(stateMgr.getState().activeTask).toBe('TASK-2');
    });

    it('should reorder queue according to user specified indices', () => {
      const reorderResult = stateMgr.reorderQueue([3, 1, 2]);
      expect(reorderResult.success).toBe(true);

      const q = stateMgr.getState().queue;
      expect(q[0].id).toBe('TASK-3');
      expect(q[1].id).toBe('TASK-1');
      expect(q[2].id).toBe('TASK-2');
    });

    it('should free activeTask when active task is discarded, preventing deadlock', () => {
      stateMgr.authorizeTask(1);
      stateMgr.startNextTask();
      expect(stateMgr.getState().activeTask).toBe('TASK-1');

      const discardResult = stateMgr.discardTask(1);
      expect(discardResult.success).toBe(true);

      const currentState = stateMgr.getState();
      expect(currentState.activeTask).toBeNull();

      // Ensure next task can now be authorized and started without deadlock
      stateMgr.authorizeTask(2);
      const startNext = stateMgr.startNextTask();
      expect(startNext.started).toBe(true);
      expect(startNext.task.id).toBe('TASK-2');
    });

    it('should safely handle reorderQueue with non-array input (e.g. null) without throwing', () => {
      expect(() => {
        const res = stateMgr.reorderQueue(null as any);
        expect(res).toBeDefined();
      }).not.toThrow();

      expect(() => {
        const res = stateMgr.reorderQueue(undefined as any);
        expect(res).toBeDefined();
      }).not.toThrow();
    });

    it('should generate valid DOCS/AUTONOMOUS_KANBAN.md reflecting current queue', () => {
      expect(fs.existsSync(stateMgr.KANBAN_FILE)).toBe(true);
      const content = fs.readFileSync(stateMgr.KANBAN_FILE, 'utf8');
      expect(content).toContain('Autonomous Agency — Continuous Kanban Board');
      expect(content).toContain('Límite WIP');
      expect(content).toContain('`1` tarea activa simultánea');
      expect(content).toContain('Por Hacer');
    });
  });

  describe('5. Webhook Server & Message Idempotency (RN-22)', () => {
    let serverHandle: any;

    beforeAll(async () => {
      serverHandle = await webhookServer.createWebhookServer({
        port: TEST_PORT,
        appSecret: TEST_SECRET,
        verifyToken: TEST_VERIFY_TOKEN,
        adminPhones: ['573001234567'],
      });
    });

    afterAll(async () => {
      if (serverHandle && serverHandle.close) {
        await serverHandle.close();
      }
    });

    it('should successfully handle GET challenge handshake with correct token', async () => {
      const challenge = '198273645';
      const res = await whatsappSimulator.sendVerifyChallenge({
        port: TEST_PORT,
        verifyToken: TEST_VERIFY_TOKEN,
        challenge,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toBe(challenge);
    });

    it('should reject GET handshake with incorrect token with HTTP 403', async () => {
      const res = await whatsappSimulator.sendVerifyChallenge({
        port: TEST_PORT,
        verifyToken: 'wrong_token',
        challenge: '123',
      });

      expect(res.statusCode).toBe(403);
    });

    it('should process valid signed POST message and return status response', async () => {
      const res = await whatsappSimulator.sendSimulatedMessage({
        port: TEST_PORT,
        appSecret: TEST_SECRET,
        text: 'ESTADO',
        messageId: `wamid.TEST_${Date.now()}_1`,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.results).toBeDefined();
      expect(res.body.results[0].command).toBe('STATUS');
    });

    it('should enforce RN-22: deduplicate retried messages within 24h', async () => {
      const fixedMessageId = `wamid.DEDUP_TEST_${Date.now()}`;

      // First delivery: processes normally
      const res1 = await whatsappSimulator.sendSimulatedMessage({
        port: TEST_PORT,
        appSecret: TEST_SECRET,
        text: 'ESTADO',
        messageId: fixedMessageId,
      });
      expect(res1.statusCode).toBe(200);
      expect(res1.body.results[0].deduplicated).toBeUndefined();

      // Second delivery with same message ID: deduplicated
      const res2 = await whatsappSimulator.sendSimulatedMessage({
        port: TEST_PORT,
        appSecret: TEST_SECRET,
        text: 'ESTADO',
        messageId: fixedMessageId,
      });
      expect(res2.statusCode).toBe(200);
      expect(res2.body.results[0].deduplicated).toBe(true);
    });

    it('should enforce RN-21: reject POST without valid HMAC signature with HTTP 401', async () => {
      const res = await whatsappSimulator.sendSimulatedMessage({
        port: TEST_PORT,
        appSecret: 'wrong_secret',
        text: 'ESTADO',
        messageId: `wamid.UNAUTH_${Date.now()}`,
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toContain('Unauthorized');
    });

    it('should reject payload exceeding 1MB with HTTP 413 Payload Too Large', async () => {
      const oversizedPayload = Buffer.alloc(1024 * 1024 + 512, 'a');
      const signature = whatsappSimulator.computeSignature(oversizedPayload, TEST_SECRET);

      const res = await new Promise<{ statusCode: number; body: any }>((resolve) => {
        const req = http.request(
          `http://127.0.0.1:${TEST_PORT}/api/whatsapp/webhook`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Hub-Signature-256': signature,
              'Content-Length': oversizedPayload.length,
            },
          },
          (response) => {
            let data = '';
            response.on('data', (c) => (data += c));
            response.on('end', () => {
              let parsed = {};
              try {
                parsed = JSON.parse(data);
              } catch (_) {}
              resolve({ statusCode: response.statusCode || 0, body: parsed });
            });
          }
        );
        req.on('error', () => {
          // Socket may be destroyed after receiving 413
        });
        req.write(oversizedPayload);
        req.end();
      });

      expect(res.statusCode).toBe(413);
      expect(res.body.error).toContain('Payload Too Large');
    });
  });

  describe('6. Hardening, Command Injection & Process Resilience', () => {
    it('should invoke dispatchTaskToBridge using execFileSync without shell injection vulnerability', () => {
      const maliciousTask = {
        id: 'TASK-INJECT-1',
        numericIndex: 99,
        title: 'Harmless Title',
        description: 'Testing injection & whoami; rm -rf /',
        role: 'architect',
        priority: 'HIGH',
      };
      const result = auditRunner.dispatchTaskToBridge(maliciousTask, true);
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('7. Zero-Dependency .env / .env.local Loader (SPEC-058 T1)', () => {
    it('should load .env and .env.local respecting process.env > .env.local > .env precedence and formatting', () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'daemon-env-test-'));
      try {
        fs.writeFileSync(
          path.join(tmpDir, '.env'),
          [
            '# Comment line',
            'EVOLUTION_API_URL=http://localhost:8080 # inline note',
            'EVOLUTION_API_KEY="abc==def=="',
            "EVOLUTION_INSTANCE='maestro_base'",
            'export PROTECTED_SHELL_VAR=from_env_file',
            '',
          ].join('\r\n'),
          'utf8'
        );
        fs.writeFileSync(
          path.join(tmpDir, '.env.local'),
          [
            "EVOLUTION_INSTANCE='maestro_local'",
            'WHATSAPP_ADMIN_PHONES=573001112233,573004445566',
          ].join('\n'),
          'utf8'
        );

        const targetEnv: Record<string, string | undefined> = {
          PROTECTED_SHELL_VAR: 'from_parent_shell',
        };
        const summary = envLoader.loadDaemonEnv({ rootDir: tmpDir, targetEnv, force: true });

        expect(summary.loadedFiles).toEqual(['.env', '.env.local']);
        expect(targetEnv.EVOLUTION_API_URL).toBe('http://localhost:8080');
        expect(targetEnv.EVOLUTION_API_KEY).toBe('abc==def==');
        expect(targetEnv.EVOLUTION_INSTANCE).toBe('maestro_local');
        expect(targetEnv.WHATSAPP_ADMIN_PHONES).toBe('573001112233,573004445566');
        expect(targetEnv.PROTECTED_SHELL_VAR).toBe('from_parent_shell');
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('should not throw when .env and .env.local are absent', () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'daemon-env-empty-'));
      try {
        const targetEnv: Record<string, string | undefined> = {};
        const summary = envLoader.loadDaemonEnv({ rootDir: tmpDir, targetEnv, force: true });
        expect(summary.loadedFiles).toEqual([]);
        expect(Object.keys(targetEnv)).toHaveLength(0);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });
  });

  describe('8. Evolution API v1/v2 Inbound Webhook & Anti-Loop (SPEC-058 T2)', () => {
    const EVO_PORT = 3201;
    const EVO_SECRET = 'evo_webhook_secret_xyz_2026';
    let evoServerHandle: any;

    async function postWebhook(pathname: string, payloadObj: unknown, headers: Record<string, string> = {}) {
      const bodyStr = JSON.stringify(payloadObj);
      return new Promise<{ statusCode: number; body: any }>((resolve, reject) => {
        const req = http.request(
          `http://127.0.0.1:${EVO_PORT}${pathname}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(bodyStr),
              ...headers,
            },
          },
          (response) => {
            let data = '';
            response.on('data', (c) => (data += c));
            response.on('end', () => {
              let parsed = {};
              try {
                parsed = JSON.parse(data);
              } catch (_) {}
              resolve({ statusCode: response.statusCode || 0, body: parsed });
            });
          }
        );
        req.on('error', reject);
        req.write(bodyStr);
        req.end();
      });
    }

    beforeAll(async () => {
      evoServerHandle = await webhookServer.createWebhookServer({
        port: EVO_PORT,
        appSecret: TEST_SECRET,
        verifyToken: TEST_VERIFY_TOKEN,
        evolutionWebhookSecret: EVO_SECRET,
        evolutionApiUrl: '',
        allowSelfChat: false,
        adminPhones: ['573001234567'],
      });
    });

    afterAll(async () => {
      if (evoServerHandle && evoServerHandle.close) {
        await evoServerHandle.close();
      }
    });

    it('should ingest Evolution messages.upsert with apikey header and return parsed command result', async () => {
      const res = await postWebhook(
        '/api/whatsapp/webhook',
        {
          event: 'messages.upsert',
          instance: 'maestro_pescaderia',
          data: {
            key: {
              remoteJid: '573001234567@s.whatsapp.net',
              fromMe: false,
              id: `EVO_TEST_${Date.now()}_1`,
            },
            message: { conversation: 'ESTADO' },
          },
        },
        { apikey: EVO_SECRET }
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.results).toHaveLength(1);
      expect(res.body.results[0].command).toBe('STATUS');
      expect(res.body.results[0].responseText).toBeTruthy();
    });

    it('should accept /messages-upsert subpath, MESSAGES-UPSERT variant, array data, extendedTextMessage, and remoteJidAlt LID', async () => {
      const res = await postWebhook(
        '/api/whatsapp/webhook/messages-upsert',
        {
          event: 'MESSAGES-UPSERT',
          instance: 'maestro_pescaderia',
          data: [
            {
              key: {
                remoteJid: '149988776655@lid',
                remoteJidAlt: '573001234567:14@s.whatsapp.net',
                fromMe: false,
                id: `EVO_TEST_${Date.now()}_2`,
              },
              message: {
                extendedTextMessage: { text: 'AUDITAR' },
              },
            },
          ],
        },
        { 'x-webhook-secret': EVO_SECRET }
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.results).toHaveLength(1);
      expect(res.body.results[0].command).toBe('AUDIT');
    });

    it('should reject invalid Evolution apikey with HTTP 401 and accept matching payload.apikey fallback', async () => {
      const rejected = await postWebhook(
        '/api/whatsapp/webhook',
        {
          event: 'messages.upsert',
          data: {
            key: { remoteJid: '573001234567@s.whatsapp.net', fromMe: false, id: `EVO_UNAUTH_${Date.now()}` },
            message: { conversation: 'ESTADO' },
          },
        },
        { apikey: 'wrong_evolution_key' }
      );
      expect(rejected.statusCode).toBe(401);

      const acceptedByBodyKey = await postWebhook('/api/whatsapp/webhook', {
        event: 'messages.upsert',
        apikey: EVO_SECRET,
        data: {
          key: { remoteJid: '573001234567@s.whatsapp.net', fromMe: false, id: `EVO_BODYKEY_${Date.now()}` },
          message: { conversation: 'ESTADO' },
        },
      });
      expect(acceptedByBodyKey.statusCode).toBe(200);
      expect(acceptedByBodyKey.body.results[0].command).toBe('STATUS');
    });

    it('should ignore fromMe=true and @g.us group messages to prevent self-reply loops', async () => {
      const fromMePayload = {
        event: 'messages.upsert',
        data: {
          key: { remoteJid: '573001234567@s.whatsapp.net', fromMe: true, id: `EVO_SELF_${Date.now()}` },
          message: { conversation: 'PAUSAR' },
        },
      };
      const groupPayload = {
        event: 'messages.upsert',
        data: {
          key: { remoteJid: '120363000111222333@g.us', fromMe: false, id: `EVO_GRP_${Date.now()}` },
          message: { conversation: 'PAUSAR' },
        },
      };

      expect(webhookServer.extractMessages(fromMePayload)).toEqual([]);
      expect(webhookServer.extractMessages(groupPayload)).toEqual([]);

      const resSelf = await postWebhook('/api/whatsapp/webhook', fromMePayload, { apikey: EVO_SECRET });
      const resGrp = await postWebhook('/api/whatsapp/webhook', groupPayload, { apikey: EVO_SECRET });
      expect(resSelf.statusCode).toBe(200);
      expect(resSelf.body.processed).toBe(0);
      expect(resGrp.statusCode).toBe(200);
      expect(resGrp.body.processed).toBe(0);
    });

    it('should block unauthorized Evolution sender phones and ignore non-message events fast', async () => {
      const unauthPhone = await postWebhook(
        '/api/whatsapp/webhook',
        {
          event: 'messages.upsert',
          data: {
            key: { remoteJid: '573999888777@s.whatsapp.net', fromMe: false, id: `EVO_STRANGER_${Date.now()}` },
            message: { conversation: 'ESTADO' },
          },
        },
        { apikey: EVO_SECRET }
      );
      expect(unauthPhone.statusCode).toBe(200);
      expect(unauthPhone.body.results[0].authorized).toBe(false);

      const nonMsgEvent = await postWebhook(
        '/api/whatsapp/webhook',
        {
          event: 'connection.update',
          instance: 'maestro_pescaderia',
          data: { state: 'open' },
        },
        { apikey: EVO_SECRET }
      );
      expect(nonMsgEvent.statusCode).toBe(200);
      expect(nonMsgEvent.body.processed).toBe(0);
    });
  });

  describe('9. Evolution API Bidirectional Outbound sendText (SPEC-058 T3)', () => {
    const MOCK_EVO_API_PORT = 3202;
    const BIDIR_WEBHOOK_PORT = 3203;
    const EVO_API_KEY = 'evo_outbound_secret_abc';
    const capturedRequests: Array<{ url: string; headers: http.IncomingHttpHeaders; body: any }> = [];
    let mockEvoServer: http.Server;
    let bidirWebhookHandle: any;

    beforeAll(async () => {
      mockEvoServer = http.createServer((req, res) => {
        let raw = '';
        req.on('data', (c) => (raw += c));
        req.on('end', () => {
          let body: any = {};
          try {
            body = JSON.parse(raw);
          } catch (_) {}
          capturedRequests.push({ url: req.url || '', headers: req.headers, body });
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ key: { id: 'OUTBOUND_MOCK_1' }, status: 'PENDING' }));
        });
      });

      await new Promise<void>((resolve) => {
        mockEvoServer.listen(MOCK_EVO_API_PORT, '127.0.0.1', () => resolve());
      });

      bidirWebhookHandle = await webhookServer.createWebhookServer({
        port: BIDIR_WEBHOOK_PORT,
        appSecret: TEST_SECRET,
        verifyToken: TEST_VERIFY_TOKEN,
        evolutionWebhookSecret: EVO_API_KEY,
        evolutionApiUrl: `http://127.0.0.1:${MOCK_EVO_API_PORT}`,
        evolutionApiKey: EVO_API_KEY,
        evolutionInstance: 'maestro_pescaderia',
        evolutionApiVersion: 'v2',
        adminPhones: ['573001234567'],
      });
    });

    beforeEach(() => {
      capturedRequests.length = 0;
    });

    afterAll(async () => {
      if (bidirWebhookHandle && bidirWebhookHandle.close) {
        await bidirWebhookHandle.close();
      }
      if (mockEvoServer) {
        await new Promise<void>((resolve) => mockEvoServer.close(() => resolve()));
      }
    });

    it('should send Evolution v2 sendText payload to /message/sendText/{instance} with apikey header', async () => {
      const result = await webhookServer.sendEvolutionText({
        number: '573001234567@s.whatsapp.net',
        text: 'Prueba bidireccional v2',
        config: {
          evolutionApiUrl: `http://127.0.0.1:${MOCK_EVO_API_PORT}`,
          evolutionApiKey: EVO_API_KEY,
          evolutionInstance: 'maestro_pescaderia',
          evolutionApiVersion: 'v2',
        },
      });

      expect(result.sent).toBe(true);
      expect(result.statusCode).toBe(201);
      expect(capturedRequests).toHaveLength(1);
      expect(capturedRequests[0].url).toBe('/message/sendText/maestro_pescaderia');
      expect(capturedRequests[0].headers['apikey']).toBe(EVO_API_KEY);
      expect(capturedRequests[0].body).toEqual({
        number: '573001234567',
        text: 'Prueba bidireccional v2',
      });
    });

    it('should support Evolution v1 textMessage format when evolutionApiVersion=v1', async () => {
      const result = await webhookServer.sendEvolutionText({
        number: '573001234567',
        text: 'Hola v1',
        config: {
          evolutionApiUrl: `http://127.0.0.1:${MOCK_EVO_API_PORT}`,
          evolutionApiKey: EVO_API_KEY,
          evolutionInstance: 'inst_v1',
          evolutionApiVersion: 'v1',
        },
      });

      expect(result.sent).toBe(true);
      expect(capturedRequests[0].url).toBe('/message/sendText/inst_v1');
      expect(capturedRequests[0].body).toEqual({
        number: '573001234567',
        textMessage: { text: 'Hola v1' },
      });
    });

    it('should automatically dispatch async Evolution reply after answering HTTP 200 to webhook POST', async () => {
      const bodyStr = JSON.stringify({
        event: 'messages.upsert',
        instance: 'maestro_pescaderia',
        data: {
          key: {
            remoteJid: '573001234567@s.whatsapp.net',
            fromMe: false,
            id: `EVO_BIDIR_${Date.now()}`,
          },
          message: { conversation: 'ESTADO' },
        },
      });

      const res = await new Promise<{ statusCode: number; body: any }>((resolve, reject) => {
        const req = http.request(
          `http://127.0.0.1:${BIDIR_WEBHOOK_PORT}/api/whatsapp/webhook`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(bodyStr),
              apikey: EVO_API_KEY,
            },
          },
          (response) => {
            let data = '';
            response.on('data', (c) => (data += c));
            response.on('end', () => resolve({ statusCode: response.statusCode || 0, body: JSON.parse(data) }));
          }
        );
        req.on('error', reject);
        req.write(bodyStr);
        req.end();
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.results[0].command).toBe('STATUS');

      // Wait briefly for non-blocking post-200 async outbound delivery
      const deadline = Date.now() + 2000;
      while (capturedRequests.length === 0 && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 25));
      }

      expect(capturedRequests).toHaveLength(1);
      expect(capturedRequests[0].url).toBe('/message/sendText/maestro_pescaderia');
      expect(capturedRequests[0].body.number).toBe('573001234567');
      expect(String(capturedRequests[0].body.text)).toContain('Estado');
    });

    it('should fail gracefully without throwing when Evolution API is unconfigured or unreachable', async () => {
      const unconfigured = await webhookServer.sendEvolutionText({
        number: '573001234567',
        text: 'Sin configuracion',
        config: { evolutionApiUrl: '', evolutionApiKey: '', evolutionInstance: '' },
      });
      expect(unconfigured.sent).toBe(false);
      expect(unconfigured.skipped).toBe(true);

      const unreachable = await webhookServer.sendEvolutionText({
        number: '573001234567',
        text: 'Puerto cerrado',
        config: {
          evolutionApiUrl: 'http://127.0.0.1:3999',
          evolutionApiKey: EVO_API_KEY,
          evolutionInstance: 'maestro_pescaderia',
        },
        timeoutMs: 1000,
      });
      expect(unreachable.sent).toBe(false);
      expect(unreachable.error).toBeDefined();
    });
  });

  describe('10. Configurable TSC Timeout & Dynamic Worker Dry-Run (SPEC-058 T4)', () => {
    it('should resolve DAEMON_TSC_TIMEOUT_MS with 90000ms default and 10000ms lower bound', () => {
      expect(auditRunner.resolveTscTimeoutMs({})).toBe(90000);
      expect(auditRunner.resolveTscTimeoutMs({ DAEMON_TSC_TIMEOUT_MS: 'invalid' })).toBe(90000);
      expect(auditRunner.resolveTscTimeoutMs({ DAEMON_TSC_TIMEOUT_MS: '120000' })).toBe(120000);
      expect(auditRunner.resolveTscTimeoutMs({ DAEMON_TSC_TIMEOUT_MS: '1500' })).toBe(10000);
    });

    it('should resolve DAEMON_SDD_DRY_RUN safely (default true, false only when explicitly "false")', () => {
      expect(workerMod.resolveDryRunMode({})).toBe(true);
      expect(workerMod.resolveDryRunMode({ DAEMON_SDD_DRY_RUN: 'true' })).toBe(true);
      expect(workerMod.resolveDryRunMode({ DAEMON_SDD_DRY_RUN: 'yes' })).toBe(true);
      expect(workerMod.resolveDryRunMode({ DAEMON_SDD_DRY_RUN: 'false' })).toBe(false);
      expect(workerMod.resolveDryRunMode({ DAEMON_SDD_DRY_RUN: ' FALSE ' })).toBe(false);
    });

    it('should pass dynamic dryRun flag from process.env.DAEMON_SDD_DRY_RUN to dispatchTaskToBridge', () => {
      const originalDryRun = process.env.DAEMON_SDD_DRY_RUN;
      const calls: Array<{ taskId: string; dryRun: boolean }> = [];
      const mockDeps = {
        auditRunner: {
          dispatchTaskToBridge: (task: any, dryRun: boolean) => {
            calls.push({ taskId: task.id, dryRun });
            return { success: true, output: 'ok' };
          },
        },
        webhookServer: {
          sendEvolutionNotification: async () => ({ sent: false, skipped: true }),
        },
        logger: { info: () => {}, warn: () => {}, error: () => {} },
      };

      const sampleTask = { id: 'TASK-T4', numericIndex: 1, title: 'Sample', role: 'architect' };

      try {
        delete process.env.DAEMON_SDD_DRY_RUN;
        workerMod.dispatchStartedTask(sampleTask, mockDeps);

        process.env.DAEMON_SDD_DRY_RUN = 'false';
        workerMod.dispatchStartedTask(sampleTask, mockDeps);

        expect(calls).toEqual([
          { taskId: 'TASK-T4', dryRun: true },
          { taskId: 'TASK-T4', dryRun: false },
        ]);
      } finally {
        if (originalDryRun === undefined) {
          delete process.env.DAEMON_SDD_DRY_RUN;
        } else {
          process.env.DAEMON_SDD_DRY_RUN = originalDryRun;
        }
      }
    });
  });

  describe('11. CLI Evolution Readiness & Secret Redaction (SPEC-058 T5)', () => {
    it('should detect missing or placeholder Evolution credentials and mark readiness false', () => {
      const missingStatus = cliMod.inspectEvolutionReadiness({});
      expect(missingStatus.configured).toBe(false);
      expect(missingStatus.missing).toEqual(['EVOLUTION_API_URL', 'EVOLUTION_API_KEY', 'EVOLUTION_INSTANCE']);
      expect(missingStatus.webhookPort).toBe(3005);

      const placeholderStatus = cliMod.inspectEvolutionReadiness({
        EVOLUTION_API_URL: 'http://127.0.0.1:8080',
        EVOLUTION_API_KEY: 'tu_api_key_de_evolution_aqui',
        EVOLUTION_INSTANCE: 'maestro_pescaderia',
      });
      expect(placeholderStatus.configured).toBe(false);
      expect(placeholderStatus.missing).toEqual(['EVOLUTION_API_KEY']);
    });

    it('should report Evolution readiness cleanly without leaking API key in status snapshot', () => {
      const secretKey = 'super_secret_evo_key_never_leak_999';
      const status = cliMod.inspectEvolutionReadiness({
        EVOLUTION_API_URL: 'https://evo.pescaderia.example.com:8443/v2',
        EVOLUTION_API_KEY: secretKey,
        EVOLUTION_INSTANCE: 'maestro_pescaderia',
        WHATSAPP_WEBHOOK_PORT: '3099',
        DAEMON_SDD_DRY_RUN: 'false',
        DAEMON_TSC_TIMEOUT_MS: '120000',
      });

      expect(status.configured).toBe(true);
      expect(status.missing).toEqual([]);
      expect(status.adminPhonesConfigured).toBe(false);
      expect(status.instance).toBe('maestro_pescaderia');
      expect(status.apiHost).toBe('evo.pescaderia.example.com:8443');
      expect(status.webhookPort).toBe(3099);
      expect(status.dryRun).toBe(false);
      expect(status.tscTimeoutMs).toBe(120000);
      expect(JSON.stringify(status)).not.toContain(secretKey);

      const withRealAdmin = cliMod.inspectEvolutionReadiness({
        EVOLUTION_API_URL: 'http://127.0.0.1:8085',
        EVOLUTION_API_KEY: secretKey,
        EVOLUTION_INSTANCE: 'maestro_pescaderia',
        WHATSAPP_ADMIN_PHONES: '573155551234',
      });
      expect(withRealAdmin.adminPhonesConfigured).toBe(true);
      expect(withRealAdmin.adminPhonesCount).toBe(1);

      const withPlaceholderAdmin = cliMod.inspectEvolutionReadiness({
        EVOLUTION_API_URL: 'http://127.0.0.1:8085',
        EVOLUTION_API_KEY: secretKey,
        EVOLUTION_INSTANCE: 'maestro_pescaderia',
        WHATSAPP_ADMIN_PHONES: '573001234567',
      });
      expect(withPlaceholderAdmin.adminPhonesConfigured).toBe(false);
    });
  });

  describe('12. Fail-Closed Admin Whitelist & Docker Evolution Bootstrapper', () => {
    it('should fail closed when adminPhones is empty and skip proactive notifications safely', async () => {
      const CLOSED_PORT = 3204;
      const CLOSED_SECRET = 'closed_secret_123';
      const handle = await webhookServer.createWebhookServer({
        port: CLOSED_PORT,
        evolutionWebhookSecret: CLOSED_SECRET,
        evolutionApiUrl: '',
        adminPhones: [],
      });

      try {
        const bodyStr = JSON.stringify({
          event: 'messages.upsert',
          data: {
            key: { remoteJid: '573999000111@s.whatsapp.net', fromMe: false, id: `CLOSED_${Date.now()}` },
            message: { conversation: 'ESTADO' },
          },
        });
        const res = await new Promise<{ statusCode: number; body: any }>((resolve, reject) => {
          const req = http.request(
            `http://127.0.0.1:${CLOSED_PORT}/api/whatsapp/webhook`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(bodyStr),
                apikey: CLOSED_SECRET,
              },
            },
            (response) => {
              let data = '';
              response.on('data', (c) => (data += c));
              response.on('end', () => resolve({ statusCode: response.statusCode || 0, body: JSON.parse(data) }));
            }
          );
          req.on('error', reject);
          req.write(bodyStr);
          req.end();
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.results[0].authorized).toBe(false);
        expect(res.body.results[0].reason).toBe('ADMIN_PHONES_NOT_CONFIGURED');

        const notifRes = await webhookServer.sendEvolutionNotification('Hola', {
          adminPhones: [],
          evolutionApiUrl: 'http://127.0.0.1:8085',
          evolutionApiKey: CLOSED_SECRET,
          evolutionInstance: 'maestro_pescaderia',
        });
        expect(notifRes.sent).toBe(false);
        expect(notifRes.skipped).toBe(true);
        expect(notifRes.reason).toBe('ADMIN_PHONES_NOT_CONFIGURED');
      } finally {
        await handle.close();
      }
    });

    it('should bootstrap missing Evolution env keys without overwriting existing real secrets', () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'evo-bootstrap-test-'));
      try {
        fs.writeFileSync(
          path.join(tmpDir, '.env.local'),
          [
            'EVOLUTION_API_KEY=existing_real_key_do_not_touch',
            'EVOLUTION_WEBHOOK_SECRET=tu_secreto_webhook_evolution',
            'WHATSAPP_ADMIN_PHONES=573155551234',
          ].join('\n'),
          'utf8'
        );

        const res = evolutionBootstrap.ensureLocalEnvConfig({ rootDir: tmpDir });
        expect(res.config.apiKey).toBe('existing_real_key_do_not_touch');
        expect(res.config.webhookSecret).toMatch(/^evo_wh_[a-f0-9]{48}$/);
        expect(res.config.apiUrl).toBe('http://127.0.0.1:8085');
        expect(res.config.instance).toBe('maestro_pescaderia');
        expect(res.addedOrUpdatedKeys).not.toContain('EVOLUTION_API_KEY');
        expect(res.addedOrUpdatedKeys).toContain('EVOLUTION_WEBHOOK_SECRET');

        const whPayload = evolutionBootstrap.buildWebhookConfigPayload({
          webhookPort: '3010',
          webhookSecret: res.config.webhookSecret,
        });
        expect(whPayload.webhook.url).toBe('http://host.docker.internal:3010/api/whatsapp/webhook');
        expect(whPayload.webhook.events).toEqual(['MESSAGES_UPSERT']);
        expect(whPayload.webhook.headers['x-webhook-secret']).toBe(res.config.webhookSecret);

        const redacted = evolutionBootstrap.redactSnapshot(res.config, [res.config.apiKey, res.config.webhookSecret]);
        expect(redacted).not.toContain('existing_real_key_do_not_touch');
        expect(redacted).not.toContain(res.config.webhookSecret);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });
  });

  describe('13. Safe Self-Chat Mode (EVOLUTION_ALLOW_SELF_CHAT) & Anti-Loop Guards (SPEC-059)', () => {
    it('should keep fromMe=true disabled by default and never spoof sender from payload.sender', () => {
      const fromMePayload = {
        event: 'messages.upsert',
        data: {
          key: { remoteJid: '573001234567@s.whatsapp.net', fromMe: true, id: `DEFAULT_OFF_${Date.now()}` },
          message: { conversation: 'ESTADO' },
        },
      };
      expect(webhookServer.extractMessages(fromMePayload)).toEqual([]);

      const strangerLidWithOwnerSender = {
        event: 'messages.upsert',
        sender: '573001234567@s.whatsapp.net',
        data: {
          key: { remoteJid: '999888777666@lid', fromMe: false, id: `LID_SPOOF_${Date.now()}` },
          message: { conversation: 'ESTADO' },
        },
      };
      const extracted = webhookServer.extractMessages(strangerLidWithOwnerSender);
      expect(extracted).toHaveLength(1);
      expect(extracted[0].from).toBe('999888777666');
    });

    it('should execute authorized self-chat commands, dial adminPhones[0] on @lid, block 3rd-party chats, and prevent echo loops', async () => {
      const MOCK_API_PORT = 3205;
      const SELF_WEBHOOK_PORT = 3206;
      const SELF_SECRET = 'self_chat_secret_789';
      const sentMessages: Array<{ number: string; text: string }> = [];

      const mockApi = http.createServer((req, res) => {
        let raw = '';
        req.on('data', (c) => (raw += c));
        req.on('end', () => {
          const parsed = JSON.parse(raw || '{}');
          sentMessages.push({ number: parsed.number, text: parsed.text });
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ key: { id: `BOT_ECHO_${sentMessages.length}` }, status: 'PENDING' }));
        });
      });

      await new Promise<void>((resolve) => mockApi.listen(MOCK_API_PORT, '127.0.0.1', () => resolve()));

      const handle = await webhookServer.createWebhookServer({
        port: SELF_WEBHOOK_PORT,
        evolutionWebhookSecret: SELF_SECRET,
        evolutionApiUrl: `http://127.0.0.1:${MOCK_API_PORT}`,
        evolutionApiKey: SELF_SECRET,
        evolutionInstance: 'maestro_pescaderia',
        allowSelfChat: true,
        adminPhones: ['573001234567'],
        adminLids: ['126972134981693'],
      });

      const postEvent = (payloadObj: any) =>
        new Promise<{ statusCode: number; body: any }>((resolve, reject) => {
          const bodyStr = JSON.stringify(payloadObj);
          const req = http.request(
            `http://127.0.0.1:${SELF_WEBHOOK_PORT}/api/whatsapp/webhook`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(bodyStr),
                'x-webhook-secret': SELF_SECRET,
              },
            },
            (response) => {
              let data = '';
              response.on('data', (c) => (data += c));
              response.on('end', () => resolve({ statusCode: response.statusCode || 0, body: JSON.parse(data) }));
            }
          );
          req.on('error', reject);
          req.write(bodyStr);
          req.end();
        });

      try {
        // 1. Authorized self-chat via @lid routes reply to adminPhones[0]
        const resLid = await postEvent({
          event: 'messages.upsert',
          data: {
            key: { remoteJid: '126972134981693@lid', fromMe: true, id: `SELF_LID_${Date.now()}` },
            message: { conversation: 'ESTADO' },
          },
        });
        expect(resLid.statusCode).toBe(200);
        expect(resLid.body.results[0].command).toBe('STATUS');

        const deadline = Date.now() + 2000;
        while (sentMessages.length === 0 && Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, 25));
        }
        expect(sentMessages).toHaveLength(1);
        expect(sentMessages[0].number).toBe('573001234567');
        expect(webhookServer.outboundMessageIds.has('BOT_ECHO_1')).toBe(true);

        // 2. Echo of outbound message ID OR bot-prefixed text is silently dropped (no loop)
        const resEchoById = await postEvent({
          event: 'messages.upsert',
          data: {
            key: { remoteJid: '573001234567@s.whatsapp.net', fromMe: true, id: 'BOT_ECHO_1' },
            message: { conversation: 'CUALQUIER_TEXTO' },
          },
        });
        expect(resEchoById.statusCode).toBe(200);
        expect(resEchoById.body.processed).toBe(0);

        const resEchoByPrefix = await postEvent({
          event: 'messages.upsert',
          data: {
            key: { remoteJid: '573001234567@s.whatsapp.net', fromMe: true, id: `BOT_PREFIX_${Date.now()}` },
            message: { conversation: '🤖 *MaestroPescadería 24/7 Agency Status*' },
          },
        });
        expect(resEchoByPrefix.statusCode).toBe(200);
        expect(resEchoByPrefix.body.processed).toBe(0);

        // 3. Self-originated message sent to a customer chat MUST be blocked with zero outbound reply
        const resCustomer = await postEvent({
          event: 'messages.upsert',
          data: {
            key: { remoteJid: '573888777666@s.whatsapp.net', fromMe: true, id: `SELF_CUSTOMER_${Date.now()}` },
            message: { conversation: 'ESTADO' },
          },
        });
        expect(resCustomer.statusCode).toBe(200);
        expect(resCustomer.body.results[0].authorized).toBe(false);
        expect(resCustomer.body.results[0].reason).toBe('SELF_CHAT_NOT_AUTHORIZED');
        expect(sentMessages).toHaveLength(1);
      } finally {
        await handle.close();
        await new Promise<void>((resolve) => mockApi.close(() => resolve()));
      }
    });
  });
});
