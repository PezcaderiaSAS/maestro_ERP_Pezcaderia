import type {
  ContratoAlquilerCf,
  ClienteCustodia,
  ProductoCustodia,
  CuartoFrio,
  PartidaRecepcion,
  ItemDespacho,
} from '../../../packages/validation-schemas/src/coldStorageRental.schema';
import type { InventarioCustodiaItem, MovimientoCustodiaItem } from '../coldStorageRentalService';

export type {
  ContratoAlquilerCf,
  ClienteCustodia,
  ProductoCustodia,
  CuartoFrio,
  PartidaRecepcion,
  ItemDespacho,
  InventarioCustodiaItem,
  MovimientoCustodiaItem,
};

/**
 * Parámetros para la generación de Acta de Recepción e Ingreso Individual (1 a 1)
 */
export interface ActaRecepcionPdfParams {
  movimiento: MovimientoCustodiaItem;
  inventario: InventarioCustodiaItem;
  cliente: ClienteCustodia;
  producto: ProductoCustodia;
  cuartoFrioNombre?: string;
}

/**
 * Parámetros para la generación de Acta de Despacho y Salida Individual (1 a 1)
 */
export interface ActaDespachoPdfParams {
  movimiento: MovimientoCustodiaItem;
  inventario: InventarioCustodiaItem;
  cliente: ClienteCustodia;
  producto: ProductoCustodia;
  remanenteBultos: number;
  remanentePesoKg: number;
}

/**
 * Parámetros para la generación del Certificado Oficial de Custodia y Saldos
 */
export interface CertificadoCustodiaPdfParams {
  cliente: ClienteCustodia;
  inventarioItems: InventarioCustodiaItem[];
  fechaCorte: string;
}

/**
 * Parámetros para la generación del Recibo Oficial de Caja (Formato Carta Ejecutivo)
 */
export interface ReciboPagoAlquilerPdfParams {
  consecutivo: string;
  cliente: ClienteCustodia;
  contrato?: ContratoAlquilerCf;
  concepto: string;
  periodo?: string;
  modalidadTiempo?: 'DIAS' | 'MESES';
  diasLiquidacion?: number;
  kilosLiquidacion?: number;
  subtotal: number;
  iva: number;
  retefuente?: number;
  totalPagar: number;
  metodoPago: string;
  referenciaCaja?: string;
  cajeroNombre?: string;
  fechaPago?: string;
}

/**
 * Parámetros para la generación de la Tirilla Térmica POS de Alquiler Frigorífico (80mm)
 */
export interface TicketTermicoAlquilerPdfParams {
  consecutivo: string;
  cliente: ClienteCustodia;
  concepto: string;
  totalPagar: number;
  metodoPago: string;
  fechaPago?: string;
  cajeroNombre?: string;
}

/**
 * Parámetros para la generación del Acta Consolidada de Recepción e Ingreso con Múltiples Partidas
 */
export interface ActaRecepcionMultiplePdfParams {
  actaConsecutivo: string;
  cliente: ClienteCustodia;
  contrato?: ContratoAlquilerCf;
  cuartoFrioNombre?: string;
  transportadorNombre: string;
  transportadorCedula: string;
  placaVehiculo: string;
  temperaturaC: number;
  observaciones?: string | null;
  items: PartidaRecepcion[];
}

/**
 * Parámetros para la generación del Acta Consolidada de Despacho y Salida de Múltiples Lotes
 */
export interface ActaDespachoMultiplePdfParams {
  actaConsecutivo: string;
  cliente: ClienteCustodia;
  transportadorNombre: string;
  transportadorCedula: string;
  placaVehiculo: string;
  observaciones?: string | null;
  items: ItemDespacho[];
}

