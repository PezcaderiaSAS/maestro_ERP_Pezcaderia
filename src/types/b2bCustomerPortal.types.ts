/**
 * ============================================================================
 * LA PEZCADERIA ERP — TIPOS DE DOMINIO: PORTAL B2B HORECA
 * ============================================================================
 * Contratos de datos tipados para el Portal de Clientes B2B Auto-Servicio.
 */

import type {
  B2BProductCut,
  B2BPackaging,
  B2BSaleModality,
  B2BPaymentMethod,
  B2BDeliverySchedule,
  B2BWeekDay,
  B2BOrderLineInput,
  CreateB2BOrderInput,
  B2BRecurringTemplate,
} from '../../packages/validation-schemas/src/b2bCustomerPortal.schema';

export type {
  B2BProductCut,
  B2BPackaging,
  B2BSaleModality,
  B2BPaymentMethod,
  B2BDeliverySchedule,
  B2BWeekDay,
  B2BOrderLineInput,
  CreateB2BOrderInput,
  B2BRecurringTemplate,
};

export type B2BOrderStatus =
  | 'CREADO'
  | 'PENDIENTE_APROBACION_CARTERA'
  | 'EN_ALISTAMIENTO'
  | 'EN_BASCULA_PACKING'
  | 'EN_RUTA_FRIO'
  | 'ENTREGADO'
  | 'CANCELADO';

export interface B2BCustomerProfile {
  id: string;
  razonSocial: string;
  nombreComercial?: string;
  nit: string;
  tipoPrecio: 'RESTAURANTE' | 'MAYORISTA' | 'ESPECIAL' | 'POS';
  cupoCreditoCop: number;
  saldoCarteraPendienteCop: number;
  cupoDisponibleCop: number;
  plazoDiasPago: number;
  direccionPrincipal: string;
  sucursales: Array<{
    id: string;
    nombre: string;
    direccion: string;
    telefono?: string;
    ciudad: string;
  }>;
  activo: boolean;
}

export interface B2BCatalogProductItem {
  productoId: string;
  sku: string;
  nombre: string;
  especie: string;
  categoria: string;
  precioBaseCop: number;
  precioPactadoCop: number;
  modalidadVentaDefault: B2BSaleModality;
  cortesDisponibles: B2BProductCut[];
  empaquesDisponibles: B2BPackaging[];
  stockDisponibleKg: number;
  stockDisponiblePiezas?: number;
  origen: string;
  imagenAvatarSvg?: string;
}

export interface B2BCartItem extends B2BOrderLineInput {
  subtotalCop: number;
  pesoEstimadoTotalKg: number;
}

export interface B2BOrderRecord {
  id: string;
  numeroPedido: string;
  clienteId: string;
  clienteNombre: string;
  nit: string;
  sucursalEntrega: string;
  direccionEntrega: string;
  telefonoContacto?: string;
  fechaCreacion: string;
  fechaRequeridaEntrega: string;
  jornadaRequerida: B2BDeliverySchedule;
  formaPago: B2BPaymentMethod;
  estado: B2BOrderStatus;
  lineas: B2BCartItem[];
  subtotalEstimadoCop: number;
  ivaEstimadoCop: number;
  totalEstimadoCop: number;
  totalFinalRealCop?: number;
  manifiestoId?: string;
  numeroRemision?: string;
  temperaturaDespachoCelsius?: number;
  horaEntregaEfectiva?: string;
  instruccionesCocina?: string;
  origenPlantillaId?: string;
}

export interface B2BCreditStatus {
  cupoTotalCop: number;
  saldoPendienteCop: number;
  cupoDisponibleCop: number;
  estadoSemaforo: 'AL_DIA' | 'EN_ALERTA' | 'BLOQUEADO_MORA';
  facturasPendientesCount: number;
  diasPromedioPago: number;
}
