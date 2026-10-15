import { Pedido, LineaPedido, Cotizacion, EstadoPedido } from '../types/orders.types';
import { Cliente } from '../types/erp.types';
import { B2BSalesService } from './b2bSalesService';
import { useOrderStore } from '../store/useOrderStore';
import { useEventStore } from '../store/useEventStore';
import { b2bDispatchService } from './b2bDispatchService';
import { WmsDispatchRemision } from '../../packages/validation-schemas/src/b2bDispatch.schema';
import { deliveryRouteService, DeliveryRouteRecord } from './deliveryRouteService';
import { RouteReturnItem, RouteExpense } from '../../packages/validation-schemas/src/deliveryRoute.schema';

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

export class B2bIntegrationService {
  /**
   * Fase 1 Comercial: Convierte una cotización formalizada en un pedido B2B activo.
   * Valida cupo de crédito, liquida retenciones NIIF y estampa la identidad del vendedor.
   */
  async convertirCotizacionAPedido(input: ConvertirCotizacionInput): Promise<Pedido> {
    const { quotations, addVenta, updateQuotation } = useOrderStore.getState();
    const { publishEvent } = useEventStore.getState();

    // 1. Obtener y validar cotización origen
    let cotizacion = input.cotizacion;
    if (!cotizacion && input.cotizacionId) {
      cotizacion = quotations.find(q => q.id === input.cotizacionId);
    }

    if (!cotizacion) {
      throw new Error('Cotización no encontrada');
    }

    if (cotizacion.estado === 'CONVERTIDA_A_PEDIDO') {
      throw new Error('La cotización ya fue convertida a pedido previamente');
    }

    const itemsOrigen = cotizacion.lineas || cotizacion.items || [];
    if (!itemsOrigen || itemsOrigen.length === 0) {
      throw new Error('La cotización no contiene productos para generar el pedido');
    }

    // 2. Mapear líneas de pedido con contratos B2B
    const lineas: LineaPedido[] = itemsOrigen.map((item: any) => {
      const cantidad = item.cantidadSolicitada || item.cantidad || item.peso || 1;
      const precio = item.precioPactado || item.precio || item.precioUnitario || 0;
      const total = item.totalLinea || item.total || (cantidad * precio);
      const unidad = item.unidadMedida || item.unidad || 'kg';

      return {
        productoId: item.productoId || item.id,
        sku: item.sku || '',
        nombre: item.nombre || item.producto || item.descripcion || 'Producto del mar',
        cantidadSolicitada: cantidad,
        cantidadAlistada: 0,
        cantidadDespachada: 0,
        estadoLinea: 'PENDIENTE',
        pesoEstimado: item.pesoEstimado || (unidad === 'kg' ? cantidad : undefined),
        precioPactado: precio,
        totalLinea: total,
        unidadMedida: unidad,
        modalidadVenta: item.modalidadVenta || 'PESO_DIRECTO',
        piezasSolicitadas: item.piezasSolicitadas || item.piezas,
        calibreMinGramos: item.calibreMinGramos,
        calibreMaxGramos: item.calibreMaxGramos,
        corte: item.corte,
        empaque: item.empaque,
      };
    });

    // 3. Cálculos comerciales y retenciones NIIF
    const subtotalBruto = lineas.reduce((acc, l) => acc + l.totalLinea, 0);
    const descuentoPct = cotizacion.descuentoGlobalPct || 0;
    const descuentoValor = cotizacion.descuentoGlobalValor || (subtotalBruto * (descuentoPct / 100));
    const baseSinIva = subtotalBruto - descuentoValor;
    const totalIva = cotizacion.ivaValor || 0;

    const clienteObj: Partial<Cliente> = input.cliente || {
      id: cotizacion.clienteId,
      nombre: cotizacion.clienteNombre || 'Cliente B2B',
      isGranContribuyente: input.esGranContribuyente ?? false,
      isAutoretenedor: false,
    };

    const niif = B2BSalesService.calcularTotalesCotizacionNIIF(baseSinIva, totalIva, clienteObj);

    // 4. Verificación de Cupo de Crédito
    const formaPago = input.formaPago || (cotizacion.formaPago as any) || 'CONTADO';
    let estadoInicial: EstadoPedido = 'CREADO';
    let notasAdicionales = input.observaciones || cotizacion.observaciones || '';

    if (formaPago === 'CREDITO') {
      if (input.verificarCupo !== false && input.cliente) {
        const cupoCheck = B2BSalesService.verificarCupoCredito(input.cliente, niif.total_factura);
        if (!cupoCheck.aprobado) {
          estadoInicial = 'PAUSADO_POR_CREDITO';
          notasAdicionales = `[PAUSADO POR CUPO DE CRÉDITO: ${cupoCheck.mensaje}] ${notasAdicionales}`.trim();
        }
      }
    }

    // 5. Construcción del Pedido con Trazabilidad Tripartita
    const fechaActual = new Date().toISOString();
    const numeroConsecutivo = Math.floor(100000 + Math.random() * 900000);

    const nuevoPedido: Pedido = {
      id: crypto.randomUUID(),
      numeroPedido: `PED-B2B-${numeroConsecutivo}`,
      fecha: fechaActual,
      origen: input.origen || 'VISITA',
      clienteId: input.cliente?.id || cotizacion.clienteId || 'cli-b2b-anonimo',
      bodegaId: input.bodegaId || 'BOD-01',
      branch_id: input.branch_id || '00000000-0000-0000-0000-000000000001',
      vendedorId: input.vendedorId,
      vendedorNombre: input.vendedorNombre || 'Vendedor Comercial',
      cotizacionIdOriginal: cotizacion.id,
      formaPago,
      tipoEntrega: input.tipoEntrega || 'EN_RUTA',
      fechaEntrega: input.fechaEntrega || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      jornada: input.jornada || 'MANANA',
      estado: estadoInicial,
      observaciones: notasAdicionales,
      lineas,
      subtotal: baseSinIva,
      descuentoGlobalPct: descuentoPct,
      descuentoGlobalValor: descuentoValor,
      totalFinal: niif.total_factura,
      retefuenteValor: niif.retefuente,
      reteicaValor: niif.reteica,
      ivaValor: totalIva,
      subtotalNeto: niif.valor_neto_a_cobrar,
      idempotencyKey: `idemp-b2b-${cotizacion.id}-${Date.now()}`,
      rutaId: null,
      facturacionElectronica: false,
      idSiigo: null,
      inventarioDescontado: false,
    };

    // 6. Persistencia y Actualización de Estados
    try {
      addVenta(nuevoPedido);
    } catch {
      useOrderStore.setState(state => ({ ventas: [...state.ventas, nuevoPedido] }));
    }

    try {
      updateQuotation(cotizacion.id, {
        estado: 'CONVERTIDA_A_PEDIDO',
        vendedorId: input.vendedorId,
        vendedorNombre: input.vendedorNombre || 'Vendedor Comercial',
        fechaActualizacion: fechaActual,
      });
    } catch {
      useOrderStore.setState(state => ({
        quotations: state.quotations.map(q =>
          q.id === cotizacion!.id
            ? {
                ...q,
                estado: 'CONVERTIDA_A_PEDIDO',
                vendedorId: input.vendedorId,
                vendedorNombre: input.vendedorNombre || 'Vendedor Comercial',
                fechaActualizacion: fechaActual,
              }
            : q
        ),
      }));
    }

    // 7. Registro de Evento de Dominio
    publishEvent(
      'QUOTE_STATUS_CHANGED',
      input.vendedorNombre || 'Vendedor Comercial',
      `Cotización ${cotizacion.id} convertida a pedido ${nuevoPedido.numeroPedido} por vendedor ${input.vendedorId}`,
      {
        evento: 'b2b_pedido_creado_desde_cotizacion',
        cotizacionId: cotizacion.id,
        pedidoId: nuevoPedido.id,
        numeroPedido: nuevoPedido.numeroPedido,
        vendedorId: input.vendedorId,
        formaPago: nuevoPedido.formaPago,
        estadoInicial: nuevoPedido.estado,
        totalFinal: nuevoPedido.totalFinal,
        subtotalNeto: nuevoPedido.subtotalNeto,
        esGranContribuyente: !!(input.cliente?.isGranContribuyente ?? input.esGranContribuyente),
      }
    );

    return nuevoPedido;
  }

