import { useState, useEffect } from 'react';
import { Proveedor, generateId, toTitleCase } from '../App.tsx';
import { Truck, Search, Save, ShoppingCart, Box, PlusCircle, ArrowLeft, DollarSign } from 'lucide-react';
import Swal from 'sweetalert2';
import { useSupplierStore } from '../store/useSupplierStore.ts';
import { usePurchaseStore, CuentaPorPagar } from '../store/usePurchaseStore.ts';
import { useMovementStore } from '../store/useMovementStore.ts';
import { useExpenseStore } from '../store/useExpenseStore.ts';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';

export default function SuppliersView() {
  const { proveedores, setProveedores } = useSupplierStore();
  const ordenesCompra = usePurchaseStore((s) => s.ordenesCompra);
  const cuentasPorPagar = usePurchaseStore((s) => s.cuentasPorPagar);
  const loadCuentasPorPagar = usePurchaseStore((s) => s.loadCuentasPorPagar);
  const registrarAbonoCuentaPorPagar = usePurchaseStore((s) => s.registrarAbonoCuentaPorPagar);
  const movimientos = useMovementStore((s) => s.movimientos);
  const gastos = useExpenseStore((s) => s.gastos);
  const [activeTab, setActiveTab] = useState<'PROVEEDORES' | 'GASTOS'>('PROVEEDORES');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'ACTIVOS' | 'INACTIVOS'>('TODOS');
  const [selectedProveedorId, setSelectedProveedorId] = useState<string | null>(null);

  useEffect(() => {
    loadCuentasPorPagar();
  }, [loadCuentasPorPagar]);

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
      setProveedores((prev: Proveedor[]) => prev.map((p: Proveedor) => p.id === selectedProveedorId ? {
        ...p,
        nombre: toTitleCase(proveedorForm.nombre),
        nit: proveedorForm.nit,
        tipoIdentificacion: proveedorForm.tipoIdentificacion,
        direccion: toTitleCase(proveedorForm.direccion),
        telefono: proveedorForm.telefono,
        email: proveedorForm.email,
        ciudad: toTitleCase(proveedorForm.ciudad),
        contactoCompras: toTitleCase(proveedorForm.contactoCompras),
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
        nombre: toTitleCase(proveedorForm.nombre),
        nit: proveedorForm.nit,
        tipoIdentificacion: proveedorForm.tipoIdentificacion,
        direccion: toTitleCase(proveedorForm.direccion),
        telefono: proveedorForm.telefono,
        email: proveedorForm.email,
        ciudad: toTitleCase(proveedorForm.ciudad),
        contactoCompras: toTitleCase(proveedorForm.contactoCompras),
        plazoPagoDias: proveedorForm.plazoPagoDias,
        activo: true
      };
      setProveedores((prev: Proveedor[]) => [...prev, nuevo]);
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
    setProveedores((prev: Proveedor[]) => prev.map((p: Proveedor) => p.id === id ? { ...p, activo: !p.activo } : p));
  };

  const filteredProveedores = proveedores.filter(p => {
    const matchSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        p.nit.includes(searchTerm);
    const matchStatus = statusFilter === 'TODOS' ? true : 
                        statusFilter === 'ACTIVOS' ? p.activo : !p.activo;
    return matchSearch && matchStatus;
  });

  const selectedProveedorObj = proveedores.find(p => p.id === selectedProveedorId);
  const selectedProveedorOrdenes = ordenesCompra.filter(oc => oc.proveedorId === selectedProveedorId).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  const selectedProveedorCuentasPorPagar = cuentasPorPagar.filter(cpp => cpp.proveedorId === selectedProveedorId || (selectedProveedorObj && cpp.proveedorNombre === selectedProveedorObj.nombre)).sort((a, b) => new Date(b.fechaEmision).getTime() - new Date(a.fechaEmision).getTime());

  // Buscar movimientos de entrada que estén asociados a este proveedor 
  // (Asumiendo que el campo 'responsable' o 'observacion' guarda el nombre o ID del proveedor en entradas por compras)
  const selectedProveedorMovimientos = movimientos.filter(m => 
    m.tipo === 'ENTRADA_COMPRA' && 
    (m.notas?.includes(selectedProveedorObj?.nombre || '') || m.actor === selectedProveedorObj?.nombre)
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleAbonarCuentaPorPagar = (cpp: CuentaPorPagar) => {
    Swal.fire({
      title: `Abonar a Factura ${cpp.ordenCompraId}`,
      html: `
        <div style="text-align: left; margin-bottom: 12px;">
          <p style="margin: 4px 0; font-size: 13px;"><strong>Proveedor:</strong> ${cpp.proveedorNombre}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Saldo Pendiente:</strong> <span style="color: #EF4444; font-weight: 800;">$${cpp.saldoPendiente.toLocaleString('es-CO')}</span></p>
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px; text-align: left;">
          <label style="font-size: 12px; font-weight: 600;">Monto a Abonar ($):</label>
          <input type="number" id="abono-monto" class="swal2-input" value="${cpp.saldoPendiente}" max="${cpp.saldoPendiente}" style="margin:0; width: 100%; height: 38px; font-size: 14px;" />
          <label style="font-size: 12px; font-weight: 600; margin-top: 4px;">Método de Pago:</label>
          <select id="abono-metodo" class="swal2-select" style="margin:0; width: 100%; height: 38px; font-size: 14px;">
            <option value="EFECTIVO">Efectivo (Caja Menor / Turno Activo)</option>
            <option value="TRANSFERENCIA">Transferencia Bancaria</option>
            <option value="DATAFONO">Datáfono / Tarjeta</option>
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Registrar Abono',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'var(--primary-color)',
      preConfirm: () => {
        const montoInput = (document.getElementById('abono-monto') as HTMLInputElement).value;
        const monto = parseFloat(montoInput) || 0;
        const metodoPago = (document.getElementById('abono-metodo') as HTMLSelectElement).value as 'EFECTIVO' | 'DATAFONO' | 'TRANSFERENCIA';
        
        if (monto <= 0) {
          Swal.showValidationMessage('Ingrese un monto mayor a cero.');
          return false;
        }
        if (monto > cpp.saldoPendiente) {
          Swal.showValidationMessage(`El monto excede el saldo pendiente ($${cpp.saldoPendiente.toLocaleString('es-CO')}).`);
          return false;
        }
        return { monto, metodoPago };
      }
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        const { monto, metodoPago } = result.value;
        const res = await registrarAbonoCuentaPorPagar({
          cuentaId: cpp.id,
          monto,
          metodoPago,
          usuarioId: 'SISTEMA'
        });

        if (res.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Abono Aplicado',
            text: `Se registró un abono de $${monto.toLocaleString('es-CO')} a la cuenta por pagar y se sincronizó con el Flujo de Caja.`,
            confirmButtonColor: 'var(--primary-color)'
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error al registrar abono',
            text: res.error || 'Ocurrió un error inesperado.',
            confirmButtonColor: 'var(--primary-color)'
          });
        }
      }
    });
  };

  return (
    <div className="animate-fade-in" style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="view-title">Directorio de Proveedores</h2>
          <span style={{ fontSize: '14px', color: '#64748B' }}>Gestione el perfil, compras e historial de órdenes de sus proveedores.</span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Button 
            variant={activeTab === 'PROVEEDORES' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('PROVEEDORES')}
          >
            Directorio Proveedores
          </Button>
          <Button 
            variant={activeTab === 'GASTOS' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('GASTOS')}
          >
            Flujo de Caja (Gastos)
          </Button>
        </div>
        {activeTab === 'PROVEEDORES' && (
          <Button variant="primary" onClick={startNewProveedor} icon={<PlusCircle size={18} />}>
            Nuevo Proveedor
          </Button>
        )}
      </div>

      {activeTab === 'PROVEEDORES' ? (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        
        {/* COLUMNA IZQUIERDA: LISTA DE PROVEEDORES */}
        <div style={{ flex: '0 0 350px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="pos-search-bar" style={{ marginBottom: 0 }}>
            <Input
              leftIcon={<Search size={18} color="#64748B" />}
              placeholder="Buscar proveedor..."
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
            {filteredProveedores.map(p => (
              <Card 
                glass
                key={p.id} 
                onClick={() => selectProveedor(p)}
                style={{ 
                  padding: '16px', 
                  border: `1px solid ${selectedProveedorId === p.id ? 'var(--primary-color)' : 'var(--border-color)'}`, 
                  cursor: 'pointer',
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
              </Card>
            ))}
            {filteredProveedores.length === 0 && (
              <Card glass style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>
                No se encontraron proveedores.
              </Card>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: PERFIL DEL PROVEEDOR E HISTORIAL */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <Card glass style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {selectedProveedorId && (
                  <button
                    type="button"
                    onClick={() => setSelectedProveedorId(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#64748B',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#F1F5F9',
                      transition: 'all 0.2s',
                      marginRight: '4px'
                    }}
                    title="Volver al Listado / Limpiar Selección"
                  >
                    <ArrowLeft size={16} />
                  </button>
                )}
                <h3 style={{ fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                  <Truck size={20} color="var(--primary-color)" /> 
                  {selectedProveedorId ? 'Perfil del Proveedor' : 'Registrar Nuevo Proveedor'}
                </h3>
              </div>
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

            <form onSubmit={handleSaveProveedor} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ padding: '16px', backgroundColor: 'var(--surface-dark)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: '#0F172A', borderBottom: '1px solid #CBD5E1', paddingBottom: '8px' }}>Información Básica</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Nombre o Razón Social *</label>
                    <input type="text" className="form-control" placeholder="Ej: Distribuidora del Mar" value={proveedorForm.nombre} onChange={e => setProveedorForm({ ...proveedorForm, nombre: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Tipo Identificación *</label>
                    <select className="form-control" value={proveedorForm.tipoIdentificacion} onChange={e => setProveedorForm({ ...proveedorForm, tipoIdentificacion: e.target.value as any })}>
                      <option value="NIT">NIT</option>
                      <option value="CC">Cédula</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">NIT / Número *</label>
                    <input type="text" className="form-control" placeholder="Ej: 901234567-8" value={proveedorForm.nit} onChange={e => setProveedorForm({ ...proveedorForm, nit: e.target.value })} />
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px', backgroundColor: 'var(--surface-dark)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: '#0F172A', borderBottom: '1px solid #CBD5E1', paddingBottom: '8px' }}>Contacto y Ubicación</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Celular / Teléfono</label>
                    <input type="text" className="form-control" value={proveedorForm.telefono} onChange={e => setProveedorForm({ ...proveedorForm, telefono: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Correo Electrónico</label>
                    <input type="email" className="form-control" placeholder="proveedor@empresa.com" value={proveedorForm.email} onChange={e => setProveedorForm({ ...proveedorForm, email: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Dirección</label>
                    <input type="text" className="form-control" value={proveedorForm.direccion} onChange={e => setProveedorForm({ ...proveedorForm, direccion: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Ciudad</label>
                    <input type="text" className="form-control" value={proveedorForm.ciudad} onChange={e => setProveedorForm({ ...proveedorForm, ciudad: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Contacto Comercial (Persona)</label>
                    <input type="text" className="form-control" value={proveedorForm.contactoCompras} onChange={e => setProveedorForm({ ...proveedorForm, contactoCompras: e.target.value })} />
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px', backgroundColor: 'var(--surface-dark)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: '#0F172A', borderBottom: '1px solid #CBD5E1', paddingBottom: '8px' }}>Condiciones Comerciales</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Plazo de Pago (Días)</label>
                    <input type="number" className="form-control" value={proveedorForm.plazoPagoDias || ''} onChange={e => setProveedorForm({ ...proveedorForm, plazoPagoDias: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <Button variant="primary" icon={<Save size={16} />} fullWidth>
                  {selectedProveedorId ? 'Guardar Cambios' : 'Registrar Proveedor'}
                </Button>
              </div>
            </form>
          </Card>

          {selectedProveedorId && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              
              {/* HISTORIAL DE ÓRDENES DE COMPRA */}
              <Card glass style={{ padding: '24px' }}>
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
                          <span style={{ fontSize: '12px', color: '#64748B' }}>{new Date(oc.fecha).toLocaleDateString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>{oc.items.length} productos</span>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary-color)' }}>${oc.totalCompra.toLocaleString()}</span>
                        </div>
                        <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                          <span style={{ 
                            fontSize: '10px', 
                            padding: '2px 6px', 
                            backgroundColor: oc.estado === 'RECIBIDA' ? '#D1FAE5' : '#E2E8F0', 
                            color: oc.estado === 'RECIBIDA' ? '#065F46' : '#475569',
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
              </Card>

              {/* CUENTAS POR PAGAR (AP) */}
              <Card glass style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DollarSign size={18} color="#EF4444" /> Cuentas por Pagar (AP)
                </h3>
                {selectedProveedorCuentasPorPagar.length === 0 ? (
                  <p style={{ color: '#64748B', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>No hay cuentas por pagar registradas.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                    {selectedProveedorCuentasPorPagar.map(cpp => (
                      <div key={cpp.id} style={{ padding: '12px', border: '1px solid #E2E8F0', borderRadius: '6px', backgroundColor: '#FEF2F2' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, fontSize: '13px' }}>Orden: {cpp.ordenCompraId}</span>
                          <span style={{ fontSize: '12px', color: '#64748B' }}>Vence: {new Date(cpp.fechaVencimiento).toLocaleDateString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: '#64748B' }}>Total: ${cpp.montoTotal.toLocaleString('es-CO')}</span>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: '#EF4444' }}>Saldo: ${cpp.saldoPendiente.toLocaleString('es-CO')}</span>
                        </div>
                        <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ 
                            fontSize: '10px', 
                            padding: '2px 6px', 
                            backgroundColor: cpp.estado === 'PAGADA' ? '#D1FAE5' : cpp.estado === 'PAGADA_PARCIAL' ? '#FEF3C7' : '#FEE2E2', 
                            color: cpp.estado === 'PAGADA' ? '#065F46' : cpp.estado === 'PAGADA_PARCIAL' ? '#92400E' : '#991B1B',
                            borderRadius: '4px', 
                            fontWeight: 600 
                          }}>
                            {cpp.estado}
                          </span>
                          {cpp.saldoPendiente > 0 && (
                            <button
                              type="button"
                              onClick={() => handleAbonarCuentaPorPagar(cpp)}
                              style={{
                                border: 'none',
                                backgroundColor: 'var(--primary-color)',
                                color: 'white',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <DollarSign size={12} />
                              Abonar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* HISTORIAL DE RECEPCIONES / ENTRADAS */}
              <Card glass style={{ padding: '24px' }}>
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
                          <span style={{ fontWeight: 700, fontSize: '13px' }}>{m.sku}</span>
                          <span style={{ fontSize: '12px', color: '#64748B' }}>{new Date(m.timestamp).toLocaleDateString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: '#64748B' }}>Bodega: {m.bodegaDestino}</span>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: '#10B981' }}>+{m.cantidad}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', fontStyle: 'italic' }}>
                          {m.notas}
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
      ) : (
        <Card glass style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px', color: 'var(--text-primary)' }}>Libro de Gastos / Salidas de Caja</h3>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-dark)', borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '13px' }}>Fecha</th>
                <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '13px' }}>ID Ref</th>
                <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '13px' }}>Categoría</th>
                <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '13px' }}>Concepto</th>
                <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'right' }}>Monto ($)</th>
              </tr>
            </thead>
            <tbody>
              {gastos.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>No hay gastos registrados.</td>
                </tr>
              ) : (
                gastos.map(gasto => (
                  <tr key={gasto.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '12px', fontSize: '13px' }}>{new Date(gasto.fecha).toLocaleDateString()}</td>
                    <td style={{ padding: '12px', fontSize: '13px', fontFamily: 'monospace', color: '#64748B' }}>{gasto.id.split('-')[1].toUpperCase()}</td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>
                      <span style={{ backgroundColor: gasto.categoria === 'NÓMINA' ? '#DBEAFE' : '#F1F5F9', color: gasto.categoria === 'NÓMINA' ? '#1E40AF' : '#475569', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }}>
                        {gasto.categoria}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px', color: '#0F172A', fontWeight: 500 }}>{gasto.concepto}</td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#EF4444', fontWeight: 800, textAlign: 'right' }}>
                      - ${Math.round(gasto.monto).toLocaleString('es-CO')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}

    </div>
  );
}
