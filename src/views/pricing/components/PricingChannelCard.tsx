import React from 'react';
import {
  Store,
  Utensils,
  Building2,
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Minus,
  Plus,
} from 'lucide-react';
import type { ChannelSimulationResult } from '../../../types/pricingEngine.types';

export const formatCop = (val: number): string => {
  const rounded = Math.round(val || 0);
  return `$${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
};

interface PricingChannelCardProps {
  canal: 'POS' | 'RESTAURANTE_HORECA' | 'MAYORISTA';
  result: ChannelSimulationResult;
  onChangeMargen?: (nuevoMargen: number) => void;
  readOnly?: boolean;
}

export const PricingChannelCard: React.FC<PricingChannelCardProps> = ({
  canal,
  result,
  onChangeMargen,
  readOnly = false,
}) => {
  const canalKey =
    canal === 'POS'
      ? 'pos'
      : canal === 'RESTAURANTE_HORECA'
      ? 'restaurante'
      : 'mayorista';

  // Configuración de Identidad de Canal
  const channelMeta = {
    POS: {
      titulo: 'Mostrador / POS Directo',
      descripcion: 'Venta rápida en tienda física al consumidor final',
      icon: Store,
      color: 'blue',
    },
    RESTAURANTE_HORECA: {
      titulo: 'Restaurante / Canal HORECA',
      descripcion: 'Suministro recurrente para gastronomía y hoteles',
      icon: Utensils,
      color: 'indigo',
    },
    MAYORISTA: {
      titulo: 'Mayorista / Institucional',
      descripcion: 'Ventas de alto volumen a distribuidores y plantas',
      icon: Building2,
      color: 'slate',
    },
  }[canal];

  const Icon = channelMeta.icon;

  // Semáforo Cromático de Salud Financiera
  const getTrafficStatus = () => {
    if (result.esVentaBajoCosto) {
      return {
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
        badgeText: 'VENTA BAJO COSTO',
        iconColor: 'text-rose-600',
        cardBorder: 'border-rose-300 ring-1 ring-rose-200',
        cardBg: 'bg-rose-50/40',
        textColor: 'text-rose-900',
      };
    }
    if (result.alertaMargenBajo || result.margenBrutoPct < 10) {
      return {
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
        badgeText: 'MARGEN RIESGOSO',
        iconColor: 'text-amber-600',
        cardBorder: 'border-amber-300 ring-1 ring-amber-200',
        cardBg: 'bg-amber-50/40',
        textColor: 'text-amber-900',
      };
    }
    if (result.margenBrutoPct < 20) {
      return {
        badgeBg: 'bg-sky-100 text-sky-800 border-sky-300',
        badgeText: 'ACEPTABLE',
        iconColor: 'text-sky-600',
        cardBorder: 'border-sky-200',
        cardBg: 'bg-white',
        textColor: 'text-slate-900',
      };
    }
    return {
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      badgeText: 'MARGEN ÓPTIMO',
      iconColor: 'text-emerald-600',
      cardBorder: 'border-emerald-300 ring-1 ring-emerald-200',
      cardBg: 'bg-emerald-50/30',
      textColor: 'text-emerald-950',
    };
  };

  const status = getTrafficStatus();

  return (
    <div
      data-testid={`channel-card-${canalKey}`}
      className={`rounded-2xl border p-5 transition-all shadow-xs flex flex-col justify-between ${status.cardBg} ${status.cardBorder}`}
    >
      {/* Cabecera del Canal */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
              <Icon className="w-5 h-5 text-slate-700 stroke-[1.75]" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base leading-tight">
                {channelMeta.titulo}
              </h4>
              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                {channelMeta.descripcion}
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border tracking-wide uppercase shrink-0 ${status.badgeBg}`}
          >
            {status.badgeText}
          </span>
        </div>

        {/* Tarifa Final Destacada */}
        <div className="my-4 p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1 uppercase tracking-wider">
            Precio Final al Cliente
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {formatCop(result.precioFinalCop)}
            </span>
            <span className="text-xs font-medium text-slate-500">COP / Unidad</span>
          </div>

          {/* Desglose Fiscal e Impuestos */}
          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500 block">Subtotal Neto:</span>
              <span className="font-semibold text-slate-800">
                Base {formatCop(result.subtotalNetoCop)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">IVA 19%:</span>
              <span className="font-semibold text-slate-800">
                {result.valorIvaCop > 0 ? `+${formatCop(result.valorIvaCop)}` : 'Exento (0%)'}
              </span>
            </div>
          </div>
        </div>

        {/* Indicador de Ganancia y Margen */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-4 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-500" />
            <span className="text-slate-600 font-medium">Margen Bruto Calculado:</span>
          </div>
          <div className="text-right">
            <span className="font-bold text-slate-900 block">
              {formatCop(result.margenBrutoCop)}
            </span>
            <span
              className={`text-[11px] font-bold ${
                result.margenBrutoPct < 10
                  ? 'text-rose-600'
                  : result.margenBrutoPct < 20
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}
            >
              {result.margenBrutoPct}% sobre venta
            </span>
          </div>
        </div>
      </div>

      {/* Control Interactivo de Margen Comercial */}
      {!readOnly && onChangeMargen && (
        <div className="pt-3 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700">
              Margen Comercial Aplicado:
            </label>
            <span className="text-xs font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
              {result.margenPct}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={result.margenPct <= 1}
              onClick={() => onChangeMargen(Math.max(1, result.margenPct - 1))}
              className="w-10 h-10 min-h-[40px] rounded-lg bg-white border border-slate-300 text-slate-700 flex items-center justify-center hover:bg-slate-50 active:scale-95 disabled:opacity-40 transition-all shadow-2xs"
              title="Disminuir margen 1%"
            >
              <Minus className="w-4 h-4" />
            </button>

            <input
              type="range"
              min="1"
              max="150"
              step="1"
              value={result.margenPct}
              onChange={(e) => onChangeMargen(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 min-h-[44px]"
            />

            <button
              type="button"
              disabled={result.margenPct >= 150}
              onClick={() => onChangeMargen(Math.min(150, result.margenPct + 1))}
              className="w-10 h-10 min-h-[40px] rounded-lg bg-white border border-slate-300 text-slate-700 flex items-center justify-center hover:bg-slate-50 active:scale-95 disabled:opacity-40 transition-all shadow-2xs"
              title="Aumentar margen 1%"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
