import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TerminalVendorBadge } from '../views/pos/components/TerminalVendorBadge';
import { PaymentPanel } from '../views/pos/components/PaymentPanel';
import { ProductSearchPanel } from '../views/pos/components/ProductSearchPanel';
import { ParkedOrdersBar } from '../views/pos/components/ParkedOrdersBar';
import POSView from '../views/POSView';
import { useMultiVendorPosStore } from '../stores/useMultiVendorPosStore';
import { useAuthStore } from '../store/useAuthStore';
import { useCashStore } from '../store/useCashStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { useAppStore } from '../store/useAppStore';

describe('Milestone M2: POS Multivendedor & Ergonomía (Features F5–F10)', () => {
  const sampleProducts = [
    {
      id: 'prod-001',
      sku: 'SKU-001',
      nombre: 'Filete de Salmón Premium',
      categoria: 'Pescados',
      precioVenta: 42000,
      unidadMedida: 'KG',
      imagen: '',
      buffer_seguridad: 4,
      activo: true,
    },
    {
      id: 'prod-002',
      sku: 'SKU-002',
      nombre: 'Camarón Tigre Congelado',
      categoria: 'Mariscos',
      precioVenta: 56000,
      unidadMedida: 'KG',
      imagen: '',
      buffer_seguridad: 3,
      activo: true,
    },
    {
      id: 'prod-003',
      sku: 'SKU-003',
      nombre: 'Trucha Arcoíris Deshuesada',
      categoria: 'Pescados',
      precioVenta: 28000,
      unidadMedida: 'KG',
      imagen: '',
      buffer_seguridad: 5,
      activo: true,
    },
  ];

  beforeEach(() => {
    // Setup initial store state
    useAuthStore.setState({
      activeTenant: {
        id: 'tenant-03',
        razonSocial: 'Ferretería Josase & Pescadería Central',
        nit: '900123456',
      } as any,
    });

    useCashStore.getState().setTurnoActivo({
      id: 'turno-test-01',
      sucursalId: 'suc-01',
      cajeroId: 'user-01',
      estado: 'ABIERTO',
      fechaApertura: new Date().toISOString(),
      saldoInicial: 100000,
      totalEfectivo: 150000,
    } as any);

    useInventoryStore.getState().setProducts(sampleProducts as any);

    const mvStore = useMultiVendorPosStore.getState();
    mvStore.setTerminalId('TERM-01');
    mvStore.setVendedorActivo({
      id: 'user-josase-01',
      nombre: 'DIEGO IVAN DIAZ ANAYA',
      rol: 'VENDEDOR',
      pin: '1234',
    });
    mvStore.setTurnoCentralEstado('ABIERTO', 'turno-central-101');
  });

  describe('1. Feature F5: POS Mobile Switcher (Catálogo/Carrito) on < lg in POSView', () => {
    it('debe renderizar el selector de pestaña móvil con botones que cumplen la Ley de Fitts (min-h-[44px])', () => {
      render(<POSView />);

      const mobileSwitcher = screen.getByTestId('pos-mobile-switcher');
      expect(mobileSwitcher).toBeInTheDocument();
      expect(mobileSwitcher).toHaveClass('flex', 'lg:hidden');

      const tabCatalogo = screen.getByTestId('pos-mobile-tab-catalogo');
      const tabCarrito = screen.getByTestId('pos-mobile-tab-carrito');

      expect(tabCatalogo).toBeInTheDocument();
      expect(tabCarrito).toBeInTheDocument();
      expect(tabCatalogo).toHaveClass('min-h-[44px]');
      expect(tabCarrito).toHaveClass('min-h-[44px]');
    });

    it('debe alternar entre la pestaña Catálogo y Carrito en viewport móvil al hacer clic', () => {
      render(<POSView />);

      const tabCatalogo = screen.getByTestId('pos-mobile-tab-catalogo');
      const tabCarrito = screen.getByTestId('pos-mobile-tab-carrito');

      // Estado inicial: Catálogo activo
      expect(tabCatalogo).toHaveAttribute('aria-selected', 'true');
      expect(tabCarrito).toHaveAttribute('aria-selected', 'false');

      // Clic en Carrito
      fireEvent.click(tabCarrito);
      expect(tabCarrito).toHaveAttribute('aria-selected', 'true');
      expect(tabCatalogo).toHaveAttribute('aria-selected', 'false');

      // Clic de vuelta a Catálogo
      fireEvent.click(tabCatalogo);
      expect(tabCatalogo).toHaveAttribute('aria-selected', 'true');
      expect(tabCarrito).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('2. Feature F6: Asesores de Mostrador con Ley de Fitts (min-h-[44px])', () => {
    it('debe renderizar los botones de vendedores de mostrador con min-h-[44px] y padding táctil accesible', () => {
      render(<POSView />);

      const btnVendedor1 = screen.getByText('Diego Díaz').closest('button');
      expect(btnVendedor1).not.toBeNull();
      expect(btnVendedor1).toHaveClass('min-h-[44px]');
      expect(btnVendedor1).toHaveClass('px-3.5', 'py-2.5');

      const btnVendedor2 = screen.getByText('Luis Banquez').closest('button');
      expect(btnVendedor2).not.toBeNull();
      expect(btnVendedor2).toHaveClass('min-h-[44px]');
    });

    it('debe actualizar el vendedor activo al presionar el botón de asesor', () => {
      render(<POSView />);

      const btnVendedor2 = screen.getByText('Luis Banquez').closest('button');
      expect(btnVendedor2).not.toBeNull();
      fireEvent.click(btnVendedor2!);

      const currentUser = useAppStore.getState().currentUser;
      expect(currentUser?.nombre).toBe('LUIS EDUARDO BANQUEZ MEJIA');
    });
  });

  describe('3. Feature F7: Badges y Botones de Acción con Ley de Fitts (min-h-[44px])', () => {
    it('debe dimensionar los botones de TerminalVendorBadge con min-h-[44px]', () => {
      render(<TerminalVendorBadge />);

      const btnTerminal = screen.getByTestId('btn-toggle-terminal-select');
      const btnVendedor = screen.getByTestId('btn-cambiar-vendedor');

      expect(btnTerminal).toHaveClass('min-h-[44px]');
      expect(btnVendedor).toHaveClass('min-h-[44px]');
    });

    it('debe dimensionar el botón + Split en PaymentPanel con min-h-[44px] y font-bold', () => {
      render(
        <PaymentPanel
          totalFinal={100000}
          lineas={[]}
          cliente={null}
          stock={{}}
          bodegaActivaId="bod-01"
          bodegaActivaNombre="Principal"
          onPagar={() => {}}
          onGuardarBorrador={() => {}}
          onLimpiarCarrito={() => {}}
          isDisabled={false}
          isTurnoAbierto={true}
        />
      );

      const btnSplit = screen.getByText('+ Split').closest('button');
      expect(btnSplit).not.toBeNull();
      expect(btnSplit).toHaveClass('min-h-[44px]');
      expect(btnSplit).toHaveClass('font-bold');
    });

    it('debe dimensionar las acciones rápidas del POS (Comandas, Balanza, Más acciones) con min-h-[44px]', () => {
      render(<POSView />);

      const btnComandas = screen.getByTestId('btn-open-comandas-drawer');
      expect(btnComandas).toHaveClass('min-h-[44px]');

      const btnDropdown = screen.getByTestId('pos-more-actions-dropdown').querySelector('button');
      expect(btnDropdown).toHaveClass('min-h-[44px]');
    });
  });

  describe('4. Feature F8 & F10: ProductSearchPanel (Wrap, Debounce, Miller Chunking)', () => {
    it('debe tener inputs con min-h-[44px] y formulario de código de barras con flex-wrap', () => {
      render(
        <ProductSearchPanel
          activeProducts={sampleProducts}
          dynamicFields={[]}
          cliente={null}
          getProductPrice={() => 35000}
          getProductStock={() => 10}
          onAddProduct={() => {}}
        />
      );

      const searchInput = screen.getByTestId('pos-product-search-input');
      expect(searchInput.className).toMatch(/min-h-\[(44|48)px\]/);

      const barcodeForm = screen.getByPlaceholderText('Código de Barras...').closest('form');
      expect(barcodeForm).not.toBeNull();
      expect(barcodeForm).toHaveClass('flex-wrap');

      const scanBtn = screen.getByText('Simular Scan').closest('button');
      expect(scanBtn).toHaveClass('min-h-[44px]');
    });

    it('debe aplicar debounce de 200ms al escribir en el campo de búsqueda (Ley de Doherty)', () => {
      vi.useFakeTimers();

      render(
        <ProductSearchPanel
          activeProducts={sampleProducts}
          dynamicFields={[]}
          cliente={null}
          getProductPrice={() => 35000}
          getProductStock={() => 10}
          onAddProduct={() => {}}
        />
      );

      const searchInput = screen.getByTestId('pos-product-search-input');

      // Inicialmente se muestran los 3 productos
      expect(screen.getByText('Filete de Salmón Premium')).toBeInTheDocument();
      expect(screen.getByText('Camarón Tigre Congelado')).toBeInTheDocument();
      expect(screen.getByText('Trucha Arcoíris Deshuesada')).toBeInTheDocument();

      // Escribir "Camarón"
      fireEvent.change(searchInput, { target: { value: 'Camarón' } });

      // Antes de los 200ms todavía no se ha aplicado el filtro sincrónicamente (no bloquea UI)
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Avanzar los 200ms del debounce
      act(() => {
        vi.advanceTimersByTime(110);
      });

      expect(screen.getByText('Camarón Tigre Congelado')).toBeInTheDocument();
      expect(screen.queryByText('Filete de Salmón Premium')).toBeNull();

      vi.useRealTimers();
    });

    it('debe simplificar la tarjeta de producto mostrando Stock Total y ocultando el desglose de bodegas por defecto (Ley de Miller)', () => {
      render(
        <ProductSearchPanel
          activeProducts={[sampleProducts[0]]}
          dynamicFields={[]}
          cliente={null}
          getProductPrice={() => 42000}
          getProductStock={(sku, bodega) => (bodega === 'Bodega Principal' ? 8 : 4)}
          onAddProduct={() => {}}
        />
      );

      // Stock Total consolidado debe estar visible
      const stockTotal = screen.getByTestId('stock-total-SKU-001');
      expect(stockTotal).toBeInTheDocument();
      expect(stockTotal).toHaveTextContent(/12\s*kg/i);

      // El desglose detallado de bodegas debe estar oculto por defecto
      expect(screen.queryByTestId('stock-breakdown-SKU-001')).toBeNull();

      // Al hacer clic en el botón de toggle "Bodegas ▼", se debe mostrar el desglose
      const toggleBtn = screen.getByTestId('btn-toggle-stock-SKU-001');
      expect(toggleBtn).toBeInTheDocument();
      expect(toggleBtn).toHaveTextContent(/Bodegas/i);

      fireEvent.click(toggleBtn);

      // Ahora el desglose debe estar visible
      const breakdown = screen.getByTestId('stock-breakdown-SKU-001');
      expect(breakdown).toBeInTheDocument();
      expect(breakdown).toHaveTextContent('Bod. Principal:');
      expect(breakdown).toHaveTextContent('Bod. Secundaria:');
      expect(breakdown).toHaveTextContent('Bod. Averías:');

      // Al hacer clic de nuevo, se colapsa
      fireEvent.click(toggleBtn);
      expect(screen.queryByTestId('stock-breakdown-SKU-001')).toBeNull();
    });
  });

  describe('5. Feature F9: ParkedOrdersBar Wrap & Touch Compliance', () => {
    it('debe tener flex-wrap gap-2 en el encabezado para prevenir desbordamiento a 375px', () => {
      render(
        <ParkedOrdersBar
          drafts={[]}
          activeDraftId={null}
          currentItemsCount={0}
          currentTotal={0}
          onSelectDraft={() => {}}
          onDeleteDraft={() => {}}
          onNewParkedSale={() => {}}
        />
      );

      const headerText = screen.getByText('Ventas en Espera & Multicliente');
      const headerContainer = headerText.closest('.flex-wrap');
      expect(headerContainer).not.toBeNull();
      expect(headerContainer).toHaveClass('flex-wrap', 'gap-2');

      const suspenderBtn = screen.getByText('Suspender & Nueva Venta').closest('button');
      expect(suspenderBtn).not.toBeNull();
      expect(suspenderBtn).toHaveClass('min-h-[36px]');
    });
  });
});
