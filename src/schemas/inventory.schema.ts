import { z } from 'zod';

// Esquema para Traslado de Stock entre bodegas
export const inventoryTransferSchema = z.object({
  sourceWarehouseId: z.string().uuid({ message: 'Bodega de origen inválida' }),
  targetWarehouseId: z.string().uuid({ message: 'Bodega de destino inválida' }),
  batchId: z.string().uuid({ message: 'Lote inválido' }).optional(),
  sku: z.string().min(1, { message: 'El SKU es requerido' }),
  quantity: z.number().positive({ message: 'La cantidad debe ser mayor a 0' }),
  notes: z.string().optional(),
}).refine(data => data.sourceWarehouseId !== data.targetWarehouseId, {
  message: 'La bodega de origen y destino no pueden ser la misma',
  path: ['targetWarehouseId'],
});

export type InventoryTransferInput = z.infer<typeof inventoryTransferSchema>;

// Esquema para Ajuste/Merma de Stock
export const inventoryAdjustmentSchema = z.object({
  warehouseId: z.string().uuid({ message: 'Bodega inválida' }),
  batchId: z.string().uuid({ message: 'Lote inválido' }).optional(),
  sku: z.string().min(1, { message: 'El SKU es requerido' }),
  quantity: z.number().refine(val => val !== 0, { message: 'La cantidad no puede ser 0' }),
  movementType: z.enum(['SCRAP', 'COUNT_ADJUSTMENT'], {
    errorMap: () => ({ message: 'Tipo de movimiento inválido. Debe ser SCRAP o COUNT_ADJUSTMENT' })
  }),
  notes: z.string().min(5, { message: 'Debe proveer una justificación clara (mín. 5 caracteres)' }),
});

export type InventoryAdjustmentInput = z.infer<typeof inventoryAdjustmentSchema>;
