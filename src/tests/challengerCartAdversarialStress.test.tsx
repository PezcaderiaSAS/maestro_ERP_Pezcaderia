import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartPanel } from '../views/pos/components/CartPanel';
import type { LineaVenta, CartDraft } from '../types/pos.types';

// Helper generator for N adversarial stress test items
function generateAdversarialLineas(
  count: number,
  options?: {
    customQuantities?: number[];
    unit?: 'KG' | 'UNIDAD';
    longNames?: boolean;
    highPrices?: boolean;
  }
): LineaVenta[] {
  const catalogNames = [
    'Salmón Noruego Premium',
    'Camarón Tigre U12',
    'Filete de Corvina',
    'Pulpo Baby Entero',
    'Anillos de Calamar',
    'Atún Rojo de Aleta Amarilla',
    'Langostino Gigante',
    'Robalo del Pacífico',
    'Sierra en Postas',
    'Pargo Rojo Entero',
    'Jaiba Limpia de Mar',
    'Mejillón Chileno',
    'Trucha Salmonada Deshuesada',
    'Bocachico Limpio',
    'Bagre de Río',
    'Filete de Tilapia Roja',
    'Palmitos de Cangrejo',
    'Ceviche Tradicional de Corvina',
    'Calamar Patagónico Tubo',
    'Mix de Mariscos Seleccionados',
  ];

  return Array.from({ length: count }, (_, i) => {
    const isKg = options?.unit ? options.unit === 'KG' : i % 2 === 0;
    const baseQuantity = options?.customQuantities
      ? options.customQuantities[i % options.customQuantities.length]
      : isKg
      ? 1.5 + (i * 0.25)
      : 1 + (i % 3);

    const basePrice = options?.highPrices
      ? 50000000 + i * 10000000 // High prices for billions stress testing
      : 18000 + i * 2500;

    let nombre = catalogNames[i % catalogNames.length] + ` (#${i + 1})`;
    if (options?.longNames) {
      nombre = `Filete Especial de ${nombre} Silvestre con Finas Hierbas del Mediterráneo y Empacado al Vacío en Grado de Exportación Internacional`;
    }

    const totalLinea = Math.round(baseQuantity * basePrice);

    return {
      productoId: `prod-adv-${i + 1}`,
      sku: `SKU-ADV-${1000 + i}`,
      nombre,
      cantidad: baseQuantity,
      unidad: isKg ? 'KG' : 'UNIDAD',
      precioLista: basePrice,
      descuentoPct: 0,
      precioFinal: basePrice,
      totalLinea,
      precioCompra: Math.round(basePrice * 0.7),
      esPesoManual: isKg,
    };
  });
}

