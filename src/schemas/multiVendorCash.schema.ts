// src/schemas/multiVendorCash.schema.ts
// Contratos de validación Zod para arquitectura de caja única concurrente, multi-tenant y carga masiva

import { z } from 'zod';

export const MetodoPagoConcurrenteEnum = z.enum([
  'EFECTIVO',
  'DATAFONO',
  'TRANSFERENCIA',
  'CREDITO',
]);

export const ItemVentaConcurrenteSchema = z.object({
  productoId: z.string().min(1, 'El ID de producto es requerido'),
  nombre: z.string().min(1, 'El nombre del producto es requerido'),
  cantidad: z.number().positive('La cantidad debe ser mayor a 0'),
  precioUnitario: z.number().nonnegative('El precio unitario no puede ser negativo'),
  subtotal: z.number().nonnegative('El subtotal no puede ser negativo'),
  loteId: z.string().optional(),
});

export const PagoVentaConcurrenteSchema = z.object({
  metodoPago: MetodoPagoConcurrenteEnum,
  monto: z.number().positive('El monto del pago debe ser mayor a 0'),
  referenciaComprobante: z.string().optional(),
});

export const VentaPosConcurrenteSchema = z.object({
  idempotencyKey: z.string().uuid('El idempotencyKey debe ser un UUID v4 válido'),
  tenantId: z.string().min(1, 'El tenantId es requerido'),
  turnoId: z.string().min(1, 'El turnoId es requerido'),
  terminalId: z.string().min(1, 'El terminalId es requerido'), // ej. 'TERM-01'
  vendedorId: z.string().min(1, 'El vendedorId es requerido'),
  items: z.array(ItemVentaConcurrenteSchema).min(1, 'La venta debe contener al menos un ítem'),
  pagos: z.array(PagoVentaConcurrenteSchema).min(1, 'La venta debe contener al menos un medio de pago'),
  montoTotal: z.number().positive('El monto total debe ser mayor a 0'),
  clienteDocumento: z.string().optional(),
  clienteNombre: z.string().optional(),
  fechaLocal: z.string().optional(),
});

export const TurnoCentralCompartidoSchema = z.object({
  id: z.string().min(1, 'El ID de turno es requerido'),
  cajaId: z.string().min(1, 'El ID de caja es requerido'),
  sucursalId: z.string().min(1, 'El ID de sucursal es requerido'),
  tenantId: z.string().min(1, 'El tenantId es requerido'),
  cajeroAperturaId: z.string().min(1, 'El cajero de apertura es requerido'),
  baseInicial: z.number().nonnegative('La base inicial no puede ser negativa'),
  estado: z.enum(['ABIERTO', 'CERRADO', 'AUDITADO']),
  fechaApertura: z.string().min(1, 'La fecha de apertura es requerida'),
  fechaCierre: z.string().optional(),
  terminalesAutorizadas: z.array(z.string()).default([
    'TERM-01', 'TERM-02', 'TERM-03', 'TERM-04',
    'TERM-05', 'TERM-06', 'TERM-07', 'TERM-08'
  ]),
});

export const RubroEmpresaEnum = z.enum([
  'PESCADERIA',
  'FERRETERIA',
  'RESTAURANTE',
  'DISTRIBUIDORA',
  'GENERAL',
]);

export const TenantConfigSchema = z.object({
  id: z.string().min(1, 'El ID de tenant es requerido'),
  nombre: z.string().min(1, 'El nombre comercial es requerido'),
  nit: z.string().min(3, 'El NIT o documento fiscal es requerido'),
  razonSocial: z.string().min(1, 'La razón social es requerida'),
  rubro: RubroEmpresaEnum.default('GENERAL'),
  activo: z.boolean().default(true),
  maxTerminales: z.number().int().min(1).default(8),
  createdAt: z.string().default(() => new Date().toISOString()),
  contactoEmail: z.string().email().optional(),
  contactoTelefono: z.string().optional(),
  sucursalesCount: z.number().int().nonnegative().optional(),
});

