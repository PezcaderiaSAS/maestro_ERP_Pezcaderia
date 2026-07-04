import * as localDb from './localDb';
import type { IDataService, QueryOptions } from '../types/services.types';

const TABLE_TO_KEY: Record<string, localDb.DbKey> = {
  clientes: 'clientes',
  proveedores: 'proveedores',
  stock: 'stock',
  inventario_movimientos: 'movimientos',
  ordenes_compra: 'ordenesCompra',
  ventas: 'ventas',
  cartera_facturas: 'cartera',
  cotizaciones: 'quotations',
  empleados: 'empleados',
  cajas: 'cajas',
  movimientos_caja: 'movimientosCaja',
  turnos_caja: 'turnosCaja',
  traslados_dinero: 'trasladosDinero',
  devoluciones: 'devoluciones',
  conductores: 'conductores',
  gastos: 'gastos',
  categorias: 'categorias',
  bodegas: 'bodegas',
  productos_catalogo: 'productsCatalog',
  productos_precios: 'productPricings',
  nominas: 'nominas',
  parametros: 'parametros',
  eventos: 'events',
  dynamicFields: 'dynamicFields',
  logIntegracion: 'logIntegracion',
  syncQueue: 'syncQueue',
};

function tableToKey(table: string): localDb.DbKey {
  return TABLE_TO_KEY[table] || (table as localDb.DbKey);
}

export class LocalDataService implements IDataService {
  readonly mode = 'local' as const;

  async getAll<T>(table: string): Promise<T[]> {
    const key = tableToKey(table);
    try {
      const data = localDb.load<any>(key, []);
      return (Array.isArray(data) ? data : [data]) as T[];
    } catch {
      return [];
    }
  }

  async getById<T>(table: string, id: string): Promise<T | null> {
    const all = await this.getAll<T>(table);
    return (all as any[]).find((item: any) => item.id === id) ?? null;
  }

  async create<T>(table: string, data: Partial<T>): Promise<T> {
    const key = tableToKey(table);
    let all = localDb.load<any>(key, []);
    if (!Array.isArray(all)) all = Object.keys(all).length ? [{ id: 'singleton', ...all }] : [];
    all.push(data);
    localDb.save(key, all);
    return data as T;
  }

  async update<T>(table: string, id: string, data: Partial<T>): Promise<T> {
    const key = tableToKey(table);
    let all = localDb.load<any>(key, []);
    if (!Array.isArray(all)) all = Object.keys(all).length ? [{ id: 'singleton', ...all }] : [];
    const idx = all.findIndex((item: any) => item.id === id);
    if (idx === -1) throw new Error(`Registro no encontrado: ${table}#${id}`);
    all[idx] = { ...all[idx], ...data };
    localDb.save(key, all);
    return all[idx] as T;
  }

  async softDelete(table: string, id: string): Promise<void> {
    await this.update(table, id, { deleted_at: new Date().toISOString() } as any);
  }

  async hardDelete(table: string, id: string): Promise<void> {
    const key = tableToKey(table);
    const all = localDb.load<any[]>(key, []);
    const filtered = all.filter((item: any) => item.id !== id);
    localDb.save(key, filtered);
  }

  async query<T>(table: string, options: QueryOptions): Promise<T[]> {
    let all = await this.getAll<T>(table);
    if (options.filters) {
      for (const f of options.filters) {
        all = all.filter((item: any) => {
          const val = item[f.field];
          const fVal = f.value as any;
          switch (f.operator) {
            case 'eq': return val === fVal;
            case 'neq': return val !== fVal;
            case 'gt': return val > fVal;
            case 'gte': return val >= fVal;
            case 'lt': return val < fVal;
            case 'lte': return val <= fVal;
            case 'in': return Array.isArray(fVal) && fVal.includes(val);
            case 'like': return String(val).toLowerCase().includes(String(fVal).toLowerCase());
            case 'is': return val === null && fVal === null;
            default: return true;
          }
        });
      }
    }
    if (options.orderBy) {
      const { field, direction = 'asc' } = options.orderBy;
      all = [...all].sort((a: any, b: any) => {
        const cmp = a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0;
        return direction === 'desc' ? -cmp : cmp;
      });
    }
    if (options.offset) all = all.slice(options.offset);
    if (options.limit) all = all.slice(0, options.limit);
    return all;
  }

  // Shared config (modo de operación) via parametros key
  async getDbMode(): Promise<'local' | 'supabase' | 'dual'> {
    const params = localDb.load<Record<string, string>>('parametros', {});
    return (params.DB_MODE as any) || 'local';
  }

  async setDbMode(mode: 'local' | 'supabase' | 'dual'): Promise<void> {
    const params = localDb.load<Record<string, string>>('parametros', {});
    params.DB_MODE = mode;
    localDb.save('parametros', params);
  }
}
