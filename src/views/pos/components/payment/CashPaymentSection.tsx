import React, { useCallback } from 'react';
import { DollarSign, Delete, RotateCcw } from 'lucide-react';

export interface CashPaymentSectionProps {
  totalPagar: number;
  efectivoRecibido: number;
  onChangeEfectivo: (val: number) => void;
  billetesSugeridos: number[];
  vueltoEfectivo: number;
  saldoFaltanteEfectivo: number;
  onCobroEfectivoExactoDirecto?: () => void;
}

export const CashPaymentSection: React.FC<CashPaymentSectionProps> = ({
  totalPagar,
  efectivoRecibido,
  onChangeEfectivo,
  billetesSugeridos,
  vueltoEfectivo,
  saldoFaltanteEfectivo,
  onCobroEfectivoExactoDirecto,
}) => {
  // Manejador del teclado numérico táctil en pantalla
  const handleKeypadPress = useCallback(
    (key: string) => {
      const currentStr = String(efectivoRecibido > 0 ? efectivoRecibido : '');

      if (key === 'CLEAR') {
        onChangeEfectivo(0);
        return;
      }

      if (key === 'BACKSPACE') {
        const nextStr = currentStr.slice(0, -1);
        onChangeEfectivo(nextStr ? parseInt(nextStr, 10) : 0);
        return;
      }

      const nextStr = currentStr + key;
      // Límite de seguridad de 9 cifras COP (hasta $999.999.999)
      if (nextStr.length <= 9) {
        onChangeEfectivo(parseInt(nextStr, 10));
      }
    },
    [efectivoRecibido, onChangeEfectivo]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Columna Izquierda: Input Principal y Billetes Sugeridos */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        {/* Input Principal de Efectivo Recibido */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 flex flex-col gap-2">
          <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center justify-between">
            <span>Efectivo Recibido por Cliente</span>
            {efectivoRecibido > 0 && efectivoRecibido < totalPagar && (
              <span className="text-amber-400 font-normal">
                Faltan: ${saldoFaltanteEfectivo.toLocaleString('es-CO')}
              </span>
            )}
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
            <input
              type="text"
              inputMode="numeric"
              value={efectivoRecibido > 0 ? efectivoRecibido.toLocaleString('es-CO') : ''}
              placeholder="0"
              onChange={(e) => {
                const numericOnly = e.target.value.replace(/\D/g, '');
                onChangeEfectivo(numericOnly ? parseInt(numericOnly, 10) : 0);
              }}
              className="w-full pl-12 pr-4 py-3 bg-slate-950/80 border border-white/10 rounded-xl text-2xl font-bold font-mono text-cyan-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
        </div>

        {/* Billetes Sugeridos COP */}
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
            Billetes Sugeridos (COP)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {billetesSugeridos.map((denominacion) => {
              const isExacto = denominacion === totalPagar;
              return (
                <button
                  key={`den-${denominacion}`}
                  type="button"
                  onClick={() => onChangeEfectivo(denominacion)}
                  className={`min-h-[48px] px-3 py-2.5 rounded-xl font-bold font-mono text-sm border transition-all flex flex-col items-center justify-center ${
                    efectivoRecibido === denominacion
                      ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-950'
                      : 'bg-slate-900/60 hover:bg-slate-800/80 border-white/10 text-slate-200 hover:border-cyan-500/30'
                  }`}
                >
                  <span className="text-xs uppercase text-slate-400 font-sans font-medium">
                    {isExacto ? 'Exacto' : 'Billete'}
                  </span>
                  <span>${denominacion.toLocaleString('es-CO')}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Botón de Cobro Rápido 1-Tap Efectivo Directo (Regla 12 Años / F8) */}
        {onCobroEfectivoExactoDirecto && (
          <button
            type="button"
            data-testid="btn-efectivo-exacto-directo"
            onClick={onCobroEfectivoExactoDirecto}
            className="w-full min-h-[48px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/30 transition-all active:scale-[0.98] cursor-pointer"
          >
            <span>⚡ Cobro Inmediato (1-Tap F8)</span>
            <span className="text-xs font-mono font-bold bg-black/20 px-2 py-0.5 rounded-full">
              ${totalPagar.toLocaleString('es-CO')}
            </span>
          </button>
        )}

        {/* Visor Destacado de Cambio / Vuelto */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-emerald-500/20 flex items-center justify-between mt-auto">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Cambio a Entregar (Vuelto)
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {efectivoRecibido >= totalPagar
                ? 'Monto suficiente para cerrar venta'
                : 'Esperando ingreso completo de efectivo'}
            </div>
          </div>
          <div
            data-testid="display-vuelto"
            className="text-3xl font-extrabold font-mono text-emerald-400 tracking-tight"
          >
            ${vueltoEfectivo.toLocaleString('es-CO')}
          </div>
        </div>
      </div>

      {/* Columna Derecha: Teclado Numérico Táctil (Numpad) */}
      <div className="lg:col-span-5 bg-slate-900/40 p-3.5 rounded-xl border border-white/5 flex flex-col gap-2">
        <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
          Teclado Táctil de Caja
        </span>
        <div className="grid grid-cols-3 gap-2 flex-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '00'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeypadPress(digit)}
              className="min-h-[48px] h-12 bg-slate-900/80 hover:bg-slate-800 border border-white/10 rounded-xl text-lg font-bold font-mono text-slate-200 active:scale-95 transition-all flex items-center justify-center select-none"
            >
              {digit}
            </button>
          ))}

          {/* Botón Backspace */}
          <button
            type="button"
            aria-label="Borrar último dígito"
            onClick={() => handleKeypadPress('BACKSPACE')}
            className="min-h-[48px] h-12 bg-slate-900/80 hover:bg-rose-950/40 hover:border-rose-500/40 border border-white/10 rounded-xl text-slate-400 hover:text-rose-400 active:scale-95 transition-all flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>

          {/* Botón Clear / Limpiar */}
          <button
            type="button"
            onClick={() => handleKeypadPress('CLEAR')}
            className="col-span-3 min-h-[44px] h-11 bg-slate-950 hover:bg-slate-800 border border-white/5 rounded-xl text-xs uppercase tracking-wider font-semibold text-slate-400 hover:text-slate-200 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpiar Monto</span>
          </button>
        </div>
      </div>
    </div>
  );
};

