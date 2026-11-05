import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import { CartPanel } from '../views/pos/components/CartPanel';
import { DespachoNotasModal } from '../views/pos/components/DespachoNotasModal';
import POSView from '../views/POSView';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';
import { useCashStore } from '../store/useCashStore';
import type { LineaVenta } from '../types/pos.types';

// Helper to generate N line items for stress testing
function generateCrowdedLineas(count: number): LineaVenta[] {
  return Array.from({ length: count }, (_, i) => ({
    productoId: `prod-stress-${i + 1}`,
    sku: `SKU-${1000 + i}`,
    nombre: `Producto de Prueba Stress ${i + 1}`,
    cantidad: 1.5 + (i % 5),
    unidad: i % 2 === 0 ? 'KG' : 'UNIDAD',
    precioLista: 15000 + i * 500,
    descuentoPct: 0,
    precioFinal: 15000 + i * 500,
    totalLinea: (1.5 + (i % 5)) * (15000 + i * 500),
    precioCompra: 10000,
    esPesoManual: i % 2 === 0,
  }));
}

describe('CHALLENGER ADVERSARIAL STRESS TEST: POS Cart Ergonomics & Viewport Scaling', () => {
  const dummyStock = {
    'bodega-1': generateCrowdedLineas(30).reduce((acc, l) => {
      acc[l.sku] = 100;
      return acc;
    }, {} as Record<string, number>),
  };

  const createProps = (lineas: LineaVenta[], isMostrador = false, isTurnoAbierto = true) => ({
    lineas,
    cliente: { id: 'c-test', identificacion: '123456789', nombre: 'Cliente de Prueba', tipoPrecio: 'DETAL' } as any,
    descuentoGlobalPct: 0,
    descuentoGlobalValor: 0,
    totales: {
      subtotal: lineas.reduce((s, l) => s + l.totalLinea, 0),
      descuento: 0,
      totalFinal: lineas.reduce((s, l) => s + l.totalLinea, 0),
    },
    drafts: [],
    activeDraftId: null,
    stock: dummyStock,
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
    isTurnoAbierto,
    isAsesorMostrador: isMostrador,
    onCerrarTurnoClick: vi.fn(),
    selectedCutNotes: [],
    onToggleCutNote: vi.fn(),
    onOpenNotasModal: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Stress-1: Carrito vacío (0 ítems) — renderiza mensaje vacío y pie de acciones anclado con mt-auto', () => {
    const props = createProps([], true, true);
    const { container } = render(
      <div style={{ height: '700px', display: 'flex', flexDirection: 'column' }}>
        <CartPanel {...props} />
      </div>
    );

    // Verificar que contenedor raíz tenga overflow-hidden
    const panel = screen.getByTestId('cart-glass-panel');
    expect(panel.className).toContain('overflow-hidden');

    // Mensaje de carrito vacío
    expect(screen.getByText(/el carrito está vacío/i)).toBeInTheDocument();

    // Contenedor de ítems tiene flex-1 min-h-0 overflow-y-auto
    const itemsList = container.querySelector('.pos-cart-items-list');
    expect(itemsList?.className).toContain('flex-1');
    expect(itemsList?.className).toContain('min-h-0');
    expect(itemsList?.className).toContain('overflow-y-auto');

    // Pie de página anclado
    const footer = container.querySelector('.pos-cart-footer');
    expect(footer?.className).toContain('shrink-0');
    expect(footer?.className).toContain('mt-auto');

    // Botón de emisión de preventa está presente y deshabilitado
    const btnEmitir = screen.getByTestId('btn-emitir-preventa-mostrador');
    expect(btnEmitir).toBeInTheDocument();
    expect(btnEmitir).toBeDisabled();
  });

  it('Stress-2: Carrito abarrotado con 25+ ítems — lista con scroll interno y pie de acciones intacto', () => {
    const crowdedLineas = generateCrowdedLineas(25);
    const props = createProps(crowdedLineas, true, true);

    const { container } = render(
      <div style={{ height: '700px', display: 'flex', flexDirection: 'column' }}>
        <CartPanel {...props} />
      </div>
    );

    // Contenedor de ítems
    const itemsList = container.querySelector('.pos-cart-items-list');
    expect(itemsList).toBeInTheDocument();
    expect(itemsList?.className).toContain('flex-1');
    expect(itemsList?.className).toContain('min-h-0');
    expect(itemsList?.className).toContain('overflow-y-auto');

    // Verificar que los 25 ítems estén renderizados en el DOM
    crowdedLineas.forEach((linea) => {
      expect(screen.getByText(linea.nombre)).toBeInTheDocument();
    });

    // Footer no debe estar encogido ni colapsado
    const footer = container.querySelector('.pos-cart-footer');
    expect(footer).toBeInTheDocument();
    expect(footer?.className).toContain('shrink-0');
    expect(footer?.className).toContain('mt-auto');

    // El botón Emitir Preventa debe estar activo y cumplir altura táctil >= 48px (size large = min-h-[54px])
    const btnEmitir = screen.getByTestId('btn-emitir-preventa-mostrador');
    expect(btnEmitir).toBeInTheDocument();
    expect(btnEmitir).not.toBeDisabled();
    expect(btnEmitir.className).toMatch(/min-h-\[54px\]|min-h-\[48px\]/);

    // El botón de abrir notas de despacho debe estar presente
    const btnNotas = screen.getByTestId('btn-open-despacho-modal');
    expect(btnNotas).toBeInTheDocument();
  });

  it('Stress-3: Modo Cajero estándar con 25 ítems y turno abierto — botón Cobrar >= 56px y Cerrar Turno presente', () => {
    const crowdedLineas = generateCrowdedLineas(25);
    const props = createProps(crowdedLineas, false, true);

    render(
      <div style={{ height: '650px', display: 'flex', flexDirection: 'column' }}>
        <CartPanel {...props} />
      </div>
    );

    // Botón Cobrar debe estar presente y con altura táctil >= 56px
    const btnCobrar = screen.getByTestId('btn-cobrar');
    expect(btnCobrar).toBeInTheDocument();
    expect(btnCobrar.className).toMatch(/min-h-\[56px\]|h-14/);
    expect(btnCobrar).toBeVisible();

    // Botón Cerrar Turno debe estar presente en cabecera
    const btnCerrarTurno = screen.getByRole('button', { name: /cerrar turno/i });
    expect(btnCerrarTurno).toBeInTheDocument();

    // Botones En Espera / Borrador (tanto en header como en footer) deben tener altura >= 48px
    const btnEnEsperaList = screen.getAllByRole('button', { name: /poner pedido actual en espera/i });
    expect(btnEnEsperaList.length).toBeGreaterThanOrEqual(1);
    btnEnEsperaList.forEach((btn) => {
      expect(btn.className).toMatch(/min-h-\[48px\]|h-12|h-14/);
    });
  });

  it('Stress-4: En resolución laptop 1366x768 / 1024x768 simulada, no hay recorte en botones de acción', () => {
    const crowdedLineas = generateCrowdedLineas(20);
    const props = createProps(crowdedLineas, true, true);

    const { container } = render(
      <div style={{ width: '400px', height: '600px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <CartPanel {...props} />
      </div>
    );

    const panel = container.querySelector('.pos-cart-panel');
    expect(panel?.className).toContain('overflow-hidden');
    expect(panel?.className).toContain('h-full');

    const footer = container.querySelector('.pos-cart-footer');
    expect(footer?.className).toContain('shrink-0');
    expect(footer?.className).toContain('mt-auto');

    // Botón de emisión de preventa está en el DOM y es clickeable
    const btnEmitir = screen.getByTestId('btn-emitir-preventa-mostrador');
    expect(btnEmitir).toBeInTheDocument();
    fireEvent.click(btnEmitir);
    expect(props.onGuardarBorrador).toHaveBeenCalled();
  });
});

describe('CHALLENGER ADVERSARIAL STRESS TEST: Ausencia Estricta de QuickCutNotes en POSView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Verifica que en POSView no se renderiza QuickCutNotes como elemento estático permanente', () => {
    useAuthStore.setState({
      activeTenant: { id: 'tenant-03', razonSocial: 'Ferretería Josase', nit: '900123456' } as any,
    });
    useAppStore.setState({
      userRole: 'vendedor',
    });
    useCashStore.getState().setTurnoActivo({
      id: 'turno-1',
      sucursalId: 's1',
      cajeroId: 'u1',
      estado: 'ABIERTO',
      fechaApertura: new Date().toISOString(),
      saldoInicial: 100000,
      totalEfectivo: 100000,
    } as any);

    let containerResult: HTMLElement;
    act(() => {
      const { container } = render(<POSView />);
      containerResult = container;
    });

    // Validar que la cabecera estática "Corte y Preparación de Mostrador (1 Toque)" no existe en la columna
    expect(containerResult!.textContent).not.toContain('Corte y Preparación de Mostrador (1 Toque)');

    // Tampoco debe haber ningún botón de nota de corte visible en el árbol inicial (e.g. "En Postas", "Fileteado")
    expect(screen.queryByRole('button', { name: /en postas/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /fileteado/i })).toBeNull();
  });
});

