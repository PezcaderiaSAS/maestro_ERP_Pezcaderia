import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { OmniboxAction, OmniboxCategory } from './omnibox.types';

export interface UseOmniboxSearchProps {
  actions: OmniboxAction[];
  isOpen: boolean;
  onClose: () => void;
}

export interface UseOmniboxSearchResult {
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  clearQuery: () => void;
  activeCategory: OmniboxCategory;
  setActiveCategory: React.Dispatch<React.SetStateAction<OmniboxCategory>>;
  handleSelectCategory: (category: OmniboxCategory) => void;
  effectiveCategory: OmniboxCategory;
  cleanQuery: string;
  selectedIndex: number;
  setSelectedIndex: React.Dispatch<React.SetStateAction<number>>;
  filteredActions: OmniboxAction[];
  inputRef: React.RefObject<HTMLInputElement>;
  itemsContainerRef: React.RefObject<HTMLDivElement>;
  itemRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
}

/**
 * Hook especializado para gestionar el estado de consulta, filtrado reactivo por prefijos
 * (> modulos, @ clientes, # productos, ! acciones), atajos de teclado y auto-scroll.
 */
export function useOmniboxSearch({
  actions,
  isOpen,
  onClose,
}: UseOmniboxSearchProps): UseOmniboxSearchResult {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<OmniboxCategory>('Todos');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const itemsContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Inicialización y autofoco al abrir el modal
  useEffect(() => {
    if (!isOpen) return;

    setQuery('');
    setActiveCategory('Todos');
    setSelectedIndex(0);

    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 40);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Manejo de prefijos rápidos de búsqueda (> navegación, @ clientes, # productos, ! acciones)
  const { cleanQuery, effectiveCategory } = useMemo(() => {
    const trimmed = query.trim();
    if (trimmed.startsWith('>')) {
      return { cleanQuery: trimmed.slice(1).trim(), effectiveCategory: 'Navegación' as OmniboxCategory };
    }
    if (trimmed.startsWith('@')) {
      return { cleanQuery: trimmed.slice(1).trim(), effectiveCategory: 'Clientes' as OmniboxCategory };
    }
    if (trimmed.startsWith('#')) {
      return { cleanQuery: trimmed.slice(1).trim(), effectiveCategory: 'Productos' as OmniboxCategory };
    }
    if (trimmed.startsWith('!')) {
      return { cleanQuery: trimmed.slice(1).trim(), effectiveCategory: 'Acciones' as OmniboxCategory };
    }
    return { cleanQuery: trimmed, effectiveCategory: activeCategory };
  }, [query, activeCategory]);

  // Filtrado reactivo por categoría y texto
  const filteredActions = useMemo(() => {
    let list = actions;

    // Filtrar por categoría activa
    if (effectiveCategory !== 'Todos') {
      list = list.filter((item) => item.category === effectiveCategory);
    }

    // Filtrar por término de búsqueda
    if (!cleanQuery) {
      if (effectiveCategory === 'Todos') {
        return list.filter((i) => i.category === 'Navegación' || i.category === 'Acciones');
      }
      return list.slice(0, 30);
    }

    const q = cleanQuery.toLowerCase();
    return list
      .filter((item) => {
        const titleMatch = item.title.toLowerCase().includes(q);
        const detailMatch = item.detail ? item.detail.toLowerCase().includes(q) : false;
        const categoryMatch = item.category.toLowerCase().includes(q);
        const badgeMatch = item.badge ? item.badge.toLowerCase().includes(q) : false;
        return titleMatch || detailMatch || categoryMatch || badgeMatch;
      })
      .slice(0, 50);
  }, [actions, cleanQuery, effectiveCategory]);

  // Reset del cursor seleccionado al cambiar resultados
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredActions.length, effectiveCategory]);

  // Auto-scroll del elemento seleccionado en la lista
  useEffect(() => {
    if (!isOpen) return;
    const currentItem = itemRefs.current[selectedIndex];
    if (currentItem && itemsContainerRef.current && typeof currentItem.scrollIntoView === 'function') {
      currentItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex, isOpen]);

  // Escucha global de atajos de teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (filteredActions.length > 0 ? (prev + 1) % filteredActions.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (filteredActions.length > 0 ? (prev - 1 + filteredActions.length) % filteredActions.length : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredActions[selectedIndex]) {
          filteredActions[selectedIndex].onSelect();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Tab') {
        // Ciclar rápidamente entre categorías con Tab
        e.preventDefault();
        const categories: OmniboxCategory[] = ['Todos', 'Navegación', 'Clientes', 'Productos', 'Acciones'];
        const currentIdx = categories.indexOf(activeCategory);
        const nextCat = categories[(currentIdx + 1) % categories.length];
        setActiveCategory(nextCat);
      } else if (e.altKey && !isNaN(Number(e.key)) && Number(e.key) >= 1 && Number(e.key) <= 9) {
        // Atajo directo Alt+1 a Alt+9 para los primeros 9 resultados
        e.preventDefault();
        const targetIdx = Number(e.key) - 1;
        if (filteredActions[targetIdx]) {
          filteredActions[targetIdx].onSelect();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isOpen, filteredActions, selectedIndex, onClose, activeCategory]);

  const clearQuery = useCallback(() => {
    setQuery('');
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handleSelectCategory = useCallback((category: OmniboxCategory) => {
    setActiveCategory(category);
    setSelectedIndex(0);
    if (inputRef.current) inputRef.current.focus();
  }, []);

  return {
    query,
    setQuery,
    clearQuery,
    activeCategory,
    setActiveCategory,
    handleSelectCategory,
    effectiveCategory,
    cleanQuery,
    selectedIndex,
    setSelectedIndex,
    filteredActions,
    inputRef,
    itemsContainerRef,
    itemRefs,
  };
}

