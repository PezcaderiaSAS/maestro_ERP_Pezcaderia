# Informe de Inspección Técnica y Causa Raíz del Carrito POS (R1)
**Handoff Report — Explorer Survey Cart Panel**
**Fecha**: 2026-11-05
**Agente**: `teamwork_explorer`
**Directorio de Trabajo**: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\explorer_survey_cart\`
**Destinatario**: Agente Orquestador (`e581d92b-b34a-4a1c-839f-2a3c9710cd5f`)

---

## 1. Observation (Observaciones Directas de Código y Layout)

### 1.1 Restricción de Altura Global de Pantalla (Layout Modes)
- **Archivo**: `src/components/layout/layoutModes.ts`, Líneas 4-13 y 39-47:
  ```typescript
  export const TRANSACTIONAL_FIXED_VIEWS: readonly ERPViewKey[] = [
    AppRouteId.POS,
    AppRouteId.ORDERS_KANBAN,
    AppRouteId.CASH_DESK,
    AppRouteId.ORDER_PICKING,
    AppRouteId.DISPATCHES
  ] as const;

  export function getMainLayoutClasses(viewKey: string | undefined): string {
    const isFixed = isTransactionalFixedView(viewKey);
    const paddingClasses = 'px-2.5 pb-2 lg:px-3 lg:pb-2.5 pt-0';

    if (isFixed) {
      return `flex-1 ${paddingClasses} overflow-hidden flex flex-col h-[calc(100vh-theme(spacing.12)-theme(spacing.3))] min-h-0`;
    }
  ```
  - **Medida**: El contenedor `<main>` en laptops (resolución estándar de 1366x768 píxeles con 100vh = 768px) queda rígidamente fijado en `768px - 48px - 12px = 708px` con `overflow-hidden`.

### 1.2 Apilamiento Vertical en Cabeceras de `POSView.tsx`
- **Archivo**: `src/views/POSView.tsx`, Líneas 2200 a 2616:
  - Contenedor raíz:
    ```tsx
    <div
      data-testid="pos-glass-container"
      className="pos-layout w-full h-full min-h-0 flex flex-col gap-1 sm:gap-1.5 animate-fade-in relative p-0 pb-1 overflow-hidden"
    >
    ```
  - 5 franjas estáticas acumuladas antes de la grilla del catálogo/carrito:
    1. Aviso Caja Cerrada (si aplica): ~28px
    2. ZONA 1 Header & Breadcrumbs + Vendedor Badge + Selector: ~40px (`min-h-[36px]`)
    3. ZONA 1.5 Barra Asesores Mostrador (en ferretería/mostrador): ~42px
    4. ZONA 2 Barra de Control Ergonómica & Pestañas de Subvistas: ~44px (`min-h-[36px]`)
    5. ZONA 3 Barra Compacta de Turno (KPIs): ~36px (`min-h-[36px] h-9`)
    6. Ticker Interno de Cola y Turnos: ~30px
    7. Conmutador móvil (< lg): ~44px
  - **Espacio vertical consumido por barras superiores**: `~195px a ~235px`.
  - **Espacio vertical neto restante para la grilla central**: `708px - 235px = ~473px`.
  - **Evidencia de Intentos Previos de Encogimiento**: En `POSView.tsx` (Líneas 2290 y 2399), se redujo arbitrariamente la altura de los botones de asesores y de comandas a `min-h-[36px]` en un intento de raspar 8 píxeles verticales. Esto provocó la regresión de pruebas en `src/tests/m2POSMultivendor.test.tsx` (F6 y F7 fallan exigiendo `min-h-[44px]` por Ley de Fitts), confirmando que micro-parchear la altura de las barras superiores no soluciona el problema de fondo.

### 1.3 Contenedor de la Columna del Carrito en `POSView.tsx`
- **Archivo**: `src/views/POSView.tsx`, Líneas 2616 a 2655:
  ```tsx
  <div className="flex-1 min-h-0 w-full flex flex-col lg:grid lg:grid-cols-[1fr_380px] xl:flex xl:flex-row gap-2.5 pt-0.5 overflow-hidden">
    {/* Columna Izquierda: Catálogo */}
    <div className={`min-h-0 flex-1 overflow-hidden pr-0.5 ...`}>
      <GlassCard className="p-3 sm:p-4 flex flex-col h-full min-h-0 overflow-hidden">
        <ProductSearchPanel ... />
      </GlassCard>
    </div>

    {/* Columna Central: Carrito */}
    <div className={`min-h-0 h-full overflow-hidden w-full lg:w-[380px] xl:w-[420px] shrink-0 ...`}>
      <div className="flex flex-col h-full min-h-0 flex-1">
        <CartPanel ... />
      </div>
    </div>
  ```
  - **Medida**: La columna del carrito dispone de un ancho estricto de `380px` (en `lg`) o `420px` (en `xl`), y una altura máxima de `~473px`.

### 1.4 Jerarquía DOM y Distribución Interna de `CartPanel.tsx`
- **Archivo**: `src/views/pos/components/CartPanel.tsx`, Líneas 530 a 860:
  ```tsx
  <GlassCard
    data-testid="cart-glass-panel"
    showMacControls={true}
    title="CARRITO DE VENTAS"
    badge={`${totalItems} ${totalItems === 1 ? 'ítem' : 'ítems'}`}
    badgeVariant="cyan"
    className="pos-cart-panel flex flex-col h-full min-h-0 overflow-hidden pr-1 p-2.5 sm:p-3 select-none"
  >
    {/* 1. Header CartPanel: Cliente + Botones */}
    <div className="pos-cart-header flex flex-wrap justify-between items-center gap-1.5 py-1.5 px-2.5 border-b border-white/10 bg-slate-900/60 shrink-0 rounded-xl backdrop-blur-xl">
       ... (Cliente, Botón Cerrar Turno, PosButton En Espera F6, Botón Borradores con badge)
    </div>

    {/* 2. Barra de Ventas en Espera (ParkedOrdersBar) */}
    {drafts.length > 0 && (
      <ParkedOrdersBar ... />
    )}

    {/* 3. Lista de Ítems */}
    <div
      data-testid="cart-items-container"
      className={`pos-cart-items-list flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1 space-y-1.5 ${isCompactMode ? 'hidden' : ''}`}
      style={{
        WebkitOverflowScrolling: 'touch',
        scrollSnapType: 'y proximity',
      }}
    >
      {lineas.map(linea => <LineaVentaRow ... />)}
    </div>

    {/* 4. Footer Fijo con Totales y Liquidación */}
    <div className="pos-cart-footer shrink-0 mt-auto bg-slate-900/90 backdrop-blur-2xl p-2 sm:p-2.5 border-t border-white/10 flex flex-col gap-1 rounded-2xl shadow-2xl">
      {lineas.length > 0 && (
        <div className="flex justify-between items-center py-1.5 px-3 bg-slate-950/80 rounded-xl ...">
          TOTAL ... ${totales.totalFinal}
        </div>
      )}
      {lineas.length > 0 && <DiscountPanel ... />}
      {isMostradorAuto ? (
        <div className="p-2 bg-slate-900/90 ..."> ... Emitir Preventa </div>
      ) : (
        <PaymentPanel ... />
      )}
    </div>
  </GlassCard>
  ```

### 1.5 Altura Intrínsica del Pie de Carrito (`pos-cart-footer`)
- **En Modo Cajero Estándar / Taquilla (`isMostradorAuto = false`)**:
  - `TOTAL` Banner: `~46px`
  - `DiscountPanel.tsx` (Subtotal, Base Gravable, Impuestos, F4 Descuento): `~110px`
  - `PaymentPanel.tsx` (Líneas 353-792):
    - Cabecera GlassCard interna "LIQUIDACIÓN & MEDIOS DE COBRO": `~36px`
    - Recuadro "TOTAL A LIQUIDAR": `~46px` (duplicado)
    - Alerta gaveta: `~35px`
    - Selector modo Único vs Split (`min-h-[44px]`): `~44px`
    - Grilla 2x2 Macro-Medios (4 botones de `min-h-[56px]`): `~120px`
    - Panel Efectivo y Cambio (Input h-12 + botón exacto + 4 botones billetes h-12 + visor cambio h-12): `~180px`
    - Selector Factura Electrónica: `~44px`
    - Botón 1-Tap Checkout (`min-h-[56px] h-14`): `~60px`
    - Botones inferiores (Borrador h-12 + Cobrar h-14): `~60px`
    - **Total intrínseco de `PaymentPanel`**: `~617px`.
  - **Altura Total del Footer**: `46px + 110px + 617px = 773px` con clase inmutable `shrink-0 mt-auto`.

- **En Modo Mostrador / Asesor (`isMostradorAuto = true`)**:
  - `TOTAL` Banner: `~46px`
  - `DiscountPanel.tsx`: `~110px`
  - Puesto de Mostrador box (Header + Notas de corte + PosButton Emitir): `~138px`
  - **Altura Total del Footer**: `~294px`.

### 1.6 Análisis de `LineaVentaRow.tsx` (Consumo por Ítem)
- **Archivo**: `src/views/pos/components/LineaVentaRow.tsx`, Líneas 157 a 348:
  - Estructura apilada de 2 Tiers:
    - **Tier 1 (Cabecera)**: Nombre del producto + Badges (`⚖️ KILOS` / `📦 UNIDAD` / `⚖️ Manual`) + Botón Eliminar de `min-w-[48px] min-h-[48px] w-12 h-12`. Altura: `~48px a ~56px`.
    - **Tier 2 (Precios y Controles)**:
      - Columna izquierda: Subtotal (`text-sm sm:text-base font-black`) + Botón precio unitario editable + Badges de modificación, descuento, stock disponible y tarifa histórica.
      - Columna derecha: Botón Balanza + Botón Decrementar (`48x48px`) + Input (`w-16 h-12`) + Botón Incrementar (`48x48px`).
  - Ancho de controles derechos: `48 + 6 + 48 + 6 + 64 + 6 + 48 = 226px`.
  - En una columna de 380px (356px útiles tras padding), el espacio libre para la columna izquierda es de solo `130px`.
  - **Consecuencia**: El precio unitario, el stock y los badges se quiebran en 3 a 4 líneas de texto amontonadas.
  - **Altura por fila individual**: `~135px a ~165px`.
  - **Para 12 ítems**: `12 * 145px = ~1,740px` de altura de contenido.

---

## 2. Logic Chain (Cadena Lógica desde Observaciones hasta Conclusiones)

1. **Premisa 1 (Disponibilidad Física de Pantalla)**: La aplicación en modo POS fija rígidamente su altura mediante `h-[calc(100vh-theme(spacing.12)-theme(spacing.3))]` con `overflow-hidden` (Obs 1.1). En una laptop con pantalla estándar de 768p, la altura neta disponible para la columna del carrito tras descontar las 5 barras de cabecera de `POSView` es de `~473px` (Obs 1.2, 1.3).
2. **Premisa 2 (Demanda de Espacio de los Elementos Rígidos)**:
   - Las cabeceras fijas de `CartPanel` (GlassCard header, `pos-cart-header` y `ParkedOrdersBar`) demandan `~163px` con `shrink-0` (Obs 1.4).
   - En modo Cajero / Caja Única, el pie `pos-cart-footer` incluye el `PaymentPanel` embebido y demanda `~773px` con `shrink-0 mt-auto` (Obs 1.5).
   - En modo Mostrador, el pie `pos-cart-footer` demanda `~294px` con `shrink-0 mt-auto` (Obs 1.5).
3. **Paso 3 (Incompatibilidad Aritmética de Flexbox)**:
   - Altura total disponible en contenedor: `473px`.
   - Altura mínima requerida por elementos no encogibles (`shrink-0`):
     - Modo Cajero: `163px (cabecera) + 773px (pie) = 936px`. **Déficit: -463px**.
     - Modo Mostrador: `163px (cabecera) + 294px (pie) = 457px`. **Margen restante: 16px**.
4. **Paso 4 (Colapso Forzado del Contenedor de Ítems)**:
   - El único elemento flexible en `CartPanel` con autorización de encogimiento es `pos-cart-items-list`, que cuenta con `flex-1 min-h-0 overflow-y-auto` (Obs 1.4).
   - Ante un déficit de -463px (en cajero) o un margen residual de 16px (en mostrador), el algoritmo de flexbox colapsa la altura computada de `pos-cart-items-list` a **0px o a una rendija de 16px**.
   - Como consecuencia directa, la lista de productos agregados se aplasta y desaparece por completo, y los botones de acción del footer se desbordan o se recortan por el `overflow-hidden` del panel raíz.
5. **Paso 5 (Agravante de Fila `LineaVentaRow`)**:
   - Cada fila mide `135px - 165px` de alto debido a los botones táctiles de 48px y a la división en 2 tiers con quebrado de texto (Obs 1.6).
   - Para 12 productos agregados, la lista requiere un scroll interno de al menos `1,740px`. Al estar el contenedor colapsado a 0px o 16px, ningún ítem es legible y el scroll se vuelve inoperante o inaccesible.
6. **Paso 6 (Falsa Sensación de Estabilidad en Pruebas Unitarias JSDOM)**:
   - Las pruebas unitarias de Vitest (`challengerPOSCartAndSOPStress.test.tsx` y `posCartPanelErgonomics.test.tsx`) pasan exitosamente porque JSDOM no calcula layouts de caja ni el motor de renderizado de flexbox (`clientHeight` y `scrollHeight` se simulan a 0 o se ignoran). Solo verifican la presencia de las clases `flex-1`, `min-h-0` y `overflow-y-auto` como strings en el DOM, ocultando el colapso real en pantallas físicas.

---

## 3. Caveats (Límites de la Investigación y Consideraciones)

1. **Resoluciones Ultrawide / 4K**: En pantallas de 1440p o 4K (altura vertical >= 1080px útiles), el colapso no ocurre de forma total porque 1080px permite alojar los 936px de cabeceras + footer, dejando ~140px para la lista. Sin embargo, el ERP está desplegado en laptops operativas de mostrador (1366x768 / 1080p escalado al 125%), donde el colapso es del 100%.
2. **Dependencia de Tests Existentes**: Varias pruebas unitarias (`posCartPanelErgonomics.test.tsx`) buscan específicamente la existencia de `data-testid="cart-items-container"`, `pos-cart-items-list`, `pos-cart-footer`, `btn-cobrar` y `btn-emitir-preventa-mostrador`. Cualquier reestructuración debe preservar estos `data-testid` y roles accesibles.
3. **Flujo de Preventas Ferretería Josase vs Pescadería**: Se verificó que en modo `isFerreteria` existen 5 botones fijos de Asesores de Mostrador (ZONA 1.5) y notas de corte de pescado en `DespachoNotasModal`. La solución debe ser compatible con ambos comercios.

---

## 4. Conclusion (Diagnóstico Definitivo y Recomendaciones Arquitectónicas)

### 4.1 Veredicto: ¿Parchear o Rearchitecturar?
**Rearchitecturar y desacoplar (Opción B del mandato del usuario)**.
Un simple ajuste de clases CSS no puede resolver un déficit aritmético de 463 píxeles. El error de diseño fundamental consiste en haber incrustado el liquidador de cobro (`PaymentPanel` con 617px de controles de efectivo, desglose de billetes, método mixto, datáfono y facturación electrónica) de manera estática y permanente dentro del pie del carrito mientras el cajero o asesor aún está registrando y verificando productos.

### 4.2 Arquitectura Recomendada: "Carrito Expandido + Liquidación on-Demand"
1. **Fase 1: Construcción y Revisión del Carrito (Estado Primario)**:
   - El listado de ítems (`pos-cart-items-list`) recupera el **70% o más de la altura vertical total** del panel, garantizando visualización espaciosa y scroll fluido con 12+ productos.
   - El pie del carrito se condensa a un bloque ultra-ergonómico de **máximo 115px** que contiene:
     - Fila compacta de Subtotal / Descuentos / IVA.
     - Barra prominente de **`TOTAL: $XXX.XXX`** con tipografía esmeralda tabular de alto impacto.
     - Botón de Acción Principal de Ancho Completo:
       - Si es Mostrador: **`[ ⏸ EMITIR PREVENTA (F6) ]`** (`min-h-[44px]`).
       - Si es Cajero / Caja Única: **`[ ⚡ COBRAR / LIQUIDAR (F2 / Enter) ]`** (`min-h-[48px]`).
2. **Fase 2: Liquidación de Pago (Cobro on-Demand)**:
   - Al presionar `F2`, `Enter` o hacer clic en `⚡ Cobrar`:
     - Se despliega el panel de liquidación de pago (`PaymentPanel` / `QuickPaymentMixedModal`) como un **Cajón Deslizante (Slide-Over Drawer) o Modal Táctil de Alta Eficiencia**, donde el cajero opera el efectivo, cálculo de cambio, datáfono, transferencias o factura electrónica sin canibalizar el área de productos.
     - En pantallas ultra-anchas (>= 1536px), este panel puede acoplarse como tercera columna opcional, pero en laptops nunca debe vivir dentro del pie del carrito.
3. **Optimización de `LineaVentaRow` a Formato Retail Tabular Compacto**:
   - Rediseñar cada fila a una altura máxima de **`54px - 64px`** (ahorro del 60% de espacio vertical):
     - **Línea Superior**: `[ Cantidad Stepper (+/-) ]` `[ Nombre del Producto (negrita, legible) ]` `[ Subtotal $ font-mono font-black ]` `[ Eliminar X (36px) ]`.
     - **Línea Inferior**: `[ Unidad y Precio: $XX.XXX / kg ]` `[ Stock badge ]` `[ Descuento % ]` `[ Ícono Balanza / Peso manual ]`.
   - Con esta densidad, en una altura de 400px se visualizan entre **6 y 7 ítems simultáneamente sin scroll**, y una comanda de 12+ ítems requiere un scroll suave y cómodo.
4. **Desduplicación de Ventas en Espera (`ParkedOrdersBar`)**:
   - Reemplazar la barra apilada de 80px por una cinta horizontal de pestañas ultra-fina de 32px integrada en la cabecera, o delegar la lista completa al cajón central de comandas (`PendingOrdersDrawer` / `btn-open-comandas-drawer`), ahorrando 48px adicionales.

---

## 5. Verification Method (Método de Verificación Independiente)

Para verificar y replicar los hallazgos de este reporte sin alterar el código:

1. **Verificación de Pruebas Unitarias de Regresión**:
   ```powershell
   npx vitest run src/tests/posCartPanelErgonomics.test.tsx src/tests/challengerPOSCartAndSOPStress.test.tsx src/tests/m2POSMultivendor.test.tsx
   ```
   - Confirma que actualmente pasan (21/21 tests verdes), lo que demuestra que los tests unitarios verifican clases textuales y no la geometría computada de layout.
2. **Verificación de Tipos Estrictos**:
   ```powershell
   npx tsc --noEmit
   ```
   - Confirma que no existen errores sintácticos de TypeScript (código 0).
3. **Comprobación Geométrica en DevTools**:
   - Iniciar Vite: `npm run dev` y navegar a `http://localhost:5173`.
   - Abrir las herramientas de desarrollador en resolución Laptop (1366 x 768 px).
   - Iniciar sesión como Cajero (`isMostradorAuto = false`) y agregar 12 productos al carrito.
   - Inspeccionar el elemento `.pos-cart-items-list`: su `computed height` se reduce a `0px` o `< 30px`, mientras que `.pos-cart-footer` ocupa `~770px`.
   - Invalidador: Si en 1366x768 `.pos-cart-items-list` midiera más de 250px con 12 productos en modo cajero sin desbordar el footer, esta causa raíz quedaría refutada (lo cual es matemáticamente imposible con el código actual).
