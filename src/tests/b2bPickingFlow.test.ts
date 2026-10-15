import { describe, it, expect, beforeEach } from 'vitest';
import { b2bIntegrationService, IniciarAlistamientoInput, RegistrarPesajeLineaInput, FinalizarAlistamientoInput } from '../services/b2bIntegrationService';
import { useOrderStore } from '../store/useOrderStore';
import { useEventStore } from '../store/useEventStore';
import { Pedido } from '../types/orders.types';

describe('B2B Picking & WMS Flow - Orquestador Bodega (TASK-015-03)', () => {
  const pedidoBase: Pedido = {
    id: 'ped-wms-001',
    numeroPedido: 'PED-B2B-100200',
    fecha: '2026-10-15T10:30:00.000Z',
    origen: 'VISITA',
    clienteId: 'cli-001',
    bodegaId: 'BOD-01',
    branch_id: '00000000-0000-0000-0000-000000000001',
    vendedorId: 'vend-007',
    vendedorNombre: 'Carlos Vendedor',
    cotizacionIdOriginal: 'cot-101',
    formaPago: 'CONTADO',
    tipoEntrega: 'EN_RUTA',
    fechaEntrega: '2026-10-16',
    jornada: 'MANANA',
    estado: 'CREADO',
    observaciones: 'Empacar en canastilla sellada',
    subtotal: 800000,
    descuentoGlobalPct: 0,
    descuentoGlobalValor: 0,
    totalFinal: 800000,
    idempotencyKey: 'idemp-wms-001',
    rutaId: null,
    facturacionElectronica: false,
    idSiigo: null,
    inventarioDescontado: false,
    lineas: [
      {
        productoId: 'prod-salmon-01',
        sku: 'SALM-001',
        nombre: 'Salmón Fresco Entero',
        cantidadSolicitada: 20,
        cantidadAlistada: 0,
        cantidadDespachada: 0,
        estadoLinea: 'PENDIENTE',
        pesoEstimado: 20,
        precioPactado: 40000,
        totalLinea: 800000,
        unidadMedida: 'kg',
        modalidadVenta: 'PESO_DIRECTO',
      },
    ],
  };

  beforeEach(() => {
    useOrderStore.setState({
      ventas: [JSON.parse(JSON.stringify(pedidoBase))],
      quotations: [],
    });
    useEventStore.setState({
      events: [],
      syncQueue: [],
    });
  });

  describe('iniciarAlistamiento', () => {
    it('debe transicionar el pedido a EN_ALISTAMIENTO y estampar los datos del operario', async () => {
      const input: IniciarAlistamientoInput = {
        pedidoId: 'ped-wms-001',
        operarioId: 'oper-101',
        operarioNombre: 'Juan Bodeguero',
      };

      const pedidoActualizado = await b2bIntegrationService.iniciarAlistamiento(input);

      expect(pedidoActualizado.estado).toBe('EN_ALISTAMIENTO');
      expect(pedidoActualizado.operarioAlistadorId).toBe('oper-101');
      expect(pedidoActualizado.operarioAlistadorNombre).toBe('Juan Bodeguero');
      expect(pedidoActualizado.horaInicioAlistamiento).toBeDefined();

      // Verificar persistencia en useOrderStore
      const enStore = useOrderStore.getState().ventas.find(v => v.id === 'ped-wms-001');
      expect(enStore?.estado).toBe('EN_ALISTAMIENTO');

      // Verificar evento de dominio
      const events = useEventStore.getState().events;
      expect(events[0]?.metadata?.evento).toBe('b2b_alistamiento_iniciado');
    });

    it('debe rechazar si el pedido está pausado por crédito', async () => {
      useOrderStore.setState({
        ventas: [
          {
            ...pedidoBase,
            estado: 'PAUSADO_POR_CREDITO',
          },
        ],
      });

      const input: IniciarAlistamientoInput = {
        pedidoId: 'ped-wms-001',
        operarioId: 'oper-101',
      };

      await expect(b2bIntegrationService.iniciarAlistamiento(input)).rejects.toThrow(
        'El pedido está pausado por cupo de crédito y no puede alistarse'
      );
    });
  });

  describe('registrarPesajeLinea', () => {
    it('debe registrar pesaje real dentro de tolerancia (+-5%) y recalcular totales', async () => {
      // Iniciar alistamiento primero
      await b2bIntegrationService.iniciarAlistamiento({
        pedidoId: 'ped-wms-001',
        operarioId: 'oper-101',
        operarioNombre: 'Juan Bodeguero',
      });

      const inputPesaje: RegistrarPesajeLineaInput = {
        pedidoId: 'ped-wms-001',
        productoId: 'prod-salmon-01',
        pesoRealKg: 20.6, // +3% de variación (dentro de +-5%)
        loteFefo: 'LOT-20261015-SALM',
        temperaturaC: 1.5,
        toleranciaPorcentaje: 5,
      };

      const pedido = await b2bIntegrationService.registrarPesajeLinea(inputPesaje);

      expect(pedido.lineas[0].pesoReal).toBe(20.6);
      expect(pedido.lineas[0].toleranciaAceptada).toBe(true);
      expect(pedido.lineas[0].loteSeleccionado).toBe('LOT-20261015-SALM');
      expect(pedido.lineas[0].temperaturaC).toBe(1.5);
      expect(pedido.lineas[0].estadoLinea).toBe('COMPLETO');
      // Subtotal recalculado: 20.6 kg * 40.000 = 824.000 COP
      expect(pedido.lineas[0].subtotalRealAjustado).toBe(824000);
      expect(pedido.totalFinal).toBe(824000);
      expect(pedido.estado).toBe('EN_ALISTAMIENTO');
    });

    it('debe marcar toleranciaAceptada: false y transicionar pedido a PAUSADO cuando excede el +-5%', async () => {
      await b2bIntegrationService.iniciarAlistamiento({
        pedidoId: 'ped-wms-001',
        operarioId: 'oper-101',
      });

      const inputPesajeExcedido: RegistrarPesajeLineaInput = {
        pedidoId: 'ped-wms-001',
        productoId: 'prod-salmon-01',
        pesoRealKg: 22.5, // +12.5% de variación (> 5%)
        loteFefo: 'LOT-20261015-SALM',
        toleranciaPorcentaje: 5,
      };

      const pedido = await b2bIntegrationService.registrarPesajeLinea(inputPesajeExcedido);

      expect(pedido.lineas[0].toleranciaAceptada).toBe(false);
      expect(pedido.estado).toBe('PAUSADO');
      expect(pedido.observaciones).toContain('Variación de peso');
    });
  });

  describe('finalizarAlistamiento', () => {
    it('debe rechazar finalizar si existen líneas pendientes de pesaje', async () => {
      await b2bIntegrationService.iniciarAlistamiento({
        pedidoId: 'ped-wms-001',
        operarioId: 'oper-101',
      });

      const inputFinalizar: FinalizarAlistamientoInput = {
        pedidoId: 'ped-wms-001',
        precintoCanastilla: 'PREC-99881',
      };

      await expect(b2bIntegrationService.finalizarAlistamiento(inputFinalizar)).rejects.toThrow(
        'Todas las líneas deben estar pesadas y con lote FEFO asignado'
      );
    });

    it('debe finalizar alistamiento, emitir Remisión WMS con QR y pasar a estado LISTO', async () => {
      // Iniciar alistamiento
      await b2bIntegrationService.iniciarAlistamiento({
        pedidoId: 'ped-wms-001',
        operarioId: 'oper-101',
        operarioNombre: 'Juan Bodeguero',
      });

      // Pesar línea dentro de rango
      await b2bIntegrationService.registrarPesajeLinea({
        pedidoId: 'ped-wms-001',
        productoId: 'prod-salmon-01',
        pesoRealKg: 20.2, // +1% variación
        loteFefo: 'LOT-20261015-SALM',
        temperaturaC: 2.0,
      });

      const inputFinalizar: FinalizarAlistamientoInput = {
        pedidoId: 'ped-wms-001',
        precintoCanastilla: 'PREC-99881',
        temperaturaSalidaC: 2.0,
      };

      const pedidoListo = await b2bIntegrationService.finalizarAlistamiento(inputFinalizar);

      expect(pedidoListo.estado).toBe('LISTO');
      expect(pedidoListo.precintoCanastilla).toBe('PREC-99881');
      expect(pedidoListo.tokenQrRemision).toBeDefined();
      expect(pedidoListo.remisionId).toBeDefined();
      expect(pedidoListo.horaFinAlistamiento).toBeDefined();
      expect(pedidoListo.inventarioDescontado).toBe(true);

      // Verificar evento de dominio
      const events = useEventStore.getState().events;
      expect(events[0]?.metadata?.evento).toBe('b2b_alistamiento_completado');
      expect(events[0]?.metadata?.precinto).toBe('PREC-99881');
    });
  });
});
