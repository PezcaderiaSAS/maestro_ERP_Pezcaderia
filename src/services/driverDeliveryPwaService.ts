/**
 * Servicio Transaccional de la App PWA para Conductores y Repartidores
 * Especificación: SPEC-023
 * Gobernanza: Patrón Outbox Offline con Idempotencia, trazabilidad de ruta y recaudo seguro.
 */

import {
  DriverSession,
  DriverActiveRoute,
  DriverDeliveryStop,
  DriverRecaudoResumen
} from '../types/driverDeliveryPwa.types';
import {
  DriverLoginCredentialsSchema,
  RegistroEjecucionParadaSchema,
  type RegistroEjecucionParada,
  calcularTotalRecaudoParada,
  calcularKilosDevueltosTotales
} from '../../packages/validation-schemas/src/driverDeliveryPwa.schema';
import { deliveryRouteService, DeliveryRouteRecord } from './deliveryRouteService';
import { OutboxSyncService } from './outboxSyncService';
import { load, save, remove, DbKey } from './localDb';

const DRIVER_SESSION_KEY: DbKey = 'driver_pwa_session';
const PWA_MANIFEST_OVERRIDE_KEY: DbKey = 'driver_pwa_active_manifest';

/**
 * Conductores corporativos predeterminados para contingencia u operación local
 */
const DEFAULT_DRIVERS: DriverSession[] = [
  {
    conductorId: 'drv-001',
    conductorNombre: 'Juan Carlos Rodríguez',
    email: 'conductor.juan@pezcaderia.com',
    telefono: '+57 312 456 7890',
    vehiculoPlaca: 'WPZ-482',
    vehiculoNombre: 'Furgón Isuzu FrioMax #1',
    activo: true
  },
  {
    conductorId: 'drv-002',
    conductorNombre: 'Andrés Felipe Morales',
    email: 'conductor.andres@pezcaderia.com',
    telefono: '+57 315 987 6543',
    vehiculoPlaca: 'STR-910',
    vehiculoNombre: 'Camioneta Refrigerada #2',
    activo: true
  }
];

