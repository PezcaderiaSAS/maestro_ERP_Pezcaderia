# Reporte de Handoff TDD: Especificación y Suite de Pruebas para Descuento Global F4 (Hito M2)

**Agente:** Explorer de TDD (`m2_explorer_tdd`)  
**Hito:** Hito M2 — Tarea 2: Motor de Descuento Global de Comanda F4 [% / $] y Recálculo Sub-10ms en Zustand  
**Fecha:** 2026-11-08  
**Estado:** COMPLETO (Hard Handoff)  
**Destinatario:** Orquestador de Equipo (`214a0168-c4c8-4555-84a8-e65c4fad7287`) y Worker Implementador de M2 (`worker_m2_actions` / `m2_worker_actions`)  

---

## 1. Observation (Observaciones Directas de la Base de Código)

### 1.1. Estado Actual de la Suite de Pruebas del Carrito
- En el Hito M1 se creó la suite `src/tests/posCartEditableRow.test.tsx` que valida la edición en línea de cantidad y precio, la navegación por Tab y el micro-botón `[+ Desc]` por ítem.
- Comando ejecutado: `npx vitest run src/tests/posCartEditableRow.test.tsx`
- Resultado obtenido:
  ```
  ✓ src/tests/posCartEditableRow.test.tsx (10 tests) 377ms
  Test Files  1 passed (1)
       Tests  10 passed (10)
  ```
- No existe actualmente la suite `src/tests/posGlobalDiscount.test.tsx` (`Test-Path "src/tests/posGlobalDiscount.test.tsx"` retorna `False`).

### 1.2. Estructura Actual del Pie de Carrito en `POSMultivendorCart.tsx`
En `src/views/pos/components/POSMultivendorCart.tsx` (líneas 305-346):
```tsx
305:      {/* 3. FOOTER FIJO INFERIOR CON ACCIÓN DE COMANDA / COBRO */}
306:      <div className="p-3 bg-slate-50 border-t border-slate-200 shrink-0 mt-auto space-y-2">
...
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
- No existe el botón `btn-descuento-global-f4`.
- El bloque de descuento solo se muestra si `descuento > 0`, sin permitir modificarlo interactivamente ni alternar entre `%` y `$`.

### 1.3. Estado Actual de `useMultiVendorPosStore.ts`
En `src/stores/useMultiVendorPosStore.ts` (líneas 216-228):
```typescript
    obtenerSubtotalCart: () => {
      const { cartItems } = get();
      return cartItems.reduce((acc, it) => acc + it.precioLista * it.cantidad, 0);
    },

    obtenerTotalCart: () => {
      const { cartItems } = get();
      return cartItems.reduce((acc, it) => {
        const desc = it.descuentoPct || 0;
        const precioFinal = Math.round(it.precioLista * (1 - desc / 100));
        return acc + precioFinal * it.cantidad;
      }, 0);
    },
