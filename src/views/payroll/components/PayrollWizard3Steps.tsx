import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calculator, 
  Sun, 
  XOctagon, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Search, 
  User, 
  Calendar, 
  DollarSign, 
  Clock, 
  Plus, 
  Minus, 
  ShieldCheck, 
  Building2, 
  Wallet, 
  AlertCircle,
  HelpCircle,
  Briefcase
} from 'lucide-react';
import Swal from 'sweetalert2';
import { generateId } from '../../../lib/utils';
import type { Empleado, NominaRegistro } from '../../../store/useEmployeeStore';
import type { Gasto } from '../../../store/useExpenseStore';
import { useEmployeeStore } from '../../../store/useEmployeeStore';
import { useExpenseStore } from '../../../store/useExpenseStore';

interface PayrollWizard3StepsProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'REGULAR' | 'VACACIONES' | 'LIQUIDACION_FINAL';
  preselectedEmpleadoId?: string;
  onSuccess?: (nomina: NominaRegistro) => void;
}

export const calcDiasComerciales = (inicio: string, fin: string): number => {
  if (!inicio || !fin) return 0;
  const fInicio = new Date(inicio);
  const fFin = new Date(fin);
  if (fFin < fInicio) return 0;

  let d1 = fInicio.getUTCDate();
  const m1 = fInicio.getUTCMonth();
  const y1 = fInicio.getUTCFullYear();

  let d2 = fFin.getUTCDate();
  const m2 = fFin.getUTCMonth();
  const y2 = fFin.getUTCFullYear();

  if (d1 === 31) d1 = 30;
  if (d2 === 31) d2 = 30;
  
  if (m1 === 1 && d1 >= 28) d1 = 30;
  if (m2 === 1 && d2 >= 28) d2 = 30;

  return (y2 - y1) * 360 + (m2 - m1) * 30 + (d2 - d1) + 1;
};

