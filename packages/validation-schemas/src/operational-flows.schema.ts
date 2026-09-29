import { z } from 'zod';

// ============================================================================
// 1. FLUJO DE VENTA EN POS INTELIGENTE
// ============================================================================
export const PosItemLineaSchema = z.object({
  productoId: z.string().uuid('ID de producto inválido'),
  sku: z.string().min(1, 'El código SKU es obligatorio'),
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  cantidad: z.number().positive('La cantidad debe ser mayor a cero'),
  precioUnitario: z.number().nonnegative('El precio unitario no puede ser negativo'),
  descuentoPct: z.number().min(0).max(100).default(0),
  subtotal: z.number().nonnegative(),
  bodegaCodigo: z.literal('P', {
    errorMap: () => ({ message: 'Las ventas POS solo pueden despachar de la Bodega Principal (P)' }),
  }),
});

export const VentaPosPayloadSchema = z.object({
  tenantId: z.string().uuid('ID de empresa inválido'),
  cajaSesionId: z.string().uuid('Se requiere una sesión de caja abierta activa'),
  cajeroId: z.string().uuid('ID de cajero requerido'),
  clienteIdentificacion: z.string().min(5, 'Identificación de cliente inválida'),
  clienteNombre: z.string().min(2, 'Nombre de cliente inválido'),
  tipoPrecioAplicado: z.enum(['POS', 'RESTAURANTE', 'MAYORISTA', 'ESPECIAL']),
  esUltimoPrecioSugerido: z.boolean().default(false),
  metodoPago: z.enum(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'MIXTO']),
  montoRecibido: z.number().nonnegative(),
  cambioDevuelto: z.number().nonnegative().default(0),
  lineas: z.array(PosItemLineaSchema).min(1, 'Debe incluir al menos un producto en la venta'),
  subtotal: z.number().nonnegative(),
  impuestos: z.number().nonnegative().default(0),
  total: z.number().positive('El total de la venta debe ser mayor a cero'),
}).refine(
  (data) => {
    if (data.metodoPago === 'EFECTIVO' && data.montoRecibido < data.total) {
      return false;
    }
    return true;
  },
  {
    message: 'El monto recibido en efectivo no puede ser inferior al total de la venta.',
    path: ['montoRecibido'],
  }
);

export type VentaPosPayload = z.infer<typeof VentaPosPayloadSchema>;

