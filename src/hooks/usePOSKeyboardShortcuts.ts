// src/hooks/usePOSKeyboardShortcuts.ts
// Hook unificado para atajos de teclado de mostrador POS y caja única modo supermercado (SPEC-047)

import { useEffect, useRef } from 'react';

export interface POSShortcutHandlers {
  onF1Help?: () => void;
  onF2Cash?: () => void;
  onF3Card?: () => void;
  onF4Transfer?: () => void;
  onF5Refresh?: () => void;
  onF6Search?: () => void;
  onF8Void?: () => void;
  onF9SplitPayment?: () => void;
  onF12Checkout?: () => void;
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
}

export interface POSShortcutOptions {
  isEnabled?: boolean;
}

/**
 * Hook para orquestar la navegación y cobro por teclado en terminales POS / Caja Única.
 * Previene acciones por defecto en teclas de función (F1, F5, F12) y gestiona el foco seguro.
 */
export function usePOSKeyboardShortcuts(
  handlers: POSShortcutHandlers,
  options: POSShortcutOptions = {}
) {
  const { isEnabled = true } = options;
  const handlersRef = useRef<POSShortcutHandlers>(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      const key = event.key;

      // Atajos de funciones especiales (F1 a F12)
      if (key === 'F1') {
        event.preventDefault();
        handlersRef.current.onF1Help?.();
        return;
      }

      if (key === 'F2') {
        event.preventDefault();
        handlersRef.current.onF2Cash?.();
        return;
      }

      if (key === 'F3') {
        event.preventDefault();
        handlersRef.current.onF3Card?.();
        return;
      }

      if (key === 'F4') {
        event.preventDefault();
        handlersRef.current.onF4Transfer?.();
        return;
      }

      if (key === 'F5') {
        event.preventDefault();
        handlersRef.current.onF5Refresh?.();
        return;
      }

      if (key === 'F6') {
        event.preventDefault();
        handlersRef.current.onF6Search?.();
        return;
      }

      if (key === 'F8') {
        event.preventDefault();
        handlersRef.current.onF8Void?.();
        return;
      }

      if (key === 'F9') {
        event.preventDefault();
        handlersRef.current.onF9SplitPayment?.();
        return;
      }

      if (key === 'F12') {
        event.preventDefault();
        handlersRef.current.onF12Checkout?.();
        return;
      }

      // Escape siempre debe funcionar para cancelar/cerrar
      if (key === 'Escape') {
        event.preventDefault();
        handlersRef.current.onEscape?.();
        return;
      }

      // Si el foco está dentro de un input de texto, no interceptamos navegación ordinaria
      if (isInput) {
        return;
      }

      // Navegación tabular y confirmación fuera de inputs
      if (key === 'ArrowUp') {
        event.preventDefault();
        handlersRef.current.onArrowUp?.();
        return;
      }

      if (key === 'ArrowDown') {
        event.preventDefault();
        handlersRef.current.onArrowDown?.();
        return;
      }

      if (key === 'Enter') {
        event.preventDefault();
        handlersRef.current.onEnter?.();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEnabled]);
}
