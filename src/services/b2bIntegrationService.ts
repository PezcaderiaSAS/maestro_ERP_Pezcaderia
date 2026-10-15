/**
 * Fachada delgada (Facade Pattern) para el Ecosistema de Integración B2B.
 * Cumple con los principios de diseño SOLID (SRP, OCP, LSP, ISP, DIP):
 * - Delega la Fase 1 Comercial a B2BCommercialOrderService.
 * - Delega la Fase 2 WMS y Alistamiento a B2BWmsPreparationService.
 * - Delega la Fase 3 Despacho y Rutas a B2BRouteDeliveryService.
 * 
 * Preserva 100% de compatibilidad hacia atrás con las vistas UI y las suites de pruebas.
 */

import { Pedido } from '../types/orders.types';
import { DeliveryRouteRecord } from './deliveryRouteService';
import {
  ConvertirCotizacionInput,
  CrearPedidoVentaExternaInput,
  IniciarAlistamientoInput,
  RegistrarPesajeLineaInput,
  FinalizarAlistamientoInput,
  CrearYDespacharManifiestoInput,
  RegistrarEntregaEnSitioInput,
  LiquidarManifiestoInput,
  LineaVentaExternaInput,
} from '../contracts/b2b.contracts';

import {
  B2BCommercialOrderService,
  b2bCommercialOrderService,
} from './b2b/B2BCommercialOrderService';
import {
  B2BWmsPreparationService,
  b2bWmsPreparationService,
} from './b2b/B2BWmsPreparationService';
import {
  B2BRouteDeliveryService,
  b2bRouteDeliveryService,
} from './b2b/B2BRouteDeliveryService';

// Re-exportar contratos e inputs para compatibilidad completa hacia atrás
export type {
  LineaVentaExternaInput,
  CrearPedidoVentaExternaInput,
  ConvertirCotizacionInput,
  IniciarAlistamientoInput,
  RegistrarPesajeLineaInput,
  FinalizarAlistamientoInput,
  CrearYDespacharManifiestoInput,
  RegistrarEntregaEnSitioInput,
  LiquidarManifiestoInput,
};

export class B2bIntegrationService {
  constructor(
    private readonly commercialService: B2BCommercialOrderService = b2bCommercialOrderService,
    private readonly wmsService: B2BWmsPreparationService = b2bWmsPreparationService,
    private readonly deliveryService: B2BRouteDeliveryService = b2bRouteDeliveryService
  ) {}

  // -------------------------------------------------------------
  // Fase 1 Comercial (Conversión y Ventas Externas)
  // -------------------------------------------------------------
  async convertirCotizacionAPedido(input: ConvertirCotizacionInput): Promise<Pedido> {
    return this.commercialService.convertirCotizacionAPedido(input);
  }

  async crearPedidoVentaExternaB2B(input: CrearPedidoVentaExternaInput): Promise<Pedido> {
    return this.commercialService.crearPedidoVentaExternaB2B(input);
  }

  // -------------------------------------------------------------
  // Fase 2 WMS (Alistamiento en Bodega y Báscula Catch Weight)
  // -------------------------------------------------------------
  async iniciarAlistamiento(input: IniciarAlistamientoInput): Promise<Pedido> {
    return this.wmsService.iniciarAlistamiento(input);
  }

  async registrarPesajeLinea(input: RegistrarPesajeLineaInput): Promise<Pedido> {
    return this.wmsService.registrarPesajeLinea(input);
  }

  async finalizarAlistamiento(input: FinalizarAlistamientoInput): Promise<Pedido> {
    return this.wmsService.finalizarAlistamiento(input);
  }

  // -------------------------------------------------------------
  // Fase 3 Despacho (Rutas, Entregas en Sitio y Liquidación)
  // -------------------------------------------------------------
  async crearYDespacharManifiesto(
    input: CrearYDespacharManifiestoInput
  ): Promise<{ manifiesto: DeliveryRouteRecord; pedidosDespachados: Pedido[] }> {
    return this.deliveryService.crearYDespacharManifiesto(input);
  }

  async registrarEntregaEnSitio(
    input: RegistrarEntregaEnSitioInput
  ): Promise<{ pedido: Pedido; manifiesto: DeliveryRouteRecord }> {
    return this.deliveryService.registrarEntregaEnSitio(input);
  }

  async liquidarManifiestoRuta(input: LiquidarManifiestoInput): Promise<DeliveryRouteRecord> {
    return this.deliveryService.liquidarManifiestoRuta(input);
  }
}

export const b2bIntegrationService = new B2bIntegrationService();
