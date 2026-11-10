# Reporte de Handoff — Explorer de Estrategia TDD (Hito M3)

**Hito M3 (SPEC-057 Tarea 3)**: Trigger Táctil de Pesaje Manual `ManualWeightModal` para Ítems a Granel / KG Balanza  
**Agente**: Explorer TDD (`m3_explorer_tdd`)  
**Fecha/Hora**: 2026-11-09T11:46:00Z  
**Estado**: Hard Handoff (Diseño y especificación TDD completados al 100%)

---

## 1. Observation (Observaciones Directas)

1. **Estado Actual de `src/views/pos/components/ManualWeightModal.tsx`**:
   - Posee soporte para `isOpen: boolean`, `producto: any`, `pesoInicial?: number`, `precioUnitario?: number`, `onConfirm?: (producto: any, pesoKg: number) => void`, `onConfirmWeight?: (pesoKg: number) => void`, `onClose: () => void` (líneas 5-13).
   - Renderiza 8 chips de acceso rápido (`CHIPS_PESO_FRECUENTE`: 0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 5.0 kg; líneas 15-24). Cada chip tiene `min-h-[48px]`.
   - Posee un teclado numérico táctil en pantalla de 3 columnas (líneas 231-269): dígitos 1-9 (`keypad-btn-1` a `keypad-btn-9`), punto decimal (`keypad-btn-dot`), cero (`keypad-btn-0`) y retroceso (`keypad-btn-backspace` con icono `<Delete size={22} />`).
   - Botón de confirmación gigante con altura de 56px (`min-h-[56px]`, línea 277) y `data-testid="manual-weight-confirm-btn"`.
   - **Carencia detectada 1**: No existe actualmente el botón `keypad-btn-clear` (o `keypad-btn-c` para "Limpiar / C"), lo que impide el reseteo inmediato a $0/vacío requerido en la especificación táctil.

2. **Estado Actual de `src/views/pos/components/POSMultivendorView.tsx`**:
   - Declara la prop opcional `onOpenScaleModal?: (product: Product) => void;` (línea 36) y la retransmite al catálogo `POSMultivendorCatalog` (línea 175).
   - `handleBarcodeSubmit` (líneas 80-97) ejecuta directamente `onAddToCart(found, 1);` sin comprobar si `found.unidadMedida === 'kg'`, impidiendo el pesaje táctil al escanear balanza.
   - **Carencia detectada 2**: `POSMultivendorView` no gestiona internamente el estado `scaleModalProduct` ni monta `<ManualWeightModal />` por defecto. Si el contenedor padre no suministra `onOpenScaleModal`, el clic en ítems pesables recae en `onAddToCart(product, 1)` sin abrir el modal de pesaje manual.

3. **Estado Actual de `src/views/pos/components/POSMultivendorCatalog.tsx`**:
   - `isProductPesable` (líneas 95-98) detecta unidades `'KG'`, `'KILO'`, `'KILOS'`, `'GR'`, `'GRAMOS'`.
   - En el evento `onClick` de la tarjeta (líneas 152-158):
     ```typescript
     onClick={() => {
       if (pesable && onOpenScaleModal) {
         onOpenScaleModal(product);
       } else {
         onAddToCart(product, 1);
       }
     }}
     ```
   - Si `onOpenScaleModal` está cableado en `POSMultivendorView`, el catálogo ya dispara la señal de apertura de balanza de forma transparente.

4. **Estado de Pruebas Existentes en `src/tests/posManualWeightModal.test.tsx`**:
   - Ejecución de línea base: `npx vitest run src/tests/posManualWeightModal.test.tsx` (Duración 11.93s, 6/6 tests pasaron).
   - Solo cubría 6 casos elementales de UI sin validar la tecla `Limpiar (C)`, la precisión de 3 decimales, el atajo `Escape`, ni la integración end-to-end con `POSMultivendorView`.

---

## 2. Logic Chain (Cadena Lógica de Razonamiento)

1. **Premisa 1**: El Hito M3 exige que al hacer clic o escanear productos a granel (`unidad_medida === 'KG'`), `POSMultivendorView` despliegue inmediatamente `ManualWeightModal` con teclado táctil numérico y chips de peso rápido (0.25 - 5 kg) para registrar la cantidad en kg en el carrito.
2. **Premisa 2**: Para garantizar la robustez industrial y la "Regla del Niño de 12 Años" (cero fricción en cajeros de mostrador), el modal debe admitir:
   - Ingreso fino vía teclado en pantalla (0-9, punto decimal único, backspace y limpiar 'C').
   - Altura mínima táctil para botones principales (>= 56px) y chips (>= 48px).
   - Prevención estricta de peso <= 0 y control de precisión a 3 decimales (gramos).
