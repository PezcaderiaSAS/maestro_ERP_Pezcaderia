// src/hooks/usePOSKeyboardShortcuts.ts
// Hook unificado para atajos de teclado de mostrador POS y caja única modo supermercado (SPEC-047 / SPEC-057)

import { useEffect, useRef } from 'react';

export interface POSShortcutHandlers {
  // === SPEC-057: Mostrador / Multivendor POS (Hito M4) ===
  /** F8 o Ctrl+K / Cmd+K: Foco inmediato en el input de búsqueda/catálogo */
  onFocusSearch?: () => void;

  /** F9: Alternar entre modo Mostrador (preventas) y modo Caja Única / vista */
  onToggleView?: () => void;

  /** F6 / F3 / F1: Abrir selector/modal de clientes */
  onOpenCustomerSelector?: () => void;

  /** F4: Abrir popover / modal de descuento global de comanda (+ Descuento) */
  onOpenDiscountModal?: () => void;

  /** F2 / F6: Emitir preventa / comanda de mostrador (guardar borrador) */
  onSaveDraft?: () => void;

  /** F9 / F2: Cobro directo en terminal / liquidación en caja */
  onCheckout?: () => void;

  /** Escape: Cerrar modales activos, popovers o limpiar selección/búsqueda */
  onEscape?: () => void;

  // === Handlers Específicos por Tecla Directa ===
  onCtrlK?: () => void;
  onF1?: () => void;
  onF2?: () => void;
  onF3?: () => void;
  onF4?: () => void;
  onF5?: () => void;
  onF6?: () => void;
  onF7?: () => void;
  onF8?: () => void;
  onF9?: () => void;
  onF10?: () => void;
  onF11?: () => void;
  onF12?: () => void;

  // === Retrocompatibilidad SPEC-047 (Supermercado / Terminal Cajero) ===
  onF1Help?: () => void;
  onF2Cash?: () => void;
  onF3Card?: () => void;
  onF4Transfer?: () => void;
  onF5Refresh?: () => void;
  onF6Search?: () => void;
  onF8Void?: () => void;
  onF9SplitPayment?: () => void;
  onF12Checkout?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
}

export interface POSShortcutOptions {
  /** Activar o suspender la interceptación global (default: true) */
  isEnabled?: boolean;

  /**
   * Indica si un modal se encuentra abierto (e.g. ManualWeightModal, SupervisorPinModal).
   * Cuando es true:
   * - Se suprimen los atajos de acción comanda/navegación (F2, F4, F6, F8, F9, Ctrl+K).
   * - Se mantiene activo Escape para cerrar el modal.
   */
  isModalOpen?: boolean;

  /** Tecla asignada para abrir el selector de clientes (default: 'F3', o 'F6' para mostrador) */
  customerSelectorKey?: 'F1' | 'F3' | 'F6';

  /** Si debe llamar event.stopPropagation() además de preventDefault() (default: false) */
  stopPropagation?: boolean;

  /** Target específico para escuchar eventos (default: window) */
  target?: EventTarget | null;
}

/**
 * Hook para orquestar la navegación y comanda por teclado en terminales POS / Mostrador Multivendedor.
 * Captura atajos F8, Ctrl+K, F6, F4, F2, F9, Esc con prevención de colisiones del navegador ({ passive: false }).
 */
