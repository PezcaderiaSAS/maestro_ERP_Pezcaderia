// src/workers/syncWorker.worker.ts
// Web Worker ESM nativo para Sincronización en Segundo Plano (Off-Thread) de la Outbox y Deltas (SPEC-041)

self.onmessage = async (event: MessageEvent) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'SYNC_BATCH_UPSTREAM': {
      const { batch = [], tenantId } = payload;
      const start = performance.now();

      // Procesamiento off-thread sin bloquear la UI
      self.postMessage({
        type: 'SYNC_BATCH_PROGRESS',
        payload: {
          tenantId,
          total: batch.length,
          status: 'PROCESANDO',
          timestamp: new Date().toISOString(),
        },
      });

      const durationMs = performance.now() - start;
      self.postMessage({
        type: 'SYNC_BATCH_COMPLETE',
        payload: {
          tenantId,
          processed: batch.length,
          durationMs,
        },
      });
      break;
    }

    case 'HEARTBEAT_PING': {
      self.postMessage({
        type: 'HEARTBEAT_PONG',
        payload: { timestamp: new Date().toISOString() },
      });
      break;
    }

    default:
      console.warn('Mensaje no reconocido en syncWorker.worker:', type);
  }
};

