import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { TurnoCaja, DetalleArqueo } from '../../../types/cash.types';
import { cashService } from '../../../services/cashService';
import { posCashEngineService } from '../../../services/posCashEngineService';
import { evaluarDescuadreArqueo } from '../../../../packages/validation-schemas/src/posCashEngine.schema';
import { useCashStore } from '../../../store/useCashStore';
import { useInventoryStore } from '../../../store/useInventoryStore';
import { useAppStore } from '../../../store/useAppStore';
import {
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  Search,
  X,
  Loader2,
  Eye,
  EyeOff,
  Calculator,
  ShieldCheck,
  Printer,
  ArrowRight,
  ArrowLeft,
  Banknote,
  CreditCard,
  Check,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { CalculadorDenominaciones } from './CalculadorDenominaciones';

interface ArqueoCajaModalProps {
  turnoActivo: TurnoCaja;
  usuarioId: string;
  onClose: () => void;
  onSuccess: () => void;
  esAdmin?: boolean;
}

export default function ArqueoCajaModal({ turnoActivo, usuarioId, onClose, onSuccess, esAdmin: esAdminProp }: ArqueoCajaModalProps) {
  const { products } = useInventoryStore();
  const { isLoading } = useCashStore();

  const esAdmin = esAdminProp ?? (usuarioId === 'admin' || usuarioId.toLowerCase().includes('admin') || usuarioId.toLowerCase().includes('gerente'));
  // Por defecto, cajeros tienen arqueo ciego activado
  const [esModoArqueoCiego, setEsModoArqueoCiego] = useState<boolean>(!esAdmin);

  // Stepper Wizard en 3 Pasos (Regla del Niño de 12 Años)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const [denominaciones, setDenominaciones] = useState<DetalleArqueo>({
    billetes100k: 0,
    billetes50k: 0,
    billetes20k: 0,
    billetes10k: 0,
    billetes5k: 0,
    billetes2k: 0,
    monedas1k: 0,
    monedas500: 0,
    monedas200: 0,
    monedas100: 0,
    monedas50: 0,
  });

  const [efectivo, setEfectivo] = useState<string>('');
  const [datafono, setDatafono] = useState<string>(turnoActivo.totalDatafono.toString());
  const [transferencia, setTransferencia] = useState<string>(turnoActivo.totalTransferencias.toString());

  const [lockDatafono, setLockDatafono] = useState<boolean>(true);
  const [lockTransferencia, setLockTransferencia] = useState<boolean>(true);

  const [justificacion, setJustificacion] = useState('');
  const [reporteCierreExitoso, setReporteCierreExitoso] = useState<any | null>(null);

  // Cálculo a partir de denominaciones
  const totalCalculadorEfectivo = useMemo(() => {
    return (
      (denominaciones.billetes100k || 0) * 100000 +
      (denominaciones.billetes50k || 0) * 50000 +
      (denominaciones.billetes20k || 0) * 20000 +
      (denominaciones.billetes10k || 0) * 10000 +
      (denominaciones.billetes5k || 0) * 5000 +
      (denominaciones.billetes2k || 0) * 2000 +
      (denominaciones.monedas1k || 0) * 1000 +
      (denominaciones.monedas500 || 0) * 500 +
      (denominaciones.monedas200 || 0) * 200 +
      (denominaciones.monedas100 || 0) * 100 +
      (denominaciones.monedas50 || 0) * 50
    );
  }, [denominaciones]);

  const valEfectivo = totalCalculadorEfectivo > 0
    ? totalCalculadorEfectivo
    : (efectivo === '' ? 0 : Number(efectivo));

  const valDatafono = datafono === '' ? 0 : Number(datafono);
  const valTransferencia = transferencia === '' ? 0 : Number(transferencia);

  const totalFisicoDeclarado = valEfectivo + valDatafono + valTransferencia;
  const saldoTeoricoGlobal = turnoActivo.saldoTeoricoGlobal ?? (turnoActivo.totalEfectivo + turnoActivo.totalDatafono + turnoActivo.totalTransferencias);

  const diffEfectivo = valEfectivo - turnoActivo.totalEfectivo;
  const diffDatafono = valDatafono - turnoActivo.totalDatafono;
  const diffTransferencia = valTransferencia - turnoActivo.totalTransferencias;
  const diffTotal = totalFisicoDeclarado - saldoTeoricoGlobal;

  // Evaluación científica con umbral de tolerancia de $5.000 COP
  const evalArqueo = useMemo(() => {
    return evaluarDescuadreArqueo(saldoTeoricoGlobal, totalFisicoDeclarado, 5000);
  }, [saldoTeoricoGlobal, totalFisicoDeclarado]);

  const esCuadreValido = !evalArqueo.requiereAutorizacion;
  const requiereJustificacion = evalArqueo.requiereAutorizacion;

  const sugerencias = useMemo(() => {
    if (diffTotal === 0) return [];
    const lista = (products as any[]) ?? [];
    const absDiff = Math.abs(diffTotal);
    const minDiff = absDiff * 0.95;
    const maxDiff = absDiff * 1.05;
    return lista.filter((p: any) => {
      const precio = p.precio_venta_pos || p.precio_venta || p.precioLista || 0;
      return precio >= minDiff && precio <= maxDiff;
    }).slice(0, 5);
  }, [diffTotal, products]);

  const handleDenominacionChange = (key: keyof DetalleArqueo, valor: number) => {
    setDenominaciones(prev => {
      const updated = { ...prev, [key]: valor };
      const subtotal =
        (updated.billetes100k || 0) * 100000 +
        (updated.billetes50k || 0) * 50000 +
        (updated.billetes20k || 0) * 20000 +
        (updated.billetes10k || 0) * 10000 +
        (updated.billetes5k || 0) * 5000 +
        (updated.billetes2k || 0) * 2000 +
        (updated.monedas1k || 0) * 1000 +
        (updated.monedas500 || 0) * 500 +
        (updated.monedas200 || 0) * 200 +
        (updated.monedas100 || 0) * 100 +
        (updated.monedas50 || 0) * 50;
      setEfectivo(subtotal.toString());
      return updated;
    });
  };

  const handleToggleModoCiego = () => {
    const currentRole = useAppStore.getState().userRole;
    const tienePermisosAdmin = esAdmin || currentRole === 'admin';

    if (esModoArqueoCiego) {
      if (!tienePermisosAdmin) {
        Swal.fire({
          icon: 'error',
          title: 'Acceso Restringido',
          text: 'La desactivación del arqueo ciego requiere perfil de Supervisor o Administrador.',
          target: 'body',
          customClass: { container: 'z-50 isolate' },
        });
        return;
      }
      setEsModoArqueoCiego(false);
    } else {
      setEsModoArqueoCiego(true);
    }
  };

  const handleUnlock = async (tipo: 'DATAFONO' | 'TRANSFERENCIA') => {
    const currentRole = useAppStore.getState().userRole;
    const tienePermisosAdmin = esAdmin || currentRole === 'admin';

    if (!tienePermisosAdmin) {
      const { value: pass } = await Swal.fire({
        title: 'Autorización Requerida',
        text: `Ingrese PIN o Contraseña de Supervisor para editar el valor de ${tipo}:`,
        input: 'password',
        inputPlaceholder: 'PIN Supervisor',
        showCancelButton: true,
        confirmButtonText: 'Validar',
        confirmButtonColor: '#0284c7',
        target: 'body',
        customClass: { container: 'z-50 isolate' },
      });

      if (pass !== '1234' && pass !== 'admin' && pass !== 'supervisor') {
        Swal.fire({
          icon: 'error',
          title: 'PIN Inválido',
          text: 'No tiene autorización para modificar los cierres electrónicos del datáfono.',
          target: 'body',
          customClass: { container: 'z-50 isolate' },
        });
        return;
      }
    }

    if (tipo === 'DATAFONO') setLockDatafono(false);
    if (tipo === 'TRANSFERENCIA') setLockTransferencia(false);
  };

  const handleCierre = async () => {
    if (!esModoArqueoCiego && requiereJustificacion && justificacion.trim() === '') {
      Swal.fire({
        icon: 'error',
        title: 'Justificación Obligatoria',
        text: 'Debe justificar el descuadre fuera de la tolerancia para proceder con el cierre.',
        target: 'body',
        customClass: { container: 'z-50 isolate' },
      });
      return;
    }

    const { isConfirmed } = await Swal.fire({
      title: '¿Confirmar cierre de caja?',
      text: esModoArqueoCiego
        ? `Se registrará el cierre con un total físico declarado de $${totalFisicoDeclarado.toLocaleString('es-CO')}.`
        : `Diferencia global: ${diffTotal >= 0 ? '+' : ''}$${diffTotal.toLocaleString('es-CO')}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar turno',
      cancelButtonText: 'Revisar',
      confirmButtonColor: '#10b981',
      target: 'body',
      customClass: { container: 'z-50 isolate' },
    });

    if (!isConfirmed) return;

    try {
      const resultado = cashService.cerrarTurno(
        turnoActivo.id,
        {
          efectivo: valEfectivo,
          datafono: valDatafono,
          transferencia: valTransferencia,
          detalleEfectivo: denominaciones,
        },
        justificacion,
        usuarioId
      );

      if (!resultado.error && resultado.data) {
        setReporteCierreExitoso(resultado.data);
        Swal.fire({
          icon: 'success',
          title: '¡Turno Cerrado Correctamente!',
          text: 'El arqueo fue guardado y el reporte de caja está listo para imprimir.',
          timer: 2000,
          showConfirmButton: false,
          target: 'body',
          customClass: { container: 'z-50 isolate' },
        });
        onSuccess();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error al cerrar',
          text: resultado.error || 'Ocurrió un error al procesar el cierre.',
          target: 'body',
          customClass: { container: 'z-50 isolate' },
        });
      }
    } catch (err: any) {
      console.error('Error general en arqueo:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error de servidor',
        text: err?.message || 'No fue posible completar el cierre de caja.',
      });
    }
  };

  const handleNumberInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex justify-center items-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white border-2 border-slate-200 rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden max-h-[94vh] text-slate-900 animate-fade-in">
        
        {/* HEADER */}
        <div className="flex justify-between items-center px-6 py-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black text-slate-900 m-0 tracking-tight flex items-center gap-2">
                <Calculator className="text-indigo-600" size={24} />
                Arqueo y Cierre de Caja
              </h2>
              {esModoArqueoCiego ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
                  <EyeOff size={13} /> Arqueo Ciego Activo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <Eye size={13} /> Supervisión
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 m-0">
              Turno #{turnoActivo.id.substring(0, 8).toUpperCase()} &nbsp;|&nbsp; Cajero: <strong>{usuarioId}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleModoCiego}
              className="min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors flex items-center gap-1.5 shadow-sm"
              title={esModoArqueoCiego ? 'Cambiar a modo supervisión' : 'Ocultar saldos teóricos'}
            >
              {esModoArqueoCiego ? <Eye size={14} /> : <EyeOff size={14} />}
              {esModoArqueoCiego ? 'Modo Supervisor' : 'Ocultar Teórico'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-900 p-2 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* STEPPER WIZARD TÁCTIL EN 3 PASOS (Regla del Niño de 12 Años) */}
        <div className="px-6 py-3 bg-slate-100/70 border-b border-slate-200 flex items-center gap-2 md:gap-4 shrink-0">
          {[
            { step: 1 as const, label: '1. Billetes y Monedas', icon: Banknote },
            { step: 2 as const, label: '2. Datáfono y QR', icon: CreditCard },
            { step: 3 as const, label: '3. Cuadre y Cierre', icon: CheckCircle },
          ].map((s) => {
            const Icon = s.icon;
            const isActive = currentStep === s.step;
            const isCompleted = currentStep > s.step;
            return (
              <button
                key={s.step}
                type="button"
                data-testid={`step-btn-${s.step}`}
                onClick={() => setCurrentStep(s.step)}
                className={`flex-1 min-h-[48px] h-12 px-3 py-2 rounded-xl text-xs md:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-200'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {isCompleted ? <Check size={16} className="text-emerald-600" /> : <Icon size={16} />}
                <span className="truncate">{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* BODY POR PASOS */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">

          {/* PASO 1: CONTEO FÍSICO DE BILLETES Y MONEDAS */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-4 animate-fade-in">
              <div className="flex justify-between items-center p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <Banknote size={20} className="text-emerald-600" />
                  <span className="text-sm font-bold text-slate-800">
                    Paso 1: Conteo Físico de Billetes y Monedas en Gaveta
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">Total Efectivo Contado</span>
                  <span className="text-2xl font-black text-emerald-700 font-mono tabular-nums">
                    ${valEfectivo.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>

              <CalculadorDenominaciones
                valores={denominaciones}
                onChange={handleDenominacionChange}
              />

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  data-testid="btn-siguiente-step"
                  onClick={() => setCurrentStep(2)}
                  className="min-h-[48px] h-12 px-6 rounded-xl font-black text-sm bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <span>Siguiente: Datáfono y Bancos</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* PASO 2: CIERRE ELECTRÓNICO (DATÁFONO Y TRANSFERENCIAS) */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-5 animate-fade-in">
              <div className="flex justify-between items-center p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <CreditCard size={20} className="text-indigo-600" />
                  <span className="text-sm font-bold text-slate-800">
                    Paso 2: Declaración de Vouchers Electrónicos y QR
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">Total Electrónico</span>
                  <span className="text-2xl font-black text-indigo-700 font-mono tabular-nums">
                    ${(valDatafono + valTransferencia).toLocaleString('es-CO')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Datáfono */}
                <div className="p-4 rounded-2xl border-2 border-slate-200 bg-white flex flex-col gap-3 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                      <CreditCard size={18} className="text-blue-600" />
                      Datáfono (Vouchers Físicos)
                    </span>
                    <button
                      type="button"
                      onClick={() => lockDatafono && handleUnlock('DATAFONO')}
                      className="text-xs font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                    >
                      {lockDatafono ? <Lock size={14} /> : <Unlock size={14} className="text-rose-600" />}
                      {lockDatafono ? 'Bloqueado' : 'Desbloqueado'}
                    </button>
                  </div>
                  <input
                    data-testid="input-datafono-arqueo"
                    type="number"
                    disabled={lockDatafono}
                    value={datafono}
                    onKeyDown={handleNumberInput}
                    onChange={(e) => setDatafono(e.target.value)}
                    className="w-full min-h-[48px] h-12 border-2 border-slate-300 focus:border-indigo-600 rounded-xl px-3 text-xl font-black text-slate-900 font-mono tabular-nums outline-none disabled:bg-slate-50 disabled:text-slate-600"
                  />
                  {!esModoArqueoCiego && (
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                      <span>Esperado en sistema: <b>${turnoActivo.totalDatafono.toLocaleString('es-CO')}</b></span>
                      <button
                        type="button"
                        data-testid="btn-copiar-datafono"
                        onClick={() => setDatafono(turnoActivo.totalDatafono.toString())}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                        title="Copiar saldo esperado del sistema"
                      >
                        Copiar
                      </button>
                    </div>
                  )}
                </div>

                {/* Transferencias */}
                <div className="p-4 rounded-2xl border-2 border-slate-200 bg-white flex flex-col gap-3 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                      <CheckCircle size={18} className="text-purple-600" />
                      Transferencias / QR Bancolombia / Nequi
                    </span>
                    <button
                      type="button"
                      onClick={() => lockTransferencia && handleUnlock('TRANSFERENCIA')}
                      className="text-xs font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                    >
                      {lockTransferencia ? <Lock size={14} /> : <Unlock size={14} className="text-rose-600" />}
                      {lockTransferencia ? 'Bloqueado' : 'Desbloqueado'}
                    </button>
                  </div>
                  <input
                    data-testid="input-transferencia-arqueo"
                    type="number"
                    disabled={lockTransferencia}
                    value={transferencia}
                    onKeyDown={handleNumberInput}
                    onChange={(e) => setTransferencia(e.target.value)}
                    className="w-full min-h-[48px] h-12 border-2 border-slate-300 focus:border-indigo-600 rounded-xl px-3 text-xl font-black text-slate-900 font-mono tabular-nums outline-none disabled:bg-slate-50 disabled:text-slate-600"
                  />
                  {!esModoArqueoCiego && (
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                      <span>Esperado en sistema: <b>${turnoActivo.totalTransferencias.toLocaleString('es-CO')}</b></span>
                      <button
                        type="button"
                        data-testid="btn-copiar-transferencia"
                        onClick={() => setTransferencia(turnoActivo.totalTransferencias.toString())}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors cursor-pointer"
                        title="Copiar saldo esperado del sistema"
                      >
                        Copiar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-3">
                <button
                  type="button"
                  data-testid="btn-anterior-step"
                  onClick={() => setCurrentStep(1)}
                  className="min-h-[48px] h-12 px-5 rounded-xl font-bold text-sm bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <ArrowLeft size={18} />
                  <span>Volver a Billetes</span>
                </button>
                <button
                  type="button"
                  data-testid="btn-siguiente-step"
                  onClick={() => setCurrentStep(3)}
                  className="min-h-[48px] h-12 px-6 rounded-xl font-black text-sm bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <span>Siguiente: Cuadre y Cierre</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* PASO 3: CUADRE FINAL, TOLERANCIA Y CIERRE */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-5 animate-fade-in">
              <div className="p-4 rounded-2xl border-2 border-slate-200 bg-slate-50 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-black text-slate-900 m-0">Paso 3: Resumen Consolidado de Cierre</h3>
                  <p className="text-xs text-slate-500 mt-0.5 m-0">Verifique el balance global antes de sellar el turno.</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-500 block uppercase">Total Físico Declarado</span>
                  <strong className="text-2xl font-black text-indigo-700 font-mono">
                    ${totalFisicoDeclarado.toLocaleString('es-CO')}
                  </strong>
                </div>
              </div>

              {/* Semáforo de Tolerancia y Descuadre */}
              <div
                className={`p-4 rounded-2xl border-2 flex items-center justify-between ${
                  esCuadreValido
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  {esCuadreValido ? (
                    <ShieldCheck size={28} className="text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle size={28} className="text-rose-600 shrink-0" />
                  )}
                  <div>
                    <span className="text-sm font-black uppercase tracking-wide block">
                      {esCuadreValido
                        ? '✓ Cuadre Válido (Dentro de Tolerancia de $5.000 COP)'
                        : '⚠ Descuadre Detectado Fuera de Tolerancia'}
                    </span>
                    <p className="text-xs font-medium opacity-80 mt-0.5 m-0">
                      {esCuadreValido
                        ? 'El cierre se encuentra cuadrado o con diferencia mínima de redondeo.'
                        : 'El valor físico declarado difiere del saldo esperado. Se requiere justificación de auditoría.'}
                    </p>
                  </div>
                </div>
                {!esModoArqueoCiego && (
                  <span className="font-mono text-xl font-black tabular-nums">
                    {diffTotal >= 0 ? '+' : ''}${diffTotal.toLocaleString('es-CO')}
                  </span>
                )}
              </div>

              {/* Campo de Justificación si descuadrado */}
              {(!esModoArqueoCiego && requiereJustificacion) && (
                <div className="flex flex-col gap-2 p-4 rounded-2xl bg-rose-50/50 border border-rose-200">
                  <label className="text-xs font-black uppercase text-rose-800 flex items-center gap-1.5">
                    <AlertTriangle size={15} /> Justificación Obligatoria de Auditoría
                  </label>
                  <textarea
                    data-testid="input-justificacion-arqueo"
                    value={justificacion}
                    onChange={(e) => setJustificacion(e.target.value)}
                    placeholder="Explique el motivo del descuadre detectado (egreso sin recibo, voucher omitido, etc.)..."
                    className="w-full min-h-[80px] p-3 text-sm font-medium rounded-xl border-2 border-rose-300 focus:border-rose-500 bg-white outline-none resize-none"
                  />
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  data-testid="btn-anterior-step"
                  onClick={() => setCurrentStep(2)}
                  className="min-h-[48px] h-12 px-5 rounded-xl font-bold text-sm bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <ArrowLeft size={18} />
                  <span>Volver a Datáfono</span>
                </button>

                <button
                  type="button"
                  data-testid="btn-confirmar-arqueo"
                  onClick={handleCierre}
                  disabled={isLoading}
                  className="min-h-[56px] h-14 px-8 rounded-2xl font-black text-base bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2.5 shadow-lg active:scale-98 transition-all cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" /> Procesando...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      <span>Confirmar y Cerrar Turno</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
}
