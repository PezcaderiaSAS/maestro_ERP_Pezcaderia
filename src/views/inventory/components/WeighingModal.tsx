import React, { useState } from 'react';
import { X, Scale } from 'lucide-react';
import { LineaPedido } from '../../../types/orders.types';
import { Producto } from '../../../types/inventory.types';

interface WeighingModalProps {
  isOpen: boolean;
  onClose: () => void;
  linea: LineaPedido;
  producto: Producto;
  onConfirm: (pesoReal: number, loteSeleccionado?: string) => void;
}

export const WeighingModal: React.FC<WeighingModalProps> = ({
  isOpen,
  onClose,
  linea,
  producto,
  onConfirm
}) => {
  const [pesoReal, setPesoReal] = useState<string>(linea.pesoReal?.toString() || '');
  const [lote, setLote] = useState<string>(linea.loteSeleccionado || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPeso = parseFloat(pesoReal);
    if (!isNaN(parsedPeso) && parsedPeso > 0) {
      onConfirm(parsedPeso, lote.trim() || undefined);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-slate-900/75" onClick={onClose} />

        <div className="relative inline-block w-full max-w-md p-6 overflow-hidden text-left align-middle transition-all transform bg-slate-800 shadow-xl rounded-2xl border border-slate-700">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Scale className="w-6 h-6 text-blue-400" />
              Pesaje de Producto
            </h3>
            <button
              onClick={onClose}
              className="p-1 transition-colors text-slate-400 hover:text-white rounded-lg hover:bg-slate-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-700">
              <h4 className="font-medium text-slate-200">{producto.nombre}</h4>
              <p className="text-sm text-slate-400 mt-1">
                SKU: {producto.sku} | Solicita: <span className="font-semibold text-white">{linea.cantidadSolicitada} {producto.unidadMedida}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Peso Real (KG) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  required
                  value={pesoReal}
                  onChange={(e) => setPesoReal(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white text-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="0.00"
                  autoFocus
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <span className="text-slate-400 font-medium">KG</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Lote (Opcional - Trazabilidad)
              </label>
              <input
                type="text"
                value={lote}
                onChange={(e) => setLote(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Ej. LOTE-2024-05"
              />
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!pesoReal || isNaN(parseFloat(pesoReal)) || parseFloat(pesoReal) <= 0}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar Peso
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
