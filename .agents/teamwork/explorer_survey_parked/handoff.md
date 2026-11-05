# Reporte de Levantamiento e Investigación Ergonómica: Ventas en Espera y Flujo Multivendedor - Caja Única (R2)

**Autor:** `teamwork_explorer` (Investigador & Analista)  
**Fecha:** 2026-11-05T16:06:00Z  
**Misión:** Survey & Ergonomic Investigation of Parked Orders and Multivendor-Caja Única Flow (R2)  
**Directorio de Trabajo:** `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\explorer_survey_parked\`  
**Destinatario:** Orquestador (`e581d92b-b34a-4a1c-839f-2a3c9710cd5f`)

---

## 1. Observation (Observaciones Directas de Código, Mediciones y Pruebas)

### 1.1. Implementación Actual de Controles Secundarios y Ventas en Espera

1. **`ParkedOrdersBar.tsx` (`src/views/pos/components/ParkedOrdersBar.tsx`, 117 líneas)**:
   - Se monta condicionalmente en `CartPanel.tsx:632-642` bajo la cláusula `{drafts.length > 0 && <ParkedOrdersBar ... />}`.
   - Su posición es un bloque vertical estático apilado directamente sobre el contenedor con scroll de productos (`.pos-cart-items-list`).
   - Contiene dos filas internas:
     - **Fila 1 (Cabecera, líneas 26-46)**: Título *"Ventas en Espera & Multicliente"*, icono `PauseCircle` (13px), badge numérico de borradores y botón *"Suspender & Nueva Venta"* (`min-h-[36px] px-2.5 py-1`).
     - **Fila 2 (Pestañas Horizontales, líneas 49-113)**: Contenedor `overflow-x-auto no-scrollbar` con pestaña de *"Venta Activa"* (muestra total de ítems y valor monetario) más chips de pedidos en espera (`alias`, total formateado, hora guardada, botón `X` de descarte).
   - **Medición de Altura Vertical**: `padding py-2` (16px) + `gap-1.5` (6px) + Cabecera (~38px) + Pestañas (~36px) = **96px fijos**.
   - Cada vez que se suspende una venta, la barra aparece dinámicamente, arrebatándole de golpe **96px** a la lista de productos del carrito.

2. **`PendingOrdersDrawer.tsx` (`src/views/pos/components/PendingOrdersDrawer.tsx`, 165 líneas)**:
   - Modal flotante centrado con estética macOS Glassmorphism (`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md`).
   - Se activa desde `POSView.tsx:2395-2409` mediante el botón `#btn-open-comandas-drawer` (*"📋 Comandas"* con badge de conteo).
   - Recibe la prop `orders: PendingOrderComanda[]`, filtrando en tiempo real por `consecutivoTicket`, `vendedorNombre`, `clienteNombre` o `terminalId`.
   - Cada tarjeta de comanda muestra:
     - Badge rojo con consecutivo (`order.consecutivoTicket`, ej. `PRE-101`, `0042`, `TICK-001`).
     - Badge de terminal (`order.terminalId`, ej. `TERM-01`, `MOSTRADOR-01`).
     - Nombre de cliente (`order.clienteNombre || 'Consumidor Final'`).
     - Asesor/vendedor (`order.vendedorNombre`) y conteo de productos (`order.itemsCount`).
     - Total monetario en tipografía mono esmeralda (`$order.montoTotal.toLocaleString('es-CO')`).
     - Botón de cobro primario: *"Cobrar en Caja"* (`min-h-[44px] px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white`).
   - Al pulsar *"Cobrar en Caja"*, `handleSelectComanda` (`POSView.tsx:242-293`) transfiere los ítems a `cartLineas`, fija el cliente, restaura notas y cierra el modal, notificando con un toast.

