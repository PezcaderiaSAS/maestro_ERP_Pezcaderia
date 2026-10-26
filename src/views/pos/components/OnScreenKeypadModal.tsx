import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Delete, Check, RotateCcw, Scale, Hash } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export interface OnScreenKeypadModalProps {
  isOpen: boolean;
  titulo: string;
  subtitulo?: string;
  valorInicial?: number;
  unidad?: 'KG' | 'UND' | 'UNIDAD';
  precioUnitario?: number;
  onConfirm: (valor: number) => void;
  onClose: () => void;
}

const CHIPS_KG = [
  { label: '0.25 kg', valor: 0.25 },
  { label: '0.5 kg', valor: 0.5 },
  { label: '0.75 kg', valor: 0.75 },
  { label: '1 kg', valor: 1.0 },
  { label: '1.5 kg', valor: 1.5 },
  { label: '2 kg', valor: 2.0 },
  { label: '3 kg', valor: 3.0 },
  { label: '5 kg', valor: 5.0 },
];

const CHIPS_UND = [
  { label: '1 und', valor: 1 },
  { label: '2 und', valor: 2 },
  { label: '3 und', valor: 3 },
  { label: '5 und', valor: 5 },
  { label: '6 und', valor: 6 },
  { label: '10 und', valor: 10 },
  { label: '12 und', valor: 12 },
  { label: '24 und', valor: 24 },
];

