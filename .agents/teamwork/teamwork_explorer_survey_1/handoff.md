# Reporte de Inspección y Diagnóstico de Arquitectura, Layout y Desbordamientos (375px & Desktop)
**Agente**: `teamwork_explorer_survey_1`  
**Misión**: Auditoría exhaustiva de arquitectura de layout, desbordamientos horizontales (`scrollWidth > clientWidth`) e inventario de componentes en las 4 pantallas operativas prioritarias de La Pezcadería ERP.  
**Fecha**: 2026-10-29T12:49:00Z  

---

## 1. Observation (Evidencias con Rutas Exactas y Líneas de Código)

A través de la inspección estática del árbol de componentes, clases CSS / Tailwind y estilos en línea, se detectaron las siguientes evidencias directas:

### A. Contenedores Raíz y Envolturas de Layout (Root Wrapper, Topbar, Sidebar)
- **`src/App.tsx:1458-1505`**:
  - Contenedor raíz: `className="flex h-screen w-screen overflow-hidden bg-[#070A10] ... relative"`
  - Envoltura principal: `className={"flex-1 flex flex-col min-w-0 h-full overflow-hidden transition-all duration-300 relative z-10 " + (sidebarOpen ? 'lg:pl-[284px]' : 'lg:pl-[88px]')}`
  - Contenedor `<main className={getMainLayoutClasses(currentView as string)}>`
- **`src/components/layout/layoutModes.ts:40-52`**:
  - Vistas fijas (`isTransactionalFixedView` para `pos`, `kanban`, `dashboard`, `caja`, `alistamiento`, `despachos`):
    `return "flex-1 px-2.5 pb-2 lg:px-3 lg:pb-2.5 pt-0 overflow-hidden flex flex-col h-[calc(100vh-theme(spacing.12)-theme(spacing.3))] min-h-0"`
  - Vistas documentales (`clientes`, `inventario`):
    `return "flex-1 px-2.5 pb-2 lg:px-3 lg:pb-2.5 pt-0 overflow-y-auto custom-scrollbar min-h-0"`
- **`src/components/layout/EnterpriseTopbar.tsx:101-286`**:
  - Encabezado: `className="h-12 mx-2.5 mt-1.5 mb-1 flex items-center justify-between px-3.5 lg:px-5 rounded-2xl bg-slate-900/85 backdrop-blur-2xl border border-white/12 text-slate-200 select-none z-30 sticky top-1.5 shadow-xl transition-all duration-200"`
  - Sección Izquierda: Breadcrumb con `max-w-[140px]` (`line 127`).
  - Sección Derecha: Selector de empresa multi-tenant con `max-w-[90px]` (`line 148`), botón Omnibox (`line 155`), botón Facturar POS (`line 178`), selector de tema (`line 194`), y avatar con menú de cambio de usuario (`line 251`).
  - Ancho acumulado estático en mobile: A 375px de viewport, restando `mx-2.5` (20px) y `px-3.5` (28px), el ancho interno es de 327px. Los elementos en `justify-between` suman >420px sin `flex-wrap`, provocando colapso o recorte de los controles interactivos.

---

### B. Pantalla Prioritaria 1: POS Táctil Multivendedor (`AppRouteId.POS = 'pos'`)
- **Archivo Principal**: `src/views/POSView.tsx` (3,299 líneas, 155 KB)
- **Componentes Secundarios**:
  - `src/views/pos/components/ProductSearchPanel.tsx` (307 líneas)
  - `src/views/pos/components/CartPanel.tsx` (714 líneas)
  - `src/views/pos/components/LineaVentaRow.tsx` (349 líneas)
  - `src/views/pos/components/ParkedOrdersBar.tsx` (124 líneas)
  - `src/views/pos/components/PaymentPanel.tsx` (796 líneas)
  - `src/views/pos/components/PendingOrdersDrawer.tsx` (230 líneas)
  - `src/views/pos/components/SupervisorPinModal.tsx`, `AperturaCajaModal.tsx`, `RetiroParcialModal.tsx`, `OnScreenKeypadModal.tsx`.
