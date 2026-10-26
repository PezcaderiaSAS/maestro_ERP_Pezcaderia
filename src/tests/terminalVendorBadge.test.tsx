import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TerminalVendorBadge } from '../views/pos/components/TerminalVendorBadge';
import { useMultiVendorPosStore } from '../stores/useMultiVendorPosStore';

describe('TASK-034-03: TerminalVendorBadge & useMultiVendorPosStore', () => {
  beforeEach(() => {
    // Resetear store antes de cada prueba
    const store = useMultiVendorPosStore.getState();
    store.setTerminalId('TERM-01');
    store.setVendedorActivo({
      id: 'emp-01',
      nombre: 'Carlos Vendedor',
      rol: 'VENDEDOR',
      pin: '1234',
    });
    store.setTurnoCentralEstado('ABIERTO', 'turno-central-101');
  });

  it('debe renderizar la terminal activa y el nombre del vendedor con estilo V8', () => {
    render(<TerminalVendorBadge />);

    expect(screen.getByText('TERM-01')).toBeInTheDocument();
    expect(screen.getByText('Carlos Vendedor')).toBeInTheDocument();
    expect(screen.getByText(/Caja Central Abierta/i)).toBeInTheDocument();
  });

  it('debe mostrar indicador rojo de alerta cuando la caja central está CERRADA', () => {
    useMultiVendorPosStore.getState().setTurnoCentralEstado('CERRADO', null);

    render(<TerminalVendorBadge />);

    expect(screen.getByText(/Caja Central Cerrada/i)).toBeInTheDocument();
    expect(screen.getByTestId('status-caja-indicator')).toHaveClass('bg-rose-500');
  });

  it('debe permitir cambiar de terminal entre TERM-01 y TERM-08 mediante el selector', () => {
    render(<TerminalVendorBadge />);

    const botonTerminal = screen.getByTestId('btn-toggle-terminal-select');
    fireEvent.click(botonTerminal);

    const opcionTerm4 = screen.getByText('TERM-04');
    fireEvent.click(opcionTerm4);

    expect(useMultiVendorPosStore.getState().terminalId).toBe('TERM-04');
    expect(screen.getByText('TERM-04')).toBeInTheDocument();
  });

  it('debe invocar onCambiarVendedor al hacer clic en el botón de cambio de usuario', () => {
    const onCambiarVendedor = vi.fn();
    render(<TerminalVendorBadge onCambiarVendedor={onCambiarVendedor} />);

    const botonVendedor = screen.getByTestId('btn-cambiar-vendedor');
    fireEvent.click(botonVendedor);

    expect(onCambiarVendedor).toHaveBeenCalledTimes(1);
  });
});
