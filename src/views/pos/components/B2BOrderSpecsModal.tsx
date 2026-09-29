import React, { useState } from 'react';
import { X, Scissors, Package, Thermometer, Info, Scale, Check } from 'lucide-react';
import {
  ModalidadVenta,
  TipoCorte,
  TipoEmpaque,
  B2BOrderLineSpecs,
  CatchWeightConfig
} from '../../../../packages/validation-schemas/src/b2bDispatch.schema';

interface B2BOrderSpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
  productoNombre: string;
  initialValues?: {
    modalidad?: ModalidadVenta;
    piezasSolicitadas?: number;
    calibreMinGramos?: number;
    calibreMaxGramos?: number;
    corte?: TipoCorte;
    empaque?: TipoEmpaque;
    temperaturaObjetivoC?: number;
    notasAlistamiento?: string;
  };
  onSave: (specs: {
    modalidad: ModalidadVenta;
    piezasSolicitadas?: number;
    calibreMinGramos?: number;
    calibreMaxGramos?: number;
    pesoEstimadoNominalKg?: number;
    corte: TipoCorte;
    empaque: TipoEmpaque;
    temperaturaObjetivoC: number;
    notasAlistamiento?: string;
  }) => void;
}

const CORTES: { id: TipoCorte; label: string; desc: string }[] = [
  { id: 'entero', label: 'Entero', desc: 'Pescado entero sin cortes' },
  { id: 'eviscerado', label: 'Eviscerado', desc: 'Limpio sin vísceras ni agallas' },
  { id: 'filete_sin_piel', label: 'Filete Sin Piel', desc: 'Deshuesado y desollado limpio' },
  { id: 'filete_con_piel', label: 'Filete Con Piel', desc: 'Escamado con piel protectora' },
  { id: 'posta', label: 'Postas / Rodajas', desc: 'Cortes transversales con hueso' },
  { id: 'mariposa', label: 'Mariposa', desc: 'Abierto en libro para asar/freír' },
  { id: 'porciones', label: 'Porcionado', desc: 'Gramaje exacto porción individual' },
];

const EMPAQUES: { id: TipoEmpaque; label: string; desc: string }[] = [
  { id: 'hielo', label: 'Con Hielo en Caja', desc: 'Caja térmica de poliestireno' },
  { id: 'vacio', label: 'Al Vacío', desc: 'Bolsa termoencogible sellada' },
  { id: 'canastilla', label: 'Canastilla Plástica', desc: 'Retornable para despacho local' },
  { id: 'granel', label: 'A Granel', desc: 'Empaque estándar en funda plástica' },
  { id: 'atmosfera_modificada', label: 'Atmósfera Modificada', desc: 'Gas inerte para larga vida' },
];