- **Puntos Críticos de Desbordamiento y Maquetación**:
  1. **Layout Móvil de Grilla / Flex**:
     - `src/views/POSView.tsx:2276`:
       `className="flex-1 min-h-0 w-full flex flex-col lg:grid lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] gap-2.5 pt-0.5 overflow-hidden"`
     - En pantallas `< lg` (incluyendo móvil 375px), el catálogo y el carrito se apilan en `flex flex-col` dentro de un contenedor rígido `overflow-hidden` con altura `100vh`. La columna del carrito (`src/views/POSView.tsx:2295`) tiene `className="flex flex-col min-h-0 h-full overflow-hidden"`, lo que empuja el carrito fuera de la pantalla sin permitir al cajero o asesor alternar entre el catálogo de productos y el carrito de compras. No existe un tab switcher móvil (`Catálogo` / `Carrito`).
  2. **Barra de KPIs de Turno en POS**:
     - `src/views/POSView.tsx:2226-2271`:
       `data-testid="pos-kpi-bar" className="min-h-[36px] h-9 px-3 bg-slate-900/85 backdrop-blur-2xl border border-white/12 rounded-xl shadow-md flex items-center justify-between gap-3 text-xs shrink-0 select-none overflow-x-auto"`
     - Contiene 4 KPIs (`shrink-0`), totalizando más de 520px de ancho mínimo; aunque tiene `overflow-x-auto`, en viewport de 375px fuerza scroll lateral interno sin indicadores visuales.
  3. **Barra de Asesores de Mostrador (Ferretería Josase)**:
     - `src/views/POSView.tsx:1980-2017`:
       `className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 ..."` con chips horizontales `overflow-x-auto custom-scrollbar`. En 375px los botones de los 5 asesores (`VENDEDORES_JOSASE`) funcionan bien si no desbordan el contenedor padre, pero el badge de vendedor (`line 1948`) y el botón `pos-btn-cambiar-vendedor` pueden saturar la primera fila.
  4. **Formulario de Búsqueda y Código de Barras**:
     - `src/views/pos/components/ProductSearchPanel.tsx:127-147`:
       `<form onSubmit={handleBarcodeSubmit} style={{ display: 'flex', gap: '6px' }}>`
       `<div style={{ width: '180px' }}>`
       `<button ... className="... whitespace-nowrap ...">Simular Scan</button>`
       Este formulario rígido tiene un ancho fijo innegociable de 180px + 6px + ~115px = 301px, que sumado a `style={{ flex: 1, minWidth: '220px' }}` (`line 119`) en la barra de búsqueda de productos supera los 520px. En 375px con padding colapsa la fila o fuerza scroll horizontal.
  5. **Barra de Carritos en Espera (`ParkedOrdersBar`)**:
     - `src/views/pos/components/ParkedOrdersBar.tsx:26-46`:
       `<div className="flex items-center justify-between text-[11px] text-slate-600 font-semibold">`
       Izquierda: "Ventas en Espera & Multicliente" (~190px). Derecha: Botón "Suspender & Nueva Venta" (~160px). Suma: 350px sin `flex-wrap`, dentro de un ancho disponible de ~319px en móvil de 375px, causando desbordamiento lateral.
  6. **Fila de Producto en Carrito (`LineaVentaRow`)**:
     - `src/views/pos/components/LineaVentaRow.tsx:208`:
       `<div className="flex items-center justify-between gap-2 flex-wrap pt-1.5 ...">`
       El botón de eliminar (`line 198`) cumple `min-w-[48px] min-h-[48px]`, pero los precios, stock y botones de incremento/decremento (`line 300`) en pantallas estrechas pueden comprimir el nombre del producto si no cuenta con `min-w-0 flex-1 truncate`.

---

### C. Pantalla Prioritaria 2: Caja Única de Recaudo y Liquidación Centralizada (`AppRouteId.CASH_DESK = 'caja'`)
- **Archivos Principales**:
  - `src/views/cash/CashFlowView.tsx` (537 líneas, 28 KB)
  - `src/views/pos/components/CashierKanbanView.tsx` (472 líneas, 22 KB)
  - Modales: `ArqueoCajaModal.tsx`, `CalculadorDenominaciones.tsx`, `EgresoOperativoModal.tsx`, `TrasladoDineroModal.tsx`.
