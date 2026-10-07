import React, { useState } from 'react';
import { X, Scale, Sparkles, Check, AlertCircle } from 'lucide-react';
import { LineaPedido } from '../../../types/orders.types';
import { Producto } from '../../../types/inventory.types';
import { useBalanza } from '../../../hooks/useBalanza';

interface WeighingModalProps {
  isOpen: boolean;
  onClose: () => void;
  linea: LineaPedido;
  producto: Producto;
  onConfirm: (pesoReal: number, loteSeleccionado?: string) => void;
}

const TARA_PRESETS = [
  { label: 'Sin Tara (0 kg)', value: 0 },
  { label: 'Caja Icopor (-0.5 kg)', value: 0.5 },
  { label: 'Canastilla (-2.0 kg)', value: 2.0 },
];

export const WeighingModal: React.FC<WeighingModalProps> = ({
  isOpen,
  onClose,
  linea,
  producto,
  onConfirm,
}) => {
  const { leerPeso, reading, error: balanzaError } = useBalanza();
  const [pesoBruto, setPesoBruto] = useState<string>(linea.pesoReal?.toString() || '');
  const [taraSeleccionada, setTaraSeleccionada] = useState<number>(0);
  const [lote, setLote] = useState<string>(
    linea.loteSeleccionado || `LOT-BCM-${producto.sku || 'PES'}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`
  );

  if (!isOpen) return null;

  const pesoBrutoNum = parseFloat(pesoBruto) || 0;
  const pesoNetoCalculado = Math.max(0, Number((pesoBrutoNum - taraSeleccionada).toFixed(2)));

  const handleCapturarBalanza = async () => {
    try {
      const pesoLeido = await leerPeso();
      if (pesoLeido > 0) {
        setPesoBruto(pesoLeido.toFixed(2));
      }
    } catch {
      // Si la balanza no responde, permite captura manual
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pesoNetoCalculado > 0) {
      onConfirm(pesoNetoCalculado, lote.trim() || undefined);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex justify-center items-center p-4 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen text-center w-full">
        <div className="fixed inset-0 transition-opacity" onClick={onClose} />

        <div className="relative inline-block w-full max-w-lg p-6 sm:p-8 overflow-hidden text-left align-middle transition-all transform bg-slate-900 border border-white/10 shadow-2xl rounded-3xl text-white">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-500/30">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Pesaje de Producto</h3>
                <p className="text-xs text-slate-400">La Regla de los 12 Años: Tara y Báscula en 1 toque</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 mt-5">
            {/* Resumen del Producto */}
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/5 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-base">{producto.nombre}</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  SKU: <span className="font-mono text-cyan-400">{producto.sku}</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Solicitado</span>
                <span className="text-lg font-black text-emerald-400">
                  {linea.cantidadSolicitada} {producto.unidadMedida}
                </span>
              </div>
            </div>

            {/* Botón de Captura Báscula Serial */}
            <div>
              <button
                type="button"
                onClick={handleCapturarBalanza}
                disabled={reading}
                className="w-full min-h-[52px] px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 active:scale-[0.98] text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3 transition-all"
              >
                <Scale className={`w-5 h-5 ${reading ? 'animate-bounce' : ''}`} />
                <span>{reading ? 'Leyendo Báscula Digital...' : '⚖️ Capturar Peso de Báscula'}</span>
              </button>
              {balanzaError && (
                <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Balanza no conectada: Ingrese el peso bruto manualmente abajo.
                </p>
              )}
            </div>

            {/* Presets de Tara */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Descontar Tara de Envase:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {TARA_PRESETS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTaraSeleccionada(t.value)}
                    className={`min-h-[48px] py-2 px-2 text-xs font-bold rounded-xl border transition-all text-center flex flex-col items-center justify-center ${
                      taraSeleccionada === t.value
                        ? 'bg-blue-600/30 border-blue-400 text-white shadow-md'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs de Peso Bruto y Resultado Neto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Peso Bruto Báscula (kg):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={pesoBruto}
                    onChange={(e) => setPesoBruto(e.target.value)}
                    className="w-full min-h-[50px] pl-4 pr-12 py-2 bg-slate-950 border border-slate-700 rounded-2xl text-white text-xl font-black text-center focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                    placeholder="0.00"
                    autoFocus
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400 font-bold text-sm">
                    KG
                  </div>
                </div>
              </div>

              {/* Indicador de Peso Neto Calculado */}
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex flex-col justify-center items-center text-center">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Peso Neto a Facturar:
                </span>
                <span className="text-2xl font-black text-emerald-300 font-mono mt-0.5">
                  {pesoNetoCalculado.toFixed(2)} kg
                </span>
                {taraSeleccionada > 0 && (
                  <span className="text-[10px] text-emerald-400/80">
                    (Bruto: {pesoBrutoNum.toFixed(2)} - Tara: {taraSeleccionada} kg)
                  </span>
                )}
              </div>
            </div>

            {/* Trazabilidad Lote FEFO */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Lote FEFO Trazable (Bucaramanga):</span>
                <span className="text-[10px] text-cyan-400 font-normal">Requerido Sanitario</span>
              </label>
              <input
                type="text"
                value={lote}
                onChange={(e) => setLote(e.target.value)}
                className="w-full min-h-[46px] px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:ring-2 focus:ring-cyan-500 transition-all"
                placeholder="LOT-BCM-..."
              />
            </div>

            {/* Acciones */}
            <div className="pt-3 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 min-h-[52px] px-4 py-3 text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-2xl font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={pesoNetoCalculado <= 0}
                className="flex-1 min-h-[52px] px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                <span>Confirmar Peso</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
