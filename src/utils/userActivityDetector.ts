/**
 * Detector Híbrido de Actividad e Inactividad de Usuarios para MaestroPescaderia ERP.
 * Permite adaptar dinámicamente la velocidad de procesamiento en segundo plano (5 minutos vs 30ms).
 */

const IDLE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutos sin eventos = inactivo

let lastLocalActivityTimestamp = Date.now();
let isInitialized = false;

function recordUserActivity() {
  lastLocalActivityTimestamp = Date.now();
}

/**
 * Inicializa los listeners globales de actividad de usuario en el navegador.
 */
export function initUserActivityDetector() {
  if (isInitialized || typeof window === 'undefined') return;

  const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
  events.forEach((event) => {
    window.addEventListener(event, recordUserActivity, { passive: true });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      recordUserActivity();
    }
  });

  isInitialized = true;
}

/**
 * Retorna true si hay un usuario interactuando activamente con la app.
 */
export function isUserActive(): boolean {
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
    return false; // Pestaña oculta / en segundo plano
  }

  const elapsed = Date.now() - lastLocalActivityTimestamp;
  return elapsed < IDLE_THRESHOLD_MS;
}

/**
 * Permite simular o forzar el estado de actividad para pruebas unitarias.
 */
export function __setLastActivityForTesting(timestamp: number) {
  lastLocalActivityTimestamp = timestamp;
}
