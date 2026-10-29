# Project: Auditoría, Ajuste y Verificación de Integridad del Frontend (Pantallas Prioritarias)

## Architecture
- **Patrón de Arquitectura**: Single Page Application en React 18, Vite, TypeScript estricto, Tailwind CSS y Supabase (`localDb` híbrido).
- **Enfoque de Diseño**: Light Mode canónico (`pezcaderia-light`) WCAG 2.2 AA+ (ratios 4.5:1 y 7:1) junto con soporte Dark Glassmorphism, ergonomía táctil (Leyes de Fitts, Hick, Doherty, Miller, Jakob) y maquetación adaptativa estricta sin desbordamiento horizontal (`scrollWidth <= clientWidth`) en móvil (375px) y escritorio (1366x768 / 1920x1080).
- **Estrategia Dual Track**:
  - **Implementation Track**: Corrección modular del frontend dividida en 4 hitos constructivos (M1: Tokens y Shell, M2: POS Táctil, M3: Caja y Kanban, M4: Catálogos de Clientes y Productos) culminando en el hito final M5 (100% E2E Pass + Adversarial Coverage).
  - **E2E Testing Track**: Construcción independiente de la suite E2E en Playwright y Google Harness² (Tiers 1-4) derivada de los requerimientos de usuario, emitiendo `TEST_READY.md`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Tokens de Diseño y Light Mode | Implementación de tema `pezcaderia-light` en CSS y store, garantizando contraste WCAG AA+ (4.5:1 / 7:1). | M1 | Survey (Exp 2) |