3. **Premisa 3**: Siguiendo el ciclo TDD estricto (RED $\rightarrow$ GREEN $\rightarrow$ REFACTOR), la suite de pruebas unitarias e integrales debe formularse primero como especificación ejecutable antes de implementar las modificaciones de código.
4. **Premisa 4**: La integración en `POSMultivendorView` debe ser autónoma: `POSMultivendorView` debe manejar internamente el estado `scaleModalProduct` cuando no se suministre un handler externo, garantizando que tanto el clic en catálogo como el escaneo por código de barras de un ítem KG abran `ManualWeightModal` y al confirmar llamen a `onAddToCart(producto, pesoKg)`.
5. **Conclusión Lógica**: La suite `src/tests/posManualWeightModal.test.tsx` debe organizarse en 8 bloques funcionales independientes y exhaustivos usando `@testing-library/react` con `fireEvent` y `@testing-library/jest-dom` (sin `user-event`).

---

## 3. Caveats (Advertencias y Supuestos)

1. **Exclusión deliberada de `user-event`**: Siguiendo las directrices del proyecto y el prompt de despacho, se utiliza exclusivamente `fireEvent` de `@testing-library/react`. `user-event` genera retardos de micro-timers incompatibles con la ejecución rápida requerida en Vitest.
2. **Soporte de tecla 'C' (Limpiar)**: Actualmente `ManualWeightModal.tsx` carece de `data-testid="keypad-btn-clear"`. El bloque 2 incluye este test para exigir al implementador la adición de dicho botón (TDD en fase RED).
3. **Integración en `POSMultivendorView`**: El bloque 8 evalúa la interacción directa con `POSMultivendorView`. Este bloque fallará inicialmente (fase RED) hasta que el agente implementador aplique el hook de estado interno `scaleModalProduct` y el listener en `handleBarcodeSubmit`.
4. **No se modificaron archivos en `src/`**: En estricto cumplimiento del rol Read-Only Explorer, no se alteró ningún archivo bajo `src/`. El código propuesto de la suite fue generado en `.agents/teamwork/m3_explorer_tdd/posManualWeightModal.test.tsx` y documentado en este handoff.

---

## 4. Conclusion & Actionable Blueprint (Diseño de la Suite TDD)

Se diseñó la suite completa estructurada en 8 bloques funcionales con 24 casos de prueba exhaustivos.

### Estructura de los 8 Bloques Funcionales:
- **Bloque 1: Renderizado y Visibilidad del Modal**:
  - `1.1` Retorno nulo si `isOpen={false}`.
  - `1.2` Retorno nulo si `producto={null}`.
  - `1.3` Renderizado íntegro con nombre, precio/kg, visor táctil con `inputmode="none"`, botón gigante de 56px y botón cerrar (X).
- **Bloque 2: Teclado Numérico Táctil en Pantalla**:
  - `2.1` Digitación de dígitos consecutivos 0-9.
  - `2.2` Punto decimal único y prevención de duplicados (`0.75` en vez de `0.7.5`).
  - `2.3` Tecla retroceso (backspace) removiendo caracteres uno a uno.
  - `2.4` Tecla Limpiar (C) restableciendo el visor y subtotal a $0 COP.
- **Bloque 3: Chips de Peso Rápido a 1 Toque (0.25 - 5.0 kg)**:
  - `3.1` Renderizado y asignación instantánea de 0.25 kg, 0.5 kg, 1 kg, 2 kg, 5 kg.
  - `3.2` Altura táctil ergonómica >= 48px (`min-h-[48px]`).
  - `3.3` Resaltado visual activo (`bg-cyan-600 text-white`) en el chip seleccionado.
- **Bloque 4: Cálculo en Tiempo Real del Subtotal Proyectado**:
  - `4.1` Recálculo reactivo exacto en COP con separadores de miles para múltiplos y fracciones.
  - `4.2` Sincronización del subtotal en el botón gigante `AGREGAR AL CARRITO ($XX.XXX)`.
  - `4.3` Fallback automático de precio unitario desde el producto si `precioUnitario` no es provisto.
