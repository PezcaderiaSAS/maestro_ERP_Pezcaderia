import React from 'react';
import { Save, CreditCard } from 'lucide-react';

interface PaymentPanelProps {
  totalFinal: number;
  onPagar: () => void;
  onGuardarBorrador: () => void;
  isDisabled: boolean;
}

export const PaymentPanel: React.FC<PaymentPanelProps> = ({
  totalFinal,
  onPagar,
  onGuardarBorrador,
  isDisabled,
}) => {
  return (
    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
      <button 
        className="btn-secondary" 
        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '12px 8px' }}
        onClick={onGuardarBorrador}
        disabled={isDisabled}
      >
        <Save size={16} />
        <span>Guardar</span>
      </button>
      <button 
        className="btn-primary" 
        style={{ 
          flex: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '8px', 
          padding: '12px 8px', 
          backgroundColor: isDisabled || !isFinite(totalFinal) || totalFinal <= 0 ? '#CBD5E1' : 'var(--primary-color)',
          cursor: isDisabled || !isFinite(totalFinal) || totalFinal <= 0 ? 'not-allowed' : 'pointer'
        }}
        onClick={onPagar}
        disabled={isDisabled || !isFinite(totalFinal) || totalFinal <= 0}
      >
        <CreditCard size={16} />
        <span>Cobrar: ${(isFinite(totalFinal) && totalFinal >= 0 ? totalFinal : 0).toLocaleString('es-CO')}</span>
      </button>
    </div>
  );
};
