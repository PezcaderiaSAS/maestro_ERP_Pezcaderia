// src/types/differentialPricing.types.ts
// Tipos e Interfaces para el Motor de Precios Diferenciales (Detal vs Mayorista)

export type CustomerPricingTier = 'DETAL' | 'MAYORISTA' | 'CONTRATISTA' | 'INSTITUCIONAL';

export interface DifferentialPricing {
  sku: string;
  precioDetal: number;
  precioMayorista: number;
  cantidadMinimaMayorista: number;
  costoBase?: number;
  margenMinimoPct?: number;
  activo?: boolean;
}

export interface CustomerPricingProfile {
  clienteId: string;
  perfil: CustomerPricingTier;
  limiteCredito?: number;
  diasPlazoCredito?: number;
  descuentoAdicionalPct?: number;
  observaciones?: string;
}

export interface PriceCalculationResult {
  sku: string;
  cantidad: number;
  precioBase: number;
  precioUnitarioFinal: number;
  tarifaAplicada: 'DETAL' | 'MAYORISTA';
  descuentoAplicadoPct: number;
  ahorroTotal: number;
  subtotal: number;
  margenEstimadoPct?: number;
}

