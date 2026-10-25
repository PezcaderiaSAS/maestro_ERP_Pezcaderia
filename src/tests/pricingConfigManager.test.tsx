import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PricingConfigManager } from '../views/pricing/components/PricingConfigManager';
import { DEFAULT_PRICING_GLOBAL_CONFIG } from '../services/pricing/pricingConfigService';

// Mock de SweetAlert2
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: true }),
  },
}));

describe('TASK-028-04: PricingConfigManager (Panel Exclusivo Admin para Mermas y Márgenes)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe mostrar mensaje de acceso restringido si el rol del usuario no es admin', () => {
    render(
      <PricingConfigManager
        userRole="vendedor"
        globalConfig={DEFAULT_PRICING_GLOBAL_CONFIG}
        onSaveConfig={vi.fn()}
      />
    );

    expect(screen.getByTestId('pricing-config-access-denied')).toBeInTheDocument();
    expect(screen.getByText(/Acceso Restringido/i)).toBeInTheDocument();
  });

  it('debe renderizar el panel completo con controles táctiles si el usuario es admin', () => {
    render(
      <PricingConfigManager
        userRole="admin"
        globalConfig={DEFAULT_PRICING_GLOBAL_CONFIG}
        onSaveConfig={vi.fn()}
      />
    );

    expect(screen.getByTestId('pricing-config-manager')).toBeInTheDocument();
    expect(screen.getByText(/Configuración Maestra de Mermas y Márgenes/i)).toBeInTheDocument();

    // Inputs de márgenes de canal
    expect(screen.getByTestId('input-margen-pos')).toBeInTheDocument();
    expect(screen.getByTestId('input-margen-restaurante')).toBeInTheDocument();
    expect(screen.getByTestId('input-margen-mayorista')).toBeInTheDocument();
    expect(screen.getByTestId('input-margen-seguridad')).toBeInTheDocument();

    // Tabla de buffers por categoría
    expect(screen.getByTestId('table-waste-configs')).toBeInTheDocument();
    expect(screen.getByText('Salmón y Pescado Graso')).toBeInTheDocument();
  });

  it('debe permitir modificar márgenes de canal y llamar a onSaveConfig al guardar', () => {
    const handleSave = vi.fn().mockReturnValue({ success: true });

    render(
      <PricingConfigManager
        userRole="admin"
        globalConfig={DEFAULT_PRICING_GLOBAL_CONFIG}
        onSaveConfig={handleSave}
      />
    );

    const inputPos = screen.getByTestId('input-margen-pos');
    fireEvent.change(inputPos, { target: { value: '45' } });

    const btnSave = screen.getByTestId('btn-save-pricing-config');
    fireEvent.click(btnSave);

    expect(handleSave).toHaveBeenCalledTimes(1);
    const savedPayload = handleSave.mock.calls[0][0];
    expect(savedPayload.canales.margenPosPct).toBe(45);
  });

  it('debe permitir modificar el buffer de una categoría marina específica', () => {
    const handleSave = vi.fn().mockReturnValue({ success: true });

    render(
      <PricingConfigManager
        userRole="admin"
        globalConfig={DEFAULT_PRICING_GLOBAL_CONFIG}
        onSaveConfig={handleSave}
      />
    );

    // Modificar buffer de la primera categoría (Salmón)
    const inputBufferSalmon = screen.getByTestId('input-buffer-cat-salmon');
    fireEvent.change(inputBufferSalmon, { target: { value: '14' } });

    const btnSave = screen.getByTestId('btn-save-pricing-config');
    fireEvent.click(btnSave);

    expect(handleSave).toHaveBeenCalledTimes(1);
    const savedPayload = handleSave.mock.calls[0][0];
    const salmonConfig = savedPayload.categoriasWaste.find(
      (c: any) => c.categoriaId === 'cat-salmon'
    );
    expect(salmonConfig.bufferDefaultPct).toBe(14);
  });
});
