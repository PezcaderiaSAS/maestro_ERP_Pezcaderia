# BRIEFING — 2026-11-07T18:42:45Z

## Mission
Mine and analyze technical specifications, Vitest test suites, design tokens, and Google Harness² tooling for the POS sales view in MaestroPescaderia ERP.

## 🔒 My Identity
- Archetype: specification-miner
- Roles: survey_spec_miner_pos
- Working directory: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia
- State folder: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\survey_spec_miner_pos
- Original parent: ba45cc1d-c8b5-4eca-a8a6-e3a849f3a0b7
- Milestone: POS View Technical Specification & Mining

## 🔒 Key Constraints
- Read-only analysis: do NOT implement or alter production code
- Comprehensive mining of tests, tokens, Harness2, state models
- Strict verification before claims
- Self-contained handoff report in .agents/teamwork/survey_spec_miner_pos/handoff.md

## Current Parent
- Conversation ID: ba45cc1d-c8b5-4eca-a8a6-e3a849f3a0b7
- Updated: 2026-11-07T18:42:45Z

## Task Summary
- **What to build**: Comprehensive technical mining and specification for POSView, CartPanel, LineaVentaRow reconstruction
- **Success criteria**: Detailed handoff report covering Vitest inventory, Design Tokens analysis, Harness2 tooling analysis, State management & interface contracts
- **Interface contracts**: POSViewProps, CartPanelProps, LineaVentaRowProps, usePOSCart, usePosStore, useCashStore
- **Code layout**: src/views/POSView.tsx, src/views/pos/components/, src/tests/

## Key Decisions Made
- Discovered and isolated the syntax blocker in `src/views/pos/components/CartPanel.tsx:1:4` (`usa harneimport`) causing compilation failure in 15+ test suites.
- Validated passing status of independent test suites (over 70 passing tests across schema, cash engine, pricing, drafts, E2E ferretería).
- Verified Google Harness² and Agency Swarm Bridge via active CLI invocation (`run_agency_sdd_bridge.py` and `run_harness2.ps1`).
- Mapped canonical design tokens from `erp-pos-design-tokens.SKILL.md` (WCAG AAA contrast 18.5:1, 8px grid, min 44px/48px/56px touch targets).

## Artifact Index
- .agents/teamwork/survey_spec_miner_pos/DISPATCH.md — Received dispatch prompt
- .agents/teamwork/survey_spec_miner_pos/erp-pos-design-tokens.SKILL.md — Local copy of design tokens skill
- .agents/teamwork/survey_spec_miner_pos/BRIEFING.md — Persistent memory
- .agents/teamwork/survey_spec_miner_pos/progress.md — Liveness heartbeat
- .agents/teamwork/survey_spec_miner_pos/handoff.md — Final deliverable report

## Loaded Skills
- **Source**: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\skills\erp-pos-design-tokens\SKILL.md
- **Local copy**: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\survey_spec_miner_pos\erp-pos-design-tokens.SKILL.md
- **Core methodology**: Light Mode WCAG AA+ high contrast tokens, 8px grid, 44px+ touch targets, strict white inputs and card backgrounds.
