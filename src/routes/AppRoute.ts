/**
 * ============================================================================
 * LA PEZCADERIA ERP — ARQUITECTURA CENTRAL DE RUTAS: AppRoute
 * ============================================================================
 * Fuente canónica de navegación bajo Spec-Driven Development (SDD).
 * 
 * Principios Arquitectónicos Aplicados:
 * 1. Tipado Estricto (Zero Magic Strings): Enum central `AppRouteId` y uniones discriminadas.
 * 2. Type-Safe Arguments: Parámetros tipados obligatorios/opcionales por pantalla vía `RouteParamsMap`.
 * 3. Modularidad por Dominio: Comercial, WMS/Operaciones, Finanzas y Administración.
 * 4. Deep Linking Ready: Mapeo bidireccional declarativo (Route <-> Path URL con Query Params).
 * 5. RBAC Declarativo: Matriz de acceso por rol (`UserRole`) y metadatos de presentación (Ubiquitous Language).
 */

import type { UserRole } from '../store/useAppStore';

// ============================================================================
// 1. ENUM CENTRAL DE RUTAS (AppRouteId)
// ============================================================================
export enum AppRouteId {
  // Dominio Comercial
  DASHBOARD = 'dashboard',
  POS = 'pos',
  POS_OFFLINE = 'pos_offline',
  PRICES = 'precios',
  CLIENTS = 'clientes',
  CRM = 'crm',
  ORDERS_KANBAN = 'kanban',
  B2B_EXTERNAL_SALES = 'ventas_b2b',
  B2B_PORTAL = 'portal_b2b',

  // Dominio Operaciones & WMS
  INVENTORY = 'inventario',
  WAREHOUSE_CONFIG = 'configuracion_bodegas',
  KARDEX = 'kardex',
  ORDER_PICKING = 'alistamiento',
  DISPATCHES = 'despachos',
  COLD_STORAGE_RENTAL = 'alquiler_cf',
  DOCK_PURCHASES = 'compras_muelle',
  MEAT_CUTTING = 'despiece',
  DRIVER_PORTAL = 'repartidor',
  OTIF_DASHBOARD = 'metricas_otif',

  // Dominio Finanzas & Tesorería
  CASH_DESK = 'caja',
  ACCOUNTS_RECEIVABLE = 'cartera',
  ACCOUNTING = 'contabilidad',
  PAYROLL = 'nomina',

  // Dominio Administración & RRHH
  HR = 'rrhh',
  SUPPLIERS = 'compras',
}

/**
 * Alias de compatibilidad hacia atrás para código UI existente (ERPViewKey).
 */
export type ERPViewKey = `${AppRouteId}`;

// ============================================================================
// 2. MODULARIZACIÓN POR DOMINIOS DE NEGOCIO (Domain Categorization)
// ============================================================================
export enum RouteDomain {
  COMMERCIAL = 'Ventas & Comercial',
  WMS = 'Operaciones & WMS',
  FINANCIAL = 'Finanzas & Administración',
  ADMIN = 'Administración & RRHH',
}

export const COMMERCIAL_ROUTES: readonly AppRouteId[] = [
  AppRouteId.DASHBOARD,
  AppRouteId.POS,
  AppRouteId.POS_OFFLINE,
  AppRouteId.PRICES,
  AppRouteId.CLIENTS,
  AppRouteId.CRM,
  AppRouteId.ORDERS_KANBAN,
  AppRouteId.B2B_EXTERNAL_SALES,
  AppRouteId.B2B_PORTAL,
] as const;

export const WMS_ROUTES: readonly AppRouteId[] = [
  AppRouteId.INVENTORY,
  AppRouteId.WAREHOUSE_CONFIG,
  AppRouteId.KARDEX,
  AppRouteId.ORDER_PICKING,
  AppRouteId.DISPATCHES,
  AppRouteId.COLD_STORAGE_RENTAL,
  AppRouteId.DOCK_PURCHASES,
  AppRouteId.MEAT_CUTTING,
  AppRouteId.DRIVER_PORTAL,
  AppRouteId.OTIF_DASHBOARD,
] as const;

export const FINANCIAL_ROUTES: readonly AppRouteId[] = [
  AppRouteId.CASH_DESK,
  AppRouteId.ACCOUNTS_RECEIVABLE,
  AppRouteId.ACCOUNTING,
  AppRouteId.PAYROLL,
] as const;

