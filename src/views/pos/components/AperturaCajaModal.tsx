import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cashService } from '../../../services/cashService.ts';
import { Wallet, ChevronRight, ChevronLeft, Check, AlertCircle, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { Caja, DetalleArqueo } from '../../../types/cash.types.ts';
import { CalculadorDenominaciones } from '../../cash/components/CalculadorDenominaciones.tsx';

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
    cashService.seedCajasParaBodegas();
    let cajas = cashService.getCajas().filter(c => c.bodegaId === bodegaActiva && c.activa);
    if (userRole !== 'admin') {
      cajas = cajas.filter(c => !c.nombre.includes('Caja Mayor'));
    }
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

  const cajaNombre = cajasDisponibles.find(c => c.id === cajaSeleccionada)?.nombre || '';

  const handleCancel = () => {
    setStep(1);
    setDenominacionesApertura({
      billetes100k: 0, billetes50k: 0, billetes20k: 0, billetes10k: 0, billetes5k: 0, billetes2k: 0,
      monedas1k: 0, monedas500: 0, monedas200: 0, monedas100: 0, monedas50: 0
    });
    setCajaSeleccionada('');
    if (onCancel) onCancel();
  };

  return createPortal(
    // OVERLAY — fijo, cubre toda la pantalla, sin cierre al clic externo
    <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4">

      {/* CARD — ancho dinámico según el paso activo */}
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden max-h-[95vh] transition-all duration-300 ${step === 2 ? 'max-w-3xl' : 'max-w-lg'}`}
        style={{ animation: 'modalFadeIn 0.3s ease-out forwards' }}
      >

        {/* HEADER — fijo, nunca hace scroll */}
        <div className="flex flex-col items-center justify-center px-6 pt-6 pb-4 border-b border-slate-100 bg-slate-50 relative shrink-0">
          {/* Botón Cerrar */}
          <button
            type="button"
            onClick={handleCancel}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-full transition-all"
          >
            <X size={20} />
          </button>

          {/* Ícono */}
          <div className="bg-blue-50 text-blue-600 rounded-full p-4 mb-3">
            <Wallet size={36} />
          </div>

          <h3 className="font-extrabold text-2xl text-slate-800 m-0">Apertura de Caja</h3>
          <p className="text-sm text-slate-500 mt-1 text-center">
            {step === 1 && 'Seleccione la caja que operará.'}
            {step === 2 && 'Declare el saldo base inicial.'}
            {step === 3 && 'Confirme los datos para iniciar el turno.'}
          </p>

          {/* Stepper */}
          <div className="flex items-center gap-2 mt-5 w-full max-w-xs justify-between">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all z-10 ${
                    step >= s
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {step > s ? <Check size={14} /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`h-1 flex-1 rounded-full transition-all ${step > s ? 'bg-blue-600' : 'bg-slate-200'}`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* BODY — hace scroll internamente */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">

          {/* PASO 1 — Selección de caja */}
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Caja a Operar
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

              <div className="flex flex-col gap-3 mt-2">
                <button
                  data-testid="btn-siguiente-paso1"
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!cajaSeleccionada}
                  className="h-14 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl shadow-md shadow-blue-200 disabled:shadow-none transition-all"
                >
                  Siguiente <ChevronRight size={20} />
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full flex items-center justify-center py-2 mt-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg font-semibold transition-colors"
                >
                  Volver al Inicio
                </button>
              </div>
            </div>
          )}

          {/* PASO 2 — Calculador de denominaciones */}
          {step === 2 && (
            <div className="flex flex-col gap-6">
              {/* Sub-header de totales */}
              <div className="flex justify-between items-end border-b border-slate-200 pb-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Detalle de Base Inicial
                </label>
                <div className="text-right">
                  <span className="text-xs text-slate-500 uppercase font-semibold">Total Calculado</span>
                  <div className="text-3xl font-black text-blue-600 leading-none">
                    ${baseInicial.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Calculador */}
              <CalculadorDenominaciones
                valores={denominacionesApertura}
                onChange={(key, valor) => setDenominacionesApertura(prev => ({ ...prev, [key]: valor }))}
              />

              {/* Botones de navegación */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="h-14 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-lg rounded-xl transition-colors"
                  style={{ width: '33.333%' }}
                >
                  <ChevronLeft size={20} /> Atrás
                </button>
                <button
                  data-testid="btn-siguiente-paso2"
                  type="button"
                  onClick={() => setStep(3)}
                  className="h-14 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl shadow-md shadow-blue-200 transition-all"
                  style={{ width: '66.666%' }}
                >
                  Siguiente <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}

          {/* PASO 3 — Confirmación */}
          {step === 3 && (
            <div className="flex flex-col gap-6">
              {/* Resumen */}
              <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 flex flex-col gap-4">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Caja Seleccionada</span>
                  <span className="text-xl font-bold text-slate-800">{cajaNombre}</span>
                  <span className="text-sm text-slate-500">{bodegaActiva}</span>
                </div>
                <div className="h-px w-full bg-blue-200/50" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Base Declarada</span>
                  <span className="text-3xl font-black text-blue-700">
                    ${Number(baseInicial || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Botones de confirmación */}
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="h-14 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-lg rounded-xl transition-colors"
                    style={{ width: '33.333%' }}
                  >
                    <ChevronLeft size={20} /> Atrás
                  </button>
                  <button
                    data-testid="btn-confirmar-apertura"
                    type="button"
                    onClick={handleSubmit}
                    className="h-14 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl shadow-md shadow-blue-200 transition-all"
                    style={{ width: '66.666%' }}
                  >
                    Confirmar <Check size={20} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full flex items-center justify-center py-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg font-semibold transition-colors"
                >
                  Cancelar Operación
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
};
