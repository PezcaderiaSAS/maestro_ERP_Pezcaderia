import React, { useState, useEffect } from 'react';
import { CreditCard, Banknote, Smartphone, CheckCircle, ArrowRight, Printer, AlertTriangle, X, ShoppingBag } from 'lucide-react';
import type { CartDraft, LineaVenta } from '../../../types/pos.types';

export interface DirectCashierCheckoutPanelProps {
  activeComanda: CartDraft | null;
  lineas: LineaVenta[];
  totalFinal: number;
  subtotal?: number;
  totalIva?: number;
  descuento?: number;
  onProcesarPago: (datos: {
    metodo: 'EFECTIVO' | 'DATAFONO' | 'TRANSFERENCIA';
    montoRecibido: number;
    vueltas: number;
  }) => Promise<void> | void;
  onDescartarComanda?: () => void;
  onNuevaVentaDirecta?: () => void;
  isProcessing?: boolean;
}

const BILLETES_COP = [100000, 50000, 20000, 10000, 5000, 2000];

export const DirectCashierCheckoutPanel: React.FC<DirectCashierCheckoutPanelProps> = ({
  activeComanda,
  lineas,
  totalFinal,
  subtotal = 0,
  totalIva = 0,
  descuento = 0,
  onProcesarPago,
  onDescartarComanda,
  onNuevaVentaDirecta,
  isProcessing = false,
}) => {
  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'DATAFONO' | 'TRANSFERENCIA'>('EFECTIVO');
  const [montoRecibido, setMontoRecibido] = useState<number>(totalFinal);
  const [inputEfectivo, setInputEfectivo] = useState<string>(totalFinal > 0 ? String(totalFinal) : '');

  // Sincronizar monto recibido cuando cambia el total
  useEffect(() => {
    if (metodoPago !== 'EFECTIVO') {
      setMontoRecibido(totalFinal);
      setInputEfectivo(String(totalFinal));
    } else if (!inputEfectivo || Number(inputEfectivo) < totalFinal) {
      setMontoRecibido(totalFinal);
      setInputEfectivo(totalFinal > 0 ? String(totalFinal) : '');
    }
  }, [totalFinal, metodoPago]);

  // Manejo de atajos de teclado F1 (Efectivo), F2 (Datafono), F3 (Transferencia), F10 (Cobrar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea';

      if (e.key === 'F1') {
        e.preventDefault();
        setMetodoPago('EFECTIVO');
      } else if (e.key === 'F2') {
        e.preventDefault();
        setMetodoPago('DATAFONO');
      } else if (e.key === 'F3') {
        e.preventDefault();
        setMetodoPago('TRANSFERENCIA');
      } else if ((e.key === 'F10' || (e.key === 'Enter' && !isInput)) && totalFinal > 0 && !isProcessing) {
        if (!document.querySelector('.swal2-container')) {
          e.preventDefault();
          handleCobrar();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [metodoPago, montoRecibido, totalFinal, isProcessing]);

  const vueltas = Math.max(0, (montoRecibido || 0) - totalFinal);
  const esFaltante = (montoRecibido || 0) < totalFinal;

  const handleBilletesClick = (denominacion: number) => {
    setMontoRecibido(denominacion);
    setInputEfectivo(String(denominacion));
  };

  const handleExactoClick = () => {
    setMontoRecibido(totalFinal);
    setInputEfectivo(String(totalFinal));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setInputEfectivo(val);
    setMontoRecibido(Number(val) || 0);
  };

  const handleCobrar = () => {
    if (totalFinal <= 0 || isProcessing) return;
    if (metodoPago === 'EFECTIVO' && esFaltante) return;

    onProcesarPago({
      metodo: metodoPago,
      montoRecibido: metodoPago === 'EFECTIVO' ? (montoRecibido || totalFinal) : totalFinal,
      vueltas: metodoPago === 'EFECTIVO' ? vueltas : 0,
    });
  };

  const itemsCount = lineas.reduce((acc, l) => acc + (Number(l.cantidad) || 1), 0);

  return (
    <div
      data-testid="direct-cashier-checkout-panel"
      className="flex flex-col h-full min-h-0 bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 sm:p-4 shadow-2xl select-none"
    >
      {/* ── Encabezado de Liquidación ── */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShoppingBag size={18} />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-black tracking-wide text-white uppercase flex items-center gap-2">
              <span>{activeComanda ? (activeComanda.alias || 'Comanda Activa') : 'Venta en Caja'}</span>
              <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                {itemsCount} {itemsCount === 1 ? 'ítem' : 'ítems'}
              </span>
            </h2>
            {activeComanda?.cliente?.nombre && (
              <p className="text-[10px] text-slate-400 truncate max-w-[250px]">
                Cliente: <strong className="text-slate-200">{activeComanda.cliente.nombre}</strong>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {activeComanda && onDescartarComanda && (
            <button
              type="button"
              data-testid="btn-descartar-comanda"
              onClick={onDescartarComanda}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/10 transition-colors cursor-pointer text-xs flex items-center gap-1"
              title="Cerrar comanda sin cobrar"
            >
              <X size={14} />
              <span className="hidden sm:inline">Liberar</span>
            </button>
          )}
          {onNuevaVentaDirecta && (
            <button
              type="button"
              data-testid="btn-nueva-venta-directa"
              onClick={onNuevaVentaDirecta}
              className="px-2.5 py-1 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all cursor-pointer"
            >
              + Nueva Venta
            </button>
          )}
        </div>
      </div>

      {/* ── Contenedor Central con Scroll: Resumen + Métodos + Efectivo ── */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-2 space-y-2.5 custom-scrollbar">
        {/* Banner Gigante del Total a Cobrar */}
        <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/10 shadow-inner flex flex-col items-center justify-center text-center">
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
            TOTAL A COBRAR
          </span>
          <strong
            data-testid="cashier-total-final"
            className="text-3xl sm:text-4xl font-mono font-black text-emerald-400 tracking-tight tabular-nums"
          >
            ${totalFinal.toLocaleString('es-CO')}
          </strong>
          {descuento > 0 && (
            <span className="text-[10px] text-amber-300 font-semibold mt-0.5">
              Descuento aplicado: -${descuento.toLocaleString('es-CO')}
            </span>
          )}
        </div>

        {/* ── Métodos de Pago (F1, F2, F3) ── */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Método de Pago
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              data-testid="btn-metodo-efectivo"
              onClick={() => setMetodoPago('EFECTIVO')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer min-h-[48px] ${
                metodoPago === 'EFECTIVO'
                  ? 'bg-emerald-950/60 border-emerald-400 text-emerald-200 shadow-lg shadow-emerald-950/50 ring-2 ring-emerald-500/30 font-bold'
                  : 'bg-slate-800/60 hover:bg-slate-800/90 border-white/10 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-1">
                <Banknote size={16} className={metodoPago === 'EFECTIVO' ? 'text-emerald-400' : 'text-slate-400'} />
                <span className="text-xs">Efectivo</span>
              </div>
              <kbd className="px-1 py-0.2 rounded text-[9px] font-mono bg-black/40 text-emerald-300 border border-emerald-500/20 mt-1">
                F1
              </kbd>
            </button>

            <button
              type="button"
              data-testid="btn-metodo-datafono"
              onClick={() => setMetodoPago('DATAFONO')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer min-h-[48px] ${
                metodoPago === 'DATAFONO'
                  ? 'bg-sky-950/60 border-sky-400 text-sky-200 shadow-lg shadow-sky-950/50 ring-2 ring-sky-500/30 font-bold'
                  : 'bg-slate-800/60 hover:bg-slate-800/90 border-white/10 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-1">
                <CreditCard size={16} className={metodoPago === 'DATAFONO' ? 'text-sky-400' : 'text-slate-400'} />
                <span className="text-xs">Datáfono</span>
              </div>
              <kbd className="px-1 py-0.2 rounded text-[9px] font-mono bg-black/40 text-sky-300 border border-sky-500/20 mt-1">
                F2
              </kbd>
            </button>

            <button
              type="button"
              data-testid="btn-metodo-transferencia"
              onClick={() => setMetodoPago('TRANSFERENCIA')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer min-h-[48px] ${
                metodoPago === 'TRANSFERENCIA'
                  ? 'bg-purple-950/60 border-purple-400 text-purple-200 shadow-lg shadow-purple-950/50 ring-2 ring-purple-500/30 font-bold'
                  : 'bg-slate-800/60 hover:bg-slate-800/90 border-white/10 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-1">
                <Smartphone size={16} className={metodoPago === 'TRANSFERENCIA' ? 'text-purple-400' : 'text-slate-400'} />
                <span className="text-xs truncate">Nequi/Banc</span>
              </div>
              <kbd className="px-1 py-0.2 rounded text-[9px] font-mono bg-black/40 text-purple-300 border border-purple-500/20 mt-1">
                F3
              </kbd>
            </button>
          </div>
        </div>

        {/* ── Desglose de Efectivo y Vueltas en Tiempo Real (Solo si Efectivo) ── */}
        {metodoPago === 'EFECTIVO' && (
          <div className="space-y-2 p-2.5 rounded-xl bg-slate-950/60 border border-white/10">
            {/* Input Manual y Botón Exacto */}
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Efectivo Recibido
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-2.5 font-mono font-bold text-slate-400 text-sm">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    data-testid="input-efectivo-recibido"
                    value={inputEfectivo}
                    onChange={handleInputChange}
                    onFocus={(e) => e.target.select()}
                    placeholder="0"
                    className="w-full h-10 pl-6 pr-3 rounded-xl bg-slate-900 border-2 border-slate-700 text-white font-mono font-black text-lg focus:border-emerald-500 focus:outline-none transition-all tabular-nums shadow-inner"
                  />
                </div>
              </div>

              <button
                type="button"
                data-testid="btn-pago-exacto"
                onClick={handleExactoClick}
                className="self-end h-10 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              >
                Exacto
              </button>
            </div>

            {/* Chips de Billetes Colombianos */}
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Billetes Rápidos COP
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {BILLETES_COP.map((billete) => (
                  <button
                    key={billete}
                    type="button"
                    data-testid={`btn-billete-${billete}`}
                    onClick={() => handleBilletesClick(billete)}
                    className="h-8 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-mono font-bold text-xs border border-white/10 transition-all cursor-pointer shadow-2xs"
                  >
                    ${(billete / 1000).toLocaleString('es-CO')}k
                  </button>
                ))}
              </div>
            </div>

            {/* Banner de Vueltas / Cambio en Vivo */}
            <div
              data-testid="banner-vueltas"
              className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                esFaltante
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                  : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200 shadow-md'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {esFaltante ? (
                  <AlertTriangle size={18} className="text-amber-400 shrink-0" />
                ) : (
                  <CheckCircle size={18} className="text-emerald-400 shrink-0" />
                )}
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider block">
                    {esFaltante ? 'Monto Incompleto' : 'Cambio / Vueltas:'}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    {esFaltante
                      ? `Faltan $${(totalFinal - (montoRecibido || 0)).toLocaleString('es-CO')}`
                      : 'Entregar al cliente'}
                  </span>
                </div>
              </div>

              <strong
                data-testid="display-vueltas"
                className={`text-xl sm:text-2xl font-mono font-black tabular-nums ${
                  esFaltante ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                ${vueltas.toLocaleString('es-CO')}
              </strong>
            </div>
          </div>
        )}
      </div>

      {/* ── Pie de Acción Fricción Cero: Botón Gigante F10 ── */}
      <div className="pt-2 border-t border-white/10 shrink-0">
        <button
          type="button"
          data-testid="btn-cobrar-imprimir"
          disabled={totalFinal <= 0 || isProcessing || (metodoPago === 'EFECTIVO' && esFaltante)}
          onClick={handleCobrar}
          className={`w-full min-h-[54px] sm:min-h-[58px] p-3 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer shadow-xl ${
            totalFinal > 0 && !isProcessing && (!esFaltante || metodoPago !== 'EFECTIVO')
              ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/50'
              : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
          }`}
        >
          <Printer size={20} className={isProcessing ? 'animate-bounce' : ''} />
          <span>{isProcessing ? 'PROCESANDO COBRO...' : 'COBRAR E IMPRIMIR TIRILLA'}</span>
          <kbd className="px-1.5 py-0.5 rounded bg-black/40 border border-white/20 text-emerald-200 text-xs font-mono ml-1">
            F10
          </kbd>
        </button>
      </div>
    </div>
  );
};