- **Bloque 5: Confirmación de Pesaje**:
  - `5.1` Invocación de `onConfirm(producto, peso)` y `onConfirmWeight(peso)` con cierre del modal.
  - `5.2` Confirmación rápida vía tecla física `Enter`.
- **Bloque 6: Cancelación de Pesaje**:
  - `6.1` Cierre sin agregar ítem al pulsar el botón cerrar (X).
  - `6.2` Cierre sin agregar ítem al pulsar la tecla física `Escape`.
- **Bloque 7: Validaciones de Frontera**:
  - `7.1` Bloqueo de confirmación ante peso 0 o vacío con mensaje de error visible.
  - `7.2` Límite estricto a 3 decimales (resolución balanza en gramos).
  - `7.3` Sustitución inteligente de cero inicial (`0` seguido de `5` resulta en `5`).
- **Bloque 8: Integración Completa con `POSMultivendorView`**:
  - `8.1` Clic en producto con `unidadMedida === 'und'` agrega directamente sin abrir modal.
  - `8.2` Clic en producto con `unidadMedida === 'kg'` abre automáticamente `ManualWeightModal`.
  - `8.3` Confirmar peso en el modal agrega el ítem al carrito con la cantidad en kg y cierra el modal.
  - `8.4` Cancelar el modal no agrega ningún ítem al carrito y lo cierra.
  - `8.5` Escaneo de código de barras de ítem KG en `pos-light-barcode-input` abre inmediatamente `ManualWeightModal`.

---

### Código Completo Propuesto para la Suite TDD:
Ruta destino recomendada: `src/tests/posManualWeightModal.test.tsx`

