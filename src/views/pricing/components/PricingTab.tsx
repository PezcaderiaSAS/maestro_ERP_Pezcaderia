import React from 'react';
import { Search, Check, X, FileText } from 'lucide-react';
import type { Product } from '../../../types/erp.types';

interface PricingTabProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  categoryFilter: string;
  setCategoryFilter: (filter: string) => void;
  categoriasUnicas: string[];
  filteredProducts: Product[];
  editingPriceId: string | null;
  setEditingPriceId: (id: string | null) => void;
  priceForm: {
    precio_compra: number;
    buffer_seguridad: number;
    precio_venta_pos: number;
    precio_venta_restaurante: number;
    precio_venta_mayorista: number;
  };
  setPriceForm: React.Dispatch<React.SetStateAction<any>>;
  onSavePrices: (productId: string) => void;
  onStartEditPrice: (product: Product) => void;
  onViewProductHistory: (productId: string) => void;
}

export const PricingTab: React.FC<PricingTabProps> = ({
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  categoriasUnicas,
  filteredProducts,
  editingPriceId,
  setEditingPriceId,
  priceForm,
  setPriceForm,
  onSavePrices,
  onStartEditPrice,
  onViewProductHistory,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div className="pos-search-bar" style={{ marginBottom: 0, flex: 1 }}>
          <Search size={18} color="#64748B" />
          <input
            type="text"
            className="pos-search-input"
            placeholder="Buscar por SKU o Nombre para cotizar/costear..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="form-control"
          style={{ width: '180px', height: '48px', borderRadius: '12px' }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          {categoriasUnicas.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="hr-table-card" style={{ overflowX: 'auto' }}>
        <table className="hr-table">
          <thead>
            <tr>
              <th style={{ minWidth: '130px' }}>SKU</th>
              <th style={{ minWidth: '180px' }}>Producto</th>
              <th style={{ minWidth: '120px' }}>Costo Compra</th>
              <th style={{ minWidth: '100px' }}>Buffer Seg.</th>
              <th style={{ minWidth: '130px', backgroundColor: 'rgba(9, 103, 177, 0.05)' }}>Precio POS</th>
              <th style={{ minWidth: '130px', backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>Precio Restaurante</th>
              <th style={{ minWidth: '130px', backgroundColor: 'rgba(107, 114, 128, 0.05)' }}>Precio Mayorista</th>
              <th style={{ minWidth: '100px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p) => {
              const isEditing = editingPriceId === p.id;
              return (
                <tr key={p.id}>
                  <td style={{ fontWeight: 700, color: '#64748B' }}>{p.sku}</td>
                  <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                  <td>
                    {isEditing ? (
                      <input
                        type="number"
                        className="form-control"
                        style={{ width: '100px', padding: '6px' }}
                        value={priceForm.precio_compra}
                        onChange={(e) => setPriceForm({ ...priceForm, precio_compra: parseInt(e.target.value) || 0 })}
                      />
                    ) : (
                      `$${p.precio_compra.toLocaleString('es-CO')}`
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <input
                          type="number"
                          className="form-control"
                          style={{ width: '60px', padding: '6px' }}
                          value={priceForm.buffer_seguridad}
                          onChange={(e) => setPriceForm({ ...priceForm, buffer_seguridad: parseInt(e.target.value) || 0 })}
                        />
                        <span style={{ fontSize: '12px' }}>%</span>
                      </div>
                    ) : (
                      `${p.buffer_seguridad}%`
                    )}
                  </td>
                  <td style={{ backgroundColor: 'rgba(9, 103, 177, 0.02)', fontWeight: 700 }}>
                    {isEditing ? (
                      <input
                        type="number"
                        className="form-control"
                        style={{ width: '110px', padding: '6px', borderColor: 'var(--primary-color)' }}
                        value={priceForm.precio_venta_pos}
                        onChange={(e) => setPriceForm({ ...priceForm, precio_venta_pos: parseInt(e.target.value) || 0 })}
                      />
                    ) : (
                      `$${p.precio_venta_pos.toLocaleString('es-CO')}`
                    )}
                  </td>
                  <td style={{ backgroundColor: 'rgba(59, 130, 246, 0.02)', fontWeight: 700 }}>
                    {isEditing ? (
                      <input
                        type="number"
                        className="form-control"
                        style={{ width: '110px', padding: '6px', borderColor: '#3B82F6' }}
                        value={priceForm.precio_venta_restaurante}
                        onChange={(e) => setPriceForm({ ...priceForm, precio_venta_restaurante: parseInt(e.target.value) || 0 })}
                      />
                    ) : (
                      `$${p.precio_venta_restaurante.toLocaleString('es-CO')}`
                    )}
                  </td>
                  <td style={{ backgroundColor: 'rgba(107, 114, 128, 0.02)', fontWeight: 700 }}>
                    {isEditing ? (
                      <input
                        type="number"
                        className="form-control"
                        style={{ width: '110px', padding: '6px', borderColor: '#6B7280' }}
                        value={priceForm.precio_venta_mayorista}
                        onChange={(e) => setPriceForm({ ...priceForm, precio_venta_mayorista: parseInt(e.target.value) || 0 })}
                      />
                    ) : (
                      `$${p.precio_venta_mayorista.toLocaleString('es-CO')}`
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => onSavePrices(p.id)}
                          style={{
                            background: 'var(--primary-color)',
                            border: 'none',
                            color: 'white',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Guardar"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setEditingPriceId(null)}
                          style={{
                            background: '#EF4444',
                            border: 'none',
                            color: 'white',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Cancelar"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => onStartEditPrice(p)}
                          className="btn-primary"
                          style={{ padding: '6px 10px', fontSize: '12px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none' }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => onViewProductHistory(p.id)}
                          className="btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Ver historial de cambios"
                        >
                          <FileText size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
