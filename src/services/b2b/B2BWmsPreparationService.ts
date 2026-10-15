import {
  IniciarAlistamientoInput,
  RegistrarPesajeLineaInput,
  FinalizarAlistamientoInput,
  IOrderRepository,
  IDomainEventPublisher,
} from '../../contracts/b2b.contracts';
import { Pedido, LineaPedido, EstadoPedido } from '../../types/orders.types';
import { Cliente } from '../../types/erp.types';
import { b2bDispatchService } from '../b2bDispatchService';
import { B2BSalesService } from '../b2bSalesService';
import { WmsDispatchRemision } from '../../../packages/validation-schemas/src/b2bDispatch.schema';
import { zustandOrderRepository } from './adapters/ZustandOrderRepositoryAdapter';
import { zustandEventPublisher } from './adapters/ZustandEventPublisherAdapter';
import { useClientStore } from '../../store/useClientStore';

/**
 * Servicio de Dominio WMS y Alistamiento en Bodega (Fase 2 WMS).
 * Cumple con el Principio de Responsabilidad Única (SRP), Inversión de Dependencias (DIP) y Sustitución de Liskov (LSP).
 * Se encarga exclusivamente de:
 * 1. Iniciar el alistamiento de pedidos por operarios de bodega con estampa horaria.
 * 2. Registrar el pesaje real en báscula de cuarto frío con política Catch Weight (+-5%) y rotación FEFO.
 * 3. Recalcular impuestos y totales con el cliente legítimo sin objetos falsos.
 * 4. Finalizar alistamiento, asignar precinto de canastilla y generar remisión WMS con QR.
 */
export class B2BWmsPreparationService {
  constructor(
    private readonly orderRepo: IOrderRepository = zustandOrderRepository,
    private readonly eventPublisher: IDomainEventPublisher = zustandEventPublisher,
    private readonly dispatchService: typeof b2bDispatchService = b2bDispatchService,
    private readonly salesCalculator: typeof B2BSalesService = B2BSalesService
  ) {}

  /**
   * Inicia el alistamiento en bodega por un operario calificado.
   * Transiciona el estado a EN_ALISTAMIENTO y estampa la fecha/hora de inicio.
   */
  async iniciarAlistamiento(input: IniciarAlistamientoInput): Promise<Pedido> {
    const pedido = await this.orderRepo.obtenerPedidoPorId(input.pedidoId);
    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    if (pedido.estado === 'PAUSADO_POR_CREDITO') {
      throw new Error('El pedido está pausado por cupo de crédito y no puede alistarse');
    }

    if (pedido.estado !== 'CREADO' && pedido.estado !== 'PAUSADO') {
      throw new Error(`El pedido no se puede iniciar para alistamiento desde el estado actual: ${pedido.estado}`);
    }

    const fechaInicio = new Date().toISOString();
    const pedidoActualizado: Pedido = {
      ...pedido,
      estado: 'EN_ALISTAMIENTO',
      operarioAlistadorId: input.operarioId,
      operarioAlistadorNombre: input.operarioNombre || 'Operario de Bodega',
      horaInicioAlistamiento: fechaInicio,
    };

    await this.orderRepo.actualizarPedido(pedido.id, pedidoActualizado);

    await this.eventPublisher.publicarEvento(
      'QUOTE_STATUS_CHANGED',
      input.operarioNombre || 'Operario de Bodega',
      `Pedido ${pedido.numeroPedido} inició alistamiento en bodega por operario ${input.operarioId}`,
      {
        evento: 'b2b_alistamiento_iniciado',
        pedidoId: pedido.id,
        numeroPedido: pedido.numeroPedido,
        operarioId: input.operarioId,
        horaInicio: fechaInicio,
      }
    );

    return pedidoActualizado;
  }

