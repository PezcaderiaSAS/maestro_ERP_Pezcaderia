import React from 'react';
import { Compass, Layers, Users, Package, Sparkles } from 'lucide-react';
import type { CategoryChipItem, OmniboxCategory } from './omnibox.types';

export const DEFAULT_CATEGORY_CHIPS: CategoryChipItem[] = [
  { id: 'Todos', label: 'Todos', icon: Compass },
  { id: 'Navegación', label: 'Módulos', prefix: '>', icon: Layers },
  { id: 'Clientes', label: 'Clientes', prefix: '@', icon: Users },
  { id: 'Productos', label: 'Productos', prefix: '#', icon: Package },
  { id: 'Acciones', label: 'Acciones', prefix: '!', icon: Sparkles },
];

export interface OmniboxCategoryTabsProps {
  effectiveCategory: OmniboxCategory;
  onSelectCategory: (category: OmniboxCategory) => void;
  chips?: CategoryChipItem[];
}

export const OmniboxCategoryTabs: React.FC<OmniboxCategoryTabsProps> = ({
  effectiveCategory,
  onSelectCategory,
  chips = DEFAULT_CATEGORY_CHIPS,
}) => {
  return (
    <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/5 bg-slate-950/40 overflow-x-auto no-scrollbar">
      {chips.map((chip) => {
        const Icon = chip.icon;
        const isActive = effectiveCategory === chip.id;
        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => onSelectCategory(chip.id)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              isActive
                ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30 font-bold'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Icon size={12} />
            <span>{chip.label}</span>
            {chip.prefix && (
              <span
                className={`text-[10px] font-mono px-1 rounded ${
                  isActive ? 'bg-slate-950/20 text-slate-950' : 'text-slate-500'
                }`}
              >
                {chip.prefix}
              </span>
            )}
          </button>
        );
      })}

      <div className="ml-auto text-[11px] text-slate-500 font-mono hidden sm:inline-flex items-center gap-1 pr-2">
        <span>Presiona</span>
        <kbd className="px-1 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-slate-400">
          Tab
        </kbd>
        <span>para filtrar</span>
      </div>
    </div>
  );
};

