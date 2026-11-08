# Project: Reconstrucción Integral Ergonómica de Pantalla de Ventas POS (Estilo SaaS Maduro)

## Architecture
- **Patrón de Arquitectura**: Single Page Application en React 18, Vite, TypeScript estricto, Tailwind CSS y Supabase (`localDb` híbrido Dexie/IndexedDB).
- **Proporción y Balance de Pantalla (Benchmark SaaS Maduro 75/25)**:
  - **Área de Catálogo (Izquierda, ~75% de ancho)**:
    - Barra superior (`POSTopBar`): Input de código de barras, input de búsqueda con icono de lupa y botón "Crear Producto +" (conectado a `CrearProductoRapidoModal`).
    - Navegación de categorías (`POSCategoryTabs`): Pestañas horizontales dinámicas con flechas `←` `TODOS` `→`.
    - Cuadrícula de productos (`POSProductGrid`): Matriz espaciosa de 6 columnas × 3 filas (18 tarjetas por página), con nombre legible a 2 líneas, precio destacado en verde esmeralda (`#059669`) y click para agregar al carrito.
    - Paginación inferior (`POSPagination`): Controles explícitos `< Anterior 1 2 3 ... Siguiente >`.
  - **Panel de Carrito (Derecha, ~25% de ancho, `CartPanel`)**:
    - Selector de cliente superior compacto: Barra de 38px `👤 CONSUMIDOR FINAL` con iconos de búsqueda/edición y acciones.
    - Contenedor de líneas de venta desahogado: Ocupa el **75% a 80% de la altura vertical útil** (`flex-1 min-h-0 overflow-y-auto overscroll-contain`), eliminando la compresión de 40px y los artefactos blancos de contraste.
    - Fila de venta ergonómica (`LineaVentaRow`): Diseño 2-tier sin cortes de texto, con stepper táctil de 48px, unit price editable y subtotal destacado.
    - Barra inferior de carrito limpia: Resumen compacto de subtotales, botón primario verde "Vender $XX.XXX" y botón secundario tipo outline "Guardar" (En Espera F6).
    - Desacoplamiento de operaciones secundarias (`POSSecondaryActionsModal`): "Cerrar turno", "Ventas en espera", "Borradores", "Multicliente" y notas de corte reubicadas en menú secundario o modal para no saturar el flujo de venta.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Corrección de Sintaxis Crítica en CartPanel | Corregir `usa harneimport` en `CartPanel.tsx:1` por `import React...` para desbloquear la compilación de 15+ suites Vitest. | M1 | Survey (Exp 1, 2, Spec) |
| F2 | Eliminación de Artefactos Blancos y Rediseño LineaVentaRow | Eliminar clases conflictivas `bg-white` en `LineaVentaRow.tsx`, aplicando tokens de alto contraste WCAG AA+ y layout 2-tier ergonómico con stepper de 48px. | M1 | Survey (Exp 1, 2, Spec) |
| F3 | Carrito Vertical Desahogado (75-80% de Altura Útil) | Eliminar chrome fijo acumulado (~339px) en `CartPanel.tsx`, dedicando el 75-80% del alto a `pos-cart-items-list` con scroll aislado `flex-1 min-h-0 overflow-y-auto`. | M1 | Survey (Exp 1, 2, Spec) |
| F4 | Selector de Cliente Superior Compacto | Implementar barra superior de cliente de 38px (`👤 CONSUMIDOR FINAL`) con controles discretos de búsqueda, edición y reset sin desplazar la lista. | M1 | Survey (Exp 1, 2, Spec) |
| F5 | Reubicación de Operaciones Secundarias de Caja | Desacoplar "Cerrar turno", "Ventas en espera", "Borradores", "Multicliente" y notas de corte a un modal/dropdown secundario accesible (`POSSecondaryActionsModal`). | M2 | Survey (Exp 1, 2, Spec) |
| F6 | Barra Inferior de Carrito Limpia y Despejada | Pie condensado (`shrink-0 mt-auto`) con resumen compacto, botón primario "Vender $XX.XXX" y botón secundario "Guardar" (F6). | M1 | Survey (Exp 1, 2, Spec) |
| F7 | Barra Superior de Catálogo (Búsqueda, Barras y Crear Producto) | Barra superior en `POSView.tsx` con input de código de barras, input de búsqueda con lupa y botón "Crear Producto +" enlazado a `CrearProductoRapidoModal`. | M3 | Survey (Exp 1, Spec) |
| F8 | Pestañas de Categorías con Flechas de Navegación | Pestañas horizontales con flechas de desplazamiento `←` y `→`, selector activo en verde esmeralda y filtrado instantáneo. | M3 | Survey (Exp 1, Spec) |
| F9 | Cuadrícula de Productos Amplia de 6 Columnas (18 Tarjetas) | Matriz de 6 columnas × 3 filas con tarjetas limpias, nombre legible, precio visible en negrita verde esmeralda y click 1-tap para agregar. | M3 | Survey (Exp 1, Spec) |
| F10 | Paginación Explícita de Catálogo | Control de paginación `< Anterior 1 2 3 ... Siguiente >` en la base del catálogo para evitar scroll infinito descontrolado. | M3 | Survey (Exp 1, Spec) |
| F11 | Certificación de Pruebas Unitarias y de Componentes Vitest al 100% | Ejecución y pase al 100% de las 46 suites de pruebas Vitest relacionadas con POS, validando la preservación de todos los `data-testid`. | M4 | Survey (Spec Miner) |
| F12 | Verificación Interactiva con Chrome DevTools (Desktop y Móvil 375px) | Validación en navegador con Chrome DevTools: 0 errores en consola JS, ergonomía visual en mostrador y responsividad en móvil a 375px. | M4 | System / Request |
| F13 | Auditoría de Gobernanza Arquitectónica con Google Harness² | Verificación de invariantes, tokens y contratos con `run_agency_sdd_bridge.py` y `run_harness2.ps1` con 0 violaciones. | M4 | System / Request |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Remediación de Sintaxis y Rediseño Ergonómico de Carrito y Filas | `CartPanel.tsx`, `LineaVentaRow.tsx` (F1, F2, F3, F4, F6) | none | DONE (Passed Gate: 2 Reviewers APPROVE, 2 Challengers APPROVE, Auditor CLEAN) |
| M2 | Desacoplamiento de Operaciones Secundarias a Menú/Modal de Caja | `POSSecondaryActionsModal.tsx`, integración en `CartPanel.tsx` (F5) | M1 | DONE (Passed Gate: 2 Reviewers APPROVE, 2 Challengers APPROVE, Auditor CLEAN) |
| M3 | Reconstrucción de la Experiencia de Catálogo y Navegación POS | `POSTopBar.tsx`, `POSCategoryTabs.tsx`, `POSProductGrid.tsx`, `POSProductCard.tsx`, `POSPagination.tsx`, `POSView.tsx` (F7, F8, F9, F10) | M1, M2 | DONE (41/41 target tests, 52/52 regression tests, 0 tsc errors) |
| M4 | Final Milestone: Certificación Vitest 100%, Chrome DevTools y Harness² | Ejecución completa de pruebas, validación DevTools y Harness² (F11, F12, F13) | M1, M2, M3 | DONE (264/264 POS tests passing, Harness² exit 0, build exit 0, Auditor CLEAN) |

