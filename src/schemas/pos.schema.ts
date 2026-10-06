import { z } from 'zod';

// Esquema para apertura de caja
export const posOpenSessionSchema = z.object({
  registerId: z.string().uuid("El ID de la caja debe ser válido"),
  openingAmount: z.number().min(0, "El monto de apertura no puede ser negativo"),
});

// Esquema para cierre y arqueo ciego
export const posCloseSessionSchema = z.object({
  sessionId: z.string().uuid("El ID de sesión debe ser válido"),
  declaredAmount: z.number().min(0, "El monto declarado no puede ser negativo"),
});

// Esquema para traslados de efectivo (retiros/remesas)
export const posCashTransferSchema = z.object({
  sessionId: z.string().uuid("El ID de sesión debe ser válido"),
  amount: z.number().positive("El monto a trasladar debe ser mayor a cero"),
  reason: z.enum(['RETIRO_PARCIAL', 'FONDO_FIJO', 'REMESACION', 'PAGO_PROVEEDOR'], {
    errorMap: () => ({ message: "Razón de traslado no válida" })
  }),
});

// Esquema para reabastecimiento hacia WMS
export const posRestockSchema = z.object({
  productId: z.string().uuid("Producto no válido"),
  targetWarehouseId: z.string().uuid("Bodega destino no válida"),
  requestedQuantity: z.number().positive("La cantidad debe ser mayor a 0"),
});

// Tipos inferidos
export type PosOpenSessionInput = z.infer<typeof posOpenSessionSchema>;
export type PosCloseSessionInput = z.infer<typeof posCloseSessionSchema>;
export type PosCashTransferInput = z.infer<typeof posCashTransferSchema>;
export type PosRestockInput = z.infer<typeof posRestockSchema>;
