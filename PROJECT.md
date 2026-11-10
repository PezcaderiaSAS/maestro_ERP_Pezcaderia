# Project: Plan Integral de Refactorización y Desarrollo Frontend: Interfaz POS — La Pezcadería S.A.S. (SPEC-057)

## Architecture
- **Patrón de Arquitectura**: Single Page Application en React 18, Vite, TypeScript estricto, Tailwind CSS y Zustand en arquitectura de persistencia L1/Dexie.
- **Enfoque de Desarrollo**: Spec-Driven Development (SDD v3.0 / Spec Kit) con ciclo TDD riguroso (RED -> GREEN -> REFACTOR) y Continuous Kanban Flow (WIP = 1).
- **Módulos y Componentes Involucrados**:
  - `src/views/pos/components/POSMultivendorCart.tsx`: Carrito multivendedor con flexbox vertical estricto (85% espacio de lista con `min-h-0`), inputs de cantidad y precio continuo con auto-selección en foco y navegación cíclica por [Tab], micro-botón `[+ Desc]` por ítem, y pie fijo anclado (`shrink-0 mt-auto`).
  - `src/views/pos/components/POSMultivendorView.tsx`: Vista contenedora principal que orquesta el catálogo (75%), carrito (25%), atajos globales de teclado, trigger automático de balanza táctil e integración de modales de supervisor y pesaje.
  - `src/views/pos/components/ManualWeightModal.tsx`: Modal táctil con teclado numérico en pantalla (teclas >= 48px), chips de acceso rápido (0.25 - 5 kg) y cálculo de subtotal en tiempo real.
  - `src/views/pos/components/SupervisorPinModal.tsx`: Modal de seguridad táctil para autorización con PIN de 4 dígitos cuando se superan umbrales comerciales.
  - `src/views/pos/components/POSMultivendorCatalog.tsx`: Matriz fija de 18 tarjetas (6x3) con paginación inferior `< Anterior 1 2 3 ... Siguiente >`, virtualizada en memoria (< 16ms, 60 FPS) y marcado de productos agotados (`opacity-60`, "AGOTADO").
  - `src/stores/useMultiVendorPosStore.ts`: Store Zustand L1 con recálculo financiero síncrono (< 10ms) para subtotales, descuentos y totales.
  - `src/tests/posCartEditableRow.test.tsx`: Suite de pruebas TDD exclusiva para el carrito editable y navegación por teclado.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Input Cantidad Editable en Línea | `<input type="number">` continuo con auto-selección en foco para modificar cantidad/peso en cada fila del carrito. | M1 | Survey (Spec Miner, Explorers) |
