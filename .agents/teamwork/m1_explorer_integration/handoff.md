# Handoff Report: Estrategia de Integración Limpia y Prevención de Regresiones (Hito M1)

**Agente:** Explorer de Integración y Regresión (`m1_explorer_integration`)  
**Fecha:** 2026-11-08  
**Hito:** M1 (Tarea 1: Fila de Carrito con Navegación [Tab] y Edición en Línea)  
**Destinatario:** Orquestador Multi-Agente (`214a0168-c4c8-4555-84a8-e65c4fad7287`)

---

## 1. Observation

A través de herramientas deterministas de inspección estática, búsqueda cruzada y ejecución en vivo de compilación y pruebas, se observaron directamente los siguientes hechos:

### 1.1. Estado de Compilación TypeScript Global (`tsc --noEmit`)
- **Comando ejecutado:** `npx tsc --noEmit`
- **Resultado:** Código de salida `0` (Cero errores de compilación en todo el monorepo).
- **Conclusión fáctica:** La base de código actual está perfectamente tipada en modo estricto.

### 1.2. Estado de la Suite de Pruebas de Regresión (`posMultivendorLightSaaS.test.tsx`)
- **Comando ejecutado:** `npx vitest run src/tests/posMultivendorLightSaaS.test.tsx`
- **Resultado verbatim:**
  ```text
  ✓ src/tests/posMultivendorLightSaaS.test.tsx (8 tests) 884ms
  Test Files  1 passed (1)
       Tests  8 passed (8)
  ```
- **Duración:** 884ms de pruebas, 100% pasando (8 de 8 tests verdes).

