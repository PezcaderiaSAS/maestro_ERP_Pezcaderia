import { describe, it, expect, beforeEach } from 'vitest';
import { driverDeliveryPwaService } from '../services/driverDeliveryPwaService';
import { useDriverDeliveryPwaStore } from '../store/useDriverDeliveryPwaStore';
import { OutboxSyncService } from '../services/outboxSyncService';
import { remove } from '../services/localDb';
import type { RegistroEjecucionParada } from '../../packages/validation-schemas/src/driverDeliveryPwa.schema';

describe('TASK-023-02: driverDeliveryPwaService y useDriverDeliveryPwaStore', () => {
  const validSignature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  beforeEach(async () => {
    driverDeliveryPwaService.cerrarSesion();
    remove('driver_pwa_active_manifest');
    useDriverDeliveryPwaStore.getState().logout();
    await OutboxSyncService.resetOutbox();
  });

  describe('1. Autenticación y Manejo de Sesión', () => {
    it('Inicia sesión correctamente con conductor predeterminado', async () => {
      const session = await driverDeliveryPwaService.loginConductor(
        'conductor.juan@pezcaderia.com',
        'ClaveSegura123'
      );
      expect(session).toBeDefined();
      expect(session.conductorId).toBe('drv-001');
      expect(session.conductorNombre).toBe('Juan Carlos Rodríguez');
      expect(session.vehiculoPlaca).toBe('WPZ-482');
      expect(session.activo).toBe(true);
      expect(session.horaInicioTurno).toBeDefined();

      const sesionCargada = driverDeliveryPwaService.obtenerSesionActual();
      expect(sesionCargada?.email).toBe('conductor.juan@pezcaderia.com');
    });

    it('Inicia sesión con correo corporativo dinámico', async () => {
      const session = await driverDeliveryPwaService.loginConductor(
        'carlos.perez@pezcaderia.com',
        'Conductor2026*'
      );
      expect(session.conductorId).toMatch(/^drv-/);
      expect(session.conductorNombre).toBe('Carlos perez');
      expect(session.activo).toBe(true);
    });

    it('Cierra sesión y limpia la persistencia local', async () => {
      await driverDeliveryPwaService.loginConductor(
        'conductor.juan@pezcaderia.com',
        'ClaveSegura123'
      );
      expect(driverDeliveryPwaService.obtenerSesionActual()).not.toBeNull();

      driverDeliveryPwaService.cerrarSesion();
      expect(driverDeliveryPwaService.obtenerSesionActual()).toBeNull();
    });
  });

  describe('2. Carga y Mapeo de Ruta Activa', () => {
    it('Carga o crea ruta de demostración estructurada con paradas y métricas', async () => {
      const ruta = await driverDeliveryPwaService.obtenerRutaActivaConductor('drv-001');
      expect(ruta).toBeDefined();
      expect(ruta?.manifiestoId).toBeDefined();
      expect(ruta?.paradas.length).toBeGreaterThanOrEqual(3);
      expect(ruta?.paradasTotales).toBe(3);
      expect(ruta?.paradasCompletadas).toBe(0);
      expect(ruta?.progresoPorcentaje).toBe(0);
      expect(ruta?.paradas[0].clienteNombre).toBe('Restaurante Mar y Sabor');
      expect(ruta?.paradas[0].estadoEntrega).toBe('PENDIENTE');
    });
  });

  describe('3. Ejecución Quirúrgica de Parada y Encolado Outbox', () => {
    it('Registra una entrega total, actualiza progreso y encola en Outbox con idempotencia', async () => {
      // 1. Obtener ruta inicial
      const rutaInicial = await driverDeliveryPwaService.obtenerRutaActivaConductor('drv-001');
      expect(rutaInicial?.paradasCompletadas).toBe(0);

      // 2. Ejecutar entrega
      const registro: RegistroEjecucionParada = {
        paradaId: 'stop-001',
        pedidoId: 'ped-8841',
        manifiestoId: rutaInicial!.manifiestoId,
        estadoFinal: 'ENTREGADO_TOTAL',
        evidencia: {
          nombreReceptor: 'Chef Mario',
          cedulaReceptor: '1098765432',
          firmaCanvasBase64: validSignature,
          temperaturaLlegada: 2.5
        },
        devoluciones: [],
        montoCobradoEfectivo: 450000,
        montoCobradoTransferencia: 0
      };

      const resultado = await driverDeliveryPwaService.registrarEntregaParada(registro, {
        conductorId: 'drv-001',
        clienteNombre: 'Restaurante Mar y Sabor'
      });

      expect(resultado.exito).toBe(true);
      expect(resultado.outboxId).toBeDefined();

      // 3. Verificar que la ruta se actualizó
      const rutaActualizada = await driverDeliveryPwaService.obtenerRutaActivaConductor('drv-001');
      expect(rutaActualizada?.paradasCompletadas).toBe(1);
      expect(rutaActualizada?.progresoPorcentaje).toBe(33);

      const parada1 = rutaActualizada?.paradas.find((p) => p.id === 'stop-001');
      expect(parada1?.estadoEntrega).toBe('ENTREGADO_TOTAL');
      expect(parada1?.montoCobradoFinal).toBe(450000);
      expect(parada1?.montoEfectivo).toBe(450000);
      expect(parada1?.evidencia?.nombreReceptor).toBe('Chef Mario');

      // 4. Verificar existencia en la cola Outbox
      const outboxItems = await OutboxSyncService.obtenerTodos();
      const itemEncolado = outboxItems.find((i) => i.id === resultado.outboxId);
      expect(itemEncolado).toBeDefined();
      expect(itemEncolado?.tipoOperacion).toBe('ENTREGA_RUTA_PWA');
      expect(itemEncolado?.ventaId).toBe('ped-8841');
      expect(itemEncolado?.estado).toBe('PENDIENTE');
    });

    it('Registra una entrega parcial con devolución de producto', async () => {
      const ruta = await driverDeliveryPwaService.obtenerRutaActivaConductor('drv-001');
      const registro: RegistroEjecucionParada = {
        paradaId: 'stop-002',
        pedidoId: 'ped-8842',
        manifiestoId: ruta!.manifiestoId,
        estadoFinal: 'ENTREGADO_PARCIAL',
        evidencia: {
          nombreReceptor: 'Gerente Carlos',
          cedulaReceptor: '987654321',
          firmaCanvasBase64: validSignature,
          temperaturaLlegada: 3.8
        },
        devoluciones: [
          {
            sku: 'SALM-CHI-001',
            nombre: 'Filete de Salmón Chileno',
            kilosDevueltos: 3.5,
            motivoRechazo: 'EMPAQUE_AVERIADO',
            observaciones: 'Bolsa al vacío rota en tránsito'
          }
        ],
        montoCobradoEfectivo: 0,
        montoCobradoTransferencia: 652000,
        comprobanteTransferencia: 'TRANSF-BANCOLOMBIA-4412'
      };

      const resultado = await driverDeliveryPwaService.registrarEntregaParada(registro, {
        conductorId: 'drv-001'
      });
      expect(resultado.exito).toBe(true);

      const rutaActualizada = await driverDeliveryPwaService.obtenerRutaActivaConductor('drv-001');
      const parada2 = rutaActualizada?.paradas.find((p) => p.id === 'stop-002');
      expect(parada2?.estadoEntrega).toBe('ENTREGADO_PARCIAL');
      expect(parada2?.montoDigital).toBe(652000);
      expect(parada2?.referenciaTransferencia).toBe('TRANSF-BANCOLOMBIA-4412');
      expect(parada2?.devoluciones?.length).toBe(1);
      expect(parada2?.devoluciones?.[0].kilosDevueltos).toBe(3.5);
    });
  });

  describe('4. Resumen de Recaudo y Mermas de la Ruta', () => {
    it('Calcula correctamente los totales de efectivo, transferencia y kilos devueltos', () => {
      const rutaDemo = driverDeliveryPwaService.crearRutaDemostracion('drv-001');
      rutaDemo.paradas[0].estadoEntrega = 'ENTREGADO_TOTAL';
      rutaDemo.paradas[0].montoCobradoFinal = 450000;
      rutaDemo.paradas[0].montoEfectivo = 450000;

      rutaDemo.paradas[1].estadoEntrega = 'ENTREGADO_PARCIAL';
      rutaDemo.paradas[1].montoCobradoFinal = 600000;
      rutaDemo.paradas[1].montoDigital = 600000;
      rutaDemo.paradas[1].devoluciones = [
        {
          sku: 'SALM-01',
          nombre: 'Salmón',
          kilosDevueltos: 2.5,
          motivoRechazo: 'EMPAQUE_AVERIADO'
        }
      ];

      const resumen = driverDeliveryPwaService.obtenerResumenRecaudoRuta(rutaDemo);

      expect(resumen.totalCobrado).toBe(1050000);
      expect(resumen.totalEfectivo).toBe(450000);
      expect(resumen.totalTransferencia).toBe(600000);
      expect(resumen.totalDevolucionesKg).toBe(2.5);
      expect(resumen.paradasEntregadasTotal).toBe(1);
      expect(resumen.paradasEntregadasParcial).toBe(1);
    });
  });

  describe('5. useDriverDeliveryPwaStore (Reactivo)', () => {
    it('Permite login, carga de ruta, selección de parada y ejecución fluida', async () => {
      const store = useDriverDeliveryPwaStore.getState();

      const loginOk = await store.login('conductor.juan@pezcaderia.com', 'ClaveSegura123');
      expect(loginOk).toBe(true);

      const stateAfterLogin = useDriverDeliveryPwaStore.getState();
      expect(stateAfterLogin.session?.conductorNombre).toBe('Juan Carlos Rodríguez');
      expect(stateAfterLogin.activeRoute).not.toBeNull();

      // Seleccionar parada
      const parada = stateAfterLogin.activeRoute!.paradas[0];
      store.seleccionarParada(parada);
      expect(useDriverDeliveryPwaStore.getState().selectedStop?.id).toBe('stop-001');

      // Ejecutar parada stop-001
      const ejecucion = await store.ejecutarParada({
        paradaId: 'stop-001',
        pedidoId: 'ped-8841',
        manifiestoId: stateAfterLogin.activeRoute!.manifiestoId,
        estadoFinal: 'ENTREGADO_TOTAL',
        evidencia: {
          nombreReceptor: 'Doña Martha',
          cedulaReceptor: '63123456',
          firmaCanvasBase64: validSignature,
          temperaturaLlegada: 1.2
        },
        devoluciones: [],
        montoCobradoEfectivo: 450000,
        montoCobradoTransferencia: 0
      });

      expect(ejecucion.exito).toBe(true);
      const stateAfterExec = useDriverDeliveryPwaStore.getState();
      expect(stateAfterExec.selectedStop).toBeNull();
      expect(stateAfterExec.activeRoute?.paradasCompletadas).toBe(1);
      expect(stateAfterExec.activeRoute?.progresoPorcentaje).toBe(33);
    });
  });
});
