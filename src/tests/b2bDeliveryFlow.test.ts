import { describe, it, expect, beforeEach } from 'vitest';
import {
  b2bIntegrationService,
  CrearYDespacharManifiestoInput,
  RegistrarEntregaEnSitioInput,
  LiquidarManifiestoInput,
} from '../services/b2bIntegrationService';
import { useOrderStore } from '../store/useOrderStore';
import { useEventStore } from '../store/useEventStore';
import { Pedido } from '../types/orders.types';
import { deliveryRouteService } from '../services/deliveryRouteService';
import { RouteReturnItem } from '../../packages/validation-schemas/src/deliveryRoute.schema';

describe('B2B Delivery & Route Dispatch Flow - Orquestador Rutas (TASK-015-04)', () => {
  const pedidoListo1: Pedido = {
    id: 'ped-ruta-001',
    numeroPedido: 'PED-B2B-200101',
    fecha: '2026-10-15T09:00:00.000Z',
    origen: 'VISITA',
    clienteId: 'cli-001',
    bodegaId: 'BOD-01',
    branch_id: '00000000-0000-0000-0000-000000000001',
    vendedorId: 'vend-007',
    vendedorNombre: 'Carlos Vendedor',
    cotizacionIdOriginal: 'cot-101',
    formaPago: 'CONTADO',
    tipoEntrega: 'EN_RUTA',
    fechaEntrega: '2026-10-15',
    jornada: 'MANANA',
    estado: 'LISTO',
    remisionId: 'rem-991',
    tokenQrRemision: 'qr-token-991',
    precintoCanastilla: 'PREC-CAN-01',
    horaInicioAlistamiento: '2026-10-15T09:30:00.000Z',
    horaFinAlistamiento: '2026-10-15T10:00:00.000Z',
    operarioAlistadorId: 'oper-101',
    operarioAlistadorNombre: 'Juan Bodeguero',
    observaciones: 'Listo para despacho',
    subtotal: 500000,
    descuentoGlobalPct: 0,
    descuentoGlobalValor: 0,
    totalFinal: 500000,
    idempotencyKey: 'idemp-ruta-001',
    rutaId: null,
    facturacionElectronica: false,
    idSiigo: null,
    inventarioDescontado: true,
    lineas: [
      {
        productoId: 'prod-robalo-01',
        sku: 'ROB-001',
        nombre: 'Filete de Róbalo',
        cantidadSolicitada: 10,
        cantidadAlistada: 10,
        cantidadDespachada: 0,
        estadoLinea: 'COMPLETO',
        pesoEstimado: 10,
        pesoReal: 10,
        variacionPesoPct: 0,
        toleranciaAceptada: true,
        subtotalRealAjustado: 500000,
        precioPactado: 50000,
        totalLinea: 500000,
        unidadMedida: 'kg',
        loteSeleccionado: 'LOT-ROB-01',
      },
    ],
  };

  beforeEach(() => {
    useOrderStore.setState({
      ventas: [JSON.parse(JSON.stringify(pedidoListo1))],
      quotations: [],
    });
    useEventStore.setState({
      events: [],
      syncQueue: [],
    });
  });

  describe('crearYDespacharManifiesto', () => {
    it('debe rechazar el despacho si la temperatura del termo-furgón excede los 4°C', async () => {
      const input: CrearYDespacharManifiestoInput = {
        conductorId: 'cond-501',
        conductorNombre: 'Pedro Conductor',
        conductorTelefono: '3105556677',
        vehiculoPlaca: 'TRK-987',
        zonaRuta: 'Zona Norte - Chapinero',
        pedidosIds: ['ped-ruta-001'],
        kilometrajeInicial: 45000,
        temperaturaFurgonCelsius: 8.5, // Ruptura de cadena de frío (> 4°C)
      };

      await expect(b2bIntegrationService.crearYDespacharManifiesto(input)).rejects.toThrow(
        'Temperatura del furgón no apta para cadena de frío'
      );
    });

    it('debe rechazar si alguno de los pedidos no está en estado LISTO', async () => {
      useOrderStore.setState({
        ventas: [
          {
            ...pedidoListo1,
            estado: 'CREADO', // Aún no ha sido alistado ni pesado
          },
        ],
      });

      const input: CrearYDespacharManifiestoInput = {
        conductorId: 'cond-501',
        conductorNombre: 'Pedro Conductor',
        vehiculoPlaca: 'TRK-987',
        zonaRuta: 'Zona Norte',
        pedidosIds: ['ped-ruta-001'],
        kilometrajeInicial: 45000,
        temperaturaFurgonCelsius: 2.0,
      };

      await expect(b2bIntegrationService.crearYDespacharManifiesto(input)).rejects.toThrow(
        'Todos los pedidos deben estar en estado LISTO'
      );
    });

    it('debe crear el manifiesto, transicionar pedidos a EN_RUTA y estampar conductor y ruta', async () => {
      const input: CrearYDespacharManifiestoInput = {
        conductorId: 'cond-501',
        conductorNombre: 'Pedro Conductor',
        conductorTelefono: '3105556677',
        vehiculoPlaca: 'TRK-987',
        zonaRuta: 'Zona Norte - Usaquén',
        pedidosIds: ['ped-ruta-001'],
        kilometrajeInicial: 45000,
        temperaturaFurgonCelsius: 1.5,
        observaciones: 'Despacho mañana prioritario',
      };

      const result = await b2bIntegrationService.crearYDespacharManifiesto(input);

      expect(result.manifiesto).toBeDefined();
      expect(result.manifiesto.estado).toBe('EN_RUTA');
      expect(result.manifiesto.vehiculoPlaca).toBe('TRK-987');
      expect(result.manifiesto.temperaturaSalidaCelsius).toBe(1.5);
      expect(result.pedidosDespachados).toHaveLength(1);

      const pedidoDespachado = result.pedidosDespachados[0];
      expect(pedidoDespachado.estado).toBe('EN_RUTA');
      expect(pedidoDespachado.conductorRepartidorId).toBe('cond-501');
      expect(pedidoDespachado.conductorRepartidorNombre).toBe('Pedro Conductor');
      expect(pedidoDespachado.manifiestoRutaId).toBe(result.manifiesto.id);

      // Verificar persistencia en store
      const enStore = useOrderStore.getState().ventas.find(v => v.id === 'ped-ruta-001');
      expect(enStore?.estado).toBe('EN_RUTA');
      expect(enStore?.conductorRepartidorId).toBe('cond-501');

      // Verificar evento de dominio
      const events = useEventStore.getState().events;
      expect(events[0]?.metadata?.evento).toBe('b2b_pedidos_despachados_en_ruta');
    });
  });

  describe('registrarEntregaEnSitio', () => {
    it('debe rechazar la entrega si falta la firma digital del cliente', async () => {
      // Primero despachar la ruta
      const despacho = await b2bIntegrationService.crearYDespacharManifiesto({
        conductorId: 'cond-501',
        conductorNombre: 'Pedro Conductor',
        vehiculoPlaca: 'TRK-987',
        zonaRuta: 'Zona Norte',
        pedidosIds: ['ped-ruta-001'],
        kilometrajeInicial: 45000,
        temperaturaFurgonCelsius: 1.0,
      });

      const inputEntrega: RegistrarEntregaEnSitioInput = {
        pedidoId: 'ped-ruta-001',
        manifiestoId: despacho.manifiesto.id,
        firmaClienteUrl: '', // Firma ausente
        formaPago: 'EFECTIVO',
      };

      await expect(b2bIntegrationService.registrarEntregaEnSitio(inputEntrega)).rejects.toThrow(
        'La firma digital del cliente es obligatoria'
      );
    });

    it('debe registrar entrega conforme con firma digital y cobro en sitio', async () => {
      const despacho = await b2bIntegrationService.crearYDespacharManifiesto({
        conductorId: 'cond-501',
        conductorNombre: 'Pedro Conductor',
        vehiculoPlaca: 'TRK-987',
        zonaRuta: 'Zona Norte',
        pedidosIds: ['ped-ruta-001'],
        kilometrajeInicial: 45000,
        temperaturaFurgonCelsius: 1.0,
      });

      const inputEntrega: RegistrarEntregaEnSitioInput = {
        pedidoId: 'ped-ruta-001',
        manifiestoId: despacho.manifiesto.id,
        firmaClienteUrl: 'data:image/svg+xml;base64,PHN2ZyBmaXJtYT48L3N2Zz4=',
        formaPago: 'EFECTIVO',
        montoEfectivo: 500000,
        montoCobradoFinal: 500000,
        observaciones: 'Entregado a entera satisfacción en cocina',
      };

      const resultadoEntrega = await b2bIntegrationService.registrarEntregaEnSitio(inputEntrega);

      expect(resultadoEntrega.pedido.estado).toBe('ENTREGADO');
      expect(resultadoEntrega.pedido.firmaClienteUrl).toBeDefined();
      expect(resultadoEntrega.pedido.horaEntregaEfectiva).toBeDefined();

      // Verificar persistencia en useOrderStore
      const enStore = useOrderStore.getState().ventas.find(v => v.id === 'ped-ruta-001');
      expect(enStore?.estado).toBe('ENTREGADO');

      // Verificar evento de dominio
      const events = useEventStore.getState().events;
      expect(events[0]?.metadata?.evento).toBe('b2b_entrega_en_sitio_registrada');
    });

    it('debe procesar devoluciones por calidad enviándolas a CUARENTENA_CALIDAD y ajustando cobro', async () => {
      const despacho = await b2bIntegrationService.crearYDespacharManifiesto({
        conductorId: 'cond-501',
        conductorNombre: 'Pedro Conductor',
        vehiculoPlaca: 'TRK-987',
        zonaRuta: 'Zona Norte',
        pedidosIds: ['ped-ruta-001'],
        kilometrajeInicial: 45000,
        temperaturaFurgonCelsius: 1.0,
      });

      // Rechazo de 2 kg por inconformidad de frío/temperatura
      const devolucion: RouteReturnItem = {
        productoId: 'prod-robalo-01',
        sku: 'ROB-001',
        nombre: 'Filete de Róbalo',
        cantidadDevueltaKg: 2,
        precioUnitario: 50000,
        montoDescontado: 100000,
        motivoRechazo: 'CADENA_FRIO',
        destinoBodega: 'CUARENTENA_CALIDAD',
        loteFefo: 'LOT-ROB-01',
      };

      const inputEntregaParcial: RegistrarEntregaEnSitioInput = {
        pedidoId: 'ped-ruta-001',
        manifiestoId: despacho.manifiesto.id,
        firmaClienteUrl: 'data:image/svg+xml;base64,firma-cliente',
        formaPago: 'EFECTIVO',
        montoEfectivo: 400000, // 500.000 - 100.000 devueltos
        montoCobradoFinal: 400000,
        devoluciones: [devolucion],
        observaciones: 'Rechazo parcial de 2kg por temperatura',
      };

      const res = await b2bIntegrationService.registrarEntregaEnSitio(inputEntregaParcial);

      expect(res.pedido.estado).toBe('ENTREGADO');
      expect(res.pedido.observaciones).toContain('CUARENTENA_CALIDAD');
      expect(res.manifiesto.totalDevolucionesMonto).toBe(100000);
      expect(res.manifiesto.pedidos[0].estadoEntrega).toBe('ENTREGADO_PARCIAL');
    });
  });

  describe('liquidarManifiestoRuta', () => {
    it('debe liquidar la ruta con kilometraje final y cuadre de caja', async () => {
      const despacho = await b2bIntegrationService.crearYDespacharManifiesto({
        conductorId: 'cond-501',
        conductorNombre: 'Pedro Conductor',
        vehiculoPlaca: 'TRK-987',
        zonaRuta: 'Zona Norte',
        pedidosIds: ['ped-ruta-001'],
        kilometrajeInicial: 45000,
        temperaturaFurgonCelsius: 1.0,
      });

      await b2bIntegrationService.registrarEntregaEnSitio({
        pedidoId: 'ped-ruta-001',
        manifiestoId: despacho.manifiesto.id,
        firmaClienteUrl: 'data:image/svg+xml;base64,firma-ok',
        formaPago: 'EFECTIVO',
        montoEfectivo: 500000,
        montoCobradoFinal: 500000,
      });

      const inputLiquidacion: LiquidarManifiestoInput = {
        manifiestoId: despacho.manifiesto.id,
        kilometrajeFinal: 45080, // 80 km de recorrido
        efectivoFisicoEntregado: 500000,
        temperaturaRetornoCelsius: 3.0,
        observacionesLiquidacion: 'Ruta finalizada sin novedades viales',
      };

      const manifiestoLiquidado = await b2bIntegrationService.liquidarManifiestoRuta(inputLiquidacion);

      expect(manifiestoLiquidado.estado).toBe('LIQUIDADA');
      expect(manifiestoLiquidado.kilometrajeFinal).toBe(45080);
      expect(manifiestoLiquidado.totalRecaudadoEfectivo).toBe(500000);
      expect(manifiestoLiquidado.diferenciaCuadre).toBe(0);

      // Evento de dominio de cierre de ruta
      const events = useEventStore.getState().events;
      expect(events[0]?.metadata?.evento).toBe('b2b_ruta_liquidada');
    });
  });
});
