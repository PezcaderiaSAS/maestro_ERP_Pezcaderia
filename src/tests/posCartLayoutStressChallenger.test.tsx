import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { POSMultivendorCart, type MultivendorCartItem } from '../views/pos/components/POSMultivendorCart';
import { POSMultivendorView } from '../views/pos/components/POSMultivendorView';
import type { Product } from '../types/erp.types';

describe('CHALLENGER 2 EMPIRICAL STRESS TEST: POSMultivendorCart (SPEC-057 M1 Layout, Flexbox & Responsive)', () => {
  const createMockProduct = (id: string, name: string, price: number, unit: 'kg' | 'und' | 'lb' | 'gr' = 'kg'): Product => ({
    id,
    sku: `SKU-${id}`,
    nombre: name,
    categoria: 'Pescados y Mariscos',
    unidadMedida: unit,
    precio_venta_pos: price,
    precio_compra: price * 0.6,
    buffer_seguridad: 5,
    precio_venta_restaurante: price * 0.95,
    precio_venta_mayorista: price * 0.9,
    activo: true,
  });

  const baseProps = {
    onUpdateQuantity: vi.fn(),
    onSetQuantity: vi.fn(),
    onUpdatePrice: vi.fn(),
    onUpdateDiscount: vi.fn(),
    onRemoveItem: vi.fn(),
    onClearCart: vi.fn(),
    onEmitirComanda: vi.fn(),
    onCobrarCaja: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // SECCIÓN 1: Flexbox Vertical, Anclaje de Pie y Scroll Independiente
  // =========================================================================
  describe('Sección 1: Flexbox Vertical, Anclaje de Pie y Scroll Independiente', () => {
    it('Desafío 1.1: Con 0 ítems, el contenedor flex-col y el pie shrink-0 mt-auto mantienen la estructura sin colapsar', () => {
      render(
        <div style={{ height: '768px', width: '380px' }}>
          <POSMultivendorCart
            {...baseProps}
            items={[]}
            subtotal={0}
            total={0}
            activeVendorName="Diego Díaz"
          />
        </div>
      );

      const cartAside = screen.getByTestId('pos-multivendor-cart');
      expect(cartAside.className).toContain('flex');
      expect(cartAside.className).toContain('flex-col');
      expect(cartAside.className).toContain('h-full');
      expect(cartAside.className).toContain('min-h-0');

      const itemsList = screen.getByTestId('pos-cart-items-list');
      expect(itemsList.className).toContain('flex-1');
      expect(itemsList.className).toContain('min-h-0');
      expect(itemsList.className).toContain('overflow-y-auto');

      // Verificar que el pie está anclado abajo
      const comandaBtn = screen.getByTestId('btn-emitir-preventa-f6');
      const footer = comandaBtn.closest('div.shrink-0');
      expect(footer).not.toBeNull();
      expect(footer?.className).toContain('mt-auto');
      expect(footer?.className).toContain('shrink-0');

      // Botón comanda debe estar deshabilitado con 0 ítems
      expect(comandaBtn).toBeDisabled();

      // Botón vaciar carrito no debe existir
      expect(screen.queryByTestId('btn-vaciar-carrito')).toBeNull();

      // Texto de carrito vacío
      expect(screen.getByText('El carrito está vacío')).toBeInTheDocument();
    });

    it('Desafío 1.2: Con 1 ítem, la lista ocupa el espacio flex-1 y el footer no flota hacia arriba', () => {
      const singleItem: MultivendorCartItem = {
        product: createMockProduct('p1', 'Salmón Porcionado 200g', 24000, 'und'),
        cantidad: 1,
      };

      render(
        <div style={{ height: '768px', width: '380px' }}>
          <POSMultivendorCart
            {...baseProps}
            items={[singleItem]}
            subtotal={24000}
            total={24000}
            activeVendorName="Diego Díaz"
          />
        </div>
      );

      const itemsList = screen.getByTestId('pos-cart-items-list');
      expect(itemsList.children.length).toBe(1);
      expect(itemsList.className).toContain('flex-1');
      expect(itemsList.className).toContain('min-h-0');

      // Header contador
      expect(screen.getByText('1 ítem')).toBeInTheDocument();

      // Footer anclado
      const comandaBtn = screen.getByTestId('btn-emitir-preventa-f6');
      expect(comandaBtn).not.toBeDisabled();
      const footer = comandaBtn.closest('div.shrink-0');
      expect(footer?.className).toContain('mt-auto');
    });

    it('Desafío 1.3: Con 25 ítems (carga extrema), el footer y header mantienen shrink-0 y la lista contiene el scroll con overflow-y-auto', () => {
      const items25: MultivendorCartItem[] = Array.from({ length: 25 }, (_, i) => ({
        product: createMockProduct(`prod-${i}`, `Pescado Variedad Lote #${i + 1}`, 15000 + i * 500, 'kg'),
        cantidad: (i + 1) * 0.5,
        precioOverride: 15000 + i * 500,
      }));

      const subtotal25 = items25.reduce((sum, item) => sum + (Number(item.cantidad) * (item.precioOverride || 0)), 0);

      render(
        <div style={{ height: '768px', width: '380px' }}>
          <POSMultivendorCart
            {...baseProps}
            items={items25}
            subtotal={subtotal25}
            total={subtotal25}
            activeVendorName="Asesor Mostrador Central"
          />
        </div>
      );

      // Verificar que se renderizan exactamente los 25 ítems
      const itemsList = screen.getByTestId('pos-cart-items-list');
      expect(itemsList.children.length).toBe(25);

      // Header contador
      expect(screen.getByText('25 ítems')).toBeInTheDocument();

      // Botón vaciar carrito presente
      expect(screen.getByTestId('btn-vaciar-carrito')).toBeInTheDocument();

      // Footer inalterado con shrink-0
      const comandaBtn = screen.getByTestId('btn-emitir-preventa-f6');
      expect(comandaBtn).not.toBeDisabled();
      const footer = comandaBtn.closest('div.shrink-0');
      expect(footer?.className).toContain('shrink-0');
      expect(footer?.className).toContain('mt-auto');

      // Comprobar orden de tabIndex continuo en los 25 ítems (1 a 50)
      for (let i = 0; i < 25; i++) {
        const qtyInput = screen.getByTestId(`cart-qty-input-${i}`);
        const priceInput = screen.getByTestId(`cart-unit-price-input-${i}`);
        expect(qtyInput).toHaveAttribute('tabindex', String(i * 2 + 1));
        expect(priceInput).toHaveAttribute('tabindex', String(i * 2 + 2));

        // Todos los steppers y botones de control deben tener tabIndex={-1}
        expect(screen.getByTestId(`btn-cart-dec-${i}`)).toHaveAttribute('tabindex', '-1');
        expect(screen.getByTestId(`btn-cart-inc-${i}`)).toHaveAttribute('tabindex', '-1');
        expect(screen.getByTestId(`btn-cart-remove-${i}`)).toHaveAttribute('tabindex', '-1');
        expect(screen.getByTestId(`btn-cart-desc-${i}`)).toHaveAttribute('tabindex', '-1');
      }
    });
  });

  // =========================================================================
  // SECCIÓN 2: Responsividad en Viewports 375px (Móvil) y 1280px (Desktop)
  // =========================================================================
  describe('Sección 2: Responsividad en Viewports 375px (Móvil) y 1280px (Desktop)', () => {
    it('Desafío 2.1: En viewport móvil estrecho (375px), el ancho base w-80 (320px) no desborda la pantalla', () => {
      const item: MultivendorCartItem = {
        product: createMockProduct('p-m', 'Camarón Tigre 16/20', 45000, 'kg'),
        cantidad: 1.5,
      };

      const { container } = render(
        <div style={{ width: '375px', height: '667px' }} className="overflow-hidden">
          <POSMultivendorCart
            {...baseProps}
            items={[item]}
            subtotal={67500}
            total={67500}
            activeVendorName="Carlos"
          />
        </div>
      );

      const cartAside = screen.getByTestId('pos-multivendor-cart');
      expect(cartAside.className).toContain('w-80');
      expect(cartAside.className).toContain('sm:w-96');
      expect(cartAside.className).toContain('lg:w-[420px]');

      // El aside debe tener shrink-0 para evitar aplastamiento flex
      expect(cartAside.className).toContain('shrink-0');
    });

    it('Desafío 2.2: En integración completa dentro de POSMultivendorView a 375px, la pestaña móvil conmuta correctamente', () => {
      const products: Product[] = [
        createMockProduct('p1', 'Tilapia Roja Fresca', 12000, 'kg'),
      ];
      const cartItems: MultivendorCartItem[] = [
        {
          product: products[0],
          cantidad: 2,
        },
      ];

      render(
        <div style={{ width: '375px', height: '667px' }}>
          <POSMultivendorView
            products={products}
            stockMap={{ p1: 50 }}
            cartItems={cartItems}
            onAddToCart={vi.fn()}
            onUpdateQuantity={vi.fn()}
            onRemoveItem={vi.fn()}
            onClearCart={vi.fn()}
            subtotal={24000}
            total={24000}
            onEmitirComanda={vi.fn()}
            selectedVendorId="v1"
            onSelectVendor={vi.fn()}
            vendedores={[{ id: 'v1', nombre: 'Vendedor 1', corto: 'V1' }]}
            onOpenClientModal={vi.fn()}
          />
        </div>
      );

      // En mobileTab inicial ('catalogo'), el catálogo es visible
      const catalogTab = screen.getByTestId('pos-mobile-tab-catalogo');
      const cartTab = screen.getByTestId('pos-mobile-tab-carrito');
      expect(catalogTab).toBeInTheDocument();
      expect(cartTab).toBeInTheDocument();

      // Cambiar a pestaña carrito
      fireEvent.click(cartTab);

      // Ahora el carrito debe estar visible con su fila editable
      const qtyInput = screen.getByTestId('cart-qty-input-0');
      expect(qtyInput).toBeInTheDocument();
      expect((qtyInput as HTMLInputElement).value).toBe('2');
    });

    it('Desafío 2.3: En viewport desktop (1280px), el aside aplica clases responsivas lg:w-[420px] y no se desborda', () => {
      const items: MultivendorCartItem[] = [
        { product: createMockProduct('p1', 'Pargo Rojo', 32000), cantidad: 1 },
      ];

      render(
        <div style={{ width: '1280px', height: '800px' }}>
          <POSMultivendorCart
            {...baseProps}
            items={items}
            subtotal={32000}
            total={32000}
          />
        </div>
      );

      const cartAside = screen.getByTestId('pos-multivendor-cart');
      expect(cartAside.className).toContain('lg:w-[420px]');
    });
  });

  // =========================================================================
  // SECCIÓN 3: Desbordamientos Horizontales y Textos Extremos (Stress Testing)
  // =========================================================================
  describe('Sección 3: Desbordamientos Horizontales y Textos Extremos (Stress Testing)', () => {
    it('Desafío 3.1: Nombres de producto extremadamente largos (200+ caracteres sin espacios) usan truncate y no desplazan botones', () => {
      const ultraLongName = 'PescadoSupercalifragilisticoespialidosoDelPacificoSurConDenominacionDeOrigenProtegidaYCertificadoDePescaArtesanalSostenibleSinEspaciosParaDesafiarElDesbordamientoHorizontalDelLayoutEnElCarrito1234567890';
      const itemWithLongName: MultivendorCartItem = {
        product: createMockProduct('p-long', ultraLongName, 50000, 'kg'),
        cantidad: 1,
      };

      render(
        <div style={{ width: '320px', height: '600px' }}>
          <POSMultivendorCart
            {...baseProps}
            items={[itemWithLongName]}
            subtotal={50000}
            total={50000}
          />
        </div>
      );

      // El título del producto debe tener truncate / line-clamp-1 y min-w-0
      const titleElem = screen.getByTitle(ultraLongName);
      expect(titleElem).toBeInTheDocument();
      expect(titleElem.className).toContain('truncate');
      expect(titleElem.className).toContain('line-clamp-1');
      expect(titleElem.className).toContain('flex-1');
      expect(titleElem.className).toContain('min-w-0');

      // El botón [+ Desc] y el botón eliminar DEBEN seguir existiendo en el DOM y tener shrink-0
      const btnDesc = screen.getByTestId('btn-cart-desc-0');
      const btnRemove = screen.getByTestId('btn-cart-remove-0');
      const actionGroup = btnDesc.parentElement;
      expect(actionGroup?.className).toContain('shrink-0');
      expect(btnDesc).toBeInTheDocument();
      expect(btnRemove).toBeInTheDocument();
    });

    it('Desafío 3.2: Valores numéricos financieros extremos (subtotales de 12 dígitos) se renderizan sin desbordar el layout', () => {
      const hugeItem: MultivendorCartItem = {
        product: createMockProduct('p-huge', 'Lote Mayorista Atún Aleta Amarilla', 999999999, 'kg'),
        cantidad: 9999.5,
        precioOverride: 999999999,
      };

      const hugeTotal = Math.round(9999.5 * 999999999);

      render(
        <div style={{ width: '380px', height: '700px' }}>
          <POSMultivendorCart
            {...baseProps}
            items={[hugeItem]}
            subtotal={hugeTotal}
            total={hugeTotal}
          />
        </div>
      );

      // Input cantidad contiene el valor enorme
      const qtyInput = screen.getByTestId('cart-qty-input-0') as HTMLInputElement;
      expect(qtyInput.value).toBe('9999.5');

      // Input precio contiene el valor enorme
      const priceInput = screen.getByTestId('cart-unit-price-input-0') as HTMLInputElement;
      expect(priceInput.value).toBe('999999999');

      // Display de total
      const totalDisplay = screen.getByTestId('pos-cart-total-amount');
      expect(totalDisplay).toBeInTheDocument();
      expect(totalDisplay.textContent).toContain(hugeTotal.toLocaleString('es-CO'));
    });

    it('Desafío 3.3: Nombre de asesor extremadamente largo en cabecera no rompe el contenedor flex', () => {
      const longVendor = 'Don Maximiliano Aurelio de la Santísima Trinidad Pescador Mayor';
      render(
        <div style={{ width: '320px', height: '500px' }}>
          <POSMultivendorCart
            {...baseProps}
            items={[]}
            subtotal={0}
            total={0}
            activeVendorName={longVendor}
          />
        </div>
      );

      expect(screen.getByText(new RegExp(longVendor))).toBeInTheDocument();
    });

    it('Desafío 3.4: Notas de despacho de 500 caracteres se adaptan al campo sin expandir horizontalmente el aside', () => {
      const longNote = 'A'.repeat(500);
      const onNotasDespachoChange = vi.fn();
      const item: MultivendorCartItem = {
        product: createMockProduct('p1', 'Trucha Arcoíris', 18000),
        cantidad: 2,
      };

      render(
        <div style={{ width: '380px', height: '600px' }}>
          <POSMultivendorCart
            {...baseProps}
            items={[item]}
            subtotal={36000}
            total={36000}
            notasDespacho={longNote}
            onNotasDespachoChange={onNotasDespachoChange}
          />
        </div>
      );

      const noteInput = screen.getByPlaceholderText('Instrucciones de corte / despacho...') as HTMLInputElement;
      expect(noteInput.value).toBe(longNote);
      expect(noteInput.className).toContain('w-full');
    });
  });

  // =========================================================================
  // SECCIÓN 4: Robustez Interactiva y Manejo de Entradas Inusuales
  // =========================================================================
  describe('Sección 4: Robustez Interactiva y Manejo de Entradas Inusuales', () => {
    it('Desafío 4.1: Ingreso de valores inválidos (NaN, strings vacías) en cantidad y precio no dispara callbacks con NaN', () => {
      const onSetQuantity = vi.fn();
      const onUpdatePrice = vi.fn();
      const item: MultivendorCartItem = {
        product: createMockProduct('p1', 'Sierra Fresca', 16000),
        cantidad: 3,
      };

      render(
        <POSMultivendorCart
          {...baseProps}
          items={[item]}
          subtotal={48000}
          total={48000}
          onSetQuantity={onSetQuantity}
          onUpdatePrice={onUpdatePrice}
        />
      );

      const qtyInput = screen.getByTestId('cart-qty-input-0');
      fireEvent.change(qtyInput, { target: { value: '' } });
      expect(onSetQuantity).not.toHaveBeenCalled();

      fireEvent.change(qtyInput, { target: { value: 'abc' } });
      expect(onSetQuantity).not.toHaveBeenCalled();

      const priceInput = screen.getByTestId('cart-unit-price-input-0');
      fireEvent.change(priceInput, { target: { value: '' } });
      expect(onUpdatePrice).not.toHaveBeenCalled();

      fireEvent.change(priceInput, { target: { value: 'xyz' } });
      expect(onUpdatePrice).not.toHaveBeenCalled();
    });

    it('Desafío 4.2: onClick además de onFocus en inputs selecciona todo el contenido', () => {
      const selectSpy = vi.spyOn(HTMLInputElement.prototype, 'select');
      const item: MultivendorCartItem = {
        product: createMockProduct('p1', 'Bagre Rayado', 22000),
        cantidad: 1,
      };

      render(
        <POSMultivendorCart
          {...baseProps}
          items={[item]}
          subtotal={22000}
          total={22000}
        />
      );

      const qtyInput = screen.getByTestId('cart-qty-input-0');
      fireEvent.click(qtyInput);
      expect(selectSpy).toHaveBeenCalled();

      const priceInput = screen.getByTestId('cart-unit-price-input-0');
      fireEvent.click(priceInput);
      expect(selectSpy).toHaveBeenCalled();

      selectSpy.mockRestore();
    });

    it('Desafío 4.3: Fallback retrocompatible de cantidad cuando onSetQuantity no está definido', () => {
      const onUpdateQuantity = vi.fn();
      const item: MultivendorCartItem = {
        product: createMockProduct('p1', 'Robalo', 28000),
        cantidad: 2,
      };

      render(
        <POSMultivendorCart
          {...baseProps}
          onSetQuantity={undefined}
          onUpdateQuantity={onUpdateQuantity}
          items={[item]}
          subtotal={56000}
          total={56000}
        />
      );

      const qtyInput = screen.getByTestId('cart-qty-input-0');
      // Cambiar de 2 a 5 -> delta esperado: 5 - 2 = 3
      fireEvent.change(qtyInput, { target: { value: '5' } });
      expect(onUpdateQuantity).toHaveBeenCalledWith(0, 3);
    });

    it('Desafío 4.4: Renderizado de badge de descuento dinámico (-X%) en botón [+ Desc] cuando existe descuento previo', () => {
      const itemWithDiscount: MultivendorCartItem = {
        product: createMockProduct('p1', 'Salmón Ahumado', 30000),
        cantidad: 1,
        descuentoPct: 15,
      };

      render(
        <POSMultivendorCart
          {...baseProps}
          items={[itemWithDiscount]}
          subtotal={25500}
          descuento={4500}
          total={25500}
        />
      );

      const btnDesc = screen.getByTestId('btn-cart-desc-0');
      expect(btnDesc).toHaveTextContent('-15%');
      expect(btnDesc.className).toContain('bg-amber-50');
      expect(btnDesc.className).toContain('text-amber-700');

      // Resumen financiero muestra el descuento
      expect(screen.getByText('Descuento aplicado:')).toBeInTheDocument();
      expect(screen.getByText('-$4.500')).toBeInTheDocument();
    });
  });
});