  /**
   * Fase 2 WMS: Inicia el alistamiento en bodega por un operario calificado.
   * Transiciona el estado a EN_ALISTAMIENTO y estampa la fecha/hora de inicio.
   */
  async iniciarAlistamiento(input: IniciarAlistamientoInput): Promise<Pedido> {
    const { ventas, updateVenta } = useOrderStore.getState();
    const { publishEvent } = useEventStore.getState();

    const pedido = ventas.find(v => v.id === input.pedidoId);
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

    try {
      updateVenta(pedido.id, pedidoActualizado);
    } catch {
      useOrderStore.setState(state => ({
        ventas: state.ventas.map(v => (v.id === pedido.id ? pedidoActualizado : v)),
      }));
    }

    publishEvent(
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
   * Fase 2 WMS: Registra el pesaje real de una línea en báscula de cuarto frío con política FEFO.
   * Concilia Catch Weight (+-5%), recalcula precio exacto y pausa si se excede la tolerancia.
   */
  async registrarPesajeLinea(input: RegistrarPesajeLineaInput): Promise<Pedido> {
    const { ventas, updateVenta } = useOrderStore.getState();
    const { publishEvent } = useEventStore.getState();

    const pedido = ventas.find(v => v.id === input.pedidoId);
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
    const conciliacion = await b2bDispatchService.conciliarPesajeB2B({
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

    // Si tenía retenciones NIIF, recalcular sobre la nueva base
    if (pedido.retefuenteValor || pedido.reteicaValor) {
      const clienteDummy: Cliente = {
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
        activo: true,
      };
      const niifRecalculado = B2BSalesService.calcularTotalesCotizacionNIIF(nuevaBase, nuevoIva, clienteDummy);
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

    try {
      updateVenta(pedido.id, pedidoActualizado);
    } catch {
      useOrderStore.setState(state => ({
        ventas: state.ventas.map(v => (v.id === pedido.id ? pedidoActualizado : v)),
      }));
    }

    publishEvent(
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
   * Fase 2 WMS: Finaliza el alistamiento, emite la Remisión WMS con QR y precinto,
   * descuenta inventario y transiciona el pedido a estado LISTO.
   */
  async finalizarAlistamiento(input: FinalizarAlistamientoInput): Promise<Pedido> {
    const { ventas, updateVenta } = useOrderStore.getState();
    const { publishEvent } = useEventStore.getState();

    const pedido = ventas.find(v => v.id === input.pedidoId);
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

    const remisionResult = await b2bDispatchService.crearRemisionDespachoWMS(remisionPayload);

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

    try {
      updateVenta(pedido.id, pedidoListo);
    } catch {
      useOrderStore.setState(state => ({
        ventas: state.ventas.map(v => (v.id === pedido.id ? pedidoListo : v)),
      }));
    }

    publishEvent(
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

  /**
   * Fase 3 Despacho: Crea y despacha el manifiesto de ruta con check-in del termo-furgón.
   * Transiciona pedidos a EN_RUTA y estampa conductorRepartidorId, conductorRepartidorNombre y rutaId.
   */
  async crearYDespacharManifiesto(
    input: CrearYDespacharManifiestoInput
  ): Promise<{ manifiesto: DeliveryRouteRecord; pedidosDespachados: Pedido[] }> {
    const { ventas, updateVenta } = useOrderStore.getState();
    const { publishEvent } = useEventStore.getState();

    // 1. Validar cadena de frío del furgón (<= 4°C para frescos o <= -18°C para congelados)
    if (input.temperaturaFurgonCelsius > 4) {
      throw new Error(
        `Temperatura del furgón no apta para cadena de frío (${input.temperaturaFurgonCelsius}°C > 4°C)`
      );
    }

    // 2. Validar que los pedidos existan y estén en estado LISTO
    const pedidosSeleccionados: Pedido[] = [];
    for (const pId of input.pedidosIds) {
      const p = ventas.find(v => v.id === pId || v.numeroPedido === pId);
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

    const createResult = deliveryRouteService.crearManifiestoRuta(
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
    deliveryRouteService.confirmarCheckinCarga({
      manifiestoId: manifiesto.id,
      pedidosConfirmados: input.pedidosIds,
      temperaturaSalidaCelsius: input.temperaturaFurgonCelsius,
      observacionesCarga: 'Carga verificada y cadena de frío conforme',
    });

    deliveryRouteService.iniciarRuta(manifiesto.id);
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

      try {
        updateVenta(p.id, pDespachado);
      } catch {
        useOrderStore.setState(state => ({
          ventas: state.ventas.map(v => (v.id === p.id ? pDespachado : v)),
        }));
      }

      pedidosDespachados.push(pDespachado);
    }

    // 6. Publicar evento de dominio
    publishEvent(
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
   * Fase 3 Despacho: Registra la entrega en sitio por el repartidor con firma digital.
   * Procesa devoluciones segregándolas a CUARENTENA_CALIDAD y ajusta el monto a cobrar en sitio.
   */
  async registrarEntregaEnSitio(
    input: RegistrarEntregaEnSitioInput
  ): Promise<{ pedido: Pedido; manifiesto: DeliveryRouteRecord }> {
    const { ventas, updateVenta } = useOrderStore.getState();
    const { publishEvent } = useEventStore.getState();

    if (!input.firmaClienteUrl || input.firmaClienteUrl.trim() === '') {
      throw new Error('La firma digital del cliente es obligatoria para certificar la entrega');
    }

    const pedido = ventas.find(v => v.id === input.pedidoId || v.numeroPedido === input.pedidoId);
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
    const montoCobrado =
      input.montoCobradoFinal !== undefined
        ? input.montoCobradoFinal
        : Math.max(0, pedido.totalFinal - totalDevuelto);

    const montoEfectivoFinal =
      input.montoEfectivo ??
      input.montoCobradoEfectivo ??
      (input.formaPago === 'EFECTIVO' ? montoCobrado : 0);

    const montoDigitalFinal =
      input.montoDigital ??
      input.montoCobradoDigital ??
      (input.formaPago === 'TRANSFERENCIA_DIGITAL' ? montoCobrado : 0);

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
    const resEntrega = deliveryRouteService.registrarEntregaPedido({
      manifiestoId: input.manifiestoId,
      pedidoId: pedido.id,
      estadoEntrega: devolucionesMapeadas.length > 0 ? 'ENTREGADO_PARCIAL' : 'ENTREGADO_TOTAL',
      formaPago: input.formaPago,
      montoOriginal: pedido.totalFinal,
      montoCobradoFinal: montoCobrado,
      montoEfectivo: montoEfectivoFinal,
      montoDigital: montoDigitalFinal,
      referenciaDigital: input.referenciaDigital,
      firmaClienteUrl: input.firmaClienteUrl,
      devoluciones: devolucionesMapeadas,
      novedadObservaciones: input.observaciones,
    });

    if (!resEntrega.success) {
      throw new Error(resEntrega.error || 'Error al registrar entrega en deliveryRouteService');
    }

    const manifiestoActualizado = deliveryRouteService
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

    try {
      updateVenta(pedido.id, pedidoEntregado);
    } catch {
      useOrderStore.setState(state => ({
        ventas: state.ventas.map(v => (v.id === pedido.id ? pedidoEntregado : v)),
      }));
    }

    publishEvent(
      'QUOTE_STATUS_CHANGED',
      pedido.conductorRepartidorNombre || 'Conductor Repartidor',
      `Pedido ${pedido.numeroPedido} entregado en sitio con firma digital (${
        devolucionesMapeadas.length > 0 ? 'Entrega Parcial' : 'Entrega Total'
      }). Recaudo: $${montoCobrado.toLocaleString()} COP`,
      {
        evento: 'b2b_entrega_en_sitio_registrada',
        pedidoId: pedido.id,
        manifiestoId: input.manifiestoId,
        montoCobrado,
        devolucionesCount: devolucionesMapeadas.length,
        totalDevueltoMonto: totalDevuelto,
      }
    );

    return { pedido: pedidoEntregado, manifiesto: manifiestoActualizado };
  }

  /**
   * Fase 3 Despacho: Cierre y liquidación final del manifiesto de ruta.
   * Concilia odometría, temperatura de retorno y dinero recaudado con tesorería.
   */
  async liquidarManifiestoRuta(input: LiquidarManifiestoInput): Promise<DeliveryRouteRecord> {
    const { publishEvent } = useEventStore.getState();

    const kmFinal = input.kilometrajeFinal ?? input.odometroFinalKm ?? 0;
    const efectivoEntregado = input.efectivoFisicoEntregado ?? input.arqueoEfectivoRecibido ?? 0;
    const liquidador = input.liquidadoPor || input.cajeroReceptorId || 'Tesorería';

    // 1. Finalizar recorrido del chofer con kilometraje final
    const finRecorrido = deliveryRouteService.finalizarRecorridoChofer({
      manifiestoId: input.manifiestoId,
      kilometrajeFinal: kmFinal,
      temperaturaRetornoCelsius: input.temperaturaRetornoCelsius,
      observacionesRetorno: input.observacionesLiquidacion,
    });

    if (!finRecorrido.success) {
      throw new Error(finRecorrido.error || 'Error al finalizar recorrido del chofer');
    }

    // 2. Liquidar ruta y conciliar recaudos contra tesorería
    const liquidacionRes = await deliveryRouteService.liquidarRutaTransportador({
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
    publishEvent(
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

export const b2bIntegrationService = new B2bIntegrationService();