| F2 | Input Precio Unitario Editable en Línea | `<input type="number">` continuo con prefijo $ y auto-selección en foco para modificar precio unitario en cada fila. | M1 | Survey (Spec Miner, Explorers) |
| F3 | Navegación Continua con Tecla [Tab] | Presionar [Tab] en Cantidad enfoca Precio de la misma fila; [Tab] en Precio enfoca Cantidad de la fila siguiente. | M1 | Survey (Spec Miner, Explorers) |
| F4 | Micro-Botón de Descuento por Ítem [+ Desc] | Botón micro en cada fila que permite asignar descuento individual (% o $) mostrando badge en la línea. | M1 | Survey (Spec Miner, Explorers) |
| F5 | Flexbox Vertical Estricto (85% Espacio de Ítems) | Contenedor con `h-full min-h-0 flex flex-col`, lista de productos con `flex-1 min-h-0 overflow-y-auto` y pie anclado `shrink-0 mt-auto`. | M1 | Survey (Spec Miner, Explorers) |
| F6 | Suite TDD `posCartEditableRow.test.tsx` | Suite de pruebas unitarias e interactivas Vitest + RTL que valida la fila editable, navegación Tab y micro-descuento. | M1 | Survey (Spec Miner, Explorers) |
| F7 | Botón Anclado `+ Descuento (F4)` en Footer | Botón permanente en el pie de totales del carrito para abrir popover/modal de descuento global de comanda. | M2 | Survey (Spec Miner) |
| F8 | Selector de Descuento Global [% / $] | Selector interactivo de modo porcentual (%) o monto fijo ($) con inputs numéricos y presets en el footer del carrito. | M2 | Survey (Spec Miner) |
| F9 | Recálculo Financiero Instantáneo Sub-10ms | Recálculo reactivo en Zustand de Subtotal, Descuento, IVA y Total a Pagar en tiempo real (< 10ms). | M2 | Survey (Spec Miner) |
| F10 | Trigger Automático de `ManualWeightModal` | Despliegue inmediato del modal de pesaje al hacer clic o escanear productos a granel (`KG Balanza`) en `POSMultivendorView`. | M3 | Survey (Spec Miner, Explorers) |
| F11 | Teclado Táctil y Chips de Pesaje en Balanza | Digitador táctil manual en pantalla con chips de peso rápido (0.25 - 5 kg) y cálculo en vivo sin bloqueo serial. | M3 | Survey (Spec Miner, Explorers) |
| F12 | Interceptor Global de Atajos de Teclado | Captura unificada de atajos F8 (Buscador), Ctrl+K (Búsqueda rápida), F6 (Comanda), F4 (Descuento), F2 (Cobrar), F9 (Cajero), Esc (Cerrar). | M4 | Survey (Spec Miner, Explorers) |
| F13 | Validación Comercial de Margen Mínimo | Validación: si `Precio Propuesto < Costo Base + 15%`, se exige obligatoriamente PIN de supervisor (4 dígitos). | M5 | Survey (Spec Miner, Explorers) |
| F14 | Validación de Umbral Máximo de Descuento | Validación: si `Descuento > 10%`, se exige obligatoriamente PIN de supervisor vía `SupervisorPinModal`. | M5 | Survey (Spec Miner, Explorers) |
| F15 | Mecanismo de Rollback ante Cancelación de PIN | Si el modal de supervisor se cancela o el PIN es inválido, se revierte inmediatamente el precio o descuento anterior. | M5 | Survey (Spec Miner) |
| F16 | Matriz de Catálogo 18 Tarjetas (6x3) Virtualizada | Grid fijo de 18 tarjetas con paginación inferior `< Anterior ... Siguiente >` virtualizado en memoria para transiciones < 16ms (60 FPS). | M6 | Survey (Spec Miner, Explorers) |
| F17 | Estado Visual de Productos Agotados | Indicador visual para items con `stock <= 0` (`opacity-60`, texto destacado "AGOTADO", clic inhabilitado). | M6 | Survey (Spec Miner) |
| F18 | Quality Gate Final: TypeScript, Vitest y Responsive | Verificación con `tsc --noEmit` (0 errores), Vitest (100% verde) y renderizado responsive a 375px móvil y 1280px desktop. | M6 | Survey (Spec Miner, Explorers) |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Fila de Carrito con Navegación [Tab], Edición en Línea, Botón [+ Desc] y Suite TDD (Tarea 1) | `src/views/pos/components/POSMultivendorCart.tsx`, `src/tests/posCartEditableRow.test.tsx` (F1, F2, F3, F4, F5, F6) | none | DONE (Gate PASSED: 2 Reviewers APPROVE, 2 Challengers APPROVE, Auditor CLEAN, 54/54 tests green, 0 tsc errors) |
| M2 | Motor de Descuento Global de Comanda (F4) [% / $] y Recálculo Sub-10ms (Tarea 2) | `src/views/pos/components/POSMultivendorCart.tsx`, `src/stores/useMultiVendorPosStore.ts` (F7, F8, F9) | M1 | DONE (Gate PASSED: 2 Reviewers APPROVE, 2 Challengers APPROVE, Auditor CLEAN, 67/67 tests green, 0 tsc errors, p99 < 2ms) |
| M3 | Trigger Táctil de Pesaje Manual (`ManualWeightModal`) para Ítems Balanza (Tarea 3) | `src/views/pos/components/POSMultivendorView.tsx`, `src/views/pos/components/ManualWeightModal.tsx` (F10, F11) | M1 | DONE (Gate PASSED: 2 Reviewers APPROVE, 2 Challengers APPROVE, Auditor CLEAN, 88/88 tests green, 0 tsc errors) |
| M4 | Interceptor Global de Atajos de Teclado (F8, Ctrl+K, F6, F4, F2, F9, Esc) (Tarea 4) | `src/views/pos/components/POSMultivendorView.tsx`, `src/hooks/usePOSKeyboardShortcuts.ts` (F12) | M1, M2 | DONE (Gate PASSED: 2 Reviewers APPROVE, 2 Challengers APPROVE, Auditor CLEAN, 165+ tests green, 0 tsc errors) |
| M5 | Validación Comercial de Margen, Umbral de Descuento y PIN de Supervisor (Tarea 5) | `src/views/pos/components/POSMultivendorCart.tsx`, `src/views/pos/components/SupervisorPinModal.tsx` (F13, F14, F15) | M1, M2 | DONE (Gate PASSED: 14/14 tests M5 green, 179/179 full suite green, 0 tsc errors) |
| M6 | Quality Gate Final: Catálogo 18 Tarjetas, Virtualización, TypeScript 0 Errores, Vitest 100% y Responsive (Tarea 6) | `src/views/pos/components/POSMultivendorCatalog.tsx`, suites Vitest, validación responsive (F16, F17, F18) | M1, M2, M3, M4, M5 | DONE (Gate PASSED: 15/15 tests M6 green, 194/194 full suite green, 0 tsc errors, build 100% clean) |

