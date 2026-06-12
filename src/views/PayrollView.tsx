import React, { useState, useMemo, useEffect } from 'react';
import { FileText, Calculator, CheckCircle, Shield, Briefcase, ArrowLeft, Sun, XOctagon } from 'lucide-react';
import Swal from 'sweetalert2';
import { generateId, Empleado, NominaRegistro, Gasto } from '../App.tsx';

interface PayrollViewProps {
  empleados: Empleado[];
  nominas: NominaRegistro[];
  setNominas: React.Dispatch<React.SetStateAction<NominaRegistro[]>>;
  gastos: Gasto[];
  setGastos: React.Dispatch<React.SetStateAction<Gasto[]>>;
}

const calcDiasComerciales = (inicio: string, fin: string) => {
  if (!inicio || !fin) return 0;
  const fInicio = new Date(inicio);
  const fFin = new Date(fin);
  if (fFin < fInicio) return 0;

  let d1 = fInicio.getUTCDate();
  let m1 = fInicio.getUTCMonth();
  let y1 = fInicio.getUTCFullYear();

  let d2 = fFin.getUTCDate();
  let m2 = fFin.getUTCMonth();
  let y2 = fFin.getUTCFullYear();

  if (d1 === 31) d1 = 30;
  if (d2 === 31) d2 = 30;
  
  if (m1 === 1 && d1 >= 28) d1 = 30;
  if (m2 === 1 && d2 >= 28) d2 = 30;

  return (y2 - y1) * 360 + (m2 - m1) * 30 + (d2 - d1) + 1;
};

