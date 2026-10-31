// src/services/supabaseRealtimePreventasService.ts
// Servicio Central de Suscripción Resiliente de Canales Supabase Realtime (SPEC-045: TASK-045-02)

import { getSupabaseClient } from '../lib/supabase';
import type {
  RealtimePreventaEvent,
  RealtimeBroadcastPulse,
} from '../schemas/realtimePreventa.schema';
import { validateRealtimePreventaEvent } from '../schemas/realtimePreventa.schema';

export type RealtimeChannelStatus =
  | 'CONNECTING'
  | 'SUBSCRIBED'
  | 'CLOSED'
  | 'CHANNEL_ERROR'
  | 'TIMED_OUT';

export interface RealtimeSubscriptionCallbacks {
  onInsert?: (event: RealtimePreventaEvent) => void;
  onUpdate?: (event: RealtimePreventaEvent) => void;
  onDelete?: (event: RealtimePreventaEvent) => void;
  onPulse?: (pulse: RealtimeBroadcastPulse) => void;
  onStatusChange?: (status: RealtimeChannelStatus) => void;
}

interface TenantChannelContext {
  channelName: string;
  channel: any;
  status: RealtimeChannelStatus;
  subscribers: Set<RealtimeSubscriptionCallbacks>;
}

export class SupabaseRealtimePreventasService {
  private isMockMode: boolean;
  private tenantChannels = new Map<string, TenantChannelContext>();

  constructor(options?: { isMockMode?: boolean }) {
    this.isMockMode =
      options?.isMockMode ??
      (typeof process !== 'undefined' && process.env.NODE_ENV === 'test');
  }

  /**
   * Suscribe a los eventos en tiempo real de preventas para un tenant específico.
   * Retorna una función de desuscripción y utiliza conteo de referencias para evitar duplicados.
   */
  public async subscribe(
    tenantId: string,
    callbacks: RealtimeSubscriptionCallbacks
  ): Promise<() => void> {
    if (!tenantId) {
      throw new Error('tenantId es obligatorio para suscribir a Realtime');
    }

    let ctx = this.tenantChannels.get(tenantId);

    if (!ctx) {
      const channelName = `realtime:preventas:${tenantId}`;
      ctx = {
        channelName,
        channel: null,
        status: 'CONNECTING',
        subscribers: new Set(),
      };
      this.tenantChannels.set(tenantId, ctx);
      ctx.subscribers.add(callbacks);
      await this.initChannel(tenantId, ctx);
    } else {
      ctx.subscribers.add(callbacks);
    }

    // Notificar estado actual inmediatamente al nuevo suscriptor
    callbacks.onStatusChange?.(ctx.status);

    return () => {
      this.unsubscribe(tenantId, callbacks);
    };
  }

  /**
   * Alias de conveniencia para suscripción reactiva estructurada
   */
  public async suscribirPreventas(params: {
    tenantId: string;
    onInsert?: (event: RealtimePreventaEvent) => void;
    onUpdate?: (event: RealtimePreventaEvent) => void;
    onDelete?: (event: RealtimePreventaEvent) => void;
    onPulse?: (pulse: RealtimeBroadcastPulse) => void;
    onStatusChange?: (status: RealtimeChannelStatus) => void;
  }): Promise<() => void> {
    const { tenantId, ...callbacks } = params;
    return this.subscribe(tenantId, callbacks);
  }

  /**
   * Desuscribe un suscriptor y desmonta el canal si ya no quedan escuchas activas
   */
  public unsubscribe(tenantId: string, callbacks: RealtimeSubscriptionCallbacks): void {
    const ctx = this.tenantChannels.get(tenantId);
    if (!ctx) return;

    ctx.subscribers.delete(callbacks);

    if (ctx.subscribers.size === 0) {
      if (ctx.channel && typeof ctx.channel.unsubscribe === 'function') {
        try {
          ctx.channel.unsubscribe();
        } catch {}
      }
      this.tenantChannels.delete(tenantId);
    }
  }

  /**
   * Verifica si el WebSocket está en estado saludable activo (SUBSCRIBED)
   */
  public isWebSocketActive(tenantId: string): boolean {
    const ctx = this.tenantChannels.get(tenantId);
    return ctx ? ctx.status === 'SUBSCRIBED' : false;
  }

  /**
   * Determina si la UI debe activar sondeo degradado de respaldo (heartbeat)
   */
  public shouldFallbackToPolling(tenantId: string): boolean {
    return !this.isWebSocketActive(tenantId);
  }

  /**
   * Cantidad de suscriptores activos en el tenant
   */
  public getActiveSubscriberCount(tenantId: string): number {
    return this.tenantChannels.get(tenantId)?.subscribers.size ?? 0;
  }

