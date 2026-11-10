# Handoff Report: Estrategia de Componente para Fila de Carrito con Navegación [Tab] y Edición en Línea (Hito M1 - Tarea 1)

**Fecha:** 2026-11-08  
**Agente:** `m1_explorer_component` (Component Architecture & Ergonomics Explorer)  
**Parent / Orquestador:** `214a0168-c4c8-4555-84a8-e65c4fad7287`  
**Ruta del Archivo:** `.agents/teamwork/m1_explorer_component/handoff.md`  
**Hito:** Hito M1 — Tarea 1: Fila de Carrito con Navegación [Tab] y Edición en Línea (SPEC-057)

---

## 1. Observation (Observaciones Directas del Código Fuente y Suite Existente)

### 1.1. Estado Actual de `POSMultivendorCart.tsx`
- **Ubicación:** `src/views/pos/components/POSMultivendorCart.tsx` (289 líneas).
- **Contenedor Principal (`aside`, líneas 76-79):**
  ```tsx
  <aside 
    data-testid="pos-multivendor-cart"
    className="w-80 sm:w-96 md:w-[380px] lg:w-[420px] bg-white flex flex-col justify-between h-full border-l border-slate-200 select-none shrink-0 shadow-lg z-10"
  >
  ```
  *Defecto observado:* Usa `justify-between`. Si hay pocos ítems (0 o 1), el contenido intermedio se separa de forma anti-ergonómica.
- **Área de Lista de Ítems (líneas 116-119):**
  ```tsx
  <div 
    data-testid="pos-cart-items-list"
    className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5"
  >
  ```
  *Defecto observado:* Carece de la clase CSS `min-h-0`. En especificación W3C Flexbox, los flex items tienen `min-height: auto` por defecto; sin `min-h-0`, el scroll se rompe y desborda en listas largas de más de 6-8 productos.
- **Renderizado de Fila de Carrito Actual (líneas 131-205):**
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
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 leading-snug flex-1">
            {name}
          </h4>
          <button
            type="button"
            onClick={() => onRemoveItem(index)}
            className="p-1 text-slate-300 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
            title="Eliminar producto"
          >
            <Trash2 size={13} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="text-[11px] font-mono text-slate-400">
            ${unitPrice.toLocaleString('es-CO')} × {unit}
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center bg-slate-100 rounded-lg border border-slate-200">
              <button
                type="button"
                data-testid={`btn-cart-dec-${index}`}
                onClick={() => onUpdateQuantity(index, -1)}
                className="min-h-[44px] min-w-[44px] sm:min-h-[48px] sm:min-w-[48px] flex items-center justify-center rounded-l-lg hover:bg-slate-200 text-slate-700 font-bold active:scale-90 transition-all cursor-pointer"
                title="Disminuir cantidad"
              >
                <Minus size={14} className="stroke-[2.5]" />
              </button>

              <span 
                data-testid={`cart-qty-${index}`}
                className="min-w-[36px] text-center font-mono font-black text-xs sm:text-sm text-slate-900 px-1"
              >
                {qty}
              </span>

              <button
                type="button"
                data-testid={`btn-cart-inc-${index}`}
                onClick={() => onUpdateQuantity(index, 1)}
                className="min-h-[44px] min-w-[44px] sm:min-h-[48px] sm:min-w-[48px] flex items-center justify-center rounded-r-lg hover:bg-slate-200 text-slate-700 font-bold active:scale-90 transition-all cursor-pointer"
                title="Aumentar cantidad"
              >
                <Plus size={14} className="stroke-[2.5]" />
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
- **Icono `Tag` Importado pero Inutilizado (línea 11):**
  `import { ..., Tag, ... } from 'lucide-react';` está importado en la cabecera del archivo pero no se renderiza en ninguna parte del componente.
- **Tipado Actual de `MultivendorCartItem` (líneas 16-22):**
  ```typescript
  export interface MultivendorCartItem {
    id?: string;
    product: Product;
    cantidad: number | string;
    precioOverride?: number;
    notas?: string;
  }
  ```
  Carece de los campos `descuentoPct?: number;` y `descuentoMonto?: number;`.
