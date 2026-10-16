import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductAvatar } from '../components/common/ProductAvatar';
import { ProductSearchPanel } from '../views/pos/components/ProductSearchPanel';
import type { Product } from '../types/erp.types';

describe('TASK-018-01: Refactorización de ProductAvatar y Catálogo POS Mostrador (Cero Imágenes)', () => {
  const mockProducts: Product[] = [
    {
      id: 'prod-001',
      sku: 'PAR-01',
      nombre: 'Pargo Rojo Platero',
      categoria: 'PESCADOS',
      unidadMedida: 'kg',
      precio_venta_pos: 38000,
      activo: true,
      buffer_seguridad: 5,
    } as Product,
    {
      id: 'prod-002',
      sku: 'CAM-01',
      nombre: 'Camarón Tití Limpio',
      categoria: 'CRUSTACEOS',
      unidadMedida: 'kg',
      precio_venta_pos: 42000,
      activo: true,
      buffer_seguridad: 4,
    } as Product,
    {
      id: 'prod-003',
      sku: 'FIL-01',
      nombre: 'Filete de Salmón Fresco',
      categoria: 'CORTES',
      unidadMedida: 'kg',
      precio_venta_pos: 65000,
      activo: true,
      buffer_seguridad: 3,
    } as Product,
    {
      id: 'prod-004',
      sku: 'BEB-01',
      nombre: 'Jugo de Mora 400ml',
      categoria: 'BEBIDAS',
      unidadMedida: 'und',
      precio_venta_pos: 6000,
      activo: true,
      buffer_seguridad: 10,
    } as Product,
  ];

  const mockOnAddProduct = vi.fn();
  const mockGetProductPrice = vi.fn((p) => p.precio_venta_pos || 10000);
  const mockGetProductStock = vi.fn((sku) => (sku === 'PAR-01' ? 12 : 25));

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. ProductAvatar en modo vectorOnly debe renderizar SVG vectorial y CERO etiquetas <img>', () => {
    const { container } = render(
      <ProductAvatar
        nombre="Pargo Rojo Platero"
        categoria="Pescados"
        vectorOnly={true}
      />
    );

    const imgTag = container.querySelector('img');
    expect(imgTag).toBeNull(); // Cero etiquetas <img>

    const vectorContainer = screen.getByTestId('product-avatar-vector');
    expect(vectorContainer).toBeInTheDocument();
    const svgIcon = vectorContainer.querySelector('svg');
    expect(svgIcon).toBeTruthy();
  });

  it('2. ProductAvatar debe aplicar iconografía temática según nombre y categoría', () => {
    // Camarón -> Waves / Marisco
    const { container: containerCamaron } = render(
      <ProductAvatar
        nombre="Camarón Tigre Congelado"
        categoria="Crustáceos"
        vectorOnly={true}
      />
    );
    expect(containerCamaron.querySelector('img')).toBeNull();
    const vectorCamaron = containerCamaron.querySelector('[data-testid="product-avatar-vector"]');
    expect(vectorCamaron?.className).toContain('bg-orange-50');

    // Filete -> UtensilsCrossed / Corte
    const { container: containerFilete } = render(
      <ProductAvatar
        nombre="Filete de Tilapia"
        categoria="Cortes"
        vectorOnly={true}
      />
    );
    expect(containerFilete.querySelector('img')).toBeNull();
    const vectorFilete = containerFilete.querySelector('[data-testid="product-avatar-vector"]');
    expect(vectorFilete?.className).toContain('bg-emerald-50');
  });

  it('3. ProductSearchPanel en POS debe renderizar tarjetas con min-h-[72px], feedback táctil y CERO etiquetas <img>', () => {
    const { container } = render(
      <ProductSearchPanel
        activeProducts={mockProducts}
        dynamicFields={[]}
        cliente={null}
        getProductPrice={mockGetProductPrice}
        getProductStock={mockGetProductStock}
        onAddProduct={mockOnAddProduct}
      />
    );

    // Mandato estricto Cero Imágenes: no debe haber ningún <img> en el panel de búsqueda
    const imgTags = container.querySelectorAll('img');
    expect(imgTags.length).toBe(0);

    // Debe renderizar tarjetas táctiles de producto con min-h-[72px]
    const productCards = container.querySelectorAll('.product-card');
    expect(productCards.length).toBeGreaterThan(0);
    productCards.forEach((card) => {
      expect(card.className).toContain('min-h-[72px]');
      expect(card.className).toContain('active:scale-95');
    });
  });

  it('4. ProductSearchPanel debe mostrar badges distintivos de modalidad de venta y semáforo de stock', () => {
    render(
      <ProductSearchPanel
        activeProducts={mockProducts}
        dynamicFields={[]}
        cliente={null}
        getProductPrice={mockGetProductPrice}
        getProductStock={mockGetProductStock}
        onAddProduct={mockOnAddProduct}
      />
    );

    // Badges de Kilos y Unidad
    expect(screen.getAllByText(/KILOS/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/UNIDAD/i).length).toBeGreaterThan(0);

    // Semáforo de stock verde presente para stock normal
    const greenBadges = screen.getAllByTestId('stock-badge-green');
    expect(greenBadges.length).toBeGreaterThan(0);
  });
});

