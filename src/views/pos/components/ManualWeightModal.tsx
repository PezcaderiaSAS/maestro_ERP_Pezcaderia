import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Scale, Delete, Check, AlertCircle } from 'lucide-react';
import type { Product } from '../../../types/erp.types';

export interface ManualWeightModalProps {
  isOpen: boolean;
  producto: any;
  pesoInicial?: number;
  precioUnitario?: number;
  onConfirm?: (producto: any, pesoKg: number) => void;
  onConfirmWeight?: (pesoKg: number) => void;
  onClose: () => void;
}

const CHIPS_PESO_FRECUENTE = [
  { label: '0.25 kg', valor: 0.25 },
  { label: '0.5 kg', valor: 0.5 },
  { label: '0.75 kg', valor: 0.75 },
  { label: '1 kg', valor: 1.0 },
  { label: '1.5 kg', valor: 1.5 },
  { label: '2 kg', valor: 2.0 },
  { label: '3 kg', valor: 3.0 },
  { label: '5 kg', valor: 5.0 },
];

export const ManualWeightModal: React.FC<ManualWeightModalProps> = ({
  isOpen,
  producto,
  pesoInicial = 1.0,
  precioUnitario,
  onConfirm,
  onConfirmWeight,
  onClose,
}) => {
  const [pesoStr, setPesoStr] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const finalPrecioUnitario = useMemo(() => {
    if (typeof precioUnitario === 'number' && !isNaN(precioUnitario)) return precioUnitario;
    return Number(producto?.precioVentaPOS || producto?.precio_venta_pos || producto?.precioLista || producto?.precio || 0);
  }, [precioUnitario, producto]);

  // Sincronizar estado inicial al abrir modal
  useEffect(() => {
    if (isOpen) {
      const initial = pesoInicial > 0 ? String(pesoInicial) : '';
      setPesoStr(initial);
      setErrorMsg('');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [isOpen, pesoInicial]);

  const pesoNumerico = useMemo(() => {
    const val = parseFloat(pesoStr.replace(',', '.'));
    return isNaN(val) ? 0 : val;
  }, [pesoStr]);

  const subtotalCOP = useMemo(() => {
    return Math.round(pesoNumerico * finalPrecioUnitario);
  }, [pesoNumerico, finalPrecioUnitario]);

  if (!isOpen || !producto) return null;

  const handleChipClick = (valor: number) => {
    setPesoStr(String(valor));
    setErrorMsg('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeypadPress = (key: string) => {
    setErrorMsg('');
    if (key === 'backspace') {
      setPesoStr((prev) => prev.slice(0, -1));
      return;
    }

    if (key === '.') {
      if (pesoStr.includes('.')) return;
      setPesoStr((prev) => (prev === '' ? '0.' : prev + '.'));
      return;
    }

    // Limitar a máximo 3 decimales si ya hay punto
    if (pesoStr.includes('.')) {
      const parts = pesoStr.split('.');
      if (parts[1] && parts[1].length >= 3) return;
    }

    setPesoStr((prev) => (prev === '0' ? key : prev + key));
  };

  const handleConfirm = () => {
    if (pesoNumerico <= 0) {
      setErrorMsg('Por favor ingresa un peso mayor a 0 kg');
      return;
    }
    if (onConfirm) {
      onConfirm(producto, pesoNumerico);
      if (onConfirm.length === 1) {
        (onConfirm as any)(pesoNumerico);
      }
    }
    if (onConfirmWeight) {
      onConfirmWeight(pesoNumerico);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-800">
        {/* Cabecera del Producto */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold shadow-inner">
              <Scale size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {producto.nombre}
              </h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Precio x kg:{' '}
                <strong className="text-slate-800 font-mono font-bold">
                  ${finalPrecioUnitario.toLocaleString('es-CO')}
                </strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            title="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6 space-y-5">
          {/* Campo de Peso Principal & Subtotal */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Peso en Balanza (Kilogramos)
            </label>
            <div className="flex items-center justify-center gap-2">
              <input
                ref={inputRef}
                type="text"
                data-testid="manual-weight-input"
                value={pesoStr}
                onChange={(e) => {
                  setPesoStr(e.target.value);
                  setErrorMsg('');
                }}
                onKeyDown={handleKeyDown}
                onFocus={(e) => e.target.select()}
                placeholder="0.000"
                inputMode="none"
                className="w-48 text-center text-4xl font-black font-mono text-slate-900 bg-white border-2 border-cyan-500/40 focus:border-cyan-600 rounded-xl py-1 shadow-sm focus:outline-none"
              />
              <span className="text-xl font-bold text-slate-600">kg</span>
            </div>

            {/* Subtotal en Vivo */}
            <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between text-sm px-2">
              <span className="text-slate-500 font-medium">Subtotal Estimado:</span>
              <span
                data-testid="manual-weight-subtotal"
                className="text-lg font-bold font-mono text-emerald-700"
              >
                ${subtotalCOP.toLocaleString('es-CO')} COP
              </span>
            </div>
          </div>

          {/* Feedback de error si el peso no es válido */}
          {errorMsg && (
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl animate-in fade-in">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Chips de Peso Frecuente (1 Toque) */}
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Pesos Frecuentes (1 Toque)
            </span>
            <div className="grid grid-cols-4 gap-2">
              {CHIPS_PESO_FRECUENTE.map((chip) => (
                <button
                  key={chip.valor}
                  type="button"
                  onClick={() => handleChipClick(chip.valor)}
                  className={`min-h-[48px] px-2 py-2 text-xs font-bold rounded-xl border transition-all active:scale-95 ${
                    pesoNumerico === chip.valor
                      ? 'bg-cyan-600 border-cyan-600 text-white shadow-md'
                      : 'bg-white border-slate-200 hover:border-cyan-400 text-slate-700 hover:bg-cyan-50/50'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Keypad Numérico Táctil en Pantalla (Botones >= 56px) */}
          <div>
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  data-testid={`keypad-btn-${digit}`}
                  onClick={() => handleKeypadPress(digit)}
                  className="min-h-[56px] bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-black text-xl rounded-xl border border-slate-200/80 transition-transform active:scale-95 flex items-center justify-center shadow-sm"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                data-testid="keypad-btn-dot"
                onClick={() => handleKeypadPress('.')}
                className="min-h-[56px] bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-black text-2xl rounded-xl border border-slate-200/80 transition-transform active:scale-95 flex items-center justify-center shadow-sm"
              >
                .
              </button>
              <button
                type="button"
                data-testid="keypad-btn-0"
                onClick={() => handleKeypadPress('0')}
                className="min-h-[56px] bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-black text-xl rounded-xl border border-slate-200/80 transition-transform active:scale-95 flex items-center justify-center shadow-sm"
              >
                0
              </button>
              <button
                type="button"
                data-testid="keypad-btn-backspace"
                onClick={() => handleKeypadPress('backspace')}
                className="min-h-[56px] bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-600 font-bold rounded-xl border border-rose-200 transition-transform active:scale-95 flex items-center justify-center shadow-sm"
                title="Borrar"
              >
                <Delete size={22} />
              </button>
            </div>
          </div>

          {/* Botón Gigante de Acción: AGREGAR AL CARRITO (>= 56px de alto) */}
          <button
            type="button"
            data-testid="manual-weight-confirm-btn"
            onClick={handleConfirm}
            className="w-full min-h-[56px] px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-base rounded-2xl shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Check size={22} className="stroke-[2.5]" />
            <span>AGREGAR AL CARRITO (${subtotalCOP.toLocaleString('es-CO')})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
