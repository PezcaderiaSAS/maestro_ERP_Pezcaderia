import { useState, useEffect, useMemo } from 'react';
import type { Cliente } from '../types/erp.types';
import { generateId, toTitleCase } from '../lib/utils';
import { Users, Search, Save, FileText, Wallet, PlusCircle, Sparkles, UploadCloud } from 'lucide-react';
import Swal from 'sweetalert2';
import { useClientStore } from '../store/useClientStore.ts';
import { useOrderStore } from '../store/useOrderStore.ts';
import { useARStore } from '../store/useARStore.ts';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { SmartAutofillModal } from '../components/clients/SmartAutofillModal';
import { BulkUploadModal } from '../components/BulkUploadModal';
import { calcularDigitoVerificacion, determinarTipoPersonaPorNit } from '../utils/dianValidator';
import type { ParsedClientData } from '../utils/smartContactParser';

export default function ClientsView() {
  const { clientes, setClientes } = useClientStore();
  const ventas = useOrderStore((s) => s.ventas);
  const cartera = useARStore((s) => s.cartera);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'ACTIVOS' | 'INACTIVOS'>('TODOS');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isAutofillOpen, setIsAutofillOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

  // Doherty threshold: 200ms debounce on search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 200);
    return () => clearTimeout(handler);
  }, [searchTerm]);

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

  // Memoize client debt calculation to eliminate O(N*M) iteration on each keystroke
  const deudasMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const inv of cartera) {
      if (inv.clienteId) {
        map[inv.clienteId] = (map[inv.clienteId] || 0) + (inv.saldo || 0);
      }
    }
    return map;
  }, [cartera]);

  const getClienteDeuda = (clienteId: string) => {
    return deudasMap[clienteId] || 0;
  };

  const handleSaveCliente = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteForm.nombre || !clienteForm.identificacion) {
      Swal.fire({ icon: 'warning', title: 'Campos incompletos', text: 'Nombre e Identificación son requeridos.', confirmButtonColor: 'var(--primary-color)' });
      return;
    }

    if (selectedClientId && clientes.some(c => c.id === selectedClientId)) {
      setClientes((prev: Cliente[]) => prev.map((c: Cliente) => c.id === selectedClientId ? {
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
      setClientes((prev: Cliente[]) => [...prev, nuevo]);
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

  const handleApplyAutofill = (data: ParsedClientData) => {
    setClienteForm(prev => ({
      ...prev,
      nombre: data.nombre ? toTitleCase(data.nombre) : prev.nombre,
      identificacion: data.identificacion || prev.identificacion,
      tipoIdentificacion: data.tipoIdentificacion || prev.tipoIdentificacion,
      tipoPersona: data.tipoPersona || prev.tipoPersona,
      direccion: data.direccion ? toTitleCase(data.direccion) : prev.direccion,
      telefono: data.telefono || prev.telefono,
      email: data.email || prev.email,
      ciudad: data.ciudad ? toTitleCase(data.ciudad) : prev.ciudad,
      encargadoCompras: data.encargadoCompras ? toTitleCase(data.encargadoCompras) : prev.encargadoCompras,
    }));
  };

  const handleToggleCliente = (id: string) => {
    setClientes((prev: Cliente[]) => prev.map((c: Cliente) => c.id === id ? { ...c, activo: !c.activo } : c));
  };

  const filteredClientes = useMemo(() => {
    const term = debouncedSearch.toLowerCase().trim();
    return clientes.filter(c => {
      const matchSearch = !term || 
                          c.nombre.toLowerCase().includes(term) || 
                          c.identificacion.includes(term);
      const matchStatus = statusFilter === 'TODOS' ? true : 
                          statusFilter === 'ACTIVOS' ? c.activo : !c.activo;
      return matchSearch && matchStatus;
    });
  }, [clientes, debouncedSearch, statusFilter]);

  const selectedClienteObj = clientes.find(c => c.id === selectedClientId);
  const selectedClienteVentas = ventas.filter(v => v.clienteId === selectedClientId).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  const selectedClienteCartera = cartera.filter(inv => inv.clienteId === selectedClientId).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  return (
    <div className="pos-container p-3 sm:p-6 max-w-[1600px] mx-auto w-full overflow-hidden">
      
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <Users size={28} color="var(--primary-color)" /> Directorio de Clientes
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Administración de clientes, listas de precios, cupos de crédito y facturación.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="secondary" 
            onClick={() => setIsBulkUploadOpen(true)} 
            icon={<UploadCloud size={18} color="#0EA5E9" />}
            style={{ borderColor: '#0EA5E9', color: '#0EA5E9' }}
          >
            Importar CSV/Excel
          </Button>
          <Button variant="primary" onClick={startNewCliente} icon={<PlusCircle size={18} />}>
            Nuevo Cliente
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-stretch lg:items-start w-full min-w-0">
        
        <div className="w-full lg:w-[350px] lg:shrink-0 flex flex-col gap-4 min-w-0">
          <div className="pos-search-bar" style={{ marginBottom: 0 }}>
            <Input
              leftIcon={<Search size={18} color="#64748B" />}
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              fullWidth
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
                <Card 
                  glass
                  key={c.id} 
                  onClick={() => selectCliente(c)}
                  style={{ 
                    padding: '16px', 
                    border: `1px solid ${selectedClientId === c.id ? 'var(--primary-color)' : 'var(--border-color)'}`, 
                    cursor: 'pointer',
                    boxShadow: selectedClientId === c.id ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                    opacity: c.activo ? 1 : 0.6,
                    transition: 'all 0.2s'
                  }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm text-primary">{c.nombre}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{c.tipoIdentificacion} {c.identificacion}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                      {c.tipoPrecio}
                    </span>
                    <span style={{ fontSize: '12px', color: deuda > 0 ? '#EF4444' : '#10B981', fontWeight: 600 }}>
                      {deuda > 0 ? `Deuda: $${deuda.toLocaleString()}` : 'Sin Deuda'}
                    </span>
                  </div>
                </Card>
              )
            })}
            {filteredClientes.length === 0 && (
              <Card glass style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>
                No se encontraron clientes.
              </Card>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-6 min-w-0 w-full">
          
          <Card glass style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} color="var(--primary-color)" /> 
                {selectedClientId ? 'Perfil del Cliente' : 'Registrar Nuevo Cliente'}
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="secondary"
                  onClick={() => setIsAutofillOpen(true)}
                  icon={<Sparkles size={16} color="#06B6D4" />}
                >
                  Autocompletar IA / Smart Fill
                </Button>
                {selectedClientId && selectedClienteObj && (
                  <Button
                    variant={selectedClienteObj.activo ? 'danger' : 'primary'}
                    onClick={() => handleToggleCliente(selectedClientId)}
                  >
                    {selectedClienteObj.activo ? 'Desactivar Cliente' : 'Activar Cliente'}
                  </Button>
                )}
              </div>
            </div>

            <form onSubmit={handleSaveCliente} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ padding: '16px', backgroundColor: 'var(--surface-dark)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4 className="text-sm font-bold mb-3 text-primary border-b border-border dark:border-white/10 pb-2">Información Básica</h4>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label className="form-label" style={{ marginBottom: 0 }}>Número Identificación *</label>
                      {clienteForm.tipoIdentificacion === 'NIT' && clienteForm.identificacion.trim() && (
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', backgroundColor: '#ECFDF5', padding: '1px 6px', borderRadius: '4px', border: '1px solid #A7F3D0' }}>
                          DV: {calcularDigitoVerificacion(clienteForm.identificacion)}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej: 900123456"
                      value={clienteForm.identificacion}
                      onChange={e => {
                        const val = e.target.value;
                        const persona = clienteForm.tipoIdentificacion === 'NIT' ? determinarTipoPersonaPorNit(val) : clienteForm.tipoPersona;
                        setClienteForm({ ...clienteForm, identificacion: val, tipoPersona: persona });
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px', backgroundColor: 'var(--surface-dark)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4 className="text-sm font-bold mb-3 text-primary border-b border-border dark:border-white/10 pb-2">Contacto y Ubicación</h4>
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

              <div style={{ padding: '16px', backgroundColor: 'var(--surface-dark)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4 className="text-sm font-bold mb-3 text-primary border-b border-border dark:border-white/10 pb-2">Crédito y Facturación</h4>
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

                <Button type="submit" variant="primary" icon={<Save size={18} />} fullWidth>
                  {selectedClientId ? 'Guardar Cambios' : 'Registrar Cliente'}
                </Button>
            </form>
          </Card>

          {selectedClientId && (
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 min-w-0">
              
              {/* HISTORIAL DE VENTAS */}
              <Card glass style={{ padding: '24px', flex: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} color="#0EA5E9" /> Historial de Compras (POS)
                </h3>
                {selectedClienteVentas.length === 0 ? (
                  <p style={{ color: '#64748B', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>No hay ventas registradas.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                    {selectedClienteVentas.map((v: any) => (
                      <div key={v.id} className="p-3 border border-border dark:border-white/10 rounded-md bg-slate-50 dark:bg-slate-900/40">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, fontSize: '13px' }}>{v.id}</span>
                          <span style={{ fontSize: '12px', color: '#64748B' }}>{new Date(v.fecha).toLocaleDateString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="text-xs font-semibold text-primary">{v.items.length} productos</span>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary-color)' }}>${v.total.toLocaleString()}</span>
                        </div>
                        <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded font-semibold">{v.metodoPago}</span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded font-semibold">Vendedor: {v.actor}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* HISTORIAL DE CARTERA */}
              <Card glass style={{ padding: '24px', flex: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Wallet size={18} color="#EF4444" /> Estado de Cuenta (Cartera)
                </h3>
                {selectedClienteCartera.length === 0 ? (
                  <p style={{ color: '#64748B', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>No hay facturas a crédito pendientes.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                    {selectedClienteCartera.map(inv => (
                      <div key={inv.id} className={`p-3 border rounded-md ${inv.saldo === 0 ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40' : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/40'}`}>
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
              </Card>

            </div>
          )}

        </div>

      </div>

      {/* MODAL DE AUTOCOMPLETAR INTELIGENTE (COSTO 0, 0ms, PRIVADO) */}
      <SmartAutofillModal
        isOpen={isAutofillOpen}
        onClose={() => setIsAutofillOpen(false)}
        onApply={handleApplyAutofill}
      />

      <BulkUploadModal 
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        type="clientes"
      />
    </div>
  );
}
