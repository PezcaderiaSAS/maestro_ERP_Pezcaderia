/**
 * Store Reactivo Zustand para la App PWA Móvil de Repartidores
 * Especificación: SPEC-023
 * Estado: Sesión del conductor, ruta activa del día, parada seleccionada y outbox sync status.
 */

import { create } from 'zustand';
import {
  DriverSession,
  DriverActiveRoute,
  DriverDeliveryStop,
  DriverSyncStatus,
  DriverRecaudoResumen
} from '../types/driverDeliveryPwa.types';
import { driverDeliveryPwaService } from '../services/driverDeliveryPwaService';
import { OutboxSyncService } from '../services/outboxSyncService';
import type { RegistroEjecucionParada } from '../../packages/validation-schemas/src/driverDeliveryPwa.schema';

interface DriverDeliveryPwaState {
  session: DriverSession | null;
  activeRoute: DriverActiveRoute | null;
  selectedStop: DriverDeliveryStop | null;
  isLoading: boolean;
  syncStatus: DriverSyncStatus;
  recaudoResumen: DriverRecaudoResumen | null;
  error: string | null;

  // Acciones
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  cargarRutaActiva: () => Promise<void>;
  seleccionarParada: (stop: DriverDeliveryStop | null) => void;
  ejecutarParada: (registro: RegistroEjecucionParada) => Promise<{ exito: boolean; mensaje: string }>;
  actualizarSyncStatus: () => Promise<void>;
  recalcularResumen: () => void;
  limpiarError: () => void;
}

export const useDriverDeliveryPwaStore = create<DriverDeliveryPwaState>((set, get) => {
  const initialSession = driverDeliveryPwaService.obtenerSesionActual();

  return {
    session: initialSession,
    activeRoute: null,
    selectedStop: null,
    isLoading: false,
    syncStatus: {
      pendientesSync: 0,
      estaEnLinea: typeof navigator !== 'undefined' ? navigator.onLine : true,
      sincronizando: false
    },
    recaudoResumen: null,
    error: null,

    login: async (email: string, password: string) => {
      set({ isLoading: true, error: null });
      try {
        const session = await driverDeliveryPwaService.loginConductor(email, password);
        set({ session, isLoading: false });
        await get().cargarRutaActiva();
        await get().actualizarSyncStatus();
        return true;
      } catch (err: any) {
        set({
          isLoading: false,
          error: err.message || 'Error al iniciar sesión de conductor'
        });
        return false;
      }
    },

    logout: () => {
      driverDeliveryPwaService.cerrarSesion();
      set({
        session: null,
        activeRoute: null,
        selectedStop: null,
        recaudoResumen: null,
        error: null
      });
    },

    cargarRutaActiva: async () => {
      const { session } = get();
      if (!session) return;

      set({ isLoading: true });
      try {
        const route = await driverDeliveryPwaService.obtenerRutaActivaConductor(session.conductorId);
        const resumen = route ? driverDeliveryPwaService.obtenerResumenRecaudoRuta(route) : null;
        set({
          activeRoute: route,
          recaudoResumen: resumen,
          isLoading: false
        });
      } catch (err: any) {
        set({
          isLoading: false,
          error: err.message || 'Error al cargar la ruta activa'
        });
      }
    },

    seleccionarParada: (stop: DriverDeliveryStop | null) => {
      set({ selectedStop: stop });
    },

    ejecutarParada: async (registro: RegistroEjecucionParada) => {
      const { session, activeRoute } = get();
      set({ isLoading: true, error: null });

      try {
        const result = await driverDeliveryPwaService.registrarEntregaParada(registro, {
          conductorId: session?.conductorId || 'drv-001',
          clienteNombre: get().selectedStop?.clienteNombre || 'Cliente'
        });

        // Recargar ruta activa actualizada
        const updatedRoute = await driverDeliveryPwaService.obtenerRutaActivaConductor(
          session?.conductorId || 'drv-001'
        );
        const resumen = updatedRoute
          ? driverDeliveryPwaService.obtenerResumenRecaudoRuta(updatedRoute)
          : null;

        // Limpiar selección de parada
        set({
          activeRoute: updatedRoute,
          recaudoResumen: resumen,
          selectedStop: null,
          isLoading: false
        });

        // Actualizar métricas de cola outbox
        await get().actualizarSyncStatus();

        return { exito: true, mensaje: result.mensaje };
      } catch (err: any) {
        set({
          isLoading: false,
          error: err.message || 'Error al registrar la parada'
        });
        return {
          exito: false,
          mensaje: err.message || 'Error al registrar la parada'
        };
      }
    },

    actualizarSyncStatus: async () => {
      try {
        const outboxItems = await OutboxSyncService.obtenerTodos();
        const pendientes = outboxItems.filter(
          (i) => i.estado === 'PENDIENTE' || i.estado === 'ERROR_REINTENTO'
        ).length;

        set((state) => ({
          syncStatus: {
            ...state.syncStatus,
            pendientesSync: pendientes,
            estaEnLinea: typeof navigator !== 'undefined' ? navigator.onLine : true,
            ultimaSync: new Date().toLocaleTimeString('es-CO', {
              hour: '2-digit',
              minute: '2-digit'
            })
          }
        }));
      } catch {
        // En tests o entornos degradados ignorar
      }
    },

    recalcularResumen: () => {
      const { activeRoute } = get();
      if (!activeRoute) return;
      const resumen = driverDeliveryPwaService.obtenerResumenRecaudoRuta(activeRoute);
      set({ recaudoResumen: resumen });
    },

    limpiarError: () => {
      set({ error: null });
    }
  };
});
