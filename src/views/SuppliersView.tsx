import React, { useState } from 'react';
import { Proveedor, OrdenCompra, MovimientoInventario, generateId } from '../App.tsx';
import { Truck, Search, Save, Edit2, Phone, Mail, ShoppingCart, Box, PlusCircle } from 'lucide-react';
import Swal from 'sweetalert2';

interface SuppliersViewProps {
  proveedores: Proveedor[];
  setProveedores: React.Dispatch<React.SetStateAction<Proveedor[]>>;
  ordenesCompra: OrdenCompra[];
  movimientos: MovimientoInventario[];
  publishEvent: (tipo: any, actor: string, desc: string, meta?: any) => void;
  userRole: string;
}

export default function SuppliersView({
  proveedores,
  setProveedores,
  ordenesCompra,
  movimientos,
  publishEvent,
  userRole
}: SuppliersViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'ACTIVOS' | 'INACTIVOS'>('TODOS');
  const [selectedProveedorId, setSelectedProveedorId] = useState<string | null>(null);

  const [proveedorForm, setProveedorForm] = useState({
    nombre: '',
    nit: '',
    tipoIdentificacion: 'NIT' as 'NIT' | 'CC',
    direccion: '',
    telefono: '',
    email: '',
    ciudad: 'Bogotá',
    contactoCompras: '',
    plazoPagoDias: 30
  });

  const handleSaveProveedor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proveedorForm.nombre || !proveedorForm.nit) {
      Swal.fire({ icon: 'warning', title: 'Campos incompletos', text: 'Nombre y NIT son requeridos.', confirmButtonColor: 'var(--primary-color)' });
      return;
    }

    if (selectedProveedorId && proveedores.some(p => p.id === selectedProveedorId)) {
      setProveedores(prev => prev.map(p => p.id === selectedProveedorId ? {
        ...p,
        nombre: proveedorForm.nombre.toUpperCase(),
        nit: proveedorForm.nit,
        tipoIdentificacion: proveedorForm.tipoIdentificacion,
        direccion: proveedorForm.direccion,
        telefono: proveedorForm.telefono,
        email: proveedorForm.email,
        ciudad: proveedorForm.ciudad,
        contactoCompras: proveedorForm.contactoCompras,
        plazoPagoDias: proveedorForm.plazoPagoDias
      } : p));
      Swal.fire({ icon: 'success', title: 'Proveedor actualizado', text: 'Datos actualizados con éxito.', timer: 1500, showConfirmButton: false });
    } else {
      if (proveedores.some(p => p.nit === proveedorForm.nit)) {
        Swal.fire({ icon: 'error', title: 'NIT Duplicado', text: 'Ya existe un proveedor con este NIT.', confirmButtonColor: 'var(--primary-color)' });
        return;
      }
      const nuevo: Proveedor = {
        id: generateId('prov'),
        nombre: proveedorForm.nombre.toUpperCase(),
        nit: proveedorForm.nit,
        tipoIdentificacion: proveedorForm.tipoIdentificacion,
        direccion: proveedorForm.direccion,
        telefono: proveedorForm.telefono,
        email: proveedorForm.email,
        ciudad: proveedorForm.ciudad,
        contactoCompras: proveedorForm.contactoCompras,
        plazoPagoDias: proveedorForm.plazoPagoDias,
        activo: true
      };
      setProveedores(prev => [...prev, nuevo]);
      setSelectedProveedorId(nuevo.id);
      Swal.fire({ icon: 'success', title: 'Proveedor registrado', text: 'El proveedor ha sido registrado exitosamente.', timer: 1500, showConfirmButton: false });
    }
  };

  const selectProveedor = (p: Proveedor) => {
    setSelectedProveedorId(p.id);
    setProveedorForm({
      nombre: p.nombre,
      nit: p.nit,
      tipoIdentificacion: p.tipoIdentificacion,
      direccion: p.direccion || '',
      telefono: p.telefono || '',
      email: p.email || '',
      ciudad: p.ciudad || 'Bogotá',
      contactoCompras: p.contactoCompras || '',
      plazoPagoDias: p.plazoPagoDias || 30
    });
  };

  const startNewProveedor = () => {
    setSelectedProveedorId(null);
    setProveedorForm({
      nombre: '', nit: '', tipoIdentificacion: 'NIT', direccion: '', telefono: '',
      email: '', ciudad: 'Bogotá', contactoCompras: '', plazoPagoDias: 30
    });
  };

  const handleToggleProveedor = (id: string) => {
    setProveedores(prev => prev.map(p => p.id === id ? { ...p, activo: !p.activo } : p));
  };

  const filteredProveedores = proveedores.filter(p => {
    const matchSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        p.nit.includes(searchTerm);
    const matchStatus = statusFilter === 'TODOS' ? true : 
                        statusFilter === 'ACTIVOS' ? p.activo : !p.activo;
    return matchSearch && matchStatus;
  });

  const selectedProveedorObj = proveedores.find(p => p.id === selectedProveedorId);
  const selectedProveedorOrdenes = ordenesCompra.filter(oc => oc.proveedorId === selectedProveedorId).sort((a, b) => new Date(b.fechaEmision).getTime() - new Date(a.fechaEmision).getTime());
  
  // Buscar movimientos de entrada que estén asociados a este proveedor 
  // (Asumiendo que el campo 'responsable' o 'observacion' guarda el nombre o ID del proveedor en entradas por compras)
  const selectedProveedorMovimientos = movimientos.filter(m => 
    m.tipo === 'ENTRADA' && 
    (m.observaciones?.includes(selectedProveedorObj?.nombre || '') || m.responsable === selectedProveedorObj?.nombre)
  ).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  return (
    <div className="animate-fade-in" style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="view-title">Directorio de Proveedores</h2>
          <span style={{ fontSize: '14px', color: '#64748B' }}>Gestione el perfil, compras e historial de órdenes de sus proveedores.</span>
        </div>
        <button className="btn-primary" onClick={startNewProveedor} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          <PlusCircle size={18} />
          Nuevo Proveedor
        </button>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        
        {/* COLUMNA IZQUIERDA: LISTA DE PROVEEDORES */}
        <div style={{ flex: '0 0 350px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="pos-search-bar" style={{ marginBottom: 0 }}>
            <Search size={18} color="#64748B" />
            <input
              type="text"
              className="pos-search-input"
              placeholder="Buscar proveedor..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="form-control"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            style={{ padding: '10px' }}
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="ACTIVOS">Solo Activos</option>
            <option value="INACTIVOS">Solo Inactivos</option>
          </select>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: 'calc(100vh - 250px)' }}>
            {filteredProveedores.map(p => (
              <div 
                key={p.id} 
                onClick={() => selectProveedor(p)}
                style={{ 
                  padding: '16px', 
                  backgroundColor: 'white', 
                  border: `1px solid ${selectedProveedorId === p.id ? 'var(--primary-color)' : '#E2E8F0'}`, 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  boxShadow: selectedProveedorId === p.id ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                  opacity: p.activo ? 1 : 0.6,
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>{p.nombre}</span>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>{p.tipoIdentificacion} {p.nit}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>Plazo: {p.plazoPagoDias} días</span>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>{p.ciudad}</span>
                </div>
              </div>
            ))}
            {filteredProveedores.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                No se encontraron proveedores.
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: PERFIL DEL PROVEEDOR E HISTORIAL */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="hr-table-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={20} color="var(--primary-color)" /> 
                {selectedProveedorId ? 'Perfil del Proveedor' : 'Registrar Nuevo Proveedor'}
              </h3>
              {selectedProveedorId && selectedProveedorObj && (
                <button
                  type="button"
                  onClick={() => handleToggleProveedor(selectedProveedorId)}
                  className={`badge-status ${selectedProveedorObj.activo ? 'activo' : 'inactivo'}`}
                  style={{ border: 'none', cursor: 'pointer', fontSize: '12px', padding: '6px 12px' }}
                >
                  {selectedProveedorObj.activo ? 'Desactivar Proveedor' : 'Activar Proveedor'}
                </button>
              )}
            </div>

            <form onSubmit={handleSaveProveedor} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Tipo Identificación *</label>
                  <select
                    className="form-control"
                    value={proveedorForm.tipoIdentificacion}
                    onChange={e => setProveedorForm({ ...proveedorForm, tipoIdentificacion: e.target.value as any })}
                  >
                    <option value="NIT">NIT</option>
                    <option value="CC">Cédula</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">NIT / Número *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej: 901234567-8"
                    value={proveedorForm.nit}
                    onChange={e => setProveedorForm({ ...proveedorForm, nit: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Nombre o Razón Social *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: Distribuidora del Mar"
                  value={proveedorForm.nombre}
                  onChange={e => setProveedorForm({ ...proveedorForm, nombre: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Dirección</label>
                <input
                  type="text"
                  className="form-control"
                  value={proveedorForm.direccion}
                  onChange={e => setProveedorForm({ ...proveedorForm, direccion: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Celular / Teléfono</label>
                  <input
                    type="text"
                    className="form-control"
                    value={proveedorForm.telefono}
                    onChange={e => setProveedorForm({ ...proveedorForm, telefono: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Ciudad</label>
                  <input
                    type="text"
                    className="form-control"
                    value={proveedorForm.ciudad}
                    onChange={e => setProveedorForm({ ...proveedorForm, ciudad: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Correo Electrónico</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="proveedor@empresa.com"
                    value={proveedorForm.email}
                    onChange={e => setProveedorForm({ ...proveedorForm, email: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Plazo de Pago (Días)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={proveedorForm.plazoPagoDias || ''}
                    onChange={e => setProveedorForm({ ...proveedorForm, plazoPagoDias: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Contacto Comercial (Persona)</label>
                <input
                  type="text"
                  className="form-control"
                  value={proveedorForm.contactoCompras}
                  onChange={e => setProveedorForm({ ...proveedorForm, contactoCompras: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="submit" className="btn-primary" style={{ border: 'none', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: 'var(--primary-color)', color: 'white', borderRadius: '6px', cursor: 'pointer' }}>
                  <Save size={16} />
                  <span>{selectedProveedorId ? 'Guardar Cambios' : 'Registrar Proveedor'}</span>
                </button>
              </div>
            </form>
          </div>

          {selectedProveedorId && (
            <div style={{ display: 'flex', gap: '24px' }}>
              
              {/* HISTORIAL DE ÓRDENES DE COMPRA */}
              <div className="hr-table-card" style={{ padding: '24px', flex: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingCart size={18} color="#0EA5E9" /> Órdenes de Compra
                </h3>
                {selectedProveedorOrdenes.length === 0 ? (
                  <p style={{ color: '#64748B', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>No hay órdenes de compra registradas.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                    {selectedProveedorOrdenes.map(oc => (
                      <div key={oc.id} style={{ padding: '12px', border: '1px solid #E2E8F0', borderRadius: '6px', backgroundColor: '#F8FAFC' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, fontSize: '13px' }}>{oc.id}</span>
                          <span style={{ fontSize: '12px', color: '#64748B' }}>{new Date(oc.fechaEmision).toLocaleDateString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>{oc.items.length} productos</span>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary-color)' }}>${oc.total.toLocaleString()}</span>
                        </div>
                        <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                          <span style={{ 
                            fontSize: '10px', 
                            padding: '2px 6px', 
                            backgroundColor: oc.estado === 'COMPLETADA' ? '#D1FAE5' : (oc.estado === 'BORRADOR' ? '#E2E8F0' : '#FEF3C7'), 
                            color: oc.estado === 'COMPLETADA' ? '#065F46' : (oc.estado === 'BORRADOR' ? '#475569' : '#92400E'),
                            borderRadius: '4px', 
                            fontWeight: 600 
                          }}>
                            {oc.estado}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* HISTORIAL DE RECEPCIONES / ENTRADAS */}
              <div className="hr-table-card" style={{ padding: '24px', flex: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Box size={18} color="#10B981" /> Entradas a Bodega
                </h3>
                {selectedProveedorMovimientos.length === 0 ? (
                  <p style={{ color: '#64748B', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>No hay entradas registradas.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                    {selectedProveedorMovimientos.map(m => (
                      <div key={m.id} style={{ padding: '12px', border: '1px solid #E2E8F0', borderRadius: '6px', backgroundColor: '#F0FDF4' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, fontSize: '13px' }}>{m.productoId}</span>
                          <span style={{ fontSize: '12px', color: '#64748B' }}>{new Date(m.fecha).toLocaleDateString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: '#64748B' }}>Bodega: {m.bodega}</span>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: '#10B981' }}>+{m.cantidad}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', fontStyle: 'italic' }}>
                          {m.observaciones}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
