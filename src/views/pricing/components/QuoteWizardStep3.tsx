import React from 'react';
import { Plus, Edit2, X, Save } from 'lucide-react';
import type { Product } from '../../../types/erp.types';

export interface QuoteItem {
  product: any;
  cantidad: number;
  descuento: number;
  precioOverride?: number;
  detalle?: string;
  listo?: boolean;
  esDevolucion?: boolean;
  devolucionId?: string;
}

interface QuoteWizardStep3Props {
  quoteItems: QuoteItem[];
  setQuoteItems: React.Dispatch<React.SetStateAction<QuoteItem[]>> | ((items: any) => void);
  getQuoteItemUnitPrice: (item: any) => number;
  onOpenAddItemModal: (product?: any) => void;
  onOpenEditItemModal: (index: number, item: any) => void;
  observacionesPedido: string;
  setObservacionesPedido: (val: string) => void;
  quoteDiscountGlobal: number;
  setQuoteDiscountGlobal: (val: number) => void;
  quoteSubtotal: number;
  quoteLineDiscountsTotal: number;
  quoteSubtotalAfterLineDiscounts: number;
  quoteGlobalDiscountValue: number;
  quoteDevolucionesTotal: number;
  quoteTotalFinal: number;
  onPrevStep: () => void;
  onSaveQuotation: () => void;
}

