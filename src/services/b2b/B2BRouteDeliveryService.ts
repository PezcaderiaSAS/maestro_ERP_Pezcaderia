import {
  CrearYDespacharManifiestoInput,
  RegistrarEntregaEnSitioInput,
  LiquidarManifiestoInput,
  IOrderRepository,
  IDomainEventPublisher,
} from '../../contracts/b2b.contracts';
import { Pedido } from '../../types/orders.types';
import { deliveryRouteService, DeliveryRouteRecord } from '../deliveryRouteService';
import { RouteReturnItem } from '../../../packages/validation-schemas/src/deliveryRoute.schema';
import { zustandOrderRepository } from './adapters/ZustandOrderRepositoryAdapter';
import { zustandEventPublisher } from './adapters/ZustandEventPublisherAdapter';
import {
  paymentStrategyRegistry,
  PaymentStrategyRegistry,
} from './strategies/PaymentSettlementStrategies';

/**
 * Servicio de Dominio de Rutas, Despacho y Liquidación (Fase 3 Despacho).
 * Cumple con el Principio de Responsabilidad Única (SRP), Inversión de Dependencias (DIP) y Abierto/Cerrado (OCP).
 * Se encarga exclusivamente de:
 * 1. Validar la cadena de frío del termofurgón (<= 4°C frescos o <= -18°C congelados) y despachar manifiestos de ruta.
 * 2. Registrar entregas en sitio con firma digital obligatoria del cliente.
 * 3. Segregar devoluciones y mermas a CUARENTENA_CALIDAD.
 * 4. Procesar el recaudo mediante estrategias polimórficas (OCP).
 * 5. Liquidar manifiestos conciliando odometría, temperatura de retorno y dinero físico con tesorería.
 */
export class B2BRouteDeliveryService {
  constructor(
    private readonly orderRepo: IOrderRepository = zustandOrderRepository,
    private readonly eventPublisher: IDomainEventPublisher = zustandEventPublisher,
    private readonly routeService: typeof deliveryRouteService = deliveryRouteService,
    private readonly strategyRegistry: PaymentStrategyRegistry = paymentStrategyRegistry
  ) {}

  /**
   * Crea y despacha el manifiesto de ruta con check-in del termo-furgón.
   * Transiciona pedidos a EN_RUTA y estampa conductorRepartidorId, conductorRepartidorNombre y rutaId.
   */
  async crearYDespacharManifiesto(
    input: CrearYDespacharManifiestoInput
  ): Promise<{ manifiesto: DeliveryRouteRecord; pedidosDespachados: Pedido[] }> {
    // 1. Validar cadena de frío del furgón (<= 4°C para frescos o <= -18°C para congelados)
    if (input.temperaturaFurgonCelsius > 4) {
      throw new Error(
        `Temperatura del furgón no apta para cadena de frío (${input.temperaturaFurgonCelsius}°C > 4°C)`
      );
    }

    // 2. Validar que los pedidos existan y estén en estado LISTO
    const pedidosSeleccionados: Pedido[] = [];
    for (const pId of input.pedidosIds) {
      const p = await this.orderRepo.obtenerPedidoPorId(pId);
      if (!p) {
        throw new Error(`Pedido no encontrado: ${pId}`);
      }
      if (p.estado !== 'LISTO') {
        throw new Error(
          `Todos los pedidos deben estar en estado LISTO con alistamiento completado para ser despachados. Pedido ${p.numeroPedido} está en estado: ${p.estado}`
        );
      }
      pedidosSeleccionados.push(p);
    }

    // 3. Crear manifiesto en deliveryRouteService
    const pedidosDetalle = pedidosSeleccionados.map(p => ({
      id: p.id,
      numeroPedido: p.numeroPedido,
      clienteId: p.clienteId,
      clienteNombre: 'Cliente B2B',
      clienteDireccion: 'Dirección de Entrega',
      totalNeto: p.totalFinal,
      subtotal: p.subtotal,
      formaPago: p.formaPago,
      items: p.lineas.map(l => ({
        sku: l.sku || '',
        nombre: l.nombre || 'Producto pesquero',
        cantidad: l.pesoReal || l.cantidadAlistada || l.cantidadSolicitada,
        precioUnitario: l.precioPactado,
      })),
      fechaCreacion: p.fecha,
      fechaEntrega: p.fechaEntrega,
      jornada: p.jornada,
    }));

    const createResult = this.routeService.crearManifiestoRuta(
      {
        conductorId: input.conductorId,
        conductorNombre: input.conductorNombre,
        conductorTelefono: input.conductorTelefono,
        vehiculoPlaca: input.vehiculoPlaca,
        vehiculoTipo: input.vehiculoTipo || 'Furgón Refrigerado',
        zonaRuta: input.zonaRuta,
        pedidosIds: input.pedidosIds,
        kilometrajeInicial: input.kilometrajeInicial,
        temperaturaSalidaCelsius: input.temperaturaFurgonCelsius,
        observaciones: input.observaciones,
      },
      pedidosDetalle
    );

    if (!createResult.success || !createResult.data) {
      throw new Error(createResult.error || 'Error al crear manifiesto de ruta');
    }

    const manifiesto = createResult.data;

    // 4. Confirmar check-in de carga en furgón e iniciar ruta
    this.routeService.confirmarCheckinCarga({
      manifiestoId: manifiesto.id,
      pedidosConfirmados: input.pedidosIds,
      temperaturaSalidaCelsius: input.temperaturaFurgonCelsius,
      observacionesCarga: 'Carga verificada y cadena de frío conforme',
    });

    this.routeService.iniciarRuta(manifiesto.id);
    manifiesto.estado = 'EN_RUTA';

    // 5. Transicionar pedidos a EN_RUTA y estampar conductor y ruta
    const pedidosDespachados: Pedido[] = [];
    for (const p of pedidosSeleccionados) {
      const pDespachado: Pedido = {
        ...p,
        estado: 'EN_RUTA',
        conductorRepartidorId: input.conductorId,
        conductorRepartidorNombre: input.conductorNombre,
        manifiestoRutaId: manifiesto.id,
        rutaId: manifiesto.id,
      };

      await this.orderRepo.actualizarPedido(p.id, pDespachado);
      pedidosDespachados.push(pDespachado);
    }

    // 6. Publicar evento de dominio desacoplado
    await this.eventPublisher.publicarEvento(
      'QUOTE_STATUS_CHANGED',
      input.conductorNombre,
      `Manifiesto ${manifiesto.numeroManifiesto} despachado en ruta con ${pedidosDespachados.length} pedidos. Vehículo ${input.vehiculoPlaca} a ${input.temperaturaFurgonCelsius}°C`,
      {
        evento: 'b2b_pedidos_despachados_en_ruta',
        manifiestoId: manifiesto.id,
        numeroManifiesto: manifiesto.numeroManifiesto,
        conductorId: input.conductorId,
        conductorNombre: input.conductorNombre,
        vehiculoPlaca: input.vehiculoPlaca,
        temperaturaFurgon: input.temperaturaFurgonCelsius,
        pedidosCount: pedidosDespachados.length,
      }
    );

    return { manifiesto, pedidosDespachados };
  }

