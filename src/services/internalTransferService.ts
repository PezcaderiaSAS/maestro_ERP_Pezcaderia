import { getSupabaseClient } from '../lib/supabase';
import { load, save } from './localDb';
import {
  CreateInternalTransferRequest,
  CreateInternalTransferRequestSchema,
  DispatchInternalTransfer,
  DispatchInternalTransferSchema,
  ReceiveInternalTransferChecklist,
  ReceiveInternalTransferChecklistSchema,
  InternalTransferItem,
} from '../../packages/validation-schemas/src/internalTransfer.schema';
import {
  registrarSalida,
  registrarEntrada,
  registrarMovimientoKardex,
  validarStock,
} from './inventoryService';
import type { Product } from '../types/erp.types';

export interface InternalTransferRecord {
  id: string;
  numeroGuia: string;
  bodegaOrigenId: string;
  bodegaOrigenNombre: string;
  bodegaDestinoId: string;
  bodegaDestinoNombre: string;
  prioridad: 'NORMAL' | 'URGENTE' | 'CRITICA';
  estado: 'SOLICITADO' | 'EN_ALISTAMIENTO' | 'EN_TRANSITO' | 'RECIBIDO' | 'RECIBIDO_CON_NOVEDAD' | 'CANCELADO';
  solicitadoPor: string;
  despachadoPor?: string;
  recibidoPor?: string;
  temperaturaDespachoC?: number;
  pesoSolitadoTotalKg: number;
  pesoDespachadoTotalKg: number;
  pesoRecibidoTotalKg: number;
  tieneNovedades: boolean;
  observaciones?: string;
  observacionesDespacho?: string;
  observacionesRecepcion?: string;
  items: InternalTransferItem[];
  creadoEn: string;
  despachadoEn?: string;
  recibidoEn?: string;
}

export interface ProductoStockCriticoSugerido {
  producto: Product;
  stockActual: number;
  stockMinimo: number;
  stockSeguridad: number;
  stockMaximo: number;
  cantidadSugeridaKg: number;
  estadoNivel: 'CRITICO' | 'BAJO' | 'OPTIMO';
}

const STORAGE_KEY = 'internal_transfers_v2';

