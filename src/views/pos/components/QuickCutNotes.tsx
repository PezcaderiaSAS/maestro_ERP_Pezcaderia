// src/views/pos/components/QuickCutNotes.tsx
// Micro-componente táctil de notas de corte rápido para mostrador de pescadería (SPEC-047)
// Altura ergonómica >= 48px según Ley de Fitts y microinteracciones de 1 toque

import React from 'react';
import { Scissors, Sparkles, Shield, Snowflake, Fish } from 'lucide-react';

export const STANDARD_CUT_NOTES = [
  { id: 'cut-1', label: 'Fileteado', icon: Fish, desc: 'Sin espinas ni piel' },
  { id: 'cut-2', label: 'En Postas', icon: Scissors, desc: 'Rodajas gruesas' },
  { id: 'cut-3', label: 'Entero Limpio', icon: Sparkles, desc: 'Eviscerado sin agallas' },
  { id: 'cut-4', label: 'Sin Escama', icon: Shield, desc: 'Descramado fino' },
  { id: 'cut-5', label: 'En Mariposa', icon: Fish, desc: 'Abierto al centro' },
  { id: 'cut-6', label: 'Hielo Extra', icon: Snowflake, desc: 'Conservación en viaje' },
];

export interface QuickCutNotesProps {
  selectedNotes?: string[];
  onToggleNote: (note: string) => void;
  className?: string;
  customNotes?: { id: string; label: string }[];
}

export const QuickCutNotes: React.FC<QuickCutNotesProps> = ({
  selectedNotes = [],
  onToggleNote,
  className = '',
  customNotes,
}) => {
  const notesToRender = customNotes || STANDARD_CUT_NOTES;

  return (
    <div
      role="group"
      aria-label="Notas de corte y preparación de mostrador"
      className={`flex flex-wrap gap-2 ${className}`}
    >
      {notesToRender.map((note) => {
        const isSelected = selectedNotes.includes(note.label);
        const IconComponent = (note as any).icon || Scissors;

        return (
          <button
            key={note.id || note.label}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onToggleNote(note.label)}
            className={`min-h-[48px] px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold border transition-all active:scale-[0.98] select-none ${
              isSelected
                ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-md shadow-cyan-950/40'
                : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-slate-700/60 shadow-sm'
            }`}
          >
            <IconComponent className={`w-4 h-4 ${isSelected ? 'text-slate-950' : 'text-cyan-400'}`} />
            <span>{note.label}</span>
          </button>
        );
      })}
    </div>
  );
};
