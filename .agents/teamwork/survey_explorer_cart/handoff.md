# Handoff Report: Survey of Cart Panel, LineaVentaRow, and Ergonomics

**Author**: `survey_explorer_cart`  
**Recipient**: `ba45cc1d-c8b5-4eca-a8a6-e3a849f3a0b7` (Parent / Orchestrator)  
**Date**: 2026-11-07  
**Mission**: Investigation of Cart Panel (`CartPanel.tsx`), Line items (`LineaVentaRow.tsx`), customer selector, secondary operational actions, and ergonomic spacing in MaestroPescaderia ERP.

---

## 1. Observation

### 1.1 Reference Images Inspection

1. **Current Saturated State (`media_1794075195584_b45d7bb3.png`)**:
   - **Header Saturation**:
     - macOS window decoration dots (red, yellow, green) + "CARRITO DE VENTAS" uppercase title + "1 ítem" badge in `GlassCard` header (~44px height).
     - Subheader (`pos-cart-header`): Full customer pill button `✓ Consumidor Final... ✕` alongside a cluster of 3 action buttons: `Cerrar Turno` (rose/danger), `⏸ En Espera F6` (indigo), `📦 Borradores 2` (amber badge) (~42px height).
   - **Multicliente / Parked Orders Clutter**:
     - `ParkedOrdersBar` renders 2 full horizontal rows:
       - Row 1: `⏸ Ventas en Espera & Multicliente 2` with `+ Suspender & Nueva Venta` button.
       - Row 2: Horizontal tab list: `🛒 Venta Activa 1 items ($62.000)` and `⏸ PRE-102 (Santiago...) $160.000 01:08` (~56px height).
   - **Crushed Line-Item Container (~40px)**:
     - The scrollable list of sale items (`pos-cart-items-list`) is compressed into a narrow slit of approximately 40px to 60px height.
   - **Visual Artifacts & Contrast Violation**:
     - Inside this tiny slit, a single line item is rendered with a stark, blinding **solid white background box** (`#ffffff`) clashing directly against the dark glass container (`bg-slate-900/85`).
     - Text is truncated and overlapped: `$62.000 ($62.0... - 1 + X` with visual clipping.
   - **Footer Overload (~170px)**:
     - Row 1: `Sub: $62.000`, `+ Descuento F4`.
     - Row 2: Prominent `TOTAL 1 ítem` bar with huge `$62.000` text in emerald font.
     - Row 3: "PUESTO DE MOSTRADOR" block containing: status badge `Cobro en Ventanilla`, `+ Notas Corte` (with scissor icon), and `Vaciar` (trash icon).
     - Row 4: Oversized gradient button `EMITIR PREVENTA / COMANDA (F6)` (or `⚡ COBRAR / LIQUIDAR F2 Enter` in cashier mode).

2. **Benchmark Mature SaaS POS Design (`media_1794075246319_e3c57ab1.png`)**:
   - **High-Contrast Light Mode Layout**:
     - Backgrounds: Clean, high-contrast, professional SaaS palette (`slate-50` app background, `white` cards, `emerald-600` primary actions) strictly adhering to `erp-pos-design-tokens`.
   - **Cart Header**:
     - Full-width, single-row compact Customer Selector: `👤 CONSUMIDOR FINAL` with discrete utility icon controls `[+]` (add/search), `[⚙]` (client info/settings), and `[✕]` / `[🗑]` (clear client). Height: ~36-40px.
   - **Spacious Line-Item Body**:
     - Takes **75% to 80% of the entire vertical height** of the cart column.
     - Clean, spacious line rows with readable titles, quantities, unit prices, and subtotals.
   - **Uncluttered Footer**:
     - Minimalist summary.
     - Primary button: Solid green full-width button `Vender` with current total `$0,00` right-aligned.
     - Secondary button: Clean outlined button `Guardar` (for saving draft/holding sale).
   - **Zero Secondary Clutter**:
     - "Cerrar turno", "Ventas en espera", "Borradores", and "Multicliente" tabs are **not** crowding the cart panel.

---

### 1.2 Direct Codebase Findings & Verbatim Errors

