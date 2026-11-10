import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ManualWeightModal } from '../../../src/views/pos/components/ManualWeightModal';
import { POSMultivendorView } from '../../../src/views/pos/components/POSMultivendorView';
import type { Product } from '../../../src/types/erp.types';
import type { MultivendorCartItem } from '../../../src/views/pos/components/POSMultivendorCart';
import type { VendorOption } from '../../../src/views/pos/components/POSMultivendorLightHeader';

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