export const B2BOrderSpecsModal: React.FC<B2BOrderSpecsModalProps> = ({
  isOpen,
  onClose,
  productoNombre,
  initialValues,
  onSave,
}) => {
  const [modalidad, setModalidad] = useState<ModalidadVenta>(initialValues?.modalidad || 'PESO_DIRECTO');
  const [piezas, setPiezas] = useState<number>(initialValues?.piezasSolicitadas || 5);
  const [calibreMin, setCalibreMin] = useState<number>(initialValues?.calibreMinGramos || 450);
  const [calibreMax, setCalibreMax] = useState<number>(initialValues?.calibreMaxGramos || 500);
  const [corte, setCorte] = useState<TipoCorte>(initialValues?.corte || 'entero');
  const [empaque, setEmpaque] = useState<TipoEmpaque>(initialValues?.empaque || 'hielo');
  const [temperatura, setTemperatura] = useState<number>(initialValues?.temperaturaObjetivoC ?? 2.0);
  const [notas, setNotas] = useState<string>(initialValues?.notasAlistamiento || '');

  if (!isOpen) return null;

  // Cálculo del peso nominal estimado en caso de Catch Weight
  const pesoEstimadoKg = modalidad === 'CATCH_WEIGHT_PIEZAS' && piezas > 0 && calibreMin > 0 && calibreMax >= calibreMin
    ? Number(((piezas * ((calibreMin + calibreMax) / 2)) / 1000).toFixed(3))
    : undefined;

  const handleSave = () => {
    onSave({
      modalidad,
      piezasSolicitadas: modalidad === 'CATCH_WEIGHT_PIEZAS' ? piezas : undefined,
      calibreMinGramos: modalidad === 'CATCH_WEIGHT_PIEZAS' ? calibreMin : undefined,
      calibreMaxGramos: modalidad === 'CATCH_WEIGHT_PIEZAS' ? calibreMax : undefined,
      pesoEstimadoNominalKg: pesoEstimadoKg,
      corte,
      empaque,
      temperaturaObjetivoC: temperatura,
      notasAlistamiento: notas.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl p-6 text-white overflow-hidden">
        
        {/* Encabezado */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Especificaciones de Alistamiento B2B</h3>
              <p className="text-xs text-slate-400 truncate max-w-md">{productoNombre}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-6 max-h-[75vh] overflow-y-auto pr-1">
          
          {/* Modalidad de Venta */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Modalidad de Venta & Facturación
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setModalidad('PESO_DIRECTO')}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  modalidad === 'PESO_DIRECTO'
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-600'
                }`}
              >
                <Scale className={`w-5 h-5 mt-0.5 ${modalidad === 'PESO_DIRECTO' ? 'text-blue-400' : 'text-slate-500'}`} />
                <div>
                  <div className="font-semibold text-sm">Venta por Peso Directo (KG)</div>
                  <div className="text-xs text-slate-400 mt-0.5">El cliente pide una cantidad exacta en kilos.</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setModalidad('CATCH_WEIGHT_PIEZAS')}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  modalidad === 'CATCH_WEIGHT_PIEZAS'
                    ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-600'
                }`}
              >
                <Package className={`w-5 h-5 mt-0.5 ${modalidad === 'CATCH_WEIGHT_PIEZAS' ? 'text-emerald-400' : 'text-slate-500'}`} />
                <div>
                  <div className="font-semibold text-sm">Catch Weight (Unidades + Calibre)</div>
                  <div className="text-xs text-slate-400 mt-0.5">Ej: 5 truchas de 450-500g y se factura el peso real.</div>
                </div>
              </button>
            </div>
          </div>

          {/* Subpanel de Catch Weight Dual */}
          {modalidad === 'CATCH_WEIGHT_PIEZAS' && (
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <Info className="w-4 h-4" />
                Parámetros de Calibre y Unidades Solicitadas
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Piezas / Unidades</label>
                  <input
                    type="number"
                    min="1"
                    value={piezas}
                    onChange={(e) => setPiezas(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-medium focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Calibre Mínimo (g)</label>
                  <input
                    type="number"
                    min="50"
                    step="10"
                    value={calibreMin}
                    onChange={(e) => setCalibreMin(Math.max(10, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-medium focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Calibre Máximo (g)</label>
                  <input
                    type="number"
                    min={calibreMin}
                    step="10"
                    value={calibreMax}
                    onChange={(e) => setCalibreMax(Math.max(calibreMin, parseFloat(e.target.value) || calibreMin))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-medium focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>

              {pesoEstimadoKg && (
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-900/30 border border-emerald-500/20 text-xs text-emerald-300">
                  <span>Peso promedio proyectado: <strong>{Math.round((calibreMin + calibreMax) / 2)} g/pieza</strong></span>
                  <span>Peso estimado total: <strong className="text-white text-sm">{pesoEstimadoKg} KG</strong></span>
                </div>
              )}
            </div>
          )}

          {/* Especificaciones de Corte */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Tipo de Corte Requerido
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CORTES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCorte(c.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    corte === c.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-white'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <div className="text-xs font-semibold flex items-center justify-between">
                    {c.label}
                    {corte === c.id && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">{c.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Tipo de Empaque */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Tipo de Empaque
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EMPAQUES.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setEmpaque(e.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    empaque === e.id
                      ? 'bg-amber-500/20 border-amber-400 text-white'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <div className="text-xs font-semibold flex items-center justify-between">
                    {e.label}
                    {empaque === e.id && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">{e.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Control de Frío y Notas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-cyan-400" />
                Temperatura Objetivo (°C)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTemperatura(2.0)}
                  className={`flex-1 py-1.5 text-xs rounded-lg border font-medium ${
                    temperatura >= 0 && temperatura <= 4
                      ? 'bg-cyan-600/30 border-cyan-400 text-cyan-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Fresco (0° a 4°C)
                </button>
                <button
                  type="button"
                  onClick={() => setTemperatura(-18.0)}
                  className={`flex-1 py-1.5 text-xs rounded-lg border font-medium ${
                    temperatura < 0
                      ? 'bg-indigo-600/30 border-indigo-400 text-indigo-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Congelado (-18°C)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Notas Especiales de Alistamiento
              </label>
              <input
                type="text"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej. 'Porciones sin espina para tartar'"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

        </div>

        {/* Botones de Acción */}
        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 transition-all"
          >
            Aplicar Especificaciones
          </button>
        </div>

      </div>
    </div>
  );
};
