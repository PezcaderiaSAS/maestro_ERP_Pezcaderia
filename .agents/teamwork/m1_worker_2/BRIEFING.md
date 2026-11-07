# BRIEFING — 2026-11-05T19:18:00Z

## Mission
Implement Milestone M1 (Data Engine, Massive Hydration, and Sub-10ms Search) in MaestroPescaderia ERP genuine and robustly.

## 🔒 My Identity
- Archetype: implementer
- Roles: implementer, qa, specialist
- Working directory: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m1_worker_2
- Original parent: 9ebc1657-dc1e-44a3-9753-0b36a02956d1
- Milestone: M1

## 🔒 Key Constraints
- EXCLUSIVE WRITE OWNERSHIP:
  - `src/types/indexedDb.types.ts`
  - `src/services/progressiveHydrationService.ts`
  - `src/services/tenantIndexedDbService.ts`
  - `src/workers/searchEngineCore.ts`
  - `src/workers/catalogSearch.worker.ts`
  - `src/hooks/useCatalogSearchWorker.ts`
  - `src/hooks/useCounterCatalogSearch.ts`
  - `src/store/useInventoryStore.ts`
  - `src/hooks/useCounterStock.ts`
  - `src/tests/counterPosPerformance.test.ts`
- DO NOT CHEAT. All implementations must maintain genuine logic and real state.
- Verification commands:
  - `npx vitest run src/tests/counterPosPerformance.test.ts src/tests/searchEngineCore.test.ts src/tests/tenantIndexedDbService.test.ts`
  - `npx tsc --noEmit`

## Current Parent
- Conversation ID: 9ebc1657-dc1e-44a3-9753-0b36a02956d1
- Updated: 2026-11-05T19:18:00Z

## Task Summary
- **What to build**: PostgREST range chunking, IndexedDB stock schema & bulk methods, search engine core optimizations (binary comparison, Pareto Top 100 precomputation, O(1) barcode lookup), sequence tracking in web worker, useCounterCatalogSearch hook, stock matrix store methods & useCounterStock hook, comprehensive benchmark and unit tests.
- **Success criteria**: All tests pass, tsc --noEmit passes, search <10ms for 10k items, barcode lookup <0.05ms, stock lookup <0.002ms.
- **Interface contracts**: PROJECT.md & explorer handoffs.
- **Code layout**: src/services, src/workers, src/hooks, src/store, src/tests.

## Change Tracker
- **Files modified**: None yet
- **Build status**: Pending
- **Pending issues**: None

## Quality Status
- **Build/test result**: Pending
- **Lint status**: Clean
- **Tests added/modified**: Pending

## Artifact Index
- DISPATCH.md — Assignment and constraints
- BRIEFING.md — Persistent context
- progress.md — Liveness heartbeat
- handoff.md — Final deliverable report
