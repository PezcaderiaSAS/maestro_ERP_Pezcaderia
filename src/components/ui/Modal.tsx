import React, { useEffect } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  closeOnOverlayClick?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'md',
  closeOnOverlayClick = true,
}) => {
  // Manejo de la tecla Esc para cerrar
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Bloquear el scroll del body cuando está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-[95vw] md:max-w-4xl',
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Overlay oscuro */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Contenedor principal del modal */}
      <div 
        className={`relative z-50 w-full ${maxWidthClass} bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] transition-all transform duration-300`}
        role="dialog"
        aria-modal="true"
      >
        {/* Cabecera (opcional) */}
        {(title || !!onClose) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            {title && (
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                {title}
              </h2>
            )}
            <button
              onClick={onClose}
              className="p-2 ml-auto text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]/20"
              aria-label="Cerrar modal"
            >
              {/* Ícono SVG de X (Cerrar) genérico sin dependencias */}
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        )}

        {/* Cuerpo / Contenido */}
        <div className="px-6 py-5 overflow-y-auto flex-1">
          {children}
        </div>

        {/* Pie (opcional) */}
        {footer && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