1. **Syntax Defect in `CartPanel.tsx`**:
   - **Path**: `src/views/pos/components/CartPanel.tsx:1`
   - **Verbatim Code**:
     ```tsx
     1: usa harneimport React, { useState, useEffect } from 'react';
     2: import { Check, X, Plus, PauseCircle, Clock, Trash2, Archive, Scissors, FileText } from 'lucide-react';
     ```
   - **Verbatim esbuild Error**:
     ```
     C:/Users/usuario/OneDrive/Documentos/Aplicaciones Pezca/MaestroPescaderia/src/views/pos/components/CartPanel.tsx:1:4: ERROR: Expected ";" but found "harneimport"
     1 | usa harneimport React, { useState, useEffect } from 'react';
       |     ^
     ```
   - *Note*: An errant string `usa harne` was inadvertently prepended to line 1, causing Vite/esbuild to fail transform on any test importing `CartPanel.tsx`.

2. **Vertical Space Cannibalization in `CartPanel.tsx`**:
   - **File**: `src/views/pos/components/CartPanel.tsx`
   - **Lines 572-580**: Wrapped in `GlassCard` with `showMacControls={true}`:
     ```tsx
     <GlassCard
       data-testid="cart-glass-panel"
       showMacControls={true}
       title="CARRITO DE VENTAS"
       badge={`${formattedTotalItems} ${formattedTotalItems === 1 ? 'ítem' : 'ítems'}`}
       badgeVariant="cyan"
       onMinimize={() => setIsCompactMode((prev) => !prev)}
       className="pos-cart-panel flex flex-col h-full min-h-0 overflow-hidden pr-1 p-2 sm:p-2.5 select-none"
     >
     ```
     `GlassCard.tsx` lines 64-89 adds an internal header with `pb-3.5 mb-4 border-b border-white/10` (~45px height).
   - **Lines 582-671**: `pos-cart-header` adds customer button + `Cerrar Turno` button + `En Espera` button + `Borradores` badge button (~42px height).
   - **Lines 674-684**: `ParkedOrdersBar` conditionally mounted whenever `drafts.length > 0`:
     ```tsx
     {drafts.length > 0 && (
       <ParkedOrdersBar
         drafts={drafts}
         activeDraftId={activeDraftId}
         currentItemsCount={lineas.length}
         currentTotal={totales.totalFinal}
         onSelectDraft={handleSelectDraftDirectly}
         onDeleteDraft={handleDeleteDraftDirectly}
         onNewParkedSale={onGuardarBorrador}
       />
     )}
     ```
     `ParkedOrdersBar.tsx` renders a flex container with a header row ("Ventas en Espera & Multicliente" + "Suspender & Nueva Venta") plus a tab row with active & parked drafts (~56px height).
   - **Lines 730-870**: `pos-cart-footer`:
     - Resumen compacto: Subtotal, Base, IVA, Descuento F4 (~28px)
     - Total Prominente box: `TOTAL` badge and `$totales.totalFinal` (~48px)
     - Mostrador box (if `isMostradorAuto`): Status + `+ Notas Corte` + `Vaciar` (~32px)
     - Large Action Button: `EMITIR PREVENTA / COMANDA (F6)` (~48px)
     - Gaps and padding: ~20px
     - *Total Footer Height*: ~176px.
   - **Accumulated Chrome Height**:
     - $45\text{px} (\text{GlassCard}) + 42\text{px} (\text{Header}) + 56\text{px} (\text{ParkedBar}) + 176\text{px} (\text{Footer}) + 20\text{px} (\text{Paddings}) = \mathbf{339\text{px}}$ of fixed chrome!
   - In standard viewport displays (e.g. 768px laptop or touch terminal, minus ~148px for POS top bar, KPI bar, and queue ticker in `POSView.tsx`), only ~200-250px remains for the cart body. When drafts are present, the item list is crushed to ~40-60px.

