/**
 * Contratos de Dominio B2B y Segregación de Interfaces (ISP & DIP)
 * La Pezcaderia ERP - Arquitectura Limpia y Desacoplada
 */

import type { Pedido, LineaPedido, Cotizacion, EstadoPedido } from '../types/orders.types';
import type { Cliente } from '../types/erp.types';
import type { RouteReturnItem, RouteExpense } from '../../packages/validation-schemas/src/deliveryRoute.schema';

// ==========================================
// 1. Interfaces Segregadas por Rol / Dominio (ISP)
// ==========================================

/**
 * Vista / contrato específico para el rol Comercial (Vendedor y Facturación NIIF)
 */
export interface IOrderCommercialView {
  id: string;
  numeroPedido: string;
  fecha: string;
  clienteId: string;
  vendedorId: string;
  vendedorNombre?: string;
  formaPago: 'CONTADO' | 'CREDITO';
  subtotal: number;
  totalFinal: number;
  retefuenteValor?: number;
  reteicaValor?: number;
  ivaValor?: number;
  subtotalNeto?: number;
  estado: EstadoPedido;
}

/**
 * Vista / contrato específico para el rol de Operario de Alistamiento WMS / Báscula Fría
 */
export interface IOrderWmsPreparationView {
  id: string;
  numeroPedido: string;
  estado: EstadoPedido;
  operarioAlistadorId?: string;
  operarioAlistadorNombre?: string;
  horaInicioAlistamiento?: string;
  horaFinAlistamiento?: string;
  remisionId?: string;
  tokenQrRemision?: string;
  precintoCanastilla?: string;
  inventarioDescontado?: boolean;
  lineas: LineaPedido[];
}

/**
 * Vista / contrato específico para el rol de Chofer / Repartidor en Ruta
 */
export interface IOrderDeliveryView {
  id: string;
  numeroPedido: string;
  estado: EstadoPedido;
  conductorRepartidorId?: string;
  conductorRepartidorNombre?: string;
  manifiestoRutaId?: string;
  horaDespachoRuta?: string;
  horaLlegadaCliente?: string;
  horaEntregaEfectiva?: string;
  firmaClienteUrl?: string;
  formaPago: 'CONTADO' | 'CREDITO';
  totalFinal: number;
}

// ==========================================
// 2. Interfaces de Entrada (DTOs de Servicio)
// ==========================================

export interface LineaVentaExternaInput {
  productoId: string;
  sku?: string;
  nombre: string;
  modalidadVenta?: 'PESO_DIRECTO' | 'CATCH_WEIGHT_PIEZAS' | 'UNIDADES_FIJAS';
  cantidadSolicitada: number;
  pesoEstimado?: number;
  precioPactado: number;
  calibreMinGramos?: number;
  calibreMaxGramos?: number;
  corte?: string;
  empaque?: string;
}

export interface CrearPedidoVentaExternaInput {
  vendedorId: string;
  vendedorNombre?: string;
  clienteId: string;
  clienteNombre?: string;
  cliente?: Cliente;
  bodegaId?: string;
  branch_id?: string;
  formaPago: 'CONTADO' | 'CREDITO';
  fechaEntrega: string;
  jornada: 'MANANA' | 'TARDE';
  tipoEntrega?: 'EN_RUTA' | 'RECOGE';
  observaciones?: string;
  verificarCupo?: boolean;
  lineas: LineaVentaExternaInput[];
}

export interface ConvertirCotizacionInput {
  cotizacionId?: string;
  cotizacion?: Cotizacion;
  vendedorId: string;
  vendedorNombre?: string;
  cliente?: Cliente;
  esGranContribuyente?: boolean;
  verificarCupo?: boolean;
  formaPago?: 'CONTADO' | 'CREDITO';
  fechaEntrega?: string;
  jornada?: 'MANANA' | 'TARDE';
  tipoEntrega?: 'EN_RUTA' | 'RECOGE';
  observaciones?: string;
  branch_id?: string;
  bodegaId?: string;
  origen?: 'VISITA' | 'RAPPI' | 'TELEFONO';
}

export interface IniciarAlistamientoInput {
  pedidoId: string;
  operarioId: string;
  operarioNombre?: string;
}

export interface RegistrarPesajeLineaInput {
  pedidoId: string;
  productoId: string;
  pesoRealKg: number;
  piezasAlistadas?: number;
  loteFefo: string;
  temperaturaC?: number;
  toleranciaPorcentaje?: number;
  observaciones?: string;
  forzarAprobacionFueraTolerancia?: boolean;
}

export interface FinalizarAlistamientoInput {
  pedidoId: string;
  precintoCanastilla: string;
  temperaturaSalidaC?: number;
  observaciones?: string;
}

export interface CrearYDespacharManifiestoInput {
  conductorId: string;
  conductorNombre: string;
  conductorTelefono?: string;
  vehiculoPlaca: string;
  vehiculoTipo?: string;
  zonaRuta: string;
  pedidosIds: string[];
  kilometrajeInicial: number;
  temperaturaFurgonCelsius: number;
  observaciones?: string;
}

export interface RegistrarEntregaEnSitioInput {
  pedidoId: string;
  manifiestoId: string;
  firmaClienteUrl: string;
  formaPago: 'CREDITO_B2B' | 'EFECTIVO' | 'TRANSFERENCIA_DIGITAL' | 'MIXTO';
  montoCobradoFinal?: number;
  montoEfectivo?: number;
  montoDigital?: number;
  montoCobradoEfectivo?: number;
  montoCobradoDigital?: number;
  referenciaDigital?: string;
  devoluciones?: Partial<RouteReturnItem>[];
  observaciones?: string;
  horaLlegada?: string;
}

export interface LiquidarManifiestoInput {
  manifiestoId: string;
  kilometrajeFinal?: number;
  odometroFinalKm?: number;
  efectivoFisicoEntregado?: number;
  arqueoEfectivoRecibido?: number;
  temperaturaRetornoCelsius?: number;
  gastos?: RouteExpense[];
  observacionesLiquidacion?: string;
  liquidadoPor?: string;
  cajeroReceptorId?: string;
}

// ==========================================
// 3. Abstracciones de Repositorio & Eventos (DIP)
// ==========================================

export interface IOrderRepository {
  obtenerPedidoPorId(id: string): Promise<Pedido | undefined> | Pedido | undefined;
  obtenerCotizacionPorId(id: string): Promise<Cotizacion | undefined> | Cotizacion | undefined;
  guardarPedido(pedido: Pedido): Promise<void> | void;
  actualizarPedido(id: string, parcial: Partial<Pedido> | Pedido): Promise<void> | void;
  actualizarCotizacion(id: string, parcial: Partial<Cotizacion>): Promise<void> | void;
  obtenerPedidos(): Promise<Pedido[]> | Pedido[];
  obtenerCotizaciones(): Promise<Cotizacion[]> | Cotizacion[];
}

export interface IDomainEventPublisher {
  publicarEvento(
    tipo: string,
    emisor: string,
    mensaje: string,
    metadata: Record<string, unknown>
  ): Promise<void> | void;
}

// ==========================================
// 4. Estrategia de Liquidación de Pagos en Ruta (OCP)
// ==========================================

export interface PaymentSettlementResult {
  montoEfectivo: number;
  montoDigital: number;
  montoCobradoFinal: number;
}

export interface IPaymentSettlementStrategy {
  procesarRecaudo(
    montoOriginal: number,
    input: RegistrarEntregaEnSitioInput
  ): PaymentSettlementResult;
}
