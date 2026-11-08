# Reporte de Investigación y Handoff: Ergonomía, Catálogo y Layout del POS

**Fecha:** 2026-11-07  
**Agente:** `survey_explorer_pos` (Teamwork Explorer)  
**Destinatario:** `parent` (`ba45cc1d-c8b5-4eca-a8a6-e3a849f3a0b7`)  
**Misión:** Explorar e investigar el layout del POS, catálogo, barra superior y cuadrícula de productos en MaestroPescadería ERP contrastando la saturación actual con el diseño de referencia SaaS maduro.

---

## 1. Observation

### 1.1. Análisis Visual Comparativo de Material de Referencia
Se inspeccionaron directamente mediante `read_file` las dos imágenes provistas por el usuario:

- **Imagen 1 (Problema Actual de Saturación):**  
  `C:/Users/usuario/.gemini/antigravity/brain/e2aefe99-37a4-4e7c-ad1a-2417f699b44e/.user_uploaded/media_1794075195584_b45d7bb3.png`
  - **Cabecera del Carrito:** Controles decorativos estilo Mac ("● ● ● CARRITO DE VENTAS 1 ítem").
  - **Selector de Cliente:** Botón "Consumidor Final..." ocupando espacio superior.
  - **Fila de Acciones Secundarias:** 3 botones pesados apilados: "Cerrar Turno", "En Espera F6", "Borradores 2" (~40px de alto).
  - **Barra de Pedidos en Espera / Multicliente:** Bloque redundante con "Ventas en Espera & Multicliente 2", botón "+ Suspender & Nueva Venta", y pestañas de tickets activos: "Venta Activa 1 ítems ($62.000)", "PRE-102 (Santiago... $160.000 01:08)" (~80px de alto).
  - **Franja de Líneas de Venta (`pos-cart-items-list`):** Comprimida a una **ranura minúscula de ~40px de alto**. Las líneas sufren un artefacto blanco (`bg-white` en `LineaVentaRow.tsx:159`), con el texto cortado, donde apenas se asoma un único producto con controles de cantidad semi-visibles.
  - **Desglose de Totales:** Líneas de "Sub: $62.000", "+ Descuento F4" y caja de "TOTAL 1 ítem: $62.000" (~60px).
  - **Barra de Estado de Mostrador:** Fila con "PUESTO DE MOSTRADOR", "Cobro en Ventanilla", botón "+ Notas Corte", botón "Vaciar" (~35px).
  - **Botón de Cobro Inferior:** Botón masivo "EMITIR PREVENTA / COMANDA (F6)" (~50px).
  - **Balance de Espacio:** De ~500px a 600px de altura vertical total disponible en el panel de carrito en pantalla de laptop, **más de 450px están ocupados por encabezados, pestañas, sub-barras y pies**, dejando menos del 10% del espacio para visualizar los productos agregados.

