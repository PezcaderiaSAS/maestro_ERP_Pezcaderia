# Handoff Report: Codebase Architectural Investigation for Counter POS (/mostrador)

**Agent ID**: survey_explorer_1  
**Timestamp**: 2026-11-05T18:27:00Z  
**Phase**: Survey Phase (Read-Only Investigation)  
**Target Goal**: Architectural foundation for new high-performance counter sales view (`/mostrador` or `/pos-tabla`) preserving existing POS intact.

---

## 1. Observation

### 1.1 Routing & Navigation Architecture
- **Router System**: The project does NOT use `react-router-dom` (confirmed in `package.json:39-81`). Instead, it implements a custom **State-Driven + URL Hash Synchronized Router** managed by Zustand (`useAppStore`) and `window.location.hash` (`src/App.tsx:730-762`).
- **Canonical Route Registry (`src/routes/AppRoute.ts`)**:
  * Line 20–55: Enum `AppRouteId` defines all system views:
    ```typescript
    export enum AppRouteId {
      DASHBOARD = 'dashboard',
      POS = 'pos',
      POS_OFFLINE = 'pos_offline',
      PRICES = 'precios',
      CLIENTS = 'clientes',
      CRM = 'crm',
      ORDERS_KANBAN = 'kanban',
      CASHIER_KANBAN = 'comandas_kanban',
      ...
    }
    ```
  * Line 72–83: `COMMERCIAL_ROUTES: readonly AppRouteId[]` groups commercial routes.
  * Line 114–210: `RouteParamsMap` defines strict type-safe arguments per route.
  * Line 237–569: `APP_ROUTES_METADATA: Record<AppRouteId, AppRouteMetadata>` defines paths (e.g. `path: '/ventas/pos'`), titles, allowed roles (`allowedRoles`), icons, and test IDs.
  * Line 578–632: `routeToPath()` and `pathToRoute()` map routes bidirectionally to URL paths.
  * Line 646–653: `isRouteAllowedForRole()` provides declarative RBAC checks.
- **Route Switch & Rendering (`src/App.tsx`)**:
  * Line 731–757: Hash listener checks `VALID_ROUTES`:
    ```typescript
    const VALID_ROUTES: (ERPViewKey | string)[] = [
      'dashboard', 'pos', 'comandas_kanban', 'caja', ...
    ];
    if (VALID_ROUTES.includes(candidate)) {
      setCurrentView(candidate as any);
    }
    ```
  * Line 1387–1464: `renderView()` uses a `switch (currentView)`:
    ```typescript
    case 'pos':
      return <POSView handleCancelarPedidoDigital={...} handleAprobarPedidoManual={...} />;
    ```
- **Viewport Layout Rules (`src/components/layout/layoutModes.ts`)**:
  * Line 7–13: `TRANSACTIONAL_FIXED_VIEWS` lists views that must have fixed height (`h-[calc(100vh-...)] overflow-hidden`) without outer window scrolling.
  * Line 39–51: `getMainLayoutClasses()` applies `flex-1 px-2.5 pb-2 lg:px-3 lg:pb-2.5 pt-0 overflow-hidden flex flex-col h-[calc(100vh-theme(spacing.12)-theme(spacing.3))] min-h-0` for transactional views.

### 1.2 Existing POS View Architecture (`src/views/POSView.tsx`)
- **Scale and Coupling**:
  * `POSView.tsx` is **3,681 lines long** (173 KB).
  * It directly handles opening/closing shifts (`AperturaCajaModal`, `ArqueoCajaModal`, `RetiroParcialModal`), balance scales (`BalanzaButton`, `ManualWeightModal`), offline outbox, B2B order consolidation, digital channels, and printer tickets (`TicketBuilder`).