3. **Origin of White Box Artifacts (`LineaVentaRow.tsx`)**:
   - **File**: `src/views/pos/components/LineaVentaRow.tsx`
   - **Line 159**:
     ```tsx
     className="cart-item-row group relative flex items-center justify-between gap-1 sm:gap-2 px-2 py-1.5 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 hover:bg-slate-50/90 dark:hover:bg-slate-800/80 transition-colors rounded-lg min-h-[58px] max-h-[64px]"
     ```
   - **Line 322**:
     ```tsx
     className="w-12 sm:w-14 h-8 sm:h-9 min-h-[34px] touch:min-h-[48px] text-center font-mono font-black text-xs sm:text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 rounded-lg outline-none tabular-nums shadow-2xs"
     ```
   - **Observation**:
     - `LineaVentaRow` relies on Tailwind `dark:` variants (`bg-white dark:bg-slate-900/60`, `bg-white dark:bg-slate-800`).
     - However, `GlassCard` hardcodes `bg-slate-900/85 backdrop-blur-2xl text-slate-100` regardless of the root theme!
     - When the application runs in default/light mode (or when `<html class="dark">` is not present), Tailwind renders the base class: `bg-white` and `bg-slate-100`.
     - This injects a blinding `#ffffff` background block directly into a dark glass panel, generating the ugly white rectangular artifact observed in `media_1794075195584_b45d7bb3.png`.

4. **LineaVentaRow Internal Crowding**:
   - **File**: `src/views/pos/components/LineaVentaRow.tsx`
   - **Lines 159-354**: Constrained to `min-h-[58px] max-h-[64px]`.
   - In a 380px wide sidebar:
     - Right Column (Controls):
       - `BalanzaButton` (compact ~34px) + `btn-disminuir-cantidad` (34-48px) + `input-cantidad` (48-56px) + `btn-aumentar-cantidad` (34-48px) + `btn-eliminar-linea` (34-48px).
       - Total width of right column: **~170px**.
     - Left Column (Product Info):
       - Squeezed into **~190px - 200px**.
       - Must display: Product Name, KG/UND badge, Manual badge, Discount badge, Subtotal in bold emerald, Editable price button with Edit3 icon, Stock availability badge with warning, Modified price badge, Reset link, Historical price button (`💡 Hist: $...`), and Reset discount button!
     - Any product with a moderate title (e.g., "Mojarra Roja Entera") or an active badge causes text truncation, badge overlap, or vertical overflow clipping.

5. **Customer Selector Implementation in `POSView.tsx` & `CartPanel.tsx`**:
   - **File**: `src/views/POSView.tsx:653-730` (`handleAgregarCliente`), `548-553` (`defaultClient`), `2816-2817`:
     - `onSelectCliente` invokes `handleAgregarCliente` (opens SweetAlert2 modal to search or create client).
     - `onClearCliente` resets client to `defaultClient` ("Consumidor Final").
   - **File**: `src/views/pos/components/CartPanel.tsx:586-617`:
     - Customer button is crammed into `pos-cart-header` alongside three other operational buttons ("Cerrar Turno", "En Espera", "Borradores").

6. **Secondary Operations Currently Embedded in `CartPanel.tsx`**:
   - `Cerrar Turno` (`CartPanel.tsx:621-630`): Calls `onCerrarTurnoClick` -> opens `showArqueoModal(true)`. (Redundant: `POSView.tsx:2546-2550` already has this in the hamburger menu!).
   - `En Espera` (`CartPanel.tsx:633-645`): Calls `onGuardarBorrador()` -> puts sale on hold.
   - `Borradores` (`CartPanel.tsx:648-670`): Calls `handleOpenBorradores()` -> SweetAlert2 modal listing drafts.
   - `ParkedOrdersBar` (`CartPanel.tsx:674-684`): In-line visual tabs for suspended sales.
   - `+ Notas Corte` (`CartPanel.tsx:791-811`): Opens `DespachoNotasModal`.
   - `Vaciar` (`CartPanel.tsx:813-824`): Calls `onLimpiarCarrito()`.

---

## 2. Logic Chain

