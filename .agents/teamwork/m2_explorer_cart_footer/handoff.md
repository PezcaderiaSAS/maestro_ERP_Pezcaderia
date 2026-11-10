# Reporte de Handoff UI/UX: Pie de Carrito y Selector de Descuento Global F4 (Hito M2)

**Agente:** Explorer UI/UX del Pie de Carrito (`m2_explorer_cart_footer`)  
**Hito:** Hito M2 — Tarea 2: Motor de Descuento Global de Comanda F4 [% / $] y Recálculo Sub-10ms en Zustand  
**Fecha:** 2026-11-08  
**Estado:** COMPLETO (Hard Handoff)  
**Destinatario:** Orquestador de Equipo (`214a0168-c4c8-4555-84a8-e65c4fad7287`) y Worker Implementador de M2  

---

## 1. Observation (Observaciones Directas de la Base de Código)

### 1.1. Estructura Actual del Pie de Carrito en `POSMultivendorCart.tsx`
En `src/views/pos/components/POSMultivendorCart.tsx`, líneas 305 a 348:
```tsx
305:      {/* 3. FOOTER FIJO INFERIOR CON ACCIÓN DE COMANDA / COBRO */}
306:      <div className="p-3 bg-slate-50 border-t border-slate-200 shrink-0 mt-auto space-y-2">
307:        {/* Campo opcional de Notas / Instrucciones de Corte */}
308:        {onNotasDespachoChange && items.length > 0 && (
309:          <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-lg">
310:            <FileText size={14} className="text-slate-400 shrink-0" />
311:            <input
312:              type="text"
313:              value={notasDespacho}
314:              onChange={(e) => onNotasDespachoChange(e.target.value)}
315:              placeholder="Instrucciones de corte / despacho..."
316:              className="w-full text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
317:            />
318:          </div>
319:        )}
320:
321:        {/* Resumen Financiero */}
322:        <div className="space-y-1 py-1">
323:          <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
324:            <span>Subtotal ({totalItemsCount} uds):</span>
325:            <span className="font-mono font-bold text-slate-700">${subtotal.toLocaleString('es-CO')}</span>
326:          </div>
327:
328:          {descuento > 0 && (
329:            <div className="flex justify-between items-center text-xs text-amber-600 font-medium">
330:              <span>Descuento aplicado:</span>
331:              <span className="font-mono font-bold">-${descuento.toLocaleString('es-CO')}</span>
332:            </div>
333:          )}
334:
335:          <div className="flex justify-between items-baseline pt-1 border-t border-slate-200">
336:            <span className="text-xs font-black uppercase tracking-wider text-slate-800">
337:              Total a Pagar
338:            </span>
339:            <span 
340:              data-testid="pos-cart-total-amount"
341:              className="text-2xl sm:text-3xl font-mono font-black text-emerald-600 leading-none"
342:            >
343:              ${total.toLocaleString('es-CO')}
344:            </span>
345:          </div>
346:        </div>
```

### 1.2. Contrato de Props Existente en `POSMultivendorCart.tsx`
En `src/views/pos/components/POSMultivendorCart.tsx`, líneas 24 a 43:
```tsx
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

### 1.3. Contenedor Flexbox Principal
En `src/views/pos/components/POSMultivendorCart.tsx`, líneas 109 a 153:
- El aside principal posee: `className="w-80 sm:w-96 md:w-[380px] lg:w-[420px] bg-white flex flex-col h-full min-h-0 border-l border-slate-200 select-none shrink-0 shadow-lg z-10"`.
- La cabecera ocupa exactamente 48px (`h-12 ... shrink-0`).
- La lista de ítems ocupa el espacio flexible disponible con scroll independiente: `className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5"`.
- El pie está anclado al fondo: `className="p-3 bg-slate-50 border-t border-slate-200 shrink-0 mt-auto space-y-2"`.

### 1.4. Requisitos en Especificaciones y Proyecto
- **`PROJECT.md` (líneas 24-26)**:
  - `F7`: Botón Anclado `+ Descuento (F4)` en Footer para abrir popover/modal de descuento global de comanda.
  - `F8`: Selector de Descuento Global [% / $] con inputs numéricos y presets rápidos.
  - `F9`: Recálculo Financiero Instantáneo Sub-10ms en Zustand.