  /**
   * Registra la entrega en sitio por el repartidor con firma digital.
   * Procesa devoluciones segregándolas a CUARENTENA_CALIDAD y ejecuta la estrategia de recaudo OCP.
   */
  async registrarEntregaEnSitio(
    input: RegistrarEntregaEnSitioInput
  ): Promise<{ pedido: Pedido; manifiesto: DeliveryRouteRecord }> {
    if (!input.firmaClienteUrl || input.firmaClienteUrl.trim() === '') {
      throw new Error('La firma digital del cliente es obligatoria para certificar la entrega');
    }

    const pedido = await this.orderRepo.obtenerPedidoPorId(input.pedidoId);
    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    const devolucionesMapeadas: RouteReturnItem[] = (input.devoluciones || []).map(d => {
      const lineaCorrespondiente = pedido.lineas.find(l => l.productoId === d.productoId);
      const cantKg = (d as any).cantidadDevueltaKg ?? (d as any).cantidadDevuelta ?? 0;
      const precioUnit = d.precioUnitario || lineaCorrespondiente?.precioPactado || 0;
      const montoDesc = d.montoDescontado !== undefined ? d.montoDescontado : Math.round(cantKg * precioUnit);

      return {
        productoId: d.productoId || lineaCorrespondiente?.productoId || 'PROD-DEV',
        sku: d.sku || lineaCorrespondiente?.sku || 'SKU-GEN',
        nombre: d.nombre || (d as any).nombreProducto || lineaCorrespondiente?.nombre || 'Producto pesquero',
        cantidadDevueltaKg: cantKg,
        precioUnitario: precioUnit,
        montoDescontado: montoDesc,
        motivoRechazo: (d.motivoRechazo as any) || 'CADENA_FRIO',
        destinoBodega: (d.destinoBodega as any) || 'CUARENTENA_CALIDAD',
        observaciones: d.observaciones,
      };
    });

    const totalDevuelto = devolucionesMapeadas.reduce((acc, d) => acc + d.montoDescontado, 0);
    const montoCalculado = Math.max(0, pedido.totalFinal - totalDevuelto);

    // Ejecutar Estrategia Polimórfica de Pago (OCP)
    const estrategiaPago = this.strategyRegistry.obtener(input.formaPago);
    const resultadoRecaudo = estrategiaPago.procesarRecaudo(montoCalculado, input);

    const ahora = new Date().toISOString();
    let notasEntrega = pedido.observaciones || '';
    if (devolucionesMapeadas.length > 0) {
      const motivos = devolucionesMapeadas
        .map(
          d => `${d.nombre || (d as any).nombreProducto}: ${d.cantidadDevueltaKg}kg (${d.motivoRechazo} -> ${d.destinoBodega})`
        )
        .join('; ');
      notasEntrega = `[DEVOLUCIONES REGISTRADAS: ${motivos}] ${notasEntrega}`.trim();
    }

    // Registrar en deliveryRouteService
    const resEntrega = this.routeService.registrarEntregaPedido({
      manifiestoId: input.manifiestoId,
      pedidoId: pedido.id,
      estadoEntrega: devolucionesMapeadas.length > 0 ? 'ENTREGADO_PARCIAL' : 'ENTREGADO_TOTAL',
      formaPago: input.formaPago,
      montoOriginal: pedido.totalFinal,
      montoCobradoFinal: resultadoRecaudo.montoCobradoFinal,
      montoEfectivo: resultadoRecaudo.montoEfectivo,
      montoDigital: resultadoRecaudo.montoDigital,
      referenciaDigital: input.referenciaDigital,
      firmaClienteUrl: input.firmaClienteUrl,
      devoluciones: devolucionesMapeadas,
      novedadObservaciones: input.observaciones,
    });

    if (!resEntrega.success) {
      throw new Error(resEntrega.error || 'Error al registrar entrega en deliveryRouteService');
    }

    const manifiestoActualizado = this.routeService
      .obtenerManifiestos()
      .find(m => m.id === input.manifiestoId);
    if (!manifiestoActualizado) {
      throw new Error('Manifiesto no encontrado');
    }

    const pedidoEntregado: Pedido = {
      ...pedido,
      estado: 'ENTREGADO',
      firmaClienteUrl: input.firmaClienteUrl,
      horaEntregaEfectiva: ahora,
      horaLlegadaCliente: input.horaLlegada || ahora,
      observaciones: notasEntrega,
    };

    await this.orderRepo.actualizarPedido(pedido.id, pedidoEntregado);

    await this.eventPublisher.publicarEvento(
      'QUOTE_STATUS_CHANGED',
      pedido.conductorRepartidorNombre || 'Conductor Repartidor',
      `Pedido ${pedido.numeroPedido} entregado en sitio con firma digital (${
        devolucionesMapeadas.length > 0 ? 'Entrega Parcial' : 'Entrega Total'
      }). Recaudo: $${resultadoRecaudo.montoCobradoFinal.toLocaleString()} COP`,
      {
        evento: 'b2b_entrega_en_sitio_registrada',
        pedidoId: pedido.id,
        manifiestoId: input.manifiestoId,
        montoCobrado: resultadoRecaudo.montoCobradoFinal,
        devolucionesCount: devolucionesMapeadas.length,
        totalDevueltoMonto: totalDevuelto,
      }
    );

    return { pedido: pedidoEntregado, manifiesto: manifiestoActualizado };
  }

