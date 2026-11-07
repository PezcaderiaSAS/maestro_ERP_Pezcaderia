# Project: Vista Dedicada de Alto Rendimiento para Ventas de Mostrador Tipo Tabla (/mostrador)

## Architecture
- **Patrón de Arquitectura**: Single Page Application en React 18, Vite, TypeScript estricto, Tailwind CSS y Supabase con jerarquía de caché multinivel (L1 RAM Zustand, L2 IndexedDB por Tenant, L3 Upstash Redis, L4 PostgreSQL Supabase).
- **Enrutamiento Desacoplado**: Enrutador propio sincronizado por hash (`AppRouteId.COUNTER_POS = 'mostrador'`) en `src/routes/AppRoute.ts` y `src/App.tsx`, garantizando que la vista existente `POSView.tsx` (3,681 líneas) permanezca 100% intacta y sin modificaciones regresivas.
- **Modo de Pantalla Fija Transaccional**: Integrado en `src/components/layout/layoutModes.ts` bajo `TRANSACTIONAL_FIXED_VIEWS` (`h-[calc(100vh-...)] overflow-hidden`) para eliminar scroll exterior accidental en desktop (1280x800), tablets y móviles.
- **Motor de Datos y Búsqueda de Alta Velocidad (10.000 Productos)**:
  - Carga masiva sin pérdida de registros evitando el límite de 1.000 filas de PostgREST mediante paginación por bloques / `ProgressiveHydrationService` hacia `TenantIndexedDbService` (L2).
  - Diccionario en memoria $O(1)$ en Zustand L1 (`stock[bodega][sku]`) para disponibilidad inmediata de existencias.
  - Búsqueda instantánea sub-10ms mediante `SearchEngineCore` ejecutado off-thread en Web Worker (`catalogSearch.worker.ts`), combinando mapas $O(1)$ de SKU y código de barras con índice invertido de vocabulario y distancia de Levenshtein acotada.
  - Virtualización headless in-house vía `useVirtualGrid` (`columnsCount: 1`, `rowHeight: 44px`) que mantiene un número constante de nodos DOM (< 25 elementos) para un desplazamiento fluido a 60–120 FPS sin dependencias externas pesadas.
- **Diseño Ultra Ligero y Ergonomía Accesible**:
  - Cero renderizado de imágenes para máxima legibilidad, velocidad y densidad vertical.
  - Paleta de alto contraste WCAG 2.2 AA+ (Light Mode: fondo `#f8fafc` `slate-50`, inputs `#ffffff` con borde `1.5px solid #cbd5e1`, texto `#0f172a` `slate-900`, badges de stock con semáforo esmeralda/ámbar/rojo) y compatibilidad con Dark Glassmorphism V8 (`pezcaderia-glass`).
  - Navegación 100% por teclado con atajos globales (F2 comanda, F6 suspender, F8 búsqueda, F10 cobrar, Flechas, Enter, Tab) y targets táctiles mínimos de 44px (Ley de Fitts).
- **Flujo Transaccional Multivendedor y Caja Única**:
  - Emisión de comandas/preventas con numeración correlativa estricta `PRE-YYYY-XXXXX` a través de `prefacturaService.ts` y `useMultiVendorPosStore.ts`.
  - Despacho y liquidación derivados a la taquilla de caja única (`CashierKanbanView` / RPC `registrar_venta_pos_concurrente`).
  - Cálculos financieros exactos en COP con redondeo a cero centavos y fórmula de IVA incluido $\text{Base} = \text{round}(\text{Total}/(1 + \text{Tarifa}/100))$ y $\text{IVA} = \text{Total} - \text{Base}$.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Motor de Búsqueda Sub-10ms para 10.000 Productos | Indexación invertida y búsqueda en Web Worker con tiempo de respuesta <10ms en 10.000 productos y O(1) en código de barras/SKU. | M1 | Survey (Exp 1, 2) |