- **`specs/spec_057_pos_integral_refactor_frontend.md` (sección 3.5, líneas 280-282)**:
  > *"Botón anclado `+ Descuento (F4)` en el bloque de totales que abre un popover reactivo para alternar entre Porcentaje (%) o Valor Monetario ($), recalculando el Total a Pagar en menos de 10ms en el store de Zustand."*
- **Suite de Pruebas Existente**:
  - Comando ejecutado: `npx vitest run src/tests/posCartEditableRow.test.tsx`
  - Resultado: `✓ src/tests/posCartEditableRow.test.tsx (10 tests) 493ms - 10 passed (100%)`.

---

## 2. Logic Chain (Cadena de Razonamiento y Diseño Técnico)

A partir de las observaciones directas, se deduce la siguiente cadena lógica para la solución UI/UX:

### Paso 1: Preservación Estricta del Flexbox Vertical (85% Espacio de Ítems)
1. **Problema de renderizado inline:** Si el formulario selector de descuento (con sus botones de modo, presets, input numérico y botones de aplicar/cancelar) se despliega como un elemento expandido verticalmente dentro del footer (`shrink-0 mt-auto`), la altura del footer aumentaría de ~180px a ~340px. Esto provocaría:
   - Reducción drástica del área de visualización del listado de productos de 85% a ~50% en pantallas POS estándar (768px-800px vertical).
   - Un salto de layout acumulado (Cumulative Layout Shift - CLS) disruptivo cada vez que el cajero abre o cierra el selector.
2. **Solución Arquitectónica: Popover Flotante Anclado (`absolute bottom-full`)**:
   - Al posicionar el selector como un popover flotante anclado arriba del bloque de totales (`absolute bottom-full left-0 right-0 mb-2 z-30 bg-white border border-slate-200 shadow-2xl rounded-xl p-3`), el footer conserva su altura exacta e inmutable (`shrink-0 mt-auto`).
   - El scroll del listado de ítems (`flex-1 min-h-0`) permanece estable.
   - El operador ve simultáneamente cómo al tocar un preset o tipear un porcentaje, el total a pagar en el footer se actualiza en tiempo real de forma visible justo debajo del popover.

### Paso 2: Ubicación y Ergonomía del Botón Permanente `+ Descuento (F4)`
1. **Posicionamiento Estratégico:**
   - Debe ubicarse en el bloque de resumen financiero, inmediatamente debajo de la fila del `Subtotal` y antes de la línea divisoria del `Total a Pagar`.
   - Poseerá el atributo obligatorio: `data-testid="btn-descuento-global-f4"`.
2. **Estados Dinámicos del Botón:**
   - **Estado Vacío / Inhabilitado (`items.length === 0`):** `disabled={true}`, opacidad reducida (`opacity-50 cursor-not-allowed`). Evita abrir el selector cuando no hay productos en la venta.
   - **Estado Sin Descuento Activo:**
     - Fondo suave ambarino punteado (`border border-dashed border-amber-300 bg-amber-50/70 text-amber-800 hover:bg-amber-100`).
     - Ícono `Tag` de Lucide, texto `+ Descuento (F4)` y subetiqueta accesible `Aplicar a comanda`.
     - Cumple Ley de Fitts: altura mínima de 36px, clic táctil cómodo.
   - **Estado Con Descuento Activo:**
     - Se transforma en una pastilla destacada: `bg-amber-100 border-amber-400 text-amber-900`.
     - Muestra el valor aplicado: e.g., `Descuento comanda: -10%` o `-$5.000 COP`.
     - Permite hacer clic para reabrir el popover y modificar o eliminar el descuento.

### Paso 3: Diseño Interactivo del Selector de Descuento (Popover)
El popover flotante (`data-testid="pos-discount-popover"`) se compone de 4 micro-secciones optimizadas:

1. **Cabecera Compacta:**
   - Título: "Descuento Global de Comanda".
   - Atajo de teclado: badge `<kbd className="text-[10px] bg-slate-100 border border-slate-200 px-1 rounded font-mono">F4</kbd>`.
   - Botón de cierre cruz (`X`) con `data-testid="btn-cerrar-popover-descuento"`.
2. **Selector de Modo [% / $]:**
   - Toggle segmentado de 2 botones:
     - `data-testid="btn-modo-porcentaje"`: `% Porcentaje` (activo por defecto).
     - `data-testid="btn-modo-monto"`: `$ Monto Fijo (COP)`.
   - Estilo activo: `bg-amber-600 text-white font-bold shadow-xs`.
   - Estilo inactivo: `bg-slate-100 text-slate-600 hover:bg-slate-200`.
