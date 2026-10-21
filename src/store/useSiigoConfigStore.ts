// src/store/useSiigoConfigStore.ts
import { create } from 'zustand';
import type { SiigoCredentialsConfig } from '../../packages/validation-schemas/src/siigoConfig.schema';
import type { EstadoConexionSiigo, SiigoTestPingResult } from '../types/siigo.types';
import { SiigoAuthService } from '../services/siigoAuthService';
import { SiigoHttpDispatcher } from '../services/siigoHttpDispatcher';

const STORAGE_KEY = 'la_pezcaderia_siigo_config';

export interface SiigoConfigStoreState {
  config: SiigoCredentialsConfig | null;
  estadoConexion: EstadoConexionSiigo;
  ultimoPing: SiigoTestPingResult | null;
  isLoading: boolean;
  ultimoError?: string;

  // Acciones
  saveConfig: (newConfig: SiigoCredentialsConfig) => Promise<SiigoTestPingResult>;
  clearConfig: () => void;
  ejecutarPing: () => Promise<SiigoTestPingResult>;
  setEstadoConexion: (estado: EstadoConexionSiigo) => void;
  resetForTesting: () => void;
}

/**
 * Carga inicial segura desde localStorage
 */
function loadInitialConfig(): { config: SiigoCredentialsConfig | null; estado: EstadoConexionSiigo } {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { config: null, estado: 'NO_CONFIGURADO' };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { config: null, estado: 'NO_CONFIGURADO' };

    const parsed: SiigoCredentialsConfig = JSON.parse(raw);
    if (parsed.isSandbox) {
      return { config: parsed, estado: 'SANDBOX' };
    }
    return { config: parsed, estado: 'ONLINE' };
  } catch {
    return { config: null, estado: 'NO_CONFIGURADO' };
  }
}

const initial = loadInitialConfig();

export const useSiigoConfigStore = create<SiigoConfigStoreState>((set, get) => ({
  config: initial.config,
  estadoConexion: initial.estado,
  ultimoPing: null,
  isLoading: false,
  ultimoError: undefined,

  saveConfig: async (newConfig: SiigoCredentialsConfig): Promise<SiigoTestPingResult> => {
    set({ isLoading: true, ultimoError: undefined });

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      }

      // 1. Invalidar token previo para forzar nueva autenticación
      SiigoAuthService.invalidateToken();

      // 2. Ejecutar ping de prueba
      const pingResult = await SiigoAuthService.probarConexion(newConfig);

      let nuevoEstado: EstadoConexionSiigo = 'NO_CONFIGURADO';
      if (pingResult.success) {
        nuevoEstado = pingResult.isSandbox ? 'SANDBOX' : 'ONLINE';
      } else {
        nuevoEstado = 'ERROR_AUTENTICACION';
      }

      set({
        config: newConfig,
        estadoConexion: nuevoEstado,
        ultimoPing: pingResult,
        isLoading: false,
        ultimoError: pingResult.error
      });

      return pingResult;
    } catch (err: any) {
      const errorMsg = err.message || 'Error al guardar la configuración de SIIGO';
      const failPing: SiigoTestPingResult = {
        success: false,
        latencyMs: 0,
        isSandbox: Boolean(newConfig.isSandbox),
        timestamp: new Date().toISOString(),
        message: 'Fallo al verificar credenciales',
        error: errorMsg
      };

      set({
        config: newConfig,
        estadoConexion: 'ERROR_AUTENTICACION',
        ultimoPing: failPing,
        isLoading: false,
        ultimoError: errorMsg
      });

      return failPing;
    }
  },

  clearConfig: () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(STORAGE_KEY);
    }
    SiigoAuthService.invalidateToken();
    set({
      config: null,
      estadoConexion: 'NO_CONFIGURADO',
      ultimoPing: null,
      isLoading: false,
      ultimoError: undefined
    });
  },

  ejecutarPing: async (): Promise<SiigoTestPingResult> => {
    const { config } = get();
    set({ isLoading: true });

    const pingResult = await SiigoAuthService.probarConexion(config);
    let nuevoEstado: EstadoConexionSiigo = 'NO_CONFIGURADO';
    if (!config) {
      nuevoEstado = 'NO_CONFIGURADO';
    } else if (pingResult.success) {
      nuevoEstado = pingResult.isSandbox ? 'SANDBOX' : 'ONLINE';
    } else {
      nuevoEstado = 'ERROR_AUTENTICACION';
    }

    set({
      estadoConexion: nuevoEstado,
      ultimoPing: pingResult,
      isLoading: false,
      ultimoError: pingResult.error
    });

    return pingResult;
  },

  setEstadoConexion: (estado: EstadoConexionSiigo) => {
    set({ estadoConexion: estado });
  },

  resetForTesting: () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(STORAGE_KEY);
    }
    set({
      config: null,
      estadoConexion: 'NO_CONFIGURADO',
      ultimoPing: null,
      isLoading: false,
      ultimoError: undefined
    });
  }
}));

// Conectar dinámicamente SiigoHttpDispatcher con el store
SiigoHttpDispatcher.setConfigGetter(() => useSiigoConfigStore.getState().config);
