import React, { useState } from 'react';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { inventoryAdjustmentSchema } from '../../schemas/inventory.schema';

interface ScrapAdjustmentModalProps {
  sku: string;
  batchId: string | null;
  onClose: () => void;
}

export const ScrapAdjustmentModal: React.FC<ScrapAdjustmentModalProps> = ({ sku, batchId, onClose }) => {
  const { currentWarehouseId, adjustStock, state, error } = useInventoryStore();
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [movementType, setMovementType] = useState<'SCRAP' | 'COUNT_ADJUSTMENT'>('SCRAP');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    try {
      const parsedQuantity = parseFloat(quantity);
      // Si es merma, el valor se envía como negativo
      const finalQuantity = movementType === 'SCRAP' ? -Math.abs(parsedQuantity) : parsedQuantity;

      const payload = inventoryAdjustmentSchema.parse({
        warehouseId: currentWarehouseId || '',
        batchId: batchId || undefined,
        sku,
        quantity: finalQuantity,
        movementType,
        notes
      });

      await adjustStock(payload);
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

  const isAdjusting = state === 'ADJUSTING';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 shadow-2xl rounded-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-rose-500/20 bg-rose-500/5 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-rose-100 tracking-wide">Registro de Merma / Ajuste</h2>
          <button onClick={onClose} disabled={isAdjusting} className="text-slate-400 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div className="p-3 bg-slate-800/50 border border-white/5 rounded-xl flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">SKU</p>
              <p className="font-mono text-white text-sm">{sku}</p>
            </div>
            {batchId && (
              <div className="text-right">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Lote</p>
                <p className="font-mono text-white text-sm">{batchId.split('-')[0]}</p>
              </div>
            )}
          </div>

          {(error || validationError) && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-sm text-rose-400">
              {validationError || error}
            </div>
          )}

          <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setMovementType('SCRAP')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                movementType === 'SCRAP' 
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              Merma (Despiece)
            </button>
            <button
              type="button"
              onClick={() => setMovementType('COUNT_ADJUSTMENT')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                movementType === 'COUNT_ADJUSTMENT' 
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              Ajuste Inventario
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">
              Cantidad {movementType === 'SCRAP' ? 'a descontar' : 'a ajustar'} (Kg)
            </label>
            <div className="relative">
              <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-mono text-lg font-bold ${movementType === 'SCRAP' ? 'text-rose-500' : 'text-amber-500'}`}>
                {movementType === 'SCRAP' ? '-' : '±'}
              </span>
              <input 
                type="number" 
                step="0.001"
                placeholder="0.000"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white font-mono text-lg focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-shadow"
                disabled={isAdjusting}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Justificación (Requerida)</label>
            <input 
              type="text" 
              placeholder="Ej: Merma por limpieza de filete"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-shadow"
              disabled={isAdjusting}
            />
          </div>

          <div className="mt-2 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              disabled={isAdjusting}
              className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isAdjusting}
              className={`flex-1 px-4 py-3 text-white rounded-xl font-medium shadow-lg transition-colors flex justify-center items-center ${
                movementType === 'SCRAP' 
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20' 
                  : 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20'
              }`}
            >
              {isAdjusting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Confirmar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
