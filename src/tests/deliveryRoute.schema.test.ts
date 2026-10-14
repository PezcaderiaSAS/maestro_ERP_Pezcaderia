import { describe, it, expect } from 'vitest';
import {
  EstadoManifiestoEnum,
  EstadoEntregaPedidoEnum,
  FormaPagoRutaEnum,
  CreateRouteManifestSchema,
  RegisterDeliveryExecutionSchema,
  SettleRouteManifestSchema,
  RouteExpenseSchema,
  RouteReturnItemSchema,
  CheckinRouteLoadSchema,
  ArrivalCheckinSchema,
  DeliveryOutboxEventSchema,
} from '../../packages/validation-schemas/src/deliveryRoute.schema';

describe('CARD-012-01: Esquemas Zod de Validación para Despachos y Rutas B2B', () => {
  describe('1. Enumeraciones y Estados de Ciclo de Vida', () => {
    it('debe incluir todos los estados del ciclo de vida del manifiesto incluyendo EN_LIQUIDACION', () => {
      expect(EstadoManifiestoEnum.options).toEqual([
        'PLANIFICADA',
        'EN_RUTA',
        'EN_LIQUIDACION',
        'LIQUIDADA',
        'CANCELADA',
      ]);
    });

    it('debe incluir estados de entrega conformes, parciales y rechazados', () => {
      expect(EstadoEntregaPedidoEnum.options).toEqual([
        'PENDIENTE',
        'ENTREGADO_TOTAL',
        'ENTREGADO_PARCIAL',
        'NO_ENTREGADO_RECHAZADO',
      ]);
    });

    it('debe soportar formas de pago B2B y mixtas', () => {
      expect(FormaPagoRutaEnum.options).toEqual([
        'CREDITO_B2B',
        'EFECTIVO',
        'TRANSFERENCIA_DIGITAL',
        'MIXTO',
      ]);
    });
  });

  describe('2. Creación de Manifiesto (CreateRouteManifestSchema)', () => {
    it('debe validar un manifiesto válido con múltiples pedidos y parámetros de control', () => {
      const validData = {
        conductorId: 'usr-cond-01',
        conductorNombre: 'Carlos Rodríguez',
        conductorTelefono: '3157894561',
        vehiculoPlaca: 'WXF-456',
        vehiculoTipo: 'Furgón Refrigerado',
        zonaRuta: 'Cabecera y Floridablanca',
        kilometrajeInicial: 142500,
        temperaturaCavaSalida: -18,
        pedidosIds: ['ped-001', 'ped-002', 'ped-003'],
      };

      const parsed = CreateRouteManifestSchema.parse(validData);
      expect(parsed.conductorNombre).toBe('Carlos Rodríguez');
      expect(parsed.pedidosIds.length).toBe(3);
    });

    it('debe rechazar manifiesto sin pedidos o con placa inválida', () => {
      const invalidData = {
        conductorId: 'usr-cond-01',
        conductorNombre: 'Carlos Rodríguez',
        vehiculoPlaca: 'W', // placa muy corta
        zonaRuta: 'Zona Centro',
        pedidosIds: [], // sin pedidos
      };

      expect(() => CreateRouteManifestSchema.parse(invalidData)).toThrow();
    });
  });

  describe('3. Ejecución de Entrega en Calle (RegisterDeliveryExecutionSchema)', () => {
    it('debe validar entrega conforme con pago en efectivo redondeado COP', () => {
      const validExecution = {
        manifiestoId: 'man-001',
        pedidoId: 'ped-001',
        estadoEntrega: 'ENTREGADO_TOTAL' as const,
        formaPago: 'EFECTIVO' as const,
        montoOriginal: 285000,
        montoCobradoFinal: 285000,
        montoEfectivo: 285000,
        montoDigital: 0,
        receptorNombre: 'Andrés Hurtado',
        receptorDocumento: '1098765432',
        firmaClienteUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0...',
        tiempoTransitoMinutos: 25,
        tiempoAtencionMinutos: 15,
        cumplimientoSLA: 'A_TIEMPO' as const,
      };

      const result = RegisterDeliveryExecutionSchema.parse(validExecution);
      expect(result.estadoEntrega).toBe('ENTREGADO_TOTAL');
      expect(result.montoCobradoFinal).toBe(285000);
      expect(result.receptorNombre).toBe('Andrés Hurtado');
    });

    it('debe exigir número de referencia si el pago es por transferencia digital', () => {
      const digitalSinRef = {
        manifiestoId: 'man-001',
        pedidoId: 'ped-001',
        estadoEntrega: 'ENTREGADO_TOTAL' as const,
        formaPago: 'TRANSFERENCIA_DIGITAL' as const,
        montoOriginal: 150000,
        montoCobradoFinal: 150000,
        montoEfectivo: 0,
        montoDigital: 150000,
        referenciaDigital: '', // inválido: vacío
      };

      expect(() => RegisterDeliveryExecutionSchema.parse(digitalSinRef)).toThrow(/referencia/);
    });

    it('debe validar que en pago mixto la suma de efectivo + digital coincida exactamente con montoCobradoFinal', () => {
      const mixtoInvalido = {
        manifiestoId: 'man-001',
        pedidoId: 'ped-001',
        estadoEntrega: 'ENTREGADO_TOTAL' as const,
        formaPago: 'MIXTO' as const,
        montoOriginal: 300000,
        montoCobradoFinal: 300000,
        montoEfectivo: 100000,
        montoDigital: 150000, // 100k + 150k = 250k !== 300k
        referenciaDigital: 'NEQUI-9874',
      };

      expect(() => RegisterDeliveryExecutionSchema.parse(mixtoInvalido)).toThrow(/igualar/);
    });

    it('debe validar entrega parcial con devolución de producto averiado', () => {
      const entregaParcial = {
        manifiestoId: 'man-001',
        pedidoId: 'ped-002',
        estadoEntrega: 'ENTREGADO_PARCIAL' as const,
        formaPago: 'EFECTIVO' as const,
        montoOriginal: 200000,
        montoCobradoFinal: 150000,
        montoEfectivo: 150000,
        montoDigital: 0,
        devoluciones: [
          {
            productoId: 'prod-03',
            sku: 'CAM-TIG-003',
            nombre: 'Camarón Tigre',
            cantidadDevueltaKg: 1.5,
            precioUnitario: 33333,
            montoDescontado: 50000,
            motivoRechazo: 'CALIBRE_INCORRECTO' as const,
            destinoBodega: 'CUARENTENA_CALIDAD' as const,
            observaciones: 'Cliente solicitó calibre 21-25 y llegó 31-35',
          },
        ],
      };

      const result = RegisterDeliveryExecutionSchema.parse(entregaParcial);
      expect(result.devoluciones?.length).toBe(1);
      expect(result.devoluciones?.[0].cantidadDevueltaKg).toBe(1.5);
    });
  });

  describe('4. Liquidación de Ruta en Tesorería (SettleRouteManifestSchema)', () => {
    it('debe validar la liquidación con desglose de gastos operativos y efectivo entregado', () => {
      const settlementData = {
        manifiestoId: 'man-001',
        liquidadoPor: 'usr-tesorero-01',
        efectivoFisicoEntregado: 450000,
        kilometrajeFinal: 142585,
        temperaturaCavaRetorno: -16.5,
        gastos: [
          {
            tipoGasto: 'COMBUSTIBLE' as const,
            monto: 80000,
            numeroComprobante: 'FACT-ESSO-4591',
            descripcion: 'Carga de ACPM en Terpel San Gil',
          },
          {
            tipoGasto: 'PEAJE' as const,
            monto: 15000,
            numeroComprobante: 'PEA-8841',
            descripcion: 'Peaje Lebrija ida y vuelta',
          },
        ],
        observacionesLiquidacion: 'Ruta liquidada sin novedades de frío',
      };

      const parsed = SettleRouteManifestSchema.parse(settlementData);
      expect(parsed.efectivoFisicoEntregado).toBe(450000);
      expect(parsed.gastos?.length).toBe(2);
    });
  });

  describe('5. Eventos Outbox para Operación Offline (DeliveryOutboxEventSchema)', () => {
    it('debe validar el evento outbox con payload JSON estructurado', () => {
      const outboxEvent = {
        id: 'evt-001',
        tenantId: 'tenant-bucaramanga',
        rutaId: 'man-001',
        eventoTipo: 'ENTREGA_CONFIRMADA' as const,
        payload: {
          pedidoId: 'ped-001',
          montoCobrado: 285000,
          firma: 'data:image/svg...',
        },
        estado: 'PENDIENTE' as const,
        timestampCliente: '2026-10-14T12:00:00.000Z',
      };

      const parsed = DeliveryOutboxEventSchema.parse(outboxEvent);
      expect(parsed.eventoTipo).toBe('ENTREGA_CONFIRMADA');
      expect(parsed.estado).toBe('PENDIENTE');
    });
  });
});
