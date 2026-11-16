import { createLogger } from './consoleLogger';
import type { StateCreator } from 'zustand';

export const zustandConsoleMiddleware = <T extends object>(
  config: StateCreator<T, [], []>,
): StateCreator<T, [], []> =>
  (set, get, api) =>
    config(
      ((...args: [any, any?]) => {
        const inDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV === true;
        const debugVal = typeof localStorage !== 'undefined' ? localStorage.getItem('debug') : null;

        // Optimización Crítica: evitar serialización síncrona en el hilo principal durante interacción continua
        if (!inDev && !debugVal) {
          (set as any)(...args);
          return;
        }

        if (debugVal && debugVal.includes('Store')) {
          const log = createLogger('Store');
          const firstArg = args[0];
          const changedKeys = typeof firstArg === 'object' && firstArg !== null ? Object.keys(firstArg) : [];
          log.debug('setState', { changedKeys });
          (set as any)(...args);
          return;
        }

        (set as any)(...args);
      }) as typeof set,
      get,
      api,
    );