3. **Botonera de Presets Rápidos:**
   - **En modo `%`:**
     - Chip 5%: `data-testid="btn-preset-desc-5"`
     - Chip 10%: `data-testid="btn-preset-desc-10"`
     - Chip 15%: `data-testid="btn-preset-desc-15"`
     - Chip 20%: `data-testid="btn-preset-desc-20"`
   - **En modo `$` (Monto Fijo COP):**
     - Chip $2.000: `data-testid="btn-preset-desc-2000"`
     - Chip $5.000: `data-testid="btn-preset-desc-5000"`
     - Chip $10.000: `data-testid="btn-preset-desc-10000"`
   - Al tocar cualquier chip preset, se actualiza inmediatamente el input numérico y se puede presionar "Aplicar".
4. **Input Numérico Controlado y Validado:**
   - Input con `data-testid="input-descuento-global-valor"`.
   - Autofoco y auto-selección en foco (`onFocus={(e) => e.target.select()}`).
   - Prefijo/Sufijo visual dinámico (`%` o `$ COP`).
   - Restricciones:
     - Modo `%`: `min="0"`, `max="100"`.
     - Modo `$`: `min="0"`, `max={subtotal}` (previene descuentos que excedan el subtotal y generen totales negativos).
5. **Botonera de Acciones:**
   - Botón "Remover / Quitar": `data-testid="btn-remover-descuento-global"`, con variante roja/borde suave (`text-rose-600 hover:bg-rose-50`), visible o habilitado solo si existe un descuento activo.
   - Botón "Aplicar Descuento": `data-testid="btn-aplicar-descuento-global"`, botón primario esmeralda/ámbar de alta visibilidad (`bg-amber-600 hover:bg-amber-500 text-white font-black py-2 px-3 rounded-lg w-full`).

### Paso 4: Desglose Visual en el Resumen Financiero
Cuando existe un descuento activo (`descuento > 0` o `descuentoGlobalValor > 0`):
1. Se renderiza la fila: `data-testid="cart-discount-breakdown-row"`.
2. Contiene:
   - Etiqueta: `Descuento comanda:`
   - Badge destacable: `data-testid="badge-descuento-global"` con estilo `bg-amber-100 text-amber-900 border border-amber-300 font-bold px-1.5 py-0.5 rounded text-[11px]`. Muestra `-10%` o `-$5.000`.
   - Monto en pesos COP restando: `<span className="font-mono font-bold text-amber-700">-${descuento.toLocaleString('es-CO')}</span>`.
   - Botón de remoción rápida con ícono de cruz: `data-testid="btn-quick-remove-discount"`, permitiendo suprimir el descuento con un solo clic sin reabrir el popover.

### Paso 5: Contrato de Props y Retrocompatibilidad Estricta
Para evitar cualquier rotura en las 54 pruebas unitarias de regresión existentes, las nuevas props en `POSMultivendorCartProps` se declaran como **opcionales**:
```typescript
export interface POSMultivendorCartProps {
  // Props existentes 100% preservadas
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

  // NUEVAS PROPS HITO M2 (Opcionales con fallback interno)
  descuentoGlobalTipo?: 'porcentaje' | 'monto';
  descuentoGlobalValor?: number;
  onApplyGlobalDiscount?: (tipo: 'porcentaje' | 'monto', valor: number) => void;
  onRemoveGlobalDiscount?: () => void;
  isDiscountOpen?: boolean;
  onToggleDiscountOpen?: (isOpen: boolean) => void;
}
```

### Paso 6: Accesibilidad y Captura de Atajos (<kbd>F4</kbd> y <kbd>Esc</kbd>)
1. Si el operador presiona la tecla <kbd>F4</kbd> en el teclado, se captura el evento (`e.preventDefault()`) y se alterna la visibilidad del popover si `items.length > 0`.
2. Si el popover está abierto y el operador presiona <kbd>Escape</kbd>, el popover se cierra limpiamente devolviendo el foco al botón disparador.
3. El popover incorpora detección de clic fuera (Click-Outside Handler) para cerrarse automáticamente si el usuario interactúa con la lista de productos o el catálogo.

