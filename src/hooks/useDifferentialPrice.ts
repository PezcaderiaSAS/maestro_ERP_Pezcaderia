// src/hooks/useDifferentialPrice.ts
// Hook reactivo para resolución de tarifas Detal vs Mayorista en tiempo real

import { useMemo } from 'react';
import type { CustomerPricingTier } from '../types/differentialPricing.types';
import type { LocalIndexedDbProduct } from '../types/indexedDb.types';
import type { Producto } from '../store/useInventoryStore';
import {
  differentialPricingService,
  type PricingCalculationOutput,
} from '../services/differentialPricingService';

export function useDifferentialPrice(
  producto: LocalIndexedDbProduct | Producto | null | undefined,
  cantidad: number,
  perfilCliente: CustomerPricingTier = 'DETAL',
  descuentoManualPct = 0
): PricingCalculationOutput | null {
  return useMemo(() => {
    if (!producto) return null;

    return differentialPricingService.calcularPrecioItem({
      producto,
      cantidad,
      perfilCliente,
      descuentoManualPct,
    });
  }, [producto, cantidad, perfilCliente, descuentoManualPct]);
}