- **Imagen 2 (Diseño de Referencia SaaS POS Maduro):**  
  `C:/Users/usuario/.gemini/antigravity/brain/e2aefe99-37a4-4e7c-ad1a-2417f699b44e/.user_uploaded/media_1794075246319_e3c57ab1.png`
  - **App Shell Header:** Barra superior horizontal limpia en color verde esmeralda (`#10B981` / `#059669`) con título corporativo "PEZCADERIA S.A.S", icono de ayuda "?", home, carrito con badge numérico naranja y avatar de usuario.
  - **Barra Lateral Izquierda:** Rail delgado con iconos de navegación operativa a la izquierda.
  - **Área de Catálogo (Izquierda, ~75% de ancho):**
    - **Navegación de Categorías:** Pestañas horizontales centradas con flechas de navegación a los lados (`←` `TODOS` `→`). Pestaña activa resaltada limpiamente.
    - **Sub-barra de Búsqueda y Acciones:**
      - Campo de texto izquierdo: "Código barras".
      - Campo de texto central con icono de lupa: "Buscar productos".
      - Botón derecho de acción rápida: "Crear Producto +" con borde verde esmeralda.
    - **Cuadrícula de Productos (Product Grid):**
      - Matriz espaciosa y armónica de **6 columnas × 3 filas (18 tarjetas visibles por página)**.
      - Tarjetas con fondo blanco/claro, borde sutil y esquinas redondeadas.
      - Área de imagen cuadrada amplia con icono limpio de caja de producto o SVG.
      - Nombre completo del producto legible a 2 líneas debajo de la imagen (ej: "Aleta De Calamar", "Almeja En Concha X 500 Gr").
      - Precio destacado en tipografía negrita verde esmeralda (`19.000`, `10.000`, `10.500`, etc.).
      - Cero sobrecarga cognitiva: no hay desgloses de bodega invasivos ni semáforos compitiendo dentro de cada tarjeta.
    - **Paginación Inferior:** Controles centrados claros: `< Anterior 1 2 3 4 5 6 7 8 Siguiente >`.
  - **Panel de Carrito (Derecha, ~25% de ancho):**
    - **Parte Superior:** Selector de cliente sobrio y compacto: icono `👤` + "CONSUMIDOR FINAL" con iconos de acción a la derecha (buscar/editar cliente).
    - **Cuerpo Central:** Espacio amplio y despejado que ocupa el **75% a 80% de la altura vertical del panel** dedicado exclusivamente a las líneas de venta.
    - **Parte Inferior:**
      - Chevron colapsable `^`.
      - Botón primario verde sólido: texto "Vender" alineado a la izquierda y monto `$0,00` alineado a la derecha en tipografía destacada.
      - Botón secundario tipo outline: "Guardar" para suspender/poner en espera la orden.
    - **Funciones Operativas Secundarias (Cerrar turno, Borradores, Multicliente):** Completamente desacopladas del flujo visual principal del carrito (reubicadas en menú secundario o modal según requerimiento R3).

---

### 1.2. Inspección del Código Fuente

#### A. Vista Raíz: `src/views/POSView.tsx` (3,818 líneas)
- **Ruta y Layout:** `src/App.tsx:1393` renderiza `<POSView />` dentro de `<main className={getMainLayoutClasses('pos')}>`.
- **Clases del contenedor externo:** `src/components/layout/layoutModes.ts:47` define:
  ```ts
  `flex-1 ${paddingClasses} overflow-hidden flex flex-col h-[calc(100vh-theme(spacing.12)-theme(spacing.3))] min-h-0`
  ```
  La vista opera con altura fija 100vh (sin scroll de ventana exterior).
- **Sobrecarga Vertical en `POSView.tsx` (Líneas 2250-2650):**
  1. Alerta de caja cerrada (`AlertCircle ⚠ CAJA CERRADA...`) ~ 30px.
  2. ZONA 1 Header & Breadcrumb (`POS | Turno #ACTIVO`, badge vendedor, botón cambiar) ~ 40px.
  3. ZONA 1.5 Barra de Asesores Mostrador (si `isFerreteria`) ~ 48px.
  4. ZONA 2 Barra de Control con 6 botones de subvistas ("Venta Rápida", "Caja Única", "Modo Tabla", "Consolidación B2B", "Canales Digitales", "Kanban") + botones "⚡ Buscar (F8)", "⏸ Preventa", "📋 Comandas", "⚖️ Balanza", "Más Acciones..." ~ 48px.
  5. ZONA 3 Barra KPI ("Ventas Turno", "Efectivo Gaveta", "Transacciones", "Facturación DIAN") ~ 36px.
  6. Ticker de cola (`InternalQueueTicker`) ~ 32px.
  7. Mobile tab switcher (< lg) ~ 44px.
  *Total de cabecera antes del área de trabajo:* **180px a 240px**.

#### B. Componente Catálogo: `src/views/pos/components/ProductSearchPanel.tsx` (363 líneas)
- **Controles de búsqueda (Líneas 125-164):**
  - Input "Buscar por nombre o SKU..." (`id="pos-product-search-input"`).
  - Formulario con input "Código de Barras..." y botón "Simular Scan".
  - **Falta:** No existe el botón "Crear Producto +" especificado en el requerimiento R1 y presente en la Imagen 2.
