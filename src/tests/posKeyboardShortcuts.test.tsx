import React, { useState, useRef } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { 
  usePOSKeyboardShortcuts, 
  type POSShortcutHandlers, 
  type POSShortcutOptions 
} from '../hooks/usePOSKeyboardShortcuts';
import { 
  POSMultivendorView, 
  type POSMultivendorViewProps 
} from '../views/pos/components/POSMultivendorView';
import type { Product } from '../types/erp.types';
import type { MultivendorCartItem } from '../views/pos/components/POSMultivendorCart';
import type { VendorOption } from '../views/pos/components/POSMultivendorLightHeader';

/**
 * ============================================================================
 * SUITE TDD: INTERCEPTOR GLOBAL DE ATAJOS DE TECLADO POS (SPEC-057 HITO M4)
 * F8, Ctrl+K, F6, F4, F2, F9, Esc
 * ============================================================================
 */

describe('Hito M4: Interceptor Global de Atajos de Teclado POS (SPEC-057 Tarea 4)', () => {
  // Mock de productos estándar
  const mockProductUND: Product = {
    id: 'prod-und-01',
    sku: 'BEB-COL-01',
    nombre: 'Gaseosa Colombiana 400ml',
    categoria: 'BEBIDAS',
    unidadMedida: 'und',
    precio_venta_pos: 4000,
    precio_compra: 2500,
    buffer_seguridad: 10,
    codigo_barras: '7709999999991',
    activo: true,
  } as Product;

  const mockProductKG: Product = {
    id: 'prod-kg-01',
    sku: 'PES-ROB-01',
    nombre: 'Róbalo Entero Fresco',
    categoria: 'PESCADOS',
    unidadMedida: 'kg',
    precio_venta_pos: 35000,
    precio_compra: 22000,
    buffer_seguridad: 5,
    codigo_barras: '7701111111111',
    activo: true,
  } as Product;

  const mockVendors: VendorOption[] = [
    { id: 'v-carlos', nombre: 'Carlos Mostrador', corto: 'Carlos' },
  ];

  const createMockCartItem = (product: Product, cantidad: number = 1): MultivendorCartItem => ({
    id: `cart-${product.id}`,
    product,
    cantidad,
    precioOverride: Number(product.precio_venta_pos || 0),
  });

  // Helper para montar el hook usePOSKeyboardShortcuts en un componente de prueba aislado
  const HookTester: React.FC<{
    handlers: POSShortcutHandlers;
    options?: POSShortcutOptions;
  }> = ({ handlers, options }) => {
    usePOSKeyboardShortcuts(handlers, options);
    return (
      <div>
        <input data-testid="test-input" placeholder="Input de prueba" />
        <textarea data-testid="test-textarea" placeholder="Textarea de prueba" />
        <div data-testid="test-contenteditable" contentEditable suppressContentEditableWarning tabIndex={0}>
          Editable
        </div>
        <button data-testid="test-button">Botón ordinario</button>
      </div>
    );
  };

  // Helper para renderizar POSMultivendorView con props configurables
  const renderInteractivePOSView = (overrides: Partial<POSMultivendorViewProps> = {}) => {
    const defaultProps: POSMultivendorViewProps = {
      products: [mockProductUND, mockProductKG],
      stockMap: { 'prod-und-01': 50, 'prod-kg-01': 30 },
      cartItems: [],
      onAddToCart: vi.fn(),
      onUpdateQuantity: vi.fn(),
      onRemoveItem: vi.fn(),
      onClearCart: vi.fn(),
      subtotal: 0,
      total: 0,
      onEmitirComanda: vi.fn(),
      onCobrarCaja: vi.fn(),
      selectedVendorId: 'v-carlos',
      onSelectVendor: vi.fn(),
      vendedores: mockVendors,
      onOpenClientModal: vi.fn(),
      ...overrides,
    };
    return {
      ...render(<POSMultivendorView {...defaultProps} />),
      props: defaultProps,
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // BLOQUE 1: Atajo F8 (Enfoque y Selección de Buscador)
  // =========================================================================
  describe('BLOQUE 1: Atajo F8 (Enfoque y Selección de Buscador)', () => {
    it('1.1 Presionar F8 dispara onFocusSearch en el hook con preventDefault()', () => {
      const onFocusSearchSpy = vi.fn();
      render(<HookTester handlers={{ onFocusSearch: onFocusSearchSpy }} />);

      const event = new KeyboardEvent('keydown', { key: 'F8', cancelable: true });
      window.dispatchEvent(event);

      expect(onFocusSearchSpy).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
    });

    it('1.2 En POSMultivendorView, presionar F8 enfoca el input de búsqueda de productos', () => {
      renderInteractivePOSView();

      const searchInput = screen.getByTestId('pos-light-product-search-input');
      const focusSpy = vi.spyOn(searchInput, 'focus');

      fireEvent.keyDown(window, { key: 'F8', code: 'F8' });

      expect(focusSpy).toHaveBeenCalled();
    });

    it('1.3 Presionar F8 funciona incluso si el foco inicial está en otro input', () => {
      renderInteractivePOSView();

      const barcodeInput = screen.getByTestId('pos-light-barcode-input');
      barcodeInput.focus();
      expect(document.activeElement).toBe(barcodeInput);

      const searchInput = screen.getByTestId('pos-light-product-search-input');
      const focusSpy = vi.spyOn(searchInput, 'focus');

      fireEvent.keyDown(barcodeInput, { key: 'F8', code: 'F8' });

      expect(focusSpy).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // BLOQUE 2: Atajo Ctrl+K / Cmd+K (Alternancia de Vista / Búsqueda Rápida)
  // =========================================================================
  describe('BLOQUE 2: Atajo Ctrl+K / Cmd+K (Alternancia de Vista / Modo Cajero / Paleta)', () => {
    it('2.1 Presionar Ctrl+K invoca onCtrlK u onToggleView en el hook con preventDefault()', () => {
      const onCtrlKSpy = vi.fn();
      render(<HookTester handlers={{ onCtrlK: onCtrlKSpy }} />);

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        code: 'KeyK',
        ctrlKey: true,
        cancelable: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(onCtrlKSpy).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
    });

    it('2.2 Presionar Cmd+K (metaKey) en macOS invoca el handler de forma idéntica', () => {
      const onCtrlKSpy = vi.fn();
      render(<HookTester handlers={{ onCtrlK: onCtrlKSpy }} />);

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        code: 'KeyK',
        metaKey: true,
        cancelable: true,
      });
      window.dispatchEvent(event);

      expect(onCtrlKSpy).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
    });

    it('2.3 Ctrl+K opera correctamente cuando el foco está dentro de un input de texto', () => {
      const onFocusSearchSpy = vi.fn();
      render(<HookTester handlers={{ onFocusSearch: onFocusSearchSpy }} />);

      const input = screen.getByTestId('test-input');
      input.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        code: 'KeyK',
        ctrlKey: true,
        cancelable: true,
        bubbles: true,
      });
      input.dispatchEvent(event);

      expect(onFocusSearchSpy).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
    });

    it('2.4 En POSMultivendorView, Ctrl+K alterna la vista o dispara onToggleModoCajero', () => {
      const onToggleModoCajeroSpy = vi.fn();
      renderInteractivePOSView({ onToggleModoCajero: onToggleModoCajeroSpy });

      fireEvent.keyDown(window, { key: 'k', code: 'KeyK', ctrlKey: true });

      expect(onToggleModoCajeroSpy).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // BLOQUE 3: Atajo F6 (Selector de Cliente / Modal Multicliente)
  // =========================================================================
  describe('BLOQUE 3: Atajo F6 (Selector de Cliente / Modal Multicliente)', () => {
    it('3.1 Presionar F6 invoca onOpenCustomerSelector y previene acción por defecto', () => {
      const onOpenCustomerSelectorSpy = vi.fn();
      render(
        <HookTester
          handlers={{ onOpenCustomerSelector: onOpenCustomerSelectorSpy }}
          options={{ customerSelectorKey: 'F6' }}
        />
      );

      const event = new KeyboardEvent('keydown', { key: 'F6', cancelable: true });
      window.dispatchEvent(event);

      expect(onOpenCustomerSelectorSpy).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
    });

    it('3.2 En POSMultivendorView, presionar F6 invoca onOpenClientModal con carrito vacío', () => {
      const onOpenClientModalSpy = vi.fn();
      renderInteractivePOSView({
        cartItems: [],
        onOpenClientModal: onOpenClientModalSpy,
      });

      fireEvent.keyDown(window, { key: 'F6', code: 'F6' });

      expect(onOpenClientModalSpy).toHaveBeenCalledTimes(1);
    });

    it('3.3 En POSMultivendorView, presionar F6 invoca onOpenClientModal con ítems en el carrito', () => {
      const onOpenClientModalSpy = vi.fn();
      renderInteractivePOSView({
        cartItems: [createMockCartItem(mockProductUND, 2)],
        subtotal: 8000,
        total: 8000,
        onOpenClientModal: onOpenClientModalSpy,
      });

      fireEvent.keyDown(window, { key: 'F6', code: 'F6' });

      expect(onOpenClientModalSpy).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // BLOQUE 4: Atajo F4 (Motor de Descuento Global de Comanda)
  // =========================================================================
  describe('BLOQUE 4: Atajo F4 (Motor de Descuento Global de Comanda)', () => {
    it('4.1 Presionar F4 con ítems en el carrito abre el popover de descuento global', () => {
      renderInteractivePOSView({
        cartItems: [createMockCartItem(mockProductUND, 2)],
        subtotal: 8000,
        total: 8000,
      });

      // Inicialmente el popover de descuento no debe estar visible
      expect(screen.queryByTestId('pos-discount-popover')).not.toBeInTheDocument();

      // Presionar F4
      fireEvent.keyDown(window, { key: 'F4', code: 'F4' });

      // Popover abierto
      expect(screen.getByTestId('pos-discount-popover')).toBeInTheDocument();
    });

    it('4.2 Presionar F4 con popover abierto lo cierra (comportamiento toggle)', () => {
      renderInteractivePOSView({
        cartItems: [createMockCartItem(mockProductUND, 2)],
        subtotal: 8000,
        total: 8000,
      });

      // Primer F4 abre
      fireEvent.keyDown(window, { key: 'F4', code: 'F4' });
      expect(screen.getByTestId('pos-discount-popover')).toBeInTheDocument();

      // Segundo F4 cierra
      fireEvent.keyDown(window, { key: 'F4', code: 'F4' });
      expect(screen.queryByTestId('pos-discount-popover')).not.toBeInTheDocument();
    });

    it('4.3 Presionar F4 con carrito vacío no abre el popover ni altera el estado', () => {
      renderInteractivePOSView({
        cartItems: [],
        subtotal: 0,
        total: 0,
      });

      fireEvent.keyDown(window, { key: 'F4', code: 'F4' });

      expect(screen.queryByTestId('pos-discount-popover')).not.toBeInTheDocument();
    });

    it('4.4 F4 invoca preventDefault() evitando colisiones con navegadores', () => {
      const onOpenDiscountModalSpy = vi.fn();
      render(<HookTester handlers={{ onOpenDiscountModal: onOpenDiscountModalSpy }} />);

      const event = new KeyboardEvent('keydown', { key: 'F4', cancelable: true });
      window.dispatchEvent(event);

      expect(onOpenDiscountModalSpy).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
    });
  });

  // =========================================================================
  // BLOQUE 5: Atajo F2 (Guardar Borrador / Emitir Comanda de Mostrador)
  // =========================================================================
  describe('BLOQUE 5: Atajo F2 (Guardar Borrador / Emitir Comanda de Mostrador)', () => {
    it('5.1 Presionar F2 con ítems en carrito invoca la emisión de comanda / borrador', () => {
      const onEmitirComandaSpy = vi.fn();
      renderInteractivePOSView({
        cartItems: [createMockCartItem(mockProductUND, 1)],
        subtotal: 4000,
        total: 4000,
        onEmitirComanda: onEmitirComandaSpy,
      });

      fireEvent.keyDown(window, { key: 'F2', code: 'F2' });

      expect(onEmitirComandaSpy).toHaveBeenCalledTimes(1);
    });

    it('5.2 Presionar F2 con carrito vacío no ejecuta la acción de emisión', () => {
      const onEmitirComandaSpy = vi.fn();
      renderInteractivePOSView({
        cartItems: [],
        subtotal: 0,
        total: 0,
        onEmitirComanda: onEmitirComandaSpy,
      });

      fireEvent.keyDown(window, { key: 'F2', code: 'F2' });

      expect(onEmitirComandaSpy).not.toHaveBeenCalled();
    });

    it('5.3 Presionar F2 mientras isSubmitting === true no dispara envíos duplicados', () => {
      const onEmitirComandaSpy = vi.fn();
      renderInteractivePOSView({
        cartItems: [createMockCartItem(mockProductUND, 1)],
        subtotal: 4000,
        total: 4000,
        isSubmitting: true,
        onEmitirComanda: onEmitirComandaSpy,
      });

      fireEvent.keyDown(window, { key: 'F2', code: 'F2' });

      expect(onEmitirComandaSpy).not.toHaveBeenCalled();
    });

    it('5.4 F2 invoca preventDefault()', () => {
      const onSaveDraftSpy = vi.fn();
      render(<HookTester handlers={{ onSaveDraft: onSaveDraftSpy }} />);

      const event = new KeyboardEvent('keydown', { key: 'F2', cancelable: true });
      window.dispatchEvent(event);

      expect(onSaveDraftSpy).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
    });
  });

  // =========================================================================
  // BLOQUE 6: Atajo F9 (Cobro en Caja / Checkout Inmediato)
  // =========================================================================
  describe('BLOQUE 6: Atajo F9 (Cobro en Caja / Checkout Inmediato)', () => {
    it('6.1 Presionar F9 con ítems en carrito invoca onCobrarCaja en POSMultivendorView', () => {
      const onCobrarCajaSpy = vi.fn();
      renderInteractivePOSView({
        cartItems: [createMockCartItem(mockProductUND, 1)],
        subtotal: 4000,
        total: 4000,
        onCobrarCaja: onCobrarCajaSpy,
      });

      fireEvent.keyDown(window, { key: 'F9', code: 'F9' });

      expect(onCobrarCajaSpy).toHaveBeenCalledTimes(1);
    });

    it('6.2 Presionar F9 con carrito vacío no dispara el cobro', () => {
      const onCobrarCajaSpy = vi.fn();
      renderInteractivePOSView({
        cartItems: [],
        subtotal: 0,
        total: 0,
        onCobrarCaja: onCobrarCajaSpy,
      });

      fireEvent.keyDown(window, { key: 'F9', code: 'F9' });

      expect(onCobrarCajaSpy).not.toHaveBeenCalled();
    });

    it('6.3 Presionar F9 degrada elegantemente sin errores si onCobrarCaja no está definido', () => {
      const onEmitirComandaSpy = vi.fn();
      renderInteractivePOSView({
        cartItems: [createMockCartItem(mockProductUND, 1)],
        subtotal: 4000,
        total: 4000,
        onCobrarCaja: undefined,
        onEmitirComanda: onEmitirComandaSpy,
      });

      expect(() => {
        fireEvent.keyDown(window, { key: 'F9', code: 'F9' });
      }).not.toThrow();

      expect(onEmitirComandaSpy).toHaveBeenCalledTimes(1);
    });

    it('6.4 F9 invoca preventDefault()', () => {
      const onCheckoutSpy = vi.fn();
      render(<HookTester handlers={{ onCheckout: onCheckoutSpy }} />);

      const event = new KeyboardEvent('keydown', { key: 'F9', cancelable: true });
      window.dispatchEvent(event);

      expect(onCheckoutSpy).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
    });
  });

  // =========================================================================
  // BLOQUE 7: Atajo Escape (Cierre de Modales y Cancelación Segura sin Pérdida de Datos)
  // =========================================================================
  describe('BLOQUE 7: Atajo Escape (Cierre de Modales y Cancelación Segura)', () => {
    it('7.1 Presionar Escape cierra ManualWeightModal si está desplegado sin alterar los ítems del carrito', () => {
      const { rerender } = renderInteractivePOSView({
        cartItems: [createMockCartItem(mockProductUND, 1)],
        subtotal: 4000,
        total: 4000,
      });

      // Abrir modal de pesaje escaneando o haciendo clic en producto pesable
      const productCard = screen.getByTestId('product-card-PES-ROB-01');
      fireEvent.click(productCard);

      // Modal debe estar abierto
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Presionar Escape
      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

      // Modal debe haberse cerrado
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      // Carrito debe permanecer intacto con su producto original
      const cartRow = screen.getByTestId('cart-row-0');
      expect(cartRow).toBeInTheDocument();
      expect(within(cartRow).getByText('Gaseosa Colombiana 400ml')).toBeInTheDocument();
    });

    it('7.2 Presionar Escape cierra el popover de descuento global F4 sin aplicar valores pendientes', () => {
      renderInteractivePOSView({
        cartItems: [createMockCartItem(mockProductUND, 1)],
        subtotal: 4000,
        total: 4000,
      });

      // Abrir popover F4
      fireEvent.keyDown(window, { key: 'F4', code: 'F4' });
      expect(screen.getByTestId('pos-discount-popover')).toBeInTheDocument();

      // Presionar Escape
      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

      // Popover cerrado
      expect(screen.queryByTestId('pos-discount-popover')).not.toBeInTheDocument();
    });

    it('7.3 Presionar Escape sin modales abiertos NUNCA vacía el carrito ni pierde ítems agregados', () => {
      const onClearCartSpy = vi.fn();
      renderInteractivePOSView({
        cartItems: [createMockCartItem(mockProductUND, 2)],
        subtotal: 8000,
        total: 8000,
        onClearCart: onClearCartSpy,
      });

      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

      expect(onClearCartSpy).not.toHaveBeenCalled();
      expect(screen.getByTestId('cart-row-0')).toBeInTheDocument();
    });

    it('7.4 Presionar Escape con foco en un input de búsqueda limpia el filtro o desenfoca el campo', () => {
      renderInteractivePOSView();

      const searchInput = screen.getByTestId('pos-light-product-search-input') as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'salmón' } });
      expect(searchInput.value).toBe('salmón');

      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

      // Debe haber limpiado el texto de búsqueda
      expect(searchInput.value).toBe('');
    });
  });

  // =========================================================================
  // BLOQUE 8: Discriminación de Contexto de Foco (Inputs vs Comandos)
  // =========================================================================
  describe('BLOQUE 8: Discriminación de Contexto de Foco (Inputs vs Comandos)', () => {
    it('8.1 La digitación ordinaria de caracteres, números y espacios dentro de un <input> no es interceptada', () => {
      const onEnterSpy = vi.fn();
      render(<HookTester handlers={{ onEnter: onEnterSpy }} />);

      const input = screen.getByTestId('test-input');
      input.focus();

      const eventA = new KeyboardEvent('keydown', { key: 'a', cancelable: true });
      input.dispatchEvent(eventA);
      expect(eventA.defaultPrevented).toBe(false);

      const eventSpace = new KeyboardEvent('keydown', { key: ' ', cancelable: true });
      input.dispatchEvent(eventSpace);
      expect(eventSpace.defaultPrevented).toBe(false);
    });

    it('8.2 Teclas de flecha (ArrowUp, ArrowDown) y Enter dentro de inputs no disparan atajos globales', () => {
      const onArrowUpSpy = vi.fn();
      const onArrowDownSpy = vi.fn();
      const onEnterSpy = vi.fn();

      render(
        <HookTester
          handlers={{
            onArrowUp: onArrowUpSpy,
            onArrowDown: onArrowDownSpy,
            onEnter: onEnterSpy,
          }}
        />
      );

      const input = screen.getByTestId('test-input');
      input.focus();

      fireEvent.keyDown(input, { key: 'ArrowUp' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onArrowUpSpy).not.toHaveBeenCalled();
      expect(onArrowDownSpy).not.toHaveBeenCalled();
      expect(onEnterSpy).not.toHaveBeenCalled();
    });

    it('8.3 Teclas de función (F8, F6, F4, F2, F9) se capturan y procesan incluso con cursor dentro de un input', () => {
      const onF8Spy = vi.fn();
      const onF6Spy = vi.fn();
      const onF4Spy = vi.fn();
      const onF2Spy = vi.fn();
      const onF9Spy = vi.fn();

      render(
        <HookTester
          handlers={{
            onFocusSearch: onF8Spy,
            onSaveDraft: onF6Spy,
            onOpenDiscountModal: onF4Spy,
            onCheckout: onF2Spy,
            onToggleView: onF9Spy,
          }}
        />
      );

      const input = screen.getByTestId('test-input');
      input.focus();

      fireEvent.keyDown(input, { key: 'F8' });
      fireEvent.keyDown(input, { key: 'F6' });
      fireEvent.keyDown(input, { key: 'F4' });
      fireEvent.keyDown(input, { key: 'F2' });
      fireEvent.keyDown(input, { key: 'F9' });

      expect(onF8Spy).toHaveBeenCalledTimes(1);
      expect(onF6Spy).toHaveBeenCalledTimes(1);
      expect(onF4Spy).toHaveBeenCalledTimes(1);
      expect(onF2Spy).toHaveBeenCalledTimes(1);
      expect(onF9Spy).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // BLOQUE 9: Ciclo de Vida, Desmontaje y Prevención de Fugas de Memoria
  // =========================================================================
  describe('BLOQUE 9: Ciclo de Vida, Desmontaje y Prevención de Fugas de Memoria', () => {
    it('9.1 Al desmontar el componente (unmount), se remueve el listener de window', () => {
      const removeSpy = vi.spyOn(window, 'removeEventListener');
      const onF8Spy = vi.fn();

      const { unmount } = render(<HookTester handlers={{ onFocusSearch: onF8Spy }} />);
      unmount();

      expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('9.2 Tras el desmontaje, disparar teclas no invoca ningún callback', () => {
      const onF8Spy = vi.fn();
      const { unmount } = render(<HookTester handlers={{ onFocusSearch: onF8Spy }} />);

      unmount();

      fireEvent.keyDown(window, { key: 'F8' });
      expect(onF8Spy).not.toHaveBeenCalled();
    });

    it('9.3 La bandera isEnabled: false inhabilita la captura de todos los atajos', () => {
      const onF8Spy = vi.fn();
      render(<HookTester handlers={{ onFocusSearch: onF8Spy }} options={{ isEnabled: false }} />);

      fireEvent.keyDown(window, { key: 'F8' });
      expect(onF8Spy).not.toHaveBeenCalled();
    });

    it('9.4 Si isModalOpen === true, se suspenden atajos de acción pero Escape se mantiene activo', () => {
      const onFocusSearchSpy = vi.fn();
      const onCheckoutSpy = vi.fn();
      const onEscapeSpy = vi.fn();

      render(
        <HookTester
          handlers={{
            onFocusSearch: onFocusSearchSpy,
            onCheckout: onCheckoutSpy,
            onEscape: onEscapeSpy,
          }}
          options={{ isModalOpen: true }}
        />
      );

      // F8 y F2 deben ser ignorados
      fireEvent.keyDown(window, { key: 'F8' });
      fireEvent.keyDown(window, { key: 'F2' });
      expect(onFocusSearchSpy).not.toHaveBeenCalled();
      expect(onCheckoutSpy).not.toHaveBeenCalled();

      // Escape debe funcionar
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onEscapeSpy).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // BLOQUE 10: Integración UI Completa en POSMultivendorView
  // =========================================================================
  describe('BLOQUE 10: Integración UI Completa en POSMultivendorView', () => {
    it('10.1 Flujo integrado F8 -> Búsqueda -> F6 -> Selección Cliente -> F4 -> Descuento -> F2 -> Emisión Comanda', () => {
      const onOpenClientModalSpy = vi.fn();
      const onEmitirComandaSpy = vi.fn();

      renderInteractivePOSView({
        cartItems: [createMockCartItem(mockProductUND, 2)],
        subtotal: 8000,
        total: 8000,
        onOpenClientModal: onOpenClientModalSpy,
        onEmitirComanda: onEmitirComandaSpy,
      });

      // 1. F8: Enfoque en buscador
      const searchInput = screen.getByTestId('pos-light-product-search-input');
      const focusSpy = vi.spyOn(searchInput, 'focus');
      fireEvent.keyDown(window, { key: 'F8', code: 'F8' });
      expect(focusSpy).toHaveBeenCalled();

      // 2. F6: Selector de cliente
      fireEvent.keyDown(window, { key: 'F6', code: 'F6' });
      expect(onOpenClientModalSpy).toHaveBeenCalledTimes(1);

      // 3. F4: Descuento global
      fireEvent.keyDown(window, { key: 'F4', code: 'F4' });
      expect(screen.getByTestId('pos-discount-popover')).toBeInTheDocument();

      // Cerrar descuento con Escape
      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
      expect(screen.queryByTestId('pos-discount-popover')).not.toBeInTheDocument();

      // 4. F2: Emisión comanda
      fireEvent.keyDown(window, { key: 'F2', code: 'F2' });
      expect(onEmitirComandaSpy).toHaveBeenCalledTimes(1);
    });

    it('10.2 Flujo de cancelación con Escape en cadena de modales preservando datos de venta', () => {
      renderInteractivePOSView({
        cartItems: [createMockCartItem(mockProductUND, 3)],
        subtotal: 12000,
        total: 12000,
      });

      // 1. Abrir modal de pesaje
      const productKGCard = screen.getByTestId('product-card-PES-ROB-01');
      fireEvent.click(productKGCard);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // 2. Escape cierra el modal de pesaje
      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      // 3. Carrito sigue teniendo sus 3 unidades de gaseosa
      const cartRow = screen.getByTestId('cart-row-0');
      expect(cartRow).toBeInTheDocument();
      expect(within(cartRow).getByText('Gaseosa Colombiana 400ml')).toBeInTheDocument();
    });
  });
});