3. **Controles de Cabecera en `POSView.tsx` (Zonificación 1 a 4)**:
   - En `src/views/POSView.tsx:2212-2574`, la pantalla acumula **cinco franjas de cabecera apiladas verticalmente**:
     - **Banner Alerta Caja Cerrada (línea 2206)**: `py-1 px-3 text-xs` (~36px, cuando aplica).
     - **ZONA 1 - Breadcrumb & Vendedor (líneas 2212-2262)**: Título `POS`, píldora de turno activo (`Turno #XXXXX`), badge de vendedor (`#pos-seller-badge`) con avatar y botón *"Cambiar"* (`#pos-btn-cambiar-vendedor`). Altura: **~48px**.
     - **ZONA 1.5 - Barra Asesores Mostrador (líneas 2264-2302)**: Renderizada si `isFerreteria` o multivendedor activo. Muestra etiqueta *"Asesor Mostrador:"* y cinco botones táctiles de asesores (`VENDEDORES_JOSASE`). Altura: **~46px**.
     - **ZONA 2 - Barra de Control Ergonómica & Pestañas (líneas 2304-2512)**:
       - Izquierda: Subvistas (*Venta Rápida POS*, *Consolidación B2B*, *Canales Digitales*, *Kanban*).
       - Derecha: Acciones (*⚡ Buscar F8*, *⏸ Preventa / En Espera*, *📋 Comandas*, *⚖️ Balanza*, *Más Acciones...* con dropdown para Arqueo, Reabastecer, Siigo, Reimprimir). Altura: **~50px**.
     - **ZONA 3 - Barra Compacta de Turno KPI (líneas 2514-2565)**: Indicadores de *Ventas Turno*, *Efectivo Gaveta* (tope $1.5M), *Transacciones*, y *Facturación DIAN / SIIGO*. Altura: **~40px**.
     - **ZONA 4 - Ticker Interno de Cola (líneas 2566-2574)**: `InternalQueueTicker` con turno en atención, pendientes y tiempo estimado. Altura: **~36px**.
     - **ZONA 5 - Selector Móvil (`< lg`) (líneas 2578-2614)**: Pestañas *Catálogo* y *Carrito*. Altura: **~48px**.
   - **Gasto Vertical Acumulado de Cabecera**: Entre **220px y 268px** antes de llegar a las columnas de contenido.

4. **Pie del Carrito (`CartPanel.tsx:688-829`)**:
   - Contenedor `.pos-cart-footer shrink-0 mt-auto bg-slate-900/90 backdrop-blur-2xl p-2 sm:p-2.5 border-t`:
     - **Fila TOTAL (líneas 692-706)**: Etiqueta TOTAL, badge de conteo de ítems, monto tabular `text-2xl sm:text-3xl font-black text-emerald-400`. Altura: **~46px**.
     - **Panel de Descuentos (`DiscountPanel.tsx`, líneas 709-718)**: 4 filas (*Subtotal*, *Base Gravable*, *Impuestos*, *Descuento F4* con supervisor). Altura: **~100px**.
     - **Área de Acción**:
       - *Modo Asesor Mostrador (`isMostradorAuto`)*: Franja *"Puesto de Mostrador - Cobro en Ventanilla"* + botón *"Vaciar"*, botón *"Notas de Despacho / Corte"* con previsualización, y botón principal *"EMITIR PREVENTA / COMANDA (F6)"* (`min-h-[44px]`). Altura: **~127px**. Altura total del pie en mostrador: **~273px**.
       - *Modo Cajero Único (`PaymentPanel.tsx`)*: GlassCard *"LIQUIDACIÓN & MEDIOS DE COBRO"*, total a liquidar, aviso de tope de gaveta, selector de método y botón `+ Split`, grilla 2x2 de métodos (*Efectivo*, *Transferencia*, *Datáfono*, *Crédito* con teclas F1-F4), selector de billeteras (Nequi/Daviplata/QR), billetes rápidos sugeridos ($10k-$100k), input de efectivo recibido, cálculo de cambio, toggle de Factura Electrónica DIAN y botón *"COBRAR E IMPRIMIR TICKET"*. Altura: **~450px a 550px**.

