import React from 'react';
import { DetalleArqueo } from '../../../types/cash.types';

interface Props {
  valores: DetalleArqueo;
  onChange: (key: keyof DetalleArqueo, valor: number) => void;
  readOnly?: boolean;
}

const DENOMINACIONES_BILLETES = [
  { key: 'billetes100k', label: '$100.000', valor: 100000 },
  { key: 'billetes50k', label: '$50.000', valor: 50000 },
  { key: 'billetes20k', label: '$20.000', valor: 20000 },
  { key: 'billetes10k', label: '$10.000', valor: 10000 },
  { key: 'billetes5k', label: '$5.000', valor: 5000 },
  { key: 'billetes2k', label: '$2.000', valor: 2000 },
] as const;

const DENOMINACIONES_MONEDAS = [
  { key: 'monedas1k', label: '$1.000', valor: 1000 },
  { key: 'monedas500', label: '$500', valor: 500 },
  { key: 'monedas200', label: '$200', valor: 200 },
  { key: 'monedas100', label: '$100', valor: 100 },
  { key: 'monedas50', label: '$50', valor: 50 },
] as const;

export const CalculadorDenominaciones: React.FC<Props> = ({ valores, onChange, readOnly = false }) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevenir ingreso de caracteres inválidos
    if (['e', 'E', '+', '-', '.', ','].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleChange = (key: keyof DetalleArqueo, rawValue: string) => {
    // Normalizar valor vacío a 0
    if (rawValue === '') {
      onChange(key, 0);
      return;
    }
    const num = parseInt(rawValue, 10);
    // Evitar falsos positivos de NaN
    if (!Number.isNaN(num) && num >= 0) {
      onChange(key, num);
    }
  };

  const renderFila = (item: { key: keyof DetalleArqueo; label: string; valor: number }) => {
    const cantidad = valores[item.key] || 0;
    const subtotal = cantidad * item.valor;
    
    return (
      <div key={item.key} className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-slate-100/50 transition-colors">
        <div className="flex items-center gap-3">
          <span className="w-20 font-medium text-slate-700">{item.label}</span>
          <span className="text-slate-400 font-light text-sm">x</span>
          <input
            type="number"
            min="0"
            step="1"
            disabled={readOnly}
            // Mostrar vacío en UI si es 0 para limpiar el input en onFocus automáticamente
            value={cantidad === 0 ? '' : cantidad} 
            onChange={(e) => handleChange(item.key, e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="0"
            className="w-20 text-center py-2 px-3 bg-white border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-slate-900 disabled:bg-slate-50 disabled:text-slate-500"
          />
        </div>
        <div className="font-semibold text-slate-800 tabular-nums">
          ${subtotal.toLocaleString()}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
        
        {/* Columna de Billetes */}
        <div className="p-4 md:p-6 space-y-1">
          <div className="flex items-center gap-2 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-800">Billetes</h3>
          </div>
          
          <div className="space-y-1">
            {DENOMINACIONES_BILLETES.map(renderFila)}
          </div>
        </div>

        {/* Columna de Monedas */}
        <div className="p-4 md:p-6 space-y-1 bg-slate-50/50">
          <div className="flex items-center gap-2 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-800">Monedas</h3>
          </div>
          
          <div className="space-y-1">
            {DENOMINACIONES_MONEDAS.map(renderFila)}
          </div>
        </div>
      </div>
    </div>
  );
};