describe('CHALLENGER 1: Empirical Adversarial Stress Testing of Cart Items Container & Footer Anchoring', () => {
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
        id: 'cli-adv-01',
        identificacion: '901234567',
        nombre: 'PESCADERÍA CENTRAL DEL PUERTO S.A.S.',
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
      stock: {
        'bodega-adv': lineas.reduce((acc, l) => {
          acc[l.sku] = 500;
          return acc;
        }, {} as Record<string, number>),
      },
      bodegaActivaId: 'bodega-adv',
      bodegaActivaNombre: 'Bodega de Muelle',
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

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 1: Scale & Container Non-Collapse (12, 16, 20, 25, 50 Items)
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Suite 1: Scale & Container Non-Collapse Under Heavy Loads', () => {
    it('1.1. Carga con 12 productos: cart-items-container no colapsa y conserva todas las clases de scroll independiente', () => {
      const lineas12 = generateAdversarialLineas(12);
      const props = createProps(lineas12);

      const { container } = render(
        <div style={{ height: '600px', width: '380px', display: 'flex', flexDirection: 'column' }}>
          <CartPanel {...props} />
        </div>
      );

      const itemsContainer = screen.getByTestId('cart-items-container');
      expect(itemsContainer).toBeInTheDocument();
      expect(itemsContainer).toBeVisible();

      // Invariantes estructurales flexbox para evitar colapso a 0px:
      expect(itemsContainer.className).toContain('pos-cart-items-list');
      expect(itemsContainer.className).toContain('flex-1');
      expect(itemsContainer.className).toContain('min-h-0');
      expect(itemsContainer.className).toContain('overflow-y-auto');
      expect(itemsContainer.className).toContain('overscroll-contain');
      expect(itemsContainer.className).toContain('custom-scrollbar');

      // Exactamente 12 filas renderizadas
      const rows = container.querySelectorAll('.cart-item-row');
      expect(rows.length).toBe(12);
    });

    it('1.2. Carga con 16 productos: renderizado íntegro sin colapso ni overflow exterior', () => {
      const lineas16 = generateAdversarialLineas(16);
      const props = createProps(lineas16);

      const { container } = render(
        <div style={{ height: '550px', width: '380px', display: 'flex', flexDirection: 'column' }}>
          <CartPanel {...props} />
        </div>
      );

      const itemsContainer = screen.getByTestId('cart-items-container');
      expect(itemsContainer).toBeInTheDocument();
      expect(itemsContainer.className).toContain('flex-1');
      expect(itemsContainer.className).toContain('min-h-0');

      const rows = container.querySelectorAll('.cart-item-row');
      expect(rows.length).toBe(16);
    });

    it('1.3. Carga con 20 productos: verifica que cada fila conserva controles y legibilidad', () => {
      const lineas20 = generateAdversarialLineas(20);
      const props = createProps(lineas20);

      const { container } = render(
        <div style={{ height: '500px', width: '380px', display: 'flex', flexDirection: 'column' }}>
          <CartPanel {...props} />
        </div>
      );

      const rows = container.querySelectorAll('.cart-item-row');
      expect(rows.length).toBe(20);

      // Cada fila tiene los controles interactivos accesibles
      const btnsAumentar = screen.getAllByTestId('btn-aumentar-cantidad');
      expect(btnsAumentar.length).toBe(20);

      const btnsDisminuir = screen.getAllByTestId('btn-disminuir-cantidad');
      expect(btnsDisminuir.length).toBe(20);

      const btnsEliminar = screen.getAllByTestId('btn-eliminar-linea');
      expect(btnsEliminar.length).toBe(20);
    });

    it('1.4. Carga con 25 productos: contenedor de carrito mantiene altura flexible y footer visible', () => {
      const lineas25 = generateAdversarialLineas(25);
      const props = createProps(lineas25);

      const { container } = render(
        <div style={{ height: '650px', width: '400px', display: 'flex', flexDirection: 'column' }}>
          <CartPanel {...props} />
        </div>
      );

      const itemsContainer = screen.getByTestId('cart-items-container');
      expect(itemsContainer).toBeInTheDocument();
      expect(container.querySelectorAll('.cart-item-row').length).toBe(25);

      const footer = container.querySelector('.pos-cart-footer');
      expect(footer).toBeInTheDocument();
      expect(footer?.className).toContain('shrink-0');
      expect(footer?.className).toContain('mt-auto');

      const btnCobrar = screen.getByTestId('btn-cobrar');
      expect(btnCobrar).toBeInTheDocument();
      expect(btnCobrar).not.toBeDisabled();
    });

    it('1.5. Carga extrema con 50 productos: estabilidad del DOM sin desbordamiento ni crash', () => {
      const lineas50 = generateAdversarialLineas(50);
      const props = createProps(lineas50);

      const { container } = render(
        <div style={{ height: '700px', width: '420px', display: 'flex', flexDirection: 'column' }}>
          <CartPanel {...props} />
        </div>
      );

      const rows = container.querySelectorAll('.cart-item-row');
      expect(rows.length).toBe(50);

      const itemsContainer = screen.getByTestId('cart-items-container');
      expect(itemsContainer.className).toContain('overflow-y-auto');
      expect(itemsContainer.className).toContain('min-h-0');

      const footer = container.querySelector('.pos-cart-footer');
      expect(footer).toBeInTheDocument();
      expect(footer?.className).toContain('shrink-0');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 2: Floating-point Quantities, Precision Arithmetic & formattedTotalItems
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Suite 2: Floating-Point Weights and Arithmetic Precision', () => {
    it('2.1. Pesos flotantes de balanza (0.333 kg, 1.455 kg, 12.875 kg): formatea a 2 decimales sin NaN ni bugs de precisión IEEE-754', () => {
      // 0.333 + 1.455 + 12.875 = 14.663 kg
      const lineasFlotantes = generateAdversarialLineas(3, {
        customQuantities: [0.333, 1.455, 12.875],
        unit: 'KG',
      });
      const props = createProps(lineasFlotantes);

      const { container } = render(
        <div style={{ height: '600px', width: '400px', display: 'flex', flexDirection: 'column' }}>
          <CartPanel {...props} />
        </div>
      );

      // 14.663 redondeado a 2 decimales por toFixed(2) es 14.66
      // Verificamos que NO exista el string con artefacto flotante (ej: 14.663000000000002) ni NaN
      expect(container.textContent).not.toContain('NaN');
      expect(container.textContent).not.toContain('14.663000000000002');
      expect(container.textContent).not.toContain('undefined');

      // Debe mostrar 14.66 ítems tanto en GlassCard header como en el TOTAL badge
      const badges = screen.getAllByText(/14\.66 ítems/i);
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });

    it('2.2. Mitigación del fallo binario clásico IEEE-754: 0.1 kg + 0.2 kg (0.30000000000000004)', () => {
      // En JS plano: 0.1 + 0.2 === 0.30000000000000004
      const lineasIEEE = generateAdversarialLineas(2, {
        customQuantities: [0.1, 0.2],
        unit: 'KG',
      });
      const props = createProps(lineasIEEE);

      const { container } = render(
        <div style={{ height: '600px', width: '400px', display: 'flex', flexDirection: 'column' }}>
          <CartPanel {...props} />
        </div>
      );

      // formattedTotalItems debe normalizar a 0.3
      expect(container.textContent).not.toContain('0.30000000000000004');
      const badges = screen.getAllByText(/0\.3 ítems/i);
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });

    it('2.3. Cantidades enteras o suma exacta entera con pesos fraccionarios (ej. 0.5 kg + 0.5 kg = 1 ítem singular)', () => {
      // 0.5 + 0.5 = 1 (entero). Debe usar 'ítem' en singular sin decimales ".00"
      const lineasUnidadEntera = generateAdversarialLineas(2, {
        customQuantities: [0.5, 0.5],
        unit: 'KG',
      });
      const props = createProps(lineasUnidadEntera);

      render(
        <div style={{ height: '600px', width: '400px', display: 'flex', flexDirection: 'column' }}>
          <CartPanel {...props} />
        </div>
      );

      // Verificamos "1 ítem" en singular
      const badges = screen.getAllByText(/1 ítem/i);
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });

    it('2.4. Cantidades enteras mayores: 3 ítems exactos no muestran decimales', () => {
      const lineasEnteras = generateAdversarialLineas(3, {
        customQuantities: [1, 1, 1],
        unit: 'UNIDAD',
      });
      const props = createProps(lineasEnteras);

      render(
        <div style={{ height: '600px', width: '400px', display: 'flex', flexDirection: 'column' }}>
          <CartPanel {...props} />
        </div>
      );

      const badges = screen.getAllByText(/3 ítems/i);
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });

    it('2.5. Micro-fracciones de balanza analítica: 0.05 kg + 0.025 kg = 0.08 kg', () => {
      const lineasMicro = generateAdversarialLineas(2, {
        customQuantities: [0.05, 0.025],
        unit: 'KG',
      });
      const props = createProps(lineasMicro);

      const { container } = render(
        <div style={{ height: '600px', width: '400px', display: 'flex', flexDirection: 'column' }}>
          <CartPanel {...props} />
        </div>
      );

      expect(container.textContent).not.toContain('NaN');
      // 0.075 toFixed(2) -> 0.07 o 0.08
      const badges = screen.getAllByText(/0\.0[78] ítems/i);
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 3: Rapid Mutations, State Events & Race Condition Prevention
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Suite 3: Rapid Mutations & Event Concurrency', () => {
    it('3.1. Incrementos rápidos en serie: múltiples clics en botón (+) invocan handler con la cantidad correcta', () => {
      const lineas = generateAdversarialLineas(3);
      lineas[0].cantidad = 2;
      const props = createProps(lineas);

      render(
        <div style={{ height: '600px', width: '400px', display: 'flex', flexDirection: 'column' }}>
          <CartPanel {...props} />
        </div>
      );

      const row0 = screen.getByTestId(`cart-item-row-${lineas[0].productoId}`);
      const btnAumentar = row0.querySelector('[data-testid="btn-aumentar-cantidad"]');
      expect(btnAumentar).not.toBeNull();

      // Clic rápido 1: 2 + 1 = 3
      fireEvent.click(btnAumentar!);
      expect(props.onUpdateCantidad).toHaveBeenCalledWith(lineas[0].productoId, 3);

      // Clic rápido 2: 2 + 1 = 3 (simula re-disparo antes de rerender)
      fireEvent.click(btnAumentar!);
      expect(props.onUpdateCantidad).toHaveBeenCalledTimes(2);
    });

    it('3.2. Decremento rápido a cero o negativo: debe invocar onRemoveLinea y no dejar cantidad <= 0', () => {
      const lineas = generateAdversarialLineas(2);
      lineas[0].cantidad = 1; // 1 - 1 = 0 -> debe remover
      const props = createProps(lineas);

      render(
        <div style={{ height: '600px', width: '400px', display: 'flex', flexDirection: 'column' }}>
          <CartPanel {...props} />
        </div>
      );

      const row0 = screen.getByTestId(`cart-item-row-${lineas[0].productoId}`);
      const btnDisminuir = row0.querySelector('[data-testid="btn-disminuir-cantidad"]');
      expect(btnDisminuir).not.toBeNull();

      fireEvent.click(btnDisminuir!);
      // Debe invocar onRemoveLinea para cantidad <= 0
      expect(props.onRemoveLinea).toHaveBeenCalledWith(lineas[0].productoId);
      expect(props.onUpdateCantidad).not.toHaveBeenCalled();
    });

    it('3.3. Eliminación rápida de ítems consecutivos: invoca onRemoveLinea para cada producto sin colapsar el estado', () => {
      const lineas = generateAdversarialLineas(5);
      const props = createProps(lineas);

      render(
        <div style={{ height: '600px', width: '400px', display: 'flex', flexDirection: 'column' }}>
          <CartPanel {...props} />
        </div>
      );

      // Clic en eliminar para producto 1 y producto 3
      const btnEliminar1 = screen.getByTestId(`cart-item-row-${lineas[0].productoId}`).querySelector('[data-testid="btn-eliminar-linea"]');
      const btnEliminar3 = screen.getByTestId(`cart-item-row-${lineas[2].productoId}`).querySelector('[data-testid="btn-eliminar-linea"]');

      expect(btnEliminar1).not.toBeNull();
      expect(btnEliminar3).not.toBeNull();

      fireEvent.click(btnEliminar1!);
      expect(props.onRemoveLinea).toHaveBeenCalledWith(lineas[0].productoId);

      fireEvent.click(btnEliminar3!);
      expect(props.onRemoveLinea).toHaveBeenCalledWith(lineas[2].productoId);
      expect(props.onRemoveLinea).toHaveBeenCalledTimes(2);
    });

    it('3.4. Input de cantidad con valores inválidos o cero en evento onBlur: remueve el ítem de forma segura', () => {
      const lineas = generateAdversarialLineas(1);
      const props = createProps(lineas);

      render(
        <div style={{ height: '600px', width: '400px', display: 'flex', flexDirection: 'column' }}>
          <CartPanel {...props} />
        </div>
      );

      const inputCantidad = screen.getByTestId('input-cantidad');

      // Simular ingreso de valor inválido "0" y pérdida de foco
      fireEvent.change(inputCantidad, { target: { value: '0' } });
      fireEvent.blur(inputCantidad, { target: { value: '0' } });
      expect(props.onRemoveLinea).toHaveBeenCalledWith(lineas[0].productoId);

      // Simular ingreso de valor negativo "-3" y pérdida de foco
      fireEvent.blur(inputCantidad, { target: { value: '-3' } });
      expect(props.onRemoveLinea).toHaveBeenCalledTimes(2);

      // Simular ingreso de valor string no numérico
      fireEvent.blur(inputCantidad, { target: { value: 'abc' } });
      expect(props.onRemoveLinea).toHaveBeenCalledTimes(3);
    });

    it('3.5. Transición a Carrito Vacío: al limpiar el carrito renderiza el estado vacío sin elementos residuales', () => {
      const props = createProps([]);

      const { container } = render(
        <div style={{ height: '600px', width: '400px', display: 'flex', flexDirection: 'column' }}>
          <CartPanel {...props} />
        </div>
      );

      expect(screen.getByText(/el carrito está vacío/i)).toBeInTheDocument();
      expect(container.querySelectorAll('.cart-item-row').length).toBe(0);

      // El contenedor de lista sigue presente con min-h-0 flex-1
      const itemsContainer = screen.getByTestId('cart-items-container');
      expect(itemsContainer.className).toContain('flex-1');
      expect(itemsContainer.className).toContain('min-h-0');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 4: Footer Strict Anchoring & Layout Stability
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Suite 4: Footer Strict Anchoring & Layout Resilience', () => {
    it('4.1. .pos-cart-footer permanece firmemente anclado con shrink-0 mt-auto sin clases sticky ni bottom-0', () => {
      const lineas = generateAdversarialLineas(15);
      const props = createProps(lineas);

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

      // Botón principal de cobro presente en el footer
      const btnCobrar = screen.getByTestId('btn-cobrar');
      expect(btnCobrar).toBeInTheDocument();
      expect(btnCobrar).toBeVisible();
    });

    it('4.2. Viewport ultracompacto (320px x 400px): no empuja el footer fuera del DOM ni rompe el scroll', () => {
      const lineas = generateAdversarialLineas(18);
      const props = createProps(lineas);

      const { container } = render(
        <div style={{ height: '400px', width: '320px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <CartPanel {...props} />
        </div>
      );

      // El footer sigue existiendo en el DOM
      const footer = container.querySelector('.pos-cart-footer');
      expect(footer).toBeInTheDocument();

      // Botón de cobro sigue clickeable y habilitado
      const btnCobrar = screen.getByTestId('btn-cobrar');
      expect(btnCobrar).toBeInTheDocument();
      expect(btnCobrar).not.toBeDisabled();

      // Contenedor de scroll conserva flex-1 min-h-0 overflow-y-auto
      const itemsContainer = screen.getByTestId('cart-items-container');
      expect(itemsContainer.className).toContain('flex-1');
      expect(itemsContainer.className).toContain('min-h-0');
      expect(itemsContainer.className).toContain('overflow-y-auto');
    });

    it('4.3. Nombres de producto extremadamente largos (120+ caracteres): no provocan desbordamiento horizontal en la fila', () => {
      const lineasLargas = generateAdversarialLineas(5, { longNames: true });
      const props = createProps(lineasLargas);

      const { container } = render(
        <div style={{ height: '600px', width: '380px', display: 'flex', flexDirection: 'column' }}>
          <CartPanel {...props} />
        </div>
      );

      lineasLargas.forEach((linea) => {
        const nameElem = screen.getByTestId(`cart-item-name-${linea.productoId}`);
        expect(nameElem).toBeInTheDocument();
        // Debe tener truncate para no romper la altura ni el ancho
        expect(nameElem.className).toContain('truncate');
        expect(nameElem.getAttribute('title')).toBe(linea.nombre);

        const row = screen.getByTestId(`cart-item-row-${linea.productoId}`);
        expect(row.className).toContain('min-h-[58px]');
        expect(row.className).toContain('max-h-[64px]');
      });
    });

    it('4.4. Cifras multimillonarias ($1.250.000.000 COP): renderizado exacto con formato colombiano sin NaN ni desbordamiento', () => {
      const lineasMillonarias = generateAdversarialLineas(4, { highPrices: true });
      const props = createProps(lineasMillonarias);

      const { container } = render(
        <div style={{ height: '600px', width: '400px', display: 'flex', flexDirection: 'column' }}>
          <CartPanel {...props} />
        </div>
      );

      const footer = container.querySelector('.pos-cart-footer');
      expect(footer).toBeInTheDocument();
      expect(footer?.textContent).not.toContain('NaN');

      const totalExpected = lineasMillonarias.reduce((acc, l) => acc + l.totalLinea, 0);
      expect(footer?.textContent).toContain(`$${totalExpected.toLocaleString('es-CO')}`);
    });

    it('4.5. Modo mostrador con pedidos en espera y 20 productos: botón preventa anclado y visible', () => {
      const lineas20 = generateAdversarialLineas(20);
      const mockDrafts: CartDraft[] = [
        {
          id: 'draft-1',
          alias: 'Mesa 1',
          lineas: [],
          descuentoGlobal: 0,
          total: 45000,
          totalFinal: 45000,
          fechaGuardado: new Date().toISOString(),
          fecha: new Date().toISOString(),
        },
      ];
      const props = createProps(lineas20, true, true, mockDrafts);

      render(
        <div style={{ height: '650px', width: '400px', display: 'flex', flexDirection: 'column' }}>
          <CartPanel {...props} />
        </div>
      );

      // Botón de emisión de preventa visible y accesible con >= 44px
      const btnEmitir = screen.getByTestId('btn-emitir-preventa-mostrador');
      expect(btnEmitir).toBeInTheDocument();
      expect(btnEmitir).toBeVisible();
      expect(btnEmitir).not.toBeDisabled();
      expect(btnEmitir.className).toContain('min-h-[44px]');

      // Al hacer clic dispara onGuardarBorrador
      fireEvent.click(btnEmitir);
      expect(props.onGuardarBorrador).toHaveBeenCalled();
    });
  });
});
