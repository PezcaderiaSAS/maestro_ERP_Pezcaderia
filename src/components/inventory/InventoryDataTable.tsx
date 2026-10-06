import React from 'react';
import { useInventoryStore } from '../../stores/useInventoryStore';

interface InventoryDataTableProps {
  onTransfer: (sku: string, batchId: string | null) => void;
  onAdjust: (sku: string, batchId: string | null) => void;
}

export const InventoryDataTable: React.FC<InventoryDataTableProps> = ({ onTransfer, onAdjust }) => {
  const { stock, isLoading } = useInventoryStore();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 w-full bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-950/90 z-10 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium border-b border-white/5">SKU</th>
              <th className="px-4 py-3 font-medium border-b border-white/5">Lote (Batch)</th>
              <th className="px-4 py-3 font-medium border-b border-white/5 text-right">Cantidad (Kg)</th>
              <th className="px-4 py-3 font-medium border-b border-white/5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {stock.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No hay stock disponible en esta bodega.
                </td>
              </tr>
            ) : (
              stock.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-4 py-3 text-slate-200 font-mono">{item.sku}</td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                    {item.batch_id ? item.batch_id.split('-')[0].toUpperCase() : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-emerald-400 font-mono text-right tabular-nums font-medium">
                    {item.quantity.toFixed(3)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onTransfer(item.sku, item.batch_id)}
                        className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 rounded-lg text-xs transition-colors"
                      >
                        Trasladar
                      </button>
                      <button 
                        onClick={() => onAdjust(item.sku, item.batch_id)}
                        className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 rounded-lg text-xs transition-colors"
                      >
                        Merma
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
