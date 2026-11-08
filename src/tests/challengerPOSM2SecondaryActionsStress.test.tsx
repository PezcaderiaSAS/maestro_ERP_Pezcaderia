import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import Swal from 'sweetalert2';
import { POSSecondaryActionsModal } from '../views/pos/components/POSSecondaryActionsModal';
import { CartPanel } from '../views/pos/components/CartPanel';
import { PosDraftService } from '../services/posDraftService';
import type { CartDraft, LineaVenta } from '../types/pos.types';

// Mock SweetAlert2 for predictable headless responses
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockImplementation(() =>
      Promise.resolve({ isConfirmed: true, isDismissed: false, isDenied: false })
    ),
    close: vi.fn(),
  },
}));

// Helper to construct sample line items
const createSampleLine = (id: string, name: string, qty: number, price: number): LineaVenta => ({
  productoId: id,
  sku: `SKU-${id.toUpperCase()}`,
  nombre: name,
  cantidad: qty,
  unidad: 'KG',
  precioLista: price,
  descuentoPct: 0,
  precioFinal: price,
  totalLinea: qty * price,
  precioCompra: price * 0.7,
  esPesoManual: false,
});

// Helper to construct sample drafts
const createSampleDraft = (id: string, alias: string, total: number, active = false): CartDraft => ({
  id,
  alias,
  total,
  descuentoGlobal: 0,
  fechaGuardado: new Date().toISOString(),
  lineas: [
    createSampleLine(`p-${id}-1`, `Producto ${alias} 1`, 2, total / 2),
  ],
  cart: [],
});

