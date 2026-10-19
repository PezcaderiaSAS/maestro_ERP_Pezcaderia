import React, { useEffect } from 'react';
import { 
  Truck, LogOut, ArrowLeft, RefreshCw, Wifi, WifiOff, AlertTriangle
} from 'lucide-react';
import { useDriverDeliveryPwaStore } from '../../store/useDriverDeliveryPwaStore';
import { useNetworkHeartbeat } from '../../hooks/useNetworkHeartbeat';
import { useAppStore } from '../../store/useAppStore';
import { AppRouteId } from '../../routes/AppRoute';
import { DriverLoginView } from './components/DriverLoginView';
import { DriverRouteOverview } from './components/DriverRouteOverview';
import { DriverStopExecutionView } from './components/DriverStopExecutionView';
import Swal from 'sweetalert2';

/**
 * DriverPortalView — Shell PWA Autónomo para Conductores y Repartidores en Terreno
 * 
 * Principios:
 * 1. Mobile-First & Standalone: Ocupa el 100% del viewport sin barra lateral ni cabecera de escritorio.
 * 2. Resiliencia Offline: Monitoreo continuo de red y badge outbox pendiente.
 * 3. Regla del Niño de 12 Años: Botones táctiles >= 48px y >= 56px, contraste WCAG AA+.
 * 4. SRP: Orquesta las vistas de login, hoja de ruta y detalle de ejecución.
 */
export const DriverPortalView: React.FC = () => {
  const {
    session,
    activeRoute,
    selectedStop,
    syncStatus,
    isLoading,
    error,
    cargarRutaActiva,
    logout,
    limpiarError,
    actualizarSyncStatus
  } = useDriverDeliveryPwaStore();

  const { isOnline, isDegraded } = useNetworkHeartbeat();
  const setCurrentView = useAppStore((s) => s.setCurrentView);

  // Cargar ruta activa del conductor al montar si hay sesión activa
  useEffect(() => {
    if (session && !activeRoute) {
      cargarRutaActiva();
    }
    actualizarSyncStatus();
  }, [session, activeRoute, cargarRutaActiva, actualizarSyncStatus]);

  // Manejar salida al ERP de escritorio
  const handleVolverAlErp = async () => {
    if (session) {
      const confirm = await Swal.fire({
        title: '¿Volver al ERP?',
        text: 'Saldrás del modo móvil para repartidores.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, volver al ERP',
        cancelButtonText: 'Permanecer aquí',
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#475569',
      });
      if (!confirm.isConfirmed) return;
    }
    setCurrentView(AppRouteId.DISPATCHES);
  };

  // Manejar cierre de turno del conductor
  const handleCerrarSesion = async () => {
    const confirm = await Swal.fire({
      title: '¿Cerrar Turno de Conductor?',
      text: 'Se cerrará la sesión de este furgón en este dispositivo.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Cerrar Turno',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#475569',
    });
    if (confirm.isConfirmed) {
      logout();
    }
  };

  // Refrescar ruta manualmente
  const handleRefrescarRuta = async () => {
    if (session) {
      await cargarRutaActiva();
    }
    await actualizarSyncStatus();
  };

  const estaConectado = isOnline && syncStatus.estaEnLinea;

  return (
    <div 
      className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col select-none touch-manipulation font-sans"
      data-testid="driver-pwa-shell"
    >
      {/* HEADER SUPERIOR PWA */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleVolverAlErp}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all border border-white/5 active:scale-95"
            title="Volver al panel ERP"
            aria-label="Volver al ERP"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-black tracking-wide text-white">
                LA PEZCADERIA <span className="text-emerald-400 font-extrabold text-xs">EXPRESS</span>
              </span>
            </div>
            {session ? (
              <span className="text-[11px] text-slate-400 truncate max-w-[180px]">
                {session.conductorNombre} • <strong className="text-slate-200">{session.vehiculoPlaca}</strong>
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">Terminal Móvil de Reparto</span>
            )}
          </div>
        </div>

        {/* INDICADOR DE RED Y ACCIONES */}
        <div className="flex items-center gap-2">
          {/* Badge de Red y Outbox */}
          <div 
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors ${
              !estaConectado
                ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                : isDegraded
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
            }`}
            title={!estaConectado ? 'Modo Offline: Guardando en cola Outbox local' : 'Conectado a la nube'}
          >
            {!estaConectado ? (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span className="text-[11px]">OFFLINE</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span className="text-[11px]">EN LÍNEA</span>
              </>
            )}

            {syncStatus.pendientesSync > 0 && (
              <span 
                className="ml-1 px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded-full text-[10px] font-mono font-black"
                title={`${syncStatus.pendientesSync} transacciones en cola outbox para sincronizar`}
              >
                {syncStatus.pendientesSync}
              </span>
            )}
          </div>

          {/* Botón Refrescar */}
          {session && (
            <button
              type="button"
              onClick={handleRefrescarRuta}
              disabled={isLoading || syncStatus.sincronizando}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center border border-white/5 disabled:opacity-50 active:scale-95 transition-all"
              title="Sincronizar / Refrescar hoja de ruta"
              aria-label="Refrescar"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading || syncStatus.sincronizando ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          )}

          {/* Botón Cerrar Turno */}
          {session && (
            <button
              type="button"
              onClick={handleCerrarSesion}
              className="w-10 h-10 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 flex items-center justify-center border border-red-500/20 active:scale-95 transition-all"
              title="Cerrar turno de conductor"
              aria-label="Cerrar turno"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* ERROR GLOBAL FLOTANTE */}
      {error && (
        <div className="bg-red-950/90 border-b border-red-500/40 p-3 text-red-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button 
            type="button"
            onClick={limpiarError}
            className="text-red-300 underline font-bold px-2 py-1"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL DINÁMICO */}
      <main className="flex-1 flex flex-col p-4 sm:p-6 max-w-lg mx-auto w-full">
        {!session ? (
          /* PANTALLA 1: INICIO DE TURNO */
          <div className="flex-1 flex flex-col justify-center">
            <DriverLoginView />
          </div>
        ) : selectedStop ? (
          /* PANTALLA 3: DETALLE DE PARADA Y EJECUCIÓN */
          <div className="flex-1 flex flex-col">
            <DriverStopExecutionView />
          </div>
        ) : (
          /* PANTALLA 2: HOJA DE RUTA Y LISTA DE PARADAS */
          <div className="flex-1 flex flex-col">
            <DriverRouteOverview />
          </div>
        )}
      </main>
    </div>
  );
};
