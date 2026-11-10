# Handoff Report: Estrategia y Especificación TDD para Hito M1 (`posCartEditableRow.test.tsx`)

**Fecha:** 2026-11-08  
**Agente:** Explorer TDD (M1)  
**Destinatario:** Orchestrator (`214a0168-c4c8-4555-84a8-e65c4fad7287`) / Worker M1  
**Hito:** M1 — Fila de Carrito con Navegación [Tab] y Edición en Línea (SPEC-057 Tarea 1)  

---

## 1. Observation

A partir de la inspección directa del entorno de trabajo, dependencias y archivos fuente, se observan los siguientes hechos concretos:

1. **Ausencia de `@testing-library/user-event` en el proyecto:**
   - Archivo `package.json` líneas 60-82: Solo figuran `"@testing-library/jest-dom": "^6.9.1"` y `"@testing-library/react": "^16.3.2"`.
   - Comando ejecutado: `Test-Path "node_modules/@testing-library/user-event"`. Resultado: `False`.
   - Implicación: Cualquier intento de importar `userEvent` desde `@testing-library/user-event` fallará en compilación y ejecución. Las interacciones deben diseñarse usando `fireEvent` (`focus`, `change`, `click`, `blur`) y validaciones de atributos DOM (`toHaveAttribute('tabindex', '...')`, `toHaveValue(...)`, `toHaveFocus()`).

2. **Contrato de Compatibilidad Retroactiva en `src/tests/posMultivendorLightSaaS.test.tsx`:**
   - Línea 261:
     ```tsx
     expect(screen.getByTestId('cart-qty-0')).toHaveTextContent('2.5');
     ```
   - Líneas 259-260:
     ```tsx
     expect(screen.getByTestId('btn-cart-inc-0')).toBeInTheDocument();
     expect(screen.getByTestId('btn-cart-dec-0')).toBeInTheDocument();
     ```
   - En Jest DOM / Vitest, `toHaveTextContent` evalúa `element.textContent`. En un `<input>`, `element.textContent` es siempre cadena vacía `""` (el valor se almacena en `element.value`). Si `data-testid="cart-qty-0"` se trasladara al `<input>`, la suite existente fallaría inmediatamente.
   - En `src/views/pos/components/POSMultivendorCart.tsx` líneas 178-184:
     ```tsx
     <span 
       data-testid={`cart-qty-${index}`}
       className="min-w-[36px] text-center font-mono font-black text-xs sm:text-sm text-slate-900 px-1"
     >
       {qty}
     </span>
     ```

3. **Estado actual de `POSMultivendorCart.tsx`:**
   - Líneas 149-157: El botón de eliminar no posee `data-testid` ni `tabIndex={-1}`:
     ```tsx
     <button
       type="button"
       onClick={() => onRemoveItem(index)}
       className="p-1 text-slate-300 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
       title="Eliminar producto"
     >
       <Trash2 size={13} />
     </button>
     ```
   - Líneas 168-194: Los botones de incremento y decremento no tienen `tabIndex={-1}` explícito.
   - Líneas 161-163: El precio unitario es un texto estático:
     ```tsx
     <div className="text-[11px] font-mono text-slate-400">
       ${unitPrice.toLocaleString('es-CO')} × {unit}
     </div>
     ```
   - No existen inputs editables `cart-qty-input-${index}` ni `cart-unit-price-input-${index}`.
   - No existe el micro-botón `data-testid="btn-cart-desc-${index}"`.
   - Props actuales de `POSMultivendorCartProps` (líneas 24-40): no incluyen `onSetQuantity`, `onUpdatePrice` ni `onUpdateDiscount`.

4. **Verificación de tipado y tests actuales:**
   - `npx vitest run src/tests/posMultivendorLightSaaS.test.tsx`: 8 tests pasaron en verde (100%).
   - `npx tsc --noEmit`: 0 errores de compilación TypeScript.

---

## 2. Logic Chain

