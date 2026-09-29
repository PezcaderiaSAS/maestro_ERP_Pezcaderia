import { getSupabaseClient } from '../lib/supabase';
import { load, save } from './localDb';
import {
  CreateRouteManifest,
  CreateRouteManifestSchema,
  RegisterDeliveryExecution,
  RegisterDeliveryExecutionSchema,
  SettleRouteManifest,
  SettleRouteManifestSchema,
  RouteExpense,
  RouteReturnItem,
  RouteIncident,
  RouteIncidentSchema,
  CheckinRouteLoad,
  CheckinRouteLoadSchema,
  ArrivalCheckin,
  ArrivalCheckinSchema,
} from '../../packages/validation-schemas/src/deliveryRoute.schema';
import { cashService } from './cashService';

export interface DeliveryOrderItem {
  id: string;
  pedidoId: string;
  numeroPedido: string;
  clienteId: string;
  clienteNombre: string;
  clienteDireccion: string;
  clienteTelefono?: string;
  montoPedidoOriginal: number;
  montoCobradoFinal: number;
  formaPago: 'CREDITO_B2B' | 'EFECTIVO' | 'TRANSFERENCIA_DIGITAL' | 'MIXTO';
  montoEfectivo: number;
  montoDigital: number;
  referenciaTransferencia?: string;
  estadoEntrega: 'PENDIENTE' | 'ENTREGADO_TOTAL' | 'ENTREGADO_PARCIAL' | 'NO_ENTREGADO_RECHAZADO';
  horaEntrega?: string;
  firmaClienteUrl?: string;
  novedadObservaciones?: string;
  items?: Array<{
    sku: string;
    nombre: string;
    cantidad: number;
    precioUnitario: number;
  }>;
  devoluciones?: RouteReturnItem[];
  // Gobernanza y SLAs OTIF
  fechaCreacionPedido?: string;
  fechaRequeridaEntrega?: string;
  jornadaRequerida?: string;
  horaSalidaBodega?: string;
  horaLlegadaEnSitio?: string;
  horaEntregaEfectiva?: string;
  tiempoTransitoMinutos?: number;
  tiempoAtencionMinutos?: number;
  cumplimientoSLA?: 'A_TIEMPO' | 'DEMORADO' | 'ANTICIPADO';
  incidencias?: RouteIncident[];
}

export interface DeliveryRouteRecord {
  id: string;
  numeroManifiesto: string;
  conductorId: string;
  conductorNombre: string;
  conductorTelefono?: string;
  vehiculoPlaca: string;
  vehiculoTipo?: string;
  zonaRuta: string;
  estado: 'PLANIFICADA' | 'EN_RUTA' | 'LIQUIDADA' | 'CANCELADA';
  totalPedidos: number;
  totalPesoKg: number;
  totalFacturadoEsperado: number;
  totalRecaudadoEfectivo: number;
  totalRecaudadoDigital: number;
  totalCreditoFirmado: number;
  totalDevolucionesMonto: number;
  totalGastosRuta: number;
  efectivoNetoEntregado: number;
  diferenciaCuadre: number;
  observaciones?: string;
  observacionesLiquidacion?: string;
  pedidos: DeliveryOrderItem[];
  gastos: RouteExpense[];
  devolucionesGlobales: RouteReturnItem[];
  creadoEn: string;
  salidaEn?: string;
  liquidadoEn?: string;
  // Checklist de recepción de carga y frío
  temperaturaSalidaCelsius?: number;
  cargaVerificadaEnBodega?: boolean;
  horaInicioCarga?: string;
  incidenciasRuta?: RouteIncident[];
}

const STORAGE_KEY = 'delivery_route_manifests';