export const internalTransferService = {
  /**
   * Obtiene todos los traslados internos almacenados
   */
  obtenerTraslados(): InternalTransferRecord[] {
    const list = load<InternalTransferRecord[]>(STORAGE_KEY, []);
    return list.sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime());
  },

  /**
   * Identifica productos en stock crítico o bajo en la bodega de destino (POS)
   * y calcula la cantidad sugerida para reabastecimiento masivo en 1 clic.
   */
  obtenerProductosSugeridosStockBajo(
    bodegaDestinoId: string = 'bodega-pos',
    catalogo: Product[] = []
  ): ProductoStockCriticoSugerido[] {
    const stockDict = load<Record<string, Record<string, number>>>('stock', {});
    const stockBodega = stockDict[bodegaDestinoId] || {};

    const sugeridos: ProductoStockCriticoSugerido[] = [];

    for (const prod of catalogo) {
      if (prod.activo === false) continue;
      const sku = prod.sku || prod.id;
      const stockActual = stockBodega[sku] ?? stockBodega[prod.id] ?? 0;
      const stockMinimo = (prod as any).stock_minimo || prod.buffer_seguridad || 5;
      const stockSeguridad = (prod as any).stock_seguridad || Math.round(stockMinimo * 0.5);
      const stockMaximo = (prod as any).stock_maximo || 30;

      let estadoNivel: 'CRITICO' | 'BAJO' | 'OPTIMO' = 'OPTIMO';
      if (stockActual <= stockSeguridad) {
        estadoNivel = 'CRITICO';
      } else if (stockActual <= stockMinimo) {
        estadoNivel = 'BAJO';
      }

      if (estadoNivel !== 'OPTIMO') {
        const cantidadSugeridaKg = Math.max(1, Math.round((stockMaximo - stockActual) * 10) / 10);
        sugeridos.push({
          producto: prod,
          stockActual,
          stockMinimo,
          stockSeguridad,
          stockMaximo,
          cantidadSugeridaKg,
          estadoNivel,
        });
      }
    }

    // Ordenar primero los más críticos
    return sugeridos.sort((a, b) => {
      if (a.estadoNivel === 'CRITICO' && b.estadoNivel !== 'CRITICO') return -1;
      if (b.estadoNivel === 'CRITICO' && a.estadoNivel !== 'CRITICO') return 1;
      return a.stockActual - b.stockActual;
    });
  },

  /**
   * Crea una nueva solicitud de reabastecimiento desde POS hacia Bodega Principal
   */
  async solicitarReabastecimientoPOS(
    input: CreateInternalTransferRequest
  ): Promise<{ success: boolean; data?: InternalTransferRecord; error?: string }> {
    try {
      const validated = CreateInternalTransferRequestSchema.parse(input);
      const traslados = this.obtenerTraslados();

      const correlativo = (traslados.length + 1).toString().padStart(3, '0');
      const fechaHoy = new Date().toISOString().slice(2, 10).replace(/-/g, '');
      const numeroGuia = `TRF-${fechaHoy}-${correlativo}`;
      const id = crypto.randomUUID?.() || `trf-${Date.now()}`;

      const pesoSolicitado = validated.items.reduce((acc, i) => acc + i.cantidadSolicitada, 0);

      const itemsConEstado: InternalTransferItem[] = validated.items.map((i) => ({
        ...i,
        id: i.id || crypto.randomUUID?.() || `item-${Date.now()}-${Math.random()}`,
        cantidadDespachada: 0,
        cantidadRecibida: 0,
        estadoItem: 'PENDIENTE',
      }));

      const nuevoTraslado: InternalTransferRecord = {
        id,
        numeroGuia,
        bodegaOrigenId: validated.bodegaOrigenId,
        bodegaOrigenNombre: validated.bodegaOrigenNombre || 'Cuarto Frío Principal',
        bodegaDestinoId: validated.bodegaDestinoId,
        bodegaDestinoNombre: validated.bodegaDestinoNombre || 'Punto de Venta Mostrador',
        prioridad: validated.prioridad,
        estado: 'SOLICITADO',
        solicitadoPor: validated.solicitadoPor,
        pesoSolitadoTotalKg: Math.round(pesoSolicitado * 1000) / 1000,
        pesoDespachadoTotalKg: 0,
        pesoRecibidoTotalKg: 0,
        tieneNovedades: false,
        observaciones: validated.observaciones,
        items: itemsConEstado,
        creadoEn: new Date().toISOString(),
      };

      // Persistir en localDb
      traslados.unshift(nuevoTraslado);
      save(STORAGE_KEY, traslados);

      // Intentar sincronizar con Supabase RPC
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await supabase.rpc('fn_crear_solicitud_traslado_pos', {
            p_bodega_origen_id: validated.bodegaOrigenId,
            p_bodega_origen_nombre: nuevoTraslado.bodegaOrigenNombre,
            p_bodega_destino_id: validated.bodegaDestinoId,
            p_bodega_destino_nombre: nuevoTraslado.bodegaDestinoNombre,
            p_prioridad: validated.prioridad,
            p_solicitado_por: validated.solicitadoPor,
            p_observaciones: validated.observaciones || null,
            p_items: validated.items,
          });
        } catch (sbErr) {
          console.warn('[InternalTransferService] Sync Supabase opcional fallback a localDb:', sbErr);
        }
      }

      return { success: true, data: nuevoTraslado };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al crear solicitud de reabastecimiento' };
    }
  },

  /**
   * Pasa un traslado a estado EN_ALISTAMIENTO en Bodega Principal
   */
  iniciarAlistamiento(trasladoId: string, operarioBodega: string): { success: boolean; error?: string } {
    const traslados = this.obtenerTraslados();
    const idx = traslados.findIndex((t) => t.id === trasladoId);
    if (idx === -1) return { success: false, error: 'Traslado no encontrado' };

    traslados[idx].estado = 'EN_ALISTAMIENTO';
    traslados[idx].despachadoPor = operarioBodega;
    save(STORAGE_KEY, traslados);
    return { success: true };
  },

  /**
   * Despacha el traslado desde Bodega Principal hacia POS con pesaje real y lotes FEFO
   */
  despacharTraslado(
    input: DispatchInternalTransfer
  ): { success: boolean; data?: InternalTransferRecord; error?: string } {
    try {
      const validated = DispatchInternalTransferSchema.parse(input);
      const traslados = this.obtenerTraslados();
      const idx = traslados.findIndex((t) => t.id === validated.trasladoId);
      if (idx === -1) return { success: false, error: 'Guía de traslado no encontrada' };

      const traslado = traslados[idx];
      let totalDespachado = 0;

      // Validar y aplicar alistamiento por cada ítem
      for (const despItem of validated.itemsDespachados) {
        const itemIdx = traslado.items.findIndex((i) => i.productoId === despItem.productoId);
        if (itemIdx !== -1) {
          traslado.items[itemIdx].cantidadDespachada = despItem.cantidadDespachada;
          traslado.items[itemIdx].loteFefo = despItem.loteFefo;
          traslado.items[itemIdx].fechaVencimientoLote = despItem.fechaVencimientoLote;
          traslado.items[itemIdx].temperaturaC = despItem.temperaturaC;
          traslado.items[itemIdx].estadoItem = despItem.cantidadDespachada > 0 ? 'ALISTADO' : 'FALTANTE_ORIGEN';
          if (despItem.novedadMotivo) {
            traslado.items[itemIdx].novedadMotivo = despItem.novedadMotivo;
            traslado.items[itemIdx].novedadDetalle = despItem.novedadDetalle;
          }
          totalDespachado += despItem.cantidadDespachada;

          // Descontar preventivamente de Bodega Origen
          if (despItem.cantidadDespachada > 0) {
            registrarSalida({
              bodegaId: traslado.bodegaOrigenId,
              productoId: despItem.productoId,
              cantidad: despItem.cantidadDespachada,
              referenciaId: `despacho-trf-${traslado.numeroGuia}`,
            });
          }
        }
      }

      traslado.estado = 'EN_TRANSITO';
      traslado.despachadoPor = validated.despachadoPor;
      traslado.temperaturaDespachoC = validated.temperaturaSalidaC;
      traslado.pesoDespachadoTotalKg = Math.round(totalDespachado * 1000) / 1000;
      traslado.despachadoEn = new Date().toISOString();
      if (validated.observacionesDespacho) {
        traslado.observacionesDespacho = validated.observacionesDespacho;
      }

      save(STORAGE_KEY, traslados);
      return { success: true, data: traslado };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al despachar traslado' };
    }
  },

  /**
   * Confirma la recepción en POS mediante checklist interactivo ítem por ítem.
   * Si hay novedades o faltantes, se exige detalle y se asienta el stock definitivo en POS.
   */
  async confirmarRecepcionChecklistPOS(
    input: ReceiveInternalTransferChecklist
  ): Promise<{ success: boolean; data?: InternalTransferRecord; error?: string }> {
    try {
      const validated = ReceiveInternalTransferChecklistSchema.parse(input);
      const traslados = this.obtenerTraslados();
      const idx = traslados.findIndex((t) => t.id === validated.trasladoId);
      if (idx === -1) return { success: false, error: 'Guía de traslado no encontrada' };

      const traslado = traslados[idx];
      let totalRecibido = 0;
      let tieneNovedades = false;

      for (const recItem of validated.itemsVerificados) {
        const itemIdx = traslado.items.findIndex((i) => i.productoId === recItem.productoId);
        if (itemIdx !== -1) {
          const item = traslado.items[itemIdx];
          item.cantidadRecibida = recItem.cantidadRecibida;
          item.novedadMotivo = recItem.novedadMotivo;
          item.novedadDetalle = recItem.novedadDetalle;

          if (!recItem.conforme || Math.abs(recItem.cantidadRecibida - recItem.cantidadDespachadaOriginal) > 0.001) {
            tieneNovedades = true;
            item.estadoItem = 'RECIBIDO_DISCREPANCIA';
          } else {
            item.estadoItem = 'RECIBIDO_OK';
          }

          totalRecibido += recItem.cantidadRecibida;

          // Incrementar stock en Bodega Destino (POS) únicamente por la cantidad recibida conforme
          if (recItem.cantidadRecibida > 0) {
            registrarEntrada({
              bodegaId: traslado.bodegaDestinoId,
              productoId: recItem.productoId,
              cantidad: recItem.cantidadRecibida,
              referenciaId: `recepcion-trf-${traslado.numeroGuia}`,
            });

            // Asientos inmutables en Kardex
            registrarMovimientoKardex({
              producto_id: item.productoId,
              sku: item.sku,
              nombre_producto: item.nombre,
              tipo_movimiento: 'SALIDA_TRASLADO',
              cantidad_kg: item.cantidadDespachada,
              costo_unitario: item.costoUnitario,
              costo_total: Math.round(item.cantidadDespachada * item.costoUnitario),
              documento_referencia: traslado.numeroGuia,
              usuario_responsable: traslado.despachadoPor || 'Bodega Central',
              bodega_id: traslado.bodegaOrigenId,
              bodega_nombre: traslado.bodegaOrigenNombre,
              notas: `Traslado despachado a ${traslado.bodegaDestinoNombre}. Lote: ${item.loteFefo || 'S/L'}`,
            });

            registrarMovimientoKardex({
              producto_id: item.productoId,
              sku: item.sku,
              nombre_producto: item.nombre,
              tipo_movimiento: 'ENTRADA_TRASLADO',
              cantidad_kg: recItem.cantidadRecibida,
              costo_unitario: item.costoUnitario,
              costo_total: Math.round(recItem.cantidadRecibida * item.costoUnitario),
              documento_referencia: traslado.numeroGuia,
              usuario_responsable: validated.recibidoPor,
              bodega_id: traslado.bodegaDestinoId,
              bodega_nombre: traslado.bodegaDestinoNombre,
              notas: `Recepción en POS. ${recItem.novedadDetalle ? `Novedad: ${recItem.novedadDetalle}` : 'Conforme'}`,
            });
          }
        }
      }

      traslado.estado = tieneNovedades ? 'RECIBIDO_CON_NOVEDAD' : 'RECIBIDO';
      traslado.recibidoPor = validated.recibidoPor;
      traslado.pesoRecibidoTotalKg = Math.round(totalRecibido * 1000) / 1000;
      traslado.tieneNovedades = tieneNovedades;
      traslado.recibidoEn = new Date().toISOString();
      if (validated.observacionesRecepcion) {
        traslado.observacionesRecepcion = validated.observacionesRecepcion;
      }

      save(STORAGE_KEY, traslados);

      // Sincronizar en Supabase si está disponible
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await supabase.rpc('fn_confirmar_recepcion_traslado_pos', {
            p_traslado_id: traslado.id,
            p_recibido_por: validated.recibidoPor,
            p_items_recepcion: validated.itemsVerificados,
            p_observaciones_recepcion: validated.observacionesRecepcion || null,
          });
        } catch (sbErr) {
          console.warn('[InternalTransferService] Sync Supabase opcional fallback a localDb:', sbErr);
        }
      }

      return { success: true, data: traslado };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al confirmar recepción en POS' };
    }
  },
};
