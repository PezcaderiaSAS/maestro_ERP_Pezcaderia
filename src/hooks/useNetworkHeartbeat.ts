/**
 * Hook React para Detección de Conectividad Dual y Heartbeat (SPEC-021)
 */

import { useState, useEffect, useCallback } from 'react';
import { NetworkConnectivityService } from '../services/networkConnectivityService';
import { NetworkHeartbeatStatus } from '../types/offlineSync.types';

export const useNetworkHeartbeat = () => {
  const [status, setStatus] = useState<NetworkHeartbeatStatus>(() =>
    NetworkConnectivityService.getStatus()
  );

  useEffect(() => {
    NetworkConnectivityService.init();
    const unsubscribe = NetworkConnectivityService.subscribe((newStatus) => {
      setStatus(newStatus);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const checkNow = useCallback(async () => {
    return await NetworkConnectivityService.checkNow();
  }, []);

  return {
    status,
    estado: status.estado,
    isOnline: status.estado === 'ONLINE',
    isOffline: status.estado === 'OFFLINE',
    isDegraded: status.estado === 'DEGRADED',
    latenciaMs: status.latenciaMs,
    ultimoChequeo: status.ultimoChequeo,
    checkNow,
  };
};