- **Layout and Responsive Breakpoints**:
  * Root container: `pos-layout w-full h-full min-h-0 flex flex-col gap-1 sm:gap-1.5 p-0 pb-1 overflow-hidden` (Line 2207).
  * Top bar (Zone 1, Line 2216–2266): Breadcrumb, shift badge (`Turno #...` or `Caja Cerrada`), and seller badge (`currentUser`) with `UserSwitchModal`.
  * Multi-advisor quick bar (Zone 1.5, Line 2269–2306): Renders buttons for `VENDEDORES_JOSASE` (Line 63–69) to switch active seller quickly.
  * Subview tabs (Zone 2, Line 2309–2350): Tabs for `Venta Rápida (POS)`, `Consolidación B2B`, `Canales Digitales`.
  * Quick action buttons (Line 2400–2515): `📋 Comandas` drawer trigger, `⚖️ Balanza`, `Más Acciones...` dropdown.
  * Responsive Mobile Switcher (`< lg`, Line 2581–2618): Tab switcher between `Catálogo` and `Carrito`.
  * Grid structure (`lg: 1024px+` / `xl: 1280px+`, Line 2620–2720):
    - Left Column (`flex-1`): `GlassCard` containing `ProductSearchPanel` (search input, categories, barcodes, product cards/grid).
    - Middle Column (`w-full lg:w-[380px] xl:w-[420px]`): `CartPanel` (or `TicketBuilder` on completed sale).
    - Right Column (`xl:flex`, Line 2709–2720): `VendorTicketSidebar` (active seller pre-sales).
- **Cart & Line Rows**:
  * `CartPanel.tsx` (970 lines) receives lines and renders `LineaVentaRow.tsx` (356 lines).
  * Rows display SKU, product name, quantity +/- controls, weight read, line discount, and price override via SweetAlert2 (`handleEditarPrecioClick`).
- **Action Bar**:
  * For advisors (`isAsesorMostrador`, Line 827–848): button `EMITIR PREVENTA / COMANDA (F6)`.
  * For cashiers (Line 850–869): button `⚡ COBRAR / LIQUIDAR (F2 / Enter)` which opens `PaymentPanel` in a modal drawer (`payment-drawer-backdrop`).
- **Keyboard Shortcuts**:
  * In `POSView.tsx:2150-2200`: `F2` triggers cobro/search; `F6` triggers save draft; `Enter` opens shift or triggers cobro; `Alt+1..9` switches categories.
  * In `usePOSKeyboardShortcuts.ts:1-147`: Central hook supporting `F1`–`F12`, `Escape`, `Enter`, `ArrowUp`, `ArrowDown`.

### 1.3 State Management & Stores
- **Zustand Version**: `zustand: ^5.0.14` with `zustandConsoleMiddleware`.
- **Existing Stores for POS, Sales, Auth, Register, and Inventory**:
  1. `useAppStore` (`src/store/useAppStore.ts`):
     - `currentView`: `AppRouteId | ERPViewKey`.
     - `setCurrentView(view, params)`: Navigates without page reload.
     - `currentUser`: active employee session (`ActiveUserSession`).
     - `userRole`: 'admin' | 'vendedor' | 'bodega' | 'administrativo'.
     - `theme`: active theme mode.
  2. `useAuthStore` (`src/store/useAuthStore.ts`):
     - `activeTenant`: current tenant data (e.g. `tenant-03` / Josase).
     - `status`: 'authenticated' | 'unauthenticated' | 'loading'.
     - Multi-tenant RBAC mapping (`mapRoleRbacToUserRole`).
  3. `useMultiVendorPosStore` (`src/stores/useMultiVendorPosStore.ts`):
     - `terminalId`: 'TERM-01' through 'TERM-08' stored in `localStorage`.
     - `vendedorActivo`: `VendedorSesion | null`.
     - `cartItems`: `ItemPrefacturaInput[]`.
     - `canProcessDirectCashierPayment()`: Enforces business rule: sellers/advisors DO NOT collect cash; only cashiers/admins do.
     - `emitirPreventaActual()`: Calls `prefacturaService.emitirPrefactura()` which assigns consecutive `PRE-YYYY-XXXXX`.
  4. `prefacturaService` (`src/services/prefacturaService.ts`):
     - Domain service for pre-sales life cycle (`PENDIENTE_COBRO` -> `EN_COBRO` -> `COBRADO` -> `DESPACHADO`).
     - Line 176–177: Consecutive code generator: `const codigoPreventa = PRE-${year}-${String(this.consecutivoCount).padStart(5, '0')};`.
  5. `usePOSCart` (`src/hooks/usePOSCart.ts`):
     - Hook for cart state (`lineas`, `cliente`, `totales`).
     - Delegates calculations to `posService.ts` (`calcularTotalLinea`, `calcularTotalesPedido`).
  6. `useCashStore` (`src/store/useCashStore.ts`):
     - `turnoActivo`: `TurnoCaja | null` (id, cajaId, cajeroId, estado, totalEfectivo).
     - `abrirTurno()`, `cerrarTurno()`, `registrarMovimiento()`.
  7. `useInventoryStore` (`src/store/useInventoryStore.ts`):
     - `products`: unified `Producto[]` with `sku`, `nombre`, `precio_venta_pos`, `precio_venta_restaurante`, `precio_venta_mayorista`, `categoria`, `stock`.
  8. `useWarehouseStore` (`src/store/useWarehouseStore.ts`):
     - `bodegas`: `Bodega[]`, `activaId`: active warehouse ID.
  9. `useCashierKanbanStore` (`src/stores/useCashierKanbanStore.ts`):
     - Central cashier Kanban board consuming pre-sales emitted by advisors.

