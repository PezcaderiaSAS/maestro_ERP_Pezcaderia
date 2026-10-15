import {
  ConvertirCotizacionInput,
  CrearPedidoVentaExternaInput,
  IOrderRepository,
  IDomainEventPublisher,
} from '../../contracts/b2b.contracts';
import { Pedido, LineaPedido, Cotizacion, EstadoPedido } from '../../types/orders.types';
import { Cliente } from '../../types/erp.types';
import { B2BSalesService } from '../b2bSalesService';
import { zustandOrderRepository } from './adapters/ZustandOrderRepositoryAdapter';
import { zustandEventPublisher } from './adapters/ZustandEventPublisherAdapter';
import { useClientStore } from '../../store/useClientStore';

/**
 * Servicio de Dominio Comercial B2B (Fase 1 Comercial).
 * Cumple con el Principio de Responsabilidad Única (SRP) y de Inversión de Dependencias (DIP).
 * Se encarga exclusivamente de:
 * 1. Conversión de cotizaciones formalizadas a pedidos B2B con trazabilidad de vendedor.
 * 2. Creación de pedidos B2B desde terminal móvil de venta externa para Bodega Principal.
 * 3. Validación de cupo de crédito (semáforo de riesgo) y liquidación de retenciones NIIF.
 */
export class B2BCommercialOrderService {
  constructor(
    private readonly orderRepo: IOrderRepository = zustandOrderRepository,
    private readonly eventPublisher: IDomainEventPublisher = zustandEventPublisher,
    private readonly salesCalculator: typeof B2BSalesService = B2BSalesService
  ) {}