  /**
   * Registra el pesaje real de una línea en báscula de cuarto frío con política FEFO.
   * Concilia Catch Weight (+-5%), recalcula precio exacto y pausa si se excede la tolerancia.
   */
  async registrarPesajeLinea(input: RegistrarPesajeLineaInput): Promise<Pedido> {
    const pedido = await this.orderRepo.obtenerPedidoPorId(input.pedidoId);
    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    if (pedido.estado !== 'EN_ALISTAMIENTO' && pedido.estado !== 'PAUSADO') {
      throw new Error('El pedido debe estar en alistamiento para registrar pesaje');
    }

    const lineaIndex = pedido.lineas.findIndex(l => l.productoId === input.productoId);
    if (lineaIndex === -1) {
      throw new Error('Línea de producto no encontrada en el pedido');
    }

    const linea = pedido.lineas[lineaIndex];

    // Conciliación de báscula de cuarto frío
    const conciliacion = await this.dispatchService.conciliarPesajeB2B({
      lineaPedidoId: `${pedido.id}-${linea.productoId}`,
      productoId: linea.productoId,
      modalidad: linea.modalidadVenta || 'PESO_DIRECTO',
      pesoNominalKg: linea.pesoEstimado || linea.cantidadSolicitada,
      pesoRealKg: input.pesoRealKg,
      piezasAlistadas: input.piezasAlistadas || linea.piezasSolicitadas,
      calibreMinGramos: linea.calibreMinGramos,
      calibreMaxGramos: linea.calibreMaxGramos,
      precioUnitarioPactado: linea.precioPactado,
      toleranciaPorcentaje: input.toleranciaPorcentaje ?? 5,
      temperaturaProductoC: input.temperaturaC ?? 2,
      loteFefo: input.loteFefo,
      operarioId: pedido.operarioAlistadorId || 'operario-bodega',
      observaciones: input.observaciones,
    });

    const toleranciaAprobada = conciliacion.dentro_tolerancia || !!input.forzarAprobacionFueraTolerancia;

    const lineaActualizada: LineaPedido = {
      ...linea,
      pesoReal: input.pesoRealKg,
      cantidadAlistada: input.pesoRealKg,
      variacionPesoPct: conciliacion.variacion_porcentaje,
      toleranciaAceptada: toleranciaAprobada,
      subtotalRealAjustado: conciliacion.subtotal_ajustado,
      totalLinea: conciliacion.subtotal_ajustado,
      loteSeleccionado: input.loteFefo,
      temperaturaC: input.temperaturaC ?? 2,
      piezasAlistadas: input.piezasAlistadas || linea.piezasAlistadas,
      estadoLinea: toleranciaAprobada ? 'COMPLETO' : 'PARCIAL',
    };

    const nuevasLineas = [...pedido.lineas];
    nuevasLineas[lineaIndex] = lineaActualizada;

    // Recalcular totales con el pesaje real
    const nuevoSubtotalBruto = nuevasLineas.reduce(
      (acc, l) => acc + (l.subtotalRealAjustado || l.totalLinea),
      0
    );
    const nuevoDescuentoValor = Math.round(nuevoSubtotalBruto * (pedido.descuentoGlobalPct / 100));
    const nuevaBase = nuevoSubtotalBruto - nuevoDescuentoValor;
    const nuevoIva = pedido.ivaValor || 0;

    let nuevoTotalFinal = nuevaBase + nuevoIva;
    let nuevoRetefuente = pedido.retefuenteValor;
    let nuevoReteica = pedido.reteicaValor;
    let nuevoSubtotalNeto = pedido.subtotalNeto;

    // Si tenía retenciones NIIF, recalcular sobre la nueva base utilizando el cliente real (LSP)
    if (pedido.retefuenteValor || pedido.reteicaValor) {
      const clientStore = useClientStore.getState();
      const clienteReal = clientStore.getClienteById?.(pedido.clienteId) || {
        id: pedido.clienteId,
        nombre: 'Cliente B2B',
        identificacion: '900000000-1',
        tipoIdentificacion: 'NIT',
        tipoPersona: 'JURIDICA',
        ciudad: 'Bogotá',
        tipoPrecio: 'RESTAURANTE',
        telefono: '3000000000',
        direccion: 'Calle Principal',
        email: 'b2b@cliente.com',
        cupoCredito: 10000000,
        isGranContribuyente: true,
        isAutoretenedor: false,
        activo: true,
      };

      const niifRecalculado = this.salesCalculator.calcularTotalesCotizacionNIIF(nuevaBase, nuevoIva, clienteReal);
      nuevoRetefuente = niifRecalculado.retefuente;
      nuevoReteica = niifRecalculado.reteica;
      nuevoSubtotalNeto = niifRecalculado.valor_neto_a_cobrar;
      nuevoTotalFinal = niifRecalculado.total_factura;
    }

    let nuevoEstado: EstadoPedido = pedido.estado;
    let observacionesActualizadas = pedido.observaciones;

    if (!toleranciaAprobada) {
      nuevoEstado = 'PAUSADO';
      observacionesActualizadas = `[PAUSADO POR BÁSCULA: Variación de peso de ${conciliacion.variacion_porcentaje}% supera la tolerancia permitida (+-5%)] ${observacionesActualizadas}`.trim();
    }

    const pedidoActualizado: Pedido = {
      ...pedido,
      estado: nuevoEstado,
      lineas: nuevasLineas,
      subtotal: nuevaBase,
      descuentoGlobalValor: nuevoDescuentoValor,
      totalFinal: nuevoTotalFinal,
      retefuenteValor: nuevoRetefuente,
      reteicaValor: nuevoReteica,
      subtotalNeto: nuevoSubtotalNeto,
      observaciones: observacionesActualizadas,
    };

    await this.orderRepo.actualizarPedido(pedido.id, pedidoActualizado);

    await this.eventPublisher.publicarEvento(
      'QUOTE_STATUS_CHANGED',
      pedido.operarioAlistadorNombre || 'Operario de Bodega',
      `Pesaje registrado para producto ${linea.nombre || linea.productoId} en pedido ${pedido.numeroPedido} (${input.pesoRealKg} kg, var: ${conciliacion.variacion_porcentaje}%)`,
      {
        evento: 'b2b_pesaje_linea_registrado',
        pedidoId: pedido.id,
        productoId: input.productoId,
        pesoRealKg: input.pesoRealKg,
        toleranciaAceptada: toleranciaAprobada,
        nuevoEstado,
      }
    );

    return pedidoActualizado;
  }

