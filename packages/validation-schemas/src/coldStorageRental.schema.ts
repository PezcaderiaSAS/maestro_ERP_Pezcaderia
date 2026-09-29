import { z } from 'zod';

// Constantes de negocio para Alquiler de Cuarto Frío WMS
export const NOMINAL_KG_POR_POSICION = 800.0;
export const IVA_COLOMBIA_STORAGE = 0.19;

// Enums
export const ModalidadTiempoEnum = z.enum(['DIAS', 'MESES']);
export type ModalidadTiempo = z.infer<typeof ModalidadTiempoEnum>;

export const ModalidadFacturacionEnum = z.enum(['ANTICIPADA', 'VENCIDA']);
export type ModalidadFacturacion = z.infer<typeof ModalidadFacturacionEnum>;

export const EstadoContratoEnum = z.enum(['BORRADOR', 'VIGENTE', 'FINALIZADO', 'CANCELADO']);
export type EstadoContrato = z.infer<typeof EstadoContratoEnum>;

export const EstadoClienteCustodiaEnum = z.enum(['ACTIVO', 'INACTIVO', 'BLOQUEADO_MORA']);
export type EstadoClienteCustodia = z.infer<typeof EstadoClienteCustodiaEnum>;

export const ModalidadMedicionProductoEnum = z.enum([
  'SOLO_PESO',
  'PESO_ESTABLE',
  'MIXTO_BULTOS_PESO',
]);
export type ModalidadMedicionProducto = z.infer<typeof ModalidadMedicionProductoEnum>;

export const TipoMovimientoCustodiaEnum = z.enum(['ENTRADA', 'SALIDA']);
export type TipoMovimientoCustodia = z.infer<typeof TipoMovimientoCustodiaEnum>;

// Esquema de Cuarto Frío
export const CuartoFrioSchema = z.object({
  id: z.string().uuid().optional(),
  empresa_id: z.string().uuid('ID de empresa inválido'),
  codigo: z.string().min(1, 'El código es requerido').max(30),
  nombre: z.string().min(1, 'El nombre es requerido').max(100),
  temperatura_setpoint: z.number().min(-40).max(20).default(-18.0),
  capacidad_total_posiciones: z.number().int().positive('La capacidad debe ser mayor a 0 posiciones'),
  activo: z.boolean().default(true),
});
export type CuartoFrio = z.infer<typeof CuartoFrioSchema>;

// Esquema de Cliente de Custodia (3PL)
export const PersonaAutorizadaRetiroSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  identificacion: z.string().min(1, 'Identificación requerida'),
  cargo: z.string().optional(),
  telefono: z.string().optional(),
});

export const ClienteCustodiaSchema = z.object({
  id: z.string().uuid().optional(),
  empresa_id: z.string().uuid('ID de empresa inválido'),
  tercero_id: z.string().uuid().nullable().optional(),
  razon_social: z.string().min(1, 'Razón social requerida').max(150),
  numero_identificacion: z.string().min(1, 'Número de identificación requerido').max(30),
  tipo_identificacion: z.string().default('NIT'),
  responsable_contacto: z.string().max(100).optional().nullable(),
  telefono: z.string().max(30).optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable(),
  autorizados_retiro: z.array(PersonaAutorizadaRetiroSchema).default([]),
  estado: EstadoClienteCustodiaEnum.default('ACTIVO'),
});
export type ClienteCustodia = z.infer<typeof ClienteCustodiaSchema>;

// Esquema de Producto en Custodia
export const ProductoCustodiaSchema = z.object({
  id: z.string().uuid().optional(),
  empresa_id: z.string().uuid('ID de empresa inválido'),
  cliente_id: z.string().uuid('ID de cliente en custodia requerido'),
  codigo_cliente: z.string().max(50).optional().nullable(),
  nombre: z.string().min(1, 'Nombre de producto requerido').max(150),
  tipo_empaque: z.string().max(30).default('CAJA_CARTON'),
  modalidad_medicion: ModalidadMedicionProductoEnum.default('SOLO_PESO'),
  peso_unitario_nominal: z.number().positive('El peso nominal debe ser positivo').optional().nullable(),
  temperatura_optima: z.string().max(30).default('-18C a -22C'),
  activo: z.boolean().default(true),
}).refine((data) => {
  if (data.modalidad_medicion === 'PESO_ESTABLE' && (!data.peso_unitario_nominal || data.peso_unitario_nominal <= 0)) {
    return false;
  }
  return true;
}, {
  message: 'Para productos con peso estable, el peso unitario nominal es obligatorio y mayor a cero.',
  path: ['peso_unitario_nominal'],
});
export type ProductoCustodia = z.infer<typeof ProductoCustodiaSchema>;