export const PayrollWizard3Steps: React.FC<PayrollWizard3StepsProps> = ({
  isOpen,
  onClose,
  initialType = 'REGULAR',
  preselectedEmpleadoId,
  onSuccess
}) => {
  const { empleados, nominas, setNominas } = useEmployeeStore();
  const { addGastoAsync } = useExpenseStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [wizardType, setWizardType] = useState<'REGULAR' | 'VACACIONES' | 'LIQUIDACION_FINAL'>(initialType);
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<string>(preselectedEmpleadoId || '');
  const [searchFilter, setSearchFilter] = useState('');
  const [metodoPago, setMetodoPago] = useState<'TRANSFERENCIA' | 'EFECTIVO'>('TRANSFERENCIA');
  const [desembolsarInmediato, setDesembolsarInmediato] = useState(true);

  // Inicialización de fechas
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [form, setForm] = useState({
    periodoInicio: firstDay,
    periodoFin: lastDay,
    diasTrabajados: 30,
    cantidadHorasExtrasDiurnas: 0,
    cantidadHorasExtrasNocturnas: 0,
    bonificaciones: 0,
    viaticos: 0,
    prestamosDeduccion: 0,
    otrasDeducciones: 0,
    liqDiasCesantias: 30,
    liqDiasPrima: 30,
    liqDiasVacaciones: 30
  });

  // Sincronizar tipo inicial cuando se abre
  useEffect(() => {
    if (isOpen) {
      setWizardType(initialType);
      setStep(1);
      if (preselectedEmpleadoId) {
        setSelectedEmpleadoId(preselectedEmpleadoId);
      } else if (!selectedEmpleadoId && empleados.length > 0) {
        setSelectedEmpleadoId(empleados[0].id);
      }
    }
  }, [isOpen, initialType, preselectedEmpleadoId, empleados]);

  // Recalcular días comerciales al mover fechas
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

  const selectedEmpleado = useMemo(() => {
    return empleados.find(e => e.id === selectedEmpleadoId);
  }, [empleados, selectedEmpleadoId]);

  const filteredEmpleados = useMemo(() => {
    if (!searchFilter.trim()) return empleados;
    const q = searchFilter.toLowerCase();
    return empleados.filter(e => 
      e.nombre.toLowerCase().includes(q) || 
      e.identificacion.toLowerCase().includes(q) ||
      e.cargo.toLowerCase().includes(q)
    );
  }, [empleados, searchFilter]);

  // Selección rápida de períodos
  const handleSelectPeriodoPreset = (preset: 'MES_COMPLETO' | 'QUINCENA_1' | 'QUINCENA_2') => {
    const year = now.getFullYear();
    const month = now.getMonth();
    if (preset === 'MES_COMPLETO') {
      const inicio = new Date(year, month, 1).toISOString().split('T')[0];
      const fin = new Date(year, month + 1, 0).toISOString().split('T')[0];
      setForm(f => ({ ...f, periodoInicio: inicio, periodoFin: fin, diasTrabajados: 30 }));
    } else if (preset === 'QUINCENA_1') {
      const inicio = new Date(year, month, 1).toISOString().split('T')[0];
      const fin = new Date(year, month, 15).toISOString().split('T')[0];
      setForm(f => ({ ...f, periodoInicio: inicio, periodoFin: fin, diasTrabajados: 15 }));
    } else {
      const inicio = new Date(year, month, 16).toISOString().split('T')[0];
      const fin = new Date(year, month + 1, 0).toISOString().split('T')[0];
      setForm(f => ({ ...f, periodoInicio: inicio, periodoFin: fin, diasTrabajados: 15 }));
    }
  };

  const isPrestacion = selectedEmpleado?.tipoContrato === 'PRESTACION_SERVICIOS';
  const isAprendiz = selectedEmpleado?.tipoContrato === 'APRENDIZAJE';

  // ================= CÁLCULOS DETERMINISTAS =================
  const salarioProporcional = useMemo(() => {
    if (!selectedEmpleado) return 0;
    return (selectedEmpleado.salarioBase / 30) * form.diasTrabajados;
  }, [selectedEmpleado, form.diasTrabajados]);

  const auxilioTransporte = useMemo(() => {
    if (!selectedEmpleado || isPrestacion || isAprendiz || selectedEmpleado.salarioBase > (1300000 * 2)) return 0;
    if (wizardType === 'VACACIONES') return 0;
    return (selectedEmpleado.auxilioTransporte / 30) * form.diasTrabajados;
  }, [selectedEmpleado, isPrestacion, isAprendiz, wizardType, form.diasTrabajados]);

  const horasExtrasMonetario = useMemo(() => {
    if (!selectedEmpleado || wizardType !== 'REGULAR') return 0;
    const valorHoraOrdinaria = selectedEmpleado.salarioBase / 240;
    const valorHED = valorHoraOrdinaria * 1.25 * form.cantidadHorasExtrasDiurnas;
    const valorHEN = valorHoraOrdinaria * 1.75 * form.cantidadHorasExtrasNocturnas;
    return valorHED + valorHEN;
  }, [selectedEmpleado, wizardType, form.cantidadHorasExtrasDiurnas, form.cantidadHorasExtrasNocturnas]);

  const bonificaciones = wizardType === 'REGULAR' ? form.bonificaciones : 0;
  const viaticos = wizardType === 'REGULAR' ? form.viaticos : 0;

  const totalDevengado = salarioProporcional + auxilioTransporte + horasExtrasMonetario + bonificaciones + viaticos;
  const baseCotizacion = isPrestacion ? 0 : isAprendiz ? 1300000 : (salarioProporcional + horasExtrasMonetario + bonificaciones);

  const saludDeduccion = isPrestacion || isAprendiz ? 0 : baseCotizacion * 0.04;
  const pensionDeduccion = isPrestacion || isAprendiz ? 0 : baseCotizacion * 0.04;
  const totalDeducido = saludDeduccion + pensionDeduccion + form.prestamosDeduccion + form.otrasDeducciones;
  
  // Liquidación definitiva
  const liqCesantias = useMemo(() => {
    if (wizardType !== 'LIQUIDACION_FINAL' || !selectedEmpleado) return 0;
    const baseLiq = selectedEmpleado.salarioBase + selectedEmpleado.auxilioTransporte;
    return (baseLiq * form.liqDiasCesantias) / 360;
  }, [wizardType, selectedEmpleado, form.liqDiasCesantias]);

  const liqIntereses = useMemo(() => {
    if (wizardType !== 'LIQUIDACION_FINAL') return 0;
    return (liqCesantias * form.liqDiasCesantias * 0.12) / 360;
  }, [wizardType, liqCesantias, form.liqDiasCesantias]);

  const liqPrima = useMemo(() => {
    if (wizardType !== 'LIQUIDACION_FINAL' || !selectedEmpleado) return 0;
    const baseLiq = selectedEmpleado.salarioBase + selectedEmpleado.auxilioTransporte;
    return (baseLiq * form.liqDiasPrima) / 360;
  }, [wizardType, selectedEmpleado, form.liqDiasPrima]);

  const liqVacaciones = useMemo(() => {
    if (wizardType !== 'LIQUIDACION_FINAL' || !selectedEmpleado) return 0;
    return (selectedEmpleado.salarioBase * form.liqDiasVacaciones) / 720;
  }, [wizardType, selectedEmpleado, form.liqDiasVacaciones]);

  const netoAPagar = useMemo(() => {
    if (wizardType === 'LIQUIDACION_FINAL') {
      return liqCesantias + liqIntereses + liqPrima + liqVacaciones;
    }
    return Math.max(0, totalDevengado - totalDeducido);
  }, [wizardType, liqCesantias, liqIntereses, liqPrima, liqVacaciones, totalDevengado, totalDeducido]);

  // Aportes y provisiones empresa
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
    const riesgosPorcentajes: Record<string, number> = { 'I': 0.00522, 'II': 0.01044, 'III': 0.02436, 'IV': 0.04350, 'V': 0.06960 };
    const arlPorcentaje = riesgosPorcentajes[selectedEmpleado.riesgoARL || 'I'] || 0.00522;

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

  const costoTotalEmpresa = wizardType === 'LIQUIDACION_FINAL'
    ? netoAPagar
    : (totalDevengado + provisionCesantias + provisionInteresesCesantias + provisionPrima + provisionVacaciones + aportePensionEmpresa + aporteSaludEmpresa + aporteARL + aporteCCF + aporteSENAICBF);

  // Manejador de liquidación y desembolso final
  const handleFinalSubmit = async () => {
    if (!selectedEmpleado) {
      Swal.fire('Error', 'Selecciona un empleado antes de continuar', 'error');
      return;
    }

    let conceptoGasto = 'Pago Nómina';
    if (wizardType === 'VACACIONES') conceptoGasto = 'Disfrute Vacaciones';
    if (wizardType === 'LIQUIDACION_FINAL') conceptoGasto = 'Liquidación Definitiva de Contrato';

    const nuevaNomina: NominaRegistro = {
      id: generateId('nom'),
      empleadoId: selectedEmpleado.id,
      empleadoNombre: selectedEmpleado.nombre,
      fechaEmision: new Date().toISOString(),
      periodoInicio: form.periodoInicio,
      periodoFin: form.periodoFin,
      diasTrabajados: wizardType === 'LIQUIDACION_FINAL' ? form.liqDiasCesantias : form.diasTrabajados,
      tipoLiquidacion: wizardType,
      salarioBaseProporcional: wizardType === 'LIQUIDACION_FINAL' ? (liqCesantias + liqPrima + liqVacaciones) : salarioProporcional,
      auxilioTransporte: wizardType === 'LIQUIDACION_FINAL' ? liqIntereses : auxilioTransporte,
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
      estadoPago: desembolsarInmediato ? 'PAGADO' : 'PENDIENTE',
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

    if (desembolsarInmediato) {
      let cat = 'NÓMINA';
      if (wizardType === 'LIQUIDACION_FINAL') cat = 'LIQUIDACIÓN';
      if (wizardType === 'VACACIONES') cat = 'NÓMINA (VAC)';

      const nuevoGasto: Gasto = {
        id: generateId('gas'),
        fecha: new Date().toISOString(),
        categoria: cat as any,
        concepto: `${conceptoGasto} [${form.periodoInicio} - ${form.periodoFin}] - ${selectedEmpleado.nombre}`,
        monto: netoAPagar,
        referenciaId: nuevaNomina.id,
        metodoPago
      };

      await addGastoAsync(nuevoGasto);
      nuevaNomina.gastoIdGenerado = nuevoGasto.id;
    }

    setNominas([nuevaNomina, ...nominas]);

    if (onSuccess) {
      onSuccess(nuevaNomina);
    }

    onClose();

    Swal.fire({
      icon: 'success',
      title: `${conceptoGasto} Aprobada`,
      html: `
        <div style="font-size: 14px; color: #334155;">
          Se liquidaron <b>$${Math.round(netoAPagar).toLocaleString('es-CO')}</b> a <b>${selectedEmpleado.nombre}</b>.
          ${desembolsarInmediato ? `<br><span style="color: #00B171; font-weight: 700;">Desembolso registrado en flujo de caja (${metodoPago}).</span>` : ''}
        </div>
      `,
      confirmButtonColor: '#00B171'
    });
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      data-testid="payroll-wizard-overlay"
    >
      <div 
        className="w-full max-w-3xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        data-testid="payroll-wizard-modal"
      >
        {/* Cabecera con Stepper Visual */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-xl text-white ${
                wizardType === 'LIQUIDACION_FINAL' ? 'bg-rose-600' : wizardType === 'VACACIONES' ? 'bg-amber-500' : 'bg-emerald-600'
              }`}>
                {wizardType === 'LIQUIDACION_FINAL' ? <XOctagon size={20} /> : wizardType === 'VACACIONES' ? <Sun size={20} /> : <Calculator size={20} />}
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  {wizardType === 'REGULAR' && 'Nómina Regular'}
                  {wizardType === 'VACACIONES' && 'Disfrute de Vacaciones'}
                  {wizardType === 'LIQUIDACION_FINAL' && 'Liquidación Definitiva'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">Asistente táctil de liquidación en 3 pasos</p>
              </div>
            </div>

            {/* Selector de Tipo en Cabecera */}
            <div className="hidden sm:flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setWizardType('REGULAR')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  wizardType === 'REGULAR' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Regular
              </button>
              <button
                type="button"
                onClick={() => setWizardType('VACACIONES')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  wizardType === 'VACACIONES' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Vacaciones
              </button>
              <button
                type="button"
                onClick={() => setWizardType('LIQUIDACION_FINAL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  wizardType === 'LIQUIDACION_FINAL' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Liquidación
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 min-h-[48px] min-w-[48px] rounded-xl text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors flex items-center justify-center active:scale-95 touch-manipulation"
              title="Cerrar"
              aria-label="Cerrar modal"
            >
              ✕
            </button>
          </div>

          {/* Stepper Visual de 3 Pasos */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 relative pt-1">
            {/* Paso 1 */}
            <div 
              onClick={() => setStep(1)}
              className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-all ${
                step === 1 ? 'bg-emerald-100/70 border border-emerald-300' : 'opacity-70 hover:opacity-100'
              }`}
              data-testid="step-indicator-1"
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                step === 1 ? 'bg-emerald-600 text-white' : selectedEmpleado ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {selectedEmpleado && step > 1 ? <Check size={14} /> : '1'}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold text-slate-400">Paso 1</div>
                <div className="text-xs font-black text-slate-800 truncate">Empleado</div>
              </div>
            </div>

            {/* Paso 2 */}
            <div 
              onClick={() => selectedEmpleado && setStep(2)}
              className={`flex items-center gap-2 p-2 rounded-xl transition-all ${
                !selectedEmpleado ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:opacity-100'
              } ${step === 2 ? 'bg-emerald-100/70 border border-emerald-300' : 'opacity-70'}`}
              data-testid="step-indicator-2"
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                step === 2 ? 'bg-emerald-600 text-white' : step > 2 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {step > 2 ? <Check size={14} /> : '2'}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold text-slate-400">Paso 2</div>
                <div className="text-xs font-black text-slate-800 truncate">Novedades</div>
              </div>
            </div>

            {/* Paso 3 */}
            <div 
              onClick={() => selectedEmpleado && setStep(3)}
              className={`flex items-center gap-2 p-2 rounded-xl transition-all ${
                !selectedEmpleado ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:opacity-100'
              } ${step === 3 ? 'bg-emerald-100/70 border border-emerald-300' : 'opacity-70'}`}
              data-testid="step-indicator-3"
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                step === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                3
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold text-slate-400">Paso 3</div>
                <div className="text-xs font-black text-slate-800 truncate">Liquidar & Pagar</div>
              </div>
            </div>
          </div>
        </div>

        {/* Cuerpo del Asistente */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* ================= PASO 1: EMPLEADO Y PERÍODO ================= */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in" data-testid="wizard-step-1-content">
              {/* Presets de Período */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                    <Calendar size={18} className="text-emerald-600" />
                    <span>Período a Liquidar</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSelectPeriodoPreset('MES_COMPLETO')}
                      className="px-2.5 py-1.5 min-h-[38px] text-xs font-bold rounded-lg border border-slate-300 bg-white hover:bg-slate-100 active:scale-95 transition-all text-slate-700"
                    >
                      Mes Completo (30d)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPeriodoPreset('QUINCENA_1')}
                      className="px-2.5 py-1.5 min-h-[38px] text-xs font-bold rounded-lg border border-slate-300 bg-white hover:bg-slate-100 active:scale-95 transition-all text-slate-700"
                    >
                      1ra Q (1-15)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPeriodoPreset('QUINCENA_2')}
                      className="px-2.5 py-1.5 min-h-[38px] text-xs font-bold rounded-lg border border-slate-300 bg-white hover:bg-slate-100 active:scale-95 transition-all text-slate-700"
                    >
                      2da Q (16-fin)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Fecha Inicio</label>
                    <input 
                      type="date"
                      value={form.periodoInicio}
                      onChange={e => setForm({ ...form, periodoInicio: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Fecha Fin</label>
                    <input 
                      type="date"
                      value={form.periodoFin}
                      onChange={e => setForm({ ...form, periodoFin: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Días Comerciales</label>
                    <div className="px-3 py-2 text-sm rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 font-black text-center">
                      {calcDiasComerciales(form.periodoInicio, form.periodoFin)} Días
                    </div>
                  </div>
                </div>
              </div>

              {/* Selector de Empleado con Tarjetas Táctiles */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <label className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <User size={18} className="text-emerald-600" />
                    Selecciona el Colaborador ({filteredEmpleados.length})
                  </label>
                  <div className="relative w-full sm:w-64">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre o cédula..."
                      value={searchFilter}
                      onChange={e => setSearchFilter(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[40px]"
                      data-testid="search-empleado-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto p-1">
                  {filteredEmpleados.map(emp => {
                    const isSelected = emp.id === selectedEmpleadoId;
                    return (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => setSelectedEmpleadoId(emp.id)}
                        className={`min-h-[72px] p-3 rounded-xl border-2 text-left transition-all active:scale-95 touch-manipulation flex items-center justify-between gap-3 ${
                          isSelected 
                            ? 'border-emerald-600 bg-emerald-50/60 shadow-sm ring-2 ring-emerald-500/20' 
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                        data-testid={`empleado-card-${emp.id}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0 ${
                            isSelected ? 'bg-emerald-600' : 'bg-slate-700'
                          }`}>
                            {emp.nombre.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-slate-900 truncate">{emp.nombre}</div>
                            <div className="text-xs text-slate-500 truncate">{emp.cargo || 'Operario'} • {emp.tipoContrato}</div>
                            <div className="text-xs font-black text-emerald-700 mt-0.5">
                              Base: ${Math.round(emp.salarioBase).toLocaleString('es-CO')}
                            </div>
                          </div>
                        </div>

                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                          isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white text-transparent'
                        }`}>
                          <Check size={14} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================= PASO 2: NOVEDADES Y HORAS ================= */}
          {step === 2 && selectedEmpleado && (
            <div className="space-y-5 animate-fade-in" data-testid="wizard-step-2-content">
              {/* Tarjeta Resumen Empleado */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center">
                    {selectedEmpleado.nombre.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{selectedEmpleado.nombre}</h4>
                    <p className="text-xs text-slate-500">{selectedEmpleado.cargo} • Contrato: {selectedEmpleado.tipoContrato}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 font-bold uppercase">Sueldo Base Mensual</div>
                  <div className="text-sm font-black text-slate-800">${Math.round(selectedEmpleado.salarioBase).toLocaleString('es-CO')}</div>
                </div>
              </div>

              {/* Si es Regular: Horas extras y Novedades */}
              {wizardType === 'REGULAR' && (
                <div className="space-y-4">
                  {/* Horas Extras */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-slate-800 flex items-center gap-2">
                        <Clock size={16} className="text-emerald-600" />
                        Horas Extras del Período
                      </span>
                      <span className="text-xs font-black text-emerald-700">
                        +${Math.round(horasExtrasMonetario).toLocaleString('es-CO')}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Diurnas */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-xs font-bold text-slate-700">Extras Diurnas (1.25x)</label>
                          <span className="text-xs font-black text-slate-900">{form.cantidadHorasExtrasDiurnas} hrs</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, cantidadHorasExtrasDiurnas: Math.max(0, f.cantidadHorasExtrasDiurnas - 1) }))}
                            className="p-2 min-h-[40px] min-w-[40px] rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center justify-center active:scale-95"
                          >
                            <Minus size={16} />
                          </button>
                          <input 
                            type="number"
                            value={form.cantidadHorasExtrasDiurnas}
                            onChange={e => setForm({ ...form, cantidadHorasExtrasDiurnas: Math.max(0, parseInt(e.target.value) || 0) })}
                            className="flex-1 py-1.5 px-3 text-center text-sm font-black rounded-lg border border-slate-300 bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, cantidadHorasExtrasDiurnas: f.cantidadHorasExtrasDiurnas + 1 }))}
                            className="p-2 min-h-[40px] min-w-[40px] rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center active:scale-95"
                          >
                            <Plus size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, cantidadHorasExtrasDiurnas: f.cantidadHorasExtrasDiurnas + 5 }))}
                            className="px-2 py-1.5 min-h-[40px] rounded-lg bg-slate-200 text-slate-800 text-xs font-black hover:bg-slate-300 active:scale-95"
                          >
                            +5h
                          </button>
                        </div>
                      </div>

                      {/* Nocturnas */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-xs font-bold text-slate-700">Extras Nocturnas (1.75x)</label>
                          <span className="text-xs font-black text-slate-900">{form.cantidadHorasExtrasNocturnas} hrs</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, cantidadHorasExtrasNocturnas: Math.max(0, f.cantidadHorasExtrasNocturnas - 1) }))}
                            className="p-2 min-h-[40px] min-w-[40px] rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center justify-center active:scale-95"
                          >
                            <Minus size={16} />
                          </button>
                          <input 
                            type="number"
                            value={form.cantidadHorasExtrasNocturnas}
                            onChange={e => setForm({ ...form, cantidadHorasExtrasNocturnas: Math.max(0, parseInt(e.target.value) || 0) })}
                            className="flex-1 py-1.5 px-3 text-center text-sm font-black rounded-lg border border-slate-300 bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, cantidadHorasExtrasNocturnas: f.cantidadHorasExtrasNocturnas + 1 }))}
                            className="p-2 min-h-[40px] min-w-[40px] rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center active:scale-95"
                          >
                            <Plus size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, cantidadHorasExtrasNocturnas: f.cantidadHorasExtrasNocturnas + 5 }))}
                            className="px-2 py-1.5 min-h-[40px] rounded-lg bg-slate-200 text-slate-800 text-xs font-black hover:bg-slate-300 active:scale-95"
                          >
                            +5h
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bonificaciones y Deducciones */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                      <span className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                        <Plus size={14} className="text-emerald-600" /> Bonificaciones & Viáticos
                      </span>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Bonificación no salarial</label>
                        <input
                          type="number"
                          value={form.bonificaciones}
                          onChange={e => setForm({ ...form, bonificaciones: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                          placeholder="$0"
                        />
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                      <span className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                        <Minus size={14} className="text-rose-600" /> Deducciones y Préstamos
                      </span>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Abono a Préstamo</label>
                        <input
                          type="number"
                          value={form.prestamosDeduccion}
                          onChange={e => setForm({ ...form, prestamosDeduccion: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                          placeholder="$0"
                        />
                        {selectedEmpleado.prestamosActivos > 0 && (
                          <div className="text-[11px] text-amber-700 mt-1 font-medium">
                            Saldo préstamo activo: ${Math.round(selectedEmpleado.prestamosActivos).toLocaleString('es-CO')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Desglose Transparente de Deducciones Legales */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="text-xs font-bold text-slate-700 uppercase">Seguridad Social Empleado (Deducciones automáticas)</div>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Salud EPS (4%):</span>
                      <span className="font-bold text-rose-600">-${Math.round(saludDeduccion).toLocaleString('es-CO')}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Pensión (4%):</span>
                      <span className="font-bold text-rose-600">-${Math.round(pensionDeduccion).toLocaleString('es-CO')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Si es Liquidación Definitiva */}
              {wizardType === 'LIQUIDACION_FINAL' && (
                <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200 space-y-4">
                  <div className="text-xs font-black text-rose-900 uppercase">Ajuste de Días Pendientes por Concepto</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-rose-200 shadow-sm">
                      <label className="block text-[11px] font-bold text-rose-800 mb-1">Días Cesantías</label>
                      <input 
                        type="number"
                        value={form.liqDiasCesantias}
                        onChange={e => setForm({ ...form, liqDiasCesantias: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-full p-2 text-sm font-black rounded-lg border border-rose-300 text-center"
                      />
                      <div className="text-xs font-black text-slate-800 mt-2 text-center">
                        ${Math.round(liqCesantias).toLocaleString('es-CO')}
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-rose-200 shadow-sm">
                      <label className="block text-[11px] font-bold text-rose-800 mb-1">Int. Cesantías (12%)</label>
                      <input 
                        type="number"
                        disabled
                        value={form.liqDiasCesantias}
                        className="w-full p-2 text-sm font-black rounded-lg border border-slate-200 bg-slate-100 text-center text-slate-500"
                      />
                      <div className="text-xs font-black text-slate-800 mt-2 text-center">
                        ${Math.round(liqIntereses).toLocaleString('es-CO')}
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-rose-200 shadow-sm">
                      <label className="block text-[11px] font-bold text-rose-800 mb-1">Días Prima</label>
                      <input 
                        type="number"
                        value={form.liqDiasPrima}
                        onChange={e => setForm({ ...form, liqDiasPrima: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-full p-2 text-sm font-black rounded-lg border border-rose-300 text-center"
                      />
                      <div className="text-xs font-black text-slate-800 mt-2 text-center">
                        ${Math.round(liqPrima).toLocaleString('es-CO')}
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-rose-200 shadow-sm">
                      <label className="block text-[11px] font-bold text-rose-800 mb-1">Días Vacaciones</label>
                      <input 
                        type="number"
                        value={form.liqDiasVacaciones}
                        onChange={e => setForm({ ...form, liqDiasVacaciones: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-full p-2 text-sm font-black rounded-lg border border-rose-300 text-center"
                      />
                      <div className="text-xs font-black text-slate-800 mt-2 text-center">
                        ${Math.round(liqVacaciones).toLocaleString('es-CO')}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Si es Vacaciones */}
              {wizardType === 'VACACIONES' && (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-3">
                  <div className="text-xs font-black text-amber-900 uppercase">Descanso Remunerado de Vacaciones</div>
                  <p className="text-xs text-amber-800">
                    Se liquidan los días comerciales de vacaciones seleccionados ({form.diasTrabajados} días).
                    El colaborador no devenga auxilio de transporte durante este descanso.
                  </p>
                  <div className="text-sm font-black text-amber-950">
                    Monto Vacaciones: ${Math.round(salarioProporcional).toLocaleString('es-CO')}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= PASO 3: LIQUIDAR Y PAGAR ================= */}
          {step === 3 && selectedEmpleado && (
            <div className="space-y-5 animate-fade-in" data-testid="wizard-step-3-content">
              {/* Tarjeta Gigante de Neto a Pagar */}
              <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-6 text-center space-y-2 shadow-sm">
                <span className="text-xs font-black uppercase text-emerald-800 tracking-wider">
                  Neto a Pagar al Empleado
                </span>
                <div className="text-4xl sm:text-5xl font-black text-emerald-800 tracking-tight" data-testid="neto-a-pagar-display">
                  ${Math.round(netoAPagar).toLocaleString('es-CO')}
                </div>
                <div className="text-xs font-medium text-emerald-700">
                  Desembolso para <b>{selectedEmpleado.nombre}</b> ({form.diasTrabajados} días liquidados)
                </div>
              </div>

              {/* Desglose Ejecutivo de Costo Empresa */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-700 flex items-center gap-1.5">
                    <Building2 size={16} className="text-slate-600" />
                    Costo Total Empresa (NIIF)
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    ${Math.round(costoTotalEmpresa).toLocaleString('es-CO')}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-200">
                  <div>
                    <span className="block text-[11px] text-slate-400">Total Devengado:</span>
                    <span className="font-bold text-slate-800">${Math.round(totalDevengado).toLocaleString('es-CO')}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400">Seguridad Empresa:</span>
                    <span className="font-bold text-slate-800">${Math.round(aporteSaludEmpresa + aportePensionEmpresa + aporteARL).toLocaleString('es-CO')}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400">Parafiscales:</span>
                    <span className="font-bold text-slate-800">${Math.round(aporteCCF + aporteSENAICBF).toLocaleString('es-CO')}</span>
                  </div>
                </div>
              </div>

              {/* Método de Desembolso */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                  <Wallet size={16} className="text-emerald-600" />
                  Forma de Desembolso y Flujo de Caja
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMetodoPago('TRANSFERENCIA')}
                    className={`min-h-[50px] p-3 rounded-xl border-2 text-left transition-all active:scale-95 touch-manipulation flex items-center gap-2.5 ${
                      metodoPago === 'TRANSFERENCIA' 
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold' 
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <Building2 size={18} />
                    <div>
                      <div className="text-xs font-black">Transferencia</div>
                      <div className="text-[10px] text-slate-500">Banco / Bancolombia</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMetodoPago('EFECTIVO')}
                    className={`min-h-[50px] p-3 rounded-xl border-2 text-left transition-all active:scale-95 touch-manipulation flex items-center gap-2.5 ${
                      metodoPago === 'EFECTIVO' 
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold' 
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <DollarSign size={18} />
                    <div>
                      <div className="text-xs font-black">Efectivo</div>
                      <div className="text-[10px] text-slate-500">Caja / Turno Actual</div>
                    </div>
                  </button>
                </div>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={desembolsarInmediato}
                    onChange={e => setDesembolsarInmediato(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span>Desembolsar y registrar egreso en caja automáticamente ahora</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Barra Inferior de Navegación y Botón Gigante */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 sm:p-5 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2.5 min-h-[48px] rounded-xl border border-slate-300 bg-white text-slate-700 text-xs sm:text-sm font-bold hover:bg-slate-100 flex items-center gap-2 transition-all active:scale-95 touch-manipulation"
              data-testid="wizard-prev-step-btn"
            >
              <ArrowLeft size={16} />
              Atrás
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 min-h-[48px] rounded-xl border border-slate-300 bg-white text-slate-700 text-xs sm:text-sm font-bold hover:bg-slate-100 transition-all active:scale-95 touch-manipulation"
            >
              Cancelar
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              disabled={!selectedEmpleado}
              onClick={() => setStep((s) => (s + 1) as any)}
              className="px-6 py-2.5 min-h-[48px] rounded-xl bg-emerald-600 text-white text-xs sm:text-sm font-black hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all active:scale-95 shadow-md touch-manipulation"
              data-testid={step === 1 ? 'wizard-next-step-btn' : 'wizard-to-step-3-btn'}
            >
              <span>{step === 1 ? 'Continuar a Novedades' : 'Continuar a Liquidar'}</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              className={`flex-1 sm:flex-initial px-8 py-3.5 min-h-[56px] rounded-xl text-white text-sm sm:text-base font-black shadow-lg transition-all active:scale-95 touch-manipulation flex items-center justify-center gap-2.5 ${
                wizardType === 'LIQUIDACION_FINAL'
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
              }`}
              data-testid="btn-confirm-payroll-payout"
            >
              <ShieldCheck size={20} />
              <span>
                {wizardType === 'LIQUIDACION_FINAL' ? 'Aprobar Liquidación Definitiva' : 'Aprobar y Desembolsar Nómina'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default PayrollWizard3Steps;