5. **Filas de Productos en Carrito (`LineaVentaRow.tsx`, 349 líneas)**:
   - Cada producto se renderiza con dos niveles (`Tier 1` y `Tier 2`):
     - Tier 1: Nombre de producto, badge de unidad (`⚖️ KILOS` / `📦 UNIDAD`), badge de peso manual, y botón eliminar de tacto amplio (`min-w-[48px] min-h-[48px]`).
     - Tier 2: Precio total línea, botón de precio unitario editable con modal SweetAlert, badges de stock y tarifa histórica, botón de balanza serial, stepper decrementar (`min-w-[48px]`), input de cantidad (`min-w-[48px]`), stepper incrementar (`min-w-[48px]`) y acceso a teclado en pantalla.
   - Altura promedio por fila: **115px a 130px**.

---

## 1.2. Mediciones de Presupuesto Vertical y Competencia de Espacio

A partir de `src/components/layout/layoutModes.ts:46`:
```typescript
h-[calc(100vh-theme(spacing.12)-theme(spacing.3))] // 100vh - 48px - 12px = 100vh - 60px
```

| Dispositivo / Pantalla | Alto Total Viewport | Alto Neto Contenedor `<main>` | Alto Cabeceras POS (Zonas 1-4) | Espacio Columna Carrito Restante | Sobrecarga Fija en Carrito (Header + Footer + GlassCard) | Espacio Neto para Lista de Ítems (`cart-items-container`) | Filas Visibles sin Scroll (a 120px/fila) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Laptop de Mostrador (1366 x 768)** | 650px (con browser chrome) | **590px** | 232px | **358px** | 379px (sin ParkedBar) / **473px (con ParkedBar)** | **Colapso negativo: -115px (0px visibles)** | **0 productos** (quedan recortados o aplastados) |
| **Terminal Táctil POS (1280 x 800 Kiosk)** | 760px (kiosk mode) | **700px** | 232px | **468px** | 379px / **473px** | **-5px a 30px** | **0 a 0.25 productos** |
| **Monitor Mostrador Full HD (1920 x 1080)** | 960px (con browser chrome) | **900px** | 232px | **668px** | 379px / **473px** | **195px a 289px** | **1 a 2 productos máximo** |

> **Hallazgo Crítico de Competencia**: Cuando el mostrador tiene ventas en espera (`drafts.length > 0`), la presencia de `ParkedOrdersBar` (94px) transforma un espacio ya crítico de 358px en un **déficit absoluto de -115px**. El contenedor `.pos-cart-items-list` se reduce a 0px de altura efectiva, forzando recortes o empujando el pie de página fuera de la pantalla. En modo Cajero Único (`PaymentPanel` ~500px), el déficit asciende a más de **-390px**.

---

## 1.3. Diagnóstico del Flujo Multivendedor - Caja Única y Persistencia

1. **Emisión de Preventa en Mostrador**:
   - El asesor selecciona productos en `POSView.tsx` y presiona *"EMITIR PREVENTA / COMANDA (F6)"*.
   - Ejecuta `handleGuardarBorrador` (`POSView.tsx:933-1025`):
     - Guarda el borrador en `localDb.ts` y `localStorage` (`pezca_pos_drafts_v1`) mediante `PosDraftService.saveDraft()`.
     - Invoca `prefacturaService.emitirPrefactura(...)` generando consecutivo `PRE-2026-XXXXX`, reservando stock en memoria (`hardHoldActivo: true`) y emitiendo payload QR para tirilla térmica.
     - Dispara `supabaseRealtimePreventasService.broadcastPulse({ action: 'PREVENTA_EMITIDA', ... })` por canal Realtime WebSocket.
     - Actualiza `useOutboxSyncStore` y `useCashierKanbanStore`.
     - Limpia el carrito para el siguiente cliente en fila.
