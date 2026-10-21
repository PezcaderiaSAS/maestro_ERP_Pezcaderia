// src/services/siigoAuthService.ts
import axios from 'axios';
import type { SiigoCredentialsConfig } from '../../packages/validation-schemas/src/siigoConfig.schema';
import type { SiigoAuthResponse, SiigoTestPingResult } from '../types/siigo.types';

/**
 * Gestor Singleton de Autenticación y Token Bearer para SIIGO Nube API v2
 * Implementa caché en memoria con TTL de 24h, margen proactivo de 10 min,
 * deduplicación de peticiones concurrentes mediante Mutex y modo Sandbox transparente.
 */
export class SiigoAuthService {
  private static cachedToken: string | null = null;
  private static tokenExpiresAt: number = 0;
  private static isSimulated: boolean = false;
  private static authPromise: Promise<string> | null = null;
  private static readonly PROACTIVE_MARGIN_MS: number = 10 * 60 * 1000; // 10 minutos

  /**
   * Obtiene un token Bearer válido, renovándolo automáticamente si ha expirado
   * o deduplicando la petición si ya existe una solicitud en vuelo (Mutex).
   */
  static async getValidToken(config?: SiigoCredentialsConfig | null): Promise<string> {
    // 1. Si no hay credenciales o está en modo Sandbox, generar token virtual transparente
    if (!config || config.isSandbox || !config.username || !config.accessKey) {
      this.isSimulated = true;
      if (!this.cachedToken || !this.isTokenValid()) {
        this.cachedToken = this.generateSimulatedToken();
        this.tokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
      }
      return this.cachedToken;
    }

    this.isSimulated = false;

    // 2. Si el token en memoria sigue vigente dentro del margen seguro, reutilizarlo
    if (this.cachedToken && this.isTokenValid()) {
      return this.cachedToken;
    }

    // 3. Mutex de concurrencia: si ya hay una petición de autenticación en curso, esperar la misma promesa
    if (this.authPromise) {
      return this.authPromise;
    }

    // 4. Iniciar petición de autenticación y almacenar la promesa en el mutex
    this.authPromise = this.executeAuth(config);

    try {
      const token = await this.authPromise;
      return token;
    } finally {
      this.authPromise = null;
    }
  }

  /**
   * Ejecuta la llamada HTTP real al endpoint POST /auth de SIIGO Nube
   */
  private static async executeAuth(config: SiigoCredentialsConfig): Promise<string> {
    const urlBase = (config.urlBase || 'https://api.siigo.com').replace(/\/+$/, '');
    const authUrl = `${urlBase}/auth`;

    try {
      const response = await axios.post<SiigoAuthResponse>(
        authUrl,
        {
          username: config.username.trim(),
          access_key: config.accessKey.trim()
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Partner-Id': config.partnerId || 'LaPezcaderiaERP'
          },
          timeout: 10000
        }
      );

      const { access_token, expires_in } = response.data;
      if (!access_token) {
        throw new Error('La respuesta de SIIGO no contiene access_token válido');
      }

      this.cachedToken = access_token;
      // Guardar expiración en milisegundos (por defecto 86400s = 24h)
      const ttlMs = (Number(expires_in) || 86400) * 1000;
      this.tokenExpiresAt = Date.now() + ttlMs;

      return access_token;
    } catch (error: any) {
      this.invalidateToken();
      const status = error.response?.status;
      const detail = error.response?.data?.message || error.message || 'Error desconocido';

      if (status === 401) {
        throw new Error(`Credenciales inválidas en SIIGO Nube (401 Unauthorized): ${detail}`);
      }
      throw new Error(`Fallo de conexión al autenticar con SIIGO Nube: ${detail}`);
    }
  }

  /**
   * Genera un token sintético para pruebas locales o modo Sandbox
   */
  private static generateSimulatedToken(): string {
    return `SIMULATED_BEARER_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }

  /**
   * Invalida el token en memoria forzando una renovación en la siguiente llamada
   */
  static invalidateToken(): void {
    this.cachedToken = null;
    this.tokenExpiresAt = 0;
  }

  /**
   * Verifica si el token en caché se encuentra dentro del margen de vigencia
   */
  static isTokenValid(): boolean {
    if (!this.cachedToken) return false;
    return this.tokenExpiresAt - Date.now() > this.PROACTIVE_MARGIN_MS;
  }

  /**
   * Indica si el servicio opera actualmente en modo virtual simulado (Sandbox)
   */
  static isSimulatedMode(): boolean {
    return this.isSimulated;
  }

  /**
   * Ejecuta un ping de diagnóstico para verificar la validez de las credenciales
   */
  static async probarConexion(config?: SiigoCredentialsConfig | null): Promise<SiigoTestPingResult> {
    const inicio = Date.now();
    const timestamp = new Date().toISOString();

    if (!config || config.isSandbox) {
      return {
        success: true,
        latencyMs: 1,
        isSandbox: true,
        timestamp,
        message: 'Conexión exitosa en Modo Sandbox / Simulación local'
      };
    }

    try {
      this.invalidateToken();
      await this.executeAuth(config);
      const latencyMs = Date.now() - inicio;

      return {
        success: true,
        latencyMs,
        isSandbox: false,
        timestamp,
        message: `Conexión exitosa con SIIGO Nube API v2 (${latencyMs} ms)`
      };
    } catch (error: any) {
      const latencyMs = Date.now() - inicio;
      return {
        success: false,
        latencyMs,
        isSandbox: false,
        timestamp,
        message: 'Error de conexión con SIIGO Nube API v2',
        error: error.message || 'Credenciales inválidas o servicio no disponible'
      };
    }
  }

  /**
   * Reinicia el estado interno para pruebas unitarias
   */
  static resetForTesting(): void {
    this.cachedToken = null;
    this.tokenExpiresAt = 0;
    this.isSimulated = false;
    this.authPromise = null;
  }
}