---

## 3. Caveats (Límites, Supuestos y Consideraciones)

1. **Gobernanza de PIN de Supervisor (Hito M5):**
   - La especificación SPEC-057 define que si el Descuento > 10%, el sistema requerirá PIN de supervisor.
   - En este Hito M2, el selector permite aplicar el descuento directamente (o preparar la firma para recibir la validación), ya que el modal de PIN y la auditoría de sobregiro pertenecen formalmente al Hito M5. Se recomienda incluir un micro-indicador visual `(>10% requerirá PIN en M5)`.
2. **Prevención de Totales Negativos:**
   - Si el operador selecciona descuento por monto fijo (`$`) y escribe un valor superior al subtotal, el componente debe limitar automáticamente el valor a `subtotal` (`Math.min(valor, subtotal)`), garantizando que el total nunca sea inferior a $0 COP.
3. **Persistencia en Prefactura:**
   - La transmisión del `descuentoGlobalMonto` y `descuentoGlobalPct` al payload final de emisión de prefactura (`emitirPreventaActual`) es coordinada con el store de Zustand (`m2_explorer_store_calc`).

---

## 4. Conclusion (Diseño Detallado para Implementación)

Se entrega la especificación de código quirúrgica para que el agente implementador aplique directamente en `src/views/pos/components/POSMultivendorCart.tsx`:

### 4.1. Código del Popover y Botón Anclado en el Footer
Reemplazo optimizado del bloque de resumen financiero (alrededor de la línea 321):

