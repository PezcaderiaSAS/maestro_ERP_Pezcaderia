import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { TurnoCaja, DetalleArqueo } from '../../../types/cash.types';
import { cashService } from '../../../services/cashService';
import { useCashStore } from '../../../store/useCashStore';
import Swal from 'sweetalert2';
import { Wallet, CreditCard, Landmark, Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { CalculadorDenominaciones } from './CalculadorDenominaciones';
import { useActionLogger } from '../../../hooks/useActionLogger';

interface CierreCajaModalProps {
  turnoActivo: TurnoCaja;
  usuarioId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CierreCajaModal({ turnoActivo, usuarioId, onClose, onSuccess }: CierreCajaModalProps) {
  const { isLoading } = useCashStore();
  const [denominacionesCierre, setDenominacionesCierre] = useState<DetalleArqueo>({
    billetes100k: 0, billetes50k: 0, billetes20k: 0, billetes10k: 0, billetes5k: 0, billetes2k: 0,
    monedas1k: 0, monedas500: 0, monedas200: 0, monedas100: 0, monedas50: 0
  });

  const [datafono, setDatafono] = useState<number | ''>('');
  const [transferencia, setTransferencia] = useState<number | ''>('');
  const [justificacion, setJustificacion] = useState('');

  const totalEfectivoContado =
    denominacionesCierre.billetes100k * 100000 +
    denominacionesCierre.billetes50k * 50000 +
    denominacionesCierre.billetes20k * 20000 +
    denominacionesCierre.billetes10k * 10000 +
    denominacionesCierre.billetes5k * 5000 +
    denominacionesCierre.billetes2k * 2000 +
    denominacionesCierre.monedas1k * 1000 +
    denominacionesCierre.monedas500 * 500 +
    denominacionesCierre.monedas200 * 200 +
    denominacionesCierre.monedas100 * 100 +
    denominacionesCierre.monedas50 * 50;

  const totalDatafonoIngresado = Number(datafono) || 0;
  const totalTransferenciaIngresada = Number(transferencia) || 0;

  const saldoFisicoGlobal = totalEfectivoContado + totalDatafonoIngresado + totalTransferenciaIngresada;
  const diferenciaGlobal = saldoFisicoGlobal - turnoActivo.saldoTeoricoGlobal;
  const requiereJustificacion = diferenciaGlobal !== 0;
  const diferenciaPositiva = diferenciaGlobal === 0;

  const handleCierre = useActionLogger('CashFlow', 'CerrarTurno', () => {
    if (requiereJustificacion && justificacion.trim() === '') {
      Swal.fire({
        icon: 'error',
        title: 'Justificación Requerida',
        text: 'Debe explicar el motivo de la diferencia detectada en el cuadre de caja.'
      });
      return;
    }

    Swal.fire({
      title: '¿Confirmar cierre de caja?',
      html: `
        <div style="text-align: left; margin-top: 1rem; font-size: 0.875rem;">
          <p><strong>Teórico Global:</strong> $${turnoActivo.saldoTeoricoGlobal.toLocaleString()}</p>
          <p><strong>Físico Global:</strong> $${saldoFisicoGlobal.toLocaleString()}</p>
          <hr style="margin: 0.5rem 0;" />
          <p style="color: ${diferenciaGlobal === 0 ? '#16a34a' : '#dc2626'}; font-weight: bold;">
            <strong>Diferencia:</strong> $${diferenciaGlobal.toLocaleString()}
          </p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar turno',
      cancelButtonText: 'Revisar nuevamente',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b'
    }).then((result) => {
      if (result.isConfirmed) {
        const resultado = cashService.cerrarTurno(
          turnoActivo.id,
          {
            efectivo: totalEfectivoContado,
            datafono: totalDatafonoIngresado,
            transferencia: totalTransferenciaIngresada,
            detalleEfectivo: denominacionesCierre
          },
          justificacion,
          usuarioId
        );

        if (!resultado.error) {
          Swal.fire({
            icon: 'success',
            title: '¡Caja Cerrada!',
            text: 'El turno se ha cerrado correctamente y los arqueos fueron guardados.',
            timer: 2000,
            showConfirmButton: false
          });
          onSuccess();
        } else {
          Swal.fire('Error', resultado.error, 'error');
        }
      }
    });
  });

  const handleInputNumber = (setter: React.Dispatch<React.SetStateAction<number | ''>>, value: string) => {
    if (value === '') { setter(''); return; }
    const parsed = Number(value);
    if (!Number.isNaN(parsed) && parsed >= 0) setter(parsed);
  };

  const preventInvalidKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
  };

  return createPortal(
    // OVERLAY — fijo, cubre toda la pantalla, sin cierre al clic externo
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-sm flex justify-center items-center p-2 md:p-4 overflow-y-auto">

      {/* CARD — ancho máximo xl para acomodar calculador + saldos */}
      <div className="bg-white rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.35)] w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden animate-[modalFadeIn_0.3s_ease-out_forwards]">

        {/* HEADER — fijo, nunca hace scroll */}
        <div className="flex flex-col items-center justify-center px-6 pt-5 pb-4 border-b border-slate-100 bg-slate-50 relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-full transition-all"
          >
            <X size={20} />
          </button>
          <div className="bg-red-50 text-red-600 rounded-full p-3 mb-2">
            <Wallet size={30} />
          </div>
          <h3 className="font-extrabold text-xl text-slate-800 m-0">Cierre de Caja</h3>
          <p className="text-sm text-slate-500 mt-0.5 text-center">
            Declare el recaudo físico y cuadre los saldos.
          </p>
        </div>

        {/* BODY — hace scroll internamente */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 flex flex-col gap-8">

          {/* SECCIÓN 1 — Grid de saldos, otros medios y diferencia */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Col 1: Saldos Teóricos */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-center">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2 mb-3">
                Saldos Teóricos
              </h4>
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Efectivo (Esperado):</span>
                  <span className="font-bold text-slate-700">${turnoActivo.totalEfectivo.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Datáfono (Esperado):</span>
                  <span className="font-bold text-slate-700">${turnoActivo.totalDatafono.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Transferencias (Esperado):</span>
                  <span className="font-bold text-slate-700">${turnoActivo.totalTransferencias.toLocaleString()}</span>
                </div>
                <div className="border-t border-slate-200 pt-2.5 mt-1 flex justify-between items-center">
                  <span className="text-xs font-black text-slate-700 uppercase">Total Global:</span>
                  <span className="font-black text-xl text-blue-600">${turnoActivo.saldoTeoricoGlobal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Col 2: Otros Medios de Pago */}
            <div className="flex flex-col gap-4 justify-center">
              {/* Datáfono */}
              <div className="flex flex-col gap-1.5">
                <h4 className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-widest m-0">
                  <CreditCard size={15} /> Datáfono
                </h4>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm pointer-events-none">$</span>
                  <input
                    data-testid="input-datafono"
                    type="number"
                    min="0"
                    onKeyDown={preventInvalidKeys}
                    value={datafono}
                    onChange={(e) => handleInputNumber(setDatafono, e.target.value)}
                    placeholder="Total en vouchers"
                    className="w-full h-12 pl-8 pr-4 rounded-xl border-2 border-slate-200 bg-slate-50 focus:border-blue-400 focus:bg-white text-lg font-bold text-slate-800 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Transferencias */}
              <div className="flex flex-col gap-1.5">
                <h4 className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-widest m-0">
                  <Landmark size={15} /> Transferencias
                </h4>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm pointer-events-none">$</span>
                  <input
                    data-testid="input-transferencia"
                    type="number"
                    min="0"
                    onKeyDown={preventInvalidKeys}
                    value={transferencia}
                    onChange={(e) => handleInputNumber(setTransferencia, e.target.value)}
                    placeholder="Total en transferencias"
                    className="w-full h-12 pl-8 pr-4 rounded-xl border-2 border-slate-200 bg-slate-50 focus:border-blue-400 focus:bg-white text-lg font-bold text-slate-800 outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Col 3: Diferencia y Justificación */}
            <div className={`rounded-xl p-5 border-2 flex flex-col gap-3 transition-all ${diferenciaPositiva ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <div className="flex justify-between items-center">
                <span className={`font-bold text-sm uppercase tracking-wide ${diferenciaPositiva ? 'text-green-700' : 'text-red-700'}`}>
                  Diferencia
                </span>
                <span className={`font-black text-2xl ${diferenciaPositiva ? 'text-green-700' : 'text-red-700'}`}>
                  ${diferenciaGlobal.toLocaleString()}
                </span>
              </div>

              {requiereJustificacion && (
                <div className="flex flex-col gap-1.5" style={{ animation: 'modalFadeIn 0.2s ease-out' }}>
                  <label className="flex items-center gap-1 text-sm font-bold text-red-700">
                    <AlertCircle size={15} /> Justificación Obligatoria
                  </label>
                  <textarea
                    data-testid="input-justificacion"
                    value={justificacion}
                    onChange={(e) => setJustificacion(e.target.value)}
                    placeholder="Explique el motivo del faltante o sobrante..."
                    className="w-full min-h-[5rem] border-2 border-red-200 focus:border-red-400 rounded-xl p-3 text-sm font-medium text-slate-800 bg-white outline-none resize-none transition-colors"
                  />
                </div>
              )}

              {diferenciaPositiva && (
                <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
                  <Check size={18} className="shrink-0" />
                  Cuadre perfecto
                </div>
              )}
            </div>

          </div>

          {/* SECCIÓN 2 — Calculador de Efectivo Físico */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-end border-b border-slate-200 pb-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Arqueo de Efectivo Físico
              </label>
              <div className="text-right">
                <span className="text-xs text-slate-500 uppercase font-semibold">Total Efectivo Físico</span>
                <div className="text-3xl font-black text-blue-600 leading-none">
                  ${totalEfectivoContado.toLocaleString()}
                </div>
              </div>
            </div>
            <CalculadorDenominaciones
              valores={denominacionesCierre}
              onChange={(key, valor) => setDenominacionesCierre(prev => ({ ...prev, [key]: valor }))}
            />
          </div>

        </div>

        {/* FOOTER — fijo, nunca hace scroll */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-12 px-6 flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl border border-slate-200 transition-colors"
          >
            <X size={18} /> Cancelar
          </button>
          <button
            data-testid="btn-confirmar-cierre"
            type="button"
            onClick={handleCierre}
            disabled={isLoading}
            className="h-12 px-6 flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md shadow-red-200 transition-all"
          >
            {isLoading
              ? <><Loader2 size={18} className="animate-spin" /> Cerrando...</>
              : <>Confirmar Cierre <Check size={18} /></>}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
