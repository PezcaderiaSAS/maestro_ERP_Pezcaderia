import React, { useState } from 'react';
import {
  Scale,
  X,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Thermometer,
  ShieldAlert,
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
  internalTransferService,
  InternalTransferRecord,
} from '../../../services/internalTransferService';
import type { ItemDespachoSchema } from '../../../../packages/validation-schemas/src/internalTransfer.schema';
import { z } from 'zod';

interface TransferPickingModalProps {
  isOpen: boolean;
  onClose: () => void;
  traslado: InternalTransferRecord | null;
  onSuccess?: () => void;
}

type ItemDespachoForm = z.infer<typeof ItemDespachoSchema>;

export const TransferPickingModal: React.FC<TransferPickingModalProps> = ({
  isOpen,
  onClose,
  traslado,
  onSuccess,
}) => {
  if (!isOpen || !traslado) return null;

  const [despachadoPor, setDespachadoPor] = useState('Bodeguero Central');
  const [temperaturaSalidaC, setTemperaturaSalidaC] = useState<number>(2.0);
  const [observacionesDespacho, setObservacionesDespacho] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializar estado de alistamiento por cada ítem
  const [itemsDespacho, setItemsDespacho] = useState<Record<string, ItemDespachoForm>>(() => {
    const map: Record<string, ItemDespachoForm> = {};
    const hoy = new Date();
    const vencimientoDefault = new Date(hoy.setDate(hoy.getDate() + 7))
      .toISOString()
      .split('T')[0];

    traslado.items.forEach((item, idx) => {
      map[item.productoId] = {
        productoId: item.productoId,
        cantidadDespachada: item.cantidadSolicitada, // Sugerido inicial el solicitado
        loteFefo: item.loteFefo || `LOT-PZ-${hoy.getFullYear()}-${(idx + 1).toString().padStart(2, '0')}`,
        fechaVencimientoLote: item.fechaVencimientoLote || vencimientoDefault,
        temperaturaC: 2.0,
      };
    });
    return map;
  });

  const handleUpdateItem = (productoId: string, patch: Partial<ItemDespachoForm>) => {
    setItemsDespacho((prev) => ({
      ...prev,
      [productoId]: {
        ...prev[productoId],
        ...patch,
      },
    }));
  };

  const handleMarcarFaltante = (productoId: string) => {
    handleUpdateItem(productoId, {
      cantidadDespachada: 0,
      novedadMotivo: 'AGOTADO_BODEGA',
      novedadDetalle: 'Sin existencias disponibles en Cuarto Frío Principal',
    });
  };

  const handleSubmitDespacho = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que todos los items con cantidad > 0 tengan lote FEFO
    const listaDespacho = Object.values(itemsDespacho);
    for (const item of listaDespacho) {
      if (item.cantidadDespachada > 0 && (!item.loteFefo || item.loteFefo.trim() === '')) {
        Swal.fire({
          title: 'Lote FEFO Obligatorio',
          text: 'Todos los productos a despachar deben tener registrado un Lote FEFO para trazabilidad de cadena de frío.',
          icon: 'warning',
          background: '#0f172a',
          color: '#f8fafc',
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = internalTransferService.despacharTraslado({
        trasladoId: traslado.id,
        despachadoPor,
        temperaturaSalidaC,
        itemsDespachados: listaDespacho,
        observacionesDespacho,
      });

      if (!res.success) {
        throw new Error(res.error || 'Error al despachar traslado');
      }

      await Swal.fire({
        title: '¡Despacho Exitoso!',
        html: `<div class="text-slate-300 text-sm">
          Guía N° <span class="font-mono font-bold text-cyan-400">${traslado.numeroGuia}</span> en tránsito hacia <strong class="text-white">${traslado.bodegaDestinoNombre}</strong>.<br/>
          Stock preventivo descontado en bodega central.
        </div>`,
        icon: 'success',
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#10b981',
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      Swal.fire({
        title: 'Error de Despacho',
        text: err.message || 'No se pudo completar el despacho',
        icon: 'error',
        background: '#0f172a',
        color: '#f8fafc',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalDespachadoKg = Object.values(itemsDespacho).reduce(
    (acc, i) => acc + (Number(i.cantidadDespachada) || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl overflow-hidden">
        {/* Encabezado */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Scale className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">
                Alistamiento y Pesaje de Báscula (Bodega Principal)
              </h2>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                Guía: <span className="font-mono text-cyan-400 font-bold">{traslado.numeroGuia}</span> |
                Destino: <span className="text-slate-200">{traslado.bodegaDestinoNombre}</span> |
                Prioridad: <span className="text-amber-400 font-semibold">{traslado.prioridad}</span>
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

        {/* Formulario */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata de Despacho */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-800/40 border border-white/10">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Responsable de Bodega (Despachador)
              </label>
              <input
                type="text"
                value={despachadoPor}
                onChange={(e) => setDespachadoPor(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                Temperatura de Salida (°C)
              </label>
              <input
                type="number"
                step="0.1"
                value={temperaturaSalidaC}
                onChange={(e) => setTemperaturaSalidaC(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Total a Despachar
              </label>
              <div className="px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-emerald-400 font-mono font-bold text-sm">
                {totalDespachadoKg.toFixed(2)} KG
              </div>
            </div>
          </div>

          {/* Lista de Ítems a Pesar */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-400" />
              Pesaje Real por Ítem y Asignación de Lotes FEFO
            </h4>

            <div className="space-y-3">
              {traslado.items.map((item) => {
                const desp = itemsDespacho[item.productoId] || {
                  productoId: item.productoId,
                  cantidadDespachada: item.cantidadSolicitada,
                  loteFefo: '',
                };

                const estaAgotado = desp.cantidadDespachada === 0;

                return (
                  <div
                    key={item.productoId}
                    className={`p-4 rounded-xl border transition-all ${
                      estaAgotado
                        ? 'border-rose-500/30 bg-rose-500/5'
                        : 'border-white/10 bg-slate-800/40'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                      <div>
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          {item.nombre}
                          <span className="text-xs font-mono text-cyan-400">({item.sku})</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Solicitado por POS:{' '}
                          <strong className="text-slate-200 font-mono">
                            {item.cantidadSolicitada} {item.unidadMedida}
                          </strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {estaAgotado ? (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30 flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5" /> Marcado Sin Stock
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleMarcarFaltante(item.productoId)}
                            className="text-xs px-2.5 py-1 rounded-lg border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 transition-colors"
                          >
                            Marcar Agotado / Faltante
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Cantidad Alistada Real */}
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                          Peso Báscula Real ({item.unidadMedida})
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={desp.cantidadDespachada}
                          onChange={(e) =>
                            handleUpdateItem(item.productoId, {
                              cantidadDespachada: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900/90 border border-white/10 text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      {/* Lote FEFO */}
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                          Lote FEFO Obligatorio
                        </label>
                        <input
                          type="text"
                          placeholder="Ej. LOT-2026-TRU01"
                          value={desp.loteFefo || ''}
                          disabled={estaAgotado}
                          onChange={(e) =>
                            handleUpdateItem(item.productoId, {
                              loteFefo: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900/90 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                        />
                      </div>

                      {/* Fecha Vencimiento */}
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                          Vencimiento Lote
                        </label>
                        <input
                          type="date"
                          value={desp.fechaVencimientoLote || ''}
                          disabled={estaAgotado}
                          onChange={(e) =>
                            handleUpdateItem(item.productoId, {
                              fechaVencimientoLote: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900/90 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Observaciones Despacho */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Observaciones de Salida de Bodega
            </label>
            <textarea
              value={observacionesDespacho}
              onChange={(e) => setObservacionesDespacho(e.target.value)}
              placeholder="Ej. Se despacha en 3 canastillas selladas con precinto azul..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-800/40 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Total a Despachar:{' '}
            <strong className="text-emerald-400 font-mono">{totalDespachadoKg.toFixed(2)} KG</strong>
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
              disabled={isSubmitting || totalDespachadoKg <= 0}
              onClick={handleSubmitDespacho}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <Truck className="w-4 h-4" />
              {isSubmitting ? 'Despachando...' : 'Completar Alistamiento y Despachar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