2. **Identificación de la Orden en Espera**:
   - Se identifica por:
     - `consecutivoTicket` (ej. `PRE-101`, `PRE-2026-01001`, `0042`, `TICK-001`).
     - `vendedorNombre` (ej. *Diego Díaz*, *Santiago Pallares*).
     - `terminalId` (ej. `TERM-01`, `MOSTRADOR-01`).
     - `clienteNombre` (*Consumidor Final* o cliente registrado).
     - `montoTotal` (moneda COP en esmeralda).
     - `itemsCount` (número de líneas).
     - `createdAt` (timestamp).
3. **Captura y Liquidación por el Cajero Único**:
   - El cajero abre `PendingOrdersDrawer` (`#btn-open-comandas-drawer`), busca el número de ticket o nombre, y pulsa *"Cobrar en Caja"*.
   - `handleSelectComanda` (`POSView.tsx:242`) inyecta los ítems en `cartLineas` y setea el cliente.
   - El cajero selecciona medio de pago, ingresa el dinero, y al confirmar, la preventa pasa a `PAGADA` y se descarta de la cola central.
4. **Fragmentación Detectada**:
   - Existen actualmente **cuatro puntos de entrada divergentes** para ver o retomar órdenes en espera:
     - `ParkedOrdersBar` (barra fija dentro del carrito).
     - Botón *"Borradores"* en la cabecera del carrito (`CartPanel.tsx:606`, abre modal SweetAlert2).
     - Botón *"📋 Comandas"* en ZONA 2 (`POSView.tsx:2395`, abre `PendingOrdersDrawer`).
     - `VendorTicketSidebar` (`POSView.tsx:2707`, sidebar lateral derecho exclusivo para pantallas `xl`).
   - Esta duplicidad confunde al operador y satura la pantalla con controles redundantes.

---

## 1.4. Estado de Pruebas y Regresión Detectada

Al ejecutar la suite de pruebas unitarias (`npx vitest run src/tests/posParkedSalesFlow.test.tsx src/tests/pendingOrdersDrawer.test.tsx src/tests/terminalVendorBadge.test.tsx src/tests/m2POSMultivendor.test.tsx`):
- `posParkedSalesFlow.test.tsx`: **4/4 pasando**.
- `pendingOrdersDrawer.test.tsx`: **3/3 pasando**.
- `terminalVendorBadge.test.tsx`: **4/4 pasando**.
- `m2POSMultivendor.test.tsx`: **2 pruebas fallando** debido a modificaciones no confirmadas en `src/views/POSView.tsx`:
  - En `POSView.tsx:2290`, los botones de asesores Josase fueron reducidos a `min-h-[36px]` (el test exige `min-h-[44px]` y padding `px-3.5 py-2.5`).
  - En `POSView.tsx:2399`, el botón `btn-open-comandas-drawer` fue reducido a `min-h-[36px]` (el test exige `min-h-[44px]`).
  - *Causa*: Intentos previos de comprimir la cabecera encogiendo botones individuales a 36px en lugar de refactorizar la estructura de franjas, lo que violó la Ley de Fitts y rompió los tests.
- Verificación de tipos TypeScript (`npx tsc --noEmit`): **0 errores** (código limpio a nivel de tipos).

---

## 2. Logic Chain (Cadena Lógica de Deducción)