  /**
   * Convierte una cotización formalizada en un pedido B2B activo.
   */
  async convertirCotizacionAPedido(input: ConvertirCotizacionInput): Promise<Pedido> {
    // 1. Obtener y validar cotización origen
    let cotizacion: Cotizacion | undefined = input.cotizacion;
    if (!cotizacion && input.cotizacionId) {
      cotizacion = await this.orderRepo.obtenerCotizacionPorId(input.cotizacionId);
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

    // 3. Cálculos comerciales y retenciones NIIF (con cliente legítimo - LSP)
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

    const niif = this.salesCalculator.calcularTotalesCotizacionNIIF(baseSinIva, totalIva, clienteObj);

    // 4. Verificación de Cupo de Crédito (Semáforo de Riesgo)
    const formaPago = input.formaPago || (cotizacion.formaPago as any) || 'CONTADO';
    let estadoInicial: EstadoPedido = 'CREADO';
    let notasAdicionales = input.observaciones || cotizacion.observaciones || '';

    if (formaPago === 'CREDITO') {
      if (input.verificarCupo !== false && input.cliente) {
        const cupoCheck = this.salesCalculator.verificarCupoCredito(input.cliente, niif.total_factura);
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

    // 6. Persistencia desacoplada vía IOrderRepository
    await this.orderRepo.guardarPedido(nuevoPedido);

    await this.orderRepo.actualizarCotizacion(cotizacion.id, {
      estado: 'CONVERTIDA_A_PEDIDO',
      vendedorId: input.vendedorId,
      vendedorNombre: input.vendedorNombre || 'Vendedor Comercial',
      fechaActualizacion: fechaActual,
    });

    // 7. Registro de Evento de Dominio desacoplado
    await this.eventPublisher.publicarEvento(
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
   * Crea un pedido B2B directo desde la terminal del vendedor externo para Bodega Principal.
   */
  async crearPedidoVentaExternaB2B(input: CrearPedidoVentaExternaInput): Promise<Pedido> {
    if (!input.vendedorId) {
      throw new Error('El ID del vendedor es obligatorio');
    }
    if (!input.clienteId) {
      throw new Error('El ID del cliente es obligatorio');
    }
    if (!input.lineas || input.lineas.length === 0) {
      throw new Error('El pedido debe contener al menos un producto');
    }

    const clientStore = useClientStore.getState();
    const clienteExistente = input.cliente || clientStore.getClienteById?.(input.clienteId);

    const clienteObj: Cliente = clienteExistente || ({
      id: input.clienteId,
      nombre: input.clienteNombre || 'Cliente B2B',
      identificacion: '900000000-1',
      tipoIdentificacion: 'NIT',
      tipoPersona: 'JURIDICA',
      direccion: 'Dirección Comercial',
      ciudad: 'Bogotá',
      telefono: '3000000000',
      email: 'comercial@cliente.com',
      tipoPrecio: 'RESTAURANTE',
      cupoCredito: 0,
      cupoCreditoUsado: 0,
      isGranContribuyente: false,
      isAutoretenedor: false,
      activo: true,
    });

    // 1. Mapear líneas de pedido aplicando la regla Catch Weight Dual
    const lineas: LineaPedido[] = input.lineas.map(item => {
      const modalidad = item.modalidadVenta || 'PESO_DIRECTO';
      let pesoEstimado = item.pesoEstimado;
      let totalLinea = 0;
      let unidadMedida: 'kg' | 'und' = 'kg';
      let piezasSolicitadas = item.cantidadSolicitada;

      if (modalidad === 'CATCH_WEIGHT_PIEZAS') {
        unidadMedida = 'kg'; // Se factura y cobra por kilo real de báscula
        piezasSolicitadas = item.cantidadSolicitada;
        if (item.calibreMinGramos && item.calibreMaxGramos) {
          const calibrePromedioKg = ((item.calibreMinGramos + item.calibreMaxGramos) / 2) / 1000;
          pesoEstimado = pesoEstimado ?? Number((item.cantidadSolicitada * calibrePromedioKg).toFixed(3));
        } else if (pesoEstimado === undefined) {
          pesoEstimado = item.cantidadSolicitada;
        }
        totalLinea = Math.round(pesoEstimado * item.precioPactado);
      } else if (modalidad === 'UNIDADES_FIJAS') {
        unidadMedida = 'und';
        piezasSolicitadas = item.cantidadSolicitada;
        pesoEstimado = item.pesoEstimado;
        totalLinea = Math.round(item.cantidadSolicitada * item.precioPactado);
      } else {
        // PESO_DIRECTO
        unidadMedida = 'kg';
        pesoEstimado = item.pesoEstimado ?? item.cantidadSolicitada;
        totalLinea = Math.round(pesoEstimado * item.precioPactado);
      }

      return {
        productoId: item.productoId,
        sku: item.sku || '',
        nombre: item.nombre || 'Producto del mar',
        cantidadSolicitada: item.cantidadSolicitada,
        cantidadAlistada: 0,
        cantidadDespachada: 0,
        estadoLinea: 'PENDIENTE',
        pesoEstimado,
        precioPactado: item.precioPactado,
        totalLinea,
        unidadMedida,
        modalidadVenta: modalidad,
        piezasSolicitadas,
        calibreMinGramos: item.calibreMinGramos,
        calibreMaxGramos: item.calibreMaxGramos,
        corte: item.corte,
        empaque: item.empaque,
      };
    });

    // 2. Cálculos comerciales y retenciones NIIF
    const subtotalBruto = lineas.reduce((acc, l) => acc + l.totalLinea, 0);
    const baseSinIva = subtotalBruto;
    const totalIva = 0;
    const niif = this.salesCalculator.calcularTotalesCotizacionNIIF(baseSinIva, totalIva, clienteObj);

    // 3. Verificación de Cupo de Crédito (Semáforo de Riesgo)
    let estadoInicial: EstadoPedido = 'CREADO';
    let notasAdicionales = input.observaciones || '';

    if (input.formaPago === 'CREDITO') {
      if (input.verificarCupo !== false) {
        const cupoCheck = this.salesCalculator.verificarCupoCredito(clienteObj, niif.total_factura);
        if (!cupoCheck.aprobado) {
          estadoInicial = 'PAUSADO_POR_CREDITO';
          notasAdicionales = `[PAUSADO POR CUPO DE CRÉDITO: ${cupoCheck.mensaje}] ${notasAdicionales}`.trim();
        }
      }
    }

    // 4. Construcción del Pedido para Bodega Principal
    const fechaActual = new Date().toISOString();
    const numeroConsecutivo = Math.floor(100000 + Math.random() * 900000);

    const nuevoPedido: Pedido = {
      id: crypto.randomUUID(),
      numeroPedido: `PED-B2B-${numeroConsecutivo}`,
      fecha: fechaActual,
      origen: 'VISITA',
      clienteId: clienteObj.id,
      bodegaId: input.bodegaId || '1', // Bodega Principal por defecto
      branch_id: input.branch_id || '00000000-0000-0000-0000-000000000001',
      vendedorId: input.vendedorId,
      vendedorNombre: input.vendedorNombre || 'Vendedor Comercial',
      formaPago: input.formaPago,
      tipoEntrega: input.tipoEntrega || 'EN_RUTA',
      fechaEntrega: input.fechaEntrega || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      jornada: input.jornada || 'MANANA',
      estado: estadoInicial,
      observaciones: notasAdicionales,
      lineas,
      subtotal: niif.subtotal_base,
      descuentoGlobalPct: 0,
      descuentoGlobalValor: 0,
      totalFinal: niif.total_factura,
      retefuenteValor: niif.retefuente,
      reteicaValor: niif.reteica,
      ivaValor: niif.total_iva,
      subtotalNeto: niif.valor_neto_a_cobrar,
      idempotencyKey: `idemp-b2b-ext-${numeroConsecutivo}-${Date.now()}`,
      rutaId: null,
      facturacionElectronica: false,
      idSiigo: null,
      inventarioDescontado: false,
    };

    // 5. Persistencia desacoplada
    await this.orderRepo.guardarPedido(nuevoPedido);

    // 6. Publicación de Evento Inmutable de Auditoría
    await this.eventPublisher.publicarEvento(
      'QUOTE_STATUS_CHANGED',
      input.vendedorNombre || 'Vendedor Comercial',
      `Pedido de venta externa B2B ${nuevoPedido.numeroPedido} creado para ${clienteObj.nombre} ($${nuevoPedido.totalFinal.toLocaleString()} COP) - Estado: ${nuevoPedido.estado}`,
      {
        evento: 'b2b_pedido_externo_creado',
        pedidoId: nuevoPedido.id,
        numeroPedido: nuevoPedido.numeroPedido,
        clienteId: nuevoPedido.clienteId,
        vendedorId: input.vendedorId,
        formaPago: nuevoPedido.formaPago,
        estadoInicial: nuevoPedido.estado,
        totalFinal: nuevoPedido.totalFinal,
        subtotalNeto: nuevoPedido.subtotalNeto,
        bodegaId: nuevoPedido.bodegaId,
        modalidades: lineas.map(l => l.modalidadVenta),
      }
    );

    return nuevoPedido;
  }
}

export const b2bCommercialOrderService = new B2BCommercialOrderService();