### 1.4 High-Scale Catalog & Fast Search Engine (10,000+ Items)
- **Search Engine Core (`src/workers/searchEngineCore.ts`)**:
  * In-memory indexing using:
    - `skuMap: Map<string, LocalIndexedDbProduct>` -> O(1) instant SKU lookup.
    - `barcodeMap: Map<string, LocalIndexedDbProduct>` -> O(1) instant barcode lookup.
    - `wordToProducts: Map<string, Set<LocalIndexedDbProduct>>` -> Inverted word index.
    - `vocabulary` array with bounded Levenshtein distance -> Fast fuzzy search.
  * Verified performance (`src/tests/searchEngineCore.test.ts`): 8 tests passing in 79ms.
- **Web Worker (`src/workers/catalogSearch.worker.ts`)**:
  * ESM Web Worker running search off-thread to prevent any UI frame drops (120 FPS target).
- **Fast Search Facade (`src/services/fastItemSearchEngine.ts`) & Hook (`src/hooks/useCatalogSearchWorker.ts`)**:
  * Ready-to-use search engine with fallback in memory and sub-2ms response.
  * `getTop100Pareto()` for instant empty-query display.
- **Virtualization Algorithm (`src/hooks/useVirtualGrid.ts`)**:
  * Pure mathematical headless windowing: `calculateVirtualGrid()`. Calculates `totalHeight`, `startRow`, `endRow`, and `virtualItems` with O(1) DOM nodes.

### 1.5 UI Design Tokens & Accessibility
- **Tailwind Config (`tailwind.config.js`)**:
  * Extends semantic CSS variables: `primary`, `accent`, `dark`, `border`, `background`, `card`.
  * Fonts: `font-sans: ['Inter', 'system-ui']`, `font-mono: ['JetBrains Mono', 'monospace']`.
- **Canonic Design Tokens (`src/index.css` & `.agents/skills/erp-pos-design-tokens/SKILL.md`)**:
  * **WCAG 2.2 AA+ Contrast (Light Mode)**:
    - App Background: `#f8fafc` (`slate-50`, 18.1:1 AAA).
    - Table / Card Surface: `#ffffff` (`white`, 18.5:1 AAA).
    - Mandatory Input Background: `#ffffff` with `1.5px solid #cbd5e1` (`slate-300`).
    - Text Primary: `#0f172a` (`slate-900`, 18.5:1 AAA) for titles, amounts, totals, SKUs.
    - Text Secondary: `#334155` (`slate-700`, 9.5:1 AAA) for labels and headers.
    - Status Semaphores: Emerald `#059669` (success/in-stock), Sky `#0284c7` (B2B/cold), Amber `#d97706` (low stock/draft), Red `#dc2626` (out of stock/void).
  * **Dark Glassmorphism V8 (`pezcaderia-glass`)**:
    - Background `#070A10`, card `rgba(17, 24, 39, 0.85)`, borders `rgba(255, 255, 255, 0.12)`, text `#F8FAFC`.
  * **Touch & Keyboard Ergonomics ("Regla de los 12 Años")**:
    - Minimum interactive target: 44px (height / width).
    - Monospace figures (`font-mono`, `tabular-nums`) for price and quantity alignment.
    - Strict prohibition of product images in table view to maximize contrast, speed, and vertical density.

---

## 2. Logic Chain

