// src/views/inventory/components/dock/InvimaQualityChecklist.tsx
// Panel Sensorial Visual INVIMA para Control Organoléptico de Pescado Fresco (SPEC-050: TASK-050-02)
// Dark Glassmorphism 60-30-10, ergonomía táctil Fitts >= 48px, WCAG AAA y cálculo determinista.

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Eye,
  Activity,
  Wind,
  Hand,
  Thermometer,
  FileText,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';

export type InvimaCriterionScore = 'OPTIMO' | 'ACEPTABLE' | 'NO_CONFORME';

export interface InvimaQualityState {
  ojos: InvimaCriterionScore;
  agallas: InvimaCriterionScore;
  olor: InvimaCriterionScore;
  textura: InvimaCriterionScore;
  temperaturaPescado?: number;
  observaciones?: string;
}

export interface InvimaEvaluationResult {
  estado: 'APROBADO' | 'APROBADO_CON_OBSERVACION' | 'RECHAZADO';
  aprobado: boolean;
  observacionesSugeridas: string;
  tieneNovedad: boolean;
  conformeTemperatura: boolean;
}

export interface InvimaQualityChecklistProps {
  value?: Partial<InvimaQualityState>;
  onChange?: (state: InvimaQualityState, evaluation: InvimaEvaluationResult) => void;
  readOnly?: boolean;
  className?: string;
}

export const INITIAL_INVIMA_STATE: InvimaQualityState = {
  ojos: 'OPTIMO',
  agallas: 'OPTIMO',
  olor: 'OPTIMO',
  textura: 'OPTIMO',
  temperaturaPescado: 2.0,
  observaciones: '',
};

/**
 * Función pura determinista para evaluar el estado organoléptico INVIMA.
 * Regla regulatoria:
 * 1. Si cualquier criterio es NO_CONFORME -> RECHAZADO (no apto para consumo).
 * 2. Si ningún criterio es NO_CONFORME pero al menos uno es ACEPTABLE -> APROBADO_CON_OBSERVACION.
 * 3. Si todos son OPTIMO -> APROBADO (calidad premium exportación / retail).
 */
export function evaluateInvimaQuality(state: InvimaQualityState): InvimaEvaluationResult {
  const scores = [state.ojos, state.agallas, state.olor, state.textura];
  const tieneRechazo = scores.includes('NO_CONFORME');
  const tieneObservacion = scores.includes('ACEPTABLE');
  const temp = state.temperaturaPescado;
  const conformeTemperatura = temp === undefined || (temp >= -1.0 && temp <= 4.0);

  if (tieneRechazo) {
    return {
      estado: 'RECHAZADO',
      aprobado: false,
      tieneNovedad: true,
      conformeTemperatura,
      observacionesSugeridas:
        'Lote NO CONFORME según Decreto 561 / INVIMA. Se sugiere emitir Acta de Rechazo y Devolución Inmediata.',
    };
  }

  if (tieneObservacion || !conformeTemperatura) {
    const motivos: string[] = [];
    if (state.ojos === 'ACEPTABLE') motivos.push('ojos ligeramente opacos');
    if (state.agallas === 'ACEPTABLE') motivos.push('agallas de tono pálido');
    if (state.olor === 'ACEPTABLE') motivos.push('olor neutro de baja intensidad');
    if (state.textura === 'ACEPTABLE') motivos.push('textura con leve pérdida de firmeza');
    if (!conformeTemperatura && temp !== undefined) {
      motivos.push(`temperatura fuera de rango (${temp}°C)`);
    }

    return {
      estado: 'APROBADO_CON_OBSERVACION',
      aprobado: true,
      tieneNovedad: true,
      conformeTemperatura,
      observacionesSugeridas: `Aprobado con observación técnica (${motivos.join(', ')}). Priorizar para venta inmediata.`,
    };
  }

  return {
    estado: 'APROBADO',
    aprobado: true,
    tieneNovedad: false,
    conformeTemperatura: true,
    observacionesSugeridas: 'Pescado fresco en óptimas condiciones organolépticas (apto para almacenamiento FEFO).',
  };
}

interface CriterionConfig {
  id: keyof Pick<InvimaQualityState, 'ojos' | 'agallas' | 'olor' | 'textura'>;
  label: string;
  icon: React.ReactNode;
  options: {
    score: InvimaCriterionScore;
    label: string;
    description: string;
  }[];
}