export default function PayrollView({ empleados, nominas, setNominas, setGastos }: PayrollViewProps) {
  const [wizardType, setWizardType] = useState<'REGULAR' | 'VACACIONES' | 'LIQUIDACION_FINAL' | null>(null);
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<string>('');

  const [form, setForm] = useState({
    periodoInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    periodoFin: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
    diasTrabajados: 30,
    cantidadHorasExtrasDiurnas: 0,
    cantidadHorasExtrasNocturnas: 0,
    bonificaciones: 0,
    viaticos: 0,
    prestamosDeduccion: 0,
    otrasDeducciones: 0,
    // Específicos para Liquidación
    liqDiasCesantias: 0,
    liqDiasPrima: 0,
    liqDiasVacaciones: 0
  });

  const selectedEmpleado = useMemo(() => {
    return empleados.find(e => e.id === selectedEmpleadoId);
  }, [empleados, selectedEmpleadoId]);

  useEffect(() => {
    if (form.periodoInicio && form.periodoFin) {
      const dias = calcDiasComerciales(form.periodoInicio, form.periodoFin);
      if (wizardType === 'LIQUIDACION_FINAL') {
        setForm(f => ({ ...f, diasTrabajados: dias, liqDiasCesantias: dias, liqDiasPrima: dias, liqDiasVacaciones: dias }));
      } else {
        setForm(f => ({ ...f, diasTrabajados: Math.min(30, dias) }));
      }
    }
  }, [form.periodoInicio, form.periodoFin, wizardType]);

  const isPrestacion = selectedEmpleado?.tipoContrato === 'PRESTACION_SERVICIOS';
  const isAprendiz = selectedEmpleado?.tipoContrato === 'APRENDIZAJE';

  // ================= CÁLCULOS NÓMINA REGULAR / VACACIONES =================
  const calcSalarioProporcional = () => {
    if (!selectedEmpleado) return 0;
    return (selectedEmpleado.salarioBase / 30) * form.diasTrabajados;
  };

  const calcAuxilioTransporte = () => {
    if (!selectedEmpleado || isPrestacion || isAprendiz || selectedEmpleado.salarioBase > (1300000 * 2)) return 0;
    if (wizardType === 'VACACIONES') return 0; // No auxilio en vacaciones
    return (selectedEmpleado.auxilioTransporte / 30) * form.diasTrabajados;
  };

  const calcHorasExtras = () => {
    if (!selectedEmpleado) return 0;
    const valorHoraOrdinaria = selectedEmpleado.salarioBase / 240;
    const valorHED = valorHoraOrdinaria * 1.25 * form.cantidadHorasExtrasDiurnas;
    const valorHEN = valorHoraOrdinaria * 1.75 * form.cantidadHorasExtrasNocturnas;
    return valorHED + valorHEN;
  };

  const salarioProporcional = calcSalarioProporcional();
  const auxilioTransporte = calcAuxilioTransporte();
  const horasExtrasMonetario = wizardType === 'REGULAR' ? calcHorasExtras() : 0;
  const bonificaciones = wizardType === 'REGULAR' ? form.bonificaciones : 0;
  const viaticos = wizardType === 'REGULAR' ? form.viaticos : 0;
  
  const totalDevengado = salarioProporcional + auxilioTransporte + horasExtrasMonetario + bonificaciones + viaticos;
  const baseCotizacion = isPrestacion ? 0 : isAprendiz ? 1300000 : (salarioProporcional + horasExtrasMonetario + bonificaciones);
  
  const saludDeduccion = isPrestacion || isAprendiz ? 0 : baseCotizacion * 0.04;
  const pensionDeduccion = isPrestacion || isAprendiz ? 0 : baseCotizacion * 0.04;
  const totalDeducido = saludDeduccion + pensionDeduccion + form.prestamosDeduccion + form.otrasDeducciones;
  let netoAPagar = totalDevengado - totalDeducido;

  let aporteSaludEmpresa = 0;
  let aportePensionEmpresa = 0;
  let aporteARL = 0;
  let aporteCCF = 0;
  let aporteSENAICBF = 0;

  let provisionCesantias = 0;
  let provisionInteresesCesantias = 0;
  let provisionPrima = 0;
  let provisionVacaciones = 0;

  if (selectedEmpleado && wizardType !== 'LIQUIDACION_FINAL') {
    const riesgosPorcentajes = { 'I': 0.00522, 'II': 0.01044, 'III': 0.02436, 'IV': 0.04350, 'V': 0.06960 };
    const arlPorcentaje = riesgosPorcentajes[selectedEmpleado.riesgoARL || 'I'];

    if (isAprendiz) {
      aporteSaludEmpresa = baseCotizacion * 0.125;
      aporteARL = baseCotizacion * arlPorcentaje;
    } else if (!isPrestacion) {
      aporteSaludEmpresa = selectedEmpleado.aplicaExoneracion ? 0 : baseCotizacion * 0.085;
      aportePensionEmpresa = baseCotizacion * 0.12;
      aporteARL = wizardType === 'VACACIONES' ? 0 : baseCotizacion * arlPorcentaje;
      aporteCCF = baseCotizacion * 0.04;
      aporteSENAICBF = selectedEmpleado.aplicaExoneracion ? 0 : baseCotizacion * 0.05;

      const basePrestaciones = baseCotizacion + auxilioTransporte;
      provisionCesantias = basePrestaciones * 0.0833;
      provisionInteresesCesantias = provisionCesantias * 0.12;
      provisionPrima = basePrestaciones * 0.0833;
      provisionVacaciones = baseCotizacion * 0.0417;
    }
  }

  // ================= CÁLCULOS LIQUIDACIÓN FINAL =================
  let liqCesantias = 0;
  let liqIntereses = 0;
  let liqPrima = 0;
  let liqVacaciones = 0;

  if (wizardType === 'LIQUIDACION_FINAL' && selectedEmpleado) {
    const baseLiq = selectedEmpleado.salarioBase + selectedEmpleado.auxilioTransporte;
    liqCesantias = (baseLiq * form.liqDiasCesantias) / 360;
    liqIntereses = (liqCesantias * form.liqDiasCesantias * 0.12) / 360;
    liqPrima = (baseLiq * form.liqDiasPrima) / 360;
    liqVacaciones = (selectedEmpleado.salarioBase * form.liqDiasVacaciones) / 720;
    netoAPagar = liqCesantias + liqIntereses + liqPrima + liqVacaciones;
  }

  const costoTotalEmpresa = wizardType === 'LIQUIDACION_FINAL' 
    ? netoAPagar 
    : (totalDevengado + provisionCesantias + provisionInteresesCesantias + provisionPrima + provisionVacaciones + aportePensionEmpresa + aporteSaludEmpresa + aporteARL + aporteCCF + aporteSENAICBF);

  const handleGeneratePayroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpleado) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Debe seleccionar un empleado.' });
      return;
    }

    let conceptoGasto = `Pago Nómina`;
    if (wizardType === 'VACACIONES') conceptoGasto = `Disfrute Vacaciones`;
    if (wizardType === 'LIQUIDACION_FINAL') conceptoGasto = `Liquidación Definitiva de Contrato`;

    const nuevaNomina: NominaRegistro = {
      id: generateId('nom'),
      empleadoId: selectedEmpleado.id,
      empleadoNombre: selectedEmpleado.nombre,
      fechaEmision: new Date().toISOString(),
      periodoInicio: form.periodoInicio,
      periodoFin: form.periodoFin,
      diasTrabajados: wizardType === 'LIQUIDACION_FINAL' ? form.liqDiasCesantias : form.diasTrabajados,
      tipoLiquidacion: wizardType || 'REGULAR',
      
      salarioBaseProporcional: wizardType === 'LIQUIDACION_FINAL' ? liqCesantias + liqPrima + liqVacaciones : salarioProporcional,
      auxilioTransporte: wizardType === 'LIQUIDACION_FINAL' ? liqIntereses : auxilioTransporte, // Hack para guardar el valor
      horasExtrasDevengado: horasExtrasMonetario,
      bonificaciones,
      viaticos,
      totalDevengado: wizardType === 'LIQUIDACION_FINAL' ? netoAPagar : totalDevengado,
      
      saludDeduccion,
      pensionDeduccion,
      prestamosDeduccion: form.prestamosDeduccion,
      otrasDeducciones: form.otrasDeducciones,
      totalDeducido: wizardType === 'LIQUIDACION_FINAL' ? 0 : totalDeducido,
      
      netoAPagar,
      estadoPago: 'PENDIENTE',

      baseCotizacionIBC: baseCotizacion,
      provisionCesantias,
      provisionInteresesCesantias,
      provisionPrima,
      provisionVacaciones,
      aportePensionEmpresa,
      aporteSaludEmpresa,
      aporteARL,
      aporteCCF,
      aporteSENAICBF,
      costoTotalEmpresa
    };

    setNominas([nuevaNomina, ...nominas]);
    setWizardType(null);
    Swal.fire({
      icon: 'success',
      title: `${conceptoGasto} Generada`,
      text: 'La liquidación ha sido calculada con éxito.',
      confirmButtonColor: '#00B171'
    });
  };

  const handlePagar = (id: string) => {
    const nom = nominas.find(n => n.id === id);
    if (!nom) return;

    Swal.fire({
      title: 'Confirmar Pago',
      html: `¿Registrar salida de <b>$${Math.round(nom.netoAPagar).toLocaleString('es-CO')}</b> a ${nom.empleadoNombre}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, Pagar y Contabilizar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#00B171'
    }).then((result) => {
      if (result.isConfirmed) {
        let cat = 'NÓMINA';
        if (nom.tipoLiquidacion === 'LIQUIDACION_FINAL') cat = 'LIQUIDACIÓN';
        if (nom.tipoLiquidacion === 'VACACIONES') cat = 'NÓMINA (VAC)';

        const nuevoGasto: Gasto = {
          id: generateId('gas'),
          fecha: new Date().toISOString(),
          categoria: cat as any,
          concepto: `Pago ${nom.tipoLiquidacion || 'REGULAR'} ${nom.periodoInicio} - ${nom.periodoFin} (${nom.empleadoNombre})`,
          monto: nom.netoAPagar,
          referenciaId: nom.id,
          metodoPago: 'TRANSFERENCIA'
        };

        setGastos(prev => [nuevoGasto, ...prev]);

        setNominas(prev => prev.map(n => {
          if (n.id === id) {
            return {
              ...n,
              estadoPago: 'PAGADO',
              gastoIdGenerado: nuevoGasto.id
            };
          }
          return n;
        }));
        Swal.fire('Pago Contabilizado', `Gasto registrado en Flujo de Caja.`, 'success');
      }
    });
  };

  return (
    <div className="hr-layout animate-fade-in" style={{ padding: '24px' }}>
      <div className="hr-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 500 }}>Motor Contable</span>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.5px' }}>Liquidación de Nómina & Prestaciones</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => {
              if (empleados.length === 0) {
                Swal.fire('Error', 'No hay empleados', 'error');
                return;
              }
              setSelectedEmpleadoId(empleados[0].id);
              setWizardType('REGULAR');
            }}
            style={{ backgroundColor: '#0F172A', color: 'white', padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            <Calculator size={16} /> Nómina Regular
          </button>
          <button 
            onClick={() => {
              if (empleados.length === 0) {
                Swal.fire('Error', 'No hay empleados', 'error');
                return;
              }
              setSelectedEmpleadoId(empleados[0].id);
              setWizardType('VACACIONES');
            }}
            style={{ backgroundColor: '#F59E0B', color: 'white', padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            <Sun size={16} /> Vacaciones
          </button>
          <button 
            onClick={() => {
              if (empleados.length === 0) {
                Swal.fire('Error', 'No hay empleados', 'error');
                return;
              }
              setSelectedEmpleadoId(empleados[0].id);
              setWizardType('LIQUIDACION_FINAL');
            }}
            style={{ backgroundColor: '#EF4444', color: 'white', padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            <XOctagon size={16} /> Liq. Definitiva
          </button>
        </div>
      </div>

      <div className="hr-table-card" style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
        <table className="hr-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
              <th style={{ padding: '16px', fontWeight: 600, color: '#475569', fontSize: '14px' }}>Tipo / Empleado</th>
              <th style={{ padding: '16px', fontWeight: 600, color: '#475569', fontSize: '14px' }}>Período / Base</th>
              <th style={{ padding: '16px', fontWeight: 600, color: '#475569', fontSize: '14px' }}>Costo Empresa</th>
              <th style={{ padding: '16px', fontWeight: 600, color: '#475569', fontSize: '14px' }}>Neto a Pagar</th>
              <th style={{ padding: '16px', fontWeight: 600, color: '#475569', fontSize: '14px' }}>Estado</th>
              <th style={{ padding: '16px', fontWeight: 600, color: '#475569', fontSize: '14px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {nominas.map(nom => (
              <tr key={nom.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ padding: '16px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, backgroundColor: nom.tipoLiquidacion === 'LIQUIDACION_FINAL' ? '#FEE2E2' : nom.tipoLiquidacion === 'VACACIONES' ? '#FEF3C7' : '#F1F5F9', color: nom.tipoLiquidacion === 'LIQUIDACION_FINAL' ? '#991B1B' : nom.tipoLiquidacion === 'VACACIONES' ? '#92400E' : '#475569', padding: '2px 6px', borderRadius: '4px', marginBottom: '4px', display: 'inline-block' }}>
                    {nom.tipoLiquidacion || 'REGULAR'}
                  </span>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>{nom.empleadoNombre}</div>
                  <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <FileText size={12} /> Ref: {nom.id.split('-')[1].toUpperCase()}
                  </div>
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ fontSize: '13px', color: '#334155', fontWeight: 500 }}>
                    {nom.periodoInicio} al {nom.periodoFin}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{nom.diasTrabajados} Días base</div>
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ color: '#0F172A', fontWeight: 700 }}>
                    ${Math.round(nom.costoTotalEmpresa).toLocaleString('es-CO')}
                  </div>
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#00B171' }}>
                    ${Math.round(nom.netoAPagar).toLocaleString('es-CO')}
                  </div>
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{ 
                    backgroundColor: nom.estadoPago === 'PAGADO' ? '#DCFCE7' : '#FEF3C7', 
                    color: nom.estadoPago === 'PAGADO' ? '#166534' : '#92400E', 
                    padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 700 
                  }}>
                    {nom.estadoPago}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  {nom.estadoPago === 'PENDIENTE' && (
                    <button onClick={() => handlePagar(nom.id)} style={{ padding: '6px 12px', backgroundColor: '#00B171', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle size={14} /> Pagar Gasto
                    </button>
                  )}
                  {nom.estadoPago === 'PAGADO' && (
                    <div style={{ fontSize: '12px', color: '#64748B' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12} color="#00B171" /> Pago Contabilizado</div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {nominas.length === 0 && (
              <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>No hay registros de nómina liquidados.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* WIZARD MODAL */}
      {wizardType && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="animate-fade-in" style={{
            backgroundColor: 'white', padding: '32px', borderRadius: '16px',
            width: '800px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>
                {wizardType === 'REGULAR' && 'Nómina Regular'}
                {wizardType === 'VACACIONES' && 'Disfrute de Vacaciones'}
                {wizardType === 'LIQUIDACION_FINAL' && 'Liquidación Definitiva'}
              </h3>
              <button onClick={() => setWizardType(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                <ArrowLeft size={16} /> Regresar
              </button>
            </div>

            <form onSubmit={handleGeneratePayroll}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Seleccionar Empleado *</label>
                  <select
                    className="form-control"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                    value={selectedEmpleadoId}
                    onChange={e => setSelectedEmpleadoId(e.target.value)}
                    required
                  >
                    {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre} - {e.tipoContrato}</option>)}
                  </select>
                </div>
              </div>

              {/* Selector de Fechas Base */}
              <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>Desde</label>
                    <input type="date" value={form.periodoInicio} onChange={e => setForm({...form, periodoInicio: e.target.value})} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #CBD5E1' }} required />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>Hasta</label>
                    <input type="date" value={form.periodoFin} onChange={e => setForm({...form, periodoFin: e.target.value})} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #CBD5E1' }} required />
                  </div>
                  <div style={{ width: '100px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>Días Calend.</label>
                    <div style={{ padding: '6px', borderRadius: '4px', border: '1px solid #E2E8F0', backgroundColor: '#E2E8F0', color: '#475569', fontWeight: 600, textAlign: 'center' }}>
                      {calcDiasComerciales(form.periodoInicio, form.periodoFin)}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: wizardType === 'LIQUIDACION_FINAL' ? '1fr' : '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                
                {/* WIZARD: NÓMINA REGULAR & VACACIONES */}
                {(wizardType === 'REGULAR' || wizardType === 'VACACIONES') && (
                  <>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px', marginBottom: '12px' }}>Detalle de Pagos al Empleado</h4>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                        <span style={{ color: '#64748B' }}>{wizardType === 'VACACIONES' ? 'Sueldo Vacaciones (+):' : 'Salario Proporcional (+):'}</span>
                        <span style={{ fontWeight: 600, color: '#0F172A' }}>${Math.round(salarioProporcional).toLocaleString('es-CO')}</span>
                      </div>
                      
                      {wizardType === 'REGULAR' && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '12px' }}>
                            <span style={{ color: '#64748B' }}>Auxilio Transporte (+):</span>
                            <span style={{ fontWeight: 600, color: '#0F172A' }}>${Math.round(auxilioTransporte).toLocaleString('es-CO')}</span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Cant. Extras Diurnas</label>
                              <input type="number" value={form.cantidadHorasExtrasDiurnas} onChange={e => setForm({...form, cantidadHorasExtrasDiurnas: parseInt(e.target.value)||0})} style={{ width: '100%', padding: '4px 6px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '12px' }} />
                            </div>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Cant. Extras Nocturnas</label>
                              <input type="number" value={form.cantidadHorasExtrasNocturnas} onChange={e => setForm({...form, cantidadHorasExtrasNocturnas: parseInt(e.target.value)||0})} style={{ width: '100%', padding: '4px 6px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '12px' }} />
                            </div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                            <span style={{ color: '#64748B' }}>Valor Horas Extras (+):</span>
                            <span style={{ fontWeight: 600, color: '#0F172A' }}>${Math.round(horasExtrasMonetario).toLocaleString('es-CO')}</span>
                          </div>
                        </>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px', borderTop: '1px dashed #E2E8F0', paddingTop: '8px' }}>
                        <span style={{ color: '#64748B' }}>Salud EPS (4%) (-):</span>
                        <span style={{ fontWeight: 600, color: '#EF4444' }}>${Math.round(saludDeduccion).toLocaleString('es-CO')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                        <span style={{ color: '#64748B' }}>Pensión (4%) (-):</span>
                        <span style={{ fontWeight: 600, color: '#EF4444' }}>${Math.round(pensionDeduccion).toLocaleString('es-CO')}</span>
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', borderBottom: '1px solid #CBD5E1', paddingBottom: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Briefcase size={16} /> Costos Asumidos Empresa
                      </h4>
                      {isPrestacion ? (
                        <div style={{ fontSize: '12px', color: '#64748B', fontStyle: 'italic' }}>Prestación de Servicios. Sin cargas adicionales.</div>
                      ) : (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                            <span style={{ color: '#64748B' }}>Salud Empresa:</span>
                            <span style={{ fontWeight: 600 }}>${Math.round(aporteSaludEmpresa).toLocaleString('es-CO')}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                            <span style={{ color: '#64748B' }}>Pensión Empresa:</span>
                            <span style={{ fontWeight: 600 }}>${Math.round(aportePensionEmpresa).toLocaleString('es-CO')}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                            <span style={{ color: '#64748B' }}>Parafiscales:</span>
                            <span style={{ fontWeight: 600 }}>${Math.round(aporteCCF + aporteSENAICBF).toLocaleString('es-CO')}</span>
                          </div>
                          {wizardType === 'REGULAR' && (
                            <>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                                <span style={{ color: '#64748B' }}>ARL:</span>
                                <span style={{ fontWeight: 600 }}>${Math.round(aporteARL).toLocaleString('es-CO')}</span>
                              </div>
                              <div style={{ borderTop: '1px dashed #CBD5E1', margin: '8px 0' }} />
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                                <span style={{ color: '#64748B' }}>Provisión Prestaciones:</span>
                                <span style={{ fontWeight: 600 }}>${Math.round(provisionCesantias + provisionInteresesCesantias + provisionPrima + provisionVacaciones).toLocaleString('es-CO')}</span>
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </>
                )}

                {/* WIZARD: LIQUIDACIÓN FINAL */}
                {wizardType === 'LIQUIDACION_FINAL' && (
                  <div style={{ backgroundColor: '#FEF2F2', padding: '24px', borderRadius: '12px', border: '1px solid #FCA5A5' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#991B1B', marginBottom: '16px' }}>Base de Liquidación Definitiva</h4>
                    <p style={{ fontSize: '13px', color: '#7F1D1D', marginBottom: '16px' }}>Revise y ajuste los días pendientes a liquidar por cada concepto. Los días base se calcularon automáticamente según las fechas ingresadas.</p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                      <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #F87171' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#991B1B', marginBottom: '4px' }}>Días Cesantías</label>
                        <input type="number" value={form.liqDiasCesantias} onChange={e => setForm({...form, liqDiasCesantias: parseInt(e.target.value)||0})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #FCA5A5', fontWeight: 700 }} />
                        <div style={{ fontSize: '16px', fontWeight: 900, color: '#0F172A', marginTop: '8px' }}>${Math.round(liqCesantias).toLocaleString('es-CO')}</div>
                      </div>
                      
                      <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #F87171' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#991B1B', marginBottom: '4px' }}>Días Int. Cesant.</label>
                        <input type="number" disabled value={form.liqDiasCesantias} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #FCA5A5', backgroundColor: '#FEE2E2', fontWeight: 700 }} />
                        <div style={{ fontSize: '16px', fontWeight: 900, color: '#0F172A', marginTop: '8px' }}>${Math.round(liqIntereses).toLocaleString('es-CO')}</div>
                      </div>

                      <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #F87171' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#991B1B', marginBottom: '4px' }}>Días Prima</label>
                        <input type="number" value={form.liqDiasPrima} onChange={e => setForm({...form, liqDiasPrima: parseInt(e.target.value)||0})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #FCA5A5', fontWeight: 700 }} />
                        <div style={{ fontSize: '16px', fontWeight: 900, color: '#0F172A', marginTop: '8px' }}>${Math.round(liqPrima).toLocaleString('es-CO')}</div>
                      </div>

                      <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #F87171' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#991B1B', marginBottom: '4px' }}>Días Vacaciones</label>
                        <input type="number" value={form.liqDiasVacaciones} onChange={e => setForm({...form, liqDiasVacaciones: parseInt(e.target.value)||0})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #FCA5A5', fontWeight: 700 }} />
                        <div style={{ fontSize: '16px', fontWeight: 900, color: '#0F172A', marginTop: '8px' }}>${Math.round(liqVacaciones).toLocaleString('es-CO')}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div style={{ backgroundColor: '#DCFCE7', padding: '16px', borderRadius: '8px', border: '1px solid #86EFAC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>Neto a Pagar Empleado</div>
                    <div style={{ fontSize: '11px', color: '#166534' }}>A Desembolsar de Caja</div>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#166534' }}>${Math.round(netoAPagar).toLocaleString('es-CO')}</div>
                </div>
                
                {wizardType !== 'LIQUIDACION_FINAL' && (
                  <div style={{ backgroundColor: '#F1F5F9', padding: '16px', borderRadius: '8px', border: '1px solid #CBD5E1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#334155', fontWeight: 700, textTransform: 'uppercase' }}>Costo Real Empresa</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>Pago + Seguridad + Provisiones</div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A' }}>${Math.round(costoTotalEmpresa).toLocaleString('es-CO')}</div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
                <button type="submit" style={{ padding: '12px 24px', border: 'none', borderRadius: '8px', backgroundColor: wizardType === 'LIQUIDACION_FINAL' ? '#EF4444' : '#0F172A', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px' }}>
                  <Shield size={18} /> Aprobar {wizardType === 'LIQUIDACION_FINAL' ? 'Liquidación' : 'Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
