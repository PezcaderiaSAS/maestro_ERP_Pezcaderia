import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePricingEngine } from '../hooks/usePricingEngine';
import { DEFAULT_PRICING_GLOBAL_CONFIG } from '../services/pricing/pricingConfigService';

describe('TASK-028-03: usePricingEngine Hook Reactivo de Orquestación', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('debe inicializar con la configuración global por defecto', () => {
    const { result } = renderHook(() => usePricingEngine());
    expect(result.current.globalConfig).toBeDefined();
    expect(result.current.globalConfig.canales.margenPosPct).toBe(40);
    expect(result.current.globalConfig.canales.margenRestaurantePct).toBe(30);
    expect(result.current.globalConfig.canales.margenMayoristaPct).toBe(15);
    expect(result.current.globalConfig.categoriasWaste.length).toBeGreaterThanOrEqual(4);
  });

  it('debe permitir al Admin actualizar la configuración global y persistirla', () => {
    const { result } = renderHook(() => usePricingEngine());

    act(() => {
      const updatedConfig = {
        ...result.current.globalConfig,
        canales: {
          ...result.current.globalConfig.canales,
          margenPosPct: 45,
          margenRestaurantePct: 35,
        },
      };
      const res = result.current.saveGlobalConfig(updatedConfig, 'admin-tester');
      expect(res.success).toBe(true);
    });

    expect(result.current.globalConfig.canales.margenPosPct).toBe(45);
    expect(result.current.globalConfig.canales.margenRestaurantePct).toBe(35);
  });

  it('debe ejecutar la simulación de precios de un producto en tiempo real', () => {
    const { result } = renderHook(() => usePricingEngine());

    act(() => {
      result.current.runSimulation({
        productoId: 'prod-001',
        costoCompraCop: 20000,
        categoriaId: 'cat-salmon',
        bufferPersonalizadoPct: null,
        regimenIva: 'EXENTO_O_EXCLUIDO',
      });
    });

    expect(result.current.simulation).not.toBeNull();
    if (result.current.simulation) {
      expect(result.current.simulation.bufferEfectivoPct).toBe(10); // Salmón default
      expect(result.current.simulation.costoAjustadoCop).toBe(22000); // 20000 * 1.10
      expect(result.current.simulation.canales.POS.precioFinalCop).toBe(30800); // 22000 * 1.40
      expect(result.current.simulation.canales.RESTAURANTE_HORECA.precioFinalCop).toBe(28600); // 22000 * 1.30
      expect(result.current.simulation.canales.MAYORISTA.precioFinalCop).toBe(25300); // 22000 * 1.15
      expect(result.current.simulation.puedeGuardar).toBe(true);
    }
  });

  it('debe generar la previsualización en lote para una categoría con productos', () => {
    const { result } = renderHook(() => usePricingEngine());

    const preview = result.current.generateBatchPreview('cat-salmon');
    expect(Array.isArray(preview)).toBe(true);
  });

  it('debe validar la autorización de excepciones de margen según el rol del usuario', () => {
    const { result } = renderHook(() => usePricingEngine());

    // Simular un intento de fijar margen bajo
    const checkVendedor = result.current.checkTariffPermissions({
      POS: 30000,
      RESTAURANTE_HORECA: 28000,
      MAYORISTA: 21000, // Margen bajo (< 10%)
    }, 20000, 'vendedor');

    expect(checkVendedor.valido).toBe(false);

    const checkAdmin = result.current.checkTariffPermissions({
      POS: 30000,
      RESTAURANTE_HORECA: 28000,
      MAYORISTA: 21000,
    }, 20000, 'admin');

    expect(checkAdmin.valido).toBe(true);
  });
});
