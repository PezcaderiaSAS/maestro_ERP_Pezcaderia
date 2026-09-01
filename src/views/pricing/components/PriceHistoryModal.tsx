import React from 'react';
import { X } from 'lucide-react';
import type { Product, ProductPricing } from '../../../types/erp.types';

interface PriceHistoryModalProps {
  selectedProductHistory: string | null;
  onClose: () => void;
  products: Product[];
  productPricings: ProductPricing[];
}

export const PriceHistoryModal: React.FC<PriceHistoryModalProps> = ({
  selectedProductHistory,
  onClose,
  products,
  productPricings,
}) => {
  if (!selectedProductHistory) return null;

  const currentProduct = products.find((p) => p.id === selectedProductHistory);
  const historyItems = productPricings
    .filter((pr) => pr.productoId === selectedProductHistory)
    .sort((a, b) => new Date(b.vigenciaDesde).getTime() - new Date(a.vigenciaDesde).getTime());

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: '800px' }}>
        <div className="modal-header">
          <h2>Historial de Precios</h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <p style={{ marginBottom: '16px', color: '#475569' }}>
            Producto: <strong>{currentProduct?.nombre || 'Desconocido'}</strong>
          </p>
          <table className="hr-table">
            <thead>
              <tr>
                <th>Fecha Vigencia</th>
                <th>Costo</th>
                <th>Buffer</th>
                <th>Precio POS</th>
                <th>Precio Rest.</th>
                <th>Precio Mayor.</th>
                <th>Actor</th>
              </tr>
            </thead>
            <tbody>
              {historyItems.map((pr, i) => (
                <tr key={pr.id}>
                  <td>
                    {new Date(pr.vigenciaDesde).toLocaleDateString('es-CO')}
                    <br />
                    <span style={{ fontSize: '11px', color: '#64748B' }}>
                      {new Date(pr.vigenciaDesde).toLocaleTimeString('es-CO')}
                      {i === 0 && <span style={{ marginLeft: '6px', color: 'green', fontWeight: 'bold' }}>(Vigente)</span>}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>${pr.precio_compra.toLocaleString('es-CO')}</td>
                  <td>{pr.buffer_seguridad}%</td>
                  <td>${pr.precio_venta_pos.toLocaleString('es-CO')}</td>
                  <td>${pr.precio_venta_restaurante.toLocaleString('es-CO')}</td>
                  <td>${pr.precio_venta_mayorista.toLocaleString('es-CO')}</td>
                  <td>
                    <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', backgroundColor: '#F1F5F9' }}>
                      {pr.actualizadoPor}
                    </span>
                  </td>
                </tr>
              ))}
              {historyItems.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>
                    No hay historial para este producto.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
