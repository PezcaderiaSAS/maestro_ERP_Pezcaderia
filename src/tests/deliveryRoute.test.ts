import { describe, it, expect, beforeEach } from 'vitest';
import {
  CreateRouteManifestSchema,
  RegisterDeliveryExecutionSchema,
  SettleRouteManifestSchema,
  RouteExpenseSchema,
  RouteReturnItemSchema,
  CheckinRouteLoadSchema,
  RouteIncidentSchema,
} from '../../packages/validation-schemas/src';

describe('Módulo de Despachos en Ruta y Liquidación - Schemas Zod', () => {
  describe('1. Validación de Creación de Manifiesto de Ruta (CreateRouteManifestSchema)', () => {
    it('debe validar exitosamente un manifiesto con conductor y pedidos', () => {
      const payload = {
        conductorId: 'cond-01',
        conductorNombre: 'Carlos Conductor',
        conductorTelefono: '3109876543',
        vehiculoPlaca: 'ABC-123',
        vehiculoTipo: 'Furgón Refrigerado Thermo King',
        zonaRuta: 'Zona Norte - Restaurantes Usaquén',
        observaciones: 'Mantener temperatura entre 0 y 4 grados',
        pedidosIds: ['ped-001', 'ped-002', 'ped-003'],
      };

      const result = CreateRouteManifestSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pedidosIds.length).toBe(3);
        expect(result.data.vehiculoPlaca).toBe('ABC-123');
      }
    });

    it('debe rechazar si la lista de pedidos está vacía', () => {
      const payload = {
        conductorId: 'cond-01',
        conductorNombre: 'Carlos Conductor',
        vehiculoPlaca: 'ABC-123',
        zonaRuta: 'Zona Norte',
        pedidosIds: [],
      };

      const result = CreateRouteManifestSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('al menos un pedido');
      }
    });
  });

  describe('2. Validación de Entrega en Sitio y Recaudo Multimedio (RegisterDeliveryExecutionSchema)', () => {
    it('debe validar una entrega a crédito B2B', () => {
      const payload = {
        manifiestoId: 'man-001',
        pedidoId: 'ped-001',
        estadoEntrega: 'ENTREGADO_TOTAL' as const,
        formaPago: 'CREDITO_B2B' as const,
        montoOriginal: 450000,
        montoCobradoFinal: 450000,
        montoEfectivo: 0,
        montoDigital: 0,
        firmaClienteUrl: 'data:image/svg+xml;base64,...',
      };

      const result = RegisterDeliveryExecutionSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('debe validar una entrega pagada en efectivo contra entrega', () => {
      const payload = {
        manifiestoId: 'man-001',
        pedidoId: 'ped-002',
        estadoEntrega: 'ENTREGADO_TOTAL' as const,
        formaPago: 'EFECTIVO' as const,
        montoOriginal: 280000,
        montoCobradoFinal: 280000,
        montoEfectivo: 280000,
        montoDigital: 0,
      };

      const result = RegisterDeliveryExecutionSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('debe validar pago digital cuando se proporciona el número de comprobante', () => {
      const payload = {
        manifiestoId: 'man-001',
        pedidoId: 'ped-003',
        estadoEntrega: 'ENTREGADO_TOTAL' as const,
        formaPago: 'TRANSFERENCIA_DIGITAL' as const,
        montoOriginal: 350000,
        montoCobradoFinal: 350000,
        montoEfectivo: 0,
        montoDigital: 350000,
        referenciaDigital: 'NEQUI-M48192039',
      };

      const result = RegisterDeliveryExecutionSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('debe RECHAZAR pago digital si no incluye número de comprobante o referencia', () => {
      const payload = {
        manifiestoId: 'man-001',
        pedidoId: 'ped-003',
        estadoEntrega: 'ENTREGADO_TOTAL' as const,
        formaPago: 'TRANSFERENCIA_DIGITAL' as const,
        montoOriginal: 350000,
        montoCobradoFinal: 350000,
        montoEfectivo: 0,
        montoDigital: 350000,
        referenciaDigital: '', // Vacío
      };

      const result = RegisterDeliveryExecutionSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('comprobante o referencia');
      }
    });

    it('debe validar pago mixto si la suma de efectivo y digital coincide con el total cobrado', () => {
      const payload = {
        manifiestoId: 'man-001',
        pedidoId: 'ped-004',
        estadoEntrega: 'ENTREGADO_TOTAL' as const,
        formaPago: 'MIXTO' as const,
        montoOriginal: 500000,
        montoCobradoFinal: 500000,
        montoEfectivo: 200000,
        montoDigital: 300000,
        referenciaDigital: 'DAVIPLATA-993812',
      };

      const result = RegisterDeliveryExecutionSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('debe RECHAZAR pago mixto si la suma de efectivo y digital NO coincide con el total cobrado', () => {
      const payload = {
        manifiestoId: 'man-001',
        pedidoId: 'ped-004',
        estadoEntrega: 'ENTREGADO_TOTAL' as const,
        formaPago: 'MIXTO' as const,
        montoOriginal: 500000,
        montoCobradoFinal: 500000,
        montoEfectivo: 200000,
        montoDigital: 150000, // Suma 350k en vez de 500k
      };

      const result = RegisterDeliveryExecutionSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('suma de efectivo y digital debe igualar');
      }
    });

    it('debe validar entrega parcial con devolución de producto a cuarentena y recálculo de saldo', () => {
      const payload = {
        manifiestoId: 'man-001',
        pedidoId: 'ped-005',
        estadoEntrega: 'ENTREGADO_PARCIAL' as const,
        formaPago: 'EFECTIVO' as const,
        montoOriginal: 300000,
        montoCobradoFinal: 250000, // Se descuentan 50k del producto devuelto
        montoEfectivo: 250000,
        devoluciones: [
          {
            productoId: 'prod-camaron-01',
            sku: 'CAM-TIG-01',
            nombre: 'Camarón Tigre 16/20',
            cantidadDevueltaKg: 1.0,
            precioUnitario: 50000,
            montoDescontado: 50000,
            loteFefo: 'LOT-CAM-2026-08',
            motivoRechazo: 'EMPAQUE_AVERIADO' as const,
            destinoBodega: 'CUARENTENA_CALIDAD' as const,
            observaciones: 'Bandeja con rotura de vacío en transporte',
          },
        ],
      };

      const result = RegisterDeliveryExecutionSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.devoluciones?.length).toBe(1);
        expect(result.data.devoluciones?.[0].destinoBodega).toBe('CUARENTENA_CALIDAD');
      }
    });
  });

  describe('3. Validación de Liquidación y Gastos de Ruta (SettleRouteManifestSchema)', () => {
    it('debe validar la liquidación final con gastos soportados y efectivo entregado', () => {
      const payload = {
        manifiestoId: 'man-001',
        liquidadoPor: 'Tesorero Central',
        efectivoFisicoEntregado: 480000,
        gastos: [
          {
            tipoGasto: 'COMBUSTIBLE' as const,
            monto: 50000,
            numeroComprobante: 'FACT-EST-9912',
            descripcion: 'Tanqueo de Diesel para ruta norte',
          },
          {
            tipoGasto: 'PEAJE' as const,
            monto: 12000,
            numeroComprobante: 'TICKET-ANDES-01',
            descripcion: 'Peaje Autopista Norte',
          },
        ],
        observacionesLiquidacion: 'Ruta liquidada sin novedades de faltante de caja',
      };

      const result = SettleRouteManifestSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.gastos?.length).toBe(2);
      }
    });

    it('debe rechazar si un gasto tiene monto menor o igual a cero', () => {
      const gastoInvalido = {
        tipoGasto: 'PEAJE' as const,
        monto: -5000,
      };

      const result = RouteExpenseSchema.safeParse(gastoInvalido);
      expect(result.success).toBe(false);
    });
  });

  describe('4. Gobernanza: Checklist de Carga y Cadena de Frío (CheckinRouteLoadSchema)', () => {
    it('debe validar exitosamente el check-in de carga con temperatura sanitaria válida (2°C)', () => {
      const payload = {
        manifiestoId: 'man-001',
        temperaturaSalidaCelsius: 2.5,
        pedidosConfirmados: ['ped-001', 'ped-002'],
        observacionesCarga: 'Cadena de frío verificada con termómetro calibrado',
      };

      const result = CheckinRouteLoadSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.temperaturaSalidaCelsius).toBe(2.5);
        expect(result.data.pedidosConfirmados.length).toBe(2);
      }
    });

    it('debe rechazar temperaturas fuera del límite sanitario para mariscos (> 15°C o < -30°C)', () => {
      const payload = {
        manifiestoId: 'man-001',
        temperaturaSalidaCelsius: 25.0, // Muy caliente
        pedidosConfirmados: ['ped-001'],
      };

      const result = CheckinRouteLoadSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('5. Gobernanza: Eventualidades e Incidencias de Ruta (RouteIncidentSchema)', () => {
    it('debe validar un reporte de incidencia por congestión vehicular', () => {
      const payload = {
        manifiestoId: 'man-001',
        pedidoId: 'ped-002',
        tipoIncidencia: 'TRAFICO_BLOQUEO' as const,
        descripcion: 'Bloqueo temporal en la Autopista Norte por accidente vial',
        horaReporte: new Date().toISOString(),
      };

      const result = RouteIncidentSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tipoIncidencia).toBe('TRAFICO_BLOQUEO');
      }
    });
  });
});

