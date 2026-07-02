import { useCallback } from 'react';
import { createLogger } from '../lib/consoleLogger';

export function useActionLogger<T extends (...args: any[]) => any>(
  modulo: string,
  accion: string,
  fn: T,
): T {
  const log = createLogger(modulo);

  return useCallback(
    ((...args: any[]) => {
      log.info(`${accion} START`, { args });
      try {
        const result = fn(...args);
        if (result instanceof Promise) {
          return result
            .then((res) => {
              log.info(`${accion} END`, { result: res });
              return res;
            })
            .catch((err: unknown) => {
              log.error(`${accion} FAIL`, {
                error: err instanceof Error ? err.message : err,
                stack: err instanceof Error ? err.stack : undefined,
              });
              throw err;
            });
        }
        log.info(`${accion} END`, { result });
        return result;
      } catch (err) {
        log.error(`${accion} FAIL`, {
          error: err instanceof Error ? err.message : err,
          stack: err instanceof Error ? err.stack : undefined,
        });
        throw err;
      }
    }) as T,
    [modulo, accion, fn],
  );
}
