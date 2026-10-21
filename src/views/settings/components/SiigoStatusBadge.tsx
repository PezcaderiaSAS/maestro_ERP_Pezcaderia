// src/views/settings/components/SiigoStatusBadge.tsx
import React from 'react';
import { Zap, ShieldAlert, AlertCircle, KeyRound } from 'lucide-react';
import { useSiigoConfigStore } from '../../../store/useSiigoConfigStore';

export interface SiigoStatusBadgeProps {
  onClick?: () => void;
  className?: string;
}

/**
 * Badge semáforo táctil accesible para monitorear y abrir la configuración de SIIGO Nube
 * Cumple con la "Regla del Niño de 12 Años" (Touch target >= 48px, alto contraste WCAG AA+, cero imágenes).
 */
export const SiigoStatusBadge: React.FC<SiigoStatusBadgeProps> = ({
  onClick,
  className = ''
}) => {
  const estadoConexion = useSiigoConfigStore((state) => state.estadoConexion);
  const ultimoPing = useSiigoConfigStore((state) => state.ultimoPing);

  // Configuración de variantes visuales de alto contraste
  const configVariantes = {
    ONLINE: {
      bg: 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-300 text-emerald-950',
      badgeBg: 'bg-emerald-600 text-white',
      badgeText: 'En Vivo',
      icon: <Zap size={18} className="text-emerald-700 shrink-0 animate-pulse" />,
      label: 'SIIGO Conectado',
      sublabel: ultimoPing?.latencyMs ? `${ultimoPing.latencyMs} ms` : 'Token Activo'
    },
    SANDBOX: {
      bg: 'bg-amber-50 hover:bg-amber-100/80 border-amber-300 text-amber-950',
      badgeBg: 'bg-amber-600 text-white',
      badgeText: 'Simulación',
      icon: <ShieldAlert size={18} className="text-amber-700 shrink-0" />,
      label: 'SIIGO Sandbox',
      sublabel: 'Pruebas Locales'
    },
    ERROR_AUTENTICACION: {
      bg: 'bg-rose-50 hover:bg-rose-100/80 border-rose-300 text-rose-950',
      badgeBg: 'bg-rose-600 text-white',
      badgeText: 'Credencial',
      icon: <AlertCircle size={18} className="text-rose-700 shrink-0" />,
      label: 'SIIGO Error',
      sublabel: 'Revisar Acceso'
    },
    NO_CONFIGURADO: {
      bg: 'bg-slate-100 hover:bg-slate-200/80 border-slate-300 text-slate-800',
      badgeBg: 'bg-slate-600 text-white',
      badgeText: 'Pendiente',
      icon: <KeyRound size={18} className="text-slate-600 shrink-0" />,
      label: 'Configurar SIIGO',
      sublabel: 'Sin Credenciales'
    }
  };

  const variante = configVariantes[estadoConexion] || configVariantes.NO_CONFIGURADO;

  return (
    <button
      type="button"
      onClick={onClick}
      role="button"
      aria-label="Estado de conexión SIIGO Nube API v2"
      title="Clic para configurar credenciales o probar conexión con SIIGO Nube"
      className={`min-h-[48px] h-12 px-3.5 py-1.5 rounded-xl border flex items-center gap-2.5 shadow-sm active:scale-95 transition-all cursor-pointer ${variante.bg} ${className}`}
    >
      <div className="flex items-center justify-center p-1 rounded-lg bg-white/80 shadow-2xs">
        {variante.icon}
      </div>

      <div className="flex flex-col text-left leading-tight">
        <span className="text-xs font-black tracking-tight flex items-center gap-1.5">
          {variante.label}
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${variante.badgeBg}`}
          >
            {variante.badgeText}
          </span>
        </span>
        <span className="text-[11px] font-semibold opacity-75">
          {variante.sublabel}
        </span>
      </div>
    </button>
  );
};
