import React from 'react';
import {
  DollarSign,
  CreditCard,
  Banknote,
  ArrowLeftRight,
  Warehouse,
  CheckCircle2,
  ArrowLeft,
  Calendar,
  AlertTriangle,
  FileText,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { useWarehouseStore, Bodega } from '../../../store/useWarehouseStore';
import { PartidaRecepcionInput } from '../../../services/dockPurchasesReceivingService';
import { FurgonPaso1Data } from './Step1FurgonCadenaFrio';
import {
  calcularLiquidacionTotalMuelle,
  calcularPesajeMuelleNeto
} from '../../../../packages/validation-schemas/src/dockPurchasesReceiving.schema';

interface Props {
  furgonData: FurgonPaso1Data;
  partidas: PartidaRecepcionInput[];
  formaPago: 'CONTADO' | 'CREDITO' | 'TRANSFERENCIA';
  diasCredito: number;
  bodegaDestinoId: string;
  bodegaDestinoNombre: string;
  observaciones: string;
  onChangeFormaPago: (forma: 'CONTADO' | 'CREDITO' | 'TRANSFERENCIA') => void;
  onChangeDiasCredito: (dias: number) => void;
  onChangeBodega: (id: string, nombre: string) => void;
  onChangeObservaciones: (obs: string) => void;
  onSubmit: () => void;
  onPrev: () => void;
  isSubmitting?: boolean;
}

const BODEGAS_FALLBACK: Bodega[] = [
  { id: 'camara-1', nombre: 'Cámara 1 - Pescado Fresco (0° a 2°C)', activa: true },
  { id: 'camara-2', nombre: 'Cámara 2 - Congelados (-18°C)', activa: true },
  { id: 'bodega-principal', nombre: 'Bodega Principal Muelle', activa: true }
];

const PRESETS_CREDITO = [
  { dias: 8, label: '8 días' },
  { dias: 15, label: '15 días' },
  { dias: 30, label: '30 días' }
];

export const Step3LiquidacionFrio: React.FC<Props> = ({
  furgonData,
  partidas,
  formaPago,
  diasCredito,
  bodegaDestinoId,
  bodegaDestinoNombre,
  observaciones,
  onChangeFormaPago,
  onChangeDiasCredito,
  onChangeBodega,
  onChangeObservaciones,
  onSubmit,
  onPrev,
  isSubmitting = false
}) => {
  const bodegasStore = useWarehouseStore((s) => s.bodegas);
  const bodegas = bodegasStore && bodegasStore.length > 0 ? bodegasStore : BODEGAS_FALLBACK;

  // Cálculo metrológico consolidado
  const liquidacion = partidas.reduce(
    (acc, p) => {
      const calc = calcularPesajeMuelleNeto(
        p.pesoBrutoKg,
        p.cantidadCanastillas,
        p.porcentajeHielo,
        p.taraCanastillaKg ?? 2.0
      );
      const subtotal = Math.round(calc.pesoNetoRealKg * p.precioKgAcordado);
      return {
        totalCanastillas: acc.totalCanastillas + p.cantidadCanastillas,
        totalKilosBrutos: acc.totalKilosBrutos + p.pesoBrutoKg,
        descuentoTotalHieloKg: acc.descuentoTotalHieloKg + calc.descuentoHieloKg,
        totalKilosNetos: Number((acc.totalKilosNetos + calc.pesoNetoRealKg).toFixed(2)),
        totalCompraCOP: acc.totalCompraCOP + subtotal
      };
    },
    {
      totalCanastillas: 0,
      totalKilosBrutos: 0,
      descuentoTotalHieloKg: 0,
      totalKilosNetos: 0,
      totalCompraCOP: 0
    }
  );

  const handleBodegaChange = (id: string) => {
    const b = bodegas.find((item) => item.id === id);
    if (b) {
      onChangeBodega(b.id, b.nombre);
    }
  };

  return (
    <div data-testid="step3-liquidacion-frio" className="space-y-6 max-w-4xl mx-auto">
      {/* 1. TARJETA RESUMEN CONSOLIDADA */}
      <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50/60 to-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100/70 px-2.5 py-1 rounded-md">
              Resumen Liquidación Muelle
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-2">
              {furgonData.proveedorNombre || 'Proveedor sin asignar'}
            </h2>
            <p className="text-sm text-slate-600 font-medium">
              Placa: <span className="font-mono font-bold text-slate-900">{furgonData.placaVehiculo || 'N/A'}</span> •
              Temp. Cava: <span className="font-mono font-bold text-slate-900">{furgonData.temperaturaCava}°C</span> •
              Conservación: <span className="font-bold text-blue-800">{furgonData.tipoConservacion}</span>
            </p>
          </div>

          <div className="text-right sm:border-l sm:border-blue-100 sm:pl-6">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              TOTAL A LIQUIDAR (COP)
            </span>
            <span
              data-testid="display-total-compra-cop"
              className="font-mono text-3xl sm:text-4xl font-black text-blue-950 tracking-tight"
            >
              ${liquidacion.totalCompraCOP.toLocaleString('es-CO')}
            </span>
          </div>
        </div>

        {/* Métricas clave */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-2xs">
            <span className="text-xs text-slate-500 font-medium block">Canastillas</span>
            <span className="font-mono font-extrabold text-lg text-slate-800">
              {liquidacion.totalCanastillas} ud
            </span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-2xs">
            <span className="text-xs text-slate-500 font-medium block">Peso Bruto Total</span>
            <span className="font-mono font-extrabold text-lg text-slate-800">
              {liquidacion.totalKilosBrutos.toFixed(2)} kg
            </span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-2xs">
            <span className="text-xs text-slate-500 font-medium block">Descuento Hielo</span>
            <span className="font-mono font-extrabold text-lg text-blue-600">
              -{liquidacion.descuentoTotalHieloKg.toFixed(2)} kg
            </span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 shadow-2xs">
            <span className="text-xs text-emerald-800 font-bold block">KILOS NETOS REALES</span>
            <span
              data-testid="display-total-kilos-netos"
              className="font-mono font-black text-xl text-emerald-950"
            >
              {liquidacion.totalKilosNetos.toFixed(2)} kg
            </span>
          </div>
        </div>
      </div>

      {/* 2. FORMA DE PAGO */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <DollarSign size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Forma y Condiciones de Pago</h3>
            <p className="text-sm text-slate-500">Seleccione el acuerdo comercial pactado con el proveedor</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            data-testid="btn-payment-contado"
            onClick={() => onChangeFormaPago('CONTADO')}
            className={`min-h-[56px] px-4 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-3 transition-all ${
              formaPago === 'CONTADO'
                ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Banknote size={22} className={formaPago === 'CONTADO' ? 'text-emerald-700' : 'text-slate-400'} />
            <span>Contado (Efectivo)</span>
          </button>

          <button
            type="button"
            data-testid="btn-payment-credito"
            onClick={() => onChangeFormaPago('CREDITO')}
            className={`min-h-[56px] px-4 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-3 transition-all ${
              formaPago === 'CREDITO'
                ? 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-500/20 shadow-xs'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <CreditCard size={22} className={formaPago === 'CREDITO' ? 'text-blue-700' : 'text-slate-400'} />
            <span>Crédito Comercial (CxP)</span>
          </button>

          <button
            type="button"
            data-testid="btn-payment-transferencia"
            onClick={() => onChangeFormaPago('TRANSFERENCIA')}
            className={`min-h-[56px] px-4 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-3 transition-all ${
              formaPago === 'TRANSFERENCIA'
                ? 'border-purple-600 bg-purple-50 text-purple-950 ring-2 ring-purple-500/20 shadow-xs'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ArrowLeftRight size={22} className={formaPago === 'TRANSFERENCIA' ? 'text-purple-700' : 'text-slate-400'} />
            <span>Transferencia Bancaria</span>
          </button>
        </div>

        {/* Subsección condicional si es CRÉDITO */}
        {formaPago === 'CREDITO' && (
          <div data-testid="panel-credito-presets" className="mt-5 p-4 rounded-xl bg-blue-50/70 border border-blue-200">
            <label className="block text-sm font-bold text-blue-950 mb-3 flex items-center gap-2">
              <Calendar size={18} className="text-blue-700" />
              <span>Plazo de Crédito Acordado</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {PRESETS_CREDITO.map((preset) => (
                <button
                  key={preset.dias}
                  type="button"
                  data-testid={`btn-credit-preset-${preset.dias}`}
                  onClick={() => onChangeDiasCredito(preset.dias)}
                  className={`min-h-[48px] px-4 rounded-xl font-bold text-sm border-2 transition-all ${
                    diasCredito === preset.dias
                      ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                      : 'border-blue-200 bg-white text-blue-900 hover:bg-blue-100'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-blue-800">
              Esta compra originará automáticamente un pasivo en el módulo de <strong>Cuentas por Pagar</strong> con vencimiento en {diasCredito} días.
            </p>
          </div>
        )}

        {/* Aviso si es CONTADO */}
        {formaPago === 'CONTADO' && (
          <div data-testid="panel-contado-aviso" className="mt-5 p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-3">
            <CheckCircle2 size={20} className="text-emerald-700 shrink-0" />
            <span>Se registrará un egreso automático en la caja registradora activa del turno por valor de <strong>${liquidacion.totalCompraCOP.toLocaleString('es-CO')}</strong>.</span>
          </div>
        )}
      </div>

      {/* 3. ASIGNACIÓN DE BODEGA / CÁMARA FRÍA */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-4">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
            <Warehouse size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Ubicación de Almacén / Cámara Fría</h3>
            <p className="text-sm text-slate-500">Destino físico donde ingresarán los lotes FEFO generados</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Cámara Fría de Destino <span className="text-rose-500">*</span>
            </label>
            <select
              data-testid="select-warehouse"
              value={bodegaDestinoId}
              onChange={(e) => handleBodegaChange(e.target.value)}
              className="w-full min-h-[48px] px-4 text-base font-semibold rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
            >
              {bodegas.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Observaciones / Novedades de Recepción
            </label>
            <input
              type="text"
              data-testid="input-observaciones"
              placeholder="Ej: Descarga normal, hielo en buen estado"
              value={observaciones}
              onChange={(e) => onChangeObservaciones(e.target.value)}
              className="w-full min-h-[48px] px-4 text-base font-medium rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
            />
          </div>
        </div>
      </div>

      {/* 4. NAVEGACIÓN Y BOTÓN GIGANTE FINAL >= 56px */}
      <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
        <button
          type="button"
          data-testid="btn-step3-prev"
          disabled={isSubmitting}
          onClick={onPrev}
          className="w-full sm:w-auto min-h-[48px] px-6 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-base transition-colors flex items-center justify-center gap-2 active:scale-95"
        >
          <ArrowLeft size={20} />
          <span>Volver a Báscula</span>
        </button>

        <button
          type="button"
          data-testid="btn-confirm-dock-receiving"
          disabled={isSubmitting}
          onClick={onSubmit}
          className="w-full sm:flex-1 h-14 min-h-[56px] px-8 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-75 disabled:cursor-wait"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={24} className="animate-spin" />
              <span>GENERANDO LOTES FEFO Y GUARDANDO...</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={24} />
              <span>✓ GUARDAR RECEPCIÓN, GENERAR LOTES FEFO Y FINALIZAR</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
