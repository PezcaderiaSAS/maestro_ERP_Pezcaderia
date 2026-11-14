import React from 'react';
import { Compass, CornerDownLeft } from 'lucide-react';
import type { OmniboxAction, OmniboxBadgeVariant } from './omnibox.types';

export interface OmniboxResultsListProps {
  filteredActions: OmniboxAction[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onExecuteAction: (action: OmniboxAction) => void;
  query: string;
  itemsContainerRef: React.RefObject<HTMLDivElement>;
  itemRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
}

function getBadgeClasses(variant?: OmniboxBadgeVariant): string {
  switch (variant) {
    case 'cyan':
      return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
    case 'purple':
      return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
    case 'emerald':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    case 'amber':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    case 'rose':
      return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    default:
      return 'bg-white/5 text-slate-300 border-white/10';
  }
}

export const OmniboxResultsList: React.FC<OmniboxResultsListProps> = ({
  filteredActions,
  selectedIndex,
  onSelectIndex,
  onExecuteAction,
  query,
  itemsContainerRef,
  itemRefs,
}) => {
  return (
    <div
      ref={itemsContainerRef}
      className="p-2 space-y-1 overflow-y-auto max-h-[380px] custom-scrollbar"
    >
      {filteredActions.length === 0 ? (
        <div className="py-12 text-center text-slate-400">
          <Compass className="h-9 w-9 mx-auto mb-2 opacity-40 text-cyan-400 animate-pulse" />
          <p className="text-sm font-semibold text-slate-200">
            No se encontraron resultados para "{query}"
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Prueba buscando por "POS", "Salmón", "Muelle", o usa los prefijos{' '}
            <span className="text-cyan-400 font-mono">@cliente</span>,{' '}
            <span className="text-emerald-400 font-mono">#producto</span> o{' '}
            <span className="text-amber-400 font-mono">!acción</span>
          </p>
        </div>
      ) : (
        filteredActions.map((action, idx) => {
          const Icon = action.icon;
          const isSelected = selectedIndex === idx;
          const badgeClasses = getBadgeClasses(action.badgeVariant);

          return (
            <div
              key={action.id}
              ref={(el) => {
                itemRefs.current[idx] = el;
              }}
              onClick={() => onExecuteAction(action)}
              onMouseEnter={() => onSelectIndex(idx)}
              className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                isSelected
                  ? 'bg-gradient-to-r from-cyan-950/60 to-slate-800/80 border border-cyan-500/40 text-white shadow-md'
                  : 'hover:bg-slate-800/50 text-slate-300 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`p-2 rounded-xl shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-500/50'
                      : 'bg-slate-800/80 text-cyan-400 border border-white/5'
                  }`}
                >
                  <Icon size={16} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white truncate">{action.title}</span>
                    {action.badge && (
                      <span
                        className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded border tracking-wider ${badgeClasses}`}
                      >
                        {action.badge}
                      </span>
                    )}
                    <span className="text-[10px] font-medium text-slate-500">
                      {action.category}
                    </span>
                  </div>

                  {action.detail && (
                    <p className="text-xs text-slate-400 truncate mt-0.5 font-normal">
                      {action.detail}
                    </p>
                  )}
                </div>
              </div>

              {/* Acciones e Indicadores a la derecha */}
              <div className="flex items-center gap-2 shrink-0 pl-3">
                {idx < 9 && (
                  <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono rounded bg-white/5 text-slate-400 border border-white/10">
                    Alt+{idx + 1}
                  </kbd>
                )}
                {isSelected && (
                  <span className="text-[11px] text-cyan-300 font-bold flex items-center gap-1 bg-cyan-500/20 px-2 py-0.5 rounded-lg border border-cyan-500/30 animate-pulse">
                    <span>Ir</span>
                    <CornerDownLeft size={12} />
                  </span>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
