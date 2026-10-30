import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartPanel } from '../views/pos/components/CartPanel';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';

describe('Requisito Asesor de Mostrador: Segregación Estricta sin Sección de Cobro', () => {
  const dummyLineas = [
    {
      productoId: 'p1',
      sku: '0000',
      nombre: 'PARARRAYO / VARILLA COBRE 5/8',
      cantidad: 2,
      precioLista: 45000,
      precioFinal: 45000,
      descuentoPct: 0,
      subtotal: 90000,
      unidad: 'UND',
      impuestoIvaPct: 0,
    } as any,
  ];

  const defaultProps = {
    lineas: dummyLineas,
    cliente: { id: 'c1', identificacion: '901475457', nombre: 'CONSTRUCTORA BOLIVAR S.A.', tipoPrecio: 'DETAL' } as any,
    descuentoGlobalPct: 0,
    descuentoGlobalValor: 0,
    totales: { subtotal: 90000, descuento: 0, totalFinal: 90000 },
    drafts: [],
    activeDraftId: null,
    stock: {},
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
    onPagar: vi.fn(),
    onGuardarBorrador: vi.fn(),
    onSetActiveDraftId: vi.fn(),
    onSetDrafts: vi.fn(),
    onSetDescuentoGlobal: vi.fn(),
    isTurnoAbierto: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Si el usuario es Asesor de Mostrador, NO se muestra la sección de cobro (PaymentPanel) y se muestra el botón exclusivo de Emitir Preventa', () => {
    render(
      <CartPanel
        {...defaultProps}
        isAsesorMostrador={true}
      />
    );

    // No debe existir el botón PAGAR ni la sección de cobro
    expect(screen.queryByText(/PAGAR/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Total a Pagar/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/⚡ Efectivo Exacto/i)).not.toBeInTheDocument();

    // Debe mostrar la cabecera de mostrador y el botón exclusivo de emisión
    expect(screen.getByText(/Puesto de Mostrador/i)).toBeInTheDocument();
    expect(screen.getByText(/Cobro en Ventanilla/i)).toBeInTheDocument();
    const btnEmitir = screen.getByTestId('btn-emitir-preventa-mostrador');
    expect(btnEmitir).toBeInTheDocument();
    expect(btnEmitir).toHaveTextContent(/EMITIR PREVENTA \/ COMANDA \(F6\)/i);

    // Al hacer clic, abre el modal de confirmación y al confirmar emite el borrador/preventa
    fireEvent.click(btnEmitir);
    const btnConfirmar = screen.getByRole('button', { name: /confirmar y emitir/i });
    fireEvent.click(btnConfirmar);
    expect(defaultProps.onGuardarBorrador).toHaveBeenCalledTimes(1);
  });

  it('2. Si el usuario NO es Asesor de Mostrador (Caja/Admin directo), se muestra la sección de cobro normal', () => {
    // Configurar tenant general y rol admin
    useAuthStore.setState({
      activeTenant: { id: 'tenant-01', razonSocial: 'Pezcadería La Central', nit: '111', ciudad: 'Bogotá', regimenTributario: 'COMUN', activo: true, createdAt: '' },
    } as any);
    useAppStore.setState({
      userRole: 'admin',
      currentUser: { id: 'admin-1', nombre: 'Admin General', rol: 'admin', cargo: 'ADMINISTRADOR' } as any,
    });

    render(
      <CartPanel
        {...defaultProps}
        isAsesorMostrador={false}
      />
    );

    // Debe mostrar el panel de cobro PaymentPanel
    expect(screen.getByText(/TOTAL A LIQUIDAR/i)).toBeInTheDocument();
    expect(screen.getByTestId('btn-efectivo-exacto-directo')).toBeInTheDocument();
    expect(screen.queryByTestId('btn-emitir-preventa-mostrador')).not.toBeInTheDocument();
  });
});
