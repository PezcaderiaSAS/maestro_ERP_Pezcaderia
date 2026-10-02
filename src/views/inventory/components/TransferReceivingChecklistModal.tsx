import React, { useState } from 'react';
import {
  CheckSquare,
  X,
  AlertTriangle,
  CheckCircle2,
  PackageCheck,
  ShieldAlert,
  Thermometer,
  FileText,
  Building2,
  Scale,
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
  internalTransferService,
  InternalTransferRecord,
} from '../../../services/internalTransferService';
import type { ItemRecepcionChecklistSchema } from '../../../../packages/validation-schemas/src/internalTransfer.schema';
import { z } from 'zod';

interface TransferReceivingChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  traslado: InternalTransferRecord | null;
  onSuccess?: () => void;
}

type ItemRecepcionForm = z.infer<typeof ItemRecepcionChecklistSchema>;

export const TransferReceivingChecklistModal: React.FC<TransferReceivingChecklistModalProps> = ({
  isOpen,
  onClose,
  traslado,
  onSuccess,
}) => {
  if (!isOpen || !traslado) return null;

  const [recibidoPor, setRecibidoPor] = useState('Cajero Mostrador POS');
  const [observacionesRecepcion, setObservacionesRecepcion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializar estado del checklist de recepción
  const [itemsChecklist, setItemsChecklist] = useState<Record<string, ItemRecepcionForm>>(() => {
    const map: Record<string, ItemRecepcionForm> = {};
    traslado.items.forEach((item) => {
      map[item.productoId] = {
        productoId: item.productoId,
        cantidadRecibida: item.cantidadDespachada, // Sugerido inicial lo despachado
        cantidadDespachadaOriginal: item.cantidadDespachada,
        conforme: true,
        novedadMotivo: undefined,
        novedadDetalle: '',
      };
    });
    return map;
  });

  const handleUpdateItem = (productoId: string, patch: Partial<ItemRecepcionForm>) => {
    setItemsChecklist((prev) => {
      const current = prev[productoId];
      const updated = { ...current, ...patch };

      // Si la cantidad difiere de la despachada, marcar automáticamente no conforme si no lo está
      const hayDiferencia = Math.abs(updated.cantidadRecibida - updated.cantidadDespachadaOriginal) > 0.001;
      if (hayDiferencia && updated.conforme) {
        updated.conforme = false;
        if (!updated.novedadMotivo) {
          updated.novedadMotivo = 'DIFERENCIA_PESO';
        }
      }

      return {
        ...prev,
        [productoId]: updated,
      };
    });
  };

  const handleMarcarTodoConforme = () => {
    setItemsChecklist((prev) => {
      const updated: Record<string, ItemRecepcionForm> = {};
      Object.keys(prev).forEach((pId) => {
        const item = prev[pId];
        updated[pId] = {
          ...item,
          cantidadRecibida: item.cantidadDespachadaOriginal,
          conforme: true,
          novedadMotivo: undefined,
          novedadDetalle: '',
        };
      });
      return updated;
    });

    Swal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      icon: 'success',
      title: 'Todos los ítems marcados como conformes',
      background: '#0f172a',
      color: '#f8fafc',
    });
  };

  const handleSubmitConfirmacion = async (e: React.FormEvent) => {
    e.preventDefault();

    const listaItems = Object.values(itemsChecklist);

    // Validar que si hay ítems no conformes, contengan su motivo y justificación
    for (const item of listaItems) {
      const hayDiferencia = Math.abs(item.cantidadRecibida - item.cantidadDespachadaOriginal) > 0.001;
      if (!item.conforme || hayDiferencia) {
        if (!item.novedadMotivo || !item.novedadDetalle || item.novedadDetalle.trim().length < 3) {
          Swal.fire({
            title: 'Detalle de Novedad Requerido',
            text: `El producto con discrepancia debe tener especificado el motivo y la justificación explicativa de la novedad.`,
            icon: 'warning',
            background: '#0f172a',
            color: '#f8fafc',
          });
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const res = await internalTransferService.confirmarRecepcionChecklistPOS({
        trasladoId: traslado.id,
        recibidoPor,
        itemsVerificados: listaItems,
        observacionesRecepcion,
      });

      if (!res.success || !res.data) {
        throw new Error(res.error || 'Error al confirmar recepción');
      }

      await Swal.fire({
        title: res.data.tieneNovedades ? '¡Recepción con Novedades Asentada!' : '¡Recepción Conforme Exitosa!',
        html: `<div class="text-slate-300 text-sm">
          Guía N° <span class="font-mono font-bold text-cyan-400">${traslado.numeroGuia}</span> procesada.<br/>
          Stock incrementado en <strong class="text-white">${traslado.bodegaDestinoNombre}</strong> por 
          <span class="text-emerald-400 font-mono font-bold">${res.data.pesoRecibidoTotalKg} KG</span>.<br/>
          Doble asiento contable y Kardex inmutable generado.
        </div>`,
        icon: res.data.tieneNovedades ? 'warning' : 'success',
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#0ea5e9',
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      Swal.fire({
        title: 'Error de Recepción',
        text: err.message || 'No se pudo procesar la recepción del traslado',
        icon: 'error',
        background: '#0f172a',
        color: '#f8fafc',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalRecibidoKg = Object.values(itemsChecklist).reduce(
    (acc, i) => acc + (Number(i.cantidadRecibida) || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl overflow-hidden">
        {/* Encabezado */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <PackageCheck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">
                Checklist de Recepción en Punto de Venta POS
              </h2>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                Guía: <span className="font-mono text-cyan-400 font-bold">{traslado.numeroGuia}</span> |
                Despachado por: <span className="text-slate-200">{traslado.despachadoPor || 'Bodega Central'}</span> |
                Temp. Salida: <span className="text-emerald-400 font-mono">{traslado.temperaturaDespachoC ?? 2.0}°C</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-card border-white/5/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Banner de Acciones Rápidas */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-cyan-400" />
                Verificación Ítem por Ítem en Mostrador
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Pese cada producto recibido. Si hay faltantes o discrepancias, registre el motivo de la novedad.
              </p>
            </div>
            <button
              type="button"
              onClick={handleMarcarTodoConforme}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs border border-cyan-500/30 flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              ⚡ Marcar Todo Conforme
            </button>
          </div>

          {/* Checklist de Ítems */}
          <div className="space-y-4">
            {traslado.items.map((item) => {
              const check = itemsChecklist[item.productoId] || {
                productoId: item.productoId,
                cantidadRecibida: item.cantidadDespachada,
                cantidadDespachadaOriginal: item.cantidadDespachada,
                conforme: true,
              };

              const hayDiscrepancia =
                !check.conforme ||
                Math.abs(check.cantidadRecibida - check.cantidadDespachadaOriginal) > 0.001;

              return (
                <div
                  key={item.productoId}
                  className={`p-4 rounded-xl border transition-all ${
                    hayDiscrepancia
                      ? 'border-amber-500/40 bg-amber-500/5'
                      : 'border-white/10 bg-slate-800/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div>
                      <div className="font-bold text-white text-sm flex items-center gap-2">
                        {item.nombre}
                        <span className="text-xs font-mono text-cyan-400">({item.sku})</span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                        <span>
                          Despachado:{' '}
                          <strong className="text-slate-200 font-mono">
                            {item.cantidadDespachada} {item.unidadMedida}
                          </strong>
                        </span>
                        {item.loteFefo && (
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-white/10 font-mono text-cyan-300">
                            Lote: {item.loteFefo}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Controles de Recepción */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-white/10">
                        <Scale className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs text-slate-400">Recibido:</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={check.cantidadRecibida}
                          onChange={(e) =>
                            handleUpdateItem(item.productoId, {
                              cantidadRecibida: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-20 bg-transparent text-right font-mono font-bold text-white text-sm focus:outline-none"
                        />
                        <span className="text-xs text-slate-400 uppercase font-semibold">
                          {item.unidadMedida}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateItem(item.productoId, {
                            conforme: !check.conforme,
                          })
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                          check.conforme
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        {check.conforme ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Conforme
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Con Novedad
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* LÍNEA DE DETALLE DE NOVEDAD OBLIGATORIA (Si hay discrepancia) */}
                  {hayDiscrepancia && (
                    <div className="mt-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 space-y-2 animate-fade-in">
                      <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        Línea de Detalle de Novedad Obligatoria
                        <span className="text-amber-400/80 font-normal">
                          (Diferencia:{' '}
                          {(check.cantidadRecibida - check.cantidadDespachadaOriginal).toFixed(2)}{' '}
                          {item.unidadMedida})
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[11px] font-medium text-amber-200 mb-1">
                            Motivo Principal
                          </label>
                          <select
                            value={check.novedadMotivo || 'DIFERENCIA_PESO'}
                            onChange={(e) =>
                              handleUpdateItem(item.productoId, {
                                novedadMotivo: e.target.value as any,
                              })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-amber-500/30 text-white text-xs focus:outline-none focus:border-amber-400"
                          >
                            <option value="DIFERENCIA_PESO">Diferencia de Peso en Báscula</option>
                            <option value="ROTURA_EMPAQUE">Empaque Averiado / Daño</option>
                            <option value="AGOTADO_BODEGA">No Entregado / Faltante en Origen</option>
                            <option value="CALIDAD_DEFICIENTE">Calidad Deficiente / Devolución</option>
                            <option value="OTRO">Otro Motivo</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-medium text-amber-200 mb-1">
                            Descripción y Justificación de la Novedad
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. Llegó 1.2 kg menos por merma de descongelamiento en transporte..."
                            value={check.novedadDetalle || ''}
                            onChange={(e) =>
                              handleUpdateItem(item.productoId, {
                                novedadDetalle: e.target.value,
                              })
                            }
                            className="w-full px-3 py-1.5 rounded-lg bg-slate-900/90 border border-amber-500/30 text-white text-xs placeholder:text-amber-300/50 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Observaciones Generales de Recepción */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Observaciones de Recepción en Punto de Venta
            </label>
            <textarea
              value={observacionesRecepcion}
              onChange={(e) => setObservacionesRecepcion(e.target.value)}
              placeholder="Ej. Se recibió en mostrador conforme con acta de pesaje..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-800/40 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Total a Ingresar a Stock POS:{' '}
            <strong className="text-emerald-400 font-mono">{totalRecibidoKg.toFixed(2)} KG</strong>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-card border-white/5/5 text-sm font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitConfirmacion}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
            >
              <PackageCheck className="w-4 h-4" />
              {isSubmitting ? 'Procesando...' : 'Confirmar Recepción e Ingresar a Stock POS'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
