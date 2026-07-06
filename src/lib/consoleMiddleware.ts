import { createLogger, safeStringify } from './consoleLogger';
import type { StateCreator } from 'zustand';

export const zustandConsoleMiddleware = <T extends object>(
  config: StateCreator<T, [], []>,
): StateCreator<T, [], []> =>
  (set, get, api) =>
    config(
      (args) => {
        const prev = get();
        set(args);
        const next = get();
        const log = createLogger('Store');
        const changedKeys = Object.keys(args as object);
        log.debug('setState', {
          changedKeys,
          prev: safeStringify(prev),
          next: safeStringify(next),
        });
      },
      get,
      api,
    );
