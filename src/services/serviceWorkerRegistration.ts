/**
 * ============================================================================
 * LA PEZCADERIA ERP — SERVICE WORKER REGISTRATION & LIFECYCLE MANAGER
 * ============================================================================
 * Especificación: SPEC-024
 * Módulo: Registro y Gobernanza del Service Worker PWA
 * ============================================================================
 */

export interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  swUrl?: string;
}

/**
 * Registra el Service Worker de forma asíncrona tras la carga de la ventana
 * para no penalizar el Time To Interactive (TTI) inicial.
 */
export async function registerServiceWorker(
  config?: ServiceWorkerConfig
): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  const swUrl = config?.swUrl || '/sw.js';

  try {
    const registration = await navigator.serviceWorker.register(swUrl, {
      scope: '/'
    });

    // 1. Si ya hay un worker esperando al momento del registro
    if (registration.waiting) {
      if (config?.onUpdate) {
        config.onUpdate(registration);
      }
    }

    // 2. Monitorear nuevas versiones encontradas
    registration.onupdatefound = () => {
      const installingWorker = registration.installing;
      if (!installingWorker) return;

      installingWorker.onstatechange = () => {
        if (installingWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // Existe un controlador activo previo: hay nueva versión lista
            console.info('[PWA ServiceWorker] Nueva versión disponible en espera de activación');
            if (config?.onUpdate) {
              config.onUpdate(registration);
            }
          } else {
            // Es la primera instalación exitosa del App Shell
            console.info('[PWA ServiceWorker] App Shell pre-cacheado y listo para uso offline');
            if (config?.onSuccess) {
              config.onSuccess(registration);
            }
          }
        }
      };
    };

    return registration;
  } catch (error) {
    console.error('[PWA ServiceWorker] Error durante el registro del Service Worker:', error);
    return null;
  }
}

/**
 * Aplica la actualización pendiente enviando el mensaje 'SKIP_WAITING'
 * al Service Worker en espera y recarga la página suavemente.
 */
export function applyServiceWorkerUpdate(waitingWorker?: ServiceWorker | null): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // Si se provee el worker o se obtiene de la registration activa
  if (waitingWorker) {
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  } else {
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg && reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    });
  }

  // Escuchar cuando el nuevo Service Worker asuma el control para recargar
  navigator.serviceWorker.addEventListener(
    'controllerchange',
    () => {
      console.info('[PWA ServiceWorker] Nuevo controlador activo. Recargando interfaz...');
      window.location.reload();
    },
    { once: true }
  );
}

/**
 * Desregistra cualquier Service Worker activo (útil para pruebas o purgas de depuración).
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      return await registration.unregister();
    }
    return false;
  } catch (error) {
    console.error('[PWA ServiceWorker] Error al desregistrar Service Worker:', error);
    return false;
  }
}
