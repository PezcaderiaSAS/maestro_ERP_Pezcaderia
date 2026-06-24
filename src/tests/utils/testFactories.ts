import type { Producto } from '../../types/inventory.types';
import type { VentaPOS, LineaVenta } from '../../types/pos.types';
import type { Pedido } from '../../types/orders.types';

export const crearProducto = (overrides: Partial<Producto> = {}): Producto => ({
  id: 'prod-001',
  sku: 'SAL-001',
  nombre: 'Salmón Entero',
  categoriaId: 'cat-001',
  unidadMedida: 'KG',
  precioCompra: 15000,
  precioVentaPOS: 22000,
  precioVentaRestaurante: 20000,
  precioVentaMayorista: 18000,
  codigoBarras: null,
  imagenUrl: null,
  bufferSeguridad: 5,
  activo: true,
  ...overrides,
});

export const crearLineaVenta = (overrides: Partial<LineaVenta> = {}): LineaVenta => ({
  productoId: 'prod-001',
  sku: 'SAL-001',
  nombre: 'Salmón Entero',
  cantidad: 1.5,
  unidad: 'KG',
  precioLista: 22000,
  descuentoPct: 0,
  precioFinal: 22000,
  totalLinea: 33000,
  esPesoManual: false,
  ...overrides,
});

export const crearVentaPOS = (overrides: Partial<VentaPOS> = {}): VentaPOS => ({
  id: 'venta-001',
  fecha: new Date().toISOString(),
  clienteId: null,
  cajeroId: 'user-001',
  lineas: [],
  subtotal: 0,
  descuentoGlobalPct: 0,
  descuentoGlobalValor: 0,
  totalFinal: 0,
  formaPago: 'EFECTIVO',
  requiereFacturaElectronica: false,
  estadoSiigo: 'NO_REQUERIDO',
  idempotencyKey: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'mock-uuid-pos',
  ...overrides,
});

export const crearPedido = (overrides: Partial<Pedido> = {}): Pedido => ({
  id: 'ped-001',
  numeroPedido: 'PED-000001',
  fecha: new Date().toISOString(),
  origen: 'VISITA',
  clienteId: 'cli-001',
  bodegaId: 'bod-001',
  vendedorId: 'user-001',
  formaPago: 'CONTADO',
  tipoEntrega: 'EN_RUTA',
  fechaEntrega: new Date().toISOString().split('T')[0],
  jornada: 'MANANA',
  estado: 'CREADO',
  observaciones: '',
  lineas: [],
  subtotal: 0,
  descuentoGlobalPct: 0,
  descuentoGlobalValor: 0,
  totalFinal: 0,
  idempotencyKey: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'mock-uuid-pedido',
  rutaId: null,
  facturacionElectronica: false,
  idSiigo: null,
  ...overrides,
});
