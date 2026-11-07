# TEST_INFRA.md — Infrastructure & Quality Plan for Table Counter POS View (/mostrador)

## 1. Test Philosophy: Opaque-Box & Requirement-Driven

The test architecture for the Table Counter POS view (`/mostrador`) strictly adheres to an **opaque-box, requirement-driven methodology**.
- **No Reliance on Internal Implementation Details**: Tests validate system inputs, outputs, observable DOM interactions, mathematical invariants, and architectural contracts rather than private component states, internal variables, or volatile class structures.
- **Progressive Testability**: Each test case targets behaviors formally defined in `ORIGINAL_REQUEST.md` and `PROJECT.md`.
- **Deterministic Derivation of Expected Output**: All financial numbers, formatting strings (e.g. `PRE-YYYY-XXXXX`), HTTP/Worker responses, and CSS layout constraints are derived from authoritative specifications and verified with exact mathematical precision.
- **Isolation and Independence**: Every test initializes its own clean state, restores global stores/spies in `beforeEach` / `afterEach`, and avoids cross-suite pollution.

---

## 2. Feature Inventory (F1 to F10) & Tier Mapping

| Feature ID | Feature Name | Description & Specification Reference | Tier 1 (Primary) | Tier 2 (Boundaries) | Tier 3 (Pairwise) | Total Target |
|:---|:---|:---|:---:|:---:|:---:|:---:|
| **F1** | Motor de Búsqueda Sub-10ms (10.000 Productos) | Web Worker / `SearchEngineCore`, índice invertido, búsqueda difusa con latencia sub-10ms en 10.000 registros, búsqueda O(1) por SKU/código de barras y fallback Top 100 Pareto. | 5 | 5 | Pairwise Matrix | 10+ |
| **F2** | Hidratación Masiva y Stock O(1) por Bodega | Ingesta paginada por bloques eludiendo el límite de 1.000 filas de PostgREST, hidratación a IndexedDB L2 y mapa en memoria `stock[bodega][sku]`. | 5 | 5 | Pairwise Matrix | 10+ |
| **F3** | Enrutamiento `/mostrador` y Layout Fijo | Registro de `AppRouteId.COUNTER_POS = 'mostrador'`, aislamiento total de `POSView.tsx`, pertenencia a `TRANSACTIONAL_FIXED_VIEWS` (`overflow-hidden`, sin scroll exterior). | 5 | 5 | Pairwise Matrix | 10+ |
| **F4** | Barra Superior Condensada de Una Línea | Contexto operativo unificado: asesor activo con cambio rápido, cliente por NIT/Cédula, bodega activa, indicador de turno y badges de atajos de teclado. | 5 | 5 | Pairwise Matrix | 10+ |
| **F5** | Cabecera de Entrada Rápida de Ítems | Input de código de barras/SKU con retención de foco para escaneo continuo, selector de tarifa (Detal/Mayorista/Restaurante), cantidad (default 1) y adición inmediata (+ / Enter). | 5 | 5 | Pairwise Matrix | 10+ |
| **F6** | Tabla Virtualizada ("Tu Carrito") sin Imágenes | Tabla de venta pura sin tags `<img>` ni recursos visuales pesados, columnas #, SKU, Producto, Cantidad, Precio, Total, virtualización headless DOM $O(1)$ y contraste WCAG 2.2 AA+. | 5 | 5 | Pairwise Matrix | 10+ |
| **F7** | Navegación 100% por Teclado y Ergonomía Táctil | Atajos globales (F2 comanda/preventa, F6 suspender, F8 búsqueda, F10 cobrar, Flechas arriba/abajo, Enter, Tab) y targets táctiles mínimos de 44px (Ley de Fitts). | 5 | 5 | Pairwise Matrix | 10+ |
| **F8** | Pie Financiero Exacto en COP | Cálculo monetario exacto en pesos colombianos: subtotal, descuento, base gravable con IVA incluido, IVA desagregado, invariante `base + iva === total`, tipografía monoespaciada sin decimales. | 5 | 5 | Pairwise Matrix | 10+ |
| **F9** | Emisión de Preventas Correlativas `PRE-YYYY-XXXXX` | Generación de ticket/preventa con formato estricto `^PRE-\d{4}-\d{5}$`, asignación al asesor y bodega, estado `PENDIENTE_COBRO` y derivación a taquilla de caja única (`CashierKanbanView`). | 5 | 5 | Pairwise Matrix | 10+ |
| **F10** | Hardening Adversarial y Tolerancia a Fallos | Resistencia a ráfagas de escaneo concurrente, inyección de caracteres especiales, montos extremos, carritos vacíos, tolerancia a fallos de red y recuperación de estado. | 5 | 5 | Pairwise Matrix | 10+ |

**Subtotal Tier 1 (Happy Path)**: 50 tests (5 tests × 10 features)  
**Subtotal Tier 2 (Boundary & Adversarial)**: 50 tests (5 tests × 10 features)  
**Subtotal Tier 3 (Pairwise Interactions)**: 10 pairwise test cases  

---

## 3. Real-World Application Scenarios (Tier 4)

Tier 4 tests execute full end-to-end user journeys replicating genuine high-stress daily operations in the seafood distribution center:

