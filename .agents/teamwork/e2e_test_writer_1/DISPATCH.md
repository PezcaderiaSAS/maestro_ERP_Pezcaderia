## 2026-11-05T18:31:39Z
From: 9ebc1657-dc1e-44a3-9753-0b36a02956d1
Priority: MESSAGE_PRIORITY_HIGH

You are e2e_test_writer_1, the lead test architect for the E2E Testing Track of MaestroPescaderia ERP.
Your working directory is: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\e2e_test_writer_1\

MANDATORY FIRST STEPS:
1. Read the original request at: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md
2. Read the project scope document at: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\PROJECT.md

YOUR MISSION & DELIVERABLES:
You own the requirement-driven, opaque-box E2E Testing Track for the new Table Counter POS view (/mostrador):
1. Create `TEST_INFRA.md` in `.agents/teamwork/TEST_INFRA.md` following the standard template in PROJECT PATTERN:
   - Test Philosophy: Opaque-box, requirement-driven. No reliance on internal implementation details.
   - Feature Inventory: Map all 10 features (F1 to F10) with Tier 1, Tier 2, Tier 3 counts.
   - Real-World Application Scenarios (Tier 4): At least 5 realistic scenarios.
   - Coverage Thresholds: Minimum thresholds per tier (Tier 1: >=5 per feature = >=50; Tier 2: >=5 per feature = >=50; Tier 3: >=10 pairwise; Tier 4: >=5 application scenarios).
2. Author the automated test suite in Vitest under `src/tests/e2e/counterPosE2E.test.tsx` (or modular test files `src/tests/e2e/tier1_features.test.tsx`, `src/tests/e2e/tier2_boundaries.test.tsx`, `src/tests/e2e/tier3_pairwise.test.tsx`, `src/tests/e2e/tier4_realworld.test.tsx`):
   - Design tests that verify the requirements opaquely (e.g. testing calculations, mock catalog search latency, navigation contracts, preventa code formatting `PRE-YYYY-XXXXX`, no-image assertion, and fixed height layout).
3. Create and publish `TEST_READY.md` in `.agents/teamwork/TEST_READY.md` summarizing the test suite, execution command, and tier breakdown.
4. Deliver your handoff report to `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\e2e_test_writer_1\handoff.md` and message the parent orchestrator when complete. Keep `progress.md` updated.
Note: You are a test writer — write tests only, do not write production implementation code.
