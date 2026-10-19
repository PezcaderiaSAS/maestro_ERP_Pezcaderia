import React, { useState } from 'react';
import {
  Truck,
  Scale,
  DollarSign,
  CheckCircle2,
  Printer,
  RotateCcw,
  PackageCheck,
  AlertOctagon,
  Anchor
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
  Step1FurgonCadenaFrio,
  FurgonPaso1Data
} from './Step1FurgonCadenaFrio';
import { Step2BasculaCanastillas } from './Step2BasculaCanastillas';
import { Step3LiquidacionFrio } from './Step3LiquidacionFrio';
import {
  dockPurchasesReceivingService,
  PartidaRecepcionInput,
  RecepcionMuelleResult
} from '../../../services/dockPurchasesReceivingService';

interface Props {
  onFinished?: (resultado: RecepcionMuelleResult) => void;
  className?: string;
}

// Función auxiliar para obtener fecha local según la regla local-dates
const getTodayLocalDate = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const INITIAL_FURGON_DATA: FurgonPaso1Data = {
  proveedorId: '',
  proveedorNombre: '',
  proveedorNit: '',
  placaVehiculo: '',
  conductorNombre: '',
  temperaturaCava: 2.0,
  tipoConservacion: 'FRESCO',
  fechaFaena: getTodayLocalDate()
};