// Esquema de Contrato de Alquiler de Cuarto Frío
export const ContratoAlquilerCfSchema = z.object({
  id: z.string().uuid().optional(),
  empresa_id: z.string().uuid('ID de empresa inválido'),
  consecutivo: z.string().min(1, 'Consecutivo requerido').max(30),
  cliente_id: z.string().uuid('ID de cliente requerido'),
  cuarto_frio_id: z.string().uuid('ID de cuarto frío requerido'),
  modalidad_tiempo: ModalidadTiempoEnum,
  posiciones_contratadas: z.number().int().positive('Debe contratar al menos 1 posición (800 kg)'),
  tarifa_unitaria: z.number().nonnegative('La tarifa unitaria no puede ser negativa'),
  tarifa_recargo_sobrepeso_kg: z.number().nonnegative('La tarifa de recargo no puede ser negativa').default(0),
  modalidad_facturacion: ModalidadFacturacionEnum.default('ANTICIPADA'),
  requiere_cuentas_orden: z.boolean().default(false),
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD requerido'),
  fecha_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD requerido'),
  estado: EstadoContratoEnum.default('VIGENTE'),
  observaciones: z.string().optional().nullable(),
}).refine((data) => new Date(data.fecha_fin) >= new Date(data.fecha_inicio), {
  message: 'La fecha de fin no puede ser anterior a la fecha de inicio',
  path: ['fecha_fin'],
});
export type ContratoAlquilerCf = z.infer<typeof ContratoAlquilerCfSchema>;

// Esquema para Operación de Báscula: Recepción / Ingreso en Custodia
export const RecepcionCustodiaInputSchema = z.object({
  empresa_id: z.string().uuid('ID de empresa inválido'),
  contrato_id: z.string().uuid('ID de contrato requerido'),
  producto_custodia_id: z.string().uuid('ID de producto requerido'),
  lote_cliente: z.string().min(1, 'El lote del cliente es requerido').max(50),
  bultos: z.number().int().nonnegative('Los bultos no pueden ser negativos'),
  peso_bruto_kg: z.number().positive('El peso bruto debe ser mayor a cero'),
  peso_tara_kg: z.number().nonnegative('La tara no puede ser negativa').default(0),
  temperatura: z.number().min(-40).max(30, 'Temperatura fuera de rango operativo').default(-18.0),
  transportador_nombre: z.string().min(1, 'Nombre del transportador requerido').max(100),
  transportador_cedula: z.string().min(1, 'Cédula del transportador requerida').max(30),
  placa_vehiculo: z.string().min(1, 'Placa del vehículo requerida').max(15),
  operador_id: z.string().uuid('ID del operador requerido'),
  fecha_vencimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  observaciones: z.string().optional().nullable(),
}).refine((data) => data.peso_bruto_kg > data.peso_tara_kg, {
  message: 'El peso bruto debe ser estrictamente mayor a la tara (peso neto > 0)',
  path: ['peso_bruto_kg'],
});
export type RecepcionCustodiaInput = z.infer<typeof RecepcionCustodiaInputSchema>;

// Esquema para Operación de Báscula: Despacho / Salida de Custodia
export const DespachoCustodiaInputSchema = z.object({
  empresa_id: z.string().uuid('ID de empresa inválido'),
  inventario_id: z.string().uuid('ID de inventario en custodia requerido'),
  bultos_despacho: z.number().int().nonnegative('Los bultos a despachar deben ser >= 0'),
  peso_bruto_salida: z.number().positive('El peso bruto de salida debe ser mayor a cero'),
  peso_tara_salida: z.number().nonnegative('La tara de salida no puede ser negativa').default(0),
  transportador_nombre: z.string().min(1, 'Nombre del transportador requerido').max(100),
  transportador_cedula: z.string().min(1, 'Cédula requerida').max(30),
  placa_vehiculo: z.string().min(1, 'Placa requerida').max(15),
  operador_id: z.string().uuid('ID del operador requerido'),
  autorizado_gerencia_id: z.string().uuid().optional().nullable(),
  observaciones: z.string().optional().nullable(),
}).refine((data) => data.peso_bruto_salida > data.peso_tara_salida, {
  message: 'El peso bruto de salida debe superar a la tara (peso neto salida > 0)',
  path: ['peso_bruto_salida'],
});
export type DespachoCustodiaInput = z.infer<typeof DespachoCustodiaInputSchema>;