```tsx
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ManualWeightModal } from '../views/pos/components/ManualWeightModal';
import { POSMultivendorView } from '../views/pos/components/POSMultivendorView';
import type { Product } from '../types/erp.types';
import type { MultivendorCartItem } from '../views/pos/components/POSMultivendorCart';
import type { VendorOption } from '../views/pos/components/POSMultivendorLightHeader';

/**
 * Suite TDD Integral para Hito M3 (SPEC-057 Tarea 3)
 * Trigger Táctil de Pesaje Manual ManualWeightModal para Ítems a Granel / KG Balanza
 * Cumple con la Regla del Niño de 12 Años, Ergonomía Táctil (>=48px/56px) y Bucle DevTools.
 */
describe('Hito M3: Trigger Táctil de Pesaje Manual ManualWeightModal (SPEC-057 Tarea 3)', () => {
  const mockProductKG: Product = {
    id: 'prod-pes-01',
    sku: 'ROB-ENT-01',
    nombre: 'Róbalo Entero Fresco',
    categoria: 'PESCADOS',
    unidadMedida: 'kg',
    precio_venta_pos: 35000,
    precio_compra: 22000,
    buffer_seguridad: 5,
    codigo_barras: '7701234567890',
    activo: true,
  } as Product;

  const mockProductUND: Product = {
    id: 'prod-und-01',
    sku: 'BEB-COL-01',
    nombre: 'Gaseosa Colombiana 400ml',
    categoria: 'BEBIDAS',
    unidadMedida: 'und',
    precio_venta_pos: 4000,
    precio_compra: 2500,
    buffer_seguridad: 10,
    codigo_barras: '7709876543210',
    activo: true,
  } as Product;

  const mockVendors: VendorOption[] = [
    { id: 'v1', nombre: 'Carlos Mostrador', corto: 'Carlos' },
  ];

  const mockOnConfirm = vi.fn();
  const mockOnConfirmWeight = vi.fn();
  const mockOnClose = vi.fn();
  const mockOnAddToCart = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // BLOQUE 1: Renderizado del modal cuando isOpen={true}
  // =========================================================================
  describe('Bloque 1: Renderizado y Visibilidad del Modal', () => {
    it('1.1 No debe renderizar nada en el DOM si isOpen={false}', () => {
      render(
        <ManualWeightModal
          isOpen={false}
          producto={mockProductKG}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('1.2 No debe renderizar nada si producto es null aunque isOpen={true}', () => {
      render(
        <ManualWeightModal
          isOpen={true}
          producto={null as any}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('1.3 Debe renderizar el modal completo con título, nombre de producto, precio x kg e input con valor inicial', () => {
      render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProductKG}
          precioUnitario={35000}
          pesoInicial={1.0}
          onConfirm={mockOnConfirm}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Róbalo Entero Fresco')).toBeInTheDocument();
      expect(screen.getByText(/Precio x kg:/i)).toBeInTheDocument();
      expect(screen.getAllByText(/\$35\.000/i).length).toBeGreaterThanOrEqual(1);

      const inputPeso = screen.getByTestId('manual-weight-input') as HTMLInputElement;
      expect(inputPeso).toBeInTheDocument();
      expect(inputPeso.value).toBe('1');
      expect(inputPeso.getAttribute('inputmode')).toBe('none');

      // Botón gigante de confirmación con altura táctil industrial >= 56px
      const btnConfirmar = screen.getByTestId('manual-weight-confirm-btn');
      expect(btnConfirmar).toBeInTheDocument();
      expect(btnConfirmar.className).toContain('min-h-[56px]');

      // Botón de cierre X
      expect(screen.getByTitle('Cerrar')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // BLOQUE 2: Interacción con el teclado numérico táctil en pantalla
  // =========================================================================
  describe('Bloque 2: Teclado Numérico Táctil en Pantalla', () => {
    it('2.1 Debe permitir ingresar dígitos consecutivos (0-9) en el visor táctil', () => {
      render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProductKG}
          precioUnitario={35000}
          pesoInicial={0}
          onConfirm={mockOnConfirm}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByTestId('keypad-btn-2'));
      fireEvent.click(screen.getByTestId('keypad-btn-5'));

      const inputPeso = screen.getByTestId('manual-weight-input') as HTMLInputElement;
      expect(inputPeso.value).toBe('25');
    });

    it('2.2 Debe permitir ingresar punto decimal y evitar duplicados', () => {
      render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProductKG}
          precioUnitario={35000}
          pesoInicial={0}
          onConfirm={mockOnConfirm}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByTestId('keypad-btn-dot'));
      const inputPeso = screen.getByTestId('manual-weight-input') as HTMLInputElement;
      expect(inputPeso.value).toBe('0.');

      fireEvent.click(screen.getByTestId('keypad-btn-7'));
      fireEvent.click(screen.getByTestId('keypad-btn-5'));
      expect(inputPeso.value).toBe('0.75');

      // Segundo punto no debe concatenarse
      fireEvent.click(screen.getByTestId('keypad-btn-dot'));
      expect(inputPeso.value).toBe('0.75');
    });

    it('2.3 Debe borrar el último carácter con la tecla backspace', () => {
      render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProductKG}
          precioUnitario={35000}
          pesoInicial={0}
          onConfirm={mockOnConfirm}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByTestId('keypad-btn-1'));
      fireEvent.click(screen.getByTestId('keypad-btn-dot'));
      fireEvent.click(screen.getByTestId('keypad-btn-5'));

      const inputPeso = screen.getByTestId('manual-weight-input') as HTMLInputElement;
      expect(inputPeso.value).toBe('1.5');

      fireEvent.click(screen.getByTestId('keypad-btn-backspace'));
      expect(inputPeso.value).toBe('1.');

      fireEvent.click(screen.getByTestId('keypad-btn-backspace'));
      expect(inputPeso.value).toBe('1');
    });

    it('2.4 Debe limpiar completamente el visor táctil con el botón C / Limpiar', () => {
      render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProductKG}
          precioUnitario={35000}
          pesoInicial={0}
          onConfirm={mockOnConfirm}
          onClose={mockOnClose}
        />
      );

      // Ingresar un número
      fireEvent.click(screen.getByTestId('keypad-btn-3'));
      fireEvent.click(screen.getByTestId('keypad-btn-dot'));
      fireEvent.click(screen.getByTestId('keypad-btn-8'));

      const inputPeso = screen.getByTestId('manual-weight-input') as HTMLInputElement;
      expect(inputPeso.value).toBe('3.8');

      // Botón Limpiar (C)
      const btnClear = screen.getByTestId('keypad-btn-clear');
      expect(btnClear).toBeInTheDocument();
      fireEvent.click(btnClear);

      expect(inputPeso.value).toBe('');
      expect(screen.getByTestId('manual-weight-subtotal')).toHaveTextContent(/0\s*COP/i);
    });
  });

  // =========================================================================
  // BLOQUE 3: Botones / Chips de peso rápido
  // =========================================================================
  describe('Bloque 3: Chips de Peso Rápido a 1 Toque (0.25 - 5.0 kg)', () => {
    it('3.1 Debe renderizar todos los chips de peso estándar y asignar el valor al hacer clic', () => {
      render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProductKG}
          precioUnitario={35000}
          pesoInicial={1.0}
          onConfirm={mockOnConfirm}
          onClose={mockOnClose}
        />
      );

      const chipsEsperados = ['0.25 kg', '0.5 kg', '1 kg', '2 kg', '5 kg'];
      chipsEsperados.forEach((chipText) => {
        expect(screen.getByRole('button', { name: new RegExp(chipText, 'i') })).toBeInTheDocument();
      });

      const inputPeso = screen.getByTestId('manual-weight-input') as HTMLInputElement;

      // Clic en chip 0.5 kg
      fireEvent.click(screen.getByRole('button', { name: /0.5 kg/i }));
      expect(inputPeso.value).toBe('0.5');

      // Clic en chip 2 kg
      fireEvent.click(screen.getByRole('button', { name: /2 kg/i }));
      expect(inputPeso.value).toBe('2');

      // Clic en chip 5 kg
      fireEvent.click(screen.getByRole('button', { name: /5 kg/i }));
      expect(inputPeso.value).toBe('5');
    });

    it('3.2 Los chips de peso rápido deben cumplir con altura ergonómica táctil >= 48px', () => {
      render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProductKG}
          precioUnitario={35000}
          pesoInicial={1.0}
          onConfirm={mockOnConfirm}
          onClose={mockOnClose}
        />
      );

      const chip1kg = screen.getByRole('button', { name: /1 kg/i });
      expect(chip1kg.className).toContain('min-h-[48px]');
    });

    it('3.3 Debe destacar visualmente el chip activo que coincide con el peso numérico', () => {
      render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProductKG}
          precioUnitario={35000}
          pesoInicial={1.0}
          onConfirm={mockOnConfirm}
          onClose={mockOnClose}
        />
      );

      const chip1kg = screen.getByRole('button', { name: /1 kg/i });
      expect(chip1kg.className).toContain('bg-cyan-600');
      expect(chip1kg.className).toContain('text-white');

      // Cambiar a 2 kg
      const chip2kg = screen.getByRole('button', { name: /2 kg/i });
      fireEvent.click(chip2kg);

      expect(chip2kg.className).toContain('bg-cyan-600');
      expect(chip2kg.className).toContain('text-white');
    });
  });

  // =========================================================================
  // BLOQUE 4: Cálculo en tiempo real del subtotal proyectado
  // =========================================================================
  describe('Bloque 4: Cálculo en Tiempo Real del Subtotal Proyectado', () => {
    it('4.1 Debe recalcular reactivamente el subtotal proyectado en COP para diferentes pesos', () => {
      render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProductKG}
          precioUnitario={35000}
          pesoInicial={1.0}
          onConfirm={mockOnConfirm}
          onClose={mockOnClose}
        />
      );

      // 1.0 kg * 35000 = $35.000 COP
      expect(screen.getByTestId('manual-weight-subtotal')).toHaveTextContent(/35\.000/);

      // Chip 0.5 kg -> 0.5 * 35000 = $17.500 COP
      fireEvent.click(screen.getByRole('button', { name: /0.5 kg/i }));
      expect(screen.getByTestId('manual-weight-subtotal')).toHaveTextContent(/17\.500/);

      // Chip 2 kg -> 2.0 * 35000 = $70.000 COP
      fireEvent.click(screen.getByRole('button', { name: /2 kg/i }));
      expect(screen.getByTestId('manual-weight-subtotal')).toHaveTextContent(/70\.000/);
    });

    it('4.2 Debe reflejar el subtotal en vivo en la etiqueta del botón de confirmación', () => {
      render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProductKG}
          precioUnitario={35000}
          pesoInicial={1.5}
          onConfirm={mockOnConfirm}
          onClose={mockOnClose}
        />
      );

      // 1.5 * 35000 = $52.500 COP
      const btnConfirmar = screen.getByTestId('manual-weight-confirm-btn');
      expect(btnConfirmar.textContent).toContain('52.500');
    });

    it('4.3 Debe resolver el precio unitario del producto por fallback si precioUnitario no es pasado', () => {
      const prodSinProp = {
        ...mockProductKG,
        precio_venta_pos: 28000,
      };

      render(
        <ManualWeightModal
          isOpen={true}
          producto={prodSinProp}
          pesoInicial={2.0}
          onConfirm={mockOnConfirm}
          onClose={mockOnClose}
        />
      );

      // 2 * 28000 = $56.000 COP
      expect(screen.getByTestId('manual-weight-subtotal')).toHaveTextContent(/56\.000/);
    });
  });

  // =========================================================================
  // BLOQUE 5: Confirmación del peso
  // =========================================================================
  describe('Bloque 5: Confirmación de Pesaje', () => {
    it('5.1 Botón de confirmación debe invocar onConfirm y onConfirmWeight con el peso exacto y cerrar', () => {
      render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProductKG}
          precioUnitario={35000}
          pesoInicial={2.5}
          onConfirm={mockOnConfirm}
          onConfirmWeight={mockOnConfirmWeight}
          onClose={mockOnClose}
        />
      );

      const btnConfirmar = screen.getByTestId('manual-weight-confirm-btn');
      fireEvent.click(btnConfirmar);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm).toHaveBeenCalledWith(mockProductKG, 2.5);
      expect(mockOnConfirmWeight).toHaveBeenCalledWith(2.5);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('5.2 Debe permitir confirmar mediante la tecla física Enter en el visor de peso', () => {
      render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProductKG}
          precioUnitario={35000}
          pesoInicial={1.75}
          onConfirm={mockOnConfirm}
          onClose={mockOnClose}
        />
      );

      const inputPeso = screen.getByTestId('manual-weight-input');
      fireEvent.keyDown(inputPeso, { key: 'Enter', code: 'Enter' });

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm).toHaveBeenCalledWith(mockProductKG, 1.75);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // BLOQUE 6: Cancelación
  // =========================================================================
  describe('Bloque 6: Cancelación de Pesaje', () => {
    it('6.1 Botón cerrar (X) debe invocar onClose sin invocar onConfirm', () => {
      render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProductKG}
          precioUnitario={35000}
          pesoInicial={1.0}
          onConfirm={mockOnConfirm}
          onClose={mockOnClose}
        />
      );

      const btnCerrar = screen.getByTitle('Cerrar');
      fireEvent.click(btnCerrar);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('6.2 Tecla física Escape debe invocar onClose sin invocar onConfirm', () => {
      render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProductKG}
          precioUnitario={35000}
          pesoInicial={1.0}
          onConfirm={mockOnConfirm}
          onClose={mockOnClose}
        />
      );

      const inputPeso = screen.getByTestId('manual-weight-input');
      fireEvent.keyDown(inputPeso, { key: 'Escape', code: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // BLOQUE 7: Validaciones de frontera
  // =========================================================================
  describe('Bloque 7: Validaciones de Frontera', () => {
    it('7.1 Debe rechazar confirmación con peso 0 o vacío con mensaje de advertencia y no llamar onConfirm', () => {
      render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProductKG}
          precioUnitario={35000}
          pesoInicial={0}
          onConfirm={mockOnConfirm}
          onClose={mockOnClose}
        />
      );

      const btnConfirmar = screen.getByTestId('manual-weight-confirm-btn');
      fireEvent.click(btnConfirmar);

      expect(mockOnConfirm).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
      expect(screen.getByText(/ingresa un peso mayor a 0/i)).toBeInTheDocument();
    });

    it('7.2 Debe limitar la precisión a un máximo de 3 decimales (gramos)', () => {
      render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProductKG}
          precioUnitario={35000}
          pesoInicial={0}
          onConfirm={mockOnConfirm}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByTestId('keypad-btn-1'));
      fireEvent.click(screen.getByTestId('keypad-btn-dot'));
      fireEvent.click(screen.getByTestId('keypad-btn-2'));
      fireEvent.click(screen.getByTestId('keypad-btn-3'));
      fireEvent.click(screen.getByTestId('keypad-btn-4'));

      const inputPeso = screen.getByTestId('manual-weight-input') as HTMLInputElement;
      expect(inputPeso.value).toBe('1.234');

      // Intentar ingresar un 4to decimal debe ser ignorado
      fireEvent.click(screen.getByTestId('keypad-btn-5'));
      expect(inputPeso.value).toBe('1.234');
    });

    it('7.3 Si el valor inicial es 0 y se presiona un dígito, debe reemplazar el 0 inicial', () => {
      render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProductKG}
          precioUnitario={35000}
          pesoInicial={0}
          onConfirm={mockOnConfirm}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByTestId('keypad-btn-5'));
      const inputPeso = screen.getByTestId('manual-weight-input') as HTMLInputElement;
      expect(inputPeso.value).toBe('5');
    });
  });

  // =========================================================================
  // BLOQUE 8: Integración con POSMultivendorView
  // =========================================================================
  describe('Bloque 8: Integración Completa con POSMultivendorView', () => {
    const products: Product[] = [mockProductKG, mockProductUND];
    const stockMap: Record<string, number> = {
      'prod-pes-01': 50,
      'ROB-ENT-01': 50,
      'prod-und-01': 100,
      'BEB-COL-01': 100,
    };
    const cartItems: MultivendorCartItem[] = [];

    const renderPOSView = (props: Partial<React.ComponentProps<typeof POSMultivendorView>> = {}) => {
      return render(
        <POSMultivendorView
          products={products}
          stockMap={stockMap}
          cartItems={cartItems}
          onAddToCart={mockOnAddToCart}
          onUpdateQuantity={vi.fn()}
          onRemoveItem={vi.fn()}
          onClearCart={vi.fn()}
          subtotal={0}
          total={0}
          onEmitirComanda={vi.fn()}
          selectedVendorId="v1"
          onSelectVendor={vi.fn()}
          vendedores={mockVendors}
          onOpenClientModal={vi.fn()}
          {...props}
        />
      );
    };

    it('8.1 Al hacer clic en un producto con unidad UND, debe agregarlo directamente al carrito sin abrir modal', () => {
      renderPOSView();

      const cardUND = screen.getByTestId(`product-card-${mockProductUND.sku}`);
      fireEvent.click(cardUND);

      expect(mockOnAddToCart).toHaveBeenCalledTimes(1);
      expect(mockOnAddToCart).toHaveBeenCalledWith(mockProductUND, 1);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('8.2 Al hacer clic en un producto con unidad KG, debe abrir automáticamente ManualWeightModal', () => {
      renderPOSView();

      const cardKG = screen.getByTestId(`product-card-${mockProductKG.sku}`);
      fireEvent.click(cardKG);

      // Debe abrirse el modal táctil de pesaje
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Róbalo Entero Fresco')).toBeInTheDocument();
      expect(screen.getByTestId('manual-weight-input')).toBeInTheDocument();
      // onAddToCart aún no debe haber sido llamado
      expect(mockOnAddToCart).not.toHaveBeenCalled();
    });

    it('8.3 Al confirmar el peso en ManualWeightModal desde POSMultivendorView, se agrega al carrito con la cantidad en kg y se cierra el modal', () => {
      renderPOSView();

      // Abrir modal haciendo clic en producto KG
      fireEvent.click(screen.getByTestId(`product-card-${mockProductKG.sku}`));

      // Seleccionar chip de 2 kg
      const chip2kg = screen.getByRole('button', { name: /2 kg/i });
      fireEvent.click(chip2kg);

      // Confirmar peso
      const btnConfirmar = screen.getByTestId('manual-weight-confirm-btn');
      fireEvent.click(btnConfirmar);

      // Verifica adición al carrito con 2 kg
      expect(mockOnAddToCart).toHaveBeenCalledTimes(1);
      expect(mockOnAddToCart).toHaveBeenCalledWith(mockProductKG, 2);

      // Modal debe cerrarse
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('8.4 Si se cancela el pesaje en ManualWeightModal (X), no se agrega al carrito y el modal se cierra', () => {
      renderPOSView();

      // Abrir modal haciendo clic en producto KG
      fireEvent.click(screen.getByTestId(`product-card-${mockProductKG.sku}`));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Cerrar modal
      fireEvent.click(screen.getByTitle('Cerrar'));

      expect(mockOnAddToCart).not.toHaveBeenCalled();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('8.5 Al escanear código de barras de un ítem KG, debe activar automáticamente ManualWeightModal', () => {
      renderPOSView();

      const barcodeInput = screen.getByTestId('pos-light-barcode-input');
      fireEvent.change(barcodeInput, { target: { value: '7701234567890' } });
      fireEvent.keyDown(barcodeInput, { key: 'Enter', code: 'Enter' });

      // Debe abrir ManualWeightModal para ítem pesable en vez de agregar directo
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Róbalo Entero Fresco')).toBeInTheDocument();

      // Confirmar con 1.5 kg
      fireEvent.click(screen.getByRole('button', { name: /1.5 kg/i }));
      fireEvent.click(screen.getByTestId('manual-weight-confirm-btn'));

      expect(mockOnAddToCart).toHaveBeenCalledTimes(1);
      expect(mockOnAddToCart).toHaveBeenCalledWith(mockProductKG, 1.5);
    });
  });
});
```

