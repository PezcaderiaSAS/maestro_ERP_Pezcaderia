# BRIEFING — 2026-11-05T18:28:15Z

## Mission
Extract and document exact specifications, business rules, schemas, and contracts from the codebase for:
1. Preventas / Comandas & Correlative Generation (`PRE-YYYY-XXXXX`)
2. Multi-vendor / Seller context & Cashier (Caja Única), shifts (turnos), registers
3. Financial & Tax calculations (IVA, discounts, rounding, subtotal/total, conversions)
4. Keyboard Shortcuts & POS Workflow (F2, F6, F8, F10, arrow keys, Enter, Tab)

## 🔒 My Identity
- Archetype: Specification Miner
- Roles: External domain expert, codebase surveyor
- Working directory: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\survey_spec_miner\
- Original parent: 9ebc1657-dc1e-44a3-9753-0b36a02956d1
- Milestone: Survey Phase

## 🔒 Key Constraints
- READ-ONLY on project source files: never modify application source or tests directly.
- All persistent output in `.agents/teamwork/survey_spec_miner/`.
- Prioritize authoritative spec sources (codebase, migrations, types, documentation).
- Maintain `progress.md` heartbeat.
- Send handoff report upon completion via `send_message`.

## Current Parent
- Conversation ID: 9ebc1657-dc1e-44a3-9753-0b36a02956d1
- Updated: 2026-11-05T18:28:15Z

## Task Summary
- **What to build**: Specification discovery report (`handoff.md`) covering the 4 target domains.
- **Success criteria**: Exhaustive identification of existing schemas, rules, formulas, keyboard shortcuts, and gaps.
- **Interface contracts**: Supabase schemas (`pos_prefacturas`, `pos_sessions`), TypeScript types (`prefactura.types.ts`, `cash.types.ts`, `pos.types.ts`), services (`prefacturaService.ts`, `posService.ts`, `fastItemSearchEngine.ts`), hooks (`usePOSKeyboardShortcuts.ts`).
- **Code layout**: MaestroPescaderia codebase.

## Key Decisions Made
- Completed specification mining across all 4 target focus areas.
- Validated financial rounding and tax calculations against existing Vitest suite (100% passing).
- Documented edge cases, data flows, and keyboard shortcut mappings for the new table counter view (`/mostrador`).

## Artifact Index
- DISPATCH.md — Stamped dispatch instruction
- BRIEFING.md — Situational awareness
- progress.md — Heartbeat and progress tracking
- handoff.md — Comprehensive deliverable report
