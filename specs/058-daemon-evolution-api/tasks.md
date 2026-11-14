# SPEC-058 Tareas Granulares TDD (`/speckit.tasks`)

Cada tarea sigue el ciclo estrictamente secuencial (**UNA tarea a la vez en `/speckit.implement`**) con verificación TDD y reporte al usuario:

- **T1 — Cargador cero-dependencias `.env` / `.env.local` y documentación `.env.example` (`REQ-01`, `REQ-08`)**
  - Archivos: `scripts/daemon/env.cjs` (nuevo), `.env.example`, `tests/daemon/daemon-control-loop.test.ts`.
  - Pruebas TDD: Precedencia `process.env > .env.local > .env`, soporte CRLF, comentarios `#`, comillas y `=`.

- **T2 — Adaptador Evolution API v1/v2 entrante + anti-bucle + dual auth en `webhook-server.cjs` (`REQ-02`, `REQ-03`, `REQ-04`)**
  - Archivos: `scripts/daemon/webhook-server.cjs`, `tests/daemon/daemon-control-loop.test.ts`.
  - Pruebas TDD: `messages.upsert` en `/api/whatsapp/webhook` y `/messages-upsert`, auth constante `apikey`/`x-webhook-secret`, `fromMe: true` ignorado, `@g.us` ignorado, `remoteJidAlt` LID normalizado, fallback Meta HMAC 100% verde.

- **T3 — Respuesta bidireccional saliente `sendText` hacia Evolution API (`REQ-05`)**
  - Archivos: `scripts/daemon/webhook-server.cjs`, `tests/daemon/daemon-control-loop.test.ts`.
  - Pruebas TDD: Mock HTTP local validando recepción de `POST /message/sendText/{instance}` con header `apikey` y cuerpo `{ number, text }` (y soporte `v1` `{ number, textMessage: { text } }`), sin bloquear HTTP `200` y tolerando error de conexión.

- **T4 — Timeout configurable `tsc` (90s) en `audit-runner.cjs` y `DAEMON_SDD_DRY_RUN` en `worker.cjs` (`REQ-06`, `REQ-07`)**
  - Archivos: `scripts/daemon/audit-runner.cjs`, `scripts/daemon/worker.cjs`, `tests/daemon/daemon-control-loop.test.ts`.
  - Pruebas TDD: `resolveTscTimeoutMs()` (default `90000`, override válido, límite mínimo) y `resolveDryRunMode()` (`true` salvo `DAEMON_SDD_DRY_RUN === 'false'`).

- **T5 — Integración `env.cjs` y diagnóstico Evolution en `cli.cjs` y `supervisor.cjs` (`REQ-01`, `REQ-08`)**
  - Archivos: `scripts/daemon/cli.cjs`, `scripts/daemon/supervisor.cjs`, `ecosystem.config.cjs` (si requiere nota/comentario limpio).
  - Pruebas TDD: Arranque de ayuda/status reflejando estado de configuración Evolution sin exponer secretos y advertencia cuando faltan credenciales.

- **T6 — Verificación integral final y compuerta pre-arranque (`npx tsc --noEmit`, `vitest`, `gitnexus detect-changes`)**
  - Validar 100% suite `daemon-control-loop.test.ts` + `tsc --noEmit` + reporte `gitnexus` sin errores.
  - Solicitar al usuario sus credenciales reales (`EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE`, `WHATSAPP_ADMIN_PHONES`) antes de ejecutar `npm run daemon:start`.