| F2 | Hidratación Masiva y Stock O(1) por Bodega | Ingesta paginada desde Supabase/IndexedDB evitando el límite de 1.000 filas y mapa en memoria `stock[bodega][sku]`. | M1 | Survey (Exp 2, 3) |
| F3 | Registro de Ruta `/mostrador` y Layout Fijo | Registro de `AppRouteId.COUNTER_POS = 'mostrador'` en `AppRoute.ts`, `App.tsx`, `layoutModes.ts` y navegación lateral sin tocar `POSView.tsx`. | M2 | Survey (Exp 1) |
| F4 | Barra Superior Condensada de Una Línea | Contexto operativo con asesor activo (conmutación rápida), cliente rápido (NIT/Cédula), bodega activa, turno y atajos. | M3 | Survey (Exp 1, 3) |
| F5 | Cabecera de Entrada Rápida de Ítems | Input de código/SKU con autofoco y escaneo, selector de precio (Detal/Mayorista/Restaurante), cantidad rápida (default 1) y botón agregar (+ / Enter). | M3 | Survey (Exp 1, 3) |
| F6 | Tabla Virtualizada de Venta ("Tu Carrito") sin Imágenes | Tabla pura de líneas de venta con virtualización headless (`useVirtualGrid`), columnas #, SKU, Producto, Cantidad, Precio, Total y acciones de fila. | M4 | Survey (Exp 1, 2) |
| F7 | Navegación 100% por Teclado y Ergonomía Táctil | Atajos F2, F6, F8, F10, flechas, Enter, Tab para operar venta completa sin ratón, con targets táctiles >= 44px. | M4 | Survey (Exp 1, 3) |
| F8 | Pie Financiero Exacto en COP | Cálculo matemático exacto de subtotal, descuento, IVA incluido y total general prominente en fuente monoespaciada sin decimales. | M5 | Survey (Exp 1, 3) |
| F9 | Emisión de Preventas Correlativas PRE-YYYY-XXXXX | Generación de preventas consecutivas vinculadas al asesor y bodega, enrutadas a caja única (`CashierKanbanView`). | M5 | Survey (Exp 1, 2, 3) |
| F10 | Suite de Pruebas Automatizadas y Hardening Adversarial | Suite de pruebas unitarias, de rendimiento y E2E (Tiers 1-5) certificando funcionalidad, cero regresiones y verificación forense. | M6 | Survey & Pattern |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Motor de Datos, Hidratación Masiva y Búsqueda Sub-10ms | Servicios de búsqueda e hidratación (`SearchEngineCore`, `catalogSearch.worker.ts`, `tenantIndexedDbService.ts`, `useInventoryStore.ts`): carga de 10.000 productos sin truncar, stock O(1) por bodega y respuesta sub-10ms. | none | PLANNED |
| M2 | Enrutamiento Desacoplado y Layout de Mostrador | `src/routes/AppRoute.ts`, `src/App.tsx`, `src/components/layout/layoutModes.ts`, `src/components/layout/EnterpriseSidebar.tsx`, `src/views/pos/CounterPosView.tsx`: ruta `/mostrador` activa, fija y aislada de `POSView.tsx`. | none | PLANNED |
| M3 | Barra Superior Condensada y Entrada Rápida de Ítems | Componentes de cabecera operativa: selector rápido de asesor, buscador modal/inline de cliente por NIT/Cédula, selector de bodega, input de código de barras/SKU con lectura de escáner, cantidad y precio. | M1, M2 | PLANNED |
| M4 | Tabla Virtualizada sin Imágenes y Navegación por Teclado | Componente de tabla virtual "Tu Carrito": `useVirtualGrid` con $O(1)$ nodos DOM, diseño ultra ligero de alto contraste, columnas de producto/cantidad/total y navegación por teclado (F2, F6, F8, F10, Flechas, Enter, Tab). | M2, M3 | PLANNED |
| M5 | Pie Financiero y Flujo Multivendedor a Caja Única | Footer financiero con desglose exacto en COP, barra de acciones rápidas, integración con `prefacturaService.ts` emitiendo `PRE-YYYY-XXXXX` y actualización reactiva de cola de caja única. | M3, M4 | PLANNED |
| M6 | Certificación E2E 100% y Cobertura Adversarial | Ejecución y aprobación del 100% de la suite de pruebas E2E (Tiers 1-4) de `TEST_READY.md` + Fase 2: Hardening adversarial de cobertura (Tier 5) con Challengers y Forensic Auditor. | M1, M2, M3, M4, M5 | PLANNED |

## Interface Contracts

### CounterPosView ↔ Data & Search Engine
- **Search Query Interface**:
  - `queryProducts(term: string, limit?: number): Promise<LocalIndexedDbProduct[]>`
  - Retorna resultados en `< 10ms` vía Web Worker. Si `term` está vacío, retorna Top 100 Pareto.
  - `lookupByBarcodeOrSku(code: string): LocalIndexedDbProduct | undefined` en `$O(1)` (< 0.05ms).
