// src/tests/siigoAuthService.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { SiigoAuthService } from '../services/siigoAuthService';
import type { SiigoCredentialsConfig } from '../../packages/validation-schemas/src/siigoConfig.schema';

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('TASK-025-02: SiigoAuthService - Autenticación Bearer, Mutex de Concurrencia y Modo Sandbox', () => {
  const mockProdConfig: SiigoCredentialsConfig = {
    username: 'facturacion@lapezcaderia.com',
    accessKey: 'clave_secreta_siigo_prod_12345',
    isSandbox: false,
    partnerId: 'LaPezcaderiaERP',
    urlBase: 'https://api.siigo.com'
  };

  const mockSandboxConfig: SiigoCredentialsConfig = {
    username: 'sandbox@lapezcaderia.com',
    accessKey: 'sandbox_test_key_12345',
    isSandbox: true,
    partnerId: 'LaPezcaderiaERP',
    urlBase: 'https://api.siigo.com'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    SiigoAuthService.resetForTesting();
  });

  describe('Modo Sandbox y Fallback Seguro', () => {
    it('debe retornar un token virtual en modo Sandbox sin invocar llamadas HTTP', async () => {
      const token = await SiigoAuthService.getValidToken(mockSandboxConfig);

      expect(token).toMatch(/^SIMULATED_BEARER_/);
      expect(mockedAxios.post).not.toHaveBeenCalled();
      expect(SiigoAuthService.isSimulatedMode()).toBe(true);
    });

    it('debe recurrir a token virtual si no se suministran credenciales configuradas', async () => {
      const token = await SiigoAuthService.getValidToken(null);

      expect(token).toMatch(/^SIMULATED_BEARER_/);
      expect(mockedAxios.post).not.toHaveBeenCalled();
      expect(SiigoAuthService.isSimulatedMode()).toBe(true);
    });
  });

  describe('Autenticación en Producción y Manejo de Token Bearer', () => {
    it('debe llamar a POST /auth con las credenciales y headers requeridos', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: {
          access_token: 'jwt_bearer_token_siigo_real_abc123',
          token_type: 'Bearer',
          expires_in: 86400
        }
      });

      const token = await SiigoAuthService.getValidToken(mockProdConfig);

      expect(token).toBe('jwt_bearer_token_siigo_real_abc123');
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.siigo.com/auth',
        {
          username: 'facturacion@lapezcaderia.com',
          access_key: 'clave_secreta_siigo_prod_12345'
        },
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Partner-Id': 'LaPezcaderiaERP'
          }),
          timeout: 10000
        })
      );
    });

    it('debe reutilizar el token en caché en subsecuentes llamadas sin disparar nuevas peticiones HTTP', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: {
          access_token: 'cached_token_xyz_789',
          token_type: 'Bearer',
          expires_in: 86400
        }
      });

      const token1 = await SiigoAuthService.getValidToken(mockProdConfig);
      const token2 = await SiigoAuthService.getValidToken(mockProdConfig);
      const token3 = await SiigoAuthService.getValidToken(mockProdConfig);

      expect(token1).toBe('cached_token_xyz_789');
      expect(token2).toBe('cached_token_xyz_789');
      expect(token3).toBe('cached_token_xyz_789');
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });

    it('debe forzar nueva petición si se llama a invalidateToken()', async () => {
      mockedAxios.post
        .mockResolvedValueOnce({
          status: 200,
          data: { access_token: 'token_primero', expires_in: 86400 }
        })
        .mockResolvedValueOnce({
          status: 200,
          data: { access_token: 'token_renovado', expires_in: 86400 }
        });

      const t1 = await SiigoAuthService.getValidToken(mockProdConfig);
      expect(t1).toBe('token_primero');

      SiigoAuthService.invalidateToken();

      const t2 = await SiigoAuthService.getValidToken(mockProdConfig);
      expect(t2).toBe('token_renovado');
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    });
  });

  describe('Control de Concurrencia (Mutex de Autenticación)', () => {
    it('debe deduplicar múltiples llamadas concurrentes simultáneas realizando exactamente 1 petición HTTP', async () => {
      // Simular delay de red de 50ms
      mockedAxios.post.mockImplementationOnce(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return {
          status: 200,
          data: { access_token: 'token_concurrent_mutex', expires_in: 86400 }
        };
      });

      // Disparar 5 llamadas paralelas concurrentes
      const promesas = [
        SiigoAuthService.getValidToken(mockProdConfig),
        SiigoAuthService.getValidToken(mockProdConfig),
        SiigoAuthService.getValidToken(mockProdConfig),
        SiigoAuthService.getValidToken(mockProdConfig),
        SiigoAuthService.getValidToken(mockProdConfig)
      ];

      const resultados = await Promise.all(promesas);

      // Todos los resultados deben tener el mismo token
      resultados.forEach((res) => expect(res).toBe('token_concurrent_mutex'));
      // Solo 1 llamada a axios.post
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('Diagnóstico de Conectividad (probarConexion / Test Ping)', () => {
    it('debe retornar ping exitoso con latencia en milisegundos cuando la API responde 200', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { access_token: 'ping_test_token', expires_in: 86400 }
      });

      const resultado = await SiigoAuthService.probarConexion(mockProdConfig);

      expect(resultado.success).toBe(true);
      expect(resultado.isSandbox).toBe(false);
      expect(resultado.latencyMs).toBeGreaterThanOrEqual(0);
      expect(resultado.message).toMatch(/Conexi[oó]n exitosa/i);
      expect(resultado.error).toBeUndefined();
    });

    it('debe retornar ping exitoso inmediato en modo sandbox sin llamada HTTP', async () => {
      const resultado = await SiigoAuthService.probarConexion(mockSandboxConfig);

      expect(resultado.success).toBe(true);
      expect(resultado.isSandbox).toBe(true);
      expect(resultado.message).toMatch(/Modo Sandbox/i);
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('debe capturar error 401 y retornar resultado con success = false y mensaje explicativo', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { message: 'Invalid credentials or access key expired' }
        }
      });

      const resultado = await SiigoAuthService.probarConexion(mockProdConfig);

      expect(resultado.success).toBe(false);
      expect(resultado.error).toMatch(/Credenciales inv[aá]lidas/i);
    });
  });
});