describe('CHALLENGER ADVERSARIAL STRESS: Milestone M2 Secondary Actions Modal & Drafts', () => {
  let resolveDraftSpy: any;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    resolveDraftSpy = vi.spyOn(PosDraftService, 'resolveDraft').mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    resolveDraftSpy.mockRestore();
  });

  // ────────────────────────────────────────────────────────────
  // SUITE 1: POSSecondaryActionsModal Isolated Component Tests
  // ────────────────────────────────────────────────────────────
  describe('1. POSSecondaryActionsModal Lifecycle & Accessibility', () => {
    it('debe no renderizar nada cuando isOpen=false', () => {
      const { container } = render(
        <POSSecondaryActionsModal
          isOpen={false}
          onClose={vi.fn()}
          drafts={[]}
          activeDraftId={null}
          onSelectDraft={vi.fn()}
          onDeleteDraft={vi.fn()}
          onNewParkedSale={vi.fn()}
          onLimpiarCarrito={vi.fn()}
          hasLineas={false}
        />
      );

      expect(container.firstChild).toBeNull();
      expect(screen.queryByTestId('pos-secondary-actions-modal')).not.toBeInTheDocument();
    });

    it('debe renderizar el diálogo accesible con roles ARIA correctos cuando isOpen=true', () => {
      render(
        <POSSecondaryActionsModal
          isOpen={true}
          onClose={vi.fn()}
          drafts={[]}
          activeDraftId={null}
          onSelectDraft={vi.fn()}
          onDeleteDraft={vi.fn()}
          onNewParkedSale={vi.fn()}
          onLimpiarCarrito={vi.fn()}
          hasLineas={true}
        />
      );

      const modal = screen.getByTestId('pos-secondary-actions-modal');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveAttribute('role', 'dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby', 'secondary-actions-modal-title');
      expect(screen.getByText('Operaciones de Caja')).toBeInTheDocument();
    });

    it('debe invocar onClose al presionar la tecla Escape', () => {
      const onClose = vi.fn();
      render(
        <POSSecondaryActionsModal
          isOpen={true}
          onClose={onClose}
          drafts={[]}
          activeDraftId={null}
          onSelectDraft={vi.fn()}
          onDeleteDraft={vi.fn()}
          onNewParkedSale={vi.fn()}
          onLimpiarCarrito={vi.fn()}
          hasLineas={false}
        />
      );

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('debe invocar onClose al hacer clic en el backdrop oscurecido', () => {
      const onClose = vi.fn();
      render(
        <POSSecondaryActionsModal
          isOpen={true}
          onClose={onClose}
          drafts={[]}
          activeDraftId={null}
          onSelectDraft={vi.fn()}
          onDeleteDraft={vi.fn()}
          onNewParkedSale={vi.fn()}
          onLimpiarCarrito={vi.fn()}
          hasLineas={false}
        />
      );

      const backdrop = screen.getByTestId('pos-secondary-actions-modal');
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('no debe invocar onClose al hacer clic dentro del contenedor del modal (stopPropagation)', () => {
      const onClose = vi.fn();
      render(
        <POSSecondaryActionsModal
          isOpen={true}
          onClose={onClose}
          drafts={[]}
          activeDraftId={null}
          onSelectDraft={vi.fn()}
          onDeleteDraft={vi.fn()}
          onNewParkedSale={vi.fn()}
          onLimpiarCarrito={vi.fn()}
          hasLineas={false}
        />
      );

      const title = screen.getByText('Operaciones de Caja');
      fireEvent.click(title);
      expect(onClose).not.toHaveBeenCalled();
    });

    it('debe invocar onClose al pulsar el botón X superior y el botón Cerrar del pie', () => {
      const onClose = vi.fn();
      render(
        <POSSecondaryActionsModal
          isOpen={true}
          onClose={onClose}
          drafts={[]}
          activeDraftId={null}
          onSelectDraft={vi.fn()}
          onDeleteDraft={vi.fn()}
          onNewParkedSale={vi.fn()}
          onLimpiarCarrito={vi.fn()}
          hasLineas={false}
        />
      );

      const btnX = screen.getByTestId('btn-close-secondary-actions-modal');
      fireEvent.click(btnX);
      expect(onClose).toHaveBeenCalledTimes(1);

      const btnFooter = screen.getByTestId('btn-close-secondary-modal-footer');
      fireEvent.click(btnFooter);
      expect(onClose).toHaveBeenCalledTimes(2);
    });
  });

  // ────────────────────────────────────────────────────────────
  // SUITE 2: Secondary Actions (Turno, Notas, Vaciar Carrito)
  // ────────────────────────────────────────────────────────────
  describe('2. Secondary Actions Controls (Turno, Notas, Vaciar)', () => {
    it('debe manejar Cerrar Turno habilitado y deshabilitado según isTurnoAbierto', () => {
      const onCerrarTurno = vi.fn();
      const onClose = vi.fn();

      const { rerender } = render(
        <POSSecondaryActionsModal
          isOpen={true}
          onClose={onClose}
          isTurnoAbierto={false}
          onCerrarTurnoClick={onCerrarTurno}
          drafts={[]}
          activeDraftId={null}
          onSelectDraft={vi.fn()}
          onDeleteDraft={vi.fn()}
          onNewParkedSale={vi.fn()}
          onLimpiarCarrito={vi.fn()}
          hasLineas={false}
        />
      );

      const btnTurnoDisabled = screen.getByTestId('btn-action-cerrar-turno');
      expect(btnTurnoDisabled).toBeDisabled();
      expect(screen.getByText('Turno Cerrado')).toBeInTheDocument();

      fireEvent.click(btnTurnoDisabled);
      expect(onCerrarTurno).not.toHaveBeenCalled();

      // Rerender con turno abierto
      rerender(
        <POSSecondaryActionsModal
          isOpen={true}
          onClose={onClose}
          isTurnoAbierto={true}
          onCerrarTurnoClick={onCerrarTurno}
          drafts={[]}
          activeDraftId={null}
          onSelectDraft={vi.fn()}
          onDeleteDraft={vi.fn()}
          onNewParkedSale={vi.fn()}
          onLimpiarCarrito={vi.fn()}
          hasLineas={false}
        />
      );

      const btnTurnoEnabled = screen.getByTestId('btn-action-cerrar-turno');
      expect(btnTurnoEnabled).not.toBeDisabled();
      expect(screen.getByText('Turno Abierto')).toBeInTheDocument();

      fireEvent.click(btnTurnoEnabled);
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onCerrarTurno).toHaveBeenCalledTimes(1);
    });

    it('debe manejar Vaciar Carrito habilitado solo cuando hasLineas=true', () => {
      const onLimpiar = vi.fn();
      const onClose = vi.fn();

      const { rerender } = render(
        <POSSecondaryActionsModal
          isOpen={true}
          onClose={onClose}
          drafts={[]}
          activeDraftId={null}
          onSelectDraft={vi.fn()}
          onDeleteDraft={vi.fn()}
          onNewParkedSale={vi.fn()}
          onLimpiarCarrito={onLimpiar}
          hasLineas={false}
        />
      );

      const btnVaciar = screen.getByTestId('btn-action-vaciar-carrito');
      expect(btnVaciar).toBeDisabled();
      expect(screen.getByText('Carrito sin productos')).toBeInTheDocument();

      fireEvent.click(btnVaciar);
      expect(onLimpiar).not.toHaveBeenCalled();

      rerender(
        <POSSecondaryActionsModal
          isOpen={true}
          onClose={onClose}
          drafts={[]}
          activeDraftId={null}
          onSelectDraft={vi.fn()}
          onDeleteDraft={vi.fn()}
          onNewParkedSale={vi.fn()}
          onLimpiarCarrito={onLimpiar}
          hasLineas={true}
        />
      );

      expect(btnVaciar).not.toBeDisabled();
      expect(screen.getByText('Descartar productos actuales')).toBeInTheDocument();

      fireEvent.click(btnVaciar);
      expect(onLimpiar).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('debe mostrar badge de notas de corte e invocar onOpenNotasModal', () => {
      const onOpenNotas = vi.fn();
      const onClose = vi.fn();

      render(
        <POSSecondaryActionsModal
          isOpen={true}
          onClose={onClose}
          onOpenNotasModal={onOpenNotas}
          selectedCutNotesCount={3}
          drafts={[]}
          activeDraftId={null}
          onSelectDraft={vi.fn()}
          onDeleteDraft={vi.fn()}
          onNewParkedSale={vi.fn()}
          onLimpiarCarrito={vi.fn()}
          hasLineas={false}
        />
      );

      const btnNotas = screen.getByTestId('btn-action-notas-corte');
      expect(btnNotas).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();

      fireEvent.click(btnNotas);
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onOpenNotas).toHaveBeenCalledTimes(1);
    });
  });

  // ────────────────────────────────────────────────────────────
  // SUITE 3: Draft Operations (New, Select, Delete, Empty State)
  // ────────────────────────────────────────────────────────────
  describe('3. Draft Operations Inside POSSecondaryActionsModal', () => {
    it('debe permitir solicitar "Suspender & Nueva Venta" y cerrar el modal', () => {
      const onNewParkedSale = vi.fn();
      const onClose = vi.fn();

      render(
        <POSSecondaryActionsModal
          isOpen={true}
          onClose={onClose}
          drafts={[]}
          activeDraftId={null}
          onSelectDraft={vi.fn()}
          onDeleteDraft={vi.fn()}
          onNewParkedSale={onNewParkedSale}
          onLimpiarCarrito={vi.fn()}
          hasLineas={true}
        />
      );

      const btnNew = screen.getByTestId('btn-action-suspender-nueva-venta');
      fireEvent.click(btnNew);

      expect(onNewParkedSale).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('debe renderizar un empty state limpio con contador en 0 cuando no hay borradores', () => {
      render(
        <POSSecondaryActionsModal
          isOpen={true}
          onClose={vi.fn()}
          drafts={[]}
          activeDraftId={null}
          onSelectDraft={vi.fn()}
          onDeleteDraft={vi.fn()}
          onNewParkedSale={vi.fn()}
          onLimpiarCarrito={vi.fn()}
          hasLineas={false}
        />
      );

      expect(screen.getByText('No hay pedidos en espera')).toBeInTheDocument();
      expect(screen.getByText(/Usa "Suspender & Nueva Venta" o presiona/i)).toBeInTheDocument();
      expect(screen.getByText('F6')).toBeInTheDocument();
      // Contador badge en cabecera
      const badge = screen.getByText('0');
      expect(badge).toBeInTheDocument();
    });

    it('debe listar los borradores con su alias, ítems, total y estado activo si corresponde', () => {
      const drafts: CartDraft[] = [
        createSampleDraft('D-1', 'Restaurante El Ancla', 85000),
        createSampleDraft('D-2', 'Doña María (Terraza)', 32000),
      ];

      render(
        <POSSecondaryActionsModal
          isOpen={true}
          onClose={vi.fn()}
          drafts={drafts}
          activeDraftId="D-2"
          onSelectDraft={vi.fn()}
          onDeleteDraft={vi.fn()}
          onNewParkedSale={vi.fn()}
          onLimpiarCarrito={vi.fn()}
          hasLineas={false}
        />
      );

      expect(screen.getByText('Restaurante El Ancla')).toBeInTheDocument();
      expect(screen.getByText('$85.000')).toBeInTheDocument();

      expect(screen.getByText('Doña María (Terraza)')).toBeInTheDocument();
      expect(screen.getByText('$32.000')).toBeInTheDocument();

      // Debe mostrar la etiqueta "Activo" solo en D-2
      const activeBadge = screen.getByText('Activo');
      expect(activeBadge).toBeInTheDocument();
      expect(screen.getByTestId('draft-card-D-2')).toContainElement(activeBadge);
    });

    it('debe llamar a onSelectDraft y onClose al hacer clic en Recuperar', () => {
      const onSelect = vi.fn();
      const onClose = vi.fn();
      const draft = createSampleDraft('D-RECOVER', 'Cliente Para Recuperar', 50000);

      render(
        <POSSecondaryActionsModal
          isOpen={true}
          onClose={onClose}
          drafts={[draft]}
          activeDraftId={null}
          onSelectDraft={onSelect}
          onDeleteDraft={vi.fn()}
          onNewParkedSale={vi.fn()}
          onLimpiarCarrito={vi.fn()}
          hasLineas={false}
        />
      );

      const btnRecuperar = screen.getByTestId('draft-select-D-RECOVER');
      fireEvent.click(btnRecuperar);

      expect(onSelect).toHaveBeenCalledWith(draft);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('debe llamar a onDeleteDraft con el ID y evento al hacer clic en descartar', () => {
      const onDelete = vi.fn();
      const draft = createSampleDraft('D-DEL', 'Cliente Para Eliminar', 40000);

      render(
        <POSSecondaryActionsModal
          isOpen={true}
          onClose={vi.fn()}
          drafts={[draft]}
          activeDraftId={null}
          onSelectDraft={vi.fn()}
          onDeleteDraft={onDelete}
          onNewParkedSale={vi.fn()}
          onLimpiarCarrito={vi.fn()}
          hasLineas={false}
        />
      );

      const btnDelete = screen.getByTestId('draft-delete-D-DEL');
      fireEvent.click(btnDelete);

      expect(onDelete).toHaveBeenCalledWith('D-DEL', expect.anything());
    });
  });

  // ────────────────────────────────────────────────────────────
  // SUITE 4: CartPanel Integration (Badge, Trigger & Flow)
  // ────────────────────────────────────────────────────────────
  describe('4. CartPanel Integration: Trigger Button, Badge Count & Storage Flow', () => {
    const baseCartProps = {
      lineas: [createSampleLine('p1', 'Trucha Entera', 1, 25000)],
      cliente: null,
      descuentoGlobalPct: 0,
      descuentoGlobalValor: 0,
      totales: { subtotal: 25000, descuento: 0, totalFinal: 25000 },
      drafts: [] as CartDraft[],
      activeDraftId: null as string | null,
      stock: { 'bodega-1': { 'SKU-P1': 100 } },
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
    };

    it('debe abrir POSSecondaryActionsModal al hacer clic en el botón de tres puntos [⋮]', () => {
      render(<CartPanel {...baseCartProps} />);

      const triggerBtn = screen.getByTestId('btn-pos-secondary-actions');
      expect(triggerBtn).toBeInTheDocument();

      // Modal inicialmente no está abierto
      expect(screen.queryByTestId('pos-secondary-actions-modal')).not.toBeInTheDocument();

      fireEvent.click(triggerBtn);

      // Ahora el modal debe estar montado y visible
      expect(screen.getByTestId('pos-secondary-actions-modal')).toBeInTheDocument();
      expect(screen.getByText('Operaciones de Caja')).toBeInTheDocument();
    });

    it('no debe renderizar el badge de pedidos en espera si drafts.length === 0', () => {
      render(<CartPanel {...baseCartProps} drafts={[]} />);

      expect(screen.queryByTestId('badge-pedidos-espera')).not.toBeInTheDocument();
    });

    it('debe renderizar el badge de pedidos en espera y actualizar su conteo reactivamente', () => {
      const drafts: CartDraft[] = [
        createSampleDraft('D-1', 'Cliente 1', 20000),
        createSampleDraft('D-2', 'Cliente 2', 30000),
      ];

      const { rerender } = render(<CartPanel {...baseCartProps} drafts={drafts} />);

      const badge = screen.getByTestId('badge-pedidos-espera');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('⏸ 2 en espera');

      // Al hacer clic en el badge, debe abrir POSSecondaryActionsModal
      fireEvent.click(badge);
      expect(screen.getByTestId('pos-secondary-actions-modal')).toBeInTheDocument();

      // Rerender con 1 borrador (después de eliminación)
      rerender(<CartPanel {...baseCartProps} drafts={[drafts[0]]} />);
      expect(screen.getByTestId('badge-pedidos-espera')).toHaveTextContent('⏸ 1 en espera');

      // Rerender con 0 borradores -> Badge debe desaparecer
      rerender(<CartPanel {...baseCartProps} drafts={[]} />);
      expect(screen.queryByTestId('badge-pedidos-espera')).not.toBeInTheDocument();
    });

    it('debe ejecutar handleSelectDraftDirectly: mapear líneas, actualizar activo y resolver RECUPERADO', async () => {
      const onSetLineas = vi.fn();
      const onSetActiveDraftId = vi.fn();
      const onSetDescuentoGlobal = vi.fn();
      const onSetDrafts = vi.fn();
      const onGuardarBorrador = vi.fn();

      const draftToRestore: CartDraft = {
        id: 'D-RESUME',
        alias: 'Restaurante Marino',
        total: 60000,
        descuentoGlobal: 10,
        fechaGuardado: new Date().toISOString(),
        lineas: [
          createSampleLine('prod-camaron', 'Camarón Tigre', 2, 30000),
        ],
        cart: [],
      };

      // Mock Swal confirming without saving existing
      (Swal.fire as any).mockResolvedValueOnce({ isConfirmed: false, isDenied: true });

      render(
        <CartPanel
          {...baseCartProps}
          lineas={[]} // Carrito vacío en mostrador
          drafts={[draftToRestore]}
          onSetLineas={onSetLineas}
          onSetActiveDraftId={onSetActiveDraftId}
          onSetDescuentoGlobal={onSetDescuentoGlobal}
          onSetDrafts={onSetDrafts}
          onGuardarBorrador={onGuardarBorrador}
        />
      );

      // Abrir modal
      fireEvent.click(screen.getByTestId('btn-pos-secondary-actions'));

      // Clic en Recuperar
      const btnRecuperar = screen.getByTestId('draft-select-D-RESUME');
      await fireEvent.click(btnRecuperar);

      // Verificaciones
      expect(onSetLineas).toHaveBeenCalledWith(draftToRestore.lineas);
      expect(onSetActiveDraftId).toHaveBeenCalledWith('D-RESUME');
      expect(onSetDescuentoGlobal).toHaveBeenCalledWith(10);
      expect(onSetDrafts).toHaveBeenCalled();
      expect(resolveDraftSpy).toHaveBeenCalledWith('D-RESUME', 'RECUPERADO');
    });

    it('debe ejecutar handleDeleteDraftDirectly: confirmar con Swal, actualizar drafts y resolver DESCARTADO', async () => {
      const onSetDrafts = vi.fn();
      const onSetActiveDraftId = vi.fn();

      const draftToDelete = createSampleDraft('D-TO-REMOVE', 'Cliente Que Se Fue', 15000);

      (Swal.fire as any).mockResolvedValue({ isConfirmed: true });

      render(
        <CartPanel
          {...baseCartProps}
          drafts={[draftToDelete]}
          activeDraftId="D-TO-REMOVE"
          onSetDrafts={onSetDrafts}
          onSetActiveDraftId={onSetActiveDraftId}
        />
      );

      // Abrir modal
      fireEvent.click(screen.getByTestId('btn-pos-secondary-actions'));

      // Clic en botón de eliminar
      const btnDelete = screen.getByTestId('draft-delete-D-TO-REMOVE');
      await fireEvent.click(btnDelete);

      // Debe consultar confirmación de Swal
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '¿Descartar este pedido en espera?',
        })
      );

      // Debe filtrar de drafts y limpiar activeDraftId si correspondía
      expect(onSetDrafts).toHaveBeenCalled();
      expect(onSetActiveDraftId).toHaveBeenCalledWith(null);
      expect(resolveDraftSpy).toHaveBeenCalledWith('D-TO-REMOVE', 'DESCARTADO');
    });

    it('debe soportar la estructura legacy draft.cart al recuperar', async () => {
      const onSetLineas = vi.fn();
      const onSetActiveDraftId = vi.fn();
      const onSetDrafts = vi.fn();

      const legacyDraft: any = {
        id: 'D-LEGACY',
        alias: 'Cliente Antiguo Cart',
        total: 50000,
        fechaGuardado: new Date().toISOString(),
        lineas: [],
        cart: [
          {
            product: {
              id: 'p-legacy-1',
              sku: 'LEG-01',
              nombre: 'Pargo Rojo',
              precioVentaPOS: 25000,
              precioCompra: 15000,
              unidadMedida: 'KG',
            },
            cantidad: 2,
            precioOverride: 25000,
          },
        ],
      };

      render(
        <CartPanel
          {...baseCartProps}
          lineas={[]}
          drafts={[legacyDraft]}
          onSetLineas={onSetLineas}
          onSetActiveDraftId={onSetActiveDraftId}
          onSetDrafts={onSetDrafts}
        />
      );

      fireEvent.click(screen.getByTestId('btn-pos-secondary-actions'));
      const btnRecuperar = screen.getByTestId('draft-select-D-LEGACY');
      await fireEvent.click(btnRecuperar);

      expect(onSetLineas).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            productoId: 'p-legacy-1',
            sku: 'LEG-01',
            nombre: 'Pargo Rojo',
            cantidad: 2,
            precioFinal: 25000,
          }),
        ])
      );
      expect(onSetActiveDraftId).toHaveBeenCalledWith('D-LEGACY');
      expect(resolveDraftSpy).toHaveBeenCalledWith('D-LEGACY', 'RECUPERADO');
    });
  });

  // ────────────────────────────────────────────────────────────
  // SUITE 5: Adversarial Boundary & Stress Cases
  // ────────────────────────────────────────────────────────────
  describe('5. Adversarial Edge Cases & Stress Scenarios', () => {
    it('debe manejar un borrador con alias conteniendo caracteres especiales y emojis sin romper layout', () => {
      const specialDraft = createSampleDraft(
        'D-SPECIAL',
        'Cliente <script>alert("XSS")</script> 🐟🦐🦀 & "Comillas"',
        99999999
      );

      render(
        <POSSecondaryActionsModal
          isOpen={true}
          onClose={vi.fn()}
          drafts={[specialDraft]}
          activeDraftId={null}
          onSelectDraft={vi.fn()}
          onDeleteDraft={vi.fn()}
          onNewParkedSale={vi.fn()}
          onLimpiarCarrito={vi.fn()}
          hasLineas={false}
        />
      );

      expect(
        screen.getByText('Cliente <script>alert("XSS")</script> 🐟🦐🦀 & "Comillas"')
      ).toBeInTheDocument();
      expect(screen.getByText('$99.999.999')).toBeInTheDocument();
    });

    it('debe manejar un volumen masivo de 20 borradores concurrentes con scroll fluido', () => {
      const massiveDrafts: CartDraft[] = Array.from({ length: 20 }, (_, i) =>
        createSampleDraft(`D-MASSIVE-${i + 1}`, `Cliente Mayorista ${i + 1}`, (i + 1) * 10000)
      );

      render(
        <POSSecondaryActionsModal
          isOpen={true}
          onClose={vi.fn()}
          drafts={massiveDrafts}
          activeDraftId="D-MASSIVE-5"
          onSelectDraft={vi.fn()}
          onDeleteDraft={vi.fn()}
          onNewParkedSale={vi.fn()}
          onLimpiarCarrito={vi.fn()}
          hasLineas={false}
        />
      );

      // Debe renderizar las 20 tarjetas sin crasheos
      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.getByText('Cliente Mayorista 1')).toBeInTheDocument();
      expect(screen.getByText('Cliente Mayorista 20')).toBeInTheDocument();
      expect(screen.getByTestId('draft-card-D-MASSIVE-5')).toHaveClass('bg-amber-950/40');
    });

    it('debe manejar borrador con total undefined o 0 sin NaN', () => {
      const zeroDraft: CartDraft = {
        id: 'D-ZERO',
        alias: 'Borrador Vacío',
        total: undefined as any,
        totalFinal: undefined as any,
        descuentoGlobal: 0,
        fechaGuardado: '',
        lineas: [],
      };

      render(
        <POSSecondaryActionsModal
          isOpen={true}
          onClose={vi.fn()}
          drafts={[zeroDraft]}
          activeDraftId={null}
          onSelectDraft={vi.fn()}
          onDeleteDraft={vi.fn()}
          onNewParkedSale={vi.fn()}
          onLimpiarCarrito={vi.fn()}
          hasLineas={false}
        />
      );

      expect(screen.getByText('$0')).toBeInTheDocument();
      expect(screen.getByText('0 ítems')).toBeInTheDocument();
    });
  });
});
