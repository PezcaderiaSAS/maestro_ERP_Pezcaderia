## 2026-11-08T01:59:52Z
Read ORIGINAL_REQUEST.md at c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md.
Read PROJECT.md at c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\PROJECT.md.
Read survey report:
- c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\survey_explorer_pos\handoff.md

You are m3_worker_catalog.
Your mission is to implement Milestone M3: Reconstrucción de la Experiencia de Catálogo y Navegación POS (Benchmark SaaS Maduro).

Write Ownership:
- src/views/pos/components/POSTopBar.tsx (create)
- src/views/pos/components/POSCategoryTabs.tsx (create)
- src/views/pos/components/POSProductGrid.tsx (create)
- src/views/pos/components/POSProductCard.tsx (create)
- src/views/pos/components/POSPagination.tsx (create)
- src/views/pos/components/ProductSearchPanel.tsx (update / refactor)
- src/views/POSView.tsx (integrate clean catalog experience)

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Detailed Tasks:
1. Build `POSTopBar.tsx`:
   - Input barcode (`id="pos-barcode-input"` or similar, with Enter event to lookup & add item).
   - Input text search (`id="pos-product-search-input"`, with magnifying glass icon).
   - Button "+ Crear Producto" (clean emerald styling, `data-testid="btn-crear-producto-rapido"`), which triggers `onOpenCrearProducto()` opening `CrearProductoRapidoModal.tsx`.

2. Build `POSCategoryTabs.tsx`:
   - Left/Right navigation arrows (`←` and `→`) that trigger smooth horizontal scrolling of category tabs.
   - Dynamic category buttons with 'TODOS' as default, active pill highlighted in emerald green (`bg-emerald-600 text-white`).

3. Build `POSProductCard.tsx` and `POSProductGrid.tsx`:
   - Responsive 6-column grid on desktop screens (`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3`).
   - 18 products per page (page size = 18).
   - Clean product cards: square image/avatar container (using `ProductAvatar` or SVG), full product name legible on 2 lines (`.product-card-name`), bold prominent emerald price (`$XX.XXX`, `font-mono font-black text-emerald-400`), unit badge, click adds directly to cart (or opens weight if KG).
   - Preserve test class `.product-card`, `.product-card-name`, and `min-h-[72px]`.

4. Build `POSPagination.tsx`:
   - Clean pagination bar at bottom of catalog: `< Anterior`, page numbers `1 2 3 ...`, `Siguiente >`.

5. Update `ProductSearchPanel.tsx` & `POSView.tsx`:
   - Wire `POSTopBar`, `POSCategoryTabs`, `POSProductGrid`, and `POSPagination` into `ProductSearchPanel.tsx`.
   - In `POSView.tsx`, ensure the 75/25 catalog/cart split layout is spacious and clean, and mount `<CrearProductoRapidoModal />` when requested, refreshing inventory upon creation.

6. Run Vitest test suites and TypeScript typecheck:
   - `npx vitest run src/tests/posCatalogVendedorLegibility.test.tsx`
   - `npx vitest run src/tests/posScrollIsolationA11yV8.test.tsx`
   - `npx vitest run src/tests/posDarkGlassmorphismV8.test.tsx`
   - `npx vitest run src/tests/posCartPanelErgonomics.test.tsx`
   - `npx vitest run src/tests/posCart12ItemsScroll.test.tsx`
   - `npx vitest run src/tests/posParkedSalesFlow.test.tsx`
   - `npx tsc --noEmit`
   Ensure 100% tests pass with 0 errors.

Deliverable:
Write a comprehensive handoff report to:
`c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m3_worker_catalog\handoff.md`
Include:
- Files modified / created
- Summary of changes
- Verbatim Vitest and tsc test execution outputs.
Update progress.md in your state folder.
When complete, send a message to your parent orchestrator with a concise summary.
