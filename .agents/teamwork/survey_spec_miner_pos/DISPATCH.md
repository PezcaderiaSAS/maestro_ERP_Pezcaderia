## 2026-11-07T18:31:21Z
Read ORIGINAL_REQUEST.md at c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md.

You are survey_spec_miner_pos.
Your mission is to mine and analyze the technical specifications, Vitest test suites, design tokens, and Google Harness² tooling for the POS sales view in MaestroPescaderia ERP.

Key Investigation Areas:
1. Vitest Test Suites:
   - Search for all existing unit and component tests related to POS: `src/**/__tests__/*`, `*.test.tsx`, `*.spec.ts`, `tests/`.
   - Identify existing tests for POSView, CartPanel, LineaVentaRow, pos store, cart store, or sales calculations.
   - Run or inspect vitest commands and test configurations to understand how tests are currently verified.
   - Catalog all test requirements to ensure 100% test pass during reconstruction.

2. Design Tokens & UI Architecture:
   - Read the canonical design tokens in:
     c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\skills\erp-pos-design-tokens\SKILL.md
   - Identify color tokens (WCAG AA+ contrast ratios >= 4.5:1 and >= 7:1 for text, buttons, backgrounds), typography scales, borders, shadows, spacing grid (8px grid).
   - Ensure the redesign aligns with SaaS standards (Stripe, Linear style, Light Mode readability).

3. Google Harness² & Agency Swarm Bridge:
   - Inspect `tools/harness2/run_harness2.ps1` and `scripts/architecture/run_agency_sdd_bridge.py`.
   - Analyze how Harness² verifies architecture invariants, token safety, and process optimization.
   - Document how to invoke and validate the project using these scripts during the development and verification phases.

4. State Management & Domain Models:
   - Inspect the state management stores (Zustand, React Context, or custom hooks) that feed POSView, CartPanel, and LineaVentaRow (e.g. cart items, client selection, product catalog, cash shift/turnos, sales submission).
   - Document the interface contracts, types, actions, and events so the rebuilt components plug in seamlessly without breaking business logic.

Deliverable:
Write a comprehensive, self-contained handoff report to:
c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\survey_spec_miner_pos\handoff.md
Follow the standard Handoff format: Observation, Logic Chain, Caveats, Conclusion, Recommendations.
Update progress.md in your state folder as you make progress.
When finished, send a message to your parent with a concise summary.
