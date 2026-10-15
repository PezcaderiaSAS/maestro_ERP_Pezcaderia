import { describe, it, expect, beforeEach } from 'vitest';
import { ZustandOrderRepositoryAdapter } from '../services/b2b/adapters/ZustandOrderRepositoryAdapter';
import { ZustandEventPublisherAdapter } from '../services/b2b/adapters/ZustandEventPublisherAdapter';
import {
  paymentStrategyRegistry,
  CashPaymentStrategy,
  DigitalTransferPaymentStrategy,
  CreditB2BPaymentStrategy,
  MixedPaymentStrategy,
} from '../services/b2b/strategies/PaymentSettlementStrategies';
import { useOrderStore } from '../store/useOrderStore';
import { useEventStore } from '../store/useEventStore';
import { Pedido, Cotizacion } from '../types/orders.types';
import { RegistrarEntregaEnSitioInput } from '../contracts/b2b.contracts';

describe('TASK-SOLID-02: Adaptadores de Infraestructura (DIP) y Estrategias OCP de Pago', () => {
  beforeEach(() => {
    useOrderStore.setState({ ventas: [], quotations: [] });
    useEventStore.setState({ events: [], syncQueue: [] });
  });

  describe('ZustandOrderRepositoryAdapter (DIP)', () => {
    const repo = new ZustandOrderRepositoryAdapter();

    it('debe guardar y recuperar pedidos a través de la abstracción IOrderRepository', () => {
      const pedido: Pedido = {
        id: 'ped-repo-01',
        numeroPedido: 'PED-REPO-100',
        fecha: new Date().toISOString(),
        origen: 'VISITA',
        clienteId: 'cli-01',
        bodegaId: 'bod-01',
        branch_id: 'suc-01',
        vendedorId: 'vend-01',
        formaPago: 'CONTADO',
        tipoEntrega: 'RECOGE',
        fechaEntrega: '2026-10-16',
        jornada: 'MANANA',
        estado: 'CREADO',
        observaciones: 'Test repo',
        lineas: [],
        subtotal: 50000,
        descuentoGlobalPct: 0,
        descuentoGlobalValor: 0,
        totalFinal: 50000,
        idempotencyKey: 'key-repo-1',
        rutaId: null,
        facturacionElectronica: false,
        idSiigo: null,
      };

      repo.guardarPedido(pedido);

      const encontrado = repo.obtenerPedidoPorId('ped-repo-01');
      expect(encontrado).toBeDefined();
      expect(encontrado?.numeroPedido).toBe('PED-REPO-100');

      // Buscar por número de pedido
      const encontradoPorNum = repo.obtenerPedidoPorId('PED-REPO-100');
      expect(encontradoPorNum?.id).toBe('ped-repo-01');

      // Actualizar parcialmente
      repo.actualizarPedido('ped-repo-01', { estado: 'LISTO', precintoCanastilla: 'PREC-99' });
      const actualizado = repo.obtenerPedidoPorId('ped-repo-01');
      expect(actualizado?.estado).toBe('LISTO');
      expect(actualizado?.precintoCanastilla).toBe('PREC-99');
    });

    it('debe gestionar cotizaciones en el repositorio', () => {
      const cot: Cotizacion = {
        id: 'cot-repo-01',
        fecha: '2026-10-15',
        cliente: 'Cliente Test',
        total: 100000,
        estado: 'BORRADOR',
      };

      useOrderStore.setState({ quotations: [cot] });

      const recuperada = repo.obtenerCotizacionPorId('cot-repo-01');
      expect(recuperada).toBeDefined();
      expect(recuperada?.estado).toBe('BORRADOR');

      repo.actualizarCotizacion('cot-repo-01', { estado: 'CONVERTIDA_A_PEDIDO' });
      const actualizada = repo.obtenerCotizacionPorId('cot-repo-01');
      expect(actualizada?.estado).toBe('CONVERTIDA_A_PEDIDO');
    });
  });

  describe('ZustandEventPublisherAdapter (DIP)', () => {
    const publisher = new ZustandEventPublisherAdapter();

    it('debe publicar eventos de dominio en useEventStore', () => {
      publisher.publicarEvento(
        'QUOTE_STATUS_CHANGED',
        'Vendedor Test',
        'Evento de prueba emitido desacopladamente',
        { testKey: 'val-123' }
      );

      const events = useEventStore.getState().events;
      expect(events.length).toBe(1);
      expect(events[0].actor).toBe('Vendedor Test');
      expect(events[0].descripcion).toContain('Evento de prueba');
      expect(events[0].metadata).toEqual({ testKey: 'val-123' });
    });
  });

  describe('Estrategias de Recaudo de Pagos en Ruta (OCP)', () => {
    const inputBase: RegistrarEntregaEnSitioInput = {
      pedidoId: 'ped-1',
      manifiestoId: 'man-1',
      firmaClienteUrl: 'data:image/png;base64,demo',
      formaPago: 'EFECTIVO',
    };

    it('CashPaymentStrategy debe liquidar correctamente efectivo', () => {
      const cash = new CashPaymentStrategy();
      const res = cash.procesarRecaudo(150000, {
        ...inputBase,
        montoCobradoFinal: 140000,
      });

      expect(res.montoEfectivo).toBe(140000);
      expect(res.montoDigital).toBe(0);
      expect(res.montoCobradoFinal).toBe(140000);
    });

    it('DigitalTransferPaymentStrategy debe liquidar correctamente transferencias digitales', () => {
      const digital = new DigitalTransferPaymentStrategy();
      const res = digital.procesarRecaudo(200000, {
        ...inputBase,
        formaPago: 'TRANSFERENCIA_DIGITAL',
        montoDigital: 200000,
      });

      expect(res.montoEfectivo).toBe(0);
      expect(res.montoDigital).toBe(200000);
      expect(res.montoCobradoFinal).toBe(200000);
    });

    it('CreditB2BPaymentStrategy no debe recaudar dinero físico en ruta', () => {
      const credit = new CreditB2BPaymentStrategy();
      const res = credit.procesarRecaudo(350000, {
        ...inputBase,
        formaPago: 'CREDITO_B2B',
      });

      expect(res.montoEfectivo).toBe(0);
      expect(res.montoDigital).toBe(0);
      expect(res.montoCobradoFinal).toBe(350000);
    });

    it('MixedPaymentStrategy debe admitir fraccionamiento de recaudo', () => {
      const mixed = new MixedPaymentStrategy();
      const res = mixed.procesarRecaudo(500000, {
        ...inputBase,
        formaPago: 'MIXTO',
        montoEfectivo: 200000,
        montoDigital: 300000,
      });

      expect(res.montoEfectivo).toBe(200000);
      expect(res.montoDigital).toBe(300000);
      expect(res.montoCobradoFinal).toBe(500000);
    });

    it('PaymentStrategyRegistry debe resolver la estrategia adecuada según formaPago', () => {
      expect(paymentStrategyRegistry.obtener('EFECTIVO')).toBeInstanceOf(CashPaymentStrategy);
      expect(paymentStrategyRegistry.obtener('TRANSFERENCIA_DIGITAL')).toBeInstanceOf(DigitalTransferPaymentStrategy);
      expect(paymentStrategyRegistry.obtener('CREDITO_B2B')).toBeInstanceOf(CreditB2BPaymentStrategy);
      expect(paymentStrategyRegistry.obtener('MIXTO')).toBeInstanceOf(MixedPaymentStrategy);
    });
  });
});