| F2 | Ergonomía Global de Botones | Ajuste de tamaños en `Button.tsx` para garantizar que botones interactivos cumplan área mínima >=44x44px (Fitts). | M1 | Survey (Exp 2) |
| F3 | Layout Shell & Topbar | Optimización de `EnterpriseTopbar.tsx` y contenedores raíz para evitar desbordamiento o recorte de controles en 375px. | M1 | Survey (Exp 1) |
| F4 | SweetAlert2 Responsivo Global | Reemplazo de anchos fijos (550px) en modales de alerta por anchos porcentuales responsivos (`max-w-[92vw]`). | M1 | Survey (Exp 1, 2) |
| F5 | POS Mobile Switcher (Catálogo/Carrito) | Conmutador de pestaña en `< lg` (`[Catálogo]` / `[Carrito]`) para evitar apilamiento ciego en móvil. | M2 | Survey (Exp 1) |
| F6 | POS Asesores de Mostrador Fitts | Ampliación de botones de vendedores a `min-h-[44px]` con etiquetas claras en barra de mostrador. | M2 | Survey (Exp 2) |
| F7 | POS Badges y Botones de Acción Fitts | Ajuste de `TerminalVendorBadge.tsx`, `+ Split` en pagos y botones de barra de herramientas a >=44px. | M2 | Survey (Exp 2) |
| F8 | POS Barcode & Búsqueda Wrap | Flex-wrap en formulario de búsqueda y escaneo (`ProductSearchPanel.tsx`) para eliminar desbordamiento a 375px. | M2 | Survey (Exp 1, 2) |
| F9 | POS Parked Orders Bar Wrap | Ajuste de `ParkedOrdersBar.tsx` con wrap y tipografía fluida para evitar overflow lateral. | M2 | Survey (Exp 1) |
| F10 | POS Doherty & Miller Optimization | Debounce en búsqueda de productos y simplificación de tarjetas POS (ocultar desglose de 3 bodegas por defecto). | M2 | Survey (Exp 2) |
| F11 | Caja Única Selectores Header Wrap | Ajuste responsivo de selectores de Bodega y Caja en `CashFlowView.tsx` (elimina blowout de 340px > 323px). | M3 | Survey (Exp 1) |
| F12 | Caja Movimientos Responsive | Tabla de movimientos con envoltura responsiva o vista en tarjeta compacta para móviles sin scroll roto. | M3 | Survey (Exp 1) |
| F13 | Caja Filtro Tabs Fitts | Pestañas de filtrado de movimientos (`Todo`, `Ventas`, `Gastos`) aumentadas a `min-h-[44px]`. | M3 | Survey (Exp 2) |
| F14 | Caja Memoización de Ordenamiento | Erradicación de `.sort()` mutante dentro de JSX en `CashFlowView.tsx`, usando `useMemo`. | M3 | Survey (Exp 2) |
| F15 | Caja Única Integración Kanban | Integración de vista / pestaña de `CashierKanbanView` en Caja para recaudo ágil de preventas (F9). | M3 | Survey (Exp 1) |
| F16 | Kanban Chips y Cobro Fitts | Chips de asesor y botón `btn-iniciar-cobro-*` aumentados a `min-h-[44px]` en `CashierKanbanView.tsx`. | M3 | Survey (Exp 2) |
| F17 | Kanban Search Input & Debounce | Corrección de conflicto `min-h-[48px] h-10` y debouncing en buscador de comandas. | M3 | Survey (Exp 1, 2) |
| F18 | Kanban Touch Actions en Pestañas | Botones de transición táctil directa para tarjetas de comandas en vistas de bodega y despacho. | M3 | Survey (Exp 1) |
| F19 | Clientes Fix Desbordamiento 350px | Eliminación de `flex: 0 0 350px` sin wrap en `ClientsView.tsx`, convirtiendo a layout responsivo (`flex-col lg:flex-row`). | M4 | Survey (Exp 1) |
| F20 | Clientes Header Wrap & Padding | Envoltura responsiva en header de clientes y padding fluido `p-3 sm:p-6` eliminando blowout horizontal. | M4 | Survey (Exp 1) |
| F21 | Clientes Contraste WCAG AA+ | Erradicación de texto fijo `#0F172A` sobre fondo oscuro, sustitución por token semántico `text-primary`. | M4 | Survey (Exp 2) |
| F22 | Clientes Doherty Debounce & Memo | Debouncing de búsqueda (200ms) y memoización de cálculo O(N*M) de deuda en cartera. | M4 | Survey (Exp 2) |
| F23 | Inventario Pestañas Chunks (Miller) | Agrupamiento de 14 pestañas en 5 macro-categorías o menú dropdown accesible en móvil. | M4 | Survey (Exp 2) |
| F24 | Inventario Tabla Productos Móvil | Vista de tarjeta móvil para `ProductTable.tsx` evitando scroll horizontal forzado a 375px. | M4 | Survey (Exp 1) |
| F25 | Inventario WMS Hover Fix (Jakob) | Botones `Trasladar` y `Merma` siempre visibles con tamaño táctil en `InventoryDataTable.tsx`. | M4 | Survey (Exp 2) |
| F26 | E2E Fixture & Auth Session | Test fixture Playwright con inyección de sesión autenticada y monitor de `console.error` / `pageerror`. | E2E Track | Survey (Exp 3) |
| F27 | E2E Tier 1 Smoke & Visual 375px | Pruebas automatizadas de 0 errores en consola y `scrollWidth <= clientWidth` en las 4 pantallas (375px y desktop). | E2E Track | Survey (Exp 3) |
| F28 | E2E Tier 2 UX Ergonomics Gate | Pruebas de objetivos táctiles >=44x44px (Fitts) y respuesta <400ms (Doherty). | E2E Track | Survey (Exp 3) |
| F29 | E2E Tier 3 Flujos Operativos | Pruebas de ciclo completo: Preventa POS -> Recaudo Caja -> Kanban live -> Búsqueda Catálogo. | E2E Track | Survey (Exp 3) |
| F30 | E2E Tier 4 Resiliencia y Harness² | Validación de invariantes con Google Harness² y pruebas de estrés de catálogo. | E2E Track | Survey (Exp 3) |
| F31 | Verificación Final 100% E2E Pass | Ejecución del 100% de la suite E2E Tiers 1-4 sobre el código consolidado. | M5 | Prompt |
| F32 | Hardening Adversarial (Tier 5) | Generación de pruebas adversariales y cobertura de edge cases hasta convergencia. | M5 | Prompt |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Track | Infraestructura de pruebas Playwright, fixture con captura de console.error, test cases Tiers 1-4 y emisión de `TEST_READY.md`. | none | DONE (`TEST_READY.md` publicado, 17 pruebas certificadas, live run OK) |
| M1 | Tokens, Light Mode & Shell Foundation | `src/index.css`, `useAppStore.ts`, `EnterpriseTopbar.tsx`, responsive SweetAlert2 y `Button.tsx` (Fitts >=44px). | none | DONE (`GATE_STATUS.md` PASS, auditor CLEAN, 49 tests passing) |
| M2 | POS Multivendedor & Ergonomía | `POSView.tsx`, `ProductSearchPanel.tsx`, `CartPanel.tsx`, `ParkedOrdersBar.tsx`, `LineaVentaRow.tsx`, `TerminalVendorBadge.tsx`, `PaymentPanel.tsx`. | M1 | DONE (`m2POSMultivendor.test.tsx` 11/11 tests passing, 0 errors tsc) |
| M3 | Caja Única & Tablero Kanban | `CashFlowView.tsx`, `CashierKanbanView.tsx`, `OrderKanbanView.tsx` (selectores wrap, memoización sort, integración de preventas y acciones táctiles). | M1 | DONE (`m3CashAndKanban.test.tsx` 9/9 y `m3AdversarialChallenge.test.tsx` 10/10 passing) |
| M4 | Catálogos (Clientes & Inventario) | `ClientsView.tsx`, `InventoryView.tsx`, `ProductTable.tsx`, `StockMatrizTable.tsx`, `InventoryDataTable.tsx` (desbordamiento 350px, debounce, contraste WCAG y chunking). | M1 | DONE (`m4CatalogsAndInventory.test.tsx` 17/17 tests passing, 0 errors tsc) |
| M5 | Final Milestone: 100% E2E Pass & Hardening | Auditoría completa DevTools 0 errores consola, 0 desbordamiento horizontal (`scrollWidth <= clientWidth`), co-ejecución Harness² + Agency Swarm. | E2E, M1, M2, M3, M4 | DONE (Certificado con Chromium DevTools, Harness² Demo OK, 77/77 tests pasando) |