```
[Observation 1.1: Problem Screenshot]
  ├── Visual slit ~40px for line items
  ├── Blinding white artifact box inside dark container
  └── Stacked buttons & bars taking over 70% of panel height
         │
         ▼
[Observation 1.2: Code Structure & Line Counts]
  ├── CartPanel.tsx stacks 5 distinct chrome layers:
  │     1. GlassCard Header (Mac controls + title + badge) [~45px]
  │     2. pos-cart-header (Cliente + Cerrar Turno + En Espera + Borradores) [~42px]
  │     3. ParkedOrdersBar (Multicliente title + button + horizontal tabs) [~56px]
  │     4. pos-cart-footer (Subtotal + Total + Mostrador box + Giant action) [~176px]
  │     5. Padding & container margins [~20px]
  │     => Fixed chrome = ~339px
  └── Viewport height in standard POS displays (768px - 148px top bar) = ~620px
         │
         ▼
[Logic Step 1: Root Cause of Line-Item Compression]
  When fixed chrome consumes ~340px in a 400-500px flex container, flex-1 min-h-0
  for pos-cart-items-list is mathematically crushed down to ~40-60px.
  The line-item container is starved of vertical space by secondary operational chrome.
         │
         ▼
[Observation 1.2.3: CSS Theme Conflict]
  ├── GlassCard hardcodes `bg-slate-900/85` (always dark)
  └── LineaVentaRow has `bg-white dark:bg-slate-900/60` (relies on .dark class)
         │
         ▼
[Logic Step 2: Root Cause of White Artifacts]
  When the app is rendered without `.dark` on `<html>` (or in Light Mode as mandated by
  erp-pos-design-tokens), LineaVentaRow renders pure white (`bg-white`) inside a dark
  card (`bg-slate-900/85`), producing an unsightly white rectangular block artifact.
         │
         ▼
[Observation 1.1.2: SaaS POS Benchmark]
  ├── Customer selector is a single compact top bar (36-40px)
  ├── Secondary operations (Turno, Borradores, Multicliente) are NOT in the cart column
  ├── Line-item container spans 75-80% of vertical height
  └── Footer contains only direct action buttons: "Vender" ($XX.XXX) and "Guardar"
         │
         ▼
[Logic Step 3: Synthesis & Redesign Strategy]
  To achieve mature SaaS POS ergonomics matching the benchmark:
  1. Remove Cerrar Turno, ParkedOrdersBar, and Mostrador box from CartPanel.
  2. Relocate customer selector to a dedicated compact top bar (38px).
  3. Relocate secondary actions to a compact header dropdown/popover and top bar.
  4. Redesign LineaVentaRow into a spacious, high-contrast 2-tier row matching erp-pos-design-tokens.
  5. Modernize footer with primary "Vender" ($total) and secondary "Guardar" buttons.
```

---

## 3. Caveats

1. **Test Suite Compatibility**:
   - Existing unit tests (`posDarkGlassmorphismV8.test.tsx`, `posCartPanelErgonomics.test.tsx`, `posCartRowErgonomics.test.tsx`, `posCart12ItemsScroll.test.tsx`, `posCartRedesignAndCashierMode.test.tsx`) enforce specific `data-testid` attributes:
     - `data-testid="cart-glass-panel"`
     - `data-testid="cart-items-container"`
     - `data-testid="cart-item-row-${linea.productoId}"`
     - `data-testid="cart-item-name-${linea.productoId}"`
     - `data-testid="cart-item-price-${linea.productoId}"`
     - `data-testid="input-cantidad"`, `btn-aumentar-cantidad`, `btn-disminuir-cantidad`, `btn-eliminar-linea`, `btn-editar-precio`
     - `data-testid="btn-cobrar"` (or `btn-emitir-preventa-mostrador`)
   - Any refactoring must preserve these `data-testid` contracts and required class hooks (`pos-cart-panel`, `pos-cart-items-list`, `pos-cart-footer`, `cart-item-row`, `cart-item-name`, `cart-item-price`, `shrink-0`, `mt-auto`, `flex-1`, `min-h-0`, `overflow-y-auto`).

2. **Read-Only Scope**:
   - As an explorer subagent, no source code was directly modified during this survey.
   - The verbatim syntax defect at `CartPanel.tsx:1` (`usa harneimport React...`) was discovered and documented, but left for the implementer agent to remediate cleanly.

3. **Multi-Role Context (Vendedor Mostrador vs Cajero Principal)**:
   - In MaestroPescaderia ERP, the POS serves two operational profiles:
     - **Asesor de Mostrador** (`isMostradorAuto`): Generates a comanda/preventa to send to the cashier or dispatch window.
     - **Cajero Principal**: Collects payment directly via `PaymentPanel` (modal drawer with cash denominations, datafono, etc.).
   - The primary action button dynamically accommodates both modes ("Emitir Preventa" vs "Vender / Cobrar") while maintaining identical ergonomic height and placement.

---

## 4. Conclusion & Recommendations

### 4.1 Root Cause Summary

