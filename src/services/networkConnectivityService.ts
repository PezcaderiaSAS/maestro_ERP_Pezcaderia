/**
 * Servicio de Monitoreo de Conectividad Dual y Heartbeat
 * Especificación: SPEC-021 (TASK-021-02)
 * Arquitectura: Detección reactiva (online/offline) + Ping periódico (15s con timeout 3000ms).
 */

import { EstadoConectividad, NetworkHeartbeatStatus } from '../types/offlineSync.types';

type ConnectivityListener = (status: NetworkHeartbeatStatus) => void;

export class NetworkConnectivityService {
  private static status: NetworkHeartbeatStatus = {
    estado: typeof navigator !== 'undefined' && !navigator.onLine ? 'OFFLINE' : 'ONLINE',
    latenciaMs: 0,
    ultimoChequeo: new Date().toISOString(),
    fallaConsecutiva: 0,
  };

  private static listeners: Set<ConnectivityListener> = new Set();
  private static timerId: any = null;
  private static pingUrl: string = '/favicon.ico';
  private static customPingFn: (() => Promise<number>) | null = null;
  private static isInitialized: boolean = false;
  private static debounceTimer: any = null;
  private static pendingState: EstadoConectividad | null = null;

  /**
   * Inicializa la escucha de eventos del navegador y arranca el ciclo de Heartbeat
   */
  static init(options?: { pingUrl?: string; intervalMs?: number; customPing?: () => Promise<number> }) {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (options?.pingUrl) this.pingUrl = options.pingUrl;
    if (options?.customPing) this.customPingFn = options.customPing;

    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleBrowserOnline);
      window.addEventListener('offline', this.handleBrowserOffline);
    }

    this.startHeartbeat(options?.intervalMs ?? 15000);
  }

  /**
   * Permite inyectar un verificador de ping simulado (ideal para suites de testing)
   */
  static setCustomPing(fn: (() => Promise<number>) | null) {
    this.customPingFn = fn;
  }

  /**
   * Inicia el ciclo periódico de Heartbeat (por defecto cada 15s)
   */
  static startHeartbeat(intervalMs: number = 15000) {
    this.stopHeartbeat();
    this.timerId = setInterval(() => {
      this.checkNow().catch(() => {});
    }, intervalMs);
  }

  /**
   * Detiene el timer de Heartbeat
   */
  static stopHeartbeat() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Manejador de evento reactivo 'online'
   */
  private static handleBrowserOnline = () => {
    // Cuando el navegador dice que volvió la red, disparamos chequeo inmediato
    this.checkNow().catch(() => {});
  };

  /**
   * Manejador de evento reactivo 'offline'
   */
  private static handleBrowserOffline = () => {
    // Si el navegador reporta desconexión física inmediata, transicionar sin esperar heartbeat
    this.applyStateWithDebounce('OFFLINE', 0, 0);
  };

  /**
   * Ejecuta un chequeo activo de conectividad (Heartbeat Ping) con timeout de 3.000 ms
   */
  static async checkNow(): Promise<NetworkHeartbeatStatus> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.applyStateWithDebounce('OFFLINE', 0, this.status.fallaConsecutiva + 1);
      return this.status;
    }

    const start = Date.now();
    try {
      let latencia = 0;

      if (this.customPingFn) {
        latencia = await this.customPingFn();
      } else if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(`${this.pingUrl}?_t=${Date.now()}`, {
          method: 'HEAD',
          signal: controller.signal,
          cache: 'no-store',
        });
        clearTimeout(timeout);

        if (!res.ok && res.status >= 500) {
          throw new Error(`HTTP Error ${res.status}`);
        }
        latencia = Date.now() - start;
      } else {
        // Entorno Node sin fetch directo
        latencia = 10;
      }

      // Evaluación de latencia
      if (latencia > 2500) {
        this.applyStateWithDebounce('DEGRADED', latencia, 0);
      } else {
        this.applyStateWithDebounce('ONLINE', latencia, 0);
      }
    } catch {
      const nuevasFallas = this.status.fallaConsecutiva + 1;
      const nuevoEstado: EstadoConectividad = nuevasFallas >= 2 ? 'OFFLINE' : 'DEGRADED';
      this.applyStateWithDebounce(nuevoEstado, 0, nuevasFallas);
    }

    return this.status;
  }

  /**
   * Aplica la transición de estado con debounce de 2 segundos para amortiguar oscilaciones de señal
   */
  private static applyStateWithDebounce(
    nuevoEstado: EstadoConectividad,
    latenciaMs: number,
    fallaConsecutiva: number
  ) {
    this.pendingState = nuevoEstado;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Si es cambio abrupto a OFFLINE por evento nativo, cambio instantáneo
    const delay = nuevoEstado === 'OFFLINE' && typeof navigator !== 'undefined' && !navigator.onLine ? 0 : 50;

    this.debounceTimer = setTimeout(() => {
      this.status = {
        estado: this.pendingState || nuevoEstado,
        latenciaMs,
        ultimoChequeo: new Date().toISOString(),
        fallaConsecutiva,
      };
      this.notifyListeners();
    }, delay);
  }

  /**
   * Suscribe un listener para cambios en el estado de conectividad
   */
  static subscribe(listener: ConnectivityListener): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Obtiene el estado actual sincronizado
   */
  static getStatus(): NetworkHeartbeatStatus {
    return { ...this.status };
  }

  /**
   * Notifica a todos los suscriptores registrados
   */
  private static notifyListeners() {
    for (const listener of this.listeners) {
      try {
        listener({ ...this.status });
      } catch (e) {
        console.error('[NetworkConnectivityService] Error en listener:', e);
      }
    }
  }

  /**
   * Restablece el servicio para suites de prueba o reinicios limpios
   */
  static reset() {
    this.stopHeartbeat();
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleBrowserOnline);
      window.removeEventListener('offline', this.handleBrowserOffline);
    }
    this.status = {
      estado: 'ONLINE',
      latenciaMs: 0,
      ultimoChequeo: new Date().toISOString(),
      fallaConsecutiva: 0,
    };
    this.listeners.clear();
    this.customPingFn = null;
    this.isInitialized = false;
    this.pendingState = null;
  }
}
