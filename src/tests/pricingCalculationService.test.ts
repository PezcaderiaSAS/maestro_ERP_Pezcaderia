import { describe, it, expect, beforeEach } from 'vitest';
import {
  pricingCalculationService,
} from '../services/pricing/pricingCalculationService';
import {
  pricingConfigService,
  DEFAULT_PRICING_GLOBAL_CONFIG,
} from '../services/pricing/pricingConfigService';
import {
  marginAuditService,
} from '../services/pricing/marginAuditService';
import type { ProductPricingSimulationInput, PricingGlobalConfig } from '../types/pricingEngine.types';

describe('TASK-028-02: Servicios de Dominio SOLID para Precios, Mermas y Márgenes', () => {
  let mockGlobalConfig: PricingGlobalConfig;

  beforeEach(() => {
    mockGlobalConfig = JSON.parse(JSON.stringify(DEFAULT_PRICING_GLOBAL_CONFIG));
  });

  describe('1. pricingCalculationService: Fórmulas Matemáticas Puras y Determinismo', () => {
    it('debe calcular el costo ajustado por merma con redondeo entero COP (RN-06)', () => {
      // Costo compra: 10.000 COP, Buffer: 10% -> 10.000 * 1.10 = 11.000 COP
      const costoAjustado = pricingCalculationService.calculateAdjustedCost(10000, 10);
      expect(costoAjustado).toBe(11000);

      // Costo con decimales: 25.433 COP con buffer 7.5% -> 25433 * 1.075 = 27340.475 -> 27340 COP
      const costoRedondeado = pricingCalculationService.calculateAdjustedCost(25433, 7.5);
      expect(costoRedondeado).toBe(27340);
    });

    it('debe calcular tarifas sugeridas por canal para producto exento de IVA', () => {
      const costoAjustado = 11000;
      // POS (+40%): 11000 * 1.40 = 15.400 COP
      const resPos = pricingCalculationService.calculateChannelTariff(
        costoAjustado,
        40,
        'EXENTO_O_EXCLUIDO'
      );
      expect(resPos.subtotalNetoCop).toBe(15400);
      expect(resPos.valorIvaCop).toBe(0);
      expect(resPos.precioFinalCop).toBe(15400);
      expect(resPos.margenBrutoCop).toBe(4400);
      expect(resPos.esVentaBajoCosto).toBe(false);
      expect(resPos.alertaMargenBajo).toBe(false);

      // Restaurante HORECA (+30%): 11000 * 1.30 = 14.300 COP
      const resHoreca = pricingCalculationService.calculateChannelTariff(
        costoAjustado,
        30,
        'EXENTO_O_EXCLUIDO'
      );
      expect(resHoreca.subtotalNetoCop).toBe(14300);
      expect(resHoreca.precioFinalCop).toBe(14300);

      // Mayorista (+15%): 11000 * 1.15 = 12.650 COP
      const resMayor = pricingCalculationService.calculateChannelTariff(
        costoAjustado,
        15,
        'EXENTO_O_EXCLUIDO'
      );
      expect(resMayor.subtotalNetoCop).toBe(12650);
      expect(resMayor.precioFinalCop).toBe(12650);
    });

    it('debe calcular correctamente el valor del IVA al 19% para productos gravados', () => {
      const costoAjustado = 10000;
      // POS (+40%): subtotal = 14.000 COP, IVA 19% = 2.660 COP, Final = 16.660 COP
      const resPosGravado = pricingCalculationService.calculateChannelTariff(
        costoAjustado,
        40,
        'GRAVADO_IVA_19'
      );
      expect(resPosGravado.subtotalNetoCop).toBe(14000);
      expect(resPosGravado.valorIvaCop).toBe(2660);
      expect(resPosGravado.precioFinalCop).toBe(16660);
    });

    it('debe detectar venta bajo costo si el precio es menor al costo ajustado', () => {
      const costoAjustado = 20000;
      // Intento de fijar subtotal en 18.000 COP (< 20.000)
      const safety = pricingCalculationService.evaluateMarginSafety(costoAjustado, 18000, 10);
      expect(safety.esVentaBajoCosto).toBe(true);
      expect(safety.alertaMargenBajo).toBe(true);
    });

    it('debe simular un producto completo resolviendo la jerarquía bimodal de buffers', () => {
      // Caso 1: Producto usa buffer heredado de categoría (Salmón = 10%)
      const inputHeredado: ProductPricingSimulationInput = {
        productoId: 'prod-salmon-01',
        costoCompraCop: 20000,
        categoriaId: 'cat-salmon',
        bufferPersonalizadoPct: null, // Usa categoría
        regimenIva: 'EXENTO_O_EXCLUIDO',
      };

      const simHeredado = pricingCalculationService.simulateProductPricing(inputHeredado, mockGlobalConfig);
      expect(simHeredado.bufferEfectivoPct).toBe(10);
      expect(simHeredado.costoAjustadoCop).toBe(22000); // 20000 * 1.10
      expect(simHeredado.canales.POS.precioFinalCop).toBe(30800); // 22000 * 1.40
      expect(simHeredado.canales.RESTAURANTE_HORECA.precioFinalCop).toBe(28600); // 22000 * 1.30
      expect(simHeredado.canales.MAYORISTA.precioFinalCop).toBe(25300); // 22000 * 1.15
      expect(simHeredado.puedeGuardar).toBe(true);

      // Caso 2: Producto sobrescribe buffer individualmente (15%)
      const inputSobrescrito: ProductPricingSimulationInput = {
        productoId: 'prod-salmon-esp',
        costoCompraCop: 20000,
        categoriaId: 'cat-salmon',
        bufferPersonalizadoPct: 15, // Sobrescrito
        regimenIva: 'EXENTO_O_EXCLUIDO',
      };

      const simSobrescrito = pricingCalculationService.simulateProductPricing(inputSobrescrito, mockGlobalConfig);
      expect(simSobrescrito.bufferEfectivoPct).toBe(15);
      expect(simSobrescrito.costoAjustadoCop).toBe(23000); // 20000 * 1.15
    });
  });

  describe('2. pricingConfigService: Parámetros Maestros y Defaults', () => {
    it('debe contener defaults de mermas profesionales para todas las categorías marinas', () => {
      const defaults = pricingConfigService.getDefaultGlobalConfig();
      expect(defaults.canales.margenPosPct).toBe(40);
      expect(defaults.canales.margenRestaurantePct).toBe(30);
      expect(defaults.canales.margenMayoristaPct).toBe(15);
      expect(defaults.categoriasWaste.length).toBeGreaterThanOrEqual(4);

      // Salmón debe tener buffer 10%
      const salmonConfig = defaults.categoriasWaste.find((c) => c.categoriaId === 'cat-salmon');
      expect(salmonConfig).toBeDefined();
      expect(salmonConfig?.bufferDefaultPct).toBe(10);
    });

    it('debe resolver el buffer efectivo para categorías no registradas usando fallback 0%', () => {
      const buffer = pricingConfigService.resolveEffectiveBuffer(
        'cat-desconocida',
        null,
        mockGlobalConfig
      );
      expect(buffer).toBe(0);
    });
  });

  describe('3. marginAuditService: Verificación de Invariantes y RBAC', () => {
    it('debe bloquear guardado si existe venta bajo costo y la regla estricta está activa', () => {
      const validation = marginAuditService.validateTariffSubmission({
        costoAjustadoCop: 25000,
        tarifas: {
          POS: 35000,
          RESTAURANTE_HORECA: 32000,
          MAYORISTA: 24000, // Menor que 25.000 (Venta a pérdida)
        },
        globalConfig: mockGlobalConfig,
        userRole: 'admin',
      });

      expect(validation.valido).toBe(false);
      expect(validation.bloqueos).toContain('Venta bajo costo detectada en canal MAYORISTA');
    });

    it('debe requerir rol ADMIN si algún canal tiene margen menor al de seguridad', () => {
      // Costo 20.000, Mayorista en 21.000 -> Margen = (1000/21000) = 4.76% (< 10% umbral)
      const auditVendedor = marginAuditService.validateTariffSubmission({
        costoAjustadoCop: 20000,
        tarifas: {
          POS: 28000,
          RESTAURANTE_HORECA: 26000,
          MAYORISTA: 21000,
        },
        globalConfig: mockGlobalConfig,
        userRole: 'vendedor',
      });

      expect(auditVendedor.valido).toBe(false);
      expect(auditVendedor.bloqueos.some((b) => b.includes('Requiere autorización de usuario ADMIN'))).toBe(true);

      // Con rol ADMIN debe permitirlo con advertencia
      const auditAdmin = marginAuditService.validateTariffSubmission({
        costoAjustadoCop: 20000,
        tarifas: {
          POS: 28000,
          RESTAURANTE_HORECA: 26000,
          MAYORISTA: 21000,
        },
        globalConfig: mockGlobalConfig,
        userRole: 'admin',
      });

      expect(auditAdmin.valido).toBe(true);
      expect(auditAdmin.requiereAuditoria).toBe(true);
    });
  });
});