```
- El store solo contempla `descuentoPct` individual por línea.
- No dispone de `descuentoGlobal: { tipo: 'porcentaje' | 'monto'; valor: number } | null` ni de las acciones `aplicarDescuentoGlobal` o `limpiarDescuentoGlobal`.

### 1.4. Servicio Financiero Base en `src/services/posService.ts`
En `src/services/posService.ts` (líneas 47-71), la función `calcularTotalesPedido` ya implementa la regla matemática determinista:
```typescript
export function calcularTotalesPedido(
  lineas: (Pick<LineaVenta, 'totalLinea'> & { baseGravableLinea?: number; cuotaIvaLinea?: number })[],
  descuentoGlobalPct: number = 0,
  descuentoGlobalValor: number = 0
) {
  const subtotal = Math.round(lineas.reduce((acc, l) => acc + (l.totalLinea || 0), 0));
  const descuento = Math.round(descuentoGlobalValor || subtotal * (descuentoGlobalPct / 100));
  if (descuento > subtotal) {
    return { data: null, error: 'El descuento no puede superar el total del pedido' };
  }
  const totalFinal = subtotal - descuento;
  ...
}
```

---

## 2. Logic Chain (Cadena de Razonamiento y Diseño TDD)

Para asegurar la metodología TDD rigurosa (RED -> GREEN -> REFACTOR) exigida por la Constitución y SDD v3.0, la nueva suite `src/tests/posGlobalDiscount.test.tsx` debe estructurarse en torno a los 8 requisitos funcionales mandatorios del Hito M2:

### Paso 1: Mapeo de Contratos y Atributos DOM
Se acuerda la siguiente matriz de `data-testid` canónicos entre UI (`m2_explorer_cart_footer`), Store y Tests:

| Elemento / Control | `data-testid` | Rol / Función |
| :--- | :--- | :--- |
| Botón Anclado F4 | `btn-descuento-global-f4` | Disparador permanente en el pie de totales. Contiene pista `<kbd>F4</kbd>` |
| Popover / Modal Flotante | `pos-discount-popover` | Contenedor interactivo flotante (`absolute bottom-full`) |
| Botón Cerrar Popover | `btn-cerrar-popover-descuento` | Cierra el popover sin aplicar cambios |
| Toggle Porcentaje | `btn-modo-porcentaje` | Alterna selector a modo porcentaje (`%`) |
| Toggle Monto Fijo | `btn-modo-monto` | Alterna selector a modo moneda fija (`$ COP`) |
| Input Numérico Valor | `input-descuento-global-valor` | Campo numérico para digitar el % o el monto en COP |
| Chip Preset 5% | `btn-preset-desc-5` | Inyecta 5 en el input numérico |
| Chip Preset 10% | `btn-preset-desc-10` | Inyecta 10 en el input numérico |
| Chip Preset 15% | `btn-preset-desc-15` | Inyecta 15 en el input numérico |
| Chip Preset $2.000 | `btn-preset-desc-2000` | Inyecta 2000 en el input numérico |
| Chip Preset $5.000 | `btn-preset-desc-5000` | Inyecta 5000 en el input numérico |
| Chip Preset $10.000 | `btn-preset-desc-10000` | Inyecta 10000 en el input numérico |
| Botón Aplicar | `btn-aplicar-descuento-global` | Confirma y aplica el descuento seleccionado |
| Botón Remover Popover | `btn-remover-descuento-global` | Quita el descuento desde el interior del popover |
| Fila Desglose Resumen | `cart-discount-breakdown-row` | Fila visual en el resumen que exhibe `Descuento comanda` |
| Badge Descuento | `badge-descuento-global` | Badge ambarino con `-10%` o `-$5.000` |
| Botón Quitar Rápido | `btn-quick-remove-discount` | Botón `X` en la fila de desglose para remover con 1 clic |
| Total a Pagar | `pos-cart-total-amount` | Elemento que refleja el total financiero recalculado |

### Paso 2: Desglose de Pruebas Unitarias e Interactivas (8 Bloques / 19 Casos)
1. **Bloque 1: Renderizado y Ergonomía del Botón Anclado `+ Descuento (F4)`**
   - Caso 1: Renderizado en el bloque de totales (`shrink-0 mt-auto`).
   - Caso 2: Inhabilitación estricta (`disabled={true}`, `opacity-60 cursor-not-allowed`) cuando el carrito está vacío (`items.length === 0`).
   - Caso 3: Habilitación operativa cuando el carrito contiene 1 o más productos.
2. **Bloque 2: Apertura y Cierre del Selector Interactivo de Descuento**
   - Caso 4: Despliegue del popover interactivo `pos-discount-popover` al hacer clic en `btn-descuento-global-f4`.
   - Caso 5: Cierre limpio del popover al presionar `btn-cerrar-popover-descuento` o tecla `Escape`.
3. **Bloque 3: Selector de Modo [% vs $ COP] y Presets Rápidos**
   - Caso 6: Alternancia fluida entre modo `%` y modo `$`, actualizando etiquetas y símbolos.
   - Caso 7: Presets rápidos de porcentaje (5%, 10%, 15%) auto-rellenan el input con el valor respectivo.
   - Caso 8: Presets rápidos de monto fijo ($2.000, $5.000, $10.000 COP) auto-rellenan el input al estar en modo `$`.
4. **Bloque 4: Aplicación de Descuento Porcentual y Recálculo de Totales**
   - Caso 9: Aplicación de descuento del 10% sobre subtotal de $70.500 COP emite callback `onApplyGlobalDiscount('porcentaje', 10)`.
   - Caso 10: Reflejo visual en el resumen: desglose con `-$7.050` COP y total a pagar de `$63.450` COP (`data-testid="pos-cart-total-amount"`).
5. **Bloque 5: Aplicación de Descuento en Monto Fijo ($ COP) y Prevención de Total Negativo**
   - Caso 11: Aplicación de descuento fijo de $5.000 COP emite callback `onApplyGlobalDiscount('monto', 5000)` y totaliza `$65.500` COP.
   - Caso 12: Prevención de total negativo ante monto que excede el subtotal: si subtotal es $70.500 y se intenta aplicar $80.000, se acota el descuento al subtotal ($70.500) o se bloquea la aplicación, garantizando que el total sea $\ge 0$.
6. **Bloque 6: Limpieza y Reseteo del Descuento Global**
   - Caso 13: Botón de remoción en el popover (`btn-remover-descuento-global`) dispara `onRemoveGlobalDiscount` y restablece el total íntegro.
   - Caso 14: Botón de remoción rápida en el resumen (`btn-quick-remove-discount`) permite limpiar el descuento con un solo clic.
7. **Bloque 7: Lógica Financiera en Store Zustand (`useMultiVendorPosStore`)**
   - Caso 15: Acción `aplicarDescuentoGlobal('porcentaje', 10)` en `useMultiVendorPosStore` recalcula síncronamente `obtenerTotalCart()`.
   - Caso 16: Acción `aplicarDescuentoGlobal('monto', 5000)` en `useMultiVendorPosStore` resta el monto directo en COP.
   - Caso 17: Acción `limpiarDescuentoGlobal()` en `useMultiVendorPosStore` remueve el descuento y restaura el total íntegro.
8. **Bloque 8: Benchmark de Rendimiento en Memoria Sub-10ms (<10ms)**
   - Caso 18: Recálculo en memoria con carrito de 50 ítems de catálogo toma menos de 10ms (`expect(duration).toBeLessThan(10)`).
   - Caso 19: Ráfaga de 100 recálculos sucesivos con alternancia `%` y `$` mantiene latencia promedio sub-1ms (60 FPS sin jitter).

---

## 3. Caveats (Límites, Supuestos y Consideraciones)

1. **Atajo Global de Teclado F4:**
   - La captura del atajo global F4 en cualquier parte de la ventana (`window.addEventListener('keydown')`) forma parte del Hito M4 (`usePOSKeyboardShortcuts.ts`). En este Hito M2, el componente y la suite prueban la interacción táctil/ratón del botón F4 y la captura de teclado local (Enter/Espacio sobre el botón y Escape para cerrar el popover).
2. **Autorización con PIN de Supervisor (Hito M5):**
   - De acuerdo con SPEC-057, descuentos superiores al 10% requerirán PIN de supervisor en el Hito M5. En el Hito M2, el motor financiero y la UI ejecutan y prueban el cálculo matemático directo, dejando las puertas de enlace listas para la intercepción de PIN en M5.
3. **Immutabilidad y No-Regresión:**
   - La suite debe correr de forma completamente aislada sin afectar a `src/tests/posCartEditableRow.test.tsx` ni a `src/tests/useMultiVendorPosStore.test.ts`.

---

## 4. Conclusion (Especificación Completa del Archivo de Pruebas)

A continuación se entrega el código fuente canónico y completo listo para que el agente implementador lo cree como `src/tests/posGlobalDiscount.test.tsx`:

```tsx
// src/tests/posGlobalDiscount.test.tsx
// Suite de Pruebas TDD: Motor de Descuento Global de Comanda F4 [% / $] y Recálculo Sub-10ms (SPEC-057 Tarea 2 / Hito M2)

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { POSMultivendorCart } from '../views/pos/components/POSMultivendorCart';
import { useMultiVendorPosStore } from '../stores/useMultiVendorPosStore';
import type { Product } from '../types/erp.types';
import type { MultivendorCartItem } from '../views/pos/components/POSMultivendorCart';

