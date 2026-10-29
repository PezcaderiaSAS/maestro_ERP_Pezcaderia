# Informe Exhaustivo de Inspección y Auditoría Ergonómica, Leyes de UX y Tokens de Diseño

**Agente:** `teamwork_explorer_survey_2` (Explorer / Read-Only Audit)  
**Fecha:** 2026-10-29  
**Misión:** Auditoría ergonómica integral de pantallas operativas clave (POS Multivendedor, Caja Centralizada, Tablero Kanban y Catálogos de Clientes/Productos) bajo las 5 leyes de UX (Fitts, Hick, Doherty, Miller, Jakob), estándares WCAG 2.2 AA+ (4.5:1 / 7:1) y tokens de diseño canónicos (`erp-pos-design-tokens`, `stitch.json`, Tailwind).

---

## 1. Observation (Evidencias Empíricas por Pantalla y Módulo)

### 1.1. Pantalla 1: POS Táctil Multivendedor, Barra de Mostrador y Preventas
- **Barra de Asesores de Mostrador (`POSView.tsx:1990-2015`)**:
  ```tsx
  <button
    key={v.id}
    id={`btn-vendedor-${v.id}`}
    onClick={() => { setSelectedVendorJosase(v.id); ... }}
    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-95 ...`}
  >
    {v.corto}
  </button>
  ```
  *Evidencia:* `py-1` aplica 4px superior y 4px inferior. Con tipografía `text-xs` (line-height ~16px), la altura total del botón es de **24px**, violando flagrantemente la dimensión mínima táctil de 44x44px de la Ley de Fitts.
- **Badge de Terminal y Vendedor Activo (`TerminalVendorBadge.tsx:50-101`)**:
  ```tsx
  <button
    data-testid="btn-toggle-terminal-select"
    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-300 font-mono font-bold ..."
  >
  <button
    data-testid="btn-cambiar-vendedor"
    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/60 text-slate-200 font-medium ..."
  >
  ```
  *Evidencia:* `py-1.5` produce una altura total interactiva de **26px a 28px**. Ambos botones táctiles están severamente subdimensionados para terminales táctiles.
- **Acciones Rápidas del POS (`POSView.tsx:2100-2162`)**:
  - Botón Comandas (`btn-open-comandas-drawer`): `py-1.5 px-2.5 text-xs` (~28px de altura).
  - Botón Balanza: `py-1.5 px-2.5 text-xs` (~28px de altura).
  - Menú Desplegable "Más Acciones..." (`pos-more-actions-dropdown`): `py-1.5 px-2.5 text-xs` (~28px de altura).
- **Desbordamiento Horizontal en Modal SweetAlert2 de Clientes (`POSView.tsx:418-435`)**:
  ```tsx
  const { value: selectedCliente } = await Swal.fire({
    title: 'Vincular Cliente al Pedido',
    width: '550px',
    html: `... <input type="text" id="swal-client-search" style="margin: 0 0 10px 0; width: 100%;" /> ...`
  });
  ```
  *Evidencia:* Ancho rígido `width: '550px'` hardcodeado. En viewport móvil de 375px (`375px < 550px`), el modal desborda la pantalla provocando scroll horizontal forzado (`scrollWidth > clientWidth`).
- **Botón `+ Split` (Modo Mixto) en Panel de Pagos (`PaymentPanel.tsx:407-416`)**:
  ```tsx
  <button
    className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ...`}
    disabled={isDisabled}
  >
    <Calculator size={13} />
    {isModoMixto ? 'Cobro Único' : '+ Split'}
  </button>
  ```
  *Evidencia:* Altura de **24px** con texto `11px`, inaccesible para dedos de operarios en mostrador.
- **Buscador de Productos e Input de Código de Barras (`ProductSearchPanel.tsx:109-148`)**:
  ```tsx
  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
    <div style={{ flex: 1 }}>
      <Input ... className="min-h-[40px] h-10 text-sm ..." />
    </div>
    <form onSubmit={handleBarcodeSubmit} style={{ display: 'flex', gap: '6px' }}>
      <div style={{ width: '180px' }}>
        <Input ... className="min-h-[40px] h-10 text-sm ..." />
      </div>
      <button ... className="min-h-[40px] h-10 px-3 whitespace-nowrap text-xs ...">Simular Scan</button>
    </form>
  </div>
  ```
  *Evidencia:* En pantalla móvil (375px), el contenedor flex no tiene `flex-wrap: wrap`. La suma del input (min-w ~150px) + código de barras (180px) + botón scan (110px) = >440px, generando un desbordamiento horizontal garantizado en 375px. Asimismo, `min-h-[40px]` incumple los 44px de Fitts.
