// src/tests/deltaSync.schema.test.ts
// Pruebas Unitarias TDD para Esquemas Zod de Sincronización Resiliente y Outbox (SPEC-041 / TASK-041-01)

import { describe, it, expect } from 'vitest';
import {
  TipoOperacionOutboxSchema,
  PreventaSyncSchema,
  OutboxTransactionSchema,
  SyncConflictSchema,
  DeltaSyncQuerySchema,
  SyncMetadataSchema,
  generarIdempotencyKey,
  validarPreventaSync,
  validarOutboxTransaction,
} from '../types/deltaSync.schema';

describe('TASK-041-01: Esquemas Zod de Sincronización Delta y Outbox', () => {
  describe('TipoOperacionOutboxSchema', () => {
    it('debe aceptar operaciones válidas del flujo multivendedor y POS', () => {
      const validOps = [
        'EMITIR_PREVENTA_MULTIVENDEDOR',
        'COBRAR_PREVENTA_CAJA_UNICA',
        'VENTA_POS_DIRECTA',
        'ACTUALIZACION_STOCK_DELTA',
        'CAMBIO_PRECIO_CATALOGO',
        'COTIZACION_B2B',
      ];

      for (const op of validOps) {
        const result = TipoOperacionOutboxSchema.safeParse(op);
        expect(result.success).toBe(true);
      }
    });

    it('debe rechazar operaciones no contempladas en el contrato', () => {
      const result = TipoOperacionOutboxSchema.safeParse('OPERACION_INVALIDA');
      expect(result.success).toBe(false);
    });
  });

  describe('generarIdempotencyKey', () => {
    it('debe generar un hash determinista SHA-256 de 64 caracteres hexadecimales', async () => {
      const key1 = await generarIdempotencyKey({
        tenantId: 'tenant-03',
        tipoOperacion: 'EMITIR_PREVENTA_MULTIVENDEDOR',
        entidadId: 'pref-12345',
        creadoEn: '2026-10-29T06:00:00.000Z',
      });

      expect(key1).toHaveLength(64);
      expect(key1).toMatch(/^[a-f0-9]{64}$/);

      // Determinismo: idénticos parámetros producen idéntico hash
      const key2 = await generarIdempotencyKey({
        tenantId: 'tenant-03',
        tipoOperacion: 'EMITIR_PREVENTA_MULTIVENDEDOR',
        entidadId: 'pref-12345',
        creadoEn: '2026-10-29T06:00:00.000Z',
      });
      expect(key1).toBe(key2);

      // Diferente timestamp genera diferente hash
      const key3 = await generarIdempotencyKey({
        tenantId: 'tenant-03',
        tipoOperacion: 'EMITIR_PREVENTA_MULTIVENDEDOR',
        entidadId: 'pref-12345',
        creadoEn: '2026-10-29T06:00:01.000Z',
      });
      expect(key1).not.toBe(key3);
    });
  });

  describe('PreventaSyncSchema & validarPreventaSync', () => {
    const validPreventa = {
      id: 'a0000000-0000-0000-0000-000000000001',
      tenantId: 'tenant-03',
      codigoPreventa: 'PRE-2026-01001',
      terminalId: 'TERM-01',
      vendedorId: 'vend-001',
      vendedorNombre: 'Diego Díaz',
      clienteDocumento: '1098765432',
      clienteNombre: 'Construcciones El Roble S.A.S.',
      items: [
        {
          productoId: 'prod-001',
          sku: 'TUB-PVC-01',
          nombre: 'Tubo Sanitario PVC 1/2 pulgada x 3m',
          cantidad: 10,
          precioUnitario: 12500,
          descuentoPct: 0,
          subtotal: 125000,
        },
      ],
      subtotal: 125000,
      descuentoTotal: 0,
      total: 125000,
      estado: 'PENDIENTE_COBRO' as const,
      version: 1,
      idempotencyKey: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      createdAt: '2026-10-29T06:00:00.000Z',
      updatedAt: '2026-10-29T06:00:00.000Z',
    };

    it('debe validar exitosamente una comanda/preventa multivendedor válida', () => {
      const res = validarPreventaSync(validPreventa);
      expect(res.success).toBe(true);
      expect(res.data?.codigoPreventa).toBe('PRE-2026-01001');
      expect(res.data?.vendedorNombre).toBe('Diego Díaz');
    });

    it('debe rechazar preventas con código de preventa con formato erróneo', () => {
      const res = validarPreventaSync({
        ...validPreventa,
        codigoPreventa: 'CODIGO-INVALIDO-123',
      });
      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
    });

    it('debe rechazar preventas sin ítems o con totales negativos', () => {
      const resEmpty = validarPreventaSync({
        ...validPreventa,
        items: [],
      });
      expect(resEmpty.success).toBe(false);

      const resNegative = validarPreventaSync({
        ...validPreventa,
        total: -500,
      });
      expect(resNegative.success).toBe(false);
    });

    it('debe rechazar versiones OCC no enteras o menores a 1', () => {
      const resZero = validarPreventaSync({
        ...validPreventa,
        version: 0,
      });
      expect(resZero.success).toBe(false);
    });
  });

  describe('OutboxTransactionSchema & validarOutboxTransaction', () => {
    const validOutbox = {
      id: 'b0000000-0000-0000-0000-000000000002',
      tenantId: 'tenant-03',
      idempotencyKey: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      tipoOperacion: 'EMITIR_PREVENTA_MULTIVENDEDOR' as const,
      entidadId: 'a0000000-0000-0000-0000-000000000001',
      versionEntidad: 1,
      payload: {
        codigoPreventa: 'PRE-2026-01001',
        total: 125000,
      },
      estado: 'PENDIENTE' as const,
      intentos: 0,
      maxIntentos: 5,
      creadoEn: '2026-10-29T06:00:00.000Z',
    };

    it('debe validar una transacción Outbox nueva en estado PENDIENTE', () => {
      const res = validarOutboxTransaction(validOutbox);
      expect(res.success).toBe(true);
      expect(res.data?.intentos).toBe(0);
      expect(res.data?.maxIntentos).toBe(5);
    });

    it('debe aceptar estados de ciclo de vida completos (ERROR_REINTENTO, ERROR_FATAL_DATOS, SINCRONIZADO)', () => {
      const estados = ['PENDIENTE', 'EN_PROCESO', 'SINCRONIZADO', 'ERROR_REINTENTO', 'ERROR_FATAL_DATOS'] as const;
      for (const st of estados) {
        const res = validarOutboxTransaction({
          ...validOutbox,
          estado: st,
        });
        expect(res.success).toBe(true);
      }
    });

    it('debe rechazar transacciones sin idempotencyKey de 64 caracteres', () => {
      const res = validarOutboxTransaction({
        ...validOutbox,
        idempotencyKey: 'short-key',
      });
      expect(res.success).toBe(false);
    });
  });

  describe('SyncConflictSchema (OCC)', () => {
    it('debe validar un registro de colisión OCC con ambas versiones y payloads', () => {
      const conflict = {
        id: 'c0000000-0000-0000-0000-000000000003',
        tenantId: 'tenant-03',
        outboxTransactionId: 'b0000000-0000-0000-0000-000000000002',
        entidadNombre: 'pos_prefacturas',
        entidadId: 'a0000000-0000-0000-0000-000000000001',
        versionCliente: 1,
        versionServidor: 2,
        payloadCliente: { estado: 'PAGADO', cajeroId: 'caj-01' },
        payloadServidor: { estado: 'ANULADO', motivo: 'Cancelación telefónica' },
        resolucion: 'CLIENT_WINS' as const,
        resueltoPor: 'MOTOR_OCC_CLIENT_WINS',
        resueltoEn: '2026-10-29T06:05:00.000Z',
      };

      const res = SyncConflictSchema.safeParse(conflict);
      expect(res.success).toBe(true);
    });
  });

  describe('DeltaSyncQuerySchema & SyncMetadataSchema', () => {
    it('debe validar parámetros de consulta delta limitados a 500 registros', () => {
      const query = {
        tenantId: 'tenant-03',
        sinceTimestamp: '2026-10-29T00:00:00.000Z',
        limit: 500,
        tablas: ['productos', 'pos_prefacturas', 'stock'],
      };

      const res = DeltaSyncQuerySchema.safeParse(query);
      expect(res.success).toBe(true);
    });

    it('debe rechazar límites superiores a 500 registros para proteger el Free Tier', () => {
      const query = {
        tenantId: 'tenant-03',
        sinceTimestamp: '2026-10-29T00:00:00.000Z',
        limit: 1000,
      };

      const res = DeltaSyncQuerySchema.safeParse(query);
      expect(res.success).toBe(false);
    });

    it('debe validar metadatos de sincronización del tenant', () => {
      const meta = {
        tenantId: 'tenant-03',
        lastSyncTimestamp: '2026-10-29T06:00:00.000Z',
        totalProductosSincronizados: 5351,
        totalClientesSincronizados: 9550,
        totalPreventasPendientes: 12,
        versionEsquema: 1,
        ultimoEstadoSync: 'EXITOSO' as const,
        actualizadoEn: '2026-10-29T06:00:00.000Z',
      };

      const res = SyncMetadataSchema.safeParse(meta);
      expect(res.success).toBe(true);
    });
  });
});

