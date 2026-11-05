import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartPanel } from '../views/pos/components/CartPanel';
import type { LineaVenta, CartDraft } from '../types/pos.types';

// Helper para generar una lista realista de N productos del mar y abarrotes
function generateTestLineas(count: number): LineaVenta[] {
  const nombresCatalogo = [
    'Salmón Noruego Fresco',
    'Camarón Tigre Congelado',
    'Filete de Tilapia Roja',
    'Pulpo Entero Cocido',
    'Anillos de Calamar',
    'Atún Aleta Amarilla Fresco',
    'Langostinos U15 Crudos',
    'Corvina Plateada del Pacífico',
    'Sierra en Postas',
    'Cazuela de Mariscos Congelada',
    'Salpicón de Mariscos Gourmet',
    'Robalo en Filete Premium',
    'Mero Entero Limpio',
    'Pargo Rojo Fresco',
    'Jaiba Limpia Descongelada',
    'Langosta Caribeña Cola',
    'Mejillones en Media Concha',
    'Palmitos de Cangrejo',
    'Trucha Salmonada Deshuesada',
    'Bocachico del Magdalena Limpio',
    'Bagre en Rodajas',
    'Ceviche Mixto Tradicional',
  ];

  return Array.from({ length: count }, (_, i) => {
    const isKg = i % 3 !== 2; // 2 de cada 3 productos por KG, 1 por UNIDAD
    const cantidad = 1;
    const precioUnitario = 18000 + (i * 3500);
    const totalLinea = Math.round(cantidad * precioUnitario);

    return {
      productoId: `prod-m2-${i + 1}`,
      sku: `SKU-SEA-${100 + i}`,
      nombre: nombresCatalogo[i % nombresCatalogo.length],
      cantidad,
      unidad: isKg ? 'KG' : 'UNIDAD',
      precioLista: precioUnitario,
      descuentoPct: i === 3 ? 10 : 0,
      precioFinal: i === 3 ? Math.round(precioUnitario * 0.9) : precioUnitario,
      totalLinea: i === 3 ? Math.round(cantidad * precioUnitario * 0.9) : totalLinea,
      precioCompra: Math.round(precioUnitario * 0.65),
      esPesoManual: isKg && (i % 2 === 0),
    };
  });
}

function generateMockDrafts(count: number): CartDraft[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `draft-mock-${i + 1}`,
    alias: `Mesa / Cliente Espera ${i + 1}`,
    lineas: [],
    descuentoGlobal: 0,
    total: 64000,
    totalFinal: 64000,
    fechaGuardado: new Date(Date.now() - (i * 60000)).toISOString(),
    fecha: new Date(Date.now() - (i * 60000)).toISOString(),
  }));
}

