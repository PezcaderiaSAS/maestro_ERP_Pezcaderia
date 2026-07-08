import { useEffect } from 'react';
import { createLogger } from './lib/consoleLogger';
import { Menu, LayoutDashboard, ShoppingBag, Box, Users, DollarSign, HelpCircle, Home, ShoppingCart, LogOut, FileText, PlusCircle, Wallet, Database, Truck, RefreshCw, PieChart, PackageCheck, BookOpen } from 'lucide-react';
import DashboardView from './views/DashboardView.tsx';
import POSView from './views/POSView.tsx';
import InventoryView from './views/InventoryView.tsx';
import HRView from './views/HRView.tsx';
import PricingView from './views/PricingView.tsx';
import ARView from './views/ARView.tsx';
import ClientsView from './views/ClientsView.tsx';
import SuppliersView from './views/SuppliersView.tsx';
import OrderKanbanView from './views/OrderKanbanView.tsx';
import PayrollView from './views/PayrollView.tsx';
import CRMView from './views/CRMView.tsx';
import CashFlowView from './views/cash/CashFlowView.tsx';
import { AlistamientoBodegaView } from './views/inventory/AlistamientoBodegaView.tsx';
import { DispatchView } from './views/inventory/DispatchView.tsx';
import { DevTestDashboard } from './dev/DevTestDashboard.tsx';
import AccountingView from './views/AccountingView.tsx';
import * as localDb from './services/localDb.ts';
// Stores de Zustand
import { useInventoryStore } from './store/useInventoryStore.ts';
import { useWarehouseStore } from './store/useWarehouseStore.ts';
import { useOrderStore } from './store/useOrderStore.ts';
import { useClientStore } from './store/useClientStore.ts';
import { useSupplierStore } from './store/useSupplierStore.ts';
import { useCategoryStore } from './store/useCategoryStore.ts';
import { useDriverStore } from './store/useDriverStore.ts';
import { useEmployeeStore } from './store/useEmployeeStore.ts';
import { useExpenseStore } from './store/useExpenseStore.ts';
import { useDynamicFieldStore } from './store/useDynamicFieldStore.ts';
import { useARStore } from './store/useARStore.ts';
import { useReturnStore } from './store/useReturnStore.ts';
import { useIntegrationStore } from './store/useIntegrationStore.ts';
import { usePurchaseStore } from './store/usePurchaseStore.ts';
import { useMovementStore } from './store/useMovementStore.ts';
import { useEventStore } from './store/useEventStore.ts';
import { useAppStore } from './store/useAppStore.ts';