export const QuoteWizardStep3: React.FC<QuoteWizardStep3Props> = ({
  quoteItems,
  setQuoteItems,
  getQuoteItemUnitPrice,
  onOpenAddItemModal,
  onOpenEditItemModal,
  observacionesPedido,
  setObservacionesPedido,
  quoteDiscountGlobal,
  setQuoteDiscountGlobal,
  quoteSubtotal,
  quoteLineDiscountsTotal,
  quoteSubtotalAfterLineDiscounts,
  quoteGlobalDiscountValue,
  quoteDevolucionesTotal,
  quoteTotalFinal,
  onPrevStep,
  onSaveQuotation,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
        <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', margin: 0 }}>Paso 3: Productos y Descuentos</h4>
        <button
          type="button"
          onClick={onOpenAddItemModal}
          className="btn-primary"
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'var(--primary-color)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Plus size={16} /> Añadir Producto
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {quoteItems.length === 0 ? (
          <div
            style={{
              padding: '40px',
              textAlign: 'center',
              color: '#64748B',
              backgroundColor: '#F8FAFC',
              borderRadius: '8px',
              border: '1px dashed #CBD5E1',
            }}
          >
            <span style={{ fontSize: '32px' }}>🛍️</span>
            <p style={{ marginTop: '8px', fontWeight: 500 }}>Aún no hay productos en este pedido.</p>
            <p style={{ fontSize: '13px' }}>Haz clic en "Añadir Producto" para comenzar a armar la lista.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="hr-table">
              <thead>
                <tr>
                  <th>Estado</th>
                  <th>Producto</th>
                  <th>Cant.</th>
                  <th>Precio Unit.</th>
                  <th>Dcto.</th>
                  <th>Subtotal Línea</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {quoteItems.map((item, index) => {
                  const unitPrice = getQuoteItemUnitPrice(item);
                  const lineTotal = unitPrice * item.cantidad * (1 - (item.descuento || 0) / 100);

                  return (
                    <tr key={`${item.product.id}-${index}`} style={{ backgroundColor: item.esDevolucion ? '#FEF2F2' : 'white' }}>
                      <td>
                        {item.listo ? (
                          <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#D1FAE5', color: '#065F46', fontSize: '11px', fontWeight: 'bold' }}>
                            LISTO
                          </span>
                        ) : (
                          <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#FEF3C7', color: '#D97706', fontSize: '11px', fontWeight: 'bold' }}>
                            PNDT
                          </span>
                        )}
                        {item.esDevolucion && (
                          <span
                            style={{
                              display: 'block',
                              marginTop: '4px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: '#FEE2E2',
                              color: '#B91C1C',
                              fontSize: '10px',
                              fontWeight: 'bold',
                            }}
                          >
                            DEVOLUCIÓN
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.product.nombre}</div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>SKU: {item.product.sku}</div>
                        {item.detalle && (
                          <div style={{ fontSize: '11px', color: '#0EA5E9', marginTop: '2px', fontStyle: 'italic' }}>Nota: {item.detalle}</div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{item.cantidad}</span>{' '}
                        <span style={{ fontSize: '11px', color: '#64748B' }}>{item.product.unidadMedida || 'kg'}</span>
                      </td>
                      <td>${unitPrice.toLocaleString('es-CO')}</td>
                      <td>{item.descuento > 0 ? <span style={{ color: '#EF4444', fontWeight: 600 }}>{item.descuento}%</span> : '-'}</td>
                      <td style={{ fontWeight: 700, color: item.esDevolucion ? '#B91C1C' : '#1E293B' }}>
                        {item.esDevolucion ? '-' : ''}${Math.round(lineTotal).toLocaleString('es-CO')}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => onOpenEditItemModal(index, item)}
                            style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer' }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setQuoteItems((prev) => prev.filter((_, i) => i !== index));
                            }}
                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', gap: '24px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <label className="form-label" style={{ fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
            Observaciones sobre el pedido
          </label>
          <textarea
            className="form-control"
            placeholder="Instrucciones especiales, notas para entrega, etc..."
            value={observacionesPedido}
            onChange={(e) => setObservacionesPedido(e.target.value)}
            style={{ minHeight: '120px', resize: 'vertical', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
          />
        </div>

        <div
          style={{
            width: '350px',
            backgroundColor: '#F8FAFC',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B' }}>
            <span>Subtotal Venta Bruta</span>
            <span>${Math.round(quoteSubtotal).toLocaleString('es-CO')}</span>
          </div>
          {quoteLineDiscountsTotal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#EF4444' }}>
              <span>Descuentos (por línea)</span>
              <span>-${Math.round(quoteLineDiscountsTotal).toLocaleString('es-CO')}</span>
            </div>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '14px',
              fontWeight: 600,
              color: '#1E293B',
              borderBottom: '1px dashed #CBD5E1',
              paddingBottom: '8px',
            }}
          >
            <span>Subtotal Neto Venta</span>
            <span>${Math.round(quoteSubtotalAfterLineDiscounts).toLocaleString('es-CO')}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '13px', color: '#64748B' }}>Descuento Global Adicional:</span>
            <input
              type="number"
              min="0"
              max="50"
              className="form-control"
              style={{ width: '70px', padding: '4px 8px', fontSize: '12px' }}
              value={quoteDiscountGlobal}
              onChange={(e) => setQuoteDiscountGlobal(parseInt(e.target.value) || 0)}
            />
            <span style={{ fontSize: '12px' }}>%</span>
          </div>

          {quoteGlobalDiscountValue > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#EF4444' }}>
              <span>Valor Dcto Global ({quoteDiscountGlobal}%)</span>
              <span>-${Math.round(quoteGlobalDiscountValue).toLocaleString('es-CO')}</span>
            </div>
          )}

          {quoteDevolucionesTotal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#B91C1C' }}>
              <span>Devoluciones / Saldos a favor</span>
              <span>-${Math.round(quoteDevolucionesTotal).toLocaleString('es-CO')}</span>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '8px',
              paddingTop: '8px',
              borderTop: '2px solid #CBD5E1',
              fontSize: '18px',
              fontWeight: 800,
              color: 'var(--primary-color)',
            }}
          >
            <span>TOTAL NETO A COBRAR:</span>
            <span>${Math.round(quoteTotalFinal).toLocaleString('es-CO')}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
        <button
          type="button"
          onClick={onPrevStep}
          className="btn-secondary"
          style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: 'white', color: '#64748B', fontWeight: 600, cursor: 'pointer' }}
        >
          Atrás
        </button>

        <button
          type="button"
          onClick={onSaveQuotation}
          className="btn-primary"
          style={{
            padding: '10px 24px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#10B981',
            color: 'white',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Save size={18} /> Guardar Pedido
        </button>
      </div>
    </div>
  );
};