export const OnScreenKeypadModal: React.FC<OnScreenKeypadModalProps> = ({
  isOpen,
  titulo,
  subtitulo,
  valorInicial = 1,
  unidad = 'KG',
  precioUnitario = 0,
  onConfirm,
  onClose,
}) => {
  const [valStr, setValStr] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValStr(valorInicial > 0 ? String(valorInicial) : '');
    }
  }, [isOpen, valorInicial]);

  // Listener para teclado físico
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      } else if (/^[0-9]$/.test(e.key)) {
        handlePressDigit(e.key);
      } else if (e.key === '.' || e.key === ',') {
        handlePressDot();
      } else if (e.key === 'Backspace') {
        handleBackspace();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, valStr, precioUnitario]);

  if (!isOpen) return null;

  const numericVal = useMemo(() => {
    if (!valStr || valStr === '.') return 0;
    const parsed = parseFloat(valStr.replace(',', '.'));
    return isNaN(parsed) ? 0 : parsed;
  }, [valStr]);

  const subtotalCOP = Math.round(numericVal * (precioUnitario || 0));

  const handlePressDigit = (digit: string) => {
    setValStr((prev) => {
      if (prev === '0' && digit !== '.') return digit;
      if (prev.length >= 7) return prev;
      return prev + digit;
    });
  };

  const handlePressDot = () => {
    setValStr((prev) => {
      if (!prev) return '0.';
      if (prev.includes('.')) return prev;
      return prev + '.';
    });
  };

  const handleBackspace = () => {
    setValStr((prev) => {
      if (prev.length <= 1) return '';
      return prev.slice(0, -1);
    });
  };

  const handleClear = () => {
    setValStr('');
  };

  const handleSelectChip = (val: number) => {
    setValStr(String(val));
  };

  const handleConfirm = () => {
    const finalVal = numericVal > 0 ? numericVal : (valorInicial || 1);
    onConfirm(finalVal);
  };

  const isUnd = unidad === 'UND' || unidad === 'UNIDAD';
  const chips = isUnd ? CHIPS_UND : CHIPS_KG;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200 select-none"
    >
      <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Encabezado */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-700 flex items-center justify-center shrink-0">
              {isUnd ? <Hash size={18} /> : <Scale size={18} />}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 leading-tight">{titulo}</h3>
              {subtitulo && <p className="text-xs text-slate-500 font-semibold">{subtitulo}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            title="Cerrar (Escape)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Visor Numérico Gigante y Subtotal COP */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex flex-col items-center justify-center gap-1">
          <div className="flex items-baseline gap-2">
            <input
              ref={inputRef}
              data-testid="keypad-display-input"
              type="text"
              readOnly
              inputMode="none"
              value={valStr || '0'}
              className="text-4xl font-black font-mono text-slate-900 bg-transparent text-center border-0 outline-none w-48 tracking-tight"
            />
            <span className="text-xl font-bold font-mono text-slate-500 uppercase">
              {unidad === 'KG' ? 'kg' : 'und'}
            </span>
          </div>

          {precioUnitario > 0 && (
            <div className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <span>Subtotal Estimado:</span>
              <span
                data-testid="keypad-subtotal-cop"
                className="text-emerald-700 font-bold font-mono text-sm"
              >
                ${subtotalCOP.toLocaleString('es-CO')} COP
              </span>
            </div>
          )}
        </div>

        {/* Chips de Selección Rápida a 1 Toque (min-h-[48px]) */}
        <div className="p-3 border-b border-slate-200 bg-white">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Selección Rápida (1 Toque)
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {chips.map((chip) => {
              const isSelected = numericVal === chip.valor;
              return (
                <button
                  key={chip.valor}
                  type="button"
                  onClick={() => handleSelectChip(chip.valor)}
                  className={`min-h-[48px] px-1 text-xs font-bold rounded-xl border transition-all active:scale-95 cursor-pointer flex items-center justify-center text-center ${
                    isSelected
                      ? 'bg-cyan-600 border-cyan-600 text-white shadow-sm ring-2 ring-cyan-400'
                      : 'bg-white border-slate-200 hover:border-cyan-400 text-slate-700 hover:bg-cyan-50/50 shadow-xs'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Teclado Numérico Táctil Embebido (Botones >= 56px) */}
        <div className="p-3 bg-white">
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                data-testid={`keypad-btn-${digit}`}
                onClick={() => handlePressDigit(digit)}
                className="min-h-[56px] bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-900 font-black text-2xl rounded-xl border border-slate-200 transition-all active:scale-95 flex items-center justify-center shadow-xs cursor-pointer"
              >
                {digit}
              </button>
            ))}

            {/* Fila inferior: Borrar todo / Punto / 0 / Backspace */}
            <button
              type="button"
              data-testid="keypad-btn-dot"
              onClick={handlePressDot}
              className="min-h-[56px] bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-900 font-black text-2xl rounded-xl border border-slate-200 transition-all active:scale-95 flex items-center justify-center shadow-xs cursor-pointer"
            >
              .
            </button>
            <button
              type="button"
              data-testid="keypad-btn-0"
              onClick={() => handlePressDigit('0')}
              className="min-h-[56px] bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-900 font-black text-2xl rounded-xl border border-slate-200 transition-all active:scale-95 flex items-center justify-center shadow-xs cursor-pointer"
            >
              0
            </button>
            <button
              type="button"
              data-testid="keypad-btn-backspace"
              onClick={handleBackspace}
              className="min-h-[56px] bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 font-black rounded-xl border border-rose-200 transition-all active:scale-95 flex items-center justify-center shadow-xs cursor-pointer"
              title="Borrar último dígito"
            >
              <Delete size={22} />
            </button>
          </div>
        </div>

        {/* Barra de Acciones Finales */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex gap-2">
          <Button
            variant="outline"
            data-testid="keypad-btn-clear"
            onClick={handleClear}
            className="flex-1 min-h-[48px] bg-white text-slate-700 hover:bg-slate-100 font-bold border-slate-300 rounded-xl"
            leftIcon={<RotateCcw size={16} />}
          >
            Limpiar
          </Button>
          <Button
            variant="primary"
            data-testid="keypad-btn-confirm"
            onClick={handleConfirm}
            className="flex-[2] min-h-[56px] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-md rounded-xl flex items-center justify-center gap-2"
            leftIcon={<Check size={20} />}
          >
            <span>Confirmar</span>
            <kbd className="px-2 py-0.5 text-xs font-mono bg-black/20 rounded text-white font-bold">↵</kbd>
          </Button>
        </div>
      </div>
    </div>
  );
};