  /**
   * Cierre y liquidación final del manifiesto de ruta.
   * Concilia odometría, temperatura de retorno y dinero recaudado con tesorería.
   */
  async liquidarManifiestoRuta(input: LiquidarManifiestoInput): Promise<DeliveryRouteRecord> {
    const kmFinal = input.kilometrajeFinal ?? input.odometroFinalKm ?? 0;
    const efectivoEntregado = input.efectivoFisicoEntregado ?? input.arqueoEfectivoRecibido ?? 0;
    const liquidador = input.liquidadoPor || input.cajeroReceptorId || 'Tesorería';

    // 1. Finalizar recorrido del chofer con kilometraje final
    const finRecorrido = this.routeService.finalizarRecorridoChofer({
      manifiestoId: input.manifiestoId,
      kilometrajeFinal: kmFinal,
      temperaturaRetornoCelsius: input.temperaturaRetornoCelsius,
      observacionesRetorno: input.observacionesLiquidacion,
    });

    if (!finRecorrido.success) {
      throw new Error(finRecorrido.error || 'Error al finalizar recorrido del chofer');
    }

    // 2. Liquidar ruta y conciliar recaudos contra tesorería
    const liquidacionRes = await this.routeService.liquidarRutaTransportador({
      manifiestoId: input.manifiestoId,
      efectivoFisicoEntregado: efectivoEntregado,
      gastos: input.gastos || [],
      observacionesLiquidacion: input.observacionesLiquidacion,
      liquidadoPor: liquidador,
    });

    if (!liquidacionRes.success || !liquidacionRes.data) {
      throw new Error(liquidacionRes.error || 'Error al liquidar ruta en tesorería');
    }

    const manifiestoLiquidado = liquidacionRes.data;

    // 3. Emitir evento de liquidación de ruta
    await this.eventPublisher.publicarEvento(
      'QUOTE_STATUS_CHANGED',
      liquidador,
      `Manifiesto ${manifiestoLiquidado.numeroManifiesto} liquidado. Efectivo entregado: $${efectivoEntregado.toLocaleString()} COP (Diferencia: $${
        manifiestoLiquidado.diferenciaCuadre
      } COP)`,
      {
        evento: 'b2b_ruta_liquidada',
        manifiestoId: manifiestoLiquidado.id,
        numeroManifiesto: manifiestoLiquidado.numeroManifiesto,
        efectivoEntregado,
        diferenciaCuadre: manifiestoLiquidado.diferenciaCuadre,
        totalGastos: manifiestoLiquidado.totalGastosRuta,
        kilometrajeFinal: kmFinal,
      }
    );

    return manifiestoLiquidado;
  }
}

export const b2bRouteDeliveryService = new B2BRouteDeliveryService();
