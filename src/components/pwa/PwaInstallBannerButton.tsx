/**
 * ============================================================================
 * LA PEZCADERIA ERP — BOTÓN TÁCTIL DE INSTALACIÓN PWA
 * ============================================================================
 * Especificación: SPEC-024 (TASK-024-04)
 * Principios: "Regla del Niño de 12 Años", Botón >= 48px, WCAG 2.2 AA+
 * ============================================================================
 */

import React, { useState } from 'react';
import { Smartphone, CheckCircle2 } from 'lucide-react';
import { usePwaStore } from '../../store/usePwaStore';

interface PwaInstallBannerButtonProps {
  className?: string;
  variant?: 'banner' | 'compact';
}

export const PwaInstallBannerButton: React.FC<PwaInstallBannerButtonProps> = ({
  className = '',
  variant = 'banner'
}) => {
  const { isInstallable, isStandalone, promptInstall } = usePwaStore();
  const [instaladoReciente, setInstaladoReciente] = useState(false);

  // Si ya se encuentra en modo standalone PWA no mostramos el prompt
  if (isStandalone) {
    return null;
  }

  // Si no ha capturado el evento beforeinstallprompt y no se ha instalado recientemente
  if (!isInstallable && !instaladoReciente) {
    return null;
  }

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      setInstaladoReciente(true);
    }
  };

  if (instaladoReciente) {
    return (
      <div className={`p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 ${className}`}>
        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        <span>¡App instalada correctamente en tu dispositivo!</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleInstall}
        className={`min-h-[48px] px-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer ${className}`}
        aria-label="Instalar aplicación en este dispositivo"
      >
        <Smartphone className="w-4 h-4 text-emerald-400" />
        <span>Instalar App</span>
      </button>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-4 text-white shadow-lg space-y-2.5 ${className}`}>
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
          <Smartphone className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <div className="text-xs font-black tracking-tight">Instalar en este celular</div>
          <div className="text-[11px] text-slate-300 font-medium">
            Acceso directo rápido y funcionamiento offline sin barras de navegador
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleInstall}
        className="w-full min-h-[48px] h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
      >
        <span>📲 INSTALAR APP EN PANTALLA PRINCIPAL</span>
      </button>
    </div>
  );
};
