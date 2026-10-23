/**
 * ============================================================================
 * LA PEZCADERIA ERP — SERVICIO DE NEGOCIO: PORTAL B2B HORECA
 * ============================================================================
 * Orquestador de catálogo personalizado por cliente, límites y validaciones
 * de cupo de crédito, pedidos con Catch Weight y motor de compras recurrentes.
 */

import { load, save } from './localDb';
import {
  CreateB2BOrderInputSchema,
  B2BRecurringTemplateSchema,
} from '../../packages/validation-schemas/src/b2bCustomerPortal.schema';
import type {
  B2BCustomerProfile,
  B2BCatalogProductItem,
  B2BOrderRecord,
  B2BCreditStatus,
  B2BRecurringTemplate,
  CreateB2BOrderInput,
  B2BDeliverySchedule,
  B2BCartItem,
  B2BProductCut,
  B2BPackaging,
} from '../types/b2bCustomerPortal.types';

// Clientes semilla de respaldo para el canal HORECA
const DEFAULT_HORECA_CLIENTS: B2BCustomerProfile[] = [
  {
    id: 'cli-restaurante-mar',
    razonSocial: 'Restaurante Mar Gourmet S.A.S.',
    nombreComercial: 'Mar Gourmet',
    nit: '900123456-7',
    tipoPrecio: 'RESTAURANTE',
    cupoCreditoCop: 5000000,
    saldoCarteraPendienteCop: 1200000,
    cupoDisponibleCop: 3800000,
    plazoDiasPago: 15,
    direccionPrincipal: 'Calle 93 # 12-45, Bogotá',
    sucursales: [
      {
        id: 'suc-mar-norte',
        nombre: 'Sede Parque 93',
        direccion: 'Calle 93 # 12-45, Bogotá',
        telefono: '3109876543',
        ciudad: 'Bogotá',
      },
      {
        id: 'suc-mar-usaquen',
        nombre: 'Sede Usaquén',
        direccion: 'Carrera 6 # 119-14, Bogotá',
        telefono: '3112345678',
        ciudad: 'Bogotá',
      },
    ],
    activo: true,
  },
  {
    id: 'cli-hotel-grand',
    razonSocial: 'Grand Hotel & Suites Bogotá S.A.S.',
    nombreComercial: 'Grand Hotel',
    nit: '800987654-3',
    tipoPrecio: 'MAYORISTA',
    cupoCreditoCop: 10000000,
    saldoCarteraPendienteCop: 4500000,
    cupoDisponibleCop: 5500000,
    plazoDiasPago: 30,
    direccionPrincipal: 'Carrera 7 # 72-40, Bogotá',
    sucursales: [
      {
        id: 'suc-hotel-central',
        nombre: 'Cocina Central & Buffet',
        direccion: 'Carrera 7 # 72-40, Bogotá',
        telefono: '3205556677',
        ciudad: 'Bogotá',
      },
    ],
    activo: true,
  },
  {
    id: 'cli-cevicheria-muelle',
    razonSocial: 'Cevichería El Muelle del Pacífico',
    nombreComercial: 'El Muelle',
    nit: '901234567-8',
    tipoPrecio: 'RESTAURANTE',
    cupoCreditoCop: 2000000,
    saldoCarteraPendienteCop: 1950000,
    cupoDisponibleCop: 50000, // En alerta de sobregiro
    plazoDiasPago: 8,
    direccionPrincipal: 'Carrera 15 # 85-30, Bogotá',
    sucursales: [
      {
        id: 'suc-muelle-1',
        nombre: 'Local Zona Rosa',
        direccion: 'Carrera 15 # 85-30, Bogotá',
        ciudad: 'Bogotá',
      },
    ],
    activo: true,
  },
];