// ============================================================================
// 2. FLUJO DE APERTURA, ARQUEO Y CIERRE DE CAJA
// ============================================================================
export const AperturaCajaSchema = z.object({
  tenantId: z.string().uuid(),
  cajaId: z.string().uuid(),
  cajeroId: z.string().uuid(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha YYYY-MM-DD requerido'),
  saldoBaseInicial: z.number().nonnegative('El saldo base no puede ser negativo'),
  observaciones: z.string().max(255).optional(),
});

export const CierreCajaArqueoSchema = z.object({
  cajaSesionId: z.string().uuid(),
  tenantId: z.string().uuid(),
  cajeroId: z.string().uuid(),
  supervisorId: z.string().uuid().optional(),
  efectivoFisicoReportado: z.number().nonnegative(),
  tarjetasReportado: z.number().nonnegative().default(0),
  transferenciasReportado: z.number().nonnegative().default(0),
  totalSistemaEsperado: z.number().nonnegative(),
  descuadreMonetario: z.number(), // Calculado: Total Reportado - Total Sistema
  justificacionDescuadre: z.string().optional(),
}).refine(
  (data) => {
    // Si el descuadre supera $10,000 COP, exige justificación y supervisor
    if (Math.abs(data.descuadreMonetario) > 10000) {
      return Boolean(data.justificacionDescuadre && data.supervisorId);
    }
    return true;
  },
  {
    message: 'Un descuadre mayor a $10,000 requiere justificación escrita y PIN de supervisor.',
    path: ['justificacionDescuadre'],
  }
);

// ============================================================================
// 3. FLUJO DE COMPRAS Y ABASTECIMIENTO DE PROVEEDORES
// ============================================================================
export const RecepcionCompraItemSchema = z.object({
  productoId: z.string().uuid(),
  sku: z.string(),
  numeroLoteProveedor: z.string().min(1, 'El número de lote es obligatorio'),
  fechaVencimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha de vencimiento inválida'),
  temperaturaLlegada: z.number().max(4.0, 'La cadena de frío para pescadería exige máximo 4°C'),
  cantidadPedida: z.number().positive(),
  cantidadRecibida: z.number().positive(),
  bodegaDestino: z.enum(['P', 'S']), // Principal o Secundaria
  costoUnitario: z.number().positive(),
});

export const RecepcionCompraSchema = z.object({
  tenantId: z.string().uuid(),
  ordenCompraId: z.string().uuid(),
  proveedorId: z.string().uuid(),
  fechaRecepcion: z.string(),
  bodegueroId: z.string().uuid(),
  items: z.array(RecepcionCompraItemSchema).min(1, 'Debe registrar al menos un ítem recibido'),
  facturaProveedorNumero: z.string().min(1, 'Número de remisión o factura obligatorio'),
});

// ============================================================================
// 4. FLUJO B2B: COTIZACIONES Y CONTROL DE MÁRGENES (RBAC)
// ============================================================================
export const CotizacionB2BLineaSchema = z.object({
  productoId: z.string().uuid(),
  cantidad: z.number().positive(),
  costoBase: z.number().positive(),
  precioLista: z.number().positive(),
  descuentoPct: z.number().min(0).max(100),
  precioAcordado: z.number().positive(),
  subtotal: z.number().positive(),
});

export const TransicionCotizacionB2BSchema = z.object({
  cotizacionId: z.string().uuid(),
  tenantId: z.string().uuid(),
  estadoActual: z.enum(['DRAFT', 'SENT', 'APPROVED', 'EXPIRED', 'SOLD']),
  nuevoEstado: z.enum(['DRAFT', 'SENT', 'APPROVED', 'EXPIRED', 'SOLD']),
  usuarioId: z.string().uuid(),
  usuarioRol: z.enum(['ADMIN', 'SUPERVISOR', 'VENDEDOR']),
  margenUtilidadPct: z.number(),
  descuentoMaximoAplicado: z.number().default(0),
}).refine(
  (data) => {
    // Si un vendedor intenta pasar a APPROVED con descuento > 15%, se rechaza
    if (data.nuevoEstado === 'APPROVED' && data.usuarioRol === 'VENDEDOR') {
      return false; // Vendedores no pueden auto-aprobar
    }
    return true;
  },
  {
    message: 'Privilegios insuficientes: Solo Administradores y Supervisores pueden autorizar cotizaciones B2B.',
    path: ['nuevoEstado'],
  }
).refine(
  (data) => {
    if (data.nuevoEstado === 'APPROVED' && data.margenUtilidadPct < 10.0 && data.usuarioRol !== 'ADMIN') {
      return false;
    }
    return true;
  },
  {
    message: 'Cotización bloqueada por margen insuficiente (< 10%). Requiere aprobación de Ultra-Admin o Admin.',
    path: ['margenUtilidadPct'],
  }
);

// ============================================================================
// 5. FLUJO DE ALISTAMIENTO, PICKING Y DESPACHO DE RUTAS
// ============================================================================
export const DespachoRutaSchema = z.object({
  rutaId: z.string().uuid(),
  tenantId: z.string().uuid(),
  despachadorId: z.string().uuid(),
  conductorId: z.string().uuid(),
  pesoSalidaKg: z.number().positive('El peso de salida debe ser mayor a cero'),
  pesoEntregadoKg: z.number().positive('El peso entregado debe ser mayor a cero'),
  mermaDeclaradaKg: z.number().nonnegative(),
  mermaPorcentaje: z.number().min(0).max(100),
  pinSupervisorAutorizacion: z.string().optional(),
  justificacionMerma: z.string().optional(),
  gastosRutaPeajes: z.number().nonnegative().default(0),
  gastosRutaCombustible: z.number().nonnegative().default(0),
}).refine(
  (data) => {
    // Regla de Oro: Merma > 35% requiere PIN de supervisor y justificación obligatoria
    if (data.mermaPorcentaje > 35.0) {
      return Boolean(data.pinSupervisorAutorizacion && data.pinSupervisorAutorizacion.length >= 4 && data.justificacionMerma);
    }
    return true;
  },
  {
    message: 'ALERTA DE MERMA CRÍTICA: La merma supera el umbral permitido del 35%. Es obligatorio registrar justificación y PIN de 4 dígitos del supervisor.',
    path: ['pinSupervisorAutorizacion'],
  }
);

export type DespachoRutaPayload = z.infer<typeof DespachoRutaSchema>;
