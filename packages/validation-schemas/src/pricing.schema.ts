import { z } from 'zod';

export const CotizacionEstadoEnum = z.enum([
  'BORRADOR',
  'ENVIADA',
  'APROBADA',
  'VENDIDA',
  'CANCELADA',
]);

export type CotizacionEstado = z.infer<typeof CotizacionEstadoEnum>;

export const RolUsuarioEnum = z.enum([
  'ADMIN',
  'SUPERVISOR',
  'VENDEDOR',
  'CAJERO',
  'BODEGUERO',
  'CONDUCTOR',
]);

export type RolUsuario = z.infer<typeof RolUsuarioEnum>;

// Transiciones de estado permitidas en el flujo documental
export const VALID_DOCUMENT_TRANSITIONS: Record<CotizacionEstado, CotizacionEstado[]> = {
  BORRADOR: ['ENVIADA', 'CANCELADA'],
  ENVIADA: ['APROBADA', 'CANCELADA'],
  APROBADA: ['VENDIDA', 'CANCELADA'],
  VENDIDA: [], // Estado terminal inmutable
  CANCELADA: [], // Estado terminal inmutable
};

export const LineaCotizacionSchema = z.object({
  id: z.string().uuid().optional(),
  productoId: z.string().uuid('ID de producto inválido'),
  nombre: z.string().min(1, 'El nombre del producto es requerido'),
  cantidad: z.number().positive('La cantidad debe ser mayor a cero'),
  precioUnitario: z.number().nonnegative('El precio unitario no puede ser negativo'),
  descuentoPct: z.number().min(0).max(100).default(0),
  subtotal: z.number().nonnegative(),
});

export const TransitionCotizacionSchema = z.object({
  cotizacionId: z.string().uuid('ID de cotización inválido'),
  empresaId: z.string().uuid('ID de empresa inválido'),
  estadoActual: CotizacionEstadoEnum,
  nuevoEstado: CotizacionEstadoEnum,
  usuarioRol: RolUsuarioEnum,
  usuarioId: z.string().uuid(),
  motivoCancelacion: z.string().optional(),
}).refine(
  (data) => VALID_DOCUMENT_TRANSITIONS[data.estadoActual]?.includes(data.nuevoEstado),
  {
    message: 'Transición de estado documental no permitida según el flujo de negocio.',
    path: ['nuevoEstado'],
  }
).refine(
  (data) => {
    // APROBADA y VENDIDA requieren rol con autoridad (ADMIN o SUPERVISOR)
    if (['APROBADA', 'VENDIDA'].includes(data.nuevoEstado)) {
      return ['ADMIN', 'SUPERVISOR'].includes(data.usuarioRol);
    }
    return true;
  },
  {
    message: 'Privilegios insuficientes: Solo Administradores y Supervisores pueden aprobar o consolidar la venta de una cotización.',
    path: ['usuarioRol'],
  }
).refine(
  (data) => {
    if (data.nuevoEstado === 'CANCELADA' && !data.motivoCancelacion) {
      return false;
    }
    return true;
  },
  {
    message: 'Es obligatorio proporcionar un motivo para cancelar la cotización.',
    path: ['motivoCancelacion'],
  }
);

export type TransitionCotizacionInput = z.infer<typeof TransitionCotizacionSchema>;
