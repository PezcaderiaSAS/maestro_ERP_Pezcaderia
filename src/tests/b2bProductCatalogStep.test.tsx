import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { B2BProductCatalogStep } from '../views/b2b/components/B2BProductCatalogStep';
import { Producto } from '../store/useInventoryStore';
import { Cliente } from '../types/erp.types';

describe('TASK-016-03: B2BProductCatalogStep (Iconografía Vectorial & Catch Weight Dual)', () => {
  const mockCliente: Cliente = {
    id: 'cli-01',
    nombre: 'Restaurante El Faro del Mar',
    identificacion: '900123456-7',
    tipoIdentificacion: 'NIT',
    tipoPersona: 'JURIDICA',
    direccion: 'Carrera 7 # 45-20',
    ciudad: 'Bogotá',
    telefono: '3101234567',
    email: 'contacto@elfaro.com',
    tipoPrecio: 'RESTAURANTE',
    cupoCredito: 10000000,
    cupoCreditoUsado: 2000000,
    activo: true,
  };

  const mockProductos: Producto[] = [
    {
      id: 'prod-01',
      sku: 'TRU-ENT-001',
      nombre: 'Trucha Arcoíris Entera',
      categoria: 'PESCADOS',
      unidadMedida: 'kg',
      precio_compra: 16000,
      buffer_seguridad: 5,
      precio_venta_pos: 26000,
      precio_venta_restaurante: 24000,
      precio_venta_mayorista: 22000,
      activo: true,
    },
    {
      id: 'prod-02',
      sku: 'FIL-SAL-002',
      nombre: 'Filete de Salmón Premium',
      categoria: 'FILETES',
      unidadMedida: 'kg',
      precio_compra: 45000,
      buffer_seguridad: 10,
      precio_venta_pos: 65000,
      precio_venta_restaurante: 62000,
      precio_venta_mayorista: 58000,
      activo: true,
    },
    {
      id: 'prod-03',
      sku: 'CAM-TIG-003',
      nombre: 'Camarón Tigre U15',
      categoria: 'MARISCOS',
      unidadMedida: 'kg',
      precio_compra: 38000,
      buffer_seguridad: 8,
      precio_venta_pos: 54000,
      precio_venta_restaurante: 50000,
      precio_venta_mayorista: 46000,
      activo: true,
    },
    {
      id: 'prod-04',
      sku: 'EMP-CONG-004',
      nombre: 'Empanada de Camarón x 10 und',
      categoria: 'CONGELADOS',
      unidadMedida: 'und',
      precio_compra: 12000,
      buffer_seguridad: 0,
      precio_venta_pos: 20000,
      precio_venta_restaurante: 18000,
      precio_venta_mayorista: 16000,
      activo: true,
    },
  ];

  const mockStock = {
    'Bodega Principal': {
      'TRU-ENT-001': 150,
      'FIL-SAL-002': 45,
      'CAM-TIG-003': 0, // Agotado
      'EMP-CONG-004': 80,
    },
  };

  const defaultProps = {
    selectedCliente: mockCliente,
    cartItems: [],
    onAddItem: vi.fn(),
    onRemoveItem: vi.fn(),
    onNext: vi.fn(),
    onBack: vi.fn(),
    productsList: mockProductos,
    stockMap: mockStock,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Cero Imágenes: Las tarjetas de productos deben renderizar contenedores e iconos vectoriales SVG sin etiquetas img', () => {
    const { container } = render(<B2BProductCatalogStep {...defaultProps} />);

    // Verificar que NO existan tags <img> (cero consumo de imágenes)
    const images = container.querySelectorAll('img');
    expect(images.length).toBe(0);

    // Deben existir SVGs vectoriales temáticos para los productos
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(4);
  });

  it('2. Chips táctiles de categoría deben tener target size >= 48px y filtrar productos instantáneamente', () => {
    render(<B2BProductCatalogStep {...defaultProps} />);

    const chipPescados = screen.getByTestId('b2b-cat-chip-pescados');
    expect(chipPescados).toBeInTheDocument();
    expect(chipPescados.className).toMatch(/min-h-\[48px\]|min-h-\[44px\]|py-2\.5|p-3/);

    // Al filtrar por pescados
    fireEvent.click(chipPescados);
    expect(screen.getByText('Trucha Arcoíris Entera')).toBeInTheDocument();
    expect(screen.queryByText('Camarón Tigre U15')).not.toBeInTheDocument();
  });

  it('3. Muestra el badge de Stock en Bodega Principal con alerta si está agotado', () => {
    render(<B2BProductCatalogStep {...defaultProps} />);

    // Trucha tiene 150 kg en Bodega Principal
    expect(screen.getByText(/Stock Bodega 1: 150 kg|Stock: 150 kg/i)).toBeInTheDocument();

    // Camarón tiene 0 kg
    expect(screen.getByText(/Agotado en Bodega 1|Sin Stock/i)).toBeInTheDocument();
  });

  it('4. Abre el modal Catch Weight Dual al hacer clic en un producto con selector de piezas y calibre', () => {
    render(<B2BProductCatalogStep {...defaultProps} />);

    const btnTrucha = screen.getByTestId('b2b-product-card-TRU-ENT-001');
    fireEvent.click(btnTrucha);

    // Modal Catch Weight Dual desplegado
    expect(screen.getByTestId('b2b-modal-catch-weight')).toBeInTheDocument();
    expect(screen.getByText(/Especificación de Calibre y Piezas/i)).toBeInTheDocument();

    // Controles de piezas con touch target >= 48px
    const btnIncrementarPiezas = screen.getByTestId('b2b-btn-pieces-plus');
    const btnDecrementarPiezas = screen.getByTestId('b2b-btn-pieces-minus');
    expect(btnIncrementarPiezas.className).toMatch(/h-12|h-14|w-12|w-14|min-h-\[48px\]/);
    expect(btnDecrementarPiezas.className).toMatch(/h-12|h-14|w-12|w-14|min-h-\[48px\]/);

    // Chip de calibre (ej. 450-500g)
    const chipCalibre = screen.getByTestId('b2b-calibre-chip-450-500');
    expect(chipCalibre).toBeInTheDocument();
    fireEvent.click(chipCalibre);

    // Leyenda de facturación por kilo real visible
    expect(screen.getByText(/La cotización es referencial:/i)).toBeInTheDocument();

    // Agregar al pedido
    const btnAgregar = screen.getByTestId('b2b-btn-confirm-add-item');
    fireEvent.click(btnAgregar);

    expect(defaultProps.onAddItem).toHaveBeenCalledWith(
      expect.objectContaining({
        sku: 'TRU-ENT-001',
        modalidadVenta: 'CATCH_WEIGHT_PIEZAS',
        calibreMinGramos: 450,
        calibreMaxGramos: 500,
      })
    );
  });

  it('5. El botón CONTINUAR AL RESUMEN debe tener altura >= 56px, reflejar la cantidad de ítems y ejecutar onNext', () => {
    const { rerender } = render(<B2BProductCatalogStep {...defaultProps} cartItems={[]} />);

    const btnContinuar = screen.getByTestId('b2b-btn-continue-step2');
    expect(btnContinuar).toBeDisabled();
    expect(btnContinuar.className).toMatch(/h-14|min-h-\[56px\]/);

    // Al haber ítems en el carrito se habilita
    rerender(
      <B2BProductCatalogStep
        {...defaultProps}
        cartItems={[
          {
            productoId: 'prod-01',
            sku: 'TRU-ENT-001',
            nombre: 'Trucha Arcoíris Entera',
            modalidadVenta: 'CATCH_WEIGHT_PIEZAS',
            cantidadSolicitada: 5,
            pesoEstimado: 2.375,
            precioPactado: 24000,
            calibreMinGramos: 450,
            calibreMaxGramos: 500,
          },
        ]}
      />
    );

    expect(btnContinuar).not.toBeDisabled();
    expect(btnContinuar.textContent).toMatch(/1 ítem|1 producto/i);
    fireEvent.click(btnContinuar);
    expect(defaultProps.onNext).toHaveBeenCalledTimes(1);
  });
});
