import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { POSMultivendorCart } from '../views/pos/components/POSMultivendorCart';
import type { Product } from '../types/erp.types';
import type { MultivendorCartItem } from '../views/pos/components/POSMultivendorCart';

describe('Adversarial Stress Test Suite: POSMultivendorCart (SPEC-057 M1)', () => {
  const dummyProducts: Product[] = [
    {
      id: 'prod-salmon',
      sku: 'SAL-001',
      nombre: 'Salmón Premium Fresco en Postas',
      categoria: 'Pescados',
      unidadMedida: 'kg',
      precio_venta_pos: 45000,
      precio_compra: 30000,
      buffer_seguridad: 5,
      precio_venta_restaurante: 44000,
      precio_venta_mayorista: 42000,
      activo: true,
    },
    {
      id: 'prod-camaron',
      sku: 'CAM-002',
      nombre: 'Camarón Tigre Gigante U15',
      categoria: 'Mariscos',
      unidadMedida: 'kg',
      precio_venta_pos: 62000,
      precio_compra: 45000,
      buffer_seguridad: 2,
      precio_venta_restaurante: 60000,
      precio_venta_mayorista: 58000,
      activo: true,
    },
    {
      id: 'prod-salsa',
      sku: 'SAL-003',
      nombre: 'Salsa Marinera Artesanal 250g',
      categoria: 'Abarrotes',
      unidadMedida: 'und',
      precio_venta_pos: 12500,
      precio_compra: 8000,
      buffer_seguridad: 10,
      precio_venta_restaurante: 12000,
      precio_venta_mayorista: 11000,
      activo: true,
    },
  ];

  // =========================================================================
  // Challenge 1: Balanza Decimals (kg) & Precision
  // =========================================================================
  describe('Challenge 1: Balanza Decimals (kg) & Precision', () => {
    it('1.1: Debería renderizar y calcular exactamente pesos de balanza con 3 decimales (ej. 2.455 kg)', () => {
      const items: MultivendorCartItem[] = [
        {
          product: dummyProducts[0], // $45.000 / kg
          cantidad: 2.455,
        },
      ];

      render(
        <POSMultivendorCart
          items={items}
          onUpdateQuantity={vi.fn()}
          onRemoveItem={vi.fn()}
          onClearCart={vi.fn()}
          subtotal={110475}
          total={110475}
          onEmitirComanda={vi.fn()}
        />
      );

      const qtyInput = screen.getByTestId('cart-qty-input-0') as HTMLInputElement;
      expect(qtyInput.value).toBe('2.455');
      expect(qtyInput.step).toBe('any');
      expect(qtyInput.min).toBe('0.001');

      // 2.455 * 45000 = 110475 -> $110.475 en la fila
      const row0 = screen.getByTestId('cart-row-0');
      expect(row0).toHaveTextContent('$110.475');
    });

    it('1.2: Debería admitir pesos mínimos de balanza (0.001 kg = 1 gramo)', () => {
      const items: MultivendorCartItem[] = [
        {
          product: dummyProducts[0], // $45.000 / kg
          cantidad: 0.001,
        },
      ];

      render(
        <POSMultivendorCart
          items={items}
          onUpdateQuantity={vi.fn()}
          onRemoveItem={vi.fn()}
          onClearCart={vi.fn()}
          subtotal={45}
          total={45}
          onEmitirComanda={vi.fn()}
        />
      );

      const qtyInput = screen.getByTestId('cart-qty-input-0') as HTMLInputElement;
      expect(qtyInput.value).toBe('0.001');

      // 0.001 * 45000 = 45 -> $45 en la fila
      const row0 = screen.getByTestId('cart-row-0');
      expect(row0).toHaveTextContent('$45');
    });

    it('1.3: Debería ser insensible a mayúsculas en unidadMedida ("KG" vs "kg")', () => {
      const items: MultivendorCartItem[] = [
        {
          product: { ...dummyProducts[1], unidadMedida: 'KG' as any }, // Runtime test de mayúsculas
          cantidad: 1.5,
        },
      ];

      render(
        <POSMultivendorCart
          items={items}
          onUpdateQuantity={vi.fn()}
          onRemoveItem={vi.fn()}
          onClearCart={vi.fn()}
          subtotal={93000}
          total={93000}
          onEmitirComanda={vi.fn()}
        />
      );

      const qtyInput = screen.getByTestId('cart-qty-input-0') as HTMLInputElement;
      expect(qtyInput.step).toBe('any');
      expect(qtyInput.min).toBe('0.001');
    });

    it('1.4: Productos por unidad ("und") deben restringirse a step="1" y min="1"', () => {
      const items: MultivendorCartItem[] = [
        {
          product: dummyProducts[2], // unidadMedida: 'und'
          cantidad: 5,
        },
      ];

      render(
        <POSMultivendorCart
          items={items}
          onUpdateQuantity={vi.fn()}
          onRemoveItem={vi.fn()}
          onClearCart={vi.fn()}
          subtotal={62500}
          total={62500}
          onEmitirComanda={vi.fn()}
        />
      );

      const qtyInput = screen.getByTestId('cart-qty-input-0') as HTMLInputElement;
      expect(qtyInput.step).toBe('1');
      expect(qtyInput.min).toBe('1');
    });
  });

  // =========================================================================
  // Challenge 2: Valores Cero y Negativos
  // =========================================================================
  describe('Challenge 2: Valores Cero y Negativos', () => {
    it('2.1: ¿Qué sucede al digitar cantidad 0? Comprobar callbacks emitidos', () => {
      const onSetQuantity = vi.fn();
      const onUpdateQuantity = vi.fn();
      const items: MultivendorCartItem[] = [
        {
          product: dummyProducts[0],
          cantidad: 2,
        },
      ];

      render(
        <POSMultivendorCart
          items={items}
          onSetQuantity={onSetQuantity}
          onUpdateQuantity={onUpdateQuantity}
          onRemoveItem={vi.fn()}
          onClearCart={vi.fn()}
          subtotal={90000}
          total={90000}
          onEmitirComanda={vi.fn()}
        />
      );

      const qtyInput = screen.getByTestId('cart-qty-input-0');
      fireEvent.change(qtyInput, { target: { value: '0' } });

      expect(onSetQuantity).toHaveBeenCalledWith(0, 0);
    });

    it('2.2: ¿Qué sucede al digitar un valor negativo en cantidad (ej. -2)?', () => {
      const onSetQuantity = vi.fn();
      const items: MultivendorCartItem[] = [
        {
          product: dummyProducts[0],
          cantidad: 2,
        },
      ];

      render(
        <POSMultivendorCart
          items={items}
          onSetQuantity={onSetQuantity}
          onUpdateQuantity={vi.fn()}
          onRemoveItem={vi.fn()}
          onClearCart={vi.fn()}
          subtotal={90000}
          total={90000}
          onEmitirComanda={vi.fn()}
        />
      );

      const qtyInput = screen.getByTestId('cart-qty-input-0');
      fireEvent.change(qtyInput, { target: { value: '-2' } });

      // Documentar si el componente emite -2
      expect(onSetQuantity).toHaveBeenCalledWith(0, -2);
    });

    it('2.3: ¿Qué sucede al digitar precio unitario 0?', () => {
      const onUpdatePrice = vi.fn();
      const items: MultivendorCartItem[] = [
        {
          product: dummyProducts[0],
          cantidad: 1,
        },
      ];

      render(
        <POSMultivendorCart
          items={items}
          onUpdatePrice={onUpdatePrice}
          onUpdateQuantity={vi.fn()}
          onRemoveItem={vi.fn()}
          onClearCart={vi.fn()}
          subtotal={45000}
          total={45000}
          onEmitirComanda={vi.fn()}
        />
      );

      const priceInput = screen.getByTestId('cart-unit-price-input-0');
      fireEvent.change(priceInput, { target: { value: '0' } });

      expect(onUpdatePrice).toHaveBeenCalledWith(0, 0);
    });

    it('2.4: ¿Qué sucede cuando el input se borra por completo (string vacío "")?', () => {
      const onSetQuantity = vi.fn();
      const onUpdateQuantity = vi.fn();
      const items: MultivendorCartItem[] = [
        {
          product: dummyProducts[0],
          cantidad: 2.5,
        },
      ];

      render(
        <POSMultivendorCart
          items={items}
          onSetQuantity={onSetQuantity}
          onUpdateQuantity={onUpdateQuantity}
          onRemoveItem={vi.fn()}
          onClearCart={vi.fn()}
          subtotal={112500}
          total={112500}
          onEmitirComanda={vi.fn()}
        />
      );

      const qtyInput = screen.getByTestId('cart-qty-input-0');
      fireEvent.change(qtyInput, { target: { value: '' } });

      // parseFloat("") es NaN, por lo que no debe llamar a los callbacks
      expect(onSetQuantity).not.toHaveBeenCalled();
      expect(onUpdateQuantity).not.toHaveBeenCalled();
    });

    it('2.5: ¿Qué sucede al ingresar texto no numérico (ej. "abc")?', () => {
      const onSetQuantity = vi.fn();
      const onUpdatePrice = vi.fn();
      const items: MultivendorCartItem[] = [
        {
          product: dummyProducts[0],
          cantidad: 1,
        },
      ];

      render(
        <POSMultivendorCart
          items={items}
          onSetQuantity={onSetQuantity}
          onUpdatePrice={onUpdatePrice}
          onUpdateQuantity={vi.fn()}
          onRemoveItem={vi.fn()}
          onClearCart={vi.fn()}
          subtotal={45000}
          total={45000}
          onEmitirComanda={vi.fn()}
        />
      );

      const qtyInput = screen.getByTestId('cart-qty-input-0');
      fireEvent.change(qtyInput, { target: { value: 'abc' } });

      const priceInput = screen.getByTestId('cart-unit-price-input-0');
      fireEvent.change(priceInput, { target: { value: 'xyz' } });

      expect(onSetQuantity).not.toHaveBeenCalled();
      expect(onUpdatePrice).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Challenge 3: Consistencia de Recálculos de Subtotales y Descuentos
  // =========================================================================
  describe('Challenge 3: Consistencia de Recálculos de Subtotales y Descuentos', () => {
    it('3.1: Descuento por ítem porcentual (ej. 10%) recalcula correctamente subtotal redondeado', () => {
      const items: MultivendorCartItem[] = [
        {
          product: dummyProducts[0], // $45.000 / kg
          cantidad: 2.5,
          descuentoPct: 10,
        },
      ];

      // 45000 * 0.9 = 40500. 40500 * 2.5 = 101250.
      render(
        <POSMultivendorCart
          items={items}
          onUpdateQuantity={vi.fn()}
          onRemoveItem={vi.fn()}
          onClearCart={vi.fn()}
          subtotal={101250}
          total={101250}
          onEmitirComanda={vi.fn()}
        />
      );

      // Micro-botón debe reflejar el porcentaje
      const btnDesc = screen.getByTestId('btn-cart-desc-0');
      expect(btnDesc).toHaveTextContent('-10%');

      // Subtotal de la fila
      const row0 = screen.getByTestId('cart-row-0');
      expect(row0).toHaveTextContent('$101.250');
    });

    it('3.2: Descuento porcentual con decimales periódicos (ej. 33.33%) se redondea con Math.round', () => {
      const items: MultivendorCartItem[] = [
        {
          product: dummyProducts[2], // $12.500
          cantidad: 3,
          descuentoPct: 33.33,
        },
      ];

      // effectivePrice = 12500 * (1 - 0.3333) = 12500 * 0.6667 = 8333.75
      // lineSubtotal = Math.round(8333.75 * 3) = Math.round(25001.25) = 25001
      render(
        <POSMultivendorCart
          items={items}
          onUpdateQuantity={vi.fn()}
          onRemoveItem={vi.fn()}
          onClearCart={vi.fn()}
          subtotal={25001}
          total={25001}
          onEmitirComanda={vi.fn()}
        />
      );

      const row0 = screen.getByTestId('cart-row-0');
      expect(row0).toHaveTextContent('$25.001');
    });

    it('3.3: Ítem con precioOverride tiene prioridad sobre precio_venta_pos de catálogo', () => {
      const items: MultivendorCartItem[] = [
        {
          product: dummyProducts[0], // precio_venta_pos: 45000
          cantidad: 2,
          precioOverride: 40000, // Precio negociado
        },
      ];

      render(
        <POSMultivendorCart
          items={items}
          onUpdateQuantity={vi.fn()}
          onRemoveItem={vi.fn()}
          onClearCart={vi.fn()}
          subtotal={80000}
          total={80000}
          onEmitirComanda={vi.fn()}
        />
      );

      const priceInput = screen.getByTestId('cart-unit-price-input-0') as HTMLInputElement;
      expect(priceInput.value).toBe('40000');
      const row0 = screen.getByTestId('cart-row-0');
      expect(row0).toHaveTextContent('$80.000');
    });

    it('3.4: Carrito con múltiples filas acumula correctamente totalItemsCount en el resumen', () => {
      const items: MultivendorCartItem[] = [
        { product: dummyProducts[0], cantidad: 2.5 },
        { product: dummyProducts[1], cantidad: 1.5 },
        { product: dummyProducts[2], cantidad: 4 },
      ];

      render(
        <POSMultivendorCart
          items={items}
          onUpdateQuantity={vi.fn()}
          onRemoveItem={vi.fn()}
          onClearCart={vi.fn()}
          subtotal={255500}
          total={255500}
          onEmitirComanda={vi.fn()}
        />
      );

      // totalItemsCount = 2.5 + 1.5 + 4 = 8 uds
      expect(screen.getByText('Subtotal (8 uds):')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Challenge 4: Navegación de Teclado con Tab y Ergonomía Rápida
  // =========================================================================
  describe('Challenge 4: Navegación de Teclado con Tab y Ergonomía Rápida', () => {
    it('4.1: Secuencia de tabIndex para N filas garantiza progresión continua sin saltos', () => {
      const items: MultivendorCartItem[] = [
        { product: dummyProducts[0], cantidad: 1 },
        { product: dummyProducts[1], cantidad: 2 },
        { product: dummyProducts[2], cantidad: 3 },
      ];

      render(
        <POSMultivendorCart
          items={items}
          onUpdateQuantity={vi.fn()}
          onRemoveItem={vi.fn()}
          onClearCart={vi.fn()}
          subtotal={100000}
          total={100000}
          onEmitirComanda={vi.fn()}
        />
      );

      // Fila 0: 1, 2
      expect(screen.getByTestId('cart-qty-input-0')).toHaveAttribute('tabindex', '1');
      expect(screen.getByTestId('cart-unit-price-input-0')).toHaveAttribute('tabindex', '2');

      // Fila 1: 3, 4
      expect(screen.getByTestId('cart-qty-input-1')).toHaveAttribute('tabindex', '3');
      expect(screen.getByTestId('cart-unit-price-input-1')).toHaveAttribute('tabindex', '4');

      // Fila 2: 5, 6
      expect(screen.getByTestId('cart-qty-input-2')).toHaveAttribute('tabindex', '5');
      expect(screen.getByTestId('cart-unit-price-input-2')).toHaveAttribute('tabindex', '6');
    });

    it('4.2: Todos los controles no editables dentro de cada fila deben tener tabIndex={-1}', () => {
      const items: MultivendorCartItem[] = [
        { product: dummyProducts[0], cantidad: 1 },
        { product: dummyProducts[1], cantidad: 2 },
      ];

      render(
        <POSMultivendorCart
          items={items}
          onUpdateQuantity={vi.fn()}
          onRemoveItem={vi.fn()}
          onClearCart={vi.fn()}
          subtotal={100000}
          total={100000}
          onEmitirComanda={vi.fn()}
        />
      );

      [0, 1].forEach((idx) => {
        expect(screen.getByTestId(`btn-cart-dec-${idx}`)).toHaveAttribute('tabindex', '-1');
        expect(screen.getByTestId(`btn-cart-inc-${idx}`)).toHaveAttribute('tabindex', '-1');
        expect(screen.getByTestId(`btn-cart-remove-${idx}`)).toHaveAttribute('tabindex', '-1');
        expect(screen.getByTestId(`btn-cart-desc-${idx}`)).toHaveAttribute('tabindex', '-1');
      });

      expect(screen.getByTestId('btn-vaciar-carrito')).toHaveAttribute('tabindex', '-1');
    });

    it('4.3: Evento onClick en inputs numéricos también dispara selección completa de texto', () => {
      const selectSpy = vi.spyOn(HTMLInputElement.prototype, 'select');
      const items: MultivendorCartItem[] = [
        { product: dummyProducts[0], cantidad: 2.5 },
      ];

      render(
        <POSMultivendorCart
          items={items}
          onUpdateQuantity={vi.fn()}
          onRemoveItem={vi.fn()}
          onClearCart={vi.fn()}
          subtotal={112500}
          total={112500}
          onEmitirComanda={vi.fn()}
        />
      );

      const qtyInput = screen.getByTestId('cart-qty-input-0');
      fireEvent.click(qtyInput);
      expect(selectSpy).toHaveBeenCalledTimes(1);

      const priceInput = screen.getByTestId('cart-unit-price-input-0');
      fireEvent.click(priceInput);
      expect(selectSpy).toHaveBeenCalledTimes(2);

      selectSpy.mockRestore();
    });
  });

  // =========================================================================
  // Challenge 5: Fallback defensivo cuando onSetQuantity no está definido
  // =========================================================================
  describe('Challenge 5: Fallback defensivo cuando onSetQuantity no está definido', () => {
    it('5.1: Cuando onSetQuantity no existe, handleQtyChange calcula el delta y delega en onUpdateQuantity', () => {
      const onUpdateQuantity = vi.fn();
      const items: MultivendorCartItem[] = [
        { product: dummyProducts[0], cantidad: 2 },
      ];

      render(
        <POSMultivendorCart
          items={items}
          onUpdateQuantity={onUpdateQuantity}
          onRemoveItem={vi.fn()}
          onClearCart={vi.fn()}
          subtotal={90000}
          total={90000}
          onEmitirComanda={vi.fn()}
          // onSetQuantity omitido deliberadamente
        />
      );

      const qtyInput = screen.getByTestId('cart-qty-input-0');
      // Operador cambia de 2 a 5: delta = 5 - 2 = 3
      fireEvent.change(qtyInput, { target: { value: '5' } });

      expect(onUpdateQuantity).toHaveBeenCalledWith(0, 3);
    });

    it('5.2: Fallback defensivo con decremento (de 5 a 1.5): delta = 1.5 - 5 = -3.5', () => {
      const onUpdateQuantity = vi.fn();
      const items: MultivendorCartItem[] = [
        { product: dummyProducts[0], cantidad: 5 },
      ];

      render(
        <POSMultivendorCart
          items={items}
          onUpdateQuantity={onUpdateQuantity}
          onRemoveItem={vi.fn()}
          onClearCart={vi.fn()}
          subtotal={225000}
          total={225000}
          onEmitirComanda={vi.fn()}
        />
      );

      const qtyInput = screen.getByTestId('cart-qty-input-0');
      fireEvent.change(qtyInput, { target: { value: '1.5' } });

      expect(onUpdateQuantity).toHaveBeenCalledWith(0, -3.5);
    });
  });

  // =========================================================================
  // Challenge 6: Estado reactivo en bucle interactivo completo
  // =========================================================================
  describe('Challenge 6: Estado reactivo en simulación interactiva', () => {
    it('6.1: Componente interactivo contenedor actualiza fluidamente cantidad y subtotal', () => {
      const TestContainer = () => {
        const [items, setItems] = useState<MultivendorCartItem[]>([
          { product: dummyProducts[0], cantidad: 1 },
        ]);

        const handleSetQty = (idx: number, newQty: number) => {
          setItems((prev) => {
            const next = [...prev];
            next[idx] = { ...next[idx], cantidad: newQty };
            return next;
          });
        };

        const handleUpdatePrice = (idx: number, newPrice: number) => {
          setItems((prev) => {
            const next = [...prev];
            next[idx] = { ...next[idx], precioOverride: newPrice };
            return next;
          });
        };

        const currentQty = Number(items[0].cantidad) || 0;
        const currentPrice = items[0].precioOverride ?? items[0].product.precio_venta_pos ?? 0;
        const currentTotal = Math.round(currentQty * currentPrice);

        return (
          <POSMultivendorCart
            items={items}
            onUpdateQuantity={vi.fn()}
            onSetQuantity={handleSetQty}
            onUpdatePrice={handleUpdatePrice}
            onRemoveItem={vi.fn()}
            onClearCart={vi.fn()}
            subtotal={currentTotal}
            total={currentTotal}
            onEmitirComanda={vi.fn()}
          />
        );
      };

      render(<TestContainer />);

      const qtyInput = screen.getByTestId('cart-qty-input-0') as HTMLInputElement;
      const priceInput = screen.getByTestId('cart-unit-price-input-0') as HTMLInputElement;
      const totalAmount = screen.getByTestId('pos-cart-total-amount');

      // Inicial: 1 * 45000 = $45.000
      expect(qtyInput.value).toBe('1');
      expect(priceInput.value).toBe('45000');
      expect(totalAmount).toHaveTextContent('$45.000');

      // Operador ingresa peso de balanza: 3.750 kg
      fireEvent.change(qtyInput, { target: { value: '3.75' } });
      expect(qtyInput.value).toBe('3.75');
      // 3.75 * 45000 = 168750
      expect(totalAmount).toHaveTextContent('$168.750');

      // Operador negocia precio a $42.000
      fireEvent.change(priceInput, { target: { value: '42000' } });
      expect(priceInput.value).toBe('42000');
      // 3.75 * 42000 = 157500
      expect(totalAmount).toHaveTextContent('$157.500');
    });
  });

  // =========================================================================
  // Challenge 7: Resiliencia ante tipos anómalos y cadenas vacías/inválidas
  // =========================================================================
  describe('Challenge 7: Resiliencia ante tipos anómalos y cadenas vacías/inválidas', () => {
    it('7.1: Carrito no colapsa si cantidad es cadena vacía o NaN', () => {
      const items: MultivendorCartItem[] = [
        {
          product: dummyProducts[0],
          cantidad: '' as any,
        },
        {
          product: dummyProducts[1],
          cantidad: NaN as any,
        },
      ];

      render(
        <POSMultivendorCart
          items={items}
          onUpdateQuantity={vi.fn()}
          onRemoveItem={vi.fn()}
          onClearCart={vi.fn()}
          subtotal={0}
          total={0}
          onEmitirComanda={vi.fn()}
        />
      );

      // Subtotal de líneas en 0
      const row0 = screen.getByTestId('cart-row-0');
      const row1 = screen.getByTestId('cart-row-1');
      expect(row0).toHaveTextContent('$0');
      expect(row1).toHaveTextContent('$0');

      // Total de unidades en 0
      expect(screen.getByText('Subtotal (0 uds):')).toBeInTheDocument();
    });

    it('7.2: Descuento 100% (cortesía) calcula subtotal de línea en $0 sin errores', () => {
      const items: MultivendorCartItem[] = [
        {
          product: dummyProducts[0], // $45.000
          cantidad: 2,
          descuentoPct: 100,
        },
      ];

      render(
        <POSMultivendorCart
          items={items}
          onUpdateQuantity={vi.fn()}
          onRemoveItem={vi.fn()}
          onClearCart={vi.fn()}
          subtotal={0}
          total={0}
          onEmitirComanda={vi.fn()}
        />
      );

      const row0 = screen.getByTestId('cart-row-0');
      expect(row0).toHaveTextContent('$0');
      expect(screen.getByTestId('btn-cart-desc-0')).toHaveTextContent('-100%');
    });

    it('7.3: isSubmitting deshabilita el botón gigante de emitir comanda F6', () => {
      const items: MultivendorCartItem[] = [
        { product: dummyProducts[0], cantidad: 1 },
      ];

      render(
        <POSMultivendorCart
          items={items}
          onUpdateQuantity={vi.fn()}
          onRemoveItem={vi.fn()}
          onClearCart={vi.fn()}
          subtotal={45000}
          total={45000}
          onEmitirComanda={vi.fn()}
          isSubmitting={true}
        />
      );

      const btnF6 = screen.getByTestId('btn-emitir-preventa-f6');
      expect(btnF6).toBeDisabled();
    });
  });
});
