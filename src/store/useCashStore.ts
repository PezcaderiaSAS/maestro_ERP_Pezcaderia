import { create } from 'zustand';
import type { IDataService } from '../types/services.types';
import { LocalDataService } from '../services/LocalDataService';
import type { TurnoCaja, MovimientoCaja, Caja } from '../types/cash.types';
import { zustandConsoleMiddleware } from '../lib/consoleMiddleware';
import { cashService } from '../services/cashService';

let dataService: IDataService = new LocalDataService();
export const setCashDataService = (ds: IDataService) => { dataService = ds; };

interface CashState {
  // ── Estado ─────────────────────────────────────────────────────────────────
  turnoActivo: TurnoCaja | null;
  cajas: Caja[];
  movimientos: MovimientoCaja[];
  isLoading: boolean;
  error: string | null;

  // ── Acciones de lectura (ya existentes) ────────────────────────────────────
  loadTurnoActivo: (cajaId: string) => Promise<void>;
  loadTurnoActivoPorCajero: (cajeroId: string) => Promise<void>;
  setTurnoActivo: (turno: TurnoCaja | null) => void;
  clearTurnoActivo: () => void;
  loadCajas: () => Promise<void>;

  // ── Acciones de escritura (nuevas) ─────────────────────────────────────────
  abrirTurno: (cajaId: string, cajeroId: string, baseInicial: number) => Promise<{ ok: boolean; error?: string }>;
  cerrarTurno: (turnoId: string, recaudoFisico: { efectivo: number; datafono: number; transferencia: number }, justificacion: string | null) => Promise<{ ok: boolean; error?: string }>;
  registrarMovimiento: (params: { turnoId: string; cajaId: string; tipo: TurnoCaja['estado'] extends string ? any : never; metodoPago: 'EFECTIVO' | 'DATAFONO' | 'TRANSFERENCIA'; monto: number; concepto: string }) => Promise<{ ok: boolean; error?: string }>;
  loadMovimientos: (turnoId: string) => Promise<void>;
  clearError: () => void;
}

export const useCashStore = create<CashState>()(
  zustandConsoleMiddleware((set, get) => {

    // Conectar callbacks del servicio legacy (Inversión de Dependencias)
    cashService.setCallbacks({
      onTurnoActivo: (turno) => set({ turnoActivo: turno }),
    });

    return {
      // ── Estado inicial ────────────────────────────────────────────────────
      turnoActivo: null,
      cajas: [],
      movimientos: [],
      isLoading: false,
      error: null,

      // ── Acciones de lectura (preservadas del store original) ──────────────
      loadTurnoActivo: async (cajaId: string) => {
        set({ isLoading: true, error: null });
        try {
          const turnos = await dataService.getAll<TurnoCaja>('turnos_caja');
          const turno = turnos.find(t => t.cajaId === cajaId && t.estado === 'ABIERTO') || null;
          set({ turnoActivo: turno });
        } catch (e: any) {
          set({ turnoActivo: null, error: e.message || 'Error al cargar turno activo' });
        } finally {
          set({ isLoading: false });
        }
      },

      loadTurnoActivoPorCajero: async (cajeroId: string) => {
        set({ isLoading: true, error: null });
        try {
          const turnos = await dataService.getAll<TurnoCaja>('turnos_caja');
          const turno = turnos.find(t => t.cajeroId === cajeroId && t.estado === 'ABIERTO') || null;
          set({ turnoActivo: turno });
        } catch (e: any) {
          set({ turnoActivo: null, error: e.message || 'Error al cargar turno del cajero' });
        } finally {
          set({ isLoading: false });
        }
      },

      setTurnoActivo: (turno) => set({ turnoActivo: turno }),
      clearTurnoActivo: () => set({ turnoActivo: null }),
      clearError: () => set({ error: null }),

      loadCajas: async () => {
        set({ isLoading: true, error: null });
        try {
          const cajas = await dataService.getAll<Caja>('cajas');
          set({ cajas });
        } catch (e: any) {
          set({ error: e.message || 'Error al cargar cajas' });
        } finally {
          set({ isLoading: false });
        }
      },

      // ── Acciones de escritura (nuevas) ────────────────────────────────────
      abrirTurno: async (cajaId, cajeroId, baseInicial) => {
        set({ isLoading: true, error: null });
        try {
          const resultado = cashService.abrirTurno(cajaId, cajeroId, baseInicial);
          if (resultado.error) {
            set({ error: resultado.error });
            return { ok: false, error: resultado.error };
          }
          // onTurnoActivo callback ya actualiza turnoActivo en el store
          return { ok: true };
        } catch (e: any) {
          const msg = e.message || 'Error al abrir el turno';
          set({ error: msg });
          return { ok: false, error: msg };
        } finally {
          set({ isLoading: false });
        }
      },

      cerrarTurno: async (turnoId, recaudoFisico, justificacion) => {
        set({ isLoading: true, error: null });
        try {
          const resultado = cashService.cerrarTurno(
            turnoId,
            { ...recaudoFisico, transferencia: recaudoFisico.datafono },
            justificacion,
            get().turnoActivo?.createdBy || ''
          );
          if (resultado.error) {
            set({ error: resultado.error });
            return { ok: false, error: resultado.error };
          }
          // onTurnoActivo(null) callback ya limpia turnoActivo en el store
          return { ok: true };
        } catch (e: any) {
          const msg = e.message || 'Error al cerrar el turno';
          set({ error: msg });
          return { ok: false, error: msg };
        } finally {
          set({ isLoading: false });
        }
      },

      registrarMovimiento: async ({ turnoId, cajaId, tipo, metodoPago, monto, concepto }) => {
        set({ isLoading: true, error: null });
        try {
          const resultado = cashService.registrarMovimiento(
            turnoId, cajaId, tipo, metodoPago, monto, concepto, null,
            get().turnoActivo?.createdBy || ''
          );
          if (resultado.error) {
            set({ error: resultado.error });
            return { ok: false, error: resultado.error };
          }
          // Refrescar lista de movimientos si está cargada
          if (get().movimientos.length > 0 && resultado.data) {
            set(s => ({ movimientos: [...s.movimientos, resultado.data!] }));
          }
          return { ok: true };
        } catch (e: any) {
          const msg = e.message || 'Error al registrar movimiento';
          set({ error: msg });
          return { ok: false, error: msg };
        } finally {
          set({ isLoading: false });
        }
      },

      loadMovimientos: async (turnoId: string) => {
        set({ isLoading: true, error: null });
        try {
          const movimientos = cashService.getMovimientos(turnoId);
          set({ movimientos });
        } catch (e: any) {
          set({ error: e.message || 'Error al cargar movimientos' });
        } finally {
          set({ isLoading: false });
        }
      },
    };
  })
);
