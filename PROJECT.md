# Project: Optimización Ergonómica de Pantalla de Ventas POS (Multivendedor - Caja Única)

## Architecture
- **Patrón de Arquitectura**: Single Page Application en React 18, Vite, TypeScript estricto, Tailwind CSS y Supabase (`localDb` híbrido Dexie/IndexedDB).
- **Paradigma de Pantalla POS**: "Carrito Expandido + Liquidación on-Demand".
  - **Área de Lista de Carrito**: Ocupa >= 70% de la altura vertical de `CartPanel` con `flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar`, garantizando visualización espaciosa y scroll fluido para listas de 12+ ítems.
  - **Pie de Carrito Condensado**: Footer de <= 115px anclado (`shrink-0 mt-auto`) con resumen compacto (Subtotal/Descuento/IVA), Total prominente en `font-mono font-black tabular-nums text-emerald-400` y botón de acción principal de ancho completo (`[ ⚡ COBRAR / LIQUIDAR (F2) ]` o `[ ⏸ EMITIR PREVENTA (F6) ]`).
  - **Liquidación on-Demand**: `PaymentPanel` desacoplado del pie estático del carrito hacia un Slide-Over Drawer o Modal táctil rápido al presionar Cobrar o tecla `F2`, liberando 617px de interferencia visual durante el registro y verificación de productos.
  - **Reorganización de Ventas en Espera**: `ParkedOrdersBar` extraída del flujo vertical de ítems del carrito y compactada en cabecera o integrada en `PendingOrdersDrawer` con contador badge `[ Ventas en Espera (N) ]`.
  - **Fila Retail Compacta (`LineaVentaRow`)**: Altura optimizada a ~58-64px (~60px computados) con controles agrupados, mostrando nombre, cantidad/peso, precio unitario y subtotal con ratios de contraste WCAG 2.2 AA+ (>=18.5:1 texto principal) y targets táctiles >=44px/48px (Ley de Fitts).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Desacoplamiento de PaymentPanel on-Demand | Extraer el liquidador `PaymentPanel` del pie estático de `CartPanel.tsx` hacia un Drawer/Modal de cobro rápido on-demand (`[ ⚡ Cobrar ]` / F2), liberando ~617px de altura. | M1 | Survey (Exp 1, 2) |
| F2 | Footer Condensado y Total Prominente | Reducir `.pos-cart-footer` a <= 115px con totales compactos y botón principal táctil (`min-h-[48px]`), anclado con `shrink-0 mt-auto` sin recortar ítems. | M1 | Survey (Exp 1, 3) |
| F3 | Reorganización Ergonómica de ParkedOrdersBar | Reestructurar `ParkedOrdersBar` y cabecera de `CartPanel` para que no canibalicen el espacio del listado de ítems, manteniendo acceso ágil a borradores. | M1 | Survey (Exp 2) |
| F4 | Restauración Tokens Fitts POSView | Restaurar `min-h-[44px]` en botones de asesores mostrador (línea 2290) y apertura drawer de comandas (línea 2399) en `POSView.tsx`, resolviendo 2 fallos de `m2POSMultivendor.test.tsx`. | M1 | Survey (Exp 3) |
| F5 | Fila Retail Compacta (LineaVentaRow) | Optimizar `LineaVentaRow.tsx` a ~58-64px de alto con visualización clara y legible de nombre, cantidad/peso, precio unitario y subtotal sin wrapping roto. | M2 | Survey (Exp 1, 3) |
| F6 | Scroll Vertical Prioritario (12+ Ítems) | Configurar `cart-items-container` / `.pos-cart-items-list` con `flex-1 min-h-0 overflow-y-auto overscroll-contain` verificado con 12+ productos sin colapso. | M2 | Survey (Exp 1, 3) |
| F7 | Suite de Pruebas de Integración y Estrés | Pruebas automáticas Vitest verificando la visualización no colapsada con 12+ ítems, persistencia de totales y flujo multivendedor - caja única. | M2 | Survey (Exp 1, 2, 3) |
| F8 | Certificación Gate Multi-Agente | Evaluación rigurosa e independiente por 2 Reviewers, 2 Challengers y 1 Forensic Auditor (`teamwork_auditor`). | M3 | System Pattern |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Desacoplamiento de Cobro, Footer Condensado y Ergonomía de Cabecera | `CartPanel.tsx`, `ParkedOrdersBar.tsx`, `POSView.tsx` (desacople de PaymentPanel a drawer/modal on-demand, footer <= 115px, acceso ergonómico a pedidos en espera y fix de Fitts min-h-[44px]). | none | DONE (`handoff.md`, 50/50 tests passing, 0 errors tsc) |
| M2 | Fila Retail Compacta, Scroll Vertical Prioritario (12+ Ítems) y Pruebas | `LineaVentaRow.tsx`, `CartPanel.tsx`, `src/tests/posCart12ItemsScroll.test.tsx` (fila retail ~60px, datos esenciales legibles, scroll prioritario 12+ ítems, 43/43 tests Vitest y tsc verde). | M1 | DONE (`handoff.md`, 43/43 tests passing, 0 errors tsc) |
| M3 | Gate Multi-Agente & Verificación Forense Final | Auditoría independiente de código, revisión de contratos, pruebas adversariales de estrés con 20+ ítems y auditoría forense de integridad. | M1, M2 | DONE (`GATE_STATUS.md` PASS, 2 Reviewers APPROVE, 2 Challengers APPROVE, Auditor CLEAN) |