1. Dado que `posMultivendorLightSaaS.test.tsx` verifica `cart-qty-0` mediante `toHaveTextContent('2.5')`, `data-testid="cart-qty-${index}"` debe mantenerse estrictamente en un elemento display/span textual con el valor `{qty}` visible, para evitar regresiones en los 8 tests existentes.
2. Dado que el Hito M1 y SPEC-057 exigen edición continua con teclado [Tab] entre Cantidad y Precio Unitario:
   - Se debe crear un input de cantidad con `data-testid={`cart-qty-input-${index}`}` y `tabIndex={index * 2 + 1}`.
   - Se debe crear un input de precio unitario con `data-testid={`cart-unit-price-input-${index}`}` y `tabIndex={index * 2 + 2}`.
   - Para la fila 0: Cantidad tendrá `tabIndex={1}` y Precio `tabIndex={2}`.
   - Para la fila 1: Cantidad tendrá `tabIndex={3}` y Precio `tabIndex={4}`.
3. Para garantizar que la navegación continua por [Tab] fluya ininterrumpidamente de celda editable a celda editable (Cantidad 0 -> Precio 0 -> Cantidad 1 -> Precio 1), los controles interactivos secundarios de cada fila deben ser excluidos del flujo de tabulación mediante `tabIndex={-1}`:
   - Stepper decrementar: `btn-cart-dec-${index}` -> `tabIndex={-1}`.
   - Stepper incrementar: `btn-cart-inc-${index}` -> `tabIndex={-1}`.
   - Botón eliminar ítem: `btn-cart-remove-${index}` -> `tabIndex={-1}`.
   - Micro-botón de descuento: `btn-cart-desc-${index}` -> `tabIndex={-1}`.
4. Dado que los inputs deben permitir sobreescritura rápida sin necesidad de borrar manualmente, ambos inputs deben invocar `e.target.select()` en su manejador `onFocus`. Esto se valida mediante un spy en `HTMLInputElement.prototype.select`.
5. Para soportar cambios directos de cantidad y precio sin perder compatibilidad retroactiva:
   - `POSMultivendorCartProps` debe incorporar opcionalmente:
     - `onSetQuantity?: (index: number, quantity: number) => void;`
     - `onUpdatePrice?: (index: number, newPrice: number) => void;`
     - `onUpdateDiscount?: (index: number, discountPct: number) => void;`
   - Si `onSetQuantity` no se suministra, el cambio en el input de cantidad puede invocar `onUpdateQuantity(index, newQty - currentQty)` como fallback defensivo.
6. Dado que el contenedor de la lista de ítems (`data-testid="pos-cart-items-list"`) debe ocupar el 85% de la altura vertical de la terminal con scroll propio, debe poseer `flex-1 min-h-0 overflow-y-auto`, mientras que el footer de totales y emisión debe contar con `shrink-0 mt-auto`.
7. Con esta cadena lógica se deduce la especificación exacta de los 10 casos de prueba en `src/tests/posCartEditableRow.test.tsx` detallados a continuación.

---

## 3. Especificación Técnica de la Suite TDD `src/tests/posCartEditableRow.test.tsx`

La suite debe crearse en `src/tests/posCartEditableRow.test.tsx` y estructurarse en 6 bloques temáticos con 10 casos de prueba:

### Estructura de Mocks Canónicos

```tsx
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { POSMultivendorCart } from '../views/pos/components/POSMultivendorCart';
import type { Product } from '../types/erp.types';
import type { MultivendorCartItem } from '../views/pos/components/POSMultivendorCart';

const mockProducts: Product[] = [
  {
    id: 'prod-01',
    sku: 'MOJ-001',
    nombre: 'Mojarra Roja Entera',
    categoria: 'Pescados',
    unidadMedida: 'kg',
    precio_venta_pos: 18000,
    precio_compra: 10000,
    buffer_seguridad: 5,
    activo: true,
  },
  {
    id: 'prod-02',
    sku: 'ATUN-001',
    nombre: 'Atún en Lata Aceite 170g',
    categoria: 'Conservas',
    unidadMedida: 'und',
    precio_venta_pos: 8500,
    precio_compra: 5000,
    buffer_seguridad: 10,
    activo: true,
  },
];

const mockItems: MultivendorCartItem[] = [
  {
    product: mockProducts[0],
    cantidad: 2.5,
    precioOverride: 18000,
  },
  {
    product: mockProducts[1],
    cantidad: 3,
  },
];
```

### Detalle de los 10 Casos de Prueba

