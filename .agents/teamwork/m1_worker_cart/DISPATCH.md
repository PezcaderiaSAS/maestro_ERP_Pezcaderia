## 2026-11-07T18:45:29Z
Read ORIGINAL_REQUEST.md at c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md.
Read PROJECT.md at c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\PROJECT.md.
Read survey reports:
- c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\survey_explorer_cart\handoff.md
- c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\survey_spec_miner_pos\handoff.md

You are m1_worker_cart.
Your mission is to implement Milestone M1: Remediación de Sintaxis y Rediseño Ergonómico de Carrito y Filas de Venta.

Exclusive Write Ownership:
- src/views/pos/components/CartPanel.tsx
- src/views/pos/components/LineaVentaRow.tsx

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Detailed Tasks:
1. Fix Syntax Error:
   In `src/views/pos/components/CartPanel.tsx:1`, replace `usa harneimport` with `import React, { useState, useEffect } from 'react';`.

2. Redesign `src/views/pos/components/LineaVentaRow.tsx`:
   - Eliminate the white rectangular artifact (`bg-white` inside dark container).
   - Use high-contrast tokens complying with `erp-pos-design-tokens` (Light Mode WCAG AA+ / SaaS standard). Clean borders, dark text, emerald subtotal (`#059669`).
   - Implement an ergonomic 2-tier row:
     - Tier 1: Product name (`data-testid="cart-item-name-${linea.productoId}"`, `.cart-item-name font-bold`, clear and legible), unit badge (`⚖️ KG` or `📦 UND`), delete button (`data-testid="btn-eliminar-linea"`, aria-label="Eliminar producto del carrito", min 48px touch target).
     - Tier 2: Quantity stepper (`data-testid="btn-disminuir-cantidad"` min-w-[48px] min-h-[48px], `data-testid="input-cantidad"` min-h-[48px], `data-testid="btn-aumentar-cantidad"` min-w-[48px] min-h-[48px]), `BalanzaButton` if KG, editable unit price button (`data-testid="btn-editar-precio"`), and subtotal in bold emerald (`data-testid="cart-item-price-${linea.productoId}"`, `.cart-item-price font-mono tabular-nums`).
   - Ensure the container maintains `data-testid="cart-item-row-${linea.productoId}"`, class `.cart-item-row`, and `min-h-[58px]`.

3. Redesign `src/views/pos/components/CartPanel.tsx`:
   - Clean up top header: Single compact customer selector bar (38px): `👤 CONSUMIDOR FINAL` with search/select (`onSelectCliente`), clear (`onClearCliente`), and actions popover/menu `[⋮]`.
   - Items list container: `data-testid="cart-items-container"`, class `pos-cart-items-list flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1 space-y-1 custom-scrollbar`. Must take 75% to 80% of vertical height without being squashed!
   - Footer: `pos-cart-footer shrink-0 mt-auto` (must NOT have `sticky` nor `bottom-0`).
     - Compact summary (subtotal, taxes, discount F4).
     - Primary action button: `data-testid="btn-cobrar"` (or comanda button if mostrador), emerald styling, `min-h-[48px]` and `lg:min-h-[56px]`, displaying `Vender` / `Cobrar` on the left and `$totales.totalFinal` on the right.
     - Secondary action button: Clean outline button "Guardar" (En Espera F6) invoking `onGuardarBorrador`.
   - Parked orders / Drafts handling: Ensure parked orders do not push down or compress the item list. If drafts exist, display a subtle badge `⏸ N en espera` that triggers the drafts view on click without eating vertical space.

4. Run tests to verify your implementation:
   - `npx vitest run src/tests/posCartPanelErgonomics.test.tsx`
   - `npx vitest run src/tests/posCartRowErgonomics.test.tsx`
   - `npx vitest run src/tests/posCart12ItemsScroll.test.tsx`
   - `npx vitest run src/tests/posCartRedesignAndCashierMode.test.tsx`
   - `npx vitest run src/tests/usePOSCart.test.ts`
   Ensure all tests pass. If any test fails, fix your code and re-test.
