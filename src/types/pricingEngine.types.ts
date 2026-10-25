import { z } from 'zod';
import {
  CategoryWasteConfigSchema,
  ChannelMarginConfigSchema,
  PricingGlobalConfigSchema,
  RegimenIvaEnum,
  ProductPricingSimulationInputSchema,
  ChannelSimulationResultSchema,
  ProductPricingSimulationResultSchema,
  PricingRecordSnapshotSchema,
} from '../../packages/validation-schemas/src/pricingEngine.schema';

export type CategoryWasteConfig = z.infer<typeof CategoryWasteConfigSchema>;
export type ChannelMarginConfig = z.infer<typeof ChannelMarginConfigSchema>;
export type PricingGlobalConfig = z.infer<typeof PricingGlobalConfigSchema>;
export type RegimenIva = z.infer<typeof RegimenIvaEnum>;
export type ProductPricingSimulationInput = z.infer<typeof ProductPricingSimulationInputSchema>;
export type ChannelSimulationResult = z.infer<typeof ChannelSimulationResultSchema>;
export type ProductPricingSimulationResult = z.infer<typeof ProductPricingSimulationResultSchema>;
export type PricingRecordSnapshot = z.infer<typeof PricingRecordSnapshotSchema>;

export type PricingSalesChannel = 'POS' | 'RESTAURANTE_HORECA' | 'MAYORISTA';

export interface BatchCategoryRecalculateItem {
  productoId: string;
  sku: string;
  nombreProducto: string;
  costoCompraCop: number;
  bufferMermaPct: number;
  costoAjustadoCop: number;
  precioPosAnteriorCop: number;
  precioPosNuevoCop: number;
  precioRestauranteAnteriorCop: number;
  precioRestauranteNuevoCop: number;
  precioMayoristaAnteriorCop: number;
  precioMayoristaNuevoCop: number;
  variacionTotalCop: number;
}