1. **Isolation of Existing POS (Zero Regression Risk)**:
   - *Observation*: `POSView.tsx` is 3,681 lines with heavy coupling to cash drawers, physical scales, digital channels, and B2B consolidation. It is actively used and tested.
   - *Logic*: Attempting to refactor or inject table-style modes directly into `POSView.tsx` creates high regression risk for existing POS operations.
   - *Conclusion*: A new dedicated component (e.g. `src/views/pos/CounterPosView.tsx`) must be created. The existing `POSView.tsx` file must not be modified in its internal logic.
2. **Clean Route Registration**:
   - *Observation*: `AppRoute.ts` uses enum `AppRouteId`, `APP_ROUTES_METADATA`, and `COMMERCIAL_ROUTES`. `App.tsx` has `VALID_ROUTES` and a `switch(currentView)` in `renderView()`. `layoutModes.ts` manages fixed transactional views.
   - *Logic*: Adding `AppRouteId.COUNTER_POS = 'mostrador'` to `AppRoute.ts`, adding `'mostrador'` to `VALID_ROUTES`, mapping it in `renderView()`, and adding it to `TRANSACTIONAL_FIXED_VIEWS` allows both `/ventas/pos` and `/mostrador` (or `#/mostrador`) to coexist with zero side effects.
3. **Massive Scale (10,000 Products)**:
   - *Observation*: The repository already contains `SearchEngineCore` (inverted index + fuzzy search) and `catalogSearch.worker.ts`, achieving 79ms for 8 comprehensive tests, plus `useVirtualGrid` for O(1) DOM rendering.
   - *Logic*: The table view does not render images; rendering 10,000 rows in plain DOM would crash the browser, but using virtual list rendering with `calculateVirtualGrid` (or single-column row virtualization) renders only 15–25 visible rows, keeping the main thread running at 60–120 FPS.
   - *Conclusion*: The new view should leverage `SearchEngineCore` (or `FastItemSearchEngine`) for instant sub-10ms search and virtualized row rendering.
4. **Keyboard-First Workflow & Action Header**:
   - *Observation*: Requirement R1 and R4 require single-line top bar, fast item scanning header (SKU -> Variable -> Qty -> Price -> Add), and full keyboard navigation (F2, F6, F8, F10, Arrows, Enter, Tab).
   - *Logic*: By placing a focused ref chain on the fast entry bar (Barcode input -> Quantity input -> Add button) and attaching `usePOSKeyboardShortcuts` or dedicated keydown listeners, an operator can execute a complete sale in seconds without ever touching a mouse.
5. **Multi-Seller Pre-Sale Derivation (`PRE-YYYY-XXXXX`)**:
   - *Observation*: `prefacturaService.ts` and `useMultiVendorPosStore.ts` already implement pre-sale generation with consecutive format `PRE-${year}-${String(this.consecutivoCount).padStart(5, '0')}` and queue them for central cashier collection (`useCashierKanbanStore`).
   - *Logic*: The new Counter POS view can directly call `useMultiVendorPosStore.getState().emitirPreventaActual()` or `prefacturaService.emitirPrefactura()` when F2 is pressed, seamlessly integrating into the existing single cashier box workflow.

---

## 3. Caveats

- **Supabase Query Pagination**: In `SupabaseDataService.ts:11-19`, `getAll` queries `.select('*')` without explicit pagination. By default, Supabase/PostgREST sets a max row limit (typically 1,000 rows per request) unless range headers or batch fetching (`.range(0, 9999)`) are configured. For a live catalog of 10,000 products, the Supabase query service must fetch with `.range()` pagination or load via IndexedDB/cache.
- **Physical Scale (Balanza Digital)**: The existing POS supports digital scales via Web Serial API (`BalanzaButton.tsx`). The new table counter view focuses on rapid scanning and manual weight entry (quantity field default 1 or decimal Kg) without rendering balance modals by default unless requested.
- **Test Mock Inconsistency in Unrelated Test**: Running `tsc --noEmit` revealed that `src/tests/challengerMultivendorCajaUnicaFlow.test.tsx` has mock type discrepancies (`totalDescuento` vs `descuento`). The production application code itself is cleanly typed.

---

## 4. Conclusion & Actionable Implementation Recommendations

