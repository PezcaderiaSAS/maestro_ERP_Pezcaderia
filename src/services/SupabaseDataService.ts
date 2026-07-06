import { getSupabaseClient } from '../lib/supabase';
import type { IDataService, QueryOptions } from '../types/services.types';

export class SupabaseDataService implements IDataService {
  readonly mode = 'supabase' as const;

  private sb() {
    return getSupabaseClient();
  }

  async getAll<T>(table: string): Promise<T[]> {
    const { data, error } = await this.sb()
      .from(table)
      .select('*')
      .is('deleted_at', null)
      .order('creado_en', { ascending: false });
    if (error) throw error;
    return (data ?? []) as T[];
  }

  async getById<T>(table: string, id: string): Promise<T | null> {
    const { data, error } = await this.sb()
      .from(table)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as T | null;
  }

  async create<T>(table: string, data: Partial<T>): Promise<T> {
    const { data: inserted, error } = await this.sb()
      .from(table)
      .insert(data as any)
      .select()
      .single();
    if (error) throw error;
    return inserted as T;
  }

  async update<T>(table: string, id: string, data: Partial<T>): Promise<T> {
    const { data: updated, error } = await this.sb()
      .from(table)
      .update(data as any)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return updated as T;
  }

  async softDelete(table: string, id: string): Promise<void> {
    const { error } = await this.sb()
      .from(table)
      .update({ deleted_at: new Date().toISOString() } as any)
      .eq('id', id);
    if (error) throw error;
  }

  async hardDelete(table: string, id: string): Promise<void> {
    const { error } = await this.sb()
      .from(table)
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async query<T>(table: string, options: QueryOptions): Promise<T[]> {
    let query = this.sb().from(table).select('*');

    if (options.filters) {
      for (const f of options.filters) {
        if (f.operator === 'is' && f.value === null) {
          query = (query as any).is(f.field, null);
        } else {
          query = (query as any)[f.operator](f.field, f.value);
        }
      }
    }

    query = (query as any).is('deleted_at', null);

    if (options.orderBy) {
      query = (query as any).order(options.orderBy.field, {
        ascending: options.orderBy.direction !== 'desc',
      });
    }

    if (options.limit) query = (query as any).limit(options.limit);
    if (options.offset) query = (query as any).range(options.offset, options.offset + (options.limit ?? 100) - 1);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as T[];
  }

  async getDbMode(): Promise<'local' | 'supabase' | 'dual'> {
    const { data, error } = await this.sb()
      .from('parametros')
      .select('valor')
      .eq('llave', 'DB_MODE')
      .maybeSingle();
    if (error || !data) return 'local';
    return (data as any).valor as 'local' | 'supabase' | 'dual';
  }

  async setDbMode(mode: 'local' | 'supabase' | 'dual'): Promise<void> {
    const { error } = await this.sb()
      .from('parametros')
      .upsert({ llave: 'DB_MODE', valor: mode }, { onConflict: 'llave' });
    if (error) throw error;
  }
}
