/**
 * Servicio Central de Purga y Resiembra Atómica de Base de Datos
 *
 * Responsabilidades:
 * 1. Purgar datos masivos locales (IndexedDB: PezcaderiaERP_{tenantId}, outbox, borradores y caches).
 * 2. Limpiar selectivamente localStorage respetando opcionalmente la sesión de turno y usuario.
 * 3. Resembrar de forma instantánea el catálogo semilla ligero (25 productos y 10 clientes canónicos < 12KB)
 *    en Zustand Stores y almacenamiento local.
 * 4. Invocar la purga remota acotada por tenant en Supabase mediante RPC sin romper el hilo de ejecución.
 */

import { SEED_LIGHT_CLIENTES, SEED_LIGHT_PRODUCTOS, getSeedLightStock } from '../data/seedLightData';
import { purgeConfigSchema, type PurgeConfig } from '../schemas/purgeConfig.schema';
import { useClientStore } from '../store/useClientStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { tenantIndexedDb } from './tenantIndexedDbService';
import * as localDb from './localDb';
import { supabase } from '../lib/supabase';

export interface PurgeLocalResult {
  success: boolean;
  durationMs: number;
  clientesResembrados: number;
  productosResembrados: number;
  tenantId: string;
  timestamp: string;
}

export interface PurgeAllResult {
  local: PurgeLocalResult;
  remotoSuccess: boolean;
  remotoMensaje?: string;
}

export class DatabasePurgeService {
  /**
   * Ejecuta la purga local inmediata y resiembra del catálogo ligero en < 60ms.
   */
  public async purgeLocalDatabase(options?: Partial<PurgeConfig>): Promise<PurgeLocalResult> {
    const startTime = performance.now();
    const config = purgeConfigSchema.parse({
      tenantId: options?.tenantId || 'tenant-03',
      limpiarRemotoSupabase: options?.limpiarRemotoSupabase ?? true,
      conservarSesionTurno: options?.conservarSesionTurno ?? false,
      motivo: options?.motivo || 'Purga y optimización de base de datos local',
    });

    // 1. Limpieza de LocalStorage
    this.cleanLocalStorage(config.conservarSesionTurno);

    // 2. Limpieza de IndexedDB
    try {
      await tenantIndexedDb.init(config.tenantId);
      await tenantIndexedDb.clearTenantData();
    } catch (idbErr) {
      console.warn('Aviso limpiando IndexedDB del tenant:', idbErr);
    }

    // 3. Resiembra en Zustand Stores
    const lightStock = getSeedLightStock();
    const pricings = SEED_LIGHT_PRODUCTOS.map((p) => ({
      id: `prc-${p.id}`,
      productoId: p.id,
      precio_pos: p.precio_venta_pos,
      precio_restaurante: p.precio_venta_restaurante,
      precio_mayorista: p.precio_venta_mayorista,
      vigenciaDesde: new Date().toISOString(),
    }));

    // Sincronizar useClientStore
    const clientStore = useClientStore.getState();
    clientStore.setClientes(SEED_LIGHT_CLIENTES as any);

    // Sincronizar useInventoryStore
    const inventoryStore = useInventoryStore.getState();
    inventoryStore.setProducts(SEED_LIGHT_PRODUCTOS as any);
    inventoryStore.setProductsCatalog(SEED_LIGHT_PRODUCTOS as any);
    inventoryStore.setProductPricings(pricings);

    const initialStockMap = {
      'Bodega Principal': lightStock,
      b1: lightStock,
      'b-1': lightStock,
    };
    inventoryStore.setStock(initialStockMap);

    // 4. Persistir dataset ligero en localStorage (< 12KB) para mantener el arranque ultra rápido
    try {
      localDb.save('clientes', SEED_LIGHT_CLIENTES);
      localDb.save('productsCatalog', SEED_LIGHT_PRODUCTOS);
      localDb.save('productPricings', pricings);
      localDb.save('stock', initialStockMap);
    } catch (saveErr) {
      console.warn('Aviso guardando dataset ligero en localDb:', saveErr);
    }

    const durationMs = Math.round(performance.now() - startTime);

    return {
      success: true,
      durationMs,
      clientesResembrados: SEED_LIGHT_CLIENTES.length,
      productosResembrados: SEED_LIGHT_PRODUCTOS.length,
      tenantId: config.tenantId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Invoca la función RPC en Supabase para purgar datos del tenant en el backend.
   */
  public async purgeRemoteDatabase(tenantId: string): Promise<{ success: boolean; mensaje: string }> {
    try {
      if (!supabase || typeof supabase.rpc !== 'function') {
        return { success: true, mensaje: 'Simulado en entorno sin cliente remoto Supabase activo' };
      }

      const { data, error } = await supabase.rpc('rpc_purge_tenant_data', {
        p_tenant_id: tenantId,
      });

      if (error) {
        console.warn('Aviso RPC Supabase (rpc_purge_tenant_data):', error.message);
        return { success: false, mensaje: error.message };
      }

      return {
        success: true,
        mensaje: (data as any)?.mensaje || 'Purga remota en Supabase ejecutada exitosamente',
      };
    } catch (err: any) {
      console.warn('Error no bloqueante en purga remota Supabase:', err);
      return { success: false, mensaje: err?.message || 'Error de conexión remota' };
    }
  }

  /**
   * Ejecuta purga local + purga remota combinadas.
   */
  public async purgeAll(options?: Partial<PurgeConfig>): Promise<PurgeAllResult> {
    const localResult = await this.purgeLocalDatabase(options);
    let remotoSuccess = true;
    let remotoMensaje: string | undefined;

    if (options?.limpiarRemotoSupabase !== false) {
      const remoteRes = await this.purgeRemoteDatabase(localResult.tenantId);
      remotoSuccess = remoteRes.success;
      remotoMensaje = remoteRes.mensaje;
    }

    return {
      local: localResult,
      remotoSuccess,
      remotoMensaje,
    };
  }

  /**
   * Limpia selectivamente las entradas de localStorage.
   */
  private cleanLocalStorage(conservarSesionTurno: boolean): void {
    if (typeof localStorage === 'undefined') return;

    const sessionKeysToKeep = new Set<string>([
      localDb.DB_KEYS.currentUser,
      localDb.DB_KEYS.sesionActiva,
      localDb.DB_KEYS.turnosCaja,
      localDb.DB_KEYS.turnos,
      localDb.DB_KEYS.cajas,
      localDb.DB_KEYS.theme,
      'debug',
    ]);

    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      if (conservarSesionTurno && sessionKeysToKeep.has(key)) {
        continue;
      }

      // Remover claves con prefijos del ERP o de datos pesados
      if (
        key.startsWith('pezcaderia_') ||
        key.startsWith('pezca_') ||
        key === 'lastClientPrices' ||
        key === 'dynamicFields'
      ) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  }
}

export const databasePurgeService = new DatabasePurgeService();