## Interface Contracts

### CartPanel ↔ LineaVentaRow
- Props requeridas: `linea: LineaVenta`, `stockDisponible: number`, `precioFinalDisplay: number`, `onUpdateCantidad`, `onUpdateDescuentoLinea`, `onRemove`, `onWeightRead`, `onUpdatePrecio`, `onResetItemPrice`.
- Contratos DOM / Tests:
  - Fila: `data-testid="cart-item-row-${linea.productoId}"` con clase `.cart-item-row`.
  - Nombre: `data-testid="cart-item-name-${linea.productoId}"` con clase `.cart-item-name`.
  - Precio: `data-testid="cart-item-price-${linea.productoId}"` con clase `.cart-item-price`.
  - Input: `data-testid="input-cantidad"` con `min-h-[48px]`.
  - Botones stepper: `min-w-[48px] min-h-[48px]`, `data-testid="btn-aumentar-cantidad"`, `data-testid="btn-disminuir-cantidad"`, `data-testid="btn-eliminar-linea"`.

### CartPanel ↔ Secondary Operations Popover / Modal
- Contrato de desacoplamiento:
  - Componente: `POSSecondaryActionsModal` o dropdown popover activable mediante icono `[⋮]` o botón "Más Acciones de Caja".
  - Operaciones encapsuladas: `onCerrarTurnoClick`, `onGuardarBorrador` (En Espera), listado de borradores activos (`drafts`), multicliente y notas de corte (`onOpenNotasModal`).
  - Badge visible en cabecera de carrito: Si `drafts.length > 0`, badge sutil `⏸ N en espera` que abre el modal sin consumir espacio vertical de la lista.

### POSView ↔ POSTopBar & Product Grid
- `POSTopBar`:
  - Input código de barras con listener `onKeyDown` (Enter) y botón de simulación.
  - Input búsqueda de productos con icono lupa y autofocus.
  - Botón "+ Crear Producto" que conmuta estado local `showCrearProductoModal: boolean` renderizando `<CrearProductoRapidoModal />`.
- `POSCategoryTabs`:
  - Flechas `←` y `→` que disparan `scrollBy({ left: +/- 200, behavior: 'smooth' })`.
  - Pestañas con clases activas en verde esmeralda (`bg-emerald-600 text-white`).
- `POSProductGrid`:
  - 18 productos por página (`currentPage`, `totalPages`, `pageSize = 18`).
  - Tarjetas con nombre completo a 2 líneas, precio prominente en verde esmeralda y click inmediato que invoca `onAgregarProducto(producto)`.
- `POSPagination`:
  - Botones `< Anterior`, números de página `1 2 3 ...`, y botón `Siguiente >`.

## Code Layout
- `src/views/pos/components/CartPanel.tsx`: Panel de carrito con selector de cliente compacto, lista de 75-80% de alto y pie con Vender/Guardar.
- `src/views/pos/components/LineaVentaRow.tsx`: Fila ergonómica 2-tier sin artefactos blancos.
- `src/views/pos/components/POSSecondaryActionsModal.tsx`: Modal / Menú para operaciones secundarias de caja (R3).
- `src/views/pos/components/POSTopBar.tsx`: Barra superior con lector de código de barras, buscador y botón "Crear Producto +".
- `src/views/pos/components/POSCategoryTabs.tsx`: Pestañas horizontales de categorías con flechas de navegación.
- `src/views/pos/components/POSProductGrid.tsx`: Cuadrícula espaciosa de 6 columnas con tarjetas optimizadas.
- `src/views/pos/components/POSProductCard.tsx`: Tarjeta individual de producto estilo SaaS maduro.
- `src/views/pos/components/POSPagination.tsx`: Controles de paginación explícita.
- `src/views/POSView.tsx`: Vista orquestadora principal limpia con división 75% catálogo y 25% carrito.
- `src/views/inventory/components/CrearProductoRapidoModal.tsx`: Modal de creación rápida existente reutilizado.