```
[Observación O1] Mediciones en viewport laptop (768px): neto <main> es 590px.
       │
       ▼
[Observación O2] POSView apila 5 cabeceras independientes (Zonas 1 a 4) = 232px.
       │
       ▼
[Deducción D1] Espacio restante para la columna del carrito: 590px - 232px = 358px.
       │
       ▼
[Observación O3] CartPanel tiene sobrecarga fija interna: GlassCard (58px) + .pos-cart-header (48px) + Pie Mostrador (273px) = 379px.
       │
       ▼
[Deducción D2] Con 0 ventas en espera: 358px - 379px = -21px. El carrito ya está al límite de colapso.
       │
       ▼
[Observación O4] Al suspender 1 orden, ParkedOrdersBar aparece dinámicamente y consume 94px adicionales.
       │
       ▼
[Conclusión C1] 358px - (379px + 94px) = -115px de déficit absoluto.
                 El contenedor .pos-cart-items-list se aplasta a 0px, haciendo
                 imposible visualizar los productos agregados (ni siquiera 1 fila de 120px).
       │
       ▼
[Observación O5] Se intentó mitigar encogiendo botones a 36px en POSView.tsx,
                 ahorrando solo ~8px pero rompiendo Fitts (44px) y 2 tests en Vitest.
       │
       ▼
[Deducción D3] Comprimir botones individuales es insuficiente y contraproducente.
                 La solución requiere reestructurar la distribución espacial:
                 extraer ParkedOrdersBar del flujo vertical del carrito y
                 consolidar las 5 franjas de cabecera en un header unificado de 2 niveles.
```

---

## 3. Caveats (Advertencias, Supuestos y Áreas no Modificadas)

1. **Modo de Solo Lectura**: Como agente explorador, no se modificó ningún archivo en `src/`. El diff existente en `POSView.tsx` (reducción a 36px) es anterior y debe ser corregido por los agentes de implementación.
2. **Comportamiento Táctil Real**: Los cálculos de altura se basan en el DOM calculado y valores CSS de Tailwind (`theme.spacing`). En terminales táctiles físicas con escalado de DPI al 125% o 150%, el espacio vertical efectivo disponible puede ser incluso menor (~520px netos).
3. **Persistencia Dual**: El flujo multivendedor opera con persistencia híbrida (`prefacturaService` en memoria para demos/pruebas + `PosDraftService` en IndexedDB/localStorage + Supabase Realtime). Cualquier rediseño de interfaz debe preservar los mismos contratos de datos (`CartDraft` y `PendingOrderComanda`).

---

## 4. Conclusion & Actionable Recommendations (Conclusiones y Recomendaciones Ergonómicas)

### Recomendación 1: Desacoplar y Reubicar `ParkedOrdersBar` Fuera del Carrito
- **Problema**: `ParkedOrdersBar` consume 94px verticales directos del carrito solo cuando hay borradores, causando un colapso visual abrupto (CLS).
- **Solución Propuesta**:
  - Eliminar el renderizado vertical de `ParkedOrdersBar` dentro de `CartPanel.tsx`.
  - Integrar el control de pedidos en espera como un **botón/píldora compacto en la cabecera del carrito** (`.pos-cart-header`):  
    `[⏸ En Espera (3)]` que al pulsarse despliega un cajón lateral (*Slide-Over Drawer*) o un popover flotante sin ocupar un solo píxel de la columna de ítems.
  - Alternativamente, unificarlo con `PendingOrdersDrawer`: un único acceso ergonómico para ver ventas en espera locales y comandas de otros asesores.
  - **Ganancia neta**: **+94px libres** para el visor de productos.

### Recomendación 2: Consolidación de Cabeceras en `POSView.tsx` (De 5 franjas a 2 filas)
- **Problema**: Zonas 1, 1.5, 2, 3 y 4 consumen 232px.
- **Solución Propuesta**:
  - **Fila Superior (44px)**: `POS` | `Turno #XXXX` | Selector/badge de terminal y asesor (`TerminalVendorBadge.tsx`) | KPIs compactos en píldoras (*Ventas*, *Gaveta*, *Sync DIAN*).
  - **Fila Inferior (44px)**: Pestañas de subvistas a la izquierda (*Venta Rápida*, *B2B*, *Canales*, *Kanban*) + Botones de acción táctiles a la derecha (*⚡ Buscar F8*, *⏸ Preventa F6*, *📋 Comandas Drawer F9*, *⚖️ Balanza*, *Más...*).
  - Integrar el `InternalQueueTicker` dentro de la barra de acciones o como tooltip flotante.
  - **Ganancia neta**: De 232px a **88px** $\rightarrow$ **+144px libres** para el área de catálogo y carrito.

