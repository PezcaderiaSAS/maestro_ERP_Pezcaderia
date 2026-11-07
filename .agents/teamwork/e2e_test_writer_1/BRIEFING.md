# BRIEFING — 2026-11-05T18:33:15Z

## Mission
Design, specify, and author the requirement-driven, opaque-box E2E test suite (Tiers 1 to 4) for the Table Counter POS view (/mostrador) in MaestroPescaderia ERP, alongside TEST_INFRA.md, TEST_READY.md, and handoff report.

## 🔒 My Identity
- Archetype: specialist, qa
- Roles: specialist, qa
- Working directory: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\e2e_test_writer_1\
- Original parent: 9ebc1657-dc1e-44a3-9753-0b36a02956d1
- Milestone: M6 (Certificación E2E 100% y Cobertura Adversarial)

## 🔒 Key Constraints
- Test writer only: write and modify test code and test documentation only — never implementation code.
- Progressive testability & requirement-driven opaque-box testing: test against requirements and interfaces defined in ORIGINAL_REQUEST.md & PROJECT.md without coupling to internal private state.
- Authoritative expected output derivation: verify exact calculations, format strings (`PRE-YYYY-XXXXX`), navigation shortcuts, no-image DOM constraints, latency requirements.
- Layout compliance: agent metadata in `.agents/teamwork/`, test suite files in `src/tests/e2e/`.

## Current Parent
- Conversation ID: 9ebc1657-dc1e-44a3-9753-0b36a02956d1
- Updated: not yet

## Task Summary
- **What to build**: Comprehensive Vitest E2E test suite across 4 Tiers (Tier 1: Feature verification >=50 tests; Tier 2: Boundary & stress >=50 tests; Tier 3: Pairwise combinations >=10 tests; Tier 4: Real-world application scenarios >=5 tests). Complementary `TEST_INFRA.md` and `TEST_READY.md`.
- **Success criteria**: All tests pass or accurately evaluate against specifications, 100% compliant with contracts in PROJECT.md.
- **Interface contracts**: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\PROJECT.md`
- **Code layout**: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\PROJECT.md` § Code Layout

## Key Decisions Made
- Partition the E2E test suite modularly into `src/tests/e2e/tier1_features.test.tsx`, `src/tests/e2e/tier2_boundaries.test.tsx`, `src/tests/e2e/tier3_pairwise.test.tsx`, and `src/tests/e2e/tier4_realworld.test.tsx` (with master runner or barrel `src/tests/e2e/counterPosE2E.test.tsx`) for maximum clarity, isolation, and speed.
- Write tests that mock external dependencies (Supabase, Web Worker where necessary) cleanly while rigorously asserting all 10 features, contracts, and invariants.

## Artifact Index
- `.agents/teamwork/TEST_INFRA.md` — Test philosophy, 10-feature inventory (Tiers 1-3), Tier 4 scenarios, thresholds.
- `.agents/teamwork/TEST_READY.md` — Test suite summary, execution command, tier breakdown.
- `src/tests/e2e/counterPosE2E.test.tsx` — Master entry / suite aggregator.
- `src/tests/e2e/tier1_features.test.tsx` — Tier 1 Feature verification tests (F1 to F10, >= 50 tests).
- `src/tests/e2e/tier2_boundaries.test.tsx` — Tier 2 Edge cases, boundary stress & adversarial tests (>= 50 tests).
- `src/tests/e2e/tier3_pairwise.test.tsx` — Tier 3 Interaction & pairwise combination tests (>= 10 tests).
- `src/tests/e2e/tier4_realworld.test.tsx` — Tier 4 Real-world user flows & multi-vendor scenarios (>= 5 scenarios).
- `.agents/teamwork/e2e_test_writer_1/handoff.md` — 5-component handoff report.

## Loaded Skills
- None loaded from task dispatch.

## Quality Status
- **Build/test result**: Not run yet.
- **Lint status**: Not run yet.
- **Tests added/modified**: Preparing test suite creation.
