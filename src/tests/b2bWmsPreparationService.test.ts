import { describe, it, expect, beforeEach, vi } from 'vitest';
import { B2BWmsPreparationService } from '../services/b2b/B2BWmsPreparationService';
import { IOrderRepository, IDomainEventPublisher } from '../contracts/b2b.contracts';
import { Pedido } from '../types/orders.types';

describe('TASK-SOLID-04: B2BWmsPreparationService (SRP, DIP & LSP)', () => {
  let mockRepo: IOrderRepository;
  let mockPublisher: IDomainEventPublisher;
  let mockDispatchService: any;
  let service: B2BWmsPreparationService;

  const pedidoBase: Pedido = {
    id: 'ped-wms-01',
    numeroPedido: 'PED-WMS-200',
    fecha: '2026-10-15T07:00:00Z',
    origen: 'VISITA',
    clienteId: 'cli-001',
    bodegaId: 'bod-01',
    branch_id: 'suc-01',
    vendedorId: 'vend-01',
    formaPago: 'CREDITO',
    tipoEntrega: 'EN_RUTA',
    fechaEntrega: '2026-10-16',
    jornada: 'MANANA',
    estado: 'CREADO',
    observaciones: 'Nota alistamiento',
    lineas: [
      {
        productoId: 'prod-salmon-01',
        cantidadSolicitada: 10,
        cantidadAlistada: 0,
        cantidadDespachada: 0,
        estadoLinea: 'PENDIENTE',
        precioPactado: 40000,
        totalLinea: 400000,
        pesoEstimado: 10,
        unidadMedida: 'kg',
      },
    ],
    subtotal: 400000,
    descuentoGlobalPct: 0,
    descuentoGlobalValor: 0,
    totalFinal: 400000,
    idempotencyKey: 'idemp-wms-1',
    rutaId: null,
    facturacionElectronica: false,
    idSiigo: null,
  };

  beforeEach(() => {
    let currentPedido = { ...pedidoBase, lineas: [...pedidoBase.lineas] };

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

    mockDispatchService = {
      conciliarPesajeB2B: vi.fn().mockResolvedValue({
        dentro_tolerancia: true,
        variacion_porcentaje: 2.0,
        subtotal_ajustado: 408000,
      }),
      crearRemisionDespachoWMS: vi.fn().mockResolvedValue({
        remision_id: 'REM-TEST-001',
        numero_remision: 'REM-2026-1001',
        token_qr: 'QR-TEST-TOKEN',
      }),
    };

    service = new B2BWmsPreparationService(mockRepo, mockPublisher, mockDispatchService);
  });

  it('debe iniciar alistamiento y transicionar estado a EN_ALISTAMIENTO estampando operario', async () => {
    const res = await service.iniciarAlistamiento({
      pedidoId: 'ped-wms-01',
      operarioId: 'op-10',
      operarioNombre: 'Carlos Bodeguero',
    });

    expect(res.estado).toBe('EN_ALISTAMIENTO');
    expect(res.operarioAlistadorId).toBe('op-10');
    expect(res.operarioAlistadorNombre).toBe('Carlos Bodeguero');
    expect(res.horaInicioAlistamiento).toBeDefined();

    expect(mockRepo.actualizarPedido).toHaveBeenCalledWith(
      'ped-wms-01',
      expect.objectContaining({
        estado: 'EN_ALISTAMIENTO',
        operarioAlistadorId: 'op-10',
      })
    );
    expect(mockPublisher.publicarEvento).toHaveBeenCalled();
  });

  it('debe registrar pesaje en báscula y conciliar Catch Weight +-5%', async () => {
    await service.iniciarAlistamiento({
      pedidoId: 'ped-wms-01',
      operarioId: 'op-10',
    });

    const res = await service.registrarPesajeLinea({
      pedidoId: 'ped-wms-01',
      productoId: 'prod-salmon-01',
      pesoRealKg: 10.2,
      loteFefo: 'LOT-SALMON-01',
      temperaturaC: 2.5,
    });

    expect(res.lineas[0].pesoReal).toBe(10.2);
    expect(res.lineas[0].loteSeleccionado).toBe('LOT-SALMON-01');
    expect(res.lineas[0].toleranciaAceptada).toBe(true);
    expect(res.lineas[0].estadoLinea).toBe('COMPLETO');
  });

  it('debe pausar el pedido si la variación de báscula supera la tolerancia permitida (+-5%)', async () => {
    mockDispatchService.conciliarPesajeB2B.mockResolvedValueOnce({
      dentro_tolerancia: false,
      variacion_porcentaje: 8.5,
      subtotal_ajustado: 434000,
    });

    await service.iniciarAlistamiento({
      pedidoId: 'ped-wms-01',
      operarioId: 'op-10',
    });

    const res = await service.registrarPesajeLinea({
      pedidoId: 'ped-wms-01',
      productoId: 'prod-salmon-01',
      pesoRealKg: 10.85,
      loteFefo: 'LOT-SALMON-01',
    });

    expect(res.estado).toBe('PAUSADO');
    expect(res.lineas[0].toleranciaAceptada).toBe(false);
    expect(res.observaciones).toContain('PAUSADO POR BÁSCULA');
  });

  it('debe finalizar alistamiento y generar remisión WMS con QR y precinto', async () => {
    await service.iniciarAlistamiento({
      pedidoId: 'ped-wms-01',
      operarioId: 'op-10',
    });

    await service.registrarPesajeLinea({
      pedidoId: 'ped-wms-01',
      productoId: 'prod-salmon-01',
      pesoRealKg: 10.2,
      loteFefo: 'LOT-SALMON-01',
    });

    const resListo = await service.finalizarAlistamiento({
      pedidoId: 'ped-wms-01',
      precintoCanastilla: 'PREC-CAN-888',
      temperaturaSalidaC: 2.0,
    });

    expect(resListo.estado).toBe('LISTO');
    expect(resListo.remisionId).toBe('REM-TEST-001');
    expect(resListo.tokenQrRemision).toBe('QR-TEST-TOKEN');
    expect(resListo.precintoCanastilla).toBe('PREC-CAN-888');
    expect(resListo.inventarioDescontado).toBe(true);
  });
});
