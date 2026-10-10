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

// ============================================================================
// EMPAQUES, TARAS Y LIQUIDACIÓN POR DÍAS / CARTERA
// ============================================================================

export const TipoEmpaqueCustodiaEnum = z.enum(['CANASTILLAS', 'CAJAS', 'SUELTO']);
export type TipoEmpaqueCustodia = z.infer<typeof TipoEmpaqueCustodiaEnum>;

export interface TaraPresetCliente {
  taraCanastillaKg: number;
  taraCajaKg: number;
  ultimaActualizacion?: string;
}

/**
 * Tara estándar predeterminada por tipo de embalaje (en Kilogramos)
 */
export const TARAS_PREDETERMINADAS_KG: Record<TipoEmpaqueCustodia, number> = {
  CANASTILLAS: 2.0, // Canastilla plástica estándar calada
  CAJAS: 0.8,       // Caja de cartón corrugado estándar
  SUELTO: 0.0,      // Pesa directa en báscula
};

/**
 * Realiza el cálculo gravimétrico exacto de tara y peso neto para cualquier embalaje.
 * Aplica redondeo milimétrico seguro con EPSILON evitando fallos de punto flotante.
 */
export function calcularTaraYNetoExacto(params: {
  tipoEmpaque: TipoEmpaqueCustodia;
  cantidadBultos: number;
  pesoBrutoKg: number;
  taraUnitariaConfigurada?: number;
}): {
  taraUnitaria: number;
  taraTotalKg: number;
  pesoNetoKg: number;
  esValido: boolean;
  error?: string;
} {
  const { tipoEmpaque, cantidadBultos, pesoBrutoKg, taraUnitariaConfigurada } = params;

  if (pesoBrutoKg <= 0) {
    return {
      taraUnitaria: 0,
      taraTotalKg: 0,
      pesoNetoKg: 0,
      esValido: false,
      error: 'El peso bruto en báscula debe ser mayor a 0 kg.',
    };
  }

  if (tipoEmpaque !== 'SUELTO' && cantidadBultos <= 0) {
    return {
      taraUnitaria: 0,
      taraTotalKg: 0,
      pesoNetoKg: 0,
      esValido: false,
      error: 'Debe ingresar al menos 1 unidad de empaque (cajas o canastillas).',
    };
  }

  const taraUnitaria =
    typeof taraUnitariaConfigurada === 'number' && taraUnitariaConfigurada >= 0
      ? taraUnitariaConfigurada
      : TARAS_PREDETERMINADAS_KG[tipoEmpaque];

  const multiplicador = tipoEmpaque === 'SUELTO' ? 1 : cantidadBultos;
  const taraTotalKg = Math.round((multiplicador * taraUnitaria + Number.EPSILON) * 100) / 100;

  if (pesoBrutoKg <= taraTotalKg) {
    return {
      taraUnitaria,
      taraTotalKg,
      pesoNetoKg: 0,
      esValido: false,
      error: `El peso bruto (${pesoBrutoKg} Kg) debe ser mayor a la tara total de los empaques (${taraTotalKg} Kg).`,
    };
  }

  const pesoNetoKg = Math.round(((pesoBrutoKg - taraTotalKg) + Number.EPSILON) * 100) / 100;

  return {
    taraUnitaria,
    taraTotalKg,
    pesoNetoKg,
    esValido: true,
  };
}

/**
 * Liquida el cobro de almacenamiento frigorífico para clientes por DÍAS.
 */
