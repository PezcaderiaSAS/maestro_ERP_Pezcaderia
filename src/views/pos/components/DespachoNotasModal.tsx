// src/views/pos/components/DespachoNotasModal.tsx
// Modal bajo demanda para selección de notas de corte rápido y especificaciones de despacho
// Resuelve SPEC-052 R2 recuperando espacio vertical permanente en la columna del POS

import React, { useState, useEffect } from 'react';
import { X, FileText, Check, RotateCcw, Scissors } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { QuickCutNotes } from './QuickCutNotes';

export interface DespachoNotasModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNotes?: string[];
  onToggleNote: (note: string) => void;
  customNotes?: string;
  onCustomNotesChange?: (text: string) => void;
  onConfirm?: () => void;
  onClear?: () => void;
}

export const DespachoNotasModal: React.FC<DespachoNotasModalProps> = ({
  isOpen,
  onClose,
  selectedNotes = [],
  onToggleNote,
  customNotes,
  onCustomNotesChange,
  onConfirm,
  onClear,
}) => {
  const [localNotes, setLocalNotes] = useState<string>(customNotes || '');

  useEffect(() => {
    if (customNotes !== undefined) {
      setLocalNotes(customNotes);
    }
  }, [customNotes]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalNotes(val);
    onCustomNotesChange?.(val);
  };

  const handleClear = () => {
    setLocalNotes('');
    onCustomNotesChange?.('');
    if (onClear) {
      onClear();
    } else {
      // Toggle off all currently selected notes
      [...selectedNotes].forEach((n) => onToggleNote(n));
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="despacho-modal-title"
      data-testid="modal-despacho-notas"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
    >
      <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] select-none">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-white/10 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h3 id="despacho-modal-title" className="text-sm sm:text-base font-black text-white tracking-wide">
                Notas de Preparación y Despacho
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Cortes de mostrador e instrucciones para cocina / alistamiento
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            data-testid="btn-close-despacho-modal"
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo del Modal con scroll interno */}
        <div className="p-3.5 sm:p-4 overflow-y-auto space-y-4 flex-1 min-h-0 custom-scrollbar">
          {/* Sección 1: Corte y Preparación de Mostrador (1 Toque) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={13} className="text-cyan-400" />
                <span>Corte y Preparación de Mostrador (1 Toque)</span>
              </span>
              {selectedNotes.length > 0 && (
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-lg font-bold">
                  {selectedNotes.length} seleccionada{selectedNotes.length === 1 ? '' : 's'}
                </span>
              )}
            </div>
            <QuickCutNotes
              selectedNotes={selectedNotes}
              onToggleNote={onToggleNote}
            />
          </div>

          {/* Sección 2: Instrucciones / Notas Libres */}
          <div className="space-y-1.5">
            <label
              htmlFor="despacho-custom-textarea"
              className="text-[11px] font-bold text-slate-300 flex items-center justify-between"
            >
              <span>📝 Instrucciones Adicionales de Despacho:</span>
              <span className="text-[10px] text-cyan-400 font-mono">Opcional</span>
            </label>
            <textarea
              id="despacho-custom-textarea"
              data-testid="textarea-despacho-notas"
              rows={3}
              value={localNotes}
              onChange={handleTextChange}
              placeholder="Ej. Empacar en bolsas separadas, entregar a las 3:00 PM, cliente retira en moto..."
              className="w-full text-xs p-3 rounded-xl bg-slate-950/80 border border-slate-700/60 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 resize-none font-medium leading-relaxed"
            />
          </div>

          {/* Resumen de Notas Activas */}
          {(selectedNotes.length > 0 || localNotes.trim()) && (
            <div className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 block">
                Resumen de Instrucciones:
              </span>
              <div className="flex flex-wrap gap-1.5 items-center">
                {selectedNotes.map((note) => (
                  <span
                    key={note}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[11px] font-medium"
                  >
                    ✓ {note}
                  </span>
                ))}
                {localNotes.trim() && (
                  <span className="text-[11px] text-slate-300 italic">
                    "{localNotes.trim()}"
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pie de Acciones del Modal */}
        <div className="p-3 border-t border-white/10 bg-slate-950/80 shrink-0 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            data-testid="btn-clear-despacho-notas"
            onClick={handleClear}
            disabled={selectedNotes.length === 0 && !localNotes.trim()}
            className="min-h-[48px] px-3 bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white font-bold border-white/10 rounded-xl text-xs flex items-center gap-1.5"
            leftIcon={<RotateCcw size={15} />}
          >
            Limpiar
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              data-testid="btn-cancel-despacho-notas"
              onClick={onClose}
              className="min-h-[48px] px-3.5 text-slate-400 hover:text-white font-semibold text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              data-testid="btn-confirm-despacho-notas"
              onClick={handleConfirm}
              className="min-h-[48px] px-5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs rounded-xl shadow-lg shadow-cyan-600/30 flex items-center gap-1.5"
              leftIcon={<Check size={16} />}
            >
              Confirmar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
