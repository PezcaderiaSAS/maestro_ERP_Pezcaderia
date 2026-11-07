# BRIEFING — 2026-11-05T18:46:00Z

## Mission
Implement Milestone M1: Data Engine, Progressive Range Chunking Hydration, Sub-10ms Search, O(1) Barcode Lookup, and O(1) Stock Matrix in Zustand L1.

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m1_worker_1
- Original parent: 9ebc1657-dc1e-44a3-9753-0b36a02956d1
- Milestone: M1 (Motor de Datos, Hidratación Masiva y Búsqueda Sub-10ms)

## 🔒 Key Constraints
- Modifying ONLY files in EXCLUSIVE WRITE OWNERSHIP:
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
- DO NOT cheat, do not hardcode test values, do not fabricate results.
- Spanish (es-419) language for documentation and comments.
- Vitest and tsc --noEmit must pass 100%.

## Current Parent
- Conversation ID: 9ebc1657-dc1e-44a3-9753-0b36a02956d1
- Updated: 2026-11-05T18:46:00Z

## Task Summary
- **What to build**: M1 data engine: PostgREST range chunking, tenant IndexedDB stock matrix bulk ops, sub-10ms Web Worker search with Top 100 Pareto precomputation, O(1) sync barcode/SKU lookup, Zustand L1 O(1) stock matrix, high-level counter hooks, and comprehensive unit/perf tests.
- **Success criteria**: All vitest tests pass, tsc --noEmit clean, search < 10ms for 10k items, barcode lookup < 0.05ms, stock lookup < 0.002ms in RAM.
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

## Loaded Skills
- None explicitly loaded

## Key Decisions Made
- Initializing M1 implementation plan based on 3 explorer handoffs.

## Artifact Index
- DISPATCH.md — Assignment record
- progress.md — Liveness heartbeat
- handoff.md — Final handoff report (TBD)
