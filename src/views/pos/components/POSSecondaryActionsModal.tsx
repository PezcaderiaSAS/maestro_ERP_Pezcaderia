// src/views/pos/components/POSSecondaryActionsModal.tsx
// Modal de Operaciones Secundarias de Caja (Milestone M2 - Desacoplamiento)
// Centraliza: Cerrar Turno, Ventas en Espera & Multicliente, Notas de Corte y Vaciar Carrito.

import React, { useEffect } from 'react';
import {
  X,
  PauseCircle,
  Scissors,
  Trash2,
  DoorClosed,
  Plus,
  Clock,
  Layers,
  Archive,
  ShoppingCart,
  AlertCircle,
} from 'lucide-react';
import type { CartDraft } from '../../../types/pos.types';

export interface POSSecondaryActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Operación: Cerrar turno
  isTurnoAbierto?: boolean;
  onCerrarTurnoClick?: () => void;
  // Operación: Ventas en espera & Multicliente
  drafts: CartDraft[];
  activeDraftId: string | null;
  onSelectDraft: (draft: CartDraft) => void;
  onDeleteDraft: (draftId: string, e: React.MouseEvent) => void;
  onNewParkedSale: () => void;
  // Operación: Notas de corte
  onOpenNotasModal?: () => void;
  selectedCutNotesCount?: number;
  // Operación: Vaciar carrito
  onLimpiarCarrito: () => void;
  hasLineas: boolean;
}

