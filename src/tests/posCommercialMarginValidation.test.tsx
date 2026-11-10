import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { POSMultivendorCart, type MultivendorCartItem } from '../views/pos/components/POSMultivendorCart';
import { POSMultivendorView } from '../views/pos/components/POSMultivendorView';
import { useEmployeeStore, type Empleado } from '../store/useEmployeeStore';
import { useMultiVendorPosStore } from '../stores/useMultiVendorPosStore';
import type { Product } from '../types/erp.types';

describe('Hito M5: Validación Comercial de Margen, Descuentos y PIN de Supervisor (SPEC-057 Tarea 5)', () => {
  const mockSupervisor: Empleado = {
    id: 'emp-sup-01',
    nombre: 'Elena Supervisor',
    identificacion: '52987654',
    rolAcceso: 'ADMINISTRADOR',
    cargo: 'Supervisora de Operaciones',
    salarioBase: 3800000,
    fechaIngreso: '2024-01-15',
    tipoContrato: 'INDEFINIDO',
    estado: 'ACTIVO',
    prestamosActivos: 0,
    auxilioTransporte: 0,
    telefono: '3109876543',
    email: 'elena@pezcaderia.com',
    riesgoARL: 'I',
    aplicaExoneracion: true,
    pinAcceso: '9988',
  };

  const mockVendedor: Empleado = {
    id: 'emp-vend-01',
    nombre: 'Diego Díaz',
    identificacion: '1014123456',
    rolAcceso: 'VENDEDOR',
    cargo: 'Vendedor Mostrador',
    salarioBase: 1450000,
    fechaIngreso: '2025-01-01',
    tipoContrato: 'INDEFINIDO',
    estado: 'ACTIVO',
    prestamosActivos: 0,
    auxilioTransporte: 162000,
    telefono: '3121112233',
    email: 'diego@pezcaderia.com',
    riesgoARL: 'I',
    aplicaExoneracion: false,
    pinAcceso: '1234',
  };

  const mockProducts: Product[] = [
    {
      id: 'prod-salmon',
      sku: 'SALM-001',
      nombre: 'Salmón Premium Fresco',
      categoria: 'Pescados',
      unidadMedida: 'kg',
      precio_venta_pos: 40000,
      precio_compra: 25000, // Costo base = 25000; Margen 15% = 28750
      buffer_seguridad: 5,
      precio_venta_restaurante: 38000,
      precio_venta_mayorista: 36000,
      activo: true,
    },
    {
      id: 'prod-camaron',
      sku: 'CAM-001',
      nombre: 'Camarón Tigre Pelado 500g',
      categoria: 'Mariscos',
      unidadMedida: 'und',
      precio_venta_pos: 30000,
      precio_compra: 20000, // Costo base = 20000; Margen 15% = 23000
      buffer_seguridad: 8,
      precio_venta_restaurante: 28000,
      precio_venta_mayorista: 26000,
      activo: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useEmployeeStore.setState({ empleados: [mockSupervisor, mockVendedor] });
    useMultiVendorPosStore.setState({
      cartItems: [],
      descuentoGlobal: null,
      maxDescuentoVendedorPct: 10,
    });
  });

  // Harness interactivo para POSMultivendorCart con estado real de ítems
  const StatefulCartHarness: React.FC<{
    initialItems?: MultivendorCartItem[];
    onPriceUpdatedSpy?: (index: number, newPrice: number) => void;
    onDiscountUpdatedSpy?: (index: number, discountPct: number) => void;
  }> = ({ initialItems, onPriceUpdatedSpy, onDiscountUpdatedSpy }) => {
    const [items, setItems] = useState<MultivendorCartItem[]>(
      initialItems || [
        {
          product: mockProducts[0],
          cantidad: 2,
          precioOverride: 40000,
          descuentoPct: 0,
        },
      ]
    );
    const [descuentoGlobal, setDescuentoGlobal] = useState<{ tipo: 'porcentaje' | 'monto'; valor: number } | null>(null);

    const subtotal = items.reduce((acc, it) => {
      const p = typeof it.precioOverride === 'number' ? it.precioOverride : it.product.precio_venta_pos;
      const desc = it.descuentoPct || 0;
      return acc + Math.round(p * Number(it.cantidad) * (1 - desc / 100));
    }, 0);

    const descGlobalMonto = descuentoGlobal
      ? descuentoGlobal.tipo === 'porcentaje'
        ? Math.round(subtotal * (descuentoGlobal.valor / 100))
        : Math.min(subtotal, descuentoGlobal.valor)
      : 0;

    const total = Math.max(0, subtotal - descGlobalMonto);

    const handleUpdatePrice = (index: number, newPrice: number) => {
      setItems((prev) =>
        prev.map((it, i) => (i === index ? { ...it, precioOverride: newPrice } : it))
      );
      onPriceUpdatedSpy?.(index, newPrice);
    };

    const handleUpdateDiscount = (index: number, discountPct: number) => {
      setItems((prev) =>
        prev.map((it, i) => (i === index ? { ...it, descuentoPct: discountPct } : it))
      );
      onDiscountUpdatedSpy?.(index, discountPct);
    };

    return (
      <POSMultivendorCart
        items={items}
        onUpdateQuantity={vi.fn()}
        onSetQuantity={vi.fn()}
        onUpdatePrice={handleUpdatePrice}
        onUpdateDiscount={handleUpdateDiscount}
        onRemoveItem={vi.fn()}
        onClearCart={vi.fn()}
        subtotal={subtotal}
        total={total}
        onEmitirComanda={vi.fn()}
        onCobrarCaja={vi.fn()}
        activeVendorName="Diego Díaz"
        onApplyGlobalDiscount={(tipo, valor) => setDescuentoGlobal({ tipo, valor })}
        onRemoveGlobalDiscount={() => setDescuentoGlobal(null)}
        currentDiscountTipo={descuentoGlobal?.tipo}
        currentDiscountValor={descuentoGlobal?.valor}
      />
    );
  };

  // =========================================================================
  // BLOQUE 1: Validación de Margen Comercial en Edición de Precio Unitario
  // =========================================================================
  describe('Bloque 1: Validación Comercial de Margen Mínimo (Costo Base + 15%)', () => {
    it('1.1 Precio propuesto >= Costo Base + 15% se aplica directamente sin modal de supervisor', () => {
      const onPriceUpdatedSpy = vi.fn();
      render(<StatefulCartHarness onPriceUpdatedSpy={onPriceUpdatedSpy} />);

      const priceInput = screen.getByTestId('cart-unit-price-input-0') as HTMLInputElement;
      expect(priceInput.value).toBe('40000');

      // Salmón Costo: 25000. Mínimo permitido sin PIN: 25000 * 1.15 = 28750.
      // Proponer 32000 (Margen 28% > 15%)
      fireEvent.change(priceInput, { target: { value: '32000' } });
      fireEvent.blur(priceInput);

      // Verificación: NO debe desplegar SupervisorPinModal
      expect(screen.queryByTestId('modal-supervisor-pin')).not.toBeInTheDocument();
      expect(onPriceUpdatedSpy).toHaveBeenCalledWith(0, 32000);
      expect(priceInput.value).toBe('32000');
    });

    it('1.2 Precio propuesto < Costo Base + 15% bloquea y despliega SupervisorPinModal', () => {
      render(<StatefulCartHarness />);

      const priceInput = screen.getByTestId('cart-unit-price-input-0') as HTMLInputElement;

      // Salmón Costo: 25000. Mínimo permitido: 28750.
      // Proponer 24000 (menor que el costo, margen negativo)
      fireEvent.change(priceInput, { target: { value: '24000' } });
      fireEvent.blur(priceInput);

      // Verificación: DEBE desplegar SupervisorPinModal
      expect(screen.getByTestId('modal-supervisor-pin')).toBeInTheDocument();
      expect(screen.getByText(/margen/i)).toBeInTheDocument();
    });

    it('1.3 Al ingresar PIN de supervisor correcto (9988), se autoriza y aplica el nuevo precio con margen bajo', async () => {
      const onPriceUpdatedSpy = vi.fn();
      render(<StatefulCartHarness onPriceUpdatedSpy={onPriceUpdatedSpy} />);

      const priceInput = screen.getByTestId('cart-unit-price-input-0') as HTMLInputElement;
      fireEvent.change(priceInput, { target: { value: '26000' } }); // Margen 4% < 15%
      fireEvent.blur(priceInput);

      expect(screen.getByTestId('modal-supervisor-pin')).toBeInTheDocument();

      // Ingresar PIN 9988 mediante el teclado táctil del modal
      fireEvent.click(screen.getByTestId('numpad-key-9'));
      fireEvent.click(screen.getByTestId('numpad-key-9'));
      fireEvent.click(screen.getByTestId('numpad-key-8'));
      fireEvent.click(screen.getByTestId('numpad-key-8'));

      // Modal debe cerrarse tras autorizar
      await waitFor(() => {
        expect(screen.queryByTestId('modal-supervisor-pin')).not.toBeInTheDocument();
      });

      // El precio debe haberse actualizado al valor autorizado
      expect(onPriceUpdatedSpy).toHaveBeenCalledWith(0, 26000);
      expect(priceInput.value).toBe('26000');
    });

    it('1.4 Si se cancela el modal de supervisor, se revierte el precio al valor anterior (Rollback)', () => {
      const onPriceUpdatedSpy = vi.fn();
      render(<StatefulCartHarness onPriceUpdatedSpy={onPriceUpdatedSpy} />);

      const priceInput = screen.getByTestId('cart-unit-price-input-0') as HTMLInputElement;
      expect(priceInput.value).toBe('40000');

      fireEvent.change(priceInput, { target: { value: '22000' } }); // Infracción de margen
      fireEvent.blur(priceInput);

      expect(screen.getByTestId('modal-supervisor-pin')).toBeInTheDocument();

      // Cancelar modal con el botón de cierre
      const btnClose = screen.getByTestId('modal-close-btn') || screen.getByLabelText(/cerrar/i);
      fireEvent.click(btnClose);

      // Modal cerrado y precio revertido
      expect(screen.queryByTestId('modal-supervisor-pin')).not.toBeInTheDocument();
      expect(priceInput.value).toBe('40000');
      // No debe haberse confirmado la actualización a 22000
      expect(onPriceUpdatedSpy).not.toHaveBeenCalledWith(0, 22000);
    });
  });

  // =========================================================================
  // BLOQUE 2: Validación de Umbral de Descuento por Ítem (> 10%)
  // =========================================================================
  describe('Bloque 2: Validación de Umbral de Descuento por Línea (> 10%)', () => {
    it('2.1 Descuento por ítem <= 10% se aplica directamente sin exigir supervisor', () => {
      const onDiscountUpdatedSpy = vi.fn();
      render(<StatefulCartHarness onDiscountUpdatedSpy={onDiscountUpdatedSpy} />);

      const btnDesc = screen.getByTestId('btn-cart-desc-0');
      fireEvent.click(btnDesc);

      // Si se abre el popover de descuento de línea o selector
      const descInput = screen.queryByTestId('cart-item-discount-input-0');
      if (descInput) {
        fireEvent.change(descInput, { target: { value: '8' } });
        fireEvent.blur(descInput);
      }

      // Verificación: no abre supervisor pin modal para 8%
      expect(screen.queryByTestId('modal-supervisor-pin')).not.toBeInTheDocument();
    });

    it('2.2 Descuento por ítem > 10% (ej. 25%) dispara SupervisorPinModal', () => {
      render(<StatefulCartHarness />);

      const btnDesc = screen.getByTestId('btn-cart-desc-0');
      fireEvent.click(btnDesc);

      const descInput = screen.queryByTestId('cart-item-discount-input-0');
      if (descInput) {
        fireEvent.change(descInput, { target: { value: '25' } });
        fireEvent.blur(descInput);
      }

      // Debe exigir PIN
      expect(screen.getByTestId('modal-supervisor-pin')).toBeInTheDocument();
      expect(within(screen.getByTestId('modal-supervisor-pin')).getByText(/descuento/i)).toBeInTheDocument();
    });

    it('2.3 Al autorizar con PIN supervisor, se aplica el descuento del 25% en la línea', async () => {
      const onDiscountUpdatedSpy = vi.fn();
      render(<StatefulCartHarness onDiscountUpdatedSpy={onDiscountUpdatedSpy} />);

      const btnDesc = screen.getByTestId('btn-cart-desc-0');
      fireEvent.click(btnDesc);

      const descInput = screen.queryByTestId('cart-item-discount-input-0');
      if (descInput) {
        fireEvent.change(descInput, { target: { value: '25' } });
        fireEvent.blur(descInput);
      }

      expect(screen.getByTestId('modal-supervisor-pin')).toBeInTheDocument();

      // PIN 9988
      fireEvent.click(screen.getByTestId('numpad-key-9'));
      fireEvent.click(screen.getByTestId('numpad-key-9'));
      fireEvent.click(screen.getByTestId('numpad-key-8'));
      fireEvent.click(screen.getByTestId('numpad-key-8'));

      await waitFor(() => {
        expect(screen.queryByTestId('modal-supervisor-pin')).not.toBeInTheDocument();
      });

      expect(onDiscountUpdatedSpy).toHaveBeenCalledWith(0, 25);
    });

    it('2.4 Cancelación de PIN revierte el descuento al valor previo sin mutar subtotal', () => {
      const onDiscountUpdatedSpy = vi.fn();
      render(<StatefulCartHarness onDiscountUpdatedSpy={onDiscountUpdatedSpy} />);

      const btnDesc = screen.getByTestId('btn-cart-desc-0');
      fireEvent.click(btnDesc);

      const descInput = screen.queryByTestId('cart-item-discount-input-0');
      if (descInput) {
        fireEvent.change(descInput, { target: { value: '30' } });
        fireEvent.blur(descInput);
      }

      expect(screen.getByTestId('modal-supervisor-pin')).toBeInTheDocument();

      // Cancelar
      const btnClose = screen.getByTestId('modal-close-btn') || screen.getByLabelText(/cerrar/i);
      fireEvent.click(btnClose);

      expect(screen.queryByTestId('modal-supervisor-pin')).not.toBeInTheDocument();
      expect(onDiscountUpdatedSpy).not.toHaveBeenCalledWith(0, 30);
    });
  });

  // =========================================================================
  // BLOQUE 3: Validación de Descuento Global de Comanda (> 10%)
  // =========================================================================
  describe('Bloque 3: Validación de Descuento Global de Comanda (> 10%)', () => {
    it('3.1 Descuento global <= 10% (ej. 5%) se aplica instantáneamente sin PIN', () => {
      render(<StatefulCartHarness />);

      // Abrir popover de descuento global
      const btnGlobalDesc = screen.getByTestId('btn-descuento-global-f4');
      fireEvent.click(btnGlobalDesc);

      const inputVal = screen.getByTestId('input-descuento-global-valor');
      fireEvent.change(inputVal, { target: { value: '5' } });

      const btnApply = screen.getByTestId('btn-aplicar-descuento-global');
      fireEvent.click(btnApply);

      // Verificación: se aplica sin modal de supervisor
      expect(screen.queryByTestId('modal-supervisor-pin')).not.toBeInTheDocument();
      expect(screen.getByTestId('pos-cart-total-amount')).toBeInTheDocument();
    });

    it('3.2 Descuento global > 10% (ej. 15%) solicita autorización por PIN de supervisor', () => {
      render(<StatefulCartHarness />);

      const btnGlobalDesc = screen.getByTestId('btn-descuento-global-f4');
      fireEvent.click(btnGlobalDesc);

      const inputVal = screen.getByTestId('input-descuento-global-valor');
      fireEvent.change(inputVal, { target: { value: '15' } });

      const btnApply = screen.getByTestId('btn-aplicar-descuento-global');
      fireEvent.click(btnApply);

      // Verificación: despliega SupervisorPinModal
      expect(screen.getByTestId('modal-supervisor-pin')).toBeInTheDocument();
      expect(within(screen.getByTestId('modal-supervisor-pin')).getByText(/descuento/i)).toBeInTheDocument();
    });

    it('3.3 Si el supervisor autoriza con PIN 9988, se aplica el descuento global del 15%', async () => {
      render(<StatefulCartHarness />);

      const btnGlobalDesc = screen.getByTestId('btn-descuento-global-f4');
      fireEvent.click(btnGlobalDesc);

      const inputVal = screen.getByTestId('input-descuento-global-valor');
      fireEvent.change(inputVal, { target: { value: '15' } });

      const btnApply = screen.getByTestId('btn-aplicar-descuento-global');
      fireEvent.click(btnApply);

      expect(screen.getByTestId('modal-supervisor-pin')).toBeInTheDocument();

      // Digitar PIN supervisor 9988
      fireEvent.click(screen.getByTestId('numpad-key-9'));
      fireEvent.click(screen.getByTestId('numpad-key-9'));
      fireEvent.click(screen.getByTestId('numpad-key-8'));
      fireEvent.click(screen.getByTestId('numpad-key-8'));

      await waitFor(() => {
        expect(screen.queryByTestId('modal-supervisor-pin')).not.toBeInTheDocument();
      });

      // El total ahora debe reflejar el 15% de descuento sobre 80.000 = 68.000
      expect(screen.getByTestId('pos-cart-total-amount')).toHaveTextContent(/68\.000/);
    });

    it('3.4 Si el supervisor cancela el modal, no se aplica el descuento global de 15%', () => {
      render(<StatefulCartHarness />);

      const btnGlobalDesc = screen.getByTestId('btn-descuento-global-f4');
      fireEvent.click(btnGlobalDesc);

      const inputVal = screen.getByTestId('input-descuento-global-valor');
      fireEvent.change(inputVal, { target: { value: '15' } });

      const btnApply = screen.getByTestId('btn-aplicar-descuento-global');
      fireEvent.click(btnApply);

      expect(screen.getByTestId('modal-supervisor-pin')).toBeInTheDocument();

      // Cerrar modal
      const btnClose = screen.getByTestId('modal-close-btn') || screen.getByLabelText(/cerrar/i);
      fireEvent.click(btnClose);

      expect(screen.queryByTestId('modal-supervisor-pin')).not.toBeInTheDocument();
      // Total permanece en 80.000 (sin descuento)
      expect(screen.getByTestId('pos-cart-total-amount')).toHaveTextContent(/80\.000/);
    });
  });

  // =========================================================================
  // BLOQUE 4: Resguardo de Concurrencia y Comportamiento de Teclado
  // =========================================================================
  describe('Bloque 4: Resguardo de Concurrencia y Teclado', () => {
    it('4.1 Con SupervisorPinModal abierto, presionar Escape cierra el modal y ejecuta rollback', () => {
      render(<StatefulCartHarness />);

      const priceInput = screen.getByTestId('cart-unit-price-input-0') as HTMLInputElement;
      fireEvent.change(priceInput, { target: { value: '20000' } }); // < margen 15%
      fireEvent.blur(priceInput);

      expect(screen.getByTestId('modal-supervisor-pin')).toBeInTheDocument();

      // Presionar Escape
      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

      // Modal debe cerrarse y precio revertir a 40000
      expect(screen.queryByTestId('modal-supervisor-pin')).not.toBeInTheDocument();
      expect(priceInput.value).toBe('40000');
    });

    it('4.2 Con SupervisorPinModal abierto, atajos F2 y F9 no emiten comanda ni cobran', () => {
      const onEmitirComandaSpy = vi.fn();
      const onCobrarCajaSpy = vi.fn();

      render(
        <POSMultivendorView
          products={mockProducts}
          stockMap={{ 'prod-salmon': 50 }}
          cartItems={[
            {
              product: mockProducts[0],
              cantidad: 1,
              precioOverride: 40000,
            },
          ]}
          onAddToCart={vi.fn()}
          onUpdateQuantity={vi.fn()}
          onRemoveItem={vi.fn()}
          onClearCart={vi.fn()}
          subtotal={40000}
          total={40000}
          onEmitirComanda={onEmitirComandaSpy}
          onCobrarCaja={onCobrarCajaSpy}
          selectedVendorId="emp-vend-01"
          onSelectVendor={vi.fn()}
          vendedores={[{ id: 'emp-vend-01', nombre: 'Diego Díaz', corto: 'Diego D.' }]}
          onOpenClientModal={vi.fn()}
        />
      );

      const priceInput = screen.getByTestId('cart-unit-price-input-0') as HTMLInputElement;
      fireEvent.change(priceInput, { target: { value: '20000' } });
      fireEvent.blur(priceInput);

      expect(screen.getByTestId('modal-supervisor-pin')).toBeInTheDocument();

      // Pulsar F2 y F9
      fireEvent.keyDown(window, { key: 'F2', code: 'F2' });
      fireEvent.keyDown(window, { key: 'F9', code: 'F9' });

      expect(onEmitirComandaSpy).not.toHaveBeenCalled();
      expect(onCobrarCajaSpy).not.toHaveBeenCalled();
    });
  });
});