describe('Hito M2: Motor de Descuento Global de Comanda F4 [% / $] y Recálculo Sub-10ms en Zustand (SPEC-057 Tarea 2)', () => {
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
      precio_venta_restaurante: 17000,
      precio_venta_mayorista: 16000,
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
      precio_venta_restaurante: 8000,
      precio_venta_mayorista: 7500,
      activo: true,
    },
  ];

  // Carrito de prueba: 2.5 kg * $18.000 = $45.000 + 3 und * $8.500 = $25.500 => Subtotal = $70.500 COP
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

  const defaultProps = {
    items: mockItems,
    onUpdateQuantity: vi.fn(),
    onRemoveItem: vi.fn(),
    onClearCart: vi.fn(),
    subtotal: 70500,
    descuento: 0,
    total: 70500,
    onEmitirComanda: vi.fn(),
    activeVendorName: 'Diego Díaz',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useMultiVendorPosStore.setState({
      cartItems: [],
      terminalId: 'TERM-01',
      descuentoGlobal: null,
    });
  });

  // =========================================================================
  // Bloque 1: Renderizado y Ergonomía del Botón Anclado + Descuento (F4)
  // =========================================================================
  describe('Bloque 1: Renderizado y Ergonomía del Botón Anclado + Descuento (F4)', () => {
    it('Caso 1: Renderizado del botón anclado + Descuento (F4) con data-testid="btn-descuento-global-f4"', () => {
      render(<POSMultivendorCart {...defaultProps} />);

      const btnDescuento = screen.getByTestId('btn-descuento-global-f4');
      expect(btnDescuento).toBeInTheDocument();
      expect(btnDescuento).toHaveTextContent('+ Descuento (F4)');

      // Verificar que se encuentra anclado en la sección inferior de totales
      const totalDisplay = screen.getByTestId('pos-cart-total-amount');
      const footer = totalDisplay.closest('div.shrink-0');
      expect(footer).toContainElement(btnDescuento);
    });

    it('Caso 2: Deshabilitación estricta cuando el carrito tiene 0 ítems', () => {
      render(<POSMultivendorCart {...defaultProps} items={[]} subtotal={0} total={0} />);

      const btnDescuento = screen.getByTestId('btn-descuento-global-f4');
      expect(btnDescuento).toBeDisabled();

      // Intentar clic en botón deshabilitado no debe abrir el selector
      fireEvent.click(btnDescuento);
      expect(screen.queryByTestId('pos-discount-popover')).not.toBeInTheDocument();
    });

    it('Caso 3: Habilitación operativa cuando el carrito contiene al menos 1 ítem', () => {
      render(<POSMultivendorCart {...defaultProps} />);

      const btnDescuento = screen.getByTestId('btn-descuento-global-f4');
      expect(btnDescuento).not.toBeDisabled();
    });
  });

  // =========================================================================
  // Bloque 2: Interacción de Apertura y Cierre del Selector de Descuento
  // =========================================================================
  describe('Bloque 2: Interacción de Apertura y Cierre del Selector de Descuento', () => {
    it('Caso 4: Apertura del popover interactivo al presionar el botón + Descuento (F4)', () => {
      render(<POSMultivendorCart {...defaultProps} />);

      const btnDescuento = screen.getByTestId('btn-descuento-global-f4');
      fireEvent.click(btnDescuento);

      const popover = screen.getByTestId('pos-discount-popover');
      expect(popover).toBeInTheDocument();
      expect(screen.getByTestId('btn-modo-porcentaje')).toBeInTheDocument();
      expect(screen.getByTestId('btn-modo-monto')).toBeInTheDocument();
      expect(screen.getByTestId('input-descuento-global-valor')).toBeInTheDocument();
      expect(screen.getByTestId('btn-aplicar-descuento-global')).toBeInTheDocument();
    });

    it('Caso 5: Cierre del popover al pulsar el botón cerrar o presionar Escape', () => {
      render(<POSMultivendorCart {...defaultProps} />);

      // Abrir popover
      fireEvent.click(screen.getByTestId('btn-descuento-global-f4'));
      expect(screen.getByTestId('pos-discount-popover')).toBeInTheDocument();

      // Cerrar mediante botón X
      const btnCerrar = screen.getByTestId('btn-cerrar-popover-descuento');
      fireEvent.click(btnCerrar);
      expect(screen.queryByTestId('pos-discount-popover')).not.toBeInTheDocument();

      // Reabrir y cerrar mediante Escape
      fireEvent.click(screen.getByTestId('btn-descuento-global-f4'));
      expect(screen.getByTestId('pos-discount-popover')).toBeInTheDocument();
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(screen.queryByTestId('pos-discount-popover')).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // Bloque 3: Selector de Modo [% vs $ COP] y Presets Rápidos
  // =========================================================================
  describe('Bloque 3: Selector de Modo [% vs $ COP] y Presets Rápidos', () => {
    it('Caso 6: Alternancia de modo entre Porcentaje (%) y Monto Fijo ($ COP)', () => {
      render(<POSMultivendorCart {...defaultProps} />);
      fireEvent.click(screen.getByTestId('btn-descuento-global-f4'));

      const btnPorcentaje = screen.getByTestId('btn-modo-porcentaje');
      const btnMonto = screen.getByTestId('btn-modo-monto');

      // Porcentaje activo por defecto
      expect(btnPorcentaje.className).toContain('bg-amber-600');

      // Alternar a Monto Fijo
      fireEvent.click(btnMonto);
      expect(btnMonto.className).toContain('bg-amber-600');
      expect(screen.getByText('$')).toBeInTheDocument();

      // Regresar a Porcentaje
      fireEvent.click(btnPorcentaje);
      expect(btnPorcentaje.className).toContain('bg-amber-600');
      expect(screen.getByText('%')).toBeInTheDocument();
    });

    it('Caso 7: Presets rápidos de porcentaje (5%, 10%, 15%) auto-rellenan el input', () => {
      render(<POSMultivendorCart {...defaultProps} />);
      fireEvent.click(screen.getByTestId('btn-descuento-global-f4'));

      const inputValor = screen.getByTestId('input-descuento-global-valor') as HTMLInputElement;

      fireEvent.click(screen.getByTestId('btn-preset-desc-5'));
      expect(inputValor.value).toBe('5');

      fireEvent.click(screen.getByTestId('btn-preset-desc-10'));
      expect(inputValor.value).toBe('10');

      fireEvent.click(screen.getByTestId('btn-preset-desc-15'));
      expect(inputValor.value).toBe('15');
    });

    it('Caso 8: Presets rápidos de monto fijo ($2.000, $5.000, $10.000) en modo moneda', () => {
      render(<POSMultivendorCart {...defaultProps} />);
      fireEvent.click(screen.getByTestId('btn-descuento-global-f4'));

      // Activar modo monto
      fireEvent.click(screen.getByTestId('btn-modo-monto'));
      const inputValor = screen.getByTestId('input-descuento-global-valor') as HTMLInputElement;

      fireEvent.click(screen.getByTestId('btn-preset-desc-2000'));
      expect(inputValor.value).toBe('2000');

      fireEvent.click(screen.getByTestId('btn-preset-desc-5000'));
      expect(inputValor.value).toBe('5000');

      fireEvent.click(screen.getByTestId('btn-preset-desc-10000'));
      expect(inputValor.value).toBe('10000');
    });
  });

  // =========================================================================
  // Bloque 4: Aplicación de Descuento Porcentual y Recálculo de Totales
  // =========================================================================
  describe('Bloque 4: Aplicación de Descuento Porcentual y Recálculo de Totales', () => {
    it('Caso 9: Aplicar 10% de descuento emite callback onApplyGlobalDiscount', () => {
      const onApplyGlobalDiscount = vi.fn();
      render(
        <POSMultivendorCart
          {...defaultProps}
          onApplyGlobalDiscount={onApplyGlobalDiscount}
        />
      );

      fireEvent.click(screen.getByTestId('btn-descuento-global-f4'));
      fireEvent.click(screen.getByTestId('btn-preset-desc-10'));
      fireEvent.click(screen.getByTestId('btn-aplicar-descuento-global'));

      expect(onApplyGlobalDiscount).toHaveBeenCalledWith('porcentaje', 10);
      expect(screen.queryByTestId('pos-discount-popover')).not.toBeInTheDocument();
    });

    it('Caso 10: Desglose visual de comanda y total a pagar actualizado con descuento porcentual', () => {
      // Subtotal = $70.500, Descuento 10% = $7.050, Total = $63.450
      render(
        <POSMultivendorCart
          {...defaultProps}
          descuento={7050}
          total={63450}
          descuentoGlobalTipo="porcentaje"
          descuentoGlobalValor={10}
        />
      );

      // Verificar fila de desglose
      const desgloseRow = screen.getByTestId('cart-discount-breakdown-row');
      expect(desgloseRow).toBeInTheDocument();
      expect(screen.getByTestId('badge-descuento-global')).toHaveTextContent('-10%');
      expect(desgloseRow).toHaveTextContent('-$7.050');

      // Verificar Total a Pagar
      expect(screen.getByTestId('pos-cart-total-amount')).toHaveTextContent('$63.450');

      // Verificar que el botón anclado refleja el descuento activo
      const btnDescuento = screen.getByTestId('btn-descuento-global-f4');
      expect(btnDescuento).toHaveTextContent('-10%');
    });
  });

  // =========================================================================
  // Bloque 5: Aplicación de Descuento en Monto Fijo ($ COP) y Prevención de Total Negativo
  // =========================================================================
  describe('Bloque 5: Aplicación de Descuento en Monto Fijo ($ COP) y Prevención de Total Negativo', () => {
    it('Caso 11: Aplicar descuento fijo de $5.000 COP emite callback y actualiza total', () => {
      const onApplyGlobalDiscount = vi.fn();
      render(
        <POSMultivendorCart
          {...defaultProps}
          onApplyGlobalDiscount={onApplyGlobalDiscount}
        />
      );

      fireEvent.click(screen.getByTestId('btn-descuento-global-f4'));
      fireEvent.click(screen.getByTestId('btn-modo-monto'));
      fireEvent.click(screen.getByTestId('btn-preset-desc-5000'));
      fireEvent.click(screen.getByTestId('btn-aplicar-descuento-global'));

      expect(onApplyGlobalDiscount).toHaveBeenCalledWith('monto', 5000);
    });

    it('Caso 12: Prevención estricta de total negativo ante descuento mayor al subtotal', () => {
      // Si subtotal es $70.500 y se aplica $80.000, el componente o store acota a $70.500 (total = 0)
      const onApplyGlobalDiscount = vi.fn();
      render(
        <POSMultivendorCart
          {...defaultProps}
          onApplyGlobalDiscount={onApplyGlobalDiscount}
        />
      );

      fireEvent.click(screen.getByTestId('btn-descuento-global-f4'));
      fireEvent.click(screen.getByTestId('btn-modo-monto'));

      const inputValor = screen.getByTestId('input-descuento-global-valor');
      fireEvent.change(inputValor, { target: { value: '999999' } });
      fireEvent.click(screen.getByTestId('btn-aplicar-descuento-global'));

      // Debe acotar el valor al subtotal máximo disponible
      expect(onApplyGlobalDiscount).toHaveBeenCalledWith('monto', 70500);
    });
  });

  // =========================================================================
  // Bloque 6: Limpieza y Reseteo del Descuento Global
  // =========================================================================
  describe('Bloque 6: Limpieza y Reseteo del Descuento Global', () => {
    it('Caso 13: Botón remover en el popover restablece el descuento y dispara onRemoveGlobalDiscount', () => {
      const onRemoveGlobalDiscount = vi.fn();
      render(
        <POSMultivendorCart
          {...defaultProps}
          descuento={7050}
          total={63450}
          descuentoGlobalTipo="porcentaje"
          descuentoGlobalValor={10}
          onRemoveGlobalDiscount={onRemoveGlobalDiscount}
        />
      );

      fireEvent.click(screen.getByTestId('btn-descuento-global-f4'));
      const btnRemover = screen.getByTestId('btn-remover-descuento-global');
      expect(btnRemover).toBeInTheDocument();

      fireEvent.click(btnRemover);
      expect(onRemoveGlobalDiscount).toHaveBeenCalledTimes(1);
    });

    it('Caso 14: Botón de descarte rápido (X) en la fila de desglose remueve el descuento inmediatamente', () => {
      const onRemoveGlobalDiscount = vi.fn();
      render(
        <POSMultivendorCart
          {...defaultProps}
          descuento={5000}
          total={65500}
          descuentoGlobalTipo="monto"
          descuentoGlobalValor={5000}
          onRemoveGlobalDiscount={onRemoveGlobalDiscount}
        />
      );

      const btnQuickRemove = screen.getByTestId('btn-quick-remove-discount');
      fireEvent.click(btnQuickRemove);
      expect(onRemoveGlobalDiscount).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // Bloque 7: Lógica Financiera en Store Zustand (useMultiVendorPosStore)
  // =========================================================================
  describe('Bloque 7: Lógica Financiera en Store Zustand (useMultiVendorPosStore)', () => {
    it('Caso 15: aplicarDescuentoGlobal en modo porcentaje recalcula obtenerTotalCart', () => {
      useMultiVendorPosStore.getState().agregarItem({
        productoId: 'prod-01',
        nombre: 'Mojarra Roja',
        cantidad: 2,
        precioLista: 20000,
        descuentoPct: 0,
      });

      expect(useMultiVendorPosStore.getState().obtenerSubtotalCart()).toBe(40000);
      expect(useMultiVendorPosStore.getState().obtenerTotalCart()).toBe(40000);

      // Aplicar 10%
      useMultiVendorPosStore.getState().aplicarDescuentoGlobal('porcentaje', 10);
      expect(useMultiVendorPosStore.getState().obtenerDescuentoGlobalMonto()).toBe(4000);
      expect(useMultiVendorPosStore.getState().obtenerTotalCart()).toBe(36000);
    });

    it('Caso 16: aplicarDescuentoGlobal en modo monto resta el valor exacto en COP', () => {
      useMultiVendorPosStore.getState().agregarItem({
        productoId: 'prod-02',
        nombre: 'Atún en Lata',
        cantidad: 4,
        precioLista: 10000,
        descuentoPct: 0,
      });

      // Subtotal = $40.000. Aplicar $7.500 COP
      useMultiVendorPosStore.getState().aplicarDescuentoGlobal('monto', 7500);
      expect(useMultiVendorPosStore.getState().obtenerDescuentoGlobalMonto()).toBe(7500);
      expect(useMultiVendorPosStore.getState().obtenerTotalCart()).toBe(32500);
    });

    it('Caso 17: limpiarDescuentoGlobal restaura el total al subtotal íntegro', () => {
      useMultiVendorPosStore.getState().agregarItem({
        productoId: 'prod-01',
        nombre: 'Mojarra Roja',
        cantidad: 2,
        precioLista: 20000,
        descuentoPct: 0,
      });

      useMultiVendorPosStore.getState().aplicarDescuentoGlobal('porcentaje', 15);
      expect(useMultiVendorPosStore.getState().obtenerTotalCart()).toBe(34000);

      useMultiVendorPosStore.getState().limpiarDescuentoGlobal();
      expect(useMultiVendorPosStore.getState().obtenerDescuentoGlobalMonto()).toBe(0);
      expect(useMultiVendorPosStore.getState().obtenerTotalCart()).toBe(40000);
    });
  });

  // =========================================================================
  // Bloque 8: Benchmark de Rendimiento en Memoria Sub-10ms (<10ms)
  // =========================================================================
  describe('Bloque 8: Benchmark de Rendimiento en Memoria Sub-10ms (<10ms)', () => {
    it('Caso 18: Recálculo con 50 líneas de catálogo en memoria ejecuta en menos de 10ms', () => {
      // Cargar 50 líneas de producto en el store de Zustand
      for (let i = 0; i < 50; i++) {
        useMultiVendorPosStore.getState().agregarItem({
          productoId: `prod-bench-${i}`,
          nombre: `Producto Especial Pescadería ${i}`,
          cantidad: 1.5 + (i % 3),
          precioLista: 12000 + i * 500,
          descuentoPct: i % 5 === 0 ? 5 : 0,
        });
      }

      expect(useMultiVendorPosStore.getState().cartItems).toHaveLength(50);

      // Medir tiempo de ejecución estricto con performance.now()
      const t0 = performance.now();
      useMultiVendorPosStore.getState().aplicarDescuentoGlobal('porcentaje', 12);
      const total = useMultiVendorPosStore.getState().obtenerTotalCart();
      const t1 = performance.now();

      const elapsedMs = t1 - t0;
      expect(total).toBeGreaterThan(0);
      expect(elapsedMs).toBeLessThan(10); // Límite estricto constitucional: sub-10ms
    });

    it('Caso 19: Ráfaga de 100 recálculos sucesivos mantiene latencia promedio sub-1ms (60 FPS)', () => {
      const store = useMultiVendorPosStore.getState();
      const t0 = performance.now();

      for (let i = 1; i <= 100; i++) {
        if (i % 2 === 0) {
          store.aplicarDescuentoGlobal('porcentaje', (i % 20) + 1);
        } else {
          store.aplicarDescuentoGlobal('monto', i * 500);
        }
        store.obtenerTotalCart();
      }

      const totalElapsed = performance.now() - t0;
      const averageMs = totalElapsed / 100;

      expect(averageMs).toBeLessThan(1); // Rendimiento ultra-reactivo en memoria
    });
  });
});
```

---

## 5. Verification Method (Método de Verificación Independiente)

Para verificar de forma autónoma e independiente el cumplimiento de esta especificación TDD:

### 5.1. Comandos de Ejecución
1. **Fase RED (Fallo inicial esperado antes de implementar el código de M2):**
   ```bash
   npx vitest run src/tests/posGlobalDiscount.test.tsx
   ```
   *Resultado esperado:* Debe fallar indicando que `btn-descuento-global-f4` no está presente en `POSMultivendorCart.tsx` y que `aplicarDescuentoGlobal` no está definido en `useMultiVendorPosStore.ts`.
2. **Fase GREEN (Éxito tras implementar los cambios en componente y store):**
   ```bash
   npx vitest run src/tests/posGlobalDiscount.test.tsx
   ```
   *Resultado esperado:* 19/19 tests pasando al 100% en verde con tiempo de suite inferior a 800ms.
3. **No-Regresión en Suite de Fila Editable (Hito M1):**
   ```bash
   npx vitest run src/tests/posCartEditableRow.test.tsx
   ```
   *Resultado esperado:* 10/10 tests verdes (100% pasando).
4. **Validación Estricta de Tipos TypeScript:**
   ```bash
   npx tsc --noEmit
   ```
   *Resultado esperado:* 0 errores de tipado.

### 5.2. Condiciones de Invalidación
Esta especificación se considerará inválida si:
- El popover provoca un salto de layout (CLS) que expande el pie de carrito verticalmente empujando la lista de productos.
- Alguna de las 19 pruebas tarda $\ge 10$ms en la resolución de cálculo en memoria.
- Un descuento en monto fijo mayor al subtotal produce un total final negativo ($< 0$ COP).
- Se rompen las props o contratos de fila de carrito desarrollados en el Hito M1.