// Catálogo base de pescados y mariscos con calibres y cortes
const DEFAULT_PRODUCTS_CATALOG = [
  {
    productoId: 'prod-salmon-noruego',
    sku: 'SALM-NOR-01',
    nombre: 'Salmón Noruego Premium',
    especie: 'Salmo salar',
    categoria: 'Pescados Importados',
    precioBaseCop: 75000,
    modalidadVentaDefault: 'KILOGRAMOS_ESTIMADOS' as const,
    cortesDisponibles: [
      'FILETE_CON_PIEL',
      'FILETE_SIN_PIEL',
      'RODAJAS',
      'PORCIONES_CALIBRADAS',
      'ENTERO_EVISCERADO',
    ] as B2BProductCut[],
    empaquesDisponibles: [
      'CAJA_TERMICA_HIELO',
      'BOLSA_VACIO',
      'CANASTILLA_RETORNABLE',
    ] as B2BPackaging[],
    stockDisponibleKg: 120,
    origen: 'Noruega',
  },
  {
    productoId: 'prod-trucha-arcoiris',
    sku: 'TRUCH-ARC-01',
    nombre: 'Trucha Arcoiris Mariposa',
    especie: 'Oncorhynchus mykiss',
    categoria: 'Pescados Nacionales',
    precioBaseCop: 32000,
    modalidadVentaDefault: 'PIEZAS_FIJAS' as const,
    cortesDisponibles: [
      'ENTERO_EVISCERADO',
      'FILETE_CON_PIEL',
      'FILETE_SIN_PIEL',
    ] as B2BProductCut[],
    empaquesDisponibles: [
      'CAJA_TERMICA_HIELO',
      'BOLSA_VACIO',
    ] as B2BPackaging[],
    stockDisponibleKg: 85,
    stockDisponiblePiezas: 170,
    origen: 'Antioquia (Aguas Frías)',
  },
  {
    productoId: 'prod-robalo-filete',
    sku: 'ROB-FIL-01',
    nombre: 'Filete de Róbalo Blanco del Pacífico',
    especie: 'Centropomus undecimalis',
    categoria: 'Pescados Blancos',
    precioBaseCop: 58000,
    modalidadVentaDefault: 'KILOGRAMOS_ESTIMADOS' as const,
    cortesDisponibles: [
      'FILETE_SIN_PIEL',
      'PORCIONES_CALIBRADAS',
    ] as B2BProductCut[],
    empaquesDisponibles: [
      'CAJA_TERMICA_HIELO',
      'BOLSA_VACIO',
    ] as B2BPackaging[],
    stockDisponibleKg: 45,
    origen: 'Buenaventura (Pacífico)',
  },
  {
    productoId: 'prod-camaron-tigre',
    sku: 'CAM-TIG-U15',
    nombre: 'Camarón Tigre Gigante U15 Desvenado',
    especie: 'Penaeus monodon',
    categoria: 'Mariscos & Crustáceos',
    precioBaseCop: 62000,
    modalidadVentaDefault: 'KILOGRAMOS_ESTIMADOS' as const,
    cortesDisponibles: [
      'ENTERO_FRESCO',
      'OTRO_ESPECIAL',
    ] as B2BProductCut[],
    empaquesDisponibles: [
      'BOLSA_VACIO',
      'CAJA_TERMICA_HIELO',
    ] as B2BPackaging[],
    stockDisponibleKg: 60,
    origen: 'Tumaco (Cultivo Sostenible)',
  },
  {
    productoId: 'prod-atun-aleta-amarilla',
    sku: 'ATUN-AA-01',
    nombre: 'Lomo de Atún Aleta Amarilla Grado Sashimi',
    especie: 'Thunnus albacares',
    categoria: 'Atunes & Pelágicos',
    precioBaseCop: 82000,
    modalidadVentaDefault: 'KILOGRAMOS_ESTIMADOS' as const,
    cortesDisponibles: [
      'FILETE_SIN_PIEL',
      'PORCIONES_CALIBRADAS',
      'RODAJAS',
    ] as B2BProductCut[],
    empaquesDisponibles: [
      'BOLSA_VACIO',
      'CAJA_TERMICA_HIELO',
    ] as B2BPackaging[],
    stockDisponibleKg: 35,
    origen: 'Bahía Solano',
  },
];