| Issue | Root Cause | Impact |
| :--- | :--- | :--- |
| **Line-item slit (~40px)** | 5 stacked chrome layers (`GlassCard` header, `pos-cart-header`, `ParkedOrdersBar`, footer summary, mostrador box, giant button) eating ~340px of fixed vertical height. | Only 1 line item can barely be seen; operators cannot review orders without heavy scrolling in a microscopic window. |
| **White box artifact** | `LineaVentaRow.tsx:159,322` hardcodes `bg-white dark:bg-slate-900/60` and `bg-white dark:bg-slate-800`. When rendered in light mode, pure `#ffffff` is injected into dark `bg-slate-900/85`. | Horrendous visual clash, clipped borders, unreadable text. |
| **Syntax defect** | Errant `usa harne` prepended to `CartPanel.tsx:1`. | Causes esbuild/vite transform failure during test runs. |
| **Crowded LineaVentaRow** | 5 buttons on the right (~170px) leave only ~190px on the left for title, unit, badges, price, stock, and discount controls within a 58-64px height. | Truncation, overlapping badges, cramped touch targets. |
| **Secondary action clutter** | "Cerrar turno", "En espera", "Borradores", and "Multicliente" tabs all wedged into the cart panel header and body. | Cluttered interface, high cognitive load, risk of accidental cashier shift closure during scanning. |

---

### 4.2 Architectural Redesign Plan

#### Component 1: Clean Cart Panel Layout (`CartPanel.tsx`)

```
┌─────────────────────────────────────────────────────────┐
│ 👤 CONSUMIDOR FINAL (22222222)           [🔍] [⚙] [✕] [⋮]│ ◄── Compact Top Bar (38px)
├─────────────────────────────────────────────────────────┤
│                                                         │
│  LINEA VENTA ITEMS (75% - 80% Vertical Height)          │
│  - flex-1 min-h-0 overflow-y-auto overscroll-contain    │
│  - Clean cards/rows adhering to erp-pos-design-tokens   │
│  - Generous spacing, smooth touch scrolling             │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Salmón Noruego Premium       [⚖️ KG]         [✕] │  │
│  │ [-] [ 1.50 ] [+]  • $45.000/kg        $67.500     │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Camarón Tigre 16/20          [📦 UND]        [✕] │  │
│  │ [-] [ 2.00 ] [+]  • $38.000/und        $76.000    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
├─────────────────────────────────────────────────────────┤ ◄── Minimalist Footer (~105px)
│ Subtotal: $143.500   IVA: $0   [+ Descuento F4]         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │  ⚡ VENDER / COBRAR                      $143.500   │ │ ◄── Primary Button (48-56px)
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │  💾 Guardar (En Espera F6)                          │ │ ◄── Secondary Button (44px)
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

1. **Remove Stacked Headers**:
   - Remove redundant `GlassCard` inner title/badge header.
   - Remove `pos-cart-header` row.
   - Replace with a single, elegant Customer Bar at the very top:
     - Left: Avatar icon `👤` + Customer Name (`cliente.nombre`) + identification.
     - Right:
       - `[🔍]` Search/Select Customer (`onSelectCliente`).
       - `[✕]` Clear/Reset Customer to Consumidor Final (`onClearCliente`, shown only if a non-default client is active).
       - `[⋮]` Actions Popover (housing secondary options: Notas de corte, Vaciar carrito, etc.).
       - If `drafts.length > 0`: a subtle pill badge `⏸ ${drafts.length}` that opens the drafts modal on click without pushing down content.

2. **Relocate Secondary Operations**:
   - **`Cerrar Turno`**: Remove completely from `CartPanel`. It already exists in `POSView.tsx` (top bar and hamburger menu `POSView.tsx:2546-2550`).
   - **`ParkedOrdersBar`**: Remove the in-line horizontal bar from the cart flow. Instead, provide an off-canvas drawer or clean modal (`handleOpenBorradores`) accessible via a badge button `⏸ ${drafts.length} en espera` in the top action bar or cart header.
   - **`En Espera` (F6)**: Becomes the clean secondary button `Guardar` in the cart footer.
   - **`+ Notas Corte`**: Placed inside the `[⋮]` actions menu or as a clean icon button next to customer info.
   - **`Vaciar Carrito`**: Available in the `[⋮]` menu or as a small discreet trash button.

3. **Modernize `LineaVentaRow.tsx`**:
   - Eliminate theme clash:
     - Adopt consistent high-contrast styling based on `erp-pos-design-tokens`:
       - Background: `#ffffff` (`bg-white` in light mode, subtle glass in dark mode).
       - Border: `1px solid #e2e8f0` (`border-slate-200`).
       - Text primary: `#0f172a` (`text-slate-900`).
       - Text secondary: `#334155` (`text-slate-700`).
       - Price: `#059669` (`text-emerald-600 font-mono font-black`).
   - Ergonomic 2-Row Layout:
     - **Row 1 (Header)**:
       - Product Name: Prominent, legible, bold (`text-sm font-bold text-slate-900 dark:text-white truncate`).
       - Unit Badge: Discrete pill (`⚖️ KG` or `📦 UND`).
       - Delete button: Discrete `✕` icon on the far right (`p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50`).
     - **Row 2 (Quantity & Pricing)**:
       - Left: Quantity Stepper:
         - `[-]` button (36-40px, rounded, accessible).
         - Number input (with auto-select on focus, tabular-nums).
         - `[+]` button (36-40px, rounded, accessible).
         - For KG items: `BalanzaButton` placed right beside stepper.
       - Center: Unit price (`$45.000 / kg`) with subtle edit pencil (`btn-editar-precio`).
       - Right: Subtotal in bold emerald (`$67.500`) with high visual prominence.
     - Row Height: ~64-72px, providing comfortable touch breathing room without overflowing.