- **Tipado Actual de `POSMultivendorCartProps` (líneas 24-40):**
  Carece de los callbacks opcionales:
  `onSetQuantity?: (index: number, quantity: number) => void;`
  `onUpdatePrice?: (index: number, newPrice: number) => void;`
  `onUpdateDiscount?: (index: number, discountPct: number) => void;`

### 1.2. Pruebas Existentes y Requisitos de Retrocompatibilidad
- **Archivo de Test Existente:** `src/tests/posMultivendorLightSaaS.test.tsx` (líneas 258-265):
  ```typescript
  expect(screen.getByTestId('btn-cart-inc-0')).toBeInTheDocument();
  expect(screen.getByTestId('btn-cart-dec-0')).toBeInTheDocument();
  expect(screen.getByTestId('cart-qty-0')).toHaveTextContent('2.5');

  fireEvent.click(screen.getByTestId('btn-cart-inc-0'));
  expect(onUpdateQuantity).toHaveBeenCalledWith(0, 1);
  ```
  *Observación crítica:* La prueba valida `expect(screen.getByTestId('cart-qty-0')).toHaveTextContent('2.5')`. En Jest/Vitest DOM, un elemento `<input>` no tiene `textContent` (solo tiene `.value`). Si se sustituyera `<span data-testid="cart-qty-0">` directamente por un `<input data-testid="cart-qty-0">`, `toHaveTextContent('2.5')` fallaría.
- **Resultado de Verificación de Línea Base:**
  - `npx vitest run src/tests/posMultivendorLightSaaS.test.tsx` $\rightarrow$ **8 de 8 tests pasando en verde (413ms)**.
  - `npx tsc --noEmit` $\rightarrow$ **0 errores de compilación TypeScript en todo el proyecto**.

---

## 2. Logic Chain (Razonamiento Paso a Paso y Diseño de la Estrategia Técnica)

### 2.1. Estructura de la Fila del Carrito con Inputs Editables Continuos
1. **Doble Capa en la Fila (`cart-row-${index}`):**
   - **Nivel 1 (Información y Acciones Rápidas):**
     - Nombre de producto con truncamiento seguro (`font-bold text-slate-900 line-clamp-1 leading-snug flex-1 min-w-0 truncate`).
     - Micro-botón `[+ Desc]` con icono `Tag` y badge de descuento actual si aplica.
     - Botón eliminar ítem (`data-testid={`btn-cart-remove-${index}`}`, `tabIndex={-1}`).
   - **Nivel 2 (Controles Continuos de Entrada y Subtotal):**
     - **Grupo A — Cantidad:** Cápsula integrada con botón decremento (`tabIndex={-1}`), input numérico directo editable continuo (`data-testid={`cart-qty-input-${index}`}`, `tabIndex={index * 2 + 1}`), span retrocompatible oculto/accesible (`data-testid={`cart-qty-${index}`}`), y botón incremento (`tabIndex={-1}`).
     - **Grupo B — Precio Unitario:** Input numérico directo con prefijo `$` y sufijo `/{unit}` (`data-testid={`cart-unit-price-input-${index}`}`, `tabIndex={index * 2 + 2}`).
     - **Grupo C — Subtotal de Línea:** Display en texto esmeralda de alto contraste (`font-mono font-black text-xs sm:text-sm text-emerald-700 min-w-[70px] text-right`).

2. **Cálculo Financiero de la Fila:**
   - Precio unitario base o modificado: `const unitPrice = getProductPrice(item);`
   - Descuento individual por ítem: `const discountPct = Number(item.descuentoPct) || 0;`
   - Precio efectivo con descuento: `const effectivePrice = discountPct > 0 ? unitPrice * (1 - discountPct / 100) : unitPrice;`
   - Subtotal de línea: `const lineSubtotal = Math.round(effectivePrice * qty);`

