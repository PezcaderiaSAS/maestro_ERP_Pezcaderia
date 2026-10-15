import { describe, it, expect, beforeEach } from 'vitest';
import { b2bIntegrationService, ConvertirCotizacionInput } from '../services/b2bIntegrationService';
import { useOrderStore } from '../store/useOrderStore';
import { useEventStore } from '../store/useEventStore';
import { Cotizacion } from '../types/orders.types';
import { Cliente } from '../types/erp.types';

describe('B2B Commercial Flow - Orquestador Comercial (TASK-015-02)', () => {
  const clienteMockNormal: Cliente = {
    id: 'cli-001',
    nombre: 'Restaurante El Timón',
    identificacion: '900123456-1',
    tipoIdentificacion: 'NIT',
    tipoPersona: 'JURIDICA',
    ciudad: 'Bogotá',
    tipoPrecio: 'RESTAURANTE',
    telefono: '3001234567',
    direccion: 'Calle 10 # 40-20',
    email: 'contacto@eltimon.com',
    cupoCredito: 5000000,
    cupoCreditoUsado: 1000000,
    isGranContribuyente: false,
    isAutoretenedor: false,
    activo: true,
  };

  const clienteMockGranContribuyente: Cliente = {
    id: 'cli-002',
    nombre: 'Hoteles del Caribe S.A.',
    identificacion: '800987654-3',
    tipoIdentificacion: 'NIT',
    tipoPersona: 'JURIDICA',
    ciudad: 'Cartagena',
    tipoPrecio: 'MAYORISTA',
    telefono: '3109876543',
    direccion: 'Av Santander # 15-50',
    email: 'compras@hotelescaribe.com',
    cupoCredito: 10000000,
    cupoCreditoUsado: 2000000,
    isGranContribuyente: true,
    isAutoretenedor: false,
    activo: true,
  };

  const clienteSinCupo: Cliente = {
    id: 'cli-003',
    nombre: 'Pescadería El Puerto',
    identificacion: '901234567-8',
    tipoIdentificacion: 'NIT',
    tipoPersona: 'JURIDICA',
    ciudad: 'Barranquilla',
    tipoPrecio: 'POS',
    telefono: '3201234567',
    direccion: 'Muelle 4',
    email: 'puerto@pesca.com',
    cupoCredito: 2000000,
    cupoCreditoUsado: 1900000, // Disponible: 100.000
    isGranContribuyente: false,
    isAutoretenedor: false,
    activo: true,
  };

  const cotizacionBase: Cotizacion = {
    id: 'cot-101',
    fecha: '2026-10-15T10:00:00.000Z',
    cliente: 'Restaurante El Timón',
    clienteId: 'cli-001',
    total: 800000,
    subtotal: 800000,
    estado: 'APROBADA',
    lineas: [
      {
        productoId: 'prod-salmon-01',
        sku: 'SALM-001',
        nombre: 'Salmón Premium Entero',
        cantidadSolicitada: 20,
        cantidadAlistada: 0,
        cantidadDespachada: 0,
        estadoLinea: 'PENDIENTE',
        pesoEstimado: 20,
        precioPactado: 40000,
        totalLinea: 800000,
        unidadMedida: 'kg',
        modalidadVenta: 'PESO_DIRECTO',
      },
    ],
  };

  beforeEach(() => {
    useOrderStore.setState({
      ventas: [],
      quotations: [JSON.parse(JSON.stringify(cotizacionBase))],
    });
    useEventStore.setState({
      events: [],
      syncQueue: [],
    });
  });

  it('debe convertir exitosamente una cotización de CONTADO a pedido en estado CREADO con vendedor estampado', async () => {
    const input: ConvertirCotizacionInput = {
      cotizacionId: 'cot-101',
      vendedorId: 'vend-007',
      vendedorNombre: 'Carlos Vendedor',
      cliente: clienteMockNormal,
      formaPago: 'CONTADO',
      fechaEntrega: '2026-10-16',
      jornada: 'MANANA',
      tipoEntrega: 'EN_RUTA',
      observaciones: 'Entregar antes de las 10am',
    };

    const pedido = await b2bIntegrationService.convertirCotizacionAPedido(input);

    expect(pedido).toBeDefined();
    expect(pedido.id).toBeDefined();
    expect(pedido.numeroPedido).toMatch(/^PED-B2B-\d+/);
    expect(pedido.estado).toBe('CREADO');
    expect(pedido.vendedorId).toBe('vend-007');
    expect(pedido.vendedorNombre).toBe('Carlos Vendedor');
    expect(pedido.cotizacionIdOriginal).toBe('cot-101');
    expect(pedido.formaPago).toBe('CONTADO');
    expect(pedido.totalFinal).toBe(800000);
    expect(pedido.lineas).toHaveLength(1);
    expect(pedido.lineas[0].cantidadSolicitada).toBe(20);

    // Verificar que la cotización se marcó como CONVERTIDA_A_PEDIDO en el store
    const cotActualizada = useOrderStore.getState().quotations.find(q => q.id === 'cot-101');
    expect(cotActualizada?.estado).toBe('CONVERTIDA_A_PEDIDO');

    // Verificar que el pedido se guardó en useOrderStore
    const pedidoGuardado = useOrderStore.getState().ventas.find(v => v.id === pedido.id);
    expect(pedidoGuardado).toBeDefined();

    // Verificar que se emitió el evento de dominio
    const events = useEventStore.getState().events;
    expect(events.length).toBeGreaterThan(0);
    const event = events[0];
    expect(event.metadata?.evento).toBe('b2b_pedido_creado_desde_cotizacion');
    expect(event.metadata?.vendedorId).toBe('vend-007');
  });

  it('debe validar cupo de crédito aprobado y crear pedido en estado CREADO', async () => {
    const input: ConvertirCotizacionInput = {
      cotizacionId: 'cot-101',
      vendedorId: 'vend-007',
      vendedorNombre: 'Carlos Vendedor',
      cliente: clienteMockNormal, // Cupo disponible: 4.000.000 vs 800.000
      formaPago: 'CREDITO',
    };

    const pedido = await b2bIntegrationService.convertirCotizacionAPedido(input);

    expect(pedido.estado).toBe('CREADO');
    expect(pedido.formaPago).toBe('CREDITO');
  });

  it('debe pausar automáticamente el pedido en PAUSADO_POR_CREDITO cuando excede el cupo disponible', async () => {
    const input: ConvertirCotizacionInput = {
      cotizacionId: 'cot-101',
      vendedorId: 'vend-007',
      vendedorNombre: 'Carlos Vendedor',
      cliente: clienteSinCupo, // Cupo disponible: 100.000 vs Pedido 800.000
      formaPago: 'CREDITO',
    };

    const pedido = await b2bIntegrationService.convertirCotizacionAPedido(input);

    expect(pedido.estado).toBe('PAUSADO_POR_CREDITO');
    expect(pedido.formaPago).toBe('CREDITO');
    expect(pedido.observaciones).toContain('PAUSADO POR CUPO DE CRÉDITO');
  });

  it('debe aplicar retenciones NIIF cuando el cliente es Gran Contribuyente', async () => {
    const input: ConvertirCotizacionInput = {
      cotizacionId: 'cot-101',
      vendedorId: 'vend-007',
      vendedorNombre: 'Carlos Vendedor',
      cliente: clienteMockGranContribuyente,
      formaPago: 'CREDITO',
    };

    const pedido = await b2bIntegrationService.convertirCotizacionAPedido(input);

    // Base: 800.000
    // Retefuente 2.5% = 20.000
    // ReteICA 0.414% = 3.312
    // Total retenciones = 23.312
    // Neto a cobrar = 800.000 - 23.312 = 776.688
    expect(pedido.retefuenteValor).toBe(20000);
    expect(pedido.reteicaValor).toBe(3312);
    expect(pedido.subtotalNeto).toBe(776688);
    expect(pedido.totalFinal).toBe(800000);
  });

  it('debe rechazar la conversión si la cotización ya fue convertida previamente', async () => {
    useOrderStore.setState({
      quotations: [
        {
          ...cotizacionBase,
          estado: 'CONVERTIDA_A_PEDIDO',
        },
      ],
    });

    const input: ConvertirCotizacionInput = {
      cotizacionId: 'cot-101',
      vendedorId: 'vend-007',
      cliente: clienteMockNormal,
    };

    await expect(b2bIntegrationService.convertirCotizacionAPedido(input)).rejects.toThrow(
      'La cotización ya fue convertida a pedido previamente'
    );
  });

  it('debe arrojar error si la cotización no existe', async () => {
    const input: ConvertirCotizacionInput = {
      cotizacionId: 'cot-inexistente',
      vendedorId: 'vend-007',
      cliente: clienteMockNormal,
    };

    await expect(b2bIntegrationService.convertirCotizacionAPedido(input)).rejects.toThrow(
      'Cotización no encontrada'
    );
  });
});