#### Bloque 1: Renderizado de Inputs Editables y Estructura DOM
- **Caso 1: Renderizado de inputs continuos para cantidad y precio unitario en cada fila**
  - Renderiza `POSMultivendorCart` con 2 ítems (`mockItems`).
  - Verifica que `cart-qty-input-0` existe, tiene `type="number"` y su valor es `'2.5'`.
  - Verifica que `cart-unit-price-input-0` existe, tiene `type="number"` y su valor es `'18000'`.
  - Verifica que `cart-qty-input-1` existe y su valor es `'3'`.
  - Verifica que `cart-unit-price-input-1` existe y su valor es `'8500'`.
- **Caso 2: Auto-selección de texto al recibir foco en inputs de cantidad y precio**
  - Configura `const selectSpy = vi.spyOn(HTMLInputElement.prototype, 'select');`.
  - Dispara `fireEvent.focus(screen.getByTestId('cart-qty-input-0'))` -> `expect(selectSpy).toHaveBeenCalledTimes(1)`.
  - Dispara `fireEvent.focus(screen.getByTestId('cart-unit-price-input-0'))` -> `expect(selectSpy).toHaveBeenCalledTimes(2)`.

#### Bloque 2: Navegación de Teclado con [Tab] y Exclusión de Controles Auxiliares
- **Caso 3: Orden de tabulación continuo (tabIndex secuencial: Cantidad 0 -> Precio 0 -> Cantidad 1 -> Precio 1)**
  - Comprueba:
    - `screen.getByTestId('cart-qty-input-0')` posee atributo `tabindex="1"`.
    - `screen.getByTestId('cart-unit-price-input-0')` posee atributo `tabindex="2"`.
    - `screen.getByTestId('cart-qty-input-1')` posee atributo `tabindex="3"`.
    - `screen.getByTestId('cart-unit-price-input-1')` posee atributo `tabindex="4"`.
  - Comprueba que la secuencia de `tabIndex` es estrictamente ascendente `[1, 2, 3, 4]`.
- **Caso 4: Exclusión estricta de botones auxiliares del ciclo [Tab] (`tabIndex={-1}`)**
  - Comprueba que todos los siguientes elementos tienen atributo `tabindex="-1"`:
    - Steppers decremento e incremento: `btn-cart-dec-0`, `btn-cart-inc-0`, `btn-cart-dec-1`, `btn-cart-inc-1`.
    - Botones de eliminación: `btn-cart-remove-0`, `btn-cart-remove-1`.
    - Micro-botones de descuento: `btn-cart-desc-0`, `btn-cart-desc-1`.

#### Bloque 3: Micro-Botón de Descuento por Ítem `[+ Desc]`
- **Caso 5: Presencia y activación del micro-botón `[+ Desc]` por fila**
  - Pasa callback espía `onUpdateDiscount = vi.fn()`.
  - Verifica existencia de `btn-cart-desc-0` y `btn-cart-desc-1`.
  - Verifica que incluye texto visual o etiqueta `+ Desc`.
  - Dispara `fireEvent.click(screen.getByTestId('btn-cart-desc-0'))`.
  - Confirma que `onUpdateDiscount` es invocado con el índice `0`.

#### Bloque 4: Emisión de Callbacks al Editar Cantidad y Precio
- **Caso 6: Edición directa de cantidad dispara callback `onSetQuantity`**
  - Pasa `onSetQuantity = vi.fn()`.
  - Dispara `fireEvent.change(screen.getByTestId('cart-qty-input-0'), { target: { value: '4.5' } })`.
  - Confirma que `onSetQuantity` es invocado con `(0, 4.5)`.
- **Caso 7: Edición directa de precio unitario dispara callback `onUpdatePrice`**
  - Pasa `onUpdatePrice = vi.fn()`.
  - Dispara `fireEvent.change(screen.getByTestId('cart-unit-price-input-0'), { target: { value: '19000' } })`.
  - Confirma que `onUpdatePrice` es invocado con `(0, 19000)`.
- **Caso 8: Steppers de incremento/decremento y botón eliminar preservan su operatividad táctil**
  - Pasa `onUpdateQuantity = vi.fn()`, `onRemoveItem = vi.fn()`.
  - Clic en `btn-cart-inc-0` -> invoca `onUpdateQuantity(0, 1)`.
  - Clic en `btn-cart-dec-0` -> invoca `onUpdateQuantity(0, -1)`.
  - Clic en `btn-cart-remove-0` -> invoca `onRemoveItem(0)`.

