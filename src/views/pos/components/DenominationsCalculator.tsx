import React, { useState, useMemo } from 'react';
import { Plus, Minus } from 'lucide-react';

export interface DenominationsCalculatorProps {
  value: Record<string, number>;
  onChange: (val: Record<string, number>) => void;
  onConfirm: (isValid: boolean) => void;
}

const BILLETES = [100000, 50000, 20000, 10000, 5000, 2000, 1000];
const MONEDAS = [1000, 500, 200, 100, 50];

export const DenominationsCalculator: React.FC<DenominationsCalculatorProps> = ({
  value,
  onChange,
  onConfirm,
}) => {
  const [confirmed, setConfirmed] = useState(false);

  const totalCalculado = useMemo(() => {
    return Object.entries(value).reduce((acc, [denom, qty]) => {
      return acc + Number(denom) * qty;
    }, 0);
  }, [value]);

  const handleUpdate = (denom: number, qty: number) => {
    if (qty < 0 || isNaN(qty)) qty = 0;
    const newValue = { ...value, [denom.toString()]: qty };
    onChange(newValue);
    
    // Si cambia un valor y estaba confirmado, lo desconfirmamos por seguridad
    if (confirmed) {
      setConfirmed(false);
      onConfirm(false);
    }
  };

  const handleIncrement = (denom: number) => {
    const currentQty = value[denom.toString()] || 0;
    handleUpdate(denom, currentQty + 1);
  };

  const handleDecrement = (denom: number) => {
    const currentQty = value[denom.toString()] || 0;
    if (currentQty > 0) {
      handleUpdate(denom, currentQty - 1);
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setConfirmed(isChecked);
    onConfirm(isChecked);
  };

  const renderRow = (denom: number) => {
    const qty = value[denom.toString()] || 0;
    return (
      <div key={denom} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
        <span className="text-gray-700 font-medium w-24">
          ${denom.toLocaleString()}
        </span>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => handleDecrement(denom)}
            className="p-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <Minus size={16} />
          </button>
          <input
            type="number"
            min="0"
            value={qty || ''}
            onChange={(e) => handleUpdate(denom, parseInt(e.target.value, 10))}
            className="w-16 text-center border border-gray-300 rounded py-1 px-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hide-arrows"
          />
          <button
            type="button"
            onClick={() => handleIncrement(denom)}
            className="p-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[400px] overflow-y-auto">
        {/* Billetes */}
        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">Billetes</h3>
          <div className="flex flex-col">
            {BILLETES.map(renderRow)}
          </div>
        </div>

        {/* Monedas */}
        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">Monedas</h3>
          <div className="flex flex-col">
            {MONEDAS.map(renderRow)}
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="bg-gray-50 p-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 sticky bottom-0">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="confirm-arqueo"
            checked={confirmed}
            onChange={handleCheckboxChange}
            className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <label htmlFor="confirm-arqueo" className="text-sm text-gray-700 cursor-pointer select-none">
            Confirmo que el conteo es exacto
          </label>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Calculado</p>
          <p className="text-2xl font-bold text-blue-700">
            ${totalCalculado.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};
