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
      { id: 'bodega-1', nombre: 'Bodega Central Puerto', activa: true },
      { id: 'bodega-2', nombre: 'Bodega Norte Express', activa: true },
    ],
    getPrimaryBodega: () => ({ id: 'bodega-1', nombre: 'Bodega Central Puerto' }),
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

describe('Empirical Adversarial Challenge: Milestone M3 Probes (F11–F18)', () => {
  const tenantId = 'ten-adv-m3';

  beforeEach(() => {
    vi.clearAllMocks();

    useAuthStore.setState({
      activeTenant: {
        id: tenantId,
        razonSocial: 'Pescados y Mariscos La Perla del Caribe S.A.S.',
        nit: '901.444.555-8',
        ciudad: 'Cartagena',
        telefono: '3001234567',
        regimenTributario: 'COMUN',
        activo: true,
        createdAt: new Date().toISOString(),
      },
      currentUser: {
        id: 'usr-challenger-m3',
        email: 'challenger@pescaderia.com',
        nombre: 'Inspector Challenger',
        authProvider: 'google',
        rol: 'supervisor',
      },
    });

    vi.spyOn(cashService, 'getCajas').mockReturnValue([
      { id: 'CAJA-ADV-1', bodegaId: 'Bodega Central Puerto', nombre: 'Caja Principal Taquilla A', tipo: 'MENOR', activa: true },
      { id: 'CAJA-ADV-2', bodegaId: 'Bodega Central Puerto', nombre: 'Caja Mayor Respaldo B', tipo: 'MAYOR', activa: true },
    ]);
  });

  // =========================================================================
  // PROBE 1: Responsive Layout & 375px Blowout Verification
  // =========================================================================
  describe('Probe 1: Responsive Layout & 375px Blowout Verification', () => {
    it('P1.1: Header selectors wrap cleanly without blowout at 375px viewport', () => {
      vi.spyOn(cashService, 'getTurnoActivo').mockReturnValue(null);
      render(<CashFlowView />);

      const selectorsContainer = screen.getByTestId('caja-header-selectors');
      expect(selectorsContainer).toBeInTheDocument();

      // Verificar clases anti-blowout de Tailwind
      const classes = selectorsContainer.className.split(/\s+/);
      expect(classes).toContain('flex');
      expect(classes).toContain('flex-wrap');
      expect(classes).toContain('gap-2.5');
      expect(classes).toContain('w-full');
      expect(classes).toContain('sm:w-auto');

      // Verificar que los subcontenedores no tengan anchos fijos que desborden 375px
      const innerSelectWrappers = selectorsContainer.querySelectorAll('div.flex');
      expect(innerSelectWrappers.length).toBe(2);
      innerSelectWrappers.forEach((wrapper) => {
        expect(wrapper.className).toContain('w-full');
        expect(wrapper.className).toContain('sm:w-auto');
      });

      // Verificar que los selects internos tienen min-w-0 para evitar desborde flex
      const selects = selectorsContainer.querySelectorAll('select');
      expect(selects.length).toBe(2);
      selects.forEach((sel) => {
        expect(sel.className).toContain('min-w-0');
        expect(sel.className).toContain('min-h-[44px]');
      });
    });

    it('P1.2: Horizontal scroll container isolates 500px min-width table and extreme text lengths without blowing parent layout', () => {
      const turnoMock: any = {
        id: 'TURNO-ADV-101',
        cajaId: 'CAJA-ADV-1',
        usuarioId: 'usr-challenger-m3',
        fechaApertura: new Date().toISOString(),
        baseInicial: 150000,
        saldoTeoricoGlobal: 350000,
        totalEfectivo: 350000,
        totalDatafono: 0,
        totalTransferencias: 0,
        estado: 'ABIERTO',
      };

      // Movimiento con texto adversariamente largo (más de 250 caracteres)
      const movimientoLargo: any = {
        id: 'mov-long-text-1',
        turnoId: 'TURNO-ADV-101',
        tipo: 'EGRESO_GASTO',
        categoriaEgreso: 'Flete descargue masivo de atún y mariscos congelados de ultramar',
        monto: 120000,
        metodoPago: 'EFECTIVO',
        concepto: 'Pago de descargue, estibado, clasificación y transporte refrigerado con vehículo térmico en muelle número cuatro de la dársena norte con recibo de conformidad firmado por el capitán del buque pesquero San Lucas',
        createdAt: new Date().toISOString(),
      };

      vi.spyOn(cashService, 'getTurnoActivo').mockReturnValue(turnoMock);
      vi.spyOn(cashService, 'getMovimientos').mockReturnValue([movimientoLargo]);

      render(<CashFlowView />);

      const tableContainer = screen.getByTestId('caja-movimientos-container');
      expect(tableContainer).toBeInTheDocument();

      // Contenedor debe tener overflow-x-auto y w-full para encapsular el desbordamiento
      expect(tableContainer.className).toContain('overflow-x-auto');
      expect(tableContainer.className).toContain('w-full');

      // Tabla debe tener min-w-[500px] para garantizar legibilidad en scroll horizontal
      const table = screen.getByTestId('caja-movimientos-table');
      expect(table).toBeInTheDocument();
      expect(table.className).toContain('min-w-[500px]');

      // El concepto largo debe renderizarse dentro del DOM sin arrojar errores
      expect(screen.getByText(/Pago de descargue, estibado, clasificación/i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // PROBE 2: Fitts's Law Touch Target Area
  // =========================================================================
  describe('Probe 2: Fitts\'s Law Touch Target Area', () => {
    it('P2.1: All static and dynamic filter tabs in CashFlowView satisfy min-h-[44px]', () => {
      const turnoMock: any = {
        id: 'TURNO-ADV-102',
        cajaId: 'CAJA-ADV-1',
        usuarioId: 'usr-challenger-m3',
        fechaApertura: new Date().toISOString(),
        baseInicial: 100000,
        saldoTeoricoGlobal: 100000,
        totalEfectivo: 100000,
        totalDatafono: 0,
        totalTransferencias: 0,
        estado: 'ABIERTO',
      };

      // Incluir egreso con categoría dinámica para generar pestañas dinámicas
      const movDinamico: any = {
        id: 'mov-din-1',
        turnoId: 'TURNO-ADV-102',
        tipo: 'EGRESO_GASTO',
        categoriaEgreso: 'Hielo Seco',
        monto: 30000,
        metodoPago: 'EFECTIVO',
        concepto: 'Compra de 5 bloques de hielo seco',
        createdAt: new Date().toISOString(),
      };

      vi.spyOn(cashService, 'getTurnoActivo').mockReturnValue(turnoMock);
      vi.spyOn(cashService, 'getMovimientos').mockReturnValue([movDinamico]);

      render(<CashFlowView />);

      const tabsContainer = screen.getByTestId('caja-filtro-tabs');
      expect(tabsContainer).toBeInTheDocument();

      const tabs = tabsContainer.querySelectorAll('button');
      expect(tabs.length).toBeGreaterThanOrEqual(5);

      tabs.forEach((tab) => {
        expect(tab.className).toContain('min-h-[44px]');
      });
    });

    it('P2.2: Sub-view switcher tabs satisfy min-h-[44px]', () => {
      vi.spyOn(cashService, 'getTurnoActivo').mockReturnValue(null);
      render(<CashFlowView />);

      const tabFlujo = screen.getByTestId('tab-caja-flujo');
      const tabKanban = screen.getByTestId('tab-caja-kanban');

      expect(tabFlujo.className).toContain('min-h-[44px]');
      expect(tabKanban.className).toContain('min-h-[44px]');
    });

    it('P2.3: Advisor chips and Cobro buttons in CashierKanbanView satisfy min-h-[44px]', async () => {
      prefacturaService.limpiarEstadoPruebas();

      const pref1 = await prefacturaService.emitirPrefactura({
        tenantId,
        vendedorId: 'v-carlos',
        vendedorNombre: 'Carlos Mostrador',
        terminalId: 'TERM-01',
        clienteDocumento: '10987654',
        clienteNombre: 'Restaurante El Timón',
        items: [{ productoId: 'prod-adv-1', nombre: 'Langostinos U15', cantidad: 2, precioLista: 45000 }],
      });

      const pref2 = await prefacturaService.emitirPrefactura({
        tenantId,
        vendedorId: 'v-diana',
        vendedorNombre: 'Diana Ventas',
        terminalId: 'TERM-02',
        clienteDocumento: '22334455',
        clienteNombre: 'Cevicheria Miramar',
        items: [{ productoId: 'prod-adv-2', nombre: 'Pulpo Baby', cantidad: 1, precioLista: 60000 }],
      });

      useCashierKanbanStore.setState({
        preventas: [pref1.prefactura!, pref2.prefactura!],
        filtroAsesorId: 'TODOS',
        preventaSeleccionada: null,
        isModalCobroOpen: false,
        isLoading: false,
      });

      render(<CashierKanbanView tenantId={tenantId} cajeroId="usr-challenger-m3" />);

      // Verificar chip Todos
      const chipTodos = screen.getByTestId('chip-asesor-todos');
      expect(chipTodos.className).toContain('min-h-[44px]');

      // Verificar chips individuales de cada asesor activo
      const chipCarlos = screen.getByTestId('chip-asesor-v-carlos');
      const chipDiana = screen.getByTestId('chip-asesor-v-diana');
      expect(chipCarlos.className).toContain('min-h-[44px]');
      expect(chipDiana.className).toContain('min-h-[44px]');

      // Verificar botón Pasar a Cobro para cada preventa
      const btnCobro1 = screen.getByTestId(`btn-iniciar-cobro-${pref1.prefactura!.id}`);
      const btnCobro2 = screen.getByTestId(`btn-iniciar-cobro-${pref2.prefactura!.id}`);
      expect(btnCobro1.className).toContain('min-h-[44px]');
      expect(btnCobro2.className).toContain('min-h-[44px]');
    });

    it('P2.4: Touch action advance buttons in OrderKanbanView satisfy min-h-[48px]', () => {
      useOrderStore.setState({
        ventas: [
          {
            id: 'ord-adv-creado',
            numeroPedido: 'PED-CREADO-01',
            clienteNombre: 'Hotel Bahía Bella',
            estado: 'CREADO',
            lineas: [{ id: 'l-adv-1', sku: 'PAR-01', nombre: 'Pargo Rojo', cantidadSolicitada: 3, precio: 32000 }],
            total: 96000,
          } as any,
          {
            id: 'ord-adv-pausado',
            numeroPedido: 'PED-PAUSADO-02',
            clienteNombre: 'Catering Gourmet',
            estado: 'PAUSADO',
            lineas: [{ id: 'l-adv-2', sku: 'MER-01', nombre: 'Merluza', cantidadSolicitada: 2, precio: 25000 }],
            total: 50000,
          } as any,
        ],
        quotations: [],
      });

      render(<OrderKanbanView onEditOrder={vi.fn()} />);

      // Botón de avance en Creado (Por Alistar)
      const btnAdvanceCreado = screen.getByTestId('btn-advance-ord-adv-creado');
      expect(btnAdvanceCreado).toBeInTheDocument();
      expect(btnAdvanceCreado.className).toContain('min-h-[48px]');

      // Botón Reanudar en Pausados
      const btnReanudar = screen.getByTestId('btn-advance-ord-adv-pausado');
      expect(btnReanudar).toBeInTheDocument();
      expect(btnReanudar.className).toContain('min-h-[48px]');
      expect(btnReanudar).toHaveTextContent(/Reanudar/i);
    });
  });

  // =========================================================================
  // PROBE 3: Non-mutating Sort & Object Freeze Invariance
  // =========================================================================
  describe('Probe 3: Non-mutating Sort & Object Freeze Invariance', () => {
    it('P3.1: Deeply frozen array of movements does not throw TypeError on render and outputs descending chronology', () => {
      const turnoMock: any = Object.freeze({
        id: 'TURNO-ADV-103',
        cajaId: 'CAJA-ADV-1',
        usuarioId: 'usr-challenger-m3',
        fechaApertura: '2026-10-29T06:00:00Z',
        baseInicial: 100000,
        saldoTeoricoGlobal: 400000,
        totalEfectivo: 400000,
        totalDatafono: 0,
        totalTransferencias: 0,
        estado: 'ABIERTO',
      });

      // 4 movimientos desordenados y profundamente congelados
      const m1 = Object.freeze({
        id: 'mov-t1',
        turnoId: 'TURNO-ADV-103',
        tipo: 'INGRESO_VENTA',
        monto: 50000,
        metodoPago: 'EFECTIVO',
        concepto: 'Venta 07:00 AM (Primera)',
        createdAt: '2026-10-29T07:00:00.000Z',
      });

      const m2 = Object.freeze({
        id: 'mov-t4',
        turnoId: 'TURNO-ADV-103',
        tipo: 'INGRESO_VENTA',
        monto: 90000,
        metodoPago: 'EFECTIVO',
        concepto: 'Venta 15:30 PM (Última)',
        createdAt: '2026-10-29T15:30:00.000Z',
      });

      const m3 = Object.freeze({
        id: 'mov-t2',
        turnoId: 'TURNO-ADV-103',
        tipo: 'EGRESO_GASTO',
        categoriaEgreso: 'Fletes',
        monto: 20000,
        metodoPago: 'EFECTIVO',
        concepto: 'Flete 09:15 AM (Segunda)',
        createdAt: '2026-10-29T09:15:00.000Z',
      });

      const m4 = Object.freeze({
        id: 'mov-t3',
        turnoId: 'TURNO-ADV-103',
        tipo: 'EGRESO_GASTO',
        categoriaEgreso: 'Pescado',
        monto: 40000,
        metodoPago: 'EFECTIVO',
        concepto: 'Compra Pescado 12:00 PM (Tercera)',
        createdAt: '2026-10-29T12:00:00.000Z',
      });

      // El array exterior está congelado. Si se usa .sort() in situ, JS arrojará TypeError
      const frozenList = Object.freeze([m1, m2, m3, m4]);

      vi.spyOn(cashService, 'getTurnoActivo').mockReturnValue(turnoMock);
      vi.spyOn(cashService, 'getMovimientos').mockReturnValue(frozenList as any);

      // Verificación empírica de no excepción
      expect(() => render(<CashFlowView />)).not.toThrow();

      // Verificar orden descendente en las filas: Última (15:30) -> Tercera (12:00) -> Segunda (09:15) -> Primera (07:00)
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('Venta 15:30 PM (Última)');
      expect(rows[2]).toHaveTextContent('Compra Pescado 12:00 PM (Tercera)');
      expect(rows[3]).toHaveTextContent('Flete 09:15 AM (Segunda)');
      expect(rows[4]).toHaveTextContent('Venta 07:00 AM (Primera)');

      // Verificar que el array original no fue mutado
      expect(frozenList[0].id).toBe('mov-t1');
      expect(frozenList[1].id).toBe('mov-t4');
      expect(frozenList[2].id).toBe('mov-t2');
      expect(frozenList[3].id).toBe('mov-t3');
    });

    it('P3.2: Empty and single-element frozen arrays do not throw errors', () => {
      const turnoMock: any = {
        id: 'TURNO-ADV-EMPTY',
        cajaId: 'CAJA-ADV-1',
        usuarioId: 'usr-challenger-m3',
        fechaApertura: '2026-10-29T06:00:00Z',
        baseInicial: 100000,
        saldoTeoricoGlobal: 100000,
        totalEfectivo: 100000,
        totalDatafono: 0,
        totalTransferencias: 0,
        estado: 'ABIERTO',
      };

      vi.spyOn(cashService, 'getTurnoActivo').mockReturnValue(turnoMock);
      vi.spyOn(cashService, 'getMovimientos').mockReturnValue(Object.freeze([]) as any);

      expect(() => render(<CashFlowView />)).not.toThrow();
      expect(screen.getByText(/No hay transacciones en este filtro/i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // PROBE 4: Debounce & Performance Stress
  // =========================================================================
  describe('Probe 4: Debounce & Performance Stress', () => {
    it('P4.1: Fast burst typing does not trigger synchronous filtering until 200ms debounce window settles', () => {
      vi.useFakeTimers();

      useOrderStore.setState({
        ventas: [
          {
            id: 'ord-stress-1',
            numeroPedido: 'PED-ALPHA-101',
            clienteNombre: 'Restaurante Alpha',
            estado: 'CREADO',
            lineas: [{ id: 'l-s1', sku: 'ALP-01', nombre: 'Albacora', cantidadSolicitada: 5, precio: 30000 }],
            total: 150000,
          } as any,
          {
            id: 'ord-stress-2',
            numeroPedido: 'PED-BETA-202',
            clienteNombre: 'Comercializadora Beta',
            estado: 'CREADO',
            lineas: [{ id: 'l-s2', sku: 'BET-01', nombre: 'Bagre', cantidadSolicitada: 4, precio: 22000 }],
            total: 88000,
          } as any,
          {
            id: 'ord-stress-3',
            numeroPedido: 'PED-GAMMA-303',
            clienteNombre: 'Supermercado Gamma',
            estado: 'CREADO',
            lineas: [{ id: 'l-s3', sku: 'GAM-01', nombre: 'Gamba', cantidadSolicitada: 10, precio: 40000 }],
            total: 400000,
          } as any,
        ],
        quotations: [],
      });

      render(<OrderKanbanView onEditOrder={vi.fn()} />);

      const searchInput = screen.getByTestId('kanban-search-input');

      // Inicialmente las 3 órdenes están presentes
      expect(screen.getByText('PED-ALPHA-101')).toBeInTheDocument();
      expect(screen.getByText('PED-BETA-202')).toBeInTheDocument();
      expect(screen.getByText('PED-GAMMA-303')).toBeInTheDocument();

      // Ráfaga rápida: escribir 'A', esperar 50ms, escribir 'Al', esperar 50ms, escribir 'Alph', esperar 50ms, escribir 'Alpha'
      // Tiempo total: 150ms (ningún intervalo >= 200ms)
      fireEvent.change(searchInput, { target: { value: 'A' } });
      act(() => { vi.advanceTimersByTime(50); });

      // Las 3 órdenes DEBEN seguir en el DOM porque no han pasado 200ms de inactividad
      expect(screen.getByText('PED-ALPHA-101')).toBeInTheDocument();
      expect(screen.getByText('PED-BETA-202')).toBeInTheDocument();
      expect(screen.getByText('PED-GAMMA-303')).toBeInTheDocument();

      fireEvent.change(searchInput, { target: { value: 'Al' } });
      act(() => { vi.advanceTimersByTime(50); });
      expect(screen.getByText('PED-BETA-202')).toBeInTheDocument();
      expect(screen.getByText('PED-GAMMA-303')).toBeInTheDocument();

      fireEvent.change(searchInput, { target: { value: 'Alpha' } });
      act(() => { vi.advanceTimersByTime(100); });
      // Aún pasaron sólo 100ms desde el último cambio, por ende Beta y Gamma siguen visibles
      expect(screen.getByText('PED-BETA-202')).toBeInTheDocument();
      expect(screen.getByText('PED-GAMMA-303')).toBeInTheDocument();

      // Ahora avanzamos 100ms adicionales (total 200ms desde el último cambio)
      act(() => { vi.advanceTimersByTime(100); });

      // Ahora el debounce se resuelve: sólo Alpha debe estar visible
      expect(screen.getByText('PED-ALPHA-101')).toBeInTheDocument();
      expect(screen.queryByText('PED-BETA-202')).not.toBeInTheDocument();
      expect(screen.queryByText('PED-GAMMA-303')).not.toBeInTheDocument();

      vi.useRealTimers();
    });

    it('P4.2: Clearing search input restores full list after debounce settle', () => {
      vi.useFakeTimers();

      useOrderStore.setState({
        ventas: [
          {
            id: 'ord-clr-1',
            numeroPedido: 'PED-1',
            clienteNombre: 'Cliente Uno',
            estado: 'CREADO',
            lineas: [],
            total: 10000,
          } as any,
          {
            id: 'ord-clr-2',
            numeroPedido: 'PED-2',
            clienteNombre: 'Cliente Dos',
            estado: 'CREADO',
            lineas: [],
            total: 20000,
          } as any,
        ],
        quotations: [],
      });

      render(<OrderKanbanView onEditOrder={vi.fn()} />);

      const searchInput = screen.getByTestId('kanban-search-input');

      // Filtrar a Uno
      fireEvent.change(searchInput, { target: { value: 'Uno' } });
      act(() => { vi.advanceTimersByTime(200); });
      expect(screen.getByText('PED-1')).toBeInTheDocument();
      expect(screen.queryByText('PED-2')).not.toBeInTheDocument();

      // Limpiar input
      fireEvent.change(searchInput, { target: { value: '' } });
      act(() => { vi.advanceTimersByTime(200); });

      // Ambos vuelven a estar visibles
      expect(screen.getByText('PED-1')).toBeInTheDocument();
      expect(screen.getByText('PED-2')).toBeInTheDocument();

      vi.useRealTimers();
    });
  });
});