- **Puntos Críticos de Desbordamiento y Arquitectura**:
  1. **Header Selector de Bodega y Caja**:
     - `src/views/cash/CashFlowView.tsx:166-188`:
       `<div className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-md border border-white/10 p-2 rounded-xl shadow-lg">`
       Contiene: "Bodega:" + `<select>` (min-w ~130px) + "Caja:" + `<select>` (min-w ~140px). Sin `flex-wrap`. Total ancho: ~340px. Al sumar los paddings laterales del contenedor (`p-4 md:p-6` en `line 159` más `px-2.5` en `layoutModes.ts`), el espacio disponible a 375px es de 323px, resultando en `scrollWidth > clientWidth` (Blowout de ~25px a 375px).
  2. **Tabla de Movimientos de Caja**:
     - `src/views/cash/CashFlowView.tsx:380-450`:
       `<table className="w-full text-left border-collapse">` con 4 columnas fijas (`Hora`, `Categoría`, `Detalle`, `Monto`). Celdas con `px-5 py-3.5 whitespace-nowrap`. El ancho intrínseco de la tabla es de al menos 460px. Aunque el contenedor (`line 373`) tiene `overflow-auto`, en móviles requiere scroll horizontal y carece de visualización responsive basada en tarjetas de movimiento.
  3. **Desconexión Arquitectónica de `CashierKanbanView`**:
     - `CashierKanbanView.tsx` fue diseñado específicamente para la "Caja Única de Recaudo Multivendedor" (SPEC-037 / SPEC-041) con 3 columnas (`En Espera de Cobro`, `En Cobro`, `Pagadas / Despachadas`), avatar stack y cobro directo F9.
     - **Hallazgo Crítico**: Actualmente `CashierKanbanView` NO está renderizado en la ruta `caja` (`src/views/cash/CashFlowView.tsx` solo muestra el control financiero de efectivo/egresos). En `POSView.tsx:2111` se utiliza `PendingOrdersDrawer.tsx`. La experiencia de Caja Única centralizada está fragmentada entre el flujo de turnos tradicional y el Kanban de preventas.

---

### D. Pantalla Prioritaria 3: Tablero Kanban de Seguimiento a Ventas y Comandas (`AppRouteId.ORDERS_KANBAN = 'kanban'`)
- **Archivo Principal**: `src/views/OrderKanbanView.tsx` (1,393 líneas, 68 KB)
- **Componentes Auxiliares**: `WeightPackingModal.tsx`, `WmsRemisionModal.tsx`, `RouteManifestBuilderModal.tsx`.
- **Puntos Críticos de Desbordamiento y Ergonomía**:
  1. **Ancho Fijo de Columnas Kanban**:
     - `src/views/OrderKanbanView.tsx:862`:
       `className="flex-shrink-0 w-80 flex flex-col h-full max-h-full min-h-0 p-0 rounded-2xl overflow-hidden ..."`
     - Cada columna tiene `w-80` (320px). En viewport de 375px, restando los paddings (`p-2.5 sm:p-3` en `line 629` = 20px, más `px-2.5` de `layoutModes.ts` = 20px), el espacio visible neto es de 335px. Una columna de 320px cabe justa en la pantalla, pero al existir entre 3 y 5 columnas (`flex gap-3 overflow-x-auto`), el contenedor exige desplazamiento horizontal.
  2. **Interacciones Táctiles vs Drag and Drop HTML5**:
     - En dispositivos móviles táctiles (375px), el drag and drop nativo de HTML5 (`draggable`, `onDragStart`, `onDrop`) no se dispara con toques de pantalla estándar.
     - **Acierto identificado**: La vista ya implementa `activeTab === 'tactil_3_pasos'` (`lines 1212-1332`) con botones táctiles explícitos (`Pesar`, `A Ruta`, `Entregado`) que cumplen `min-h-[48px] h-12` (Ley de Fitts). Sin embargo, cuando el usuario entra en las pestañas `bodega` o `despacho`, en móvil no hay botones directos para mover de columna sin arrastre.
  3. **Barra de Acciones de Manifiesto**:
     - `src/views/OrderKanbanView.tsx:769-804`:
       La barra flotante de pedidos seleccionados utiliza `flex-col sm:flex-row`, pero el botón `line 798` ("🚚 Crear Manifiesto de Carga (N)") con textos largos puede tocar los bordes a 375px si no se truncan los subtítulos de kg y pesos.

