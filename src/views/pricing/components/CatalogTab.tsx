import React from 'react';
import { Save, Search, Edit2 } from 'lucide-react';
import type { Product } from '../../../types/erp.types';

interface CatalogTabProps {
  editingProductId: string | null;
  productForm: {
    sku: string;
    nombre: string;
    categoria: string;
    unidadMedida: 'kg' | 'und' | 'lb' | 'gr';
    precio_compra: number;
    buffer_seguridad: number;
  };
  setProductForm: React.Dispatch<React.SetStateAction<any>>;
  setEditingProductId: (id: string | null) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  categoryFilter: string;
  setCategoryFilter: (filter: string) => void;
  categoriasUnicas: string[];
  filteredProducts: Product[];
  onSaveProduct: (e: React.FormEvent) => void;
  onEditProduct: (p: Product) => void;
  onToggleStatus: (id: string) => void;
}

export const CatalogTab: React.FC<CatalogTabProps> = ({
  editingProductId,
  productForm,
  setProductForm,
  setEditingProductId,
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  categoriasUnicas,
  filteredProducts,
  onSaveProduct,
  onEditProduct,
  onToggleStatus,
}) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '24px' }}>
      {/* Formulario de Creación / Edición */}
      <div className="hr-table-card" style={{ padding: '24px', height: 'fit-content' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px' }}>
          {editingProductId ? 'Editar Producto' : 'Crear Nuevo Producto'}
        </h3>
        <form onSubmit={onSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">SKU (Código Único) *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ej: FIL-ROB-004"
              value={productForm.sku}
              onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Nombre del Producto *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ej: FILETE DE RÓBALO LIMPIO"
              value={productForm.nombre}
              onChange={(e) => setProductForm({ ...productForm, nombre: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Categoría *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ej: PESCADOS, MARISCOS, BATIDOS"
              value={productForm.categoria}
              onChange={(e) => setProductForm({ ...productForm, categoria: e.target.value })}
              list="categorias-list"
            />
            <datalist id="categorias-list">
              {categoriasUnicas.filter((c) => c !== 'TODAS').map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Costo de Compra ($)</label>
              <input
                type="number"
                className="form-control"
                placeholder="0"
                value={productForm.precio_compra || ''}
                onChange={(e) => setProductForm({ ...productForm, precio_compra: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Margen de Buffer (%)</label>
              <input
                type="number"
                className="form-control"
                placeholder="5"
                value={productForm.buffer_seguridad}
                onChange={(e) => setProductForm({ ...productForm, buffer_seguridad: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              type="submit"
              className="btn-primary"
              style={{
                border: 'none',
                flex: 1,
                justifyContent: 'center',
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
              }}
            >
              <Save size={16} />
              <span>{editingProductId ? 'Guardar Cambios' : 'Registrar Producto'}</span>
            </button>
            {editingProductId && (
              <button
                type="button"
                onClick={() => {
                  setEditingProductId(null);
                  setProductForm({ sku: '', nombre: '', categoria: '', unidadMedida: 'kg', precio_compra: 0, buffer_seguridad: 5 });
                }}
                className="btn-secondary"
                style={{ flex: 0.5, justifyContent: 'center', display: 'flex', alignItems: 'center', padding: '12px' }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Tabla y Listado */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="pos-search-bar" style={{ marginBottom: 0, flex: 1 }}>
            <Search size={18} color="#64748B" />
            <input
              type="text"
              className="pos-search-input"
              placeholder="Buscar producto por nombre o SKU..."
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

        <div className="hr-table-card">
          <table className="hr-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id} style={{ opacity: p.activo ? 1 : 0.6 }}>
                  <td style={{ fontWeight: 700, color: '#64748B' }}>{p.sku}</td>
                  <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                  <td>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '12px', backgroundColor: '#F1F5F9', color: '#475569' }}>
                      {p.categoria}
                    </span>
                  </td>
                  <td>
                    <span
                      onClick={() => onToggleStatus(p.id)}
                      className={`badge-status ${p.activo ? 'activo' : 'inactivo'}`}
                      style={{ cursor: 'pointer' }}
                    >
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => onEditProduct(p)}
                      style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', marginRight: '12px' }}
                    >
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>
                    No se encontraron productos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