import { deliveryRouteService } from '../services/deliveryRouteService';
import { cashService } from '../services/cashService';
import * as localDb from '../services/localDb';

describe('Suite TDD: deliveryRouteService - Ciclo Completo de Rutas, Caja e Inventario', () => {
  beforeEach(() => {
    localDb.save('delivery_route_manifests', []);
    localDb.save('movimientosCaja', []);
    localDb.save('stock', {
      '1': { 'CAM-TIG-01': 100 },
      '2': { 'CAM-TIG-01': 0 },
    });
    // Turno de caja abierto para tesorería
    localDb.save('cajas', [
      { id: 'caja-1', nombre: 'Caja Principal', bodegaId: 'Bodega Principal', activa: true, tipo: 'MAYOR' },
    ]);
    localDb.save('turnosCaja', [
      {
        id: 'turno-test-1',
        cajaId: 'caja-1',
        cajeroId: 'usr-tesorero',
        createdBy: 'usr-tesorero',
        baseInicial: 100000,
        saldoInicial: 100000,
        saldoTeoricoGlobal: 100000,
        totalEfectivo: 100000,
        totalDatafono: 0,
        totalTransferencias: 0,
        fechaApertura: new Date().toISOString(),
        fechaCierre: null,
        justificacion: null,
        estado: 'ABIERTO',
        branch_id: 'branch-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  });

  it('1. Debe crear un manifiesto de ruta en estado PLANIFICADA con odometría y totales COP', () => {
    const pedidos = [
      {
        id: 'ped-1',
        numeroPedido: 'PED-101',
        clienteId: 'cli-1',
        clienteNombre: 'Restaurante Mar y Sol',
        totalNeto: 350000,
        items: [{ sku: 'CAM-TIG-01', nombre: 'Camarón Tigre', cantidad: 5, precioUnitario: 70000 }],
      },
      {
        id: 'ped-2',
        numeroPedido: 'PED-102',
        clienteId: 'cli-2',
        clienteNombre: 'Cevichería del Puerto',
        totalNeto: 180000,
        items: [{ sku: 'CAM-TIG-01', nombre: 'Camarón Tigre', cantidad: 3, precioUnitario: 60000 }],
      },
    ];

    const result = deliveryRouteService.crearManifiestoRuta(
      {
        conductorId: 'cond-01',
        conductorNombre: 'Carlos Rodríguez',
        conductorTelefono: '3123456789',
        vehiculoPlaca: 'WXF-456',
        vehiculoTipo: 'Furgón Thermo King',
        zonaRuta: 'Zona Norte Bucaramanga',
        kilometrajeInicial: 15420,
        temperaturaSalidaCelsius: -18,
        pedidosIds: ['ped-1', 'ped-2'],
      },
      pedidos
    );

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.estado).toBe('PLANIFICADA');
    expect(result.data?.totalPedidos).toBe(2);
    expect(result.data?.totalPesoKg).toBe(8);
    expect(result.data?.totalFacturadoEsperado).toBe(530000);
    expect(result.data?.kilometrajeInicial).toBe(15420);
    expect(result.data?.temperaturaSalidaCelsius).toBe(-18);
  });

  it('2. Debe confirmar check-in de carga y pasar el manifiesto a EN_RUTA', () => {
    const createRes = deliveryRouteService.crearManifiestoRuta(
      {
        conductorId: 'cond-01',
        conductorNombre: 'Carlos Rodríguez',
        vehiculoPlaca: 'WXF-456',
        zonaRuta: 'Zona Centro',
        kilometrajeInicial: 10000,
        pedidosIds: ['ped-1'],
      },
      [{ id: 'ped-1', totalNeto: 150000, items: [] }]
    );
    const manId = createRes.data!.id;

    const checkinRes = deliveryRouteService.confirmarCheckinCarga({
      manifiestoId: manId,
      temperaturaSalidaCelsius: -16.5,
      pedidosConfirmados: ['ped-1'],
      observacionesCarga: 'Carga completa y asegurada',
    });

    expect(checkinRes.success).toBe(true);
    expect(checkinRes.data?.estado).toBe('EN_RUTA');
    expect(checkinRes.data?.cargaVerificadaEnBodega).toBe(true);
    expect(checkinRes.data?.temperaturaSalidaCelsius).toBe(-16.5);
    expect(checkinRes.data?.pedidos[0].horaSalidaBodega).toBeDefined();
  });

  it('3. Debe registrar entrega con pago mixto y comprobante digital', () => {
    const createRes = deliveryRouteService.crearManifiestoRuta(
      {
        conductorId: 'cond-01',
        conductorNombre: 'Carlos Rodríguez',
        vehiculoPlaca: 'WXF-456',
        zonaRuta: 'Zona Centro',
        pedidosIds: ['ped-1'],
      },
      [{ id: 'ped-1', totalNeto: 200000, items: [] }]
    );
    const manId = createRes.data!.id;
    deliveryRouteService.iniciarRuta(manId);

    const entregaRes = deliveryRouteService.registrarEntregaPedido({
      manifiestoId: manId,
      pedidoId: 'ped-1',
      estadoEntrega: 'ENTREGADO_TOTAL',
      formaPago: 'MIXTO',
      montoOriginal: 200000,
      montoCobradoFinal: 200000,
      montoEfectivo: 120000,
      montoDigital: 80000,
      referenciaDigital: 'NEQUI-998811',
      firmaClienteUrl: 'data:image/svg+xml;base64,firmademo',
    });

    expect(entregaRes.success).toBe(true);
    const manifiesto = deliveryRouteService.obtenerManifiestoPorId(manId);
    expect(manifiesto?.pedidos[0].estadoEntrega).toBe('ENTREGADO_TOTAL');
    expect(manifiesto?.pedidos[0].montoEfectivo).toBe(120000);
    expect(manifiesto?.pedidos[0].montoDigital).toBe(80000);
    expect(manifiesto?.pedidos[0].referenciaTransferencia).toBe('NEQUI-998811');
  });

  it('4. Debe finalizar recorrido del chofer validando odómetro y pasar a EN_LIQUIDACION', () => {
    const createRes = deliveryRouteService.crearManifiestoRuta(
      {
        conductorId: 'cond-01',
        conductorNombre: 'Carlos Rodríguez',
        vehiculoPlaca: 'WXF-456',
        zonaRuta: 'Zona Centro',
        kilometrajeInicial: 50000,
        pedidosIds: ['ped-1'],
      },
      [{ id: 'ped-1', totalNeto: 100000, items: [] }]
    );
    const manId = createRes.data!.id;
    deliveryRouteService.iniciarRuta(manId);

    // Debe rechazar si kilometraje final es menor al inicial
    const failRes = deliveryRouteService.finalizarRecorridoChofer({
      manifiestoId: manId,
      kilometrajeFinal: 49990,
    });
    expect(failRes.success).toBe(false);
    expect(failRes.error).toContain('no puede ser inferior al inicial');

    // Debe aceptar odómetro válido y temperatura opcional
    const okRes = deliveryRouteService.finalizarRecorridoChofer({
      manifiestoId: manId,
      kilometrajeFinal: 50085,
      temperaturaRetornoCelsius: -15.0,
      observacionesRetorno: 'Ruta completada sin novedad en vehículo',
    });

    expect(okRes.success).toBe(true);
    expect(okRes.data?.estado).toBe('EN_LIQUIDACION');
    expect(okRes.data?.kilometrajeFinal).toBe(50085);
    expect(okRes.data?.temperaturaRetornoCelsius).toBe(-15.0);
    expect(okRes.data?.horaRetornoBodega).toBeDefined();
  });

  it('5. Debe liquidar la ruta registrando ingreso en cashService y deducción por faltante', async () => {
    const createRes = deliveryRouteService.crearManifiestoRuta(
      {
        conductorId: 'cond-01',
        conductorNombre: 'Carlos Rodríguez',
        vehiculoPlaca: 'WXF-456',
        zonaRuta: 'Zona Centro',
        pedidosIds: ['ped-1'],
      },
      [{ id: 'ped-1', totalNeto: 300000, items: [] }]
    );
    const manId = createRes.data!.id;
    deliveryRouteService.iniciarRuta(manId);

    // Chofer cobra 300.000 en efectivo
    deliveryRouteService.registrarEntregaPedido({
      manifiestoId: manId,
      pedidoId: 'ped-1',
      estadoEntrega: 'ENTREGADO_TOTAL',
      formaPago: 'EFECTIVO',
      montoOriginal: 300000,
      montoCobradoFinal: 300000,
      montoEfectivo: 300000,
      montoDigital: 0,
    });

    // Pasa a EN_LIQUIDACION
    deliveryRouteService.finalizarRecorridoChofer({
      manifiestoId: manId,
      kilometrajeFinal: 100,
    });

    // En liquidación: Chofer gastó 20.000 en peaje (efectivo esperado = 280.000)
    // Pero solo entrega 260.000 (Faltante = 20.000)
    const settleRes = await deliveryRouteService.liquidarRutaTransportador({
      manifiestoId: manId,
      liquidadoPor: 'Tesorero Central',
      efectivoFisicoEntregado: 260000,
      gastos: [
        {
          tipoGasto: 'PEAJE',
          monto: 20000,
          numeroComprobante: 'TICK-99',
          descripcion: 'Peaje retorno',
        },
      ],
      observacionesLiquidacion: 'Faltante de 20.000 a descontar en nómina',
    });

    expect(settleRes.success).toBe(true);
    expect(settleRes.data?.estado).toBe('LIQUIDADA');
    expect(settleRes.data?.totalRecaudadoEfectivo).toBe(300000);
    expect(settleRes.data?.totalGastosRuta).toBe(20000);
    expect(settleRes.data?.efectivoNetoEntregado).toBe(260000);
    expect(settleRes.data?.diferenciaCuadre).toBe(-20000);

    // Verificar movimientos registrados en cashService
    const movimientos = localDb.load<any[]>('movimientosCaja', []);
    // Debe haber un movimiento de INGRESO_VENTA por los 260.000 entregados
    const movIngreso = movimientos.find((m) => m.tipo === 'INGRESO_VENTA');
    expect(movIngreso).toBeDefined();
    expect(movIngreso.monto).toBe(260000);

    // Debe haber un movimiento de AJUSTE_FALTANTE por los 20.000 con deducible al conductor
    const movFaltante = movimientos.find((m) => m.tipo === 'AJUSTE_FALTANTE');
    expect(movFaltante).toBeDefined();
    expect(movFaltante.monto).toBe(20000);
    expect(movFaltante.concepto).toContain('Carlos Rodríguez');
  });

  it('6. Debe segregar devoluciones en inventario al liquidar (REINGRESO vs AVERIAS)', async () => {
    // Configurar catálogo semilla para SKU
    localDb.save('productsCatalog', [
      { id: 'prod-cam-1', sku: 'CAM-TIG-01', nombre: 'Camarón Tigre', unidad: 'KG' },
    ]);
    localDb.save('stock', {
      '1': { 'CAM-TIG-01': 50 },
      '2': { 'CAM-TIG-01': 5 },
    });

    const createRes = deliveryRouteService.crearManifiestoRuta(
      {
        conductorId: 'cond-01',
        conductorNombre: 'Carlos Rodríguez',
        vehiculoPlaca: 'WXF-456',
        zonaRuta: 'Zona Norte',
        pedidosIds: ['ped-1'],
      },
      [{ id: 'ped-1', totalNeto: 100000, items: [] }]
    );
    const manId = createRes.data!.id;
    deliveryRouteService.iniciarRuta(manId);

    // Entrega parcial con 2 devoluciones:
    // 1 a REINGRESO_STOCK (2 kg)
    // 1 a CUARENTENA_CALIDAD (1 kg por avería)
    deliveryRouteService.registrarEntregaPedido({
      manifiestoId: manId,
      pedidoId: 'ped-1',
      estadoEntrega: 'ENTREGADO_PARCIAL',
      formaPago: 'EFECTIVO',
      montoOriginal: 100000,
      montoCobradoFinal: 50000,
      montoEfectivo: 50000,
      montoDigital: 0,
      devoluciones: [
        {
          productoId: 'prod-cam-1',
          sku: 'CAM-TIG-01',
          nombre: 'Camarón Tigre',
          cantidadDevueltaKg: 2,
          precioUnitario: 25000,
          montoDescontado: 50000,
          motivoRechazo: 'PRODUCTO_EQUIVOCADO',
          destinoBodega: 'REINGRESO_STOCK',
        },
        {
          productoId: 'prod-cam-1',
          sku: 'CAM-TIG-01',
          nombre: 'Camarón Tigre',
          cantidadDevueltaKg: 1,
          precioUnitario: 25000,
          montoDescontado: 25000,
          motivoRechazo: 'EMPAQUE_AVERIADO',
          destinoBodega: 'CUARENTENA_CALIDAD',
        },
      ],
    });

    await deliveryRouteService.liquidarRutaTransportador({
      manifiestoId: manId,
      liquidadoPor: 'Tesorero Central',
      efectivoFisicoEntregado: 50000,
      gastos: [],
    });

    // Verificar segregación de inventario
    const stockFinal = localDb.load<Record<string, Record<string, number>>>('stock', {});
    // Bodega Principal ('1'): 50 + 2 = 52
    expect(stockFinal['1']['CAM-TIG-01']).toBe(52);
    // Bodega Averías ('2'): 5 + 1 = 6
    expect(stockFinal['2']['CAM-TIG-01']).toBe(6);
  });
});

