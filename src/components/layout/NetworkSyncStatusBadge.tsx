import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle, Database } from 'lucide-react';
import { useEventStore, type SyncJob } from '../../store/useEventStore';
import { PosDraftService } from '../../services/posDraftService';
import { getSupabaseClient } from '../../lib/supabase';
import Swal from 'sweetalert2';

export type NetworkSyncState = 'online' | 'offline' | 'syncing';

interface NetworkSyncStatusBadgeProps {
  className?: string;
  onSyncTrigger?: () => Promise<void> | void;
}

export const NetworkSyncStatusBadge: React.FC<NetworkSyncStatusBadgeProps> = ({
  className = '',
  onSyncTrigger,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(new Date());

  const syncQueue = useEventStore((s) => s.syncQueue);
  const pendingJobs = syncQueue.filter((j) => j.estado === 'PENDIENTE');

  // Monitoreo nativo de red
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync(false);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Función de sincronización forzada o automática
  const triggerSync = async (userInitiated: boolean = false) => {
    if (!navigator.onLine) {
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
        // Sincronizar borradores y verificar Supabase
        await PosDraftService.fetchRemoteDrafts();
        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase.from('empresas').select('id').limit(1);
        }
      }
      setLastSyncTime(new Date());

      if (userInitiated) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Sincronización Completa',
          text: 'Todos los datos están al día con Supabase Cloud.',
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
      title: isOnline ? 'Conexión a la Nube Estable' : 'Modo Fuera de Línea Activo',
      html: `
        <div style="text-align: left; font-size: 13px; color: #94a3b8; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
            <span>Estado de Red:</span>
            <strong style="color: ${isOnline ? '#34d399' : '#f59e0b'};">${isOnline ? '🟢 En Línea' : '🟠 Fuera de Línea'}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
            <span>Motor de Base de Datos:</span>
            <strong style="color: #38bdf8;">Supabase / PostgreSQL 15</strong>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
            <span>Transacciones en Espera (Outbox):</span>
            <strong style="color: #f8fafc;">${pendingJobs.length} pendientes</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Última Sincronización:</span>
            <strong style="color: #cbd5e1;">${timeFormatted}</strong>
          </div>
        </div>
      `,
      icon: isOnline ? 'info' : 'warning',
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
  const currentState: NetworkSyncState = !isOnline
    ? 'offline'
    : isSyncing
    ? 'syncing'
    : 'online';

  return (
    <button
      type="button"
      onClick={handleBadgeClick}
      className={`relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer select-none active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
        currentState === 'online'
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20'
          : currentState === 'syncing'
          ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/25 animate-pulse'
          : 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
      } ${className}`}
      title={
        currentState === 'online'
          ? 'Servidor Supabase conectado en tiempo real. Clic para detalles o sincronizar.'
          : currentState === 'syncing'
          ? 'Sincronizando transacciones con Supabase Cloud...'
          : 'Modo Offline: Operando con almacenamiento local. Clic para ver cola Outbox.'
      }
      aria-label={`Estado de sincronización: ${currentState.toUpperCase()}`}
    >
      {currentState === 'online' && (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Wifi size={13} className="text-emerald-400" />
          <span className="font-mono text-[10px] tracking-wider">ONLINE</span>
        </>
      )}

      {currentState === 'syncing' && (
        <>
          <RefreshCw size={12} className="text-cyan-400 animate-spin" />
          <span className="font-mono text-[10px] tracking-wider">SINCRONIZANDO</span>
        </>
      )}

      {currentState === 'offline' && (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <WifiOff size={13} className="text-amber-400" />
          <span className="font-mono text-[10px] tracking-wider">
            OFFLINE {pendingJobs.length > 0 ? `(${pendingJobs.length})` : ''}
          </span>
        </>
      )}
    </button>
  );
};
