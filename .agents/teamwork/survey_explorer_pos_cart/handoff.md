# Reporte de Exploración e Investigación Arquitectónica: Carrito POS Multivendedor

**Fecha:** 2026-11-08  
**Agente:** Explorer (`survey_explorer_pos_cart`)  
**Misión:** Auditoría exhaustiva de `POSMultivendorCart.tsx`, `POSMultivendorView.tsx`, stores y hooks de carrito para la ejecución quirúrgica de la Tarea 1 (SPEC-057).  
**Destinatario:** Orchestrator (`214a0168-c4c8-4555-84a8-e65c4fad7287`)

---

## 1. Observation (Observación Directa del Código y Estado Actual)

### 1.1. Ubicación y Estructura de Componentes Clave

1. **`POSMultivendorCart.tsx`**:
   - **Ruta real:** `src/views/pos/components/POSMultivendorCart.tsx` (289 líneas).
   - **Contenedor principal (`aside`):**
     ```tsx
     // Líneas 76-79
     <aside 
       data-testid="pos-multivendor-cart"
       className="w-80 sm:w-96 md:w-[380px] lg:w-[420px] bg-white flex flex-col justify-between h-full border-l border-slate-200 select-none shrink-0 shadow-lg z-10"
     >
     ```
   - **Tres secciones internas:**
     - **Cabecera compacta (48px):** Líneas 81-113 (`h-12 px-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0`). Muestra icono, título "Carrito de Ventas", nombre del asesor, badge de conteo y botón `btn-vaciar-carrito`.
     - **Lista de ítems:** Líneas 116-206 (`<div data-testid="pos-cart-items-list" className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5">`).
     - **Pie fijo de acciones y totales:** Líneas 209-286 (`<div className="p-3 bg-slate-50 border-t border-slate-200 shrink-0 space-y-2">`) con notas de despacho, desglose de subtotal, descuento, total y botones gigantes F6 (`btn-emitir-preventa-f6`) y F2 opcional (`btn-cart-cobrar-caja`).

2. **`POSMultivendorView.tsx`**:
   - **Ruta real:** `src/views/pos/components/POSMultivendorView.tsx` (209 líneas). *Nota: reside en `components/`, no directamente en la raíz de `views/pos/`*.
   - **Contenedor maestro:** Línea 100-103 (`h-screen w-screen flex flex-col bg-slate-100 text-slate-900 font-sans overflow-hidden select-none`).
   - **Layout horizontal desktop:**
     - Barra superior: `POSMultivendorLightHeader` (56px).
     - Columna catálogo: 75% ancho (`flex-1 min-h-0 flex flex-col overflow-hidden`, líneas 165-178).
     - Columna carrito: 25% / 400px (`h-full min-h-0 overflow-hidden`, líneas 181-203).

3. **Integración en `POSView.tsx`**:
   - **Ruta real:** `src/views/POSView.tsx` (líneas 2265-2320).
   - Renderiza `POSMultivendorView` cuando `activeSubView === 'venta_pos'`.
   - Mapea el estado reactivo del hook `usePOSCart` hacia las props de `POSMultivendorView`.

---

### 1.2. Análisis de Renderizado de Filas de Ítems en el Carrito

En `POSMultivendorCart.tsx` (líneas 131-204):
```tsx
items.map((item, index) => {
  const name = getProductName(item.product);
  const unitPrice = getProductPrice(item);
  const unit = getProductUnit(item.product);
  const qty = Number(item.cantidad) || 0;
  const lineSubtotal = unitPrice * qty;

  return (
    <div 
      key={item.id || `${item.product.id}_${index}`}
      data-testid={`cart-row-${index}`}
      className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-100 transition-all flex flex-col gap-1.5 shadow-xs"
    >
      {/* Nivel 1: Nombre + botón eliminar */}
      ...
      {/* Nivel 2: Precio unitario estático + Stepper táctil + Subtotal */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="text-[11px] font-mono text-slate-400">
          ${unitPrice.toLocaleString('es-CO')} × {unit}
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-slate-100 rounded-lg border border-slate-200">
            <button ... onClick={() => onUpdateQuantity(index, -1)}>
              <Minus size={14} ... />
            </button>

            <span 
              data-testid={`cart-qty-${index}`}
              className="min-w-[36px] text-center font-mono font-black text-xs sm:text-sm text-slate-900 px-1"
            >
              {qty}
            </span>

            <button ... onClick={() => onUpdateQuantity(index, 1)}>
              <Plus size={14} ... />
            </button>
          </div>

          <span className="font-mono font-black text-xs sm:text-sm text-emerald-700 text-right min-w-[65px]">
            ${lineSubtotal.toLocaleString('es-CO')}
          </span>
        </div>
      </div>
    </div>
  );
})
```

