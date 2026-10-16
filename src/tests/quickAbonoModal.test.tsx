import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuickAbonoModal } from '../views/ar/components/QuickAbonoModal';
import { useARStore, type InvoiceAR } from '../store/useARStore';
import { useEventStore } from '../store/useEventStore';
import { cashService } from '../services/cashService';

describe('TASK-018-08: QuickAbonoModal Suite (Regla del Niño de 12 Años)', () => {
  const MOCK_INVOICE: InvoiceAR = {
    id: 'FAC-B2B-2026-001',
    clienteId: 'cli-restaurante-01',
    clienteNombre: 'Restaurante El Pescador Colonial',
    clienteIdentificacion: '900.555.123-4',
    fecha: '2026-10-15T10:00:00.000Z',
    fechaVencimiento: '2026-10-25T10:00:00.000Z',
    total: 800000,
    saldo: 500000,
    pagado: 300000,
    pagos: [
      {
        id: 'pgo-previo-1',
        fecha: '2026-10-15T12:00:00.000Z',
        monto: 300000,
        metodo: 'Transferencia',
      },
    ],
  };

  beforeEach(() => {
    useARStore.setState({
      cartera: [MOCK_INVOICE],
    });
    vi.clearAllMocks();
  });

  it('1. no debe renderizarse si isOpen es false o invoice es null', () => {
    const { container } = render(
      <QuickAbonoModal isOpen={false} onClose={() => {}} invoice={MOCK_INVOICE} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('2. debe renderizar en Light Mode WCAG 2.2 AA+ con CERO etiquetas <img> y datos claros', () => {
    const { container } = render(
      <QuickAbonoModal isOpen={true} onClose={() => {}} invoice={MOCK_INVOICE} />
    );

    // Cero imágenes externas (100% SVG con Lucide React)
    const imgElements = container.querySelectorAll('img');
    expect(imgElements.length).toBe(0);

    // Tipografía pizarra accesible sobre fondo claro
    expect(container.firstChild).toHaveClass('text-slate-900');

    // Datos de la factura
    expect(screen.getByText('FAC-B2B-2026-001')).toBeInTheDocument();
    expect(screen.getByText('Restaurante El Pescador Colonial')).toBeInTheDocument();
    expect(screen.getByText('$500.000')).toBeInTheDocument();
  });

  it('3. los botones de monto rápido deben medir >= 48px y ajustar los kilos/monto correctamente', () => {
    render(<QuickAbonoModal isOpen={true} onClose={() => {}} invoice={MOCK_INVOICE} />);

    const btnTotal = screen.getByTestId('btn-abono-total');
    const btn50 = screen.getByTestId('btn-abono-50');
    const btnMas100k = screen.getByTestId('btn-abono-mas-100k');
    const btnLimpiar = screen.getByTestId('btn-abono-limpiar');

    // Comprobar ergonomía táctil >= 48px
    [btnTotal, btn50, btnMas100k, btnLimpiar].forEach((btn) => {
      const className = btn.className;
      expect(
        className.includes('min-h-[48px]') ||
          className.includes('h-12') ||
          className.includes('h-14')
      ).toBe(true);
    });

    // 1. Limpiar a $0
    fireEvent.click(btnLimpiar);
    const inputMonto = screen.getByTestId('input-monto-abono') as HTMLInputElement;
    expect(inputMonto.value).toBe('');

    // 2. Sumar +$100.000
    fireEvent.click(btnMas100k);
    expect(inputMonto.value).toBe('100000');

    // 3. Pagar 50% del saldo (debe ser $250.000)
    fireEvent.click(btn50);
    expect(inputMonto.value).toBe('250000');

    // 4. Pagar 100% Total (debe ser $500.000)
    fireEvent.click(btnTotal);
    expect(inputMonto.value).toBe('500000');
  });

  it('4. debe prevenir abonos superiores al saldo pendiente y bloquear el botón de confirmación', () => {
    render(<QuickAbonoModal isOpen={true} onClose={() => {}} invoice={MOCK_INVOICE} />);

    const inputMonto = screen.getByTestId('input-monto-abono') as HTMLInputElement;

    // Ingresar $600.000 (mayor al saldo de $500.000)
    fireEvent.change(inputMonto, { target: { value: '600000' } });

    expect(screen.getByTestId('alerta-sobre-saldo')).toBeInTheDocument();
    const btnConfirmar = screen.getByTestId('btn-confirmar-abono') as HTMLButtonElement;
    expect(btnConfirmar.disabled).toBe(true);
  });

  it('5. los selectores de método de pago deben medir >= 48px y mostrar referencia para bancos', () => {
    render(<QuickAbonoModal isOpen={true} onClose={() => {}} invoice={MOCK_INVOICE} />);

    const btnEfectivo = screen.getByTestId('metodo-abono-efectivo');
    const btnTransfer = screen.getByTestId('metodo-abono-transferencia');
    const btnDatafono = screen.getByTestId('metodo-abono-datafono');

    // Ergonomía >= 48px
    [btnEfectivo, btnTransfer, btnDatafono].forEach((btn) => {
      const className = btn.className;
      expect(
        className.includes('min-h-[48px]') ||
          className.includes('min-h-[52px]') ||
          className.includes('h-14')
      ).toBe(true);
    });

    // Por defecto es Efectivo (no muestra comprobante)
    expect(screen.queryByTestId('input-comprobante-abono')).toBeNull();

    // Cambiar a Transferencia -> Debe aparecer input de comprobante
    fireEvent.click(btnTransfer);
    expect(screen.getByTestId('input-comprobante-abono')).toBeInTheDocument();
  });

  it('6. el botón de confirmación debe medir >= 56px y aplicar el abono atómicamente', async () => {
    const onAbonoSuccessMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <QuickAbonoModal
        isOpen={true}
        onClose={onCloseMock}
        invoice={MOCK_INVOICE}
        onAbonoSuccess={onAbonoSuccessMock}
      />
    );

    const btnConfirmar = screen.getByTestId('btn-confirmar-abono');

    // Validar altura gigante >= 56px y feedback táctil active:scale-95
    expect(
      btnConfirmar.className.includes('min-h-[56px]') ||
        btnConfirmar.className.includes('h-14')
    ).toBe(true);
    expect(btnConfirmar.className).toContain('active:scale-95');

    // Cambiar a abono parcial de $200.000
    const inputMonto = screen.getByTestId('input-monto-abono');
    fireEvent.change(inputMonto, { target: { value: '200000' } });

    // Confirmar abono
    fireEvent.click(btnConfirmar);

    // Debe invocar onAbonoSuccess y onClose
    expect(onAbonoSuccessMock).toHaveBeenCalledWith('FAC-B2B-2026-001', 200000);
    expect(onCloseMock).toHaveBeenCalled();

    // El store de Cartera debe actualizarse: saldo pasa de $500.000 a $300.000, pagado a $500.000
    const updatedCartera = useARStore.getState().cartera;
    const invActualizada = updatedCartera.find((inv) => inv.id === 'FAC-B2B-2026-001');
    expect(invActualizada?.saldo).toBe(300000);
    expect(invActualizada?.pagado).toBe(500000);
    expect(invActualizada?.pagos.length).toBe(2);
  });
});
