import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import CashFlowView from '../views/cash/CashFlowView';
import { CashierKanbanView } from '../views/pos/components/CashierKanbanView';
import OrderKanbanView from '../views/OrderKanbanView';
import { cashService } from '../services/cashService';
import { prefacturaService } from '../services/prefacturaService';
import { useAuthStore } from '../store/useAuthStore';
import { useCashierKanbanStore } from '../stores/useCashierKanbanStore';
import { useOrderStore } from '../store/useOrderStore';

// Mock de SweetAlert2
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: true }),
  },
}));

// Mock de almacenes para CashFlowView
vi.mock('../store/useWarehouseStore', () => ({
  useWarehouseStore: () => ({
    bodegas: [
      { id: 'bodega-1', nombre: 'Bodega Principal', activa: true },
      { id: 'bodega-2', nombre: 'Bodega Norte', activa: true },
    ],
    getPrimaryBodega: () => ({ id: 'bodega-1', nombre: 'Bodega Principal' }),
  }),
}));

vi.mock('../store/useCashStore', () => ({
  useCashStore: () => ({
    isLoading: false,
  }),
}));

vi.mock('../store/useAppStore', () => ({
  useAppStore: (selector?: (state: any) => any) => {
    const state = { userRole: 'ADMIN', themeMode: 'pezcaderia-glass' };
    return selector ? selector(state) : state;
  },
}));

