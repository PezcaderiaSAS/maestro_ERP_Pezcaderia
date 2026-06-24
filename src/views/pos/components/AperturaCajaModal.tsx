import React, { useState, useEffect } from 'react';
import { cashService } from '../../../services/cashService.ts';
import { Wallet, ChevronRight, ChevronLeft, Check, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import { Caja } from '../../../types/cash.types.ts';

interface AperturaCajaModalProps {
  userRole: string;
  bodegaActiva: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export const AperturaCajaModal: React.FC<AperturaCajaModalProps> = ({
  userRole,
  bodegaActiva,
  onSuccess,
  onCancel
}) => {
  const [step, setStep] = useState<number>(1);
  const [baseInicial, setBaseInicial] = useState<number | ''>('');
  const [cajaSeleccionada, setCajaSeleccionada] = useState<string>('');
  const [cajasDisponibles, setCajasDisponibles] = useState<Caja[]>([]);

  useEffect(() => {
    // Forzar inicialización/siembra
    cashService.seedCajasParaBodegas();

    let cajas = cashService.getCajas().filter(c => c.bodegaId === bodegaActiva && c.activa);
    
    // Filtrar según el rol (solo admins ven Caja Mayor)
    if (userRole !== 'admin') {
      cajas = cajas.filter(c => !c.nombre.includes('Caja Mayor'));
    }

    // Filtrar cajas que ya tengan turno abierto
    const turnos = cashService.getTurnos();
    cajas = cajas.filter(c => !turnos.some(t => t.cajaId === c.id && t.estado === 'ABIERTO'));

    setCajasDisponibles(cajas);
  }, [bodegaActiva, userRole]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!cajaSeleccionada) {
      Swal.fire({ icon: 'warning', title: 'Seleccione una caja' });
      return;
    }
    if (baseInicial === '' || baseInicial < 0 || Number.isNaN(Number(baseInicial))) {
      Swal.fire({ icon: 'warning', title: 'Base inválida', text: 'Por favor, ingrese un monto válido.' });
      return;
    }

    try {
      const result = cashService.abrirTurno(cajaSeleccionada, userRole, Number(baseInicial));
      
      if (result.error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: result.error
        });
        return;
      }

      Swal.fire({
        icon: 'success',
        title: 'Caja Abierta',
        text: 'El turno ha iniciado exitosamente.',
        timer: 1500,
        showConfirmButton: false
      });
      onSuccess();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'No se pudo abrir la caja'
      });
    }
  };

  const cajaNombre = cajasDisponibles.find(c => c.id === cajaSeleccionada)?.nombre || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
        <div className="flex flex-col items-center justify-center p-8 border-b border-slate-100 bg-slate-50 relative">
          <div className="bg-blue-50 text-blue-600 rounded-full p-4 mb-4">
            <Wallet size={40} />
          </div>
          <h3 className="font-extrabold text-2xl text-slate-800">Apertura de Caja</h3>
          <p className="text-sm text-slate-500 mt-2 text-center">
            {step === 1 && 'Seleccione la caja que operará.'}
            {step === 2 && 'Declare el saldo base inicial.'}
            {step === 3 && 'Confirme los datos para iniciar el turno.'}
          </p>

          {/* Stepper Visual */}
          <div className="flex items-center gap-2 mt-6 w-full max-w-xs justify-between">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 transition-colors ${step >= s ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-200 text-slate-500'}`}>
                  {step > s ? <Check size={16} /> : s}
                </div>
                {s < 3 && (
                  <div className={`h-1 flex-1 transition-colors ${step > s ? 'bg-blue-600' : 'bg-slate-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="flex flex-col gap-6 animate-in slide-in-from-right-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Caja a Operar</label>
                {cajasDisponibles.length > 0 ? (
                  <select 
                    value={cajaSeleccionada} 
                    onChange={(e) => setCajaSeleccionada(e.target.value)}
                    className="w-full h-14 px-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 bg-slate-50 focus:bg-white text-lg transition-all outline-none text-slate-800"
                  >
                    <option value="">-- Seleccione una caja --</option>
                    {cajasDisponibles.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full p-4 rounded-xl border-2 border-red-200 bg-red-50 text-red-600 flex flex-col items-center justify-center font-medium gap-2 text-center">
                    <AlertCircle size={24} />
                    <p>No hay cajas disponibles para apertura en esta bodega.</p>
                  </div>
                )}
              </div>
              <div className="pt-4 flex flex-col gap-3">
                <button 
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!cajaSeleccionada}
                  className="w-full h-14 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  Siguiente
                  <ChevronRight size={20} />
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setBaseInicial('');
                    setCajaSeleccionada('');
                    if (onCancel) onCancel();
                  }}
                  className="w-full h-12 text-slate-500 hover:bg-slate-100 hover:text-slate-700 font-semibold rounded-xl transition-all"
                >
                  Volver al Inicio
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-6 animate-in slide-in-from-right-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Saldo Base Inicial</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-bold text-slate-400">$</span>
                  <input 
                    type="number" 
                    min="0"
                    step="1000"
                    value={baseInicial}
                    onKeyDown={(e) => {
                      if (['e', 'E', '+', '-'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => setBaseInicial(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full h-20 pl-12 pr-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 outline-none transition-all text-4xl font-extrabold text-slate-800 bg-slate-50 focus:bg-white"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 h-14 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg rounded-xl transition-all flex items-center justify-center gap-1"
                >
                  <ChevronLeft size={20} />
                  Atrás
                </button>
                <button 
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={baseInicial === '' || baseInicial < 0 || Number.isNaN(Number(baseInicial))}
                  className="w-2/3 h-14 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-1"
                >
                  Siguiente
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-6 animate-in slide-in-from-right-4">
              <div className="bg-blue-50 rounded-2xl p-6 flex flex-col gap-4 border border-blue-100">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-blue-400 uppercase tracking-wider">Caja Seleccionada</span>
                  <span className="text-xl font-bold text-slate-800">{cajaNombre}</span>
                  <span className="text-sm text-slate-500">{bodegaActiva}</span>
                </div>
                <div className="h-px w-full bg-blue-200/50" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-blue-400 uppercase tracking-wider">Base Declarada</span>
                  <span className="text-3xl font-extrabold text-blue-700">
                    ${Number(baseInicial || 0).toLocaleString()}
                  </span>
                </div>
              </div>
              
              <div className="pt-2 flex flex-col gap-3">
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-1/3 h-14 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg rounded-xl transition-all flex items-center justify-center gap-1"
                  >
                    <ChevronLeft size={20} />
                    Atrás
                  </button>
                  <button 
                    type="button"
                    onClick={handleSubmit}
                    className="w-2/3 h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    Confirmar
                    <Check size={20} />
                  </button>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setBaseInicial('');
                    setCajaSeleccionada('');
                    if (onCancel) onCancel();
                  }}
                  className="w-full h-10 mt-2 text-slate-500 hover:text-slate-700 font-medium transition-colors"
                >
                  Cancelar Operación
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
