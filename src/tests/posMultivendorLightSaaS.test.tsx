import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { POSMultivendorLightHeader } from '../views/pos/components/POSMultivendorLightHeader';
import { POSMultivendorCatalog } from '../views/pos/components/POSMultivendorCatalog';
import { POSMultivendorCart } from '../views/pos/components/POSMultivendorCart';
import { POSMultivendorView } from '../views/pos/components/POSMultivendorView';
import type { Product } from '../types/erp.types';

describe('SPEC-056: Terminal POS Multivendedor (SaaS Light Mode)', () => {
  const dummyVendors = [
    { id: 'v1', nombre: 'DIEGO IVAN DIAZ ANAYA', corto: 'Diego Díaz' },
    { id: 'v2', nombre: 'LUIS EDUARDO BANQUEZ MEJIA', corto: 'Luis Banquez' },
    { id: 'v3', nombre: 'DAVID SANTIAGO PALLARES', corto: 'Santiago Pallares' },
  ];

  const dummyProducts: Product[] = [
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
      sku: 'CAM-001',
      nombre: 'Camarón Tití Limpio Congelado',
      categoria: 'Mariscos',
      unidadMedida: 'kg',
      precio_venta_pos: 35000,
      precio_compra: 22000,
      buffer_seguridad: 2,
      precio_venta_restaurante: 34000,
      precio_venta_mayorista: 32000,
      activo: true,
    },
    {
      id: 'prod-03',
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

  const stockMap: Record<string, number> = {
    'prod-01': 50,
    'prod-02': 25,
    'prod-03': 100,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // SUITE 1: Cabecera Única Compacta (Zero Stacked Bars)
  describe('1. POSMultivendorLightHeader', () => {
    it('debe renderizar la cabecera única compacta con marca y selector de asesores', () => {
      const onSelectVendor = vi.fn();
      render(
        <POSMultivendorLightHeader
          vendedores={dummyVendors}
          selectedVendorId="v1"
          onSelectVendor={onSelectVendor}
          barcodeInput=""
          onBarcodeChange={vi.fn()}
          onBarcodeSubmit={vi.fn()}
          searchQuery=""
          onSearchChange={vi.fn()}
          onOpenClientModal={vi.fn()}
        />
      );

      // Marca y contenedor
      expect(screen.getByTestId('pos-multivendor-light-header')).toBeInTheDocument();
      expect(screen.getByText('PEZCADERIA S.A.S')).toBeInTheDocument();

      // Chips de asesores
      expect(screen.getByText('Diego Díaz')).toBeInTheDocument();
      expect(screen.getByText('Luis Banquez')).toBeInTheDocument();
      expect(screen.getByText('Santiago Pallares')).toBeInTheDocument();

      // Clic en otro asesor
      fireEvent.click(screen.getByTestId('btn-vendedor-v2'));
      expect(onSelectVendor).toHaveBeenCalledWith('v2');
    });

    it('debe renderizar inputs para lector de código de barras y buscador de productos con atajo F8', () => {
      const onBarcodeChange = vi.fn();
      const onSearchChange = vi.fn();
      render(
        <POSMultivendorLightHeader
          vendedores={dummyVendors}
          selectedVendorId="v1"
          onSelectVendor={vi.fn()}
          barcodeInput="770123456"
          onBarcodeChange={onBarcodeChange}
          onBarcodeSubmit={vi.fn()}
          searchQuery="mojarra"
          onSearchChange={onSearchChange}
          onOpenClientModal={vi.fn()}
        />
      );

      const barcodeInput = screen.getByTestId('pos-light-barcode-input');
      const searchInput = screen.getByTestId('pos-light-product-search-input');

      expect(barcodeInput).toBeInTheDocument();
      expect(searchInput).toBeInTheDocument();

      fireEvent.change(barcodeInput, { target: { value: '999888' } });
      expect(onBarcodeChange).toHaveBeenCalledWith('999888');

      fireEvent.change(searchInput, { target: { value: 'camaron' } });
      expect(onSearchChange).toHaveBeenCalledWith('camaron');
    });

    it('debe permitir conmutar a Modo Cajero con F9', () => {
      const onToggleModoCajero = vi.fn();
      render(
        <POSMultivendorLightHeader
          vendedores={dummyVendors}
          selectedVendorId="v1"
          onSelectVendor={vi.fn()}
          barcodeInput=""
          onBarcodeChange={vi.fn()}
          onBarcodeSubmit={vi.fn()}
          searchQuery=""
          onSearchChange={vi.fn()}
          onOpenClientModal={vi.fn()}
          isModoCajero={false}
          onToggleModoCajero={onToggleModoCajero}
        />
      );

      const toggleBtn = screen.getByTestId('btn-toggle-modo-cajero');
      fireEvent.click(toggleBtn);
      expect(onToggleModoCajero).toHaveBeenCalledTimes(1);
    });
  });

  // SUITE 2: Catálogo de Productos (SaaS Light Mode & Matriz 6x3)
  describe('2. POSMultivendorCatalog', () => {
    it('debe renderizar las categorías limpias y la matriz de productos en tarjetas blancas', () => {
      const onAddToCart = vi.fn();
      render(
        <POSMultivendorCatalog
          products={dummyProducts}
          stockMap={stockMap}
          onAddToCart={onAddToCart}
          searchFilter=""
        />
      );

      expect(screen.getByTestId('pos-multivendor-catalog')).toBeInTheDocument();
      expect(screen.getByTestId('btn-cat-TODOS')).toBeInTheDocument();
      expect(screen.getByTestId('btn-cat-Pescados')).toBeInTheDocument();
      expect(screen.getByTestId('btn-cat-Mariscos')).toBeInTheDocument();

      // Nombres de productos visibles en Light Mode
      expect(screen.getByText('Mojarra Roja Entera')).toBeInTheDocument();
      expect(screen.getByText('Camarón Tití Limpio Congelado')).toBeInTheDocument();
      expect(screen.getByText('Atún en Lata Aceite 170g')).toBeInTheDocument();

      // Precios destacados en esmeralda
      expect(screen.getByText('$18.000')).toBeInTheDocument();
      expect(screen.getByText('$35.000')).toBeInTheDocument();
      expect(screen.getByText('$8.500')).toBeInTheDocument();
    });

    it('debe invocar onAddToCart o onOpenScaleModal al hacer clic en una tarjeta', () => {
      const onAddToCart = vi.fn();
      const onOpenScaleModal = vi.fn();
      render(
        <POSMultivendorCatalog
          products={dummyProducts}
          stockMap={stockMap}
          onAddToCart={onAddToCart}
          onOpenScaleModal={onOpenScaleModal}
          searchFilter=""
        />
      );

      // Producto pesable (Mojarra kg)
      const mojarraCard = screen.getByTestId('product-card-MOJ-001');
      fireEvent.click(mojarraCard);
      expect(onOpenScaleModal).toHaveBeenCalledWith(dummyProducts[0]);

      // Producto no pesable (Atún und)
      const atunCard = screen.getByTestId('product-card-ATUN-001');
      fireEvent.click(atunCard);
      expect(onAddToCart).toHaveBeenCalledWith(dummyProducts[2], 1);
    });

    it('debe filtrar productos al seleccionar una categoría', () => {
      render(
        <POSMultivendorCatalog
          products={dummyProducts}
          stockMap={stockMap}
          onAddToCart={vi.fn()}
          searchFilter=""
        />
      );

      fireEvent.click(screen.getByTestId('btn-cat-Mariscos'));
      expect(screen.getByText('Camarón Tití Limpio Congelado')).toBeInTheDocument();
      expect(screen.queryByText('Mojarra Roja Entera')).not.toBeInTheDocument();
    });
  });

  // SUITE 3: Carrito Despejado (85% Altura de Productos & Botón F6)
  describe('3. POSMultivendorCart', () => {
    const dummyItems = [
      {
        product: dummyProducts[0],
        cantidad: 2.5,
      },
      {
        product: dummyProducts[2],
        cantidad: 3,
      },
    ];

    it('debe renderizar los ítems con controles ergonómicos >= 48px y botón gigante de comanda F6', () => {
      const onEmitirComanda = vi.fn();
      const onUpdateQuantity = vi.fn();
      const onRemoveItem = vi.fn();

      render(
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
      );

      expect(screen.getByTestId('pos-multivendor-cart')).toBeInTheDocument();
      expect(screen.getByTestId('pos-cart-items-list')).toBeInTheDocument();

      // Botones de incremento y decremento con data-testid
      expect(screen.getByTestId('btn-cart-inc-0')).toBeInTheDocument();
      expect(screen.getByTestId('btn-cart-dec-0')).toBeInTheDocument();
      expect(screen.getByTestId('cart-qty-0')).toHaveTextContent('2.5');

      fireEvent.click(screen.getByTestId('btn-cart-inc-0'));
      expect(onUpdateQuantity).toHaveBeenCalledWith(0, 1);

      // Botón gigante de emitir comanda F6
      const btnF6 = screen.getByTestId('btn-emitir-preventa-f6');
      expect(btnF6).toBeInTheDocument();
      expect(btnF6).toHaveTextContent('EMITIR COMANDA (F6)');

      fireEvent.click(btnF6);
      expect(onEmitirComanda).toHaveBeenCalledTimes(1);
    });
  });

  // SUITE 4: Integración Completa POSMultivendorView
  describe('4. POSMultivendorView Master Container', () => {
    it('debe integrar cabecera, catálogo 75% y carrito 25% en una sola vista fullscreen sin barras apiladas', () => {
      render(
        <POSMultivendorView
          products={dummyProducts}
          stockMap={stockMap}
          cartItems={[]}
          onAddToCart={vi.fn()}
          onUpdateQuantity={vi.fn()}
          onRemoveItem={vi.fn()}
          onClearCart={vi.fn()}
          subtotal={0}
          total={0}
          onEmitirComanda={vi.fn()}
          selectedVendorId="v1"
          onSelectVendor={vi.fn()}
          vendedores={dummyVendors}
          onOpenClientModal={vi.fn()}
        />
      );

      expect(screen.getByTestId('pos-multivendor-saas-root')).toBeInTheDocument();
      expect(screen.getByTestId('pos-multivendor-light-header')).toBeInTheDocument();
      expect(screen.getByTestId('pos-multivendor-catalog')).toBeInTheDocument();
      expect(screen.getByTestId('pos-multivendor-cart')).toBeInTheDocument();
    });
  });
});

