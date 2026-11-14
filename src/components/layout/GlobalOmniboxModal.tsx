import React from 'react';
import {
  useOmniboxData,
  useOmniboxSearch,
  OmniboxHeader,
  OmniboxCategoryTabs,
  OmniboxResultsList,
  OmniboxFooter,
  type GlobalOmniboxModalProps,
  type OmniboxCategory,
  type OmniboxAction,
} from './omnibox';

export type { GlobalOmniboxModalProps, OmniboxCategory, OmniboxAction };

/**
 * Orquestador principal de la Paleta de Comandos Global (Omnibox).
 * Desacoplado bajo principios SOLID (SRP) con arquitectura modular.
 */
export const GlobalOmniboxModal: React.FC<GlobalOmniboxModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  // Extracción de datos del ERP (ejecutada incondicionalmente para respetar las reglas de hooks)
  const allActions = useOmniboxData({ onNavigate, onClose });

  // Gestión del estado de búsqueda, atajos por teclado y auto-scroll
  const {
    query,
    setQuery,
    clearQuery,
    handleSelectCategory,
    effectiveCategory,
    selectedIndex,
    setSelectedIndex,
    filteredActions,
    inputRef,
    itemsContainerRef,
    itemRefs,
  } = useOmniboxSearch({ actions: allActions, isOpen, onClose });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 isolate flex items-start justify-center pt-12 sm:pt-20 px-4 bg-slate-950/80 backdrop-blur-xl animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Paleta de Comandos Global"
    >
      <div
        className="w-full max-w-2xl bg-[#0B1120] border border-cyan-500/25 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[82vh] ring-1 ring-white/10 shadow-cyan-950/50"
        onClick={(e) => e.stopPropagation()}
      >
        <OmniboxHeader
          query={query}
          onQueryChange={(val) => {
            setQuery(val);
            setSelectedIndex(0);
          }}
          onClear={clearQuery}
          onClose={onClose}
          inputRef={inputRef}
        />

        <OmniboxCategoryTabs
          effectiveCategory={effectiveCategory}
          onSelectCategory={handleSelectCategory}
        />

        <OmniboxResultsList
          filteredActions={filteredActions}
          selectedIndex={selectedIndex}
          onSelectIndex={setSelectedIndex}
          onExecuteAction={(action) => action.onSelect()}
          query={query}
          itemsContainerRef={itemsContainerRef}
          itemRefs={itemRefs}
        />

        <OmniboxFooter resultCount={filteredActions.length} />
      </div>
    </div>
  );
};
