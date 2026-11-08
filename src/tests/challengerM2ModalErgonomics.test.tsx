import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { POSSecondaryActionsModal } from '../views/pos/components/POSSecondaryActionsModal';
import { CartPanel } from '../views/pos/components/CartPanel';
import type { CartDraft, LineaVenta } from '../types/pos.types';

describe('CHALLENGER M2 EMPIRICAL SUITE: Modal Lifecycle, Accessibility & Fitts Touch Targets', () => {
  const mockDrafts: CartDraft[] = [
    {
      id: 'draft-1',
      alias: 'Mesa 4 - Don Pedro',
      fechaGuardado: new Date('2026-11-07T14:30:00Z').toISOString(),
      cliente: { id: 'c-1', nombre: 'Don Pedro', identificacion: '12345678' } as any,
      lineas: [
        {
          productoId: 'p-1',
          sku: 'MOJ-01',
          nombre: 'Mojarra Roja',
          cantidad: 3,
          unidad: 'KG',
          precioLista: 18000,
          descuentoPct: 0,
          precioFinal: 18000,
          totalLinea: 54000,
          precioCompra: 12000,
          esPesoManual: true,
        },
      ],
      total: 54000,
      totalFinal: 54000,
      descuentoGlobal: 0,
    },
    {
      id: 'draft-2',
      alias: 'Cliente Mostrador Rápido',
      fechaGuardado: new Date('2026-11-07T15:00:00Z').toISOString(),
      cliente: null,
      lineas: [
        {
          productoId: 'p-2',
          sku: 'CAM-01',
          nombre: 'Camarón Tigre',
          cantidad: 1,
          unidad: 'KG',
          precioLista: 45000,
          descuentoPct: 0,
          precioFinal: 45000,
          totalLinea: 45000,
          precioCompra: 30000,
          esPesoManual: true,
        },
      ],
      total: 45000,
      totalFinal: 45000,
      descuentoGlobal: 0,
    },
  ];

  const defaultModalProps = {
    isOpen: true,
    onClose: vi.fn(),
    isTurnoAbierto: true,
    onCerrarTurnoClick: vi.fn(),
    drafts: mockDrafts,
    activeDraftId: null,
    onSelectDraft: vi.fn(),
    onDeleteDraft: vi.fn(),
    onNewParkedSale: vi.fn(),
    onOpenNotasModal: vi.fn(),
    selectedCutNotesCount: 2,
    onLimpiarCarrito: vi.fn(),
    hasLineas: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // SCOPE 1: MODAL LIFECYCLE & ACCESSIBILITY
  // =========================================================================
  describe('Scope 1: Modal Lifecycle (Mounting, Escape, Backdrop, Close Controls)', () => {
    it('1.1 Cuando isOpen es false, el modal no se renderiza en el DOM', () => {
      render(<POSSecondaryActionsModal {...defaultModalProps} isOpen={false} />);
      expect(screen.queryByTestId('pos-secondary-actions-modal')).toBeNull();
    });

    it('1.2 Cuando isOpen es true, se renderiza con role="dialog", aria-modal="true" y aria-labelledby', () => {
      render(<POSSecondaryActionsModal {...defaultModalProps} isOpen={true} />);
      const modal = screen.getByTestId('pos-secondary-actions-modal');
      expect(modal).toBeInTheDocument();
      expect(modal.getAttribute('role')).toBe('dialog');
      expect(modal.getAttribute('aria-modal')).toBe('true');
      expect(modal.getAttribute('aria-labelledby')).toBe('secondary-actions-modal-title');
    });

    it('1.3 Presionar la tecla Escape en window invoca onClose()', () => {
      render(<POSSecondaryActionsModal {...defaultModalProps} isOpen={true} />);
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(defaultModalProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('1.4 Hacer click en el backdrop overlay oscuro invoca onClose()', () => {
      render(<POSSecondaryActionsModal {...defaultModalProps} isOpen={true} />);
      const backdrop = screen.getByTestId('pos-secondary-actions-modal');
      fireEvent.click(backdrop);
      expect(defaultModalProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('1.5 Hacer click dentro del cuerpo del modal (card) NO invoca onClose() (stopPropagation)', () => {
      render(<POSSecondaryActionsModal {...defaultModalProps} isOpen={true} />);
      const modalTitle = screen.getByText('Operaciones de Caja');
      fireEvent.click(modalTitle);
      expect(defaultModalProps.onClose).not.toHaveBeenCalled();
    });

    it('1.6 El botón de cerrar en la cabecera (X) invoca onClose()', () => {
      render(<POSSecondaryActionsModal {...defaultModalProps} isOpen={true} />);
      const btnCloseX = screen.getByTestId('btn-close-secondary-actions-modal');
      fireEvent.click(btnCloseX);
      expect(defaultModalProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('1.7 El botón de cerrar en el footer ("Cerrar") invoca onClose()', () => {
      render(<POSSecondaryActionsModal {...defaultModalProps} isOpen={true} />);
      const btnCloseFooter = screen.getByTestId('btn-close-secondary-modal-footer');
      fireEvent.click(btnCloseFooter);
      expect(defaultModalProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // SCOPE 1B: INTEGRATION WITH CARTPANEL TRIGGERS
  // =========================================================================
  describe('Scope 1b: Triggers de montaje en CartPanel ([⋮] y ⏸ N en espera)', () => {
    const dummyLineas: LineaVenta[] = [
      {
        productoId: 'p-1',
        sku: 'MOJ-01',
        nombre: 'Mojarra Roja',
        cantidad: 2,
        unidad: 'KG',
        precioLista: 18000,
        descuentoPct: 0,
        precioFinal: 18000,
        totalLinea: 36000,
        precioCompra: 12000,
        esPesoManual: true,
      },
    ];

    const defaultCartProps = {
      lineas: dummyLineas,
      cliente: null,
      descuentoGlobalPct: 0,
      descuentoGlobalValor: 0,
      totales: { subtotal: 36000, descuento: 0, totalFinal: 36000 },
      drafts: mockDrafts,
      activeDraftId: null,
      stock: { 'bodega-1': { 'MOJ-01': 50 } },
      bodegaActivaId: 'bodega-1',
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
      onCerrarTurnoClick: vi.fn(),
    };

    it('1b.1 Al hacer click en el botón [⋮] (btn-pos-secondary-actions) en la cabecera, se monta POSSecondaryActionsModal', () => {
      render(<CartPanel {...defaultCartProps} />);

      // Inicialmente el modal no está abierto
      expect(screen.queryByTestId('pos-secondary-actions-modal')).toBeNull();

      // Clic en [⋮]
      const btnTrigger = screen.getByTestId('btn-pos-secondary-actions');
      expect(btnTrigger).toBeInTheDocument();
      fireEvent.click(btnTrigger);

      // Ahora el modal debe estar montado
      expect(screen.getByTestId('pos-secondary-actions-modal')).toBeInTheDocument();
    });

    it('1b.2 Al hacer click en el badge ⏸ N en espera (badge-pedidos-espera), se monta POSSecondaryActionsModal', () => {
      render(<CartPanel {...defaultCartProps} drafts={mockDrafts} />);

      const badgeDrafts = screen.getByTestId('badge-pedidos-espera');
      expect(badgeDrafts).toBeInTheDocument();
      expect(badgeDrafts.textContent).toContain('2 en espera');

      fireEvent.click(badgeDrafts);
      expect(screen.getByTestId('pos-secondary-actions-modal')).toBeInTheDocument();
    });

    it('1b.3 Si drafts está vacío (drafts = []), el badge-pedidos-espera no se renderiza pero [⋮] sigue disponible', () => {
      render(<CartPanel {...defaultCartProps} drafts={[]} />);

      expect(screen.queryByTestId('badge-pedidos-espera')).toBeNull();

      const btnTrigger = screen.getByTestId('btn-pos-secondary-actions');
      expect(btnTrigger).toBeInTheDocument();
      fireEvent.click(btnTrigger);
      expect(screen.getByTestId('pos-secondary-actions-modal')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // SCOPE 3: VACIAR CARRITO & EMPTY STATES
  // =========================================================================
  describe('Scope 3: Vaciar Carrito (Lógica, Estado Vacío, Deshabilitado & Callback)', () => {
    it('3.1 Cuando hasLineas=false (carrito con 0 líneas), Vaciar Carrito está disabled y no ejecuta onLimpiarCarrito', () => {
      render(<POSSecondaryActionsModal {...defaultModalProps} hasLineas={false} />);

      const btnVaciar = screen.getByTestId('btn-action-vaciar-carrito');
      expect(btnVaciar).toBeInTheDocument();
      expect(btnVaciar).toBeDisabled();
      expect(btnVaciar.className).toContain('cursor-not-allowed');
      expect(btnVaciar.textContent).toContain('Carrito sin productos');

      fireEvent.click(btnVaciar);
      expect(defaultModalProps.onLimpiarCarrito).not.toHaveBeenCalled();
      expect(defaultModalProps.onClose).not.toHaveBeenCalled();
    });

    it('3.2 Cuando hasLineas=true, Vaciar Carrito está habilitado, invoca onLimpiarCarrito() y cierra el modal', () => {
      render(<POSSecondaryActionsModal {...defaultModalProps} hasLineas={true} />);

      const btnVaciar = screen.getByTestId('btn-action-vaciar-carrito');
      expect(btnVaciar).toBeInTheDocument();
      expect(btnVaciar).not.toBeDisabled();
      expect(btnVaciar.className).toContain('cursor-pointer');
      expect(btnVaciar.textContent).toContain('Descartar productos actuales');

      fireEvent.click(btnVaciar);
      expect(defaultModalProps.onLimpiarCarrito).toHaveBeenCalledTimes(1);
      expect(defaultModalProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('3.3 Cerrar Turno de Caja respeta isTurnoAbierto (deshabilitado si false, ejecuta callback si true)', () => {
      // Caso 1: Turno cerrado
      const { rerender } = render(
        <POSSecondaryActionsModal {...defaultModalProps} isTurnoAbierto={false} />
      );
      const btnCerrarTurno = screen.getByTestId('btn-action-cerrar-turno');
      expect(btnCerrarTurno).toBeDisabled();
      expect(btnCerrarTurno.textContent).toContain('Turno Cerrado');
      fireEvent.click(btnCerrarTurno);
      expect(defaultModalProps.onCerrarTurnoClick).not.toHaveBeenCalled();

      // Caso 2: Turno abierto
      rerender(<POSSecondaryActionsModal {...defaultModalProps} isTurnoAbierto={true} />);
      expect(btnCerrarTurno).not.toBeDisabled();
      expect(btnCerrarTurno.textContent).toContain('Turno Abierto');
      fireEvent.click(btnCerrarTurno);
      expect(defaultModalProps.onCerrarTurnoClick).toHaveBeenCalledTimes(1);
      expect(defaultModalProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('3.4 Notas de Corte ejecuta onOpenNotasModal() y cierra el modal', () => {
      render(<POSSecondaryActionsModal {...defaultModalProps} selectedCutNotesCount={3} />);

      const btnNotas = screen.getByTestId('btn-action-notas-corte');
      expect(btnNotas).toBeInTheDocument();
      expect(btnNotas.textContent).toContain('3');

      fireEvent.click(btnNotas);
      expect(defaultModalProps.onOpenNotasModal).toHaveBeenCalledTimes(1);
      expect(defaultModalProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('3.5 Ventas en Espera: renderiza lista de borradores y permite recuperar o eliminar', () => {
      render(<POSSecondaryActionsModal {...defaultModalProps} drafts={mockDrafts} />);

      // Título de la sección
      expect(screen.getByText('Ventas en Espera & Multicliente')).toBeInTheDocument();

      // Verifica render de ambos borradores
      expect(screen.getByText('Mesa 4 - Don Pedro')).toBeInTheDocument();
      expect(screen.getByText('Cliente Mostrador Rápido')).toBeInTheDocument();
      expect(screen.getByText('$54.000')).toBeInTheDocument();
      expect(screen.getByText('$45.000')).toBeInTheDocument();

      // Clic en recuperar borrador 1
      const btnRecuperar = screen.getByTestId('draft-select-draft-1');
      fireEvent.click(btnRecuperar);
      expect(defaultModalProps.onSelectDraft).toHaveBeenCalledWith(mockDrafts[0]);
      expect(defaultModalProps.onClose).toHaveBeenCalledTimes(1);

      // Clic en eliminar borrador 2
      const btnEliminar = screen.getByTestId('draft-delete-draft-2');
      fireEvent.click(btnEliminar);
      expect(defaultModalProps.onDeleteDraft).toHaveBeenCalledWith('draft-2', expect.anything());
    });

    it('3.6 Ventas en Espera: muestra estado vacío cuando drafts = []', () => {
      render(<POSSecondaryActionsModal {...defaultModalProps} drafts={[]} />);

      expect(screen.getByText('No hay pedidos en espera')).toBeInTheDocument();
      expect(screen.queryByTestId('draft-select-draft-1')).toBeNull();
    });
  });

  // =========================================================================
  // SCOPE 2: TOUCH TARGETS & ERGONOMICS (FITTS LAW / 44PX-48PX THRESHOLD)
  // =========================================================================
  describe('Scope 2: Touch Targets & Ergonomía Táctil en Botones de Acción', () => {
    it('2.1 Botón "Notas de Corte" tiene padding y altura táctil >= 48px', () => {
      render(<POSSecondaryActionsModal {...defaultModalProps} />);
      const btn = screen.getByTestId('btn-action-notas-corte');
      // Tiene p-3 (12px top, 12px bottom) + icono w-9 h-9 (36px) = 60px de altura
      expect(btn.className).toContain('p-3');
    });

    it('2.2 Botón "Vaciar Carrito" tiene padding y altura táctil >= 48px', () => {
      render(<POSSecondaryActionsModal {...defaultModalProps} />);
      const btn = screen.getByTestId('btn-action-vaciar-carrito');
      expect(btn.className).toContain('p-3');
    });

    it('2.3 Botón "Cerrar Turno de Caja" tiene padding y altura táctil >= 48px', () => {
      render(<POSSecondaryActionsModal {...defaultModalProps} />);
      const btn = screen.getByTestId('btn-action-cerrar-turno');
      expect(btn.className).toContain('p-3');
    });

    it('2.4 Botón de pie "Cerrar" tiene min-h-[44px]', () => {
      render(<POSSecondaryActionsModal {...defaultModalProps} />);
      const btn = screen.getByTestId('btn-close-secondary-modal-footer');
      expect(btn.className).toContain('min-h-[44px]');
    });

    it('2.5 Botón "Suspender & Nueva Venta" e inspección de ergonomía', () => {
      render(<POSSecondaryActionsModal {...defaultModalProps} />);
      const btn = screen.getByTestId('btn-action-suspender-nueva-venta');
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(defaultModalProps.onNewParkedSale).toHaveBeenCalledTimes(1);
      expect(defaultModalProps.onClose).toHaveBeenCalledTimes(1);
    });
  });
});