1. **Architecture Blueprint for Implementers**:
   - Create new view: `src/views/pos/CounterPosView.tsx`.
   - Register route in `src/routes/AppRoute.ts`:
     * Add `AppRouteId.COUNTER_POS = 'mostrador'`.
     * Add metadata with `path: '/mostrador'` (or `'/pos-tabla'`), domain `RouteDomain.COMMERCIAL`, `allowedRoles: ['admin', 'vendedor']`.
     * Add to `COMMERCIAL_ROUTES`.
   - Update `src/components/layout/layoutModes.ts`:
     * Add `AppRouteId.COUNTER_POS` to `TRANSACTIONAL_FIXED_VIEWS`.
   - Update `src/App.tsx`:
     * Add `'mostrador'` to `VALID_ROUTES`.
     * In `renderView()`, add `case 'mostrador': return <CounterPosView />;`.
     * Existing `case 'pos': return <POSView ... />;` remains 100% untouched.
   - Add sidebar entry in `src/components/layout/EnterpriseSidebar.tsx` under `MENU`:
     * `{ key: 'mostrador', label: 'Venta Mostrador', icon: Store, roles: ['admin', 'vendedor'], testId: 'nav-mostrador' }`.
2. **Component Architecture for `CounterPosView`**:
   - **Zone 1: Condensed Top Context Bar (Single Line)**: Active advisor badge + fast switch, quick customer search (Cédula/NIT/Nombre), active warehouse, shift badge, shortcut hints.
   - **Zone 2: Fast Item Entry Header**:
     * SKU / Barcode input (`ref={barcodeInputRef}`, autofocus, scanning listener).
     * Price/Tier dropdown or variable display (Detal, Restaurante, Mayorista).
     * Quantity input (default 1, handles decimals for Kg).
     * Unit price display.
     * "+ Agregar" button (`Enter` key or click).
   - **Zone 3: Main Body Split**:
     * Left Panel / Drawer (optional toggle with F8): Virtualized fast product search catalog without images.
     * Center / Full Panel: "Tu Carrito de Compras" table with columns: Line #, SKU, Producto, Cantidad (+/- / input), Precio Unitario, Total Línea, Acciones (Eliminar).
   - **Zone 4: Compact Financial Footer & Action Bar**:
     * Subtotal, Descuento, IVA, Total General prominente en negrita (`text-xl font-black font-mono`).
     * Action buttons:
       - `F2 Comanda / Preventa` (emits `PRE-YYYY-XXXXX` for single cashier collection).
       - `F6 Suspender` (saves local draft).
       - `F8 Búsqueda Masiva` (toggles product finder).
       - `F10 Cobrar` (opens quick payment drawer if user has cashier permission).
       - `Vaciar Carrito` / `Escape`.
3. **Performance & Virtualization**:
   - Use `FastItemSearchEngine` / `SearchEngineCore` with in-memory Trie/inverted index.
   - Virtualize table rows when items exceed viewport using `useVirtualGrid` or dedicated row windowing.

---

## 5. Verification Method

To independently verify all findings and confirm zero regression during subsequent implementation:

1. **Verify Route Integrity and TypeScript Compilation**:
   ```powershell
   npx tsc --noEmit
   ```
2. **Verify Existing POS & Multi-Vendor Test Suites Pass**:
   ```powershell
   npx vitest run src/tests/asesorMostradorSinCobro.test.tsx
   npx vitest run src/tests/prefacturaService.test.ts
   npx vitest run src/tests/searchEngineCore.test.ts
   npx vitest run src/tests/usePOSCart.test.ts
   ```
3. **Verify Benchmark Execution for Massive Catalogs**:
   ```powershell
   npm run benchmark:pos
   ```
4. **Code Inspection**:
   - Verify `src/routes/AppRoute.ts` lines 20–55 and 237–265 to inspect existing route definitions.
   - Verify `src/App.tsx` lines 1387–1464 to inspect view switching logic.
   - Verify `src/views/POSView.tsx` to confirm no modifications were made to the original POS view.
5. **Invalidation Conditions**:
   - If the new view alters any code inside `src/views/POSView.tsx`, the survey specification is violated.
   - If search latency on 10,000 items exceeds 10ms, the worker/index strategy must be re-calibrated.
