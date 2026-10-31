import { z } from 'zod';

export const MetodoPagoItemSchema = z.object({
  id: z.string().optional(),
  metodo: z.enum(['EFECTIVO', 'TARJETA', 'DATAFONO', 'TRANSFERENCIA', 'CREDITO']),
  monto: z.number().positive('El monto debe ser estrictamente mayor a 0'),
  referencia: z.string().optional(),
  plazoDias: z.number().int().positive().optional(),
  fechaVencimiento: z.string().optional(),
  efectivoRecibido: z.number().optional(),
  vueltas: z.number().optional(),
});

export const MixedPaymentItemSchema = z.object({
  productoId: z.string(),
  sku: z.string(),
  nombre: z.string(),
  cantidad: z.number().positive('La cantidad debe ser mayor a 0'),
  precioUnitario: z.number().nonnegative('El precio no puede ser negativo'),
  subtotal: z.number().nonnegative(),
  notaItem: z.string().optional(),
});

export const MixedPaymentSchema = z.object({
  preventaId: z.string(),
  codigoPreventa: z.string(),
  totalVenta: z.number().positive('El total debe ser positivo'),
  items: z.array(MixedPaymentItemSchema).optional(),
  pagos: z.array(MetodoPagoItemSchema).min(1, 'Debe especificar al menos un método de pago'),
  clienteNombre: z.string(),
  clienteDocumento: z.string().optional(),
  clienteTelefono: z.string().optional(),
}).refine(data => {
  const sum = data.pagos.reduce((acc, p) => acc + p.monto, 0);
  return Math.abs(sum - data.totalVenta) < 0.01;
}, {
  message: 'La suma de los métodos de pago debe coincidir exactamente con el total a recaudar.',
  path: ['pagos'],
});

export type MetodoPagoItem = z.infer<typeof MetodoPagoItemSchema>;
export type MixedPaymentItem = z.infer<typeof MixedPaymentItemSchema>;
export type MixedPaymentPayload = z.infer<typeof MixedPaymentSchema>;

