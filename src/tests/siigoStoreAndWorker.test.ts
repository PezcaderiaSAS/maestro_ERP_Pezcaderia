// src/tests/siigoStoreAndWorker.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { useSiigoConfigStore } from '../store/useSiigoConfigStore';
import { BackgroundSyncWorker } from '../services/backgroundSyncWorker';
import { OutboxSyncService } from '../services/outboxSyncService';
import { SiigoHttpDispatcher } from '../services/siigoHttpDispatcher';
import { SiigoAuthService } from '../services/siigoAuthService';
import { useResolucionStore } from '../store/useResolucionStore';
import type { OfflineOutboxItem } from '../types/offlineSync.types';
import type { SiigoCredentialsConfig } from '../../packages/validation-schemas/src/siigoConfig.schema';

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('TASK-025-04: useSiigoConfigStore y Conexión con BackgroundSyncWorker', () => {
  const mockConfig: SiigoCredentialsConfig = {
    username: 'admin@lapezcaderia.com',
    accessKey: 'clave_secreta_siigo_12345',
    isSandbox: false,
    partnerId: 'LaPezcaderiaERP',
    urlBase: 'https://api.siigo.com'
  };

  const mockItem: OfflineOutboxItem = {
    id: 'outbox-worker-test-01',
    idempotencyKey: 'idemp-worker-001',
    empresaId: 'pezcaderia-sas',
    tipoOperacion: 'FACTURA_ELECTRONICA_SIIGO',
    ventaId: 'venta-worker-101',
    consecutivoInterno: 'VTA-5001',
    consecutivoFiscal: 'FEVP-101',
    estado: 'PENDIENTE',
    intentos: 0,
    maxIntentos: 5,
    creadoEn: new Date().toISOString(),
    proximoReintentoEn: new Date().toISOString(),
    payload: {
      document: { id: 2458 },
      date: '2026-10-21',
      customer: { identification: '900999888' },
      items: [{ code: 'SAL-01', description: 'Salmón Premium', quantity: 1, price: 60000 }],
      payments: [{ id: 1, value: 60000, due_date: '2026-10-21' }],
      send_dian: true
    }
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
    useSiigoConfigStore.getState().resetForTesting();
    SiigoAuthService.resetForTesting();
    await OutboxSyncService.resetOutbox();

    // Registrar una factura base en useResolucionStore para verificar la actualización fiscal
    useResolucionStore.setState({
      facturasElectronicas: [
        {
          id: 'fe-worker-01',
          ventaId: 'venta-worker-101',
          resolucionId: 'res-dian-01',
          prefijo: 'FEVP',
          numeroConsecutivo: 101,
          consecutivoCompleto: 'FEVP-101',
          fechaEmision: new Date().toISOString(),
          clienteNit: '900999888',
          clienteNombre: 'Restaurante El Faro',
          clienteEmail: 'contacto@elfaro.com',
          subtotal: 60000,
          totalIva: 0,
          total: 60000,
          estadoSiigo: 'PENDIENTE'
        }
      ]
    });
  });

  describe('useSiigoConfigStore', () => {
    it('debe inicializarse con estado NO_CONFIGURADO en ausencia de configuración previa', () => {
      const state = useSiigoConfigStore.getState();
      expect(state.config).toBeNull();
      expect(state.estadoConexion).toBe('NO_CONFIGURADO');
      expect(state.ultimoPing).toBeNull();
    });

    it('debe guardar configuración en el store y en localStorage, ejecutando ping exitoso', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { access_token: 'valid_token_store_test', expires_in: 86400 }
      });

      const store = useSiigoConfigStore.getState();
      const pingResult = await store.saveConfig(mockConfig);

      expect(pingResult.success).toBe(true);
      expect(useSiigoConfigStore.getState().config?.username).toBe('admin@lapezcaderia.com');
      expect(useSiigoConfigStore.getState().estadoConexion).toBe('ONLINE');

      // Verificar persistencia en localStorage
      const stored = localStorage.getItem('la_pezcaderia_siigo_config');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.username).toBe('admin@lapezcaderia.com');
    });

    it('debe establecer estado SANDBOX si se guarda configuración con isSandbox = true', async () => {
      const store = useSiigoConfigStore.getState();
      const pingResult = await store.saveConfig({
        ...mockConfig,
        isSandbox: true
      });

      expect(pingResult.success).toBe(true);
      expect(pingResult.isSandbox).toBe(true);
      expect(useSiigoConfigStore.getState().estadoConexion).toBe('SANDBOX');
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('debe establecer estado ERROR_AUTENTICACION si el ping falla con error 401', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: { status: 401, data: { message: 'Invalid credentials' } }
      });

      const store = useSiigoConfigStore.getState();
      const pingResult = await store.saveConfig(mockConfig);

      expect(pingResult.success).toBe(false);
      expect(useSiigoConfigStore.getState().estadoConexion).toBe('ERROR_AUTENTICACION');
      expect(useSiigoConfigStore.getState().ultimoError).toBeDefined();
    });

    it('clearConfig debe limpiar el store y eliminar los datos de localStorage', async () => {
      useSiigoConfigStore.setState({
        config: mockConfig,
        estadoConexion: 'ONLINE'
      });
      localStorage.setItem('la_pezcaderia_siigo_config', JSON.stringify(mockConfig));

      useSiigoConfigStore.getState().clearConfig();

      expect(useSiigoConfigStore.getState().config).toBeNull();
      expect(useSiigoConfigStore.getState().estadoConexion).toBe('NO_CONFIGURADO');
      expect(localStorage.getItem('la_pezcaderia_siigo_config')).toBeNull();
    });
  });

  describe('Conexión con BackgroundSyncWorker y Despacho en Cola', () => {
    it('BackgroundSyncWorker debe despachar facturas de outbox a través de SiigoHttpDispatcher en modo Sandbox', async () => {
      // Configurar modo Sandbox
      useSiigoConfigStore.setState({
        config: { ...mockConfig, isSandbox: true },
        estadoConexion: 'SANDBOX'
      });

      // Conectar transmisor oficial
      BackgroundSyncWorker.setTransmitter(SiigoHttpDispatcher.transmitirFactura);

      // Encolar ítem
      await OutboxSyncService.encolarTransaccion({
        empresaId: mockItem.empresaId,
        ventaId: mockItem.ventaId,
        consecutivoInterno: mockItem.consecutivoInterno,
        consecutivoFiscal: mockItem.consecutivoFiscal,
        tipoOperacion: mockItem.tipoOperacion,
        payload: mockItem.payload
      });

      // Disparar sincronización
      const summary = await BackgroundSyncWorker.syncNow();

      expect(summary.processed).toBe(1);
      expect(summary.succeeded).toBe(1);
      expect(summary.failed).toBe(0);

      // Verificar que el ítem en la cola outbox quedó SINCRONIZADO con datos fiscales
      const items = await OutboxSyncService.obtenerTodos();
      expect(items[0].estado).toBe('SINCRONIZADO');
      expect(items[0].respuestaFiscal?.cufe).toMatch(/^cufe-/);

      // Verificar que se actualizó useResolucionStore
      const facturas = useResolucionStore.getState().facturasElectronicas;
      expect(facturas[0].estadoSiigo).toBe('SINCRONIZADO');
      expect(facturas[0].cufe).toMatch(/^cufe-/);
      expect(facturas[0].qrUrl).toContain('catalogo-vpfe.dian.gov.co');
    });

    it('BackgroundSyncWorker debe aislar la factura como ERROR_FATAL_DATOS si SIIGO retorna 400 Bad Request', async () => {
      useSiigoConfigStore.setState({
        config: mockConfig,
        estadoConexion: 'ONLINE'
      });

      BackgroundSyncWorker.setTransmitter(SiigoHttpDispatcher.transmitirFactura);

      // Mock Auth 200
      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { access_token: 'valid_token_err_test', expires_in: 86400 }
      });

      // Mock Invoice 400 Bad Request
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            errors: [{ code: 'NIT_ERRONEO', message: 'NIT no inscrito en el RUT de la DIAN' }]
          }
        }
      });

      await OutboxSyncService.encolarTransaccion({
        empresaId: mockItem.empresaId,
        ventaId: mockItem.ventaId,
        consecutivoInterno: mockItem.consecutivoInterno,
        consecutivoFiscal: mockItem.consecutivoFiscal,
        tipoOperacion: mockItem.tipoOperacion,
        payload: mockItem.payload
      });

      const summary = await BackgroundSyncWorker.syncNow();

      expect(summary.processed).toBe(1);
      expect(summary.failed).toBe(1);

      // El ítem debe quedar aislado como ERROR_FATAL_DATOS sin bloquear la cola
      const items = await OutboxSyncService.obtenerTodos();
      expect(items[0].estado).toBe('ERROR_FATAL_DATOS');
      expect(items[0].ultimoError).toMatch(/NIT no inscrito en el RUT/i);
    });
  });
});
