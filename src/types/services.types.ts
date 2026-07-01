export interface QueryFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like' | 'is';
  value: unknown;
}

export interface QueryOptions {
  filters?: QueryFilter[];
  orderBy?: { field: string; direction?: 'asc' | 'desc' };
  limit?: number;
  offset?: number;
}

export interface IDataService {
  mode: 'local' | 'supabase' | 'dual';

  getAll<T>(table: string): Promise<T[]>;
  getById<T>(table: string, id: string): Promise<T | null>;
  create<T>(table: string, data: Partial<T>): Promise<T>;
  update<T>(table: string, id: string, data: Partial<T>): Promise<T>;
  softDelete(table: string, id: string): Promise<void>;
  hardDelete(table: string, id: string): Promise<void>;
  query<T>(table: string, options: QueryOptions): Promise<T[]>;

  // Sync
  getDbMode(): Promise<'local' | 'supabase' | 'dual'>;
  setDbMode(mode: 'local' | 'supabase' | 'dual'): Promise<void>;
}

export type TablasSchemaNuevo =
  | 'productos_catalogo'
  | 'productos_precios'
  | 'inventario_movimientos'
  | 'cartera_facturas'
  | 'cartera_pagos'
  | 'ordenes_compra'
  | 'ordenes_compra_items'
  | 'cotizaciones'
  | 'cotizaciones_items'
  | 'turnos_caja'
  | 'movimientos_caja'
  | 'detalles_arqueo'
  | 'traslados_dinero';
