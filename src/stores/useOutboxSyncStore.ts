// src/stores/useOutboxSyncStore.ts
// Store Zustand para Gestión de Outbox Resiliente, Cola de Preventas para Caja Única y Motor OCC (SPEC-041 / TASK-041-02)

import { create } from 'zustand';
import { zustandConsoleMiddleware } from '../lib/consoleMiddleware';
import { TenantIndexedDbService, tenantIndexedDb } from '../services/tenantIndexedDbService';
import { NetworkConnectivityService } from '../services/networkConnectivityService';
import type {
  PreventaSync,
  OutboxTransaction,
  SyncConflict,
  TipoOperacionOutbox,
} from '../types/deltaSync.schema';
import { generarIdempotencyKey } from '../types/deltaSync.schema';
import type { PendingOrderComanda } from '../views/pos/components/PendingOrdersDrawer';

export interface ConflictoOccInput {
  outboxTransactionId: string;
  entidadNombre: string;
  entidadId: string;
  versionCliente: number;
  versionServidor: number;
  tipoOperacion: TipoOperacionOutbox;
  payloadCliente: any;
  payloadServidor: any;
}

export interface ResolucionOccResult {
  politicaAplicada: 'CLIENT_WINS' | 'SERVER_WINS' | 'MERGE_DELTA';
  payloadFinal: any;
}

interface OutboxSyncState {
  tenantId: string;
  networkStatus: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
  activeTransactions: OutboxTransaction[];
  dlqTransactions: OutboxTransaction[];
  preventasLocales: PreventaSync[];
  conflicts: SyncConflict[];
  isSyncing: boolean;

  // Acciones de Inicialización
  init: (tenantId: string, customDb?: TenantIndexedDbService) => Promise<void>;
  setTenantId: (tenantId: string) => void;

  // Flujo Multivendedor con Caja Única de Recaudo
  emitirPreventaVendedor: (
    data: Omit<
      PreventaSync,
      | 'id'
      | 'codigoPreventa'
      | 'version'
      | 'idempotencyKey'
      | 'createdAt'
      | 'updatedAt'
      | 'estado'
    >
  ) => Promise<{ ok: boolean; preventa?: PreventaSync; error?: string }>;
  getComandasCajaUnica: () => PendingOrderComanda[];
  cobrarComandaCajaUnica: (
    prefacturaId: string,
    cobroData: { cajeroId: string; turnoCentralId?: string; metodoPago: string }
  ) => Promise<{ ok: boolean; error?: string }>;

  // Cola Outbox & Resiliencia
  encolarTransaccion: (
    tipoOperacion: TipoOperacionOutbox,
    entidadId: string,
    payload: any,
    versionEntidad?: number
  ) => Promise<string>;
  marcarTransaccionSincronizada: (id: string) => Promise<void>;
  marcarTransaccionError: (id: string, error: string, fatal?: boolean) => Promise<void>;
  getTransaccionesActivas: () => OutboxTransaction[];
  getTransaccionesDlq: () => OutboxTransaction[];
  reintentarTransaccionDlq: (id: string, nuevoPayload?: any) => Promise<void>;
  descartarTransaccionDlq: (id: string, motivo?: string) => Promise<void>;

  // Motor OCC (Optimistic Concurrency Control)
  resolverConflictoOCC: (conflictInput: ConflictoOccInput) => Promise<ResolucionOccResult>;
  getHistorialConflictos: () => Promise<SyncConflict[]>;
}

let dbInstance: TenantIndexedDbService = tenantIndexedDb;
let consecutivoCounter = 1000;