---

### E. Pantalla Prioritaria 4: Catálogos y Listas de Clientes y Productos
#### E.1 Catálogo y Directorio de Clientes (`AppRouteId.CLIENTS = 'clientes'`)
- **Archivo Principal**: `src/views/ClientsView.tsx` (446 líneas, 25 KB)
- **Puntos Críticos de Desbordamiento Severo a 375px**:
  1. **Contenedor Principal con Estilos Rígidos**:
     - `src/views/ClientsView.tsx:155`:
       `<div className="pos-container" style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>`
       `padding: 24px` resta 48px en horizontal. En viewport de 375px quedan únicamente 327px.
  2. **Encabezado Sin `flex-wrap`**:
     - `src/views/ClientsView.tsx:157-179`:
       `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>`
       Título `h2` (~220px) + Botones "Importar CSV" y "Nuevo Cliente" (~290px). Total = 510px en una sola línea sin `flex-wrap: wrap`. Causa inmediata de desbordamiento horizontal en pantallas < 550px.
  3. **División de Columnas con Ancho Rígido Innegociable**:
     - `src/views/ClientsView.tsx:181-183`:
       `<div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>`
       `<div style={{ flex: '0 0 350px', display: 'flex', flexDirection: 'column', gap: '16px' }}>`
       **Causa de Blowout Crítico**: La columna izquierda de la lista de clientes está forzada a `flex: 0 0 350px` sin `flex-wrap` en el contenedor padre. Al sumar `gap: 24px` y el formulario derecho (`flex: 1`, min ~300px), el ancho total mínimo de la vista es de **674px**.
       En cualquier pantalla móvil de 375px, la vista de Clientes produce un desbordamiento horizontal masivo de **~350px extra** (`scrollWidth ~ 720px > clientWidth 375px`).

#### E.2 Catálogo de Productos y Existencias (`AppRouteId.INVENTORY = 'inventario'`)
- **Archivos Principales**:
  - `src/views/InventoryView.tsx` (2,215 líneas, 97 KB)
  - `src/views/inventory/components/ProductTable.tsx` (318 líneas, 15 KB)
  - `src/views/inventory/components/StockMatrizTable.tsx` (427 líneas, 24 KB)
- **Puntos Críticos de Desbordamiento y Rendimiento**:
  1. **Tabla de Productos (`ProductTable.tsx`)**:
     - `src/views/inventory/components/ProductTable.tsx:75-80`:
       Encabezado de la tabla con `justify-content: space-between` y botones de "Importar Excel" y "Nuevo Producto" que no tienen `flex-wrap` en pantallas < 500px.
     - `ProductTable.tsx:187-199`: Tabla con 8 columnas (`Imagen`, `SKU`, `Nombre y Categoría`, `Clasificación ABC`, `Stock Total`, `Precio Venta`, `Estado`, `Acciones`). Requiere un ancho mínimo de ~820px. Aunque está envuelta en `overflow-x-auto`, en 375px no existe modo de visualización en tarjetas móviles (card view), haciendo que el usuario deba deslizar lateralmente para consultar precios o editar.
  2. **Matriz Multibodega (`StockMatrizTable.tsx`)**:
     - `StockMatrizTable.tsx:229-234`:
       Columnas fijas `sticky left-0` (ABC, ~48px) y `sticky left-12` (SKU, ~80px). En móvil de 375px, las columnas fijas ocupan ~130px (más del 35% de la pantalla), dejando escaso espacio para visualizar los stocks de cada bodega en la porción deslizable.
  3. **Barra de 12 Pestañas en Inventario**:
     - `src/views/InventoryView.tsx:1659`:
       `<div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 dark:border-white/10 scrollbar-none">`
       Desplazamiento horizontal fluido (`overflow-x-auto`), no rompe el viewport exterior pero se beneficiaría de un menú desplegable de navegación rápida en pantallas móviles.

---

## 2. Logic Chain (Cadena Lógica de Diagnóstico y Causa Raíz)

