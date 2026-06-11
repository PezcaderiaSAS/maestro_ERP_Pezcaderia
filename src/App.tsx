import { useState, useEffect } from 'react';
import { Menu, LayoutDashboard, ShoppingBag, Box, Users, DollarSign, HelpCircle, Home, ShoppingCart, LogOut, FileText, PlusCircle, Wallet, Database, Truck, RefreshCw } from 'lucide-react';
import DashboardView from './views/DashboardView.tsx';
import POSView from './views/POSView.tsx';
import InventoryView from './views/InventoryView.tsx';
import HRView from './views/HRView.tsx';
import PricingView from './views/PricingView.tsx';
import ARView, { InvoiceAR } from './views/ARView.tsx';
import ClientsView from './views/ClientsView.tsx';
import SuppliersView from './views/SuppliersView.tsx';
import OrderKanbanView from './views/OrderKanbanView.tsx';
import * as localDb from './services/localDb.ts';

/** Genera IDs únicos usando crypto.randomUUID() — resistente a colisiones en operaciones rápidas */
export const generateId = (prefix: string): string =>
  `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

export interface Cliente {
  id: string;
  nombre: string;
  identificacion: string;
  tipoIdentificacion: 'NIT' | 'CC' | 'CE';
  tipoPersona: 'NATURAL' | 'JURIDICA';
  direccion: string;
  telefono: string;
  email: string;
  ciudad: string;
  tipoPrecio: 'POS' | 'RESTAURANTE' | 'MAYORISTA';
  encargadoCompras?: string;
  cupoCredito: number; // Para validación en ventas a crédito
  activo: boolean;
}

export interface Proveedor {
  id: string;
  nombre: string;
  nit: string;
  tipoIdentificacion: 'NIT' | 'CC';
  direccion: string;
  telefono: string;
  email: string;
  ciudad: string;
  contactoCompras?: string;
  plazoPagoDias: number;
  activo: boolean;
}

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

export interface Conductor {
  id: string;
  nombre: string;
  identificacion: string;
  licencia: string;
  celular: string;
  activo: boolean;
}

export interface DevolucionPedido {
  id: string;
  pedidoId: string;
  pedidoNo: string;
  clienteId: string;
  clienteNombre: string;
  conductorId: string;
  conductorNombre: string;
  estado: 'PROGRAMADA' | 'RECIBIDA_BODEGA' | 'VALIDADA_FINANZAS' | 'ANULADA';
  fechaProgramacion: string;
  fechaRecibido?: string;
  recibidoPor?: string;
  fechaValidacion?: string;
  items: Array<{
    sku: string;
    nombre: string;
    cantidadSolicitada: number;
    cantidadRecibida?: number;
    precioUnitarioVenta: number;
    estadoCalidad?: 'APROBADO_REINGRESO' | 'DESCARTE_MERMA';
    estadoFisico?: 'APTO_INVENTARIO' | 'AVERIA_DESCARTE' | 'RECHAZADO';
    loteInventario?: string;
  }>;
}

const INITIAL_CONDUCTORES: Conductor[] = [
  { id: 'cond-1', nombre: 'José Daniel Ortiz', identificacion: '10203040', licencia: 'C2-10203040', celular: '3129998877', activo: true },
  { id: 'cond-2', nombre: 'Carlos Mario Giraldo', identificacion: '80907060', licencia: 'C2-80907060', celular: '3157776655', activo: true }
];

export interface CategoriaConfig {
  id: string;
  tipo: string;
  linea: string;
  clase: string;
}

export interface ProductCatalog {
  id: string;
  sku: string;
  nombre: string;
  categoria: string;
  unidadMedida?: 'kg' | 'und' | 'lb' | 'gr';
  imagen?: string;
  codigo_barras?: string;
  iva?: number;
  ivaIncluido?: boolean;
  control_inventario?: boolean;
  produccion?: boolean;
  activo: boolean;
  metadata?: Record<string, string>;
}

export interface ProductPricing {
  id: string;
  productoId: string;
  vigenciaDesde: string;
  precio_compra: number;
  buffer_seguridad: number;
  precio_venta_pos: number;
  precio_venta_restaurante: number;
  precio_venta_mayorista: number;
  actualizadoPor: string;
}

export interface Product extends ProductCatalog {
  precio_compra: number;
  buffer_seguridad: number;
  precio_venta_pos: number;
  precio_venta_restaurante: number;
  precio_venta_mayorista: number;
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
  // Role persistent loading
  const initialRole = localDb.load('role', 'admin');
  const [userRole, setUserRole] = useState<'admin' | 'vendedor' | 'bodega' | 'administrativo'>(initialRole);

  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // States F3: Catalog and Pricing
  const [productsCatalog, setProductsCatalog] = useState<ProductCatalog[]>(() => {
    const savedCat = localDb.load('productsCatalog', null as ProductCatalog[] | null);
    if (savedCat) return savedCat;
    
    // Migración o inicialización
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
    
    const { catalog, pricings } = migrateProductsToCatalogAndPricing(sourceProducts, initialRole);
    localDb.save('productPricings', pricings);
    localDb.removeRaw('pezcaderia_products'); // Limpiar viejo estado
    return catalog;
  });

  const [productPricings, setProductPricings] = useState<ProductPricing[]>(() => {
    return localDb.load('productPricings', []);
  });

  useEffect(() => {
    localDb.save('productsCatalog', productsCatalog);
  }, [productsCatalog]);

  useEffect(() => {
    localDb.save('productPricings', productPricings);
  }, [productPricings]);

  // DERIVACIÓN DINÁMICA de products para retrocompatibilidad
  const products: Product[] = productsCatalog.map(cat => {
    const pricings = productPricings.filter(pr => pr.productoId === cat.id);
    let currentPricing = pricings[0];
    if (pricings.length > 1) {
      currentPricing = pricings.reduce((latest, current) => 
        new Date(current.vigenciaDesde) > new Date(latest.vigenciaDesde) ? current : latest
      );
    }
    const fallbackPricing = { precio_compra: 0, buffer_seguridad: 0, precio_venta_pos: 0, precio_venta_restaurante: 0, precio_venta_mayorista: 0 };
    return { ...cat, ...(currentPricing || fallbackPricing) } as Product;
  });

  useEffect(() => {
    if (initialRole) {
      setUserRole(initialRole);
    }
  }, [initialRole]);

  const handleSetUserRole = (role: 'admin' | 'vendedor' | 'bodega' | 'administrativo') => {
    setUserRole(role);
    localDb.save('role', role);
  };

  // Other dynamic states
  const [events, setEvents] = useState<DomainEvent[]>(() => localDb.load('events', []));
  const [syncQueue, setSyncQueue] = useState<SyncJob[]>(() => localDb.load('syncQueue', []));
  
  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>(() => localDb.load('dynamicFields', [
    {
      key: 'categoria_descriptiva',
      label: 'Categoría Descriptiva (Grupo)',
      tipo: 'text',
      defaultValue: 'General'
    }
  ]));

  const [quotations, setQuotations] = useState<any[]>(() => localDb.load('quotations', []));
  const [stock, setStock] = useState<Record<string, any[]>>(() => localDb.load('stock', {}));
  const [lastClientPrices, setLastClientPrices] = useState<Record<string, Record<string, number>>>(() => localDb.load('lastClientPrices', {}));

  const [categorias, setCategorias] = useState<CategoriaConfig[]>(() => localDb.load('categorias', [
    { id: generateId('cat'), tipo: 'Producto', linea: 'Pescados', clase: 'Filetes' },
    { id: generateId('cat'), tipo: 'Producto', linea: 'Mariscos', clase: 'Camarones' },
    { id: generateId('cat'), tipo: 'Materia Prima', linea: 'Pescados Enteros', clase: 'Corvina' }
  ]));

  useEffect(() => {
    localDb.save('categorias', categorias);
  }, [categorias]);

  const [cartera, setCartera] = useState<InvoiceAR[]>(() => {
    const saved = localDb.load('cartera', null as InvoiceAR[] | null);
    if (saved) return saved;
    return [
      {
        id: 'PED-045091',
        clienteId: 'c-1',
        clienteNombre: 'Restaurante Central',
        clienteIdentificacion: '123',
        fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        total: 350000,
        saldo: 200000,
        pagado: 150000,
        pagos: [
          {
            id: 'pgo-1',
            fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            monto: 150000,
            metodo: 'Transferencia'
          }
        ]
      },
      {
        id: 'PED-098231',
        clienteId: 'c-2',
        clienteNombre: 'Restaurante del Mar',
        clienteIdentificacion: '900123456-1',
        fecha: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        total: 500000,
        saldo: 500000,
        pagado: 0,
        pagos: []
      }
    ];
  });

  const [clientes, setClientes] = useState<Cliente[]>(() => localDb.load('clientes', INITIAL_CLIENTS));
  const [proveedores, setProveedores] = useState<Proveedor[]>(() => localDb.load('proveedores', INITIAL_PROVEEDORES));

  useEffect(() => { localDb.save('clientes', clientes); }, [clientes]);
  useEffect(() => { localDb.save('proveedores', proveedores); }, [proveedores]);
  useEffect(() => { localDb.save('events', events); }, [events]);
  useEffect(() => { localDb.save('syncQueue', syncQueue); }, [syncQueue]);
  useEffect(() => { localDb.save('dynamicFields', dynamicFields); }, [dynamicFields]);
  useEffect(() => { localDb.save('quotations', quotations); }, [quotations]);
  useEffect(() => { localDb.save('stock', stock); }, [stock]);
  useEffect(() => { localDb.save('lastClientPrices', lastClientPrices); }, [lastClientPrices]);
  useEffect(() => { localDb.save('cartera', cartera); }, [cartera]);

  // ─ F2: Estado de entidades transaccionales ───────────────────────────────────────────────
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>(() => localDb.load('movimientos', []));
  useEffect(() => { localDb.save('movimientos', movimientos); }, [movimientos]);

  const [ordenesCompra, setOrdenesCompra] = useState<OrdenCompra[]>(() => localDb.load('ordenesCompra', []));
  useEffect(() => { localDb.save('ordenesCompra', ordenesCompra); }, [ordenesCompra]);

  const [ventas, setVentas] = useState<Venta[]>(() => localDb.load('ventas', []));
  useEffect(() => { localDb.save('ventas', ventas); }, [ventas]);

  const [conductores, _setConductores] = useState<Conductor[]>(() => localDb.load('conductores', INITIAL_CONDUCTORES));
  useEffect(() => { localDb.save('conductores', conductores); }, [conductores]);

  const [devoluciones, setDevoluciones] = useState<DevolucionPedido[]>(() => localDb.load('devoluciones', []));
  useEffect(() => { localDb.save('devoluciones', devoluciones); }, [devoluciones]);

  const [logIntegracion, setLogIntegracion] = useState<LogIntegracion[]>(() => localDb.load('logIntegracion', []));
  useEffect(() => { localDb.save('logIntegracion', logIntegracion); }, [logIntegracion]);

  const [parametros, _setParametros] = useState<Record<string, any>>(() => localDb.load('parametros', {
    metodosPagoExternos: {
      rappi: 'RAP-001',
      shopify: 'SHO-001',
      b2b: 'B2B-001'
    },
    cajaAisladaMetodos: ['RAP-001', 'SHO-001', 'B2B-001']
  }));
  useEffect(() => { localDb.save('parametros', parametros); }, [parametros]);
  // ──────────────────────────────────────────────────────────────────────────────

  // Synchronize stock based on current products catalog
  useEffect(() => {
    setStock(prev => {
      const newStock = { ...prev };
      const bodegas = ['Bodega Principal', 'Bodega Secundaria', 'Bodega Averías'];
      
      bodegas.forEach(bodega => {
        if (!newStock[bodega]) {
          newStock[bodega] = [];
        }
        
        // Agregar productos faltantes
        const currentSkus = new Set(newStock[bodega].map((item: any) => item.sku));
        products.forEach(p => {
          if (!currentSkus.has(p.sku)) {
            let qty = 0;
            if (bodega === 'Bodega Principal') {
              if (p.sku === 'PES-ENT-001') qty = 500;
              else if (p.sku === 'FIL-LIM-002') qty = 120;
              else if (p.sku === 'CAM-TIG-003') qty = 85;
            } else if (bodega === 'Bodega Secundaria') {
              if (p.sku === 'PES-ENT-001') qty = 200;
              else if (p.sku === 'FIL-LIM-002') qty = 45;
            } else if (bodega === 'Bodega Averías') {
              if (p.sku === 'FIL-LIM-002') qty = 12;
            }
            
            newStock[bodega].push({
              sku: p.sku,
              nombre: p.nombre,
              stock: qty,
              lote: `LOT-2026-${p.sku.slice(0, 3)}-${bodega.slice(7, 10).toUpperCase()}`
            });
          }
        });

        // Actualizar nombres y filtrar productos obsoletos
        newStock[bodega] = newStock[bodega].map((item: any) => {
          const matched = products.find(p => p.sku === item.sku);
          if (matched) {
            return { ...item, nombre: matched.nombre };
          }
          return item;
        }).filter((item: any) => products.some(p => p.sku === item.sku));
      });

      return newStock;
    });
  }, [products]);

  /**
   * Registra el último precio acordado por cliente y SKU.
   * CLAVE: usa `identificacion` (NIT/CC) — campo inmutable — no el nombre del cliente.
   * Antes usaba el nombre, lo que provocaba pérdida del historial al editar el nombre.
   */
  const updateLastClientPrice = (identificacion: string, sku: string, price: number) => {
    setLastClientPrices(prev => {
      const key = identificacion.trim().toLowerCase();
      const updated = {
        ...prev,
        [key]: {
          ...(prev[key] || {}),
          [sku]: price
        }
      };
      return updated;
    });
  };


  // Publish dynamic event
  const publishEvent = (
    tipo: 'SALE_COMPLETED' | 'PRICE_CHANGED' | 'MERMA_ALERT' | 'QUOTE_STATUS_CHANGED' | 'METADATA_CONFIGURED',
    actor: string,
    descripcion: string,
    metadata?: any,
    enqueueSync = true
  ) => {
    const newEvent: DomainEvent = {
      id: 'evt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      tipo,
      actor,
      descripcion,
      metadata
    };
    setEvents(prev => [newEvent, ...prev]);

    if (enqueueSync) {
      const newSyncJob: SyncJob = {
        id: 'job-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        eventTipo: tipo,
        payload: { newEvent },
        estado: 'PENDIENTE',
        intentos: 0,
        timestamp: new Date().toISOString()
      };
      setSyncQueue(prev => [newSyncJob, ...prev]);
    }
  };

  // Background processor for simulated resilient outbox integration queue (metasfresh style)
  useEffect(() => {
    const pendingJobs = syncQueue.filter(j => j.estado === 'PENDIENTE');
    if (pendingJobs.length === 0) return;

    // FIFO processing
    const jobToProcess = pendingJobs[pendingJobs.length - 1];

    const timer = setTimeout(() => {
      const isSuccess = Math.random() < 0.8; // 80% success rate
      
      setSyncQueue(prev =>
        prev.map(j => {
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
        setLogIntegracion(prev =>
          prev.map(l => l.id === pendingOrder.id ? { ...l, estado: 'ERROR', mensaje_error: 'Payload JSON inválido' } : l)
        );
        return;
      }

      // 1. Verificar firma/autenticación (RN-01)
      if (!orderData.signature || orderData.signature !== 'VALID_CRYPTO_SIGNATURE') {
        setLogIntegracion(prev =>
          prev.map(l => l.id === pendingOrder.id ? { ...l, estado: 'ERROR', mensaje_error: 'Error de Autenticación: Firma criptográfica inválida o ausente' } : l)
        );
        publishEvent('METADATA_CONFIGURED', 'System Integrator', `Rechazado pedido digital ${pendingOrder.id_pedido_externo} - Firma inválida`, null, false);
        return;
      }

      // 2. Verificar Idempotencia (RN-02)
      const isDuplicate = ventas.some((v: any) => v.metadata?.id_pedido_externo === pendingOrder.id_pedido_externo);
      if (isDuplicate) {
        setLogIntegracion(prev =>
          prev.map(l => l.id === pendingOrder.id ? { ...l, estado: 'ERROR', mensaje_error: 'Idempotencia: Pedido ya procesado' } : l)
        );
        publishEvent('METADATA_CONFIGURED', 'System Integrator', `Rechazado pedido duplicado ${pendingOrder.id_pedido_externo} por idempotencia`, null, false);
        return;
      }

      // 3. Validación de Stock Restrictiva (RN-07)
      let stockSuficiente = true;
      const stockPrincipal = stock['Bodega Principal'] || [];
      const itemsFaltantes: string[] = [];

      orderData.items.forEach((item: any) => {
        const currentStock = stockPrincipal.find((s: any) => s.sku === item.sku)?.stock || 0;
        if (currentStock < item.cantidad) {
          stockSuficiente = false;
          itemsFaltantes.push(`${item.nombre} (Solicitado: ${item.cantidad}, Disponible: ${currentStock})`);
        }
      });

      if (!stockSuficiente) {
        setLogIntegracion(prev =>
          prev.map(l => l.id === pendingOrder.id ? { ...l, estado: 'REVISION_MANUAL', mensaje_error: `Stock insuficiente: ${itemsFaltantes.join(', ')}` } : l)
        );
        publishEvent('METADATA_CONFIGURED', 'System Integrator', `Pedido ${pendingOrder.id_pedido_externo} retenido en REVISIÓN MANUAL por falta de stock`, null, false);
        return;
      }

      // 4. Crear venta (RN-05 - Asignación dinámica de método de pago)
      const canalKey = pendingOrder.canal.toLowerCase();
      const paymentMethodCode = parametros.metodosPagoExternos[canalKey] || 'DIG-001';
      const vtaId = generateId('vta');

      // Restar stock
      setStock(prev => {
        const newStock = { ...prev };
        if (newStock['Bodega Principal']) {
          newStock['Bodega Principal'] = newStock['Bodega Principal'].map((stockItem: any) => {
            const orderItem = orderData.items.find((i: any) => i.sku === stockItem.sku);
            if (orderItem) {
              return { ...stockItem, stock: Math.max(0, stockItem.stock - orderItem.cantidad) };
            }
            return stockItem;
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

      setVentas(prev => [newVenta, ...prev]);

      // Registrar movimiento de inventario
      const newMovements: MovimientoInventario[] = orderData.items.map((item: any) => {
        const prodStock = stockPrincipal.find((s: any) => s.sku === item.sku);
        const lote = prodStock ? prodStock.lote : 'CANAL-DIGITAL';
        return {
          id: generateId('mov'),
          timestamp: new Date().toISOString(),
          tipo: 'SALIDA_VENTA' as any,
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
      setMovimientos(prev => [...newMovements, ...prev]);

      setLogIntegracion(prev =>
        prev.map(l => l.id === pendingOrder.id ? { ...l, estado: 'PROCESADO', id_factura_pos: vtaId } : l)
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
    const log = logIntegracion.find(l => l.id === logId);
    if (!log) return;

    let orderData: any;
    try {
      orderData = JSON.parse(log.payload_json);
    } catch (e) {
      return;
    }

    if (log.estado === 'PROCESADO' && log.id_factura_pos) {
      // Reversar stock a Bodega Principal
      setStock(prev => {
        const newStock = { ...prev };
        if (newStock['Bodega Principal']) {
          newStock['Bodega Principal'] = newStock['Bodega Principal'].map((stockItem: any) => {
            const orderItem = orderData.items.find((i: any) => i.sku === stockItem.sku);
            if (orderItem) {
              return { ...stockItem, stock: stockItem.stock + orderItem.cantidad };
            }
            return stockItem;
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
          referenciaId: log.id_factura_pos,
          referenciaTipo: 'DEVOLUCION',
          actor: 'Integracion Digital',
          notas: `Reversión por Cancelación Pedido ${log.id_pedido_externo}`
        };
      });
      setMovimientos(prev => [...newMovements, ...prev]);

      // Generar Devolución (Nota de Crédito)
      const newDevolucion: DevolucionPedido = {
        id: generateId('dev'),
        pedidoId: log.id_factura_pos,
        pedidoNo: log.id_pedido_externo,
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
      setDevoluciones(prev => [newDevolucion, ...prev]);

      publishEvent(
        'METADATA_CONFIGURED',
        'Integracion Digital',
        `Nota de Crédito emitida y stock devuelto por cancelación del pedido ${log.id_pedido_externo}`,
        { logId, pedidoNo: log.id_pedido_externo }
      );
    }

    setLogIntegracion(prev =>
      prev.map(l => l.id === logId ? { ...l, estado: 'ERROR', mensaje_error: 'Pedido Cancelado por el canal' } : l)
    );
  };

  // Handler para liberar pedidos retenidos por falta de stock (Aprobación manual RN-07)
  const handleAprobarPedidoManual = (logId: string, modo: 'parcial' | 'forzar') => {
    const log = logIntegracion.find(l => l.id === logId);
    if (!log) return;

    let orderData: any;
    try {
      orderData = JSON.parse(log.payload_json);
    } catch (e) {
      return;
    }

    const stockPrincipal = stock['Bodega Principal'] || [];
    const updatedItems = orderData.items.map((item: any) => {
      const currentStock = stockPrincipal.find((s: any) => s.sku === item.sku)?.stock || 0;
      if (modo === 'parcial' && currentStock < item.cantidad) {
        return { ...item, cantidad: currentStock }; // ajustar a lo que hay
      }
      return item;
    }).filter((item: any) => item.cantidad > 0);

    if (updatedItems.length === 0) {
      setLogIntegracion(prev =>
        prev.map(l => l.id === logId ? { ...l, estado: 'ERROR', mensaje_error: 'Aprobación parcial resultó en 0 items' } : l)
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

    setLogIntegracion(prev =>
      prev.map(l => l.id === logId ? {
        ...l,
        estado: 'PENDIENTE',
        payload_json: JSON.stringify(updatedPayload),
        mensaje_error: modo === 'forzar' ? 'Venta forzada sin stock suficiente' : 'Aprobado con stock parcial'
      } : l)
    );
    
    if (modo === 'forzar') {
      setStock(prev => {
        const newStock = { ...prev };
        if (newStock['Bodega Principal']) {
          newStock['Bodega Principal'] = newStock['Bodega Principal'].map((stockItem: any) => {
            const orderItem = updatedItems.find((i: any) => i.sku === stockItem.sku);
            if (orderItem) {
              return { ...stockItem, stock: stockItem.stock + orderItem.cantidad };
            }
            return stockItem;
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
        return (
          <DashboardView 
            setView={setCurrentView}
            events={events}
            setEvents={setEvents}
            syncQueue={syncQueue}
            setSyncQueue={setSyncQueue}
            dynamicFields={dynamicFields}
            setDynamicFields={setDynamicFields}
            products={products}
            setProducts={setProductsShim as any}
            publishEvent={publishEvent}
            ventas={ventas}
            parametros={parametros}
            devoluciones={devoluciones}
          />
        );
      case 'pos':
        return (
          <POSView 
            products={products} 
            dynamicFields={dynamicFields}
            publishEvent={publishEvent}
            userRole={userRole}
            stock={stock}
            setStock={setStock}
            lastClientPrices={lastClientPrices}
            updateLastClientPrice={updateLastClientPrice}
            cartera={cartera}
            setCartera={setCartera}
            clientes={clientes}
            setClientes={setClientes}
            ventas={ventas}
            setVentas={setVentas}
            movimientos={movimientos}
            setMovimientos={setMovimientos}
            conductores={conductores}
            devoluciones={devoluciones}
            setDevoluciones={setDevoluciones}
            quotations={quotations}
            setQuotations={setQuotations}
            logIntegracion={logIntegracion}
            setLogIntegracion={setLogIntegracion}
            handleCancelarPedidoDigital={handleCancelarPedidoDigital}
            handleAprobarPedidoManual={handleAprobarPedidoManual}
            parametros={parametros}
          />
        );
      case 'inventario':
        return (
          <InventoryView 
            products={products} 
            setProducts={setProductsShim as any} 
            productsCatalog={productsCatalog}
            setProductsCatalog={setProductsCatalog}
            productPricings={productPricings}
            setProductPricings={setProductPricings} 
            stock={stock}
            setStock={setStock}
            proveedores={proveedores}
            publishEvent={publishEvent}
            userRole={userRole}
            movimientos={movimientos}
            setMovimientos={setMovimientos}
            ordenesCompra={ordenesCompra}
            setOrdenesCompra={setOrdenesCompra}
            categorias={categorias}
            setCategorias={setCategorias}
            devoluciones={devoluciones}
            setDevoluciones={setDevoluciones}
            quotations={quotations}
            setQuotations={setQuotations}
          />
        );
      case 'precios':
        return (
          <PricingView 
            products={products} 
            setProducts={setProductsShim as any} 
            productsCatalog={productsCatalog}
            setProductsCatalog={setProductsCatalog}
            productPricings={productPricings}
            setProductPricings={setProductPricings} 
            quotations={quotations}
            setQuotations={setQuotations}
            publishEvent={publishEvent}
            userRole={userRole}
            stock={stock}
            setStock={setStock}
            lastClientPrices={lastClientPrices}
            updateLastClientPrice={updateLastClientPrice}
            clientes={clientes}
            conductores={conductores}
            devoluciones={devoluciones}
            setDevoluciones={setDevoluciones}
          />
        );
      case 'rrhh':
        return <HRView />;
      case 'cartera':
        return (
          <ARView 
            cartera={cartera}
            setCartera={setCartera}
            clientes={clientes}
            publishEvent={publishEvent}
            userRole={userRole}
            devoluciones={devoluciones}
            setDevoluciones={setDevoluciones}
          />
        );
      case 'clientes':
        return (
          <ClientsView 
            clientes={clientes}
            setClientes={setClientes}
            ventas={ventas}
            cartera={cartera}
            publishEvent={publishEvent}
            userRole={userRole}
          />
        );
      case 'compras':
        return (
          <SuppliersView
            proveedores={proveedores}
            setProveedores={setProveedores}
            ordenesCompra={ordenesCompra}
            movimientos={movimientos}
            publishEvent={publishEvent}
            userRole={userRole}
          />
        );
      case 'kanban':
        return (
          <OrderKanbanView
            quotations={quotations}
            setQuotations={setQuotations}
            publishEvent={publishEvent}
            userRole={userRole}
          />
        );
      default:
        return <DashboardView setView={setCurrentView} />;
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
                onChange={(e) => handleSetUserRole(e.target.value as any)}
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
            >
              <ShoppingBag size={16} />
              <span>POS</span>
            </div>

            <div
              className={`sidebar-item ${currentView === 'precios' ? 'active' : ''}`}
              onClick={() => { setCurrentView('precios'); setSidebarOpen(false); }}
            >
              <DollarSign size={16} />
              <span>Cotizacion</span>
            </div>

            <div
              className={`sidebar-item ${currentView === 'clientes' ? 'active' : ''}`}
              onClick={() => { setCurrentView('clientes'); setSidebarOpen(false); }}
            >
              <Users size={16} />
              <span>Clientes</span>
            </div>

            <div className={`sidebar-item`} style={{ opacity: 0.5 }}>
              <FileText size={16} />
              <span>Documentos</span>
            </div>

            <div
              className={`sidebar-item ${currentView === 'compras' ? 'active' : ''}`}
              onClick={() => { setCurrentView('compras'); setSidebarOpen(false); }}
            >
              <ShoppingCart size={16} />
              <span>Compras y Gastos</span>
            </div>

            <div
              className={`sidebar-item ${currentView === 'cartera' ? 'active' : ''}`}
              onClick={() => { setCurrentView('cartera'); setSidebarOpen(false); }}
            >
              <Wallet size={16} />
              <span>Cartera</span>
            </div>

            <div
              className={`sidebar-item ${currentView === 'inventario' ? 'active' : ''}`}
              onClick={() => { setCurrentView('inventario'); setSidebarOpen(false); }}
            >
              <Box size={16} />
              <span>Inventario</span>
            </div>

            <div className={`sidebar-item`} style={{ opacity: 0.5 }}>
              <Truck size={16} />
              <span>Traslados</span>
            </div>

            <div className={`sidebar-item`} style={{ opacity: 0.5 }}>
              <RefreshCw size={16} />
              <span>Ajuste</span>
            </div>

            <div className={`sidebar-item`} style={{ opacity: 0.5 }}>
              <Database size={16} />
              <span>Caja</span>
            </div>

            <div className={`sidebar-item`} style={{ opacity: 0.5 }}>
              <FileText size={16} />
              <span>Cuentas</span>
            </div>

            <div
              className={`sidebar-item ${currentView === 'rrhh' ? 'active' : ''}`}
              onClick={() => { setCurrentView('rrhh'); setSidebarOpen(false); }}
            >
              <LayoutDashboard size={16} />
              <span>Informes</span>
            </div>

            <div
              className={`sidebar-item ${currentView === 'kanban' ? 'active' : ''}`}
              onClick={() => { setCurrentView('kanban'); setSidebarOpen(false); }}
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
    </div>
  );
}
