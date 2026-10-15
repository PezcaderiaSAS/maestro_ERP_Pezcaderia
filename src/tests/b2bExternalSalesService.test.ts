import { describe, it, expect, beforeEach, vi } from 'vitest';
import { b2bIntegrationService, CrearPedidoVentaExternaInput } from '../services/b2bIntegrationService';
import { useOrderStore, setOrderDataService } from '../store/useOrderStore';
import { useEventStore } from '../store/useEventStore';
import { useClientStore } from '../store/useClientStore';
import { AppRouteId, COMMERCIAL_ROUTES, APP_ROUTES_METADATA, isRouteAllowedForRole } from '../routes/AppRoute';
import { Cliente } from '../types/erp.types';

describe('B2B External Sales Service Suite (TASK-016-01 / SPEC-016)', () => {
  const mockClienteSolvente: Cliente = {
    id: 'cli-rest-mar-azul',
    nombre: 'Restaurante Mar Azul Gourmet',
    identificacion: '901234567-8',
    tipoIdentificacion: 'NIT',
    tipoPersona: 'JURIDICA',
    direccion: 'Carrera 33 # 48-12, Bucaramanga',
    ciudad: 'Bucaramanga',
    telefono: '3157894561',
    email: 'compras@marazul.com',
    tipoPrecio: 'RESTAURANTE',
    cupoCredito: 10_000_000,
    cupoCreditoUsado: 2_000_000, // Disponible: 8.000.000 COP
    isGranContribuyente: true,
    isAutoretenedor: false,
    activo: true,
  };

  const mockClienteIlimitadoAgotado: Cliente = {
    id: 'cli-mariscos-express',
    nombre: 'Pescadería Mariscos Express',
    identificacion: '900987654-1',
    tipoIdentificacion: 'NIT',
    tipoPersona: 'JURIDICA',
    direccion: 'Calle 45 # 15-20, Floridablanca',
    ciudad: 'Floridablanca',
    telefono: '3123456789',
    email: 'contacto@mariscosexpress.com',
    tipoPrecio: 'MAYORISTA',
    cupoCredito: 1_000_000,
    cupoCreditoUsado: 950_000, // Disponible: 50.000 COP
    isGranContribuyente: false,
    isAutoretenedor: false,
    activo: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    setOrderDataService({
      getAll: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue(undefined),
    } as any);

    useOrderStore.setState({
      ventas: [],
      quotations: [],
    });

    useClientStore.setState({
      clientes: [mockClienteSolvente, mockClienteIlimitadoAgotado],
    });

    useEventStore.setState({ events: [] });
  });

  describe('1. Verificación de Rutas y RBAC (AppRoute)', () => {
    it('debe tener registrada la ruta B2B_EXTERNAL_SALES en el Dominio Comercial', () => {
      expect(AppRouteId.B2B_EXTERNAL_SALES).toBe('ventas_b2b');
      expect(COMMERCIAL_ROUTES).toContain(AppRouteId.B2B_EXTERNAL_SALES);

      const metadata = APP_ROUTES_METADATA[AppRouteId.B2B_EXTERNAL_SALES];
      expect(metadata).toBeDefined();
      expect(metadata.path).toBe('/ventas/b2b-externo');
      expect(metadata.title).toBe('Ventas B2B Bodega Principal');
      expect(metadata.iconName).toBe('Truck');
      expect(metadata.isPrimaryNav).toBe(true);
    });

    it('debe permitir acceso a roles autorizados (admin, vendedor, administrativo) y denegar a otros', () => {
      expect(isRouteAllowedForRole(AppRouteId.B2B_EXTERNAL_SALES, 'admin')).toBe(true);
      expect(isRouteAllowedForRole(AppRouteId.B2B_EXTERNAL_SALES, 'vendedor')).toBe(true);
      expect(isRouteAllowedForRole(AppRouteId.B2B_EXTERNAL_SALES, 'administrativo')).toBe(true);
      expect(isRouteAllowedForRole(AppRouteId.B2B_EXTERNAL_SALES, 'bodega')).toBe(false);
    });
  });

  describe('2. Transaccionalidad de Pedidos de Venta Externa B2B', () => {
    it('debe crear un pedido en estado CREADO cuando el cliente tiene cupo de crédito disponible suficiente', async () => {
      const input: CrearPedidoVentaExternaInput = {
        vendedorId: 'vend-001',
        vendedorNombre: 'Yurgen González',
        clienteId: mockClienteSolvente.id,
        clienteNombre: mockClienteSolvente.nombre,
        cliente: mockClienteSolvente,
        formaPago: 'CREDITO',
        fechaEntrega: '2026-10-16',
        jornada: 'MANANA',
        tipoEntrega: 'EN_RUTA',
        observaciones: 'Entregar en cocina principal antes de las 10am',
        lineas: [
          {
            productoId: 'prod-trucha-arcoiris',
            nombre: 'Trucha Arcoíris Entera Eviscerada',
            modalidadVenta: 'CATCH_WEIGHT_PIEZAS',
            cantidadSolicitada: 10, // 10 piezas
            calibreMinGramos: 450,
            calibreMaxGramos: 500, // Promedio 475g = 0.475 kg/pieza -> 4.75 kg nominales
            precioPactado: 28000,
          },
          {
            productoId: 'prod-filete-tilapia',
            nombre: 'Filete de Tilapia Fresco',
            modalidadVenta: 'PESO_DIRECTO',
            cantidadSolicitada: 15.0, // 15 kg
            precioPactado: 24000,
          },
        ],
      };

      const pedido = await b2bIntegrationService.crearPedidoVentaExternaB2B(input);

      expect(pedido).toBeDefined();
      expect(pedido.id).toBeDefined();
      expect(pedido.numeroPedido).toMatch(/^PED-B2B-\d{6}$/);
      expect(pedido.estado).toBe('CREADO');
      expect(pedido.bodegaId).toBe('1'); // Bodega Principal por defecto
      expect(pedido.origen).toBe('VISITA');
      expect(pedido.vendedorId).toBe('vend-001');

      // Validar cálculo Catch Weight Dual
      const lineaTrucha = pedido.lineas.find(l => l.productoId === 'prod-trucha-arcoiris');
      expect(lineaTrucha).toBeDefined();
      expect(lineaTrucha?.modalidadVenta).toBe('CATCH_WEIGHT_PIEZAS');
      expect(lineaTrucha?.piezasSolicitadas).toBe(10);
      expect(lineaTrucha?.calibreMinGramos).toBe(450);
      expect(lineaTrucha?.calibreMaxGramos).toBe(500);
      expect(lineaTrucha?.pesoEstimado).toBe(4.75); // 10 * 0.475 kg
      expect(lineaTrucha?.totalLinea).toBe(133000); // 4.75 * 28000 = 133.000

      // Validar línea PESO_DIRECTO
      const lineaTilapia = pedido.lineas.find(l => l.productoId === 'prod-filete-tilapia');
      expect(lineaTilapia).toBeDefined();
      expect(lineaTilapia?.pesoEstimado).toBe(15.0);
      expect(lineaTilapia?.totalLinea).toBe(360000); // 15 * 24000 = 360.000

      // Validar retenciones NIIF Gran Contribuyente
      expect(pedido.subtotal).toBe(493000); // 133.000 + 360.000
      expect(pedido.retefuenteValor).toBeGreaterThan(0);
      expect(pedido.reteicaValor).toBeGreaterThan(0);
      expect(pedido.subtotalNeto).toBe(pedido.totalFinal - (pedido.retefuenteValor || 0) - (pedido.reteicaValor || 0));

      // Validar persistencia en store
      const ventas = useOrderStore.getState().ventas;
      expect(ventas.some(v => v.id === pedido.id)).toBe(true);

      // Validar emisión de evento en useEventStore
      const events = useEventStore.getState().events;
      expect(events.length).toBeGreaterThan(0);
      const lastEvent = events[events.length - 1];
      expect(lastEvent.actor).toBe('Yurgen González');
      expect(lastEvent.metadata?.evento).toBe('b2b_pedido_externo_creado');
      expect(lastEvent.metadata?.pedidoId).toBe(pedido.id);
    });

    it('debe transicionar a PAUSADO_POR_CREDITO cuando el cliente excede su cupo disponible en forma de pago CREDITO', async () => {
      const input: CrearPedidoVentaExternaInput = {
        vendedorId: 'vend-001',
        vendedorNombre: 'Yurgen González',
        clienteId: mockClienteIlimitadoAgotado.id,
        cliente: mockClienteIlimitadoAgotado,
        formaPago: 'CREDITO',
        fechaEntrega: '2026-10-17',
        jornada: 'TARDE',
        lineas: [
          {
            productoId: 'prod-salmon-premium',
            nombre: 'Salmón Premium Entero',
            modalidadVenta: 'PESO_DIRECTO',
            cantidadSolicitada: 10, // 10 kg a 45.000 = 450.000 COP (Disponible solo 50.000)
            precioPactado: 45000,
          },
        ],
      };

      const pedido = await b2bIntegrationService.crearPedidoVentaExternaB2B(input);

      expect(pedido.estado).toBe('PAUSADO_POR_CREDITO');
      expect(pedido.observaciones).toContain('[PAUSADO POR CUPO DE CRÉDITO:');
      expect(pedido.totalFinal).toBe(450000);

      // Validar que se guardó en el store con estado pausado
      const pedidoEnStore = useOrderStore.getState().ventas.find(v => v.id === pedido.id);
      expect(pedidoEnStore?.estado).toBe('PAUSADO_POR_CREDITO');
    });

    it('debe quedar en estado CREADO si el cliente no tiene cupo pero el pago es de CONTADO', async () => {
      const input: CrearPedidoVentaExternaInput = {
        vendedorId: 'vend-001',
        vendedorNombre: 'Yurgen González',
        clienteId: mockClienteIlimitadoAgotado.id,
        cliente: mockClienteIlimitadoAgotado,
        formaPago: 'CONTADO', // Pago de contado contra-entrega
        fechaEntrega: '2026-10-17',
        jornada: 'MANANA',
        lineas: [
          {
            productoId: 'prod-salmon-premium',
            nombre: 'Salmón Premium Entero',
            modalidadVenta: 'PESO_DIRECTO',
            cantidadSolicitada: 10,
            precioPactado: 45000,
          },
        ],
      };

      const pedido = await b2bIntegrationService.crearPedidoVentaExternaB2B(input);

      // No debe pausarse porque es CONTADO
      expect(pedido.estado).toBe('CREADO');
      expect(pedido.observaciones).not.toContain('PAUSADO POR CUPO');
    });

    it('debe calcular correctamente productos con UNIDADES_FIJAS', async () => {
      const input: CrearPedidoVentaExternaInput = {
        vendedorId: 'vend-002',
        vendedorNombre: 'Laura Patiño',
        clienteId: mockClienteSolvente.id,
        cliente: mockClienteSolvente,
        formaPago: 'CONTADO',
        fechaEntrega: '2026-10-16',
        jornada: 'MANANA',
        lineas: [
          {
            productoId: 'prod-pulpo-cocido-pack',
            nombre: 'Pack Pulpo Cocido 500g',
            modalidadVenta: 'UNIDADES_FIJAS',
            cantidadSolicitada: 4,
            precioPactado: 35000,
          },
        ],
      };

      const pedido = await b2bIntegrationService.crearPedidoVentaExternaB2B(input);
      const linea = pedido.lineas[0];

      expect(linea.modalidadVenta).toBe('UNIDADES_FIJAS');
      expect(linea.unidadMedida).toBe('und');
      expect(linea.totalLinea).toBe(140000); // 4 * 35000
      expect(pedido.totalFinal).toBe(140000);
    });

    it('debe rechazar la creación si faltan campos indispensables', async () => {
      await expect(
        b2bIntegrationService.crearPedidoVentaExternaB2B({
          vendedorId: '',
          clienteId: 'cli-01',
          formaPago: 'CONTADO',
          fechaEntrega: '2026-10-16',
          jornada: 'MANANA',
          lineas: [{ productoId: 'p1', nombre: 'P1', cantidadSolicitada: 1, precioPactado: 1000 }],
        })
      ).rejects.toThrow('El ID del vendedor es obligatorio');

      await expect(
        b2bIntegrationService.crearPedidoVentaExternaB2B({
          vendedorId: 'vend-01',
          clienteId: '',
          formaPago: 'CONTADO',
          fechaEntrega: '2026-10-16',
          jornada: 'MANANA',
          lineas: [{ productoId: 'p1', nombre: 'P1', cantidadSolicitada: 1, precioPactado: 1000 }],
        })
      ).rejects.toThrow('El ID del cliente es obligatorio');

      await expect(
        b2bIntegrationService.crearPedidoVentaExternaB2B({
          vendedorId: 'vend-01',
          clienteId: 'cli-01',
          formaPago: 'CONTADO',
          fechaEntrega: '2026-10-16',
          jornada: 'MANANA',
          lineas: [],
        })
      ).rejects.toThrow('El pedido debe contener al menos un producto');
    });
  });
});