#### Bloque 5: Layout Flexbox Vertical y Distribución de Espacio
- **Caso 9: Contenedor y lista de ítems garantizan 85% de espacio vertical y scroll independiente**
  - Verifica que el aside `pos-multivendor-cart` posee clases `flex flex-col h-full`.
  - Verifica que la lista `pos-cart-items-list` posee clases `flex-1 min-h-0 overflow-y-auto`.
  - Verifica que el bloque de pie/totales posee clase `shrink-0`.

#### Bloque 6: Compatibilidad Retroactiva con Suites Preexistentes
- **Caso 10: Preservación estricta de `data-testid="cart-qty-${index}"` con valor textual legible**
  - Verifica que `screen.getByTestId('cart-qty-0')` existe y `toHaveTextContent('2.5')`.
  - Verifica que `screen.getByTestId('cart-qty-1')` existe y `toHaveTextContent('3')`.
  - Garantiza que `src/tests/posMultivendorLightSaaS.test.tsx` continuará pasando en verde al 100%.

---

## 4. Diseño Propuesto de Modificaciones para `src/views/pos/components/POSMultivendorCart.tsx`

Para que el agente Worker pueda guiarse con precisión milimétrica durante la fase RED -> GREEN de TDD, se describe el contrato de interfaces y el markup recomendado:

### Actualización de Interfaces:
```tsx
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
  onSetQuantity?: (index: number, quantity: number) => void;      // NUEVO
  onUpdatePrice?: (index: number, newPrice: number) => void;       // NUEVO
  onUpdateDiscount?: (index: number, discountPct: number) => void; // NUEVO
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

### Markup de Fila Recomendado en `POSMultivendorCart.tsx`:
```tsx
<div 
  key={item.id || `${item.product.id}_${index}`}
  data-testid={`cart-row-${index}`}
  className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-100 transition-all flex flex-col gap-2 shadow-xs"
>
  {/* Nivel 1: Nombre del producto, micro-botón [+ Desc] y botón eliminar */}
  <div className="flex items-center justify-between gap-2">
    <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 leading-snug flex-1">
      {name}
    </h4>

    <div className="flex items-center gap-1">
      <button
        type="button"
        data-testid={`btn-cart-desc-${index}`}
        tabIndex={-1}
        onClick={() => onUpdateDiscount && onUpdateDiscount(index, item.descuentoPct || 0)}
        className="px-1.5 py-0.5 text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-amber-100 hover:text-amber-800 border border-slate-200 rounded transition-colors cursor-pointer"
        title="Aplicar descuento por ítem"
      >
        + Desc
      </button>

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

  {/* Nivel 2: Inputs editables [Tab] continuos, Steppers táctiles [- / +] y Subtotal */}
  <div className="flex items-center justify-between gap-2 pt-0.5">
    {/* Input de Precio Unitario Editable */}
    <div className="flex items-center gap-1">
      <span className="text-[11px] font-mono text-slate-400 font-bold">$</span>
      <input
        type="number"
        step="any"
        min="0"
        data-testid={`cart-unit-price-input-${index}`}
        tabIndex={index * 2 + 2}
        value={unitPrice}
        onChange={(e) => {
          const val = parseFloat(e.target.value);
          if (!isNaN(val) && onUpdatePrice) {
            onUpdatePrice(index, val);
          }
        }}
        onFocus={(e) => e.target.select()}
        aria-label={`Precio unitario de ${name}`}
        className="w-20 px-1.5 py-1 text-right font-mono font-bold text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
      />
      <span className="text-[10px] text-slate-400">/{unit}</span>
    </div>

    {/* Controles de Cantidad: Input continuo + Steppers táctiles con span retrocompatible */}
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        step="any"
        min="0.001"
        data-testid={`cart-qty-input-${index}`}
        tabIndex={index * 2 + 1}
        value={qty}
        onChange={(e) => {
          const val = parseFloat(e.target.value);
          if (!isNaN(val)) {
            if (onSetQuantity) {
              onSetQuantity(index, val);
            } else {
              onUpdateQuantity(index, val - qty);
            }
          }
        }}
        onFocus={(e) => e.target.select()}
        aria-label={`Cantidad de ${name}`}
        className="w-14 px-1.5 py-1 text-center font-mono font-bold text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
      />

      {/* Steppers ergonómicos con tabIndex={-1} y span cart-qty-${index} para compatibilidad */}
      <div className="flex items-center bg-slate-100 rounded-lg border border-slate-200">
        <button
          type="button"
          data-testid={`btn-cart-dec-${index}`}
          tabIndex={-1}
          onClick={() => onUpdateQuantity(index, -1)}
          className="min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center rounded-l-lg hover:bg-slate-200 text-slate-700 font-bold active:scale-90 transition-all cursor-pointer"
          title="Disminuir cantidad"
        >
          <Minus size={13} className="stroke-[2.5]" />
        </button>

        <span 
          data-testid={`cart-qty-${index}`}
          className="min-w-[32px] text-center font-mono font-black text-xs text-slate-900 px-1"
        >
          {qty}
        </span>

        <button
          type="button"
          data-testid={`btn-cart-inc-${index}`}
          tabIndex={-1}
          onClick={() => onUpdateQuantity(index, 1)}
          className="min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center rounded-r-lg hover:bg-slate-200 text-slate-700 font-bold active:scale-90 transition-all cursor-pointer"
          title="Aumentar cantidad"
        >
          <Plus size={13} className="stroke-[2.5]" />
        </button>
      </div>

      {/* Subtotal de Línea */}
      <span className="font-mono font-black text-xs sm:text-sm text-emerald-700 text-right min-w-[65px]">
        ${lineSubtotal.toLocaleString('es-CO')}
      </span>
    </div>
  </div>
