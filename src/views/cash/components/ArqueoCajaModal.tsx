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
} from 'lucide-react';
import Swal from 'sweetalert2';
import { CalculadorDenominaciones } from './CalculadorDenominaciones';

interface ArqueoCajaModalProps {
  turnoActivo: TurnoCaja;
  usuarioId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ArqueoCajaModal({ turnoActivo, usuarioId, onClose, onSuccess }: ArqueoCajaModalProps) {
  const { products } = useInventoryStore();
  const { isLoading } = useCashStore();

  const esAdmin = usuarioId === 'admin' || usuarioId.toLowerCase().includes('admin') || usuarioId.toLowerCase().includes('gerente');
  // Por defecto, cajeros tienen arqueo ciego activado
  const [esModoArqueoCiego, setEsModoArqueoCiego] = useState<boolean>(!esAdmin);
  const [mostrarCalculadorBilletes, setMostrarCalculadorBilletes] = useState<boolean>(false);

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

  // Cálculo a partir de denominaciones si se usa el calculador
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

  const valEfectivo = mostrarCalculadorBilletes
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
      Swal.fire({
        icon: 'success',
        title: 'Modo Asistido Activado',
        text: 'Autorizado por rol activo de Supervisor/Administrador.',
        timer: 1500,
        showConfirmButton: false,
        target: 'body',
        customClass: { container: 'z-50 isolate' },
      });
    } else {
      setEsModoArqueoCiego(true);
    }
  };

  const handleUnlock = (tipo: 'DATAFONO' | 'TRANSFERENCIA') => {
    Swal.fire({
      title: '¿Forzar edición?',
      text: `El sistema registró $${(tipo === 'DATAFONO' ? turnoActivo.totalDatafono : turnoActivo.totalTransferencias).toLocaleString('es-CO')} exactos. Solo debe forzar la edición si detecta una inconsistencia en vouchers.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, desbloquear',
      cancelButtonText: 'Cancelar',
      target: 'body',
      customClass: { container: 'z-50 isolate' },
    }).then((result) => {
      if (result.isConfirmed) {
        if (tipo === 'DATAFONO') setLockDatafono(false);
        else setLockTransferencia(false);
      }
    });
  };

  const handleCierre = async () => {
    if (!mostrarCalculadorBilletes && efectivo === '') {
      Swal.fire({
        icon: 'error',
        title: 'Efectivo requerido',
        text: 'Debe ingresar el efectivo físico contado (puede ser 0).',
        target: 'body',
        customClass: { container: 'z-50 isolate' },
      });
      return;
    }

    if (requiereJustificacion && justificacion.trim() === '') {
      Swal.fire({
        icon: 'error',
        title: 'Justificación Obligatoria',
        text: `Existe un descuadre fuera de la tolerancia ($${Math.abs(diffTotal).toLocaleString('es-CO')}). Debe detallar el motivo antes de cerrar.`,
        target: 'body',
        customClass: { container: 'z-50 isolate' },
      });
      return;
    }

    const confirmar = await Swal.fire({
      title: '¿Confirmar Arqueo y Cierre?',
      html: `
        <div style="text-align: left; margin-top: 1rem; font-size: 0.875rem;">
          <p><strong>Recaudado Total Físico:</strong> $${totalFisicoDeclarado.toLocaleString('es-CO')}</p>
          ${
            !esModoArqueoCiego
              ? `<p><strong>Diferencia:</strong> <span style="color: ${
                  evalArqueo.tipo === 'EXACTO'
                    ? '#16a34a'
                    : evalArqueo.tipo === 'TOLERANCIA_REDONDEO'
                    ? '#d97706'
                    : '#dc2626'
                }; font-weight: bold;">$${diffTotal.toLocaleString('es-CO')} (${evalArqueo.tipo})</span></p>`
              : '<p class="text-amber-500 font-bold">Modo Ciego: El cuadre final se consolidará en el servidor.</p>'
          }
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar turno',
      cancelButtonText: 'Revisar nuevamente',
      confirmButtonColor: '#ef4444',
      target: 'body',
      customClass: { container: 'z-50 isolate' },
    });

    if (!confirmar.isConfirmed) return;

    try {
      // 1. Llamar a posCashEngineService si el turno tiene UUID compatible
      try {
        const denominacionesArray = [
          { valor: 100000, etiqueta: '$100.000', tipo: 'BILLETE' as const, cantidad: denominaciones.billetes100k || 0 },
          { valor: 50000, etiqueta: '$50.000', tipo: 'BILLETE' as const, cantidad: denominaciones.billetes50k || 0 },
          { valor: 20000, etiqueta: '$20.000', tipo: 'BILLETE' as const, cantidad: denominaciones.billetes20k || 0 },
          { valor: 10000, etiqueta: '$10.000', tipo: 'BILLETE' as const, cantidad: denominaciones.billetes10k || 0 },
          { valor: 5000, etiqueta: '$5.000', tipo: 'BILLETE' as const, cantidad: denominaciones.billetes5k || 0 },
          { valor: 2000, etiqueta: '$2.000', tipo: 'BILLETE' as const, cantidad: denominaciones.billetes2k || 0 },
          { valor: 1000, etiqueta: '$1.000', tipo: 'MONEDA' as const, cantidad: denominaciones.monedas1k || 0 },
          { valor: 500, etiqueta: '$500', tipo: 'MONEDA' as const, cantidad: denominaciones.monedas500 || 0 },
          { valor: 200, etiqueta: '$200', tipo: 'MONEDA' as const, cantidad: denominaciones.monedas200 || 0 },
          { valor: 100, etiqueta: '$100', tipo: 'MONEDA' as const, cantidad: denominaciones.monedas100 || 0 },
          { valor: 50, etiqueta: '$50', tipo: 'MONEDA' as const, cantidad: denominaciones.monedas50 || 0 },
        ];

        await posCashEngineService.cerrarTurno({
          turno_id: turnoActivo.id,
          denominaciones: denominacionesArray,
          justificacion: justificacion.trim() || undefined,
          supervisor_nombre: esAdmin ? usuarioId : undefined,
        });
      } catch (e) {
        console.warn('posCashEngineService RPC bypass o error:', e);
      }

      // 2. Cerrar en cashService (para compatibilidad de stores de zustand y tests locales)
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

      if (!resultado.error) {
        setReporteCierreExitoso({
          turnoId: turnoActivo.id,
          fecha: new Date().toLocaleString('es-CO'),
          cajeroId: usuarioId,
          totalEfectivo: valEfectivo,
          totalDatafono: valDatafono,
          totalTransferencia: valTransferencia,
          totalDeclarado: totalFisicoDeclarado,
          saldoTeorico: saldoTeoricoGlobal,
          diferencia: diffTotal,
          evalArqueo,
        });

        Swal.fire({
          icon: 'success',
          title: '¡Caja Cerrada Exitosamente!',
          text: 'El turno se ha cerrado y el reporte de arqueo ha sido registrado.',
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
          text: resultado.error,
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
      <div className="bg-slate-900 border border-white/10 rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden max-h-[92vh] text-slate-100 animate-fade-in">
        {/* HEADER */}
        <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-blue-900/60 via-slate-900 to-slate-900 border-b border-white/10 shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black text-white m-0 tracking-tight">
                Arqueo y Cierre de Caja
              </h2>
              {esModoArqueoCiego ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <EyeOff size={12} /> Arqueo Ciego
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Eye size={12} /> Asistido (Supervisor)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 m-0">
              Turno #{turnoActivo.id.substring(0, 8).toUpperCase()} &nbsp;|&nbsp; Cajero: <strong>{usuarioId}</strong>
              {!esModoArqueoCiego && (
                <>
                  &nbsp;|&nbsp; Teórico Esperado:{' '}
                  <strong className="text-emerald-400">${saldoTeoricoGlobal.toLocaleString('es-CO')}</strong>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleModoCiego}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 transition-colors flex items-center gap-1.5"
              title={esModoArqueoCiego ? 'Cambiar a modo supervisión' : 'Ocultar saldos teóricos'}
            >
              {esModoArqueoCiego ? <Eye size={14} /> : <EyeOff size={14} />}
              {esModoArqueoCiego ? 'Modo Supervisor' : 'Ocultar Teórico'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {/* Selector de Modo de Conteo de Efectivo */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-white/10">
            <div className="flex items-center gap-2">
              <Calculator size={18} className="text-blue-400" />
              <span className="text-sm font-bold text-white">Desglose de Billetes y Monedas</span>
              <span className="text-xs text-slate-400 hidden md:inline">
                (Cuente individualmente las denominaciones colombianas)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMostrarCalculadorBilletes(!mostrarCalculadorBilletes)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                mostrarCalculadorBilletes
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {mostrarCalculadorBilletes ? 'Ocultar Desglose' : 'Usar Calculador Físico'}
            </button>
          </div>

          {/* Calculador de Denominaciones si está activo */}
          {mostrarCalculadorBilletes && (
            <div className="animate-fade-in">
              <CalculadorDenominaciones
                valores={denominaciones}
                onChange={handleDenominacionChange}
              />
            </div>
          )}

          {/* TABLA PRINCIPAL DE ARQUEO */}
          <div className="border border-white/10 rounded-2xl overflow-hidden shadow-xl bg-slate-950/40">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/60 border-b border-white/10">
                  <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/4">
                    Medio de Recaudo
                  </th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/4">
                    Esperado en Sistema
                  </th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/4">
                    Conteo Físico Real
                  </th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/4 text-right">
                    Diferencia
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {/* Efectivo */}
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    Efectivo en Gaveta
                  </td>
                  <td className="px-5 py-3.5 text-slate-300 font-mono font-medium">
                    {esModoArqueoCiego ? (
                      <span className="text-slate-500 italic text-xs">*** Oculto (Modo Ciego) ***</span>
                    ) : (
                      `$${turnoActivo.totalEfectivo.toLocaleString('es-CO')}`
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <input
                      data-testid="input-efectivo-arqueo"
                      type="number"
                      value={mostrarCalculadorBilletes ? totalCalculadorEfectivo : efectivo}
                      readOnly={mostrarCalculadorBilletes}
                      onKeyDown={handleNumberInput}
                      onChange={(e) => setEfectivo(e.target.value)}
                      placeholder="Ingrese valor total..."
                      autoFocus={!mostrarCalculadorBilletes}
                      className={`w-full border-2 rounded-xl px-3 py-2 text-lg font-black text-white bg-slate-900 outline-none transition-all font-mono ${
                        mostrarCalculadorBilletes
                          ? 'border-blue-500/50 bg-blue-950/20'
                          : 'border-white/10 focus:border-blue-500'
                      }`}
                    />
                  </td>
                  <td className="px-5 py-3.5 font-bold text-right font-mono">
                    {esModoArqueoCiego ? (
                      <span className="text-slate-500 italic text-xs">***</span>
                    ) : (
                      <span className={diffEfectivo === 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {diffEfectivo > 0 ? '+' : ''}${diffEfectivo.toLocaleString('es-CO')}
                      </span>
                    )}
                  </td>
                </tr>

                {/* Datáfono */}
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                    Datáfono (Vouchers)
                  </td>
                  <td className="px-5 py-3.5 text-slate-300 font-mono font-medium">
                    {esModoArqueoCiego ? (
                      <span className="text-slate-500 italic text-xs">*** Oculto (Modo Ciego) ***</span>
                    ) : (
                      `$${turnoActivo.totalDatafono.toLocaleString('es-CO')}`
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="relative">
                      <input
                        data-testid="input-datafono-arqueo"
                        type="number"
                        disabled={lockDatafono}
                        value={datafono}
                        onKeyDown={handleNumberInput}
                        onChange={(e) => setDatafono(e.target.value)}
                        className="w-full border-2 border-white/10 focus:border-blue-500 disabled:bg-slate-950 disabled:border-white/5 disabled:text-slate-400 rounded-xl px-3 py-2 pr-10 text-lg font-black text-white bg-slate-900 outline-none transition-colors font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => lockDatafono && handleUnlock('DATAFONO')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-400 transition-colors"
                        title={lockDatafono ? 'Forzar Edición' : 'Desbloqueado'}
                      >
                        {lockDatafono ? <Lock size={16} /> : <Unlock size={16} className="text-rose-400" />}
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-bold text-right font-mono">
                    {esModoArqueoCiego ? (
                      <span className="text-slate-500 italic text-xs">***</span>
                    ) : (
                      <span className={diffDatafono === 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {diffDatafono > 0 ? '+' : ''}${diffDatafono.toLocaleString('es-CO')}
                      </span>
                    )}
                  </td>
                </tr>

                {/* Transferencia */}
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                    Transferencias (Nequi / Bancolombia)
                  </td>
                  <td className="px-5 py-3.5 text-slate-300 font-mono font-medium">
                    {esModoArqueoCiego ? (
                      <span className="text-slate-500 italic text-xs">*** Oculto (Modo Ciego) ***</span>
                    ) : (
                      `$${turnoActivo.totalTransferencias.toLocaleString('es-CO')}`
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="relative">
                      <input
                        data-testid="input-transferencia-arqueo"
                        type="number"
                        disabled={lockTransferencia}
                        value={transferencia}
                        onKeyDown={handleNumberInput}
                        onChange={(e) => setTransferencia(e.target.value)}
                        className="w-full border-2 border-white/10 focus:border-blue-500 disabled:bg-slate-950 disabled:border-white/5 disabled:text-slate-400 rounded-xl px-3 py-2 pr-10 text-lg font-black text-white bg-slate-900 outline-none transition-colors font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => lockTransferencia && handleUnlock('TRANSFERENCIA')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-400 transition-colors"
                        title={lockTransferencia ? 'Forzar Edición' : 'Desbloqueado'}
                      >
                        {lockTransferencia ? <Lock size={16} /> : <Unlock size={16} className="text-rose-400" />}
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-bold text-right font-mono">
                    {esModoArqueoCiego ? (
                      <span className="text-slate-500 italic text-xs">***</span>
                    ) : (
                      <span className={diffTransferencia === 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {diffTransferencia > 0 ? '+' : ''}${diffTransferencia.toLocaleString('es-CO')}
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>

              {/* TFOOT */}
              <tfoot className="bg-slate-800/80 border-t-2 border-white/10">
                <tr>
                  <td className="px-5 py-3.5 text-xs font-black text-slate-300 uppercase tracking-wider">
                    Totales Consolidados
                  </td>
                  <td className="px-5 py-3.5 font-black text-slate-200 font-mono">
                    {esModoArqueoCiego ? '***' : `$${saldoTeoricoGlobal.toLocaleString('es-CO')}`}
                  </td>
                  <td className="px-5 py-3.5 font-black text-blue-400 font-mono text-xl">
                    ${totalFisicoDeclarado.toLocaleString('es-CO')}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono">
                    {esModoArqueoCiego ? (
                      <span className="text-amber-400 text-xs font-bold px-2 py-1 rounded bg-amber-500/10">
                        Ciego Activo
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
                          evalArqueo.tipo === 'EXACTO'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : evalArqueo.tipo === 'TOLERANCIA_REDONDEO'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {diffTotal === 0 ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                        {diffTotal > 0 ? '+' : ''}${diffTotal.toLocaleString('es-CO')}
                      </span>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Panel de Tolerancia / Descuadre */}
          {!esModoArqueoCiego && evalArqueo.tipo === 'TOLERANCIA_REDONDEO' && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-amber-300 text-sm">
              <ShieldCheck size={20} className="shrink-0 text-amber-400" />
              <div>
                <strong>Diferencia dentro de Tolerancia de Redondeo (±$5.000 COP):</strong>
                <p className="text-xs text-amber-300/80 mt-0.5">
                  La diferencia de ${Math.abs(diffTotal).toLocaleString('es-CO')} no bloquea el cierre ni exige acta de supervisor.
                </p>
              </div>
            </div>
          )}

          {/* Justificación obligatoria y auditoría inteligente */}
          {(!esModoArqueoCiego && requiereJustificacion) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">
              {/* Formulario de Justificación */}
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-rose-300">
                  <AlertTriangle size={18} className="text-rose-400" />
                  Justificación Obligatoria de Descuadre
                </label>
                <p className="text-xs text-rose-200/80">
                  Se detectó un <b>{diffTotal > 0 ? 'sobrante' : 'faltante'}</b> fuera del margen permitido de{' '}
                  <b>${Math.abs(diffTotal).toLocaleString('es-CO')}</b>. Esta justificación quedará registrada en auditoría.
                </p>
                <textarea
                  data-testid="input-justificacion-arqueo"
                  value={justificacion}
                  onChange={(e) => setJustificacion(e.target.value)}
                  placeholder="Detalle el motivo: egreso no registrado, voucher cruzado, billete falso..."
                  className="w-full h-24 border border-rose-500/30 focus:border-rose-400 rounded-xl p-3 text-sm text-white bg-slate-950/80 outline-none resize-none transition-colors"
                />
              </div>

              {/* Auditoría Inteligente de Productos */}
              <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-5 space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-amber-400">
                  <Search size={18} /> Auditoría Inteligente de Productos (±5%)
                </label>
                <p className="text-xs text-slate-400">
                  Ítems cuyo precio unitario coincide con el descuadre. ¿Ocurrió alguna venta omitida?
                </p>
                {sugerencias.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {sugerencias.map((prod: any) => (
                      <div
                        key={prod.id}
                        className="flex items-center gap-2 bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 shadow-sm text-xs"
                      >
                        <span className="font-bold text-white">{prod.nombre}</span>
                        <span className="bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full font-mono">
                          ${(prod.precio_venta_pos || prod.precio_venta || prod.precioLista || 0).toLocaleString('es-CO')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-white/10 rounded-xl p-4 text-center">
                    <p className="text-xs text-slate-500 italic">
                      Sin productos coincidentes con ${Math.abs(diffTotal).toLocaleString('es-CO')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-white/10 bg-slate-950/60 flex justify-between items-center shrink-0">
          <div className="text-xs text-slate-400">
            {esModoArqueoCiego ? (
              <span className="text-amber-400 font-medium">Modo Ciego: El cajero declara únicamente lo contado.</span>
            ) : (
              <span>Modo Supervisión: Cuadre auditado en tiempo real.</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-5 flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-white/10 transition-colors"
            >
              Cancelar
            </button>
            <button
              data-testid="btn-confirmar-arqueo"
              type="button"
              onClick={handleCierre}
              disabled={isLoading}
              className="h-11 px-6 flex items-center gap-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 disabled:opacity-50 text-white font-black rounded-xl shadow-lg shadow-rose-900/40 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Procesando...
                </>
              ) : (
                'Confirmar y Cerrar Turno'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
