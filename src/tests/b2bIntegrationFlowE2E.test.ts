import { describe, it, expect, beforeEach, vi } from 'vitest';
import { b2bIntegrationService } from '../services/b2bIntegrationService';
import { useOrderStore, setOrderDataService } from '../store/useOrderStore';
import { useEventStore } from '../store/useEventStore';
import { Cotizacion, Pedido } from '../types/orders.types';

describe('B2B End-to-End Complete Flow Suite (SPEC-015)', () => {
  const dummyQuote: Cotizacion = {
    id: 'quote-e2e-001',
    numeroCotizacion: 'COT-E2E-2026-001',
    clienteId: 'cli-gourmet-santander',
    clienteNombre: 'Restaurante Gourmet San Gil',
    cliente: { id: 'cli-gourmet-santander', nombre: 'Restaurante Gourmet San Gil' } as any,
    fecha: '2026-10-15T08:00:00.000Z',
    estado: 'APROBADA',
    vendedorId: 'vend-camilo-01',
    vendedorNombre: 'Camilo Torres (Ejecutivo Senior)',
    formaPago: 'CREDITO',
    plazoCreditoDias: 30,
    lineas: [
      {
        id: 'line-e2e-1',
        productoId: 'prod-salmon-chile',
        nombre: 'Salmón Premium Entero Eviscerado',
        sku: 'SAL-CHL-001',
        cantidadSolicitada: 40.0,
        pesoNominalKg: 40.0,
        piezasSolicitadas: 8,
        calibreMinGramos: 4500,
        calibreMaxGramos: 5500,
        precioPactado: 45000,
        precioUnitario: 45000,
        subtotal: 1800000,
        modalidadVenta: 'CATCH_WEIGHT_PIEZAS',
        corte: 'ENTERO_EVISCERADO',
        empaque: 'CANASTILLA_PLASTICA',
      },
      {
        id: 'line-e2e-2',
        productoId: 'prod-langostino-u15',
        nombre: 'Langostino Tigre U-15 Congelado',
        sku: 'LNG-TIG-U15',
        cantidadSolicitada: 15.0,
        pesoNominalKg: 15.0,
        precioPactado: 70000,
        precioUnitario: 70000,
        subtotal: 1050000,
        modalidadVenta: 'PESO_DIRECTO',
        empaque: 'MASTER_BOX',
      },
    ],
    subtotal: 2850000,
    ivaTotal: 0,
    total: 2850000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    setOrderDataService({
      getAll: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue(undefined),
    } as any);

    useOrderStore.setState({
      quotations: [JSON.parse(JSON.stringify(dummyQuote))],
      ventas: [],
    });

    useEventStore.setState({ events: [] });
  });

  it('debe ejecutar el ciclo de vida completo de 3 actores: Cotización -> Pedido -> Alistamiento Báscula -> Despacho en Ruta -> Entrega en Sitio -> Liquidación', async () => {
    // -------------------------------------------------------------
    // ETAPA 1: COMERCIAL (Actor 1: Vendedor)
    // -------------------------------------------------------------
    const pedidoCreado = await b2bIntegrationService.convertirCotizacionAPedido({
      cotizacionId: dummyQuote.id,
      vendedorId: 'vend-camilo-01',
      vendedorNombre: 'Camilo Torres (Ejecutivo Senior)',
      verificarCupo: false, // Cupo habilitado
      esGranContribuyente: true,
    });

    expect(pedidoCreado).toBeDefined();
    expect(pedidoCreado.estado).toBe('CREADO');
    expect(pedidoCreado.vendedorId).toBe('vend-camilo-01');
    expect(pedidoCreado.vendedorNombre).toBe('Camilo Torres (Ejecutivo Senior)');
    expect(pedidoCreado.cotizacionIdOriginal).toBe(dummyQuote.id);
    expect(pedidoCreado.retefuenteValor).toBeGreaterThan(0); // NIIF retenido
    expect(pedidoCreado.reteicaValor).toBeGreaterThan(0);

    // -------------------------------------------------------------
    // ETAPA 2: BODEGA WMS - ALISTAMIENTO (Actor 2: Operario Alistador)
    // -------------------------------------------------------------
    const pedidoAlistando = await b2bIntegrationService.iniciarAlistamiento({
      pedidoId: pedidoCreado.id,
      operarioId: 'oper-pedro-wms',
      operarioNombre: 'Pedro Bodeguero (Cuarto Frío)',
    });

    expect(pedidoAlistando.estado).toBe('EN_ALISTAMIENTO');
    expect(pedidoAlistando.operarioAlistadorId).toBe('oper-pedro-wms');
    expect(pedidoAlistando.horaInicioAlistamiento).toBeDefined();

    // Pesaje Línea 1: Salmón con Catch Weight en tolerancia (+2.5%)
    // Nominal: 40.0 kg -> Real: 41.0 kg (En tolerancia ±5%)
    const pesajeLinea1 = await b2bIntegrationService.registrarPesajeLinea({
      pedidoId: pedidoCreado.id,
      productoId: 'prod-salmon-chile',
      pesoRealKg: 41.0,
      piezasAlistadas: 8,
      temperaturaC: 1.8,
      loteFefo: 'LOT-SAL-2026-10-15',
    });
    expect(pesajeLinea1.estado).toBe('EN_ALISTAMIENTO');

    // Pesaje Línea 2: Langostinos
    // Nominal: 15.0 kg -> Real: 14.8 kg (-1.33% en tolerancia ±5%)
    const pesajeLinea2 = await b2bIntegrationService.registrarPesajeLinea({
      pedidoId: pedidoCreado.id,
      productoId: 'prod-langostino-u15',
      pesoRealKg: 14.8,
      temperaturaC: -19.5,
      loteFefo: 'LOT-LNG-2026-09-30',
    });
    expect(pesajeLinea2.estado).toBe('EN_ALISTAMIENTO');

    // Finalizar Alistamiento y emitir Remisión WMS con QR y Precinto
    const pedidoListo = await b2bIntegrationService.finalizarAlistamiento({
      pedidoId: pedidoCreado.id,
      precintoCanastilla: 'SEAL-B2B-88492',
    });

    expect(pedidoListo.estado).toBe('LISTO');
    expect(pedidoListo.precintoCanastilla).toBe('SEAL-B2B-88492');
    expect(pedidoListo.remisionId).toBeDefined();
    expect(pedidoListo.tokenQrRemision).toBeDefined();
    expect(pedidoListo.horaFinAlistamiento).toBeDefined();

    // -------------------------------------------------------------
    // ETAPA 3: DESPACHO Y RUTAS (Actor 3: Conductor Repartidor)
    // -------------------------------------------------------------
    // Despacho del Manifiesto con Check-in térmico del furgón a 2.5°C (<= 4°C)
    const despachoRes = await b2bIntegrationService.crearYDespacharManifiesto({
      conductorId: 'cond-hernan-77',
      conductorNombre: 'Hernán Gómez (Conductor Ruta San Gil)',
      conductorTelefono: '3109998877',
      vehiculoPlaca: 'XTR-554',
      zonaRuta: 'Ruta Sur - Santander',
      pedidosIds: [pedidoListo.id],
      kilometrajeInicial: 45200,
      temperaturaFurgonCelsius: 2.5,
    });

    const manifiesto = despachoRes.manifiesto;
    expect(manifiesto.estado).toBe('EN_RUTA');
    expect(manifiesto.temperaturaSalidaCelsius).toBe(2.5);

    // El pedido debe haber pasado a EN_RUTA con el ID del conductor
    const pedidoEnRuta = useOrderStore.getState().ventas.find((v) => v.id === pedidoListo.id);
    expect(pedidoEnRuta?.estado).toBe('EN_RUTA');
    expect(pedidoEnRuta?.conductorRepartidorId).toBe('cond-hernan-77');
    expect(pedidoEnRuta?.manifiestoRutaId).toBe(manifiesto.id);

    // -------------------------------------------------------------
    // ETAPA 4: ENTREGA EN SITIO CON FIRMA DIGITAL Y DEVOLUCIÓN PARCIAL
    // -------------------------------------------------------------
    // El cliente recibe el salmón completo, pero devuelve 4.8 kg de langostino por rotura de empaque
    const montoCalculadoTotal = pedidoEnRuta?.subtotalNeto || pedidoEnRuta?.totalFinal || 2500000;
    const valorRechazado = 4.8 * 70000; // 336,000 COP
    const valorCobradoEfectivo = montoCalculadoTotal - valorRechazado;

    const entregaRes = await b2bIntegrationService.registrarEntregaEnSitio({
      manifiestoId: manifiesto.id,
      pedidoId: pedidoListo.id,
      firmaClienteUrl: 'data:image/svg+xml;base64,PHN2ZyBmaXJtYV9kaWdpdGFsX2NsaWVudGU+PC9zdmc+',
      formaPago: 'EFECTIVO',
      montoCobradoEfectivo: valorCobradoEfectivo,
      montoCobradoDigital: 0,
      devoluciones: [
        {
          productoId: 'prod-langostino-u15',
          cantidadDevueltaKg: 4.8,
          motivoRechazo: 'CADENA_FRIO',
          observaciones: 'Roto el frío en descarga: 7.2°C',
        },
      ],
      observaciones: 'Recepción conforme en salmón. Devolución de 4.8 kg langostino a cuarentena.',
    });

    expect(entregaRes).toBeDefined();

    const pedidoEntregado = useOrderStore.getState().ventas.find((v) => v.id === pedidoListo.id);
    expect(pedidoEntregado?.estado).toBe('ENTREGADO');
    expect(pedidoEntregado?.firmaClienteUrl).toBe('data:image/svg+xml;base64,PHN2ZyBmaXJtYV9kaWdpdGFsX2NsaWVudGU+PC9zdmc+');
    expect(pedidoEntregado?.horaEntregaEfectiva).toBeDefined();

    // -------------------------------------------------------------
    // ETAPA 5: LIQUIDACIÓN DE MANIFIESTO EN TESORERÍA
    // -------------------------------------------------------------
    const liquidacionRes = await b2bIntegrationService.liquidarManifiestoRuta({
      manifiestoId: manifiesto.id,
      odometroFinalKm: 45310, // 110 km recorridos
      arqueoEfectivoRecibido: valorCobradoEfectivo,
      cajeroReceptorId: 'caja-tesoreria-central',
    });

    expect(liquidacionRes).toBeDefined();
    expect(liquidacionRes.estado).toBe('LIQUIDADA');

    // -------------------------------------------------------------
    // AUDITORÍA DE TRAZABILIDAD TRIPARTITA INMUTABLE
    // -------------------------------------------------------------
    const pedidoFinal = useOrderStore.getState().ventas.find((v) => v.id === pedidoListo.id);
    expect(pedidoFinal?.vendedorId).toBe('vend-camilo-01');
    expect(pedidoFinal?.operarioAlistadorId).toBe('oper-pedro-wms');
    expect(pedidoFinal?.conductorRepartidorId).toBe('cond-hernan-77');

    // Comprobar eventos en useEventStore
    const eventos = useEventStore.getState().events;
    expect(eventos.some((e) => e.metadata?.evento === 'b2b_pedido_creado_desde_cotizacion')).toBe(true);
    expect(eventos.some((e) => e.metadata?.evento === 'b2b_alistamiento_iniciado')).toBe(true);
    expect(eventos.some((e) => e.metadata?.evento === 'b2b_pesaje_linea_registrado')).toBe(true);
    expect(eventos.some((e) => e.metadata?.evento === 'b2b_alistamiento_completado')).toBe(true);
    expect(eventos.some((e) => e.metadata?.evento === 'b2b_pedidos_despachados_en_ruta')).toBe(true);
    expect(eventos.some((e) => e.metadata?.evento === 'b2b_entrega_en_sitio_registrada')).toBe(true);
    expect(eventos.some((e) => e.metadata?.evento === 'b2b_ruta_liquidada')).toBe(true);
  });

  it('debe pausar automáticamente el pedido en estado PAUSADO_POR_CREDITO si el cupo es insuficiente', async () => {
    const quoteCreditoExcedido: Cotizacion = {
      ...dummyQuote,
      id: 'quote-credito-excedido',
      total: 15000000,
    };

    useOrderStore.setState({
      quotations: [quoteCreditoExcedido],
      ventas: [],
    });

    const pedido = await b2bIntegrationService.convertirCotizacionAPedido({
      cotizacionId: 'quote-credito-excedido',
      vendedorId: 'vend-camilo-01',
      formaPago: 'CREDITO',
      verificarCupo: true,
      cliente: {
        id: 'cli-moroso',
        nombre: 'Cliente Sin Cupo',
        identificacion: '900111222',
        tipoIdentificacion: 'NIT',
        tipoPersona: 'JURIDICA',
        ciudad: 'Bucaramanga',
        tipoPrecio: 'RESTAURANTE',
        telefono: '3151112233',
        direccion: 'Calle 36 # 15-20',
        email: 'sin_cupo@restaurante.com',
        cupoCredito: 2000000,
        cupoCreditoUsado: 1950000, // Disponible: 50.000 COP
        isGranContribuyente: false,
        isAutoretenedor: false,
        activo: true,
      },
    });

    expect(pedido.estado).toBe('PAUSADO_POR_CREDITO');
    expect(pedido.observaciones).toContain('PAUSADO POR CUPO DE CRÉDITO');
  });

  it('debe transicionar a PAUSADO si el pesaje en frío excede la tolerancia Catch Weight (±5%) sin forzar aprobación', async () => {
    const pedidoCreado = await b2bIntegrationService.convertirCotizacionAPedido({
      cotizacionId: dummyQuote.id,
      vendedorId: 'vend-camilo-01',
      verificarCupo: false,
    });

    await b2bIntegrationService.iniciarAlistamiento({
      pedidoId: pedidoCreado.id,
      operarioId: 'oper-pedro-wms',
    });

    // Salmón nominal 40.0 kg -> Pesaje real 46.0 kg (+15.0% excede tolerancia ±5%)
    const pedidoPausado = await b2bIntegrationService.registrarPesajeLinea({
      pedidoId: pedidoCreado.id,
      productoId: 'prod-salmon-chile',
      pesoRealKg: 46.0,
      piezasAlistadas: 8,
      temperaturaC: 2.0,
      loteFefo: 'LOT-SAL-EXCESO',
      forzarAprobacionFueraTolerancia: false,
    });

    expect(pedidoPausado.estado).toBe('PAUSADO');
    expect(pedidoPausado.lineas[0].toleranciaAceptada).toBe(false);
  });

  it('debe bloquear el despacho en furgón refrigerado si la temperatura supera 4°C', async () => {
    const pedidoCreado = await b2bIntegrationService.convertirCotizacionAPedido({
      cotizacionId: dummyQuote.id,
      vendedorId: 'vend-camilo-01',
      verificarCupo: false,
    });

    await b2bIntegrationService.iniciarAlistamiento({
      pedidoId: pedidoCreado.id,
      operarioId: 'oper-pedro-wms',
    });

    await b2bIntegrationService.registrarPesajeLinea({
      pedidoId: pedidoCreado.id,
      productoId: 'prod-salmon-chile',
      pesoRealKg: 40.0,
      loteFefo: 'LOT-SAL-OK',
    });

    await b2bIntegrationService.registrarPesajeLinea({
      pedidoId: pedidoCreado.id,
      productoId: 'prod-langostino-u15',
      pesoRealKg: 15.0,
      loteFefo: 'LOT-LNG-OK',
    });

    const pedidoListo = await b2bIntegrationService.finalizarAlistamiento({
      pedidoId: pedidoCreado.id,
      precintoCanastilla: 'SEAL-OK',
    });

    await expect(
      b2bIntegrationService.crearYDespacharManifiesto({
        conductorId: 'cond-01',
        conductorNombre: 'Conductor Test',
        vehiculoPlaca: 'ABC-123',
        zonaRuta: 'Zona Centro',
        pedidosIds: [pedidoListo.id],
        kilometrajeInicial: 10000,
        temperaturaFurgonCelsius: 8.5, // Ruptura de frío
      })
    ).rejects.toThrow('Temperatura del furgón no apta para cadena de frío');
  });

  it('debe exigir obligatoriamente la firma digital del cliente en la entrega en sitio', async () => {
    await expect(
      b2bIntegrationService.registrarEntregaEnSitio({
        manifiestoId: 'manif-dummy',
        pedidoId: 'ped-dummy',
        firmaClienteUrl: '', // Sin firma digital
        formaPago: 'EFECTIVO',
      })
    ).rejects.toThrow('La firma digital del cliente es obligatoria');
  });

  it('debe conciliar cuadre de caja con gastos y registrar diferencia en la liquidación', async () => {
    // 1. Crear y despachar un pedido rápido
    const pedidoCreado = await b2bIntegrationService.convertirCotizacionAPedido({
      cotizacionId: dummyQuote.id,
      vendedorId: 'vend-camilo-01',
      verificarCupo: false,
    });

    await b2bIntegrationService.iniciarAlistamiento({
      pedidoId: pedidoCreado.id,
      operarioId: 'oper-pedro-wms',
    });

    await b2bIntegrationService.registrarPesajeLinea({
      pedidoId: pedidoCreado.id,
      productoId: 'prod-salmon-chile',
      pesoRealKg: 40.0,
      loteFefo: 'LOT-SAL-OK',
    });

    await b2bIntegrationService.registrarPesajeLinea({
      pedidoId: pedidoCreado.id,
      productoId: 'prod-langostino-u15',
      pesoRealKg: 15.0,
      loteFefo: 'LOT-LNG-OK',
    });

    const pedidoListo = await b2bIntegrationService.finalizarAlistamiento({
      pedidoId: pedidoCreado.id,
      precintoCanastilla: 'SEAL-OK-2',
    });

    const despachoRes = await b2bIntegrationService.crearYDespacharManifiesto({
      conductorId: 'cond-02',
      conductorNombre: 'Conductor Liquidador',
      vehiculoPlaca: 'ABC-789',
      zonaRuta: 'Zona Sur',
      pedidosIds: [pedidoListo.id],
      kilometrajeInicial: 20000,
      temperaturaFurgonCelsius: 2.0,
    });

    await b2bIntegrationService.registrarEntregaEnSitio({
      manifiestoId: despachoRes.manifiesto.id,
      pedidoId: pedidoListo.id,
      firmaClienteUrl: 'data:image/svg+xml;base64,mockSignature',
      formaPago: 'EFECTIVO',
      montoCobradoEfectivo: 2850000,
    });

    // Conductor rinde $2.800.000 y presenta gasto de peaje por $50.000 -> Total esperado $2.850.000 (Cuadre Exacto)
    const liquidado = await b2bIntegrationService.liquidarManifiestoRuta({
      manifiestoId: despachoRes.manifiesto.id,
      odometroFinalKm: 20085,
      efectivoFisicoEntregado: 2800000,
      gastos: [
        {
          tipoGasto: 'PEAJE',
          monto: 50000,
          descripcion: 'Peaje Pescadero',
        },
      ],
      liquidadoPor: 'Tesorero Bucaramanga',
    });

    expect(liquidado.estado).toBe('LIQUIDADA');
    expect(liquidado.diferenciaCuadre).toBe(0); // Cuadre perfecto
  });
});