1. **Premisa**: El criterio de aceptación exige que en viewport móvil de **375px** y en escritorio no exista desbordamiento horizontal no intencionado (`scrollWidth <= clientWidth` en el contenedor de vista y ventana) y que los elementos interactivos cumplan con un área mínima táctil de 44x44px / 48x48px (Leyes de Fitts y Jakob).
2. **Eslabón 1 (Layout Shell)**:
   - En `src/App.tsx`, el contenedor exterior tiene `overflow-hidden` y `w-screen`. Esto disfraza el desbordamiento evitando la barra de scroll en `<body>`, pero genera recorte destructivo (*horizontal clipping*) del contenido en los componentes hijos si estos superan los 375px.
   - En `EnterpriseTopbar.tsx`, los 6 controles de la derecha (`tenant selector`, `omnibox`, `bodega`, `facturar pos`, `theme`, `user profile`) suman ~290px de ancho mínimo, que al competir con el breadcrumb izquierdo (~200px) sobrepasan los 327px netos a 375px.
3. **Eslabón 2 (POS Táctil)**:
   - En `POSView.tsx:2276`, el cambio de `lg:grid` a `flex flex-col` en móvil apila Catálogo y Carrito verticalmente. Dado que la pantalla móvil tiene altura finita (667px - 812px) y el contenedor tiene `overflow-hidden`, el Carrito queda sepultado fuera del campo visual. El usuario móvil no puede visualizar lo que agrega al carrito sin una pestaña o drawer alternador.
   - En `ParkedOrdersBar.tsx:26`, el contenedor `justify-between` sin `flex-wrap` fuerza 350px de ancho intrínseco en un contenedor de 319px, causando desbordamiento directo.
   - En `ProductSearchPanel.tsx:127`, el formulario de escaneo tiene `width: '180px'` + botón `Simular Scan` sin envolver, provocando desbordamiento si la búsqueda está en la misma línea.
4. **Eslabón 3 (Caja Única)**:
   - En `CashFlowView.tsx:166`, el selector agrupado de Bodega y Caja tiene ancho intrínseco de ~340px sin `flex-wrap`, provocando desbordamiento en viewport de 375px donde el ancho neto es 323px.
   - Además, la ausencia de renderizado de `CashierKanbanView` en las rutas activas impide a los cajeros operar el flujo de liquidación centralizada multivendedor de forma ergonómica.
5. **Eslabón 4 (Kanban de Comandas)**:
   - En `OrderKanbanView.tsx:862`, las columnas de 320px (`w-80`) funcionan bien en `overflow-x-auto` dentro de su contenedor, pero en móvil táctil los usuarios no pueden arrastrar tarjetas en las pestañas `bodega` y `despacho`, dependiendo exclusivamente del modo `tactil_3_pasos`.
6. **Eslabón 5 (Catálogos de Clientes y Productos)**:
   - En `ClientsView.tsx:183`, la asignación de `flex: '0 0 350px'` sin `flex-wrap` es una violación flagrante de diseño responsivo brownfield. Causa matemática demostrada: $350\text{px} + 24\text{px (gap)} + 300\text{px (form)} + 48\text{px (padding)} = 722\text{px} > 375\text{px}$, generando un desbordamiento horizontal de 347px.
   - En `ProductTable.tsx`, la tabla de 8 columnas requiere scroll horizontal continuo sin una vista alternativa en tarjeta o lista compacta.
7. **Conclusión Lógica**: El frontend contiene tanto desbordamientos duros (`scrollWidth > clientWidth` en `ClientsView`, `CashFlowView` y `ParkedOrdersBar`) como desbordamientos por recorte/invisibilidad (`hidden overflow clipping` en `POSView` mobile).

---

## 3. Caveats (Restricciones y Supuestos de Investigación)

1. **Modo Estrictamente Read-Only**: En cumplimiento del rol `explorer`, no se ha modificado ningún archivo de código fuente del proyecto (`src/**`). Todas las observaciones y diagnósticos se basan en el análisis estático del código y la suite de pruebas.
2. **Resoluciones de Prueba**: El análisis se enfocó primariamente en móvil estándar **375px x 667px** (iPhone SE / estándar brownfield) y escritorio estándar **1366x768** / **1920x1080** (laptops y pantallas táctiles de mostrador POS).
3. **Hardware Externo Desconectado**: Básculas de puerto serial (RS-232 / WebSerial), impresoras térmicas ESC/POS y datafonos integrados operan en modo simulación/fallback en entorno de desarrollo.

---