## Interface Contracts

### CartPanel ↔ Payment Checkout (On-Demand Drawer/Modal)
- **Props de Cobro on-Demand**:
  - `isPaymentDrawerOpen: boolean` (controlado internamente por estado y prop opcional).
  - `onOpenPayment: () => void` (disparado por botón `⚡ Cobrar (F2)` o tecla F2/Enter).
  - `onClosePayment: () => void` (cierre de drawer sin alterar ítems del carrito).
  - `PaymentPanel` se renderiza dentro de un Drawer deslizable o Modal con backdrop `z-50`, preservando intactos sus handlers de pago (`onProcessPayment`, `onFinalizarVenta`, `handleCobrarDirecto`).

### CartPanel ↔ Parked Orders Flow
- **Identificación de Borradores**: Almacenados en `pezca_pos_drafts_v1` (`posDraftService.ts`).
- **Trigger Ergonómico**: Cabecera de `CartPanel` muestra botón `[ ⏸ En Espera (F6) ]` y badge/botón `[ Borradores (N) ]` que alterna la visualización compacta o abre `PendingOrdersDrawer`.
- **Contrato de Restauración**: `handleLoadDraft(draftId)` carga los ítems en el carrito y actualiza el cliente y vendedor sin recargar la página.

### LineaVentaRow Props & Display Contract
- **Dimensiones**: Altura computada objetivo de `58px - 64px` (~60px verificado).
- **Datos Esenciales Visibles**:
  - `producto.nombre`: `font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate`.
  - `cantidad / peso`: `font-mono font-semibold text-xs text-slate-300` con stepper táctil (+/-) de 48px.
  - `precioUnitario`: `font-mono text-[11px] sm:text-xs text-slate-400`.
  - `subtotal / totalLinea`: `font-mono font-black text-sm text-emerald-600 dark:text-emerald-400 tabular-nums`.

## Code Layout
- `src/views/pos/components/CartPanel.tsx`: Panel principal de carrito, cabecera, lista de ítems y footer condensado.
- `src/views/pos/components/LineaVentaRow.tsx`: Componente de fila individual de ítem agregado.
- `src/views/pos/components/ParkedOrdersBar.tsx`: Barra / cinta compacta de pedidos en espera.
- `src/views/pos/components/PaymentPanel.tsx`: Componente de medios de pago y liquidación.
- `src/views/pos/components/PendingOrdersDrawer.tsx`: Cajón lateral de comandas y borradores.
- `src/views/POSView.tsx`: Vista principal de ventas POS con cabeceras y grilla responsiva.
- `src/tests/posCart12ItemsScroll.test.tsx`: Suite de pruebas de visualización con 12+ ítems, scroll y anclaje de footer.
- `src/tests/challengerPOSCartStressAdvanced.test.tsx`: Suite adversarial de estrés extremo (25 ítems, float precision).
- `src/tests/challengerMultivendorCajaUnicaFlow.test.tsx`: Suite de integración empírica de ciclo completo multivendedor - caja única.
