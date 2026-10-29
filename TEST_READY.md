# TEST_READY — E2E Test Suite Certification & Quality Gates

**Project**: Maestro Pezcadería ERP  
**Test Suite**: Playwright E2E Quality Tiers & Google Harness² Invariant Verification  
**Status**: Certified Ready for Milestone M5 Execution  
**Date**: 2026-10-29  
**Coverage**: Tiers 1–4 (17 Automated Tests across 4 files + Central Fixtures)

---

## 1. Test Runner & Execution Commands

The test suite is built on Playwright 1.61.1 and integrates Google Harness² deterministic verification.

### Full Suite Execution
```bash
# Execute all certified E2E Quality Tiers
npx playwright test tier
```

### Per-Tier Execution Commands
```bash
# Tier 1: Smoke Navigation & Responsive Layout Integrity (375px & 1366px)
npx playwright test tests/e2e/tier1-visual-integrity.spec.ts

# Tier 2: UX Ergonomics & Cognitive Laws (Fitts >=44px, Hick, Doherty <400ms)
npx playwright test tests/e2e/tier2-ux-ergonomics.spec.ts

# Tier 3: End-to-End Operational Lifecycles (POS -> Recaudo -> Arqueo RN-44 -> Kanban)
npx playwright test tests/e2e/tier3-operational-lifecycle.spec.ts

# Tier 4: Resilience, Chaos Stress & Google Harness² Invariants (RN-01)
npx playwright test tests/e2e/tier4-resilience.spec.ts

# Standalone Google Harness² Verification Bridge
python tools/harness2/run_harness2.py --demo
```

---

## 2. Test Tiers & Test Counts Inventory

| Tier | Specification File | Tests | Focus Area & Success Criteria |
|:---|:---|:---:|:---|
| **Tier 1** | `tests/e2e/tier1-visual-integrity.spec.ts` | **7** | **Smoke & Responsive Layout Integrity**<br>• Zero `console.error` and zero unhandled exceptions across all primary views.<br>• Mobile 375x667 viewport: Strict overflow gate (`scrollWidth <= clientWidth + 2px`) for POS, Caja, Clientes, Inventario, and Kanban.<br>• Desktop 1366x768 viewport: Fluid layout verification with zero clipping. |
| **Tier 2** | `tests/e2e/tier2-ux-ergonomics.spec.ts` | **4** | **UX Ergonomics & Cognitive Laws**<br>• **Ley de Fitts**: Bounding boxes for operative action buttons >= 44x44px.<br>• **Ley de Hick**: Payment methods grouped into <= 4–5 discrete root chunks.<br>• **Ley de Doherty**: Catalog and inventory reactive search response threshold < 400ms. |
| **Tier 3** | `tests/e2e/tier3-operational-lifecycle.spec.ts` | **3** | **End-to-End Operational Lifecycles**<br>• **Flow A & B**: Multi-vendor POS order creation -> Central Queue parking (`pezca_pos_drafts_v1`) -> Cashier collection & receipt issue.<br>• **Flow C**: Blind cash shift closing requiring mandatory justification on discrepancies > $5.000 (RN-44).<br>• **Flow D**: Live order progression and filtering on Kanban board. |
| **Tier 4** | `tests/e2e/tier4-resilience.spec.ts` | **3** | **Resilience, Chaos & Google Harness²**<br>• **RN-01**: Atomic negative stock blocking and out-of-stock sale prevention.<br>• Rapid typing burst debouncing without unhandled promise rejections.<br>• Google Harness² Propose-Probe-Compose invariant verification execution. |
| **Total** | **4 Specification Files** | **17** | **100% Certified E2E Test Suite Ready for Execution** |

---

## 3. Feature Coverage Mapping

Mapping from `PROJECT.md` and `SCOPE.md` Feature Inventory to the E2E Test Artifacts:

| Feature ID | Feature Name | Test Specification | Verified Scenarios & Invariant Guarantees |
|:---|:---|:---|:---|
| **F26** | E2E Fixture & Auth Session | `tests/e2e/fixtures/testFixtures.ts` | Deterministic pre-seeding of `localStorage` (`pezcaderia_auth_session`, `erp_habeas_data_consent`, `pezcaderia_stock`, `pezcaderia_cajas`, `pezcaderia_turnos_caja`). Strict console error and unhandled rejection monitor. |
| **F27** | Visual Integrity 375px & Desktop | `tests/e2e/tier1-visual-integrity.spec.ts` | Smoke navigation through all priority screens with 0 console errors; viewport checks at 375x667 and 1366x768 enforcing `scrollWidth <= clientWidth + 2px`. |
| **F28** | UX Ergonomics Gate | `tests/e2e/tier2-ux-ergonomics.spec.ts` | Fitts law touch target dimensions (>=44x44px), Hick law cognitive chunking in payment panel, and Doherty law debounced interactive response (<400ms). |
| **F29** | Flujos Operativos Críticos | `tests/e2e/tier3-operational-lifecycle.spec.ts` | End-to-end multi-screen business lifecycles: POS pre-sale issue -> Central queue handover -> Cashier collection -> Shift reconciliation with RN-44 justification -> Kanban order progression. |
| **F30** | Resiliencia y Harness² | `tests/e2e/tier4-resilience.spec.ts` | Negative stock blocking (RN-01), rapid typing unhandled rejection immunity, and Google Harness² Propose-Probe-Compose benchmark execution. |

---

## 4. Test Infrastructure Specifications

- **Framework**: Playwright 1.61.1 (`@playwright/test`)
- **Execution Target**: Chromium (`Desktop Chrome`, headless: true)
- **Base URL**: `http://localhost:3000`
- **Network Mode**: 100% Offline Autonomy (Pre-seeded localStorage, no cloud API dependencies)
- **Quality Gates**:
  1. `console.error` Count = 0
  2. `pageerror` (Unhandled Rejections) Count = 0
  3. `scrollWidth <= clientWidth + 2px` (No horizontal blowout)
  4. Fitts Law Touch Area >= 44x44px
  5. Negative Stock Block Invariant (RN-01) Enforced
  6. Discrepancy Closing Justification (RN-44) Enforced
