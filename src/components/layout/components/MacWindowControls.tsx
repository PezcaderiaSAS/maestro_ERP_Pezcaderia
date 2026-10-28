import React from 'react';
import Swal from 'sweetalert2';
import { useAuthStore } from '../../../store/useAuthStore';

export interface MacWindowControlsProps {
  onToggleOpen: () => void;
  onCloseSession?: () => void;
  onFullscreen?: () => void;
  className?: string;
  /** Si es true, el botón rojo actúa como Cierre de Sesión del ERP (con confirmación Swal). Si es false, cierra el modal/tarjeta directamente */
  isAppLevel?: boolean;
}

/**
 * Componente modular de controles de ventana estilo macOS (Red / Yellow / Green dots)
 * Diseñado bajo directivas UI/UX Pro Max y estética Dark Glassmorphism.
 */
export const MacWindowControls: React.FC<MacWindowControlsProps> = ({
  onToggleOpen,
  onCloseSession,
  onFullscreen,
  className = '',
  isAppLevel = false,
}) => {
  const handleClose = () => {
    // Si no es a nivel de aplicación (ej. es un modal o drawer), simplemente cierra la ventana
    if (!isAppLevel) {
      if (onCloseSession) {
        onCloseSession();
      }
      return;
    }

    // A nivel de aplicación: Diálogo de confirmación para cerrar sesión del ERP
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: '¿Deseas salir del sistema ERP La Pezcadería?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
      background: '#0F172A',
      color: '#F8FAFC',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          if (onCloseSession) {
            onCloseSession();
          }
          await useAuthStore.getState().logout();
        } catch {
          // Fallback seguro
          useAuthStore.setState({
            status: 'unauthenticated',
            currentUser: null,
            activeTenant: null,
            isLoading: false,
          });
        }
      }
    });
  };

  const handleFullscreen = () => {
    if (onFullscreen) {
      onFullscreen();
      return;
    }

    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    } catch {
      // Fallback silencioso para entornos donde Fullscreen API no esté disponible (ej. jsdom/vitest)
    }
  };

  return (
    <div
      data-testid="mac-window-controls"
      className={`flex items-center gap-2 select-none ${className}`}
      aria-label="Controles de ventana estilo macOS"
    >
      {/* Botón Rojo: Cerrar sesión / Cerrar modal */}
      <button
        type="button"
        data-testid="mac-control-close"
        onClick={handleClose}
        title="Cerrar sesión"
        aria-label="Cerrar sesión"
        className="w-3 h-3 rounded-full bg-[#FF5F56] hover:brightness-110 active:scale-90 transition-all border border-black/20 shadow-xs cursor-pointer flex items-center justify-center group"
      >
        <span className="opacity-0 group-hover:opacity-100 text-[8px] font-black text-black/60 leading-none">
          ✕
        </span>
      </button>

      {/* Botón Amarillo: Colapsar/Minimizar */}
      <button
        type="button"
        data-testid="mac-control-minimize"
        onClick={onToggleOpen}
        title="Colapsar"
        aria-label="Colapsar"
        className="w-3 h-3 rounded-full bg-[#FFBD2E] hover:brightness-110 active:scale-90 transition-all border border-black/20 shadow-xs cursor-pointer flex items-center justify-center group"
      >
        <span className="opacity-0 group-hover:opacity-100 text-[8px] font-black text-black/60 leading-none">
          –
        </span>
      </button>

      {/* Botón Verde: Pantalla completa */}
      <button
        type="button"
        data-testid="mac-control-fullscreen"
        onClick={handleFullscreen}
        title="Alternar pantalla completa"
        aria-label="Alternar pantalla completa"
        className="w-3 h-3 rounded-full bg-[#27C93F] hover:brightness-110 active:scale-90 transition-all border border-black/20 shadow-xs cursor-pointer flex items-center justify-center group"
      >
        <span className="opacity-0 group-hover:opacity-100 text-[8px] font-black text-black/60 leading-none">
          ⤢
        </span>
      </button>
    </div>
  );
};
