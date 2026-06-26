import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { TurnoCaja } from '../../../types/cash.types';
import { cashService } from '../../../services/cashService';
import { useInventoryStore } from '../../../store/useInventoryStore';
import { Lock, Unlock, AlertTriangle, CheckCircle, Search, X } from 'lucide-react';
import Swal from 'sweetalert2';

interface ArqueoCajaModalProps {
  turnoActivo: TurnoCaja;
  usuarioId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ArqueoCajaModal({ turnoActivo, usuarioId, onClose, onSuccess }: ArqueoCajaModalProps) {
  const { productos } = useInventoryStore();

  const [efectivo, setEfectivo] = useState<string>('');
  const [datafono, setDatafono] = useState<string>(turnoActivo.totalDatafono.toString());
  const [transferencia, setTransferencia] = useState<string>(turnoActivo.totalTransferencias.toString());

  const [lockDatafono, setLockDatafono] = useState<boolean>(true);
  const [lockTransferencia, setLockTransferencia] = useState<boolean>(true);

  const [justificacion, setJustificacion] = useState('');

  const valEfectivo = efectivo === '' ? 0 : Number(efectivo);
  const valDatafono = datafono === '' ? 0 : Number(datafono);
  const valTransferencia = transferencia === '' ? 0 : Number(transferencia);

  const diffEfectivo = valEfectivo - turnoActivo.totalEfectivo;
  const diffDatafono = valDatafono - turnoActivo.totalDatafono;
  const diffTransferencia = valTransferencia - turnoActivo.totalTransferencias;
  const diffTotal = diffEfectivo + diffDatafono + diffTransferencia;

  const requiereJustificacion = diffTotal !== 0;

  const sugerencias = useMemo(() => {
    if (diffTotal === 0) return [];
    const lista = productos ?? [];
    const absDiff = Math.abs(diffTotal);
    const minDiff = absDiff * 0.95;
    const maxDiff = absDiff * 1.05;
    return lista.filter(p => {
      const precio = p.precio_venta_pos || p.precio_venta;
      return precio >= minDiff && precio <= maxDiff;
    }).slice(0, 5);

  }, [diffTotal, productos]);

  const handleUnlock = (tipo: 'DATAFONO' | 'TRANSFERENCIA') => {
    Swal.fire({
      title: '¿Forzar edición?',
      text: `El sistema registró $${(tipo === 'DATAFONO' ? turnoActivo.totalDatafono : turnoActivo.totalTransferencias).toLocaleString()} exactos. Solo debe forzar la edición si detecta una factura cruzada.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, desbloquear',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        if (tipo === 'DATAFONO') setLockDatafono(false);
        else setLockTransferencia(false);
      }
    });
  };

  const handleCierre = () => {
    if (efectivo === '') {
      Swal.fire('Error', 'Debe ingresar el efectivo físico contado (puede ser 0).', 'error');
      return;
    }
    if (requiereJustificacion && justificacion.trim() === '') {
      Swal.fire('Error', 'Debe justificar detalladamente la diferencia detectada en el cuadre de caja.', 'error');
      return;
    }

    Swal.fire({
      title: '¿Confirmar Arqueo y Cierre?',
      html: `
        <div style="text-align: left; margin-top: 1rem; font-size: 0.875rem;">
          <p><strong>Recaudado Total:</strong> $${(valEfectivo + valDatafono + valTransferencia).toLocaleString()}</p>
          <p><strong>Diferencia Global:</strong> <span style="color: ${diffTotal === 0 ? '#16a34a' : '#dc2626'}; font-weight: bold;">$${diffTotal.toLocaleString()}</span></p>
          ${requiereJustificacion ? '<p style="font-size: 0.75rem; color: #ef4444; margin-top: 0.5rem;">Esta diferencia quedará registrada en el sistema bajo su usuario.</p>' : ''}
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar caja',
      cancelButtonText: 'Revisar nuevamente'
    }).then((result) => {
      if (result.isConfirmed) {
        const resultado = cashService.cerrarTurno(
          turnoActivo.id,
          { efectivo: valEfectivo, datafono: valDatafono, transferencia: valTransferencia },
          justificacion,
          usuarioId
        );

        if (!resultado.error) {
          Swal.fire('¡Caja Cerrada!', 'El arqueo fue exitoso y el turno ha concluido.', 'success');
          onSuccess();
        } else {
          Swal.fire('Error', resultado.error, 'error');
        }
      }
    });
  };

  const handleNumberInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
  };

