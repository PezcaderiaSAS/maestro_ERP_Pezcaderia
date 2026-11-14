import { useEffect, useMemo } from 'react';
import { createLogger } from '../lib/consoleLogger';
import { useAppStore } from '../store/useAppStore';

interface UseAppListenersOptions {
  onToggleOmnibox: () => void;
}

export function useAppListeners({ onToggleOmnibox }: UseAppListenersOptions) {
  const log = useMemo(() => createLogger('App'), []);
  const theme = useAppStore((s) => s.theme);

  // 1. Monitoreo global de errores window.onerror y unhandledrejection
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      log.error('window.onerror', {
        mensaje: event.message,
        archivo: event.filename,
        linea: event.lineno,
        columna: event.colno,
        error: event.error?.stack,
      });
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      log.error('unhandledrejection', {
        motivo: event.reason?.message ?? event.reason,
        stack: event.reason?.stack,
      });
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, [log]);

  // 2. Atajo de teclado global: Ctrl + K (o Cmd + K) para Omnibox con captura prioritaria
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'k' || e.code === 'KeyK')) {
        e.preventDefault();
        e.stopPropagation();
        onToggleOmnibox();
      }
    };
    // Registrar con capture: true para interceptar antes que el navegador o inputs locales
    window.addEventListener('keydown', handleGlobalKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleGlobalKeyDown, { capture: true });
  }, [onToggleOmnibox]);

  // 3. Sincronización del atributo data-theme en document.documentElement
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // 4. Normalización del separador decimal para el teclado numérico físico
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement) {
        const isNumpadDecimal = e.code === 'NumpadDecimal';
        const isStandardDot = e.key === '.';
        const isStandardComma = e.key === ',';
        
        // Determinar el separador decimal esperado por el sistema local (usualmente ',' en ES, '.' en EN)
        const localDecimalSeparator = (1.1).toLocaleString().substring(1, 2);
        
        // Interceptar si presionan NumpadDecimal o si presionan un separador que NO coincide con su región
        const pressedWrongSeparator = (isStandardDot && localDecimalSeparator === ',') || (isStandardComma && localDecimalSeparator === '.');
        
        if (isNumpadDecimal || pressedWrongSeparator) {
          e.preventDefault();
          document.execCommand('insertText', false, localDecimalSeparator);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}
