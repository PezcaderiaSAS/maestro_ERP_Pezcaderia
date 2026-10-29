## 2026-10-29T13:56:31Z
You are worker_m2_1 (Role: POS Multivendor & Ergonomics Worker).
Working directory: c:\Users\Personal\Documents\Yurgen\Maestro_Pezcaderia_ERP\maestro_ERP_Pezcaderia\.agents\teamwork\worker_m2_1\
Parent conversation ID: 893a38d8-5827-40f7-afd9-ff6dab5d7849

MANDATORY FIRST STEP:
Read ORIGINAL_REQUEST.md at:
c:\Users\Personal\Documents\Yurgen\Maestro_Pezcaderia_ERP\maestro_ERP_Pezcaderia\.agents\teamwork\ORIGINAL_REQUEST.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

CONTEXT & SURVEY FINDINGS:
Read PROJECT.md at:
c:\Users\Personal\Documents\Yurgen\Maestro_Pezcaderia_ERP\maestro_ERP_Pezcaderia\PROJECT.md
Read the survey findings for POS:
- Layout & Overflow: c:\Users\Personal\Documents\Yurgen\Maestro_Pezcaderia_ERP\maestro_ERP_Pezcaderia\.agents\teamwork\teamwork_explorer_survey_1\handoff.md (Section 1.1)
- Ergonomics & UX: c:\Users\Personal\Documents\Yurgen\Maestro_Pezcaderia_ERP\maestro_ERP_Pezcaderia\.agents\teamwork\teamwork_explorer_survey_2\handoff.md (Section 1.1)

EXCLUSIVE FILE OWNERSHIP:
You own exclusively:
- `src/views/POSView.tsx`
- `src/views/pos/components/*` (e.g. `ProductSearchPanel.tsx`, `CartPanel.tsx`, `ParkedOrdersBar.tsx`, `LineaVentaRow.tsx`, `TerminalVendorBadge.tsx`, `PaymentPanel.tsx`)
- And you may create/update tests in `src/tests/m2POSMultivendor.test.tsx`.
You MUST NOT modify any files in `src/views/cash/` or `src/views/ClientsView.tsx` or `src/views/InventoryView.tsx`.

MILESTONE M2 ASSIGNMENTS (Features F5–F10):
1. **F5 — Mobile Switcher [Catálogo] / [Carrito] in `POSView.tsx`**:
   - On `< lg` viewports, render an ergonomic toggle tab `[Catálogo] | [Carrito (N)]` so mobile/tablet users can toggle between product selection and the cart, eliminating the need to endlessly scroll past 50 product cards to see the cart. On `>= lg` (desktop), show both side-by-side as usual.
2. **F6 & F7 — Touch Targets >= 44x44px (Fitts's Law)**:
   - In `POSView.tsx`, advisor selection buttons in the counter vendor bar currently use `py-1 text-xs` (24px height). Expand them to `min-h-[44px]` with adequate touch padding.
   - In `TerminalVendorBadge.tsx`, ensure the active vendor indicator and quick-switch trigger meet >= 44px touch area.
   - In `PaymentPanel.tsx`, ensure the `+ Split` button and payment method cards meet `>= 44px`.
3. **F8 — Form Flex-Wrap in `ProductSearchPanel.tsx`**:
   - The barcode input (`w-[180px]`) + scanner button (`115px`) + product search input without wrap overflows on 375px screens. Add responsive wrapping (`flex-wrap` or stack on `< sm`) so it never exceeds viewport width.
4. **F9 — Responsive Wrap in `ParkedOrdersBar.tsx`**:
   - Ensure parked order chips wrap or scroll horizontally in a touch-friendly overflow container without causing outer window horizontal blowout.
5. **F10 — Doherty & Miller Optimization**:
   - Add debouncing (200ms) on product catalog search input so fast typing doesn't stutter UI rendering.
   - Simplify POS product cards: hide the 3-warehouse stock detail pill row by default on mobile cards, displaying total stock and expanding on tap/click (reducing visual cognitive load per Miller's Law).

VERIFICATION REQUIREMENTS:
- Run `npx tsc --noEmit` (Must exit code 0).
- Create and run `src/tests/m2POSMultivendor.test.tsx` testing mobile switcher toggle, touch target sizes, debounce, and layout safety.
- Run existing regression suites (`src/tests/m1DesignTokensAndShell.test.tsx`, `src/tests/m1AdversarialChallenge.test.tsx`).
- Document all observations, commands, and outputs in `c:\Users\Personal\Documents\Yurgen\Maestro_Pezcaderia_ERP\maestro_ERP_Pezcaderia\.agents\teamwork\worker_m2_1\handoff.md`.
- Send completion message to parent via send_message.