describe('Milestone M2: POS Cart 12+ Items Vertical Scroll Priority & Compact Ergonomics', () => {
  const dummyStock = generateTestLineas(25).reduce((acc, l) => {
    acc[l.sku] = 50;
    return acc;
  }, {} as Record<string, number>);

  const createProps = (
    lineas: LineaVenta[],
    isMostrador = false,
    isTurnoAbierto = true,
    drafts: CartDraft[] = []
  ) => {
    const subtotal = lineas.reduce((acc, l) => acc + l.totalLinea, 0);
    const totalIva = Math.round(subtotal * 0.19);
    const totalFinal = subtotal;

    return {
      lineas,
      cliente: {
        id: 'cli-01',
        identificacion: '900987654',
        nombre: 'RESTAURANTE MAR AZUL S.A.S.',
        tipoPrecio: 'DETAL',
      } as any,
      descuentoGlobalPct: 0,
      descuentoGlobalValor: 0,
      totales: {
        subtotal,
        descuento: 0,
        totalFinal,
        totalIva,
        subtotalBaseGravable: subtotal,
      },
      drafts,
      activeDraftId: null,
      stock: { 'bodega-1': dummyStock },
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
      onPagar: vi.fn().mockResolvedValue(undefined),
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
      onUpdatePrecio: vi.fn(),
      onResetItemPrice: vi.fn(),
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Montaje de CartPanel con 12 productos: cart-items-container no colapsa y conserva flex-1 min-h-0 overflow-y-auto', () => {
    const lineas12 = generateTestLineas(12);
    const props = createProps(lineas12, false, true);

    const { container } = render(
      <div style={{ height: '650px', width: '400px', display: 'flex', flexDirection: 'column' }}>
        <CartPanel {...props} />
      </div>
    );

    // Contenedor GlassCard raíz
    const glassPanel = screen.getByTestId('cart-glass-panel');
    expect(glassPanel).toBeInTheDocument();
    expect(glassPanel.className).toContain('overflow-hidden');
    expect(glassPanel.className).toContain('pos-cart-panel');

    // Badge de ítems en el header y footer
    const badges12 = screen.getAllByText(/12 ítems/i);
    expect(badges12.length).toBeGreaterThanOrEqual(1);

    // Contenedor de lista de ítems
    const itemsContainer = screen.getByTestId('cart-items-container');
    expect(itemsContainer).toBeInTheDocument();
    expect(itemsContainer).toBeVisible();

    // Clases requeridas de flexbox independiente y scroll prioritario
    expect(itemsContainer.className).toContain('pos-cart-items-list');
    expect(itemsContainer.className).toContain('flex-1');
    expect(itemsContainer.className).toContain('min-h-0');
    expect(itemsContainer.className).toContain('overflow-y-auto');
    expect(itemsContainer.className).toContain('overscroll-contain');
    expect(itemsContainer.className).toContain('custom-scrollbar');

    // Debe contener exactamente 12 filas de productos
    const rows = container.querySelectorAll('.cart-item-row');
    expect(rows.length).toBe(12);
  });

  it('2. Cada una de las 12 filas renderiza legiblemente su nombre, cantidad/peso, precio unitario y subtotal', () => {
    const lineas12 = generateTestLineas(12);
    const props = createProps(lineas12, false, true);

    render(
      <div style={{ height: '650px', width: '400px', display: 'flex', flexDirection: 'column' }}>
        <CartPanel {...props} />
      </div>
    );

    lineas12.forEach((linea) => {
      // 1. Nombre de producto visible con clase cart-item-name
      const nameElem = screen.getByTestId(`cart-item-name-${linea.productoId}`);
      expect(nameElem).toBeInTheDocument();
      expect(nameElem.textContent).toBe(linea.nombre);
      expect(nameElem.className).toContain('cart-item-name');
      expect(nameElem.className).toContain('font-bold');

      // 2. Subtotal de línea visible y formateado en COP
      const priceElem = screen.getByTestId(`cart-item-price-${linea.productoId}`);
      expect(priceElem).toBeInTheDocument();
      expect(priceElem.textContent).toContain(linea.totalLinea.toLocaleString('es-CO'));
      expect(priceElem.className).toContain('cart-item-price');
      expect(priceElem.className).toContain('font-mono');
      expect(priceElem.className).toContain('tabular-nums');

      // 3. Fila del producto contiene contenedor con altura compacta
      const rowElem = screen.getByTestId(`cart-item-row-${linea.productoId}`);
      expect(rowElem.className).toContain('cart-item-row');
      expect(rowElem.className).toContain('min-h-[58px]');
    });

    // Validar controles táctiles con Ley de Fitts en toda la lista (12 botones de cada tipo)
    const btnsAumentar = screen.getAllByRole('button', { name: /aumentar cantidad/i });
    expect(btnsAumentar.length).toBe(12);
    btnsAumentar.forEach((btn) => {
      expect(btn.className).toContain('min-w-[48px]');
      expect(btn.className).toContain('min-h-[48px]');
    });

    const btnsDisminuir = screen.getAllByRole('button', { name: /disminuir cantidad/i });
    expect(btnsDisminuir.length).toBe(12);
    btnsDisminuir.forEach((btn) => {
      expect(btn.className).toContain('min-w-[48px]');
      expect(btn.className).toContain('min-h-[48px]');
    });

    const btnsEliminar = screen.getAllByRole('button', { name: /eliminar producto del carrito/i });
    expect(btnsEliminar.length).toBe(12);
    btnsEliminar.forEach((btn) => {
      expect(btn.className).toContain('min-w-[48px]');
      expect(btn.className).toContain('min-h-[48px]');
    });

    const inputs = screen.getAllByTestId('input-cantidad');
    expect(inputs.length).toBe(12);
    inputs.forEach((input) => {
      expect(input.className).toContain('min-h-[48px]');
    });
  });

  it('3. El pie de totales pos-cart-footer permanece firmemente anclado con shrink-0 mt-auto y el botón Cobrar visible', () => {
    const lineas12 = generateTestLineas(12);
    const props = createProps(lineas12, false, true);

    const { container } = render(
      <div style={{ height: '650px', width: '400px', display: 'flex', flexDirection: 'column' }}>
        <CartPanel {...props} />
      </div>
    );

    const footer = container.querySelector('.pos-cart-footer');
    expect(footer).toBeInTheDocument();
    expect(footer?.className).toContain('shrink-0');
    expect(footer?.className).toContain('mt-auto');
    expect(footer?.className).not.toContain('sticky');
    expect(footer?.className).not.toContain('bottom-0');

    // Total general monetario prominente
    const totalFinalExpected = lineas12.reduce((acc, l) => acc + l.totalLinea, 0);
    expect(footer?.textContent).toContain(`$${totalFinalExpected.toLocaleString('es-CO')}`);

    // Botón de cobro en taquilla
    const btnCobrar = screen.getByTestId('btn-cobrar');
    expect(btnCobrar).toBeInTheDocument();
    expect(btnCobrar).toBeVisible();
    expect(btnCobrar).not.toBeDisabled();
    expect(btnCobrar.className).toMatch(/min-h-\[(48|56)px\]/);
  });

  it('4. En modo mostrador con 12 productos, el botón Emitir Preventa permanece visible y habilitado', () => {
    const lineas12 = generateTestLineas(12);
    const props = createProps(lineas12, true, true);

    render(
      <div style={{ height: '650px', width: '400px', display: 'flex', flexDirection: 'column' }}>
        <CartPanel {...props} />
      </div>
    );

    const btnEmitir = screen.getByTestId('btn-emitir-preventa-mostrador');
    expect(btnEmitir).toBeInTheDocument();
    expect(btnEmitir).toBeVisible();
    expect(btnEmitir).not.toBeDisabled();
    expect(btnEmitir.className).toContain('min-h-[44px]');

    fireEvent.click(btnEmitir);
    expect(props.onGuardarBorrador).toHaveBeenCalledTimes(1);
  });

  it('5. Ventas en espera (ParkedOrdersBar) convive con 12 productos sin canibalizar el visor de la lista', () => {
    const lineas12 = generateTestLineas(12);
    const mockDrafts = generateMockDrafts(3);
    const props = createProps(lineas12, false, true, mockDrafts);

    const { container } = render(
      <div style={{ height: '650px', width: '400px', display: 'flex', flexDirection: 'column' }}>
        <CartPanel {...props} />
      </div>
    );

    // Barra de ventas en espera presente
    expect(screen.getByText('Ventas en Espera & Multicliente')).toBeInTheDocument();
    expect(screen.getByText('Venta Activa')).toBeInTheDocument();
    expect(screen.getByText('Mesa / Cliente Espera 1')).toBeInTheDocument();
    expect(screen.getByText('Mesa / Cliente Espera 2')).toBeInTheDocument();
    expect(screen.getByText('Mesa / Cliente Espera 3')).toBeInTheDocument();

    // La lista de productos mantiene sus 12 filas intactas
    const rows = container.querySelectorAll('.cart-item-row');
    expect(rows.length).toBe(12);

    // La lista de ítems sigue teniendo flex-1 min-h-0 overflow-y-auto
    const itemsContainer = screen.getByTestId('cart-items-container');
    expect(itemsContainer.className).toContain('flex-1');
    expect(itemsContainer.className).toContain('min-h-0');
    expect(itemsContainer.className).toContain('overflow-y-auto');

    // El footer de cobro sigue anclado y visible
    const btnCobrar = screen.getByTestId('btn-cobrar');
    expect(btnCobrar).toBeInTheDocument();
    expect(btnCobrar).toBeVisible();
  });

  it('6. Pruebas de estrés con 16 y 20 productos: renderizado sin colapso, scroll prioritario y acumulación exacta', () => {
    // Escenario A: 16 productos
    const lineas16 = generateTestLineas(16);
    const props16 = createProps(lineas16, false, true);

    const { container: container16, unmount: unmount16 } = render(
      <div style={{ height: '600px', width: '400px', display: 'flex', flexDirection: 'column' }}>
        <CartPanel {...props16} />
      </div>
    );

    const badges16 = screen.getAllByText(/16 ítems/i);
    expect(badges16.length).toBeGreaterThanOrEqual(1);
    expect(container16.querySelectorAll('.cart-item-row').length).toBe(16);

    const total16 = lineas16.reduce((acc, l) => acc + l.totalLinea, 0);
    expect(container16.querySelector('.pos-cart-footer')?.textContent).toContain(
      `$${total16.toLocaleString('es-CO')}`
    );

    unmount16();

    // Escenario B: 20 productos
    const lineas20 = generateTestLineas(20);
    const props20 = createProps(lineas20, false, true);

    const { container: container20 } = render(
      <div style={{ height: '600px', width: '400px', display: 'flex', flexDirection: 'column' }}>
        <CartPanel {...props20} />
      </div>
    );

    const badges20 = screen.getAllByText(/20 ítems/i);
    expect(badges20.length).toBeGreaterThanOrEqual(1);
    expect(container20.querySelectorAll('.cart-item-row').length).toBe(20);

    const total20 = lineas20.reduce((acc, l) => acc + l.totalLinea, 0);
    expect(container20.querySelector('.pos-cart-footer')?.textContent).toContain(
      `$${total20.toLocaleString('es-CO')}`
    );

    // Contenedor de scroll intacto
    const itemsContainer20 = screen.getByTestId('cart-items-container');
    expect(itemsContainer20.className).toContain('flex-1');
    expect(itemsContainer20.className).toContain('min-h-0');
    expect(itemsContainer20.className).toContain('overflow-y-auto');
  });

  it('7. Interacciones táctiles ergonómicas en las filas compactas con 12 ítems', () => {
    const lineas12 = generateTestLineas(12);
    // Configurar ítem 4 con cantidad inicial 3 para probar incremento y decremento
    lineas12[4].cantidad = 3;
    const props = createProps(lineas12, false, true);

    render(
      <div style={{ height: '650px', width: '400px', display: 'flex', flexDirection: 'column' }}>
        <CartPanel {...props} />
      </div>
    );

    const targetLinea = lineas12[4]; // Anillos de Calamar
    const row = screen.getByTestId(`cart-item-row-${targetLinea.productoId}`);

    // Clic en aumentar (+) -> 3 + 1 = 4
    const btnAumentar = row.querySelector('[data-testid="btn-aumentar-cantidad"]');
    expect(btnAumentar).not.toBeNull();
    fireEvent.click(btnAumentar!);
    expect(props.onUpdateCantidad).toHaveBeenCalledWith(
      targetLinea.productoId,
      4
    );

    // Clic en disminuir (-) -> 3 - 1 = 2
    const btnDisminuir = row.querySelector('[data-testid="btn-disminuir-cantidad"]');
    expect(btnDisminuir).not.toBeNull();
    fireEvent.click(btnDisminuir!);
    expect(props.onUpdateCantidad).toHaveBeenCalledWith(
      targetLinea.productoId,
      2
    );

    // Clic en eliminar (X)
    const btnEliminar = row.querySelector('[data-testid="btn-eliminar-linea"]');
    expect(btnEliminar).not.toBeNull();
    fireEvent.click(btnEliminar!);
    expect(props.onRemoveLinea).toHaveBeenCalledWith(targetLinea.productoId);
  });
});