describe('TASK-018-02: Cobro Rápido en POS Mostrador (Flujo en 2 Clics & Targets >= 48px)', () => {
  const mockLineas: any[] = [
    {
      productoId: 'prod-001',
      sku: 'PAR-01',
      nombre: 'Pargo Rojo Platero',
      cantidad: 2.0,
      unidad: 'KG',
      precioLista: 38000,
      descuentoPct: 0,
      precioFinal: 38000,
      totalLinea: 76000,
      precioCompra: 24000,
      esPesoManual: false,
    },
  ];

  const defaultProps = {
    totalFinal: 76000,
    lineas: mockLineas,
    cliente: null,
    stock: { 'b-1': { 'PAR-01': 50 } },
    bodegaActivaId: 'b-1',
    bodegaActivaNombre: 'Bodega Central',
    onGuardarBorrador: vi.fn(),
    onPagar: vi.fn().mockResolvedValue({ id: 'vta-777', total: 76000 }),
    onLimpiarCarrito: vi.fn(),
    isDisabled: false,
    isTurnoAbierto: true,
  };

  it('1. PaymentPanel debe renderizar botón de acción rápida "⚡ Efectivo Exacto (1-Tap)" con data-testid="btn-efectivo-exacto-directo" y altura >= 48px', async () => {
    const { PaymentPanel } = await import('../views/pos/components/PaymentPanel');
    const { render, screen } = await import('@testing-library/react');

    render(<PaymentPanel {...defaultProps} />);

    const btn1Tap = screen.getByTestId('btn-efectivo-exacto-directo');
    expect(btn1Tap).toBeInTheDocument();
    expect(btn1Tap.className).toContain('min-h-[48px]');
  });

  it('2. Al pulsar "⚡ Efectivo Exacto (1-Tap)", debe ejecutar inmediatamente onPagar con monto exacto en 1 clic', async () => {
    const { PaymentPanel } = await import('../views/pos/components/PaymentPanel');
    const { render, screen, fireEvent } = await import('@testing-library/react');

    const onPagarMock = vi.fn().mockResolvedValue({ id: 'vta-777' });
    render(<PaymentPanel {...defaultProps} onPagar={onPagarMock} />);

    const btn1Tap = screen.getByTestId('btn-efectivo-exacto-directo');
    fireEvent.click(btn1Tap);

    expect(onPagarMock).toHaveBeenCalledTimes(1);
    expect(onPagarMock).toHaveBeenCalledWith([{ metodo: 'EFECTIVO', monto: 76000 }]);
  });

  it('3. Si el turno de caja está cerrado, el botón 1-Tap debe estar deshabilitado para prevenir desajustes contables', async () => {
    const { PaymentPanel } = await import('../views/pos/components/PaymentPanel');
    const { render, screen } = await import('@testing-library/react');

    render(<PaymentPanel {...defaultProps} isTurnoAbierto={false} />);

    const btn1Tap = screen.getByTestId('btn-efectivo-exacto-directo');
    expect(btn1Tap).toBeDisabled();
  });

  it('4. Botón principal de cobrar debe tener altura táctil gigante >= 56px', async () => {
    const { PaymentPanel } = await import('../views/pos/components/PaymentPanel');
    const { render, screen } = await import('@testing-library/react');

    render(<PaymentPanel {...defaultProps} />);

    const btnCobrar = screen.getByTestId('btn-cobrar');
    expect(btnCobrar).toBeInTheDocument();
    expect(btnCobrar.className).toContain('min-h-[56px]');
  });

  it('5. Botones de denominaciones rápidas COP ($10k, $20k, $50k, $100k) deben tener min-h-[48px]', async () => {
    const { PaymentPanel } = await import('../views/pos/components/PaymentPanel');
    const { render, screen } = await import('@testing-library/react');

    render(<PaymentPanel {...defaultProps} />);

    ['$10k', '$20k', '$50k', '$100k'].forEach((denom) => {
      const btnDenom = screen.getByText(denom);
      expect(btnDenom.className).toContain('min-h-[48px]');
    });
  });
});