describe('Milestone M3: Caja Única & Tablero Kanban (Features F11–F18)', () => {
  const tenantId = 'ten-m3-test';

  beforeEach(() => {
    vi.clearAllMocks();

    useAuthStore.setState({
      activeTenant: {
        id: tenantId,
        razonSocial: 'Pescadería El Gran Pez S.A.S.',
        nit: '900.123.456-7',
        ciudad: 'Bucaramanga',
        telefono: '3159876543',
        regimenTributario: 'COMUN',
        activo: true,
        createdAt: new Date().toISOString(),
      },
      currentUser: {
        id: 'usr-cajero-m3',
        email: 'caja@granpez.com',
        nombre: 'Andrés Cajero',
        authProvider: 'google',
        rol: 'cajero',
      },
    });

    vi.spyOn(cashService, 'getCajas').mockReturnValue([
      { id: 'CAJA-1', bodegaId: 'Bodega Principal', nombre: 'Caja POS Principal', tipo: 'MENOR', activa: true },
      { id: 'CAJA-2', bodegaId: 'Bodega Principal', nombre: 'Caja Fuerte', tipo: 'MAYOR', activa: true },
    ]);
  });

  // =========================================================================
  // F11: Header Selectors Wrap in CashFlowView
  // =========================================================================
  it('F11: Contenedor de selectores de Bodega y Caja tiene flex-wrap, gap-2.5 y w-full sm:w-auto sin blowout', () => {
    vi.spyOn(cashService, 'getTurnoActivo').mockReturnValue(null);
    render(<CashFlowView />);

    const selectorsContainer = screen.getByTestId('caja-header-selectors');
    expect(selectorsContainer).toBeInTheDocument();
    expect(selectorsContainer.className).toContain('flex-wrap');
    expect(selectorsContainer.className).toContain('gap-2.5');
    expect(selectorsContainer.className).toContain('w-full');
    expect(selectorsContainer.className).toContain('sm:w-auto');

    // Selects con min-h-[44px] según Ley de Fitts
    const selectBodega = screen.getByDisplayValue('Bodega Principal');
    const selectCaja = screen.getByDisplayValue('Caja POS Principal');
    expect(selectBodega.className).toContain('min-h-[44px]');
    expect(selectCaja.className).toContain('min-h-[44px]');
  });

  // =========================================================================
  // Theme Cleanliness in CashFlowView
  // =========================================================================
  it('Theme Cleanliness: CashFlowView no utiliza fondo rígido bg-[#070A10]', () => {
    vi.spyOn(cashService, 'getTurnoActivo').mockReturnValue(null);
    const { container } = render(<CashFlowView />);

    const rootEl = container.firstElementChild as HTMLElement;
    expect(rootEl.className).not.toContain('bg-[#070A10]');
    expect(rootEl.className).toContain('bg-slate-950');
  });

  // =========================================================================
  // F12: Caja Movimientos Responsive Table in CashFlowView
  // =========================================================================
  it('F12: Tabla de movimientos está envuelta con overflow-x-auto y padding responsivo', () => {
    const turnoMock: any = {
      id: 'TURNO-101',
      cajaId: 'CAJA-1',
      usuarioId: 'usr-cajero-m3',
      fechaApertura: new Date().toISOString(),
      baseInicial: 100000,
      saldoTeoricoGlobal: 250000,
      totalEfectivo: 200000,
      totalDatafono: 50000,
      totalTransferencias: 0,
      estado: 'ABIERTO',
    };

    const movimientosMock: any[] = [
      {
        id: 'mov-1',
        turnoId: 'TURNO-101',
        tipo: 'INGRESO_VENTA',
        monto: 85000,
        metodoPago: 'EFECTIVO',
        concepto: 'Venta Mostrador #001',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'mov-2',
        turnoId: 'TURNO-101',
        tipo: 'EGRESO_GASTO',
        categoriaEgreso: 'Fletes',
        monto: 25000,
        metodoPago: 'EFECTIVO',
        concepto: 'Flete descargue camión',
        createdAt: new Date().toISOString(),
      },
    ];

    vi.spyOn(cashService, 'getTurnoActivo').mockReturnValue(turnoMock);
    vi.spyOn(cashService, 'getMovimientos').mockReturnValue(movimientosMock);

    render(<CashFlowView />);

    const tableContainer = screen.getByTestId('caja-movimientos-container');
    expect(tableContainer).toBeInTheDocument();
    expect(tableContainer.className).toContain('overflow-x-auto');
    expect(tableContainer.className).toContain('w-full');

    const table = screen.getByTestId('caja-movimientos-table');
    expect(table).toBeInTheDocument();
    expect(table.className).toContain('min-w-[500px]');
  });

  // =========================================================================
  // F13: Filtro Tabs Fitts's Law in CashFlowView
  // =========================================================================
  it('F13: Pestañas de filtrado de movimientos cumplen Ley de Fitts con min-h-[44px]', () => {
    const turnoMock: any = {
      id: 'TURNO-102',
      cajaId: 'CAJA-1',
      usuarioId: 'usr-cajero-m3',
      fechaApertura: new Date().toISOString(),
      baseInicial: 100000,
      saldoTeoricoGlobal: 100000,
      totalEfectivo: 100000,
      totalDatafono: 0,
      totalTransferencias: 0,
      estado: 'ABIERTO',
    };

    vi.spyOn(cashService, 'getTurnoActivo').mockReturnValue(turnoMock);
    vi.spyOn(cashService, 'getMovimientos').mockReturnValue([]);

    render(<CashFlowView />);

    const tabTodo = screen.getByTestId('filtro-tab-TODO');
    const tabVentas = screen.getByTestId('filtro-tab-VENTAS');
    const tabFletes = screen.getByTestId('filtro-tab-FLETES');
    const tabPescado = screen.getByTestId('filtro-tab-PESCADO');
    const tabGastos = screen.getByTestId('filtro-tab-GASTOS');

    expect(tabTodo.className).toContain('min-h-[44px]');
    expect(tabTodo.className).toContain('px-3.5');
    expect(tabVentas.className).toContain('min-h-[44px]');
    expect(tabFletes.className).toContain('min-h-[44px]');
    expect(tabPescado.className).toContain('min-h-[44px]');
    expect(tabGastos.className).toContain('min-h-[44px]');
  });

  // =========================================================================
  // F14: Memoized Sort in CashFlowView
  // =========================================================================
  it('F14: Ordenamiento de movimientos se realiza de forma memoizada sin mutar el array original', () => {
    const turnoMock: any = {
      id: 'TURNO-103',
      cajaId: 'CAJA-1',
      usuarioId: 'usr-cajero-m3',
      fechaApertura: new Date().toISOString(),
      baseInicial: 50000,
      saldoTeoricoGlobal: 150000,
      totalEfectivo: 150000,
      totalDatafono: 0,
      totalTransferencias: 0,
      estado: 'ABIERTO',
    };

    // Array original en orden cronológico ascendente (el más viejo primero)
    const movAntiguo = {
      id: 'mov-old',
      turnoId: 'TURNO-103',
      tipo: 'INGRESO_VENTA',
      monto: 30000,
      metodoPago: 'EFECTIVO',
      concepto: 'Venta Mañana Antigua',
      createdAt: '2026-10-29T08:00:00Z',
    };
    const movReciente = {
      id: 'mov-new',
      turnoId: 'TURNO-103',
      tipo: 'INGRESO_VENTA',
      monto: 70000,
      metodoPago: 'EFECTIVO',
      concepto: 'Venta Tarde Reciente',
      createdAt: '2026-10-29T14:00:00Z',
    };

    // Congelar el array para detectar mutaciones en tiempo de ejecución
    const arrayOriginalInmutable = Object.freeze([movAntiguo, movReciente]);

    vi.spyOn(cashService, 'getTurnoActivo').mockReturnValue(turnoMock);
    vi.spyOn(cashService, 'getMovimientos').mockReturnValue(arrayOriginalInmutable as any);

    // Si CashFlowView intentara mutar con .sort() en el array sin copiar, arrojaría TypeError por estar congelado
    expect(() => render(<CashFlowView />)).not.toThrow();

    // Comprobar que en el DOM el más reciente aparece primero
    const filas = screen.getAllByRole('row');
    // Fila 0 es thead, Fila 1 debe ser el más reciente (14:00)
    expect(filas[1]).toHaveTextContent('Venta Tarde Reciente');
    expect(filas[2]).toHaveTextContent('Venta Mañana Antigua');
  });

  // =========================================================================
  // F15: Sub-tab switcher to CashierKanbanView in CashFlowView
  // =========================================================================
  it('F15: Switcher de sub-vistas alterna entre Flujo & Arqueo y Comandas & Preventas (Kanban)', async () => {
    vi.spyOn(cashService, 'getTurnoActivo').mockReturnValue(null);
    render(<CashFlowView />);

    const tabFlujo = screen.getByTestId('tab-caja-flujo');
    const tabKanban = screen.getByTestId('tab-caja-kanban');

    expect(tabFlujo).toBeInTheDocument();
    expect(tabFlujo.className).toContain('min-h-[44px]');
    expect(tabKanban).toBeInTheDocument();
    expect(tabKanban.className).toContain('min-h-[44px]');

    // Al inicio está en modo flujo
    expect(screen.queryByTestId('caja-kanban-container')).not.toBeInTheDocument();

    // Click en Comandas & Preventas
    fireEvent.click(tabKanban);

    await waitFor(() => {
      expect(screen.getByTestId('caja-kanban-container')).toBeInTheDocument();
      expect(screen.getByText(/Flujo de Ventas & Recaudo de Caja/i)).toBeInTheDocument();
    });

    // Alternar nuevamente con tecla F9
    fireEvent.keyDown(window, { key: 'F9' });

    await waitFor(() => {
      expect(screen.queryByTestId('caja-kanban-container')).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // F16: Kanban Chips and Cobro Button Fitts's Law in CashierKanbanView
  // =========================================================================
  it('F16: Chips de asesor y botón Pasar a Cobro cumplen Fitts con min-h-[44px]', async () => {
    prefacturaService.limpiarEstadoPruebas();

    const emision = await prefacturaService.emitirPrefactura({
      tenantId,
      vendedorId: 'v-pedro',
      vendedorNombre: 'Pedro Mostrador',
      terminalId: 'TERM-01',
      clienteDocumento: '10987654',
      clienteNombre: 'Restaurante Bahía',
      items: [{ productoId: 'prod-1', nombre: 'Filete de Robalo', cantidad: 3, precioLista: 35000 }],
    });

    useCashierKanbanStore.setState({
      preventas: [emision.prefactura!],
      filtroAsesorId: 'TODOS',
      preventaSeleccionada: null,
      isModalCobroOpen: false,
      isLoading: false,
    });

    render(<CashierKanbanView tenantId={tenantId} cajeroId="usr-cajero-m3" />);

    // Validar chip Todos
    const chipTodos = screen.getByTestId('chip-asesor-todos');
    expect(chipTodos.className).toContain('min-h-[44px]');
    expect(chipTodos.className).toContain('px-3');
    expect(chipTodos.className).toContain('py-2');

    // Validar botón Pasar a Cobro (F9)
    const btnCobro = screen.getByTestId(`btn-iniciar-cobro-${emision.prefactura!.id}`);
    expect(btnCobro.className).toContain('min-h-[44px]');
    expect(btnCobro.className).toContain('py-2.5');
    expect(btnCobro.className).toContain('px-4');
  });

  // =========================================================================
  // F17: OrderKanbanView Search Input min-h-[44px] and 200ms Debounce
  // =========================================================================
  it('F17: Input de búsqueda en OrderKanbanView mide min-h-[44px] y filtra con debounce de 200ms', async () => {
    vi.useFakeTimers();

    useOrderStore.setState({
      ventas: [
        {
          id: 'order-1',
          numeroPedido: 'PED-1001',
          clienteNombre: 'Mariscos del Puerto',
          estado: 'CREADO',
          lineas: [{ id: 'l-1', sku: 'ROB-01', nombre: 'Robalo', cantidadSolicitada: 5, precio: 30000 }],
          total: 150000,
        } as any,
        {
          id: 'order-2',
          numeroPedido: 'PED-1002',
          clienteNombre: 'Hotel Tequendama',
          estado: 'CREADO',
          lineas: [{ id: 'l-2', sku: 'SAL-01', nombre: 'Salmón', cantidadSolicitada: 10, precio: 50000 }],
          total: 500000,
        } as any,
      ],
      quotations: [],
    });

    render(<OrderKanbanView onEditOrder={vi.fn()} />);

    const searchInput = screen.getByTestId('kanban-search-input');
    expect(searchInput).toBeInTheDocument();
    // Contenedor padre tiene min-h-[44px] sin clases de conflicto
    expect(searchInput.parentElement?.className).toContain('min-h-[44px]');
    expect(searchInput.parentElement?.className).not.toContain('h-10');

    // Inicialmente ambos pedidos están visibles
    expect(screen.getByText('PED-1001')).toBeInTheDocument();
    expect(screen.getByText('PED-1002')).toBeInTheDocument();

    // Escribir búsqueda 'Puerto'
    fireEvent.change(searchInput, { target: { value: 'Puerto' } });

    // Antes de los 200ms, aún no se ha ejecutado el filtrado sincrónico (protección del hilo)
    expect(screen.getByText('PED-1002')).toBeInTheDocument();

    // Avanzar reloj 200ms para disparar el debounce
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Ahora sólo debe verse Mariscos del Puerto
    expect(screen.getByText('PED-1001')).toBeInTheDocument();
    expect(screen.queryByText('PED-1002')).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  // =========================================================================
  // F18: OrderKanbanView Touch Actions for Mobile Cards
  // =========================================================================
  it('F18: Tarjetas de Kanban cuentan con botones táctiles accesibles (min-h-[48px]) para avanzar pedidos sin drag-and-drop', async () => {
    useOrderStore.setState({
      ventas: [
        {
          id: 'order-touch-1',
          numeroPedido: 'PED-TOUCH-1',
          clienteNombre: 'Pescadería San Gil',
          estado: 'CREADO',
          lineas: [{ id: 'l-t1', sku: 'COR-01', nombre: 'Corvina', cantidadSolicitada: 4, precio: 28000 }],
          total: 112000,
        } as any,
      ],
      quotations: [],
    });

    render(<OrderKanbanView onEditOrder={vi.fn()} />);

    // En pestaña Bodega, columna 'Por Alistar' (creados) debe tener botón de avance 'A Fileteo'
    const btnAdvance = screen.getByTestId('btn-advance-order-touch-1');
    expect(btnAdvance).toBeInTheDocument();
    expect(btnAdvance.className).toContain('min-h-[48px]');
    expect(btnAdvance).toHaveTextContent(/A Fileteo/i);

    // Simular pulsación táctil del botón de avance
    fireEvent.click(btnAdvance);

    // El pedido debe haber cambiado de estado
    await waitFor(() => {
      const ventaActualizada = useOrderStore.getState().ventas.find((v) => v.id === 'order-touch-1');
      expect(ventaActualizada?.estado).toBe('EN_FILETEO');
    });
  });
});
