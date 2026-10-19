import React, { useState } from 'react';
import {
  Truck,
  User,
  Thermometer,
  Calendar,
  Building2,
  Plus,
  ArrowRight,
  Snowflake,
  ShieldCheck
} from 'lucide-react';
import { useSupplierStore } from '../../../store/useSupplierStore';
import { ThermalTrafficLightBadge } from './ThermalTrafficLightBadge';
import { QuickSupplierModal } from './QuickSupplierModal';

export interface FurgonPaso1Data {
  proveedorId: string;
  proveedorNombre: string;
  proveedorNit: string;
  placaVehiculo: string;
  conductorNombre: string;
  temperaturaCava: number;
  tipoConservacion: 'FRESCO' | 'CONGELADO';
  fechaFaena: string;
}

interface Props {
  data: FurgonPaso1Data;
  onChange: (data: Partial<FurgonPaso1Data>) => void;
  onNext: () => void;
}

export const Step1FurgonCadenaFrio: React.FC<Props> = ({ data, onChange, onNext }) => {
  const proveedores = useSupplierStore((s) => s.proveedores);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSupplierSelect = (id: string) => {
    const prov = proveedores.find((p) => p.id === id);
    if (prov) {
      onChange({
        proveedorId: prov.id,
        proveedorNombre: prov.nombre,
        proveedorNit: prov.nit
      });
      setValidationError(null);
    }
  };

  const handleSupplierCreated = (newId: string) => {
    handleSupplierSelect(newId);
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.proveedorId || !data.proveedorNombre) {
      setValidationError('Por favor seleccione o cree un proveedor para continuar.');
      return;
    }
    if (!data.placaVehiculo.trim()) {
      setValidationError('La placa del vehículo furgón es obligatoria.');
      return;
    }
    setValidationError(null);
    onNext();
  };

  return (
    <form
      data-testid="step1-furgon-cadena-frio"
      onSubmit={handleContinue}
      className="space-y-6 max-w-4xl mx-auto"
    >
      {/* 1. SELECCIÓN DE PROVEEDOR */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
              <Building2 size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Proveedor de Muelle / Pescador</h3>
              <p className="text-sm text-slate-500">Seleccione el barco, cooperativa o proveedor mayorista</p>
            </div>
          </div>

          <button
            type="button"
            data-testid="btn-open-quick-supplier"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 min-h-[48px] px-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-xs active:scale-[0.98]"
          >
            <Plus size={20} />
            <span>+ Nuevo Proveedor</span>
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Seleccionar Proveedor Registrado <span className="text-rose-500">*</span>
            </label>
            <select
              data-testid="select-supplier"
              value={data.proveedorId}
              onChange={(e) => handleSupplierSelect(e.target.value)}
              className="w-full min-h-[48px] px-4 text-base font-medium rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
            >
              <option value="">-- Seleccionar Proveedor --</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} (NIT: {p.nit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Razón Social / Identificación
            </label>
            <div className="min-h-[48px] flex items-center px-4 rounded-xl border border-slate-200 bg-slate-100 text-slate-800 font-semibold text-base">
              {data.proveedorNombre ? (
                <span>
                  {data.proveedorNombre} - <span className="text-slate-600 font-normal">NIT: {data.proveedorNit}</span>
                </span>
              ) : (
                <span className="text-slate-400 font-normal italic">Ningún proveedor seleccionado</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. DATOS DEL FURGÓN Y CONDUCTOR */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <Truck size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Datos de Transporte y Furgón</h3>
            <p className="text-sm text-slate-500">Trazabilidad del vehículo de transporte terrestre o marítimo</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Placa de Vehículo / Embarcación <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                data-testid="input-vehicle-plate"
                placeholder="EJ: TRK-892"
                value={data.placaVehiculo}
                onChange={(e) => {
                  onChange({ placaVehiculo: e.target.value.toUpperCase() });
                  setValidationError(null);
                }}
                className="w-full min-h-[48px] px-4 font-mono font-bold tracking-wider uppercase text-base rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Nombre de Conductor / Transportista
            </label>
            <div className="relative">
              <input
                type="text"
                data-testid="input-driver-name"
                placeholder="Nombre completo"
                value={data.conductorNombre}
                onChange={(e) => onChange({ conductorNombre: e.target.value })}
                className="w-full min-h-[48px] px-4 text-base font-medium rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. INSPECCIÓN SANITARIA Y CADENA DE FRÍO */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Inspección Sanitaria y Cadena de Frío</h3>
            <p className="text-sm text-slate-500">Monitoreo térmico HACCP en el muelle de descarga</p>
          </div>
        </div>

        <div className="mt-5 space-y-6">
          {/* Tipo de conservación (Fresco vs Congelado) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Tipo de Conservación y Cadena de Frío
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                data-testid="btn-type-fresco"
                onClick={() => onChange({ tipoConservacion: 'FRESCO' })}
                className={`min-h-[52px] px-4 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-3 transition-all ${
                  data.tipoConservacion === 'FRESCO'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Thermometer size={20} className={data.tipoConservacion === 'FRESCO' ? 'text-emerald-700' : 'text-slate-400'} />
                <span>Pescado Fresco en Hielo (0°C a 2°C)</span>
              </button>

              <button
                type="button"
                data-testid="btn-type-congelado"
                onClick={() => onChange({ tipoConservacion: 'CONGELADO' })}
                className={`min-h-[52px] px-4 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-3 transition-all ${
                  data.tipoConservacion === 'CONGELADO'
                    ? 'border-blue-600 bg-blue-50 text-blue-950 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Snowflake size={20} className={data.tipoConservacion === 'CONGELADO' ? 'text-blue-700' : 'text-slate-400'} />
                <span>Pescado Congelado (-18°C)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Temperatura Medida en Cava (°C) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  data-testid="input-cava-temp"
                  value={data.temperaturaCava}
                  onChange={(e) => onChange({ temperaturaCava: parseFloat(e.target.value) || 0 })}
                  className="w-full min-h-[48px] px-4 font-mono font-bold text-xl rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">°C</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">Inserte termómetro punzón en el furgón refrigerado.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Fecha de Faena / Captura
              </label>
              <div className="relative">
                <input
                  type="date"
                  data-testid="input-faena-date"
                  value={data.fechaFaena}
                  onChange={(e) => onChange({ fechaFaena: e.target.value })}
                  className="w-full min-h-[48px] px-4 text-base font-medium rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">Base para calcular la caducidad FEFO (+8 días fresco, +180 congelado).</p>
            </div>
          </div>

          {/* Semáforo Térmico HACCP en Vivo */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Evaluación Técnica de Cadena de Frío
            </label>
            <ThermalTrafficLightBadge
              temperatura={data.temperaturaCava}
              tipoProducto={data.tipoConservacion}
            />
          </div>
        </div>
      </div>

      {/* Error de validación si existe */}
      {validationError && (
        <div
          data-testid="step1-validation-error"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-2"
        >
          <span className="inline-block w-2 h-2 rounded-full bg-rose-600"></span>
          {validationError}
        </div>
      )}

      {/* 4. BOTÓN GIGANTE DE AVANCE >= 56px */}
      <div className="pt-2">
        <button
          type="submit"
          data-testid="btn-step1-next"
          className="w-full h-14 min-h-[56px] px-8 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-lg rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 active:scale-[0.99]"
        >
          <span>CONTINUAR A BÁSCULA DE MUELLE</span>
          <ArrowRight size={24} />
        </button>
      </div>

      {/* Modal de Registro Rápido de Proveedor */}
      <QuickSupplierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSupplierCreated={handleSupplierCreated}
      />
    </form>
  );
};