```tsx
        {/* Resumen Financiero con Botón Permanente F4 y Desglose */}
        <div className="space-y-1.5 py-1">
          {/* Fila 1: Subtotal */}
          <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
            <span>Subtotal ({totalItemsCount} uds):</span>
            <span className="font-mono font-bold text-slate-700">${subtotal.toLocaleString('es-CO')}</span>
          </div>

          {/* Fila 2: Botón Permanente Anclado + Descuento (F4) con Popover Flotante */}
          <div className="relative">
            <button
              type="button"
              id="btn-descuento-global-f4"
              data-testid="btn-descuento-global-f4"
              disabled={items.length === 0}
              onClick={() => handleToggleDiscountPopover()}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                items.length === 0
                  ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                  : currentDiscountValor > 0
                  ? 'border-amber-300 bg-amber-100/80 text-amber-900 hover:bg-amber-100 shadow-xs'
                  : 'border-dashed border-amber-300 bg-amber-50/70 text-amber-800 hover:bg-amber-100/80'
              }`}
              title={items.length === 0 ? 'Agrega productos para aplicar descuento' : 'Aplicar o editar descuento global de comanda (Atajo: F4)'}
            >
              <div className="flex items-center gap-1.5">
                <Tag size={13} className={currentDiscountValor > 0 ? 'text-amber-700' : 'text-amber-600'} />
                <span>+ Descuento (F4)</span>
              </div>
              {currentDiscountValor > 0 ? (
                <span className="font-mono text-[10px] bg-amber-200/90 text-amber-950 px-1.5 py-0.5 rounded font-black">
                  {currentDiscountTipo === 'porcentaje' ? `-${currentDiscountValor}%` : `-$${currentDiscountValor.toLocaleString('es-CO')}`}
                </span>
              ) : (
                <span className="text-[10px] text-amber-600 font-medium">
                  {items.length === 0 ? 'Inactivo' : 'Comanda'}
                </span>
              )}
            </button>

            {/* Popover Flotante Reactivo (No afecta la altura del footer) */}
            {isDiscountOpen && (
              <div 
                ref={popoverRef}
                data-testid="pos-discount-popover"
                className="absolute bottom-full left-0 right-0 mb-2 z-30 bg-white border border-slate-200 shadow-2xl rounded-xl p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-150"
              >
                {/* Cabecera del Popover */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                    <Tag size={14} className="text-amber-600" />
                    <span>Descuento de Comanda</span>
                    <kbd className="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 px-1 py-0.2 rounded font-mono">F4</kbd>
                  </div>
                  <button
                    type="button"
                    data-testid="btn-cerrar-popover-descuento"
                    onClick={() => setIsDiscountOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Alternador de Modo: [%] vs [$] */}
                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    data-testid="btn-modo-porcentaje"
                    onClick={() => setLocalTipo('porcentaje')}
                    className={`py-1 text-xs font-bold rounded-md transition-all ${
                      localTipo === 'porcentaje'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    % Porcentaje
                  </button>
                  <button
                    type="button"
                    data-testid="btn-modo-monto"
                    onClick={() => setLocalTipo('monto')}
                    className={`py-1 text-xs font-bold rounded-md transition-all ${
                      localTipo === 'monto'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    $ Monto Fijo
                  </button>
                </div>

                {/* Chips de Presets Rápidos */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Presets Rápidos
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {localTipo === 'porcentaje' ? (
                      <>
                        <button
                          type="button"
                          data-testid="btn-preset-desc-5"
                          onClick={() => setLocalValor(5)}
                          className={`py-1 px-1.5 text-xs font-mono font-bold rounded-md border transition-all ${
                            localValor === 5
                              ? 'bg-amber-100 border-amber-400 text-amber-900'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          5%
                        </button>
                        <button
                          type="button"
                          data-testid="btn-preset-desc-10"
                          onClick={() => setLocalValor(10)}
                          className={`py-1 px-1.5 text-xs font-mono font-bold rounded-md border transition-all ${
                            localValor === 10
                              ? 'bg-amber-100 border-amber-400 text-amber-900'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          10%
                        </button>
                        <button
                          type="button"
                          data-testid="btn-preset-desc-15"
                          onClick={() => setLocalValor(15)}
                          className={`py-1 px-1.5 text-xs font-mono font-bold rounded-md border transition-all ${
                            localValor === 15
                              ? 'bg-amber-100 border-amber-400 text-amber-900'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          15%
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          data-testid="btn-preset-desc-2000"
                          onClick={() => setLocalValor(2000)}
                          className={`py-1 px-1.5 text-xs font-mono font-bold rounded-md border transition-all ${
                            localValor === 2000
                              ? 'bg-amber-100 border-amber-400 text-amber-900'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          $2.000
                        </button>
                        <button
                          type="button"
                          data-testid="btn-preset-desc-5000"
                          onClick={() => setLocalValor(5000)}
                          className={`py-1 px-1.5 text-xs font-mono font-bold rounded-md border transition-all ${
                            localValor === 5000
                              ? 'bg-amber-100 border-amber-400 text-amber-900'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          $5.000
                        </button>
                        <button
                          type="button"
                          data-testid="btn-preset-desc-10000"
                          onClick={() => setLocalValor(10000)}
                          className={`py-1 px-1.5 text-xs font-mono font-bold rounded-md border transition-all ${
                            localValor === 10000
                              ? 'bg-amber-100 border-amber-400 text-amber-900'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          $10.000
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Input Numérico Manual */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Valor Personalizado
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {localTipo === 'porcentaje' ? 'Máx 100%' : `Máx $${subtotal.toLocaleString('es-CO')}`}
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <span className="absolute left-2.5 text-xs font-mono font-bold text-slate-400 select-none">
                      {localTipo === 'porcentaje' ? '%' : '$'}
                    </span>
                    <input
                      type="number"
                      data-testid="input-descuento-global-valor"
                      value={localValor || ''}
                      onChange={(e) => handleCustomValueChange(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      min="0"
                      max={localTipo === 'porcentaje' ? 100 : subtotal}
                      step={localTipo === 'porcentaje' ? '1' : '500'}
                      placeholder="0"
                      className="w-full h-9 pl-7 pr-3 text-right font-mono font-bold text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
                    />
                  </div>
                </div>

                {/* Botonera de Acciones (Remover / Aplicar) */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  {currentDiscountValor > 0 && (
                    <button
                      type="button"
                      data-testid="btn-remover-descuento-global"
                      onClick={handleRemoveDiscount}
                      className="flex-1 py-2 px-2.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Remover
                    </button>
                  )}
                  <button
                    type="button"
                    data-testid="btn-aplicar-descuento-global"
                    onClick={handleApplyDiscount}
                    className="flex-1 py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-black text-xs shadow-md shadow-amber-600/20 active:scale-98 transition-all cursor-pointer"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Fila 3: Desglose Visual de Descuento Comanda (Requirement 3) */}
          {(descuento > 0 || currentDiscountValor > 0) && (
            <div 
              data-testid="cart-discount-breakdown-row"
              className="flex justify-between items-center text-xs bg-amber-50/90 border border-amber-200/80 px-2.5 py-1 rounded-lg"
            >
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-amber-900">Descuento comanda:</span>
                <span 
                  data-testid="badge-descuento-global"
                  className="px-1.5 py-0.5 rounded bg-amber-200 text-amber-950 text-[10px] font-black tracking-tight font-mono"
                >
                  {currentDiscountTipo === 'porcentaje'
                    ? `-${currentDiscountValor}%`
                    : `-$${currentDiscountValor.toLocaleString('es-CO')}`}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-amber-800">
                  -${descuento.toLocaleString('es-CO')}
                </span>
                <button
                  type="button"
                  data-testid="btn-quick-remove-discount"
                  onClick={handleRemoveDiscount}
                  className="p-0.5 text-amber-500 hover:text-amber-800 hover:bg-amber-200/60 rounded transition-colors cursor-pointer"
                  title="Quitar descuento de comanda"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          )}

          {/* Fila 4: Total a Pagar */}
          <div className="flex justify-between items-baseline pt-1 border-t border-slate-200">
            <span className="text-xs font-black uppercase tracking-wider text-slate-800">
              Total a Pagar
            </span>
            <span 
              data-testid="pos-cart-total-amount"
              className="text-2xl sm:text-3xl font-mono font-black text-emerald-600 leading-none"
            >
              ${total.toLocaleString('es-CO')}
            </span>
          </div>
        </div>
```

---

## 5. Verification Method (Método de Verificación Independiente)

Para comprobar de forma rigurosa y determinista la validez de este diseño:

### 5.1. Comandos de Verificación
1. **Verificación de Tipado TypeScript:**
   ```bash
   npx tsc --noEmit
   ```
   *Criterio:* Debe finalizar con código 0 sin errores de tipos en `POSMultivendorCart.tsx` ni en sus consumidores.
2. **Suite de Regresión del Carrito:**
   ```bash
   npx vitest run src/tests/posCartEditableRow.test.tsx
   ```
   *Criterio:* Las 10 pruebas unitarias existentes deben seguir pasando al 100% en verde.
3. **Nueva Suite de Pruebas de Descuento Global F4:**
   ```bash
   npx vitest run src/tests/posGlobalDiscount.test.tsx
   ```
   *Criterio:* Todas las pruebas de renderizado, apertura de popover, toggle de modo, presets, aplicación y remoción deben pasar en verde en menos de 10ms por test.

### 5.2. Puntos de Inspección DOM en Pruebas
| Elemento DOM | Selector / testid | Condición Esperada |
| :--- | :--- | :--- |
| Botón disparador | `getByTestId('btn-descuento-global-f4')` | Presente, anclado en footer, inhabilitado si cart vacío |
| Popover | `getByTestId('pos-discount-popover')` | Visible tras clic o tecla F4, clase `absolute bottom-full` |
| Toggle Porcentaje | `getByTestId('btn-modo-porcentaje')` | Alterna modo a porcentual |
| Toggle Monto | `getByTestId('btn-modo-monto')` | Alterna modo a valor fijo ($) |
| Chips Presets | `getByTestId('btn-preset-desc-10')` | Carga 10 en el input numérico |
| Input Numérico | `getByTestId('input-descuento-global-valor')` | Permite escribir número con auto-selección en foco |
| Botón Aplicar | `getByTestId('btn-aplicar-descuento-global')` | Dispara callback y cierra popover |
| Desglose Resumen | `getByTestId('cart-discount-breakdown-row')` | Muestra `Descuento comanda: -$X.XXX` |
| Badge Descuento | `getByTestId('badge-descuento-global')` | Contiene texto `"-10%"` o `"- $5.000"` |
| Botón Remover | `getByTestId('btn-remover-descuento-global')` | Restablece descuento a 0 |
| Total a Pagar | `getByTestId('pos-cart-total-amount')` | Refleja `subtotal - descuento` en tiempo real |

### 5.3. Condiciones de Invalidación
Este diseño se considerará inválido si:
- El footer se expande en altura empujando la lista de productos por debajo del 75% del viewport útil.
- Los tests existentes en `src/tests/posCartEditableRow.test.tsx` fallan por cambios de tipos o clases requeridas.
- El botón `btn-descuento-global-f4` desaparece o deja de estar visible cuando hay un descuento activo.
- El cálculo introduce asincronía o demoras superiores a 10ms.