- **Navegación de Categorías (Líneas 166-181):**
  - Contenedor con estilos inline: `style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px' }}`.
  - **Falta:** No cuenta con flechas de desplazamiento horizontal (`←` y `→`).
  - Botones con estilo `bg-indigo-600` / `bg-slate-800` oscuros y densos.
- **Cuadrícula de Productos (Líneas 195-360):**
  - Clases: `grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 overflow-y-auto flex-1`.
  - Limitado a 4 columnas como máximo en lugar de las 6 columnas del diseño de referencia SaaS maduro.
  - **Sobrecarga interna por tarjeta (`Card`):**
    - Badges `⚖️ KILOS` / `📦 UNIDAD` con estilos absolutos inline.
    - Semáforo circular de stock (`stock-badge-red`, `stock-badge-yellow`, `stock-badge-green`).
    - Nombre del producto truncado con `line-clamp-1`.
    - Precio con sufijo `/ kg` o `/ und`.
    - Mapeo de `dynamicFields` con estilos inline.
    - Desglose de stock colapsable con botón "Bodegas ▼" que despliega `Bod. Principal`, `Bod. Secundaria` y `Bod. Averías` dentro de cada tarjeta.
  - **Paginación:** Inexistente. Renderiza `filteredProducts.slice(0, 80)` en un scroll vertical continuo.

#### C. Componente Carrito: `src/views/pos/components/CartPanel.tsx` (969 líneas)
- **Error Crítico de Sintaxis en Línea 1 (Bloqueante):**
  ```ts
  1: usa harneimport React, { useState, useEffect } from 'react';
  ```
  Al ejecutar `npm test -- src/tests/posCartPanelErgonomics.test.tsx --run`, Vitest falla inmediatamente con:
  ```
  Error: Transform failed with 1 error:
  C:/Users/usuario/OneDrive/Documentos/Aplicaciones Pezca/MaestroPescaderia/src/views/pos/components/CartPanel.tsx:1:4: ERROR: Expected ";" but found "harneimport"
  ```
- **Acumulación de Elementos en el Carrito (Líneas 572-870):**
  - `GlassCard` con `showMacControls={true}` ("● ● ● CARRITO DE VENTAS 1 ítem").
  - `pos-cart-header` con selector de cliente + botones "Cerrar Turno", "En Espera (F6)", "Borradores (N)".
  - `ParkedOrdersBar` (Líneas 673-684): Si `drafts.length > 0`, se incrusta la barra completa de multicliente y ventas suspendidas.
  - `pos-cart-footer`: Resumen de subtotales + descuento F4 + bloque TOTAL con `font-black text-2xl sm:text-3xl` + cabecera de puesto de mostrador ("PUESTO DE MOSTRADOR", "Cobro en Ventanilla", "+ Notas Corte", "Vaciar") + botón de preventa o cobro.
  - La lista `pos-cart-items-list` tiene `flex-1 min-h-0 overflow-y-auto`, pero la suma de alturas de los elementos anteriores la comprime a menos de 50px de altura efectiva.

#### D. Componente Fila de Venta: `src/views/pos/components/LineaVentaRow.tsx` (356 líneas)
- **Línea 159-160:**
  ```tsx
  className="cart-item-row group relative flex items-center justify-between gap-1 sm:gap-2 px-2 py-1.5 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 hover:bg-slate-50/90 dark:hover:bg-slate-800/80 transition-colors rounded-lg min-h-[58px] max-h-[64px]"
  ```
  - La clase `bg-white` sin un contenedor adaptado produce la franja blanca deslumbrante y desalineada observada en la Imagen 1.
  - `max-h-[64px]` fuerza el corte vertical de contenidos.

