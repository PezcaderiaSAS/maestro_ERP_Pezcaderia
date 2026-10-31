// src/tests/commercialFlowSupermarket.test.tsx
// Pruebas TDD para el Flujo Comercial Supermercado y Atajos de Teclado F1-F12 (SPEC-047)

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, renderHook, screen, fireEvent } from '@testing-library/react';
import { usePOSKeyboardShortcuts, type POSShortcutHandlers } from '../hooks/usePOSKeyboardShortcuts.ts';
import { InternalQueueTicker } from '../views/pos/components/InternalQueueTicker.tsx';
import { CashierSupermarketTerminal, type SupermarketOrder } from '../views/pos/components/CashierSupermarketTerminal.tsx';
import { SplitPaymentModal } from '../views/pos/components/SplitPaymentModal.tsx';
import { QuickCutNotes } from '../views/pos/components/QuickCutNotes.tsx';

describe('TASK-047-01: usePOSKeyboardShortcuts Hook', () => {
  let handlers: POSShortcutHandlers;

  beforeEach(() => {
    handlers = {
      onF1Help: vi.fn(),
      onF2Cash: vi.fn(),
      onF3Card: vi.fn(),
      onF4Transfer: vi.fn(),
      onF5Refresh: vi.fn(),
      onF6Search: vi.fn(),
      onF8Void: vi.fn(),
      onF9SplitPayment: vi.fn(),
      onF12Checkout: vi.fn(),
      onEscape: vi.fn(),
      onEnter: vi.fn(),
      onArrowUp: vi.fn(),
      onArrowDown: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('dispara los atajos F1 a F12 y previene la acción por defecto del navegador', () => {
    renderHook(() => usePOSKeyboardShortcuts(handlers, { isEnabled: true }));

    const f1Event = new KeyboardEvent('keydown', { key: 'F1', cancelable: true, bubbles: true });
    window.dispatchEvent(f1Event);
    expect(handlers.onF1Help).toHaveBeenCalledTimes(1);
    expect(f1Event.defaultPrevented).toBe(true);

    const f2Event = new KeyboardEvent('keydown', { key: 'F2', cancelable: true, bubbles: true });
    window.dispatchEvent(f2Event);
    expect(handlers.onF2Cash).toHaveBeenCalledTimes(1);
    expect(f2Event.defaultPrevented).toBe(true);

    const f3Event = new KeyboardEvent('keydown', { key: 'F3', cancelable: true, bubbles: true });
    window.dispatchEvent(f3Event);
    expect(handlers.onF3Card).toHaveBeenCalledTimes(1);

    const f4Event = new KeyboardEvent('keydown', { key: 'F4', cancelable: true, bubbles: true });
    window.dispatchEvent(f4Event);
    expect(handlers.onF4Transfer).toHaveBeenCalledTimes(1);

    const f5Event = new KeyboardEvent('keydown', { key: 'F5', cancelable: true, bubbles: true });
    window.dispatchEvent(f5Event);
    expect(handlers.onF5Refresh).toHaveBeenCalledTimes(1);
    expect(f5Event.defaultPrevented).toBe(true);

    const f9Event = new KeyboardEvent('keydown', { key: 'F9', cancelable: true, bubbles: true });
    window.dispatchEvent(f9Event);
    expect(handlers.onF9SplitPayment).toHaveBeenCalledTimes(1);

    const f12Event = new KeyboardEvent('keydown', { key: 'F12', cancelable: true, bubbles: true });
    window.dispatchEvent(f12Event);
    expect(handlers.onF12Checkout).toHaveBeenCalledTimes(1);
    expect(f12Event.defaultPrevented).toBe(true);
  });

  it('soporta navegación vertical y selección con ArrowUp, ArrowDown y Enter', () => {
    renderHook(() => usePOSKeyboardShortcuts(handlers, { isEnabled: true }));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(handlers.onArrowDown).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(handlers.onArrowUp).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(handlers.onEnter).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(handlers.onEscape).toHaveBeenCalledTimes(1);
  });

  it('no captura eventos dentro de inputs o textareas a menos que sea una tecla de función especial', () => {
    renderHook(() => usePOSKeyboardShortcuts(handlers, { isEnabled: true }));

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    // Enviar Enter desde un input -> debe ser ignorado por el handler global para permitir la edición de texto
    const enterInInput = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    input.dispatchEvent(enterInInput);
    expect(handlers.onEnter).not.toHaveBeenCalled();

    // Las teclas de función F1-F12 deben seguir operando incluso si el cursor está en un input
    const f9InInput = new KeyboardEvent('keydown', { key: 'F9', bubbles: true });
    input.dispatchEvent(f9InInput);
    expect(handlers.onF9SplitPayment).toHaveBeenCalledTimes(1);

    document.body.removeChild(input);
  });

  it('se desactiva correctamente si isEnabled es false o el componente se desmonta', () => {
    const { unmount, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => usePOSKeyboardShortcuts(handlers, { isEnabled: enabled }),
      { initialProps: { enabled: false } }
    );

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F1', bubbles: true }));
    expect(handlers.onF1Help).not.toHaveBeenCalled();

    rerender({ enabled: true });
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F1', bubbles: true }));
    expect(handlers.onF1Help).toHaveBeenCalledTimes(1);

    unmount();

    const f2Event = new KeyboardEvent('keydown', { key: 'F2', cancelable: true, bubbles: true });
    window.dispatchEvent(f2Event);
    expect(handlers.onF2Cash).not.toHaveBeenCalled();
  });
});

describe('TASK-047-02: InternalQueueTicker Component', () => {
  it('renderiza el turno activo, el conteo de comandas y el tiempo promedio de espera', () => {
    render(
      <InternalQueueTicker
        currentTurn="T-042"
        pendingCount={4}
        averageWaitMinutes={6}
        isRealtimeConnected={true}
      />
    );

    expect(screen.getByText('T-042')).toBeDefined();
    expect(screen.getByText(/4 en espera/i)).toBeDefined();
    expect(screen.getByText(/~6 min/i)).toBeDefined();
  });

  it('muestra estado neutral cuando no hay comandas en espera', () => {
    render(
      <InternalQueueTicker
        currentTurn={null}
        pendingCount={0}
        averageWaitMinutes={0}
      />
    );

    expect(screen.getByText(/Cola Libre/i)).toBeDefined();
    expect(screen.getByText(/0 en espera/i)).toBeDefined();
  });

  it('permite llamar verbalmente al turno al presionar el botón de llamado', () => {
    const onCallTurnMock = vi.fn();

    render(
      <InternalQueueTicker
        currentTurn="T-042"
        pendingCount={2}
        onCallTurn={onCallTurnMock}
      />
    );

    const callBtn = screen.getByRole('button', { name: /llamar turno/i });
    fireEvent.click(callBtn);
    expect(onCallTurnMock).toHaveBeenCalledWith('T-042');
  });
});

describe('TASK-047-03: CashierSupermarketTerminal Component', () => {
  const sampleOrders: SupermarketOrder[] = [
    {
      id: 'ord-01',
      consecutivoTicket: 'T-001',
      clienteNombre: 'Restaurante El Ancla',
      vendedorNombre: 'Carlos Mostrador',
      montoTotal: 185000,
      itemsCount: 3,
      createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    },
    {
      id: 'ord-02',
      consecutivoTicket: 'T-002',
      clienteNombre: 'Consumidor Final',
      vendedorNombre: 'Ana Ventas',
      montoTotal: 42000,
      itemsCount: 1,
      createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
    },
  ];

  it('renderiza la lista tabular de comandas con formato de moneda en font-mono', () => {
    render(<CashierSupermarketTerminal orders={sampleOrders} />);

    expect(screen.getByText('T-001')).toBeDefined();
    expect(screen.getByText('Restaurante El Ancla')).toBeDefined();
    expect(screen.getByText('T-002')).toBeDefined();
    expect(screen.getByText('Consumidor Final')).toBeDefined();
    expect(screen.getByText(/185\.000/)).toBeDefined();
  });

  it('permite seleccionar una fila al hacer clic y dispara onSelectOrder', () => {
    const onSelectMock = vi.fn();

    render(
      <CashierSupermarketTerminal
        orders={sampleOrders}
        onSelectOrder={onSelectMock}
      />
    );

    const row = screen.getByText('T-002').closest('tr');
    expect(row).not.toBeNull();
    fireEvent.click(row!);
    expect(onSelectMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'ord-02', consecutivoTicket: 'T-002' })
    );
  });

  it('soporta navegación con teclado y apertura de cobro con Enter o F9', () => {
    const onOpenPaymentMock = vi.fn();

    render(
      <CashierSupermarketTerminal
        orders={sampleOrders}
        onOpenPayment={onOpenPaymentMock}
      />
    );

    // Navegar a la segunda fila con ArrowDown
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    // Presionar F9 para cobro dividido
    fireEvent.keyDown(window, { key: 'F9' });
    expect(onOpenPaymentMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'ord-02' }),
      'MIXTO'
    );
  });

  it('filtra las comandas mediante el input de búsqueda rápida', () => {
    render(<CashierSupermarketTerminal orders={sampleOrders} />);

    const searchInput = screen.getByPlaceholderText(/buscar comanda/i);
    fireEvent.change(searchInput, { target: { value: 'Ancla' } });

    expect(screen.getByText('Restaurante El Ancla')).toBeDefined();
    expect(screen.queryByText('Consumidor Final')).toBeNull();
  });

  it('renderiza la barra de atajos visibles en el pie de página', () => {
    render(<CashierSupermarketTerminal orders={sampleOrders} />);

    expect(screen.getByText(/F1 Ayuda/i)).toBeDefined();
    expect(screen.getByText(/F2 Efectivo/i)).toBeDefined();
    expect(screen.getByText(/F9 Dividido/i)).toBeDefined();
    expect(screen.getByText(/F12 Cobrar/i)).toBeDefined();
  });
});

