import React, { useState } from 'react';
import { Cliente, Venta, generateId, toTitleCase } from '../App.tsx';
import { InvoiceAR } from './ARView.tsx';
import { Users, Search, Save, FileText, Wallet, PlusCircle } from 'lucide-react';
import Swal from 'sweetalert2';

interface ClientsViewProps {
  clientes: Cliente[];
  setClientes: React.Dispatch<React.SetStateAction<Cliente[]>>;
  ventas: Venta[];
  cartera: InvoiceAR[];
  publishEvent: (tipo: any, actor: string, desc: string, meta?: any) => void;
  userRole: string;
}

export default function ClientsView({
  clientes,
  setClientes,
  ventas,
  cartera,
  publishEvent,
  userRole
}: ClientsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'ACTIVOS' | 'INACTIVOS'>('TODOS');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const [clienteForm, setClienteForm] = useState({
    nombre: '',
    identificacion: '',
    tipoIdentificacion: 'NIT' as 'NIT' | 'CC' | 'CE',
    tipoPersona: 'JURIDICA' as 'NATURAL' | 'JURIDICA',
    direccion: '',
    telefono: '',
    email: '',
    ciudad: 'Bogotá',
    tipoPrecio: 'POS' as 'POS' | 'RESTAURANTE' | 'MAYORISTA',
    encargadoCompras: '',
    cupoCredito: 0
  });

  const getClienteDeuda = (clienteId: string) => {
    return cartera
      .filter(inv => inv.clienteId === clienteId)
      .reduce((sum, inv) => sum + inv.saldo, 0);
  };

  const handleSaveCliente = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteForm.nombre || !clienteForm.identificacion) {
      Swal.fire({ icon: 'warning', title: 'Campos incompletos', text: 'Nombre e Identificación son requeridos.', confirmButtonColor: 'var(--primary-color)' });
      return;
    }

    if (selectedClientId && clientes.some(c => c.id === selectedClientId)) {
      setClientes(prev => prev.map(c => c.id === selectedClientId ? {
        ...c,
        nombre: toTitleCase(clienteForm.nombre),
        identificacion: clienteForm.identificacion,
        tipoIdentificacion: clienteForm.tipoIdentificacion,
        tipoPersona: clienteForm.tipoPersona,
        direccion: toTitleCase(clienteForm.direccion),
        telefono: clienteForm.telefono,
        email: clienteForm.email,
        ciudad: toTitleCase(clienteForm.ciudad),
        tipoPrecio: clienteForm.tipoPrecio,
        encargadoCompras: toTitleCase(clienteForm.encargadoCompras),
        cupoCredito: clienteForm.cupoCredito
      } : c));
      Swal.fire({ icon: 'success', title: 'Cliente actualizado', text: 'Los datos del cliente han sido guardados.', timer: 1500, showConfirmButton: false });
    } else {
      if (clientes.some(c => c.identificacion === clienteForm.identificacion)) {
        Swal.fire({ icon: 'error', title: 'NIT Duplicado', text: 'Ya existe un cliente con esta identificación.', confirmButtonColor: 'var(--primary-color)' });
        return;
      }
      const nuevo: Cliente = {
        id: generateId('c'),
        nombre: toTitleCase(clienteForm.nombre),
        identificacion: clienteForm.identificacion,
        tipoIdentificacion: clienteForm.tipoIdentificacion,
        tipoPersona: clienteForm.tipoPersona,
        direccion: toTitleCase(clienteForm.direccion),
        telefono: clienteForm.telefono,
        email: clienteForm.email,
        ciudad: toTitleCase(clienteForm.ciudad),
        tipoPrecio: clienteForm.tipoPrecio,
        encargadoCompras: toTitleCase(clienteForm.encargadoCompras),
        cupoCredito: clienteForm.cupoCredito,
        activo: true
      };
      setClientes(prev => [...prev, nuevo]);
      setSelectedClientId(nuevo.id);
      Swal.fire({ icon: 'success', title: 'Cliente creado', text: 'El nuevo cliente ha sido registrado con éxito.', timer: 1500, showConfirmButton: false });
    }
  };

  const selectCliente = (c: Cliente) => {
    setSelectedClientId(c.id);
    setClienteForm({
      nombre: c.nombre,
      identificacion: c.identificacion,
      tipoIdentificacion: c.tipoIdentificacion,
      tipoPersona: c.tipoPersona,
      direccion: c.direccion || '',
      telefono: c.telefono || '',
      email: c.email || '',
      ciudad: c.ciudad || 'Bogotá',
      tipoPrecio: c.tipoPrecio,
      encargadoCompras: c.encargadoCompras || '',
      cupoCredito: c.cupoCredito || 0
    });
  };

  const startNewCliente = () => {
    setSelectedClientId(null);
    setClienteForm({
      nombre: '', identificacion: '', tipoIdentificacion: 'NIT', tipoPersona: 'JURIDICA',
      direccion: '', telefono: '', email: '', ciudad: 'Bogotá', tipoPrecio: 'POS',
      encargadoCompras: '', cupoCredito: 0
    });
  };

  const handleToggleCliente = (id: string) => {
    setClientes(prev => prev.map(c => c.id === id ? { ...c, activo: !c.activo } : c));
  };

  const filteredClientes = clientes.filter(c => {
    const matchSearch = c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        c.identificacion.includes(searchTerm);
    const matchStatus = statusFilter === 'TODOS' ? true : 
                        statusFilter === 'ACTIVOS' ? c.activo : !c.activo;
    return matchSearch && matchStatus;
  });

  const selectedClienteObj = clientes.find(c => c.id === selectedClientId);
  const selectedClienteVentas = ventas.filter(v => v.clienteId === selectedClientId).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  const selectedClienteCartera = cartera.filter(inv => inv.clienteId === selectedClientId).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  return (
    <div className="animate-fade-in" style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="view-title">Directorio de Clientes</h2>
          <span style={{ fontSize: '14px', color: '#64748B' }}>Gestione el perfil, compras e historial crediticio de sus clientes.</span>
        </div>
        <button className="btn-primary" onClick={startNewCliente} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          <PlusCircle size={18} />
          Nuevo Cliente
        </button>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        
        {/* COLUMNA IZQUIERDA: LISTA DE CLIENTES */}
        <div style={{ flex: '0 0 350px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="pos-search-bar" style={{ marginBottom: 0 }}>
            <Search size={18} color="#64748B" />
            <input
              type="text"
              className="pos-search-input"
              placeholder="Buscar cliente..."
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
            {filteredClientes.map(c => {
              const deuda = getClienteDeuda(c.id);
              return (
                <div 
                  key={c.id} 
                  onClick={() => selectCliente(c)}
                  style={{ 
                    padding: '16px', 
                    backgroundColor: 'white', 
                    border: `1px solid ${selectedClientId === c.id ? 'var(--primary-color)' : '#E2E8F0'}`, 
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: selectedClientId === c.id ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                    opacity: c.activo ? 1 : 0.6,
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>{c.nombre}</span>
                    <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>{c.tipoIdentificacion} {c.identificacion}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '12px', backgroundColor: '#F1F5F9', color: '#0F172A' }}>
                      {c.tipoPrecio}
                    </span>
                    <span style={{ fontSize: '12px', color: deuda > 0 ? '#EF4444' : '#10B981', fontWeight: 600 }}>
                      {deuda > 0 ? `Deuda: $${deuda.toLocaleString()}` : 'Sin Deuda'}
                    </span>
                  </div>
                </div>
              )
            })}
            {filteredClientes.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                No se encontraron clientes.
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: PERFIL DEL CLIENTE E HISTORIAL */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="hr-table-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} color="var(--primary-color)" /> 
                {selectedClientId ? 'Perfil del Cliente' : 'Registrar Nuevo Cliente'}
              </h3>
              {selectedClientId && selectedClienteObj && (
                <button
                  type="button"
                  onClick={() => handleToggleCliente(selectedClientId)}
                  className={`badge-status ${selectedClienteObj.activo ? 'activo' : 'inactivo'}`}
                  style={{ border: 'none', cursor: 'pointer', fontSize: '12px', padding: '6px 12px' }}
                >
                  {selectedClienteObj.activo ? 'Desactivar Cliente' : 'Activar Cliente'}
                </button>
              )}
            </div>

            <form onSubmit={handleSaveCliente} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: '#0F172A', borderBottom: '1px solid #CBD5E1', paddingBottom: '8px' }}>Información Básica</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Nombre o Razón Social *</label>
                    <input type="text" className="form-control" placeholder="Ej: Restaurante del Mar" value={clienteForm.nombre} onChange={e => setClienteForm({ ...clienteForm, nombre: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Tipo Identificación *</label>
                    <select className="form-control" value={clienteForm.tipoIdentificacion} onChange={e => setClienteForm({ ...clienteForm, tipoIdentificacion: e.target.value as any })}>
                      <option value="NIT">NIT</option>
                      <option value="CC">Cédula</option>
                      <option value="CE">Cédula Extranjería</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Número Identificación *</label>
                    <input type="text" className="form-control" placeholder="Ej: 900123456-1" value={clienteForm.identificacion} onChange={e => setClienteForm({ ...clienteForm, identificacion: e.target.value })} />
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: '#0F172A', borderBottom: '1px solid #CBD5E1', paddingBottom: '8px' }}>Contacto y Ubicación</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Celular / Teléfono</label>
                    <input type="text" className="form-control" value={clienteForm.telefono} onChange={e => setClienteForm({ ...clienteForm, telefono: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Correo Electrónico</label>
                    <input type="email" className="form-control" placeholder="compras@cliente.com" value={clienteForm.email} onChange={e => setClienteForm({ ...clienteForm, email: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Dirección</label>
                    <input type="text" className="form-control" value={clienteForm.direccion} onChange={e => setClienteForm({ ...clienteForm, direccion: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Ciudad</label>
                    <input type="text" className="form-control" value={clienteForm.ciudad} onChange={e => setClienteForm({ ...clienteForm, ciudad: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Encargado de Compras</label>
                    <input type="text" className="form-control" placeholder="Nombre del contacto" value={clienteForm.encargadoCompras} onChange={e => setClienteForm({ ...clienteForm, encargadoCompras: e.target.value })} />
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: '#0F172A', borderBottom: '1px solid #CBD5E1', paddingBottom: '8px' }}>Crédito y Facturación</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Tipo Precio POS *</label>
                    <select className="form-control" value={clienteForm.tipoPrecio} onChange={e => setClienteForm({ ...clienteForm, tipoPrecio: e.target.value as any })}>
                      <option value="POS">POS (Público)</option>
                      <option value="RESTAURANTE">Restaurante</option>
                      <option value="MAYORISTA">Mayorista</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Cupo Crédito ($) *</label>
                    <input type="number" className="form-control" placeholder="0" value={clienteForm.cupoCredito || ''} onChange={e => setClienteForm({ ...clienteForm, cupoCredito: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="submit" className="btn-primary" style={{ border: 'none', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: 'var(--primary-color)', color: 'white', borderRadius: '6px', cursor: 'pointer' }}>
                  <Save size={16} />
                  <span>{selectedClientId ? 'Guardar Cambios' : 'Registrar Cliente'}</span>
                </button>
              </div>
            </form>
          </div>

          {selectedClientId && (
            <div style={{ display: 'flex', gap: '24px' }}>
              
              {/* HISTORIAL DE VENTAS */}
              <div className="hr-table-card" style={{ padding: '24px', flex: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} color="#0EA5E9" /> Historial de Compras (POS)
                </h3>
                {selectedClienteVentas.length === 0 ? (
                  <p style={{ color: '#64748B', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>No hay ventas registradas.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                    {selectedClienteVentas.map(v => (
                      <div key={v.id} style={{ padding: '12px', border: '1px solid #E2E8F0', borderRadius: '6px', backgroundColor: '#F8FAFC' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, fontSize: '13px' }}>{v.id}</span>
                          <span style={{ fontSize: '12px', color: '#64748B' }}>{new Date(v.fecha).toLocaleDateString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>{v.items.length} productos</span>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary-color)' }}>${v.total.toLocaleString()}</span>
                        </div>
                        <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                          <span style={{ fontSize: '10px', padding: '2px 6px', backgroundColor: '#E2E8F0', borderRadius: '4px', fontWeight: 600 }}>{v.metodoPago}</span>
                          <span style={{ fontSize: '10px', padding: '2px 6px', backgroundColor: '#E2E8F0', borderRadius: '4px', fontWeight: 600 }}>Vendedor: {v.actor}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* HISTORIAL DE CARTERA */}
              <div className="hr-table-card" style={{ padding: '24px', flex: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Wallet size={18} color="#EF4444" /> Estado de Cuenta (Cartera)
                </h3>
                {selectedClienteCartera.length === 0 ? (
                  <p style={{ color: '#64748B', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>No hay facturas a crédito pendientes.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                    {selectedClienteCartera.map(inv => (
                      <div key={inv.id} style={{ padding: '12px', border: '1px solid #E2E8F0', borderRadius: '6px', backgroundColor: inv.saldo === 0 ? '#F0FDF4' : '#FEF2F2' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, fontSize: '13px' }}>{inv.id}</span>
                          <span style={{ fontSize: '12px', color: '#64748B' }}>{new Date(inv.fecha).toLocaleDateString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', color: '#64748B' }}>Total Venta:</span>
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>${inv.total.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: inv.saldo > 0 ? '#EF4444' : '#10B981' }}>Saldo Pendiente:</span>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: inv.saldo > 0 ? '#EF4444' : '#10B981' }}>${inv.saldo.toLocaleString()}</span>
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
