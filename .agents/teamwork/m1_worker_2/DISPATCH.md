## 2026-11-05T19:17:07Z
You are m1_worker_2, the implementation worker for Milestone M1 (Motor de Datos, Hidratación Masiva y Búsqueda Sub-10ms) in MaestroPescaderia ERP.
Your working directory is: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m1_worker_2\

MANDATORY FIRST STEPS:
1. Read the original request at: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md
2. Read the project scope document at: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\PROJECT.md
3. Read the three Explorer handoff reports:
   - c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m1_explorer_1\handoff.md (PostgREST range chunking & IDB schema)
   - c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m1_explorer_2\handoff.md (Fast search, Web Worker, O(1) barcode lookup & useCounterCatalogSearch)
   - c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m1_explorer_3\handoff.md (Stock matrix O(1) in Zustand L1 & transactional lifecycle)
   (Review proposed code files in `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m1_explorer_2\proposed_*`).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

EXCLUSIVE WRITE OWNERSHIP (You may modify or create ONLY these files):
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

YOUR MISSION:
1. Implement the data engine and hydration enhancements following the exact specifications from m1_explorer_1, m1_explorer_2, and m1_explorer_3:
   - Range chunking in `progressiveHydrationService.ts` to fetch 10,000 items from Supabase in batches of 1,000 without hitting PostgREST 1,000 row truncation.
   - `bulkUpsertStock` and `getAllStockMatrix` in `tenantIndexedDbService.ts`.
   - String comparison optimization (replace localeCompare with binary compare), Top 100 Pareto precomputation, and synchronous `getBySkuOrBarcode(code)` in `searchEngineCore.ts`.
   - Sequence IDs handling in `catalogSearch.worker.ts`.
   - Hook updates in `useCatalogSearchWorker.ts` and create `useCounterCatalogSearch.ts`.
   - Add stock selectors (`getStock`, `getAvailableStock`, `hydrateStockMatrix`, `liberarReserva`) in `src/store/useInventoryStore.ts` and create `useCounterStock.ts`.
   - Create unit & benchmark tests in `src/tests/counterPosPerformance.test.ts` verifying sub-10ms search on 10,000 products, barcode/SKU scanner resolution in < 0.05ms, and stock lookup in < 0.002ms.
2. Run the automated tests:
   `npx vitest run src/tests/counterPosPerformance.test.ts src/tests/searchEngineCore.test.ts src/tests/tenantIndexedDbService.test.ts`
   and verify type safety:
   `npx tsc --noEmit`
3. Document all changed files, build and test outputs in your deliverable:
   `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m1_worker_2\handoff.md`
   Update `progress.md` with your status. Send a completion message back when done.
