import { describe, it, expect, beforeEach, vi } from 'vitest';
import { B2BCommercialOrderService } from '../services/b2b/B2BCommercialOrderService';
import { IOrderRepository, IDomainEventPublisher } from '../contracts/b2b.contracts';
import { Cotizacion, Pedido } from '../types/orders.types';
import { Cliente } from '../types/erp.types';

describe('TASK-SOLID-03: B2BCommercialOrderService (SRP & DIP)', () => {
  let mockRepo: IOrderRepository;
  let mockPublisher: IDomainEventPublisher;
  let service: B2BCommercialOrderService;

  const cotizacionDemo: Cotizacion = {
    id: 'cot-test-01',
    fecha: '2026-10-15',
    cliente: 'Restaurante Prueba',
    clienteId: 'cli-001',
    total: 200000,
    montoTotal: 200000,
    subtotal: 200000,
    estado: 'APROBADA',
    lineas: [
      {
        id: 'item-1',
        productoId: 'prod-corvina-01',
        nombre: 'Corvina Entera',
        cantidadSolicitada: 10,
        precioPactado: 20000,
        totalLinea: 200000,
        unidadMedida: 'kg',
        modalidadVenta: 'PESO_DIRECTO',
      },
    ],
  };

  const clienteDemo: Cliente = {
    id: 'cli-001',
    nombre: 'Restaurante Prueba',
    identificacion: '900111222-3',
    tipoIdentificacion: 'NIT',
    tipoPersona: 'JURIDICA',
    ciudad: 'Bogotá',
    tipoPrecio: 'RESTAURANTE',
    telefono: '3001234567',
    direccion: 'Calle 100',
    email: 'contacto@prueba.com',
    cupoCredito: 10000000,
    cupoCreditoUsado: 1000000,
    isGranContribuyente: false,
    isAutoretenedor: false,
    activo: true,
  };

  beforeEach(() => {
    mockRepo = {
      obtenerPedidoPorId: vi.fn(),
      obtenerCotizacionPorId: vi.fn().mockResolvedValue(cotizacionDemo),
      guardarPedido: vi.fn().mockResolvedValue(undefined),
      actualizarPedido: vi.fn().mockResolvedValue(undefined),
      actualizarCotizacion: vi.fn().mockResolvedValue(undefined),
      obtenerPedidos: vi.fn().mockReturnValue([]),
      obtenerCotizaciones: vi.fn().mockReturnValue([cotizacionDemo]),
    };

    mockPublisher = {
      publicarEvento: vi.fn().mockResolvedValue(undefined),
    };

    service = new B2BCommercialOrderService(mockRepo, mockPublisher);
  });

  it('debe convertir una cotización a pedido inyectando dependencias y persistiendo en el repositorio', async () => {
    const pedidoCreado = await service.convertirCotizacionAPedido({
      cotizacionId: 'cot-test-01',
      vendedorId: 'vend-101',
      vendedorNombre: 'Vendedor Estrella',
      cliente: clienteDemo,
      formaPago: 'CREDITO',
    });

    expect(pedidoCreado).toBeDefined();
    expect(pedidoCreado.vendedorId).toBe('vend-101');
    expect(pedidoCreado.vendedorNombre).toBe('Vendedor Estrella');
    expect(pedidoCreado.cotizacionIdOriginal).toBe('cot-test-01');
    expect(pedidoCreado.estado).toBe('CREADO');

    // Verificar que llamó al repositorio y publicador inyectados
    expect(mockRepo.guardarPedido).toHaveBeenCalledWith(
      expect.objectContaining({
        vendedorId: 'vend-101',
        cotizacionIdOriginal: 'cot-test-01',
      })
    );

    expect(mockRepo.actualizarCotizacion).toHaveBeenCalledWith(
      'cot-test-01',
      expect.objectContaining({
        estado: 'CONVERTIDA_A_PEDIDO',
        vendedorId: 'vend-101',
      })
    );

    expect(mockPublisher.publicarEvento).toHaveBeenCalledWith(
      'QUOTE_STATUS_CHANGED',
      'Vendedor Estrella',
      expect.stringContaining('convertida a pedido'),
      expect.any(Object)
    );
  });

  it('debe pausar el pedido si el cupo de crédito es insuficiente', async () => {
    const clienteSinCupo: Cliente = {
      ...clienteDemo,
      cupoCredito: 100000,
      cupoCreditoUsado: 95000, // Disponible: 5000 (total pedido: 200000)
    };

    const pedidoCreado = await service.convertirCotizacionAPedido({
      cotizacionId: 'cot-test-01',
      vendedorId: 'vend-101',
      cliente: clienteSinCupo,
      formaPago: 'CREDITO',
      verificarCupo: true,
    });

    expect(pedidoCreado.estado).toBe('PAUSADO_POR_CREDITO');
    expect(pedidoCreado.observaciones).toContain('PAUSADO POR CUPO DE CRÉDITO');
  });

  it('debe rechazar la conversión si la cotización ya fue convertida previamente', async () => {
    const cotizacionYaConvertida: Cotizacion = {
      ...cotizacionDemo,
      estado: 'CONVERTIDA_A_PEDIDO',
    };
    (mockRepo.obtenerCotizacionPorId as any).mockResolvedValue(cotizacionYaConvertida);

    await expect(
      service.convertirCotizacionAPedido({
        cotizacionId: 'cot-test-01',
        vendedorId: 'vend-101',
      })
    ).rejects.toThrow('La cotización ya fue convertida a pedido previamente');
  });
});
