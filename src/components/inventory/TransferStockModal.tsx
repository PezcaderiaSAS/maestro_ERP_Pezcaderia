import React, { useState } from 'react';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { inventoryTransferSchema } from '../../schemas/inventory.schema';

interface TransferStockModalProps {
  sku: string;
  batchId: string | null;
  onClose: () => void;
}

export const TransferStockModal: React.FC<TransferStockModalProps> = ({ sku, batchId, onClose }) => {
  const { currentWarehouseId, transferStock, state, error } = useInventoryStore();
  const [targetWarehouseId, setTargetWarehouseId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    try {
      const payload = inventoryTransferSchema.parse({
        sourceWarehouseId: currentWarehouseId || '',
        targetWarehouseId,
        batchId: batchId || undefined,
        sku,
        quantity: parseFloat(quantity),
        notes
      });

      await transferStock(payload);
      // Asumiendo que si el estado no es error, cerramos
      if (useInventoryStore.getState().error === null) {
        onClose();
      }
    } catch (err: any) {
      if (err.errors) {
        setValidationError(err.errors[0].message);
      } else {
        setValidationError(err.message);
      }
    }
  };

  const isTransferring = state === 'TRANSFERRING';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 shadow-2xl rounded-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
          <h2 className="text-lg font-semibold text-white tracking-wide">Traslado de Estibas / Lotes</h2>
          <button onClick={onClose} disabled={isTransferring} className="text-slate-400 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* Header info */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <p className="text-xs text-blue-400 uppercase tracking-wider mb-1">SKU Seleccionado</p>
            <p className="font-mono text-white">{sku}</p>
            {batchId && <p className="text-xs text-slate-400 font-mono mt-1">Lote: {batchId}</p>}
          </div>

          {(error || validationError) && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-sm text-rose-400">
              {validationError || error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Bodega Destino</label>
            <select 
              value={targetWarehouseId}
              onChange={(e) => setTargetWarehouseId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow appearance-none"
              disabled={isTransferring}
            >
              <option value="">Seleccione bodega...</option>
              <option value="b1111111-1111-1111-1111-111111111111">Cuarto Frío Principal</option>
              <option value="b2222222-2222-2222-2222-222222222222">Mostrador Tienda</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Cantidad (Kg)</label>
            <input 
              type="number" 
              step="0.001"
              placeholder="0.000"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
              disabled={isTransferring}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Motivo (Opcional)</label>
            <input 
              type="text" 
              placeholder="Ej: Reabastecimiento vitrina"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
              disabled={isTransferring}
            />
          </div>

          <div className="mt-2 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              disabled={isTransferring}
              className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isTransferring}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-colors flex justify-center items-center"
            >
              {isTransferring ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Ejecutar Traslado'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