**Hallazgos Clave:**
1. **Ausencia de inputs numéricos:**
   - La cantidad (`cantidad`) se renderiza **únicamente como texto estático dentro de un `<span>`** (`<span data-testid={`cart-qty-${index}`}>{qty}</span>`).
   - El precio unitario (`unitPrice`) se renderiza **únicamente como texto estático dentro de un `<div>`** (`<div className="text-[11px] font-mono text-slate-400">${unitPrice.toLocaleString('es-CO')} × {unit}</div>`).
   - No existe ningún elemento `<input>` para cantidad ni para precio en la fila.
2. **Navegación continua [Tab] inexistente:**
   - Al no existir inputs en las filas, es imposible tabular entre cantidad y precio. Al presionar `Tab`, el foco salta arbitrariamente entre botones de incremento/decremento y botones de cabecera.
3. **Imposibilidad de digitación directa:**
   - La modificación de cantidad está limitada a saltos de $\pm 1$ mediante los botones `+` y `-`.
   - Para productos pesables por balanza (e.g., $1.345$ kg), el usuario no puede escribir el peso directamente en el carrito.

---

### 1.3. Estado del Botón `[+ Desc]` por Ítem

1. **Estado actual en `POSMultivendorCart.tsx`:**
   - El icono `Tag` está importado en la línea 11 (`import { ..., Tag, ... } from 'lucide-react'`), pero **nunca se utiliza en el JSX**.
   - No existe ningún botón o trigger de descuento en la fila del ítem.
2. **Falta en los tipos:**
   - La interfaz `MultivendorCartItem` (líneas 16-22):
     ```typescript
     export interface MultivendorCartItem {
       id?: string;
       product: Product;
       cantidad: number | string;
       precioOverride?: number;
       notas?: string;
     }
     ```
     **No tiene los campos `descuentoPct` ni `descuentoMonto`**.
   - La fórmula del subtotal de línea en la línea 136 es estrictamente `const lineSubtotal = unitPrice * qty;`, omitiendo cualquier descuento a nivel de ítem.
3. **Props requeridas:**
   - `POSMultivendorCartProps` carece de callback para actualización de descuento por ítem (e.g. `onUpdateDiscount?: (index: number, discountPct: number) => void`).

---

### 1.4. Análisis de Altura y Distribución Flexbox (Regla del 85%)

1. **Contenedor `aside`:**
   - Clase actual: `className="w-80 sm:w-96 md:w-[380px] lg:w-[420px] bg-white flex flex-col justify-between h-full border-l border-slate-200 select-none shrink-0 shadow-lg z-10"`
   - Observación: Usa `justify-between`. Para cumplir estrictamente con el layout vertical anclado de SPEC-057, debe ser `flex flex-col h-full min-h-0`.
2. **Área de ítems:**
   - Clase actual: `className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5"`
   - **Defecto crítico observado:** Falta la clase `min-h-0`. Sin `min-h-0`, en CSS Flexbox estándar el contenedor hijo con scroll puede desbordar la ventana padre en ciertos navegadores (Firefox / Chrome) cuando la lista de ítems crece.
   - Clase recomendada: `flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5`.
