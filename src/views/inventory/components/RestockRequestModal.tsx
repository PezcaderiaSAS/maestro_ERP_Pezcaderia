import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  AlertTriangle,
  X,
  Package,
  Plus,
  Trash2,
  Send,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
  internalTransferService,
  ProductoStockCriticoSugerido,
} from '../../../services/internalTransferService';
import type { Product } from '../../../types/erp.types';
import type { InternalTransferItem } from '../../../../packages/validation-schemas/src/internalTransfer.schema';

interface RestockRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  bodegaDestinoId?: string;
  bodegaDestinoNombre?: string;
  onSuccess?: () => void;
}

export const RestockRequestModal: React.FC<RestockRequestModalProps> = ({
  isOpen,
  onClose,
  products = [],
  bodegaDestinoId = 'bodega-pos',
  bodegaDestinoNombre = 'Punto de Venta Mostrador',
  onSuccess,
}) => {
  const [prioridad, setPrioridad] = useState<'NORMAL' | 'URGENTE' | 'CRITICA'>('URGENTE');
  const [observaciones, setObservaciones] = useState('');
  const [itemsSolicitados, setItemsSolicitados] = useState<InternalTransferItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Obtener productos en stock crítico o bajo calculados
  const sugeridos = useMemo<ProductoStockCriticoSugerido[]>(() => {
    if (!isOpen) return [];
    return internalTransferService.obtenerProductosSugeridosStockBajo(bodegaDestinoId, products);
  }, [isOpen, bodegaDestinoId, products]);

  if (!isOpen) return null;

  // Cargar masivamente los sugeridos críticos con 1 clic
  const handleCargarSugeridos = () => {
    if (sugeridos.length === 0) {
      Swal.fire({
        title: 'Sin productos críticos',
        text: 'Todos los productos se encuentran en niveles de stock óptimos en este punto de venta.',
        icon: 'info',
        background: '#0f172a',
        color: '#f8fafc',
      });
      return;
    }

    const nuevosItems: InternalTransferItem[] = sugeridos.map((s) => ({
      productoId: s.producto.id,
      sku: s.producto.sku || s.producto.id,
      nombre: s.producto.nombre,
      unidadMedida: s.producto.unidadMedida?.toUpperCase() || 'KG',
      cantidadSolicitada: s.cantidadSugeridaKg,
      cantidadDespachada: 0,
      cantidadRecibida: 0,
      costoUnitario: s.producto.precio_compra || s.producto.precio_venta_pos || 0,
      estadoItem: 'PENDIENTE',
    }));

    setItemsSolicitados(nuevosItems);

    Swal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2500,
      icon: 'success',
      title: `${nuevosItems.length} productos sugeridos cargados`,
      background: '#0f172a',
      color: '#f8fafc',
    });
  };

  const handleAgregarProductoManual = (prodId: string) => {
    if (!prodId) return;
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    if (itemsSolicitados.some((i) => i.productoId === prodId)) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        icon: 'warning',
        title: 'Este producto ya está en la lista',
        background: '#0f172a',
        color: '#f8fafc',
      });
      return;
    }

    setItemsSolicitados((prev) => [
      ...prev,
      {
        productoId: prod.id,
        sku: prod.sku || prod.id,
        nombre: prod.nombre,
        unidadMedida: prod.unidadMedida?.toUpperCase() || 'KG',
        cantidadSolicitada: 5,
        cantidadDespachada: 0,
        cantidadRecibida: 0,
        costoUnitario: prod.precio_compra || prod.precio_venta_pos || 0,
        estadoItem: 'PENDIENTE',
      },
    ]);
  };

  const handleUpdateCantidad = (productoId: string, cantidad: number) => {
    setItemsSolicitados((prev) =>
      prev.map((i) =>
        i.productoId === productoId ? { ...i, cantidadSolicitada: Math.max(0.1, cantidad) } : i
      )
    );
  };

  const handleRemoverItem = (productoId: string) => {
    setItemsSolicitados((prev) => prev.filter((i) => i.productoId !== productoId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (itemsSolicitados.length === 0) {
      Swal.fire({
        title: 'Lista vacía',
        text: 'Agregue al menos un producto para solicitar reabastecimiento.',
        icon: 'warning',
        background: '#0f172a',
        color: '#f8fafc',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await internalTransferService.solicitarReabastecimientoPOS({
        bodegaOrigenId: 'bodega-principal',
        bodegaOrigenNombre: 'Cuarto Frío Principal',
        bodegaDestinoId,
        bodegaDestinoNombre,
        prioridad,
        solicitadoPor: 'Encargado Mostrador POS',
        observaciones,
        items: itemsSolicitados,
      });

      if (!res.success || !res.data) {
        throw new Error(res.error || 'Error al enviar solicitud');
      }

      await Swal.fire({
        title: '¡Solicitud Enviada a Bodega!',
        html: `<div class="text-slate-300 text-sm">
          Guía N° <span class="font-mono font-bold text-cyan-400">${res.data.numeroGuia}</span> generada.<br/>
          Bodega Principal ya visualiza el pedido en su tablero para alistamiento y pesaje.
        </div>`,
        icon: 'success',
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#0ea5e9',
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      Swal.fire({
        title: 'Error',
        text: err.message || 'No se pudo crear la solicitud de traslado',
        icon: 'error',
        background: '#0f172a',
        color: '#f8fafc',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalKg = itemsSolicitados.reduce((acc, i) => acc + (i.cantidadSolicitada || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl overflow-hidden">
        {/* Encabezado */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">
                Solicitud de Reabastecimiento a Bodega
              </h2>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                Destino: <span className="text-slate-200 font-semibold">{bodegaDestinoNombre}</span> |
                Origen: <span className="text-slate-200">Cuarto Frío Principal</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Banner de Asistente de Stock Crítico */}
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-amber-300">
                  Asistente Predictivo de Stock Bajo
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Se detectaron{' '}
                  <strong className="text-white font-mono">{sugeridos.length} productos</strong> con
                  existencias por debajo del stock mínimo de seguridad en este POS.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCargarSugeridos}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              ⚡ Cargar Sugeridos con 1 Clic
            </button>
          </div>

          {/* Opciones de la Solicitud */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Nivel de Prioridad
              </label>
              <select
                value={prioridad}
                onChange={(e) => setPrioridad(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500"
              >
                <option value="NORMAL">Normal (Rutina)</option>
                <option value="URGENTE">Urgente (Horas Pico)</option>
                <option value="CRITICA">Crítica (Mostrador Vacío)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Agregar otro producto manual
              </label>
              <div className="flex gap-2">
                <select
                  id="select-prod-manual"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500"
                  defaultValue=""
                  onChange={(e) => {
                    handleAgregarProductoManual(e.target.value);
                    e.target.value = '';
                  }}
                >
                  <option value="" disabled>
                    -- Seleccionar del catálogo general --
                  </option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.sku || p.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tabla de Productos a Solicitar */}
          <div className="rounded-xl border border-white/10 bg-slate-800/40 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 bg-slate-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold text-white">
                  Productos en la Solicitud ({itemsSolicitados.length})
                </span>
              </div>
              <span className="text-xs font-mono text-cyan-400 font-bold">
                Total Solicitado: {totalKg.toFixed(2)} KG
              </span>
            </div>

            {itemsSolicitados.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No hay productos en la solicitud. Utilice el asistente de carga rápida o agregue productos manualmente.
              </div>
            ) : (
              <div className="divide-y divide-white/5 max-h-60 overflow-y-auto">
                {itemsSolicitados.map((item) => (
                  <div
                    key={item.productoId}
                    className="p-3.5 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white text-sm truncate">{item.nombre}</div>
                      <div className="text-xs text-slate-400 font-mono">SKU: {item.sku}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded-lg border border-white/10">
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={item.cantidadSolicitada}
                          onChange={(e) =>
                            handleUpdateCantidad(item.productoId, parseFloat(e.target.value) || 0)
                          }
                          className="w-20 bg-transparent text-right font-mono font-bold text-white text-sm focus:outline-none"
                        />
                        <span className="text-xs text-slate-400 uppercase font-semibold">
                          {item.unidadMedida}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoverItem(item.productoId)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                        title="Eliminar ítem"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Observaciones o requerimientos especiales para Bodega
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej. Priorizar trucha grande para pedidos de mediodía, verificar hielo en canastillas..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-800/40 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {itemsSolicitados.length} ítems listos para despacho
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isSubmitting || itemsSolicitados.length === 0}
              onClick={handleSubmit}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Enviando...' : 'Enviar Solicitud a Bodega'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
