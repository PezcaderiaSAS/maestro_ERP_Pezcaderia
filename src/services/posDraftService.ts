import { getSupabaseClient } from '../lib/supabase';
import { load, save } from './localDb';
import type { CartDraft, LineaVenta } from '../types/pos.types';

export interface PosDraftRecord {
  id: string;
  alias: string;
  clienteId?: string;
  lineas: LineaVenta[];
  descuentoGlobal: number;
  totalEstimado: number;
  cajeroNombre?: string;
  estado: 'EN_ESPERA' | 'RECUPERADO' | 'DESCARTADO';
  fechaGuardado: string;
  expiresAt?: string;
}

export class PosDraftService {
  /**
   * Obtiene los borradores activos en modo offline-first
   */
  static getLocalDrafts(): CartDraft[] {
    const drafts = load<CartDraft[]>('pos_drafts', []);
    if (Array.isArray(drafts) && drafts.length > 0) return drafts;
    try {
      if (typeof localStorage !== 'undefined') {
        const v1 = localStorage.getItem('pezca_pos_drafts_v1');
        if (v1) {
          const parsed = JSON.parse(v1);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch {}
    return Array.isArray(drafts) ? drafts : [];
  }

  /**
   * Guarda o actualiza un borrador localmente y sincroniza con Supabase si hay conexión
   */
  static async saveDraft(draft: CartDraft): Promise<CartDraft> {
    // 1. Persistencia local inmediata (Offline-First)
    const current = this.getLocalDrafts();
    const index = current.findIndex((d) => d.id === draft.id);
    let updated: CartDraft[];

    if (index >= 0) {
      updated = [...current];
      updated[index] = { ...draft, fechaGuardado: new Date().toISOString() };
    } else {
      updated = [
        { ...draft, fechaGuardado: draft.fechaGuardado || new Date().toISOString() },
        ...current,
      ];
    }
    save('pos_drafts', updated);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('pezca_pos_drafts_v1', JSON.stringify(updated));
      }
    } catch {}

    // 2. Sincronización remota resiliente con Supabase
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const total = (draft.lineas || []).reduce((acc: number, l: LineaVenta) => acc + (l.totalLinea || 0), 0);
        await supabase.rpc('manage_pos_draft', {
          p_draft_id: draft.id.includes('-') && draft.id.length >= 32 ? draft.id : null,
          p_alias: draft.alias || 'Borrador Mostrador',
          p_cliente_id: draft.cliente?.id || null,
          p_lineas: draft.lineas || [],
          p_descuento_global: draft.descuentoGlobal || 0,
          p_total_estimado: total,
          p_cajero_nombre: null,
        });
      }
    } catch (err) {
      console.warn('[PosDraftService] Error sincronizando borrador con Supabase (queda en cola local):', err);
    }

    return draft;
  }

  /**
   * Marca un borrador como RECUPERADO o DESCARTADO
   */
  static async resolveDraft(draftId: string, status: 'RECUPERADO' | 'DESCARTADO'): Promise<void> {
    // 1. Actualizar almacén local
    const current = this.getLocalDrafts();
    const filtered = current.filter((d) => d.id !== draftId);
    save('pos_drafts', filtered);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('pezca_pos_drafts_v1', JSON.stringify(filtered));
      }
    } catch {}

    // 2. Notificar a Supabase
    try {
      const supabase = getSupabaseClient();
      if (supabase && draftId.includes('-') && draftId.length >= 32) {
        await supabase.rpc('resolve_pos_draft', {
          p_draft_id: draftId,
          p_nuevo_estado: status,
        });
      }
    } catch (err) {
      console.warn('[PosDraftService] Error resolviendo estado en Supabase:', err);
    }
  }

  /**
   * Sincroniza y descarga pedidos en espera desde Supabase para la empresa activa
   */
  static async fetchRemoteDrafts(): Promise<CartDraft[]> {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return this.getLocalDrafts();

      const { data, error } = await supabase
        .from('pos_drafts')
        .select('*')
        .eq('estado', 'EN_ESPERA')
        .gt('expires_at', new Date().toISOString())
        .order('creado_en', { ascending: false });

      if (error || !data) {
        return this.getLocalDrafts();
      }

      const remoteDrafts: CartDraft[] = data.map((d: any) => ({
        id: d.id,
        alias: d.alias,
        lineas: Array.isArray(d.lineas) ? d.lineas : [],
        descuentoGlobal: Number(d.descuento_global || 0),
        fechaGuardado: d.creado_en,
        total: Number(d.total_estimado || 0),
        cart: [],
      }));

      // Unir evitando duplicados
      const local = this.getLocalDrafts();
      const map = new Map<string, CartDraft>();
      local.forEach((l) => map.set(l.id, l));
      remoteDrafts.forEach((r) => map.set(r.id, r));

      const merged = Array.from(map.values());
      save('pos_drafts', merged);
      return merged;
    } catch {
      return this.getLocalDrafts();
    }
  }
}
