import React from 'react';
import { Plus } from 'lucide-react';

interface DiscountPanelProps {
  subtotal: number;
  totalItems: number;
  descuentoPct: number;
  descuentoValor: number;
  totalIva?: number;
  subtotalBaseGravable?: number;
  onDescuentoClick: () => void;
}

export const DiscountPanel: React.FC<DiscountPanelProps> = ({
  subtotal,
  totalItems,
  descuentoPct,
  descuentoValor,
  totalIva = 0,
  subtotalBaseGravable,
  onDescuentoClick,
}) => {
  return (
    <div className="pos-discount-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B' }}>
        <span>Subtotal ({totalItems} {totalItems === 1 ? 'ítem' : 'ítems'})</span>
        <span style={{ fontWeight: 600, color: '#0F172A' }}>${subtotal.toLocaleString('es-CO')}</span>
      </div>
      {totalIva > 0 && subtotalBaseGravable !== undefined && (
        <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748B' }}>
          <span>Base Gravable</span>
          <span style={{ fontWeight: 500, color: '#475569' }}>${subtotalBaseGravable.toLocaleString('es-CO')}</span>
        </div>
      )}
      <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B' }}>
        <span>{totalIva > 0 ? 'IVA Incluido' : 'Impuestos (0%)'}</span>
        <span style={{ fontWeight: 600, color: '#0F172A' }}>${totalIva.toLocaleString('es-CO')}</span>
      </div>
      <div 
        className="summary-row" 
        style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', cursor: 'pointer' }}
        onClick={onDescuentoClick}
        title="Aplicar o modificar descuento global (Atajo: F4)"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onDescuentoClick();
          }
        }}
      >
        <span style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
          Descuento {descuentoPct > 0 && `(${descuentoPct}%)`} <Plus size={12} />
          <kbd className="px-1 py-0.5 text-[9px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded ml-1">F4</kbd>
          {descuentoPct > 10 && (
            <span className="px-1.5 py-0.5 text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md font-medium">
              Supervisor
            </span>
          )}
        </span>
        <span style={{ color: descuentoPct > 0 ? 'var(--primary-color)' : '#64748B', fontWeight: 600 }}>
          -${descuentoValor.toLocaleString('es-CO')}
        </span>
      </div>
    </div>
  );
};