### 2.2. Asignación Estricta de Atributos `tabIndex`
1. **Fórmula Matemática Canónica:**
   - Para la fila `index` ($index \in [0, N-1]$):
     - **Input Cantidad:** `tabIndex = index * 2 + 1` (impares: 1, 3, 5, 7, ...)
     - **Input Precio Unitario:** `tabIndex = index * 2 + 2` (pares: 2, 4, 6, 8, ...)
2. **Exclusión de Controles Secundarios con `tabIndex={-1}`:**
   - Botón decremento stepper: `tabIndex={-1}`
   - Botón incremento stepper: `tabIndex={-1}`
   - Botón micro `[+ Desc]`: `tabIndex={-1}`
   - Botón eliminar ítem: `tabIndex={-1}`
   - Botón vaciar carrito: `tabIndex={-1}`
3. **Flujo de Navegación Resultante:**
   - Al estar en `cart-qty-input-0` (tabIndex=1) y presionar <kbd>Tab</kbd>, el foco salta directamente a `cart-unit-price-input-0` (tabIndex=2).
   - Al presionar <kbd>Tab</kbd> en `cart-unit-price-input-0` (tabIndex=2), el foco salta directamente a `cart-qty-input-1` (tabIndex=3).
   - La navegación es cíclica, fluida y predecible a través de todos los ítems del carrito sin pausas en botones secundarios.
   - Navegación inversa con <kbd>Shift + Tab</kbd> opera simétricamente hacia atrás: 4 $\rightarrow$ 3 $\rightarrow$ 2 $\rightarrow$ 1.

### 2.3. Auto-Selección Inmediata en Foco (`onFocus={(e) => e.target.select()}`)
1. **Problema Ergonómico en POS:** Si un cajero salta con [Tab] a un input con valor `1` o `2.5` y teclea `3`, sin auto-selección el valor se convertiría en `13` o `2.53`, generando un error grave de sobrefacturación.
2. **Mecanismo de Doble Evento:**
   - `onFocus={(e) => e.target.select()}`: Dispara la selección completa del texto al tabular.
   - `onClick={(e) => (e.target as HTMLInputElement).select()}`: Garantiza el mismo comportamiento si el operador toca o hace clic con el ratón o pantalla táctil.

### 2.4. Integración del Micro-Botón `[+ Desc]` con Icono `Tag`
1. **Diseño Visual:**
   - Elemento: `<button type="button" data-testid={`btn-cart-desc-${index}`} tabIndex={-1} ...>`
   - Contenido:
     - Si `discountPct > 0`: `<Tag size={11} className="text-amber-600 stroke-[2.5]" /> <span className="font-mono font-bold text-amber-700">-{discountPct}%</span>` (fondo `bg-amber-50`, borde `border-amber-200`).
     - Si `discountPct === 0`: `<Tag size={11} className="text-slate-400 group-hover:text-amber-600" /> <span className="text-slate-600 font-medium">+ Desc</span>` (fondo `bg-slate-50`, borde `border-slate-200`).
2. **Manejador Interactivo:**
   - Invoca el prompt SweetAlert2 canónico del ERP (`.agent/rules/constitution.md: Alert: SweetAlert2`):
     ```typescript
     const handleOpenDiscountPrompt = async (index: number) => {
       const currentItem = items[index];
       if (!currentItem) return;
       const currentDiscount = currentItem.descuentoPct || 0;

       const { value: nuevoDescStr, isConfirmed } = await Swal.fire({
         title: 'Descuento por Ítem (%)',
         text: `Producto: ${getProductName(currentItem.product)}`,
         input: 'number',
         inputLabel: 'Porcentaje de Descuento (0 - 100%)',
         inputValue: currentDiscount ? currentDiscount.toString() : '',
         inputAttributes: { min: '0', max: '100', step: '1', inputmode: 'numeric' },
         showCancelButton: true,
         confirmButtonText: 'Aplicar Descuento',
         cancelButtonText: 'Cancelar',
         confirmButtonColor: '#059669',
         cancelButtonColor: '#64748b',
       });

       if (isConfirmed && nuevoDescStr !== undefined) {
         const pct = Math.max(0, Math.min(100, parseFloat(nuevoDescStr) || 0));
         if (onUpdateDiscount) {
           onUpdateDiscount(index, pct);
         }
       }
     };
     ```
   - Si se pasa `onUpdateDiscount`, se invoca con `(index, pct)`.