export const DockReceivingWizard: React.FC<Props> = ({ onFinished, className = '' }) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [furgonData, setFurgonData] = useState<FurgonPaso1Data>(INITIAL_FURGON_DATA);
  const [partidas, setPartidas] = useState<PartidaRecepcionInput[]>([]);
  const [formaPago, setFormaPago] = useState<'CONTADO' | 'CREDITO' | 'TRANSFERENCIA'>('CONTADO');
  const [diasCredito, setDiasCredito] = useState<number>(15);
  const [bodegaDestinoId, setBodegaDestinoId] = useState<string>('camara-1');
  const [bodegaDestinoNombre, setBodegaDestinoNombre] = useState<string>(
    'Cámara 1 - Pescado Fresco (0° a 2°C)'
  );
  const [observaciones, setObservaciones] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [resultadoExitoso, setResultadoExitoso] = useState<RecepcionMuelleResult | null>(null);

  // Manipulación de datos del Paso 1
  const handleFurgonChange = (partial: Partial<FurgonPaso1Data>) => {
    setFurgonData((prev) => ({ ...prev, ...partial }));
  };

  // Manipulación de partidas del Paso 2
  const handleAddPartida = (partida: PartidaRecepcionInput) => {
    setPartidas((prev) => [...prev, partida]);
  };

  const handleRemovePartida = (index: number) => {
    setPartidas((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Envío final del Paso 3
  const handleFinalSubmit = async () => {
    if (partidas.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin Partidas',
        text: 'Debe haber al menos una partida de pesaje registrada para finalizar la recepción.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await dockPurchasesReceivingService.finalizarRecepcion({
        proveedorId: furgonData.proveedorId,
        proveedorNombre: furgonData.proveedorNombre,
        proveedorNit: furgonData.proveedorNit,
        placaVehiculo: furgonData.placaVehiculo,
        conductorNombre: furgonData.conductorNombre,
        temperaturaCava: furgonData.temperaturaCava,
        fechaFaena: furgonData.fechaFaena,
        tipoConservacion: furgonData.tipoConservacion,
        formaPago,
        diasCredito: formaPago === 'CREDITO' ? diasCredito : 0,
        bodegaDestinoId,
        bodegaDestinoNombre,
        observaciones: observaciones.trim() || undefined,
        partidas
      });

      setResultadoExitoso(res);
      if (onFinished) {
        onFinished(res);
      }

      await Swal.fire({
        icon: 'success',
        title: '¡Recepción en Muelle Exitosa!',
        html: `
          <div style="text-align: left; font-size: 14px; line-height: 1.6;">
            <p><strong>Consecutivo:</strong> <span style="font-family: monospace; font-weight: bold; color: #1e3a8a;">${res.consecutivoMuelle}</span></p>
            <p><strong>Proveedor:</strong> ${res.proveedorNombre}</p>
            <p><strong>Total Kilos Netos:</strong> ${res.totalKilosNetos.toFixed(2)} kg</p>
            <p><strong>Total Liquidación:</strong> $${res.totalCompraCOP.toLocaleString('es-CO')}</p>
            <p><strong>Forma de Pago:</strong> ${res.formaPago}</p>
            <p><strong>Lotes FEFO Generados:</strong> ${res.lotesGenerados.length} lote(s)</p>
          </div>
        `,
        confirmButtonText: '✓ Continuar a Resumen',
        confirmButtonColor: '#059669'
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error en Recepción',
        text: err?.message || 'Ocurrió un error al procesar la recepción de muelle.',
        confirmButtonText: 'Cerrar'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reiniciar para una nueva recepción
  const handleReset = () => {
    setFurgonData({ ...INITIAL_FURGON_DATA, fechaFaena: getTodayLocalDate() });
    setPartidas([]);
    setFormaPago('CONTADO');
    setDiasCredito(15);
    setObservaciones('');
    setResultadoExitoso(null);
    setCurrentStep(1);
  };

  // Si ya finalizó con éxito, mostrar tarjeta de éxito con botón 1-toque de impresión
  if (resultadoExitoso) {
    return (
      <div
        data-testid="dock-receiving-success-view"
        className={`rounded-2xl border-2 border-emerald-300 bg-white p-8 max-w-3xl mx-auto shadow-sm text-center ${className}`}
      >
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={36} />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-3 py-1 rounded-md">
          Muelle & Trazabilidad FEFO
        </span>
        <h2 className="text-2xl font-black text-slate-900 mt-2">
          Recepción Guardada Exitosamente
        </h2>
        <p className="text-slate-600 mt-1">
          Acta Consecutivo:{' '}
          <span className="font-mono font-black text-blue-900 text-lg">
            {resultadoExitoso.consecutivoMuelle}
          </span>
        </p>

        {/* Resumen de Lotes FEFO */}
        <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-left">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-2">
            <PackageCheck size={18} className="text-blue-700" />
            <span>Lotes FEFO Trazables Creados en Almacén</span>
          </h4>
          <div className="divide-y divide-slate-200 text-sm">
            {resultadoExitoso.lotesGenerados.map((lote) => (
              <div key={lote.loteId} className="py-2 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900">{lote.productoNombre}</span>
                  <span className="block font-mono text-xs text-blue-700 font-bold">{lote.codigoLote}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-800">{lote.pesoNetoKg.toFixed(2)} kg</span>
                  <span className="block text-xs text-slate-500">Vence: {lote.fechaVencimiento}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            data-testid="btn-print-dock-act"
            onClick={() => window.print()}
            className="w-full sm:w-auto min-h-[52px] px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 active:scale-95"
          >
            <Printer size={20} />
            <span>Imprimir Acta de Recepción en Muelle</span>
          </button>

          <button
            type="button"
            data-testid="btn-new-receiving"
            onClick={handleReset}
            className="w-full sm:w-auto min-h-[52px] px-6 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 active:scale-95"
          >
            <RotateCcw size={20} />
            <span>Registrar Nuevo Furgón</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="dock-receiving-wizard" className={`space-y-6 ${className}`}>
      {/* 1. BARRA STEPPER TÁCTIL (3 PASOS) */}
      <div className="max-w-4xl mx-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
        <div className="grid grid-cols-3 gap-2">
          {/* Paso 1 */}
          <button
            type="button"
            data-testid="wizard-step-indicator-1"
            onClick={() => setCurrentStep(1)}
            className={`min-h-[48px] px-3 py-2 rounded-xl text-left font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
              currentStep === 1
                ? 'bg-blue-600 text-white shadow-xs'
                : currentStep > 1
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                : 'bg-slate-50 text-slate-500'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                currentStep === 1
                  ? 'bg-white/20 text-white'
                  : currentStep > 1
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {currentStep > 1 ? '✓' : '1'}
            </div>
            <div className="truncate">
              <span className="block text-[10px] sm:text-xs opacity-75">PASO 1</span>
              <span className="truncate">Furgón & Frío</span>
            </div>
          </button>

          {/* Paso 2 */}
          <button
            type="button"
            data-testid="wizard-step-indicator-2"
            onClick={() => {
              if (furgonData.proveedorId && furgonData.placaVehiculo.trim()) {
                setCurrentStep(2);
              }
            }}
            className={`min-h-[48px] px-3 py-2 rounded-xl text-left font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
              currentStep === 2
                ? 'bg-blue-600 text-white shadow-xs'
                : currentStep > 2
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                : 'bg-slate-50 text-slate-500'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                currentStep === 2
                  ? 'bg-white/20 text-white'
                  : currentStep > 2
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {currentStep > 2 ? '✓' : '2'}
            </div>
            <div className="truncate">
              <span className="block text-[10px] sm:text-xs opacity-75">PASO 2</span>
              <span className="truncate">Báscula & Hielo</span>
            </div>
          </button>

          {/* Paso 3 */}
          <button
            type="button"
            data-testid="wizard-step-indicator-3"
            onClick={() => {
              if (furgonData.proveedorId && partidas.length > 0) {
                setCurrentStep(3);
              }
            }}
            className={`min-h-[48px] px-3 py-2 rounded-xl text-left font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
              currentStep === 3
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-500'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                currentStep === 3 ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              3
            </div>
            <div className="truncate">
              <span className="block text-[10px] sm:text-xs opacity-75">PASO 3</span>
              <span className="truncate">Liquidación & Frío</span>
            </div>
          </button>
        </div>
      </div>

      {/* 2. CONTENIDO DEL PASO ACTIVO */}
      {currentStep === 1 && (
        <Step1FurgonCadenaFrio
          data={furgonData}
          onChange={handleFurgonChange}
          onNext={() => setCurrentStep(2)}
        />
      )}

      {currentStep === 2 && (
        <Step2BasculaCanastillas
          partidas={partidas}
          onAddPartida={handleAddPartida}
          onRemovePartida={handleRemovePartida}
          onNext={() => setCurrentStep(3)}
          onPrev={() => setCurrentStep(1)}
        />
      )}

      {currentStep === 3 && (
        <Step3LiquidacionFrio
          furgonData={furgonData}
          partidas={partidas}
          formaPago={formaPago}
          diasCredito={diasCredito}
          bodegaDestinoId={bodegaDestinoId}
          bodegaDestinoNombre={bodegaDestinoNombre}
          observaciones={observaciones}
          onChangeFormaPago={setFormaPago}
          onChangeDiasCredito={setDiasCredito}
          onChangeBodega={(id, nombre) => {
            setBodegaDestinoId(id);
            setBodegaDestinoNombre(nombre);
          }}
          onChangeObservaciones={setObservaciones}
          onSubmit={handleFinalSubmit}
          onPrev={() => setCurrentStep(2)}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};
