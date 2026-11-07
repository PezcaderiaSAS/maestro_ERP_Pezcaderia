# BRIEFING — 2026-11-05T18:18:20Z

## Mission
Diseñar, implementar y verificar una vista dedicada y de alto rendimiento para ventas de mostrador tipo tabla (`/mostrador` o `/pos-tabla`) en MaestroPescaderia ERP, con soporte para 10.000 productos, navegación 100% por teclado, diseño ultra ligero y flujo de preventas correlativas a caja única.

## 🔒 My Identity
- Archetype: teamwork_orchestrator
- Roles: orchestrator, user_liaison, human_reporter, successor
- Working directory: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\orchestrator
- Original parent: parent
- Original parent conversation ID: 765b9d85-75a4-433b-98b8-bf29beca339d

## 🔒 My Workflow
- **Pattern**: Project Pattern (Dual Track: Implementation + E2E Testing)
- **Scope document**: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\PROJECT.md
1. **Decompose**: Survey codebase via 3 Explorers, create PROJECT.md with architecture, feature inventory, milestones, and interface contracts.
2. **Dispatch & Execute**:
   - Implementation Track: Sub-orchestrators for milestones M1..Mn, final milestone passing 100% E2E tests + Tier 5 adversarial hardening.
   - E2E Testing Track: E2E Testing Orchestrator building Tiers 1-4 opaque-box test suite -> TEST_READY.md.
3. **On failure**: Retry -> Replace -> Skip (non-critical) -> Redistribute -> Redesign.
4. **Succession**: At spawn count >= 16 and all subagents complete, write soft handoff.md, cancel timers, spawn successor.
- **Work items**:
  1. Survey & Codebase Investigation [in-progress]
  2. Architecture Decomposition & PROJECT.md [pending]
  3. Parallel Track Execution (Implementation & E2E Testing) [pending]
  4. Final Milestone & Adversarial Hardening [pending]
- **Current phase**: 0 (Survey)
- **Current focus**: Monitoring Survey Phase subagents (survey_explorer_1, survey_explorer_2, survey_spec_miner)

## 🔒 Key Constraints
- NEVER write, modify, or create source code files directly.
- NEVER run build/test commands yourself — require workers to do so.
- NEVER investigate or explore the problem at the code level — dispatch Explorers for technical investigation.
- You MAY use file-editing tools ONLY for metadata/state files (.md) in your .agents/teamwork/ folder.
- Forensic Auditor INTEGRITY VIOLATION is a binary veto.
- Do NOT cheat or allow dummy/hardcoded implementations.
- Spanish language (es-419) for user interaction and documentation.

## Current Parent
- Conversation ID: 765b9d85-75a4-433b-98b8-bf29beca339d
- Updated: not yet

## Key Decisions Made
- Adopting Project Pattern with Phase 0 Survey (3 parallel investigators: 2 Explorers + 1 Spec Miner) to map existing routing, POS stores, preventa services, data fetching and keyboard navigation patterns in MaestroPescaderia.

## Team Roster
| Agent | Type | Work Item | Status | Conv ID |
|-------|------|-----------|--------|---------|
| survey_explorer_1 | teamwork_explorer | Codebase Architecture Explorer | completed | fc582291-5877-4984-a797-c4d4d9f3ce98 |
| survey_explorer_2 | teamwork_explorer | Performance and Data Explorer | completed | 5aa1806a-cadb-4005-bb88-737348f6f3b1 |
| survey_spec_miner | teamwork_spec_miner | Transactional Domain Spec Miner | completed | 81c8fea3-1c4c-447a-8bad-b31b57dd253f |
| m1_worker_2 | teamwork_worker | Data Engine Implementation Worker | in-progress | 3024c4a2-fb4d-4b6d-ab8f-adcbedcde838 |
| e2e_test_writer_2 | teamwork_test_writer | E2E Test Suite Architect | in-progress | 009ae19c-2832-4bc9-877d-b9ea3ccdeb10 |

## Succession Status
- Succession required: no
- Spawn count: 10 / 16
- Pending subagents: 3024c4a2-fb4d-4b6d-ab8f-adcbedcde838, 009ae19c-2832-4bc9-877d-b9ea3ccdeb10
- Predecessor: none
- Successor: not yet spawned

## Active Timers
- Heartbeat cron: 9ebc1657-dc1e-44a3-9753-0b36a02956d1/task-16
- Safety timer: 9ebc1657-dc1e-44a3-9753-0b36a02956d1/task-24

## Artifact Index
- .agents/teamwork/ORIGINAL_REQUEST.md — Verbatim user request
- .agents/teamwork/orchestrator/DISPATCH.md — Incoming message dispatch log
- .agents/teamwork/orchestrator/BRIEFING.md — Working memory and orchestrator state
- .agents/teamwork/orchestrator/progress.md — Liveness heartbeat and milestone tracking
- .agents/teamwork/survey_explorer_1/handoff.md — Codebase architecture findings (pending)
- .agents/teamwork/survey_explorer_2/handoff.md — Performance and data findings (pending)
- .agents/teamwork/survey_spec_miner/handoff.md — Transactional domain findings (pending)