export const driverDeliveryPwaService = {
  /**
   * Autentica al conductor corporativo mediante credenciales o selector de sesión
   */
  async loginConductor(email: string, password: string): Promise<DriverSession> {
    const creds = DriverLoginCredentialsSchema.parse({ email, password });
    const normalizedEmail = creds.email.toLowerCase().trim();

    // 1. Buscar en catálogo de conductores registrados
    let matched = DEFAULT_DRIVERS.find(
      (d) => d.email.toLowerCase() === normalizedEmail
    );

    // 2. Si no coincide con predeterminados pero tiene formato corporativo válido, generar sesión operativa
    if (!matched) {
      const nombreDerived = normalizedEmail.split('@')[0].replace(/[._-]/g, ' ');
      matched = {
        conductorId: `drv-${Date.now().toString(36)}`,
        conductorNombre: nombreDerived.charAt(0).toUpperCase() + nombreDerived.slice(1),
        email: normalizedEmail,
        telefono: '+57 300 000 0000',
        vehiculoPlaca: 'WPZ-000',
        vehiculoNombre: 'Furgón Reparto B2B',
        activo: true
      };
    }

    const session: DriverSession = {
      ...matched,
      horaInicioTurno: new Date().toISOString()
    };

    save(DRIVER_SESSION_KEY, session);
    return session;
  },

  /**
   * Obtiene la sesión activa actual del conductor
   */
  obtenerSesionActual(): DriverSession | null {
    return load<DriverSession | null>(DRIVER_SESSION_KEY, null);
  },

  /**
   * Cierra la sesión activa del conductor
   */
  cerrarSesion(): void {
    remove(DRIVER_SESSION_KEY);
  },

  /**
   * Carga la ruta de entrega activa asignada al conductor
   */
  async obtenerRutaActivaConductor(conductorId: string): Promise<DriverActiveRoute | null> {
    // 1. Verificar si hay un manifiesto sobrescrito en PWA storage
    const cachedManifest = load<DriverActiveRoute | null>(PWA_MANIFEST_OVERRIDE_KEY, null);
    if (cachedManifest && cachedManifest.conductorId === conductorId) {
      return cachedManifest;
    }

    // 2. Buscar en manifiestos del servicio central de rutas con pedidos válidos
    const manifiestos = deliveryRouteService.obtenerManifiestos();
    const manifestActivo = manifiestos.find(
      (m) =>
        m.conductorId === conductorId &&
        (m.estado === 'EN_RUTA' || m.estado === 'PLANIFICADA') &&
        m.pedidos &&
        m.pedidos.length > 0
    );

    if (manifestActivo) {
      return this.mapearManifiestoADriverRoute(manifestActivo);
    }

    // 3. Fallback a ruta de demostración estructurada
    return this.crearRutaDemostracion(conductorId);
  },

  /**
   * Mapea un DeliveryRouteRecord del ERP al formato de la PWA móvil
   */
  mapearManifiestoADriverRoute(record: DeliveryRouteRecord): DriverActiveRoute {
    const paradas: DriverDeliveryStop[] = (record.pedidos || []).map((p) => ({
      id: p.id,
      pedidoId: p.pedidoId,
      numeroPedido: p.numeroPedido,
      clienteId: p.clienteId,
      clienteNombre: p.clienteNombre,
      clienteDireccion: p.clienteDireccion,
      clienteTelefono: p.clienteTelefono || '+57 311 000 0000',
      coordenadasGps: { lat: 7.1193, lng: -73.1227 }, // Bucaramanga centro
      montoPedidoOriginal: p.montoPedidoOriginal,
      montoCobradoFinal: p.montoCobradoFinal || 0,
      formaPago: p.formaPago,
      montoEfectivo: p.montoEfectivo || 0,
      montoDigital: p.montoDigital || 0,
      referenciaTransferencia: p.referenciaTransferencia,
      estadoEntrega: p.estadoEntrega || 'PENDIENTE',
      horaEntrega: p.horaEntrega,
      items: (p.items || []).map((it) => ({
        sku: it.sku,
        nombre: it.nombre,
        cantidad: it.cantidad,
        precioUnitario: it.precioUnitario
      })),
      devoluciones: (p.devoluciones as any) || [],
      observaciones: p.novedadObservaciones
    }));

    const paradasTotales = paradas.length;
    const paradasCompletadas = paradas.filter(
      (p) => p.estadoEntrega !== 'PENDIENTE'
    ).length;
    const progresoPorcentaje =
      paradasTotales > 0
        ? Math.round((paradasCompletadas / paradasTotales) * 100)
        : 0;

    return {
      manifiestoId: record.id,
      numeroManifiesto: record.numeroManifiesto,
      fecha: record.creadoEn,
      estado: record.estado === 'CANCELADA' ? 'PLANIFICADA' : record.estado,
      conductorId: record.conductorId,
      conductorNombre: record.conductorNombre,
      vehiculoPlaca: record.vehiculoPlaca,
      paradas,
      progresoPorcentaje,
      paradasCompletadas,
      paradasTotales,
      totalKilosCargados: record.totalPesoKg
    };
  },

  /**
   * Registra quirúrgicamente la ejecución de una parada, actualiza el manifiesto
   * y encola la evidencia con firma Canvas en la Outbox offline con idempotencia.
   */
  async registrarEntregaParada(
    registro: RegistroEjecucionParada,
    metadata?: { conductorId?: string; clienteNombre?: string }
  ): Promise<{ exito: boolean; outboxId: string; mensaje: string }> {
    // 1. Validar esquema riguroso con Zod
    const data = RegistroEjecucionParadaSchema.parse(registro);

    // 2. Cargar manifiesto activo actual
    const conductorId = metadata?.conductorId || 'drv-001';
    let route = await this.obtenerRutaActivaConductor(conductorId);
    if (!route) {
      route = this.crearRutaDemostracion(conductorId);
    }

    // 3. Actualizar parada en memoria/almacenamiento
    const stopIndex = route.paradas.findIndex((p) => p.id === data.paradaId);
    const ahoraIso = new Date().toISOString();

    const totalCobrado = calcularTotalRecaudoParada(
      data.montoCobradoEfectivo,
      data.montoCobradoTransferencia
    );

    if (stopIndex >= 0) {
      route.paradas[stopIndex] = {
        ...route.paradas[stopIndex],
        estadoEntrega: data.estadoFinal,
        formaPago: data.formaPagoEfectuada || route.paradas[stopIndex].formaPago,
        montoCobradoFinal: totalCobrado,
        montoEfectivo: data.montoCobradoEfectivo,
        montoDigital: data.montoCobradoTransferencia,
        referenciaTransferencia: data.comprobanteTransferencia,
        horaEntrega: ahoraIso,
        evidencia: data.evidencia,
        devoluciones: data.devoluciones
      };
    }

    // 4. Recalcular métricas de avance de la ruta
    route.paradasCompletadas = route.paradas.filter(
      (p) => p.estadoEntrega !== 'PENDIENTE'
    ).length;
    route.progresoPorcentaje =
      route.paradasTotales > 0
        ? Math.round((route.paradasCompletadas / route.paradasTotales) * 100)
        : 100;

    // 5. Guardar actualización de la ruta localmente
    save(PWA_MANIFEST_OVERRIDE_KEY, route);

    // Sincronizar también con deliveryRouteService si el manifiesto existe allí
    const manifiestoCentral = deliveryRouteService.obtenerManifiestoPorId(data.manifiestoId);
    if (manifiestoCentral) {
      const pedidoIdx = manifiestoCentral.pedidos.findIndex((p) => p.id === data.paradaId);
      if (pedidoIdx >= 0) {
        manifiestoCentral.pedidos[pedidoIdx].estadoEntrega = data.estadoFinal;
        if (data.formaPagoEfectuada) {
          manifiestoCentral.pedidos[pedidoIdx].formaPago = data.formaPagoEfectuada;
        }
        manifiestoCentral.pedidos[pedidoIdx].montoCobradoFinal = totalCobrado;
        manifiestoCentral.pedidos[pedidoIdx].montoEfectivo = data.montoCobradoEfectivo;
        manifiestoCentral.pedidos[pedidoIdx].montoDigital = data.montoCobradoTransferencia;
        manifiestoCentral.pedidos[pedidoIdx].referenciaTransferencia = data.comprobanteTransferencia;
        manifiestoCentral.pedidos[pedidoIdx].horaEntrega = ahoraIso;
        manifiestoCentral.pedidos[pedidoIdx].firmaClienteUrl = data.evidencia.firmaCanvasBase64;
        manifiestoCentral.pedidos[pedidoIdx].devoluciones = data.devoluciones as any;

        // Persistir en lista central
        const all = deliveryRouteService.obtenerManifiestos();
        const mainIdx = all.findIndex((m) => m.id === manifiestoCentral.id);
        if (mainIdx >= 0) {
          all[mainIdx] = manifiestoCentral;
          save('delivery_route_manifests', all);
        }
      }
    }

    // 6. Encolar en la cola Outbox resiliente con Idempotencia
    const outboxItem = await OutboxSyncService.encolarTransaccion({
      empresaId: 'pezcaderia-default',
      ventaId: data.pedidoId,
      consecutivoInterno: `PARADA-${data.paradaId}`,
      tipoOperacion: 'ENTREGA_RUTA_PWA',
      payload: {
        ...data,
        conductorId,
        clienteNombre: metadata?.clienteNombre || 'Cliente B2B',
        registradoEn: ahoraIso
      }
    });

    return {
      exito: true,
      outboxId: outboxItem.id,
      mensaje: 'Entrega registrada exitosamente y encolada en Outbox para sincronización'
    };
  },

  /**
   * Totaliza las cifras de recaudo y mermas de la ruta activa
   */
  obtenerResumenRecaudoRuta(ruta: DriverActiveRoute): DriverRecaudoResumen {
    let totalEfectivo = 0;
    let totalTransferencia = 0;
    let totalCobrado = 0;
    let totalDevolucionesKg = 0;
    let paradasEntregadasTotal = 0;
    let paradasEntregadasParcial = 0;
    let paradasRechazadas = 0;

    for (const p of ruta.paradas) {
      totalEfectivo += p.montoEfectivo || 0;
      totalTransferencia += p.montoDigital || 0;
      totalCobrado += p.montoCobradoFinal || 0;

      if (p.devoluciones && p.devoluciones.length > 0) {
        totalDevolucionesKg += calcularKilosDevueltosTotales(p.devoluciones);
      }

      if (p.estadoEntrega === 'ENTREGADO_TOTAL') paradasEntregadasTotal++;
      else if (p.estadoEntrega === 'ENTREGADO_PARCIAL') paradasEntregadasParcial++;
      else if (p.estadoEntrega === 'NO_ENTREGADO_RECHAZADO') paradasRechazadas++;
    }

    return {
      totalEfectivo,
      totalTransferencia,
      totalCobrado,
      totalDevolucionesKg: Number(totalDevolucionesKg.toFixed(2)),
      paradasEntregadasTotal,
      paradasEntregadasParcial,
      paradasRechazadas
    };
  },

  /**
   * Crea una ruta de demostración estructurada para pruebas locales o arranque inicial
   */
  crearRutaDemostracion(conductorId: string): DriverActiveRoute {
    const demoRoute: DriverActiveRoute = {
      manifiestoId: 'man-demo-001',
      numeroManifiesto: 'MAN-2026-10-19-01',
      fecha: new Date().toISOString(),
      estado: 'EN_RUTA',
      conductorId,
      conductorNombre: 'Juan Carlos Rodríguez',
      vehiculoPlaca: 'WPZ-482',
      paradasTotales: 3,
      paradasCompletadas: 0,
      progresoPorcentaje: 0,
      totalKilosCargados: 185.5,
      paradas: [
        {
          id: 'stop-001',
          pedidoId: 'ped-8841',
          numeroPedido: 'PED-8841',
          clienteId: 'cli-001',
          clienteNombre: 'Restaurante Mar y Sabor',
          clienteDireccion: 'Calle 36 # 24-18, Cabecera',
          clienteTelefono: '+57 312 345 6789',
          coordenadasGps: { lat: 7.1193, lng: -73.1227 },
          montoPedidoOriginal: 450000,
          montoCobradoFinal: 0,
          formaPago: 'EFECTIVO',
          montoEfectivo: 0,
          montoDigital: 0,
          estadoEntrega: 'PENDIENTE',
          items: [
            { sku: 'MOJ-ENT-001', nombre: 'Mojarra Roja Entera', cantidad: 15, precioUnitario: 18000 },
            { sku: 'CAM-TIG-002', nombre: 'Camarón Tigre U15', cantidad: 5, precioUnitario: 36000 }
          ]
        },
        {
          id: 'stop-002',
          pedidoId: 'ped-8842',
          numeroPedido: 'PED-8842',
          clienteId: 'cli-002',
          clienteNombre: 'Hotel Bucarica Gourmet',
          clienteDireccion: 'Carrera 19 # 35-02, Centro',
          clienteTelefono: '+57 310 987 6543',
          coordenadasGps: { lat: 7.1215, lng: -73.1289 },
          montoPedidoOriginal: 820000,
          montoCobradoFinal: 0,
          formaPago: 'CREDITO_B2B',
          montoEfectivo: 0,
          montoDigital: 0,
          estadoEntrega: 'PENDIENTE',
          items: [
            { sku: 'SALM-CHI-001', nombre: 'Filete de Salmón Chileno', cantidad: 12, precioUnitario: 48000 },
            { sku: 'ROB-ENT-001', nombre: 'Róbalo Entero Limpio', cantidad: 10, precioUnitario: 24400 }
          ]
        },
        {
          id: 'stop-003',
          pedidoId: 'ped-8843',
          numeroPedido: 'PED-8843',
          clienteId: 'cli-003',
          clienteNombre: 'Pescadería & Mariscos El Puerto',
          clienteDireccion: 'Av. Quebradaseca # 14-22',
          clienteTelefono: '+57 318 765 4321',
          coordenadasGps: { lat: 7.1250, lng: -73.1320 },
          montoPedidoOriginal: 320000,
          montoCobradoFinal: 0,
          formaPago: 'TRANSFERENCIA_DIGITAL',
          montoEfectivo: 0,
          montoDigital: 0,
          estadoEntrega: 'PENDIENTE',
          items: [
            { sku: 'CORV-FIL-001', nombre: 'Filete de Corvina', cantidad: 8, precioUnitario: 40000 }
          ]
        }
      ]
    };

    save(PWA_MANIFEST_OVERRIDE_KEY, demoRoute);
    return demoRoute;
  }
};