---

### Guía Quirúrgica para el Agente Implementador (`@implementer`):

Para pasar de RED a GREEN (100% tests pasando):

#### A. En `src/views/pos/components/ManualWeightModal.tsx`:
1. En `handleKeypadPress`, agregar soporte para `'clear'`:
   ```typescript
   if (key === 'clear' || key === 'c') {
     setPesoStr('');
     setErrorMsg('');
     return;
   }
   ```
2. Agregar el botón `Limpiar (C)` con `data-testid="keypad-btn-clear"`:
   Puede ubicarse como botón de acción rápida o al lado de los controles del teclado:
   ```tsx
   <button
     type="button"
     data-testid="keypad-btn-clear"
     onClick={() => handleKeypadPress('clear')}
     className="w-full min-h-[44px] bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer mt-2"
   >
     <span>Limpiar (C)</span>
   </button>
   ```

#### B. En `src/views/pos/components/POSMultivendorView.tsx`:
1. Importar `ManualWeightModal`:
   ```typescript
   import { ManualWeightModal } from './ManualWeightModal';
   ```
2. Agregar estado interno para el modal de balanza:
   ```typescript
   const [scaleModalProduct, setScaleModalProduct] = useState<Product | null>(null);

   const handleOpenScaleModal = (product: Product) => {
     if (onOpenScaleModal) {
       onOpenScaleModal(product);
     } else {
       setScaleModalProduct(product);
     }
   };
   ```