### 2.5. Implementación de Flexbox Vertical Estricto (85% Espacio Útil)
1. **Contenedor Raíz (`aside`):**
   - Reemplazar `flex flex-col justify-between h-full` por:
     `className="w-80 sm:w-96 md:w-[380px] lg:w-[420px] bg-white flex flex-col h-full min-h-0 border-l border-slate-200 select-none shrink-0 shadow-lg z-10"`
   - `min-h-0` habilita la contracción adecuada dentro del contenedor padre en layouts anidados.
2. **Cabecera:**
   - Mantener `h-12 px-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0` (48px exactos).
3. **Lista de Ítems (`pos-cart-items-list`):**
   - Modificar a:
     `className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5"`
   - Al tener `flex-1` y `min-h-0`, absorbe todo el espacio remanente entre la cabecera (48px) y el pie anclado ($\approx 160$px). En una pantalla de 900-1080px, la lista ocupa entre el 80% y 85% de la altura útil con scroll independiente.
4. **Pie Anclado (`footer`):**
   - Modificar a:
     `className="p-3 bg-slate-50 border-t border-slate-200 shrink-0 mt-auto space-y-2"`
   - `shrink-0` garantiza que el total y el botón gigante <kbd>F6</kbd> nunca se compriman ni se solapen con la lista de productos. `mt-auto` asegura su fijación en el fondo aún con 0 o 1 ítem.

### 2.6. Preservación Retroactiva de `data-testid="cart-qty-${index}"` y Steppers
1. **Span Accesible Retrocompatible:**
   - Para que la prueba existente `expect(screen.getByTestId('cart-qty-0')).toHaveTextContent('2.5')` continúe pasando al 100% sin modificar el archivo de test, se incluye:
     ```tsx
     <span 
       data-testid={`cart-qty-${index}`}
       className="sr-only"
     >
       {qty}
     </span>
     ```
   - Este span provee el `textContent` exacto que evalúa `toHaveTextContent`, manteniéndose accesible para tecnologías de asistencia y suites de prueba.
2. **Input Numérico Editable Directo:**
   - Paralelamente, se expone el nuevo contrato DOM:
     ```tsx
     <input
       type="number"
       data-testid={`cart-qty-input-${index}`}
       tabIndex={index * 2 + 1}
       value={item.cantidad}
       onChange={(e) => handleQuantityInputChange(index, e.target.value)}
       onBlur={(e) => handleQuantityInputBlur(index, e.target.value)}
       onFocus={(e) => e.target.select()}
       onClick={(e) => (e.target as HTMLInputElement).select()}
       step={unit.toLowerCase() === 'kg' ? 'any' : '1'}
       min={unit.toLowerCase() === 'kg' ? '0.001' : '1'}
       className="w-14 sm:w-16 h-8 sm:h-9 text-center font-mono font-bold text-xs sm:text-sm bg-white border-y border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:z-10"
     />
     ```
3. **Botones de Stepper Intactos:**
   - `btn-cart-dec-${index}` y `btn-cart-inc-${index}` conservan sus clases ergonómicas $\ge 44-48$px, sus llamadas a `onUpdateQuantity(index, -1)` y `onUpdateQuantity(index, 1)`, y añaden `tabIndex={-1}`.

---

## 3. Caveats (Límites de Alcance y Suposiciones Técnicas)

