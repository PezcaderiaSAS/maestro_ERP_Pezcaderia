import React from 'react';
import {
  Thermometer,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Snowflake
} from 'lucide-react';
import { evaluarSemaforoTermico } from '../../../../packages/validation-schemas/src/dockPurchasesReceiving.schema';

interface Props {
  temperatura: number;
  tipoProducto?: 'FRESCO' | 'CONGELADO';
  className?: string;
}

export const ThermalTrafficLightBadge: React.FC<Props> = ({
  temperatura,
  tipoProducto = 'FRESCO',
  className = ''
}) => {
  const evaluacion = evaluarSemaforoTermico(temperatura, tipoProducto);

  const styleConfig = {
    emerald: {
      container: 'bg-emerald-50 border-emerald-300 text-emerald-950',
      badge: 'bg-emerald-600 text-white',
      iconColor: 'text-emerald-700',
      Icon: CheckCircle2,
      titulo: 'TEMPERATURA ÓPTIMA'
    },
    amber: {
      container: 'bg-amber-50 border-amber-300 text-amber-950',
      badge: 'bg-amber-600 text-white',
      iconColor: 'text-amber-700',
      Icon: AlertTriangle,
      titulo: 'PRECAUCIÓN SANITARIA'
    },
    rose: {
      container: 'bg-rose-50 border-rose-300 text-rose-950',
      badge: 'bg-rose-600 text-white',
      iconColor: 'text-rose-700',
      Icon: AlertOctagon,
      titulo: 'ALERTA CRÍTICA DE INOCUIDAD'
    }
  }[evaluacion.color];

  const IconComponent = styleConfig.Icon;

  return (
    <div
      data-testid="thermal-traffic-light-badge"
      className={`rounded-2xl border-2 p-4 transition-all duration-200 shadow-sm ${styleConfig.container} ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl bg-white/80 border border-current/10 shadow-xs ${styleConfig.iconColor}`}>
            {tipoProducto === 'CONGELADO' ? <Snowflake size={24} /> : <Thermometer size={24} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${styleConfig.badge}`}>
                {styleConfig.titulo}
              </span>
              <span className="text-xs font-semibold opacity-75">
                {tipoProducto === 'CONGELADO' ? 'Congelados (-18°C)' : 'Pescado Fresco (≤ 4°C)'}
              </span>
            </div>
            <p className="text-sm font-semibold mt-1 leading-snug">
              {evaluacion.mensaje}
            </p>
          </div>
        </div>

        <div className="flex items-baseline gap-1 self-end sm:self-center bg-white/90 px-3 py-1.5 rounded-xl border border-current/20 shadow-inner">
          <span className="text-2xl font-black tracking-tight">
            {temperatura > 0 ? `+${temperatura.toFixed(1)}` : temperatura.toFixed(1)}
          </span>
          <span className="text-sm font-bold text-slate-600">°C</span>
          <IconComponent size={20} className={`ml-1.5 ${styleConfig.iconColor}`} />
        </div>
      </div>
    </div>
  );
};