## 4. Conclusion (Inventario de Componentes y Hallazgos Consolidados)

### Tabla de Inventario de Pantallas y Componentes Auditados

| Pantalla Prioritaria | Ruta / Vista Principal | Componentes y Subcomponentes Involucrados | Causa de Desbordamiento a 375px | Severidad |
| :--- | :--- | :--- | :--- | :--- |
| **1. POS Táctil Multivendedor** | `src/views/POSView.tsx` (`AppRouteId.POS`) | `ProductSearchPanel.tsx`<br/>`CartPanel.tsx`<br/>`LineaVentaRow.tsx`<br/>`ParkedOrdersBar.tsx`<br/>`PaymentPanel.tsx`<br/>`PendingOrdersDrawer.tsx` | - Catálogo y Carrito apilados en `overflow-hidden` sin tab switcher móvil.<br/>- `ParkedOrdersBar.tsx:26`: `justify-between` sin `flex-wrap` (350px > 319px).<br/>- `ProductSearchPanel.tsx:127`: formulario escáner rígido (301px). | **ALTA** |
| **2. Caja Única y Liquidación** | `src/views/cash/CashFlowView.tsx` (`AppRouteId.CASH_DESK`) | `CashierKanbanView.tsx`<br/>`ArqueoCajaModal.tsx`<br/>`CalculadorDenominaciones.tsx`<br/>`EgresoOperativoModal.tsx`<br/>`TrasladoDineroModal.tsx` | - `CashFlowView.tsx:166`: Selectores Bodega/Caja en línea sin wrap (~340px > 323px).<br/>- Tabla de movimientos de 4 columnas fijas (~460px de ancho).<br/>- `CashierKanbanView` no integrado en la navegación activa de Caja. | **ALTA** |
| **3. Tablero Kanban de Comandas** | `src/views/OrderKanbanView.tsx` (`AppRouteId.ORDERS_KANBAN`) | `WeightPackingModal.tsx`<br/>`WmsRemisionModal.tsx`<br/>`RouteManifestBuilderModal.tsx` | - Columnas fijas `w-80` (320px) bien contenidas en `overflow-x-auto`, pero drag-and-drop HTML5 no responde a toques móviles en pestañas 1 y 2. | **MEDIA** |
| **4. Directorio de Clientes** | `src/views/ClientsView.tsx` (`AppRouteId.CLIENTS`) | `SmartAutofillModal.tsx`<br/>`BulkUploadModal.tsx` | - **CRÍTICO**: `flex: '0 0 350px'` en columna izquierda sin `flex-wrap` en contenedor padre ($722\text{px} > 375\text{px}$).<br/>- Header con botones en línea sin wrap ($510\text{px} > 327\text{px}$). | **CRÍTICA** |
| **5. Catálogo de Productos** | `src/views/InventoryView.tsx` (`AppRouteId.INVENTORY`) | `ProductTable.tsx`<br/>`StockMatrizTable.tsx`<br/>`ProductForm.tsx`<br/>`CategoryManager.tsx` | - `ProductTable.tsx`: tabla de 8 columnas fijas (~820px) sin vista en tarjetas móviles.<br/>- `StockMatrizTable.tsx`: dos columnas `sticky` ocupan ~130px de 375px en móvil. | **MEDIA** |
| **Layout Global** | `src/App.tsx`<br/>`EnterpriseTopbar.tsx` | `EnterpriseSidebar.tsx`<br/>`GlobalOmniboxModal.tsx`<br/>`layoutModes.ts` | - `EnterpriseTopbar.tsx:101`: 6 botones a la derecha saturan el ancho a 375px ($> 420\text{px} > 327\text{px}$). | **MEDIA** |

---

## 5. Recommended Fix Strategy for Workers (Estrategia de Solución para Implementadores)

Para resolver estos desbordamientos sin romper las integraciones ni la suite de pruebas existente, se recomienda a los agentes implementadores seguir este plan de acción técnico:

### 1. Corrección Quirúrgica en `ClientsView.tsx` (Prioridad Inmediata)
- **Reemplazar estilos fijos en línea por clases responsivas de Tailwind**:
  - En `src/views/ClientsView.tsx:155`: Cambiar `style={{ padding: '24px' }}` por `className="p-3 sm:p-6 max-w-[1600px] mx-auto w-full overflow-hidden"`.
  - En `line 157`: Agregar `flex-wrap gap-3` en el contenedor del header para que los botones "Importar" y "Nuevo Cliente" pasen a una segunda fila en móvil.
  - En `line 181`: Cambiar el contenedor de flex rígido por:
    `className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-stretch lg:items-start w-full min-w-0"`.
  - En `line 183`: Cambiar `style={{ flex: '0 0 350px' }}` por:
    `className="w-full lg:w-[350px] lg:shrink-0 flex flex-col gap-4 min-w-0"`.
  - En `line 205`: Ajustar `maxHeight` dinámico para no colapsar la pantalla en pantallas pequeñas.

### 2. Corrección de Vista Móvil en `POSView.tsx` (Catálogo vs Carrito)
- **Incorporar un conmutador de pestaña móvil (Mobile Tab Switcher)**:
  - En `< lg` (móvil 375px), agregar un selector de 2 pestañas fijas en la parte inferior o superior: `[ Catálogo (N) ]` | `[ Carrito ($Total) ]`.
  - Cuando la pestaña activa sea `catalogo`, renderizar `ProductSearchPanel` con `flex-1`; cuando sea `carrito`, renderizar `CartPanel` con `flex-1`.
  - En pantallas `>= lg`, mantener la grilla actual de 2 columnas `lg:grid lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]`.
- **Ajustar `ParkedOrdersBar.tsx`**:
  - En `line 26`: Agregar `flex-wrap gap-2` al encabezado para evitar que "Ventas en Espera" y "Suspender & Nueva Venta" desborden en 375px.
- **Ajustar `ProductSearchPanel.tsx`**:
  - En `lines 127-147`: Envolver el formulario de código de barras con `flex-wrap sm:flex-nowrap` y ancho relativo `w-full sm:w-auto` con `max-w-full`.

### 3. Corrección en `CashFlowView.tsx` y Unificación con `CashierKanbanView`
- **Ajustar selectores de cabecera**:
  - En `src/views/cash/CashFlowView.tsx:166`: Agregar `flex-wrap gap-2` y `w-full sm:w-auto` a los selects de Bodega y Caja.
- **Integrar pestaña o modo "Caja Única / Recaudo Multivendedor"**:
  - Agregar un conmutador de subvistas en `CashFlowView` o habilitar una pestaña para alternar entre "Arqueo & Flujo de Efectivo" y "Tablero Kanban de Preventas (`CashierKanbanView`)", permitiendo liquidar comandas y preventas centralizadas en un solo lugar.
- **Tabla de movimientos**:
  - Implementar un diseño de tarjeta colapsable (`block sm:hidden`) para pantallas < 640px, reservando la tabla HTML para pantallas >= 640px.

### 4. Corrección en `EnterpriseTopbar.tsx`
- En `EnterpriseTopbar.tsx:136`:
  - Ocultar en móvil (`hidden sm:flex`) el botón selector de tema o compactarlo en el menú de usuario.
  - Asegurar que el selector de tenant tenga `max-w-[80px]` en móvil y que el breadcrumb tenga `truncate max-w-[100px]`.

---

## 6. Verification Method (Método de Verificación Independiente)

1. **Inspección de Desbordamiento en Chrome DevTools MCP**:
   - Emular viewport móvil: ancho **375px**, alto **667px**.
   - Ejecutar script de evaluación en cada una de las 4 rutas (`/pos`, `/caja`, `/kanban`, `/clientes`, `/inventario`):
     ```javascript
     const hasOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;
     console.log('Horizontal Overflow:', hasOverflow, {
       scrollWidth: document.documentElement.scrollWidth,
       clientWidth: document.documentElement.clientWidth
     });
     ```
   - Condición de éxito: `document.documentElement.scrollWidth <= document.documentElement.clientWidth` (0 desbordamiento horizontal).
2. **Verificación de Targets Táctiles (Ley de Fitts)**:
   - Inspeccionar con DevTools que todos los botones de acción principal en POS y Caja tengan `getBoundingClientRect().height >= 44px` y `width >= 44px`.
3. **Ejecución de Suite Vitest**:
   - Ejecutar en terminal: `npx vitest run`
   - Validar que el 100% de las suites existentes continúen pasando en verde.
