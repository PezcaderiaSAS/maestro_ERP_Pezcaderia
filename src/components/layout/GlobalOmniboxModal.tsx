import React, { useState, useEffect, useRef } from 'react';
import { Search, Compass, Package, ArrowRight, CornerDownLeft, Sparkles, X, ShoppingCart, Truck, Fish, Snowflake, ShieldCheck, type LucideIcon } from 'lucide-react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useAppStore } from '../../store/useAppStore';
import type { ERPViewKey } from './EnterpriseSidebar';

interface OmniboxAction {
  id: string;
  title: string;
  category: 'Navegación' | 'Productos' | 'Operaciones';
  icon: LucideIcon;
  detail?: string;
  onSelect: () => void;
}

interface GlobalOmniboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: ERPViewKey) => void;
}

export const GlobalOmniboxModal: React.FC<GlobalOmniboxModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const products = useInventoryStore((s) => s.products);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Construcción de la lista de acciones dinámicas
  const actions: OmniboxAction[] = React.useMemo(() => {
    const list: OmniboxAction[] = [
      // Módulos
      {
        id: 'nav-pos',
        title: 'Punto de Venta (POS)',
        category: 'Navegación',
        icon: ShoppingCart,
        detail: 'Caja rápida, balanza digital y cobro',
        onSelect: () => { onNavigate('pos'); onClose(); }
      },
      {
        id: 'nav-muelle',
        title: 'Compras de Muelle & Pescadores',
        category: 'Navegación',
        icon: Fish,
        detail: 'Recepción sensorial, tallas y liquidación',
        onSelect: () => { onNavigate('compras_muelle' as any); onClose(); }
      },
      {
        id: 'nav-despiece',
        title: 'Producción & Rendimiento de Fileteo',
        category: 'Navegación',
        icon: Sparkles,
        detail: 'Yield KPI, despiece y costeo por absorción',
        onSelect: () => { onNavigate('despiece' as any); onClose(); }
      },
      {
        id: 'nav-inventario',
        title: 'Bodegas & WMS',
        category: 'Navegación',
        icon: Package,
        detail: 'Kardex, lotes perecederos FEFO y cuartos fríos',
        onSelect: () => { onNavigate('inventario'); onClose(); }
      },
      {
        id: 'nav-despachos',
        title: 'Despachos & Logística',
        category: 'Navegación',
        icon: Truck,
        detail: 'Control de rutas y entregas a clientes',
        onSelect: () => { onNavigate('despachos'); onClose(); }
      },
      {
        id: 'nav-3pl',
        title: 'Alquiler Cuarto Frío (3PL)',
        category: 'Navegación',
        icon: Snowflake,
        detail: 'Posiciones de estiba y contratos externos',
        onSelect: () => { onNavigate('alquiler_cf' as any); onClose(); }
      },
    ];

    // Búsqueda en productos si hay query
    if (query.trim()) {
      const q = query.toLowerCase();
      (products || []).slice(0, 8).forEach((prod: any) => {
        if (
          prod.nombre.toLowerCase().includes(q) ||
          prod.sku.toLowerCase().includes(q) ||
          prod.categoria?.toLowerCase().includes(q)
        ) {
          list.push({
            id: `prod-${prod.id || prod.sku}`,
            title: prod.nombre,
            category: 'Productos',
            icon: Package,
            detail: `SKU: ${prod.sku} • Stock: ${prod.stock || 0} ${prod.unidadMedida || 'kg'} • $${(prod.precioVenta || 0).toLocaleString('es-CO')}`,
            onSelect: () => {
              onNavigate('pos');
              onClose();
            }
          });
        }
      });
    }

    // Filtrar por query
    if (!query.trim()) return list;

    const q = query.toLowerCase();
    return list.filter((a) =>
      a.title.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      (a.detail && a.detail.toLowerCase().includes(q))
    );
  }, [query, products, onNavigate, onClose]);

  // Control de teclado para navegación y selección
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, actions.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + actions.length) % Math.max(1, actions.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (actions[selectedIndex]) {
          actions[selectedIndex].onSelect();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, actions, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-xl bg-slate-900 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Omnibox */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10 bg-slate-950/60">
          <Search className="h-5 w-5 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Buscar módulo, producto, lote o acción rápida..."
            className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Lista de Resultados */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-white/5">
          {actions.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Compass className="h-8 w-8 mx-auto mb-2 opacity-40 text-cyan-400" />
              <p className="text-sm font-semibold">No se encontraron resultados para "{query}"</p>
              <p className="text-xs text-slate-500 mt-1">Prueba buscando por "POS", "Salmón", "Muelle" o "Despiece"</p>
            </div>
          ) : (
            actions.map((action, idx) => {
              const Icon = action.icon;
              const isSelected = selectedIndex === idx;

              return (
                <div
                  key={action.id}
                  onClick={() => action.onSelect()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan-500/15 border border-cyan-500/30 text-white shadow-sm'
                      : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isSelected ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-cyan-400'
                      }`}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold truncate text-white">{action.title}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-white/10 text-slate-300">
                          {action.category}
                        </span>
                      </div>
                      {action.detail && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">{action.detail}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 pl-2">
                    {isSelected && (
                      <span className="text-[11px] text-cyan-300 font-semibold flex items-center gap-1">
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

        {/* Footer de Atajos del Omnibox */}
        <div className="flex items-center justify-between py-2 px-4 border-t border-white/10 bg-slate-950/80 text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-slate-300">↑↓</kbd> Navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-slate-300">Enter</kbd> Seleccionar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-slate-300">Esc</kbd> Cerrar
            </span>
          </div>
          <span className="text-slate-500 font-mono hidden sm:inline">Pezcadería Omnibox</span>
        </div>
      </div>
    </div>
  );
};