### Scenario 1: Hora Pico de Mostrador (High-Throughput Rush Hour)
- **Context**: 7:30 AM arrival of local restaurant buyers. Rapid continuous barcode scanning of 12 distinct fresh fish lines.
- **Workflow**:
  1. Operator scans 12 items via barcode reader at high speed (< 50ms interval).
  2. The table cart auto-aggregates existing lines and appends new ones without UI lag.
  3. Fills default quantities, executes instant recalculation of COP subtotals.
  4. Triggers F2 shortcut to emit pre-sale.
- **Verification**: Emits pre-sale `PRE-2026-XXXXX`, clears cart, returns autofocus to scanner input, and creates pending order in cashier queue.

### Scenario 2: Cliente Mayorista con Tarifas Diferenciales y Descuento por Volumen
- **Context**: B2B institutional purchaser arrives. Operator switches client from "Consumidor Final" to "Hotel Dann Carlton" via NIT.
- **Workflow**:
  1. Rapid NIT search assigns wholesale client profile.
  2. Adding products automatically applies `precioMayorista`.
  3. Operator applies authorized 5% line discount.
  4. Operator switches to "precioRestaurante" for specific specialty catch item.
- **Verification**: Exact COP rounding with 0 decimal places, VAT correctly split (`baseGravable + iva === total`), and discount validation adheres to role limits.

### Scenario 3: Búsqueda Masiva de Productos Raros por Términos Imprecisos (F8 Modal)
- **Context**: Customer asks for an uncommon seafood product ("robalo congelado porcionado") without barcode.
- **Workflow**:
  1. Operator presses F8 to open full-screen/modal fast search.
  2. Types fuzzy query with typo ("rovalo porc").
  3. SearchEngineCore retrieves top matched results from 10,000 products in < 10ms.
  4. Operator navigates results using Arrow Down and hits Enter to add to cart.
  5. Modal closes and focus returns to quantity/barcode field.
- **Verification**: Query executed in sub-10ms off-thread, item added with correct SKU, and keyboard navigation functions smoothly.

### Scenario 4: Asesor en Mostrador con Suspensión Temporal (F6) y Recuperación de Venta
- **Context**: Customer realizes they left their wallet or need to check another item. Operator cannot block counter lane.
- **Workflow**:
  1. Operator presses F6 to park the active cart.
  2. Cart is serialized into `pezca_pos_drafts_v1` with timestamp and customer name.
  3. Table resets to pristine state; operator serves next customer and emits their pre-sale.
  4. First customer returns; operator recalls parked cart from quick drawer.
- **Verification**: All original items, quantities, and price tiers are accurately restored with exact totals preserved.

### Scenario 5: Flujo Multivendedor Concurrente hacia Caja Única Central
- **Context**: Two sales advisors (Advisor Marco at Counter 01 and Advisor Lucia at Counter 02) working simultaneously.
- **Workflow**:
  1. Advisor Marco prepares order and emits `PRE-2026-00001` (assigned to `vendedorId: marco`).
  2. Advisor Lucia simultaneously prepares order and emits `PRE-2026-00002` (assigned to `vendedorId: lucia`).
  3. Orders arrive reactively into `CashierKanbanView` under column `PENDIENTE_COBRO`.
  4. Cashier opens `PRE-2026-00001`, registers cash payment, and transitions it to `COBRADA`.
- **Verification**: Strict isolation between advisors' carts, consecutive correlatives generated, and cashier successfully liquidates each pre-sale.

---

## 4. Coverage Thresholds & Quality Gates

| Test Tier | Focus & Methodology | Minimum Threshold | Target Suite File |
|:---|:---|:---:|:---|
| **Tier 1** | Primary Feature Behaviors (Happy Paths) | **>= 50 tests** (>=5 per F1-F10) | `src/tests/e2e/tier1_features.test.tsx` |
| **Tier 2** | Boundaries, Edge Cases, Stress & Adversarial | **>= 50 tests** (>=5 per F1-F10) | `src/tests/e2e/tier2_boundaries.test.tsx` |
| **Tier 3** | Pairwise Combinations & Inter-Module Contracts | **>= 10 tests** | `src/tests/e2e/tier3_pairwise.test.tsx` |
| **Tier 4** | Real-World Application User Journeys | **>= 5 scenarios** | `src/tests/e2e/tier4_realworld.test.tsx` |
| **Aggregator** | Master Test Orchestration & Sanity | **>= 1 suite** | `src/tests/e2e/counterPosE2E.test.tsx` |
| **Total** | **Comprehensive E2E Suite** | **>= 115 tests** | All modular files |

---

## 5. Execution Environment & Test Runner Commands

The test suite runs under Vitest in jsdom environment with full DOM and mock support:
```bash
# Run the complete Counter POS E2E test suite
npx vitest run src/tests/e2e/

# Run individual tiers
npx vitest run src/tests/e2e/tier1_features.test.tsx
npx vitest run src/tests/e2e/tier2_boundaries.test.tsx
npx vitest run src/tests/e2e/tier3_pairwise.test.tsx
npx vitest run src/tests/e2e/tier4_realworld.test.tsx
npx vitest run src/tests/e2e/counterPosE2E.test.tsx
```
