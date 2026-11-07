# BRIEFING — 2026-11-05T18:26:10Z

## Mission
Investigate codebase architecture for MaestroPescaderia ERP: routing, existing POS architecture, state management stores, and UI design tokens to prepare for the new Counter POS (/mostrador or /pos-tabla).

## 🔒 My Identity
- Archetype: explorer
- Roles: survey_explorer_1 (read-only investigation, architectural analysis)
- Working directory: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\survey_explorer_1
- Original parent: 9ebc1657-dc1e-44a3-9753-0b36a02956d1
- Milestone: Survey Phase

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Do NOT modify any project source files!
- Only write to my working directory: .agents/teamwork/survey_explorer_1/
- No secrets or sensitive data exposure
- Deliver 5-component handoff report (handoff.md) and heartbeat (progress.md)

## Current Parent
- Conversation ID: 9ebc1657-dc1e-44a3-9753-0b36a02956d1
- Updated: not yet

## Investigation State
- **Explored paths**:
  * src/routes/AppRoute.ts
  * src/App.tsx
  * src/components/layout/layoutModes.ts
  * src/components/layout/EnterpriseSidebar.tsx
  * src/views/POSView.tsx
  * src/views/pos/components/CartPanel.tsx
  * src/views/pos/components/LineaVentaRow.tsx
  * src/views/pos/components/ProductSearchPanel.tsx
  * src/views/pos/components/VirtualCatalogGrid.tsx
  * src/hooks/useVirtualGrid.ts
  * src/hooks/usePOSCart.ts
  * src/hooks/usePOSKeyboardShortcuts.ts
  * src/hooks/useCatalogSearchWorker.ts
  * src/workers/searchEngineCore.ts
  * src/workers/catalogSearch.worker.ts
  * src/services/fastItemSearchEngine.ts
  * src/services/prefacturaService.ts
  * src/services/posService.ts
  * src/store/useAppStore.ts
  * src/store/useAuthStore.ts
  * src/store/useCashStore.ts
  * src/store/useInventoryStore.ts
  * src/store/useWarehouseStore.ts
  * src/stores/useMultiVendorPosStore.ts
  * src/stores/usePosStore.ts
  * src/stores/useCashierKanbanStore.ts
  * tailwind.config.js
  * src/index.css
  * .agents/skills/erp-pos-design-tokens/SKILL.md
- **Key findings**:
  * Routing uses custom state/hash router via AppRouteId, useAppStore, and App.tsx switch. New `/mostrador` can be added cleanly as `AppRouteId.COUNTER_POS = 'mostrador'` without modifying POS.
  * POSView is 3681 lines, complex and coupled with shift open/close, weighing scale, multi-subviews. The new Counter Table view should be a separate, clean component (`CounterPosView.tsx`).
  * Fast search and massive catalog infrastructure (10k+ items) already exists: `SearchEngineCore`, `catalogSearch.worker.ts`, `FastItemSearchEngine`, `useVirtualGrid`.
  * Pre-sale emission with `PRE-YYYY-XXXXX` and multi-seller flow is already implemented in `prefacturaService.ts` and `useMultiVendorPosStore.ts`.
  * Design tokens support strict Light Mode WCAG 2.2 AA+ (4.5:1 / 7:1) and Dark Glassmorphism V8.
- **Unexplored areas**: None for survey scope. Ready to handoff.

## Key Decisions Made
- Completed full architectural audit across 4 requested focus areas plus performance/scale.

## Artifact Index
- DISPATCH.md — Received dispatch message
- progress.md — Liveness heartbeat and task tracking
- handoff.md — Comprehensive 5-component report for survey phase
