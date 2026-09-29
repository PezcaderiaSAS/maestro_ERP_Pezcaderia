import { describe, it, expect } from 'vitest';
import {
  CreateInternalTransferRequestSchema,
  DispatchInternalTransferSchema,
  ReceiveInternalTransferChecklistSchema,
  InternalTransferItemSchema,
} from '../../packages/validation-schemas/src';

describe('Módulo de Traslados Internos y Reabastecimiento POS - Schemas Zod', () => {
  const itemValido = {
    productoId: 'prod-trucha-01',
    sku: 'TRUCHA-ENT-01',
    nombre: 'Trucha Arcoíris Entera Eviscerada',
    unidadMedida: 'KG',
    cantidadSolicitada: 15.5,
    costoUnitario: 18000,
    estadoItem: 'PENDIENTE' as const,
  };

  describe('1. Validación de Solicitud de Reabastecimiento POS (CreateInternalTransferRequestSchema)', () => {
    it('debe validar exitosamente una solicitud de reabastecimiento válida', () => {
      const payload = {
        bodegaOrigenId: 'bodega-principal',
        bodegaOrigenNombre: 'Cuarto Frío Principal',
        bodegaDestinoId: 'bodega-pos',
        bodegaDestinoNombre: 'Punto de Venta Mostrador',
        prioridad: 'URGENTE' as const,
        solicitadoPor: 'Cajero POS Central',
        observaciones: 'Stock de trucha en mostrador menor a 2 kg',
        items: [itemValido],
      };

      const result = CreateInternalTransferRequestSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items.length).toBe(1);
        expect(result.data.items[0].cantidadSolicitada).toBe(15.5);
      }
    });

    it('debe rechazar si bodega de origen y destino son la misma', () => {
      const payload = {
        bodegaOrigenId: 'bodega-principal',
        bodegaDestinoId: 'bodega-principal',
        solicitadoPor: 'Cajero POS',
        items: [itemValido],
      };

      const result = CreateInternalTransferRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('no pueden ser la misma');
      }
    });

    it('debe rechazar si no contiene ítems', () => {
      const payload = {
        bodegaOrigenId: 'bodega-principal',
        bodegaDestinoId: 'bodega-pos',
        solicitadoPor: 'Cajero POS',
        items: [],
      };

      const result = CreateInternalTransferRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('debe rechazar si la cantidad solicitada es menor o igual a cero', () => {
      const itemInvalido = { ...itemValido, cantidadSolicitada: -5 };
      const result = InternalTransferItemSchema.safeParse(itemInvalido);
      expect(result.success).toBe(false);
    });
  });

  describe('2. Validación de Alistamiento y Despacho en Bodega (DispatchInternalTransferSchema)', () => {
    it('debe validar exitosamente el despacho con lote FEFO y pesaje', () => {
      const payload = {
        trasladoId: 'trf-20260929-001',
        despachadoPor: 'Bodeguero Central',
        temperaturaSalidaC: 1.8,
        itemsDespachados: [
          {
            productoId: 'prod-trucha-01',
            cantidadDespachada: 15.2,
            loteFefo: 'LOT-TRU-2026-09A',
            fechaVencimientoLote: '2026-10-05',
            temperaturaC: 2.1,
          },
        ],
        observacionesDespacho: 'Pesado en báscula industrial 01',
      };

      const result = DispatchInternalTransferSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('debe rechazar despacho si falta el lote FEFO', () => {
      const payload = {
        trasladoId: 'trf-20260929-001',
        despachadoPor: 'Bodeguero Central',
        itemsDespachados: [
          {
            productoId: 'prod-trucha-01',
            cantidadDespachada: 15.2,
            loteFefo: '', // Vacío
          },
        ],
      };

      const result = DispatchInternalTransferSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('lote FEFO es obligatorio');
      }
    });
  });

  describe('3. Validación de Recepción Checklist con Novedades en POS (ReceiveInternalTransferChecklistSchema)', () => {
    it('debe validar exitosamente cuando todos los ítems están conformes', () => {
      const payload = {
        trasladoId: 'trf-20260929-001',
        recibidoPor: 'Cajero POS Turno Mañana',
        itemsVerificados: [
          {
            productoId: 'prod-trucha-01',
            cantidadRecibida: 15.2,
            cantidadDespachadaOriginal: 15.2,
            conforme: true,
          },
        ],
      };

      const result = ReceiveInternalTransferChecklistSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('debe validar cuando hay discrepancia pero se justifica detalladamente la novedad', () => {
      const payload = {
        trasladoId: 'trf-20260929-001',
        recibidoPor: 'Cajero POS Turno Mañana',
        itemsVerificados: [
          {
            productoId: 'prod-trucha-01',
            cantidadRecibida: 13.5, // 1.7 kg menos
            cantidadDespachadaOriginal: 15.2,
            conforme: false,
            novedadMotivo: 'DIFERENCIA_PESO' as const,
            novedadDetalle: 'Se recibió canastilla incompleta. Faltaron 2 piezas en el peso real al verificar en báscula de mostrador.',
          },
        ],
        observacionesRecepcion: 'Se recibe con acta de novedad firmada por transportador interno',
      };

      const result = ReceiveInternalTransferChecklistSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('debe RECHAZAR si hay discrepancia de cantidades o no conforme y NO se detalla la novedad', () => {
      const payload = {
        trasladoId: 'trf-20260929-001',
        recibidoPor: 'Cajero POS Turno Mañana',
        itemsVerificados: [
          {
            productoId: 'prod-trucha-01',
            cantidadRecibida: 10.0,
            cantidadDespachadaOriginal: 15.2,
            conforme: false,
            novedadMotivo: 'DIFERENCIA_PESO' as const,
            novedadDetalle: '', // Vacío
          },
        ],
      };

      const result = ReceiveInternalTransferChecklistSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('debe registrar el motivo y detalle de la novedad');
      }
    });
  });
});
