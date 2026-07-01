import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cashService } from '../../../services/cashService';
import { Wallet, Check, AlertCircle, X, ArrowRight, ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';
import { Caja, DetalleArqueo } from '../../../types/cash.types';
import { CalculadorDenominaciones } from '../../cash/components/CalculadorDenominaciones';
import { useWarehouseStore } from '../../../store/useWarehouseStore';

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
  const { bodegas, loadBodegas } = useWarehouseStore();
  const [selectedBodegaId, setSelectedBodegaId] = useState<string>(bodegaActiva);

  const [denominacionesApertura, setDenominacionesApertura] = useState<DetalleArqueo>({
    billetes100k: 0, billetes50k: 0, billetes20k: 0, billetes10k: 0, billetes5k: 0, billetes2k: 0,
    monedas1k: 0, monedas500: 0, monedas200: 0, monedas100: 0, monedas50: 0
  });
  const [cajaSeleccionada, setCajaSeleccionada] = useState<string>('');
  const [cajasDisponibles, setCajasDisponibles] = useState<Caja[]>([]);

  const baseInicial =
    denominacionesApertura.billetes100k * 100000 +
    denominacionesApertura.billetes50k * 50000 +
    denominacionesApertura.billetes20k * 20000 +
    denominacionesApertura.billetes10k * 10000 +
    denominacionesApertura.billetes5k * 5000 +
    denominacionesApertura.billetes2k * 2000 +
    denominacionesApertura.monedas1k * 1000 +
    denominacionesApertura.monedas500 * 500 +
    denominacionesApertura.monedas200 * 200 +
    denominacionesApertura.monedas100 * 100 +
    denominacionesApertura.monedas50 * 50;

  useEffect(() => {
    loadBodegas();
  }, [loadBodegas]);

  useEffect(() => {
    if (userRole !== 'admin') {
      setSelectedBodegaId(bodegaActiva);
    }
  }, [userRole, bodegaActiva]);

  useEffect(() => {
    cashService.seedCajasParaBodegas();
    let cajas = cashService.getCajas().filter(c => c.bodegaId === selectedBodegaId && c.activa);
    
    if (userRole !== 'admin') {
      cajas = cajas.filter(c => !c.nombre.includes('Caja Mayor'));
    }
    
    const turnos = cashService.getTurnos();
    cajas = cajas.filter(c => !turnos.some(t => t.cajaId === c.id && t.estado === 'ABIERTO'));
    
    setCajasDisponibles(cajas);
    if (cajas.length === 1) {
      setCajaSeleccionada(cajas[0].id);
    } else {
      setCajaSeleccionada('');
    }
  }, [selectedBodegaId, userRole]);

  const handleNextStep = () => {
    if (step === 1 && !cajaSeleccionada) {
      Swal.fire({ icon: 'warning', title: 'Seleccione una caja' });
      return;
    }
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!cajaSeleccionada) {
      Swal.fire({ icon: 'warning', title: 'Seleccione una caja' });
      return;
    }
    if (baseInicial < 0 || Number.isNaN(baseInicial)) {
      Swal.fire({ icon: 'warning', title: 'Base inválida', text: 'El cálculo de la base inicial es inválido.' });
      return;
    }

    try {
      const result = cashService.abrirTurno(cajaSeleccionada, userRole, baseInicial, denominacionesApertura);

      if (result.error) {
        Swal.fire({ icon: 'error', title: 'Error', text: result.error });
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
      Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'No se pudo abrir la caja' });
    }
  };

  const handleCancel = () => {
    setDenominacionesApertura({
      billetes100k: 0, billetes50k: 0, billetes20k: 0, billetes10k: 0, billetes5k: 0, billetes2k: 0,
      monedas1k: 0, monedas500: 0, monedas200: 0, monedas100: 0, monedas50: 0
    });
    setCajaSeleccionada('');
    if (onCancel) onCancel();
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden max-h-[95vh] max-w-2xl transition-all duration-300"
        style={{ animation: 'modalFadeIn 0.3s ease-out forwards' }}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-blue-50 text-blue-600 rounded-full p-3 flex items-center justify-center">
              <Wallet size={24} />
            </div>
            <div>
              <h3 className="font-extrabold text-xl text-slate-800 m-0">Apertura de Turno</h3>
              <p className="text-sm text-slate-500 m-0">
                Paso {step} de 3: {step === 1 ? 'Selección de Caja' : step === 2 ? 'Declaración de Base' : 'Confirmación'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* PROGRESS BAR */}
        <div className="w-full bg-slate-100 h-1">
          <div 
            className="bg-blue-500 h-1 transition-all duration-300" 
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          
          {/* STEP 1: WAREHOUSE & REGISTER SELECTION */}
          {step === 1 && (
            <div className="flex flex-col gap-6" style={{ animation: 'modalFadeIn 0.3s ease-out forwards' }}>
              
              {userRole === 'admin' && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                    Bodega
                  </label>
                  <select
                    data-testid="select-bodega"
                    value={selectedBodegaId}
                    onChange={(e) => setSelectedBodegaId(e.target.value)}
                    className="w-full h-14 px-4 rounded-xl border-2 border-slate-200 bg-slate-50 focus:border-blue-400 focus:bg-white text-lg text-slate-800 outline-none transition-colors appearance-none cursor-pointer"
                  >
                    {bodegas.map(b => (
                      <option key={b.id} value={b.id}>{b.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                  Caja
                </label>
                {cajasDisponibles.length > 0 ? (
                  <select
                    data-testid="select-caja"
                    value={cajaSeleccionada}
                    onChange={(e) => setCajaSeleccionada(e.target.value)}
                    className="w-full h-14 px-4 rounded-xl border-2 border-slate-200 bg-slate-50 focus:border-blue-400 focus:bg-white text-lg text-slate-800 outline-none transition-colors appearance-none cursor-pointer"
                  >
                    <option value="">-- Seleccione una caja --</option>
                    {cajasDisponibles.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-red-100 bg-red-50 text-red-600 text-center font-medium">
                    <AlertCircle size={24} />
                    <p className="text-sm">No hay cajas disponibles para apertura en esta bodega.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: CASH DECLARATION */}
          {step === 2 && (
            <div className="flex flex-col gap-6" style={{ animation: 'modalFadeIn 0.3s ease-out forwards' }}>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col max-h-[60vh]">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                  Declare la Base (Obligatorio usar calculadora)
                </label>
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  <CalculadorDenominaciones
                    valores={denominacionesApertura}
                    onChange={(key, valor) => setDenominacionesApertura(prev => ({ ...prev, [key]: valor }))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SUMMARY */}
          {step === 3 && (
            <div className="flex flex-col gap-6" style={{ animation: 'modalFadeIn 0.3s ease-out forwards' }}>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 rounded-2xl border border-blue-100 shadow-sm flex flex-col items-center justify-center gap-4 text-center">
                <div className="bg-blue-600 text-white rounded-full p-4 mb-2 shadow-lg shadow-blue-200">
                  <Wallet size={32} />
                </div>
                <h4 className="text-xl font-bold text-slate-800">Resumen de Apertura</h4>
                
                <div className="flex flex-col justify-center gap-1 mt-4">
                  <span className="text-sm text-slate-500 font-medium uppercase tracking-wider">Base Declarada</span>
                  <div className="text-5xl font-black text-blue-700 tracking-tight">
                    ${baseInicial.toLocaleString()}
                  </div>
                </div>

                <div className="w-full bg-white/60 rounded-xl p-4 mt-4 text-sm text-slate-600 flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Bodega:</span>
                    <span>{bodegas.find(b => b.id === selectedBodegaId)?.nombre || selectedBodegaId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Caja:</span>
                    <span>{cajasDisponibles.find(c => c.id === cajaSeleccionada)?.nombre || 'Seleccionada'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Responsable:</span>
                    <span className="uppercase">{userRole}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-between gap-4">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-6 py-3 flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
            >
              <ArrowLeft size={18} /> Atrás
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-3 flex items-center gap-2 text-slate-500 hover:bg-slate-100 font-bold rounded-xl transition-colors"
            >
              Cancelar
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNextStep}
              disabled={step === 1 && !cajaSeleccionada}
              className="px-8 py-3 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold rounded-xl shadow-md transition-all ml-auto"
            >
              Siguiente <ArrowRight size={18} />
            </button>
          ) : (
            <button
              data-testid="btn-confirmar-apertura"
              type="button"
              onClick={handleSubmit}
              className="px-8 py-3 flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition-all ml-auto"
            >
              Confirmar Apertura <Check size={18} />
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

