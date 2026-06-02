// src/views/HRView.tsx
import React, { useState } from 'react';
import { UserPlus, FileText, Lock, Calendar, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';

interface Empleado {
  id: string;
  nombre: string;
  identificacion: string;
  cargo: string;
  fechaIngreso: string;
  fechaEgreso?: string;
  salario: number;
  estado: 'ACTIVO' | 'INACTIVO' | 'VACACIONES' | 'LICENCIA';
  rolERP?: string;
}

const EMPLEADOS_MOCK: Empleado[] = [
  { id: '1', nombre: 'Carlos Mendoza', identificacion: '10203040', cargo: 'Jefe de Bodega', fechaIngreso: '2024-01-15', salario: 2500000, estado: 'ACTIVO', rolERP: 'BODEGUERO' },
  { id: '2', nombre: 'Ana María Gómez', identificacion: '52304050', cargo: 'Facturadora Principal', fechaIngreso: '2023-06-01', salario: 1800000, estado: 'ACTIVO', rolERP: 'FACTURADOR' },
  { id: '3', nombre: 'Luis Fernando Díaz', identificacion: '79203040', cargo: 'Conductor Logístico', fechaIngreso: '2024-02-10', salario: 1600000, estado: 'ACTIVO', rolERP: 'CONDUCTOR' },
  { id: '4', nombre: 'Sofía Restrepo', identificacion: '10304050', cargo: 'Administrador Senior', fechaIngreso: '2022-10-01', salario: 4500000, estado: 'VACACIONES', rolERP: 'ADMIN' },
  { id: '5', nombre: 'Mario Alberto Ortiz', identificacion: '80203040', cargo: 'Operario de Planta', fechaIngreso: '2024-03-01', salario: 1300000, estado: 'LICENCIA' }
];

export default function HRView() {
  const [empleados, setEmpleados] = useState<Empleado[]>(EMPLEADOS_MOCK);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    identificacion: '',
    cargo: 'Operario de Planta',
    fechaIngreso: new Date().toISOString().split('T')[0],
    salario: 1300000,
    estado: 'ACTIVO' as 'ACTIVO' | 'INACTIVO' | 'VACACIONES' | 'LICENCIA',
    rolERP: '',
    pin: ''
  });

  const handleCreateEmpleado = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre || !form.identificacion) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Por favor complete todos los campos obligatorios.' });
      return;
    }

    const nuevo: Empleado = {
      id: (empleados.length + 1).toString(),
      nombre: form.nombre,
      identificacion: form.identificacion,
      cargo: form.cargo,
      fechaIngreso: form.fechaIngreso,
      salario: form.salario,
      estado: form.estado,
      rolERP: form.rolERP || undefined
    };

    setEmpleados([...empleados, nuevo]);
    setShowModal(false);
    // Limpiar form
    setForm({
      nombre: '',
      identificacion: '',
      cargo: 'Operario de Planta',
      fechaIngreso: new Date().toISOString().split('T')[0],
      salario: 1300000,
      estado: 'ACTIVO',
      rolERP: '',
      pin: ''
    });

    Swal.fire({
      icon: 'success',
      title: 'Registro Completado',
      text: 'El empleado ha sido registrado y su cuenta aprovisionada.',
      confirmButtonColor: '#00B171'
    });
  };

  const handleDescargarHV = (nombre: string) => {
    Swal.fire({
      icon: 'info',
      title: 'Hoja de Vida',
      text: `Descargando hoja de vida en PDF de ${nombre}...`,
      timer: 1500,
      showConfirmButton: false
    });
  };

  const handleDesvincular = (id: string, nombre: string) => {
    Swal.fire({
      title: '¿Desvincular Empleado?',
      text: `Al desvincular a ${nombre}, se registrará la fecha de egreso y se desactivará de inmediato su acceso al ERP.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, desvincular',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#64748B'
    }).then((result) => {
      if (result.isConfirmed) {
        setEmpleados(prev => prev.map(emp => {
          if (emp.id === id) {
            return {
              ...emp,
              estado: 'INACTIVO',
              fechaEgreso: new Date().toISOString().split('T')[0]
            };
          }
          return emp;
        }));
        Swal.fire({
          icon: 'success',
          title: 'Empleado Desvinculado',
          text: 'Se desactivó el acceso ERP y se actualizó el contrato a inactivo.',
          confirmButtonColor: '#00B171'
        });
      }
    });
  };

  return (
    <div className="hr-layout animate-fade-in">
      <div className="hr-header">
        <div>
          <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 500 }}>Recursos Humanos</span>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.5px' }}>Nómina y Personal</h2>
        </div>
        <button className="hr-btn-new" onClick={() => setShowModal(true)}>
          <UserPlus size={16} />
          <span>Registrar Empleado</span>
        </button>
      </div>

      <div className="hr-table-card">
        <table className="hr-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Identificación</th>
              <th>Cargo</th>
              <th>Ingreso / Egreso</th>
              <th>Salario Base</th>
              <th>Estado</th>
              <th>Rol ERP</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empleados.map(emp => (
              <tr key={emp.id}>
                <td style={{ fontWeight: 600 }}>{emp.nombre}</td>
                <td>{emp.identificacion}</td>
                <td>{emp.cargo}</td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', fontSize: '13px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748B' }}>
                      <Calendar size={12} /> {emp.fechaIngreso}
                    </span>
                    {emp.fechaEgreso && (
                      <span style={{ color: '#EF4444', fontWeight: 500 }}>
                        Hasta: {emp.fechaEgreso}
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ fontWeight: 500 }}>${emp.salario.toLocaleString('es-CO')}</td>
                <td>
                  <span className={`badge-status ${emp.estado.toLowerCase()}`}>
                    {emp.estado}
                  </span>
                </td>
                <td>
                  {emp.rolERP ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                      <Lock size={12} color="#00B171" /> {emp.rolERP}
                    </span>
                  ) : (
                    <span style={{ color: '#94A3B8', fontSize: '13px' }}>Sin Acceso</span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="qty-btn"
                      title="Descargar Hoja de Vida"
                      onClick={() => handleDescargarHV(emp.nombre)}
                    >
                      <FileText size={14} />
                    </button>
                    {emp.estado !== 'INACTIVO' && (
                      <button
                        className="qty-btn"
                        style={{ color: '#EF4444' }}
                        title="Desvincular"
                        onClick={() => handleDesvincular(emp.id, emp.nombre)}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Modal Inline React (Minimalista) */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="animate-fade-in" style={{
            backgroundColor: 'white', padding: '32px', borderRadius: '16px',
            width: '500px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.5px' }}>Registrar Nuevo Personal</h3>
            <form onSubmit={handleCreateEmpleado}>
              <div className="form-group">
                <label className="form-label">Nombre Completo *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Identificación / Cédula *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={form.identificacion}
                  onChange={e => setForm({ ...form, identificacion: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Cargo</label>
                  <select
                    className="form-control"
                    value={form.cargo}
                    onChange={e => setForm({ ...form, cargo: e.target.value })}
                  >
                    <option>Jefe de Bodega</option>
                    <option>Vendedor de Campo</option>
                    <option>Facturador Contable</option>
                    <option>Conductor Logístico</option>
                    <option>Operario de Planta</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Estado Laboral</label>
                  <select
                    className="form-control"
                    value={form.estado}
                    onChange={e => setForm({ ...form, estado: e.target.value as any })}
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="VACACIONES">VACACIONES</option>
                    <option value="LICENCIA">LICENCIA</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Salario Base ($)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={form.salario}
                    onChange={e => setForm({ ...form, salario: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha de Ingreso</label>
                  <input
                    type="date"
                    className="form-control"
                    value={form.fechaIngreso}
                    onChange={e => setForm({ ...form, fechaIngreso: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid #E2E8F0', margin: '20px 0', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Aprovisionamiento de Acceso ERP</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Rol del ERP</label>
                    <select
                      className="form-control"
                      value={form.rolERP}
                      onChange={e => setForm({ ...form, rolERP: e.target.value })}
                    >
                      <option value="">Sin acceso</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="VENDEDOR">VENDEDOR</option>
                      <option value="BODEGUERO">BODEGUERO</option>
                      <option value="FACTURADOR">FACTURADOR</option>
                      <option value="CONDUCTOR">CONDUCTOR</option>
                    </select>
                  </div>
                  {form.rolERP && (
                    <div className="form-group">
                      <label className="form-label">PIN Numérico (4 dígitos)</label>
                      <input
                        type="password"
                        maxLength={4}
                        className="form-control"
                        placeholder="••••"
                        value={form.pin}
                        onChange={e => setForm({ ...form, pin: e.target.value.replace(/\D/g, '') })}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifySelf: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="pos-category-tab"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="hr-btn-new"
                  style={{ border: 'none' }}
                >
                  Guardar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