export const ADMIN_ROUTES: readonly AppRouteId[] = [
  AppRouteId.HR,
  AppRouteId.SUPPLIERS,
] as const;

// ============================================================================
// 3. TYPE-SAFE ARGUMENTS (Contratos de Parámetros por Ruta)
// ============================================================================
export interface RouteParamsMap {
  [AppRouteId.DASHBOARD]: undefined;
  [AppRouteId.POS]: {
    quoteId?: string;
    customerId?: string;
    tableNumber?: string;
  } | undefined;
  [AppRouteId.POS_OFFLINE]: undefined;
  [AppRouteId.PRICES]: {
    clientId?: string;
    category?: string;
  } | undefined;
  [AppRouteId.CLIENTS]: {
    selectedClientId?: string;
    filterQuery?: string;
  } | undefined;
  [AppRouteId.CRM]: {
    leadId?: string;
  } | undefined;
  [AppRouteId.ORDERS_KANBAN]: {
    orderId?: string;
    statusFilter?: string;
  } | undefined;
  [AppRouteId.B2B_EXTERNAL_SALES]: {
    clienteId?: string;
    step?: number;
  } | undefined;
  [AppRouteId.B2B_PORTAL]: {
    clienteId?: string;
    plantillaId?: string;
    tab?: 'catalogo' | 'plantillas' | 'pedidos';
  } | undefined;
  [AppRouteId.INVENTORY]: {
    initialViewMode?: 'kardex' | 'configuracion_bodegas' | 'compras_muelle' | 'despiece';
    selectedBodegaId?: string;
  } | undefined;
  [AppRouteId.WAREHOUSE_CONFIG]: {
    bodegaId?: string;
  } | undefined;
  [AppRouteId.KARDEX]: {
    productId?: string;
    bodegaId?: string;
  } | undefined;
  [AppRouteId.ORDER_PICKING]: {
    orderId?: string;
  } | undefined;
  [AppRouteId.DISPATCHES]: {
    routeId?: string;
    activeTab?: 'routes' | 'settlement' | 'governance';
  } | undefined;
  [AppRouteId.DRIVER_PORTAL]: {
    rutaId?: string;
    conductorId?: string;
  } | undefined;
  [AppRouteId.OTIF_DASHBOARD]: {
    fechaDesde?: string;
    fechaHasta?: string;
    conductorId?: string;
    zonaRuta?: string;
    estatusSLA?: string;
  } | undefined;
  [AppRouteId.COLD_STORAGE_RENTAL]: {
    contractId?: string;
  } | undefined;
  [AppRouteId.DOCK_PURCHASES]: {
    truckBatchId?: string;
  } | undefined;
  [AppRouteId.MEAT_CUTTING]: {
    batchId?: string;
  } | undefined;
  [AppRouteId.CASH_DESK]: {
    registerId?: string;
    shiftId?: string;
  } | undefined;
  [AppRouteId.ACCOUNTS_RECEIVABLE]: {
    clientId?: string;
    invoiceId?: string;
  } | undefined;
  [AppRouteId.ACCOUNTING]: {
    period?: string;
    accountCode?: string;
  } | undefined;
  [AppRouteId.PAYROLL]: {
    employeeId?: string;
    period?: string;
  } | undefined;
  [AppRouteId.HR]: {
    employeeId?: string;
  } | undefined;
  [AppRouteId.SUPPLIERS]: {
    supplierId?: string;
  } | undefined;
}

/**
 * Unión discriminada para invocaciones de navegación con comprobación estática de parámetros.
 */
export type AppRoutePayload<T extends AppRouteId = AppRouteId> = T extends AppRouteId
  ? RouteParamsMap[T] extends undefined
    ? { route: T; params?: undefined }
    : { route: T; params: RouteParamsMap[T] }
  : never;

// ============================================================================
// 4. METADATOS DECLARATIVOS (RBAC + Breadcrumbs + Iconos)
// ============================================================================
export interface AppRouteMetadata<T extends AppRouteId = AppRouteId> {
  id: T;
  path: string;
  title: string;
  domain: RouteDomain;
  subtitle: string;
  description: string;
  iconName: string;
  allowedRoles: readonly UserRole[];
  isPrimaryNav: boolean;
  testId: string;
}

