# SPEC-058 Informe de Consistencia Cruzada y Análisis de Impacto (`/speckit.analyze`)

- **Especificación:** [spec.md](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/specs/058-daemon-evolution-api/spec.md)
- **Plan Técnico:** [plan.md](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/specs/058-daemon-evolution-api/plan.md)
- **Tareas:** [tasks.md](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/specs/058-daemon-evolution-api/tasks.md)
- **Checklist:** [checklist.md](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/specs/058-daemon-evolution-api/checklist.md)
- **Co-ejecución SDD:** `specs/sdd_verification_reports/sdd_bridge_coexecution_20261111_135345.json`

---

## 1. Alineación Cruzada Spec -> Plan -> Tasks

| Requisito | Plan Técnico (`plan.md`) | Tarea (`tasks.md`) | Estado |
| :--- | :--- | :--- | :--- |
| `REQ-01` (Carga `.env`/`.env.local` sin npm) | §1.1 `scripts/daemon/env.cjs` con precedencia `process.env > .env.local > .env` | **T1**, **T5** | Alineado |
| `REQ-02` (Auth dual Evolution + Meta HMAC) | §1.2 `safeCompare` (`timingSafeEqual`) + fallback `verifySignature` en rutas webhook | **T2** | Alineado |
| `REQ-03` (Anti-bucle `fromMe` y filtro `@g.us`) | §1.2 descarte temprano en `extractMessages()` antes de `commandParser` | **T2** | Alineado |
| `REQ-04` (Ingesta `messages.upsert` v1/v2 y `remoteJidAlt`) | §1.2 normalización de `payload.event` (`messages.upsert` / `MESSAGES_UPSERT` / `MESSAGES-UPSERT`) y dígitos JID | **T2** | Alineado |
| `REQ-05` (`sendText` asíncrono no bloqueante) | §1.2 `sendEvolutionText` (`http`/`https`, timeout `8000` ms) post-ACK `200` | **T3** | Alineado |
| `REQ-06` (`tsc` timeout `90000` ms) | §1.3 `DAEMON_TSC_TIMEOUT_MS` default `90000` ms en `audit-runner.cjs` | **T4** | Alineado |
| `REQ-07` (`DAEMON_SDD_DRY_RUN` en `worker.cjs`) | §1.4 evaluación dinámica en cada tick (`!== 'false'`) | **T4** | Alineado |
| `REQ-08` (Diagnóstico CLI y espera credenciales) | §1.5 aviso pasivo si faltan credenciales + bloqueo manual pre-`daemon:start` | **T1**, **T5**, **T6** | Alineado |

### Nota sobre Co-Ejecución SDD (`task-6061`)
- `Agency Swarm` (`@quality`): Estado `ok` (`33.79s`), validó consistencia y aportó soporte de variantes `MESSAGES-UPSERT` / `MESSAGES_UPSERT`. Las sugerencias externas de Supabase/Zod fueron descartadas por arquitectura local `$0` ya aprobada en `SPEC-058`.
- `Google Harness²`: Estado `failed` (`returncode: 1`, `1.55s`) al invocarse con el flag `--dry-run`.

---

## 2. Análisis de Impacto GitNexus (Blast Radius)

Resultados reales obtenidos tras reindexar `maestro_ERP_Pezcaderia` (`25.824` nodos, `37.823` aristas, `560` clusters, `300` flujos):

| Símbolo | Archivo | Riesgo | Impactados | Directos | Procesos | Módulos | Mitigación en Plan |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `createWebhookServer` | `scripts/daemon/webhook-server.cjs` | **CRITICAL** | `70` | `55` | `4` | `17` | Preservar firma de opciones y compatibilidad HTTP/HTTPS y rutas actuales |
| `extractMessages` | `scripts/daemon/webhook-server.cjs` | **LOW** | `0` | `0` | `0` | `0` | Mantener estructura `{ id, from, text }` e ignorar `fromMe`/`@g.us` limpiamente |
| `verifySignature` | `scripts/daemon/webhook-server.cjs` | **CRITICAL** | `70` | `55` | `4` | `17` | No alterar comportamiento HMAC-SHA256 existente; añadir path separado para `apikey` |
| `dispatchTaskToBridge` | `scripts/daemon/audit-runner.cjs` | **CRITICAL** | `457` | `275` | `96` | `20` | Conservar firma `(task, dryRun = true)` sin cambios de contrato |
| `runTier2` | `scripts/daemon/audit-runner.cjs` | **CRITICAL** | `457` | `275` | `96` | `20` | Ampliar únicamente timeout configurable de `tsc` (`90000` ms) sin mutar estructura de retorno |
| `runControlLoopStep` | `scripts/daemon/worker.cjs` | **CRITICAL** | `70` | `55` | `4` | `17` | Leer `DAEMON_SDD_DRY_RUN` dinámicamente sin romper contrato ni ciclos existentes |

---

## 3. Veredicto Pre-Implementación (`/speckit.implement`)
- **Advertencia obligatoria (`AGENTS.md`):** 5 de los 6 símbolos analizados reportan riesgo **CRITICAL** en GitNexus debido a llamadas transversales con pruebas, CLI y herramientas (`tools/harness2`, `tools/agency-swarm`, `tests/daemon`).
- Todos los cambios propuestos conservan **retrocompatibilidad estricta** de firmas públicas y pruebas Meta/HMAC existentes.
- **Estado:** Listo para iniciar **T1** (`scripts/daemon/env.cjs` + `.env.example` + pruebas unitarias TDD) tras confirmación explícita del usuario.

