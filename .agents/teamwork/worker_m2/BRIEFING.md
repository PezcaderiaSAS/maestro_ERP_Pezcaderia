# BRIEFING — 2026-11-05T16:47:00Z

## Mission
Implementar Milestone M2: Fila Retail Compacta (LineaVentaRow ~58px-64px), Scroll Vertical Prioritario e Independiente (12+ Ítems) en CartPanel, y la suite completa de pruebas unitarias/estrés posCart12ItemsScroll.test.tsx sin romper tests existentes.

## 🔒 My Identity
- Archetype: implementer
- Roles: implementer, qa, specialist
- Working directory: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\worker_m2\
- Original parent: e581d92b-b34a-4a1c-839f-2a3c9710cd5f
- Milestone: Milestone M2 — Fila Retail Compacta (LineaVentaRow), Scroll Vertical Prioritario (12+ Ítems) y Suite de Pruebas

## 🔒 Key Constraints
- Exclusive write ownership:
  - `src/views/pos/components/LineaVentaRow.tsx`
  - `src/views/pos/components/CartPanel.tsx`
  - `src/tests/posCart12ItemsScroll.test.tsx`
  - Archivos dentro de `.agents/teamwork/worker_m2/`
- DO NOT CHEAT: Genuine implementations only, no dummy facade or hardcoded tests.
- WCAG 2.2 AA+ contrast (>= 4.5:1 text, >= 3:1 controls).
- Fitts' law touch targets: stepper +/- and delete buttons min-w-[48px] min-h-[48px].
- Compact retail row height ~58px - 64px (saving ~50-60% height).
- Maintain all existing data-testid and test selector IDs (`btn-aumentar-cantidad`, `btn-disminuir-cantidad`, `btn-eliminar-linea`, `btn-editar-precio`, `input-cantidad`, etc.).
- TypeScript 0 errors (`npx tsc --noEmit`) and 100% vitest passing across specified test suites.

## Current Parent
- Conversation ID: e581d92b-b34a-4a1c-839f-2a3c9710cd5f
- Updated: 2026-11-05T16:47:00Z

## Task Summary
- **What to build**: Compact retail LineaVentaRow (~58-64px), CartPanel scroll priority with fixed footer, robust 12+ item unit and stress test suite.
- **Success criteria**: Clean compilation, all 5 test files green, 0 regressions, full WCAG 2.2 AA+ compliance.
- **Interface contracts**: PROJECT.md, CartPanel and LineaVentaRow props interfaces.
- **Code layout**: src/views/pos/components/ and src/tests/

## Key Decisions Made
- Rediseño de `LineaVentaRow.tsx`: Se unificaron los dos niveles previos (135px-165px) en una sola franja horizontal con altura de `min-h-[58px] max-h-[64px]` (~60px computados). Los controles táctiles (Minus, Input, Plus, Delete) comparten la misma franja horizontal con dimensiones >= 48px, manteniendo la accesibilidad de Fitts y el contraste WCAG 2.2 AA+.
- Optimización de `CartPanel.tsx`: Se agregó `custom-scrollbar` al contenedor `cart-items-container` y se introdujo `formattedTotalItems` para evitar artefactos de punto flotante de JS en los badges de conteo.
- Creación de `src/tests/posCart12ItemsScroll.test.tsx`: 7 pruebas exhaustivas que validan el montaje sin colapso de 12 ítems, legibilidad de filas, anclaje de footer, convivencia con `ParkedOrdersBar`, estrés con 16 y 20 productos, y respuesta táctil.

## Artifact Index
- DISPATCH.md — Initial dispatch instructions
- BRIEFING.md — Persistent situational awareness
- progress.md — Liveness heartbeat and progress tracker
- handoff.md — Final 5-component handoff report

## Change Tracker
- **Files modified**:
  - `src/views/pos/components/LineaVentaRow.tsx`: Rediseño a formato retail compacto (~58px-64px).
  - `src/views/pos/components/CartPanel.tsx`: Scroll prioritario con `custom-scrollbar` y sanitización de punto flotante en conteo de ítems.
  - `src/tests/posCart12ItemsScroll.test.tsx`: Nueva suite de 7 pruebas unitarias y de estrés.
- **Build status**: PASS (0 errores en `tsc --noEmit`, 43/43 tests pasando en Vitest).
- **Pending issues**: Ninguno.

## Quality Status
- **Build/test result**: 5 archivos de prueba pasados, 43 pruebas pasadas (100% verde).
- **Lint status**: 0 violaciones.
- **Tests added/modified**: `src/tests/posCart12ItemsScroll.test.tsx` (7 nuevos tests pasando).

## Loaded Skills
- erp-pos-design-tokens, ui-ux-pro-max, and testing standards.
