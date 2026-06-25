import React, { useState } from 'react';
import { TurnoCaja, DetalleArqueo } from '../../../types/cash.types';
import { cashService } from '../../../services/cashService';
import Swal from 'sweetalert2';
import { Wallet, CreditCard, Landmark, Check, X, AlertCircle } from 'lucide-react';
import { CalculadorDenominaciones } from './CalculadorDenominaciones';

interface CierreCajaModalProps {
  turnoActivo: TurnoCaja;
  usuarioId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CierreCajaModal({ turnoActivo, usuarioId, onClose, onSuccess }: CierreCajaModalProps) {
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

  const handleCierre = () => {
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
        <div class="text-left mt-4 text-sm">
          <p><strong>Teórico Global:</strong> $${turnoActivo.saldoTeoricoGlobal.toLocaleString()}</p>
          <p><strong>Físico Global:</strong> $${saldoFisicoGlobal.toLocaleString()}</p>
          <hr class="my-2"/>
          <p class="${diferenciaGlobal === 0 ? 'text-green-600' : 'text-red-600'} font-bold">
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
  };

  const handleInputNumber = (setter: React.Dispatch<React.SetStateAction<number | ''>>, value: string) => {
    // Only allow numbers, avoid e, E, +, -
    if (value === '') {
      setter('');
      return;
    }
    const parsed = Number(value);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      setter(parsed);
    }
  };

  const preventInvalidKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 transition-all duration-300">
        
        {/* Header */}
        <div className="flex flex-col items-center justify-center p-6 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="bg-red-50 text-red-600 rounded-full p-4 mb-3">
            <Wallet size={32} />
          </div>
          <h3 className="font-extrabold text-2xl text-slate-800">Cierre de Caja</h3>
          <p className="text-sm text-slate-500 mt-1 text-center">
            Declare el recaudo físico y cuadre los saldos.
          </p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Columna Izquierda: Teórico, Datáfono, Transferencias, Justificación */}
            <div className="flex flex-col gap-6">
              
              {/* Tarjeta Teórica */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 border-b pb-2">Saldos Teóricos</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Efectivo (Esperado):</span>
                    <span className="font-bold text-slate-700">\${turnoActivo.totalEfectivo.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Datáfono (Esperado):</span>
                    <span className="font-bold text-slate-700">\${turnoActivo.totalDatafono.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Transferencias (Esperado):</span>
                    <span className="font-bold text-slate-700">\${turnoActivo.totalTransferencias.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-3 mt-3 flex justify-between items-center">
                    <span className="font-bold text-slate-800 uppercase text-xs">Total Global:</span>
                    <span className="font-black text-xl text-blue-600">\${turnoActivo.saldoTeoricoGlobal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Otros Medios de Pago */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <CreditCard size={18} />
                    Datáfono
                  </h4>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                    <input 
                      type="number"
                      min="0"
                      onKeyDown={preventInvalidKeys}
                      value={datafono}
                      onChange={(e) => handleInputNumber(setDatafono, e.target.value)}
                      className="w-full h-14 pl-8 pr-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 bg-slate-50 focus:bg-white text-lg font-bold text-slate-800 transition-all outline-none"
                      placeholder="Total en vouchers de datáfono"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 mt-2">
                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Landmark size={18} />
                    Transferencias (Bancos)
                  </h4>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                    <input 
                      type="number"
                      min="0"
                      onKeyDown={preventInvalidKeys}
                      value={transferencia}
                      onChange={(e) => handleInputNumber(setTransferencia, e.target.value)}
                      className="w-full h-14 pl-8 pr-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 bg-slate-50 focus:bg-white text-lg font-bold text-slate-800 transition-all outline-none"
                      placeholder="Total en transferencias"
                    />
                  </div>
                </div>
              </div>

              {/* Diferencia y Justificación */}
              <div className={`mt-2 rounded-2xl border-2 p-5 flex flex-col gap-3 transition-colors ${
                diferenciaGlobal === 0 
                  ? 'border-emerald-200 bg-emerald-50' 
                  : 'border-red-200 bg-red-50'
              }`}>
                <div className="flex justify-between items-center">
                  <span className={`font-bold uppercase tracking-wider text-sm ${diferenciaGlobal === 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    Diferencia Global
                  </span>
                  <span className={`font-black text-2xl ${diferenciaGlobal === 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    \${diferenciaGlobal.toLocaleString()}
                  </span>
                </div>
                
                {requiereJustificacion && (
                  <div className="mt-2 animate-in slide-in-from-top-2 flex flex-col gap-2">
                    <label className="text-sm font-bold text-red-800 flex items-center gap-1">
                      <AlertCircle size={16} />
                      Justificación Obligatoria
                    </label>
                    <textarea 
                      className="w-full border-2 border-red-200 rounded-xl p-3 focus:border-red-500 bg-white text-slate-800 transition-all outline-none resize-none shadow-sm"
                      rows={3}
                      value={justificacion}
                      onChange={(e) => setJustificacion(e.target.value)}
                      placeholder="Explique el motivo del faltante o sobrante detectado..."
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Columna Derecha: Calculador de Denominaciones */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Arqueo de Efectivo</label>
                <div className="text-right">
                  <span className="text-xs text-slate-500 uppercase font-semibold">Total Efectivo Físico</span>
                  <div className="text-2xl font-extrabold text-blue-600">\${totalEfectivoContado.toLocaleString()}</div>
                </div>
              </div>
              <div className="flex-1 bg-white rounded-2xl">
                <CalculadorDenominaciones 
                  valores={denominacionesCierre}
                  onChange={(key, valor) => setDenominacionesCierre(prev => ({ ...prev, [key]: valor }))}
                />
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex gap-3 justify-end">
          <button 
            type="button"
            onClick={onClose}
            className="h-12 px-6 text-slate-500 hover:bg-slate-200 bg-slate-100 font-semibold rounded-xl transition-all flex items-center gap-2"
          >
            <X size={20} />
            Cancelar
          </button>
          <button 
            type="button"
            onClick={handleCierre}
            className="h-12 px-8 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-red-200 transition-all active:scale-[0.98] flex items-center gap-2"
          >
            Confirmar Cierre
            <Check size={20} />
          </button>
        </div>

      </div>
    </div>
  );
}