const CRITERIA_CONFIG: CriterionConfig[] = [
  {
    id: 'ojos',
    label: 'Ojos / Pupilas',
    icon: <Eye className="w-5 h-5 text-cyan-400" />,
    options: [
      {
        score: 'OPTIMO',
        label: 'Salientes y Brillantes',
        description: 'Pupilas negras intensas y córnea transparente',
      },
      {
        score: 'ACEPTABLE',
        label: 'Ligeramente Planos',
        description: 'Pupila opalescente, leve pérdida de brillo',
      },
      {
        score: 'NO_CONFORME',
        label: 'Hundidos y Opacos',
        description: 'Córnea turbia o lechosa (Rechazo normativo)',
      },
    ],
  },
  {
    id: 'agallas',
    label: 'Agallas / Branquias',
    icon: <Activity className="w-5 h-5 text-rose-400" />,
    options: [
      {
        score: 'OPTIMO',
        label: 'Rojo Vivo Brillante',
        description: 'Laminillas separadas, baba transparente y limpia',
      },
      {
        score: 'ACEPTABLE',
        label: 'Pálidas o Rosadas',
        description: 'Pérdida moderada de pigmento, sin mucosidad turbia',
      },
      {
        score: 'NO_CONFORME',
        label: 'Pardas / Amarillentas',
        description: 'Mucosidad densa o fétida (Rechazo normativo)',
      },
    ],
  },
  {
    id: 'olor',
    label: 'Olor Característico',
    icon: <Wind className="w-5 h-5 text-emerald-400" />,
    options: [
      {
        score: 'OPTIMO',
        label: 'Fresco a Mar / Algas',
        description: 'Aroma fresco, limpio y característico de la especie',
      },
      {
        score: 'ACEPTABLE',
        label: 'Neutro sin Notas',
        description: 'Ausencia de olor a algas, sin notas de descomposición',
      },
      {
        score: 'NO_CONFORME',
        label: 'Amoniacal / Rancio',
        description: 'Olor agrio, fétido o putrefacto (Rechazo normativo)',
      },
    ],
  },
  {
    id: 'textura',
    label: 'Textura / Elasticidad',
    icon: <Hand className="w-5 h-5 text-amber-400" />,
    options: [
      {
        score: 'OPTIMO',
        label: 'Firme y Elástica',
        description: 'La huella digital desaparece de inmediato, escamas firmes',
      },
      {
        score: 'ACEPTABLE',
        label: 'Levemente Blanda',
        description: 'Recupera lentamente tras presión táctil',
      },
      {
        score: 'NO_CONFORME',
        label: 'Flácida / Deja Huella',
        description: 'Carne blanda, piel se rasga, escamas sueltas',
      },
    ],
  },
];