### 1.3. Contrato Actual de Tipos en `POSMultivendorCart.tsx`
En `src/views/pos/components/POSMultivendorCart.tsx` (líneas 16-40):
```typescript
export interface MultivendorCartItem {
  id?: string;
  product: Product;
  cantidad: number | string;
  precioOverride?: number;
  notas?: string;
}

export interface POSMultivendorCartProps {
  items: MultivendorCartItem[];
  onUpdateQuantity: (index: number, delta: number) => void;
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

### 1.4. Consumidores Actuales de `POSMultivendorCart` y `MultivendorCartItem`
1. **`src/views/pos/components/POSMultivendorView.tsx`** (líneas 10-12, 17, 186-202):
   - Importa `POSMultivendorCart` y el tipo `MultivendorCartItem`.
   - Propaga `items={cartItems}`, `onUpdateQuantity`, `onRemoveItem`, `onClearCart`, `subtotal`, `descuento`, `total`, `onEmitirComanda`, `onCobrarCaja`, etc.
   - **Observación crítica:** `POSMultivendorView.tsx` actualmente **NO** suministra `onSetQuantity`, `onUpdatePrice` ni `onUpdateDiscount`.
2. **`src/views/POSView.tsx`** (líneas 24, 2268-2302):
   - Mapea líneas de comanda a `cartItems` pasando:
     ```typescript
     cartItems={cartLineas.map((l: any, idx: number) => ({
       id: l.id || l.lineId || `item-${idx}`,
       product: l.producto || { ... },
       cantidad: l.cantidad,
       precioOverride: l.precioFinal,
       notas: l.notas,
     }))}
     ```
   - **Observación crítica:** No incluye `descuentoPct`.
3. **`src/tests/posMultivendorLightSaaS.test.tsx`** (líneas 226-253):
   - Define `dummyItems`:
     ```typescript
     const dummyItems = [
       { product: dummyProducts[0], cantidad: 2.5 },
       { product: dummyProducts[2], cantidad: 3 },
     ];
     ```
   - Renderiza:
     ```tsx
     <POSMultivendorCart
       items={dummyItems}
       onUpdateQuantity={onUpdateQuantity}
       onRemoveItem={onRemoveItem}
       onClearCart={vi.fn()}
       subtotal={70500}
       total={70500}
       onEmitirComanda={onEmitirComanda}
       activeVendorName="Diego Díaz"
     />
     ```
   - Aserción en línea 261:
     ```typescript
     expect(screen.getByTestId('cart-qty-0')).toHaveTextContent('2.5');
     ```
   - Aserción en líneas 259-264:
     ```typescript
     expect(screen.getByTestId('btn-cart-inc-0')).toBeInTheDocument();
     expect(screen.getByTestId('btn-cart-dec-0')).toBeInTheDocument();
     fireEvent.click(screen.getByTestId('btn-cart-inc-0'));
     expect(onUpdateQuantity).toHaveBeenCalledWith(0, 1);
     ```

---

## 2. Logic Chain

A partir de las observaciones verificadas se desprende la siguiente cadena lógica de integración:

### Paso 1: Tipado Retrocompatible Obligatorio
- **Premisa:** Si cualquier campo o función callback nuevo en `MultivendorCartItem` o `POSMultivendorCartProps` se declara como obligatorio (requerido sin `?`), TypeScript generará un error `TS2322` ("Type ... is not assignable to type ... Property 'X' is missing in type") en:
  1. `src/views/pos/components/POSMultivendorView.tsx` (que aún no pasa callbacks de edición).
  2. `src/views/POSView.tsx` (que construye objetos literales `MultivendorCartItem`).
  3. `src/tests/posMultivendorLightSaaS.test.tsx` (que renderiza `POSMultivendorCart` con props mínimas).
- **Deducción:** Todos los nuevos campos deben ser estrictamente opcionales:
  - `descuentoPct?: number;` en `MultivendorCartItem`
  - `onSetQuantity?: (index: number, quantity: number) => void;` en `POSMultivendorCartProps`
  - `onUpdatePrice?: (index: number, newPrice: number) => void;` en `POSMultivendorCartProps`
  - `onUpdateDiscount?: (index: number, discountPct: number) => void;` en `POSMultivendorCartProps`

### Paso 2: Aserción Inmune a Regresiones en `posMultivendorLightSaaS.test.tsx`
- **Premisa:** En el DOM estándar y en `@testing-library/jest-dom`, un elemento `<input>` no tiene `textContent` (su valor vive en la propiedad `value`).
- **Riesgo crítico:** Si el elemento con `data-testid="cart-qty-${index}"` fuera transformado de un `<span>` a un `<input>`, la aserción `expect(screen.getByTestId('cart-qty-0')).toHaveTextContent('2.5')` fallaría instantáneamente con error: `Expected: "2.5", Received: ""`.
- **Deducción:** El display/span con `data-testid="cart-qty-${index}"` debe mantenerse presente en el DOM (dentro del contenedor stepper o como elemento accesible / sr-only), conteniendo el valor `{qty}` en texto plano. En paralelo, el nuevo input editable para ingreso directo por teclado debe portar `data-testid="cart-qty-input-${index}"` con `value={qty}`.
- Con esta separación exacta:
  1. `src/tests/posMultivendorLightSaaS.test.tsx` pasa sin alterar una sola línea de código.
  2. La nueva suite `src/tests/posCartEditableRow.test.tsx` evalúa el input directo con `cart-qty-input-${index}`.

### Paso 3: Mecanismo de Fallback para Callbacks no Suministrados
- **Premisa:** Cuando `POSMultivendorCart` se monte dentro de `POSMultivendorView` o en pruebas sin `onSetQuantity`, el operador puede escribir una cantidad en el input.
- **Deducción:** `POSMultivendorCart` debe implementar un dispatch seguro:
  ```typescript
  const handleQuantityChange = (index: number, newQty: number) => {
    if (onSetQuantity) {
      onSetQuantity(index, newQty);
    } else {
      // Fallback transparente a onUpdateQuantity
      const currentQty = Number(items[index]?.cantidad) || 0;
      onUpdateQuantity(index, newQty - currentQty);
    }
  };
  ```
  Esto garantiza que la edición manual funcione de inmediato sin romper contratos preexistentes.
  Para precio y descuento:
  ```typescript
  const handlePriceChange = (index: number, newPrice: number) => {
    onUpdatePrice?.(index, newPrice);
  };
  const handleDiscountChange = (index: number, discountPct: number) => {
    onUpdateDiscount?.(index, discountPct);
  };
  ```

### Paso 4: Prevención de Regresión de Foco y Navegación Tab
- **Premisa:** En un POS con periféricos de mostrador y teclado de alta velocidad, presionar <kbd>Tab</kbd> no debe saltar a botones auxiliares (como `+`, `-`, eliminar o descuento) porque ralentiza la operación.
- **Deducción:**
  - `Cantidad Input`: `tabIndex={index * 2 + 1}`
  - `Precio Unitario Input`: `tabIndex={index * 2 + 2}`
  - `Botonera Stepper (- / +)`: `tabIndex={-1}`
  - `Botón Eliminar`: `tabIndex={-1}`
  - `Botón Micro [+ Desc]`: `tabIndex={-1}`
  - Ambos inputs deben implementar `onFocus={(e) => e.target.select()}` para auto-seleccionar el texto al recibir foco.

### Paso 5: Flexbox 85% y Control de Desbordamiento Visual
- **Premisa:** El carrito se renderiza tanto en desktop (anchos de 380px a 420px) como en modo móvil (375px a full width en pestaña 'carrito').
- **Deducción:**
  - Contenedor raíz: `h-full min-h-0 flex flex-col`.
  - Contenedor de lista: `flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5`.
  - Footer fijo: `shrink-0 mt-auto bg-slate-50 border-t border-slate-200 p-3 space-y-2`.
  - En cada fila: títulos con `line-clamp-1 min-w-0 flex-1 truncate` para evitar que nombres largos rompan el layout horizontal.
  - Inputs con anchos fijos y compactos: cantidad (`w-14` / `w-16`), precio (`w-20` / `w-24`), subtotal con `min-w-[65px] text-right font-mono font-black`.

---

## 3. Caveats

1. **Gestión de Descuento por Ítem en Hitos Posteriores:** En M1 se introduce el botón micro `[+ Desc]` y el callback opcional `onUpdateDiscount?`. La lógica de verificación de supervisor (PIN de 4 dígitos para descuentos > 10%) corresponde al Hito M5 según `PROJECT.md`. En M1, el botón `[+ Desc]` debe alternar un input inline o disparar el callback sin bloquearse por PIN.
2. **Dependencias de Testing Library:** El repositorio cuenta con `@testing-library/react` (`render`, `screen`, `fireEvent`). No cuenta con `@testing-library/user-event`. Todas las pruebas de navegación de teclado Tab deben validarse mediante `fireEvent.keyDown(element, { key: 'Tab', code: 'Tab' })` y comprobación de atributos `tabIndex` en orden ascendente correlativo.
3. **No alteración de `src/tests/posMultivendorLightSaaS.test.tsx`:** Este archivo es un baseline inmutable de aceptación. Bajo ninguna circunstancia debe editarse.

---

## 4. Conclusion

1. **Compatibilidad Total de Tipos:** La interfaz `MultivendorCartItem` y `POSMultivendorCartProps` debe incorporar los nuevos atributos de forma **estrictamente opcional** (`descuentoPct?`, `onSetQuantity?`, `onUpdatePrice?`, `onUpdateDiscount?`). Con esta regla, `src/views/pos/components/POSMultivendorView.tsx`, `src/views/POSView.tsx` y `src/tests/posMultivendorLightSaaS.test.tsx` mantendrán **0 errores** en `tsc --noEmit`.
2. **Invarianza de Pruebas Existentes:** Mantener el elemento display `<span data-testid="cart-qty-${index}">{qty}</span>` y agregar `<input data-testid="cart-qty-input-${index}" />` asegura que `posMultivendorLightSaaS.test.tsx` seguirá pasando al 100% (8/8) sin modificar una sola coma.
3. **Contrato de Navegación Ergonomica:** La secuencia de `tabIndex` intercalada (`index * 2 + 1` para Cantidad e `index * 2 + 2` para Precio) con `tabIndex={-1}` en todos los controles secundarios garantiza un flujo de teclado ininterrumpido sin colisiones.
4. **Diseño Visual Blindado:** La estructura flexbox vertical estricta con `flex-1 min-h-0 overflow-y-auto` y pie anclado `shrink-0 mt-auto` previene desbordamientos y garantiza que los ítems ocupen el 85% del área vertical útil en desktop y mobile.

---

## 5. Verification Method

Para verificar independientemente que esta estrategia no genera regresiones, ejecute los siguientes comandos en la raíz del proyecto:

1. **Verificación de Tipos Estrictos:**
   ```powershell
   npx tsc --noEmit
   ```
   *Criterio de éxito:* Código de salida 0 y cero errores reportados en la terminal.

2. **Verificación de la Suite de Regresión Inmutable:**
   ```powershell
   npx vitest run src/tests/posMultivendorLightSaaS.test.tsx
   ```
   *Criterio de éxito:* 8 de 8 pruebas aprobadas (100% verde) en menos de 2 segundos.

3. **Verificación de la Nueva Suite TDD (Hito M1):**
   ```powershell
   npx vitest run src/tests/posCartEditableRow.test.tsx
   ```
   *Criterio de éxito:* 100% de pruebas verdes evaluando inputs directos, eventos Tab, micro-descuento y reactividad.

4. **Inspección de Archivos Afectados:**
   - Confirmar que `src/tests/posMultivendorLightSaaS.test.tsx` tenga `git status` limpio (sin modificaciones).
   - Revisar `src/views/pos/components/POSMultivendorCart.tsx` para corroborar que los nuevos campos sean opcionales y que `data-testid="cart-qty-${index}"` siga en el DOM.