describe('TASK-047-04: SplitPaymentModal Component', () => {
  const sampleOrder = {
    id: 'ord-100',
    consecutivoTicket: 'T-100',
    clienteNombre: 'Pescadería El Puerto',
    montoTotal: 100000,
  };

  it('renderiza el modal con el total a pagar y saldo pendiente inicial', () => {
    render(
      <SplitPaymentModal
        isOpen={true}
        order={sampleOrder}
        onClose={vi.fn()}
        onConfirmPayment={vi.fn()}
      />
    );

    expect(screen.getByText('T-100')).toBeDefined();
    expect(screen.getAllByText(/100\.000/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Cobro Dividido/i)).toBeDefined();
  });

  it('calcula reactivamente el saldo pendiente al fraccionar pagos en múltiples métodos', () => {
    render(
      <SplitPaymentModal
        isOpen={true}
        order={sampleOrder}
        onClose={vi.fn()}
        onConfirmPayment={vi.fn()}
      />
    );

    // Ajustar primera línea (Efectivo) a $60.000
    const amountInputs = screen.getAllByRole('spinbutton');
    fireEvent.change(amountInputs[0], { target: { value: '60000' } });

    // El saldo restante debe ser $40.000
    expect(screen.getAllByText(/40\.000/).length).toBeGreaterThan(0);

    // Agregar segundo método de pago
    const addMethodBtn = screen.getByRole('button', { name: /agregar método/i });
    fireEvent.click(addMethodBtn);

    // Seleccionar Transferencia en el nuevo método y asignar $40.000
    const allAmountInputs = screen.getAllByRole('spinbutton');
    fireEvent.change(allAmountInputs[1], { target: { value: '40000' } });

    // Saldo restante debe ser exactamente $0
    expect(screen.getByText(/Saldo Cubierto/i)).toBeDefined();
  });

  it('calcula el cambio/vueltas cuando el efectivo entregado supera el monto asignado', () => {
    render(
      <SplitPaymentModal
        isOpen={true}
        order={sampleOrder}
        onClose={vi.fn()}
        onConfirmPayment={vi.fn()}
      />
    );

    // Asignar monto exacto de $100.000
    const amountInputs = screen.getAllByRole('spinbutton');
    fireEvent.change(amountInputs[0], { target: { value: '100000' } });

    // Ingresar $150.000 en efectivo entregado
    const cashGivenInput = screen.getByPlaceholderText(/efectivo recibido/i);
    fireEvent.change(cashGivenInput, { target: { value: '150000' } });

    // Cambio calculado debe ser $50.000
    expect(screen.getByText(/50\.000/)).toBeDefined();
    expect(screen.getByText(/Vueltas/i)).toBeDefined();
  });

  it('permite confirmar el cobro cuando el saldo está cubierto al 100%', () => {
    const onConfirmMock = vi.fn();

    render(
      <SplitPaymentModal
        isOpen={true}
        order={sampleOrder}
        onClose={vi.fn()}
        onConfirmPayment={onConfirmMock}
      />
    );

    // Asignar $100.000
    const amountInputs = screen.getAllByRole('spinbutton');
    fireEvent.change(amountInputs[0], { target: { value: '100000' } });

    const confirmBtn = screen.getByRole('button', { name: /confirmar cobro/i });
    expect(confirmBtn).not.toBeDisabled();
    fireEvent.click(confirmBtn);

    expect(onConfirmMock).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'ord-100',
        montoTotal: 100000,
        lineas: expect.arrayContaining([
          expect.objectContaining({ metodo: 'EFECTIVO', monto: 100000 }),
        ]),
      })
    );
  });
});