  // Helper para color de diferencia por fila
  const diffColor = (diff: number) => diff === 0 ? 'text-green-600' : 'text-red-500';
  const diffBadgeClass = (diff: number) =>
    diff === 0
      ? 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 font-bold text-sm'
      : 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 font-bold text-sm';

  return createPortal(
    // OVERLAY — fijo, sin cierre al clic externo
    <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4">

      {/* CARD */}
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden max-h-[92vh]"
        style={{ animation: 'modalFadeIn 0.3s ease-out forwards' }}
      >

        {/* HEADER — fondo azul sólido, nunca hace scroll */}
        <div className="flex justify-between items-center px-6 py-4 bg-blue-700 shrink-0">
          <div>
            <h2 className="text-xl font-extrabold text-white m-0">Arqueo y Cierre de Caja</h2>
            <p className="text-sm text-blue-200 mt-0.5 m-0">
              Turno #{turnoActivo.id.substring(0, 8).toUpperCase()} &nbsp;|&nbsp; Total Esperado:&nbsp;
              <strong className="text-white">${turnoActivo.saldoTeoricoGlobal.toLocaleString()}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/20 p-2 rounded-full transition-all"
          >
            <X size={22} />
          </button>
        </div>

        {/* BODY — hace scroll internamente */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">

          {/* TABLA DE ARQUEO */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest w-1/4">Medio de Pago</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest w-1/4">Valor Esperado</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest w-1/4">Valor Físico Real</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest w-1/4 text-right">Diferencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">

                {/* Efectivo */}
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-bold text-slate-800">Efectivo</td>
                  <td className="px-5 py-3 text-slate-500 font-medium">${turnoActivo.totalEfectivo.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <input
                      type="number"
                      value={efectivo}
                      onKeyDown={handleNumberInput}
                      onChange={(e) => setEfectivo(e.target.value)}
                      placeholder="Contar billetes..."
                      autoFocus
                      className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-lg px-3 py-2 text-lg font-bold text-slate-900 bg-white outline-none transition-colors"
                    />
                  </td>
                  <td className={`px-5 py-3 font-bold text-right ${diffColor(diffEfectivo)}`}>
                    {diffEfectivo > 0 ? '+' : ''}${diffEfectivo.toLocaleString()}
                  </td>
                </tr>

                {/* Datáfono */}
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-bold text-slate-800">Datáfono</td>
                  <td className="px-5 py-3 text-slate-500 font-medium">${turnoActivo.totalDatafono.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <div className="relative">
                      <input
                        type="number"
                        disabled={lockDatafono}
                        value={datafono}
                        onKeyDown={handleNumberInput}
                        onChange={(e) => setDatafono(e.target.value)}
                        className="w-full border-2 border-blue-200 focus:border-blue-500 disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed rounded-lg px-3 py-2 pr-10 text-lg font-bold text-slate-900 bg-white outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => lockDatafono && handleUnlock('DATAFONO')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"
                        title={lockDatafono ? 'Forzar Edición' : 'Desbloqueado'}
                      >
                        {lockDatafono ? <Lock size={18} /> : <Unlock size={18} className="text-red-500" />}
                      </button>
                    </div>
                  </td>
                  <td className={`px-5 py-3 font-bold text-right ${diffColor(diffDatafono)}`}>
                    {diffDatafono > 0 ? '+' : ''}${diffDatafono.toLocaleString()}
                  </td>
                </tr>

                {/* Transferencia */}
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-bold text-slate-800">Transferencia</td>
                  <td className="px-5 py-3 text-slate-500 font-medium">${turnoActivo.totalTransferencias.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <div className="relative">
                      <input
                        type="number"
                        disabled={lockTransferencia}
                        value={transferencia}
                        onKeyDown={handleNumberInput}
                        onChange={(e) => setTransferencia(e.target.value)}
                        className="w-full border-2 border-blue-200 focus:border-blue-500 disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed rounded-lg px-3 py-2 pr-10 text-lg font-bold text-slate-900 bg-white outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => lockTransferencia && handleUnlock('TRANSFERENCIA')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"
                        title={lockTransferencia ? 'Forzar Edición' : 'Desbloqueado'}
                      >
                        {lockTransferencia ? <Lock size={18} /> : <Unlock size={18} className="text-red-500" />}
                      </button>
                    </div>
                  </td>
                  <td className={`px-5 py-3 font-bold text-right ${diffColor(diffTransferencia)}`}>
                    {diffTransferencia > 0 ? '+' : ''}${diffTransferencia.toLocaleString()}
                  </td>
                </tr>
              </tbody>

              {/* TFOOT — Totales */}
              <tfoot className="bg-slate-100 border-t-2 border-slate-200">
                <tr>
                  <td className="px-5 py-3 text-xs font-black text-slate-700 uppercase tracking-wider">Totales</td>
                  <td className="px-5 py-3 font-black text-slate-800">${turnoActivo.saldoTeoricoGlobal.toLocaleString()}</td>
                  <td className="px-5 py-3 font-black text-blue-700">${(valEfectivo + valDatafono + valTransferencia).toLocaleString()}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={diffBadgeClass(diffTotal)}>
                      {diffTotal === 0 ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
                      {diffTotal > 0 ? '+' : ''}${diffTotal.toLocaleString()}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* MOTOR DE SUGERENCIAS + JUSTIFICACIÓN */}
          {requiereJustificacion && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5" style={{ animation: 'modalFadeIn 0.2s ease-out' }}>

              {/* Justificación */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-5 shadow-sm flex flex-col gap-3">
                <label className="flex items-center gap-2 text-sm font-bold text-red-800">
                  <AlertTriangle size={17} /> Justificación Obligatoria
                </label>
                <p className="text-xs text-red-600 m-0">
                  Se detectó un <b>{diffTotal > 0 ? 'sobrante' : 'faltante'}</b> global de{' '}
                  <b>${Math.abs(diffTotal).toLocaleString()}</b>. Por política RN-44 debe justificar este evento.
                </p>
                <textarea
                  value={justificacion}
                  onChange={(e) => setJustificacion(e.target.value)}
                  placeholder="Ej. Cambio mal entregado, venta no registrada en el sistema..."
                  className="w-full h-24 border-2 border-red-200 focus:border-red-500 rounded-xl p-3 text-sm font-medium text-slate-800 bg-white outline-none resize-none transition-colors"
                />
              </div>

              {/* Auditoría Inteligente */}
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 shadow-sm flex flex-col gap-3">
                <label className="flex items-center gap-2 text-sm font-bold text-orange-800">
                  <Search size={17} /> Auditoría Inteligente (±5%)
                </label>
                <p className="text-xs text-orange-600 m-0">
                  Productos cuyo precio coincide con el descuadre. ¿Olvidó facturar?
                </p>
                {sugerencias.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {sugerencias.map(prod => (
                      <div
                        key={prod.id}
                        className="flex items-center gap-2 bg-white border border-orange-200 rounded-lg px-3 py-1.5 shadow-sm"
                      >
                        <span className="font-bold text-orange-800 text-sm">{prod.nombre}</span>
                        <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
                          ${(prod.precio_venta_pos || prod.precio_venta).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center border border-dashed border-orange-200 rounded-xl p-4 text-center">
                    <p className="text-sm text-orange-600 italic m-0">
                      Sin productos cercanos a ${Math.abs(diffTotal).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* FOOTER — fijo */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-6 flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-600 font-bold rounded-xl border border-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleCierre}
            className="h-11 px-6 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md shadow-red-200 transition-all"
          >
            Confirmar Cierre de Caja
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
