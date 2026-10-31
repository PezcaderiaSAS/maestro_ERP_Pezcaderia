// src/views/pos/components/SplitPaymentModal.tsx
// Modal de Cobro Dividido / Mixto Dinámico para Caja Única (SPEC-047)
// Dark Glassmorphism 60-30-10 con cálculo reactivo de saldo y vueltas en font-mono

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  CreditCard,
  Banknote,
  QrCode,
  DollarSign,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import { usePOSKeyboardShortcuts } from '../../../hooks/usePOSKeyboardShortcuts';

export interface SplitPaymentLine {
  id: string;
  metodo: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'CREDITO';
  monto: number;
  referencia?: string;
  efectivoRecibido?: number;
  vueltoCalculado?: number;
}

export interface SplitPaymentPayload {
  orderId: string;
  montoTotal: number;
  lineas: SplitPaymentLine[];
  vueltoTotal: number;
}

export interface SplitPaymentModalProps {
  isOpen: boolean;
  order?: {
    id: string;
    consecutivoTicket: string;
    clienteNombre?: string;
    montoTotal: number;
  } | null;
  onClose: () => void;
  onConfirmPayment: (payload: SplitPaymentPayload) => void;
  initialMethod?: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'MIXTO';
}

export const SplitPaymentModal: React.FC<SplitPaymentModalProps> = ({
  isOpen,
  order,
  onClose,
  onConfirmPayment,
  initialMethod = 'EFECTIVO',
}) => {
  if (!isOpen || !order) return null;

  const totalPagar = order.montoTotal || 0;

  // Estado de líneas de pago fraccionado
  const [lines, setLines] = useState<SplitPaymentLine[]>(() => {
    const defaultMetodo = initialMethod === 'MIXTO' ? 'EFECTIVO' : initialMethod;
    return [
      {
        id: 'line-1',
        metodo: defaultMetodo,
        monto: totalPagar,
        efectivoRecibido: defaultMetodo === 'EFECTIVO' ? totalPagar : undefined,
        vueltoCalculado: 0,
      },
    ];
  });

  // Reiniciar líneas al cambiar de orden
  useEffect(() => {
    const defaultMetodo = initialMethod === 'MIXTO' ? 'EFECTIVO' : initialMethod;
    setLines([
      {
        id: `line-${Date.now()}-1`,
        metodo: defaultMetodo,
        monto: totalPagar,
        efectivoRecibido: defaultMetodo === 'EFECTIVO' ? totalPagar : undefined,
        vueltoCalculado: 0,
      },
    ]);
  }, [order.id, totalPagar, initialMethod]);

  // Cálculos reactivos de saldo
  const totalAsignado = useMemo(() => {
    return lines.reduce((acc, l) => acc + (Number(l.monto) || 0), 0);
  }, [lines]);

  const saldoPendiente = Math.max(0, totalPagar - totalAsignado);
  const estaCubierto = totalAsignado === totalPagar;

  // Cálculo de vueltas de efectivo
  const vueltoTotal = useMemo(() => {
    const lineaEfectivo = lines.find((l) => l.metodo === 'EFECTIVO');
    if (!lineaEfectivo || !lineaEfectivo.efectivoRecibido) return 0;
    const diff = Number(lineaEfectivo.efectivoRecibido) - Number(lineaEfectivo.monto);
    return diff > 0 ? diff : 0;
  }, [lines]);

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Manejo de métodos
  const handleAddLine = () => {
    const remanente = Math.max(0, totalPagar - totalAsignado);
    setLines((prev) => [
      ...prev,
      {
        id: `line-${Date.now()}-${prev.length + 1}`,
        metodo: 'TRANSFERENCIA',
        monto: remanente,
        referencia: '',
      },
    ]);
  };

  const handleRemoveLine = (id: string) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const handleUpdateLine = (id: string, updates: Partial<SplitPaymentLine>) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const updated = { ...l, ...updates };

        // Recalcular vuelto si es efectivo
        if (updated.metodo === 'EFECTIVO') {
          const rec = Number(updated.efectivoRecibido) || 0;
          const mto = Number(updated.monto) || 0;
          updated.vueltoCalculado = rec > mto ? rec - mto : 0;
        }

        return updated;
      })
    );
  };

  // Atajos de denominación rápida para efectivo
  const handleAddCashDenomination = (id: string, value: number) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const current = Number(l.efectivoRecibido) || Number(l.monto) || 0;
        const next = current + value;
        return {
          ...l,
          efectivoRecibido: next,
          vueltoCalculado: next > l.monto ? next - l.monto : 0,
        };
      })
    );
  };

  const handleConfirm = () => {
    if (!estaCubierto) return;
    onConfirmPayment({
      orderId: order.id,
      montoTotal: totalPagar,
      lineas: lines,
      vueltoTotal,
    });
  };

  // Atajos de teclado en el modal
  usePOSKeyboardShortcuts({
    onEscape: onClose,
    onF12Checkout: handleConfirm,
    onEnter: () => {
      if (estaCubierto) handleConfirm();
    },
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="split-payment-title"
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
    >
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl max-w-2xl w-full p-6 text-slate-100 flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60 font-mono text-sm font-bold text-cyan-300">
                {order.consecutivoTicket}
              </span>
              <h2 id="split-payment-title" className="text-lg font-bold text-slate-100">
                Cobro Dividido / Recaudo Mixto
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Cliente: <span className="text-slate-200 font-medium">{order.clienteNombre || 'Consumidor Final'}</span>
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase tracking-wider block">Total a Pagar</span>
            <span className="font-mono text-2xl font-black text-cyan-400">
              {formatCOP(totalPagar)}
            </span>
          </div>
        </div>

        {/* Líneas de Pago Dividido */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Métodos de Pago Asignados
            </span>
            <button
              type="button"
              onClick={handleAddLine}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700/70 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Método</span>
            </button>
          </div>

          {lines.map((line, idx) => (
            <div
              key={line.id}
              className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col gap-2.5"
            >
              <div className="flex items-center gap-3">
                {/* Selector de Método */}
                <select
                  value={line.metodo}
                  onChange={(e) =>
                    handleUpdateLine(line.id, {
                      metodo: e.target.value as any,
                      efectivoRecibido: e.target.value === 'EFECTIVO' ? line.monto : undefined,
                    })
                  }
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/70 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  <option value="EFECTIVO">💵 Efectivo</option>
                  <option value="TARJETA">💳 Datáfono / Tarjeta</option>
                  <option value="TRANSFERENCIA">📱 Transferencia QR</option>
                  <option value="CREDITO">📑 Crédito Cliente</option>
                </select>

                {/* Monto Asignado al Método */}
                <div className="flex-1 flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-mono">$</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={line.monto === 0 ? '' : line.monto}
                    onChange={(e) =>
                      handleUpdateLine(line.id, {
                        monto: Number(e.target.value) || 0,
                      })
                    }
                    placeholder="Monto"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/70 text-sm font-mono font-bold text-emerald-400 text-right focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>

                {/* Botón Eliminar si hay más de 1 línea */}
                {lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveLine(line.id)}
                    aria-label="Eliminar método"
                    className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Campos Específicos para Efectivo (Recibido y Vueltas) */}
              {line.metodo === 'EFECTIVO' && (
                <div className="pt-2 border-t border-slate-800/70 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Recibido:</span>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="Efectivo Recibido"
                      value={line.efectivoRecibido === 0 ? '' : line.efectivoRecibido || ''}
                      onChange={(e) =>
                        handleUpdateLine(line.id, {
                          efectivoRecibido: Number(e.target.value) || 0,
                        })
                      }
                      className="w-32 px-2.5 py-1 rounded bg-slate-900 border border-slate-700/70 text-xs font-mono font-bold text-slate-100 text-right focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>

                  {/* Botones de Denominación Rápida */}
                  <div className="flex items-center gap-1">
                    {[10000, 20000, 50000, 100000].map((denom) => (
                      <button
                        key={denom}
                        type="button"
                        onClick={() => handleAddCashDenomination(line.id, denom)}
                        className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-[10px] font-mono text-slate-300 border border-slate-700/50"
                      >
                        +{denom / 1000}k
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Referencia para Tarjeta o Transferencia */}
              {(line.metodo === 'TARJETA' || line.metodo === 'TRANSFERENCIA') && (
                <div className="pt-1.5 border-t border-slate-800/70 flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Referencia / Comprobante:</span>
                  <input
                    type="text"
                    placeholder="Ej. Últimos 4 dígitos o ref QR"
                    value={line.referencia || ''}
                    onChange={(e) =>
                      handleUpdateLine(line.id, { referencia: e.target.value })
                    }
                    className="flex-1 px-2 py-1 rounded bg-slate-900 border border-slate-700/70 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Resumen de Liquidación y Estado de Saldo */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs text-slate-400 block">Total Asignado:</span>
            <span className="font-mono text-base font-bold text-slate-200">
              {formatCOP(totalAsignado)}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block">Saldo Pendiente:</span>
            {estaCubierto ? (
              <span className="inline-flex items-center gap-1 font-mono text-sm font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                Saldo Cubierto
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-mono text-base font-bold text-rose-400">
                <AlertTriangle className="w-4 h-4" />
                {formatCOP(saldoPendiente)}
              </span>
            )}
          </div>

          {vueltoTotal > 0 && (
            <div className="text-right">
              <span className="text-xs text-amber-400 font-bold block uppercase tracking-wider">
                Vueltas / Cambio:
              </span>
              <span className="font-mono text-2xl font-black text-amber-300">
                {formatCOP(vueltoTotal)}
              </span>
            </div>
          )}
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold border border-slate-700/60 transition-colors"
          >
            Cancelar [Esc]
          </button>
          <button
            type="button"
            disabled={!estaCubierto}
            onClick={handleConfirm}
            className={`px-5 py-2 rounded-lg text-sm font-bold shadow-lg transition-all flex items-center gap-2 ${
              estaCubierto
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/40'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmar Cobro [F12]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
