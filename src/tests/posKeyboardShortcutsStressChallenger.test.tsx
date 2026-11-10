import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { 
  usePOSKeyboardShortcuts, 
  type POSShortcutHandlers, 
  type POSShortcutOptions 
} from '../hooks/usePOSKeyboardShortcuts';
import { 
  POSMultivendorView, 
  type POSMultivendorViewProps 
} from '../views/pos/components/POSMultivendorView';
import { ManualWeightModal } from '../views/pos/components/ManualWeightModal';
import type { Product } from '../types/erp.types';
import type { MultivendorCartItem } from '../views/pos/components/POSMultivendorCart';
import type { VendorOption } from '../views/pos/components/POSMultivendorLightHeader';

/**
 * ============================================================================
 * EMPIRICAL STRESS CHALLENGER SUITE: POS KEYBOARD SHORTCUTS INTERCEPTOR (M4)
 * Adversarial stress testing for rapid bursts, repeating keydown spam,
 * modifier combinations (Alt/Ctrl/Shift), and unmount listener cleanup.
 * ============================================================================
 */

describe('M4 Empirical Stress Challenger Suite: Keyboard Shortcuts Interceptor', () => {
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

  const HookTester: React.FC<{
    handlers: POSShortcutHandlers;
    options?: POSShortcutOptions;
  }> = ({ handlers, options }) => {
    usePOSKeyboardShortcuts(handlers, options);
    return (
      <div>
        <input data-testid="test-input" placeholder="Input de prueba" />
        <textarea data-testid="test-textarea" placeholder="Textarea de prueba" />
        <button data-testid="test-button">Botón ordinario</button>
      </div>
    );
  };

  const renderInteractivePOSView = (overrides: Partial<POSMultivendorViewProps> = {}) => {
    const defaultProps: POSMultivendorViewProps = {
      products: [mockProductUND, mockProductKG],
      stockMap: { 'prod-und-01': 50, 'prod-kg-01': 30 },
      cartItems: [createMockCartItem(mockProductUND, 2)],
      onAddToCart: vi.fn(),
      onUpdateQuantity: vi.fn(),
      onRemoveItem: vi.fn(),
      onClearCart: vi.fn(),
      subtotal: 8000,
      total: 8000,
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
  // SECCIÓN 1: Prevención de Doble Envío bajo Ráfagas de F2 y F9 (Rapid Firing)
  // =========================================================================
  describe('SECCIÓN 1: Prevención de Doble Envío bajo Ráfagas de F2 y F9', () => {
    it('1.1 Ráfaga de 50 eventos F2 mientras isSubmitting: true -> 0 llamadas a onEmitirComanda', () => {
      const onEmitirComandaSpy = vi.fn();
      renderInteractivePOSView({
        isSubmitting: true,
        onEmitirComanda: onEmitirComandaSpy,
      });

      for (let i = 0; i < 50; i++) {
        fireEvent.keyDown(window, { key: 'F2', code: 'F2' });
      }

      expect(onEmitirComandaSpy).not.toHaveBeenCalled();
    });

    it('1.2 Ráfaga de 50 eventos F9 mientras isSubmitting: true -> 0 llamadas a onCobrarCaja y onEmitirComanda', () => {
      const onCobrarCajaSpy = vi.fn();
      const onEmitirComandaSpy = vi.fn();
      renderInteractivePOSView({
        isSubmitting: true,
        onCobrarCaja: onCobrarCajaSpy,
        onEmitirComanda: onEmitirComandaSpy,
      });

      for (let i = 0; i < 50; i++) {
        fireEvent.keyDown(window, { key: 'F9', code: 'F9' });
      }

      expect(onCobrarCajaSpy).not.toHaveBeenCalled();
      expect(onEmitirComandaSpy).not.toHaveBeenCalled();
    });

    it('1.3 Alternancia rápida de 100 keydowns (F2 y F9 intercalados) mientras isSubmitting: true -> 0 envíos', () => {
      const onCobrarCajaSpy = vi.fn();
      const onEmitirComandaSpy = vi.fn();
      renderInteractivePOSView({
        isSubmitting: true,
        onCobrarCaja: onCobrarCajaSpy,
        onEmitirComanda: onEmitirComandaSpy,
      });

      for (let i = 0; i < 50; i++) {
        fireEvent.keyDown(window, { key: 'F2', code: 'F2' });
        fireEvent.keyDown(window, { key: 'F9', code: 'F9' });
      }

      expect(onCobrarCajaSpy).not.toHaveBeenCalled();
      expect(onEmitirComandaSpy).not.toHaveBeenCalled();
    });

    it('1.4 Transición reactiva de estado: 1er F2 emite, rerender con isSubmitting: true bloquea los siguientes 25 F2', () => {
      const onEmitirComandaSpy = vi.fn();
      const { rerender, props } = renderInteractivePOSView({
        isSubmitting: false,
        onEmitirComanda: onEmitirComandaSpy,
      });

      // Primer F2: debe emitir
      fireEvent.keyDown(window, { key: 'F2', code: 'F2' });
      expect(onEmitirComandaSpy).toHaveBeenCalledTimes(1);

      // Simular cambio reactivo del store o componente contenedor: isSubmitting = true
      rerender(<POSMultivendorView {...props} isSubmitting={true} onEmitirComanda={onEmitirComandaSpy} />);

      // Ráfaga agresiva subsecuente de 25 pulsaciones
      for (let i = 0; i < 25; i++) {
        fireEvent.keyDown(window, { key: 'F2', code: 'F2' });
      }

      // No debe haber incrementado
      expect(onEmitirComandaSpy).toHaveBeenCalledTimes(1);
    });

    it('1.5 Ráfaga de F2 y F9 con carrito vacío no despacha órdenes ni produce excepciones', () => {
      const onEmitirComandaSpy = vi.fn();
      const onCobrarCajaSpy = vi.fn();
      renderInteractivePOSView({
        cartItems: [],
        subtotal: 0,
        total: 0,
        onEmitirComanda: onEmitirComandaSpy,
        onCobrarCaja: onCobrarCajaSpy,
      });

      for (let i = 0; i < 20; i++) {
        fireEvent.keyDown(window, { key: 'F2', code: 'F2' });
        fireEvent.keyDown(window, { key: 'F9', code: 'F9' });
      }

      expect(onEmitirComandaSpy).not.toHaveBeenCalled();
      expect(onCobrarCajaSpy).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // SECCIÓN 2: Tecla Sostenida y Eventos Repetidos (e.repeat === true)
  // =========================================================================
  describe('SECCIÓN 2: Tecla Sostenida y Eventos Repetidos (e.repeat === true)', () => {
    it('2.1 Pulsación sostenida de F2 (1 inicial + 100 repeticiones) ejecuta exactamente 1 vez', () => {
      const onSaveDraftSpy = vi.fn();
      render(<HookTester handlers={{ onSaveDraft: onSaveDraftSpy }} />);

      // 1er evento con repeat: false
      fireEvent.keyDown(window, { key: 'F2', repeat: false });
      expect(onSaveDraftSpy).toHaveBeenCalledTimes(1);

      // 100 eventos con repeat: true
      for (let i = 0; i < 100; i++) {
        fireEvent.keyDown(window, { key: 'F2', repeat: true });
      }

      expect(onSaveDraftSpy).toHaveBeenCalledTimes(1);
    });

    it('2.2 Pulsación sostenida de F9 (1 inicial + 100 repeticiones) ejecuta exactamente 1 vez', () => {
      const onCheckoutSpy = vi.fn();
      render(<HookTester handlers={{ onCheckout: onCheckoutSpy }} />);

      fireEvent.keyDown(window, { key: 'F9', repeat: false });
      expect(onCheckoutSpy).toHaveBeenCalledTimes(1);

      for (let i = 0; i < 100; i++) {
        fireEvent.keyDown(window, { key: 'F9', repeat: true });
      }

      expect(onCheckoutSpy).toHaveBeenCalledTimes(1);
    });

    it('2.3 Pulsación sostenida de F4 no alterna (toggle) cíclicamente en ráfaga', () => {
      renderInteractivePOSView();

      // Inicialmente cerrado
      expect(screen.queryByTestId('pos-discount-popover')).not.toBeInTheDocument();

      // Primer F4 abre
      fireEvent.keyDown(window, { key: 'F4', repeat: false });
      expect(screen.getByTestId('pos-discount-popover')).toBeInTheDocument();

      // 50 eventos con repeat: true no deben cerrar y reabrir el popover
      for (let i = 0; i < 50; i++) {
        fireEvent.keyDown(window, { key: 'F4', repeat: true });
      }

      // Popover debe permanecer abierto de forma estable
      expect(screen.getByTestId('pos-discount-popover')).toBeInTheDocument();
    });

    it('2.4 Pulsación sostenida de Ctrl+K (1 inicial + 50 repeticiones) invoca handler exactamente 1 vez', () => {
      const onToggleViewSpy = vi.fn();
      render(<HookTester handlers={{ onToggleView: onToggleViewSpy }} />);

      fireEvent.keyDown(window, { key: 'k', code: 'KeyK', ctrlKey: true, repeat: false });
      expect(onToggleViewSpy).toHaveBeenCalledTimes(1);

      for (let i = 0; i < 50; i++) {
        fireEvent.keyDown(window, { key: 'k', code: 'KeyK', ctrlKey: true, repeat: true });
      }

      expect(onToggleViewSpy).toHaveBeenCalledTimes(1);
    });

    it('2.5 Pulsación sostenida de F8 y F6 solo dispara 1 invocación', () => {
      const onFocusSearchSpy = vi.fn();
      const onOpenCustomerSelectorSpy = vi.fn();
      render(
        <HookTester
          handlers={{
            onFocusSearch: onFocusSearchSpy,
            onOpenCustomerSelector: onOpenCustomerSelectorSpy,
          }}
          options={{ customerSelectorKey: 'F6' }}
        />
      );

      fireEvent.keyDown(window, { key: 'F8', repeat: false });
      for (let i = 0; i < 20; i++) {
        fireEvent.keyDown(window, { key: 'F8', repeat: true });
      }
      expect(onFocusSearchSpy).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(window, { key: 'F6', repeat: false });
      for (let i = 0; i < 20; i++) {
        fireEvent.keyDown(window, { key: 'F6', repeat: true });
      }
      expect(onOpenCustomerSelectorSpy).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // SECCIÓN 3: Combinaciones de Modificadores (Alt, Ctrl, Shift) y Spam de Escape
  // =========================================================================
  describe('SECCIÓN 3: Combinaciones de Modificadores y Spam de Escape', () => {
    it('3.1 Spam masivo de Escape (100 pulsaciones consecutivas) NUNCA borra el carrito ni corrompe ítems', () => {
      const onClearCartSpy = vi.fn();
      renderInteractivePOSView({
        cartItems: [createMockCartItem(mockProductUND, 3)],
        subtotal: 12000,
        total: 12000,
        onClearCart: onClearCartSpy,
      });

      // Disparar 100 eventos Escape continuos
      for (let i = 0; i < 100; i++) {
        fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
      }

      expect(onClearCartSpy).not.toHaveBeenCalled();
      const cartRow = screen.getByTestId('cart-row-0');
      expect(cartRow).toBeInTheDocument();
      expect(within(cartRow).getByText('Gaseosa Colombiana 400ml')).toBeInTheDocument();
    });

    it('3.2 Ctrl+Alt+K no dispara la alternancia de vista ni búsqueda rápida (altKey bloquea isCtrlK)', () => {
      const onCtrlKSpy = vi.fn();
      const onToggleViewSpy = vi.fn();
      render(
        <HookTester
          handlers={{
            onCtrlK: onCtrlKSpy,
            onToggleView: onToggleViewSpy,
          }}
        />
      );

      fireEvent.keyDown(window, {
        key: 'k',
        code: 'KeyK',
        ctrlKey: true,
        altKey: true,
      });

      expect(onCtrlKSpy).not.toHaveBeenCalled();
      expect(onToggleViewSpy).not.toHaveBeenCalled();
    });

    it('3.3 Ctrl+Enter dentro de un input de texto no dispara comandos globales ni emite comanda accidentalmente', () => {
      const onEmitirComandaSpy = vi.fn();
      renderInteractivePOSView({
        onEmitirComanda: onEmitirComandaSpy,
      });

      const searchInput = screen.getByTestId('pos-light-product-search-input');
      searchInput.focus();

      fireEvent.keyDown(searchInput, {
        key: 'Enter',
        code: 'Enter',
        ctrlKey: true,
      });

      expect(onEmitirComandaSpy).not.toHaveBeenCalled();
    });

    it('3.4 Verificación de comportamiento ante combinaciones Alt+F4 y Ctrl+Shift+K', () => {
      const onOpenDiscountModalSpy = vi.fn();
      const onCtrlKSpy = vi.fn();
      render(
        <HookTester
          handlers={{
            onOpenDiscountModal: onOpenDiscountModalSpy,
            onCtrlK: onCtrlKSpy,
          }}
        />
      );

      // Disparar Ctrl+Shift+K
      const eventShiftK = new KeyboardEvent('keydown', {
        key: 'k',
        code: 'KeyK',
        ctrlKey: true,
        shiftKey: true,
        cancelable: true,
      });
      window.dispatchEvent(eventShiftK);
      // Ctrl+K tolera Shift o no
      expect(onCtrlKSpy).toHaveBeenCalledTimes(1);

      // Disparar Alt+F4
      const eventAltF4 = new KeyboardEvent('keydown', {
        key: 'F4',
        code: 'F4',
        altKey: true,
        cancelable: true,
      });
      window.dispatchEvent(eventAltF4);
      // En la implementación actual, F4 captura el evento de función
      expect(eventAltF4.defaultPrevented).toBe(true);
    });
  });

  // =========================================================================
  // SECCIÓN 4: Concurrencia de Modales y Colisiones de Ciclo de Vida
  // =========================================================================
  describe('SECCIÓN 4: Concurrencia de Modales y Colisiones de Ciclo de Vida', () => {
    it('4.1 Alternancia rápida F4 y Escape (30 ciclos): abre y cierra sin estados fantasma ni bloqueos', () => {
      renderInteractivePOSView();

      for (let i = 0; i < 30; i++) {
        // Abrir F4
        fireEvent.keyDown(window, { key: 'F4', code: 'F4' });
        expect(screen.getByTestId('pos-discount-popover')).toBeInTheDocument();

        // Cerrar con Escape
        fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
        expect(screen.queryByTestId('pos-discount-popover')).not.toBeInTheDocument();
      }
    });

    it('4.2 Cuando isModalOpen === true, 50 atajos de comanda (F2, F4, F6, F8, F9, Ctrl+K) quedan 100% suspendidos', () => {
      const onFocusSearchSpy = vi.fn();
      const onToggleViewSpy = vi.fn();
      const onOpenCustomerSelectorSpy = vi.fn();
      const onOpenDiscountModalSpy = vi.fn();
      const onSaveDraftSpy = vi.fn();
      const onCheckoutSpy = vi.fn();
      const onEscapeSpy = vi.fn();

      render(
        <HookTester
          handlers={{
            onFocusSearch: onFocusSearchSpy,
            onToggleView: onToggleViewSpy,
            onOpenCustomerSelector: onOpenCustomerSelectorSpy,
            onOpenDiscountModal: onOpenDiscountModalSpy,
            onSaveDraft: onSaveDraftSpy,
            onCheckout: onCheckoutSpy,
            onEscape: onEscapeSpy,
          }}
          options={{ isModalOpen: true }}
        />
      );

      for (let i = 0; i < 10; i++) {
        fireEvent.keyDown(window, { key: 'F8' });
        fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
        fireEvent.keyDown(window, { key: 'F6' });
        fireEvent.keyDown(window, { key: 'F4' });
        fireEvent.keyDown(window, { key: 'F2' });
        fireEvent.keyDown(window, { key: 'F9' });
      }

      expect(onFocusSearchSpy).not.toHaveBeenCalled();
      expect(onToggleViewSpy).not.toHaveBeenCalled();
      expect(onOpenCustomerSelectorSpy).not.toHaveBeenCalled();
      expect(onOpenDiscountModalSpy).not.toHaveBeenCalled();
      expect(onSaveDraftSpy).not.toHaveBeenCalled();
      expect(onCheckoutSpy).not.toHaveBeenCalled();

      // Pero Escape debe operar y responder
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onEscapeSpy).toHaveBeenCalledTimes(1);
    });

    it('4.3 En POSMultivendorView con modal de balanza abierto, F2 y F9 no emiten ni cobran, y Escape cierra el modal', () => {
      const onEmitirComandaSpy = vi.fn();
      const onCobrarCajaSpy = vi.fn();
      renderInteractivePOSView({
        onEmitirComanda: onEmitirComandaSpy,
        onCobrarCaja: onCobrarCajaSpy,
      });

      // Abrir modal de pesaje para Róbalo
      const robCard = screen.getByTestId('product-card-PES-ROB-01');
      fireEvent.click(robCard);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Disparar F2 y F9 mientras el modal de balanza está abierto
      fireEvent.keyDown(window, { key: 'F2' });
      fireEvent.keyDown(window, { key: 'F9' });
      expect(onEmitirComandaSpy).not.toHaveBeenCalled();
      expect(onCobrarCajaSpy).not.toHaveBeenCalled();

      // Escape cierra el modal de balanza
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      // Con el modal cerrado, ahora F2 sí puede emitir
      fireEvent.keyDown(window, { key: 'F2' });
      expect(onEmitirComandaSpy).toHaveBeenCalledTimes(1);
    });

    it('4.4 En ManualWeightModal, Escape cierra el diálogo incluso cuando el foco está en un botón o chip táctil', () => {
      const onCloseSpy = vi.fn();
      render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProductKG}
          onClose={onCloseSpy}
        />
      );

      // Enfocar un chip de peso
      const chip = screen.getByTestId('chip-weight-0.5');
      chip.focus();

      fireEvent.keyDown(chip, { key: 'Escape' });
      expect(onCloseSpy).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // SECCIÓN 5: Desmontaje Limpio, Cero Fugas de Memoria y Listeners Colgantes
  // =========================================================================
  describe('SECCIÓN 5: Desmontaje Limpio y Prevención de Fugas de Memoria', () => {
    it('5.1 Desmontaje de HookTester remueve el listener de window y 100 teclas posteriores producen 0 llamadas', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      const onSaveDraftSpy = vi.fn();
      const onEscapeSpy = vi.fn();

      const { unmount } = render(
        <HookTester
          handlers={{
            onSaveDraft: onSaveDraftSpy,
            onEscape: onEscapeSpy,
          }}
        />
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      // Disparar 100 eventos tras desmontaje
      for (let i = 0; i < 50; i++) {
        fireEvent.keyDown(window, { key: 'F2' });
        fireEvent.keyDown(window, { key: 'Escape' });
      }

      expect(onSaveDraftSpy).not.toHaveBeenCalled();
      expect(onEscapeSpy).not.toHaveBeenCalled();
    });

    it('5.2 Desmontaje completo de POSMultivendorView limpia listeners y no reacciona a eventos periféricos', () => {
      const onEmitirComandaSpy = vi.fn();
      const onCobrarCajaSpy = vi.fn();

      const { unmount } = renderInteractivePOSView({
        onEmitirComanda: onEmitirComandaSpy,
        onCobrarCaja: onCobrarCajaSpy,
      });

      unmount();

      for (let i = 0; i < 20; i++) {
        fireEvent.keyDown(window, { key: 'F2' });
        fireEvent.keyDown(window, { key: 'F9' });
        fireEvent.keyDown(window, { key: 'F4' });
      }

      expect(onEmitirComandaSpy).not.toHaveBeenCalled();
      expect(onCobrarCajaSpy).not.toHaveBeenCalled();
    });

    it('5.3 20 ciclos continuos de montaje/desmontaje no acumulan listeners duplicados', () => {
      const addSpy = vi.spyOn(window, 'addEventListener');
      const removeSpy = vi.spyOn(window, 'removeEventListener');

      for (let cycle = 0; cycle < 20; cycle++) {
        const handler = vi.fn();
        const { unmount } = render(<HookTester handlers={{ onF2: handler }} />);
        unmount();
      }

      // Los conteos de addEventListener y removeEventListener deben coincidir exactamente para 'keydown'
      const keydownAdds = addSpy.mock.calls.filter(([event]) => event === 'keydown').length;
      const keydownRemoves = removeSpy.mock.calls.filter(([event]) => event === 'keydown').length;

      expect(keydownAdds).toBe(keydownRemoves);
    });

    it('5.4 ManualWeightModal desmontado no dispara onClose ante eventos de teclado posteriores', () => {
      const onCloseSpy = vi.fn();
      const { unmount } = render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProductKG}
          onClose={onCloseSpy}
        />
      );

      unmount();

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onCloseSpy).not.toHaveBeenCalled();
    });
  });
});