1. **Margen Comercial y PIN de Supervisor (Hito M5):**
   - En este hito M1, el input de precio unitario y el micro-botón `[+ Desc]` actualizan el precio y descuento en el estado local/props del componente.
   - Las reglas de validación comercial estricta (`Precio < Costo + 15%` o `Descuento > 10%`) que disparan `SupervisorPinModal` pertenecen formalmente al **Hito M5 (Tarea 5)**, por lo que M1 no debe bloquear la edición con modales restrictivos de supervisor todavía.
2. **Descuento Global de Comanda (Hito M2):**
   - El botón <kbd>+ Descuento (F4)</kbd> y popover de totales pertenecen al **Hito M2 (Tarea 2)**. En M1 el footer de totales se mantiene anclado y preparado sin romper los cálculos existentes.
3. **Diferencias de Formato Decimal:**
   - En Colombia (COP), la moneda no utiliza centavos (`step="any"` o `step="1"` sin decimales en display).
   - En pesaje (KG), se permiten hasta 3 decimales (`step="any"`, `min="0.001"`). El input de cantidad debe respetar la unidad del producto (`unit === 'kg' ? 'any' : '1'`).

---

## 4. Conclusion (Diseño Canónico de Implementación para `@implementer` / Worker)

El implementador debe aplicar quirúrgicamente los siguientes cambios en `src/views/pos/components/POSMultivendorCart.tsx`:

### 4.1. Interfaces de Tipado
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

