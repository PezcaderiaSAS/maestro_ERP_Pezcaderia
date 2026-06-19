// src/services/payrollService.ts

import { jsPDF } from 'jspdf';
import type { Empleado, Gasto, NominaRegistro } from '../App.tsx';

export type WizardType = 'REGULAR' | 'VACACIONES' | 'LIQUIDACION_FINAL';

/** Helper to calculate commercial days between two dates */
export const calcDiasComerciales = (inicio: string, fin: string): number => {
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

/** Core calculation of a payroll entry */
export const calcularNomina = (
  empleado: Empleado,
  form: any,
  wizardType: WizardType | null
): NominaRegistro => {
  const isPrestacion = empleado.tipoContrato === 'PRESTACION_SERVICIOS';
  const isAprendiz = empleado.tipoContrato === 'APRENDIZAJE';

  const salarioProporcional = wizardType === 'LIQUIDACION_FINAL'
    ? 0
    : (empleado.salarioBase / 30) * form.diasTrabajados;

  const auxilioTransporte = (() => {
    if (isPrestacion || isAprendiz || empleado.salarioBase > 1300000 * 2) return 0;
    if (wizardType === 'VACACIONES') return 0;
    return (empleado.auxilioTransporte / 30) * form.diasTrabajados;
  })();

  const valorHoraOrdinaria = empleado.salarioBase / 240;
  const horasExtrasDevengado = wizardType === 'REGULAR'
    ? valorHoraOrdinaria * 1.25 * form.cantidadHorasExtrasDiurnas +
      valorHoraOrdinaria * 1.75 * form.cantidadHorasExtrasNocturnas
    : 0;

  const bonificaciones = wizardType === 'REGULAR' ? form.bonificaciones : 0;
  const viaticos = wizardType === 'REGULAR' ? form.viaticos : 0;

  const totalDevengado = salarioProporcional + auxilioTransporte + horasExtrasDevengado + bonificaciones + viaticos;

  const baseCotizacion = isPrestacion ? 0 : isAprendiz ? 1300000 : (salarioProporcional + horasExtrasDevengado + bonificaciones);

  const saludDeduccion = isPrestacion || isAprendiz ? 0 : baseCotizacion * 0.04;
  const pensionDeduccion = isPrestacion || isAprendiz ? 0 : baseCotizacion * 0.04;

  const totalDeducido = saludDeduccion + pensionDeduccion + form.prestamosDeduccion + form.otrasDeducciones;

  let netoAPagar = totalDevengado - totalDeducido;

  // Provision calculations (only for regular/vacaciones)
  let aporteSaludEmpresa = 0;
  let aportePensionEmpresa = 0;
  let aporteARL = 0;
  let aporteCCF = 0;
  let aporteSENAICBF = 0;
  let provisionCesantias = 0;
  let provisionInteresesCesantias = 0;
  let provisionPrima = 0;
  let provisionVacaciones = 0;

  if (wizardType !== 'LIQUIDACION_FINAL') {
    const riesgosPorcentajes: Record<string, number> = {
      I: 0.00522,
      II: 0.01044,
      III: 0.02436,
      IV: 0.0435,
      V: 0.0696,
    };
    const arlPorcentaje = riesgosPorcentajes[empleado.riesgoARL || 'I'];
    if (isAprendiz) {
      aporteSaludEmpresa = baseCotizacion * 0.125;
      aporteARL = baseCotizacion * arlPorcentaje;
    } else if (!isPrestacion) {
      aporteSaludEmpresa = empleado.aplicaExoneracion ? 0 : baseCotizacion * 0.085;
      aportePensionEmpresa = baseCotizacion * 0.12;
      aporteARL = wizardType === 'VACACIONES' ? 0 : baseCotizacion * arlPorcentaje;
      aporteCCF = baseCotizacion * 0.04;
      aporteSENAICBF = empleado.aplicaExoneracion ? 0 : baseCotizacion * 0.05;
      const basePrestaciones = baseCotizacion + auxilioTransporte;
      provisionCesantias = basePrestaciones * 0.0833;
      provisionInteresesCesantias = provisionCesantias * 0.12;
      provisionPrima = basePrestaciones * 0.0833;
      provisionVacaciones = baseCotizacion * 0.0417;
    }
  }

  // Liquidación final calculations
  let liqCesantias = 0;
  let liqIntereses = 0;
  let liqPrima = 0;
  let liqVacaciones = 0;
  if (wizardType === 'LIQUIDACION_FINAL') {
    const baseLiq = empleado.salarioBase + empleado.auxilioTransporte;
    liqCesantias = (baseLiq * form.liqDiasCesantias) / 360;
    liqIntereses = (liqCesantias * form.liqDiasCesantias * 0.12) / 360;
    liqPrima = (baseLiq * form.liqDiasPrima) / 360;
    liqVacaciones = (empleado.salarioBase * form.liqDiasVacaciones) / 720;
    netoAPagar = liqCesantias + liqIntereses + liqPrima + liqVacaciones;
  }

  const costoTotalEmpresa = wizardType === 'LIQUIDACION_FINAL'
    ? netoAPagar
    : totalDevengado + provisionCesantias + provisionInteresesCesantias + provisionPrima + provisionVacaciones + aportePensionEmpresa + aporteSaludEmpresa + aporteARL + aporteCCF + aporteSENAICBF;

  const nuevaNomina: NominaRegistro = {
    id: '', // filled by caller
    empleadoId: empleado.id,
    empleadoNombre: empleado.nombre,
    fechaEmision: new Date().toISOString(),
    periodoInicio: form.periodoInicio,
    periodoFin: form.periodoFin,
    diasTrabajados: wizardType === 'LIQUIDACION_FINAL' ? form.liqDiasCesantias : form.diasTrabajados,
    tipoLiquidacion: wizardType || 'REGULAR',
    salarioBaseProporcional: wizardType === 'LIQUIDACION_FINAL' ? liqCesantias + liqPrima + liqVacaciones : salarioProporcional,
    auxilioTransporte: wizardType === 'LIQUIDACION_FINAL' ? liqIntereses : auxilioTransporte,
    horasExtrasDevengado,
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
    costoTotalEmpresa,
  };

  return nuevaNomina;
};

/** Persist payroll and generate related expense */
export const guardarNomina = (
  nomina: NominaRegistro,
  setNominas: React.Dispatch<React.SetStateAction<NominaRegistro[]>>,
  setGastos: React.Dispatch<React.SetStateAction<Gasto[]>>,
  generarId: (prefix: string) => string
) => {
  const nuevaNomina = { ...nomina, id: generarId('nom') };
  setNominas(prev => [nuevaNomina, ...prev]);

  const categoria = (() => {
    switch (nomina.tipoLiquidacion) {
      case 'LIQUIDACION_FINAL':
        return 'LIQUIDACIÓN';
      case 'VACACIONES':
        return 'NÓMINA (VAC)';
      default:
        return 'NÓMINA';
    }
  })();

  const nuevoGasto: Gasto = {
    id: generarId('gas'),
    fecha: new Date().toISOString(),
    categoria: categoria as any,
    concepto: `Pago ${nomina.tipoLiquidacion || 'REGULAR'} ${nomina.periodoInicio} - ${nomina.periodoFin} (${nomina.empleadoNombre})`,
    monto: nuevaNomina.netoAPagar,
    referenciaId: nuevaNomina.id,
    metodoPago: 'TRANSFERENCIA',
  };

  setGastos(prev => [nuevoGasto, ...prev]);
  return nuevoGasto;
};

/** Generate PDF for a payroll record */
export const generarPdfNomina = (nomina: NominaRegistro) => {
  const doc = new jsPDF();
  doc.setFont('helvetica', 'bold');
  doc.text('Nómina', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const lines = [
    `Empleado: ${nomina.empleadoNombre}`,
    `Periodo: ${nomina.periodoInicio} - ${nomina.periodoFin}`,
    `Tipo: ${nomina.tipoLiquidacion}`,
    `Salario Proporcional: $${Math.round(nomina.salarioBaseProporcional).toLocaleString('es-CO')}`,
    `Auxilio Transporte: $${Math.round(nomina.auxilioTransporte).toLocaleString('es-CO')}`,
    `Horas Extras: $${Math.round(nomina.horasExtrasDevengado).toLocaleString('es-CO')}`,
    `Bonificaciones: $${Math.round(nomina.bonificaciones).toLocaleString('es-CO')}`,
    `Viáticos: $${Math.round(nomina.viaticos).toLocaleString('es-CO')}`,
    `Total Devengado: $${Math.round(nomina.totalDevengado).toLocaleString('es-CO')}`,
    `Deducciones: $${Math.round(nomina.totalDeducido).toLocaleString('es-CO')}`,
    `Neto a Pagar: $${Math.round(nomina.netoAPagar).toLocaleString('es-CO')}`,
    `Costo Total Empresa: $${Math.round(nomina.costoTotalEmpresa).toLocaleString('es-CO')}`,
  ];
  doc.text(lines, 20, 30);
  doc.save(`Nomina_${nomina.empleadoNombre}_${nomina.id}.pdf`);
};