export function calcularLiquidacionDias(params: {
  fechaIngreso: string;
  fechaSalida: string;
  pesoNetoKg: number;
  tarifaDia: number;
  baseCobro?: 'KILOGRAMOS' | 'POSICIONES';
  cobrarIva?: boolean;
  porcentajeRetefuente?: number;
}): {
  diasCustodia: number;
  subtotal: number;
  iva: number;
  retefuente: number;
  totalPagar: number;
  baseCobro: 'KILOGRAMOS' | 'POSICIONES';
  unidadesCobro: number;
} {
  const {
    fechaIngreso,
    fechaSalida,
    pesoNetoKg,
    tarifaDia,
    baseCobro = 'KILOGRAMOS',
    cobrarIva = true,
    porcentajeRetefuente = 0,
  } = params;

  const inicio = new Date(fechaIngreso.substring(0, 10)).getTime();
  const fin = new Date(fechaSalida.substring(0, 10)).getTime();
  const diffMs = fin - inicio;
  const diasCalculados = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  // Mínimo 1 día de almacenamiento si entra y sale en la misma jornada
  const diasCustodia = Math.max(1, isNaN(diasCalculados) ? 1 : diasCalculados);

  let unidadesCobro = 0;
  let subtotal = 0;

  if (baseCobro === 'POSICIONES') {
    unidadesCobro = calcularPosicionesNecesarias(pesoNetoKg);
    subtotal = Math.round((diasCustodia * unidadesCobro * tarifaDia + Number.EPSILON) * 100) / 100;
  } else {
    // Por kilogramos
    unidadesCobro = pesoNetoKg;
    subtotal = Math.round((diasCustodia * pesoNetoKg * tarifaDia + Number.EPSILON) * 100) / 100;
  }

  const iva = cobrarIva ? Math.round((subtotal * IVA_COLOMBIA_STORAGE + Number.EPSILON) * 100) / 100 : 0;
  const retefuente = Math.round((subtotal * ((porcentajeRetefuente || 0) / 100) + Number.EPSILON) * 100) / 100;
  const totalPagar = Math.round((subtotal + iva - retefuente + Number.EPSILON) * 100) / 100;

  return {
    diasCustodia,
    subtotal,
    iva,
    retefuente,
    totalPagar,
    baseCobro,
    unidadesCobro,
  };
}

/**
 * Evalúa el estado de cartera de un cliente para un periodo o mensualidad.
 * Retorna estado en semáforo simplificado para operarios (La Regla de los 12 Años).
 */
export function evaluarCarteraYVencimiento(params: {
  fechaCorteMensualidad: string;
  fechaActual?: string;
  valorMensualidad: number;
  estadoPago: 'PENDIENTE' | 'PAGADA' | 'ANULADA';
}): {
  estadoSemaforo: 'AL_DIA' | 'POR_VENCER' | 'EN_MORA';
  diasMora: number;
  mensajeAlerta: string;
  saldoPendiente: number;
  badgeClase: string;
} {
  const { fechaCorteMensualidad, fechaActual, valorMensualidad, estadoPago } = params;

  if (estadoPago === 'PAGADA' || estadoPago === 'ANULADA') {
    return {
      estadoSemaforo: 'AL_DIA',
      diasMora: 0,
      mensajeAlerta: 'Al día: Mensualidad pagada',
      saldoPendiente: 0,
      badgeClase: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    };
  }

  const hoyStr = fechaActual ? fechaActual.substring(0, 10) : new Date().toISOString().substring(0, 10);
  const corteTime = new Date(fechaCorteMensualidad.substring(0, 10)).getTime();
  const hoyTime = new Date(hoyStr).getTime();
  const diffDias = Math.floor((hoyTime - corteTime) / (1000 * 60 * 60 * 24));

  if (diffDias > 0) {
    return {
      estadoSemaforo: 'EN_MORA',
      diasMora: diffDias,
      mensajeAlerta: `Vencido: ${diffDias} día${diffDias > 1 ? 's' : ''} de mora`,
      saldoPendiente: valorMensualidad,
      badgeClase: 'bg-rose-50 text-rose-700 border-rose-300',
    };
  } else if (diffDias >= -3) {
    return {
      estadoSemaforo: 'POR_VENCER',
      diasMora: 0,
      mensajeAlerta: diffDias === 0 ? 'Vence hoy' : `Vence en ${Math.abs(diffDias)} días`,
      saldoPendiente: valorMensualidad,
      badgeClase: 'bg-amber-50 text-amber-700 border-amber-300',
    };
  } else {
    return {
      estadoSemaforo: 'AL_DIA',
      diasMora: 0,
      mensajeAlerta: `Al día (Corte: ${fechaCorteMensualidad})`,
      saldoPendiente: valorMensualidad,
      badgeClase: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    };
  }
}