export const APP_ROUTES_METADATA: Record<AppRouteId, AppRouteMetadata<AppRouteId>> = {
  // Comercial
  [AppRouteId.DASHBOARD]: {
    id: AppRouteId.DASHBOARD,
    path: '/dashboard',
    title: 'Panel de Control',
    domain: RouteDomain.COMMERCIAL,
    subtitle: 'Métricas Ejecutivas y KPIs',
    description: 'Resumen consolidado de ventas, inventario crítico, cuentas por cobrar y rentabilidad.',
    iconName: 'LayoutDashboard',
    allowedRoles: ['admin', 'vendedor', 'bodega', 'administrativo'],
    isPrimaryNav: true,
    testId: 'nav-dashboard',
  },
  [AppRouteId.POS]: {
    id: AppRouteId.POS,
    path: '/ventas/pos',
    title: 'Punto de Venta (POS)',
    domain: RouteDomain.COMMERCIAL,
    subtitle: 'Venta Mostrador y Báscula Digital',
    description: 'Caja rápida, balanza digital, teclado numérico, cobro multi-medio y facturación.',
    iconName: 'ShoppingCart',
    allowedRoles: ['admin', 'vendedor'],
    isPrimaryNav: true,
    testId: 'nav-pos',
  },
  [AppRouteId.POS_OFFLINE]: {
    id: AppRouteId.POS_OFFLINE,
    path: '/ventas/pos-offline',
    title: 'POS Offline V2',
    domain: RouteDomain.COMMERCIAL,
    subtitle: 'Venta Sin Conexión & Outbox',
    description: 'Facturación en contingencia offline con sincronización automática resiliente.',
    iconName: 'WifiOff',
    allowedRoles: ['admin', 'vendedor'],
    isPrimaryNav: false,
    testId: 'nav-pos-offline',
  },
  [AppRouteId.PRICES]: {
    id: AppRouteId.PRICES,
    path: '/ventas/precios',
    title: 'Precios y Cotizaciones',
    domain: RouteDomain.COMMERCIAL,
    subtitle: 'Listas de Precios & Cotizaciones B2B',
    description: 'Administración de tarifas, descuentos por volumen, margen y emisión de cotizaciones.',
    iconName: 'Tag',
    allowedRoles: ['admin', 'vendedor', 'administrativo'],
    isPrimaryNav: true,
    testId: 'nav-precios',
  },
  [AppRouteId.CLIENTS]: {
    id: AppRouteId.CLIENTS,
    path: '/ventas/clientes',
    title: 'Directorio de Clientes',
    domain: RouteDomain.COMMERCIAL,
    subtitle: 'Cartera de Clientes & Contactos',
    description: 'Gestión de terceros clientes, condiciones comerciales, cupos de crédito y documentos.',
    iconName: 'Users',
    allowedRoles: ['admin', 'vendedor', 'administrativo'],
    isPrimaryNav: true,
    testId: 'nav-clientes',
  },
  [AppRouteId.CRM]: {
    id: AppRouteId.CRM,
    path: '/ventas/crm',
    title: 'CRM Comercial',
    domain: RouteDomain.COMMERCIAL,
    subtitle: 'Pipeline de Oportunidades Twenty',
    description: 'Embudo de prospectos, seguimiento de cotizaciones B2B y acuerdos institucionales.',
    iconName: 'Sparkles',
    allowedRoles: ['admin', 'vendedor'],
    isPrimaryNav: true,
    testId: 'nav-crm',
  },
  [AppRouteId.ORDERS_KANBAN]: {
    id: AppRouteId.ORDERS_KANBAN,
    path: '/ventas/pedidos-kanban',
    title: 'Tablero de Pedidos (Kanban)',
    domain: RouteDomain.COMMERCIAL,
    subtitle: 'Flujo Visual de Órdenes',
    description: 'Seguimiento en tiempo real de pedidos desde cotización hasta despacho final.',
    iconName: 'Columns3',
    allowedRoles: ['admin', 'vendedor', 'bodega', 'administrativo'],
    isPrimaryNav: true,
    testId: 'nav-kanban',
  },
  [AppRouteId.B2B_EXTERNAL_SALES]: {
    id: AppRouteId.B2B_EXTERNAL_SALES,
    path: '/ventas/b2b-externo',
    title: 'Ventas B2B Bodega Principal',
    domain: RouteDomain.COMMERCIAL,
    subtitle: 'Pedidos Externos & Fricción Cero',
    description: 'Terminal móvil de toma de pedidos para vendedor externo con stock de Bodega Principal, piezas/calibre y validación de cupo.',
    iconName: 'Truck',
    allowedRoles: ['admin', 'vendedor', 'administrativo'],
    isPrimaryNav: true,
    testId: 'nav-ventas-b2b',
  },
  [AppRouteId.B2B_PORTAL]: {
    id: AppRouteId.B2B_PORTAL,
    path: '/ventas/portal-b2b',
    title: 'Portal Clientes B2B',
    domain: RouteDomain.COMMERCIAL,
    subtitle: 'Auto-Servicio HORECA',
    description: 'Portal de auto-atención para restaurantes, hoteles y casinos con catálogo preferencial, cortes marinos y pedidos recurrentes.',
    iconName: 'Store',
    allowedRoles: ['admin', 'vendedor', 'administrativo'],
    isPrimaryNav: true,
    testId: 'nav-portal-b2b',
  },

  // WMS / Operaciones
  [AppRouteId.INVENTORY]: {
    id: AppRouteId.INVENTORY,
    path: '/bodega/inventario',
    title: 'Bodegas & WMS',
    domain: RouteDomain.WMS,
    subtitle: 'Inventario Multibodega',
    description: 'Control de stock físico, rotación ABC Pareto 80/20, cuartos fríos y traslados internos.',
    iconName: 'Warehouse',
    allowedRoles: ['admin', 'bodega', 'administrativo'],
    isPrimaryNav: true,
    testId: 'nav-inventario',
  },
  [AppRouteId.WAREHOUSE_CONFIG]: {
    id: AppRouteId.WAREHOUSE_CONFIG,
    path: '/bodega/configuracion',
    title: 'Gestión de Bodegas',
    domain: RouteDomain.WMS,
    subtitle: 'Configuración Cuartos Fríos',
    description: 'Creación y parametrización de bodegas, cámaras de frío y ubicaciones físicas.',
    iconName: 'Building2',
    allowedRoles: ['admin', 'bodega'],
    isPrimaryNav: false,
    testId: 'nav-configuracion-bodegas',
  },
  [AppRouteId.KARDEX]: {
    id: AppRouteId.KARDEX,
    path: '/bodega/kardex',
    title: 'Kardex Contable (NIIF)',
    domain: RouteDomain.WMS,
    subtitle: 'Movimientos NIIF / NIC 2',
    description: 'Auditoría estricta de entradas, salidas, traslados y valuación por promedio ponderado.',
    iconName: 'FileText',
    allowedRoles: ['admin', 'bodega', 'administrativo'],
    isPrimaryNav: false,
    testId: 'nav-kardex',
  },
  [AppRouteId.ORDER_PICKING]: {
    id: AppRouteId.ORDER_PICKING,
    path: '/operaciones/alistamiento',
    title: 'Alistamiento de Pedidos',
    domain: RouteDomain.WMS,
    subtitle: 'Picking & Packing B2B',
    description: 'Verificación de pesos reales, lotes FEFO perecederos y canastillas de despacho.',
    iconName: 'PackageCheck',
    allowedRoles: ['admin', 'bodega'],
    isPrimaryNav: true,
    testId: 'nav-alistamiento',
  },
  [AppRouteId.DISPATCHES]: {
    id: AppRouteId.DISPATCHES,
    path: '/operaciones/despachos',
    title: 'Despachos y Rutas',
    domain: RouteDomain.WMS,
    subtitle: 'Rutas de Entrega & Liquidación OTIF',
    description: 'Planificación de entregas, manifiestos de carga, firma digital y liquidación de cobro.',
    iconName: 'Truck',
    allowedRoles: ['admin', 'bodega', 'administrativo'],
    isPrimaryNav: true,
    testId: 'nav-despachos',
  },
  [AppRouteId.DRIVER_PORTAL]: {
    id: AppRouteId.DRIVER_PORTAL,
    path: '/repartidor',
    title: 'App Móvil Repartidor',
    domain: RouteDomain.WMS,
    subtitle: 'Entregas en Terreno & Rutas B2B',
    description: 'Terminal móvil para conductores con hoja de ruta, llamada directa, Waze, firma táctil y sincronización offline.',
    iconName: 'Navigation',
    allowedRoles: ['admin', 'bodega', 'vendedor', 'administrativo'],
    isPrimaryNav: false,
    testId: 'nav-repartidor',
  },
  [AppRouteId.OTIF_DASHBOARD]: {
    id: AppRouteId.OTIF_DASHBOARD,
    path: '/operaciones/metricas-otif',
    title: 'Métricas Logísticas OTIF',
    domain: RouteDomain.WMS,
    subtitle: 'Cumplimiento On-Time In-Full & Cadena de Frío',
    description: 'Torre de control analítica de cumplimiento de entregas B2B, tiempos de servicio, SLAs térmicos y recaudos.',
    iconName: 'BarChart3',
    allowedRoles: ['admin', 'vendedor', 'bodega', 'administrativo'],
    isPrimaryNav: true,
    testId: 'nav-otif-dashboard',
  },
  [AppRouteId.COLD_STORAGE_RENTAL]: {
    id: AppRouteId.COLD_STORAGE_RENTAL,
    path: '/bodega/alquiler-cf',
    title: 'Alquiler Cuarto Frío (3PL)',
    domain: RouteDomain.WMS,
    subtitle: 'Servicios Logísticos a Terceros',
    description: 'Custodia frigorífica de mercancía ajena, cobro por estiba/día y liquidación periódica.',
    iconName: 'Snowflake',
    allowedRoles: ['admin', 'bodega', 'administrativo'],
    isPrimaryNav: true,
    testId: 'nav-alquiler-cf',
  },
  [AppRouteId.DOCK_PURCHASES]: {
    id: AppRouteId.DOCK_PURCHASES,
    path: '/planta/compras-muelle',
    title: 'Compras de Muelle',
    domain: RouteDomain.WMS,
    subtitle: 'Recepción de Camión & Pescadores',
    description: 'Pesaje directo de camión en muelle, liquidación inmediata por especie y merma térmica.',
    iconName: 'Anchor',
    allowedRoles: ['admin', 'bodega', 'administrativo'],
    isPrimaryNav: true,
    testId: 'nav-compras-muelle',
  },
  [AppRouteId.MEAT_CUTTING]: {
    id: AppRouteId.MEAT_CUTTING,
    path: '/planta/despiece',
    title: 'Transformación y Fileteo',
    domain: RouteDomain.WMS,
    subtitle: 'Rendimiento y Mermas de Despiece',
    description: 'Conversión de pescado entero a filete/postas con cálculo científico de yield y subproductos.',
    iconName: 'Scissors',
    allowedRoles: ['admin', 'bodega'],
    isPrimaryNav: false,
    testId: 'nav-despiece',
  },

  // Finanzas
  [AppRouteId.CASH_DESK]: {
    id: AppRouteId.CASH_DESK,
    path: '/finanzas/caja',
    title: 'Control de Cajas',
    domain: RouteDomain.FINANCIAL,
    subtitle: 'Turnos y Arqueo Ciego',
    description: 'Apertura de turno, movimientos de caja menor, base en efectivo y arqueo ciego sin sesgo.',
    iconName: 'CircleDollarSign',
    allowedRoles: ['admin', 'vendedor', 'administrativo'],
    isPrimaryNav: true,
    testId: 'nav-caja',
  },
  [AppRouteId.ACCOUNTS_RECEIVABLE]: {
    id: AppRouteId.ACCOUNTS_RECEIVABLE,
    path: '/finanzas/cartera',
    title: 'Cartera y Cobranza',
    domain: RouteDomain.FINANCIAL,
    subtitle: 'Cuentas por Cobrar (CxC)',
    description: 'Estado de cuenta por cliente, edades de cartera (30, 60, 90+ días) y recibos de caja.',
    iconName: 'CreditCard',
    allowedRoles: ['admin', 'administrativo'],
    isPrimaryNav: true,
    testId: 'nav-cartera',
  },
  [AppRouteId.ACCOUNTING]: {
    id: AppRouteId.ACCOUNTING,
    path: '/finanzas/contabilidad',
    title: 'Contabilidad NIIF',
    domain: RouteDomain.FINANCIAL,
    subtitle: 'Libro Mayor & Balances',
    description: 'Catálogo de cuentas PUC, comprobantes contables automáticos y estados financieros.',
    iconName: 'BookOpen',
    allowedRoles: ['admin', 'administrativo'],
    isPrimaryNav: true,
    testId: 'nav-contabilidad',
  },
  [AppRouteId.PAYROLL]: {
    id: AppRouteId.PAYROLL,
    path: '/finanzas/nomina',
    title: 'Liquidación de Nómina',
    domain: RouteDomain.FINANCIAL,
    subtitle: 'Nómina Electrónica & Prestaciones',
    description: 'Devengados, deducciones de ley, seguridad social y emisión de desprendibles.',
    iconName: 'FileSpreadsheet',
    allowedRoles: ['admin', 'administrativo'],
    isPrimaryNav: false,
    testId: 'nav-nomina',
  },

  // Administración & RRHH
  [AppRouteId.HR]: {
    id: AppRouteId.HR,
    path: '/admin/rrhh',
    title: 'Recursos Humanos',
    domain: RouteDomain.ADMIN,
    subtitle: 'Expediente de Empleados',
    description: 'Directorio de colaboradores, turnos laborales, cargos y comisiones comerciales.',
    iconName: 'UserCog',
    allowedRoles: ['admin', 'administrativo'],
    isPrimaryNav: true,
    testId: 'nav-rrhh',
  },
  [AppRouteId.SUPPLIERS]: {
    id: AppRouteId.SUPPLIERS,
    path: '/admin/compras-gastos',
    title: 'Compras y Proveedores',
    domain: RouteDomain.ADMIN,
    subtitle: 'Órdenes de Compra y Cuentas por Pagar',
    description: 'Gestión de proveedores, insumos, empaques, hielo y cuentas por pagar (CxP).',
    iconName: 'ShoppingBag',
    allowedRoles: ['admin', 'administrativo'],
    isPrimaryNav: true,
    testId: 'nav-compras',
  },
};

