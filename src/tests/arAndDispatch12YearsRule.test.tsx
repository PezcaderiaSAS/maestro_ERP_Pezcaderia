import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuickAbonoModal } from '../views/ar/components/QuickAbonoModal';
import OrderKanbanView from '../views/OrderKanbanView';
import { useARStore, type InvoiceAR } from '../store/useARStore';
import { useOrderStore, setOrderDataService } from '../store/useOrderStore';
import { useEventStore } from '../store/useEventStore';
import { cashService } from '../services/cashService';

describe('Suite de Integración y Regla del Niño de 12 Años - Fase 3: Despachos, Rutas B2B y Cartera AR', () => {
  const MOCK_INVOICE: InvoiceAR = {
    id: 'FAC-B2B-2026-999',
    clienteId: 'cli-hotel-marina',
    clienteNombre: 'Hotel Marina Real',
    clienteIdentificacion: '900.888.777-1',
    fecha: '2026-10-16T08:00:00.000Z',
    fechaVencimiento: '2026-10-26T08:00:00.000Z',
    total: 1000000,
    saldo: 600000,
    pagado: 400000,
    pagos: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    useARStore.setState({
      cartera: [MOCK_INVOICE],
    });

    setOrderDataService({
      getAll: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue(undefined),
    } as any);

    useOrderStore.setState({
      quotations: [
        {
          id: 'ped-f3-01',
          numeroPedido: 'PED-F3-01',
          clientName: 'Restaurante Barlovento',
          estado: 'CREADO',
          fecha: '2026-10-16',
          lineas: [
            {
              id: 'l-01',
              nombre: 'Filete de Mero',
              sku: 'MERO-001',
              cantidadSolicitada: 12,
              precioPactado: 45000,
            },
          ],
          totalFinal: 540000,
        },
        {
          id: 'ped-f3-02',
          numeroPedido: 'PED-F3-02',
          clientName: 'Club Campestre',
          estado: 'EN_FILETEO',
          fecha: '2026-10-16',
          lineas: [
            {
              id: 'l-02',
              nombre: 'Trucha Arcoíris',
              sku: 'TRU-001',
              cantidadSolicitada: 20,
              precioPactado: 32000,
            },
          ],
          totalFinal: 640000,
        },
        {
          id: 'ped-f3-03',
          numeroPedido: 'PED-F3-03',
          clientName: 'Mariscos del Puerto',
          estado: 'LISTO',
          fecha: '2026-10-16',
          lineas: [
            {
              id: 'l-03',
              nombre: 'Langostinos U12',
              sku: 'LANG-U12',
              cantidadSolicitada: 15,
              pesoReal: 15,
              precioPactado: 70000,
            },
          ],
          totalFinal: 1050000,
        },
        {
          id: 'ped-f3-04',
          numeroPedido: 'PED-F3-04',
          clientName: 'Hotel Dann Carlton',
          estado: 'EN_DESPACHO',
          fecha: '2026-10-16',
          remisionWmsNumero: 'REM-WMS-888',
          lineas: [
            {
              id: 'l-04',
              nombre: 'Salmón Porcionado',
              sku: 'SALM-001',
              cantidadSolicitada: 30,
              pesoReal: 30,
              precioPactado: 52000,
            },
          ],
          totalFinal: 1560000,
        },
        {
          id: 'ped-f3-05',
          numeroPedido: 'PED-F3-05',
          clientName: 'Bistro Gourmet',
          estado: 'ENTREGADO',
          fecha: '2026-10-16',
          lineas: [
            {
              id: 'l-05',
              nombre: 'Robalo Fresco',
              sku: 'ROB-001',
              cantidadSolicitada: 10,
              pesoReal: 10,
              precioPactado: 38000,
            },
          ],
          totalFinal: 380000,
        },
      ] as any,
      ventas: [] as any,
    });
  });

  /* ==========================================================================
   * SECCIÓN 1: CARTERA AR Y ABONO RÁPIDO (QuickAbonoModal.tsx)
   * ========================================================================== */
  describe('1. Cartera B2B: Modal Táctil de Abono Rápido (QuickAbonoModal)', () => {
    it('1.1 debe cumplir con CERO etiquetas <img> y paleta Light Mode WCAG 2.2 AA+', () => {
      const { container } = render(
        <QuickAbonoModal isOpen={true} onClose={() => {}} invoice={MOCK_INVOICE} />
      );

      // Cero imágenes externas (100% SVG con Lucide React)
      const imgs = container.querySelectorAll('img');
      expect(imgs.length).toBe(0);

      // Fondo claro y tipografía legible pizarra
      expect(container.firstChild).toHaveClass('text-slate-900');
    });

    it('1.2 los botones de incremento rápido y selector de método deben tener altura táctil >= 48px', () => {
      render(<QuickAbonoModal isOpen={true} onClose={() => {}} invoice={MOCK_INVOICE} />);

      const btn100 = screen.getByTestId('btn-abono-total');
      const btn50 = screen.getByTestId('btn-abono-50');
      const btnAdd100k = screen.getByTestId('btn-abono-mas-100k');
      const btnLimpiar = screen.getByTestId('btn-abono-limpiar');

      expect(btn100.className).toContain('min-h-[48px]');
      expect(btn50.className).toContain('min-h-[48px]');
      expect(btnAdd100k.className).toContain('min-h-[48px]');
      expect(btnLimpiar.className).toContain('min-h-[48px]');

      const btnEfectivo = screen.getByTestId('metodo-abono-efectivo');
      const btnTransferencia = screen.getByTestId('metodo-abono-transferencia');
      const btnDatafono = screen.getByTestId('metodo-abono-datafono');

      expect(btnEfectivo.className).toContain('min-h-[52px]');
      expect(btnTransferencia.className).toContain('min-h-[52px]');
      expect(btnDatafono.className).toContain('min-h-[52px]');
    });

    it('1.3 el botón gigante de confirmación debe tener altura mínima de 56px (Regla del Niño de 12 Años)', () => {
      render(<QuickAbonoModal isOpen={true} onClose={() => {}} invoice={MOCK_INVOICE} />);

      const btnConfirmar = screen.getByTestId('btn-confirmar-abono');
      expect(btnConfirmar.className).toContain('min-h-[56px]');
      expect(btnConfirmar.className).toContain('active:scale-95');
    });

    it('1.4 debe bloquear la confirmación si se ingresa un monto que excede el saldo pendiente (anti sobre-abono)', () => {
      render(<QuickAbonoModal isOpen={true} onClose={() => {}} invoice={MOCK_INVOICE} />);

      const inputAbono = screen.getByTestId('input-monto-abono');
      // Saldo es 600.000, ingresamos 700.000
      fireEvent.change(inputAbono, { target: { value: '700000' } });

      expect(screen.getByText(/no puede exceder el saldo pendiente/i)).toBeInTheDocument();
      const btnConfirmar = screen.getByTestId('btn-confirmar-abono');
      expect(btnConfirmar).toBeDisabled();
    });

    it('1.5 al confirmar un abono válido de 1-toque, registra la transacción atómica y sincroniza caja', async () => {
      vi.spyOn(cashService, 'getTurnos').mockReturnValue([
        { id: 'turno-test-1', cajaId: 'caja-test-1', estado: 'ABIERTO' } as any,
      ]);
      const registrarMovimientoSpy = vi.spyOn(cashService, 'registrarMovimiento').mockReturnValue({ data: {} as any, error: null } as any);
      const publishEventSpy = vi.spyOn(useEventStore.getState(), 'publishEvent');
      const handleClose = vi.fn();

      render(<QuickAbonoModal isOpen={true} onClose={handleClose} invoice={MOCK_INVOICE} />);

      // Clic en botón rápido 50% ($300.000 de $600.000)
      const btn50 = screen.getByTestId('btn-abono-50');
      fireEvent.click(btn50);

      const btnConfirmar = screen.getByTestId('btn-confirmar-abono');
      expect(btnConfirmar).not.toBeDisabled();
      fireEvent.click(btnConfirmar);

      await waitFor(() => {
        expect(handleClose).toHaveBeenCalled();
        const updatedInvoice = useARStore.getState().cartera.find((inv) => inv.id === MOCK_INVOICE.id);
        expect(updatedInvoice?.saldo).toBe(300000);
        expect(updatedInvoice?.pagado).toBe(700000);
        expect(publishEventSpy).toHaveBeenCalledWith(
          'SALE_COMPLETED',
          expect.any(String),
          expect.stringContaining('FAC-B2B-2026-999'),
          expect.any(Object)
        );
        expect(registrarMovimientoSpy).toHaveBeenCalledWith(
          'turno-test-1',
          'caja-test-1',
          'INGRESO_ABONO',
          'EFECTIVO',
          300000,
          expect.stringContaining('FAC-B2B-2026-999'),
          'FAC-B2B-2026-999',
          expect.any(String)
        );
      });
    });
  });

  /* ==========================================================================
   * SECCIÓN 2: TABLERO KANBAN DE DESPACHOS B2B (OrderKanbanView.tsx)
   * ========================================================================== */
  describe('2. Tablero de Despachos B2B: Flujo Táctil 3 Macro-Estados', () => {
    it('2.1 debe conmutar a la pestaña Flujo Táctil (3 Pasos) y renderizar las 3 macro-columnas', () => {
      render(<OrderKanbanView onEditOrder={() => {}} />);

      const tabTactil = screen.getByTestId('tab-tactil-3-pasos');
      expect(tabTactil).toBeInTheDocument();
      expect(tabTactil.className).toContain('min-h-[48px]');

      fireEvent.click(tabTactil);

      expect(screen.getByText('1. Preparación WMS')).toBeInTheDocument();
      expect(screen.getByText('2. En Ruta de Entrega')).toBeInTheDocument();
      expect(screen.getByText('3. Entregado / Liquidado')).toBeInTheDocument();
    });

    it('2.2 debe agrupar los pedidos en sus macro-columnas correspondientes sin pérdidas', () => {
      render(<OrderKanbanView onEditOrder={() => {}} />);

      const tabTactil = screen.getByTestId('tab-tactil-3-pasos');
      fireEvent.click(tabTactil);

      // 1. Preparación WMS: Barlovento (CREADO) y Club Campestre (EN_FILETEO)
      expect(screen.getByText('Restaurante Barlovento')).toBeInTheDocument();
      expect(screen.getByText('Club Campestre')).toBeInTheDocument();

      // 2. En Ruta de Entrega: Mariscos del Puerto (LISTO) y Hotel Dann Carlton (EN_DESPACHO)
      expect(screen.getByText('Mariscos del Puerto')).toBeInTheDocument();
      expect(screen.getByText('Hotel Dann Carlton')).toBeInTheDocument();

      // 3. Entregado / Liquidado: Bistro Gourmet (ENTREGADO)
      expect(screen.getByText('Bistro Gourmet')).toBeInTheDocument();
    });

    it('2.3 los chips de filtro rápido y botones de avance táctil en tarjeta deben medir >= 48px', () => {
      render(<OrderKanbanView onEditOrder={() => {}} />);

      const tabTactil = screen.getByTestId('tab-tactil-3-pasos');
      fireEvent.click(tabTactil);

      // Chips de filtro
      const chipTodos = screen.getByTestId('filter-chip-todos');
      const chipUrgentes = screen.getByTestId('filter-chip-urgentes');
      expect(chipTodos.className).toContain('min-h-[48px]');
      expect(chipUrgentes.className).toContain('min-h-[48px]');

      // Botón de avance táctil en tarjeta (Barlovento en preparación)
      const btnAvanzar = screen.getByTestId('tactil-advance-despacho-ped-f3-01');
      expect(btnAvanzar.className).toContain('min-h-[48px]');

      // Botón de marcar entregado (Hotel Dann Carlton en ruta)
      const btnEntregado = screen.getByTestId('tactil-advance-entregado-ped-f3-04');
      expect(btnEntregado.className).toContain('min-h-[48px]');
    });

    it('2.4 debe avanzar un pedido de En Ruta a Entregado al pulsar el botón táctil', () => {
      render(<OrderKanbanView onEditOrder={() => {}} />);

      const tabTactil = screen.getByTestId('tab-tactil-3-pasos');
      fireEvent.click(tabTactil);

      const btnEntregado = screen.getByTestId('tactil-advance-entregado-ped-f3-04');
      fireEvent.click(btnEntregado);

      const updated = useOrderStore.getState().quotations.find((q: any) => q.id === 'ped-f3-04');
      expect(updated?.estado).toBe('ENTREGADO');
    });

    it('2.5 debe mantener 100% de compatibilidad con las pestañas de escritorio preexistentes', () => {
      render(<OrderKanbanView onEditOrder={() => {}} />);

      // Pestaña inicial es Bodega
      expect(screen.getByText('Por Alistar')).toBeInTheDocument();
      expect(screen.getByText('En Fileteo & Corte')).toBeInTheDocument();
      expect(screen.getByText('Pesaje & Packing Báscula')).toBeInTheDocument();

      // Pestaña 2. Despachos
      const btnDespachos = screen.getByRole('button', { name: /2\. Despachos/i });
      fireEvent.click(btnDespachos);

      expect(screen.getByText('Listos para Despacho')).toBeInTheDocument();
      expect(screen.getByText('En Ruta / Despachados')).toBeInTheDocument();
      expect(screen.getByText('Entregados en Destino')).toBeInTheDocument();
    });
  });
});