describe('TASK-047-05: QuickCutNotes Component', () => {
  it('renderiza los chips táctiles estándar de corte de pescado', () => {
    render(<QuickCutNotes selectedNotes={[]} onToggleNote={vi.fn()} />);

    expect(screen.getByText(/Fileteado/i)).toBeDefined();
    expect(screen.getByText(/En Postas/i)).toBeDefined();
    expect(screen.getByText(/Entero Limpio/i)).toBeDefined();
    expect(screen.getByText(/Sin Escama/i)).toBeDefined();
    expect(screen.getByText(/En Mariposa/i)).toBeDefined();
    expect(screen.getByText(/Hielo Extra/i)).toBeDefined();
  });

  it('los botones de corte poseen altura mínima táctil de 48px según la Ley de Fitts', () => {
    render(<QuickCutNotes selectedNotes={[]} onToggleNote={vi.fn()} />);

    const chipBtn = screen.getByRole('button', { name: /fileteado/i });
    expect(chipBtn.className).toContain('min-h-[48px]');
  });

  it('dispara onToggleNote al seleccionar un corte', () => {
    const onToggleMock = vi.fn();

    render(
      <QuickCutNotes
        selectedNotes={['Fileteado']}
        onToggleNote={onToggleMock}
      />
    );

    const postasBtn = screen.getByRole('button', { name: /en postas/i });
    fireEvent.click(postasBtn);
    expect(onToggleMock).toHaveBeenCalledWith('En Postas');
  });

  it('resalta con acento cian los cortes que están seleccionados', () => {
    render(
      <QuickCutNotes
        selectedNotes={['Fileteado']}
        onToggleNote={vi.fn()}
      />
    );

    const fileteadoBtn = screen.getByRole('button', { name: /fileteado/i });
    expect(fileteadoBtn.className).toContain('bg-cyan-500');
  });
});