3. **Proporción de altura visual:**
   - Cabecera: `h-12` (48px) $\approx 5\%$ en pantallas de 900-1080px.
   - Footer inferior: `p-3 space-y-2` ($\approx 150-180$px) $\approx 15-18\%$ en pantallas estándar.
   - Con `flex-1 min-h-0`, la lista de ítems ocupa efectivamente entre el **80% y 85%** de la altura vertical útil, cumpliendo la especificación.

---

### 1.5. Acciones de Estado y Conexión con Stores

1. **Hook `usePOSCart.ts` (`src/hooks/usePOSCart.ts`):**
   - Cuenta con todas las acciones reactivas listas y probadas:
     - `actualizarCantidad(productoId: string, cantidad: number)` (línea 114)
     - `actualizarDescuentoLinea(productoId: string, descuentoPct: number)` (línea 140)
     - `updateItemPrice(productoId: string, newPrice: number)` (línea 162)
     - `resetItemPrice(productoId: string)` (línea 185)
     - `removerProducto(productoId: string)` (línea 207)
     - `totales`: memoizado reactivo que recalcula `subtotal`, `descuento` y `totalFinal` en $< 10$ms con `calcularTotalesPedido`.
2. **Store Zustand `useMultiVendorPosStore.ts` (`src/stores/useMultiVendorPosStore.ts`):**
   - Dispone de:
     - `actualizarCantidadItem(productoId, cantidad)`
     - `aplicarDescuentoItem(productoId, descuentoPct, supervisorPinAutorizado?, supervisorId?)`
3. **Conexión en `POSView.tsx`:**
   - Líneas 2287-2294 conectan actualmente solo `onUpdateQuantity(index, delta)` mediante:
     ```typescript
     onUpdateQuantity={(idx, delta) => {
       const linea = cartLineas[idx];
       if (linea) {
         const currentQty = Number(linea.cantidad) || 0;
         const newQty = Math.max(0, currentQty + delta);
         actualizarCantidad(linea.productoId, newQty);
       }
     }}
     ```
   - No está conectado aún el cambio directo de precio ni el cambio de descuento de línea hacia `POSMultivendorView`.

---

## 2. Logic Chain (Cadena Lógica de Interacción)

```
[Usuario / Cajero en Terminal]
       │
       ▼
[POSMultivendorCart: Fila de Ítem]
       │
  ┌────┴───────────────────────────┬───────────────────────────────┐
  ▼                                ▼                               ▼
[Input Cantidad (Tab)]     [Input Precio (Tab)]          [Botón micro [+ Desc]]
  │                                │                               │
  ├─ Digitación / Stepper          ├─ Digitación precio unitario   ├─ Popover / Input descuento (%)
  │                                │                               │
  ▼                                ▼                               ▼
onSetQuantity(idx, qty)    onUpdatePrice(idx, price)      onUpdateDiscount(idx, pct)
  │                                │                               │
  └────────────────────────────────┼───────────────────────────────┘
                                   │
                                   ▼
                    [POSMultivendorView (Props)]
                                   │
                                   ▼
                       [POSView.tsx (Handlers)]
                                   │
                                   ▼
                       [usePOSCart (Zustand/Hook)]
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
       actualizarCantidad /           calcularTotalesPedido (<10ms)
       updateItemPrice /              Subtotal, Descuento, Total
       actualizarDescuentoLinea
                    │                             │
                    └──────────────┬──────────────┘
                                   ▼
                    Re-render reactivo a 60 FPS
```

---

## 3. Layout Analysis (Análisis de Alturas, Flexbox y Clases CSS)