describe('CHALLENGER ADVERSARIAL STRESS TEST: Ciclo de Vida Completo de DespachoNotasModal', () => {
  it('Modal bajo demanda: abrir, escribir texto libre, conmutar notas de corte, limpiar, confirmar y cerrar con Escape', () => {
    const onToggleNote = vi.fn();
    const onCustomNotesChange = vi.fn();
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const onClear = vi.fn();

    const { rerender } = render(
      <DespachoNotasModal
        isOpen={false}
        onClose={onClose}
        selectedNotes={[]}
        onToggleNote={onToggleNote}
        customNotes=""
        onCustomNotesChange={onCustomNotesChange}
        onConfirm={onConfirm}
        onClear={onClear}
      />
    );

    // Cuando isOpen es false, el modal no debe existir en el DOM
    expect(screen.queryByTestId('modal-despacho-notas')).toBeNull();

    // Rerender con isOpen = true
    rerender(
      <DespachoNotasModal
        isOpen={true}
        onClose={onClose}
        selectedNotes={[]}
        onToggleNote={onToggleNote}
        customNotes=""
        onCustomNotesChange={onCustomNotesChange}
        onConfirm={onConfirm}
        onClear={onClear}
      />
    );

    // Modal abierto
    const modal = screen.getByTestId('modal-despacho-notas');
    expect(modal).toBeInTheDocument();

    // 1. Conmutar nota de corte rápido: "En Postas"
    const btnPostas = screen.getByRole('button', { name: /en postas/i });
    fireEvent.click(btnPostas);
    expect(onToggleNote).toHaveBeenCalledWith('En Postas');

    // Rerender con 'En Postas' seleccionado
    rerender(
      <DespachoNotasModal
        isOpen={true}
        onClose={onClose}
        selectedNotes={['En Postas']}
        onToggleNote={onToggleNote}
        customNotes=""
        onCustomNotesChange={onCustomNotesChange}
        onConfirm={onConfirm}
        onClear={onClear}
      />
    );

    // Chip de resumen activo
    expect(screen.getByText('✓ En Postas')).toBeInTheDocument();

    // 2. Escribir en textarea de notas libres
    const textarea = screen.getByTestId('textarea-despacho-notas');
    fireEvent.change(textarea, { target: { value: 'Entregar a las 4:00 PM con hielo' } });
    expect(onCustomNotesChange).toHaveBeenCalledWith('Entregar a las 4:00 PM con hielo');

    // 3. Probar botón Limpiar
    const btnClear = screen.getByTestId('btn-clear-despacho-notas');
    expect(btnClear).not.toBeDisabled();
    fireEvent.click(btnClear);
    expect(onClear).toHaveBeenCalled();

    // 4. Probar tecla Escape para cerrar
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();

    // 5. Probar botón Confirmar
    const btnConfirm = screen.getByTestId('btn-confirm-despacho-notas');
    fireEvent.click(btnConfirm);
    expect(onConfirm).toHaveBeenCalled();

    // 6. Probar botón Cancelar
    const btnCancel = screen.getByTestId('btn-cancel-despacho-notas');
    fireEvent.click(btnCancel);
    expect(onClose).toHaveBeenCalledTimes(2);

    // 7. Probar botón Cerrar (X)
    const btnCloseX = screen.getByTestId('btn-close-despacho-modal');
    fireEvent.click(btnCloseX);
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});

describe('CHALLENGER ADVERSARIAL AUDIT: Validación Programática de Casos de Prueba SOP CP-01 a CP-08', () => {
  const sopPath = path.resolve(process.cwd(), 'docs/sop/single_cashier_multivendor_manual_testing.md');

  it('Verifica que el archivo SOP exista y contenga los 8 casos de prueba estructurados', () => {
    expect(fs.existsSync(sopPath)).toBe(true);
    const content = fs.readFileSync(sopPath, 'utf8');

    const expectedCases = [
      { id: 'CP-01', title: 'Apertura Rápida 1-Toque (Modo Demo Josase)' },
      { id: 'CP-02', title: 'Apertura Estándar de Turno con Base Inicial (Cajero)' },
      { id: 'CP-03', title: 'Segregación de Roles: Restricción de Caja para Vendedor' },
      { id: 'CP-04', title: 'Emisión de Preventa con Notas y Reserva de Stock' },
      { id: 'CP-05', title: 'Reclamación y Pase a Cobro en Kanban (Cajero F7/F9)' },
      { id: 'CP-06', title: 'Liquidación y Facturación Centralizada Multimétodo' },
      { id: 'CP-07', title: 'Modo Monitor de Solo Lectura para Vendedor en Kanban' },
      { id: 'CP-08', title: 'Cierre de Turno y Arqueo Ciego con Reporte de Descuadre' },
    ];

    expectedCases.forEach((testCase) => {
      expect(content).toContain(`**${testCase.id}**`);
      expect(content).toContain(testCase.title);
    });

    // Verificar que cada caso tenga columnas de Checklist de Aceptación
    expect(content).toContain('| ID Caso | Escenario de Prueba | Precondiciones | Pasos de Ejecución | Resultado Esperado | Criterio de Pase / Estado |');
    expect(content).toContain('`[ ] APROBADO`');
  });

  it('Verifica que los selectores y data-testids citados en el SOP existan verdaderamente en el código fuente', () => {
    const content = fs.readFileSync(sopPath, 'utf8');

    const requiredTestIdsInSop = [
      'topbar-btn-toggle-demo-tenant',
      'btn-emitir-preventa-mostrador',
      'topbar-btn-comandas-kanban',
      'btn-iniciar-cobro-',
      'btn-confirmar-cobro-',
      'badge-modo-monitor-vendedor',
      'badge-en-espera-',
      'badge-en-cobro-',
      'btn-cobrar',
    ];

    requiredTestIdsInSop.forEach((testId) => {
      expect(content).toContain(testId);
    });

    // Ahora verificar que esos mismos testids existan físicamente en los componentes React
    const topbarContent = fs.readFileSync(path.resolve(process.cwd(), 'src/components/layout/EnterpriseTopbar.tsx'), 'utf8');
    expect(topbarContent).toContain('topbar-btn-toggle-demo-tenant');
    expect(topbarContent).toContain('topbar-btn-comandas-kanban');

    const cartPanelContent = fs.readFileSync(path.resolve(process.cwd(), 'src/views/pos/components/CartPanel.tsx'), 'utf8');
    expect(cartPanelContent).toContain('btn-emitir-preventa-mostrador');
    expect(cartPanelContent).toContain('btn-open-despacho-modal');

    const paymentPanelContent = fs.readFileSync(path.resolve(process.cwd(), 'src/views/pos/components/PaymentPanel.tsx'), 'utf8');
    expect(paymentPanelContent).toContain('btn-cobrar');

    const kanbanContent = fs.readFileSync(path.resolve(process.cwd(), 'src/views/pos/components/CashierKanbanView.tsx'), 'utf8');
    expect(kanbanContent).toContain('badge-modo-monitor-vendedor');
    expect(kanbanContent).toContain('btn-iniciar-cobro-');
    expect(kanbanContent).toContain('badge-en-espera-');
    expect(kanbanContent).toContain('badge-en-cobro-');
  });
});