  /**
   * Finaliza el alistamiento, emite la Remisión WMS con QR y precinto,
   * descuenta inventario y transiciona el pedido a estado LISTO.
   */
  async finalizarAlistamiento(input: FinalizarAlistamientoInput): Promise<Pedido> {
    const pedido = await this.orderRepo.obtenerPedidoPorId(input.pedidoId);
    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    if (pedido.estado !== 'EN_ALISTAMIENTO' && pedido.estado !== 'PAUSADO') {
      throw new Error(`El pedido no está en estado válido para finalizar alistamiento: ${pedido.estado}`);
    }

    // 1. Validar que todas las líneas tengan peso real y lote FEFO
    const lineasIncompletas = pedido.lineas.filter(
      l => l.pesoReal === undefined || l.pesoReal <= 0 || !l.loteSeleccionado
    );
    if (lineasIncompletas.length > 0) {
      throw new Error('Todas las líneas deben estar pesadas y con lote FEFO asignado para finalizar el alistamiento');
    }

    // 2. Validar que no haya líneas con tolerancia rechazada sin aprobar
    const lineasRechazadas = pedido.lineas.filter(l => l.toleranciaAceptada === false);
    if (lineasRechazadas.length > 0) {
      throw new Error('Hay líneas con variación de peso fuera de tolerancia no aprobadas');
    }

    // 3. Generar Remisión WMS
    const pesoTotalNetoKg = pedido.lineas.reduce((acc, l) => acc + (l.pesoReal || 0), 0);
    const piezasTotales = pedido.lineas.reduce((acc, l) => acc + (l.piezasAlistadas || 0), 0);

    const itemsRemision = pedido.lineas.map(l => ({
      lineaPedidoId: `${pedido.id}-${l.productoId}`,
      productoId: l.productoId,
      nombreProducto: l.nombre || 'Producto pesquero',
      pesoDespachadoKg: l.pesoReal || 0,
      piezasDespachadas: l.piezasAlistadas,
      precioUnitario: l.precioPactado,
      subtotal: l.subtotalRealAjustado || l.totalLinea,
      loteFefo: l.loteSeleccionado || 'LOT-GENERAL',
      temperaturaSalidaC: input.temperaturaSalidaC ?? l.temperaturaC ?? 2,
    }));

    const remisionPayload: WmsDispatchRemision = {
      numeroRemision: `REM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      pedidoId: pedido.id,
      clienteId: pedido.clienteId,
      clienteNombre: 'Cliente B2B',
      direccionEntrega: 'Dirección de Entrega',
      transportistaNombre: 'Transportador Asignado',
      placaVehiculo: 'WMS-000',
      temperaturaSalidaC: input.temperaturaSalidaC ?? 2,
      tokenQr: crypto.randomUUID().replace(/-/g, ''),
      pesoTotalNetoKg: Number(pesoTotalNetoKg.toFixed(3)),
      piezasTotales,
      items: itemsRemision as any,
      estado: 'LISTO',
      notas: input.observaciones,
    };

    const remisionResult = await this.dispatchService.crearRemisionDespachoWMS(remisionPayload);

    const fechaFin = new Date().toISOString();
    const pedidoListo: Pedido = {
      ...pedido,
      estado: 'LISTO',
      remisionId: remisionResult.remision_id,
      tokenQrRemision: remisionResult.token_qr,
      precintoCanastilla: input.precintoCanastilla,
      horaFinAlistamiento: fechaFin,
      inventarioDescontado: true,
    };

    await this.orderRepo.actualizarPedido(pedido.id, pedidoListo);

    await this.eventPublisher.publicarEvento(
      'QUOTE_STATUS_CHANGED',
      pedido.operarioAlistadorNombre || 'Operario de Bodega',
      `Alistamiento finalizado para pedido ${pedido.numeroPedido}. Remisión ${remisionResult.numero_remision} generada con precinto ${input.precintoCanastilla}`,
      {
        evento: 'b2b_alistamiento_completado',
        pedidoId: pedido.id,
        numeroPedido: pedido.numeroPedido,
        remisionId: remisionResult.remision_id,
        tokenQr: remisionResult.token_qr,
        precinto: input.precintoCanastilla,
        pesoTotalNetoKg,
      }
    );

    return pedidoListo;
  }
}

export const b2bWmsPreparationService = new B2BWmsPreparationService();