## Feature Inventory Cross-Check
- Total Features: 18 (F1 a F18)
- Features assigned to M1: F1, F2, F3, F4, F5, F6 (6 features)
- Features assigned to M2: F7, F8, F9 (3 features)
- Features assigned to M3: F10, F11 (2 features)
- Features assigned to M4: F12 (1 feature)
- Features assigned to M5: F13, F14, F15 (3 features)
- Features assigned to M6: F16, F17, F18 (3 features)
- Unassigned Features: 0 (Cross-check PASSED 100%).

## Interface Contracts

### POSMultivendorCart Props & Callbacks (Milestone M1)
- **Props requeridas**:
  - `items: MultivendorCartItem[]`
  - `onUpdateQuantity: (index: number, delta: number) => void` (compatibilidad retroactiva)
  - `onSetQuantity?: (index: number, quantity: number) => void` (nuevo para digitación directa)
  - `onUpdatePrice?: (index: number, newPrice: number) => void` (nuevo para edición de precio en línea)
  - `onUpdateDiscount?: (index: number, discountPct: number) => void` (nuevo para descuento de línea)
  - `onRemoveItem: (index: number) => void`
  - `onClearCart: () => void`
  - `subtotal: number`
  - `descuento?: number`
  - `total: number`
  - `onEmitirComanda: () => void`
  - `onCobrarCaja?: () => void`
- **Atributos y Contratos DOM en Cada Fila de Carrito**:
  - Contenedor de fila: `data-testid="cart-row-${index}"`
  - Display/Span de Cantidad (compatibilidad retroactiva): `data-testid="cart-qty-${index}"`
  - Input Cantidad: `data-testid="cart-qty-input-${index}"` con `tabIndex={index * 2 + 1}` y `onFocus={(e) => e.target.select()}`
  - Input Precio Unitario: `data-testid="cart-unit-price-input-${index}"` con `tabIndex={index * 2 + 2}` y `onFocus={(e) => e.target.select()}`
  - Botón micro [+ Desc]: `data-testid="btn-cart-desc-${index}"`
  - Steppers de incremento/decremento: `data-testid="btn-cart-inc-${index}"` y `data-testid="btn-cart-dec-${index}"` (con `tabIndex={-1}`)
  - Botón eliminar ítem: `data-testid="btn-cart-remove-${index}"` (con `tabIndex={-1}`)

## Code Layout
- Componentes POS: `src/views/pos/components/`
  - `POSMultivendorCart.tsx` (exclusivo para M1, M2, M5)
  - `POSMultivendorView.tsx` (exclusivo para M3, M4)
  - `POSMultivendorCatalog.tsx` (exclusivo para M6)
  - `ManualWeightModal.tsx` (utilizado en M3)
  - `SupervisorPinModal.tsx` (utilizado en M5)
- Hooks y Stores: `src/hooks/`, `src/stores/`
  - `useMultiVendorPosStore.ts` (M2, M5)
  - `usePOSKeyboardShortcuts.ts` (M4)
- Suites de Prueba: `src/tests/`
  - `src/tests/posCartEditableRow.test.tsx` (creación en M1)
  - `src/tests/posMultivendorLightSaaS.test.tsx` (suite de regresión)