#### E. Componente de Creación Rápida de Productos Existente:
- Archivo: `src/views/inventory/components/CrearProductoRapidoModal.tsx` (298 líneas).
- Funcionalidad: Permite registrar SKU, nombre, categoría, unidad de medida, precio de compra y precio de venta POS con persistencia en `localDb` y recarga en `useInventoryStore`.
- Está listo para integrarse directamente al botón "Crear Producto +".

#### F. Tokens de Diseño Light Mode Existentes:
- Archivo: `.agents/skills/erp-pos-design-tokens/SKILL.md`.
- Define la paleta canónica WCAG AA+ (fondos `#f8fafc`, tarjetas `#ffffff`, textos `#0f172a`, bordes `#e2e8f0`, acción `#059669`). Coincide plenamente con la estética de la Imagen 2.

---

## 2. Logic Chain

1. **Premisa 1 (Causa de la saturación):** La Imagen 1 y el análisis de `CartPanel.tsx` demuestran que el espacio vertical del carrito está dominado por controles secundarios apilados (cabecera Mac, botón de cliente, Cerrar Turno, En Espera, Borradores, ParkedOrdersBar de 80px, resumen de subtotales, caja de total gigante, controles de mostrador y botón de preventa).
2. **Premisa 2 (Impacto en la experiencia de venta):** Al quedar la lista de líneas (`pos-cart-items-list`) comprimida a ~40px, el operador en mostrador no puede verificar los productos digitados, comete errores de facturación y experimenta una interfaz frustrante con artefactos blancos y textos cercenados.
3. **Premisa 3 (Solución evidenciada en el benchmark SaaS maduro):** La Imagen 2 demuestra que al desacoplar las operaciones secundarias hacia menús modales o desplegables, el carrito se expande verticalmente (75-80% de altura útil), permitiendo una lectura serena y confortable.
4. **Premisa 4 (Optimización del Catálogo):** La cuadrícula de `ProductSearchPanel.tsx` actualmente sobrecarga cada tarjeta con información de bodegas y semáforos, limitándose a 4 columnas y scroll continuo de 80 productos. La Imagen 2 demuestra que una cuadrícula limpia de 6 columnas × 3 filas (18 tarjetas) con paginación explícita (`< Anterior 1 2 3 ... Siguiente >`), nombre completo y precio verde esmeralda destacado agiliza la venta visual.
5. **Premisa 5 (Reutilización y componentes disponibles):** El modal `CrearProductoRapidoModal.tsx`, los tokens de `erp-pos-design-tokens` y el hook `usePOSCart.ts` ya existen y operan correctamente. La integración del botón "Crear Producto +" y el diseño SaaS solo requieren componer estos elementos bajo una arquitectura limpia y modular.

---

## 3. Caveats

- **Error de compilación preexistente:** `src/views/pos/components/CartPanel.tsx:1` contiene la cadena accidental `usa harneimport React...`, lo cual causa fallo sintáctico inmediato en Vitest y Vite. Debe limpiarse al momento de la implementación.
- **Doble modo de operación (Mostrador vs Cajero):** `POSView.tsx` actualmente contempla un interruptor `isModoCajero` (Caja Única / Cola de Comandas en Vivo F9). La reconstrucción del POS de ventas de mostrador debe respetar este flujo o mantener la bandera de estado para no romper la compatibilidad con el modo de comandas compartidas.
- **Multi-tenancy:** En modo Ferretería Josase (`tenant-03`), `POSView.tsx` despliega la barra de asesores de mostrador. Esta barra debe integrarse de manera limpia y compacta sin saturar el catálogo.
- **Ámbito estricto de solo lectura:** Como agente explorador, no se modificó ningún archivo de código fuente del proyecto (`src/`), respetando el principio de investigación.

---

## 4. Conclusion & Architecture Recommendations

### 4.1. Descomposición Modular Propuesta para Reconstruir POSView
Para eliminar la deuda técnica del archivo monolítico de 3,818 líneas y lograr la ergonomía de la Imagen 2, se recomienda estructurar la vista en submódulos especializados:

```
src/views/pos/
├── POSView.tsx                         # Orquestador limpio (layout maestro split 75/25)
└── components/
    ├── POSTopBar.tsx                   # Búsqueda código barras, texto, botón "Crear Producto +" y accesos directos
    ├── POSCategoryTabs.tsx             # Pestañas horizontales con flechas de navegación (← TODOS →)
    ├── POSProductGrid.tsx              # Grilla 6x3 (18 productos) con tarjetas limpias y paginación
    ├── POSProductCard.tsx              # Tarjeta minimalista (imagen amplia, nombre completo, precio verde destacado)
    ├── POSCartPanel.tsx                # Carrito ergonómico: 80% altura para ítems, cliente arriba, Vender/Guardar abajo
    ├── POSCartLineItem.tsx             # Fila de línea de venta sin artefactos blancos y con controles táctiles
    ├── POSSecondaryActionsModal.tsx    # Modal/Dropdown con Cerrar Turno, Borradores, Turnos, Siigo, etc. (R3)
    └── POSPagination.tsx               # Control de páginas < Anterior 1 2 3 ... Siguiente >
```

### 4.2. Matriz de Componentes y Responsabilidades

| Componente | Responsabilidad | Elementos Visuales / Ergonomía |
| :--- | :--- | :--- |
| **`POSTopBar`** | Búsqueda y creación | Input "Código barras", input "Buscar productos" con lupa, botón "Crear Producto +" (abre `CrearProductoRapidoModal`), botón "Más Acciones..." (desplegable). |
| **`POSCategoryTabs`** | Filtrado temático | Flechas `←` y `→`, pestañas horizontales de categorías dinámicas, estilo activo verde esmeralda / tab limpio. |
| **`POSProductGrid`** | Catálogo ergonómico | Grid responsivo de 6 columnas en desktop (18 tarjetas por página), paginador inferior `< Anterior 1 2 3 ... Siguiente >`. |
| **`POSProductCard`** | Selección 1-tap | Contenedor de imagen centrado (icono o foto), título a 2 líneas sin truncado agresivo, precio en negrita verde esmeralda (`$19.000`). Click agrega al carrito inmediatamente (o abre peso si es KG). |
| **`POSCartPanel`** | Carrito desahogado | Selector de cliente compacto arriba ("👤 CONSUMIDOR FINAL"), contenedor central de líneas con `flex-1 overflow-y-auto` (75-80% de pantalla), pie con botón verde "Vender $XX.XXX" y botón "Guardar". |
| **`POSSecondaryActions`** | Descongestión R3 | Menú o modal para "Cerrar Turno", "Borradores", "Ventas en espera" y "Cola Siigo", eliminando todo este peso del carrito. |

---

## 5. Verification Method

Para verificar independientemente las observaciones y validar la implementación subsiguiente:

1. **Verificación de Error de Sintaxis:**
   ```powershell
   npm test -- src/tests/posCartPanelErgonomics.test.tsx --run
   ```
   *Condición de fallo actual:* Error en `src/views/pos/components/CartPanel.tsx:1:4: ERROR: Expected ";" but found "harneimport"`.
   *Condición de éxito post-corrección:* Compilación limpia de pruebas.

2. **Verificación Visual de Ergonomía con Chrome DevTools MCP:**
   - Iniciar servidor: `npm run dev`.
   - Navegar a la vista POS (`http://localhost:5173`).
   - Comprobar que en resolución estándar de mostrador (1366x768 o 1920x1080), el contenedor de líneas de venta del carrito mida al menos **350px a 450px de altura disponible**.
   - Comprobar que a 375px (vista móvil), el conmutador de pestañas ("Catálogo" y "Carrito") permita cambiar de vista sin desbordamiento horizontal.
   - Confirmar 0 errores en la consola JavaScript.

3. **Verificación de Invariantes Arquitectónicas:**
   ```powershell
   python scripts/architecture/run_agency_sdd_bridge.py -a quality --dry-run
   ```
   *Condición de éxito:* 0 violaciones de arnés, 0 fugas de tokens, preservación estricta de multi-tenancy.