</div>
```

---

## 5. Caveats

1. **Ausencia de `@testing-library/user-event`**: La suite TDD no debe importar `userEvent`. Todas las interacciones deben usar `fireEvent` (`focus`, `change`, `click`) y validaciones de atributos DOM para garantizar 100% de compatibilidad con el entorno actual sin agregar dependencias externas no autorizadas.
2. **Ubicación de `data-testid="cart-qty-${index}"`**: Es indispensable que resida en el `<span>` y NO en el `<input>`. En caso contrario, el test de regresión `posMultivendorLightSaaS.test.tsx:261` fallará porque `expect(input).toHaveTextContent(...)` evalúa `textContent` que es nulo en `<input>`.
3. **Manejo de eventos onChange en inputs numéricos**: Los valores de los inputs deben parsearse con `parseFloat()` para admitir fracciones decimales en kilogramos (ej: `2.5` kg). El atributo `step="any"` debe estar presente en el JSX.
4. **Ámbito de este reporte**: Como agente Explorer, no se modificó ningún archivo en `src/` ni `specs/`. La implementación de `src/tests/posCartEditableRow.test.tsx` y la actualización de `POSMultivendorCart.tsx` corresponden al agente Worker M1.

---

## 6. Conclusion

La estrategia TDD para el Hito M1 ha sido completamente diseñada y validada contra la arquitectura del proyecto:
- Se definieron 10 casos de prueba exhaustivos agrupados en 6 bloques temáticos.
- Se preserva el 100% de la compatibilidad con `posMultivendorLightSaaS.test.tsx` manteniendo `data-testid="cart-qty-${index}"` en el span de display.
- Se resuelve la navegación continua [Tab] mediante asignación matemática de índices (`index * 2 + 1` para cantidad y `index * 2 + 2` para precio) y exclusión total de controles secundarios con `tabIndex={-1}`.
- Se respeta la distribución flexbox vertical (85% lista útil) y la ergonomía táctil Fitts.
- El Worker M1 cuenta con la plantilla exacta de código tanto para la prueba TDD como para el componente de producción.

---

## 7. Verification Method

Para verificar independientemente el diseño una vez que el Worker implemente el código:

1. **Ejecutar la nueva suite TDD:**
   ```powershell
   npx vitest run src/tests/posCartEditableRow.test.tsx
   ```
   *Condición de éxito:* 10 tests pasados (0 fallos).

2. **Ejecutar la suite de regresión previa:**
   ```powershell
   npx vitest run src/tests/posMultivendorLightSaaS.test.tsx
   ```
   *Condición de éxito:* 8 tests pasados (0 fallos).

3. **Verificación de tipado estricto:**
   ```powershell
   npx tsc --noEmit
   ```
   *Condición de éxito:* 0 errores de compilación TypeScript.

4. **Condición de invalidación:** Si `npx vitest run src/tests/posMultivendorLightSaaS.test.tsx` falla en `cart-qty-0`, revisar de inmediato que el span con `data-testid="cart-qty-0"` no haya sido reemplazado por el `<input>`.
