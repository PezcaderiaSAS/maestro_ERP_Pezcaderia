/**
 * ============================================================================
 * LA PEZCADERIA ERP — STORE REACTIVO PWA (usePwaStore)
 * ============================================================================
 * Especificación: SPEC-024
 * Módulo: Estado de Instalabilidad, Standalone y Actualizaciones PWA
 * ============================================================================
 */

import { create } from 'zustand';
import {
  registerServiceWorker,
  applyServiceWorkerUpdate
} from '../services/serviceWorkerRegistration';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface PwaState {
  isInstallable: boolean;
  isStandalone: boolean;
  hasUpdatePending: boolean;
  waitingWorker: ServiceWorker | null;
  deferredPrompt: BeforeInstallPromptEvent | null;

  // Acciones
  initPwaListeners: () => () => void;
  setWaitingWorker: (worker: ServiceWorker | null) => void;
  promptInstall: () => Promise<boolean>;
  applyUpdate: () => void;
  dismissUpdate: () => void;
}

export const usePwaStore = create<PwaState>((set, get) => ({
  isInstallable: false,
  isStandalone:
    typeof window !== 'undefined'
      ? window.matchMedia('(display-mode: standalone)').matches ||
        Boolean((navigator as any).standalone)
      : false,
  hasUpdatePending: false,
  waitingWorker: null,
  deferredPrompt: null,

  initPwaListeners: () => {
    if (typeof window === 'undefined') return () => {};

    // 1. Detección de modo Standalone
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      set({ isStandalone: e.matches });
    };
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    // 2. Captura del evento BeforeInstallPrompt (Chrome/Edge/Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      set({
        isInstallable: true,
        deferredPrompt: e as BeforeInstallPromptEvent
      });
      console.info('[usePwaStore] Evento beforeinstallprompt capturado. PWA instalable.');
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 3. Captura del evento AppInstalled
    const handleAppInstalled = () => {
      set({
        isInstallable: false,
        isStandalone: true,
        deferredPrompt: null
      });
      console.info('[usePwaStore] PWA instalada exitosamente en el dispositivo.');
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // 4. Registrar Service Worker y enlazar actualizaciones al store
    window.addEventListener(
      'load',
      () => {
        registerServiceWorker({
          onUpdate: (registration) => {
            const worker = registration.waiting || registration.installing;
            set({
              hasUpdatePending: true,
              waitingWorker: worker || null
            });
          },
          onSuccess: () => {
            console.info('[usePwaStore] Service Worker registrado exitosamente.');
          }
        });
      },
      { once: true }
    );

    // Función de limpieza de listeners
    return () => {
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  },

  setWaitingWorker: (worker: ServiceWorker | null) => {
    set({
      waitingWorker: worker,
      hasUpdatePending: Boolean(worker)
    });
  },

  promptInstall: async () => {
    const { deferredPrompt } = get();
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        set({ isInstallable: false, deferredPrompt: null });
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[usePwaStore] Error al invocar prompt de instalación:', err);
      return false;
    }
  },

  applyUpdate: () => {
    const { waitingWorker } = get();
    applyServiceWorkerUpdate(waitingWorker);
  },

  dismissUpdate: () => {
    set({ hasUpdatePending: false });
  }
}));