/** Genera IDs únicos usando crypto.randomUUID() — resistente a colisiones en operaciones rápidas */
export const generateId = (prefix: string): string =>
  `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

export const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(word => {
    // Excepciones para preposiciones y artículos
    const smallWords = ['de', 'del', 'la', 'las', 'el', 'los', 'y', 'en', 'a', 'por', 'para'];
    if (smallWords.includes(word) && str.toLowerCase().indexOf(word) !== 0) {
      return word;
    }
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
};

import type { Cliente, Proveedor, Conductor, DevolucionPedido, ProductCatalog, ProductPricing, Product } from './types/erp.types';
export type { Cliente, Proveedor, Conductor, DevolucionPedido, ProductCatalog, ProductPricing, Product };

const INITIAL_CLIENTS: Cliente[] = [
  {
    id: 'c-1',
    nombre: 'Restaurante Central',
    identificacion: '123',
    tipoIdentificacion: 'NIT',
    tipoPersona: 'JURIDICA',
    direccion: 'Calle 45 # 12-30, Bogotá',
    telefono: '3151234567',
    email: 'compras@restaurantecentral.com',
    ciudad: 'Bogotá',
    tipoPrecio: 'RESTAURANTE',
    encargadoCompras: 'Martín Gómez',
    cupoCredito: 1500000,
    activo: true
  },
  {
    id: 'c-2',
    nombre: 'Restaurante del Mar',
    identificacion: '900123456-1',
    tipoIdentificacion: 'NIT',
    tipoPersona: 'JURIDICA',
    direccion: 'Av. Santander # 5-10, Cartagena',
    telefono: '3207654321',
    email: 'contacto@restdelmar.co',
    ciudad: 'Cartagena',
    tipoPrecio: 'RESTAURANTE',
    encargadoCompras: 'Lucía Fernández',
    cupoCredito: 2500000,
    activo: true
  },
  {
    id: 'c-3',
    nombre: 'Pescadería La Playa',
    identificacion: '800987654-2',
    tipoIdentificacion: 'NIT',
    tipoPersona: 'JURIDICA',
    direccion: 'Carrera 10 # 14-50, Barranquilla',
    telefono: '3009876543',
    email: 'gerencia@laplayapescaderia.com',
    ciudad: 'Barranquilla',
    tipoPrecio: 'MAYORISTA',
    encargadoCompras: 'Carlos Rojas',
    cupoCredito: 4000000,
    activo: true
  },
  {
    id: 'c-4',
    nombre: 'Consumidor Final (POS)',
    identificacion: '22222222',
    tipoIdentificacion: 'CC',
    tipoPersona: 'NATURAL',
    direccion: 'Calle 100 # 15-22, Bogotá',
    telefono: '3109999999',
    email: 'pos@pezcaderia.com',
    ciudad: 'Bogotá',
    tipoPrecio: 'POS',
    cupoCredito: 0,
    activo: true
  }
];

const INITIAL_PROVEEDORES: Proveedor[] = [
  {
    id: 'prov-1',
    nombre: 'Distribuidores del Pacífico',
    nit: '900111222-1',
    tipoIdentificacion: 'NIT',
    direccion: 'Calle 15 # 4-20, Buenaventura',
    telefono: '3101234567',
    email: 'contacto@distripacifico.com',
    ciudad: 'Buenaventura',
    contactoCompras: 'Carlos Mendoza',
    plazoPagoDias: 30,
    activo: true
  },
  {
    id: 'prov-2',
    nombre: 'Mariscos del Atlántico',
    nit: '800222333-2',
    tipoIdentificacion: 'NIT',
    direccion: 'Av. Pedro de Heredia, Cartagena',
    telefono: '3207654321',
    email: 'ventas@mariscosatlantico.co',
    ciudad: 'Cartagena',
    contactoCompras: 'Sofía Restrepo',
    plazoPagoDias: 15,
    activo: true
  },
  {
    id: 'prov-3',
    nombre: 'Empaques y Logística del Eje',
    nit: '700333444-3',
    tipoIdentificacion: 'NIT',
    direccion: 'Zona Industrial, Pereira',
    telefono: '3159876543',
    email: 'empaques@logisticaeje.com',
    ciudad: 'Pereira',
    contactoCompras: 'Andrés Gómez',
    plazoPagoDias: 45,
    activo: true
  }
];

export interface Empleado {
  id: string;
  nombre: string;
  identificacion: string;
  rolAcceso: 'ADMINISTRADOR' | 'VENDEDOR' | 'BODEGUERO' | 'REPARTIDOR' | 'GERENTE';
  cargo: string;
  salarioBase: number;
  fechaIngreso: string;
  tipoContrato: 'INDEFINIDO' | 'FIJO' | 'PRESTACION_SERVICIOS' | 'APRENDIZAJE';
  estado: 'ACTIVO' | 'INACTIVO' | 'VACACIONES' | 'INCAPACIDAD';
  prestamosActivos: number;
  auxilioTransporte: number;
  telefono: string;
  email: string;
  riesgoARL: 'I' | 'II' | 'III' | 'IV' | 'V';
  aplicaExoneracion: boolean; // Ley 1607 (SENA, ICBF, Salud empleador)
}

/** Registro de nómina procesada y/o pagada */
export interface NominaRegistro {
  id: string;
  empleadoId: string;
  empleadoNombre: string;
  fechaEmision: string;
  periodoInicio: string;
  periodoFin: string;
  diasTrabajados: number;
  tipoLiquidacion?: 'REGULAR' | 'VACACIONES' | 'LIQUIDACION_FINAL';
  
  // Devengos
  salarioBaseProporcional: number;
  auxilioTransporte: number;
  horasExtrasDevengado: number;
  bonificaciones: number;
  viaticos: number;
  totalDevengado: number;

  // Deducciones Empleado
  saludDeduccion: number;
  pensionDeduccion: number;
  prestamosDeduccion: number;
  otrasDeducciones: number;
  totalDeducido: number;

  // Neto
  netoAPagar: number;
  estadoPago: 'PENDIENTE' | 'PAGADO';
  gastoIdGenerado?: string; // ID del registro en Gastos

  // ----- Provisiones y Aportes del Empleador -----
  baseCotizacionIBC: number;
  
  // Provisiones (Costos Empresa)
  provisionCesantias: number;
  provisionInteresesCesantias: number;
  provisionPrima: number;
  provisionVacaciones: number;
  
  // Seguridad Social y Parafiscales (Empresa)
  aportePensionEmpresa: number;
  aporteSaludEmpresa: number; // 0 si está exonerado
  aporteARL: number;
  aporteCCF: number; // Caja de Compensación (4%)
  aporteSENAICBF: number; // 0 si está exonerado, sino 5%
  
  costoTotalEmpresa: number; // Devengado + Provisiones + SS Empresa
}

export interface Gasto {
  id: string;
  fecha: string;
  categoria: 'NÓMINA' | 'INVENTARIO' | 'SERVICIOS_PUBLICOS' | 'IMPUESTOS' | 'MANTENIMIENTO' | 'OTROS';
  concepto: string;
  monto: number;
  referenciaId?: string;
  metodoPago: string;
}

export interface CategoriaConfig {
  id: string;
  tipo: string;
  linea: string;
  clase: string;
}

export function migrateProductsToCatalogAndPricing(oldProducts: any[], currentActor: string): { catalog: ProductCatalog[], pricings: ProductPricing[] } {
  const catalog: ProductCatalog[] = [];
  const pricings: ProductPricing[] = [];
  const now = new Date().toISOString();
  
  oldProducts.forEach(p => {
    catalog.push({
      id: p.id,
      sku: p.sku,
      nombre: p.nombre,
      categoria: p.categoria,
      unidadMedida: p.unidadMedida || 'kg',
      imagen: p.imagen,
      codigo_barras: p.codigo_barras || '',
      iva: p.iva || 0,
      ivaIncluido: p.ivaIncluido ?? true,
      control_inventario: p.control_inventario ?? true,
      produccion: p.produccion ?? false,
      activo: p.activo ?? true,
      categoriaABC: p.categoriaABC,
      metadata: p.metadata
    });
    pricings.push({
      id: generateId('prc'),
      productoId: p.id,
      vigenciaDesde: now,
      precio_compra: p.precio_compra || 0,
      buffer_seguridad: p.buffer_seguridad || 0,
      precio_venta_pos: p.precio_venta_pos || 0,
      precio_venta_restaurante: p.precio_venta_restaurante || 0,
      precio_venta_mayorista: p.precio_venta_mayorista || 0,
      actualizadoPor: currentActor
    });
  });
  
  return { catalog, pricings };
}

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p-1',
    sku: 'PES-ENT-001',
    nombre: 'PESCADO ENTERO (MATERIA PRIMA)',
    categoria: 'MATERIA PRIMA',
    precio_compra: 12000,
    buffer_seguridad: 5,
    precio_venta_pos: 18000,
    precio_venta_restaurante: 16800,
    precio_venta_mayorista: 15000,
    activo: true
  },
  {
    id: 'p-2',
    sku: 'FIL-LIM-002',
    nombre: 'FILETE LIMPIO (TERMINADO)',
    categoria: 'PESCADOS',
    precio_compra: 22000,
    buffer_seguridad: 10,
    precio_venta_pos: 35000,
    precio_venta_restaurante: 32000,
    precio_venta_mayorista: 29000,
    activo: true
  },
  {
    id: 'p-3',
    sku: 'CAM-TIG-003',
    nombre: 'CAMARÓN TIGRE (TERMINADO)',
    categoria: 'MARISCOS',
    precio_compra: 35000,
    buffer_seguridad: 12,
    precio_venta_pos: 55000,
    precio_venta_restaurante: 51000,
    precio_venta_mayorista: 46000,
    activo: true
  },
  {
    id: 'p-4',
    sku: 'BAT-001',
    nombre: 'BATIDO AMARILLO',
    categoria: 'BATIDOS',
    precio_compra: 3000,
    buffer_seguridad: 0,
    precio_venta_pos: 8000,
    precio_venta_restaurante: 7200,
    precio_venta_mayorista: 6500,
    imagen: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    activo: true
  },
  {
    id: 'p-5',
    sku: 'BAT-002',
    nombre: 'BATIDO CÍTRICO',
    categoria: 'BATIDOS',
    precio_compra: 3000,
    buffer_seguridad: 0,
    precio_venta_pos: 8000,
    precio_venta_restaurante: 7200,
    precio_venta_mayorista: 6500,
    imagen: 'https://images.unsplash.com/photo-1623065422902-30a2ad4dc9b5?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    activo: true
  },
  {
    id: 'p-6',
    sku: 'BAT-003',
    nombre: 'BATIDO NARANJA',
    categoria: 'BATIDOS',
    precio_compra: 3000,
    buffer_seguridad: 0,
    precio_venta_pos: 8000,
    precio_venta_restaurante: 7200,
    precio_venta_mayorista: 6500,
    imagen: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    activo: true
  },
  {
    id: 'p-7',
    sku: 'BAT-004',
    nombre: 'BATIDO VERDE',
    categoria: 'BATIDOS',
    precio_compra: 3000,
    buffer_seguridad: 0,
    precio_venta_pos: 8000,
    precio_venta_restaurante: 7200,
    precio_venta_mayorista: 6500,
    imagen: 'https://images.unsplash.com/photo-1610970881699-44a5587caa90?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    activo: true
  },
  {
    id: 'p-8',
    sku: 'BAT-005',
    nombre: 'BATIDO ROJO',
    categoria: 'BATIDOS',
    precio_compra: 3000,
    buffer_seguridad: 0,
    precio_venta_pos: 8000,
    precio_venta_restaurante: 7200,
    precio_venta_mayorista: 6500,
    imagen: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    activo: true
  },
  {
    id: 'p-9',
    sku: 'BEB-001',
    nombre: 'JUGO DE MANDARINA',
    categoria: 'BEBIDAS',
    precio_compra: 2000,
    buffer_seguridad: 0,
    precio_venta_pos: 5000,
    precio_venta_restaurante: 4500,
    precio_venta_mayorista: 4000,
    imagen: 'https://images.unsplash.com/photo-1522012147041-30a112008767?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    activo: true
  },
  {
    id: 'p-10',
    sku: 'BEB-002',
    nombre: 'JUGO DE GUANÁBANA',
    categoria: 'BEBIDAS',
    precio_compra: 2000,
    buffer_seguridad: 0,
    precio_venta_pos: 5000,
    precio_venta_restaurante: 4500,
    precio_venta_mayorista: 4000,
    imagen: 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    activo: true
  },
  {
    id: 'p-11',
    sku: 'ENS-001',
    nombre: 'ENSALADA VERDE',
    categoria: 'ENSALADAS',
    precio_compra: 4500,
    buffer_seguridad: 5,
    precio_venta_pos: 12000,
    precio_venta_restaurante: 10800,
    precio_venta_mayorista: 9500,
    imagen: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    activo: true
  },
  {
    id: 'p-12',
    sku: 'ENS-002',
    nombre: 'ENSALADA DE AGUACATE',
    categoria: 'ENSALADAS',
    precio_compra: 5000,
    buffer_seguridad: 5,
    precio_venta_pos: 13000,
    precio_venta_restaurante: 11700,
    precio_venta_mayorista: 10000,
    imagen: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    activo: true
  },
  {
    id: 'p-13',
    sku: 'ENS-003',
    nombre: 'ENSALADA DE COLORES',
    categoria: 'ENSALADAS',
    precio_compra: 4500,
    buffer_seguridad: 5,
    precio_venta_pos: 12000,
    precio_venta_restaurante: 10800,
    precio_venta_mayorista: 9500,
    imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    activo: true
  },
  {
    id: 'p-14',
    sku: 'ENS-004',
    nombre: 'ENSALADA DE POLLO',
    categoria: 'ENSALADAS',
    precio_compra: 4500,
    buffer_seguridad: 5,
    precio_venta_pos: 12000,
    precio_venta_restaurante: 10800,
    precio_venta_mayorista: 9500,
    imagen: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    activo: true
  },
  {
    id: 'p-15',
    sku: 'ENT-001',
    nombre: 'CANELONE DE PUERRO',
    categoria: 'ENTRADAS',
    precio_compra: 5000,
    buffer_seguridad: 5,
    precio_venta_pos: 13000,
    precio_venta_restaurante: 11700,
    precio_venta_mayorista: 10000,
    imagen: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    activo: true
  },
  {
    id: 'p-16',
    sku: 'ENT-002',
    nombre: 'ESTOFADO DE LENTEJAS',
    categoria: 'ENTRADAS',
    precio_compra: 4000,
    buffer_seguridad: 5,
    precio_venta_pos: 12000,
    precio_venta_restaurante: 10800,
    precio_venta_mayorista: 9500,
    imagen: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    activo: true
  },
  {
    id: 'p-17',
    sku: 'GEN-001',
    nombre: 'HAMBURGUESA DE GARBANZO',
    categoria: 'GENERAL',
    precio_compra: 6000,
    buffer_seguridad: 8,
    precio_venta_pos: 15000,
    precio_venta_restaurante: 13500,
    precio_venta_mayorista: 12000,
    imagen: 'https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    activo: true
  }
];

export interface DomainEvent {
  id: string;
  timestamp: string;
  tipo: 'SALE_COMPLETED' | 'PRICE_CHANGED' | 'MERMA_ALERT' | 'QUOTE_STATUS_CHANGED' | 'METADATA_CONFIGURED';
  actor: string;
  descripcion: string;
  metadata?: any;
}

export interface SyncJob {
  id: string;
  eventTipo: string;
  payload: any;
  estado: 'PENDIENTE' | 'SINCRONIZADO' | 'FALLO';
  intentos: number;
  timestamp: string;
}

export interface DynamicField {
  key: string;
  label: string;
  tipo: 'text' | 'number';
  defaultValue: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// F2 — ENTIDADES TRANSACCIONALES
// ─────────────────────────────────────────────────────────────────────────────

/** Registro inmutable de cada cambio físico de stock. Fuente de verdad de auditoría. */
export interface MovimientoInventario {
  id: string;
  timestamp: string;
  tipo: 'ENTRADA_COMPRA' | 'TRASLADO_SALIDA' | 'TRASLADO_ENTRADA' | 'PRODUCCION_CONSUMO' | 'PRODUCCION_SALIDA' | 'VENTA' | 'AJUSTE';
  sku: string;
  nombreProducto: string;
  bodegaOrigen?: string;
  bodegaDestino?: string;
  cantidad: number;           // Siempre positivo — el tipo indica dirección
  lote: string;
  referenciaId?: string;      // ID de OrdenCompra, Venta, etc.
  referenciaTipo?: string;    // 'ORDEN_COMPRA' | 'VENTA' | 'PRODUCCION'
  actor: string;
  notas?: string;
}

/** Ítem dentro de una orden de compra */
export interface ItemOrdenCompra {
  sku: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  lote: string;
}

/** Orden de compra emitida a un proveedor */
export interface OrdenCompra {
  id: string;
  proveedorId: string;
  proveedorNombre: string;    // Desnormalizado para lectura rápida (histórico)
  fecha: string;
  estado: 'RECIBIDA';
  items: ItemOrdenCompra[];
  totalCompra: number;
  subtotal?: number;
  iva?: number;
  valorIva?: number;
  fletes?: number;
  formaPago?: 'CONTADO' | 'CREDITO';
  saldo?: number; // Saldo pendiente para Cartera de Proveedores (AP)
  bodegaDestino: string;
  actor: string;
  notas?: string;
}

/** Ítem vendido dentro de una Venta */
export interface ItemVenta {
  sku: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
}

/** Registro permanente de toda venta (contado Y crédito) */
export interface Venta {
  id: string;
  clienteId: string | null;   // null = consumidor final anónimo
  clienteNombre: string;       // Desnormalizado para lectura histórica
  fecha: string;
  items: ItemVenta[];
  subtotal: number;
  total: number;
  metodoPago: 'CONTADO' | 'CREDITO' | 'MIXTO';
  facturaCarteraId?: string;   // Si hay crédito → referencia a InvoiceAR
  actor: string;
  metadata?: {
    id_pedido_externo?: string;
    canal?: string;
    metodo_pago_codigo?: string;
  };
  clienteIdentificacion?: string;
  descuento?: number;
  montoPagadoEfectivo?: number;
  montoPagadoTransferencia?: number;
  montoPagadoTarjeta?: number;
  montoPagadoCredito?: number;
  cambioEntregado?: number;
}

export interface LogIntegracion {
  id: string;
  id_pedido_externo: string;
  canal: string;
  fecha_recepcion: string;
  payload_json: string;
  estado: 'PENDIENTE' | 'PROCESADO' | 'ERROR' | 'REVISION_MANUAL';
  id_factura_pos?: string;
  mensaje_error?: string;
}

export default function App() {
  const log = createLogger('App');

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      log.error('window.onerror', {
        mensaje: event.message,
        archivo: event.filename,
        linea: event.lineno,
        columna: event.colno,
        error: event.error?.stack,
      });
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      log.error('unhandledrejection', {
        motivo: event.reason?.message ?? event.reason,
        stack: event.reason?.stack,
      });
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  const { userRole, setUserRole, currentView, setCurrentView, sidebarOpen, setSidebarOpen } = useAppStore();

  const { productsCatalog, setProductsCatalog, productPricings, setProductPricings, products, loadInventory } = useInventoryStore();

  useEffect(() => {
    const savedCat = localDb.load('productsCatalog', null as ProductCatalog[] | null);
    if (!savedCat || savedCat.length === 0) {
      const oldSaved = localStorage.getItem('pezcaderia_products');
      let sourceProducts = INITIAL_PRODUCTS;
      if (oldSaved) {
        try { sourceProducts = JSON.parse(oldSaved); } catch (e) {}
      } else {
        sourceProducts = INITIAL_PRODUCTS.map(p => {
          let grp = 'General';
          if (p.categoria === 'MATERIA PRIMA') grp = 'Materia Prima';
          else if (p.categoria === 'PESCADOS') grp = 'Pescado Blanco';
          else if (p.categoria === 'MARISCOS') grp = 'Camarones';
          else if (p.categoria === 'BATIDOS') grp = 'Batidos Saludables';
          else if (p.categoria === 'BEBIDAS') grp = 'Jugos Naturales';
          else if (p.categoria === 'ENSALADAS') grp = 'Ensaladas Frescas';
          else if (p.categoria === 'ENTRADAS') grp = 'Entradas';
          return { ...p, metadata: p.metadata || { categoria_descriptiva: grp } };
        });
      }
      
      const { catalog, pricings } = migrateProductsToCatalogAndPricing(sourceProducts, userRole);
      setProductsCatalog(catalog);
      setProductPricings(pricings);
      localDb.removeRaw('pezcaderia_products');
    }
  }, [userRole, setProductsCatalog, setProductPricings]);

  const { ventas, setVentas, quotations, setQuotations, loadOrders } = useOrderStore();
  const { bodegas, setBodegas, loadBodegas } = useWarehouseStore();
  const { clientes, setClientes, loadClientes, lastClientPrices, loadLastClientPrices } = useClientStore();
  const { proveedores, setProveedores, loadProveedores } = useSupplierStore();
  const { categorias, setCategorias, loadCategorias } = useCategoryStore();
  const { conductores, loadConductores } = useDriverStore();
  const { empleados, setEmpleados, loadEmpleados, loadNominas } = useEmployeeStore();
  const { loadGastos } = useExpenseStore();
  const { dynamicFields, loadDynamicFields } = useDynamicFieldStore();
  const { cartera, setCartera, loadCartera } = useARStore();
  const { devoluciones, setDevoluciones, loadDevoluciones } = useReturnStore();
  const { logIntegracion, setLogIntegracion, parametros, loadLogIntegracion, loadParametros } = useIntegrationStore();
  const { stock, setStock, loadStock } = useInventoryStore();
  const { ordenesCompra, setOrdenesCompra, loadOrdenesCompra } = usePurchaseStore();
  const { movimientos, addMovimiento, loadMovimientos } = useMovementStore();
  const { syncQueue, setSyncQueue, loadEvents, loadSyncQueue } = useEventStore();

  useEffect(() => {
    loadOrders();
    loadBodegas();
    loadInventory();
    loadClientes(INITIAL_CLIENTS);
    loadProveedores(INITIAL_PROVEEDORES);
    loadCategorias();
    loadConductores();
    loadEmpleados();
    loadNominas();
    loadGastos();
    loadDynamicFields();
    loadCartera();
    loadDevoluciones();
    loadLogIntegracion();
    loadParametros();
    loadStock();
    loadOrdenesCompra();
    loadMovimientos();
    loadEvents();
    loadSyncQueue();
    loadLastClientPrices();
  }, [loadOrders, loadBodegas, loadInventory, loadClientes, loadProveedores, loadCategorias, loadConductores, loadEmpleados, loadNominas, loadGastos, loadDynamicFields, loadCartera, loadDevoluciones, loadLogIntegracion, loadParametros, loadStock, loadOrdenesCompra, loadMovimientos, loadEvents, loadSyncQueue, loadLastClientPrices]);

  // Normalización del separador decimal para el teclado numérico
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement) {
        
        const isNumpadDecimal = e.code === 'NumpadDecimal';
        const isStandardDot = e.key === '.';
        const isStandardComma = e.key === ',';
        
        // Determinar el separador decimal esperado por el sistema local (usualmente ',' en ES, '.' en EN)
        const localDecimalSeparator = (1.1).toLocaleString().substring(1, 2);
        
        // Queremos interceptar si presionan NumpadDecimal o si presionan un separador que NO coincide con su región
        const pressedWrongSeparator = (isStandardDot && localDecimalSeparator === ',') || (isStandardComma && localDecimalSeparator === '.');
        
        if (isNumpadDecimal || pressedWrongSeparator) {
          e.preventDefault();
          
          // En inputs type="number", los navegadores (Chrome/Edge) suelen esperar el separador regional
          // para la visualización, aunque internamente el .value sea con punto.
          // Usamos execCommand para simular la escritura nativa, lo que inserta en la posición correcta
          // del cursor y dispara los eventos nativos (y sintéticos de React) automáticamente.
          document.execCommand('insertText', false, localDecimalSeparator);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // ──────────────────────────────────────────────────────────────────────────────
  // MIGRATE TO TITLE CASE (One-Time / Idempotent Cleanup)
  useEffect(() => {
    let migrated = false;

    // Migrate Clientes
    const migratedClientes = clientes.map(c => {
      const newNombre = toTitleCase(c.nombre);
      const newCiudad = toTitleCase(c.ciudad);
      const newDireccion = toTitleCase(c.direccion);
      const newContacto = toTitleCase(c.encargadoCompras || '');
      if (c.nombre !== newNombre || c.ciudad !== newCiudad || c.direccion !== newDireccion || c.encargadoCompras !== newContacto) {
        migrated = true;
        return { ...c, nombre: newNombre, ciudad: newCiudad, direccion: newDireccion, encargadoCompras: newContacto };
      }
      return c;
    });

    // Migrate Proveedores
    const migratedProveedores = proveedores.map(p => {
      const newNombre = toTitleCase(p.nombre);
      const newCiudad = toTitleCase(p.ciudad);
      const newDireccion = toTitleCase(p.direccion);
      const newContacto = toTitleCase(p.contactoCompras || '');
      if (p.nombre !== newNombre || p.ciudad !== newCiudad || p.direccion !== newDireccion || p.contactoCompras !== newContacto) {
        migrated = true;
        return { ...p, nombre: newNombre, ciudad: newCiudad, direccion: newDireccion, contactoCompras: newContacto };
      }
      return p;
    });

    // Migrate Products
    const migratedProducts = productsCatalog.map((p: any) => {
      const newNombre = toTitleCase(p.nombre);
      if (p.nombre !== newNombre) {
        migrated = true;
        return { ...p, nombre: newNombre };
      }
      return p;
    });

    // Migrate Empleados (legacy `salario` to `salarioBase`, and ensure default fields)
    const migratedEmpleados = empleados.map((e: any) => {
      let changed = false;
      const legacyEmp = e as any;
      if (legacyEmp.salario !== undefined && e.salarioBase === undefined) {
        e.salarioBase = legacyEmp.salario;
        changed = true;
      }
      if (e.salarioBase === undefined) { e.salarioBase = 1300000; changed = true; }
      if (e.prestamosActivos === undefined) { e.prestamosActivos = 0; changed = true; }
      if (e.auxilioTransporte === undefined) { e.auxilioTransporte = 162000; changed = true; }
      if (e.telefono === undefined) { e.telefono = ''; changed = true; }
      if (e.email === undefined) { e.email = ''; changed = true; }
      if (e.rolAcceso === undefined) { e.rolAcceso = (legacyEmp.rolERP || 'VENDEDOR') as any; changed = true; }
      if (e.tipoContrato === undefined) { e.tipoContrato = 'INDEFINIDO'; changed = true; }
      if (e.riesgoARL === undefined) { e.riesgoARL = 'I'; changed = true; }
      if (e.aplicaExoneracion === undefined) { e.aplicaExoneracion = true; changed = true; }

      if (changed) migrated = true;
      return e;
    });

    if (migrated) {
      console.log('Migración de datos ejecutada.');
      setClientes(migratedClientes);
      setProveedores(migratedProveedores);
      setProductsCatalog(migratedProducts);
      setEmpleados(migratedEmpleados);
    }
  }, [clientes, proveedores, productsCatalog, empleados]); // Re-run when store data loads async
  // ──────────────────────────────────────────────────────────────────────────────

  // Synchronize stock based on current products catalog and active bodegas
  useEffect(() => {
    setStock((prev: Record<string, Record<string, number>>) => {
      const newStock = { ...prev };
      const activeBodegas = bodegas.filter(b => b.activa).map(b => b.nombre);
      
      activeBodegas.forEach((bodega: string) => {
        if (!newStock[bodega]) {
          newStock[bodega] = {};
        }
        
        products.forEach((p: any) => {
          if (newStock[bodega][p.sku] === undefined) {
            let qty = 0;
            if (bodega === 'Bodega Principal') {
              if (p.sku === 'PES-ENT-001') qty = 500;
              else if (p.sku === 'FIL-LIM-002') qty = 120;
              else if (p.sku === 'CAM-TIG-003') qty = 85;
            } else if (bodega === 'Bodega de Tránsito' || bodega === 'Bodega Secundaria') {
              if (p.sku === 'PES-ENT-001') qty = 200;
              else if (p.sku === 'FIL-LIM-002') qty = 45;
            } else if (bodega === 'Bodega Averías') {
              if (p.sku === 'FIL-LIM-002') qty = 12;
            }
            newStock[bodega][p.sku] = qty;
          }
        });

        // Filtrar productos obsoletos (que ya no están en el catálogo)
        const productSkus = new Set(products.map((p: any) => p.sku));
        for (const sku in newStock[bodega]) {
          if (!productSkus.has(sku)) {
            delete newStock[bodega][sku];
          }
        }
      });

      return newStock;
    });
  }, [products, bodegas]);

  /**
   * Registra el último precio acordado por cliente y SKU.
   * CLAVE: usa `identificacion` (NIT/CC) — campo inmutable — no el nombre del cliente.
   * Antes usaba el nombre, lo que provocaba pérdida del historial al editar el nombre.
   */
  const updateLastClientPrice = (identificacion: string, sku: string, price: number) => {
    useClientStore.getState().updateLastClientPrice(identificacion, sku, price);
  };


  // Publish dynamic event
  const publishEvent = (
    tipo: 'SALE_COMPLETED' | 'PRICE_CHANGED' | 'MERMA_ALERT' | 'QUOTE_STATUS_CHANGED' | 'METADATA_CONFIGURED',
    actor: string,
    descripcion: string,
    metadata?: any,
    enqueueSync = true
  ) => {
    log.info('publishEvent', {
      tipo,
      actor,
      descripcion: descripcion?.substring(0, 120),
      metadata,
    });
    useEventStore.getState().publishEvent(tipo, actor, descripcion, metadata, enqueueSync);
    log.debug('DomainEvent creado', { tipo, actor });
  };

  // Background processor for simulated resilient outbox integration queue (metasfresh style)
  useEffect(() => {
    const pendingJobs = syncQueue.filter(j => j.estado === 'PENDIENTE');
    if (pendingJobs.length === 0) return;

    // FIFO processing
    const jobToProcess = pendingJobs[pendingJobs.length - 1];

    const timer = setTimeout(() => {
      const isSuccess = Math.random() < 0.8; // 80% success rate
      
      setSyncQueue((prev: SyncJob[]) =>
        prev.map((j: SyncJob) => {
          if (j.id === jobToProcess.id) {
            return {
              ...j,
              intentos: j.intentos + 1,
              estado: isSuccess ? 'SINCRONIZADO' : 'FALLO'
            };
          }
          return j;
        })
      );

      if (!isSuccess) {
        publishEvent(
          'METADATA_CONFIGURED',
          'System Worker',
          `Fallo de red al sincronizar job ${jobToProcess.id} para Siigo (Intento ${jobToProcess.intentos + 1})`,
          null,
          false
        );
      } else {
        publishEvent(
          'METADATA_CONFIGURED',
          'System Worker',
          `Sincronización exitosa de ${jobToProcess.eventTipo} en Siigo`,
          null,
          false
        );
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [syncQueue]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', userRole);
  }, [userRole]);

  useEffect(() => {
    log.info('navegacion', { vista: currentView });
  }, [currentView]);

  // ─ REGLAS DE NEGOCIO INTEGRACIÓN: Worker de Canales Digitales y Gestión de Cancelaciones ──────────────────────────────
  // Worker para Procesamiento Asíncrono de Canales Digitales (RN-03, RN-01, RN-02, RN-05, RN-07)
  useEffect(() => {
    const pendingOrder = logIntegracion.find(l => l.estado === 'PENDIENTE');
    if (!pendingOrder) return;

    const timer = setTimeout(() => {
      let orderData: any;
      try {
        orderData = JSON.parse(pendingOrder.payload_json);
      } catch (e) {
        setLogIntegracion((prev: LogIntegracion[]) =>
          prev.map((l: LogIntegracion) => l.id === pendingOrder.id ? { ...l, estado: 'ERROR', mensaje_error: 'Payload JSON inválido' } : l)
        );
        return;
      }

      // 1. Verificar firma/autenticación (RN-01)
      if (!orderData.signature || orderData.signature !== 'VALID_CRYPTO_SIGNATURE') {
        setLogIntegracion((prev: LogIntegracion[]) =>
          prev.map((l: LogIntegracion) => l.id === pendingOrder.id ? { ...l, estado: 'ERROR', mensaje_error: 'Error de Autenticación: Firma criptográfica inválida o ausente' } : l)
        );
        publishEvent('METADATA_CONFIGURED', 'System Integrator', `Rechazado pedido digital ${pendingOrder.id_pedido_externo} - Firma inválida`, null, false);
        return;
      }

      // 2. Verificar Idempotencia (RN-02)
      const isDuplicate = ventas.some((v: any) => v.metadata?.id_pedido_externo === pendingOrder.id_pedido_externo);
      if (isDuplicate) {
        setLogIntegracion((prev: LogIntegracion[]) =>
          prev.map((l: LogIntegracion) => l.id === pendingOrder.id ? { ...l, estado: 'ERROR', mensaje_error: 'Idempotencia: Pedido ya procesado' } : l)
        );
        publishEvent('METADATA_CONFIGURED', 'System Integrator', `Rechazado pedido duplicado ${pendingOrder.id_pedido_externo} por idempotencia`, null, false);
        return;
      }

      // 3. Validación de Stock Restrictiva (RN-07)
      let stockSuficiente = true;
      const stockPrincipal = stock['Bodega Principal'] || {};
      const itemsFaltantes: string[] = [];

      orderData.items.forEach((item: any) => {
        const currentStock = stockPrincipal[item.sku] || 0;
        if (currentStock < item.cantidad) {
          stockSuficiente = false;
          itemsFaltantes.push(`${item.nombre} (Solicitado: ${item.cantidad}, Disponible: ${currentStock})`);
        }
      });

      if (!stockSuficiente) {
        setLogIntegracion((prev: LogIntegracion[]) =>
          prev.map((l: LogIntegracion) => l.id === pendingOrder.id ? { ...l, estado: 'REVISION_MANUAL', mensaje_error: `Stock insuficiente: ${itemsFaltantes.join(', ')}` } : l)
        );
        publishEvent('METADATA_CONFIGURED', 'System Integrator', `Pedido ${pendingOrder.id_pedido_externo} retenido en REVISIÓN MANUAL por falta de stock`, null, false);
        return;
      }

      // 4. Crear venta (RN-05 - Asignación dinámica de método de pago)
      const canalKey = pendingOrder.canal.toLowerCase();
      const paymentMethodCode = parametros.metodosPagoExternos[canalKey] || 'DIG-001';
      const vtaId = generateId('vta');

      // Restar stock
      setStock((prev: Record<string, Record<string, number>>) => {
        const newStock = { ...prev };
        if (newStock['Bodega Principal']) {
          newStock['Bodega Principal'] = { ...newStock['Bodega Principal'] };
          orderData.items.forEach((orderItem: any) => {
             const sku = orderItem.sku;
             const currentStock = newStock['Bodega Principal'][sku] || 0;
             newStock['Bodega Principal'][sku] = Math.max(0, currentStock - orderItem.cantidad);
          });
        }
        return newStock;
      });

      const newVenta: Venta = {
        id: vtaId,
        clienteId: orderData.clienteId || null,
        clienteNombre: orderData.clienteNombre || 'Consumidor Digital',
        fecha: new Date().toISOString(),
        items: orderData.items.map((item: any) => ({
          sku: item.sku,
          nombre: item.nombre,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          descuento: 0
        })),
        subtotal: orderData.subtotal,
        total: orderData.total,
        metodoPago: 'MIXTO', // Indicador para facturación mixta/digital
        actor: 'Integracion Digital',
        metadata: {
          id_pedido_externo: pendingOrder.id_pedido_externo,
          canal: pendingOrder.canal,
          metodo_pago_codigo: paymentMethodCode
        }
      };

      setVentas((prev: any[]) => [newVenta, ...prev]);

      // Registrar movimiento de inventario
      const newMovements: MovimientoInventario[] = orderData.items.map((item: any) => {
        const lote = 'CANAL-DIGITAL';
        return {
          id: generateId('mov'),
          timestamp: new Date().toISOString(),
          tipo: 'VENTA',
          sku: item.sku,
          nombreProducto: item.nombre,
          bodegaOrigen: 'Bodega Principal',
          cantidad: item.cantidad,
          lote: lote,
          referenciaId: vtaId,
          referenciaTipo: 'VENTA',
          actor: 'Integracion Digital',
          notas: `Integración Digital (${pendingOrder.canal}) - Pedido ${pendingOrder.id_pedido_externo}`
        };
      });
      newMovements.forEach((mov: MovimientoInventario) => addMovimiento(mov));

      setLogIntegracion((prev: LogIntegracion[]) =>
        prev.map((l: LogIntegracion) => l.id === pendingOrder.id ? { ...l, estado: 'PROCESADO', id_factura_pos: vtaId } : l)
      );

      publishEvent(
        'SALE_COMPLETED',
        'Integracion Digital',
        `Pedido digital ${pendingOrder.id_pedido_externo} de ${pendingOrder.canal} facturado automáticamente por $${orderData.total.toLocaleString('es-CO')}`,
        { id_pedido_externo: pendingOrder.id_pedido_externo, total: orderData.total }
      );

    }, 2000);

    return () => clearTimeout(timer);
  }, [logIntegracion, stock, ventas, parametros]);

  // Handler para cancelaciones automáticas (RN-04)
  const handleCancelarPedidoDigital = (logId: string) => {
    log.info('cancelarPedidoDigital', { logId });
    const integLog = logIntegracion.find(l => l.id === logId);
    if (!integLog) return;

    let orderData: any;
    try {
      orderData = JSON.parse(integLog.payload_json);
    } catch (e) {
      return;
    }

    if (integLog.estado === 'PROCESADO' && integLog.id_factura_pos) {
      // Reversar stock a Bodega Principal
      setStock((prev: Record<string, Record<string, number>>) => {
        const newStock = { ...prev };
        if (newStock['Bodega Principal']) {
          newStock['Bodega Principal'] = { ...newStock['Bodega Principal'] };
          orderData.items.forEach((orderItem: any) => {
            const sku = orderItem.sku;
            const currentStock = newStock['Bodega Principal'][sku] || 0;
            newStock['Bodega Principal'][sku] = currentStock + orderItem.cantidad;
          });
        }
        return newStock;
      });

      // Registrar movimiento de inventario de entrada
      const newMovements: MovimientoInventario[] = orderData.items.map((item: any) => {
        return {
          id: generateId('mov'),
          timestamp: new Date().toISOString(),
          tipo: 'ENTRADA_COMPRA' as any,
          sku: item.sku,
          nombreProducto: item.nombre,
          bodegaDestino: 'Bodega Principal',
          cantidad: item.cantidad,
          lote: 'RETORNO',
          referenciaId: integLog.id_factura_pos,
          referenciaTipo: 'DEVOLUCION',
          actor: 'Integracion Digital',
          notas: `Reversión por Cancelación Pedido ${integLog.id_pedido_externo}`
        };
      });
      newMovements.forEach((mov: MovimientoInventario) => addMovimiento(mov));

      // Generar Devolución (Nota de Crédito)
      const newDevolucion: DevolucionPedido = {
        id: generateId('dev'),
        pedidoId: integLog.id_factura_pos,
        pedidoNo: integLog.id_pedido_externo,
        clienteId: orderData.clienteId || 'c-anon',
        clienteNombre: orderData.clienteNombre || 'Consumidor Digital',
        conductorId: 'cond-none',
        conductorNombre: 'No Aplica',
        estado: 'VALIDADA_FINANZAS',
        fechaProgramacion: new Date().toISOString(),
        fechaValidacion: new Date().toISOString(),
        items: orderData.items.map((item: any) => ({
          sku: item.sku,
          nombre: item.nombre,
          cantidadSolicitada: item.cantidad,
          cantidadRecibida: item.cantidad,
          precioUnitarioVenta: item.precioUnitario,
          estadoCalidad: 'APROBADO_REINGRESO',
          estadoFisico: 'APTO_INVENTARIO',
          loteInventario: 'RETORNO'
        }))
      };
      setDevoluciones((prev: DevolucionPedido[]) => [newDevolucion, ...prev]);

      publishEvent(
        'METADATA_CONFIGURED',
        'Integracion Digital',
        `Nota de Crédito emitida y stock devuelto por cancelación del pedido ${integLog.id_pedido_externo}`,
        { logId, pedidoNo: integLog.id_pedido_externo }
      );
    }

    setLogIntegracion((prev: LogIntegracion[]) =>
      prev.map((l: LogIntegracion) => l.id === logId ? { ...l, estado: 'ERROR', mensaje_error: 'Pedido Cancelado por el canal' } : l)
    );
  };

  // Handler para liberar pedidos retenidos por falta de stock (Aprobación manual RN-07)
  const handleAprobarPedidoManual = (logId: string, modo: 'parcial' | 'forzar') => {
    log.info('aprobarPedidoManual', { logId, modo });
    const integLog = logIntegracion.find(l => l.id === logId);
    if (!integLog) return;

    let orderData: any;
    try {
      orderData = JSON.parse(integLog.payload_json);
    } catch (e) {
      return;
    }

    const stockPrincipal = stock['Bodega Principal'] || {};
    const updatedItems = orderData.items.map((item: any) => {
      const currentStock = stockPrincipal[item.sku] || 0;
      if (modo === 'parcial' && currentStock < item.cantidad) {
        return { ...item, cantidad: currentStock }; // ajustar a lo que hay
      }
      return item;
    }).filter((item: any) => item.cantidad > 0);

    if (updatedItems.length === 0) {
      setLogIntegracion((prev: LogIntegracion[]) =>
        prev.map((l: LogIntegracion) => l.id === logId ? { ...l, estado: 'ERROR', mensaje_error: 'Aprobación parcial resultó en 0 items' } : l)
      );
      return;
    }

    const totalCalculado = updatedItems.reduce((sum: number, i: any) => sum + (i.cantidad * i.precioUnitario), 0);
    const subtotalCalculado = totalCalculado;

    // Actualizar JSON y cambiar estado a PENDIENTE para que el worker lo procese con los nuevos datos
    const updatedPayload = {
      ...orderData,
      items: updatedItems,
      total: totalCalculado,
      subtotal: subtotalCalculado,
      signature: 'VALID_CRYPTO_SIGNATURE'
    };

    setLogIntegracion((prev: LogIntegracion[]) =>
      prev.map((l: LogIntegracion) => l.id === logId ? {
        ...l,
        estado: 'PENDIENTE',
        payload_json: JSON.stringify(updatedPayload),
        mensaje_error: modo === 'forzar' ? 'Venta forzada sin stock suficiente' : 'Aprobado con stock parcial'
      } : l)
    );
    
    if (modo === 'forzar') {
      setStock((prev: Record<string, Record<string, number>>) => {
        const newStock = { ...prev };
        if (newStock['Bodega Principal']) {
          newStock['Bodega Principal'] = { ...newStock['Bodega Principal'] };
          updatedItems.forEach((orderItem: any) => {
            const sku = orderItem.sku;
            const currentStock = newStock['Bodega Principal'][sku] || 0;
            newStock['Bodega Principal'][sku] = currentStock + orderItem.cantidad;
          });
        }
        return newStock;
      });
    }
  };

  const setProductsShim = () => console.warn('setProducts is deprecated in F3. Use setProductsCatalog and setProductPricings instead.');

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'pos':
        return (
          <POSView
            handleCancelarPedidoDigital={handleCancelarPedidoDigital}
            handleAprobarPedidoManual={handleAprobarPedidoManual}
          />
        );
      case 'inventario':
        return <InventoryView />;
      case 'alistamiento':
        return <AlistamientoBodegaView />;
      case 'despachos':
        return <DispatchView />;
      case 'precios':
        return <PricingView />;
      case 'rrhh':
        return <HRView />;
      case 'nomina':
        return <PayrollView />;
      case 'cartera':
        return <ARView />;
      case 'clientes':
        return <ClientsView />;
      case 'compras':
        return <SuppliersView />;
      case 'kanban':
        return (
          <OrderKanbanView
            onEditOrder={(quote) => {
              setCurrentView('pos');
              setTimeout(() => {
                const btn = document.getElementById(`quote-btn-${quote.id}`);
                if (btn) btn.click();
              }, 500);
            }}
          />
        );
      case 'crm':
        return <CRMView />;
      case 'caja':
        return <CashFlowView />;
      case 'contabilidad':
        return <AccountingView />;
      default:
        return <DashboardView />;
    }
  };

  const getBreadcrumbs = () => {
    switch (currentView) {
      case 'dashboard':
        return { cat: 'Administrativo', sub: 'Panel de Control' };
      case 'pos':
        return { cat: 'Comercial', sub: 'Punto de Venta (POS)' };
      case 'inventario':
        return { cat: 'Inventario y Planta', sub: 'Bodegas y Producción' };
      case 'alistamiento':
        return { cat: 'Inventario y Planta', sub: 'Alistamiento de Bodega' };
      case 'despachos':
        return { cat: 'Logística', sub: 'Despachos y Rutas' };
      case 'precios':
        return { cat: 'Comercial', sub: 'Precios y Cotizaciones' };
      case 'rrhh':
        return { cat: 'Administrativo', sub: 'Recursos Humanos' };
      case 'cartera':
        return { cat: 'Comercial', sub: 'Cartera de Clientes' };
      case 'clientes':
        return { cat: 'Comercial', sub: 'Directorio de Clientes' };
      case 'compras':
        return { cat: 'Administrativo', sub: 'Compras y Gastos' };
      case 'kanban':
        return { cat: 'Logística', sub: 'Despachos / Kanban' };
      case 'crm':
        return { cat: 'Comercial', sub: 'CRM (Twenty)' };
      case 'caja':
        return { cat: 'Comercial', sub: 'Gestión de Cajas' };
      case 'contabilidad':
        return { cat: 'Administrativo', sub: 'Libro Mayor' };
      default:
        return { cat: 'General', sub: 'ERP' };
    }
  };

  return (
    <div className="spa-container">
      {/* Top Navbar */}
      <header className="top-navbar">
        <div className="navbar-left">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ color: 'white', marginRight: '10px' }}>
            <Menu size={22} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>🐟 La Pezcadería</span>
            <button className="navbar-icon-btn" onClick={() => setCurrentView('pos')}>
              <PlusCircle size={18} />
            </button>
          </div>
          
          <div className="breadcrumbs" style={{ marginLeft: '24px' }}>
            <span>{getBreadcrumbs().cat}</span>
            <span>&gt;</span>
            <span className="breadcrumbs-current">{getBreadcrumbs().sub}</span>
          </div>
        </div>

        <div className="navbar-right">
          <span className="navbar-company">PEZCADERIA S.A.S</span>
          <button className="navbar-icon-btn" title="Ayuda">
            <HelpCircle size={18} />
          </button>
          <button className="navbar-icon-btn" title="Inicio" onClick={() => setCurrentView('dashboard')}>
            <Home size={18} />
          </button>
          <button className="navbar-cart-btn" onClick={() => setCurrentView('pos')}>
            <ShoppingCart size={16} />
            <span>Facturar</span>
          </button>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold', fontSize: '14px', border: '1px solid rgba(255,255,255,0.4)'
          }}>
            Yu
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="spa-body">
        {/* Overlay for mobile sidebar */}
        <div 
          className={`mobile-overlay ${sidebarOpen ? 'open' : ''}`} 
          onClick={() => setSidebarOpen(false)}
        ></div>

        {/* Sidebar Navigation */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          {/* User Profile Card */}
          <div className="sidebar-profile-card">
            <div className="orange-avatar">Yu</div>
            <div className="sidebar-profile-info">
              <span className="sidebar-profile-name">Yurgen Moreno</span>
              <select 
                className="sidebar-profile-role-select" 
                value={userRole} 
                onChange={(e) => setUserRole(e.target.value as any)}
              >
                <option value="admin">Super administrador</option>
                <option value="vendedor">Vendedor</option>
                <option value="bodega">Jefe de bodega</option>
                <option value="administrativo">Administrativo</option>
              </select>
            </div>
          </div>

          {/* Quick billing button */}
          <button className="sidebar-btn-facturar" onClick={() => setCurrentView('pos')}>
            <FileText size={18} />
            <span>Facturar</span>
          </button>

          {/* Categories and links */}
          <nav className="sidebar-menu">
            <div
              className={`sidebar-item ${currentView === 'pos' ? 'active' : ''}`}
              onClick={() => { setCurrentView('pos'); setSidebarOpen(false); }}
              data-testid="nav-pos"
            >
              <ShoppingBag size={16} />
              <span>POS</span>
            </div>

            <div
              className={`sidebar-item ${currentView === 'precios' ? 'active' : ''}`}
              onClick={() => { setCurrentView('precios'); setSidebarOpen(false); }}
              data-testid="nav-precios"
            >
              <DollarSign size={16} />
              <span>Cotizacion</span>
            </div>

            <div
              className={`sidebar-item ${currentView === 'clientes' ? 'active' : ''}`}
              onClick={() => { setCurrentView('clientes'); setSidebarOpen(false); }}
              data-testid="nav-clientes"
            >
              <Users size={16} />
              <span>Clientes</span>
            </div>

            <div
              className={`sidebar-item ${currentView === 'crm' ? 'active' : ''}`}
              onClick={() => { setCurrentView('crm'); setSidebarOpen(false); }}
              data-testid="nav-crm"
            >
              <PieChart size={16} />
              <span>CRM (Twenty)</span>
            </div>

            <div className={`sidebar-item`} style={{ opacity: 0.5 }}>
              <FileText size={16} />
              <span>Documentos</span>
            </div>

            <div
              className={`sidebar-item ${currentView === 'compras' ? 'active' : ''}`}
              onClick={() => { setCurrentView('compras'); setSidebarOpen(false); }}
              data-testid="nav-compras"
            >
              <ShoppingCart size={16} />
              <span>Compras y Gastos</span>
            </div>

            <div
              className={`sidebar-item ${currentView === 'cartera' ? 'active' : ''}`}
              onClick={() => { setCurrentView('cartera'); setSidebarOpen(false); }}
              data-testid="nav-cartera"
            >
              <Wallet size={16} />
              <span>Cartera</span>
            </div>

            <div
              className={`sidebar-item ${currentView === 'inventario' ? 'active' : ''}`}
              onClick={() => { setCurrentView('inventario'); setSidebarOpen(false); }}
              data-testid="nav-inventario"
            >
              <Box size={16} />
              <span>Inventario</span>
            </div>

            <div
              className={`sidebar-item ${currentView === 'alistamiento' ? 'active' : ''}`}
              onClick={() => { setCurrentView('alistamiento'); setSidebarOpen(false); }}
              data-testid="nav-alistamiento"
            >
              <PackageCheck size={16} />
              <span>Alistamiento Bodega</span>
            </div>

            <div
              className={`sidebar-item ${currentView === 'despachos' ? 'active' : ''}`}
              onClick={() => { setCurrentView('despachos'); setSidebarOpen(false); }}
              data-testid="nav-despachos"
            >
              <Truck size={16} />
              <span>Despachos y Rutas</span>
            </div>

            <div className={`sidebar-item`} style={{ opacity: 0.5 }}>
              <Truck size={16} />
              <span>Traslados</span>
            </div>

            <div className={`sidebar-item`} style={{ opacity: 0.5 }}>
              <RefreshCw size={16} />
              <span>Ajuste</span>
            </div>

            <div
              className={`sidebar-item ${currentView === 'caja' ? 'active' : ''}`}
              onClick={() => { setCurrentView('caja'); setSidebarOpen(false); }}
              data-testid="nav-caja"
            >
              <Database size={16} />
              <span>Caja</span>
            </div>

            <div
              className={`sidebar-item ${currentView === 'contabilidad' ? 'active' : ''}`}
              onClick={() => { setCurrentView('contabilidad'); setSidebarOpen(false); }}
              data-testid="nav-contabilidad"
            >
              <BookOpen size={16} />
              <span>Contabilidad</span>
            </div>

            <div className={`sidebar-item`} style={{ opacity: 0.5 }}>
              <FileText size={16} />
              <span>Cuentas</span>
            </div>

            <div
              className={`sidebar-item ${currentView === 'rrhh' ? 'active' : ''}`}
              onClick={() => { setCurrentView('rrhh'); setSidebarOpen(false); }}
              data-testid="nav-rrhh"
            >
              <Users size={16} />
              <span>Personal (RRHH)</span>
            </div>

            <div
              className={`sidebar-item ${currentView === 'nomina' ? 'active' : ''}`}
              onClick={() => { setCurrentView('nomina'); setSidebarOpen(false); }}
              data-testid="nav-nomina"
            >
              <FileText size={16} />
              <span>Nómina</span>
            </div>

            <div
              className={`sidebar-item ${currentView === 'kanban' ? 'active' : ''}`}
              onClick={() => { setCurrentView('kanban'); setSidebarOpen(false); }}
              data-testid="nav-kanban"
            >
              <Truck size={16} />
              <span>Despachos / Kanban</span>
            </div>

            <div className={`sidebar-item`} style={{ opacity: 0.5 }}>
              <RefreshCw size={16} />
              <span>Produccion</span>
            </div>
            
            <div
              className={`sidebar-item ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => { setCurrentView('dashboard'); setSidebarOpen(false); }}
              style={{ marginTop: 'auto' }}
              data-testid="nav-dashboard"
            >
              <LayoutDashboard size={16} />
              <span>Panel de Control</span>
            </div>
          </nav>

          {/* Log out */}
          <button className="sidebar-btn-exit" onClick={() => alert('Cerrando sesión...')}>
            <LogOut size={16} />
            <span>Salir</span>
          </button>
        </aside>

        {/* View Content */}
        <div className="main-content">
          <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {renderView()}
          </main>
        </div>
      </div>
      {import.meta.env.DEV && <DevTestDashboard />}
    </div>
  );
}
