import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LineaVentaRow } from '../views/pos/components/LineaVentaRow';
import { LiveComandasQueuePanel } from '../views/pos/components/LiveComandasQueuePanel';
import { DirectCashierCheckoutPanel } from '../views/pos/components/DirectCashierCheckoutPanel';
import POSView from '../views/POSView';
import type { CartDraft, LineaVenta } from '../types/pos.types';

describe('SPEC-054: Rediseño Ergonómico de Carrito y Modo Cajero Híbrido FIFO', () => {
  const mockLineaKG: LineaVenta = {
    productoId: 'p-salmon',
    sku: 'SALM-01',
    nombre: 'Salmón Chileno Premium',
    cantidad: 2.5,
    unidad: 'KG',
    precioLista: 48000,
    descuentoPct: 0,
    precioFinal: 48000,
    totalLinea: 120000,
    precioCompra: 32000,
    esPesoManual: false,
  };

  const mockLineaUND: LineaVenta = {
    productoId: 'p-atun-lata',
    sku: 'ATUN-LATA',
    nombre: 'Atún en Aceite de Oliva 180g',
    cantidad: 3,
    unidad: 'UNIDAD',
    precioLista: 15000,
    descuentoPct: 10,
    precioFinal: 13500,
    totalLinea: 40500,
    precioCompra: 9000,
    esPesoManual: false,
  };

  const mockDrafts: CartDraft[] = [
    {
      id: 'draft-101',
      alias: 'PRE-101 (Diego Díaz)',
      cliente: { id: 'c1', nombre: 'Restaurante Mar y Sol', identificacion: '900.123.456' },
      lineas: [mockLineaKG],
      descuentoGlobal: 0,
      total: 120000,
      totalFinal: 120000,
      fechaGuardado: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      asesorNombre: 'Diego Díaz',
      notas: 'Filetear sin espinas',
    },
    {
      id: 'draft-102',
      alias: 'PRE-102 (Santiago Pallares)',
      cliente: { id: 'c2', nombre: 'Pescadería El Puerto', identificacion: '800.789.012' },
      lineas: [mockLineaUND],
      descuentoGlobal: 0,
      total: 40500,
      totalFinal: 40500,
      fechaGuardado: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      asesorNombre: 'Santiago Pallares',
      notas: 'Empacar al vacío',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 1. PRUEBAS DE LineaVentaRow: Ergonomía de Alta Densidad y Opciones 1 y 2 ──
  describe('1. LineaVentaRow: Ergonomía Compacta & Edición Rápida (Opciones 1 y 2)', () => {
    it('1.1. Renderiza el nombre en primer plano visible y subtotal prominente en verde', () => {
      render(
        <LineaVentaRow
          linea={mockLineaKG}
          stockDisponible={25}
          precioFinalDisplay={48000}
          onUpdateCantidad={vi.fn()}
          onUpdateDescuentoLinea={vi.fn()}
          onRemove={vi.fn()}
          onWeightRead={vi.fn()}
          onAplicarPrecioHistorico={vi.fn()}
          onResetPrecio={vi.fn()}
        />
      );

      const nameElem = screen.getByTestId('cart-item-name-p-salmon');
      expect(nameElem).toBeInTheDocument();
      expect(nameElem.textContent).toBe('Salmón Chileno Premium');

      // Badge de Kilos
      expect(screen.getByText('⚖️ KG')).toBeInTheDocument();

      // Subtotal de línea
      const priceElem = screen.getByTestId('cart-item-price-p-salmon');
      expect(priceElem.textContent).toContain('120.000');
      expect(priceElem.className).toContain('text-emerald');
    });

    it('1.2. Permite edición directa de cantidad con auto-foco y teclado táctil (Opción 2)', () => {
      const mockUpdate = vi.fn();
      render(
        <LineaVentaRow
          linea={mockLineaKG}
          stockDisponible={25}
          precioFinalDisplay={48000}
          onUpdateCantidad={mockUpdate}
          onUpdateDescuentoLinea={vi.fn()}
          onRemove={vi.fn()}
          onWeightRead={vi.fn()}
          onAplicarPrecioHistorico={vi.fn()}
          onResetPrecio={vi.fn()}
        />
      );

      const input = screen.getByTestId('input-cantidad') as HTMLInputElement;
      expect(input.value).toBe('2.5');

      // Simular cambio manual de peso a 3.75 kg
      fireEvent.change(input, { target: { value: '3.75' } });

      expect(mockUpdate).toHaveBeenCalledWith('p-salmon', 3.75);
    });

    it('1.3. Los botones táctiles de incremento y decremento ejecutan el ajuste (Opción 1)', () => {
      const mockUpdate = vi.fn();
      render(
        <LineaVentaRow
          linea={mockLineaUND}
          stockDisponible={50}
          precioFinalDisplay={13500}
          onUpdateCantidad={mockUpdate}
          onUpdateDescuentoLinea={vi.fn()}
          onRemove={vi.fn()}
          onWeightRead={vi.fn()}
          onAplicarPrecioHistorico={vi.fn()}
          onResetPrecio={vi.fn()}
        />
      );

      const btnInc = screen.getByTestId('btn-aumentar-cantidad');
      fireEvent.click(btnInc);
      expect(mockUpdate).toHaveBeenCalledWith('p-atun-lata', 4);

      const btnDec = screen.getByTestId('btn-disminuir-cantidad');
      fireEvent.click(btnDec);
      expect(mockUpdate).toHaveBeenCalledWith('p-atun-lata', 2);
    });
  });

  // ── 2. PRUEBAS DE LiveComandasQueuePanel: Cola FIFO en Vivo ──
  describe('2. LiveComandasQueuePanel: Visualización y Filtrado de Comandas en Vivo', () => {
    it('2.1. Renderiza las tarjetas de preventas con consecutivo, asesor, notas y total a cobrar', () => {
      const mockSelect = vi.fn();
      render(
        <LiveComandasQueuePanel
          comandas={mockDrafts}
          selectedComandaId={null}
          onSelectComanda={mockSelect}
          onRefresh={vi.fn()}
        />
      );

      expect(screen.getByText('Cola en Vivo')).toBeInTheDocument();
      expect(screen.getByTestId('comandas-counter-badge').textContent).toContain('2 comandas');

      // Tarjetas de comandas
      expect(screen.getByText(/PRE-101/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Diego Díaz/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Filetear sin espinas/i)).toBeInTheDocument();
      expect(screen.getByText('$120.000')).toBeInTheDocument();

      expect(screen.getByText(/PRE-102/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Santiago Pallares/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Empacar al vacío/i)).toBeInTheDocument();
      expect(screen.getByText('$40.500')).toBeInTheDocument();
    });

    it('2.2. Permite filtrar la cola en tiempo real por nombre de asesor o turno', () => {
      render(
        <LiveComandasQueuePanel
          comandas={mockDrafts}
          selectedComandaId={null}
          onSelectComanda={vi.fn()}
        />
      );

      const filterInput = screen.getByTestId('input-filter-comandas');
      fireEvent.change(filterInput, { target: { value: 'Santiago' } });

      // Solo Santiago debe ser visible
      expect(screen.queryByText(/Diego Díaz/i)).not.toBeInTheDocument();
      expect(screen.getAllByText(/Santiago Pallares/i).length).toBeGreaterThan(0);
    });

    it('2.3. Dispara la selección al tocar una tarjeta de la cola', () => {
      const mockSelect = vi.fn();
      render(
        <LiveComandasQueuePanel
          comandas={mockDrafts}
          selectedComandaId="draft-101"
          onSelectComanda={mockSelect}
        />
      );

      const card2 = screen.getByTestId('comanda-card-draft-102');
      fireEvent.click(card2);

      expect(mockSelect).toHaveBeenCalledWith(mockDrafts[1]);
    });
  });

  // ── 3. PRUEBAS DE DirectCashierCheckoutPanel: Liquidación y Cobro Fricción Cero ──
  describe('3. DirectCashierCheckoutPanel: Liquidación Rápida con Billetes y Vueltas', () => {
    it('3.1. Renderiza el total a cobrar gigante y selector de métodos de pago F1/F2/F3', () => {
      render(
        <DirectCashierCheckoutPanel
          activeComanda={mockDrafts[0]}
          lineas={[mockLineaKG]}
          totalFinal={120000}
          subtotal={120000}
          onProcesarPago={vi.fn()}
        />
      );

      const totalDisplay = screen.getByTestId('cashier-total-final');
      expect(totalDisplay.textContent).toContain('120.000');

      expect(screen.getByTestId('btn-metodo-efectivo')).toBeInTheDocument();
      expect(screen.getByTestId('btn-metodo-datafono')).toBeInTheDocument();
      expect(screen.getByTestId('btn-metodo-transferencia')).toBeInTheDocument();
    });

    it('3.2. Calcula vueltas en tiempo real al ingresar efectivo o seleccionar billetes COP', () => {
      render(
        <DirectCashierCheckoutPanel
          activeComanda={mockDrafts[0]}
          lineas={[mockLineaKG]}
          totalFinal={120000}
          onProcesarPago={vi.fn()}
        />
      );

      // Ingresar $150.000 en efectivo recibido
      const inputEfectivo = screen.getByTestId('input-efectivo-recibido');
      fireEvent.change(inputEfectivo, { target: { value: '150000' } });

      // Debe calcular vueltas = $30.000
      const displayVueltas = screen.getByTestId('display-vueltas');
      expect(displayVueltas.textContent).toContain('30.000');

      // Botón cobrar e imprimir debe estar habilitado
      const btnCobrar = screen.getByTestId('btn-cobrar-imprimir');
      expect(btnCobrar).not.toBeDisabled();
    });

    it('3.3. Muestra aviso de monto incompleto si el efectivo ingresado es insuficiente', () => {
      render(
        <DirectCashierCheckoutPanel
          activeComanda={mockDrafts[0]}
          lineas={[mockLineaKG]}
          totalFinal={120000}
          onProcesarPago={vi.fn()}
        />
      );

      const inputEfectivo = screen.getByTestId('input-efectivo-recibido');
      fireEvent.change(inputEfectivo, { target: { value: '100000' } });

      expect(screen.getByText(/Monto Incompleto/i)).toBeInTheDocument();
      expect(screen.getByText(/Faltan \$20\.000/i)).toBeInTheDocument();

      const btnCobrar = screen.getByTestId('btn-cobrar-imprimir');
      expect(btnCobrar).toBeDisabled();
    });

    it('3.4. Dispara el procesamiento de pago con método y cálculo de vueltas exacto', () => {
      const mockPagar = vi.fn();
      render(
        <DirectCashierCheckoutPanel
          activeComanda={mockDrafts[0]}
          lineas={[mockLineaKG]}
          totalFinal={120000}
          onProcesarPago={mockPagar}
        />
      );

      const inputEfectivo = screen.getByTestId('input-efectivo-recibido');
      fireEvent.change(inputEfectivo, { target: { value: '200000' } });

      const btnCobrar = screen.getByTestId('btn-cobrar-imprimir');
      fireEvent.click(btnCobrar);

      expect(mockPagar).toHaveBeenCalledWith({
        metodo: 'EFECTIVO',
        montoRecibido: 200000,
        vueltas: 80000,
      });
    });
  });

  // ── 4. PRUEBAS DE INTEGRACIÓN: Alternancia Modo Cajero en POSView ──
  describe('4. POSView: Alternancia a Modo Caja Única (Cajero)', () => {
    it('4.1. Renderiza el botón toggle de Modo Caja Única en la barra superior', () => {
      render(<POSView />);
      const btnToggle = screen.getByTestId('btn-toggle-modo-cajero');
      expect(btnToggle).toBeInTheDocument();
    });

    it('4.2. Permite conmutar entre Catálogo y la Cola en Vivo con el botón toggle', () => {
      render(<POSView />);
      const btnToggle = screen.getByTestId('btn-toggle-modo-cajero');

      // Si no estaba activo, hacer clic para activarlo
      fireEvent.click(btnToggle);

      expect(screen.getByTestId('modo-cajero-workspace')).toBeInTheDocument();
      expect(screen.getByTestId('live-comandas-queue-panel')).toBeInTheDocument();
      expect(screen.getByTestId('direct-cashier-checkout-panel')).toBeInTheDocument();

      // Segundo clic regresa a catálogo
      fireEvent.click(btnToggle);
      expect(screen.getByTestId('pos-catalog-glass-card')).toBeInTheDocument();
    });
  });
});
