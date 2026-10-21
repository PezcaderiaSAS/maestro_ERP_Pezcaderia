// src/tests/siigoHttpDispatcher.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { SiigoHttpDispatcher } from '../services/siigoHttpDispatcher';
import { SiigoAuthService } from '../services/siigoAuthService';
import type { OfflineOutboxItem } from '../types/offlineSync.types';
import type { SiigoCredentialsConfig } from '../../packages/validation-schemas/src/siigoConfig.schema';

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('TASK-025-03: SiigoHttpDispatcher - Transmisor Outbox y Clasificación de Errores DIAN', () => {
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

  const mockOutboxItem: OfflineOutboxItem = {
    id: 'outbox-item-001',
    idempotencyKey: 'idemp-factura-001-abc',
    empresaId: 'pezcaderia-sas',
    tipoOperacion: 'FACTURA_ELECTRONICA_SIIGO',
    ventaId: 'venta-101',
    consecutivoInterno: 'VTA-1045',
    consecutivoFiscal: 'FEVP-502',
    estado: 'PENDIENTE',
    intentos: 0,
    maxIntentos: 5,
    creadoEn: '2026-10-21T10:00:00Z',
    proximoReintentoEn: '2026-10-21T10:00:00Z',
    payload: {
      document: { id: 2458 },
      date: '2026-10-21',
      customer: { identification: '900123456' },
      items: [
        {
          code: 'ROB-001',
          description: 'Róbalo Fresco Entero',
          quantity: 2.5,
          price: 45000,
          taxes: [{ id: 1, percentage: 19 }]
        }
      ],
      payments: [{ id: 1, value: 112500, due_date: '2026-10-21' }],
      send_dian: true
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    SiigoAuthService.resetForTesting();
    SiigoHttpDispatcher.setConfigGetter(null);
  });

  describe('Modo Simulación / Sandbox', () => {
    it('debe generar respuesta fiscal virtual simulada cuando isSandbox = true sin invocar llamadas HTTP', async () => {
      SiigoHttpDispatcher.setConfigGetter(() => mockSandboxConfig);

      const result = await SiigoHttpDispatcher.transmitirFactura(mockOutboxItem);

      expect(result).toBeDefined();
      expect(result.cufe).toMatch(/^cufe-/);
      expect(result.qrUrl).toMatch(/catalogo-vpfe\.dian\.gov\.co/);
      expect(result.siigoInvoiceId).toMatch(/^siigo-sim-/);
      expect(result.numeroFiscal).toBe('FEVP-502');
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('debe recurrir a simulación segura si no hay configuración de credenciales registrada', async () => {
      SiigoHttpDispatcher.setConfigGetter(() => null);

      const result = await SiigoHttpDispatcher.transmitirFactura(mockOutboxItem);

      expect(result).toBeDefined();
      expect(result.cufe).toBeDefined();
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });

  describe('Despacho Exitoso en Producción (201 Created)', () => {
    it('debe adquirir token y despachar la factura a POST /v1/invoices capturando CUFE y QR oficiales', async () => {
      SiigoHttpDispatcher.setConfigGetter(() => mockProdConfig);

      // Mock 1: Autenticación
      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { access_token: 'valid_bearer_token', expires_in: 86400 }
      });

      // Mock 2: Creación de Factura en SIIGO
      mockedAxios.post.mockResolvedValueOnce({
        status: 201,
        data: {
          id: 'siigo-uuid-factura-999',
          name: 'FEVP-502',
          date: '2026-10-21',
          stamp: {
            cufe: 'cufe-dian-oficial-789abcdef123456789',
            qr: 'https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=cufe-dian-oficial-789abcdef123456789'
          }
        }
      });

      const result = await SiigoHttpDispatcher.transmitirFactura(mockOutboxItem);

      expect(result.cufe).toBe('cufe-dian-oficial-789abcdef123456789');
      expect(result.qrUrl).toContain('cufe-dian-oficial-789abcdef123456789');
      expect(result.siigoInvoiceId).toBe('siigo-uuid-factura-999');
      expect(result.numeroFiscal).toBe('FEVP-502');

      // Verificar headers y endpoint de la llamada a invoices
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.siigo.com/v1/invoices',
        mockOutboxItem.payload,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer valid_bearer_token',
            'Partner-Id': 'LaPezcaderiaERP'
          }),
          timeout: 10000
        })
      );
    });
  });

  describe('Clasificación de Errores y Aislamiento Fiscal', () => {
    it('debe clasificar HTTP 400 Bad Request como error fatal (status = 400, isFatal = true)', async () => {
      SiigoHttpDispatcher.setConfigGetter(() => mockProdConfig);

      // Mock 1: Auth OK
      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { access_token: 'token_valido', expires_in: 86400 }
      });

      // Mock 2: Factura rechazada por datos inválidos de la DIAN
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            message: 'Error de validación DIAN',
            errors: [
              {
                code: 'INVALID_CUSTOMER_NIT',
                message: 'El NIT del cliente no tiene un dígito de verificación válido ante la DIAN'
              }
            ]
          }
        }
      });

      await expect(SiigoHttpDispatcher.transmitirFactura(mockOutboxItem)).rejects.toMatchObject({
        status: 400,
        isFatal: true,
        message: expect.stringMatching(/d[ií]gito de verificaci[oó]n v[aá]lido/i)
      });
    });

    it('debe auto-renovar el token Bearer y reintentar ante HTTP 401 Unauthorized', async () => {
      SiigoHttpDispatcher.setConfigGetter(() => mockProdConfig);

      // Mock 1: Auth inicial
      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { access_token: 'token_expirado_previo', expires_in: 86400 }
      });

      // Mock 2: Intento 1 con 401
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { message: 'Token expired' }
        }
      });

      // Mock 3: Re-autenticación
      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { access_token: 'token_fresco_renovado', expires_in: 86400 }
      });

      // Mock 4: Intento 2 exitoso con token renovado
      mockedAxios.post.mockResolvedValueOnce({
        status: 201,
        data: {
          id: 'siigo-uuid-post-reintento',
          name: 'FEVP-502',
          stamp: {
            cufe: 'cufe-reintento-ok',
            qr: 'https://dian.gov.co/qr'
          }
        }
      });

      const result = await SiigoHttpDispatcher.transmitirFactura(mockOutboxItem);

      expect(result.cufe).toBe('cufe-reintento-ok');
      expect(result.siigoInvoiceId).toBe('siigo-uuid-post-reintento');
      expect(mockedAxios.post).toHaveBeenCalledTimes(4); // Auth1 + Factura(401) + Auth2 + Factura(201)
    });

    it('debe clasificar HTTP 429 Too Many Requests como error transitorio (isFatal = false)', async () => {
      SiigoHttpDispatcher.setConfigGetter(() => mockProdConfig);

      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { access_token: 'token_valido', expires_in: 86400 }
      });

      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 429,
          data: { message: 'Too many requests. Rate limit exceeded.' }
        }
      });

      await expect(SiigoHttpDispatcher.transmitirFactura(mockOutboxItem)).rejects.toMatchObject({
        status: 429,
        isFatal: false,
        message: expect.stringMatching(/Rate limit/i)
      });
    });

    it('debe clasificar HTTP 500 / 503 como error transitorio para reintento con backoff (isFatal = false)', async () => {
      SiigoHttpDispatcher.setConfigGetter(() => mockProdConfig);

      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { access_token: 'token_valido', expires_in: 86400 }
      });

      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 503,
          data: { message: 'Service Unavailable' }
        }
      });

      await expect(SiigoHttpDispatcher.transmitirFactura(mockOutboxItem)).rejects.toMatchObject({
        status: 503,
        isFatal: false
      });
    });
  });
});
