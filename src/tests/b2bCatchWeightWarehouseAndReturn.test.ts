import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  b2bIntegrationService,
  CrearPedidoVentaExternaInput,
  IniciarAlistamientoInput,
  RegistrarPesajeLineaInput,
  FinalizarAlistamientoInput,
  CrearYDespacharManifiestoInput,
  RegistrarEntregaEnSitioInput,
  LiquidarManifiestoInput,
} from '../services/b2bIntegrationService';
import { useOrderStore, setOrderDataService } from '../store/useOrderStore';
import { useEventStore } from '../store/useEventStore';
import { useClientStore } from '../store/useClientStore';
import { deliveryRouteService } from '../services/deliveryRouteService';
import { Cliente } from '../types/erp.types';
import { validateCalibrePieceWeight, calculateCatchWeightTotal } from '../../packages/validation-schemas/src/b2bDispatch.schema';

describe('TASK-016-06: B2B Catch Weight Warehouse & Return E2E Integration Suite', () => {
  const mockClienteB2B: Cliente = {
    id: 'cli-rest-central-bogota',
    nombre: 'Restaurante Central Bogotá',
    identificacion: '901555444-1',
    tipoIdentificacion: 'NIT',
    tipoPersona: 'JURIDICA',
    direccion: 'Calle 72 # 11-45, Chapinero',
    ciudad: 'Bogotá',
    telefono: '3157778899',
    email: 'chef@restaurante-central.com',
    tipoPrecio: 'RESTAURANTE',
    cupoCredito: 15_000_000,
    cupoCreditoUsado: 2_000_000, // Disponible: 13.000.000 COP
    isGranContribuyente: true,
    isAutoretenedor: false,
    activo: true,
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
      ventas: [],
      quotations: [],
    });

    useClientStore.setState({
      clientes: [mockClienteB2B],
    });

    useEventStore.setState({
      events: [],
      syncQueue: [],
    });
  });

  it('1. Algoritmo Determinista: Valida calibre por pieza y cálculo de total Catch Weight', () => {
    // 5 piezas con peso total 2.450 kg -> 490 g/pieza (dentro de 450 - 500g)
    const validacion = validateCalibrePieceWeight(2.45, 5, 450, 500);
    expect(validacion.isWithinCalibre).toBe(true);
    expect(validacion.pesoPromedioGramos).toBe(490);

    // Si arroja 1.800 kg para 5 piezas -> 360 g/pieza (inferior a 450g)
    const validacionBaja = validateCalibrePieceWeight(1.8, 5, 450, 500);
    expect(validacionBaja.isWithinCalibre).toBe(false);
    expect(validacionBaja.pesoPromedioGramos).toBe(360);
    expect(validacionBaja.motivo).toContain('por debajo del calibre mínimo');

    // Total catch weight exacto
    const total = calculateCatchWeightTotal(2.45, 24000);
    expect(total).toBe(58800);
  });

  it('2. Flujo Completo E2E: Pedido Venta Externa B2B -> Alistamiento WMS -> Báscula -> Remisión QR -> Despacho -> Entrega con Firma Táctil -> Devolución Parcial a CUARENTENA_CALIDAD -> Liquidación', async () => {
    // =========================================================================
    // ETAPA 1: Creación de Pedido Externo B2B bajo la Regla del Niño de 12 Años
    // =========================================================================
    const pedidoInput: CrearPedidoVentaExternaInput = {
      vendedorId: 'vend-carlos-01',
      vendedorNombre: 'Carlos Vendedor',
      clienteId: mockClienteB2B.id,
      clienteNombre: mockClienteB2B.nombre,
      cliente: mockClienteB2B,
      bodegaId: 'BOD-01',
      formaPago: 'CONTADO',
      fechaEntrega: '2026-10-16',
      jornada: 'MANANA',
      tipoEntrega: 'EN_RUTA',
      observaciones: 'Entregar antes de las 11:00 AM para servicio de almuerzo',
      lineas: [
        {
          productoId: 'prod-trucha-arcoiris',
          sku: 'TRU-ENT-001',
          nombre: 'Trucha Arcoíris Entera',
          modalidadVenta: 'CATCH_WEIGHT_PIEZAS',
          cantidadSolicitada: 5, // 5 piezas
          pesoEstimado: 2.375, // Nominal: 5 * 0.475 kg
          precioPactado: 24000,
          calibreMinGramos: 450,
          calibreMaxGramos: 500,
          corte: 'eviscerado',
          empaque: 'canastilla',
        },
      ],
    };

    const pedidoCreado = await b2bIntegrationService.crearPedidoVentaExternaB2B(pedidoInput);

    expect(pedidoCreado).toBeDefined();
    expect(pedidoCreado.id).toBeDefined();
    expect(pedidoCreado.estado).toBe('CREADO');
    expect(pedidoCreado.vendedorId).toBe('vend-carlos-01');
    expect(pedidoCreado.lineas[0].modalidadVenta).toBe('CATCH_WEIGHT_PIEZAS');
    expect(pedidoCreado.lineas[0].calibreMinGramos).toBe(450);
    expect(pedidoCreado.lineas[0].calibreMaxGramos).toBe(500);

    // =========================================================================
    // ETAPA 2: Inicio de Alistamiento en WMS Cuarto Frío
    // =========================================================================
    const inputIniciarAlistamiento: IniciarAlistamientoInput = {
      pedidoId: pedidoCreado.id,
      operarioId: 'oper-wms-01',
      operarioNombre: 'Julián Bodeguero',
    };

    const pedidoEnAlistamiento = await b2bIntegrationService.iniciarAlistamiento(inputIniciarAlistamiento);
    expect(pedidoEnAlistamiento.estado).toBe('EN_ALISTAMIENTO');
    expect(pedidoEnAlistamiento.operarioAlistadorId).toBe('oper-wms-01');

    // =========================================================================
    // ETAPA 3: Conciliación en Báscula de Cuarto Frío (Catch Weight Dual)
    // =========================================================================
    // El operario pesa las 5 truchas: 2.450 kg reales (variación nominal +3.16%, dentro de tolerancia)
    const inputPesaje: RegistrarPesajeLineaInput = {
      pedidoId: pedidoCreado.id,
      productoId: 'prod-trucha-arcoiris',
      pesoRealKg: 2.45,
      piezasAlistadas: 5,
      loteFefo: 'LOTE-FEFO-2026-TRU-001',
      temperaturaC: 2.0,
      toleranciaPorcentaje: 5,
      observaciones: 'Calibre 490g verificado conforme',
    };

    const pedidoPesado = await b2bIntegrationService.registrarPesajeLinea(inputPesaje);
    const lineaPesada = pedidoPesado.lineas[0];

    expect(lineaPesada.pesoReal).toBe(2.45);
    expect(lineaPesada.piezasAlistadas).toBe(5);
    expect(lineaPesada.loteSeleccionado).toBe('LOTE-FEFO-2026-TRU-001');
    expect(lineaPesada.toleranciaAceptada).toBe(true);
    // Subtotal ajustado por el peso real de báscula: 2.45 kg * $24.000 = $58.800
    expect(lineaPesada.subtotalRealAjustado).toBe(58800);
    expect(pedidoPesado.totalFinal).toBe(58800);

    // =========================================================================
    // ETAPA 4: Finalización de Alistamiento, Precinto y Remisión WMS
    // =========================================================================
    const inputFinalizarAlistamiento: FinalizarAlistamientoInput = {
      pedidoId: pedidoCreado.id,
      precintoCanastilla: 'PREC-CAN-998877',
      temperaturaSalidaC: 2.0,
      observaciones: 'Canastilla sellada con precinto de seguridad e inocuidad verificada',
    };

    const pedidoListo = await b2bIntegrationService.finalizarAlistamiento(inputFinalizarAlistamiento);
    expect(pedidoListo.estado).toBe('LISTO');
    expect(pedidoListo.remisionId).toBeDefined();
    expect(pedidoListo.tokenQrRemision).toBeDefined();
    expect(pedidoListo.precintoCanastilla).toBe('PREC-CAN-998877');
    expect(pedidoListo.inventarioDescontado).toBe(true);

    // =========================================================================
    // ETAPA 5: Creación del Manifiesto de Despacho y Salida a Ruta
    // =========================================================================
    const inputDespacho: CrearYDespacharManifiestoInput = {
      conductorId: 'cond-wilson-01',
      conductorNombre: 'Wilson Gómez',
      conductorTelefono: '3109876543',
      vehiculoPlaca: 'TRK-982',
      vehiculoTipo: 'Furgón Refrigerado Hino',
      zonaRuta: 'Zona Gastronómica Chapinero',
      pedidosIds: [pedidoListo.id],
      kilometrajeInicial: 12500,
      temperaturaFurgonCelsius: 2.2, // Conforme <= 4°C
      observaciones: 'Ruta matutina con precintos verificados en muelle',
    };

    const despachoResultado = await b2bIntegrationService.crearYDespacharManifiesto(inputDespacho);
    const { manifiesto } = despachoResultado;

    expect(manifiesto).toBeDefined();
    expect(manifiesto.estado).toBe('EN_RUTA');
    expect(manifiesto.temperaturaSalidaCelsius).toBe(2.2);
    expect(manifiesto.cargaVerificadaEnBodega).toBe(true);

    // Verificar que el pedido en el store transicionó a EN_RUTA
    const pedidoEnRuta = useOrderStore.getState().ventas.find(p => p.id === pedidoListo.id)!;
    expect(pedidoEnRuta.estado).toBe('EN_RUTA');
    expect(pedidoEnRuta.rutaId).toBe(manifiesto.id);

    // =========================================================================
    // ETAPA 6: Llegada en Sitio y Entrega con Firma Táctil
    // =========================================================================
    // Conductor registra llegada en puerta
    deliveryRouteService.registrarLlegadaEnSitio({
      manifiestoId: manifiesto.id,
      pedidoId: pedidoListo.id,
      horaLlegada: new Date().toISOString(),
    });

    const manifiestoLlegada = deliveryRouteService.obtenerManifiestoPorId(manifiesto.id)!;
    const itemPedidoRuta = manifiestoLlegada.pedidos.find(p => p.pedidoId === pedidoListo.id)!;
    expect(itemPedidoRuta.horaLlegadaEnSitio).toBeDefined();

    // =========================================================================
    // ETAPA 7: Novedad en Destino, Devolución Parcial a CUARENTENA_CALIDAD y Firma Digital
    // =========================================================================
    // El cliente acepta 4 piezas pero rechaza 1 pieza (0.490 kg) por no conformidad de calibre.
    // Precio unitario: $24.000 -> Monto descontado: 0.490 * 24000 = $11.760.
    // Total original: $58.800 -> Saldo a cobrar tras descuento: $47.040.
    const devolucionParcial = {
      productoId: 'prod-trucha-arcoiris',
      sku: 'TRU-ENT-001',
      nombre: 'Trucha Arcoíris Entera',
      cantidadDevueltaKg: 0.49,
      precioUnitario: 24000,
      montoDescontado: 11760,
      motivoRechazo: 'CALIBRE_INCORRECTO' as const,
      destinoBodega: 'CUARENTENA_CALIDAD' as const,
      observaciones: 'Pieza de 490g devuelta por el chef; se segrega a Cuarentena de Calidad',
    };

    const firmaDigitalCliente = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><path d="M10 10 L50 50"/></svg>';

    const inputEntrega: RegistrarEntregaEnSitioInput = {
      pedidoId: pedidoListo.id,
      manifiestoId: manifiesto.id,
      firmaClienteUrl: firmaDigitalCliente,
      formaPago: 'EFECTIVO',
      montoCobradoFinal: 47040,
      montoEfectivo: 47040,
      devoluciones: [devolucionParcial],
      observaciones: 'Entrega recibida con novedad: 1 trucha devuelta a cuarentena',
    };

    const entregaResultado = await b2bIntegrationService.registrarEntregaEnSitio(inputEntrega);
    const { pedido: pedidoEntregado, manifiesto: manifiestoPostEntrega } = entregaResultado;

    expect(pedidoEntregado.estado).toBe('ENTREGADO');
    expect(pedidoEntregado.totalFinal).toBe(47040); // Ajustado con el descuento en vivo
    expect(pedidoEntregado.observaciones).toContain('CUARENTENA_CALIDAD');

    // Verificar en el manifiesto de ruta
    const pedidoEnManifiesto = manifiestoPostEntrega.pedidos.find(p => p.pedidoId === pedidoListo.id)!;
    expect(pedidoEnManifiesto.estadoEntrega).toBe('ENTREGADO_PARCIAL');
    expect(pedidoEnManifiesto.montoCobradoFinal).toBe(47040);
    expect(pedidoEnManifiesto.montoEfectivo).toBe(47040);
    expect(pedidoEnManifiesto.firmaClienteUrl).toBe(firmaDigitalCliente);
    expect(pedidoEnManifiesto.devoluciones?.length).toBe(1);
    expect(pedidoEnManifiesto.devoluciones?.[0].destinoBodega).toBe('CUARENTENA_CALIDAD');
    expect(manifiestoPostEntrega.totalDevolucionesMonto).toBe(11760);

    // =========================================================================
    // ETAPA 8: Retorno a Bodega, Odometría y Liquidación de Ruta
    // =========================================================================
    const inputLiquidacion: LiquidarManifiestoInput = {
      manifiestoId: manifiesto.id,
      kilometrajeFinal: 12530,
      temperaturaRetornoCelsius: 2.8,
      efectivoFisicoEntregado: 47040,
      liquidadoPor: 'cajero-tesorero-01',
      observacionesLiquidacion: 'Cuadre perfecto: $47.040 en efectivo tras devolución de $11.760',
    };

    const manifiestoLiquidado = await b2bIntegrationService.liquidarManifiestoRuta(inputLiquidacion);

    expect(manifiestoLiquidado.estado).toBe('LIQUIDADA');
    expect(manifiestoLiquidado.kilometrajeFinal).toBe(12530);
    expect(manifiestoLiquidado.totalRecaudadoEfectivo).toBe(47040);
    expect(manifiestoLiquidado.totalDevolucionesMonto).toBe(11760);
    expect(manifiestoLiquidado.efectivoNetoEntregado).toBe(47040);
    expect(manifiestoLiquidado.diferenciaCuadre).toBe(0); // Cuadre perfecto sin faltantes
  });
});