// ============================================================================
// 5. DEEP LINKING DECLARATIVO (Route <-> Path Bidireccional)
// ============================================================================

/**
 * Convierte un identificador de ruta y sus parámetros opcionales a una URL limpia con query string.
 */
export function routeToPath<T extends AppRouteId>(
  routeId: T,
  params?: RouteParamsMap[T]
): string {
  const metadata = APP_ROUTES_METADATA[routeId];
  if (!metadata) {
    throw new Error(`[AppRoute] Ruta no reconocida: "${routeId}"`);
  }

  const basePath = metadata.path;
  if (!params || Object.keys(params).length === 0) {
    return basePath;
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

/**
 * Resuelve una URL o URI Scheme a un `AppRouteId` y su diccionario de parámetros tipados.
 */
export function pathToRoute(pathname: string, search = ''): {
  routeId: AppRouteId;
  params: Record<string, string>;
} {
  // Normalizar removiendo slash final si no es raíz
  const normalizedPath = pathname.length > 1 && pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname;

  // Búsqueda inversa por metadata.path
  const entry = Object.entries(APP_ROUTES_METADATA).find(
    ([, meta]) => meta.path === normalizedPath
  );

  const routeId = entry ? (entry[0] as AppRouteId) : AppRouteId.DASHBOARD;

  // Extraer query params
  const params: Record<string, string> = {};
  if (search) {
    const searchParams = new URLSearchParams(search);
    searchParams.forEach((val, key) => {
      params[key] = val;
    });
  }

  return { routeId, params };
}

// ============================================================================
// 6. TYPE GUARDS & UTILIDADES ARQUITECTÓNICAS
// ============================================================================

/**
 * Valida si un string cualquiera corresponde a un `AppRouteId` válido.
 */
export function isValidAppRouteId(route: unknown): route is AppRouteId {
  return typeof route === 'string' && Object.values(AppRouteId).includes(route as AppRouteId);
}

/**
 * Valida si el rol de usuario tiene autorización RBAC para acceder a una ruta.
 */
export function isRouteAllowedForRole(routeId: AppRouteId, role: UserRole): boolean {
  const meta = APP_ROUTES_METADATA[routeId];
  if (!meta) return false;
  return meta.allowedRoles.includes(role);
}

/**
 * Obtiene la configuración de breadcrumbs de una ruta respetando el Ubiquitous Language.
 */
export function getRouteBreadcrumbs(routeId: AppRouteId): { domain: string; sub: string } {
  const meta = APP_ROUTES_METADATA[routeId] || APP_ROUTES_METADATA[AppRouteId.DASHBOARD];
  return {
    domain: meta.domain,
    sub: `${meta.title} (${meta.subtitle})`,
  };
}
