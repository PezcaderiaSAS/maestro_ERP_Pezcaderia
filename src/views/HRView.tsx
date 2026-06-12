import React, { useState } from 'react';
import { UserPlus, Lock, Calendar, Trash2, DollarSign, Calculator, FileText, CheckCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import { generateId, Empleado, NominaRegistro } from '../App.tsx';

interface HRViewProps {
  empleados: Empleado[];
  setEmpleados: React.Dispatch<React.SetStateAction<Empleado[]>>;
  nominas?: NominaRegistro[];
  setView?: (view: string) => void;
}

export default function HRView({ empleados, setEmpleados, nominas = [], setView }: HRViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState<'CERTIFICADO' | 'RECOMENDACION' | null>(null);
  const [historyEmpleado, setHistoryEmpleado] = useState<Empleado | null>(null);
  const [form, setForm] = useState<Partial<Empleado>>({
    nombre: '',
    identificacion: '',
    rolAcceso: 'VENDEDOR',
    cargo: 'Operario de Planta',
    salarioBase: 1300000,
    fechaIngreso: new Date().toISOString().split('T')[0],
    tipoContrato: 'INDEFINIDO',
    estado: 'ACTIVO',
    prestamosActivos: 0,
    auxilioTransporte: 162000,
    telefono: '',
    email: '',
    riesgoARL: 'I',
    aplicaExoneracion: true
  });

  const handleCreateEmpleado = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre || !form.identificacion) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Por favor complete todos los campos obligatorios.' });
      return;
    }

    const nuevo: Empleado = {
      id: generateId('emp'),
      nombre: form.nombre!,
      identificacion: form.identificacion!,
      rolAcceso: form.rolAcceso as any,
      cargo: form.cargo!,
      salarioBase: form.salarioBase!,
      fechaIngreso: form.fechaIngreso!,
      tipoContrato: form.tipoContrato as any,
      estado: form.estado as any,
      prestamosActivos: form.prestamosActivos!,
      auxilioTransporte: form.auxilioTransporte!,
      telefono: form.telefono!,
      email: form.email!,
      riesgoARL: form.riesgoARL as any,
      aplicaExoneracion: form.aplicaExoneracion!
    };

    setEmpleados([...empleados, nuevo]);
    setShowModal(false);
    // Limpiar form
    setForm({
      nombre: '',
      identificacion: '',
      rolAcceso: 'VENDEDOR',
      cargo: 'Operario de Planta',
      salarioBase: 1300000,
      fechaIngreso: new Date().toISOString().split('T')[0],
      tipoContrato: 'INDEFINIDO',
      estado: 'ACTIVO',
      prestamosActivos: 0,
      auxilioTransporte: 162000,
      telefono: '',
      email: '',
      riesgoARL: 'I',
      aplicaExoneracion: true
    });

    Swal.fire({
      icon: 'success',
      title: 'Registro Completado',
      text: 'El empleado ha sido registrado exitosamente.',
      confirmButtonColor: '#00B171'
    });
  };

  const handleDesvincular = (id: string, nombre: string) => {
    Swal.fire({
      title: '¿Desvincular Empleado?',
      text: `Al desvincular a ${nombre}, se cambiará su estado a INACTIVO.`,
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
              estado: 'INACTIVO'
            };
          }
          return emp;
        }));
        Swal.fire({
          icon: 'success',
          title: 'Empleado Desvinculado',
          text: 'Se actualizó el contrato a inactivo.',
          confirmButtonColor: '#00B171'
        });
      }
    });
  };

  const handleVerHistorial = (emp: Empleado) => {
    setHistoryEmpleado(emp);
    setShowHistoryModal(true);
  };

  const handleGenerarDoc = (emp: Empleado, tipo: 'CERTIFICADO' | 'RECOMENDACION') => {
    setHistoryEmpleado(emp);
    setShowDocModal(tipo);
  };

  const employeeNominas = nominas.filter(n => n.empleadoId === historyEmpleado?.id).sort((a, b) => new Date(b.fechaEmision).getTime() - new Date(a.fechaEmision).getTime()).slice(0, 12);

  const formatCurrency = (val: number) => `$${Math.round(val).toLocaleString('es-CO')}`;

  return (
    <div className="hr-layout animate-fade-in" style={{ padding: '24px' }}>
      <div className="hr-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 500 }}>Recursos Humanos</span>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.5px' }}>Directorio de Personal</h2>
        </div>
        <button 
          className="hr-btn-new" 
          onClick={() => setShowModal(true)}
          style={{ backgroundColor: '#0F172A', color: 'white', padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
        >
          <UserPlus size={16} />
          <span>Registrar Empleado</span>
        </button>
      </div>

      <div className="hr-table-card" style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
        <table className="hr-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
              <th style={{ padding: '16px', fontWeight: 600, color: '#475569', fontSize: '14px' }}>Nombre / Identificación</th>
              <th style={{ padding: '16px', fontWeight: 600, color: '#475569', fontSize: '14px' }}>Cargo / Rol</th>
              <th style={{ padding: '16px', fontWeight: 600, color: '#475569', fontSize: '14px' }}>Condiciones Laborales</th>
              <th style={{ padding: '16px', fontWeight: 600, color: '#475569', fontSize: '14px' }}>Estado</th>
              <th style={{ padding: '16px', fontWeight: 600, color: '#475569', fontSize: '14px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empleados.map(emp => (
              <tr key={emp.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ padding: '16px' }}>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>{emp.nombre}</div>
                  <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>CC: {emp.identificacion}</div>
                  <div style={{ fontSize: '13px', color: '#64748B' }}>{emp.telefono}</div>
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ fontWeight: 600, color: '#334155' }}>{emp.cargo}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#0F172A', marginTop: '4px', backgroundColor: '#E2E8F0', padding: '2px 8px', borderRadius: '12px', width: 'fit-content' }}>
                    <Lock size={10} /> {emp.rolAcceso}
                  </div>
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#334155', fontWeight: 500 }}>
                    <DollarSign size={14} color="#00B171" /> Base: ${(emp.salarioBase || 0).toLocaleString('es-CO')}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>{emp.tipoContrato}</div>
                  <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <Calendar size={12} /> Ingreso: {emp.fechaIngreso}
                  </div>
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{ 
                    backgroundColor: emp.estado === 'ACTIVO' ? '#DCFCE7' : emp.estado === 'INACTIVO' ? '#FEE2E2' : '#FEF3C7', 
                    color: emp.estado === 'ACTIVO' ? '#166534' : emp.estado === 'INACTIVO' ? '#991B1B' : '#92400E', 
                    padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 700 
                  }}>
                    {emp.estado}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      title="Liquidar Nómina"
                      onClick={() => {
                        // Idealmente deberíamos preseleccionar el empleado en PayrollView, pero al navegar a 'nomina' al menos el usuario llega al módulo.
                        if (setView) setView('nomina');
                      }}
                      style={{ padding: '6px', backgroundColor: '#E0F2FE', color: '#0EA5E9', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      <Calculator size={16} />
                    </button>
                    <button
                      title="Historial de Pagos"
                      onClick={() => handleVerHistorial(emp)}
                      style={{ padding: '6px', backgroundColor: '#F3E8FF', color: '#9333EA', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      <FileText size={16} />
                    </button>
                    {emp.estado !== 'INACTIVO' && (
                      <button
                        title="Desvincular"
                        onClick={() => handleDesvincular(emp.id, emp.nombre)}
                        style={{ padding: '6px', backgroundColor: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                      title="Certificado Laboral"
                      onClick={() => handleGenerarDoc(emp, 'CERTIFICADO')}
                      style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 600, backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Certificado
                    </button>
                    <button
                      title="Carta de Recomendación"
                      onClick={() => handleGenerarDoc(emp, 'RECOMENDACION')}
                      style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 600, backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Recomendación
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {empleados.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
                  No hay empleados registrados en el sistema.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="animate-fade-in" style={{
            backgroundColor: 'white', padding: '32px', borderRadius: '16px',
            width: '600px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px', color: '#0F172A', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>Registrar Nuevo Personal</h3>
            <form onSubmit={handleCreateEmpleado}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Nombre Completo *</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                    required
                    value={form.nombre}
                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Identificación / Cédula *</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                    required
                    value={form.identificacion}
                    onChange={e => setForm({ ...form, identificacion: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Teléfono</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                    value={form.telefono}
                    onChange={e => setForm({ ...form, telefono: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Email</label>
                  <input
                    type="email"
                    className="form-control"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Cargo</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                    value={form.cargo}
                    onChange={e => setForm({ ...form, cargo: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Rol de Acceso (ERP)</label>
                  <select
                    className="form-control"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                    value={form.rolAcceso}
                    onChange={e => setForm({ ...form, rolAcceso: e.target.value as any })}
                  >
                    <option value="VENDEDOR">VENDEDOR</option>
                    <option value="BODEGUERO">BODEGUERO</option>
                    <option value="REPARTIDOR">REPARTIDOR</option>
                    <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                    <option value="GERENTE">GERENTE</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Salario Base ($)</label>
                  <input
                    type="number"
                    className="form-control"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                    value={form.salarioBase}
                    onChange={e => setForm({ ...form, salarioBase: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Auxilio Transporte ($)</label>
                  <input
                    type="number"
                    className="form-control"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                    value={form.auxilioTransporte}
                    onChange={e => setForm({ ...form, auxilioTransporte: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Tipo de Contrato</label>
                  <select
                    className="form-control"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                    value={form.tipoContrato}
                    onChange={e => setForm({ ...form, tipoContrato: e.target.value as any })}
                  >
                    <option value="INDEFINIDO">INDEFINIDO</option>
                    <option value="FIJO">FIJO</option>
                    <option value="PRESTACION_SERVICIOS">PRESTACIÓN SERVICIOS</option>
                    <option value="APRENDIZAJE">APRENDIZAJE</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Fecha de Ingreso</label>
                  <input
                    type="date"
                    className="form-control"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                    value={form.fechaIngreso}
                    onChange={e => setForm({ ...form, fechaIngreso: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Riesgo ARL</label>
                  <select
                    className="form-control"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                    value={form.riesgoARL}
                    onChange={e => setForm({ ...form, riesgoARL: e.target.value as any })}
                  >
                    <option value="I">Nivel I (0.522%) - Administrativo/Ventas</option>
                    <option value="II">Nivel II (1.044%) - Riesgo Bajo</option>
                    <option value="III">Nivel III (2.436%) - Riesgo Medio (Operarios)</option>
                    <option value="IV">Nivel IV (4.350%) - Riesgo Alto</option>
                    <option value="V">Nivel V (6.960%) - Riesgo Máximo</option>
                  </select>
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', marginBottom: 0 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', width: '100%', backgroundColor: form.aplicaExoneracion ? '#DCFCE7' : 'white' }}>
                    <input
                      type="checkbox"
                      checked={form.aplicaExoneracion}
                      onChange={e => setForm({ ...form, aplicaExoneracion: e.target.checked })}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: form.aplicaExoneracion ? '#166534' : '#334155' }}>
                      Aplica Exoneración Ley 1607 (SENA, ICBF, Salud)
                    </span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: '10px 16px', border: '1px solid #CBD5E1', borderRadius: '8px', backgroundColor: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 16px', border: 'none', borderRadius: '8px', backgroundColor: '#0F172A', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                >
                  Guardar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHistoryModal && historyEmpleado && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="animate-fade-in" style={{
            backgroundColor: 'white', padding: '32px', borderRadius: '16px',
            width: '700px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>Historial de Pagos</h3>
                <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>{historyEmpleado.nombre} - Últimos 12 registros</div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                style={{ padding: '8px 16px', border: '1px solid #CBD5E1', borderRadius: '8px', backgroundColor: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
              >
                Cerrar
              </button>
            </div>

            {employeeNominas.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
                No hay registros de nómina para este empleado.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {employeeNominas.map(nom => (
                  <div key={nom.id} style={{ padding: '16px', border: '1px solid #E2E8F0', borderRadius: '8px', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Periodo: {nom.periodoInicio} al {nom.periodoFin}</div>
                      <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={12} /> {nom.diasTrabajados} días liquidados
                        {nom.estadoPago === 'PAGADO' && (
                          <span style={{ color: '#166534', backgroundColor: '#DCFCE7', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={10} /> Pagado ({nom.gastoIdGenerado?.split('-')[1].toUpperCase()})
                          </span>
                        )}
                        {nom.estadoPago === 'PENDIENTE' && (
                          <span style={{ color: '#92400E', backgroundColor: '#FEF3C7', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                            Pendiente
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#00B171' }}>${Math.round(nom.netoAPagar).toLocaleString('es-CO')}</div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Costo Empresa: ${Math.round(nom.costoTotalEmpresa).toLocaleString('es-CO')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showDocModal && historyEmpleado && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="animate-fade-in" style={{
            backgroundColor: 'white', padding: '40px', borderRadius: '12px',
            width: '800px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            maxHeight: '90vh', overflowY: 'auto', fontFamily: 'serif'
          }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(document.getElementById('doc-content')?.innerText || '');
                  Swal.fire('Copiado', 'El texto se ha copiado al portapapeles', 'success');
                }}
                style={{ padding: '8px 16px', border: 'none', borderRadius: '8px', backgroundColor: '#0F172A', color: 'white', fontWeight: 600, cursor: 'pointer', marginRight: '8px' }}
              >
                Copiar Texto
              </button>
              <button
                onClick={() => setShowDocModal(null)}
                style={{ padding: '8px 16px', border: '1px solid #CBD5E1', borderRadius: '8px', backgroundColor: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
              >
                Cerrar
              </button>
            </div>

            <div id="doc-content" style={{ padding: '20px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', lineHeight: '1.6', fontSize: '15px' }}>
              <div style={{ textAlign: 'center', marginBottom: '40px', fontWeight: 'bold', fontSize: '18px' }}>
                PEZCADERÍA S.A.S.<br/>
                NIT: 900.123.456-7<br/>
              </div>

              {showDocModal === 'CERTIFICADO' ? (
                <>
                  <div style={{ textAlign: 'center', marginBottom: '30px', fontWeight: 'bold', fontSize: '16px' }}>
                    CERTIFICA QUE:
                  </div>
                  <p style={{ textAlign: 'justify' }}>
                    El(la) señor(a) <strong>{historyEmpleado.nombre}</strong>, identificado(a) con Cédula de Ciudadanía No. <strong>{historyEmpleado.identificacion}</strong>, {historyEmpleado.estado === 'INACTIVO' ? 'laboró' : 'labora'} en nuestra empresa PEZCADERÍA S.A.S. desempeñando el cargo de <strong>{historyEmpleado.cargo}</strong>.
                  </p>
                  <p style={{ textAlign: 'justify' }}>
                    Su tipo de contrato es <strong>{historyEmpleado.tipoContrato.replace('_', ' ')}</strong>, con fecha de ingreso <strong>{historyEmpleado.fechaIngreso}</strong>, devengando un salario básico mensual de <strong>{formatCurrency(historyEmpleado.salarioBase)}</strong>.
                  </p>
                  <p style={{ textAlign: 'justify' }}>
                    Se expide el presente certificado a solicitud del interesado, a los {new Date().getDate()} días del mes de {new Date().toLocaleString('es-CO', { month: 'long' })} del año {new Date().getFullYear()}.
                  </p>
                </>
              ) : (
                <>
                  <div style={{ textAlign: 'center', marginBottom: '30px', fontWeight: 'bold', fontSize: '16px' }}>
                    A QUIEN PUEDA INTERESAR
                  </div>
                  <p style={{ textAlign: 'justify' }}>
                    Por medio de la presente, me permito recomendar ampliamente al señor(a) <strong>{historyEmpleado.nombre}</strong>, identificado(a) con Cédula de Ciudadanía No. <strong>{historyEmpleado.identificacion}</strong>, quien ha demostrado ser una persona íntegra, responsable y altamente comprometida con sus labores.
                  </p>
                  <p style={{ textAlign: 'justify' }}>
                    Durante su tiempo de servicio en PEZCADERÍA S.A.S. como <strong>{historyEmpleado.cargo}</strong> desde el <strong>{historyEmpleado.fechaIngreso}</strong>, siempre ha exhibido una excelente actitud, espíritu de colaboración y gran calidad humana.
                  </p>
                  <p style={{ textAlign: 'justify' }}>
                    No dudo en recomendar su perfil y sus capacidades, seguro(a) de que será un gran aporte en cualquier labor o proyecto que emprenda.
                  </p>
                  <p style={{ textAlign: 'justify' }}>
                    Cordialmente,
                  </p>
                </>
              )}

              <div style={{ marginTop: '60px' }}>
                _______________________________________<br/>
                <strong>DEPARTAMENTO DE RECURSOS HUMANOS</strong><br/>
                Pezcadería S.A.S.<br/>
                Tel: 300 123 4567
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