// ============================================================================
// ESQUEMAS MULTI-PARTIDA (BÁSCULA Y DESPACHO CON TARAS HETEROGÉNEAS)
// ============================================================================

/**
 * Representa una partida individual dentro de un ticket de pesaje en báscula.
 * Permite que un mismo producto se registre N veces con diferentes empaques/taras.
 */
export const PartidaRecepcionSchema = z.object({
  id: z.string().optional(),
  producto_nombre: z.string().min(1, 'Nombre de producto requerido').max(100),
  producto_custodia_id: z.string().optional(),
  lote_cliente: z.string().optional().default(''),
  fecha_vencimiento: z.string().optional().nullable(),
  tipo_empaque: TipoEmpaqueCustodiaEnum,
  cantidad_bultos: z.number().int().nonnegative('La cantidad de bultos no puede ser negativa'),
  tara_unitaria_kg: z.number().nonnegative('La tara unitaria no puede ser negativa'),
  peso_bruto_kg: z.number().positive('El peso bruto debe ser mayor a 0 kg'),
  peso_tara_total_kg: z.number().nonnegative(),
  peso_neto_kg: z.number().positive('El peso neto debe ser estrictamente positivo'),
  temperatura_c: z.number().min(-40).max(30).optional().default(-18.5),
});
export type PartidaRecepcion = z.infer<typeof PartidaRecepcionSchema>;

/**
 * Movimiento de recepción en báscula multi-partida.
 */
export const RecepcionMultipleInputSchema = z.object({
  empresa_id: z.string().optional(),
  contrato_id: z.string().min(1, 'Contrato requerido'),
  cliente_id: z.string().optional(),
  items: z.array(PartidaRecepcionSchema).min(1, 'Debe incluir al menos una pesada en la planilla'),
  transportador_nombre: z.string().min(1, 'Nombre del transportador requerido').max(100),
  transportador_cedula: z.string().min(1, 'Cédula requerida').max(30),
  placa_vehiculo: z.string().min(1, 'Placa requerida').max(15),
  temperatura_camion_c: z.number().min(-40).max(30).default(-18.0),
  observaciones: z.string().optional().nullable(),
});
export type RecepcionMultipleInput = z.infer<typeof RecepcionMultipleInputSchema>;

/**
 * Creación rápida de cliente y contrato in-situ en báscula (15 segundos).
 */
export const ClienteRapidoInputSchema = z.object({
  razon_social: z.string().min(2, 'Nombre o razón social requerida').max(150),
  numero_identificacion: z.string().min(4, 'Número de documento o NIT requerido').max(30),
  tipo_identificacion: z.string().default('NIT'),
  telefono: z.string().min(6, 'Teléfono requerido').max(30),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  modalidad_tiempo: ModalidadTiempoEnum.default('DIAS'),
  tarifa_pactada: z.number().positive('La tarifa debe ser mayor a 0'),
  capacidad_posiciones: z.number().int().positive().default(1),
  temperatura_acordada: z.number().optional().default(-18.0),
});
export type ClienteRapidoInput = z.infer<typeof ClienteRapidoInputSchema>;

/**
 * Producto individual para creación rápida asociada a cliente
 */
export const ProductoRapidoItemSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().min(1, 'El nombre de la especie o producto es requerido').max(150),
  tipo_empaque: TipoEmpaqueCustodiaEnum.default('CANASTILLAS'),
  tara_unitaria_kg: z.number().nonnegative().default(2.0),
});
export type ProductoRapidoItem = z.infer<typeof ProductoRapidoItemSchema>;

/**
 * Lote masivo de creación rápida de productos asociados a un cliente
 */
export const ProductosClienteBatchInputSchema = z.object({
  cliente_id: z.string().min(1, 'Cliente requerido'),
  productos: z.array(ProductoRapidoItemSchema).min(1, 'Debe incluir al menos un producto'),
});
export type ProductosClienteBatchInput = z.infer<typeof ProductosClienteBatchInputSchema>;