  /**
   * Retorna true si existe un canal instanciado para el tenant
   */
  public hasActiveChannel(tenantId: string): boolean {
    return this.tenantChannels.has(tenantId);
  }

  /**
   * Emite un pulso broadcast ultra-rápido para todos los clientes conectados al tenant
   */
  public async broadcastPulse(pulse: RealtimeBroadcastPulse): Promise<boolean> {
    const ctx = this.tenantChannels.get(pulse.tenantId);
    if (!ctx) return false;

    if (this.isMockMode) {
      this.notifySubscribers(pulse.tenantId, (cb) => cb.onPulse?.(pulse));
      return true;
    }

    if (ctx.channel && typeof ctx.channel.send === 'function') {
      try {
        await ctx.channel.send({
          type: 'broadcast',
          event: 'BROADCAST_TICKET_PULSE',
          payload: pulse,
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * Emite un evento completo de preventa
   */
  public async broadcastEvent(event: RealtimePreventaEvent): Promise<boolean> {
    const ctx = this.tenantChannels.get(event.tenantId);
    if (!ctx) return false;

    if (this.isMockMode) {
      this.dispatchParsedEvent(event.tenantId, event);
      return true;
    }

    if (ctx.channel && typeof ctx.channel.send === 'function') {
      try {
        await ctx.channel.send({
          type: 'broadcast',
          event: event.eventType,
          payload: event,
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * Métodos utilitarios para simulación determinista en pruebas TDD y modo Mock
   */
  public simulateIncomingEvent(tenantId: string, event: RealtimePreventaEvent): void {
    if (event.tenantId !== tenantId) {
      // Ignorar eventos que pertenezcan a otro tenant para seguridad multi-tenant
      return;
    }
    this.dispatchParsedEvent(tenantId, event);
  }

  public simulateStatusChange(tenantId: string, status: RealtimeChannelStatus): void {
    const ctx = this.tenantChannels.get(tenantId);
    if (!ctx) return;
    ctx.status = status;
    this.notifySubscribers(tenantId, (cb) => cb.onStatusChange?.(status));
  }

  public cleanupAll(): void {
    for (const [, ctx] of this.tenantChannels) {
      if (ctx.channel && typeof ctx.channel.unsubscribe === 'function') {
        try {
          ctx.channel.unsubscribe();
        } catch {}
      }
    }
    this.tenantChannels.clear();
  }

  // ─ Métodos Privados ─────────────────────────────────────────────────────────────

  private async initChannel(tenantId: string, ctx: TenantChannelContext): Promise<void> {
    if (this.isMockMode) {
      // Modo Mock determinista para Vitest
      ctx.status = 'SUBSCRIBED';
      ctx.channel = {
        unsubscribe: () => {
          ctx.status = 'CLOSED';
        },
        send: async () => ({}),
      };
      return;
    }

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        ctx.status = 'CHANNEL_ERROR';
        return;
      }

      const channel = supabase.channel(ctx.channelName);

      // 1. Escuchar eventos broadcast de baja latencia (<50ms)
      channel
        .on('broadcast', { event: 'BROADCAST_TICKET_PULSE' }, (payload: any) => {
          if (payload?.payload?.tenantId === tenantId) {
            this.notifySubscribers(tenantId, (cb) => cb.onPulse?.(payload.payload));
          }
        })
        .on('broadcast', { event: 'INSERT_PREVENTA' }, (payload: any) => {
          this.handleRawPayload(tenantId, payload?.payload);
        })
        .on('broadcast', { event: 'UPDATE_ESTADO_PREVENTA' }, (payload: any) => {
          this.handleRawPayload(tenantId, payload?.payload);
        })
        .on('broadcast', { event: 'DELETE_PREVENTA' }, (payload: any) => {
          this.handleRawPayload(tenantId, payload?.payload);
        });

      // 2. Escuchar cambios de base de datos CDC (postgres_changes)
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prefacturas',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload: any) => {
          this.handlePostgresChanges(tenantId, payload);
        }
      );

      // 3. Suscripción con manejo de estados
      channel.subscribe((status: string) => {
        let mappedStatus: RealtimeChannelStatus = 'CONNECTING';
        if (status === 'SUBSCRIBED') mappedStatus = 'SUBSCRIBED';
        else if (status === 'CLOSED') mappedStatus = 'CLOSED';
        else if (status === 'CHANNEL_ERROR') mappedStatus = 'CHANNEL_ERROR';
        else if (status === 'TIMED_OUT') mappedStatus = 'TIMED_OUT';

        ctx.status = mappedStatus;
        this.notifySubscribers(tenantId, (cb) => cb.onStatusChange?.(mappedStatus));
      });

      ctx.channel = channel;
    } catch {
      ctx.status = 'CHANNEL_ERROR';
      this.notifySubscribers(tenantId, (cb) => cb.onStatusChange?.('CHANNEL_ERROR'));
    }
  }

  private handleRawPayload(tenantId: string, raw: unknown): void {
    const validated = validateRealtimePreventaEvent(raw);
    if (validated.ok && validated.data && validated.data.tenantId === tenantId) {
      this.dispatchParsedEvent(tenantId, validated.data);
    }
  }

  private handlePostgresChanges(tenantId: string, payload: any): void {
    const { eventType, new: newRec, old: oldRec } = payload;
    const rec = newRec || oldRec;
    if (!rec) return;

    let event: RealtimePreventaEvent;
    if (eventType === 'INSERT') {
      event = {
        eventType: 'INSERT_PREVENTA',
        tenantId,
        prefacturaId: rec.id,
        codigoPreventa: rec.codigo_preventa || rec.codigoPreventa || 'PRE-TEMP',
        vendedorId: rec.vendedor_id || rec.vendedorId || 'unknown',
        vendedorNombre: rec.vendedor_nombre || rec.vendedorNombre || 'Vendedor',
        terminalId: rec.terminal_id || rec.terminalId || 'POS',
        clienteDocumento: rec.cliente_documento || rec.clienteDocumento,
        clienteNombre: rec.cliente_nombre || rec.clienteNombre,
        estado: rec.estado || 'PENDIENTE_COBRO',
        total: Number(rec.total || 0),
        itemsCount: Number(rec.items_count || rec.itemsCount || 1),
        timestamp: rec.created_at || new Date().toISOString(),
      };
      this.dispatchParsedEvent(tenantId, event);
    } else if (eventType === 'UPDATE') {
      event = {
        eventType: 'UPDATE_ESTADO_PREVENTA',
        tenantId,
        prefacturaId: rec.id,
        codigoPreventa: rec.codigo_preventa || rec.codigoPreventa || 'PRE-TEMP',
        vendedorId: rec.vendedor_id || rec.vendedorId || 'unknown',
        vendedorNombre: rec.vendedor_nombre || rec.vendedorNombre || 'Vendedor',
        terminalId: rec.terminal_id || rec.terminalId || 'POS',
        cajeroId: rec.cajero_id || rec.cajeroId,
        cajeroNombre: rec.cajero_nombre || rec.cajeroNombre,
        estado: rec.estado,
        total: Number(rec.total || 0),
        itemsCount: Number(rec.items_count || rec.itemsCount || 1),
        timestamp: rec.updated_at || new Date().toISOString(),
      };
      this.dispatchParsedEvent(tenantId, event);
    } else if (eventType === 'DELETE') {
      event = {
        eventType: 'DELETE_PREVENTA',
        tenantId,
        prefacturaId: rec.id,
        codigoPreventa: rec.codigo_preventa || rec.codigoPreventa || '',
        vendedorId: rec.vendedor_id || rec.vendedorId || '',
        vendedorNombre: rec.vendedor_nombre || rec.vendedorNombre || '',
        terminalId: rec.terminal_id || rec.terminalId || '',
        estado: 'ANULADA',
        total: Number(rec.total || 0),
        itemsCount: 0,
        timestamp: new Date().toISOString(),
      };
      this.dispatchParsedEvent(tenantId, event);
    }
  }

  private dispatchParsedEvent(tenantId: string, event: RealtimePreventaEvent): void {
    if (event.eventType === 'INSERT_PREVENTA') {
      this.notifySubscribers(tenantId, (cb) => cb.onInsert?.(event));
    } else if (event.eventType === 'UPDATE_ESTADO_PREVENTA') {
      this.notifySubscribers(tenantId, (cb) => cb.onUpdate?.(event));
    } else if (event.eventType === 'DELETE_PREVENTA') {
      this.notifySubscribers(tenantId, (cb) => cb.onDelete?.(event));
    }
  }

  private notifySubscribers(
    tenantId: string,
    action: (callbacks: RealtimeSubscriptionCallbacks) => void
  ): void {
    const ctx = this.tenantChannels.get(tenantId);
    if (!ctx) return;
    for (const cb of ctx.subscribers) {
      try {
        action(cb);
      } catch (err) {
        console.error('Error en suscriptor Realtime:', err);
      }
    }
  }
}

// Instancia singleton por defecto para la aplicación
export const supabaseRealtimePreventasService = new SupabaseRealtimePreventasService();
