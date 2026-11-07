## 2026-11-05T18:45:06Z
You are m1_worker_1, the implementation worker for Milestone M1 (Motor de Datos, Hidratación Masiva y Búsqueda Sub-10ms) in MaestroPescaderia ERP.
Your working directory is: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m1_worker_1\

MANDATORY FIRST STEPS:
1. Read the original request at: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md
2. Read the project scope document at: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\PROJECT.md
3. Read the three Explorer handoff reports:
   - c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m1_explorer_1\handoff.md (PostgREST range chunking & IDB schema)
   - c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m1_explorer_2\handoff.md (Fast search, Web Worker, O(1) barcode lookup & useCounterCatalogSearch)
   - c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m1_explorer_3\handoff.md (Stock matrix O(1) in Zustand L1 & transactional lifecycle)
   (Also check code proposals in `.agents/teamwork/m1_explorer_2/proposed_*`).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

EXCLUSIVE WRITE OWNERSHIP (You may modify or create ONLY these files):
- `src/types/indexedDb.types.ts` (extend LocalIndexedDbProduct with counter fields)
- `src/services/progressiveHydrationService.ts` (add hydrateProductsFromSupabase with .range() chunking)
- `src/services/tenantIndexedDbService.ts` (add bulkUpsertStock & getAllStockMatrix)
- `src/workers/searchEngineCore.ts` (optimize string comparisons, Top 100 Pareto precomputation, getBySkuOrBarcode)
- `src/workers/catalogSearch.worker.ts` (handle sequence IDs and optimized search)
- `src/hooks/useCatalogSearchWorker.ts` (expose queryProducts & synchronous lookupByBarcodeOrSku)
- `src/hooks/useCounterCatalogSearch.ts` (create dedicated high-level counter hook)
- `src/store/useInventoryStore.ts` (add stock selectors getStock, getAvailableStock, hydrateStockMatrix, liberarReserva)
- `src/hooks/useCounterStock.ts` (create reactive counter stock hook)
- `src/tests/counterPosPerformance.test.ts` (create unit & benchmark tests for M1)

YOUR MISSION:
1. Implement the data engine and hydration enhancements following the exact specifications from m1_explorer_1, m1_explorer_2, and m1_explorer_3.
2. Ensure search operates under 10ms for 10,000 products, barcode/SKU scanner resolves in < 0.05ms synchronously, and stock lookups resolve in < 0.002ms in RAM.
3. Run the automated tests:
   `npx vitest run src/tests/counterPosPerformance.test.ts src/tests/searchEngineCore.test.ts src/tests/tenantIndexedDbService.test.ts`
   and verify type safety:
   `npx tsc --noEmit`
4. Document all changed files, build and test outputs in your deliverable:
   `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m1_worker_1\handoff.md`
   Update `progress.md` with your status. Send a completion message back when done.