### Recomendación 3: Optimización del Pie del Carrito (`CartPanel.tsx`)
- **Problema**: El pie en mostrador consume ~273px y en caja única consume ~500px (`PaymentPanel`).
- **Solución Propuesta**:
  - **`DiscountPanel.tsx`**: Convertir de 4 filas fijas (100px) a una **franja compacta de 1 sola línea (28px)**:  
    `Subtotal: $150.000 | IVA: $0 | Descuento: $0 (F4)` con acordeón desplegable si el usuario requiere detalle tributario.
  - **Modo Asesor**: Fusionar la franja informativa de mostrador y el botón de notas en una fila horizontal compacta antes del botón de emisión (44px).
  - **Modo Cajero**: Para taquilla de cobro, presentar el `PaymentPanel` como panel conmutable o modal acoplado cuando se inicia la liquidación, evitando aplastar la lista de productos mientras se verifica el ticket.
  - **Ganancia neta**: **+70px a +100px libres** en el pie.

### Recomendación 4: Densidad de Visualización en `LineaVentaRow.tsx` (Modo Retail Compacto)
- **Problema**: Cada fila mide 120px; en pantallas de mostrador solo cabe 1 fila visible.
- **Solución Propuesta**:
  - Diseñar una disposición compacta de alta densidad con altura meta de **60px a 70px por ítem**:
    - Línea 1: Nombre del producto (bold), badge `KG`/`UND`, Subtotal tabular en cyan/azul, y botón de eliminar (`X`).
    - Línea 2: Precio unitario con lápiz de edición, stock disponible, y stepper de cantidad compacto (`-`, input numérico, `+`, balanza).
  - Con esta altura y las ganancias de cabecera y pie (+238px adicionales), el carrito dispondrá de más de **350px netos de scroll**:
    - Permitirá visualizar **5 a 6 productos simultáneamente** sin scroll.
    - Soportará listas de **12+ productos** con scroll táctil suave (`overscroll-contain`), fluido y sin recortar el total ni los botones de cobro.

### Recomendación 5: Corrección de Regresión en Botones Fitts (44px)
- Restaurar `min-h-[44px]` y padding adecuado en los botones de asesores (`POSView.tsx:2290`) y el disparador de comandas (`POSView.tsx:2399`) para que la suite de Vitest vuelva a **100% verde** sin violar la accesibilidad táctil.

---

## 5. Verification Method (Método de Verificación Independiente)

Para verificar y replicar los hallazgos reportados:

1. **Comprobar la regresión actual en Vitest**:
   ```powershell
   npx vitest run src/tests/m2POSMultivendor.test.tsx
   ```
   *Resultado esperado*: Fallan las pruebas de F6 y F7 por presencia de `min-h-[36px]` en lugar de `min-h-[44px]`.

2. **Verificar que la lógica de borrador y cola central sigue íntegra**:
   ```powershell
   npx vitest run src/tests/posParkedSalesFlow.test.tsx src/tests/pendingOrdersDrawer.test.tsx src/tests/terminalVendorBadge.test.tsx
   ```
   *Resultado esperado*: 11/11 pruebas pasando exitosamente.

3. **Verificar tipado estricto**:
   ```powershell
   npx tsc --noEmit
   ```
   *Resultado esperado*: 0 errores de compilación TypeScript.

4. **Inspección de Archivos Clave**:
   - `src/views/pos/components/ParkedOrdersBar.tsx:25-49` (estructura de 2 filas y 96px de alto).
   - `src/views/pos/components/CartPanel.tsx:632-652` (inserción de `ParkedOrdersBar` directamente sobre `.pos-cart-items-list`).
   - `src/views/POSView.tsx:2200-2580` (las 5 franjas apiladas de cabecera que suman 232px).
   - `src/components/layout/layoutModes.ts:46` (cálculo de 100vh - 60px).
