import React, { useState } from 'react';
import { Warehouse, PlusCircle, Edit2, Trash2, ShieldAlert } from 'lucide-react';
import Swal from 'sweetalert2';
import { Bodega, guardarBodega, eliminarBodega, desactivarBodega } from '../../../services/warehouseService';

export function WarehouseConfigManager({
  bodegas,
  setBodegas,
  stock,
  products
}: any) {
  const [warehouseForm, setWarehouseForm] = useState({
    id: '',
    nombre: '',
    codigo: '',
    descripcion: '',
    activa: true,
    esencial: false
  });
  const [editingWarehouseId, setEditingWarehouseId] = useState<string | null>(null);

  // Helper para generar el catálogo formateado para validaciones de stock activo
  const getCatalogoProductosConStock = () => {
    return products.map((p: any) => {
      const stockRecord: Record<string, number> = {};
      Object.keys(stock).forEach(bodegaNombre => {
        const items = stock[bodegaNombre] || [];
        const totalStock = items
          .filter((item: any) => item.sku === p.sku)
          .reduce((acc: number, curr: any) => acc + curr.stock, 0);
        stockRecord[bodegaNombre] = totalStock;
      });
      return {
        sku: p.sku,
        stock: stockRecord
      };
    });
  };

  const handleSaveWarehouse = (e: React.FormEvent) => {
    e.preventDefault();

    if (!warehouseForm.nombre.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Validación',
        text: 'El nombre de la bodega es obligatorio.',
        confirmButtonColor: 'var(--primary-color)'
      });
      return;
    }

    if (!warehouseForm.codigo.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Validación',
        text: 'El código de la bodega es obligatorio.',
        confirmButtonColor: 'var(--primary-color)'
      });
      return;
    }

    const payload: Bodega = {
      id: warehouseForm.id || `b-${Date.now()}`,
      nombre: warehouseForm.nombre.trim(),
      codigo: warehouseForm.codigo.trim().toUpperCase(),
      descripcion: warehouseForm.descripcion.trim(),
      activa: warehouseForm.activa,
      esencial: warehouseForm.esencial
    };

    const { data, error } = guardarBodega(payload);

    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error al Guardar',
        text: error,
        confirmButtonColor: 'var(--primary-color)'
      });
    } else {
      setBodegas(data);
      Swal.fire({
        icon: 'success',
        title: editingWarehouseId ? 'Bodega Actualizada' : 'Bodega Creada',
        text: editingWarehouseId ? 'Los cambios han sido guardados.' : 'La nueva bodega ha sido registrada.',
        confirmButtonColor: 'var(--primary-color)'
      });
      resetForm();
    }
  };

  const handleDeleteWarehouse = (id: string, nombre: string) => {
    Swal.fire({
      title: '¿Confirmar eliminación?',
      text: `¿Está seguro de eliminar la bodega "${nombre}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        const catalogoProductos = getCatalogoProductosConStock();
        const { data, error } = eliminarBodega(id, catalogoProductos);

        if (error) {
          Swal.fire({
            icon: 'error',
            title: 'No se puede eliminar',
            text: error,
            confirmButtonColor: 'var(--primary-color)'
          });
        } else {
          setBodegas(data);
          Swal.fire({
            icon: 'success',
            title: 'Eliminado',
            text: 'La bodega ha sido eliminada del sistema.',
            confirmButtonColor: 'var(--primary-color)'
          });
        }
      }
    });
  };

  const handleToggleWarehouseActive = (id: string, currentlyActive: boolean) => {
    const bodega = bodegas.find((b: any) => b.id === id);
    if (!bodega) return;

    const catalogoProductos = getCatalogoProductosConStock();

    if (currentlyActive) {
      // Intentar desactivar
      const { data, error } = desactivarBodega(id, catalogoProductos);
      if (error) {
        Swal.fire({
          icon: 'error',
          title: 'No se puede desactivar',
          text: error,
          confirmButtonColor: 'var(--primary-color)'
        });
      } else {
        setBodegas(data);
        Swal.fire({
          icon: 'success',
          title: 'Bodega Desactivada',
          text: `La bodega "${bodega.nombre}" ha sido desactivada.`,
          confirmButtonColor: 'var(--primary-color)'
        });
      }
    } else {
      // Activar
      const { data, error } = guardarBodega({ ...bodega, activa: true });
      if (error) {
        Swal.fire({
          icon: 'error',
          title: 'No se puede activar',
          text: error,
          confirmButtonColor: 'var(--primary-color)'
        });
      } else {
        setBodegas(data);
        Swal.fire({
          icon: 'success',
          title: 'Bodega Activada',
          text: `La bodega "${bodega.nombre}" ahora está activa.`,
          confirmButtonColor: 'var(--primary-color)'
        });
      }
    }
  };

  const handleEditClick = (b: Bodega) => {
    setEditingWarehouseId(b.id);
    setWarehouseForm({
      id: b.id,
      nombre: b.nombre,
      codigo: b.codigo,
      descripcion: b.descripcion || '',
      activa: b.activa,
      esencial: b.esencial
    });
  };

  const resetForm = () => {
    setEditingWarehouseId(null);
    setWarehouseForm({
      id: '',
      nombre: '',
      codigo: '',
      descripcion: '',
      activa: true,
      esencial: false
    });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
      
      {/* FORMULARIO */}
      <div className="hr-table-card" style={{ padding: '24px', height: 'fit-content' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Warehouse size={18} color="var(--primary-color)" />
          {editingWarehouseId ? 'Editar Bodega' : 'Nueva Bodega'}
        </h3>
        
        <form onSubmit={handleSaveWarehouse} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Código de la Bodega *</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Ej: BMED, BVALLE..." 
              value={warehouseForm.codigo} 
              onChange={e => setWarehouseForm({ ...warehouseForm, codigo: e.target.value })} 
              style={{ textTransform: 'uppercase' }}
            />
            <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', display: 'block' }}>Código único de identificación.</span>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Nombre *</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Ej: Bodega Medellín, Bodega Norte..." 
              value={warehouseForm.nombre} 
              onChange={e => setWarehouseForm({ ...warehouseForm, nombre: e.target.value })} 
              disabled={warehouseForm.esencial}
            />
            {warehouseForm.esencial && (
              <span style={{ fontSize: '11px', color: '#EF4444', marginTop: '4px', display: 'block', fontWeight: 600 }}>
                Las bodegas esenciales no pueden ser renombradas (RN-59).
              </span>
            )}
          </div>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Descripción</label>
            <textarea 
              className="form-control" 
              placeholder="Describa el propósito o ubicación de la bodega..." 
              value={warehouseForm.descripcion} 
              onChange={e => setWarehouseForm({ ...warehouseForm, descripcion: e.target.value })}
              style={{ minHeight: '80px', resize: 'vertical' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="checkbox" 
              id="warehouse-activa"
              checked={warehouseForm.activa} 
              onChange={e => setWarehouseForm({ ...warehouseForm, activa: e.target.checked })}
              disabled={warehouseForm.esencial}
            />
            <label htmlFor="warehouse-activa" className="form-label" style={{ marginBottom: 0, cursor: 'pointer' }}>Bodega Activa</label>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '10px', borderRadius: '8px' }}>
              <PlusCircle size={16} />
              <span>{editingWarehouseId ? 'Guardar Cambios' : 'Registrar Bodega'}</span>
            </button>
            {editingWarehouseId && (
              <button 
                type="button" 
                onClick={resetForm}
                className="btn-secondary" 
                style={{ padding: '10px 16px', borderRadius: '8px' }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* TABLA DE BODEGAS */}
      <div className="hr-table-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px' }}>Bodegas Registradas en el Sistema</h3>

        <table className="hr-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>Esencial</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {bodegas.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#64748B', padding: '24px' }}>No hay bodegas registradas.</td>
              </tr>
            ) : (
              bodegas.map((b: Bodega) => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 700, color: '#0F172A' }}>{b.codigo}</td>
                  <td style={{ fontWeight: 600, color: '#334155' }}>{b.nombre}</td>
                  <td style={{ color: '#64748B' }}>{b.descripcion || '-'}</td>
                  <td>
                    <span 
                      style={{ 
                        padding: '4px 8px', 
                        borderRadius: '12px', 
                        fontSize: '11px', 
                        fontWeight: 700,
                        backgroundColor: b.activa ? '#DEF7EC' : '#FDE8E8', 
                        color: b.activa ? '#03543F' : '#9B1C1C',
                        cursor: b.esencial ? 'not-allowed' : 'pointer'
                      }}
                      onClick={() => !b.esencial && handleToggleWarehouseActive(b.id, b.activa)}
                      title={b.esencial ? 'No se puede cambiar el estado de bodegas esenciales' : 'Clic para cambiar estado'}
                    >
                      {b.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td>
                    {b.esencial ? (
                      <span style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                        <ShieldAlert size={14} /> Esencial
                      </span>
                    ) : (
                      <span style={{ color: '#94A3B8', fontSize: '12px' }}>No</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleEditClick(b)}
                        style={{ padding: '6px', backgroundColor: '#F1F5F9', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#334155' }}
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      {!b.esencial && (
                        <button 
                          onClick={() => handleDeleteWarehouse(b.id, b.nombre)}
                          style={{ padding: '6px', backgroundColor: '#FEF2F2', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#EF4444' }}
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
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
