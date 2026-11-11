import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Scale, Delete, Check, AlertCircle } from 'lucide-react';
import type { Product } from '../../../types/erp.types';

export interface ManualWeightModalProps {
  isOpen: boolean;
  producto: Product | any;
  pesoInicial?: number;
  precioUnitario?: number;
  onConfirm?: (producto: any, pesoKg: number) => void;
  onConfirmWeight?: (pesoKg: number) => void;
  onClose: () => void;
}

export const CHIPS_PESO_FRECUENTE = [
  { label: '0.25 kg', valor: 0.25, id: '0.25' },
  { label: '0.5 kg', valor: 0.5, id: '0.5' },
  { label: '0.75 kg', valor: 0.75, id: '0.75' },
  { label: '1 kg', valor: 1.0, id: '1' },
  { label: '1.5 kg', valor: 1.5, id: '1.5' },
  { label: '2 kg', valor: 2.0, id: '2' },
  { label: '3 kg', valor: 3.0, id: '3' },
  { label: '5 kg', valor: 5.0, id: '5' },
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

  // Determinar precio unitario efectivo con fallback seguro
  const finalPrecioUnitario = useMemo(() => {
    if (typeof precioUnitario === 'number' && !isNaN(precioUnitario)) return precioUnitario;
    return Number(
      producto?.precioVentaPOS ||
      producto?.precio_venta_pos ||
      producto?.precioLista ||
      producto?.precio ||
      0
    );
  }, [precioUnitario, producto]);

  // Sincronizar estado inicial al abrir modal
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (isOpen) {
      const initial = pesoInicial > 0 ? String(pesoInicial) : '';
      setPesoStr(initial);
      setErrorMsg('');
      timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOpen, pesoInicial]);

  // Cálculo numérico reactivo del peso
  const pesoNumerico = useMemo(() => {
    if (!pesoStr || pesoStr === '.') return 0;
    const val = parseFloat(pesoStr.replace(',', '.'));
    return isNaN(val) ? 0 : val;
  }, [pesoStr]);

  // Subtotal COP proyectado reactivo
  const subtotalCOP = useMemo(() => {
    return Math.round(pesoNumerico * finalPrecioUnitario);
  }, [pesoNumerico, finalPrecioUnitario]);

  // Listener global de Escape a nivel de ventana para cerrar el modal confiablemente sin importar el foco (Hito M4)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !producto) return null;

  // Manejador de selección rápida por chip
  const handleChipClick = (valor: number) => {
    setPesoStr(String(valor));
    setErrorMsg('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Manejador de teclado táctil numérico en pantalla
  const handleKeypadPress = (key: string) => {
    setErrorMsg('');
    if (key === 'clear' || key === 'c') {
      setPesoStr('');
      setErrorMsg('');
      return;
    }

    if (key === 'backspace') {
      setPesoStr((prev) => {
        if (prev.length <= 1) return '';
        return prev.slice(0, -1);
      });
      return;
    }

    if (key === '.') {
      if (pesoStr.includes('.')) return; // Evitar múltiples puntos decimales
      setPesoStr((prev) => (prev === '' ? '0.' : prev + '.'));
      return;
    }

    // Limitar a máximo 3 decimales para pesaje de alta precisión en balanza
    if (pesoStr.includes('.')) {
      const parts = pesoStr.split('.');
      if (parts[1] && parts[1].length >= 3) return;
    }

    // Reemplazar cero inicial si se digita un número sin punto
    setPesoStr((prev) => (prev === '0' ? key : prev + key));
  };

  // Limpiar entrada completa (tecla C)
  const handleClear = () => {
    setPesoStr('');
    setErrorMsg('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Confirmar pesaje
  const handleConfirm = () => {
    if (pesoNumerico <= 0) {
      setErrorMsg('Por favor ingresa un peso mayor a 0 kg');
      return;
    }
    if (onConfirm) {
      if (onConfirm.length === 1) {
        (onConfirm as any)(pesoNumerico);
      } else {
        onConfirm(producto, pesoNumerico);
      }
    }
    if (onConfirmWeight) {
      onConfirmWeight(pesoNumerico);
    }
    onClose();
  };

  // Manejador de teclado en el input
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    }
  };

  const productName = producto?.nombre || producto?.name || 'Producto a Granel';

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-manual-weight-title"
      data-testid="modal-manual-weight"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none"
    >
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-800">
        {/* 1. Cabecera del Producto */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold shadow-inner shrink-0">
              <Scale size={24} />
            </div>
            <div>
              <h3 
                id="modal-manual-weight-title"
                className="text-base font-bold text-slate-900 leading-tight"
              >
                {productName}
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
            type="button"
            data-testid="btn-close-weight-modal"
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Cerrar"
            aria-label="Cerrar modal de pesaje"
          >
            <X size={20} />
          </button>
        </div>

        {/* 2. Cuerpo del Modal */}
        <div className="p-6 space-y-4">
          {/* Visor Numérico Destacado & Subtotal Proyectado */}
          <div 
            data-testid="display-manual-weight"
            className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center"
          >
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Peso en Balanza (Kilogramos)
            </label>
            <div className="flex items-center justify-center gap-2.5">
              <input
                ref={inputRef}
                type="text"
                data-testid="manual-weight-input"
                value={pesoStr}
                onChange={(e) => {
                  setPesoStr(e.target.value);
                  setErrorMsg('');
                }}
                onKeyDown={handleInputKeyDown}
                onFocus={(e) => e.target.select()}
                placeholder="0.000"
                inputMode="none"
                className="w-48 text-center text-4xl font-black font-mono text-slate-900 bg-white border-2 border-cyan-500/40 focus:border-cyan-600 rounded-xl py-1 shadow-sm focus:outline-none"
              />
              <span 
                data-testid="badge-unit-kg"
                className="text-lg font-black font-mono text-cyan-700 bg-cyan-100 px-3 py-1.5 rounded-xl border border-cyan-200 uppercase tracking-wide"
              >
                KG
              </span>
            </div>

            {/* Subtotal en Vivo */}
            <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-sm px-2">
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

          {/* Chips de Peso Frecuente (1 Toque, Targets >= 48px) */}
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Pesos Frecuentes (1 Toque)
            </span>
            <div className="grid grid-cols-4 gap-2">
              {CHIPS_PESO_FRECUENTE.map((chip) => {
                const isSelected = pesoNumerico === chip.valor;
                return (
                  <button
                    key={chip.valor}
                    type="button"
                    data-testid={`chip-weight-${chip.valor}`}
                    onClick={() => handleChipClick(chip.valor)}
                    className={`min-h-[48px] min-w-[48px] px-2 py-2 text-xs font-bold rounded-xl border transition-all active:scale-95 cursor-pointer flex items-center justify-center ${
                      isSelected
                        ? 'bg-cyan-600 border-cyan-600 text-white shadow-md'
                        : 'bg-white border-slate-200 hover:border-cyan-400 text-slate-700 hover:bg-cyan-50/50 shadow-xs'
                    }`}
                  >
                    <span 
                      data-testid={chip.valor === 1 ? 'chip-weight-1.0' : undefined} 
                      className="contents"
                    >
                      {chip.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Keypad Numérico Táctil en Pantalla (Botones >= 56px de alto, 94-128px de ancho) */}
          <div className="space-y-2">
            {/* Cuadrícula de dígitos 1 al 9 */}
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  data-testid={`keypad-btn-${digit}`}
                  onClick={() => handleKeypadPress(digit)}
                  className="min-h-[56px] min-w-[48px] bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-black text-2xl rounded-xl border border-slate-200/80 transition-transform active:scale-95 flex items-center justify-center shadow-xs cursor-pointer"
                >
                  {digit}
                </button>
              ))}
            </div>

            {/* Fila 4: Limpiar (C), Dígito 0, Punto Decimal (.) y Retroceso (⌫) */}
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                data-testid="keypad-btn-clear"
                onClick={handleClear}
                className="min-h-[56px] min-w-[48px] bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-800 font-black text-xl rounded-xl border border-amber-200 transition-transform active:scale-95 flex items-center justify-center shadow-xs cursor-pointer"
                title="Limpiar"
                aria-label="Limpiar entrada"
              >
                <span data-testid="keypad-btn-c" className="contents">
                  C
                </span>
              </button>
              <button
                type="button"
                data-testid="keypad-btn-0"
                onClick={() => handleKeypadPress('0')}
                className="min-h-[56px] min-w-[48px] bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-black text-2xl rounded-xl border border-slate-200/80 transition-transform active:scale-95 flex items-center justify-center shadow-xs cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                data-testid="keypad-btn-dot"
                onClick={() => handleKeypadPress('.')}
                className="min-h-[56px] min-w-[48px] bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-black text-2xl rounded-xl border border-slate-200/80 transition-transform active:scale-95 flex items-center justify-center shadow-xs cursor-pointer"
              >
                .
              </button>
              <button
                type="button"
                data-testid="keypad-btn-backspace"
                onClick={() => handleKeypadPress('backspace')}
                className="min-h-[56px] min-w-[48px] bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-600 font-bold rounded-xl border border-rose-200 transition-transform active:scale-95 flex items-center justify-center shadow-xs cursor-pointer"
                title="Borrar"
                aria-label="Borrar"
              >
                <Delete size={22} />
              </button>
            </div>
          </div>

          {/* Botonera de Acción Principal (Confirmar >= 56px con texto compatible) */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              data-testid="manual-weight-confirm-btn"
              onClick={handleConfirm}
              className="w-full min-h-[56px] px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-base rounded-2xl shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span data-testid="btn-confirm-weight" className="contents">
                <Check size={22} className="stroke-[2.5]" />
                <span>AGREGAR AL CARRITO (${subtotalCOP.toLocaleString('es-CO')})</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
