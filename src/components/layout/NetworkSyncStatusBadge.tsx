import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle, Database, Activity } from 'lucide-react';
import { useEventStore, type SyncJob } from '../../store/useEventStore';
import { PosDraftService } from '../../services/posDraftService';
import { OutboxSyncService } from '../../services/outboxSyncService';
import { BackgroundSyncWorker } from '../../services/backgroundSyncWorker';
import { useNetworkHeartbeat } from '../../hooks/useNetworkHeartbeat';
import { getSupabaseClient } from '../../lib/supabase';
import Swal from 'sweetalert2';

export type NetworkSyncState = 'online' | 'degraded' | 'offline' | 'syncing';

interface NetworkSyncStatusBadgeProps {
  className?: string;
  onSyncTrigger?: () => Promise<void> | void;
}

export const NetworkSyncStatusBadge: React.FC<NetworkSyncStatusBadgeProps> = ({
  className = '',
  onSyncTrigger,
}) => {
  const { status: heartbeatStatus, isOnline: heartbeatOnline, isDegraded: heartbeatDegraded, checkNow } = useNetworkHeartbeat();
  
  const [isOnlineState, setIsOnlineState] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(new Date());
  const [outboxPendingCount, setOutboxPendingCount] = useState<number>(0);

  const syncQueue = useEventStore((s) => s.syncQueue);
  const pendingJobs = syncQueue.filter((j) => j.estado === 'PENDIENTE');

  // Sincronizar con el heartbeat y listeners nativos de red
  useEffect(() => {
    setIsOnlineState(heartbeatOnline);
  }, [heartbeatOnline]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnlineState(true);
      triggerSync(false);
    };
    const handleOffline = () => {
      setIsOnlineState(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitoreo periódico de ítems pendientes en Outbox v2
  useEffect(() => {
    let isMounted = true;
    const fetchPendingOutbox = async () => {
      try {
        const pendientes = await OutboxSyncService.obtenerPendientes();
        if (isMounted) {
          setOutboxPendingCount(pendientes.length);
        }
      } catch {
        // Fallback resiliente
      }
    };

    fetchPendingOutbox();
    const interval = setInterval(fetchPendingOutbox, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const totalPendientes = pendingJobs.length + outboxPendingCount;

  // Función de sincronización forzada o automática
  const triggerSync = async (userInitiated: boolean = false) => {
    if (!navigator.onLine || !isOnlineState) {
      if (userInitiated) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'warning',
          title: 'Sin conexión a Internet',
          text: 'No es posible sincronizar en este momento. Operando en modo local.',
          timer: 2500,
          showConfirmButton: false,
        });
      }
      return;
    }

    setIsSyncing(true);
    try {
      if (onSyncTrigger) {
        await onSyncTrigger();
      } else {
        // 1. Sincronizar cola Outbox v2 de facturas/ventas
        await BackgroundSyncWorker.syncNow();
        // 2. Sincronizar borradores POS
        await PosDraftService.fetchRemoteDrafts();
        // 3. Verificar salud Supabase
        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase.from('empresas').select('id').limit(1);
        }
      }
      // Re-verificar heartbeat activo
      await checkNow();
      // Refrescar contador outbox
      const pendientes = await OutboxSyncService.obtenerPendientes();
      setOutboxPendingCount(pendientes.length);

      setLastSyncTime(new Date());

      if (userInitiated) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Sincronización Completa',
          text: 'Todos los datos están al día con Supabase Cloud y la cola Outbox procesada.',
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      console.warn('[NetworkSyncStatus] Error durante la sincronización:', err);
      if (userInitiated) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'info',
          title: 'Sincronización Parcial',
          text: 'Se mantuvo el respaldo local mientras se reconecta el servidor.',
          timer: 2500,
          showConfirmButton: false,
        });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleBadgeClick = () => {
    const timeFormatted = lastSyncTime
      ? lastSyncTime.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : 'No registrado';

    Swal.fire({
      title: isOnlineState ? 'Conexión a la Nube Estable' : 'Modo Fuera de Línea Activo',
      html: `
        <div style="text-align: left; font-size: 13px; color: #94a3b8; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
            <span>Estado de Red:</span>
            <strong style="color: ${isOnlineState ? '#34d399' : heartbeatDegraded ? '#fbbf24' : '#f59e0b'};">
              ${isOnlineState ? '🟢 En Línea' : heartbeatDegraded ? '🟡 Conexión Inestable' : '🟠 Fuera de Línea'}
            </strong>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
            <span>Motor de Base de Datos:</span>
            <strong style="color: #38bdf8;">Supabase / PostgreSQL 15</strong>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
            <span>Transacciones en Espera (Outbox):</span>
            <strong style="color: #f8fafc;">${totalPendientes} pendientes</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Última Sincronización:</span>
            <strong style="color: #cbd5e1;">${timeFormatted}</strong>
          </div>
        </div>
      `,
      icon: isOnlineState ? 'info' : 'warning',
      showCancelButton: true,
      confirmButtonText: '🔄 Sincronizar Ahora',
      cancelButtonText: 'Cerrar',
      confirmButtonColor: '#0EA5E9',
    }).then((res) => {
      if (res.isConfirmed) {
        triggerSync(true);
      }
    });
  };

  // Determinar estado actual
  const currentState: NetworkSyncState = !isOnlineState
    ? 'offline'
    : isSyncing
    ? 'syncing'
    : heartbeatDegraded
    ? 'degraded'
    : 'online';

  return (
    <button
      type="button"
      onClick={handleBadgeClick}
      className={`relative inline-flex items-center gap-2 min-h-[44px] sm:min-h-[48px] px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer select-none active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 shadow-xs ${
        currentState === 'online'
          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30'
          : currentState === 'syncing'
          ? 'bg-sky-50 text-sky-800 border-sky-300 hover:bg-sky-100 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30 animate-pulse'
          : currentState === 'degraded'
          ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30'
          : 'bg-amber-50 text-amber-900 border-amber-400 hover:bg-amber-100 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40'
      } ${className}`}
      title={
        currentState === 'online'
          ? 'Servidor Supabase conectado en tiempo real. Clic para detalles o sincronizar.'
          : currentState === 'syncing'
          ? 'Sincronizando transacciones con Supabase Cloud y Outbox...'
          : currentState === 'degraded'
          ? 'Conexión a Internet inestable o lenta. Operación protegida por Outbox.'
          : 'Modo Offline: Operando con almacenamiento local. Clic para ver cola Outbox.'
      }
      aria-label={`Estado de sincronización: ${currentState.toUpperCase()}`}
    >
      {currentState === 'online' && (
        <>
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <Wifi size={15} className="text-emerald-600 dark:text-emerald-400" />
          <span className="font-mono text-xs tracking-wider">ONLINE</span>
        </>
      )}

      {currentState === 'syncing' && (
        <>
          <RefreshCw size={14} className="text-sky-600 dark:text-cyan-400 animate-spin" />
          <span className="font-mono text-xs tracking-wider">SINCRONIZANDO</span>
        </>
      )}

      {currentState === 'degraded' && (
        <>
          <Activity size={14} className="text-amber-600 dark:text-amber-400" />
          <span className="font-mono text-xs tracking-wider">
            LENTA {totalPendientes > 0 ? `(${totalPendientes})` : ''}
          </span>
        </>
      )}

      {currentState === 'offline' && (
        <>
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-600"></span>
          </span>
          <WifiOff size={15} className="text-amber-600 dark:text-amber-400" />
          <span className="font-mono text-xs tracking-wider">
            OFFLINE {totalPendientes > 0 ? `(${totalPendientes})` : ''}
          </span>
        </>
      )}
    </button>
  );
};
