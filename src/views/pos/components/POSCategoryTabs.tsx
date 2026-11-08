import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface POSCategoryTabsProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const POSCategoryTabs: React.FC<POSCategoryTabsProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({ left: -220, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({ left: 220, behavior: 'smooth' });
    }
  };

  return (
    <div className="pos-category-tabs-wrapper flex items-center gap-1 mb-2.5 shrink-0 w-full overflow-hidden">
      {/* Flecha de desplazamiento izquierda */}
      <button
        type="button"
        onClick={scrollLeft}
        className="min-h-[48px] h-9 w-9 px-2 rounded-xl flex items-center justify-center bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer shrink-0 shadow-sm"
        aria-label="Desplazar categorías a la izquierda"
        title="Ver categorías anteriores"
      >
        <span className="sr-only">←</span>
        <ChevronLeft size={18} />
      </button>

      {/* Contenedor desplazable de pestañas de categorías */}
      <div
        ref={tabsContainerRef}
        className="pos-categories flex-1 flex items-center gap-1.5 overflow-x-auto scroll-smooth py-0.5 no-scrollbar"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className={`min-h-[48px] h-9 px-4 py-1.5 text-xs font-bold whitespace-nowrap rounded-xl transition-all active:scale-95 cursor-pointer select-none flex items-center justify-center shrink-0 ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                  : 'bg-slate-800/80 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-700/80'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Flecha de desplazamiento derecha */}
      <button
        type="button"
        onClick={scrollRight}
        className="min-h-[48px] h-9 w-9 px-2 rounded-xl flex items-center justify-center bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer shrink-0 shadow-sm"
        aria-label="Desplazar categorías a la derecha"
        title="Ver más categorías"
      >
        <span className="sr-only">→</span>
        <ChevronRight size={18} />
      </button>
    </div>
  );
};
