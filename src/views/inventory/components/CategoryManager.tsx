import React from 'react';
import { Network, PlusCircle, Edit3, Trash2 } from 'lucide-react';

export function CategoryManager({
  categorias,
  categorySearch,
  setCategorySearch,
  categoryForm,
  setCategoryForm,
  editingCategoryId,
  setEditingCategoryId,
  handleSaveCategory,
  handleDeleteCategory
}: any) {
  
  const filteredCategories = categorias.filter((c: any) => 
    c.tipo.toLowerCase().includes(categorySearch.toLowerCase()) ||
    c.linea.toLowerCase().includes(categorySearch.toLowerCase()) ||
    c.clase.toLowerCase().includes(categorySearch.toLowerCase())
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
      
      {/* FORMULARIO DE CATEGORÍA */}
      <div className="hr-table-card" style={{ padding: '24px', height: 'fit-content' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Network size={18} color="var(--primary-color)" />
          {editingCategoryId ? 'Editar Categoría 3NF' : 'Nueva Categoría 3NF'}
        </h3>
        
        <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Tipo (Nivel 1) *</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Ej: Pescados, Mariscos, Abarrotes..." 
              value={categoryForm.tipo} 
              onChange={e => setCategoryForm({ ...categoryForm, tipo: e.target.value })} 
            />
            <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', display: 'block' }}>Familia principal del producto.</span>
          </div>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Línea (Nivel 2) *</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Ej: Frescos, Congelados, Secos..." 
              value={categoryForm.linea} 
              onChange={e => setCategoryForm({ ...categoryForm, linea: e.target.value })} 
            />
            <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', display: 'block' }}>Estado físico o condición de almacenamiento.</span>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Clase (Nivel 3) *</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Ej: Entero, Filete, Posta, Porción..." 
              value={categoryForm.clase} 
              onChange={e => setCategoryForm({ ...categoryForm, clase: e.target.value })} 
            />
            <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', display: 'block' }}>Corte o presentación específica final.</span>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '10px', borderRadius: '8px' }}>
              <PlusCircle size={16} />
              <span>{editingCategoryId ? 'Guardar Cambios' : 'Registrar Categoría'}</span>
            </button>
            {editingCategoryId && (
              <button 
                type="button" 
                onClick={() => {
                  setEditingCategoryId(null);
                  setCategoryForm({ tipo: '', linea: '', clase: '' });
                }}
                className="btn-secondary" 
                style={{ padding: '10px 16px', borderRadius: '8px' }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ÁRBOL Y TABLA DE CATEGORÍAS */}
      <div className="hr-table-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Estructura del Catálogo</h3>
          <input 
            type="text" 
            placeholder="Filtrar categorías..." 
            className="form-control" 
            style={{ width: '250px', padding: '8px 12px' }}
            value={categorySearch}
            onChange={e => setCategorySearch(e.target.value)}
          />
        </div>

        <table className="hr-table">
          <thead>
            <tr>
              <th>ID Config</th>
              <th>Tipo (N1)</th>
              <th>Línea (N2)</th>
              <th>Clase (N3)</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: '#64748B', padding: '24px' }}>No hay categorías registradas.</td>
              </tr>
            ) : (
              filteredCategories.map((c: any) => (
                <tr key={c.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px', color: '#94A3B8' }}>{c.id.split('-')[1] || c.id}</td>
                  <td style={{ fontWeight: 700, color: '#0F172A' }}>{c.tipo}</td>
                  <td style={{ fontWeight: 600, color: '#334155' }}>{c.linea}</td>
                  <td style={{ color: '#475569' }}>{c.clase}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => {
                          setEditingCategoryId(c.id);
                          setCategoryForm({ tipo: c.tipo, linea: c.linea, clase: c.clase });
                        }}
                        style={{ padding: '6px', backgroundColor: '#F1F5F9', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#334155' }}
                        title="Editar"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteCategory(c.id)}
                        style={{ padding: '6px', backgroundColor: '#FEF2F2', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#EF4444' }}
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