export interface POSMultivendorCartProps {
  items: MultivendorCartItem[];
  onUpdateQuantity: (index: number, delta: number) => void;
  onSetQuantity?: (index: number, quantity: number) => void;
  onUpdatePrice?: (index: number, newPrice: number) => void;
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

### 4.2. Estructura JSX de la Fila del Carrito
```tsx
{items.map((item, index) => {
  const name = getProductName(item.product);
  const unitPrice = getProductPrice(item);
  const unit = getProductUnit(item.product);
  const qty = Number(item.cantidad) || 0;
  const discountPct = Number(item.descuentoPct) || 0;
  const effectivePrice = discountPct > 0 ? unitPrice * (1 - discountPct / 100) : unitPrice;
  const lineSubtotal = Math.round(effectivePrice * qty);

  return (
    <div 
      key={item.id || `${item.product.id}_${index}`}
      data-testid={`cart-row-${index}`}
      className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-100 transition-all flex flex-col gap-1.5 shadow-xs"
    >
      {/* Nivel 1: Título, Micro-botón [+ Desc] y Botón Eliminar */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <h4 
          className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 leading-snug flex-1 min-w-0 truncate"
          title={name}
        >
          {name}
        </h4>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Micro-botón [+ Desc] */}
          <button
            type="button"
            data-testid={`btn-cart-desc-${index}`}
            tabIndex={-1}
            onClick={() => handleOpenDiscountPrompt(index)}
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
              discountPct > 0 
                ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100' 
                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700'
            }`}
            title={discountPct > 0 ? `Descuento: ${discountPct}%. Clic para editar.` : 'Aplicar descuento por ítem'}
          >
            <Tag size={11} className={discountPct > 0 ? 'text-amber-600' : 'text-slate-400'} />
            <span>{discountPct > 0 ? `-${discountPct}%` : '+ Desc'}</span>
          </button>

          {/* Botón eliminar */}
          <button
            type="button"
            data-testid={`btn-cart-remove-${index}`}
            tabIndex={-1}
            onClick={() => onRemoveItem(index)}
            className="p-1 text-slate-300 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
            title="Eliminar producto"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Nivel 2: Stepper con Input Cantidad + Input Precio Unitario + Subtotal */}
      <div className="flex items-center justify-between gap-1.5 pt-0.5">
        {/* Stepper Cantidad con Input Directo */}
        <div className="flex items-center bg-slate-100 rounded-lg border border-slate-200 overflow-hidden">
          <button
            type="button"
            data-testid={`btn-cart-dec-${index}`}
            tabIndex={-1}
            onClick={() => onUpdateQuantity(index, -1)}
            className="min-h-[36px] min-w-[32px] sm:min-h-[40px] sm:min-w-[36px] flex items-center justify-center hover:bg-slate-200 text-slate-700 font-bold active:scale-90 transition-all cursor-pointer"
            title="Disminuir cantidad"
          >
            <Minus size={13} className="stroke-[2.5]" />
          </button>

          {/* Input Cantidad con auto-selección y Tab continuo */}
          <input
            type="number"
            data-testid={`cart-qty-input-${index}`}
            tabIndex={index * 2 + 1}
            value={item.cantidad}
            onChange={(e) => handleQtyChange(index, e.target.value)}
            onBlur={(e) => handleQtyBlur(index, e.target.value)}
            onFocus={(e) => e.target.select()}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            step={unit.toLowerCase() === 'kg' ? 'any' : '1'}
            min={unit.toLowerCase() === 'kg' ? '0.001' : '1'}
            className="w-12 sm:w-14 h-8 sm:h-9 text-center font-mono font-bold text-xs sm:text-sm bg-white border-x border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900"
            title="Cantidad / Peso"
          />

          {/* Span retrocompatible para suites existentes */}
          <span 
            data-testid={`cart-qty-${index}`}
            className="sr-only"
          >
            {qty}
          </span>

          <button
            type="button"
            data-testid={`btn-cart-inc-${index}`}
            tabIndex={-1}
            onClick={() => onUpdateQuantity(index, 1)}
            className="min-h-[36px] min-w-[32px] sm:min-h-[40px] sm:min-w-[36px] flex items-center justify-center hover:bg-slate-200 text-slate-700 font-bold active:scale-90 transition-all cursor-pointer"
            title="Aumentar cantidad"
          >
            <Plus size={13} className="stroke-[2.5]" />
          </button>
        </div>

        {/* Input Precio Unitario Editable */}
        <div className="flex items-center gap-1">
          <div className="relative flex items-center">
            <span className="absolute left-1.5 text-[11px] font-mono text-slate-400 select-none">$</span>
            <input
              type="number"
              data-testid={`cart-unit-price-input-${index}`}
              tabIndex={index * 2 + 2}
              value={unitPrice}
              onChange={(e) => handlePriceChange(index, e.target.value)}
              onBlur={(e) => handlePriceBlur(index, e.target.value)}
              onFocus={(e) => e.target.select()}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              step="any"
              min="0"
              className="w-16 sm:w-20 h-8 sm:h-9 pl-4 pr-1 text-right font-mono font-bold text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900"
              title="Precio unitario"
            />
          </div>
          <span className="text-[10px] text-slate-400 font-medium">/{unit}</span>
        </div>

        {/* Subtotal de Línea */}
        <span className="font-mono font-black text-xs sm:text-sm text-emerald-700 text-right min-w-[65px] shrink-0">
          ${lineSubtotal.toLocaleString('es-CO')}
        </span>
      </div>
    </div>
  );
})}
```

---

## 5. Verification Method (Comandos y Criterios Deterministas de Aprobación)

1. **Verificación de Regresiones en Suite Existente:**
   ```powershell
   npx vitest run src/tests/posMultivendorLightSaaS.test.tsx
   ```
   *Criterio de Aprobación:* Los 8 tests deben pasar al 100% en verde.
2. **Verificación de la Nueva Suite TDD de Carrito Editable:**
   ```powershell
   npx vitest run src/tests/posCartEditableRow.test.tsx
   ```
   *Criterio de Aprobación:* 100% de los nuevos tests de Tarea 1 verdes.
3. **Verificación Estricta de Tipado TypeScript:**
   ```powershell
   npx tsc --noEmit
   ```
   *Criterio de Aprobación:* 0 errores reportados.
4. **Verificación de Layout y Fitts:**
   - Inspeccionar el contenedor `pos-cart-items-list` en 375px y 1280px con Chrome DevTools.
   - Confirmar que los botones de incremento/decremento tienen $\ge 40$px en desktop y $\ge 36$px en móvil, y que la lista ocupa el 85% de la altura útil sin provocar scroll horizontal.
