/**
 * Tipos y Contratos para la App PWA Móvil de Repartidores/Conductores
 * Especificación: SPEC-023
 * Módulo: Entregas B2B, Firma Digital Canvas y Sincronización Offline Outbox
 */

import type {
  EstadoEntregaPedido,
  MotivoRechazoRuta
} from '../../packages/validation-schemas/src/deliveryRoute.schema';
import type {
  EvidenciaEntregaCliente,
  DevolucionItemRuta,
  RegistroEjecucionParada
} from '../../packages/validation-schemas/src/driverDeliveryPwa.schema';

export interface DriverSession {
  conductorId: string;
  conductorNombre: string;
  email: string;
  telefono?: string;
  vehiculoPlaca?: string;
  vehiculoNombre?: string;
  horaInicioTurno?: string;
  activo: boolean;
}

export interface DriverItemCanastilla {
  sku: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  kilosFacturados?: number;
}

export interface DriverDeliveryStop {
  id: string; // paradaId
  pedidoId: string;
  numeroPedido: string;
  clienteId: string;
  clienteNombre: string;
  clienteDireccion: string;
  clienteTelefono?: string;
  coordenadasGps?: {
    lat: number;
    lng: number;
  };
  montoPedidoOriginal: number;
  montoCobradoFinal: number;
  formaPago: 'CREDITO_B2B' | 'EFECTIVO' | 'TRANSFERENCIA_DIGITAL' | 'MIXTO';
  montoEfectivo: number;
  montoDigital: number;
  referenciaTransferencia?: string;
  estadoEntrega: EstadoEntregaPedido;
  horaEntrega?: string;
  evidencia?: EvidenciaEntregaCliente;
  items: DriverItemCanastilla[];
  devoluciones?: DevolucionItemRuta[];
  observaciones?: string;
}

export interface DriverActiveRoute {
  manifiestoId: string;
  numeroManifiesto: string;
  fecha: string;
  estado: 'PLANIFICADA' | 'EN_RUTA' | 'EN_LIQUIDACION' | 'LIQUIDADA';
  conductorId: string;
  conductorNombre: string;
  vehiculoPlaca: string;
  paradas: DriverDeliveryStop[];
  progresoPorcentaje: number;
  paradasCompletadas: number;
  paradasTotales: number;
  totalKilosCargados?: number;
}

export interface DriverSyncStatus {
  pendientesSync: number;
  ultimaSync?: string;
  estaEnLinea: boolean;
  sincronizando: boolean;
}

export interface DriverRecaudoResumen {
  totalEfectivo: number;
  totalTransferencia: number;
  totalCobrado: number;
  totalDevolucionesKg: number;
  paradasEntregadasTotal: number;
  paradasEntregadasParcial: number;
  paradasRechazadas: number;
}
