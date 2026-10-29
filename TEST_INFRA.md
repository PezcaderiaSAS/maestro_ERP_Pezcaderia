# TEST_INFRA — E2E Testing Infrastructure & Quality Gates

**Project**: Maestro Pezcadería ERP  
**Version**: 2.2.0 (Brownfield Enterprise)  
**Standard**: WCAG 2.2 AA+, Google Harness², Playwright 1.61.1, UX Ergonomics (Fitts, Hick, Doherty, Miller, Jakob)  
**Date**: 2026-10-29  

---

## 1. Testing Philosophy & Guiding Principles

1. **Opaque-Box & Requirement-Driven**: Tests are derived strictly from business requirements (`ORIGINAL_REQUEST.md`, `PROJECT.md`) and interaction contracts, rather than coupling to internal React component states.
2. **Deterministic Seed & Offline Autonomy**: Tests pre-inject deterministic database states via `localStorage` seeds (`pezcaderia_auth_session`, `erp_habeas_data_consent`, `pezcaderia_stock`, `pezcaderia_cajas`, `pezcaderia_turnos_caja`). They execute 100% offline without hitting live cloud APIs, preventing rate-limiting, flakiness, and credential leakage.
3. **Strict Console Error & Exception Gate**: Every page transition, click, and input interaction is monitored for `console.error` and `pageerror` events. Any unhandled rejection or React runtime warning immediately fails the test.
4. **Progressive Quality Tiers (Tiers 1–4)**: Tests progress from layout stability to UX ergonomics, then to complete multi-screen operational lifecycles, and finally to resilience under stress and Google Harness² invariant verification.

---

## 2. Progressive Quality Tiers Architecture

| Tier | Specification File | Focus Area | Success / Invariant Criteria | Target Screens |
|:---|:---|:---|:---|:---|
| **Tier 1** | `tests/e2e/tier1-visual-integrity.spec.ts` | Smoke Navigation & Layout Integrity | - 0 `console.error` and 0 `pageerror`<br>- Mobile (375x667): `scrollWidth <= clientWidth + 2`<br>- Desktop (1366x768): No horizontal clipping or blowout | 1. POS Táctil Mostrador<br>2. Caja Única Recaudo<br>3. Tablero Kanban<br>4. Clientes & Catálogo |
| **Tier 2** | `tests/e2e/tier2-ux-ergonomics.spec.ts` | Ergonomics & Cognitive Laws (UX Gates) | - **Ley de Fitts**: Touch targets >= 44x44px bounding box<br>- **Ley de Hick**: Payment methods & options chunked clearly<br>- **Ley de Doherty**: Search inputs update DOM in < 400ms<br>- **Ley de Miller**: Information density structured without cognitive overload | POS Táctil, PaymentPanel, CashFlowView, ClientsView, ProductTable |
| **Tier 3** | `tests/e2e/tier3-operational-lifecycle.spec.ts` | End-to-End Business Lifecycles | - **Flow A**: POS pre-sale issue -> queue registration (`pezca_pos_drafts_v1`)<br>- **Flow B**: Cashier lookup -> payment -> ticket emission<br>- **Flow C**: Shift reconciliation & arqueo with justification validation (RN-44)<br>- **Flow D**: Order Kanban state transitions | Multi-vendor POS, PendingOrdersDrawer, Cashier Drawer, OrderKanbanView |
| **Tier 4** | `tests/e2e/tier4-resilience.spec.ts` | Resilience, Chaos & Harness² Invariants | - **RN-01**: Negative stock sale prevention<br>- Rapid typing stress without unhandled rejections<br>- Google Harness² Propose-Probe-Compose invariant verification execution (`tools/harness2/run_harness2.py`) | POS Cart Engine, Catalog Search, Harness² Evaluator |

---

## 3. Feature Mapping to Test Artifacts

| Feature ID | Feature Name | Test Specification | Description & Verified Scenarios |
|:---|:---|:---|:---|
| **F26** | E2E Fixture & Auth Session | `tests/e2e/fixtures/testFixtures.ts` | Custom Playwright fixture injecting `pezcaderia_auth_session` and `erp_habeas_data_consent` into `localStorage`, collecting `console.error` and `pageerror` into an array assertion monitor. |
| **F27** | Tier 1 Visual & Smoke Integrity | `tests/e2e/tier1-visual-integrity.spec.ts` | Multi-screen smoke navigation verifying 0 console errors; viewport checks at 375x667 and 1366x768 verifying `scrollWidth <= clientWidth + 2`. |
| **F28** | Tier 2 UX Ergonomics Gate | `tests/e2e/tier2-ux-ergonomics.spec.ts` | Bounding box assertions (>=44x44px) on primary touch buttons (Fitts), payment method chunking (Hick), search debounce feedback <400ms (Doherty). |
| **F29** | Tier 3 Operational Lifecycles | `tests/e2e/tier3-operational-lifecycle.spec.ts` | Full operational loops: Seller parks order to queue -> Cashier loads and collects payment -> Shift closing requires justification on discrepancy -> Kanban tracks order progression. |
| **F30** | Tier 4 Resilience & Harness² | `tests/e2e/tier4-resilience.spec.ts` | Negative stock blocking (RN-01), rapid typing unhandled rejection immunity, and Google Harness² benchmark run verification. |

---

## 4. Test Infrastructure Components

### 4.1 Test Fixture (`tests/e2e/fixtures/testFixtures.ts`)
Provides custom `test` and `expect` with:
- `authenticatedPage`: Automates `addInitScript` to pre-seed `localStorage` before DOM initialization, preventing login redirection.
- `consoleErrorMonitor`: Captures runtime console errors and unhandled exceptions during the test lifecycle.
- Navigation helpers for POS, Caja, Kanban, Clientes, and Inventario.

### 4.2 Playwright Configuration (`playwright.config.ts`)
- **Test Directory**: `./tests/e2e`
- **Base URL**: `http://localhost:3000`
- **Timeout**: 60,000 ms
- **Headless**: Yes (`headless: true`)
- **Browser**: Chromium (`Desktop Chrome`)

### 4.3 Google Harness² Verification Bridge
- **Script**: `tools/harness2/run_harness2.py`
- **Execution Command**: `python tools/harness2/run_harness2.py --demo`
- **Bridge Command**: `python scripts/architecture/run_agency_sdd_bridge.py -a quality -p "..." --dry-run`

---

## 5. Execution Commands

```bash
# Execute entire E2E Tier Suite (Tiers 1-4)
npx playwright test tests/e2e/tier*.spec.ts

# Execute Tier 1 (Smoke & Visual Integrity)
npx playwright test tests/e2e/tier1-visual-integrity.spec.ts

# Execute Tier 2 (UX Ergonomics Gate)
npx playwright test tests/e2e/tier2-ux-ergonomics.spec.ts

# Execute Tier 3 (Operational Lifecycle)
npx playwright test tests/e2e/tier3-operational-lifecycle.spec.ts

# Execute Tier 4 (Resilience & Harness²)
npx playwright test tests/e2e/tier4-resilience.spec.ts

# Execute Google Harness² Demo Suite
python tools/harness2/run_harness2.py --demo
```