describe('TASK-018-03: Wizard Asistido de Arqueo y Cierre de Caja en 3 Pasos', () => {
  const mockTurno = {
    id: 'turno-12345678',
    cajaId: 'caja-1',
    usuarioId: 'cajero-01',
    fechaApertura: '2026-10-16T08:00:00Z',
    estado: 'ABIERTO' as const,
    baseInicial: 100000,
    totalEfectivo: 350000,
    totalDatafono: 120000,
    totalTransferencias: 80000,
    saldoTeoricoGlobal: 550000,
  };

  it('1. CalculadorDenominaciones debe renderizar botones táctiles de incremento y decremento >= 48px', async () => {
    const { CalculadorDenominaciones } = await import('../views/cash/components/CalculadorDenominaciones');
    const { render } = await import('@testing-library/react');

    const mockValores = {
      billetes100k: 1,
      billetes50k: 2,
      billetes20k: 0,
      billetes10k: 0,
      billetes5k: 0,
      billetes2k: 0,
      monedas1k: 0,
      monedas500: 0,
      monedas200: 0,
      monedas100: 0,
      monedas50: 0,
    };

    const { container } = render(<CalculadorDenominaciones valores={mockValores} onChange={vi.fn()} />);

    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((btn) => {
      expect(btn.className).toContain('min-w-[48px]');
      expect(btn.className).toContain('min-h-[48px]');
    });
  });

  it('2. ArqueoCajaModal debe renderizar Stepper de 3 pasos con botones >= 48px y permitir navegar entre pasos', async () => {
    const ArqueoCajaModal = (await import('../views/cash/components/ArqueoCajaModal')).default;
    const { render, screen, fireEvent } = await import('@testing-library/react');

    const { unmount } = render(
      <ArqueoCajaModal
        turnoActivo={mockTurno as any}
        usuarioId="cajero-01"
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    // Los 3 botones del Stepper
    const step1 = screen.getByTestId('step-btn-1');
    const step2 = screen.getByTestId('step-btn-2');
    const step3 = screen.getByTestId('step-btn-3');

    expect(step1.className).toContain('min-h-[48px]');
    expect(step2.className).toContain('min-h-[48px]');
    expect(step3.className).toContain('min-h-[48px]');

    // Navegar con botón siguiente hacia paso 2
    const btnSiguiente = screen.getByTestId('btn-siguiente-step');
    fireEvent.click(btnSiguiente);

    // En paso 2 debe mostrar Datáfono y botón siguiente hacia paso 3
    expect(screen.getByTestId('input-datafono-arqueo')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('btn-siguiente-step'));

    // En paso 3 debe mostrar botón gigante de confirmación de cierre >= 56px
    const btnConfirmar = screen.getByTestId('btn-confirmar-arqueo');
    expect(btnConfirmar).toBeInTheDocument();
    expect(btnConfirmar.className).toContain('min-h-[56px]');

    unmount();
  });

  it('3. ArqueoCajaModal en Step 2 debe permitir copiar saldos esperados con 1 toque y CierreCajaModal debe delegar correctamente', async () => {
    const ArqueoCajaModal = (await import('../views/cash/components/ArqueoCajaModal')).default;
    const CierreCajaModal = (await import('../views/cash/components/CierreCajaModal')).default;
    const { render, screen, fireEvent } = await import('@testing-library/react');

    const { unmount } = render(
      <ArqueoCajaModal
        turnoActivo={mockTurno as any}
        usuarioId="cajero-01"
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        esAdmin={true}
      />
    );

    // Navegar al paso 2
    fireEvent.click(screen.getByTestId('step-btn-2'));

    // Botones de copiar presentes
    const btnCopiarDatafono = screen.getByTestId('btn-copiar-datafono');
    const btnCopiarTransf = screen.getByTestId('btn-copiar-transferencia');

    fireEvent.click(btnCopiarDatafono);
    fireEvent.click(btnCopiarTransf);

    expect((screen.getByTestId('input-datafono-arqueo') as HTMLInputElement).value).toBe('120000');
    expect((screen.getByTestId('input-transferencia-arqueo') as HTMLInputElement).value).toBe('80000');

    unmount();

    // Comprobar que CierreCajaModal re-exporta y renderiza el wizard sin romper
    render(
      <CierreCajaModal
        turnoActivo={mockTurno as any}
        usuarioId="cajero-01"
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );
    expect(screen.getByTestId('step-btn-1')).toBeInTheDocument();
  });
});