// Esquema para Causación Contable de Alquiler
export const CausacionIngresoInputSchema = z.object({
  empresa_id: z.string().uuid('ID de empresa inválido'),
  contrato_id: z.string().uuid('ID de contrato requerido'),
  periodo_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD'),
  periodo_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD'),
  recargo_sobrecupo: z.number().nonnegative().default(0),
  porcentaje_retefuente: z.number().min(0).max(100).default(0),
}).refine((data) => new Date(data.periodo_fin) >= new Date(data.periodo_inicio), {
  message: 'El periodo fin debe ser mayor o igual al periodo inicio',
  path: ['periodo_fin'],
});
export type CausacionIngresoInput = z.infer<typeof CausacionIngresoInputSchema>;

// ============================================================================
// FUNCIONES DETERMINISTAS DE CÁLCULO CIENTÍFICO Y NEGOCIO
// ============================================================================

/**
 * Calcula el número mínimo de posiciones de 800 kg requeridas para almacenar una masa en kg.
 */
export function calcularPosicionesNecesarias(kilos: number): number {
  if (kilos <= 0) return 0;
  return Math.ceil(kilos / NOMINAL_KG_POR_POSICION);
}

/**
 * Calcula los kilogramos de sobrecupo excedentes sobre la capacidad contratada.
 */
export function calcularSobrecupoKg(pesoActualKg: number, capacidadContratadaKg: number): number {
  if (pesoActualKg <= capacidadContratadaKg) return 0.0;
  return Number((pesoActualKg - capacidadContratadaKg).toFixed(2));
}

/**
 * Calcula el costo monetario del sobrecupo según la tarifa pactada por kg extra.
 */
export function calcularRecargoSobrecupo(sobrecupoKg: number, tarifaRecargoKg: number): number {
  if (sobrecupoKg <= 0 || tarifaRecargoKg <= 0) return 0.0;
  return Number((sobrecupoKg * tarifaRecargoKg).toFixed(2));
}

/**
 * Calcula la merma de peso por deshidratación/almacenamiento en frío al despachar.
 */
export function calcularMermaSalida(pesoTeoricoKg: number, pesoRealSalidaKg: number): {
  mermaKg: number;
  porcentajeMerma: number;
} {
  if (pesoTeoricoKg <= 0 || pesoRealSalidaKg >= pesoTeoricoKg) {
    return { mermaKg: 0.0, porcentajeMerma: 0.0 };
  }
  const mermaKg = Number((pesoTeoricoKg - pesoRealSalidaKg).toFixed(2));
  const porcentajeMerma = Number(((mermaKg / pesoTeoricoKg) * 100).toFixed(2));
  return { mermaKg, porcentajeMerma };
}

/**
 * Realiza el cálculo contable completo de una causación de alquiler de cuarto frío.
 */
export function liquidarCausacionAlquiler(params: {
  posicionesContratadas: number;
  tarifaUnitaria: number;
  modalidadTiempo: 'DIAS' | 'MESES';
  diasEfectivos: number;
  recargoSobrecupo?: number;
  porcentajeRetefuente?: number;
}): {
  unidades: number;
  subtotalServicio: number;
  recargoSobrecupo: number;
  baseGravable: number;
  iva19: number;
  retefuente: number;
  totalPagar: number;
} {
  const {
    posicionesContratadas,
    tarifaUnitaria,
    modalidadTiempo,
    diasEfectivos,
    recargoSobrecupo = 0,
    porcentajeRetefuente = 0,
  } = params;

  let unidades = 0;
  if (modalidadTiempo === 'DIAS') {
    unidades = Math.max(1, diasEfectivos);
  } else {
    // Meses (30 días comerciales por mes)
    unidades = Math.max(1, Math.round(diasEfectivos / 30));
  }

  const subtotalServicio = Number((posicionesContratadas * unidades * tarifaUnitaria).toFixed(2));
  const baseGravable = Number((subtotalServicio + recargoSobrecupo).toFixed(2));
  const iva19 = Number((baseGravable * IVA_COLOMBIA_STORAGE).toFixed(2));
  const retefuente = Number((baseGravable * (porcentajeRetefuente / 100)).toFixed(2));
  const totalPagar = Number((baseGravable + iva19 - retefuente).toFixed(2));

  return {
    unidades,
    subtotalServicio,
    recargoSobrecupo,
    baseGravable,
    iva19,
    retefuente,
    totalPagar,
  };
}
