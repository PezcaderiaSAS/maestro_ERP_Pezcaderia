# Scope: E2E Testing Track

## Architecture
- **Framework**: Playwright 1.61.1 (Chromium headless) + Google Harness² (`tools/harness2/run_harness2.py`).
- **Target URL**: `http://localhost:3000` (Vite dev server activo).
- **Test Philosophy**: Opaque-box, requirement-driven, derivado de `ORIGINAL_REQUEST.md` y `PROJECT.md § Feature Inventory`. No depende de la implementación interna de los componentes.
- **Fixture Central**: `tests/e2e/fixtures/testFixtures.ts` con inyección de sesión autenticada (`pezcaderia_auth_session` en `localStorage`), consentimiento Habeas Data y listener obligatorio de `page.on('console')` y `page.on('pageerror')`.
- **Deliverables**:
  1. `TEST_INFRA.md` en la raíz del proyecto.
  2. `tests/e2e/fixtures/testFixtures.ts`
  3. `tests/e2e/tier1-visual-integrity.spec.ts` (Smoke & Visual 375px / Desktop, 0 console.error)
  4. `tests/e2e/tier2-ux-ergonomics.spec.ts` (Fitts >=44px, Hick, Doherty <400ms)
  5. `tests/e2e/tier3-operational-lifecycle.spec.ts` (Ciclo completo: Preventa -> Recaudo -> Arqueo -> Kanban -> Catálogos)
  6. `tests/e2e/tier4-resilience.spec.ts` (Resiliencia, prevención stock negativo RN-01, búsqueda masiva, Harness² invariant verification)
  7. `TEST_READY.md` en la raíz del proyecto cuando toda la suite esté completa y lista para ser ejecutada.

## Feature Inventory
| # | Feature | Scope | Tier |
|---|---------|-------|------|
| F26 | E2E Fixture & Auth Session | Inyección de auth session y monitor de console.error | Fixture |
| F27 | Visual Integrity 375px & Desktop | 0 console.error y scrollWidth <= clientWidth en 4 pantallas | Tier 1 |
| F28 | UX Ergonomics Gate | Objetivos táctiles >=44x44px (Fitts) y respuesta <400ms | Tier 2 |
| F29 | Flujos Operativos Críticos | POS Preventa, Caja Recaudo, Kanban Live y Catálogos | Tier 3 |
| F30 | Resiliencia y Harness² | Validación de invariantes con Google Harness² y estrés | Tier 4 |

## Milestones (Internal to E2E Track)
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E1 | Test Fixture & Base Setup | `tests/e2e/fixtures/testFixtures.ts` con auth session y console.error listener | none | PLANNED |
| E2 | Tier 1 & Tier 2 Specs | `tests/e2e/tier1-visual-integrity.spec.ts` y `tier2-ux-ergonomics.spec.ts` | E1 | PLANNED |
| E3 | Tier 3 & Tier 4 Specs + Harness² | `tests/e2e/tier3-operational-lifecycle.spec.ts` y `tier4-resilience.spec.ts` | E1, E2 | PLANNED |
| E4 | TEST_INFRA.md & TEST_READY.md | Documentación y publicación de suite completa lista para el hito final M5 | E1, E2, E3 | PLANNED |

## Interface Contracts
- **Runner Command**: `npx playwright test`
- **Pass Semantics**: Exit code 0, 0 console.error, 0 unhandled exceptions.
- **Coordination Signal**: Publicar `TEST_READY.md` al finalizar.