/**
 * Ítem individual seleccionado para retiro/despacho en el checklist de existencias.
 */
export const ItemDespachoCustodiaSchema = z.object({
  inventario_id: z.string().min(1, 'ID de inventario requerido'),
  producto_nombre: z.string().min(1, 'Producto requerido'),
  tipo_empaque: z.string().optional(),
  bultos_a_retirar: z.number().int().positive('Cantidad de bultos debe ser > 0'),
  peso_neto_a_retirar: z.number().positive('Peso a retirar debe ser > 0'),
  es_retiro_total: z.boolean().default(false),
});
export type ItemDespacho = z.infer<typeof ItemDespachoCustodiaSchema>;
export type ItemDespachoCustodia = ItemDespacho;

/**
 * Despacho múltiple consolidado de lotes en custodia.
 */
export const DespachoMultipleInputSchema = z.object({
  contrato_id: z.string().min(1, 'Contrato requerido'),
  cliente_id: z.string().min(1, 'Cliente requerido'),
  items: z.array(ItemDespachoCustodiaSchema).min(1, 'Debe seleccionar al menos un lote para retirar'),
  transportador_nombre: z.string().min(1, 'Nombre del transportador requerido').max(100),
  transportador_cedula: z.string().min(1, 'Cédula requerida').max(30),
  placa_vehiculo: z.string().min(1, 'Placa requerida').max(15),
  observaciones: z.string().optional().nullable(),
  autorizar_salida_mora: z.boolean().optional().default(false),
});
export type DespachoMultipleInput = z.infer<typeof DespachoMultipleInputSchema>;

/**
 * Calcula con precisión milimétrica los totales gravimétricos de una lista de partidas de pesaje.
 */
export function calcularTotalesPartidasRecepcion(items: PartidaRecepcion[]): {
  totalBultos: number;
  totalPesoBrutoKg: number;
  totalTaraTotalKg: number;
  totalPesoNetoKg: number;
  resumenPorProducto: Record<string, { bultos: number; pesoNetoKg: number; partidasCount: number }>;
  resumenPorEmpaque: Record<TipoEmpaqueCustodia, { bultos: number; pesoNetoKg: number }>;
} {
  let totalBultos = 0;
  let totalPesoBrutoKg = 0;
  let totalTaraTotalKg = 0;
  let totalPesoNetoKg = 0;

  const resumenPorProducto: Record<string, { bultos: number; pesoNetoKg: number; partidasCount: number }> = {};
  const resumenPorEmpaque: Record<TipoEmpaqueCustodia, { bultos: number; pesoNetoKg: number }> = {
    CANASTILLAS: { bultos: 0, pesoNetoKg: 0 },
    CAJAS: { bultos: 0, pesoNetoKg: 0 },
    SUELTO: { bultos: 0, pesoNetoKg: 0 },
  };

  for (const item of items) {
    totalBultos += item.cantidad_bultos;
    totalPesoBrutoKg = Math.round((totalPesoBrutoKg + item.peso_bruto_kg + Number.EPSILON) * 100) / 100;
    totalTaraTotalKg = Math.round((totalTaraTotalKg + item.peso_tara_total_kg + Number.EPSILON) * 100) / 100;
    totalPesoNetoKg = Math.round((totalPesoNetoKg + item.peso_neto_kg + Number.EPSILON) * 100) / 100;

    // Resumen agrupado por nombre de producto
    const prodKey = item.producto_nombre.trim().toUpperCase();
    if (!resumenPorProducto[prodKey]) {
      resumenPorProducto[prodKey] = { bultos: 0, pesoNetoKg: 0, partidasCount: 0 };
    }
    resumenPorProducto[prodKey].bultos += item.cantidad_bultos;
    resumenPorProducto[prodKey].pesoNetoKg =
      Math.round((resumenPorProducto[prodKey].pesoNetoKg + item.peso_neto_kg + Number.EPSILON) * 100) / 100;
    resumenPorProducto[prodKey].partidasCount += 1;

    // Resumen agrupado por empaque
    resumenPorEmpaque[item.tipo_empaque].bultos += item.cantidad_bultos;
    resumenPorEmpaque[item.tipo_empaque].pesoNetoKg =
      Math.round((resumenPorEmpaque[item.tipo_empaque].pesoNetoKg + item.peso_neto_kg + Number.EPSILON) * 100) / 100;
  }

  return {
    totalBultos,
    totalPesoBrutoKg,
    totalTaraTotalKg,
    totalPesoNetoKg,
    resumenPorProducto,
    resumenPorEmpaque,
  };
}

