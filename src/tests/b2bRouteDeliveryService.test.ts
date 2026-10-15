import { describe, it, expect, beforeEach, vi } from 'vitest';
import { B2BRouteDeliveryService } from '../services/b2b/B2BRouteDeliveryService';
import { IOrderRepository, IDomainEventPublisher } from '../contracts/b2b.contracts';
import { Pedido } from '../types/orders.types';
import { PaymentStrategyRegistry } from '../services/b2b/strategies/PaymentSettlementStrategies';

describe('TASK-SOLID-05: B2BRouteDeliveryService (SRP, DIP & OCP)', () => {
  let mockRepo: IOrderRepository;
  let mockPublisher: IDomainEventPublisher;
  let mockRouteService: any;
  let service: B2BRouteDeliveryService;

  const pedidoListo: Pedido = {
    id: 'ped-deliv-01',
    numeroPedido: 'PED-DELIV-300',
    fecha: '2026-10-15T08:00:00Z',
    origen: 'VISITA',
    clienteId: 'cli-001',
    bodegaId: 'bod-01',
    branch_id: 'suc-01',
    vendedorId: 'vend-01',
    formaPago: 'CONTADO',
    tipoEntrega: 'EN_RUTA',
    fechaEntrega: '2026-10-16',
    jornada: 'MANANA',
    estado: 'LISTO',
    observaciones: 'Entregar antes de las 11am',
    lineas: [
      {
        productoId: 'prod-robalo-01',
        cantidadSolicitada: 5,
        cantidadAlistada: 5,
        cantidadDespachada: 5,
        estadoLinea: 'COMPLETO',
        precioPactado: 35000,
        totalLinea: 175000,
        pesoReal: 5,
        loteSeleccionado: 'LOT-ROB-01',
      },
    ],
    subtotal: 175000,
    descuentoGlobalPct: 0,
    descuentoGlobalValor: 0,
    totalFinal: 175000,
    idempotencyKey: 'idemp-deliv-1',
    rutaId: null,
    facturacionElectronica: false,
    idSiigo: null,
  };

  const manifiestoMock = {
    id: 'man-test-100',
    numeroManifiesto: 'MAN-2026-100',
    conductorId: 'cond-01',
    conductorNombre: 'Javier Repartidor',
    vehiculoPlaca: 'ABC-123',
    estado: 'EN_RUTA',
    temperaturaSalidaCelsius: 2.0,
    pedidos: [pedidoListo],
  };

  beforeEach(() => {
    let currentPedido = { ...pedidoListo, lineas: [...pedidoListo.lineas] };

    mockRepo = {
      obtenerPedidoPorId: vi.fn().mockImplementation((id: string) => currentPedido),
      obtenerCotizacionPorId: vi.fn(),
      guardarPedido: vi.fn(),
      actualizarPedido: vi.fn().mockImplementation((id: string, parcial: any) => {
        currentPedido = { ...currentPedido, ...parcial };
      }),
      actualizarCotizacion: vi.fn(),
      obtenerPedidos: vi.fn().mockReturnValue([currentPedido]),
      obtenerCotizaciones: vi.fn().mockReturnValue([]),
    };

    mockPublisher = {
      publicarEvento: vi.fn().mockResolvedValue(undefined),
    };

    mockRouteService = {
      crearManifiestoRuta: vi.fn().mockReturnValue({
        success: true,
        data: { ...manifiestoMock },
      }),
      confirmarCheckinCarga: vi.fn().mockReturnValue({ success: true }),
      iniciarRuta: vi.fn().mockReturnValue({ success: true }),
      registrarEntregaPedido: vi.fn().mockReturnValue({ success: true }),
      obtenerManifiestos: vi.fn().mockReturnValue([manifiestoMock]),
      finalizarRecorridoChofer: vi.fn().mockReturnValue({ success: true }),
      liquidarRutaTransportador: vi.fn().mockResolvedValue({
        success: true,
        data: {
          ...manifiestoMock,
          estado: 'LIQUIDADO',
          diferenciaCuadre: 0,
          totalGastosRuta: 15000,
        },
      }),
    };

    service = new B2BRouteDeliveryService(
      mockRepo,
      mockPublisher,
      mockRouteService,
      new PaymentStrategyRegistry()
    );
  });

  it('debe rechazar el despacho si la temperatura del termofurgón excede los 4°C de cadena de frío', async () => {
    await expect(
      service.crearYDespacharManifiesto({
        conductorId: 'cond-01',
        conductorNombre: 'Javier Chofer',
        vehiculoPlaca: 'XYZ-987',
        zonaRuta: 'Norte',
        pedidosIds: ['ped-deliv-01'],
        kilometrajeInicial: 50000,
        temperaturaFurgonCelsius: 6.5, // Ruptura de cadena de frío
      })
    ).rejects.toThrow('Temperatura del furgón no apta para cadena de frío');
  });

  it('debe despachar manifiesto, transicionar pedidos a EN_RUTA y estampar conductor y ruta', async () => {
    const res = await service.crearYDespacharManifiesto({
      conductorId: 'cond-01',
      conductorNombre: 'Javier Chofer',
      vehiculoPlaca: 'XYZ-987',
      zonaRuta: 'Norte',
      pedidosIds: ['ped-deliv-01'],
      kilometrajeInicial: 50000,
      temperaturaFurgonCelsius: 2.0,
    });

    expect(res.manifiesto.estado).toBe('EN_RUTA');
    expect(res.pedidosDespachados[0].estado).toBe('EN_RUTA');
    expect(res.pedidosDespachados[0].conductorRepartidorId).toBe('cond-01');
    expect(res.pedidosDespachados[0].rutaId).toBe('man-test-100');

    expect(mockRepo.actualizarPedido).toHaveBeenCalledWith(
      'ped-deliv-01',
      expect.objectContaining({ estado: 'EN_RUTA', conductorRepartidorId: 'cond-01' })
    );
    expect(mockPublisher.publicarEvento).toHaveBeenCalled();
  });

  it('debe exigir obligatoriamente la firma digital del cliente para registrar la entrega', async () => {
    await expect(
      service.registrarEntregaEnSitio({
        pedidoId: 'ped-deliv-01',
        manifiestoId: 'man-test-100',
        firmaClienteUrl: '   ', // Firma vacía
        formaPago: 'EFECTIVO',
      })
    ).rejects.toThrow('La firma digital del cliente es obligatoria');
  });

  it('debe registrar entrega en sitio, procesar el recaudo con la estrategia OCP y transicionar a ENTREGADO', async () => {
    const res = await service.registrarEntregaEnSitio({
      pedidoId: 'ped-deliv-01',
      manifiestoId: 'man-test-100',
      firmaClienteUrl: 'data:image/svg+xml;base64,demoFirma==',
      formaPago: 'EFECTIVO',
      montoCobradoFinal: 175000,
    });

    expect(res.pedido.estado).toBe('ENTREGADO');
    expect(res.pedido.firmaClienteUrl).toBe('data:image/svg+xml;base64,demoFirma==');
    expect(mockRouteService.registrarEntregaPedido).toHaveBeenCalledWith(
      expect.objectContaining({
        montoCobradoFinal: 175000,
        montoEfectivo: 175000,
        montoDigital: 0,
      })
    );
  });

  it('debe liquidar el manifiesto con kilometraje final y conciliar con tesorería', async () => {
    const res = await service.liquidarManifiestoRuta({
      manifiestoId: 'man-test-100',
      kilometrajeFinal: 50120,
      efectivoFisicoEntregado: 175000,
      liquidadoPor: 'Tesorero Mayor',
    });

    expect(res.estado).toBe('LIQUIDADO');
    expect(mockRouteService.finalizarRecorridoChofer).toHaveBeenCalledWith(
      expect.objectContaining({ kilometrajeFinal: 50120 })
    );
    expect(mockRouteService.liquidarRutaTransportador).toHaveBeenCalledWith(
      expect.objectContaining({
        efectivoFisicoEntregado: 175000,
        liquidadoPor: 'Tesorero Mayor',
      })
    );
  });
});
