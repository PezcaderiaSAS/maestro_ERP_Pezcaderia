// src/services/differentialPricingService.ts
// Motor Matemático de Precios Diferenciales, Umbrales de Volumen y Márgenes Mínimos
// Costo $0: Lógica determinista en TypeScript sin dependencias externas.

import type { CustomerPricingTier } from '../types/differentialPricing.types';
import type { LocalIndexedDbProduct } from '../types/indexedDb.types';
import type { Producto } from '../store/useInventoryStore';

export interface PricingCalculationParams {
  producto: LocalIndexedDbProduct | Producto | any;
  cantidad: number;
  perfilCliente?: CustomerPricingTier;
  descuentoManualPct?: number;
}

export interface PricingCalculationOutput {
  sku: string;
  cantidad: number;
  precioDetalBase: number;
  precioUnitarioSinDescuento: number;
  descuentoManualPct: number;
  precioUnitarioFinal: number;
  tarifaAplicada: 'DETAL' | 'MAYORISTA';
  ahorroUnitario: number;
  ahorroTotal: number;
  subtotal: number;
  violaMargenMinimo: boolean;
  requierePinSupervisor: boolean;
  margenEstimadoPct?: number;
  alertaMargen?: string;
}

export class DifferentialPricingService {
  /**
   * Resuelve la tarifa aplicable (Detal vs Mayorista), descuentos y validación de margen mínimo
   */
  public calcularPrecioItem(params: PricingCalculationParams): PricingCalculationOutput {
    const {
      producto,
      cantidad,
      perfilCliente = 'DETAL',
      descuentoManualPct = 0,
    } = params;

    const sku = producto.sku || producto.id || 'N/A';
    const precioDetal = Number(producto.precio_venta_pos || producto.precioDetal || 0);
    const precioMayorista = Number(
      producto.precio_venta_mayorista || producto.precioMayorista || 0
    );
    const minMayoristaQty = Number(producto.cantidadMinimaMayorista || 6);
    const costoBase = Number(producto.costo_unitario || producto.costoBase || 0);
    const margenMinimoPct = Number(producto.margenMinimoPct || 0);

    const tieneTarifaMayoristaValida =
      precioMayorista > 0 && precioMayorista < precioDetal;

    let tarifaAplicada: 'DETAL' | 'MAYORISTA' = 'DETAL';
    let precioBaseAplicado = precioDetal;

    if (tieneTarifaMayoristaValida) {
      const esClienteMayorista =
        perfilCliente === 'MAYORISTA' || perfilCliente === 'CONTRATISTA' || perfilCliente === 'INSTITUCIONAL';
      const superaCantidadMinima = cantidad >= minMayoristaQty;

      if (esClienteMayorista || superaCantidadMinima) {
        tarifaAplicada = 'MAYORISTA';
        precioBaseAplicado = precioMayorista;
      }
    }

    // Aplicar descuento manual
    const factorDescuento = Math.max(0, Math.min(100, descuentoManualPct)) / 100;
    const precioUnitarioFinal = Math.round(precioBaseAplicado * (1 - factorDescuento));
    const subtotal = precioUnitarioFinal * cantidad;

    // Calcular ahorros frente al precio de detal base
    const ahorroUnitario = Math.max(0, precioDetal - precioUnitarioFinal);
    const ahorroTotal = ahorroUnitario * cantidad;

    // Validación de margen mínimo frente al costo base
    let violaMargenMinimo = false;
    let requierePinSupervisor = false;
    let margenEstimadoPct = 0;
    let alertaMargen: string | undefined;

    if (costoBase > 0) {
      const margenNeto = precioUnitarioFinal - costoBase;
      margenEstimadoPct = Math.round((margenNeto / costoBase) * 100);

      const precioMinimoPermitido = Math.round(costoBase * (1 + margenMinimoPct / 100));

      if (precioUnitarioFinal < precioMinimoPermitido) {
        violaMargenMinimo = true;
        requierePinSupervisor = true;
        alertaMargen = `Margen mínimo comprometido: el precio final ($${precioUnitarioFinal.toLocaleString(
          'es-CO'
        )}) está por debajo del umbral mínimo ($${precioMinimoPermitido.toLocaleString(
          'es-CO'
        )}).`;
      }
    }

    return {
      sku,
      cantidad,
      precioDetalBase: precioDetal,
      precioUnitarioSinDescuento: precioBaseAplicado,
      descuentoManualPct,
      precioUnitarioFinal,
      tarifaAplicada,
      ahorroUnitario,
      ahorroTotal,
      subtotal,
      violaMargenMinimo,
      requierePinSupervisor,
      margenEstimadoPct,
      alertaMargen,
    };
  }
}

export const differentialPricingService = new DifferentialPricingService();

