import { z } from 'zod';

export const EntradaStockSchema = z.object({
  empresaId: z.string().uuid('ID de Empresa inválido'),
  productoId: z.string().uuid('ID de Producto inválido'),
  bodegaId: z.string().uuid('ID de Bodega inválido'),
  usuarioId: z.string().uuid('ID de Usuario responsable inválido'),
  numeroLote: z.string().min(1, 'El número de lote es obligatorio'),
  fechaExpiracion: z.string().datetime({ message: 'Fecha de expiración debe ser un ISO DateTime válido' }),
  cantidad: z.number().positive('La cantidad debe ser mayor a cero'),
  costoUnitario: z.number().min(0, 'El costo unitario no puede ser negativo'),
  referenciaDocumento: z.string().optional(),
  observacion: z.string().optional(),
});

export type EntradaStockDTO = z.infer<typeof EntradaStockSchema>;

export const MermaDespieceSchema = z.object({
  empresaId: z.string().uuid('ID de Empresa inválido'),
  productoId: z.string().uuid('ID de Producto inválido'),
  bodegaId: z.string().uuid('ID de Bodega inválido'),
  loteId: z.string().uuid('ID de Lote inválido').optional(),
  usuarioId: z.string().uuid('ID de Usuario responsable inválido'),
  cantidad: z.number().positive('La cantidad de merma debe ser mayor a cero'),
  referenciaDocumento: z.string().optional(),
  observacion: z.string().min(5, 'Se requiere una justificación mínima de 5 caracteres para la merma'),
});

export type MermaDespieceDTO = z.infer<typeof MermaDespieceSchema>;
