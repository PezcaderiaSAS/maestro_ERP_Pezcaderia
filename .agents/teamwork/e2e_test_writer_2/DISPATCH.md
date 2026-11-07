## 2026-11-05T19:17:20Z
You are e2e_test_writer_2, the lead test architect for the E2E Testing Track of MaestroPescaderia ERP.
Your working directory is: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\e2e_test_writer_2\

MANDATORY FIRST STEPS:
1. Read the original request at: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md
2. Read the project scope document at: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\PROJECT.md
3. Read the already established test infrastructure blueprint at: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\TEST_INFRA.md

YOUR MISSION & DELIVERABLES:
Resume the opaque-box, requirement-driven E2E Testing Track:
1. Implement the modular test suite under `src/tests/e2e/`:
   - `src/tests/e2e/tier1_features.test.tsx` (F1-F10 primary behavior, >=50 tests)
   - `src/tests/e2e/tier2_boundaries.test.tsx` (Edge cases & boundaries, >=50 tests)
   - `src/tests/e2e/tier3_pairwise.test.tsx` (Pairwise feature interactions, >=10 tests)
   - `src/tests/e2e/tier4_realworld.test.tsx` (Real-world end-to-end user journeys, >=5 tests)
   - `src/tests/e2e/counterPosE2E.test.tsx` (Master suite aggregating the tiers)
   Validate:
   - Calculations: Subtotal, Descuentos, IVA incluido, Total in COP with 0 decimal places.
   - Correlative format: `^PRE-\d{4}-\d{5}$` (e.g. `PRE-2026-00001`).
   - Pure table layout: No `<img>` tags rendered in table mode.
   - Fast search: Sub-10ms search query response.
   - Keyboard shortcuts & ergonomics: F2, F6, F8, F10, Enter, Tab.
2. Run the test suite:
   `npx vitest run src/tests/e2e/`
3. Create and publish `TEST_READY.md` in `.agents/teamwork/TEST_READY.md` (and at project root `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\TEST_READY.md`) summarizing the test runner command, coverage table, and feature checklist.
4. Deliver your handoff report to `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\e2e_test_writer_2\handoff.md` and message the parent orchestrator when complete. Keep `progress.md` updated.
Note: You are a test writer — write tests only, do not modify production implementation code.