export const POSSecondaryActionsModal: React.FC<POSSecondaryActionsModalProps> = ({
  isOpen,
  onClose,
  isTurnoAbierto = true,
  onCerrarTurnoClick,
  drafts,
  activeDraftId,
  onSelectDraft,
  onDeleteDraft,
  onNewParkedSale,
  onOpenNotasModal,
  selectedCutNotesCount = 0,
  onLimpiarCarrito,
  hasLineas,
}) => {
  // Manejo de tecla Escape para accesibilidad de teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="secondary-actions-modal-title"
      data-testid="pos-secondary-actions-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-white/10 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="secondary-actions-modal-title"
                className="text-sm sm:text-base font-black text-white tracking-wide flex items-center gap-2"
              >
                <span>Operaciones de Caja</span>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-lg">
                  Menú Secundario
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Ventas en espera, multicliente, notas de corte y turno
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            data-testid="btn-close-secondary-actions-modal"
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo del Modal con scroll interno */}
        <div className="p-3.5 sm:p-4 overflow-y-auto space-y-4 flex-1 min-h-0 custom-scrollbar">
          {/* ── ACCIONES RÁPIDAS DE CAJA Y CARRITO ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Notas de Corte */}
            {onOpenNotasModal && (
              <button
                type="button"
                data-testid="btn-action-notas-corte"
                onClick={() => {
                  onClose();
                  onOpenNotasModal();
                }}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-white/10 text-left transition-all cursor-pointer shadow-2xs group"
              >
                <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition-transform shrink-0">
                  <Scissors size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white group-hover:text-cyan-200">
                      Notas de Corte
                    </span>
                    {selectedCutNotesCount > 0 && (
                      <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-500/30">
                        {selectedCutNotesCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate">
                    Preparación, filete y despacho
                  </span>
                </div>
              </button>
            )}

            {/* Vaciar Carrito */}
            <button
              type="button"
              data-testid="btn-action-vaciar-carrito"
              disabled={!hasLineas}
              onClick={() => {
                onLimpiarCarrito();
                onClose();
              }}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all shadow-2xs group ${
                hasLineas
                  ? 'bg-rose-950/20 hover:bg-rose-900/40 border-rose-500/20 text-rose-200 cursor-pointer'
                  : 'bg-slate-900/40 border-white/5 text-slate-500 cursor-not-allowed opacity-50'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                  hasLineas
                    ? 'bg-rose-500/20 border-rose-500/30 text-rose-400 group-hover:scale-105 transition-transform'
                    : 'bg-white/5 border-white/5 text-slate-600'
                }`}
              >
                <Trash2 size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold block">Vaciar Carrito</span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {hasLineas ? 'Descartar productos actuales' : 'Carrito sin productos'}
                </span>
              </div>
            </button>

            {/* Cerrar Turno de Caja (si se proporciona callback) */}
            {onCerrarTurnoClick && (
              <button
                type="button"
                data-testid="btn-action-cerrar-turno"
                disabled={!isTurnoAbierto}
                onClick={() => {
                  onClose();
                  onCerrarTurnoClick();
                }}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all shadow-2xs group sm:col-span-2 ${
                  isTurnoAbierto
                    ? 'bg-amber-950/20 hover:bg-amber-900/40 border-amber-500/30 text-amber-200 cursor-pointer'
                    : 'bg-slate-900/40 border-white/5 text-slate-500 cursor-not-allowed opacity-50'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                    isTurnoAbierto
                      ? 'bg-amber-500/20 border-amber-500/30 text-amber-400 group-hover:scale-105 transition-transform'
                      : 'bg-white/5 border-white/5 text-slate-600'
                  }`}
                >
                  <DoorClosed size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">Cerrar Turno de Caja</span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                        isTurnoAbierto
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-white/10'
                      }`}
                    >
                      {isTurnoAbierto ? 'Turno Abierto' : 'Turno Cerrado'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate">
                    Arqueo de caja, conteo ciego y cierre de sesión de cajero
                  </span>
                </div>
              </button>
            )}
          </div>

          {/* ── SECCIÓN: VENTAS EN ESPERA & MULTICLIENTE ── */}
          <div className="space-y-2.5 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <PauseCircle size={14} className="text-amber-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Ventas en Espera & Multicliente
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-[10px] font-bold">
                  {drafts.length}
                </span>
              </div>

              <button
                type="button"
                data-testid="btn-action-suspender-nueva-venta"
                onClick={() => {
                  onNewParkedSale();
                  onClose();
                }}
                className="flex items-center gap-1 min-h-[36px] h-8 px-2.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-2xs"
                title="Poner pedido actual en espera y abrir venta nueva (F6)"
              >
                <Plus size={13} />
                <span>Suspender & Nueva Venta</span>
              </button>
            </div>

            {/* Listado de pedidos en espera */}
            {drafts.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-white/10 bg-slate-950/40 text-center">
                <Archive className="mx-auto text-slate-500 mb-1.5 opacity-60" size={24} />
                <p className="text-xs font-bold text-slate-300">No hay pedidos en espera</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Usa "Suspender & Nueva Venta" o presiona <kbd className="px-1 py-0.5 bg-white/10 rounded text-cyan-300 font-mono text-[10px]">F6</kbd> para pausar un cliente y atender al siguiente.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-0.5">
                {drafts.map((d) => {
                  const isSelected = activeDraftId === d.id;
                  const alias = d.alias || (d.cliente ? d.cliente.nombre : 'Consumidor Final');
                  const itemsCount = d.lineas ? d.lineas.length : d.cart ? d.cart.length : 0;
                  const formattedTotal = Number(d.total ?? d.totalFinal ?? 0).toLocaleString('es-CO');
                  const time = d.fechaGuardado || d.fecha;
                  const timeFormatted = time
                    ? new Date(time).toLocaleTimeString('es-CO', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '';

                  return (
                    <div
                      key={d.id}
                      data-testid={`draft-card-${d.id}`}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                        isSelected
                          ? 'bg-amber-950/40 border-amber-500/50 shadow-md ring-1 ring-amber-400/30'
                          : 'bg-slate-950/60 border-white/10 hover:border-white/20 hover:bg-slate-950/80'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="font-bold text-xs sm:text-sm text-white truncate">
                            {alias}
                          </span>
                          {isSelected && (
                            <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-500/30">
                              Activo
                            </span>
                          )}
                          {timeFormatted && (
                            <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-1.5 py-0.2 rounded border border-white/5 flex items-center gap-0.5">
                              <Clock size={10} />
                              <span>{timeFormatted}</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span>
                            {itemsCount} {itemsCount === 1 ? 'ítem' : 'ítems'}
                          </span>
                          <span className="font-mono font-black text-emerald-400 text-sm">
                            ${formattedTotal}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          id={`draft-select-${d.id}`}
                          data-testid={`draft-select-${d.id}`}
                          onClick={() => {
                            onSelectDraft(d);
                            onClose();
                          }}
                          className="min-h-[38px] px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm"
                          title="Recuperar pedido al mostrador"
                        >
                          <ShoppingCart size={13} />
                          <span>Recuperar</span>
                        </button>

                        <button
                          type="button"
                          id={`draft-delete-${d.id}`}
                          data-testid={`draft-delete-${d.id}`}
                          onClick={(e) => onDeleteDraft(d.id, e)}
                          className="min-h-[38px] min-w-[38px] p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-white/5 hover:border-red-500/30 transition-all flex items-center justify-center cursor-pointer"
                          title="Descartar este pedido en espera"
                          aria-label="Descartar pedido en espera"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Pie del Modal */}
        <div className="p-3 border-t border-white/10 bg-slate-950/80 shrink-0 flex items-center justify-end">
          <button
            type="button"
            data-testid="btn-close-secondary-modal-footer"
            onClick={onClose}
            className="min-h-[44px] px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-white/10 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