export const b2bCustomerPortalService = {
  /**
   * Obtiene la lista de todos los clientes HORECA habilitados en el ERP.
   */
  obtenerClientesHoreca(): B2BCustomerProfile[] {
    const guardados = load<B2BCustomerProfile[]>('clientes', []);
    if (guardados && guardados.length > 0) {
      // Filtrar clientes comerciales o mapear con perfil HORECA
      return guardados.map((c: any) => ({
        id: c.id,
        razonSocial: c.nombre || c.razonSocial,
        nombreComercial: c.nombreComercial || c.nombre,
        nit: c.identificacion || c.nit || '900000000-1',
        tipoPrecio: c.tipoPrecio || 'RESTAURANTE',
        cupoCreditoCop: c.cupoCredito ?? 3000000,
        saldoCarteraPendienteCop: c.saldoCarteraPendienteCop ?? 0,
        cupoDisponibleCop: (c.cupoCredito ?? 3000000) - (c.saldoCarteraPendienteCop ?? 0),
        plazoDiasPago: c.plazoDiasPago ?? 15,
        direccionPrincipal: c.direccion || 'Dirección Principal',
        sucursales: c.sucursales || [
          {
            id: `suc-${c.id}-1`,
            nombre: 'Sede Principal',
            direccion: c.direccion || 'Dirección Principal',
            ciudad: c.ciudad || 'Bogotá',
          },
        ],
        activo: c.activo !== false,
      }));
    }
    return DEFAULT_HORECA_CLIENTS;
  },

  /**
   * Obtiene el perfil de un cliente HORECA por su ID.
   */
  obtenerPerfilCliente(clienteId: string): B2BCustomerProfile | null {
    const clientes = this.obtenerClientesHoreca();
    return clientes.find((c) => c.id === clienteId) || null;
  },

  /**
   * Obtiene el catálogo de productos con precios preferenciales calculados
   * según el tipo de cliente (RESTAURANTE: -8%, MAYORISTA: -15%, ESPECIAL: -20%).
   */
  obtenerCatalogoCliente(clienteId: string): B2BCatalogProductItem[] {
    const cliente = this.obtenerPerfilCliente(clienteId);
    const tipoPrecio = cliente?.tipoPrecio || 'RESTAURANTE';

    // Factor de descuento según tipo de precio
    let factorPrecio = 1.0;
    if (tipoPrecio === 'RESTAURANTE') factorPrecio = 0.92;
    else if (tipoPrecio === 'MAYORISTA') factorPrecio = 0.85;
    else if (tipoPrecio === 'ESPECIAL') factorPrecio = 0.80;

    return DEFAULT_PRODUCTS_CATALOG.map((p) => {
      const precioPactado = Math.round(p.precioBaseCop * factorPrecio);
      return {
        ...p,
        precioPactadoCop: precioPactado,
      };
    });
  },

  /**
   * Obtiene el balance financiero y estado de cupo de crédito del cliente.
   */
  obtenerEstadoCartera(clienteId: string): B2BCreditStatus {
    const cliente = this.obtenerPerfilCliente(clienteId);
    const cupoTotal = cliente?.cupoCreditoCop || 0;
    const saldoPendiente = cliente?.saldoCarteraPendienteCop || 0;
    const cupoDisponible = Math.max(0, cupoTotal - saldoPendiente);

    let estadoSemaforo: 'AL_DIA' | 'EN_ALERTA' | 'BLOQUEADO_MORA' = 'AL_DIA';
    if (cupoTotal > 0 && cupoDisponible / cupoTotal < 0.15) {
      estadoSemaforo = 'EN_ALERTA';
    }
    if (cupoDisponible <= 0 && cupoTotal > 0) {
      estadoSemaforo = 'BLOQUEADO_MORA';
    }

    return {
      cupoTotalCop: cupoTotal,
      saldoPendienteCop: saldoPendiente,
      cupoDisponibleCop: cupoDisponible,
      estadoSemaforo,
      facturasPendientesCount: saldoPendiente > 0 ? 2 : 0,
      diasPromedioPago: cliente?.plazoDiasPago || 15,
    };
  },

  /**
   * Crea un pedido B2B formal, aplicando validación Zod y bifurcación de cartera:
   * Si excede cupo -> 'PENDIENTE_APROBACION_CARTERA'.
   * Si cumple cupo -> 'CREADO' (inyección directa a Kanban de Alistamiento).
   */
  crearPedidoB2B(
    input: CreateB2BOrderInput
  ): { success: boolean; data?: B2BOrderRecord; error?: string } {
    // 1. Validación de esquema con Zod
    const validacion = CreateB2BOrderInputSchema.safeParse(input);
    if (!validacion.success) {
      const errorMsg = validacion.error.errors.map((e) => e.message).join(', ');
      return { success: false, error: errorMsg };
    }

    const data = validacion.data;

    // 2. Cálculo de subtotales por línea y total estimado
    const lineasCalculadas: B2BCartItem[] = data.lineas.map((l) => {
      const subtotal = Math.round(l.cantidadSolicitada * l.precioPactadoCop);
      const pesoEstimado = l.modalidadVenta === 'KILOGRAMOS_ESTIMADOS'
        ? l.cantidadSolicitada
        : (l.piezasEstimadas ? l.piezasEstimadas * 0.45 : l.cantidadSolicitada * 0.45);

      return {
        ...l,
        subtotalCop: subtotal,
        pesoEstimadoTotalKg: Math.round(pesoEstimado * 10) / 10,
      };
    });

    const totalEstimado = lineasCalculadas.reduce((acc, l) => acc + l.subtotalCop, 0);

    // 3. Validación de cartera y crédito
    const cartera = this.obtenerEstadoCartera(data.clienteId);
    let estadoInicial: B2BOrderRecord['estado'] = 'CREADO';

    if (data.formaPago === 'CREDITO_B2B' && totalEstimado > cartera.cupoDisponibleCop) {
      // Excedió cupo -> Pasa a cola de aprobación de crédito
      estadoInicial = 'PENDIENTE_APROBACION_CARTERA';
    }

    // 4. Creación del registro oficial de orden
    const consecutivo = Date.now().toString().slice(-4);
    const nuevoPedido: B2BOrderRecord = {
      id: `b2b-order-${Date.now()}`,
      numeroPedido: `PED-B2B-${consecutivo}`,
      clienteId: data.clienteId,
      clienteNombre: data.clienteNombre,
      nit: data.nit,
      sucursalEntrega: data.sucursalEntrega,
      direccionEntrega: data.direccionEntrega,
      telefonoContacto: data.telefonoContacto,
      fechaCreacion: new Date().toISOString(),
      fechaRequeridaEntrega: data.fechaRequeridaEntrega,
      jornadaRequerida: data.jornadaRequerida,
      formaPago: data.formaPago,
      estado: estadoInicial,
      lineas: lineasCalculadas,
      subtotalEstimadoCop: totalEstimado,
      ivaEstimadoCop: 0, // Pescados y mariscos frescos exentos de IVA en Colombia
      totalEstimadoCop: totalEstimado,
      instruccionesCocina: data.instruccionesCocina,
    };

    // 5. Persistencia en historial de órdenes B2B
    const ordenesExistentes = load<B2BOrderRecord[]>('b2b_orders', []);
    save('b2b_orders', [nuevoPedido, ...ordenesExistentes]);

    // 6. Inyección en el Tablero Kanban de Bodega (pezcaderia_quotations) si está aprobado
    if (estadoInicial === 'CREADO') {
      const quotations = load<any[]>('quotations', []);
      const quotationFormat = {
        id: nuevoPedido.id,
        numeroPedido: nuevoPedido.numeroPedido,
        clienteId: nuevoPedido.clienteId,
        cliente: nuevoPedido.clienteNombre,
        clienteNombre: nuevoPedido.clienteNombre,
        fecha: new Date().toLocaleDateString('es-CO'),
        estado: 'CREADO',
        total: nuevoPedido.totalEstimadoCop,
        totalFinal: nuevoPedido.totalEstimadoCop,
        subtotal: nuevoPedido.subtotalEstimadoCop,
        lineas: lineasCalculadas.map((l, idx) => ({
          id: `line-${nuevoPedido.id}-${idx}`,
          productoId: l.productoId,
          nombre: l.nombre,
          modalidadVenta: l.modalidadVenta === 'PIEZAS_FIJAS' ? 'CATCH_WEIGHT_PIEZAS' : 'CATCH_WEIGHT_KILOS',
          piezasSolicitadas: l.piezasEstimadas || 1,
          cantidadSolicitada: l.cantidadSolicitada,
          pesoEstimado: l.pesoEstimadoTotalKg,
          precioPactado: l.precioPactadoCop,
          totalLinea: l.subtotalCop,
          corte: l.corte,
          empaque: l.empaque,
        })),
      };
      save('quotations', [quotationFormat, ...quotations]);
    }

    return { success: true, data: nuevoPedido };
  },

  /**
   * Obtiene el historial de pedidos de un cliente HORECA.
   */
  obtenerHistorialPedidos(clienteId: string): B2BOrderRecord[] {
    const ordenes = load<B2BOrderRecord[]>('b2b_orders', []);
    return ordenes.filter((o) => o.clienteId === clienteId);
  },

  /**
   * Obtiene las plantillas de pedidos recurrentes configuradas para el cliente.
   */
  obtenerPlantillasRecurrentes(clienteId: string): B2BRecurringTemplate[] {
    const templates = load<B2BRecurringTemplate[]>('b2b_recurring_templates', []);
    const delCliente = templates.filter((t) => t.clienteId === clienteId);

    if (delCliente.length > 0) return delCliente;

    // Plantilla semilla predeterminada para demostración inmediata
    const plantillaSemilla: B2BRecurringTemplate = {
      id: `tmpl-${clienteId}-1`,
      clienteId,
      nombrePlantilla: 'Suministro Pescados de Semana (Martes y Jueves)',
      diasSemana: ['MARTES', 'JUEVES'],
      jornadaEntrega: 'MANANA',
      activa: true,
      lineas: [
        {
          productoId: 'prod-salmon-noruego',
          sku: 'SALM-NOR-01',
          nombre: 'Salmón Noruego Premium',
          corte: 'FILETE_CON_PIEL',
          empaque: 'CAJA_TERMICA_HIELO',
          modalidadVenta: 'KILOGRAMOS_ESTIMADOS',
          cantidadSolicitada: 15,
          piezasEstimadas: 5,
          precioPactadoCop: 69000,
        },
        {
          productoId: 'prod-trucha-arcoiris',
          sku: 'TRUCH-ARC-01',
          nombre: 'Trucha Arcoiris Mariposa',
          corte: 'ENTERO_EVISCERADO',
          empaque: 'CAJA_TERMICA_HIELO',
          modalidadVenta: 'PIEZAS_FIJAS',
          cantidadSolicitada: 20,
          piezasEstimadas: 20,
          precioPactadoCop: 29000,
        },
      ],
    };

    save('b2b_recurring_templates', [plantillaSemilla]);
    return [plantillaSemilla];
  },

  /**
   * Guarda o actualiza una plantilla de compra recurrente.
   */
  guardarPlantillaRecurrente(
    template: B2BRecurringTemplate
  ): { success: boolean; data?: B2BRecurringTemplate; error?: string } {
    const validacion = B2BRecurringTemplateSchema.safeParse(template);
    if (!validacion.success) {
      return { success: false, error: validacion.error.errors.map((e) => e.message).join(', ') };
    }

    const data = validacion.data;
    const id = data.id || `tmpl-${Date.now()}`;
    const plantillaCompleta: B2BRecurringTemplate = { ...data, id };

    const existentes = load<B2BRecurringTemplate[]>('b2b_recurring_templates', []);
    const filtradas = existentes.filter((t) => t.id !== id);
    save('b2b_recurring_templates', [plantillaCompleta, ...filtradas]);

    return { success: true, data: plantillaCompleta };
  },

  /**
   * Dispara una re-orden instantánea en 1 clic desde una plantilla guardada.
   */
  reordenarDesdePlantilla(
    plantillaId: string,
    fechaEntrega?: string,
    jornada?: B2BDeliverySchedule
  ): { success: boolean; data?: B2BOrderRecord; error?: string } {
    const templates = load<B2BRecurringTemplate[]>('b2b_recurring_templates', []);
    const plantilla = templates.find((t) => t.id === plantillaId);

    if (!plantilla) {
      return { success: false, error: 'Plantilla de compra no encontrada' };
    }

    const cliente = this.obtenerPerfilCliente(plantilla.clienteId);
    if (!cliente) {
      return { success: false, error: 'Cliente asociado a la plantilla no encontrado' };
    }

    const fechaRequerida = fechaEntrega || new Date().toISOString().split('T')[0];
    const sucursal = cliente.sucursales[0];

    return this.crearPedidoB2B({
      clienteId: cliente.id,
      clienteNombre: cliente.razonSocial,
      nit: cliente.nit,
      sucursalEntrega: sucursal?.nombre || 'Sede Principal',
      direccionEntrega: sucursal?.direccion || cliente.direccionPrincipal,
      telefonoContacto: sucursal?.telefono,
      fechaRequeridaEntrega: fechaRequerida,
      jornadaRequerida: jornada || (plantilla.jornadaEntrega as any) || 'MANANA',
      formaPago: 'CREDITO_B2B',
      instruccionesCocina: `Generado automáticamente desde plantilla: ${plantilla.nombrePlantilla}`,
      lineas: plantilla.lineas,
    });
  },

  /**
   * Obtiene la trazabilidad detallada de un pedido, incluyendo su estado WMS y remisión.
   */
  obtenerTrazabilidadPedido(pedidoId: string): B2BOrderRecord | undefined {
    const ordenes = load<B2BOrderRecord[]>('b2b_orders', []);
    return ordenes.find((o) => o.id === pedidoId);
  },
};