export const deliveryRouteService = {
  /**
   * Obtiene todos los manifiestos de ruta ordenados por fecha descendente
   */
  obtenerManifiestos(): DeliveryRouteRecord[] {
    const list = load<DeliveryRouteRecord[]>(STORAGE_KEY, []);
    return list.sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime());
  },

  /**
   * Obtiene un manifiesto específico por su ID
   */
  obtenerManifiestoPorId(id: string): DeliveryRouteRecord | undefined {
    return this.obtenerManifiestos().find((m) => m.id === id);
  },

  /**
   * Crea y planifica un nuevo manifiesto de ruta agrupando pedidos
   */
  crearManifiestoRuta(
    input: CreateRouteManifest,
    pedidosDetalle: any[]
  ): { success: boolean; data?: DeliveryRouteRecord; error?: string } {
    try {
      const validated = CreateRouteManifestSchema.parse(input);
      const manifiestos = this.obtenerManifiestos();

      const correlativo = (manifiestos.length + 1).toString().padStart(3, '0');
      const fechaHoy = new Date().toISOString().slice(2, 10).replace(/-/g, '');
      const numeroManifiesto = `MAN-${fechaHoy}-${correlativo}`;
      const id = crypto.randomUUID?.() || `man-${Date.now()}`;

      let totalFacturado = 0;
      let totalPeso = 0;

      const pedidosMapeados: DeliveryOrderItem[] = validated.pedidosIds.map((pId) => {
        const p = pedidosDetalle.find((x) => x.id === pId || x.numeroPedido === pId) || {};
        const monto = Number(p.totalNeto || p.total || p.subtotal || 0);
        totalFacturado += monto;

        const peso = (p.items || []).reduce((acc: number, it: any) => acc + (Number(it.cantidad) || 0), 0);
        totalPeso += peso;

        return {
          id: crypto.randomUUID?.() || `item-man-${Date.now()}-${Math.random()}`,
          pedidoId: p.id || pId,
          numeroPedido: p.numeroPedido || pId,
          clienteId: p.clienteId || 'cli-anon',
          clienteNombre: p.clienteNombre || 'Cliente B2B',
          clienteDireccion: p.clienteDireccion || p.direccionEntrega || 'Dirección de Entrega',
          clienteTelefono: p.clienteTelefono || '',
          montoPedidoOriginal: monto,
          montoCobradoFinal: monto,
          formaPago: p.formaPago === 'CREDITO' ? 'CREDITO_B2B' : 'EFECTIVO',
          montoEfectivo: p.formaPago === 'CREDITO' ? 0 : monto,
          montoDigital: 0,
          estadoEntrega: 'PENDIENTE',
          items: p.items || [],
          devoluciones: [],
          fechaCreacionPedido: p.fechaCreacion || p.createdAt || new Date().toISOString(),
          fechaRequeridaEntrega: p.fechaEntrega || p.fechaRequerida || new Date().toISOString().slice(0, 10),
          jornadaRequerida: p.jornada || 'AM',
          incidencias: [],
        };
      });

      const nuevoManifiesto: DeliveryRouteRecord = {
        id,
        numeroManifiesto,
        conductorId: validated.conductorId,
        conductorNombre: validated.conductorNombre,
        conductorTelefono: validated.conductorTelefono,
        vehiculoPlaca: validated.vehiculoPlaca.toUpperCase(),
        vehiculoTipo: validated.vehiculoTipo || 'Furgón Refrigerado',
        zonaRuta: validated.zonaRuta,
        estado: 'PLANIFICADA',
        totalPedidos: pedidosMapeados.length,
        totalPesoKg: Math.round(totalPeso * 100) / 100,
        totalFacturadoEsperado: Math.round(totalFacturado * 100) / 100,
        totalRecaudadoEfectivo: 0,
        totalRecaudadoDigital: 0,
        totalCreditoFirmado: 0,
        totalDevolucionesMonto: 0,
        totalGastosRuta: 0,
        efectivoNetoEntregado: 0,
        diferenciaCuadre: 0,
        observaciones: validated.observaciones,
        pedidos: pedidosMapeados,
        gastos: [],
        devolucionesGlobales: [],
        creadoEn: new Date().toISOString(),
        cargaVerificadaEnBodega: false,
        incidenciasRuta: [],
      };

      manifiestos.unshift(nuevoManifiesto);
      save(STORAGE_KEY, manifiestos);

      return { success: true, data: nuevoManifiesto };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al crear manifiesto de ruta' };
    }
  },

  /**
   * Checklist de recepción y carga en bodega:
   * El repartidor verifica cada bulto/pedido a bordo y registra la temperatura inicial del termo-furgón
   */
  confirmarCheckinCarga(
    input: CheckinRouteLoad
  ): { success: boolean; data?: DeliveryRouteRecord; error?: string } {
    try {
      const validated = CheckinRouteLoadSchema.parse(input);
      const manifiestos = this.obtenerManifiestos();
      const idx = manifiestos.findIndex((m) => m.id === validated.manifiestoId);
      if (idx === -1) return { success: false, error: 'Manifiesto no encontrado' };

      const manifiesto = manifiestos[idx];
      const now = new Date().toISOString();

      manifiesto.temperaturaSalidaCelsius = validated.temperaturaSalidaCelsius;
      manifiesto.cargaVerificadaEnBodega = true;
      manifiesto.horaInicioCarga = now;
      manifiesto.salidaEn = now;
      manifiesto.estado = 'EN_RUTA';

      if (validated.observacionesCarga) {
        manifiesto.observaciones = manifiesto.observaciones
          ? `${manifiesto.observaciones} | Carga: ${validated.observacionesCarga}`
          : validated.observacionesCarga;
      }

      // Marcar hora de salida de bodega en cada pedido confirmado
      for (const p of manifiesto.pedidos) {
        if (validated.pedidosConfirmados.includes(p.pedidoId) || validated.pedidosConfirmados.includes(p.id)) {
          p.horaSalidaBodega = now;
        }
      }

      save(STORAGE_KEY, manifiestos);
      return { success: true, data: manifiesto };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al confirmar check-in de carga' };
    }
  },

  /**
   * Cambia el estado del manifiesto a EN_RUTA al salir del centro de distribución
   */
  iniciarRuta(manifiestoId: string): { success: boolean; error?: string } {
    const manifiestos = this.obtenerManifiestos();
    const idx = manifiestos.findIndex((m) => m.id === manifiestoId);
    if (idx === -1) return { success: false, error: 'Manifiesto no encontrado' };

    manifiestos[idx].estado = 'EN_RUTA';
    manifiestos[idx].salidaEn = new Date().toISOString();
    save(STORAGE_KEY, manifiestos);
    return { success: true };
  },

  /**
   * Registra la llegada del conductor al establecimiento del cliente ('En Puerta')
   * Calculando el tiempo de tránsito desde la salida de bodega
   */
  registrarLlegadaEnSitio(
    input: ArrivalCheckin
  ): { success: boolean; error?: string } {
    try {
      const validated = ArrivalCheckinSchema.parse(input);
      const manifiestos = this.obtenerManifiestos();
      const mIdx = manifiestos.findIndex((m) => m.id === validated.manifiestoId);
      if (mIdx === -1) return { success: false, error: 'Manifiesto no encontrado' };

      const manifiesto = manifiestos[mIdx];
      const pIdx = manifiesto.pedidos.findIndex((p) => p.pedidoId === validated.pedidoId || p.id === validated.pedidoId);
      if (pIdx === -1) return { success: false, error: 'Pedido no encontrado en este manifiesto' };

      const pedido = manifiesto.pedidos[pIdx];
      const horaLlegada = validated.horaLlegada || new Date().toISOString();
      pedido.horaLlegadaEnSitio = horaLlegada;

      // Calcular tiempo de tránsito si hay hora de salida
      const horaSalida = pedido.horaSalidaBodega || manifiesto.salidaEn;
      if (horaSalida) {
        const diffMs = new Date(horaLlegada).getTime() - new Date(horaSalida).getTime();
        pedido.tiempoTransitoMinutos = Math.max(1, Math.round(diffMs / 60000));
      }

      save(STORAGE_KEY, manifiestos);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al registrar llegada en sitio' };
    }
  },

  /**
   * Registra una eventualidad o incidencia de ruta en tiempo real
   */
  registrarIncidenciaRuta(
    input: RouteIncident
  ): { success: boolean; error?: string } {
    try {
      const validated = RouteIncidentSchema.parse(input);
      const manifiestos = this.obtenerManifiestos();
      const mIdx = manifiestos.findIndex((m) => m.id === validated.manifiestoId);
      if (mIdx === -1) return { success: false, error: 'Manifiesto no encontrado' };

      const manifiesto = manifiestos[mIdx];
      const nuevaIncidencia: RouteIncident = {
        ...validated,
        id: crypto.randomUUID?.() || `inc-${Date.now()}`,
        horaReporte: validated.horaReporte || new Date().toISOString(),
      };

      manifiesto.incidenciasRuta = manifiesto.incidenciasRuta || [];
      manifiesto.incidenciasRuta.push(nuevaIncidencia);

      if (validated.pedidoId) {
        const pedido = manifiesto.pedidos.find((p) => p.pedidoId === validated.pedidoId || p.id === validated.pedidoId);
        if (pedido) {
          pedido.incidencias = pedido.incidencias || [];
          pedido.incidencias.push(nuevaIncidencia);
        }
      }

      save(STORAGE_KEY, manifiestos);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al registrar incidencia' };
    }
  },

  /**
   * Registra el resultado de entrega de un pedido en sitio:
   * Cobro multimedio, firma de recibido, tiempos de atención y evaluación de SLA OTIF.
   */
  registrarEntregaPedido(
    input: RegisterDeliveryExecution
  ): { success: boolean; error?: string } {
    try {
      const validated = RegisterDeliveryExecutionSchema.parse(input);
      const manifiestos = this.obtenerManifiestos();
      const mIdx = manifiestos.findIndex((m) => m.id === validated.manifiestoId);
      if (mIdx === -1) return { success: false, error: 'Manifiesto no encontrado' };

      const manifiesto = manifiestos[mIdx];
      const pIdx = manifiesto.pedidos.findIndex((p) => p.pedidoId === validated.pedidoId || p.id === validated.pedidoId);
      if (pIdx === -1) return { success: false, error: 'Pedido no encontrado en este manifiesto' };

      const pedido = manifiesto.pedidos[pIdx];
      const now = new Date().toISOString();

      // Actualizar datos de entrega
      pedido.estadoEntrega = validated.estadoEntrega;
      pedido.formaPago = validated.formaPago;
      pedido.montoCobradoFinal = validated.montoCobradoFinal;
      pedido.montoEfectivo = validated.montoEfectivo;
      pedido.montoDigital = validated.montoDigital;
      pedido.referenciaTransferencia = validated.referenciaDigital;
      pedido.firmaClienteUrl = validated.firmaClienteUrl;
      pedido.novedadObservaciones = validated.novedadObservaciones;
      pedido.horaEntrega = now;
      pedido.horaEntregaEfectiva = now;

      // Calcular tiempo de atención en cliente si se registró llegada
      if (pedido.horaLlegadaEnSitio) {
        const diffMs = new Date(now).getTime() - new Date(pedido.horaLlegadaEnSitio).getTime();
        pedido.tiempoAtencionMinutos = Math.max(1, Math.round(diffMs / 60000));
      }

      // Evaluación de cumplimiento SLA respecto a fecha requerida por el cliente
      if (pedido.fechaRequeridaEntrega) {
        const fechaEntregaDia = now.slice(0, 10);
        const fechaReqDia = pedido.fechaRequeridaEntrega.slice(0, 10);
        if (fechaEntregaDia < fechaReqDia) {
          pedido.cumplimientoSLA = 'ANTICIPADO';
        } else if (fechaEntregaDia === fechaReqDia) {
          pedido.cumplimientoSLA = 'A_TIEMPO';
        } else {
          pedido.cumplimientoSLA = 'DEMORADO';
        }
      } else {
        pedido.cumplimientoSLA = 'A_TIEMPO';
      }

      if (validated.devoluciones && validated.devoluciones.length > 0) {
        pedido.devoluciones = validated.devoluciones;
        // Acumular en devoluciones globales del manifiesto
        manifiesto.devolucionesGlobales = [
          ...(manifiesto.devolucionesGlobales || []),
          ...validated.devoluciones,
        ];
        const montoDev = validated.devoluciones.reduce((acc, d) => acc + d.montoDescontado, 0);
        manifiesto.totalDevolucionesMonto += montoDev;
      }

      save(STORAGE_KEY, manifiestos);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al registrar entrega' };
    }
  },

  /**
   * Registra un gasto operativo del conductor en ruta (combustible, peajes, hielo, etc.)
   */
  registrarGastoRuta(
    manifiestoId: string,
    gasto: RouteExpense
  ): { success: boolean; error?: string } {
    const manifiestos = this.obtenerManifiestos();
    const idx = manifiestos.findIndex((m) => m.id === manifiestoId);
    if (idx === -1) return { success: false, error: 'Manifiesto no encontrado' };

    const nuevoGasto: RouteExpense = {
      ...gasto,
      id: crypto.randomUUID?.() || `gasto-${Date.now()}`,
    };

    manifiestos[idx].gastos.push(nuevoGasto);
    manifiestos[idx].totalGastosRuta += gasto.monto;
    save(STORAGE_KEY, manifiestos);
    return { success: true };
  },

  /**
   * Cierre y liquidación final del transportador:
   * Calcula arqueo, deducción de gastos soportados y cuadre de caja general.
   */
  async liquidarRutaTransportador(
    input: SettleRouteManifest
  ): Promise<{ success: boolean; data?: DeliveryRouteRecord; error?: string }> {
    try {
      const validated = SettleRouteManifestSchema.parse(input);
      const manifiestos = this.obtenerManifiestos();
      const idx = manifiestos.findIndex((m) => m.id === validated.manifiestoId);
      if (idx === -1) return { success: false, error: 'Manifiesto no encontrado' };

      const manifiesto = manifiestos[idx];

      // Acumular gastos adicionales proporcionados en liquidación
      if (validated.gastos && validated.gastos.length > 0) {
        for (const g of validated.gastos) {
          manifiesto.gastos.push({
            ...g,
            id: g.id || crypto.randomUUID?.() || `gasto-${Date.now()}`,
          });
          manifiesto.totalGastosRuta += g.monto;
        }
      }

      // Sumar recaudos reales de todos los pedidos entregados
      let totalEfectivo = 0;
      let totalDigital = 0;
      let totalCredito = 0;

      for (const p of manifiesto.pedidos) {
        if (p.estadoEntrega === 'ENTREGADO_TOTAL' || p.estadoEntrega === 'ENTREGADO_PARCIAL') {
          if (p.formaPago === 'CREDITO_B2B') {
            totalCredito += p.montoCobradoFinal;
          } else {
            totalEfectivo += p.montoEfectivo || 0;
            totalDigital += p.montoDigital || 0;
          }
        }
      }

      // Efectivo Neto Esperado = Total Efectivo Recaudado - Total Gastos de Ruta
      const efectivoEsperado = Math.round((totalEfectivo - manifiesto.totalGastosRuta) * 100) / 100;
      const diferenciaCuadre = Math.round((validated.efectivoFisicoEntregado - efectivoEsperado) * 100) / 100;

      manifiesto.estado = 'LIQUIDADA';
      manifiesto.totalRecaudadoEfectivo = Math.round(totalEfectivo * 100) / 100;
      manifiesto.totalRecaudadoDigital = Math.round(totalDigital * 100) / 100;
      manifiesto.totalCreditoFirmado = Math.round(totalCredito * 100) / 100;
      manifiesto.efectivoNetoEntregado = validated.efectivoFisicoEntregado;
      manifiesto.diferenciaCuadre = diferenciaCuadre;
      manifiesto.observacionesLiquidacion = validated.observacionesLiquidacion;
      manifiesto.liquidadoEn = new Date().toISOString();

      save(STORAGE_KEY, manifiestos);

      // Sincronizar en Supabase si está disponible
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await supabase.rpc('fn_liquidar_ruta_transportador', {
            p_manifiesto_id: manifiesto.id,
            p_liquidado_por: validated.liquidadoPor,
            p_efectivo_entregado: validated.efectivoFisicoEntregado,
            p_gastos: manifiesto.gastos,
            p_observaciones: validated.observacionesLiquidacion || null,
          });
        } catch (sbErr) {
          console.warn('[DeliveryRouteService] Sync Supabase opcional fallback a localDb:', sbErr);
        }
      }

      return { success: true, data: manifiesto };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al liquidar ruta' };
    }
  },

  /**
   * Genera el consolidado de métricas de gobernanza y auditoría OTIF
   * (On-Time In-Full, tiempos de tránsito, tiempos de atención, devoluciones a cuarentena e incidencias)
   */
  obtenerMetricasGobernanzaOTIF() {
    const manifiestos = this.obtenerManifiestos();
    let totalPedidos = 0;
    let totalEntregados = 0;
    let entregadosATiempo = 0;
    let entregadosDemorados = 0;
    let entregadosAnticipados = 0;
    let rechazosTotales = 0;

    let sumaTiemposTransito = 0;
    let cuentaTiemposTransito = 0;

    let sumaTiemposAtencion = 0;
    let cuentaTiemposAtencion = 0;

    let totalDevolucionesCuarentena = 0;
    let montoTotalDevoluciones = 0;
    const desgloseDevolucionesPorCausal: Record<string, number> = {};

    const incidenciasGlobales: RouteIncident[] = [];
    const registrosAuditoria: Array<{
      manifiestoId: string;
      numeroManifiesto: string;
      conductor: string;
      vehiculoPlaca: string;
      zonaRuta: string;
      temperaturaSalida?: number;
      pedidoId: string;
      numeroPedido: string;
      clienteNombre: string;
      fechaCreacion?: string;
      fechaRequerida?: string;
      jornadaRequerida?: string;
      horaSalida?: string;
      horaLlegada?: string;
      horaEntrega?: string;
      tiempoTransitoMin?: number;
      tiempoAtencionMin?: number;
      cumplimientoSLA?: string;
      formaPago?: string;
      montoCobrado?: number;
      estadoEntrega: string;
      tieneDevolucion: boolean;
      incidencias: RouteIncident[];
    }> = [];

    for (const m of manifiestos) {
      if (m.incidenciasRuta && m.incidenciasRuta.length > 0) {
        incidenciasGlobales.push(...m.incidenciasRuta);
      }

      for (const p of m.pedidos) {
        totalPedidos++;

        if (p.estadoEntrega === 'ENTREGADO_TOTAL' || p.estadoEntrega === 'ENTREGADO_PARCIAL') {
          totalEntregados++;
          if (p.cumplimientoSLA === 'ANTICIPADO') {
            entregadosAnticipados++;
            entregadosATiempo++;
          } else if (p.cumplimientoSLA === 'DEMORADO') {
            entregadosDemorados++;
          } else {
            entregadosATiempo++;
          }
        } else if (p.estadoEntrega === 'NO_ENTREGADO_RECHAZADO') {
          rechazosTotales++;
        }

        if (p.tiempoTransitoMinutos && p.tiempoTransitoMinutos > 0) {
          sumaTiemposTransito += p.tiempoTransitoMinutos;
          cuentaTiemposTransito++;
        }

        if (p.tiempoAtencionMinutos && p.tiempoAtencionMinutos > 0) {
          sumaTiemposAtencion += p.tiempoAtencionMinutos;
          cuentaTiemposAtencion++;
        }

        if (p.devoluciones && p.devoluciones.length > 0) {
          for (const d of p.devoluciones) {
            totalDevolucionesCuarentena += d.cantidadDevueltaKg || 1;
            montoTotalDevoluciones += d.montoDescontado || 0;
            const causal = d.motivoRechazo || 'OTRO';
            desgloseDevolucionesPorCausal[causal] = (desgloseDevolucionesPorCausal[causal] || 0) + 1;
          }
        }

        registrosAuditoria.push({
          manifiestoId: m.id,
          numeroManifiesto: m.numeroManifiesto,
          conductor: m.conductorNombre,
          vehiculoPlaca: m.vehiculoPlaca,
          zonaRuta: m.zonaRuta,
          temperaturaSalida: m.temperaturaSalidaCelsius,
          pedidoId: p.pedidoId,
          numeroPedido: p.numeroPedido,
          clienteNombre: p.clienteNombre,
          fechaCreacion: p.fechaCreacionPedido,
          fechaRequerida: p.fechaRequeridaEntrega,
          jornadaRequerida: p.jornadaRequerida,
          horaSalida: p.horaSalidaBodega || m.salidaEn,
          horaLlegada: p.horaLlegadaEnSitio,
          horaEntrega: p.horaEntregaEfectiva || p.horaEntrega,
          tiempoTransitoMin: p.tiempoTransitoMinutos,
          tiempoAtencionMin: p.tiempoAtencionMinutos,
          cumplimientoSLA: p.cumplimientoSLA || (p.estadoEntrega === 'PENDIENTE' ? 'PENDIENTE' : 'A_TIEMPO'),
          formaPago: p.formaPago,
          montoCobrado: p.montoCobradoFinal,
          estadoEntrega: p.estadoEntrega,
          tieneDevolucion: Boolean(p.devoluciones && p.devoluciones.length > 0),
          incidencias: p.incidencias || [],
        });
      }
    }

    const porcentajeOTIF = totalEntregados > 0
      ? Math.round((entregadosATiempo / totalEntregados) * 100 * 10) / 10
      : 100;

    const promedioTransitoMin = cuentaTiemposTransito > 0
      ? Math.round(sumaTiemposTransito / cuentaTiemposTransito)
      : 0;

    const promedioAtencionMin = cuentaTiemposAtencion > 0
      ? Math.round(sumaTiemposAtencion / cuentaTiemposAtencion)
      : 0;

    return {
      totalManifiestos: manifiestos.length,
      totalPedidos,
      totalEntregados,
      entregadosATiempo,
      entregadosDemorados,
      entregadosAnticipados,
      rechazosTotales,
      porcentajeOTIF,
      promedioTransitoMin,
      promedioAtencionMin,
      totalDevolucionesCuarentena,
      montoTotalDevoluciones,
      desgloseDevolucionesPorCausal,
      totalIncidencias: incidenciasGlobales.length,
      incidenciasGlobales,
      registrosAuditoria,
    };
  },
};