export const useOutboxSyncStore = create<OutboxSyncState>()(
  zustandConsoleMiddleware((set, get) => ({
    tenantId: 'tenant-03',
    networkStatus: 'ONLINE',
    activeTransactions: [],
    dlqTransactions: [],
    preventasLocales: [],
    conflicts: [],
    isSyncing: false,

    init: async (tenantId: string, customDb?: TenantIndexedDbService) => {
      if (customDb) {
        dbInstance = customDb;
      } else {
        dbInstance = tenantIndexedDb;
        await dbInstance.init(tenantId);
      }

      set({ tenantId });

      // Suscripción a cambios de conectividad
      NetworkConnectivityService.subscribe((status) => {
        set({ networkStatus: status.estado });
      });

      // Hidratar preventas locales y transacciones de outbox
      try {
        const preventas = await dbInstance.getPreventasLocales();
        const allOutbox = await dbInstance.getAllOutboxTransactions();
        const conflicts = await dbInstance.getSyncConflicts();

        const activeTransactions = allOutbox.filter((t) => t.estado !== 'ERROR_FATAL_DATOS');
        const dlqTransactions = allOutbox.filter((t) => t.estado === 'ERROR_FATAL_DATOS');

        set({
          preventasLocales: preventas,
          activeTransactions,
          dlqTransactions,
          conflicts,
        });
      } catch (err) {
        console.warn('Error inicializando datos en useOutboxSyncStore:', err);
      }
    },

    setTenantId: (tenantId: string) => {
      set({ tenantId });
    },

    // ==========================================
    // FLUJO MULTIVENDEDOR CON CAJA ÚNICA (SPEC-041)
    // ==========================================

    emitirPreventaVendedor: async (data) => {
      try {
        const { tenantId, preventasLocales } = get();
        const id = `pref-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        consecutivoCounter += 1;
        const year = new Date().getFullYear();
        const codigoPreventa = `PRE-${year}-${String(consecutivoCounter).padStart(5, '0')}`;
        const now = new Date().toISOString();

        const idempotencyKey = await generarIdempotencyKey({
          tenantId: data.tenantId || tenantId,
          tipoOperacion: 'EMITIR_PREVENTA_MULTIVENDEDOR',
          entidadId: id,
          creadoEn: now,
        });

        const nuevaPreventa: PreventaSync = {
          ...data,
          id,
          tenantId: data.tenantId || tenantId,
          codigoPreventa,
          estado: 'PENDIENTE_COBRO',
          version: 1,
          idempotencyKey,
          createdAt: now,
          updatedAt: now,
        };

        // 1. Guardar localmente en IndexedDB (< 5ms)
        await dbInstance.upsertPreventaLocal(nuevaPreventa);

        // 2. Encolar en Outbox para replicación con Supabase
        await get().encolarTransaccion(
          'EMITIR_PREVENTA_MULTIVENDEDOR',
          id,
          nuevaPreventa,
          1
        );

        // 3. Actualizar estado reactivo para que la Caja Única lo vea inmediatamente
        set({
          preventasLocales: [...preventasLocales, nuevaPreventa],
        });

        return { ok: true, preventa: nuevaPreventa };
      } catch (err: any) {
        return { ok: false, error: err?.message || 'Error emitiendo preventa de vendedor' };
      }
    },

    getComandasCajaUnica: () => {
      const { preventasLocales } = get();
      return preventasLocales
        .filter((p) => p.estado === 'PENDIENTE_COBRO')
        .map((p) => ({
          id: p.id,
          consecutivoTicket: p.codigoPreventa,
          terminalId: p.terminalId,
          vendedorId: p.vendedorId,
          vendedorNombre: p.vendedorNombre,
          clienteNombre: p.clienteNombre,
          montoTotal: p.total,
          itemsCount: p.items.length,
          createdAt: p.createdAt,
          estado: 'PENDIENTE_PAGO' as const,
          items: p.items,
        }));
    },

    cobrarComandaCajaUnica: async (prefacturaId, cobroData) => {
      try {
        const { preventasLocales } = get();
        const target = preventasLocales.find((p) => p.id === prefacturaId);
        if (!target) {
          return { ok: false, error: 'Comanda no encontrada' };
        }

        const now = new Date().toISOString();

        // 1. Marcar como pagada localmente en IndexedDB
        await dbInstance.updatePreventaLocalEstado(prefacturaId, 'PAGADO', {
          cajeroId: cobroData.cajeroId,
          turnoCentralId: cobroData.turnoCentralId,
        });

        // 2. Encolar evento de cobro en Outbox
        await get().encolarTransaccion(
          'COBRAR_PREVENTA_CAJA_UNICA',
          prefacturaId,
          {
            prefacturaId,
            cajeroId: cobroData.cajeroId,
            turnoCentralId: cobroData.turnoCentralId,
            metodoPago: cobroData.metodoPago,
            totalCobrado: target.total,
            cobradoEn: now,
          },
          target.version + 1
        );

        // 3. Actualizar estado reactivo en memoria
        const actualizadas = preventasLocales.map((p) =>
          p.id === prefacturaId
            ? {
                ...p,
                estado: 'PAGADO' as const,
                cajeroId: cobroData.cajeroId,
                turnoCentralId: cobroData.turnoCentralId,
                updatedAt: now,
              }
            : p
        );

        set({ preventasLocales: actualizadas });

        return { ok: true };
      } catch (err: any) {
        return { ok: false, error: err?.message || 'Error procesando cobro en Caja Única' };
      }
    },

    // ==========================================
    // COLA OUTBOX & GESTIÓN DE RESILIENCIA
    // ==========================================

    encolarTransaccion: async (tipoOperacion, entidadId, payload, versionEntidad = 1) => {
      const { tenantId, activeTransactions } = get();
      const id = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();

      const idempotencyKey = await generarIdempotencyKey({
        tenantId,
        tipoOperacion,
        entidadId,
        creadoEn: now,
      });

      const nuevaTx: OutboxTransaction = {
        id,
        tenantId,
        idempotencyKey,
        tipoOperacion,
        entidadId,
        versionEntidad,
        payload,
        estado: 'PENDIENTE',
        intentos: 0,
        maxIntentos: 5,
        creadoEn: now,
      };

      // Guardar en IndexedDB
      await dbInstance.addOutboxTransaction({
        tenantId,
        tipo: tipoOperacion as any,
        payload: { ...payload, idempotencyKey, versionEntidad },
      });

      // Actualizar estado de cola activa
      set({
        activeTransactions: [...activeTransactions, nuevaTx],
      });

      return id;
    },

    marcarTransaccionSincronizada: async (id: string) => {
      const { activeTransactions } = get();
      await dbInstance.markOutboxSynced(id);
      set({
        activeTransactions: activeTransactions.filter((t) => t.id !== id),
      });
    },

    marcarTransaccionError: async (id: string, error: string, fatal = false) => {
      const { activeTransactions, dlqTransactions } = get();
      const target = activeTransactions.find((t) => t.id === id);
      if (!target) return;

      const estadoFinal = fatal ? 'ERROR_FATAL_DATOS' : 'ERROR_REINTENTO';
      const updatedTx: OutboxTransaction = {
        ...target,
        estado: estadoFinal,
        intentos: target.intentos + 1,
        ultimoError: error,
      };

      await dbInstance.updateOutboxTransaction(id, updatedTx);

      if (fatal) {
        // Mover a Dead-Letter Queue (DLQ) sin bloquear el resto de la cola
        set({
          activeTransactions: activeTransactions.filter((t) => t.id !== id),
          dlqTransactions: [...dlqTransactions, updatedTx],
        });
      } else {
        set({
          activeTransactions: activeTransactions.map((t) => (t.id === id ? updatedTx : t)),
        });
      }
    },

    getTransaccionesActivas: () => {
      return get().activeTransactions;
    },

    getTransaccionesDlq: () => {
      return get().dlqTransactions;
    },

    reintentarTransaccionDlq: async (id: string, nuevoPayload?: any) => {
      const { dlqTransactions, activeTransactions } = get();
      const target = dlqTransactions.find((t) => t.id === id);
      if (!target) return;

      const reactivada: OutboxTransaction = {
        ...target,
        payload: nuevoPayload ? { ...target.payload, ...nuevoPayload } : target.payload,
        estado: 'PENDIENTE',
        intentos: 0,
        ultimoError: undefined,
      };

      await dbInstance.updateOutboxTransaction(id, reactivada);

      set({
        dlqTransactions: dlqTransactions.filter((t) => t.id !== id),
        activeTransactions: [...activeTransactions, reactivada],
      });
    },

    descartarTransaccionDlq: async (id: string, _motivo?: string) => {
      const { dlqTransactions } = get();
      await dbInstance.markOutboxSynced(id); // Remueve de IndexedDB
      set({
        dlqTransactions: dlqTransactions.filter((t) => t.id !== id),
      });
    },

    // ==========================================
    // MOTOR DE RESOLUCIÓN DE CONFLICTOS OCC
    // ==========================================

    resolverConflictoOCC: async (conflictInput) => {
      const { tenantId, conflicts } = get();
      const id = `occ-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();

      let politica: 'CLIENT_WINS' | 'SERVER_WINS' | 'MERGE_DELTA' = 'CLIENT_WINS';
      let payloadFinal: any = conflictInput.payloadCliente;

      // 1. Regla Determinista: Ventas POS y Cobros en Caja Física prevalecen siempre (CLIENT_WINS)
      if (
        conflictInput.tipoOperacion === 'COBRAR_PREVENTA_CAJA_UNICA' ||
        conflictInput.tipoOperacion === 'VENTA_POS_DIRECTA' ||
        conflictInput.tipoOperacion === 'EMITIR_PREVENTA_MULTIVENDEDOR'
      ) {
        politica = 'CLIENT_WINS';
        payloadFinal = conflictInput.payloadCliente;
      }
      // 2. Regla Determinista: Maestros de Precios y Catálogos en la nube prevalecen (SERVER_WINS)
      else if (conflictInput.tipoOperacion === 'CAMBIO_PRECIO_CATALOGO') {
        politica = 'SERVER_WINS';
        payloadFinal = conflictInput.payloadServidor;
      }
      // 3. Regla Determinista: Ajustes de Stock aplican delta combinado
      else if (conflictInput.tipoOperacion === 'ACTUALIZACION_STOCK_DELTA') {
        politica = 'MERGE_DELTA';
        const deltaCliente = conflictInput.payloadCliente.delta || 0;
        const stockActualServidor = conflictInput.payloadServidor.stockDisponible || 0;
        payloadFinal = {
          ...conflictInput.payloadServidor,
          stockDisponible: stockActualServidor + deltaCliente,
        };
      }

      const syncConflict: SyncConflict = {
        id,
        tenantId,
        outboxTransactionId: conflictInput.outboxTransactionId,
        entidadNombre: conflictInput.entidadNombre,
        entidadId: conflictInput.entidadId,
        versionCliente: conflictInput.versionCliente,
        versionServidor: conflictInput.versionServidor,
        payloadCliente: conflictInput.payloadCliente,
        payloadServidor: conflictInput.payloadServidor,
        resolucion: politica,
        resueltoPor: `MOTOR_OCC_${politica}`,
        resueltoEn: now,
      };

      // Persistir conflicto en IndexedDB para trazabilidad total
      await dbInstance.addSyncConflict(syncConflict);

      set({
        conflicts: [...conflicts, syncConflict],
      });

      return {
        politicaAplicada: politica,
        payloadFinal,
      };
    },

    getHistorialConflictos: async () => {
      return get().conflicts;
    },
  }))
);

