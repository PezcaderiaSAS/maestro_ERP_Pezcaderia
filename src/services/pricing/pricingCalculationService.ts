import type {
  PricingGlobalConfig,
  RegimenIva,
  ProductPricingSimulationInput,
  ProductPricingSimulationResult,
  ChannelSimulationResult,
} from '../../types/pricingEngine.types';
import { pricingConfigService } from './pricingConfigService';

/**
 * ============================================================================
 * LA PEZCADERIA ERP — SERVICIO DE CÁLCULO DE PRECIOS DINÁMICOS Y MÁRGENES
 * ============================================================================
 * Principio de Responsabilidad Única (SRP):
 * Funciones matemáticas puras deterministas, redondeo entero COP (RN-06),
 * buffers de merma biológica e impuestos (IVA 19%).
 */

export const pricingCalculationService = {
  /**
   * Calcula el costo de adquisición ajustado por merma biológica:
   * costoAjustado = round(costoCompra * (1 + bufferPct / 100))
   */
  calculateAdjustedCost(
    costoCompraCop: number,
    bufferPct: number,
    redondeoEntero: boolean = true
  ): number {
    if (costoCompraCop <= 0) return 0;
    const safeBuffer = Math.max(0, Math.min(50, bufferPct || 0));
    const factor = 1 + safeBuffer / 100;
    const rawCost = costoCompraCop * factor;
    return redondeoEntero ? Math.round(rawCost) : Number(rawCost.toFixed(2));
  },

  /**
   * Proyecta la tarifa comercial para un canal específico:
   * subtotalNeto = round(costoAjustado * (1 + margenPct / 100))
   * valorIva = regimenIva === 'GRAVADO_IVA_19' ? round(subtotalNeto * 0.19) : 0
   * precioFinal = subtotalNeto + valorIva
   */
  calculateChannelTariff(
    costoAjustadoCop: number,
    margenPct: number,
    regimenIva: RegimenIva = 'EXENTO_O_EXCLUIDO',
    redondeoEntero: boolean = true,
    canal: 'POS' | 'RESTAURANTE_HORECA' | 'MAYORISTA' = 'POS'
  ): ChannelSimulationResult {
    const nombresCanal: Record<string, string> = {
      POS: 'Mostrador / POS Directo',
      RESTAURANTE_HORECA: 'Restaurante / Canal HORECA',
      MAYORISTA: 'Mayorista / Institucional',
    };

    const factorMargen = 1 + (margenPct || 0) / 100;
    const rawSubtotal = costoAjustadoCop * factorMargen;
    const subtotalNetoCop = redondeoEntero ? Math.round(rawSubtotal) : Number(rawSubtotal.toFixed(2));

    const valorIvaCop =
      regimenIva === 'GRAVADO_IVA_19'
        ? redondeoEntero
          ? Math.round(subtotalNetoCop * 0.19)
          : Number((subtotalNetoCop * 0.19).toFixed(2))
        : 0;

    const precioFinalCop = subtotalNetoCop + valorIvaCop;
    const margenBrutoCop = subtotalNetoCop - costoAjustadoCop;

    const margenBrutoPct =
      subtotalNetoCop > 0
        ? Number(((margenBrutoCop / subtotalNetoCop) * 100).toFixed(2))
        : 0;

    const safety = this.evaluateMarginSafety(costoAjustadoCop, subtotalNetoCop, 10);

    return {
      canal,
      nombreCanal: nombresCanal[canal] || canal,
      margenPct,
      subtotalNetoCop,
      valorIvaCop,
      precioFinalCop,
      margenBrutoCop,
      margenBrutoPct,
      esVentaBajoCosto: safety.esVentaBajoCosto,
      alertaMargenBajo: safety.alertaMargenBajo,
    };
  },

  /**
   * Evalúa la seguridad del margen y previene venta a pérdida.
   */
  evaluateMarginSafety(
    costoAjustadoCop: number,
    subtotalNetoCop: number,
    margenMinimoPct: number = 10
  ): { esVentaBajoCosto: boolean; alertaMargenBajo: boolean } {
    const esVentaBajoCosto = subtotalNetoCop < costoAjustadoCop;
    const margenNetoPct =
      subtotalNetoCop > 0
        ? ((subtotalNetoCop - costoAjustadoCop) / subtotalNetoCop) * 100
        : -100;

    const alertaMargenBajo = esVentaBajoCosto || margenNetoPct < margenMinimoPct;

    return {
      esVentaBajoCosto,
      alertaMargenBajo,
    };
  },

  /**
   * Simula un producto de forma integral en tiempo real (<1ms) para los 3 canales.
   */
  simulateProductPricing(
    input: ProductPricingSimulationInput,
    globalConfig: PricingGlobalConfig = pricingConfigService.getPricingGlobalConfig()
  ): ProductPricingSimulationResult {
    // 1. Resolver buffer efectivo bimodal (producto individual ?? categoría)
    const bufferEfectivoPct = pricingConfigService.resolveEffectiveBuffer(
      input.categoriaId,
      input.bufferPersonalizadoPct,
      globalConfig
    );

    // 2. Costo ajustado
    const costoAjustadoCop = this.calculateAdjustedCost(
      input.costoCompraCop,
      bufferEfectivoPct,
      globalConfig.redondeoEnteroCop
    );

    // 3. Proyectar márgenes por canal
    const margenPos =
      input.margenPosSobrescritoPct ?? globalConfig.canales.margenPosPct;
    const margenRestaurante =
      input.margenRestauranteSobrescritoPct ?? globalConfig.canales.margenRestaurantePct;
    const margenMayorista =
      input.margenMayoristaSobrescritoPct ?? globalConfig.canales.margenMayoristaPct;

    const resPos = this.calculateChannelTariff(
      costoAjustadoCop,
      margenPos,
      input.regimenIva,
      globalConfig.redondeoEnteroCop,
      'POS'
    );

    const resRestaurante = this.calculateChannelTariff(
      costoAjustadoCop,
      margenRestaurante,
      input.regimenIva,
      globalConfig.redondeoEnteroCop,
      'RESTAURANTE_HORECA'
    );

    const resMayorista = this.calculateChannelTariff(
      costoAjustadoCop,
      margenMayorista,
      input.regimenIva,
      globalConfig.redondeoEnteroCop,
      'MAYORISTA'
    );

    const bloqueos: string[] = [];
    const advertencias: string[] = [];

    // Validar venta bajo costo
    if (globalConfig.bloquearVentaBajoCosto) {
      if (resPos.esVentaBajoCosto) bloqueos.push('Venta bajo costo en Canal POS');
      if (resRestaurante.esVentaBajoCosto) bloqueos.push('Venta bajo costo en Canal HORECA');
      if (resMayorista.esVentaBajoCosto) bloqueos.push('Venta bajo costo en Canal Mayorista');
    }

    // Validar umbral de margen mínimo
    const minPct = globalConfig.canales.margenMinimoSeguridadPct;
    if (resPos.margenBrutoPct < minPct) {
      advertencias.push(`Margen POS (${resPos.margenBrutoPct}%) inferior al mínimo de seguridad (${minPct}%)`);
    }
    if (resRestaurante.margenBrutoPct < minPct) {
      advertencias.push(`Margen HORECA (${resRestaurante.margenBrutoPct}%) inferior al mínimo de seguridad (${minPct}%)`);
    }
    if (resMayorista.margenBrutoPct < minPct) {
      advertencias.push(`Margen Mayorista (${resMayorista.margenBrutoPct}%) inferior al mínimo de seguridad (${minPct}%)`);
    }

    const puedeGuardar = bloqueos.length === 0;

    return {
      productoId: input.productoId,
      costoCompraCop: input.costoCompraCop,
      bufferEfectivoPct,
      costoAjustadoCop,
      regimenIva: input.regimenIva,
      canales: {
        POS: resPos,
        RESTAURANTE_HORECA: resRestaurante,
        MAYORISTA: resMayorista,
      },
      puedeGuardar,
      bloqueos,
      advertencias,
    };
  },
};
