import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { CartPanel } from '../views/pos/components/CartPanel';
import { ParkedOrdersBar } from '../views/pos/components/ParkedOrdersBar';
import { PendingOrdersDrawer, type PendingOrderComanda } from '../views/pos/components/PendingOrdersDrawer';
import { PosDraftService } from '../services/posDraftService';
import { useOutboxSyncStore } from '../stores/useOutboxSyncStore';
import type { CartDraft, LineaVenta } from '../types/pos.types';

// Mock SweetAlert2 to avoid DOM errors in headless test environment
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: true }),
  },
}));

// Mock sound effects
vi.mock('../utils/soundEffects', () => ({
  playBeep: vi.fn(),
  playCashRegister: vi.fn(),
  playErrorAlert: vi.fn(),
}));

describe('CHALLENGER EMPIRICAL VERIFICATION: Multivendor - Caja Única & On-Demand Checkout', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const sampleLines: LineaVenta[] = [
    {
      productoId: 'p-mojarra',
      sku: 'MOJ-001',
      nombre: 'Mojarra Roja Fresca',
      cantidad: 2.5,
      unidad: 'KG',
      precioLista: 14000,
      descuentoPct: 0,
      precioFinal: 14000,
      totalLinea: 35000,
      precioCompra: 9000,
      esPesoManual: false,
    },
    {
      productoId: 'p-camaron',
      sku: 'CAM-002',
      nombre: 'Camarón Tigre Jumbo',
      cantidad: 1,
      unidad: 'KG',
      precioLista: 48000,
      descuentoPct: 0,
      precioFinal: 48000,
      totalLinea: 48000,
      precioCompra: 32000,
      esPesoManual: false,
    },
  ];

  const defaultStock = {
    'bod-1': {
      'MOJ-001': 100,
      'CAM-002': 50,
    },
  };

  const createDefaultCartProps = (overrides: Record<string, any> = {}) => {
    const subtotal = 83000;
    return {
      lineas: sampleLines,
      cliente: null,
      descuentoGlobalPct: 0,
      descuentoGlobalValor: 0,
      totales: {
        subtotal,
        descuento: 0,
        subtotalBaseGravable: subtotal,
        totalIva: 0,
        totalFinal: subtotal,
      },
      drafts: [] as CartDraft[],
      activeDraftId: null,
      stock: defaultStock,
      bodegaActivaId: 'bod-1',
      bodegaActivaNombre: 'Bodega Principal',
      lastClientPrices: {},
      onUpdateCantidad: vi.fn(),
      onUpdateDescuentoLinea: vi.fn(),
      onRemoveLinea: vi.fn(),
      onWeightRead: vi.fn(),
      onLimpiarCarrito: vi.fn(),
      onSetLineas: vi.fn(),
      onSelectCliente: vi.fn(),
      onClearCliente: vi.fn(),
      onDescuentoClick: vi.fn(),
      onPagar: vi.fn().mockResolvedValue({ id: 'VTA-999', total: subtotal }),
      onGuardarBorrador: vi.fn(),
      onSetActiveDraftId: vi.fn(),
      onSetDrafts: vi.fn(),
      onSetDescuentoGlobal: vi.fn(),
      isTurnoAbierto: true,
      isMostradorAuto: false,
      ...overrides,
    };
  };

  // =========================================================================
  // 1. EMPIRICAL VERIFICATION: ON-DEMAND CHECKOUT DRAWER
  // =========================================================================
  describe('1. On-Demand Checkout Drawer (Cobrar, F2, Enter, Escape, X)', () => {
    it('1.1 CartPanel en modo cajero renderiza footer condensado y NO incluye PaymentPanel estático', () => {
      render(<CartPanel {...createDefaultCartProps()} />);

      // Verificamos que el botón de cobro on-demand está presente
      const btnCobrar = screen.getByTestId('btn-cobrar');
      expect(btnCobrar).toBeInTheDocument();
      expect(btnCobrar).not.toBeDisabled();

      // Verificamos que el drawer de cobro NO está montado inicialmente
      expect(screen.queryByTestId('payment-drawer-container')).toBeNull();
      expect(screen.queryByTestId('payment-drawer-backdrop')).toBeNull();

      // Verificamos que los textos del PaymentPanel detallado no están canibalizando el carrito
      expect(screen.queryByText(/MEDIOS DE COBRO/i)).toBeNull();
      expect(screen.queryByText(/Billetes Sugeridos/i)).toBeNull();
    });

    it('1.2 Clic en "⚡ COBRAR / LIQUIDAR (F2 / Enter)" despliega data-testid="payment-drawer-container"', () => {
      render(<CartPanel {...createDefaultCartProps()} />);

      const btnCobrar = screen.getByTestId('btn-cobrar');
      fireEvent.click(btnCobrar);

      // El drawer y el backdrop deben estar en el DOM
      const drawer = screen.getByTestId('payment-drawer-container');
      const backdrop = screen.getByTestId('payment-drawer-backdrop');
      expect(drawer).toBeInTheDocument();
      expect(backdrop).toBeInTheDocument();

      // Debe mostrar el total a cobrar dentro del drawer
      expect(within(drawer).getAllByText('$83.000').length).toBeGreaterThanOrEqual(1);
    });

    it('1.3 Cerrar el drawer con tecla Escape deja los ítems del carrito 100% intactos', () => {
      render(<CartPanel {...createDefaultCartProps()} />);

      // Abrir drawer
      fireEvent.click(screen.getByTestId('btn-cobrar'));
      expect(screen.getByTestId('payment-drawer-container')).toBeInTheDocument();

      // Presionar Escape
      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

      // El drawer se cierra
      expect(screen.queryByTestId('payment-drawer-container')).toBeNull();

      // Los productos del carrito permanecen intactos
      expect(screen.getByText('Mojarra Roja Fresca')).toBeInTheDocument();
      expect(screen.getByText('Camarón Tigre Jumbo')).toBeInTheDocument();
      expect(screen.getByText('$35.000')).toBeInTheDocument();
      expect(screen.getByText('$48.000')).toBeInTheDocument();
      expect(screen.getAllByText('$83.000').length).toBeGreaterThanOrEqual(1);
    });

    it('1.4 Cerrar el drawer con el botón X (btn-close-payment-drawer) cierra y preserva el carrito', () => {
      render(<CartPanel {...createDefaultCartProps()} />);

      fireEvent.click(screen.getByTestId('btn-cobrar'));
      expect(screen.getByTestId('payment-drawer-container')).toBeInTheDocument();

      const btnClose = screen.getByTestId('btn-close-payment-drawer');
      fireEvent.click(btnClose);

      expect(screen.queryByTestId('payment-drawer-container')).toBeNull();
      expect(screen.getByText('Mojarra Roja Fresca')).toBeInTheDocument();
    });

    it('1.5 Clic en el backdrop cierra el drawer, pero clic dentro del container propaga stopPropagation', () => {
      render(<CartPanel {...createDefaultCartProps()} />);

      fireEvent.click(screen.getByTestId('btn-cobrar'));
      const container = screen.getByTestId('payment-drawer-container');

      // Clic dentro del contenedor no debe cerrarlo
      fireEvent.click(container);
      expect(screen.getByTestId('payment-drawer-container')).toBeInTheDocument();

      // Clic en el backdrop sí debe cerrarlo
      const backdrop = screen.getByTestId('payment-drawer-backdrop');
      fireEvent.click(backdrop);
      expect(screen.queryByTestId('payment-drawer-container')).toBeNull();
    });

    it('1.6 Tecla F2 conmuta la apertura y cierre del drawer de cobro', () => {
      render(<CartPanel {...createDefaultCartProps()} />);

      // Presionar F2 abre el drawer
      fireEvent.keyDown(window, { key: 'F2', code: 'F2' });
      expect(screen.getByTestId('payment-drawer-container')).toBeInTheDocument();

      // Presionar F2 de nuevo cierra el drawer
      fireEvent.keyDown(window, { key: 'F2', code: 'F2' });
      expect(screen.queryByTestId('payment-drawer-container')).toBeNull();
    });

    it('1.7 Tecla Enter abre el drawer solo cuando no hay inputs en foco', () => {
      render(
        <div>
          <input data-testid="test-text-input" type="text" />
          <CartPanel {...createDefaultCartProps()} />
        </div>
      );

      const input = screen.getByTestId('test-text-input');
      input.focus();

      // Al estar en foco un input, Enter no debe abrir el drawer
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      expect(screen.queryByTestId('payment-drawer-container')).toBeNull();

      // Al desenfocar el input, Enter abre el drawer
      input.blur();
      fireEvent.keyDown(window, { key: 'Enter', code: 'Enter' });
      expect(screen.getByTestId('payment-drawer-container')).toBeInTheDocument();
    });

    it('1.8 Bloqueo de Drawer cuando el carrito está vacío o el turno está cerrado', () => {
      const { rerender } = render(
        <CartPanel
          {...createDefaultCartProps({
            lineas: [],
            totales: { subtotal: 0, descuento: 0, totalFinal: 0 },
            isTurnoAbierto: true,
          })}
        />
      );

      // Carrito vacío: F2 o Enter no abren el drawer
      fireEvent.keyDown(window, { key: 'F2', code: 'F2' });
      expect(screen.queryByTestId('payment-drawer-container')).toBeNull();

      // Turno cerrado con ítems
      rerender(
        <CartPanel
          {...createDefaultCartProps({
            isTurnoAbierto: false,
          })}
        />
      );

      fireEvent.keyDown(window, { key: 'F2', code: 'F2' });
      expect(screen.queryByTestId('payment-drawer-container')).toBeNull();
    });
  });

  // =========================================================================
  // 2. EMPIRICAL VERIFICATION: COUNTER VENDOR SALE PARKING & CONSECUTIVE NUMBERING
  // =========================================================================
  describe('2. Counter Vendor Sale Parking & Consecutive Numbering', () => {
    it('2.1 Vendedor de mostrador suspende pedido y lo persiste en store / localStorage', async () => {
      const draft: CartDraft = {
        id: 'DRAFT-TERM-01-001',
        alias: 'Ticket #001 - Vendedor Mostrador',
        total: 54000,
        descuentoGlobal: 0,
        fechaGuardado: new Date().toISOString(),
        lineas: sampleLines,
      };

      await PosDraftService.saveDraft(draft);

      const localDrafts = PosDraftService.getLocalDrafts();
      expect(localDrafts.some((d) => d.id === 'DRAFT-TERM-01-001')).toBe(true);

      const found = localDrafts.find((d) => d.id === 'DRAFT-TERM-01-001');
      expect(found?.total).toBe(54000);
      expect(found?.lineas).toHaveLength(2);
    });

    it('2.2 Generación consecutiva de preventas multivendedor mediante useOutboxSyncStore', async () => {
      const store = useOutboxSyncStore.getState();

      const res1 = await store.emitirPreventaVendedor({
        tenantId: 'tenant-test',
        terminalId: 'TERM-MOSTRADOR-01',
        vendedorId: 'vend-pedro',
        vendedorNombre: 'Pedro Mostrador',
        clienteNombre: 'Restaurante Marino',
        items: [
          {
            productoId: 'p-1',
            sku: 'ROB-01',
            nombre: 'Róbalo',
            cantidad: 3,
            precioUnitario: 35000,
            descuentoPct: 0,
            subtotal: 105000,
          },
        ],
        subtotal: 105000,
        descuentoTotal: 0,
        total: 105000,
      });

      const res2 = await store.emitirPreventaVendedor({
        tenantId: 'tenant-test',
        terminalId: 'TERM-MOSTRADOR-02',
        vendedorId: 'vend-ana',
        vendedorNombre: 'Ana Ventanilla',
        clienteNombre: 'Consumidor Final',
        items: [
          {
            productoId: 'p-2',
            sku: 'PARG-01',
            nombre: 'Pargo Rojo',
            cantidad: 2,
            precioUnitario: 40000,
            descuentoPct: 0,
            subtotal: 80000,
          },
        ],
        subtotal: 80000,
        descuentoTotal: 0,
        total: 80000,
      });

      expect(res1.ok).toBe(true);
      expect(res2.ok).toBe(true);

      if (res1.ok && res2.ok && res1.preventa && res2.preventa) {
        expect(res1.preventa.codigoPreventa).toMatch(/^PRE-\d{4}-\d{5}$/);
        expect(res2.preventa.codigoPreventa).toMatch(/^PRE-\d{4}-\d{5}$/);

        // Los números consecutivos deben ser crecientes y estrictamente distintos
        const num1 = parseInt(res1.preventa.codigoPreventa.split('-')[2], 10);
        const num2 = parseInt(res2.preventa.codigoPreventa.split('-')[2], 10);
        expect(num2).toBeGreaterThan(num1);
      }
    });

    it('2.3 Estrés: 5 terminales concurrentes emiten preventas sin colisión de consecutivos', async () => {
      const store = useOutboxSyncStore.getState();
      const promises = Array.from({ length: 5 }, (_, i) =>
        store.emitirPreventaVendedor({
          tenantId: 'tenant-stress',
          terminalId: `TERM-0${i + 1}`,
          vendedorId: `vend-0${i + 1}`,
          vendedorNombre: `Vendedor ${i + 1}`,
          items: [
            {
              productoId: `p-${i}`,
              sku: `SKU-${i}`,
              nombre: `Producto ${i}`,
              cantidad: 1,
              precioUnitario: 10000 * (i + 1),
              descuentoPct: 0,
              subtotal: 10000 * (i + 1),
            },
          ],
          subtotal: 10000 * (i + 1),
          descuentoTotal: 0,
          total: 10000 * (i + 1),
        })
      );

      const results = await Promise.all(promises);
      const codigos = results.map((r) => (r.ok && r.preventa ? r.preventa.codigoPreventa : ''));

      // Ningún código debe estar vacío y todos deben ser únicos
      expect(codigos.every((c) => c.length > 0)).toBe(true);
      const uniqueCodigos = new Set(codigos);
      expect(uniqueCodigos.size).toBe(5);
    });
  });

  // =========================================================================
  // 3. EMPIRICAL VERIFICATION: SINGLE CASHIER PICKUP & QUEUE CLAIMING
  // =========================================================================
  describe('3. Single Cashier Pickup via PendingOrdersDrawer and ParkedOrdersBar', () => {
    const mockComandas: PendingOrderComanda[] = [
      {
        id: 'cmd-01',
        consecutivoTicket: 'PRE-2026-00101',
        terminalId: 'TERM-01',
        vendedorId: 'vend-01',
        vendedorNombre: 'Marcos Vendedor',
        clienteNombre: 'Cevichería El Puerto',
        montoTotal: 210000,
        itemsCount: 4,
        createdAt: new Date().toISOString(),
        estado: 'PENDIENTE_PAGO',
        items: sampleLines,
      },
      {
        id: 'cmd-02',
        consecutivoTicket: 'PRE-2026-00102',
        terminalId: 'TERM-02',
        vendedorId: 'vend-02',
        vendedorNombre: 'Laura Mostrador',
        clienteNombre: 'Restaurante Bahía',
        montoTotal: 95000,
        itemsCount: 2,
        createdAt: new Date().toISOString(),
        estado: 'PENDIENTE_PAGO',
        items: [sampleLines[0]],
      },
    ];

    it('3.1 Cajero visualiza comandas en cola central con número de ticket, terminal y total', () => {
      render(
        <PendingOrdersDrawer
          isOpen={true}
          onClose={() => {}}
          orders={mockComandas}
          onSelectOrder={() => {}}
        />
      );

      expect(screen.getByText('PRE-2026-00101')).toBeInTheDocument();
      expect(screen.getByText('PRE-2026-00102')).toBeInTheDocument();
      expect(screen.getByText(/Marcos Vendedor/i)).toBeInTheDocument();
      expect(screen.getByText(/Laura Mostrador/i)).toBeInTheDocument();
      expect(screen.getByText('$210.000')).toBeInTheDocument();
      expect(screen.getByText('$95.000')).toBeInTheDocument();
    });

    it('3.2 Cajero filtra por ticket "00102" y encuentra inmediatamente la preventa', () => {
      render(
        <PendingOrdersDrawer
          isOpen={true}
          onClose={() => {}}
          orders={mockComandas}
          onSelectOrder={() => {}}
        />
      );

      const searchInput = screen.getByPlaceholderText(/Buscar por ticket/i);
      fireEvent.change(searchInput, { target: { value: '00102' } });

      expect(screen.queryByText('PRE-2026-00101')).toBeNull();
      expect(screen.getByText('PRE-2026-00102')).toBeInTheDocument();
    });

    it('3.3 Al presionar "Cobrar en Caja", se despacha onSelectOrder con la orden y sus líneas', () => {
      const onSelectOrder = vi.fn();
      render(
        <PendingOrdersDrawer
          isOpen={true}
          onClose={() => {}}
          orders={mockComandas}
          onSelectOrder={onSelectOrder}
        />
      );

      const btnCobrarFirst = screen.getAllByRole('button', { name: /Cobrar en Caja/i })[0];
      fireEvent.click(btnCobrarFirst);

      expect(onSelectOrder).toHaveBeenCalledWith(mockComandas[0]);
      expect(onSelectOrder.mock.calls[0][0].items).toHaveLength(2);
    });

    it('3.4 ParkedOrdersBar renderiza chips horizontales y permite reclamar la orden', () => {
      const onSelectDraft = vi.fn();
      const drafts: CartDraft[] = [
        {
          id: 'DRAFT-A',
          alias: 'Mesa 12 Terraza',
          total: 62000,
          descuentoGlobal: 0,
          fechaGuardado: new Date().toISOString(),
          lineas: sampleLines,
        },
      ];

      render(
        <ParkedOrdersBar
          drafts={drafts}
          activeDraftId={null}
          currentItemsCount={2}
          currentTotal={83000}
          onSelectDraft={onSelectDraft}
          onDeleteDraft={() => {}}
          onNewParkedSale={() => {}}
        />
      );

      const chip = screen.getByText('Mesa 12 Terraza');
      expect(chip).toBeInTheDocument();
      fireEvent.click(chip);

      expect(onSelectDraft).toHaveBeenCalledWith(drafts[0]);
    });
  });

  // =========================================================================
  // 4. EMPIRICAL VERIFICATION: COMPLETE LIQUIDATION CYCLE & DRAWER CLOSING
  // =========================================================================
  describe('4. Complete Liquidation Cycle: Payment & Order Resolution', () => {
    it('4.1 Liquidación con 1-Tap Checkout ejecuta onPagar y cierra automáticamente el drawer', async () => {
      const onPagar = vi.fn().mockResolvedValue({ id: 'VTA-1234', total: 83000 });
      const onLimpiarCarrito = vi.fn();

      render(
        <CartPanel
          {...createDefaultCartProps({
            onPagar,
            onLimpiarCarrito,
          })}
        />
      );

      // 1. Abrir drawer de cobro con botón Cobrar
      fireEvent.click(screen.getByTestId('btn-cobrar'));
      expect(screen.getByTestId('payment-drawer-container')).toBeInTheDocument();

      // 2. Liquidar con botón de Efectivo Exacto Directo (1-Tap Checkout F8)
      const btn1Tap = screen.getByTestId('btn-efectivo-exacto-directo');
      fireEvent.click(btn1Tap);

      await waitFor(() => {
        expect(onPagar).toHaveBeenCalled();
        expect(onPagar.mock.calls[0][0]).toEqual([{ metodo: 'EFECTIVO', monto: 83000 }]);
      });

      // 3. Verificar que el drawer se cierra automáticamente tras la liquidación
      await waitFor(() => {
        expect(screen.queryByTestId('payment-drawer-container')).toBeNull();
      });
    });

    it('4.2 Resolución de comanda en useOutboxSyncStore al completar cobro en caja única', async () => {
      const store = useOutboxSyncStore.getState();

      // Emitimos una preventa
      const emision = await store.emitirPreventaVendedor({
        tenantId: 'tenant-test',
        terminalId: 'TERM-01',
        vendedorId: 'vend-01',
        vendedorNombre: 'Vendedor Comanda',
        items: [
          {
            productoId: 'p-1',
            sku: 'CORV-01',
            nombre: 'Corvina',
            cantidad: 2,
            precioUnitario: 30000,
            descuentoPct: 0,
            subtotal: 60000,
          },
        ],
        subtotal: 60000,
        descuentoTotal: 0,
        total: 60000,
      });

      expect(emision.ok).toBe(true);
      const prefacturaId = emision.preventa?.id as string;

      // La comanda aparece como pendiente de cobro en caja única
      const comandasAntes = store.getComandasCajaUnica();
      expect(comandasAntes.some((c) => c.id === prefacturaId)).toBe(true);

      // Cajero cobra la comanda
      const cobro = await store.cobrarComandaCajaUnica(prefacturaId, {
        cajeroId: 'cajero-principal',
        metodoPago: 'EFECTIVO',
      });

      expect(cobro.ok).toBe(true);

      // Ya no debe aparecer en la cola de pendientes de cobro
      const comandasDespues = store.getComandasCajaUnica();
      expect(comandasDespues.some((c) => c.id === prefacturaId)).toBe(false);
    });

    it('4.3 Estrés: Secuencia rápida de teclas F2 -> Enter -> Escape -> F2 no bloquea el estado', () => {
      render(<CartPanel {...createDefaultCartProps()} />);

      // Secuencia rápida
      fireEvent.keyDown(window, { key: 'F2', code: 'F2' });
      expect(screen.getByTestId('payment-drawer-container')).toBeInTheDocument();

      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
      expect(screen.queryByTestId('payment-drawer-container')).toBeNull();

      fireEvent.keyDown(window, { key: 'Enter', code: 'Enter' });
      expect(screen.getByTestId('payment-drawer-container')).toBeInTheDocument();

      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
      expect(screen.queryByTestId('payment-drawer-container')).toBeNull();

      // El carrito sigue intacto con sus filas
      expect(screen.getByText('Mojarra Roja Fresca')).toBeInTheDocument();
      expect(screen.getAllByText('$83.000').length).toBeGreaterThanOrEqual(1);
    });
  });
});
