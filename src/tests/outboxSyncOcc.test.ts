// src/tests/outboxSyncOcc.test.ts
// Pruebas Unitarias TDD para el Manejador OCC e Integración con Caja Única (SPEC-041 / TASK-041-02)

import { describe, it, expect, beforeEach } from 'vitest';
import { useOutboxSyncStore } from '../stores/useOutboxSyncStore';
import { TenantIndexedDbService } from '../services/tenantIndexedDbService';
import type { PreventaSync } from '../types/deltaSync.schema';

describe('TASK-041-02: useOutboxSyncStore & Manejador de Conflictos OCC', () => {
  let dbService: TenantIndexedDbService;
  const testTenantId = 'tenant-03';

  beforeEach(async () => {
    dbService = new TenantIndexedDbService();
    await dbService.init(testTenantId);
    await dbService.clearAll();

    // Reinicializar store con el servicio de base de datos
    useOutboxSyncStore.getState().init(testTenantId, dbService);
  });

  describe('Flujo Multivendedor con Caja Única de Recaudo', () => {
    it('debe emitir una preventa desde mostrador y reflejarla inmediatamente en la cola de Caja Única', async () => {
      const store = useOutboxSyncStore.getState();

      const preventaData: Omit<PreventaSync, 'id' | 'codigoPreventa' | 'version' | 'idempotencyKey' | 'createdAt' | 'updatedAt' | 'estado'> = {
        tenantId: testTenantId,
        terminalId: 'TERM-01',
        vendedorId: 'vend-diego',
        vendedorNombre: 'Diego Díaz',
        clienteDocumento: '1098765432',
        clienteNombre: 'Ferretería El Tornillo',
        items: [
          {
            productoId: 'prod-001',
            sku: 'TUB-PVC-12',
            nombre: 'Tubo PVC 1/2',
            cantidad: 5,
            precioUnitario: 10000,
            descuentoPct: 0,
            subtotal: 50000,
          },
        ],
        subtotal: 50000,
        descuentoTotal: 0,
        total: 50000,
      };

      const resultado = await store.emitirPreventaVendedor(preventaData);
      expect(resultado.ok).toBe(true);
      expect(resultado.preventa).toBeDefined();
      expect(resultado.preventa?.codigoPreventa).toMatch(/^PRE-\d{4}-\d{5}$/);
      expect(resultado.preventa?.estado).toBe('PENDIENTE_COBRO');

      // Verificación en la cola de Caja Única
      const comandas = store.getComandasCajaUnica();
      expect(comandas).toHaveLength(1);
      expect(comandas[0].consecutivoTicket).toBe(resultado.preventa?.codigoPreventa);
      expect(comandas[0].vendedorNombre).toBe('Diego Díaz');
      expect(comandas[0].montoTotal).toBe(50000);

      // Verificación en la cola Outbox
      const pendingOutbox = await dbService.getPendingOutboxTransactions();
      expect(pendingOutbox).toHaveLength(1);
      expect(pendingOutbox[0].tipoOperacion || pendingOutbox[0].tipo).toBe('EMITIR_PREVENTA_MULTIVENDEDOR');
    });

    it('debe permitir a la taquilla de Caja Única cobrar una comanda y removerla de pendientes', async () => {
      const store = useOutboxSyncStore.getState();

      // 1. Emitir comanda
      const resultado = await store.emitirPreventaVendedor({
        tenantId: testTenantId,
        terminalId: 'TERM-02',
        vendedorId: 'vend-santiago',
        vendedorNombre: 'Santiago Pallares',
        clienteNombre: 'Cliente Ocasional',
        items: [
          {
            productoId: 'prod-002',
            sku: 'MART-01',
            nombre: 'Martillo Galponero 16oz',
            cantidad: 1,
            precioUnitario: 35000,
            descuentoPct: 0,
            subtotal: 35000,
          },
        ],
        subtotal: 35000,
        descuentoTotal: 0,
        total: 35000,
      });

      const prefacturaId = resultado.preventa!.id;

      // 2. Cobrar en taquilla central
      const cobroRes = await store.cobrarComandaCajaUnica(prefacturaId, {
        cajeroId: 'cajero-principal',
        turnoCentralId: 'turno-001',
        metodoPago: 'EFECTIVO',
      });

      expect(cobroRes.ok).toBe(true);

      // 3. Ya no debe figurar en comandas pendientes de cobro
      const comandas = store.getComandasCajaUnica();
      expect(comandas.find((c) => c.id === prefacturaId)).toBeUndefined();

      // 4. Debe existir una transacción de cobro en Outbox
      const pendingOutbox = await dbService.getPendingOutboxTransactions();
      const cobroTx = pendingOutbox.find(
        (t) => (t.tipoOperacion || t.tipo) === 'COBRAR_PREVENTA_CAJA_UNICA'
      );
      expect(cobroTx).toBeDefined();
      expect(cobroTx?.payload.prefacturaId).toBe(prefacturaId);
    });
  });

  describe('Motor de Resolución de Conflictos OCC (Optimistic Concurrency Control)', () => {
    it('debe aplicar CLIENT_WINS determinista en colisiones de ventas/cobros en mostrador físico', async () => {
      const store = useOutboxSyncStore.getState();

      const conflictInput = {
        outboxTransactionId: 'tx-001',
        entidadNombre: 'pos_prefacturas',
        entidadId: 'pref-999',
        versionCliente: 1,
        versionServidor: 2,
        tipoOperacion: 'COBRAR_PREVENTA_CAJA_UNICA' as const,
        payloadCliente: { estado: 'PAGADO', cajeroId: 'cajero-01', total: 45000 },
        payloadServidor: { estado: 'ANULADO', motivo: 'Cancelación externa' },
      };

      const resolucion = await store.resolverConflictoOCC(conflictInput);

      expect(resolucion.politicaAplicada).toBe('CLIENT_WINS');
      expect(resolucion.payloadFinal.estado).toBe('PAGADO');

      // Debe registrarse en sync_conflicts para auditoría
      const conflictos = await store.getHistorialConflictos();
      expect(conflictos).toHaveLength(1);
      expect(conflictos[0].resolucion).toBe('CLIENT_WINS');
      expect(conflictos[0].versionCliente).toBe(1);
      expect(conflictos[0].versionServidor).toBe(2);
    });

    it('debe aplicar SERVER_WINS en colisiones de maestros de catálogo de productos', async () => {
      const store = useOutboxSyncStore.getState();

      const conflictInput = {
        outboxTransactionId: 'tx-002',
        entidadNombre: 'productos_catalogo',
        entidadId: 'sku-pvc-100',
        versionCliente: 1,
        versionServidor: 3,
        tipoOperacion: 'CAMBIO_PRECIO_CATALOGO' as const,
        payloadCliente: { precioDetal: 15000 },
        payloadServidor: { precioDetal: 18000, updatedAt: '2026-10-29T06:30:00.000Z' },
      };

      const resolucion = await store.resolverConflictoOCC(conflictInput);

      expect(resolucion.politicaAplicada).toBe('SERVER_WINS');
      expect(resolucion.payloadFinal.precioDetal).toBe(18000);
    });
  });

  describe('Dead-Letter Queue (DLQ) para Errores Fatales No Bloqueantes', () => {
    it('debe aislar transacciones en ERROR_FATAL_DATOS sin bloquear el procesamiento de la cola', async () => {
      const store = useOutboxSyncStore.getState();

      // Encolar dos transacciones
      const tx1Id = await store.encolarTransaccion(
        'VENTA_POS_DIRECTA',
        'vta-001',
        { datosCorruptos: true },
        1
      );

      const tx2Id = await store.encolarTransaccion(
        'VENTA_POS_DIRECTA',
        'vta-002',
        { total: 20000 },
        1
      );

      // Simular error fatal en tx1
      await store.marcarTransaccionError(tx1Id, 'Error 422: Datos corruptos irrecuperables', true);

      // La cola activa no debe incluir tx1
      const colaActiva = store.getTransaccionesActivas();
      expect(colaActiva.find((t) => t.id === tx1Id)).toBeUndefined();
      expect(colaActiva.find((t) => t.id === tx2Id)).toBeDefined();

      // tx1 debe residir en DLQ
      const dlq = store.getTransaccionesDlq();
      expect(dlq).toHaveLength(1);
      expect(dlq[0].id).toBe(tx1Id);
      expect(dlq[0].estado).toBe('ERROR_FATAL_DATOS');
    });

    it('debe permitir al supervisor reintentar un ítem de DLQ con payload corregido', async () => {
      const store = useOutboxSyncStore.getState();

      const txId = await store.encolarTransaccion(
        'COTIZACION_B2B',
        'cot-001',
        { nitInvalido: '000' },
        1
      );

      await store.marcarTransaccionError(txId, 'NIT inválido', true);
      expect(store.getTransaccionesDlq()).toHaveLength(1);

      // Reintentar con datos subsanados
      await store.reintentarTransaccionDlq(txId, { nitInvalido: undefined, nitValido: '900123456-1' });

      // Ya no está en DLQ y vuelve a estar PENDIENTE
      expect(store.getTransaccionesDlq()).toHaveLength(0);
      const activas = store.getTransaccionesActivas();
      const reintentada = activas.find((t) => t.id === txId);
      expect(reintentada).toBeDefined();
      expect(reintentada?.estado).toBe('PENDIENTE');
      expect(reintentada?.payload.nitValido).toBe('900123456-1');
    });
  });
});

