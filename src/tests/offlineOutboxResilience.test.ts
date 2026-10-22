import { describe, it, expect, beforeEach } from 'vitest';
import {
  OutboxSyncService,
  generarIdempotencyKey,
  calcularProximoBackoff,
} from '../services/outboxSyncService';
import { TipoTransaccionOutbox } from '../types/offlineSync.types';

describe('SPEC-021: TASK-021-01 - OutboxSyncService & Idempotencia', () => {
  beforeEach(async () => {
    await OutboxSyncService.resetOutbox();
  });

  describe('1. Idempotencia y Funciones Puras', () => {
    it('debe generar una clave de idempotencia determinista para los mismos parámetros', () => {
      const key1 = generarIdempotencyKey('emp-01', 'vta-100', 'VTA-001', 'VENTA');
      const key2 = generarIdempotencyKey('emp-01', 'vta-100', 'VTA-001', 'VENTA');
      expect(key1).toBe(key2);
      expect(key1).toContain('idemp-');
      expect(key1).toContain('vta-100');
    });

    it('debe generar claves diferentes ante variaciones en consecutivo o ventaId', () => {
      const key1 = generarIdempotencyKey('emp-01', 'vta-100', 'VTA-001');
      const key2 = generarIdempotencyKey('emp-01', 'vta-101', 'VTA-002');
      expect(key1).not.toBe(key2);
    });

    it('calcularProximoBackoff debe generar tiempos crecientes con jitter', () => {
      const ahora = Date.now();
      const backoff0 = calcularProximoBackoff(0);
      const backoff1 = calcularProximoBackoff(1);
      const backoff2 = calcularProximoBackoff(2);

      expect(backoff0).toBeGreaterThanOrEqual(ahora + 1000);
      expect(backoff1).toBeGreaterThanOrEqual(ahora + 5000);
      expect(backoff2).toBeGreaterThanOrEqual(ahora + 15000);
      expect(backoff2).toBeGreaterThan(backoff1);
    });
  });

  describe('2. Ciclo de Vida y Transacciones en Outbox', () => {
    it('debe encolar una transacción con estado PENDIENTE e intentos en 0', async () => {
      const item = await OutboxSyncService.encolarTransaccion({
        empresaId: 'emp-01',
        ventaId: 'venta-uuid-1',
        consecutivoInterno: 'VTA-1001',
        tipoOperacion: 'FACTURA_ELECTRONICA_SIIGO' as TipoTransaccionOutbox,
        payload: { total: 45000, cliente: 'Juan Pérez' },
      });

      expect(item.id).toBeDefined();
      expect(item.estado).toBe('PENDIENTE');
      expect(item.intentos).toBe(0);
      expect(item.consecutivoInterno).toBe('VTA-1001');

      const todos = await OutboxSyncService.obtenerTodos();
      expect(todos.length).toBe(1);
      expect(todos[0].id).toBe(item.id);
    });

    it('debe prevenir duplicidad devolviendo el ítem existente ante el mismo idempotencyKey', async () => {
      const item1 = await OutboxSyncService.encolarTransaccion({
        empresaId: 'emp-01',
        ventaId: 'venta-uuid-dup',
        consecutivoInterno: 'VTA-1002',
        tipoOperacion: 'FACTURA_ELECTRONICA_SIIGO',
        payload: { total: 80000 },
      });

      const item2 = await OutboxSyncService.encolarTransaccion({
        empresaId: 'emp-01',
        ventaId: 'venta-uuid-dup',
        consecutivoInterno: 'VTA-1002',
        tipoOperacion: 'FACTURA_ELECTRONICA_SIIGO',
        payload: { total: 80000 },
      });

      expect(item1.id).toBe(item2.id);
      expect(item1.idempotencyKey).toBe(item2.idempotencyKey);

      const todos = await OutboxSyncService.obtenerTodos();
      expect(todos.length).toBe(1);
    });

    it('debe filtrar pendientes para procesar en orden cronológico FIFO', async () => {
      await OutboxSyncService.encolarTransaccion({
        empresaId: 'emp-01',
        ventaId: 'venta-1',
        consecutivoInterno: 'VTA-001',
        tipoOperacion: 'VENTA_POS_LOCAL',
        payload: { id: 1 },
      });

      await OutboxSyncService.encolarTransaccion({
        empresaId: 'emp-01',
        ventaId: 'venta-2',
        consecutivoInterno: 'VTA-002',
        tipoOperacion: 'VENTA_POS_LOCAL',
        payload: { id: 2 },
      });

      const pendientes = await OutboxSyncService.obtenerPendientesParaProcesar();
      expect(pendientes.length).toBe(2);
      expect(pendientes[0].consecutivoInterno).toBe('VTA-001');
      expect(pendientes[1].consecutivoInterno).toBe('VTA-002');
    });

    it('marcarErrorReintento debe incrementar intentos y pasar a ERROR_FATAL_DATOS si supera maxIntentos', async () => {
      const item = await OutboxSyncService.encolarTransaccion({
        empresaId: 'emp-01',
        ventaId: 'venta-retry',
        consecutivoInterno: 'VTA-003',
        tipoOperacion: 'FACTURA_ELECTRONICA_SIIGO',
        payload: { total: 10000 },
        maxIntentos: 3,
      });

      // Intento 1
      await OutboxSyncService.marcarErrorReintento(item.id, 'Timeout de conexión');
      let act = await OutboxSyncService.obtenerPorId(item.id);
      expect(act?.estado).toBe('ERROR_REINTENTO');
      expect(act?.intentos).toBe(1);

      // Intento 2
      await OutboxSyncService.marcarErrorReintento(item.id, 'Error 504 Gateway');
      act = await OutboxSyncService.obtenerPorId(item.id);
      expect(act?.estado).toBe('ERROR_REINTENTO');
      expect(act?.intentos).toBe(2);

      // Intento 3 (Alcanza maxIntentos = 3)
      await OutboxSyncService.marcarErrorReintento(item.id, 'Fallo definitivo');
      act = await OutboxSyncService.obtenerPorId(item.id);
      expect(act?.estado).toBe('ERROR_FATAL_DATOS');
      expect(act?.intentos).toBe(3);
      expect(act?.ultimoError).toContain('Límite de 3 reintentos superado');
    });

    it('marcarSincronizado y limpiarCompletados deben gestionar la finalización de ciclo', async () => {
      const item = await OutboxSyncService.encolarTransaccion({
        empresaId: 'emp-01',
        ventaId: 'venta-done',
        consecutivoInterno: 'VTA-004',
        tipoOperacion: 'FACTURA_ELECTRONICA_SIIGO',
        payload: { total: 95000 },
      });

      await OutboxSyncService.marcarSincronizado(item.id, {
        cufe: 'cufe-abcd-1234',
        numeroFiscal: 'FEVP-505',
        siigoInvoiceId: 'siigo-inv-99',
      });

      const synced = await OutboxSyncService.obtenerPorId(item.id);
      expect(synced?.estado).toBe('SINCRONIZADO');
      expect(synced?.respuestaFiscal?.cufe).toBe('cufe-abcd-1234');
      expect(synced?.respuestaFiscal?.numeroFiscal).toBe('FEVP-505');
      expect(synced?.sincronizadoEn).toBeDefined();

      const eliminados = await OutboxSyncService.limpiarCompletados();
      expect(eliminados).toBe(1);

      const despues = await OutboxSyncService.obtenerTodos();
      expect(despues.length).toBe(0);
    });
  });

  describe('3. NetworkConnectivityService & Heartbeat (TASK-021-02)', () => {
    beforeEach(() => {
      // Import dynamic or static NetworkConnectivityService
    });

    it('debe inicializarse en estado ONLINE y permitir suscripciones', async () => {
      const { NetworkConnectivityService } = await import('../services/networkConnectivityService');
      NetworkConnectivityService.reset();

      let lastStatus: any = null;
      const unsubscribe = NetworkConnectivityService.subscribe((s) => {
        lastStatus = s;
      });

      expect(lastStatus).toBeDefined();
      expect(lastStatus.estado).toBe('ONLINE');

      unsubscribe();
    });

    it('debe transicionar a DEGRADED si la latencia es excesiva (> 2500ms)', async () => {
      const { NetworkConnectivityService } = await import('../services/networkConnectivityService');
      NetworkConnectivityService.reset();

      // Inyectar ping lento
      NetworkConnectivityService.setCustomPing(async () => 2700);

      await NetworkConnectivityService.checkNow();
      // Esperar debounce
      await new Promise((r) => setTimeout(r, 60));

      const status = NetworkConnectivityService.getStatus();
      expect(status.estado).toBe('DEGRADED');
      expect(status.latenciaMs).toBe(2700);
    });

    it('debe transicionar a DEGRADED con 1 fallo y a OFFLINE con 2 fallos consecutivos', async () => {
      const { NetworkConnectivityService } = await import('../services/networkConnectivityService');
      NetworkConnectivityService.reset();

      // Inyectar ping fallido
      NetworkConnectivityService.setCustomPing(async () => {
        throw new Error('Connection refused');
      });

      // Fallo 1 -> DEGRADED
      await NetworkConnectivityService.checkNow();
      await new Promise((r) => setTimeout(r, 60));
      expect(NetworkConnectivityService.getStatus().estado).toBe('DEGRADED');
      expect(NetworkConnectivityService.getStatus().fallaConsecutiva).toBe(1);

      // Fallo 2 -> OFFLINE
      await NetworkConnectivityService.checkNow();
      await new Promise((r) => setTimeout(r, 60));
      expect(NetworkConnectivityService.getStatus().estado).toBe('OFFLINE');
      expect(NetworkConnectivityService.getStatus().fallaConsecutiva).toBe(2);

      // Restauración de red
      NetworkConnectivityService.setCustomPing(async () => 45);
      await NetworkConnectivityService.checkNow();
      await new Promise((r) => setTimeout(r, 60));
      expect(NetworkConnectivityService.getStatus().estado).toBe('ONLINE');
      expect(NetworkConnectivityService.getStatus().fallaConsecutiva).toBe(0);
    });

    it('el hook useNetworkHeartbeat debe exponer flags reactivas', async () => {
      const { NetworkConnectivityService } = await import('../services/networkConnectivityService');
      const { useNetworkHeartbeat } = await import('../hooks/useNetworkHeartbeat');
      const { renderHook, act } = await import('@testing-library/react');

      NetworkConnectivityService.reset();
      NetworkConnectivityService.setCustomPing(async () => 35);

      const { result } = renderHook(() => useNetworkHeartbeat());
      expect(result.current.isOnline).toBe(true);
      expect(result.current.isOffline).toBe(false);

      // Simular fallo
      NetworkConnectivityService.setCustomPing(async () => {
        throw new Error('Timeout');
      });

      await act(async () => {
        await result.current.checkNow();
        await new Promise((r) => setTimeout(r, 60));
      });

      expect(result.current.isDegraded).toBe(true);
    }, 15000);
  });

  describe('4. BackgroundSyncWorker & Aislamiento de Errores (TASK-021-03)', () => {
    beforeEach(async () => {
      const { OutboxSyncService } = await import('../services/outboxSyncService');
      const { NetworkConnectivityService } = await import('../services/networkConnectivityService');
      const { BackgroundSyncWorker } = await import('../services/backgroundSyncWorker');
      const { useResolucionStore } = await import('../store/useResolucionStore');

      await OutboxSyncService.resetOutbox();
      NetworkConnectivityService.reset();
      BackgroundSyncWorker.reset();
      useResolucionStore.getState().resetStore();
    });

    it('syncNow debe procesar ítems en orden FIFO y marcarlos SINCRONIZADO', async () => {
      const { OutboxSyncService } = await import('../services/outboxSyncService');
      const { BackgroundSyncWorker } = await import('../services/backgroundSyncWorker');
      const { NetworkConnectivityService } = await import('../services/networkConnectivityService');

      NetworkConnectivityService.setCustomPing(async () => 20);

      // Encolar 2 ventas
      const item1 = await OutboxSyncService.encolarTransaccion({
        empresaId: 'emp-01',
        ventaId: 'vta-f1',
        consecutivoInterno: 'VTA-101',
        tipoOperacion: 'VENTA_POS_LOCAL',
        payload: { valor: 30000 },
      });

      const item2 = await OutboxSyncService.encolarTransaccion({
        empresaId: 'emp-01',
        ventaId: 'vta-f2',
        consecutivoInterno: 'VTA-102',
        tipoOperacion: 'VENTA_POS_LOCAL',
        payload: { valor: 50000 },
      });

      const summary = await BackgroundSyncWorker.syncNow();
      expect(summary.processed).toBe(2);
      expect(summary.succeeded).toBe(2);
      expect(summary.failed).toBe(0);

      const check1 = await OutboxSyncService.obtenerPorId(item1.id);
      const check2 = await OutboxSyncService.obtenerPorId(item2.id);
      expect(check1?.estado).toBe('SINCRONIZADO');
      expect(check2?.estado).toBe('SINCRONIZADO');
      expect(check1?.respuestaFiscal?.cufe).toBeDefined();
    });

    it('syncNow no debe procesar nada si la red se encuentra OFFLINE', async () => {
      const { OutboxSyncService } = await import('../services/outboxSyncService');
      const { BackgroundSyncWorker } = await import('../services/backgroundSyncWorker');
      const { NetworkConnectivityService } = await import('../services/networkConnectivityService');

      // Forzar desconexión
      NetworkConnectivityService.setCustomPing(async () => {
        throw new Error('Sin internet');
      });
      await NetworkConnectivityService.checkNow();
      await new Promise((r) => setTimeout(r, 60));
      await NetworkConnectivityService.checkNow();
      await new Promise((r) => setTimeout(r, 60));

      expect(NetworkConnectivityService.getStatus().estado).toBe('OFFLINE');

      await OutboxSyncService.encolarTransaccion({
        empresaId: 'emp-01',
        ventaId: 'vta-offline',
        consecutivoInterno: 'VTA-999',
        tipoOperacion: 'VENTA_POS_LOCAL',
        payload: { valor: 25000 },
      });

      const summary = await BackgroundSyncWorker.syncNow();
      expect(summary.processed).toBe(0);

      const pendientes = await OutboxSyncService.obtenerPendientesParaProcesar();
      expect(pendientes.length).toBe(1);
      expect(pendientes[0].estado).toBe('PENDIENTE');
    });

    it('un error 400 debe marcarse ERROR_FATAL_DATOS sin frenar el resto de la cola', async () => {
      const { OutboxSyncService } = await import('../services/outboxSyncService');
      const { BackgroundSyncWorker } = await import('../services/backgroundSyncWorker');
      const { NetworkConnectivityService } = await import('../services/networkConnectivityService');

      NetworkConnectivityService.setCustomPing(async () => 15);

      // Ítem 1: Fallará con error 400 (NIT erróneo)
      const itemMalo = await OutboxSyncService.encolarTransaccion({
        empresaId: 'emp-01',
        ventaId: 'vta-nit-invalido',
        consecutivoInterno: 'VTA-201',
        tipoOperacion: 'FACTURA_ELECTRONICA_SIIGO',
        payload: { nit: '0000' },
      });

      // Ítem 2: Debe tener éxito
      const itemBueno = await OutboxSyncService.encolarTransaccion({
        empresaId: 'emp-01',
        ventaId: 'vta-valida',
        consecutivoInterno: 'VTA-202',
        tipoOperacion: 'FACTURA_ELECTRONICA_SIIGO',
        payload: { nit: '900123456' },
      });

      // Inyectar transmisor que arroja error 400 solo para el primer ítem
      BackgroundSyncWorker.setTransmitter(async (item) => {
        if (item.consecutivoInterno === 'VTA-201') {
          const err = new Error('NIT Invalido DIAN');
          (err as any).status = 400;
          throw err;
        }
        return {
          cufe: 'cufe-valido-123',
          numeroFiscal: 'FEVP-555',
          siigoInvoiceId: 'siigo-555',
        };
      });

      const summary = await BackgroundSyncWorker.syncNow();
      expect(summary.processed).toBe(2);
      expect(summary.succeeded).toBe(1);
      expect(summary.failed).toBe(1);

      const checkMalo = await OutboxSyncService.obtenerPorId(itemMalo.id);
      const checkBueno = await OutboxSyncService.obtenerPorId(itemBueno.id);

      expect(checkMalo?.estado).toBe('ERROR_FATAL_DATOS');
      expect(checkMalo?.ultimoError).toContain('NIT Invalido DIAN');

      // El segundo ítem debe haberse sincronizado sin ser bloqueado
      expect(checkBueno?.estado).toBe('SINCRONIZADO');
      expect(checkBueno?.respuestaFiscal?.numeroFiscal).toBe('FEVP-555');
    });

    it('actualiza atómicamente el registro en useResolucionStore sin alterar stock ni caja', async () => {
      const { OutboxSyncService } = await import('../services/outboxSyncService');
      const { BackgroundSyncWorker } = await import('../services/backgroundSyncWorker');
      const { NetworkConnectivityService } = await import('../services/networkConnectivityService');
      const { useResolucionStore } = await import('../store/useResolucionStore');

      NetworkConnectivityService.setCustomPing(async () => 10);

      // Registrar factura electrónica inicial en el store
      useResolucionStore.getState().addFacturaElectronica({
        id: 'fe-reg-01',
        ventaId: 'vta-store-test',
        resolucionId: 'res-default',
        prefijo: 'FEVP',
        numeroConsecutivo: 601,
        consecutivoCompleto: 'FEVP-601',
        fechaEmision: new Date().toISOString(),
        clienteNit: '900123456',
        clienteNombre: 'Restaurante El Puerto',
        clienteEmail: 'puerto@mar.com',
        subtotal: 168067,
        totalIva: 31933,
        total: 200000,
        estadoSiigo: 'PENDIENTE',
      });

      // Encolar en Outbox
      await OutboxSyncService.encolarTransaccion({
        empresaId: 'emp-01',
        ventaId: 'vta-store-test',
        consecutivoInterno: 'VTA-301',
        consecutivoFiscal: 'FEVP-601',
        tipoOperacion: 'FACTURA_ELECTRONICA_SIIGO',
        payload: { total: 200000 },
      });

      BackgroundSyncWorker.setTransmitter(async () => ({
        cufe: 'cufe-store-verificado',
        qrUrl: 'https://dian.gov.co/qr-verificado',
        siigoInvoiceId: 'siigo-inv-601',
        numeroFiscal: 'FEVP-601',
      }));

      await BackgroundSyncWorker.syncNow();

      const facturaStore = useResolucionStore.getState().getFacturaElectronicaByVentaId('vta-store-test');
      expect(facturaStore).toBeDefined();
      expect(facturaStore?.estadoSiigo).toBe('SINCRONIZADO');
      expect(facturaStore?.cufe).toBe('cufe-store-verificado');
      expect(facturaStore?.qrUrl).toBe('https://dian.gov.co/qr-verificado');
      expect(facturaStore?.siigoInvoiceId).toBe('siigo-inv-601');
    });
  });

  describe('5. Ergonomía Táctil en Topbar y POS Checkout (TASK-021-04)', () => {
    it('NetworkSyncStatusBadge debe contar con área táctil >= 44px / 48px y alto contraste', async () => {
      const { NetworkSyncStatusBadge } = await import('../components/layout/NetworkSyncStatusBadge');
      const { render, screen } = await import('@testing-library/react');
      const React = await import('react');

      const { container } = render(React.createElement(NetworkSyncStatusBadge));
      const button = screen.getByRole('button');

      expect(button).toBeInTheDocument();
      expect(button.className).toMatch(/min-h-\[44px\]|min-h-\[48px\]/);
      expect(button.className).toContain('text-xs');
      expect(button.className).toContain('font-bold');
      expect(screen.getByText('ONLINE')).toBeInTheDocument();
    });

    it('PaymentPanel debe renderizar aviso táctil offline-invoice-notice cuando isOffline y requiereFactura', async () => {
      const { PaymentPanel } = await import('../views/pos/components/PaymentPanel');
      const { render, screen, fireEvent, act } = await import('@testing-library/react');
      const React = await import('react');

      const defaultProps = {
        totalFinal: 50000,
        lineas: [
          {
            id: 'line-1',
            productoId: 'prod-1',
            nombre: 'Filete de Salmón',
            sku: 'SALM-01',
            precioUnitario: 50000,
            cantidad: 1,
            subtotal: 50000,
          },
        ],
        cliente: {
          id: 'cli-01',
          nombre: 'Restaurante El Mar',
          numeroIdentificacion: '900999888',
          tipoIdentificacion: 'NIT',
          telefono: '3001234567',
          email: 'contacto@elmar.co',
          direccion: 'Cra 10 # 20-30',
          ciudad: 'Bogotá',
          exigeFacturaElectronica: true,
        },
        stock: { 'bodega-1': { 'SALM-01': 10 } },
        bodegaActivaId: 'bodega-1',
        bodegaActivaNombre: 'Bodega Principal',
        onGuardarBorrador: () => {},
        onPagar: () => Promise.resolve({ id: 'vta-off-test' }),
        onLimpiarCarrito: () => {},
        isDisabled: false,
        isTurnoAbierto: true,
      };

      render(React.createElement(PaymentPanel, defaultProps as any));

      // Disparar evento offline y configurar navigator.onLine = false
      Object.defineProperty(window.navigator, 'onLine', { value: false, configurable: true });
      act(() => {
        fireEvent(window, new Event('offline'));
      });

      // El aviso micro-pill debe estar visible informando al cajero
      const { waitFor } = await import('@testing-library/react');
      const notice = await waitFor(() => screen.getByTestId('offline-invoice-notice'));
      expect(notice).toBeInTheDocument();
      expect(notice.textContent).toMatch(/Modo Fuera de Línea Activo/i);
      expect(notice.textContent).toMatch(/tirilla interna física/i);

      // El botón de cobro sigue habilitado con altura >= 56px (Regla del Niño de 12 Años)
      const btnCobrar = screen.getByTestId('btn-cobrar');
      expect(btnCobrar).toBeInTheDocument();
      expect(btnCobrar).not.toBeDisabled();
      expect(btnCobrar.className).toMatch(/min-h-\[56px\]/);
    });
  });
});