export const BulkItemHardwareRowSchema = z.object({
  sku: z.string().min(1, 'El SKU o referencia es requerido'),
  codigoBarras: z.string().optional(),
  nombre: z.string().min(1, 'El nombre del producto es requerido'),
  marca: z.string().optional(),
  categoria: z.string().default('General'),
  unidadMedida: z.string().default('UND'),
  ubicacionPasillo: z.string().optional(),
  costoUnitario: z.number().nonnegative('El costo unitario no puede ser negativo'),
  precioDetal: z.number().nonnegative('El precio detal no puede ser negativo'),
  precioMayorista: z.number().nonnegative().optional(),
  stockMinimo: z.number().int().nonnegative().optional().default(0),
  stockInicial: z.number().int().nonnegative().optional().default(0),
});

/**
 * Validador compuesto para venta concurrente con verificación de balance contable de pagos
 */
export function validarVentaConcurrente(payload: unknown): {
  success: boolean;
  data?: z.infer<typeof VentaPosConcurrenteSchema>;
  error?: string;
} {
  const result = VentaPosConcurrenteSchema.safeParse(payload);
  if (!result.success) {
    return {
      success: false,
      error: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
    };
  }

  // Verificar que la suma de pagos coincida con el total esperado (con margen de 1 COP por redondeo)
  const totalPagos = result.data.pagos.reduce((sum, p) => sum + p.monto, 0);
  if (Math.abs(totalPagos - result.data.montoTotal) > 1) {
    return {
      success: false,
      error: `La suma de los pagos ($${totalPagos}) no coincide con el monto total ($${result.data.montoTotal})`,
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

/**
 * Sanitizador y validador de filas de catálogo ferretero (normaliza comas/puntos en strings)
 */
export function validarBulkItemHardwareRow(rawRow: Record<string, any>): {
  success: boolean;
  data?: z.infer<typeof BulkItemHardwareRowSchema>;
  error?: string;
} {
  const parseNum = (val: any, defaultVal = 0): number => {
    if (typeof val === 'number') return isNaN(val) ? defaultVal : val;
    if (typeof val === 'string') {
      // Elimina puntos de miles y cambia coma decimal a punto
      const clean = val.replace(/\./g, '').replace(',', '.').trim();
      const num = parseFloat(clean);
      return isNaN(num) ? defaultVal : num;
    }
    return defaultVal;
  };

  const parsedRow = {
    sku: String(rawRow.sku || rawRow.SKU || rawRow.codigo || '').trim(),
    codigoBarras: rawRow.codigoBarras || rawRow.barcode || rawRow.codigo_barras || undefined,
    nombre: String(rawRow.nombre || rawRow.descripcion || rawRow.item || '').trim(),
    marca: rawRow.marca || rawRow.fabricante || undefined,
    categoria: String(rawRow.categoria || rawRow.rubro || 'General').trim(),
    unidadMedida: String(rawRow.unidadMedida || rawRow.unidad || 'UND').trim(),
    ubicacionPasillo: rawRow.ubicacionPasillo || rawRow.pasillo || rawRow.estante || undefined,
    costoUnitario: parseNum(rawRow.costoUnitario ?? rawRow.costo),
    precioDetal: parseNum(rawRow.precioDetal ?? rawRow.precio ?? rawRow.precioVenta),
    precioMayorista: rawRow.precioMayorista !== undefined ? parseNum(rawRow.precioMayorista) : undefined,
    stockMinimo: Math.round(parseNum(rawRow.stockMinimo, 0)),
    stockInicial: Math.round(parseNum(rawRow.stockInicial ?? rawRow.stock, 0)),
  };

  const result = BulkItemHardwareRowSchema.safeParse(parsedRow);
  if (!result.success) {
    return {
      success: false,
      error: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
    };
  }

  return {
    success: true,
    data: result.data,
  };
}