3. En `handleBarcodeSubmit`:
   ```typescript
   if (found) {
     const unit = (found.unidadMedida || (found as any).unidad || (found as any).unidad_medida || 'kg').toUpperCase();
     const isPesable = unit === 'KG' || unit === 'KILO' || unit === 'KILOS' || unit === 'GR' || unit === 'GRAMOS';
     if (isPesable) {
       handleOpenScaleModal(found);
     } else {
       onAddToCart(found, 1);
     }
     setBarcodeInput('');
   }
   ```
4. Pasar `onOpenScaleModal={handleOpenScaleModal}` a `<POSMultivendorCatalog />`.
5. Renderizar `ManualWeightModal` condicionalmente al pie del componente:
   ```tsx
   {scaleModalProduct && (
     <ManualWeightModal
       isOpen={Boolean(scaleModalProduct)}
       producto={scaleModalProduct}
       precioUnitario={scaleModalProduct.precio_venta_pos}
       pesoInicial={1.0}
       onClose={() => setScaleModalProduct(null)}
       onConfirm={(product, peso) => {
         onAddToCart(product, peso);
         setScaleModalProduct(null);
       }}
     />
   )}
   ```

---

## 5. Verification Method (Método de Verificación Independiente)

1. **Revisión del archivo propuesto**:
   - Inspeccionar: `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m3_explorer_tdd\posManualWeightModal.test.tsx`
2. **Aplicación por el implementador**:
   - Copiar la suite a `src/tests/posManualWeightModal.test.tsx`.
3. **Ejecución de Pruebas Unitarias e Integrales**:
   - Comando: `npx vitest run src/tests/posManualWeightModal.test.tsx`
   - Condiciones de éxito: 8 bloques funcionales, 24/24 tests en verde (100% pasando).
4. **Verificación de No-Regresión**:
   - Comprobar que las suites existentes sigan pasando al 100%:
     - `npx vitest run src/tests/posCartEditableRow.test.tsx`
     - `npx vitest run src/tests/posMultivendorLightSaaS.test.tsx`
5. **Verificación de Tipos TypeScript**:
   - Comando: `npx tsc --noEmit` (0 errores).
6. **Condición de Invalidación**:
   - Si algún test de `ManualWeightModal` o `POSMultivendorView` falla, verificar si los `data-testid` (`manual-weight-input`, `manual-weight-subtotal`, `manual-weight-confirm-btn`, `keypad-btn-clear`, `product-card-{sku}`) coinciden exactamente con la especificación.