| Sección | Elemento | Clases Actuales | Diagnóstico & Ajuste Mandatorio (SPEC-057) |
| :--- | :--- | :--- | :--- |
| **Contenedor Principal** | `aside` | `w-80 ... flex flex-col justify-between h-full ...` | **Ajustar:** Quitar `justify-between`, usar `flex flex-col h-full min-h-0`. |
| **Cabecera** | `header` | `h-12 px-3.5 bg-slate-50 border-b border-slate-200 shrink-0` | **Correcto:** Fijo 48px, no encoge (`shrink-0`). |
| **Lista de Productos** | `items-list` | `flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5` | **Ajustar:** Agregar obligatoriamente `min-h-0` (`flex-1 min-h-0 overflow-y-auto`). Asegura el 85% de altura útil sin romper el scroll. |
| **Fila de Ítem** | `cart-row` | `p-2.5 rounded-xl bg-white hover:bg-slate-50 border ...` | **Ajustar:** Distribuir inputs de cantidad y precio con tamaño táctil $\ge 44-48$px y ancho compacto para evitar truncamiento. |
| **Pie de Carrito** | `footer` | `p-3 bg-slate-50 border-t border-slate-200 shrink-0 space-y-2` | **Ajustar:** Asegurar `shrink-0 mt-auto` para anclarlo rígidamente al fondo. |

---

## 4. Caveats & Risks (Riesgos Identificados y Mitigaciones)

1. **Riesgo de Regresión en Tests Existentes (`posMultivendorLightSaaS.test.tsx`):**
   - *Observación:* La prueba existente en `src/tests/posMultivendorLightSaaS.test.tsx` (líneas 258-264) evalúa:
     ```typescript
     expect(screen.getByTestId('btn-cart-inc-0')).toBeInTheDocument();
     expect(screen.getByTestId('btn-cart-dec-0')).toBeInTheDocument();
     expect(screen.getByTestId('cart-qty-0')).toHaveTextContent('2.5');
     fireEvent.click(screen.getByTestId('btn-cart-inc-0'));
     expect(onUpdateQuantity).toHaveBeenCalledWith(0, 1);
     ```
   - *Riesgo:* En el DOM, un `<input>` es un elemento vacío; `input.textContent` es `""`. Si cambiamos `<span data-testid="cart-qty-0">` por `<input data-testid="cart-qty-0">`, `toHaveTextContent('2.5')` fallará inmediatamente.
   - *Mitigación:* Mantener el contenedor o span con `data-testid={`cart-qty-${index}`}` (o incorporar el texto de fallback/valor) e incorporar `data-testid={`cart-qty-input-${index}`}` y `data-testid={`cart-unit-price-input-${index}`}`, manteniendo los botones `btn-cart-inc-${index}` y `btn-cart-dec-${index}` intactos para compatibilidad retroactiva 100%.

2. **Riesgo de Conflicto de Foco y Atajos Globales de Teclado:**
   - *Riesgo:* Si el operador está digitando una cantidad o precio y presiona teclas que coinciden con atajos del sistema (o escanea con la pistola de códigos), el foco o los caracteres pueden corromperse.
   - *Mitigación:* Los inputs numéricos deben tener:
     - `onFocus={(e) => e.target.select()}` para auto-seleccionar todo el texto al recibir foco.
     - `tabIndex={0}` en los inputs editables y `tabIndex={-1}` en los botones micro `+` y `-` para que la tecla [Tab] fluya de forma ininterrumpida:
       `[Cantidad Ítem 0] -> [Tab] -> [Precio Ítem 0] -> [Tab] -> [[+ Desc] Ítem 0] -> [Tab] -> [Cantidad Ítem 1] ...`

3. **Riesgo de Redondeo en Precios y Decimales en Pesaje:**
   - *Riesgo:* En Colombia (COP), los precios son enteros sin centavos. En cambio, los kilogramos tienen hasta 3 decimales (e.g. `1.345`).
   - *Mitigación:*
     - Input Cantidad: `step={isKg ? 'any' : '1'}`, `inputMode="decimal"`, `min="0.001"`.
     - Input Precio Unitario: `step="1"`, `inputMode="numeric"`, `min="0"`.

---

## 5. Recommendations for Tarea 1 & Subsequent Tasks

### 5.1. Para la Tarea 1 (Inmediata)
1. **Extender `MultivendorCartItem` en `POSMultivendorCart.tsx`:**
   ```typescript
   export interface MultivendorCartItem {
     id?: string;
     product: Product;
     cantidad: number | string;
     precioOverride?: number;
     descuentoPct?: number;
     descuentoMonto?: number;
     notas?: string;
   }
   ```