4. **Cart Footer Architecture**:
   - Height: ~105-115px maximum.
   - Row 1: Compact text summary: Subtotal, Base, IVA, and `+ Descuento (F4)` button.
   - Row 2: **Primary Action Button** (`Vender` or `Emitir Preventa`):
     - Height: 48px - 56px (Regla del Niño de 12 Años).
     - Color: Solid emerald gradient (`bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg`).
     - Content: `⚡ VENDER / COBRAR` on left, `$totales.totalFinal` on right.
   - Row 3: **Secondary Action Button** (`Guardar`):
     - Height: 42px - 44px.
     - Color: Clean outlined button (`bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 font-bold`).
     - Label: `💾 Guardar (En Espera F6)`.

---

## 5. Verification Method

To verify these findings and validate the subsequent implementation:

1. **Syntax Fix Verification**:
   - Inspect `CartPanel.tsx:1` and ensure `usa harneimport` is corrected to `import`.
   - Run Vitest:
     ```powershell
     npx vitest run src/tests/posCartPanelErgonomics.test.tsx
     ```
     Verify that the transform error disappears and tests execute.

2. **Component Ergonomics & Scroll Isolation**:
   - Run the dedicated test suites:
     ```powershell
     npx vitest run src/tests/posCartRowErgonomics.test.tsx
     npx vitest run src/tests/posCart12ItemsScroll.test.tsx
     npx vitest run src/tests/posCartRedesignAndCashierMode.test.tsx
     ```
   - Ensure 100% of tests pass, verifying:
     - `pos-cart-items-list` maintains `flex-1 min-h-0 overflow-y-auto`.
     - `pos-cart-footer` maintains `shrink-0 mt-auto`.
     - Quantity stepper controls and unit price editing operate flawlessly.

3. **Visual & Touch Inspection (Chrome DevTools)**:
   - Run the development server (`npm run dev`) and inspect `http://localhost:5173`:
     - Open Console: Verify **0 errors / 0 warnings**.
     - Verify Desktop resolution (1280x800 and 1920x1080):
       - Cart items occupy full vertical height (~75-80% of panel).
       - Zero white background rectangle artifacts clashing against dark elements.
       - Customer selector is compact and uncluttered.
       - "Vender" and "Guardar" buttons are prominent and responsive.
     - Verify Mobile view (375px):
       - Tab switching to "Carrito" displays the clean, uncluttered cart layout.

4. **Invalidation Conditions**:
   - If `pos-cart-items-list` height shrinks below 300px on a standard 768px viewport with 5 items.
   - If any `data-testid` required by existing Vitest tests is removed or renamed.
   - If secondary operations ("Cerrar turno", "Borradores", "Multicliente") are inaccessible to the operator.
