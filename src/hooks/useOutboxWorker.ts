import { useEffect } from 'react';
import { useEventStore, type SyncJob } from '../store/useEventStore';

/**
 * Worker en segundo plano para procesar la cola simulada de Outbox (integración contable Siigo / ERP externo).
 */
export function useOutboxWorker() {
  const syncQueue = useEventStore((s) => s.syncQueue);
  const setSyncQueue = useEventStore((s) => s.setSyncQueue);

  useEffect(() => {
    const pendingJobs = syncQueue.filter((j) => j.estado === 'PENDIENTE');
    if (pendingJobs.length === 0) return;

    // FIFO processing
    const jobToProcess = pendingJobs[pendingJobs.length - 1];

    const timer = setTimeout(() => {
      const isSuccess = Math.random() < 0.8; // 80% success rate
      
      setSyncQueue((prev: SyncJob[]) =>
        prev.map((j: SyncJob) => {
          if (j.id === jobToProcess.id) {
            return {
              ...j,
              intentos: j.intentos + 1,
              estado: isSuccess ? 'SINCRONIZADO' : 'FALLO',
            };
          }
          return j;
        })
      );

      if (!isSuccess) {
        useEventStore.getState().publishEvent(
          'METADATA_CONFIGURED',
          'System Worker',
          `Fallo de red al sincronizar job ${jobToProcess.id} para Siigo (Intento ${jobToProcess.intentos + 1})`,
          null,
          false
        );
      } else {
        useEventStore.getState().publishEvent(
          'METADATA_CONFIGURED',
          'System Worker',
          `Sincronización exitosa de ${jobToProcess.eventTipo} en Siigo`,
          null,
          false
        );
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [syncQueue, setSyncQueue]);
}