/**
 * Calcula con precisión milimétrica el peso neto y bruto para productos
 * estandarizados que ingresan por cajas con peso nominal fijo (ej. papas a la francesa en cajas de 10 kg).
 */
export function calcularPesoCajasNominal(params: {
  cantidadCajas: number;
  pesoNominalKg: number;
  taraUnitariaKg?: number;
}): {
  pesoNetoKg: number;
  taraTotalKg: number;
  pesoBrutoKg: number;
  esValido: boolean;
  error?: string;
} {
  const { cantidadCajas, pesoNominalKg, taraUnitariaKg = 0 } = params;

  if (cantidadCajas <= 0) {
    return {
      pesoNetoKg: 0,
      taraTotalKg: 0,
      pesoBrutoKg: 0,
      esValido: false,
      error: 'La cantidad de cajas debe ser mayor a 0.',
    };
  }

  if (pesoNominalKg <= 0) {
    return {
      pesoNetoKg: 0,
      taraTotalKg: 0,
      pesoBrutoKg: 0,
      esValido: false,
      error: 'El peso nominal por caja debe ser mayor a 0 kg.',
    };
  }

  const pesoNetoKg = Math.round((cantidadCajas * pesoNominalKg + Number.EPSILON) * 100) / 100;
  const taraTotalKg = Math.round((cantidadCajas * taraUnitariaKg + Number.EPSILON) * 100) / 100;
  const pesoBrutoKg = Math.round(((pesoNetoKg + taraTotalKg) + Number.EPSILON) * 100) / 100;

  return {
    pesoNetoKg,
    taraTotalKg,
    pesoBrutoKg,
    esValido: true,
  };
}

/**
 * Estima por regla de tres el peso proporcional sugerido a retirar en una salida parcial a granel.
 * Si la cantidad de bultos a retirar iguala o supera el saldo actual, retorna exactamente el saldo total de kg disponible
 * evitando errores de decimales o redondeo en el vaciado.
 */
export function calcularEstimacionProporcionalSalida(params: {
  pesoNetoActualKg: number;
  bultosActuales: number;
  bultosARetirar: number;
}): {
  pesoSugeridoKg: number;
  esRetiroTotal: boolean;
  pesoPromedioPorBultoKg: number;
} {
  const { pesoNetoActualKg, bultosActuales, bultosARetirar } = params;

  if (bultosActuales <= 0 || pesoNetoActualKg <= 0 || bultosARetirar <= 0) {
    return {
      pesoSugeridoKg: 0,
      esRetiroTotal: false,
      pesoPromedioPorBultoKg: 0,
    };
  }

  const pesoPromedioPorBultoKg =
    Math.round(((pesoNetoActualKg / bultosActuales) + Number.EPSILON) * 1000) / 1000;

  // Si retira todos los bultos (o más), sugerir el 100% exacto del peso actual disponible
  if (bultosARetirar >= bultosActuales) {
    return {
      pesoSugeridoKg: Math.round((pesoNetoActualKg + Number.EPSILON) * 100) / 100,
      esRetiroTotal: true,
      pesoPromedioPorBultoKg,
    };
  }

  const pesoSugeridoKg =
    Math.round(((pesoNetoActualKg / bultosActuales) * bultosARetirar + Number.EPSILON) * 100) / 100;

  return {
    pesoSugeridoKg,
    esRetiroTotal: false,
    pesoPromedioPorBultoKg,
  };
}