2. **Extender `POSMultivendorCartProps`:**
   ```typescript
   export interface POSMultivendorCartProps {
     items: MultivendorCartItem[];
     onUpdateQuantity: (index: number, delta: number) => void;
     onSetQuantity?: (index: number, quantity: number) => void;
     onUpdatePrice?: (index: number, price: number) => void;
     onUpdateDiscount?: (index: number, discountPct: number) => void;
     onRemoveItem: (index: number) => void;
     onClearCart: () => void;
     subtotal: number;
     descuento?: number;
     total: number;
     onEmitirComanda: () => void;
     onCobrarCaja?: () => void;
     isSubmitting?: boolean;
     activeVendorName?: string;
     cliente?: Cliente | null;
     notasDespacho?: string;
     onNotasDespachoChange?: (val: string) => void;
     isModoCajero?: boolean;
   }
   ```
3. **Actualizar el Nivel 2 de la Fila del Carrito:**
   - Implementar input de cantidad continuo con auto-selección en foco.
   - Implementar input de precio unitario continuo con prefijo `$`.
   - Incorporar botón micro `[+ Desc]` con soporte para descuento porcentual por ítem (`data-testid={`btn-cart-desc-${index}`}`).
   - Subtotal calculado reactivamente: `unitPrice * qty * (1 - (item.descuentoPct || 0)/100)`.
4. **Garantizar Layout 85%:**
   - Añadir `min-h-0` en `pos-cart-items-list`.
   - Reemplazar `justify-between` por `h-full min-h-0 flex flex-col`.
5. **Crear `src/tests/posCartEditableRow.test.tsx` (TDD):**
   - Verificar renderizado de inputs continuos para cantidad y precio unitario.
   - Verificar navegación con la tecla [Tab] entre cantidad, precio y descuento.
   - Verificar disparo de callbacks al cambiar cantidad, precio y descuento.
   - Verificar que los botones de incremento/decremento siguen funcionando.

### 5.2. Hoja de Ruta para Tareas Posteriores
- **Tarea 2:** Añadir botón anclado `+ Descuento (F4)` en el bloque de totales del footer de `POSMultivendorCart.tsx` con popover [% / $].
- **Tarea 3:** Conectar `onOpenScaleModal` en `POSMultivendorView.tsx` para abrir inmediatamente `ManualWeightModal` al escanear o seleccionar producto KG.
- **Tarea 4:** Implementar listener unificado de atajos de teclado F8, Ctrl+K, F6, F2, F9, Esc.
- **Tarea 5:** Integrar umbrales de margen y disparar `SupervisorPinModal` si Descuento > 10% o Precio < Costo + 15%.
- **Tarea 6:** Quality gate final: `tsc --noEmit`, Vitest 100% y comprobación responsive.

---

## 6. Verification Method

Para verificar independientemente este diagnóstico y validar la implementación de la Tarea 1:

1. **Ejecución de suite existente (sin regresiones):**
   ```powershell
   npx vitest run src/tests/posMultivendorLightSaaS.test.tsx
   ```
   *Criterio de éxito:* 8 tests pasando en verde (0 fallos).

2. **Ejecución de la nueva suite TDD de Tarea 1:**
   ```powershell
   npx vitest run src/tests/posCartEditableRow.test.tsx
   ```
   *Criterio de éxito:* 100% de los tests pasando en verde.

3. **Verificación de tipado estricto TypeScript:**
   ```powershell
   npx tsc --noEmit
   ```
   *Criterio de éxito:* 0 errores de compilación TypeScript en todo el proyecto.

4. **Verificación visual y responsive:**
   - Inspeccionar con Chrome DevTools en vista móvil (375px) y desktop (1280px) confirmando que el contenedor de ítems ocupa el 85% de la altura vertical útil sin desbordamientos ni scroll horizontal.
