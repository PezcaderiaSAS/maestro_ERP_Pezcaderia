# BRIEFING — 2026-11-07T18:57:00Z

## Mission
Implement Milestone M1: Remediación de Sintaxis y Rediseño Ergonómico de Carrito y Filas de Venta (`CartPanel.tsx` and `LineaVentaRow.tsx`).

## 🔒 My Identity
- Archetype: implementer
- Roles: implementer, qa, specialist
- Working directory: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia
- State folder: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m1_worker_cart
- Original parent: ba45cc1d-c8b5-4eca-a8a6-e3a849f3a0b7
- Milestone: M1 (Remediación de Sintaxis y Rediseño Ergonómico de Carrito y Filas de Venta)

## 🔒 Key Constraints
- Exclusive write ownership: `src/views/pos/components/CartPanel.tsx`, `src/views/pos/components/LineaVentaRow.tsx`, and `.agents/teamwork/m1_worker_cart/*`.
- DO NOT CHEAT: No hardcoded test results, facade implementations, or circumventing tasks.
- Keep data-testid contracts and layout classes intact.
- Follow ERP POS Design Tokens (Light Mode WCAG AA+ / SaaS standard, emerald #059669 accents, high-contrast text, touch targets >= 48px).

## Current Parent
- Conversation ID: ba45cc1d-c8b5-4eca-a8a6-e3a849f3a0b7
- Updated: 2026-11-07T18:57:00Z

## Task Summary
- **What to build**: Fix syntax in `CartPanel.tsx`, redesign `LineaVentaRow.tsx` (2-tier ergonomic row, no white rectangular artifact, 48px touch targets), redesign `CartPanel.tsx` (compact customer header 38px, 75-80% scrollable items container, non-sticky footer with emerald cobrar button, clean draft/parked orders integration).
- **Success criteria**: Vitest test suites (`posCartPanelErgonomics`, `posCartRowErgonomics`, `posCart12ItemsScroll`, `posCartRedesignAndCashierMode`, `usePOSCart`) pass 100%. All contracts and regression suites passing.
- **Interface contracts**: PROJECT.md, survey reports.
- **Code layout**: `src/views/pos/components/`

## Change Tracker
- **Files modified**:
  - `src/views/pos/components/CartPanel.tsx`: Fixed syntax corruption on line 1 (`usa harneimport` -> `import React, { useState, useEffect } from 'react';`), refined compact customer header (38px with `👤 CONSUMIDOR FINAL`), enhanced primary button (`⚡ Vender / Cobrar` + subtotal) and clean secondary outline button (`Guardar (En Espera F6)`).
  - `src/views/pos/components/LineaVentaRow.tsx`: Redesigned into ergonomic 2-tier row, eliminated `bg-white` inside dark container, implemented 48px steppers, 48px direct numeric input, 48px delete button, editable unit price button, and bold emerald subtotal.
- **Build status**: PASS (47/47 tests passing in M1 suites, 24/24 passing in regression suites, `tsc --noEmit` passed with 0 errors).
- **Pending issues**: None

## Quality Status
- **Build/test result**: PASS (47 tests passed in target suites; 71 tests passed across all checked suites).
- **Lint status**: Clean (tsc --noEmit with exit code 0).
- **Tests added/modified**: Validated against comprehensive existing suites covering ergonomics, Fitts's Law, scroll isolation, and multi-tenant scales.

## Loaded Skills
- **Source**: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\skills\erp-pos-design-tokens\SKILL.md
- **Local copy**: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m1_worker_cart\erp-pos-design-tokens.md
- **Core methodology**: WCAG AA+ (ratio >= 4.5:1 / 7:1) tokens for POS, Cashier, Inventory, dark neutral borders, emerald accents.

## Artifact Index
- DISPATCH.md — Task assignment from orchestrator
- BRIEFING.md — Persistent working memory index
- progress.md — Liveness heartbeat and step tracking
- handoff.md — 5-component self-contained verification report
