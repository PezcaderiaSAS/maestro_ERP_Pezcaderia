import { describe, it, expect } from 'vitest';
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
