# Progress — Explorer Survey Cart Panel

Last visited: 2026-11-05T16:04:00Z
Current Status: Completed

## Tasks
- [x] Step 0: Record dispatch and initialize BRIEFING.md & progress.md
- [x] Step 1: Examine `src/views/POSView.tsx` layout constraints and how CartPanel is embedded
  - Root container in `layoutModes.ts`: `h-[calc(100vh-theme(spacing.12)-theme(spacing.3))]` with `overflow-hidden`.
  - 5 stacked header bars in POSView: Header/Breadcrumb (~40px), Mostrador Asesores (~42px), Control/Subviews (~44px), KPI bar (~36px), Queue ticker (~32px) -> total ~200px.
  - Leaves only ~470px height on standard 768p laptop screen for the main grid!
  - Discovered prior attempts to shrink buttons to 36px in POSView which broke `m2POSMultivendor.test.tsx` (Fitts' Law).
- [x] Step 2: Examine `src/views/pos/components/CartPanel.tsx` DOM tree, flex hierarchy, heights, overflow settings
  - Root: `<GlassCard className="pos-cart-panel flex flex-col h-full min-h-0 overflow-hidden ...">`
  - Fixed Header: Mac controls + Client selector + Cerrar Turno + En Espera + Borradores (~90px).
  - ParkedOrdersBar: ~72px when drafts exist.
  - Items container: `.pos-cart-items-list` with `flex-1 min-h-0 overflow-y-auto`.
  - Footer: `.pos-cart-footer` with `shrink-0 mt-auto`!
    - Inside footer in Cashier mode: Total banner (~44px) + DiscountPanel (~110px) + full PaymentPanel (~610px) = 764px!
    - Inside footer in Mostrador mode: Total banner (~44px) + DiscountPanel (~110px) + Mostrador box (~138px) = 292px!
    - In Cashier mode, 764px footer in a 470px container squeezes `pos-cart-items-list` to ZERO HEIGHT (0px collapse)!
- [x] Step 3: Examine `src/views/pos/components/LineaVentaRow.tsx` presentation, truncation, spacing, touch targets
  - 2-tier layout:
    - Tier 1: Title + KILOS/UNIDAD badges + Manual badge + 48x48px delete button.
    - Tier 2: Subtotal + unit price button + modified price badge + discount badge + stock badge + historical badge + balanza button + 48x48 dec button + input + 48x48 inc button.
    - Right controls take 226px, leaving only ~130px in a 380px column -> badges wrap to 3-4 lines!
    - Height of ONE row is ~125px to 160px.
    - 12 items require ~1600px of vertical scrolling space.
- [x] Step 4: Trace and identify exact root causes for vertical collapse when 12+ items are present
  - Detailed physical and mathematical analysis of 463px deficit in handoff.md.
- [x] Step 5: Evaluate whether to refactor vs rewrite CartPanel for multivendor - single cashier flow
  - Definite recommendation: Rearchitect via "Decoupled Cart / Tender on Demand" pattern.
- [x] Step 6: Formulate concrete architectural proposals (CSS classes, DOM layout hierarchy, props, flex-1 min-h-0)
  - Detailed proposal in handoff.md: ultra-compact 115px footer + on-demand tender modal/drawer + 60px high-density retail row.
- [x] Step 7: Write comprehensive `handoff.md` and report to orchestrator
