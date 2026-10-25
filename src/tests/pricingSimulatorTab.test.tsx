import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PricingSimulatorTab } from '../views/pricing/components/PricingSimulatorTab';
import { DEFAULT_PRICING_GLOBAL_CONFIG } from '../services/pricing/pricingConfigService';
import type { Product } from '../types/erp.types';

// Mock de SweetAlert2
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: true }),
  },
}));

const mockProducts: Product[] = [
  {
    id: 'prod-001',
    sku: 'SALM-001',
    nombre: 'Salmón Noruego Premium',
    categoria: 'cat-salmon',
    unidadMedida: 'kg',
    precio_compra: 20000,
    buffer_seguridad: 10,
    precio_venta_pos: 30800,
    precio_venta_restaurante: 28600,
    precio_venta_mayorista: 25300,
    activo: true,
  },
  {
    id: 'prod-002',
    sku: 'TIL-001',
    nombre: 'Tilapia Roja Entera',
    categoria: 'cat-blanco',
    unidadMedida: 'kg',
    precio_compra: 8000,
    buffer_seguridad: 8,
    precio_venta_pos: 12000,
    precio_venta_restaurante: 11000,
    precio_venta_mayorista: 10000,
    activo: true,
  },
];

describe('TASK-028-05: PricingSimulatorTab y Componentes Multicanal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar el simulador interactivo con buscador y selector de producto', () => {
    render(
      <PricingSimulatorTab
        products={mockProducts}
        globalConfig={DEFAULT_PRICING_GLOBAL_CONFIG}
        onCommitProductTariffs={vi.fn()}
        onApplyBatchRecalculate={vi.fn()}
      />
    );

    expect(screen.getByTestId('pricing-simulator-tab')).toBeInTheDocument();
    expect(screen.getByTestId('select-simulator-product')).toBeInTheDocument();
  });

  it('debe calcular y renderizar las 3 tarjetas de canales al seleccionar un producto', () => {
    render(
      <PricingSimulatorTab
        products={mockProducts}
        globalConfig={DEFAULT_PRICING_GLOBAL_CONFIG}
        onCommitProductTariffs={vi.fn()}
        onApplyBatchRecalculate={vi.fn()}
      />
    );

    // Seleccionar el primer producto
    const select = screen.getByTestId('select-simulator-product');
    fireEvent.change(select, { target: { value: 'prod-001' } });

    // Tarjetas de los 3 canales
    expect(screen.getByTestId('channel-card-pos')).toBeInTheDocument();
    expect(screen.getByTestId('channel-card-restaurante')).toBeInTheDocument();
    expect(screen.getByTestId('channel-card-mayorista')).toBeInTheDocument();

    // Verificación de precios calculados
    expect(screen.getByText('$30.800')).toBeInTheDocument(); // POS (22000 * 1.40)
    expect(screen.getByText('$28.600')).toBeInTheDocument(); // HORECA (22000 * 1.30)
    expect(screen.getByText('$25.300')).toBeInTheDocument(); // Mayorista (22000 * 1.15)
  });

  it('debe permitir abrir el modal de recálculo en lote para la categoría activa', () => {
    render(
      <PricingSimulatorTab
        products={mockProducts}
        globalConfig={DEFAULT_PRICING_GLOBAL_CONFIG}
        onCommitProductTariffs={vi.fn()}
        onApplyBatchRecalculate={vi.fn()}
      />
    );

    const btnBatch = screen.getByTestId('btn-open-batch-modal');
    fireEvent.click(btnBatch);

    expect(screen.getByTestId('batch-recalculate-modal')).toBeInTheDocument();
    expect(screen.getByText(/Recálculo Masivo de Precios/i)).toBeInTheDocument();
  });

  it('debe disparar la confirmación y publicación de tarifas al hacer clic en Guardar Tarifas', () => {
    const handleCommit = vi.fn().mockReturnValue({ success: true });

    render(
      <PricingSimulatorTab
        products={mockProducts}
        globalConfig={DEFAULT_PRICING_GLOBAL_CONFIG}
        onCommitProductTariffs={handleCommit}
        onApplyBatchRecalculate={vi.fn()}
      />
    );

    const select = screen.getByTestId('select-simulator-product');
    fireEvent.change(select, { target: { value: 'prod-001' } });

    const btnPublish = screen.getByTestId('btn-publish-tariffs');
    fireEvent.click(btnPublish);

    expect(handleCommit).toHaveBeenCalledTimes(1);
    expect(handleCommit.mock.calls[0][0]).toBe('prod-001');
  });
});