- **Stock Resolution Contract**:
  - `getStockAvailable(bodegaId: string, sku: string): number`
  - Resuelve directamente desde `useInventoryStore.getState().stock[bodegaId]?.[sku] ?? 0`.

### CounterPosView ↔ Routing & App State
- **Route Key**: `AppRouteId.COUNTER_POS = 'mostrador'`.
- **URL Path**: `/mostrador` (o `#/mostrador`).
- **Sidebar Integration**: Ícono `Store` de Lucide, visible para roles `admin` y `vendedor`.
- **Isolation Guarantee**: `src/views/POSView.tsx` no recibe ninguna modificación de código.

### Rapid Entry Header ↔ Cart Table State
- **Add Item Action**:
  - `onAddItem(product: LocalIndexedDbProduct, quantity: number, priceTier: 'detal' | 'mayorista' | 'restaurante') => void`
  - Si el producto ya existe en el carrito, incrementa la cantidad sin duplicar la fila.
  - Autofoco restaurado inmediatamente en el input de código de barras para permitir escaneos continuos a alta velocidad.

### Financial Calculator Contract (`src/services/posService.ts`)
- **COP Precision**: Moneda entera sin decimales (`Math.round`).
- **Fórmulas de Totales**:
  - `subtotal = sum(item.cantidad * item.precioUnitario)`
  - `descuento = sum(item.descuentoMonto)`
  - `baseGravable = round(totalConIva / (1 + tarifaIva / 100))`
  - `iva = totalConIva - baseGravable`
  - Invariante estricto: `baseGravable + iva === totalConIva`.

### Pre-Sale Emission Contract (`src/services/prefacturaService.ts`)
- **Correlative Generator**: `PRE-YYYY-XXXXX` (ej. `PRE-2026-00001`).
- **Required Metadata**:
  - `vendedorId`: ID del asesor activo.
  - `vendedorNombre`: Nombre del asesor activo.
  - `bodegaId`: ID de la bodega de despacho seleccionada.
  - `cliente`: Datos de cliente (Cédula/NIT, Nombre) o Consumidor Final por defecto.
  - `items`: Lista de productos, cantidades, precios unitarios y subtotales.
  - `estado`: `PENDIENTE_COBRO`.
- **Destination**: Persistido en Supabase (`pos_prefacturas`) o en cola offline (`pezca_pos_drafts_v1`), inmediatamente visible en `CashierKanbanView` para cobro en caja única.

## Code Layout
- `src/routes/AppRoute.ts`: Registro del enum `AppRouteId.COUNTER_POS`, metadatos y roles.
- `src/App.tsx`: Mapeo de ruta `/mostrador` en `VALID_ROUTES` y switch de renderizado.
- `src/components/layout/layoutModes.ts`: Declaración de vista fija en `TRANSACTIONAL_FIXED_VIEWS`.
- `src/components/layout/EnterpriseSidebar.tsx`: Enlace en el menú lateral de navegación.
- `src/views/pos/CounterPosView.tsx`: Contenedor principal de la vista de mostrador tipo tabla.
- `src/views/pos/counter/CounterTopContextBar.tsx`: Barra superior condensada (asesor, cliente, bodega, turno, atajos).
- `src/views/pos/counter/CounterItemQuickEntry.tsx`: Cabecera de entrada rápida para escáner/SKU, precio y cantidad.
- `src/views/pos/counter/CounterCartTable.tsx`: Tabla pura de carrito virtualizada con `useVirtualGrid`.
- `src/views/pos/counter/CounterCartRow.tsx`: Fila individual de venta ultra ligera y de alto contraste sin imágenes.
- `src/views/pos/counter/CounterFinancialFooter.tsx`: Pie financiero con totales exactos en COP y botones de acción rápida.
- `src/views/pos/counter/CounterSearchModal.tsx`: Modal / cajón rápido de búsqueda masiva (F8) para 10.000 productos.
- `src/hooks/useCounterPosState.ts`: Hook orquestador de estado de mostrador (atajos F2/F6/F8/F10, carrito, selección).
- `src/tests/counterPosPerformance.test.ts`: Pruebas automatizadas de rendimiento de búsqueda sub-10ms y virtualización.
- `src/tests/counterPosWorkflow.test.tsx`: Pruebas de integración de la vista de mostrador, navegación por teclado y preventas.
