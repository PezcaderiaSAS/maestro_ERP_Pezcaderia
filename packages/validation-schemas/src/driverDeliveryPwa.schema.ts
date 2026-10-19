import { z } from 'zod';
import {
  MotivoRechazoRutaEnum,
  type MotivoRechazoRuta,
  EstadoEntregaPedidoEnum,
  type EstadoEntregaPedido
} from './deliveryRoute.schema';

/**
 * Esquema de credenciales corporativas para inicio de sesión de conductores/repartidores en PWA.
 */
export const DriverLoginCredentialsSchema = z.object({
  email: z.string().trim().email('Ingrese un correo electrónico corporativo válido'),
  password: z.string().min(6, 'La contraseña debe tener mínimo 6 caracteres')
});
export type DriverLoginCredentials = z.infer<typeof DriverLoginCredentialsSchema>;

/**
 * Esquema de evidencia de entrega física recibida por el cliente en destino
 */
export const EvidenciaEntregaClienteSchema = z.object({
  nombreReceptor: z.string().trim().min(3, 'El nombre de quien recibe es obligatorio (mínimo 3 caracteres)'),
  cedulaReceptor: z.string().trim().min(5, 'La cédula del receptor es obligatoria (mínimo 5 caracteres)'),
  firmaCanvasBase64: z
    .string()
    .regex(
      /^data:image\/png;base64,[A-Za-z0-9+/=]+$/,
      'La firma digital debe ser una imagen PNG codificada en Base64 válida'
    ),
  temperaturaLlegada: z
    .number()
    .min(-30, 'La temperatura no puede ser menor a -30°C')
    .max(40, 'La temperatura no puede superar los 40°C')
});
export type EvidenciaEntregaCliente = z.infer<typeof EvidenciaEntregaClienteSchema>;

/**
 * Esquema para registrar devolución o rechazo parcial de un ítem en ruta
 */
export const DevolucionItemRutaSchema = z.object({
  sku: z.string().trim().min(1, 'El código SKU es obligatorio'),
  nombre: z.string().trim().min(1, 'El nombre del producto es obligatorio'),
  kilosDevueltos: z.number().positive('Los kilos devueltos deben ser mayores a 0'),
  motivoRechazo: MotivoRechazoRutaEnum,
  observaciones: z.string().trim().optional()
});
export type DevolucionItemRuta = z.infer<typeof DevolucionItemRutaSchema>;

/**
 * Alias de compatibilidad para el estado final de parada
 */
export const EstadoFinalParadaEnum = EstadoEntregaPedidoEnum;
export type EstadoFinalParada = EstadoEntregaPedido;

/**
 * Esquema completo para el registro de ejecución de una parada de entrega
 */
export const RegistroEjecucionParadaSchema = z
  .object({
    paradaId: z.string().trim().min(1, 'El ID de la parada es obligatorio'),
    pedidoId: z.string().trim().min(1, 'El ID del pedido es obligatorio'),
    manifiestoId: z.string().trim().min(1, 'El ID del manifiesto es obligatorio'),
    estadoFinal: EstadoFinalParadaEnum,
    evidencia: EvidenciaEntregaClienteSchema,
    devoluciones: z.array(DevolucionItemRutaSchema).default([]),
    montoCobradoEfectivo: z.number().min(0, 'El monto en efectivo no puede ser negativo').default(0),
    montoCobradoTransferencia: z.number().min(0, 'El monto en transferencia no puede ser negativo').default(0),
    comprobanteTransferencia: z.string().trim().optional()
  })
  .refine(
    (data) => {
      if (data.estadoFinal === 'ENTREGADO_PARCIAL') {
        return data.devoluciones && data.devoluciones.length > 0;
      }
      return true;
    },
    {
      message: 'Si el estado es ENTREGADO_PARCIAL, debe registrar al menos un ítem devuelto con sus kilos y motivo',
      path: ['devoluciones']
    }
  );
export type RegistroEjecucionParada = z.infer<typeof RegistroEjecucionParadaSchema>;

/**
 * Función utilitaria pura para calcular el recaudo total en la parada
 */
export function calcularTotalRecaudoParada(efectivo: number, transferencia: number): number {
  const ef = Math.max(0, efectivo || 0);
  const tf = Math.max(0, transferencia || 0);
  return ef + tf;
}

/**
 * Función utilitaria pura para totalizar los kilos devueltos en una parada
 */
export function calcularKilosDevueltosTotales(devoluciones: DevolucionItemRuta[]): number {
  if (!Array.isArray(devoluciones) || devoluciones.length === 0) return 0;
  return Number(devoluciones.reduce((acc, curr) => acc + (curr.kilosDevueltos || 0), 0).toFixed(2));
}