- **Tarjeta de Producto Saturada en Catálogo POS (`ProductSearchPanel.tsx:248-298`)**:
  *Evidencia:* Cada tarjeta muestra simultáneamente: avatar, badge kilos/unidad, dot semafórico de stock, nombre, precio, etiqueta precio cliente, campos dinámicos y 3 filas completas de stock desglosadas por almacén (`Bod. Principal`, `Bod. Secundaria`, `Bod. Averías`).

---

### 1.2. Pantalla 2: Caja Única de Recaudo y Liquidación Centralizada
- **Fondo Oscuro Hardcodeado y Selectores Subdimensionados (`CashFlowView.tsx:159-188`)**:
  ```tsx
  <div className="p-4 md:p-6 bg-[#070A10] text-slate-100 min-h-full flex-1 overflow-y-auto">
  ...
  <select className="... px-2.5 py-1 text-sm ...">
  ```
  *Evidencia:* Fondo fijo `#070A10` impide la operación en Light Mode. Los dos selects de cabecera (`Bodega` y `Caja`) tienen `py-1`, midiendo solo 28px de altura interactiva.
- **Botones de Pestañas de Filtrado Diario (`CashFlowView.tsx:304-369`)**:
  ```tsx
  <button
    onClick={() => setFiltroTab('TODO')}
    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ...`}
  >
  ```
  *Evidencia:* Botones de filtrado rápido (`Todo`, `Ventas`, `Fletes`, `Pescado`, `Gastos` y dinámicas) utilizan `py-1.5 text-xs`, generando una altura de **28px** (incumple el mínimo de 44px).
- **Mutación de Array durante el Renderizado de la Tabla (`CashFlowView.tsx:391`)**:
  ```tsx
  {movimientosFiltrados
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(mov => { ... })}
  ```
  *Evidencia:* Se ejecuta `.sort()` directamente sobre el array derivado en pleno ciclo de renderizado de React sin `useMemo`, mutando la estructura interna en cada render.
- **Tabla de Movimientos Diarios y Viewport Móvil (`CashFlowView.tsx:380-415`)**:
  *Evidencia:* Tabla de 4 columnas con `px-5 py-3.5 whitespace-nowrap` en Hora, Categoría y Monto sin transformación responsiva a vista de tarjetas (card layout) para móviles, causando scroll lateral apretado en pantallas estrechas.
- **Botón Selector de Modo Ciego en Arqueo (`ArqueoCajaModal.tsx:305-321`)**:
  *Evidencia:* Mientras que el botón de alternar modo ciego mide `min-h-[44px]`, el botón de cerrar modal (`X size={22}`) utiliza `p-2`, alcanzando solo ~36px de touch target.

---

### 1.3. Pantalla 3: Tablero Kanban de Ventas y Comandas en Tiempo Real
- **Chips de Asesor en Tablero de Caja Única (`CashierKanbanView.tsx:158-185`)**:
  ```tsx
  <button
    onClick={() => setFiltroAsesor('TODOS')}
    className={`px-3 py-1 rounded-xl text-xs font-bold ...`}
  >
  <button
    key={a.id}
    onClick={() => setFiltroAsesor(a.id)}
    className={`px-3 py-1 rounded-xl text-xs font-semibold ...`}
  >
  ```
  *Evidencia:* Los chips de filtro por asesor tienen `py-1` (4px superior/inferior), midiendo **24px de altura**, lo que ocasiona pulsaciones erróneas y frustración operativa en pantallas táctiles de caja.
- **Botón de Paso a Cobro Rápido (`CashierKanbanView.tsx:278-285`)**:
  ```tsx
  <button
    data-testid={`btn-iniciar-cobro-${pref.id}`}
    onClick={() => iniciarCobro(pref)}
    className="w-full mt-2.5 py-1.5 px-3 rounded-xl bg-cyan-600/90 hover:bg-cyan-500 text-white text-xs font-bold ... flex items-center justify-center gap-1.5 ..."
  >
    <span>Pasar a Cobro (F9)</span>
  </button>
  ```
  *Evidencia:* Botón clave de flujo operativo con `py-1.5 text-xs` (~28px de altura), incumpliendo los 44px de Fitts.
- **Filtro de Búsqueda sin Debounce (`OrderKanbanView.tsx:720-724`)**:
  ```tsx
  <input
    type="text"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    placeholder="Buscar por cliente, pedido # o producto..."
    ...
  />
  ```
  *Evidencia:* Cada carácter tecleado filtra de manera síncrona la lista combinada (`combinedOrders`) en caliente sin debounce ni diferimiento (`useDeferredValue`).
- **Conflicto de Dimensiones en Input de Búsqueda (`OrderKanbanView.tsx:716`)**:
  ```tsx
  <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-white/10 flex-1 max-w-md min-h-[48px] h-10">
  ```
  *Evidencia:* Declaración contradictoria de clases: `min-h-[48px]` forzado contra `h-10` (40px).

---

### 1.4. Pantalla 4: Directorio y Catálogos de Clientes y Productos
- **Desbordamiento Masivo en Móvil por Contenedores Rígidos (`ClientsView.tsx:181-183`)**:
  ```tsx
  <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
    <div style={{ flex: '0 0 350px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
  ```
  *Evidencia:* El contenedor principal es `display: flex` sin propiedad `flex-wrap: wrap`. La columna izquierda de clientes tiene un ancho inamovible de `350px`, más `gap: 24px`, más `padding: 24px` a ambos lados (48px). Ancho total mínimo: **422px**, superando los 375px del viewport móvil antes de sumar el formulario de la derecha.
- **Texto Hardcodeado `#0F172A` Invisible en Tema Oscuro (`ClientsView.tsx:159, 223, 227`)**:
  ```tsx
  <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A' }}>
  <span style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>{c.nombre}</span>
  ```
  *Evidencia:* `body` en `src/index.css:27` tiene `background-color: #070A10`. El contraste entre `#0F172A` y `#070A10` es de **1.1:1**, violando completamente el requisito mínimo de WCAG AA de 4.5:1. El texto se vuelve invisible para el usuario.
- **Cálculo O(N×M) sin Debouncing ni Caché (`ClientsView.tsx:189, 206-208`)**:
  ```tsx
  <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
  ...
  {filteredClientes.map(c => {
    const deuda = getClienteDeuda(c.id); // filtra y reduce cartera completa
  ```
  *Evidencia:* En cada tecla presionada en el input sin debounce, se filtran clientes y para cada uno se recorre toda la cartera (`cartera.filter().reduce()`), superando el umbral de Doherty de 400ms en bases de datos con cientos de clientes e historial de facturas.
- **Saturación Cognitiva de Pestañas en Inventario (`InventoryView.tsx:1659-1830`)**:
  *Evidencia:* La barra horizontal contiene **14 pestañas simultáneas** en una sola fila (`Existencias`, `Recepción Muelle`, `Kardex`, `Alistamiento`, `Despiece`, `Traslados`, `Pareto ABC`, `Compras`, `WMS Avanzado`, `Sucursales`, `Catálogo`, `Categorías`, `Devoluciones`, `Bodegas`), violando la Ley de Miller (7 ± 2 elementos).
- **Acciones Ocultas en Hover en Tabla WMS (`InventoryDataTable.tsx:50-63`)**:
  ```tsx
  <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
    <button className="px-3 py-1 bg-blue-500/10 text-blue-400 ...">Trasladar</button>
    <button className="px-3 py-1 bg-rose-500/10 text-rose-400 ...">Merma</button>
  </div>
  ```
  *Evidencia:* Los botones de traslado y merma permanecen invisibles con `opacity-0` hasta que ocurre un `group-hover`. En pantallas táctiles de bodega y tabletas industriales no existe evento hover continuo, impidiendo que el operador visualice las acciones disponibles. Además, miden solo 24px de alto (`py-1`).
- **Definición Global de Botones en UI Kit (`Button.tsx:38-42`)**:
  ```tsx
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',  // ~26px
    md: 'px-4 py-2 text-base',  // ~32px
    lg: 'px-6 py-3 text-lg'     // ~42px
  };
  ```
  *Evidencia:* **Ninguno de los tres tamaños estándar del botón del sistema alcanza los 44px de altura**. Incluso el tamaño `lg` se queda en 42px. Cualquier componente que consuma `<Button size="sm">` o `<Button size="md">` incumple por defecto la Ley de Fitts.

---

### 1.5. Estado de Tokens de Diseño, Light Mode y WCAG AA+
- **Inexistencia de `pezcaderia-light` en CSS (`src/index.css:44-188`)**:
  - `stitch.json:14` define `"default_brand": "pezcaderia-light"` y `"theme_mode": "light"`.
  - `.agents/skills/erp-pos-design-tokens/SKILL.md` define la paleta canónica Light Mode: `--bg-app: #f8fafc`, `--card-bg: #ffffff`, `--input-bg: #ffffff`, `--text-primary: #0f172a`, `--border-strong: #cbd5e1`.
  - Sin embargo, en `src/index.css` **solo existen selectores para:**
    `[data-theme="pezcaderia-glass"]`, `[data-theme="hyper-cobalt"]`, `[data-theme="carbon-teal"]`, `[data-theme="chrome-violet"]`.
  - No existe ninguna regla `[data-theme="pezcaderia-light"]`. `:root` aplica directamente fondo `#070A10` y tarjetas translúcidas oscuras.
- **Inexistencia de Light Mode en el Store de la Aplicación (`useAppStore.ts:31-77`)**:
  ```typescript
  const validThemes: ThemeMode[] = ['pezcaderia-glass', 'hyper-cobalt', 'carbon-teal', 'chrome-violet'];
  const themeCycle: ThemeMode[] = ['pezcaderia-glass', 'hyper-cobalt', 'carbon-teal', 'chrome-violet'];
  ```
  *Evidencia:* La opción de modo claro ni siquiera forma parte del array de temas válidos ni del ciclo de conmutación de temas.

---

## 2. Logic Chain (Análisis Sistemático frente a las 5 Leyes de UX)

```
[Observación O1] Botones de mostrador (POSView:1990), TerminalVendorBadge, botones Kanban (CashierKanban:158) y Button.tsx miden 24px - 32px
       │
       ▼ (Ley de Fitts)
[Inferencia I1] El tiempo y la tasa de error para alcanzar un objetivo interactivo es función inversa de su tamaño. En terminales táctiles (dedos ~10-12mm de contacto), objetivos < 44px provocan fallas de precisión, toques involuntarios y ralentizan la atención en mostrador.

[Observación O2] POSView:418 fija width:550px en modal Swal; ClientsView:181 fija columna 350px sin wrap; ProductSearchPanel:109 fija barra de 440px en flex horizontal
       │
       ▼ (Responsiveness & Viewport 375px)
[Inferencia I2] En viewport 375px, cualquier contenedor o diálogo con ancho rígido superior a 375px rompe la caja flexible del documento, generando overflow-x horizontal destructivo y corte de botones críticos de acción.

[Observación O3] ClientsView:189 y ProductSearchPanel:119 recalculan filtros O(N) en caliente en cada tecla sin debounce; CashFlowView:391 muta arrays con .sort() en render
       │
       ▼ (Umbral de Doherty < 400ms)
[Inferencia I3] Para mantener la ilusión de respuesta instantánea en el operador, el feedback debe ocurrir en <400ms. La ejecución de filtros de texto y cálculos en cada tecla satura el hilo principal de JavaScript, ocasionando jank y latencia de tipeo perceptible.

[Observación O4] InventoryView:1659 expone 14 pestañas horizontales continuas; ProductSearchPanel:248 incluye 3 líneas de stock por almacén en cada tarjeta de catálogo
       │
       ▼ (Ley de Miller: 7 ± 2 Chunks & Ley de Hick)
[Inferencia I4] La memoria de trabajo humana procesa entre 5 y 9 bloques de información simultánea. Exponer 14 pestañas no jerarquizadas e hiper-detallar stock de bodegas secundarias en una tarjeta de POS satura cognitivamente al operario y dilata la toma de decisiones (Hick).

[Observación O5] La lectura de código de barras exige clic manual en input; InventoryDataTable oculta botones en hover táctil; atajos de teclado varían
       │
       ▼ (Ley de Jakob: Convenciones Canónicas POS/ERP)
[Inferencia I5] Los operarios de ERP/POS esperan comportamientos estandarizados: un lector de código de barras debe operar de forma ambiental (escucha global de buffer HID) sin exigir foco manual; las acciones en tablas deben estar siempre visibles o en un menú kebab táctil, nunca tras hover.

[Observación O6] pezcaderia-light falta en CSS y useAppStore; textos #0F172A hardcodeados sobre body #070A10; Button.tsx carece de min-h-[44px]
       │
       ▼ (Diseño Canónico WCAG 2.2 AA+ & Tokens de Diseño)
[Inferencia I6] La falta de implementación de la paleta canónica Light Mode genera ratios de contraste ilegibles (1.1:1 en clientes) y fuerza un modo oscuro permanente que no es apto para ambientes de alta luminosidad (mostrador, muelle y bodega).
```

---

## 3. Matriz de Cumplimiento de Leyes de UX

| Ley de UX | Estado Actual | Deficiencia Observada | Ubicación en Código | Corrección Requerida |
| :--- | :---: | :--- | :--- | :--- |
| **Ley de Fitts** | ❌ NO CUMPLE | Botones de asesores en mostrador miden 24px (`py-1 text-xs`). Selectores y chips de filtro miden 24-28px. `<Button>` por defecto mide 26-32px. | `POSView.tsx:1990`<br/>`CashierKanbanView.tsx:158`<br/>`Button.tsx:38-42` | Garantizar `min-h-[44px]` (óptimo 48px) y padding táctil generoso en todos los botones interactivos. |
| **Ley de Hick** | ⚠️ PARCIAL | Exceso de opciones simultáneas en barra de inventario (14 pestañas) y múltiples pestañas de categorías en caja. | `InventoryView.tsx:1659`<br/>`CashFlowView.tsx:302` | Agrupar en menús desplegables jerárquicos o vistas en acordeón de máximo 5-7 opciones primarias. |
| **Umbral de Doherty** | ❌ NO CUMPLE | Búsqueda sin debounce en catálogos de clientes y productos. Mutación de arrays con `.sort()` en JSX. Ausencia de skeletons en transiciones. | `ClientsView.tsx:189`<br/>`ProductSearchPanel.tsx:119`<br/>`CashFlowView.tsx:391` | Implementar `useDebounce` (200ms) o `useDeferredValue`, memoizar ordenamientos y usar `TableSkeleton`. |
| **Ley de Miller** | ⚠️ PARCIAL | Tarjetas de productos en POS sobrecargadas con 3 almacenes y datos dinámicos irrelevantes para venta rápida. | `ProductSearchPanel.tsx:248-298` | Reestructurar tarjetas a 4 datos esenciales (Foto, Nombre, Precio, Stock Total) con modal secundario para desglose por bodega. |
| **Ley de Jakob** | ❌ NO CUMPLE | Escáner de código de barras requiere foco manual en input. Botones de acción en tabla WMS ocultos bajo hover táctil inexistente. | `ProductSearchPanel.tsx:128`<br/>`InventoryDataTable.tsx:50` | Listener ambiental de lector de código de barras HID y botones de acción permanentes con tamaño táctil. |
| **Tokens & WCAG AA+** | ❌ NO CUMPLE | `pezcaderia-light` inexistente en CSS y Store. Texto `#0F172A` hardcodeado sobre fondo `#070A10` (ratio 1.1:1). | `src/index.css`<br/>`useAppStore.ts:31`<br/>`ClientsView.tsx:159, 223` | Incorporar tokens de `erp-pos-design-tokens` a `src/index.css`, habilitar tema en store y erradicar colores fijos. |

---

## 4. Caveats (Límites de la Investigación y Supuestos)
1. **Inspección Read-Only**: Esta investigación se realizó estrictamente en modo de solo lectura sobre el código fuente, configuración de Tailwind y especificaciones de diseño, sin alterar archivos de producción.
2. **Ambiente de Ejecución**: Las mediciones de altura en píxeles se basan en los valores canónicos calculados de Tailwind CSS v3 (`py-1` = 8px vertical + `text-xs` 16px line-height = 24px; `py-1.5` = 12px vertical + 16px = 28px; `h-10` = 40px; `h-12` = 48px).
3. **Casos de Uso de Hardware**: Se asume que en mostrador y bodega el software opera tanto en monitores de escritorio (1366x768 o 1920x1080) como en tabletas y pantallas táctiles industriales donde el puntero del ratón puede no existir.

---

## 5. Conclusion (Inventario de Deficiencias y Plan de Corrección para Workers)

### Resumen Ejecutivo
El frontend cuenta con bases funcionales sólidas y componentes modernos (como `ArqueoCajaModal` y `CalculadorDenominaciones` que ejemplifican excelente ergonomía), pero exhibe inconsistencias críticas de maquetación móvil (375px), desatención de la Ley de Fitts en botones secundarios/chips de mostrador, búsquedas síncronas que comprometen el umbral de Doherty y una desconexión estructural con la especificación de tokens Light Mode WCAG AA+ (`erp-pos-design-tokens`).

### Checklist Priorizado de Tareas para Agentes Implementadores (Workers)

#### Bloque A: Integridad Móvil (375px) y Erradicación de Desbordamientos Horizontales
- [ ] **A1. SweetAlert2 Responsivo Global**: Reemplazar anchos fijos (e.g. `width: '550px'` en `POSView.tsx:418`) por anchos responsivos `width: window.innerWidth < 640 ? '92vw' : '520px'` y contenedor con `box-sizing: border-box`.
- [ ] **A2. Barra de Búsqueda y Código de Barras en POS (`ProductSearchPanel.tsx:109`)**: Añadir `flex-wrap: wrap` en el contenedor de búsqueda y escáner, permitiendo que en resoluciones menores a 640px el input de código de barras ocupe una segunda línea sin desbordar los 375px.
- [ ] **A3. Layout Responsivo de Clientes (`ClientsView.tsx:181`)**: Modificar `<div style={{ display: 'flex' }}>` por un layout Tailwind responsivo `flex flex-col lg:flex-row gap-4 w-full` con columna de clientes flexible `w-full lg:w-80 shrink-0`.
- [ ] **A4. Tablas en Móviles**: Asegurar que las tablas de movimientos (`CashFlowView.tsx`) y clientes incluyan envoltura con `overflow-x-auto` y clases de celda compactas en móvil.

#### Bloque B: Ergonomía y Ley de Fitts (Objetivos Táctiles >= 44x44px)
- [ ] **B1. Barra de Asesores de Mostrador (`POSView.tsx:2005`)**: Actualizar botones de asesores de `py-1` a `min-h-[44px] px-3.5 py-2.5` con tipografía clara y atajo numérico visible.
- [ ] **B2. Chips de Asesor en Kanban (`CashierKanbanView.tsx:158, 172`)**: Cambiar de `py-1` a `min-h-[44px] px-3 py-2 text-xs font-bold`.
- [ ] **B3. Badge Terminal / Vendedor (`TerminalVendorBadge.tsx:54, 92`)**: Elevar botones de cambio de terminal y cambio de vendedor a `min-h-[44px] px-3 py-2`.
- [ ] **B4. Botón `+ Split` en Pagos (`PaymentPanel.tsx:407`)**: Ajustar botón a `min-h-[44px] px-3 py-2 text-xs`.
- [ ] **B5. Botones del Sistema (`Button.tsx:38-42`)**: Incorporar `min-h-[44px]` (o `min-h-[48px]`) en los tamaños `md` y `lg`, y garantizar que ningún botón interactivo operativo mida menos de 44px de alto.
- [ ] **B6. Acciones en Tabla WMS (`InventoryDataTable.tsx:50-63`)**: Eliminar `opacity-0 group-hover:opacity-100`. Hacer los botones `Trasladar` y `Merma` siempre visibles con `min-h-[44px] min-w-[44px]` o agruparlos en un botón menú táctil.

#### Bloque C: Umbral de Doherty (< 400ms) y Optimización de Catálogos
- [ ] **C1. Debounce en Buscadores de Catálogo**: Aplicar un hook `useDebounce` (200-250ms) en `ClientsView.tsx`, `ProductSearchPanel.tsx`, `OrderKanbanView.tsx` y `EnterpriseDataTable.tsx`.
- [ ] **C2. Memoización y Erradicación de Mutaciones**: Envolver el cálculo de deuda en `ClientsView` con un mapa memoizado (`useMemo`) previo a la iteración. En `CashFlowView.tsx:391`, realizar la copia `[...movimientosFiltrados].sort(...)` en un `useMemo`.
- [ ] **C3. Loading Skeletons en Tablas**: Incorporar `TableSkeleton` de `ShimmerSkeleton.tsx` en `InventoryDataTable.tsx` y `EnterpriseDataTable.tsx` durante las cargas asíncronas.

#### Bloque D: Leyes de Miller y Jakob
- [ ] **D1. Agrupamiento de Pestañas en Inventario (`InventoryView.tsx:1659`)**: Reducir las 14 pestañas horizontales a un menú jerárquico de 5 macro-categorías (Operaciones Diarias, Alistamiento B2B, Transformación/Merma, Analítica e Informes, Configuración) con dropdowns secundarios.
- [ ] **D2. Tarjeta Táctil Simplificada de Producto (`ProductSearchPanel.tsx:248`)**: Ocultar el desglose de bodegas secundarias en la vista normal de la tarjeta POS; mostrar únicamente el stock disponible consolidado y proveer un toque largo o icono de información para abrir el desglose.
- [ ] **D3. Escaneo de Código de Barras Ambiental (Jakob)**: Implementar un hook global `useBarcodeScanner` que capture lecturas rápidas del lector físico sin requerir foco manual del cursor.

#### Bloque E: Tokens de Diseño y Light Mode WCAG AA+
- [ ] **E1. Regla Canónica `[data-theme="pezcaderia-light"]` en `src/index.css`**: Incorporar las variables de `.agents/skills/erp-pos-design-tokens/SKILL.md`:
  - `--bg-color: #f8fafc`
  - `--card-bg: #ffffff`
  - `--card-hover: #f1f5f9`
  - `--text-primary: #0f172a`
  - `--text-secondary: #334155`
  - `--text-muted: #64748b`
  - `--border-color: #e2e8f0`
  - `--border-strong: #cbd5e1`
- [ ] **E2. Registrar `pezcaderia-light` en `useAppStore.ts`**: Incluir `pezcaderia-light` en `validThemes` y `themeCycle` para permitir la alternancia fluida de tema.
- [ ] **E3. Erradicar Colores Fijos Incompatibles**: Reemplazar `color: '#0F172A'` inline en `ClientsView.tsx` por clases de token semántico `text-primary` (`var(--text-primary)`).

---

## 6. Verification Method (Guía de Verificación Independiente)

1. **Inspección de Archivos Clave**:
   - Revisar `c:\Users\Personal\Documents\Yurgen\Maestro_Pezcaderia_ERP\maestro_ERP_Pezcaderia\src\views\POSView.tsx` (líneas 1990-2015 y 418).
   - Revisar `c:\Users\Personal\Documents\Yurgen\Maestro_Pezcaderia_ERP\maestro_ERP_Pezcaderia\src\views\ClientsView.tsx` (líneas 159, 181-190).
   - Revisar `c:\Users\Personal\Documents\Yurgen\Maestro_Pezcaderia_ERP\maestro_ERP_Pezcaderia\src\views\cash\CashFlowView.tsx` (líneas 159, 304, 391).
   - Revisar `c:\Users\Personal\Documents\Yurgen\Maestro_Pezcaderia_ERP\maestro_ERP_Pezcaderia\src\index.css` (líneas 44-188) y `src\store\useAppStore.ts` (línea 31).
2. **Comando de Verificación de Integridad TypeScript**:
   ```powershell
   npm run build # o npx tsc --noEmit
   ```
3. **Prueba en Navegador / Chrome DevTools (Viewport 375px)**:
   - Configurar dispositivo móvil con ancho `375px`.
   - Navegar a POS, Caja, Kanban y Directorio de Clientes.
   - Ejecutar en la consola:
     ```javascript
     document.documentElement.scrollWidth <= document.documentElement.clientWidth
     ```
     *Condición de éxito:* Debe devolver `true` en todas las pantallas (cero desbordamiento horizontal).
4. **Verificación de Accesibilidad y Objetivos Táctiles**:
   - Inspeccionar los botones de asesores en mostrador y botones de tabla con DevTools (`Inspect Element`).
   - *Condición de éxito:* El bounding rect interactivo (`offsetWidth` y `offsetHeight`) debe ser `>= 44px`.