## Interface Contracts

### Shell & Design Tokens ↔ Application Views
- **CSS Variables**: `[data-theme="pezcaderia-light"]` y `[data-theme="pezcaderia-glass"]` proveen:
  - `--bg-color`: color de fondo principal (`#f8fafc` en light, `#070A10` en glass).
  - `--card-bg`: color de tarjeta / contenedor (`#ffffff` en light, `rgba(15, 23, 42, 0.7)` en glass).
  - `--text-primary`: color de texto principal (`#0f172a` en light, `#f8fafc` en glass).
  - `--text-secondary`: `#334155` (light) / `#94a3b8` (glass).
  - `--border-color`: `#e2e8f0` (light) / `rgba(255, 255, 255, 0.1)` (glass).
- **Store Interface**: `useAppStore.themeMode` acepta `'pezcaderia-light' | 'pezcaderia-glass' | 'hyper-cobalt' | 'carbon-teal' | 'chrome-violet'`.
- **Button Sizing Contract**: `<Button size="md">` y `<Button size="lg">` garantizan altura calculada mínima de `44px` (`min-h-[44px]`). `<Button size="sm">` para chips secundarios o con padding táctil extendido.

### POS ↔ Cashier Central Queue Contract
- **Preventa Draft Model**: Almacenado en `pezca_pos_drafts_v1` a través de `localDb`.
  - Propiedades obligatorias: `{ id: string, consecutivo: string, vendedorId: string, vendedorNombre: string, items: CartItem[], total: number, createdAt: string, status: 'PENDIENTE' | 'EN_COBRO' | 'PAGADO' }`.
- **PendingOrdersDrawer & CashierKanbanView**: Consumen la misma cola atómica para sincronizar preventas en espera y pasarlas a cobro directo en taquilla.

### Testing Track ↔ Implementation Track Contract
- **Test Runner Entrypoint**: `npx playwright test` (o archivo específico `tests/e2e/tier*.spec.ts`).
- **Pass / Fail Semantic**: Código de salida 0; 0 logs de `console.error`; `scrollWidth <= clientWidth + 2` en viewport 375px y desktop 1366x768.
- **Coordination Signal**: `TEST_READY.md` en raíz del proyecto certifica que la suite Tiers 1-4 está lista para ser consumida por el hito final M5.

## Code Layout
- `src/index.css`: Tokens de tema CSS, reset responsivo y variables CSS.
- `src/store/useAppStore.ts`: Estado global de temas, alertas y navegación.
- `src/components/layout/`: `EnterpriseTopbar.tsx`, `EnterpriseSidebar.tsx`, `layoutModes.ts`.
- `src/components/ui/Button.tsx`: Componente base de botón accesible.
- `src/views/POSView.tsx`: Vista principal de ventas multivendedor.
- `src/views/pos/components/`: Subcomponentes de POS (`ProductSearchPanel`, `CartPanel`, `PaymentPanel`, `ParkedOrdersBar`, `LineaVentaRow`, `TerminalVendorBadge`, `PendingOrdersDrawer`).
- `src/views/cash/`: Vista de caja y liquidación (`CashFlowView.tsx`, `ArqueoCajaModal.tsx`).
- `src/views/pos/components/CashierKanbanView.tsx`: Tablero Kanban de caja única para preventas.
- `src/views/OrderKanbanView.tsx`: Tablero Kanban de pedidos y alistamiento en bodega.
- `src/views/ClientsView.tsx`: Directorio y catálogo de clientes.
- `src/views/InventoryView.tsx`: Catálogo general de productos y existencias.
- `src/views/inventory/components/`: Subcomponentes de inventario (`ProductTable.tsx`, `StockMatrizTable.tsx`, `InventoryDataTable.tsx`).
- `tests/e2e/`: Suite de pruebas E2E (`tier1-visual-integrity.spec.ts`, `tier2-ux-ergonomics.spec.ts`, `tier3-operational-lifecycle.spec.ts`, `tier4-resilience.spec.ts`, `fixtures/testFixtures.ts`).
- `tools/harness2/`: Arnés de verificación de invariantes Google Harness² (`run_harness2.ps1`, `run_harness2.py`).