export function usePOSKeyboardShortcuts(
  handlers: POSShortcutHandlers,
  options: POSShortcutOptions = {}
): void {
  const {
    isEnabled = true,
    isModalOpen = false,
    customerSelectorKey = 'F3',
    stopPropagation = false,
    target,
  } = options;

  const handlersRef = useRef<POSShortcutHandlers>(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!isEnabled) return;

    const eventTarget = target || (typeof window !== 'undefined' ? window : null);
    if (!eventTarget) return;

    const handleKeyDown = (event: Event) => {
      const e = event as KeyboardEvent;
      const h = handlersRef.current;

      const domTarget = e.target as HTMLElement | null;
      const isInput =
        domTarget !== null &&
        typeof domTarget.tagName === 'string' &&
        (domTarget.tagName === 'INPUT' ||
          domTarget.tagName === 'TEXTAREA' ||
          domTarget.tagName === 'SELECT' ||
          domTarget.isContentEditable);

      const key = e.key === 'Esc' ? 'Escape' : e.key;
      const code = e.code || '';

      // Detección multiplataforma Ctrl+K (Windows/Linux) o Cmd+K (macOS)
      const isModifier = (e.ctrlKey || e.metaKey) && !e.altKey;
      const isKeyK = key === 'k' || key === 'K' || code === 'KeyK';
      const isCtrlK = isModifier && isKeyK;

      // Teclas de función (F1 - F12)
      const isFuncKey = key.startsWith('F') && key.length <= 3 && !isNaN(Number(key.slice(1)));

      const consumeEvent = () => {
        if (e.cancelable) {
          e.preventDefault();
        }
        if (stopPropagation && typeof e.stopPropagation === 'function') {
          e.stopPropagation();
        }
      };

      // 1. Contexto de Modal Activo: Solo permitir Escape y prevenir colisiones nativas (F1..F12, Ctrl+K)
      if (isModalOpen) {
        if (key === 'Escape') {
          consumeEvent();
          h.onEscape?.();
        } else if (isFuncKey || isCtrlK) {
          // Bloquear colisiones nativas de navegador (F5 recarga, F1 ayuda, etc.) sin disparar acciones POS
          consumeEvent();
        }
        return;
      }

      // 2. Escape universal (cierra popovers, modales, cancela selecciones)
      if (key === 'Escape') {
        consumeEvent();
        h.onEscape?.();
        return;
      }

      // 3. Ctrl+K / Cmd+K (búsqueda rápida / alternancia de vista)
      if (isCtrlK) {
        consumeEvent();
        if (e.repeat) return;

        if (h.onCtrlK) {
          h.onCtrlK();
        } else if (h.onToggleView) {
          h.onToggleView();
        } else if (h.onFocusSearch) {
          h.onFocusSearch();
        }
        return;
      }

      // 4. Teclas de función (F1 - F12)
      if (isFuncKey) {
        // Evitar auto-repetición en teclas de acción comanda
        if (e.repeat) {
          consumeEvent();
          return;
        }

        switch (key) {
          case 'F1': {
            consumeEvent();
            if (customerSelectorKey === 'F1' && h.onOpenCustomerSelector) {
              h.onOpenCustomerSelector();
            } else if (h.onF1) {
              h.onF1();
            } else if (h.onF1Help) {
              h.onF1Help();
            } else if (h.onOpenCustomerSelector) {
              h.onOpenCustomerSelector();
            }
            return;
          }

          case 'F2': {
            consumeEvent();
            if (h.onF2) {
              h.onF2();
            } else if (h.onCheckout) {
              h.onCheckout();
            } else if (h.onF2Cash) {
              h.onF2Cash();
            } else if (h.onSaveDraft) {
              h.onSaveDraft();
            }
            return;
          }

          case 'F3': {
            consumeEvent();
            if (customerSelectorKey === 'F3' && h.onOpenCustomerSelector) {
              h.onOpenCustomerSelector();
            } else if (h.onF3) {
              h.onF3();
            } else if (h.onF3Card) {
              h.onF3Card();
            } else if (h.onOpenCustomerSelector) {
              h.onOpenCustomerSelector();
            }
            return;
          }

          case 'F4': {
            consumeEvent();
            if (h.onF4) {
              h.onF4();
            } else if (h.onOpenDiscountModal) {
              h.onOpenDiscountModal();
            } else if (h.onF4Transfer) {
              h.onF4Transfer();
            }
            return;
          }

          case 'F5': {
            consumeEvent();
            if (h.onF5) {
              h.onF5();
            } else if (h.onF5Refresh) {
              h.onF5Refresh();
            }
            return;
          }

          case 'F6': {
            consumeEvent();
            if (customerSelectorKey === 'F6' && h.onOpenCustomerSelector) {
              h.onOpenCustomerSelector();
            } else if (h.onF6) {
              h.onF6();
            } else if (h.onSaveDraft) {
              h.onSaveDraft();
            } else if (h.onOpenCustomerSelector) {
              h.onOpenCustomerSelector();
            } else if (h.onF6Search) {
              h.onF6Search();
            }
            return;
          }

          case 'F7': {
            consumeEvent();
            if (h.onF7) {
              h.onF7();
            }
            return;
          }

          case 'F8': {
            consumeEvent();
            if (h.onF8) {
              h.onF8();
            } else if (h.onFocusSearch) {
              h.onFocusSearch();
            } else if (h.onF8Void) {
              h.onF8Void();
            }
            return;
          }

          case 'F9': {
            consumeEvent();
            if (h.onF9) {
              h.onF9();
            } else if (h.onToggleView) {
              h.onToggleView();
            } else if (h.onCheckout) {
              h.onCheckout();
            } else if (h.onF9SplitPayment) {
              h.onF9SplitPayment();
            }
            return;
          }

          case 'F10': {
            consumeEvent();
            if (h.onF10) {
              h.onF10();
            }
            return;
          }

          case 'F11': {
            consumeEvent();
            if (h.onF11) {
              h.onF11();
            }
            return;
          }

          case 'F12': {
            consumeEvent();
            if (h.onF12) {
              h.onF12();
            } else if (h.onF12Checkout) {
              h.onF12Checkout();
            }
            return;
          }

          default:
            break;
        }
      }

      // 5. Navegación fuera de inputs de texto
      if (isInput) {
        return;
      }

      if (key === 'ArrowUp') {
        consumeEvent();
        h.onArrowUp?.();
        return;
      }

      if (key === 'ArrowDown') {
        consumeEvent();
        h.onArrowDown?.();
        return;
      }

      if (key === 'Enter') {
        consumeEvent();
        h.onEnter?.();
        return;
      }
    };

    eventTarget.addEventListener('keydown', handleKeyDown as EventListener, { passive: false });

    return () => {
      eventTarget.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [isEnabled, isModalOpen, customerSelectorKey, stopPropagation, target]);
}
