import React, { useState } from 'react';
import { X, Package } from 'lucide-react';
import { LineaPedido } from '../../../types/orders.types';
import { Producto } from '../../../types/inventory.types';

interface QuantityModalProps {
  isOpen: boolean;
  onClose: () => void;
  linea: LineaPedido;
  producto: Producto;
  onConfirm: (cantidadReal: number, loteSeleccionado?: string) => void;
}

export const QuantityModal: React.FC<QuantityModalProps> = ({
  isOpen,
  onClose,
  linea,
  producto,
  onConfirm
}) => {
  const [cantidadReal, setCantidadReal] = useState<string>(linea.cantidadAlistada > 0 ? linea.cantidadAlistada.toString() : linea.cantidadSolicitada.toString());
  const [lote, setLote] = useState<string>(linea.loteSeleccionado || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedCantidad = parseInt(cantidadReal, 10);
    if (!isNaN(parsedCantidad) && parsedCantidad >= 0) {
      onConfirm(parsedCantidad, lote.trim() || undefined);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen text-center w-full">
        <div className="fixed inset-0 transition-opacity" onClick={onClose} />

        <div className="relative inline-block w-full max-w-md p-6 overflow-hidden text-left align-middle transition-all transform bg-slate-800 shadow-2xl rounded-2xl border border-slate-700">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-400" />
              Cantidad a Despachar
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
                Cantidad Alistada (Fulfill) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="0"
                  max={linea.cantidadSolicitada}
                  required
                  value={cantidadReal}
                  onChange={(e) => setCantidadReal(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white text-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="0"
                  autoFocus
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <span className="text-slate-400 font-medium">{producto.unidadMedida}</span>
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
                disabled={!cantidadReal || isNaN(parseInt(cantidadReal, 10)) || parseInt(cantidadReal, 10) < 0}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
