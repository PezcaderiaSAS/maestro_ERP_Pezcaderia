import { useState, useEffect, useCallback } from 'react';
import { deliveryRouteService } from '../services/deliveryRouteService';

export interface DeliveryOutboxEvent {
  id: string;
  tipo: 'CHECKIN_CARGA' | 'LLEGADA_SITIO' | 'REGISTRO_ENTREGA' | 'INCIDENCIA' | 'FINALIZAR_RUTA';
  payload: any;
  creadoEn: string;
  reintentos: number;
}

const OUTBOX_STORAGE_KEY = 'delivery_outbox_queue_v1';

export const useDeliveryOutbox = (manifiestoId?: string) => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [pendingEvents, setPendingEvents] = useState<DeliveryOutboxEvent[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Cargar eventos pendientes desde almacenamiento local
  const loadPendingEvents = useCallback((): DeliveryOutboxEvent[] => {
    try {
      const raw = localStorage.getItem(OUTBOX_STORAGE_KEY);
      if (!raw) return [];
      const list: DeliveryOutboxEvent[] = JSON.parse(raw);
      if (manifiestoId) {
        return list.filter((e) => e.payload?.manifiestoId === manifiestoId);
      }
      return list;
    } catch (err) {
      console.warn('Error al leer cola outbox de entregas:', err);
      return [];
    }
  }, [manifiestoId]);

  const refreshPending = useCallback(() => {
    const list = loadPendingEvents();
    setPendingEvents(list);
    setPendingCount(list.length);
  }, [loadPendingEvents]);

  // Guardar en cola
  const enqueueDeliveryAction = useCallback(
    async (
      tipo: 'CHECKIN_CARGA' | 'LLEGADA_SITIO' | 'REGISTRO_ENTREGA' | 'INCIDENCIA' | 'FINALIZAR_RUTA',
      payload: any
    ): Promise<{ success: boolean; queuedOffline?: boolean; error?: string }> => {
      const event: DeliveryOutboxEvent = {
        id: crypto.randomUUID?.() || `outbox-${Date.now()}-${Math.random()}`,
        tipo,
        payload,
        creadoEn: new Date().toISOString(),
        reintentos: 0,
      };

      // Si estamos offline, encolar directamente y aplicar al estado local de deliveryRouteService
      if (!navigator.onLine) {
        try {
          const current = loadPendingEvents();
          const updated = [...current, event];
          localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(updated));
          refreshPending();

          // Aplicar optimistamente en el servicio local
          aplicarAccionEnServicio(tipo, payload);
          return { success: true, queuedOffline: true };
        } catch (err: any) {
          return { success: false, error: err.message || 'Error al guardar en cola offline' };
        }
      }

      // Si estamos online, intentar ejecutar de inmediato
      try {
        const res = aplicarAccionEnServicio(tipo, payload);
        if (!res.success) {
          // Si falló por error de red o similar, encolar
          const current = loadPendingEvents();
          localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify([...current, event]));
          refreshPending();
          return { success: true, queuedOffline: true };
        }
        return { success: true, queuedOffline: false };
      } catch (err: any) {
        const current = loadPendingEvents();
        localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify([...current, event]));
        refreshPending();
        return { success: true, queuedOffline: true };
      }
    },
    [loadPendingEvents, refreshPending]
  );

  // Reconciliar eventos pendientes cuando vuelve la conexión
  const syncOutbox = useCallback(async (): Promise<{ synchronized: number }> => {
    if (!navigator.onLine || isSyncing) return { synchronized: 0 };
    setIsSyncing(true);

    try {
      const allEvents: DeliveryOutboxEvent[] = JSON.parse(
        localStorage.getItem(OUTBOX_STORAGE_KEY) || '[]'
      );

      if (allEvents.length === 0) {
        setIsSyncing(false);
        return { synchronized: 0 };
      }

      let syncCount = 0;
      const remaining: DeliveryOutboxEvent[] = [];

      for (const ev of allEvents) {
        try {
          aplicarAccionEnServicio(ev.tipo, ev.payload);
          syncCount++;
        } catch (e) {
          console.error('Error al sincronizar evento outbox:', ev, e);
          remaining.push({ ...ev, reintentos: ev.reintentos + 1 });
        }
      }

      localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(remaining));
      refreshPending();
      setIsSyncing(false);
      return { synchronized: syncCount };
    } catch (err) {
      console.error('Error en syncOutbox:', err);
      setIsSyncing(false);
      return { synchronized: 0 };
    }
  }, [isSyncing, refreshPending]);

  // Listener de cambios de red
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOutbox();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    refreshPending();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshPending, syncOutbox]);

  return {
    isOnline,
    pendingCount,
    pendingEvents,
    isSyncing,
    enqueueDeliveryAction,
    syncOutbox,
    refreshPending,
  };
};

function aplicarAccionEnServicio(
  tipo: 'CHECKIN_CARGA' | 'LLEGADA_SITIO' | 'REGISTRO_ENTREGA' | 'INCIDENCIA' | 'FINALIZAR_RUTA',
  payload: any
): { success: boolean; data?: any; error?: string } {
  switch (tipo) {
    case 'CHECKIN_CARGA':
      return deliveryRouteService.confirmarCheckinCarga(payload);
    case 'LLEGADA_SITIO':
      return deliveryRouteService.registrarLlegadaEnSitio(payload);
    case 'REGISTRO_ENTREGA':
      return deliveryRouteService.registrarEntregaPedido(payload);
    case 'INCIDENCIA':
      return deliveryRouteService.registrarIncidenciaRuta(payload);
    case 'FINALIZAR_RUTA':
      return deliveryRouteService.finalizarRecorridoChofer(payload);
    default:
      return { success: false, error: 'Tipo de acción outbox no soportada' };
  }
}
