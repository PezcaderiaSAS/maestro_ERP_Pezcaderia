import React from 'react';
import { Plus } from 'lucide-react';

interface DiscountPanelProps {
  subtotal: number;
  totalItems: number;
  descuentoPct: number;
  descuentoValor: number;
  onDescuentoClick: () => void;
}

export const DiscountPanel: React.FC<DiscountPanelProps> = ({
  subtotal,
  totalItems,
  descuentoPct,
  descuentoValor,
  onDescuentoClick,
}) => {
  return (
    <div className="pos-discount-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B' }}>
        <span>Subtotal ({totalItems} ítems)</span>
        <span style={{ fontWeight: 600, color: '#0F172A' }}>${subtotal.toLocaleString('es-CO')}</span>
      </div>
      <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B' }}>
        <span>Impuestos (0%)</span>
        <span style={{ fontWeight: 600, color: '#0F172A' }}>$0</span>
      </div>
      <div 
        className="summary-row" 
        style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', cursor: 'pointer' }}
        onClick={onDescuentoClick}
      >
        <span style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
          Descuento {descuentoPct > 0 && `(${descuentoPct}%)`} <Plus size={12} />
        </span>
        <span style={{ color: descuentoPct > 0 ? 'var(--primary-color)' : '#64748B', fontWeight: 600 }}>
          -${descuentoValor.toLocaleString('es-CO')}
        </span>
      </div>
    </div>
  );
};
