import React from 'react';
import { MacWindowControls } from './MacWindowControls';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  showMacControls?: boolean;
  title?: string;
  badge?: string;
  badgeVariant?: 'emerald' | 'cyan' | 'red' | 'amber';
  onClose?: () => void;
  onMinimize?: () => void;
  onFullscreen?: () => void;
}

/**
 * GlassCard - Contenedor Atómico Oficial de Dark Glassmorphism V8.
 * Diseñado bajo directivas del Sistema de Diseño V8 (DesignSystem_V8.md).
 * Proporciona un panel flotante de vidrio esmerilado con specular highlight,
 * aceleración por hardware en GPU y controles macOS semánticos opcionales.
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  showMacControls = false,
  title,
  badge,
  badgeVariant = 'emerald',
  onClose,
  onMinimize,
  onFullscreen,
  style,
  ...props
}) => {
  const hasHeader = showMacControls || Boolean(title) || Boolean(badge);

  const getBadgeClasses = (variant: string) => {
    switch (variant) {
      case 'cyan':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'red':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'amber':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'emerald':
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  return (
    <div
      style={{
        transform: 'translateZ(0)',
        boxShadow:
          '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)',
        ...style,
      }}
      className={`rounded-3xl bg-slate-900/85 backdrop-blur-2xl border border-white/12 shadow-2xl p-5 select-none transition-all duration-200 text-slate-100 ${className}`}
      {...props}
    >
      {/* Cabecera Opcional con Controles macOS y Overline Text */}
      {hasHeader && (
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {showMacControls && (
              <MacWindowControls
                onToggleOpen={onMinimize || (() => {})}
                onCloseSession={onClose}
                onFullscreen={onFullscreen}
              />
            )}
            {title && (
              <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase select-none">
                {title}
              </span>
            )}
          </div>

          {badge && (
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${getBadgeClasses(
                badgeVariant
              )}`}
            >
              {badge}
            </span>
          )}
        </div>
      )}

      {/* Contenido Principal de la Tarjeta */}
      {children}
    </div>
  );
};
