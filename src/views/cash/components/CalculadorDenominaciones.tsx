import React from 'react';
import { DetalleArqueo } from '../../../types/cash.types';

interface Props {
  valores: DetalleArqueo;
  onChange: (key: keyof DetalleArqueo, valor: number) => void;
  readOnly?: boolean;
}

const DENOMINACIONES_BILLETES = [
  { key: 'billetes100k', label: '$100.000', valor: 100000, theme: 'green' },
  { key: 'billetes50k', label: '$50.000', valor: 50000, theme: 'purple' },
  { key: 'billetes20k', label: '$20.000', valor: 20000, theme: 'orange' },
  { key: 'billetes10k', label: '$10.000', valor: 10000, theme: 'rose' },
  { key: 'billetes5k', label: '$5.000', valor: 5000, theme: 'amber' },
  { key: 'billetes2k', label: '$2.000', valor: 2000, theme: 'blue' },
] as const;

const DENOMINACIONES_MONEDAS = [
  { key: 'monedas1k', label: '$1.000', valor: 1000, theme: 'slate' },
  { key: 'monedas500', label: '$500', valor: 500, theme: 'slate' },
  { key: 'monedas200', label: '$200', valor: 200, theme: 'slate' },
  { key: 'monedas100', label: '$100', valor: 100, theme: 'slate' },
  { key: 'monedas50', label: '$50', valor: 50, theme: 'slate' },
] as const;

const getThemeColors = (theme: string) => {
  switch(theme) {
    case 'green': return { bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46', iconBg: '#d1fae5', iconColor: '#059669' };
    case 'purple': return { bg: '#faf5ff', border: '#e9d5ff', text: '#6b21a8', iconBg: '#f3e8ff', iconColor: '#7e22ce' };
    case 'orange': return { bg: '#fff7ed', border: '#fed7aa', text: '#9a3412', iconBg: '#ffedd5', iconColor: '#c2410c' };
    case 'rose': return { bg: '#fff1f2', border: '#fecdd3', text: '#9f1239', iconBg: '#ffe4e6', iconColor: '#be123c' };
    case 'amber': return { bg: '#fffbeb', border: '#fde68a', text: '#92400e', iconBg: '#fef3c7', iconColor: '#b45309' };
    case 'blue': return { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', iconBg: '#dbeafe', iconColor: '#1d4ed8' };
    case 'slate': default: return { bg: '#f8fafc', border: '#e2e8f0', text: '#334155', iconBg: '#f1f5f9', iconColor: '#475569' };
  }
};

export const CalculadorDenominaciones: React.FC<Props> = ({ valores, onChange, readOnly = false }) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['e', 'E', '+', '-', '.', ','].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleChange = (key: keyof DetalleArqueo, rawValue: string) => {
    if (rawValue === '') {
      onChange(key, 0);
      return;
    }
    const num = parseInt(rawValue, 10);
    if (!Number.isNaN(num) && num >= 0) {
      onChange(key, num);
    }
  };

  const renderCard = (item: any) => {
    const cantidad = valores[item.key as keyof DetalleArqueo] || 0;
    const subtotal = cantidad * item.valor;
    const colors = getThemeColors(item.theme);
    const inputId = `input-denom-${item.key}`;

    const increment = () => onChange(item.key as keyof DetalleArqueo, cantidad + 1);
    const decrement = () => onChange(item.key as keyof DetalleArqueo, Math.max(0, cantidad - 1));

    return (
      <div
        key={item.key}
        className="flex flex-col justify-between p-3 rounded-xl border-2 shadow-sm transition-all hover:shadow-md"
        style={{
          backgroundColor: colors.bg,
          borderColor: colors.border,
          color: colors.text
        }}
      >
        {/* Header: Etiqueta de la Denominación y Subtotal */}
        <div className="flex justify-between items-center mb-2 gap-2 w-full">
          <span className="font-extrabold text-base md:text-lg shrink-0">{item.label}</span>
          <div className="text-right shrink-0">
            <span className="text-[10px] uppercase tracking-wide font-bold opacity-60 block">Subtotal</span>
            <span className="font-black text-sm text-slate-900" title={`$${subtotal.toLocaleString()}`}>
              ${subtotal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Input de Cantidad con Botones de Incremento / Decremento */}
        <div className="flex items-center gap-1.5 mt-auto w-full">
          <label htmlFor={inputId} className="opacity-70 font-semibold text-xs shrink-0 mr-0.5">
            CANT.
          </label>
          {!readOnly && (
            <button
              type="button"
              onClick={decrement}
              className="w-7 h-8 rounded-md bg-white border border-slate-300 flex items-center justify-center text-slate-700 font-bold hover:bg-slate-100 active:scale-95 transition-all shrink-0 select-none shadow-sm"
              title="Disminuir"
            >
              -
            </button>
          )}
          <input
            id={inputId}
            type="number"
            min="0"
            step="1"
            disabled={readOnly}
            data-denominacion={item.key}
            value={cantidad === 0 ? '' : cantidad}
            onChange={(e) => handleChange(item.key as keyof DetalleArqueo, e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={(e) => e.target.select()}
            placeholder="0"
            className="w-full flex-1 min-w-[50px] h-8 text-center bg-white border-2 border-slate-300 rounded-md font-extrabold text-base text-slate-900 transition-all outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner"
          />
          {!readOnly && (
            <button
              type="button"
              onClick={increment}
              className="w-7 h-8 rounded-md bg-white border border-slate-300 flex items-center justify-center text-slate-700 font-bold hover:bg-slate-100 active:scale-95 transition-all shrink-0 select-none shadow-sm"
              title="Aumentar"
            >
              +
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">

        {/* Columna Billetes */}
        <div className="p-4 md:p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 px-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm shrink-0"
              style={{ backgroundColor: '#d1fae5', color: '#059669' }}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg text-slate-800 m-0">Billetes</h3>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {DENOMINACIONES_BILLETES.map(renderCard)}
          </div>
        </div>

        {/* Columna Monedas */}
        <div className="p-4 md:p-5 flex flex-col gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2 px-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm shrink-0"
              style={{ backgroundColor: '#fef3c7', color: '#b45309' }}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg text-slate-800 m-0">Monedas</h3>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {DENOMINACIONES_MONEDAS.map(renderCard)}
          </div>
        </div>

      </div>
    </div>
  );
};
