import React, { useState, useMemo } from 'react';
import { X, Scale, Thermometer, ShieldAlert, CheckCircle2, AlertTriangle, Layers, Delete } from 'lucide-react';
import {
  validateWeightTolerance,
  validateCalibrePieceWeight,
  calculateCatchWeightTotal,
  ModalidadVenta,
  TipoCorte,
  TipoEmpaque
} from '../../../../packages/validation-schemas/src/b2bDispatch.schema';

interface WeightPackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    lineaPedidoId: string;
    productoId: string;
    productoNombre: string;
    sku?: string;
    modalidad?: ModalidadVenta;
    pesoNominalKg: number;
    piezasSolicitadas?: number;
    calibreMinGramos?: number;
    calibreMaxGramos?: number;
    precioUnitarioPactado: number;
    corte?: TipoCorte;
    empaque?: TipoEmpaque;
    loteSugerido?: string;
    toleranciaPorcentaje?: number;
  };
  onConfirm: (data: {
    lineaPedidoId: string;
    pesoRealKg: number;
    piezasAlistadas?: number;
    subtotalAjustado: number;
    temperaturaC: number;
    loteFefo: string;
    observaciones?: string;
  }) => void;
}

export const WeightPackingModal: React.FC<WeightPackingModalProps> = ({
  isOpen,
  onClose,
  item,
  onConfirm,
}) => {
  const [pesoInput, setPesoInput] = useState<string>('');
  const [piezasInput, setPiezasInput] = useState<string>(item.piezasSolicitadas?.toString() || '1');
  const [temperaturaInput, setTemperaturaInput] = useState<string>('2.0');
  const [loteFefo, setLoteFefo] = useState<string>(item.loteSugerido || `LOTE-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [autorizadoExceso, setAutorizadoExceso] = useState<boolean>(false);
  const [observaciones, setObservaciones] = useState<string>('');

  if (!isOpen) return null;

  const pesoRealNum = parseFloat(pesoInput) || 0;
  const piezasNum = parseInt(piezasInput) || 1;
  const tempNum = parseFloat(temperaturaInput) || 2.0;
  const tolPct = item.toleranciaPorcentaje || 10;

  // Cálculo reactivo de tolerancia
  const toleranceResult = useMemo(() => {
    return validateWeightTolerance(item.pesoNominalKg, pesoRealNum, tolPct);
  }, [item.pesoNominalKg, pesoRealNum, tolPct]);

  // Validación reactiva de calibre
  const calibreResult = useMemo(() => {
    if (item.modalidad === 'CATCH_WEIGHT_PIEZAS') {
      return validateCalibrePieceWeight(pesoRealNum, piezasNum, item.calibreMinGramos, item.calibreMaxGramos);
    }
    return null;
  }, [item.modalidad, pesoRealNum, piezasNum, item.calibreMinGramos, item.calibreMaxGramos]);

  const subtotalCalculado = calculateCatchWeightTotal(pesoRealNum, item.precioUnitarioPactado);

  // Teclado numérico táctil
  const handleKeypadPress = (val: string) => {
    if (val === 'CLEAR') {
      setPesoInput('');
    } else if (val === 'BACK') {
      setPesoInput((prev) => prev.slice(0, -1));
    } else if (val === '.') {
      if (!pesoInput.includes('.')) {
        setPesoInput((prev) => (prev ? prev + '.' : '0.'));
      }
    } else {
      if (pesoInput === '0') {
        setPesoInput(val);
      } else {
        setPesoInput((prev) => prev + val);
      }
    }
  };

  const puedeConfirmar =
    pesoRealNum > 0 &&
    loteFefo.trim().length > 0 &&
    (toleranceResult.isWithinTolerance || autorizadoExceso);

  const handleConfirm = () => {
    if (!puedeConfirmar) return;
    onConfirm({
      lineaPedidoId: item.lineaPedidoId,
      pesoRealKg: pesoRealNum,
      piezasAlistadas: item.modalidad === 'CATCH_WEIGHT_PIEZAS' ? piezasNum : undefined,
      subtotalAjustado: subtotalCalculado,
      temperaturaC: tempNum,
      loteFefo: loteFefo.trim(),
      observaciones: observaciones.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6 text-white overflow-hidden">
        
        {/* Encabezado */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Báscula y Conciliación de Packing</h3>
                {item.modalidad === 'CATCH_WEIGHT_PIEZAS' && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Catch Weight Dual
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {item.productoNombre} {item.sku ? `(${item.sku})` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Columna Izquierda: Visor Báscula + Teclado Táctil */}
          <div className="md:col-span-7 space-y-4">
            
            {/* Visor Gigante de Báscula */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>PESO EN BÁSCULA (KG)</span>
                <span>Nominal: <strong className="text-white">{item.pesoNominalKg.toFixed(3)} KG</strong></span>
              </div>

              <div className="py-2 flex items-baseline justify-end gap-2">
                <span className="text-4xl md:text-5xl font-mono font-bold tracking-tight text-emerald-400 tabular-nums">
                  {pesoInput || '0.000'}
                </span>
                <span className="text-lg font-bold text-slate-500">KG</span>
              </div>

              {/* Barra de Tolerancia */}
              {pesoRealNum > 0 && (
                <div className={`mt-2 p-2 rounded-xl text-xs flex items-center justify-between border ${
                  toleranceResult.isWithinTolerance
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}>
                  <div className="flex items-center gap-1.5">
                    {toleranceResult.isWithinTolerance ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                    )}
                    <span>
                      Variación: <strong>{toleranceResult.variancePercent > 0 ? `+${toleranceResult.variancePercent}` : toleranceResult.variancePercent}%</strong> ({toleranceResult.diffKg > 0 ? `+${toleranceResult.diffKg}` : toleranceResult.diffKg} kg)
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold">
                    {toleranceResult.isWithinTolerance ? 'Dentro de Tolerancia ±10%' : 'FUERA DE TOLERANCIA'}
                  </span>
                </div>
              )}
            </div>

            {/* Teclado Numérico Táctil */}
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'BACK'].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleKeypadPress(key)}
                  className={`h-12 rounded-xl font-mono text-lg font-semibold flex items-center justify-center transition-all ${
                    key === 'BACK'
                      ? 'bg-slate-800 text-rose-400 hover:bg-slate-700 active:scale-95'
                      : 'bg-slate-800/80 text-white border border-white/5 hover:bg-slate-700 active:scale-95'
                  }`}
                >
                  {key === 'BACK' ? <Delete className="w-5 h-5" /> : key}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPesoInput(item.pesoNominalKg.toString())}
                className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-slate-800 text-blue-300 hover:bg-slate-700 border border-blue-500/20"
              >
                Copiar Peso Nominal ({item.pesoNominalKg} kg)
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('CLEAR')}
                className="py-2 px-4 text-xs font-semibold rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700"
              >
                Limpiar
              </button>
            </div>

          </div>

          {/* Columna Derecha: Parámetros de Calibre, FEFO, Cadena de Frío y Resumen */}
          <div className="md:col-span-5 space-y-4">
            
            {/* Panel Catch Weight de Piezas y Calibre */}
            {item.modalidad === 'CATCH_WEIGHT_PIEZAS' && (
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-3">
                <div className="text-xs font-bold text-emerald-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    Piezas y Calibre Solicitado
                  </span>
                  <span className="text-slate-300 font-normal">
                    {item.calibreMinGramos || 0}g - {item.calibreMaxGramos || 0}g / pieza
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-xs text-slate-300">Piezas Físicas:</label>
                  <input
                    type="number"
                    min="1"
                    value={piezasInput}
                    onChange={(e) => setPiezasInput(e.target.value)}
                    className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-center font-bold text-sm"
                  />
                  {calibreResult && (
                    <div className="text-xs text-slate-300 flex-1 text-right">
                      Promedio: <strong className="text-white font-mono">{calibreResult.pesoPromedioGramos} g/und</strong>
                    </div>
                  )}
                </div>

                {calibreResult && (
                  <div className={`p-2 rounded-lg text-[11px] flex items-center gap-1.5 ${
                    calibreResult.isWithinCalibre
                      ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-900/40 text-amber-300 border border-amber-500/30'
                  }`}>
                    {calibreResult.isWithinCalibre ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>{calibreResult.isWithinCalibre ? 'Calibre Verificado Correcto ✅' : calibreResult.motivo}</span>
                  </div>
                )}
              </div>
            )}

            {/* Trazabilidad FEFO y Cadena de Frío */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Lote FEFO Asignado <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={loteFefo}
                  onChange={(e) => setLoteFefo(e.target.value)}
                  placeholder="Ej. LOTE-2026-09-001"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-cyan-400" />
                  Temperatura Producto / Cuarto Frío (°C) <span className="text-rose-400">*</span>
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    step="0.1"
                    value={temperaturaInput}
                    onChange={(e) => setTemperaturaInput(e.target.value)}
                    className="w-24 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-center font-bold text-sm focus:ring-2 focus:ring-cyan-500"
                  />
                  <div className="flex gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setTemperaturaInput('2.0')}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/20"
                    >
                      Fresco (2°C)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTemperaturaInput('-18.0')}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/20"
                    >
                      Congelado (-18°C)
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Observaciones de Empaque
                </label>
                <input
                  type="text"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Ej. 'Caja sellada con doble cincho'"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>
            </div>

            {/* Checkbox de autorización si excede tolerancia */}
            {!toleranceResult.isWithinTolerance && pesoRealNum > 0 && (
              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-2">
                <div className="text-xs text-rose-300 flex items-center gap-1.5 font-semibold">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  Requiere Autorización de Supervisor
                </div>
                <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={autorizadoExceso}
                    onChange={(e) => setAutorizadoExceso(e.target.checked)}
                    className="mt-0.5 rounded border-rose-500 text-rose-600 focus:ring-rose-500"
                  />
                  <span>Confirmo que el cliente aprobó la variación de peso de {toleranceResult.variancePercent}%.</span>
                </label>
              </div>
            )}

            {/* Resumen Financiero Recalculado */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Precio Unitario Acordado:</span>
                <span className="font-mono text-slate-200">${item.precioUnitarioPactado.toLocaleString('es-CO')} / kg</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Facturado Real:</span>
                <span className="font-mono font-bold text-base text-emerald-400">
                  ${subtotalCalculado.toLocaleString('es-CO')} COP
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* Acciones */}
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
            disabled={!puedeConfirmar}
            onClick={handleConfirm}
            className={`px-5 py-2 text-xs font-bold rounded-xl text-white transition-all shadow-lg ${
              puedeConfirmar
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
            }`}
          >
            Confirmar Pesaje & Empaque
          </button>
        </div>

      </div>
    </div>
  );
};
