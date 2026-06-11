// src/services/localDb.ts

// Diccionario de claves para localStorage (Manteniendo la compatibilidad con F1, F2 y F3)
export const DB_KEYS = {
  productsCatalog: 'pezcaderia_products_catalog',
  productPricings: 'pezcaderia_product_pricings',
  clientes: 'pezcaderia_clientes',
  proveedores: 'pezcaderia_proveedores',
  stock: 'pezcaderia_stock',
  movimientos: 'pezcaderia_movimientos',
  ordenesCompra: 'pezcaderia_ordenes_compra',
  ventas: 'pezcaderia_ventas',
  cartera: 'pezcaderia_cartera',
  quotations: 'pezcaderia_quotations',
  empleados: 'pezcaderia_empleados',
  events: 'pezcaderia_events',
  syncQueue: 'pezcaderia_sync_queue',
  lastClientPrices: 'pezcaderia_last_client_prices',
  dynamicFields: 'pezcaderia_dynamic_fields',
  role: 'pezcaderia_role',
  categorias: 'pezcaderia_categorias',
  devoluciones: 'pezcaderia_devoluciones',
  conductores: 'pezcaderia_conductores',
  logIntegracion: 'pezcaderia_log_integracion',
  parametros: 'pezcaderia_parametros'
} as const;

export type DbKey = keyof typeof DB_KEYS;

/**
 * Carga datos desde localStorage de manera segura
 * @param key Identificador de la base de datos
 * @param fallback Valor por defecto en caso de error o vacío
 */
export function load<T>(key: DbKey, fallback: T): T {
  try {
    const raw = localStorage.getItem(DB_KEYS[key]);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn(`Error al cargar la clave ${DB_KEYS[key]} de localStorage:`, error);
    return fallback;
  }
}

/**
 * Guarda datos en localStorage de manera segura
 * @param key Identificador de la base de datos
 * @param data Los datos a guardar (serán serializados a JSON)
 */
export function save<T>(key: DbKey, data: T): void {
  try {
    localStorage.setItem(DB_KEYS[key], JSON.stringify(data));
  } catch (error) {
    console.error(`Error al guardar en la clave ${DB_KEYS[key]} de localStorage:`, error);
  }
}

/**
 * Elimina una clave específica de localStorage
 * @param key Identificador de la base de datos
 */
export function remove(key: DbKey): void {
  try {
    localStorage.removeItem(DB_KEYS[key]);
  } catch (error) {
    console.error(`Error al eliminar la clave ${DB_KEYS[key]} de localStorage:`, error);
  }
}

/**
 * Elimina directamente una clave del localStorage por string (útil para limpiezas de migración)
 */
export function removeRaw(keyString: string): void {
  try {
    localStorage.removeItem(keyString);
  } catch (error) {
    console.error(`Error al eliminar la clave cruda ${keyString} de localStorage:`, error);
  }
}