export const InvimaQualityChecklist: React.FC<InvimaQualityChecklistProps> = ({
  value,
  onChange,
  readOnly = false,
  className = '',
}) => {
  const [internalState, setInternalState] = useState<InvimaQualityState>(() => ({
    ...INITIAL_INVIMA_STATE,
    ...value,
  }));

  // Sincronizar cambios externos de value si aplican
  useEffect(() => {
    if (value) {
      setInternalState((prev) => ({
        ...prev,
        ...value,
      }));
    }
  }, [value]);

  const evaluation = useMemo(() => evaluateInvimaQuality(internalState), [internalState]);

  const updateCriterion = (
    criterion: keyof Pick<InvimaQualityState, 'ojos' | 'agallas' | 'olor' | 'textura'>,
    score: InvimaCriterionScore
  ) => {
    if (readOnly) return;
    const nextState: InvimaQualityState = {
      ...internalState,
      [criterion]: score,
    };
    setInternalState(nextState);
    const nextEval = evaluateInvimaQuality(nextState);
    onChange?.(nextState, nextEval);
  };

  const handleTemperatureChange = (valStr: string) => {
    if (readOnly) return;
    const num = parseFloat(valStr);
    const nextState: InvimaQualityState = {
      ...internalState,
      temperaturaPescado: isNaN(num) ? undefined : num,
    };
    setInternalState(nextState);
    const nextEval = evaluateInvimaQuality(nextState);
    onChange?.(nextState, nextEval);
  };

  const handleObservacionesChange = (obs: string) => {
    if (readOnly) return;
    const nextState: InvimaQualityState = {
      ...internalState,
      observaciones: obs,
    };
    setInternalState(nextState);
    const nextEval = evaluateInvimaQuality(nextState);
    onChange?.(nextState, nextEval);
  };

  // UI del Dictamen General
  const verdictConfig = {
    APROBADO: {
      title: 'APROBADO (CALIDAD ÓPTIMA)',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-950/40',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      subtext: 'Lote apto para almacenamiento en cuartos fríos y rotación FEFO.',
    },
    APROBADO_CON_OBSERVACION: {
      title: 'APROBADO CON OBSERVACIÓN',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-amber-950/40',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
      subtext: 'Presenta leve desviación organoléptica o térmica. Priorizar venta o despiece.',
    },
    RECHAZADO: {
      title: 'RECHAZADO (NO CONFORME)',
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-rose-950/40',
      icon: <XCircle className="w-5 h-5 text-rose-400" />,
      subtext: 'Incumple estándares de sanidad pesquera. Retener y emitir acta de devolución.',
    },
  }[evaluation.estado];

  return (
    <div
      data-testid="invima-quality-checklist"
      className={`bg-[#131C2E]/80 backdrop-blur-2xl border border-slate-800/90 rounded-2xl p-5 shadow-2xl shadow-cyan-950/20 space-y-6 ${className}`}
    >
      {/* ── 1. Encabezado Normativo y Dictamen ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
              Control Sensorial Organoléptico INVIMA
            </h3>
            <p className="text-xs text-slate-400">
              Evaluación reglamentaria de frescura en muelle según estándares sanitarios
            </p>
          </div>
        </div>

        {/* Badge Dictamen Final */}
        <div className="flex flex-col items-end w-full sm:w-auto">
          <div
            data-testid="invima-verdict-badge"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black font-mono border shadow-lg ${verdictConfig.badgeClass}`}
          >
            {verdictConfig.icon}
            <span>{verdictConfig.title}</span>
          </div>
        </div>
      </div>

      {/* ── 2. Mensaje Guía del Dictamen ── */}
      <div
        className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
          evaluation.estado === 'RECHAZADO'
            ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
            : evaluation.estado === 'APROBADO_CON_OBSERVACION'
            ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
            : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
        }`}
      >
        <div className="mt-0.5 shrink-0">{verdictConfig.icon}</div>
        <div className="text-xs sm:text-sm">
          <p className="font-bold">{evaluation.observacionesSugeridas}</p>
          <p className="text-[11px] opacity-80 mt-0.5">{verdictConfig.subtext}</p>
        </div>
      </div>

      {/* ── 3. Grid de los 4 Criterios Sensoriales ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CRITERIA_CONFIG.map((crit) => {
          const currentScore = internalState[crit.id];

          return (
            <div
              key={crit.id}
              className="bg-[#0B0F19]/70 border border-slate-800/80 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-800/60">{crit.icon}</div>
                  <span className="text-sm font-bold text-slate-200">{crit.label}</span>
                </div>
                <span className="text-[11px] font-mono font-bold text-slate-400 uppercase">
                  {currentScore}
                </span>
              </div>

              {/* Botones Semafóricos Táctiles >= 48px */}
              <div className="grid grid-cols-3 gap-2">
                {crit.options.map((opt) => {
                  const isSelected = currentScore === opt.score;
                  let selectedClasses = '';

                  if (isSelected) {
                    if (opt.score === 'OPTIMO') {
                      selectedClasses =
                        'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-md shadow-emerald-950/50 ring-1 ring-emerald-500/50';
                    } else if (opt.score === 'ACEPTABLE') {
                      selectedClasses =
                        'bg-amber-500/20 text-amber-300 border-amber-500 shadow-md shadow-amber-950/50 ring-1 ring-amber-500/50';
                    } else {
                      selectedClasses =
                        'bg-rose-500/20 text-rose-300 border-rose-500 shadow-md shadow-rose-950/50 ring-1 ring-rose-500/50';
                    }
                  } else {
                    selectedClasses =
                      'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800/60 hover:text-slate-200';
                  }

                  return (
                    <button
                      key={opt.score}
                      type="button"
                      disabled={readOnly}
                      data-testid={`invima-${crit.id}-${opt.score}`}
                      onClick={() => updateCriterion(crit.id, opt.score)}
                      className={`min-h-[48px] p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all active:scale-[0.98] ${selectedClasses} ${
                        readOnly ? 'cursor-default opacity-80' : 'cursor-pointer'
                      }`}
                    >
                      <span className="text-xs font-black truncate">{opt.label}</span>
                      <span className="text-[10px] opacity-75 line-clamp-2 leading-tight mt-1">
                        {opt.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 4. Control de Temperatura Central & Observaciones Adicionales ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {/* Input Temperatura Producto */}
        <div className="bg-[#0B0F19]/70 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-cyan-400" />
              Temp. Pescado (°C)
            </span>
            <span className="text-[10px] font-mono text-cyan-400 font-bold">Norma: 0°C a 4°C</span>
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              data-testid="invima-temperatura-input"
              disabled={readOnly}
              value={internalState.temperaturaPescado ?? ''}
              onChange={(e) => handleTemperatureChange(e.target.value)}
              placeholder="ej. 1.5"
              className="w-full min-h-[44px] px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-lg text-slate-100 font-mono font-bold text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {!evaluation.conformeTemperatura && (
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-1.5 text-rose-300 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Alerta Cadena de Frío</p>
                <p>Temperatura fuera de rango (&gt; 4°C) según normativa sanitaria.</p>
              </div>
            </div>
          )}
        </div>

        {/* Textarea de Observaciones Técnicas */}
        <div className="md:col-span-2 bg-[#0B0F19]/70 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-slate-400" />
            Observaciones Organolépticas de Muelle
          </label>
          <textarea
            rows={2}
            data-testid="invima-observaciones-textarea"
            disabled={readOnly}
            value={internalState.observaciones ?? ''}
            onChange={(e) => handleObservacionesChange(e.target.value)}
            placeholder="Novedades de la inspección, estado del hielo, olor en el furgón, etc..."
            className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-cyan-500 resize-none"
          />
        </div>
      </div>
    </div>
  );
};

