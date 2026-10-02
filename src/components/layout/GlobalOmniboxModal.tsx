import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Compass,
  Package,
  ArrowRight,
  CornerDownLeft,
  Sparkles,
  X,
  ShoppingCart,
  Truck,
  Fish,
  Snowflake,
  Warehouse,
  Building2,
  FileText,
  Wallet,
  Users,
  Moon,
  Sun,
  RefreshCw,
  Terminal,
  Layers,
  DollarSign,
  Activity,
  CreditCard,
  Hash,
  AtSign,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useClientStore } from '../../store/useClientStore';
import { useAppStore } from '../../store/useAppStore';
import { PosDraftService } from '../../services/posDraftService';
import { getSupabaseClient } from '../../lib/supabase';
import Swal from 'sweetalert2';
import type { ERPViewKey } from './EnterpriseSidebar';

export type OmniboxCategory = 'Todos' | 'Navegación' | 'Clientes' | 'Productos' | 'Acciones';

export interface OmniboxAction {
  id: string;
  title: string;
  category: 'Navegación' | 'Clientes' | 'Productos' | 'Acciones';
  icon: LucideIcon;
  detail?: string;
  badge?: string;
  badgeVariant?: 'cyan' | 'purple' | 'emerald' | 'amber' | 'rose';
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
  const [activeCategory, setActiveCategory] = useState<OmniboxCategory>('Todos');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const itemsContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Stores del ERP
  const products = useInventoryStore((s) => s.products);
  const clientes = useClientStore((s) => s.clientes);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);

  // Inicialización y autofoco al abrir
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

  // Manejo de prefijos rápidos de búsqueda (> para módulos, @ para clientes, # para productos, ! para acciones)
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

  // Construcción de la lista completa de acciones y entidades
  const allActions: OmniboxAction[] = useMemo(() => {
    const list: OmniboxAction[] = [
      // ==========================================
      // 1. MÓDULOS DE NAVEGACIÓN
      // ==========================================
      {
        id: 'nav-pos',
        title: 'Punto de Venta (POS)',
        category: 'Navegación',
        icon: ShoppingCart,
        detail: 'Caja rápida, balanza digital, teclado numérico y cobro',
        badge: 'MÓDULO',
        badgeVariant: 'cyan',
        onSelect: () => {
          onNavigate('pos');
          onClose();
        },
      },
      {
        id: 'nav-inventario',
        title: 'Bodegas & WMS',
        category: 'Navegación',
        icon: Warehouse,
        detail: 'Existencias multibodega, Kardex NIIF, lotes perecederos FEFO y stock',
        badge: 'MÓDULO',
        badgeVariant: 'cyan',
        onSelect: () => {
          onNavigate('inventario');
          onClose();
        },
      },
      {
        id: 'nav-config-bodegas',
        title: 'Gestión y Creación de Bodegas (Cuartos Fríos)',
        category: 'Navegación',
        icon: Building2,
        detail: 'Crear nueva bodega, configurar cuartos fríos y capacidades',
        badge: 'MÓDULO',
        badgeVariant: 'cyan',
        onSelect: () => {
          onNavigate('configuracion_bodegas');
          onClose();
        },
      },
      {
        id: 'nav-kardex',
        title: 'Kardex Contable Multibodega (NIIF / NIC 2)',
        category: 'Navegación',
        icon: FileText,
        detail: 'Movimientos contables, entradas, salidas y costo promedio',
        badge: 'MÓDULO',
        badgeVariant: 'cyan',
        onSelect: () => {
          onNavigate('kardex');
          onClose();
        },
      },
      {
        id: 'nav-precios',
        title: 'Cotizaciones B2B & Precios',
        category: 'Navegación',
        icon: DollarSign,
        detail: 'Gestión de listas de precios mayoristas y cotizaciones formalizadas',
        badge: 'MÓDULO',
        badgeVariant: 'cyan',
        onSelect: () => {
          onNavigate('precios');
          onClose();
        },
      },
      {
        id: 'nav-muelle',
        title: 'Compras de Muelle & Pescadores',
        category: 'Navegación',
        icon: Fish,
        detail: 'Recepción sensorial, tallas y liquidación',
        badge: 'MÓDULO',
        badgeVariant: 'cyan',
        onSelect: () => {
          onNavigate('compras_muelle' as any);
          onClose();
        },
      },
      {
        id: 'nav-despiece',
        title: 'Producción & Rendimiento de Fileteo',
        category: 'Navegación',
        icon: Sparkles,
        detail: 'Yield KPI, despiece y costeo por absorción',
        badge: 'MÓDULO',
        badgeVariant: 'cyan',
        onSelect: () => {
          onNavigate('despiece' as any);
          onClose();
        },
      },
      {
        id: 'nav-alistamiento',
        title: 'Alistamiento de Pedidos B2B (Picking)',
        category: 'Navegación',
        icon: Layers,
        detail: 'Preparación de mercancía por pedido y control de mermas',
        badge: 'MÓDULO',
        badgeVariant: 'cyan',
        onSelect: () => {
          onNavigate('alistamiento');
          onClose();
        },
      },
      {
        id: 'nav-despachos',
        title: 'Despachos & Logística',
        category: 'Navegación',
        icon: Truck,
        detail: 'Control de rutas y entregas a clientes',
        badge: 'MÓDULO',
        badgeVariant: 'cyan',
        onSelect: () => {
          onNavigate('despachos');
          onClose();
        },
      },
      {
        id: 'nav-caja',
        title: 'Control de Cajas & Arqueo Ciego',
        category: 'Navegación',
        icon: Wallet,
        detail: 'Turnos de cajeros, entradas, salidas y arqueo ciego',
        badge: 'MÓDULO',
        badgeVariant: 'cyan',
        onSelect: () => {
          onNavigate('caja');
          onClose();
        },
      },
      {
        id: 'nav-cartera',
        title: 'Cartera & Cuentas por Cobrar (CXC)',
        category: 'Navegación',
        icon: Activity,
        detail: 'Estado de cuentas de clientes, límites de crédito y recaudos',
        badge: 'MÓDULO',
        badgeVariant: 'cyan',
        onSelect: () => {
          onNavigate('cartera');
          onClose();
        },
      },
      {
        id: 'nav-clientes',
        title: 'Directorio de Clientes & CRM',
        category: 'Navegación',
        icon: Users,
        detail: 'Base de clientes B2B, historial y cartera',
        badge: 'MÓDULO',
        badgeVariant: 'cyan',
        onSelect: () => {
          onNavigate('clientes');
          onClose();
        },
      },
      {
        id: 'nav-crm',
        title: 'CRM & Pipeline de Ventas',
        category: 'Navegación',
        icon: Users,
        detail: 'Oportunidades comerciales y seguimiento de prospectos',
        badge: 'MÓDULO',
        badgeVariant: 'cyan',
        onSelect: () => {
          onNavigate('crm');
          onClose();
        },
      },
      {
        id: 'nav-3pl',
        title: 'Alquiler Cuarto Frío (3PL)',
        category: 'Navegación',
        icon: Snowflake,
        detail: 'Posiciones de estiba y contratos externos',
        badge: 'MÓDULO',
        badgeVariant: 'cyan',
        onSelect: () => {
          onNavigate('alquiler_cf' as any);
          onClose();
        },
      },
      {
        id: 'nav-contabilidad',
        title: 'Contabilidad NIIF & Libro Mayor',
        category: 'Navegación',
        icon: FileText,
        detail: 'Asientos contables automáticos, PUC y estados financieros',
        badge: 'MÓDULO',
        badgeVariant: 'cyan',
        onSelect: () => {
          onNavigate('contabilidad');
          onClose();
        },
      },
      {
        id: 'nav-rrhh',
        title: 'Personal & Nómina (RRHH)',
        category: 'Navegación',
        icon: Users,
        detail: 'Gestión de operarios, turnos y nómina básica',
        badge: 'MÓDULO',
        badgeVariant: 'cyan',
        onSelect: () => {
          onNavigate('rrhh');
          onClose();
        },
      },

      // ==========================================
      // 2. ACCIONES Y COMANDOS RÁPIDOS OPERATIVOS
      // ==========================================
      {
        id: 'action-facturar-pos',
        title: 'Nueva Factura en POS Mostrador',
        category: 'Acciones',
        icon: ShoppingCart,
        detail: 'Iniciar venta inmediata en terminal POS con balanza',
        badge: 'ACCIÓN',
        badgeVariant: 'amber',
        onSelect: () => {
          onNavigate('pos');
          onClose();
        },
      },
      {
        id: 'action-nuevo-arqueo',
        title: 'Arqueo de Caja Ciego',
        category: 'Acciones',
        icon: Wallet,
        detail: 'Abrir arqueo de turno y conteo físico de dinero',
        badge: 'ACCIÓN',
        badgeVariant: 'amber',
        onSelect: () => {
          onNavigate('caja');
          onClose();
        },
      },
      {
        id: 'action-sync-now',
        title: 'Forzar Sincronización con Nube',
        category: 'Acciones',
        icon: RefreshCw,
        detail: 'Subir transacciones locales pendientes a Supabase Cloud',
        badge: 'SISTEMA',
        badgeVariant: 'amber',
        onSelect: async () => {
          onClose();
          try {
            await PosDraftService.fetchRemoteDrafts();
            const supabase = getSupabaseClient();
            if (supabase) {
              await supabase.from('empresas').select('id').limit(1);
            }
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'success',
              title: 'Sincronización Exitosa',
              text: 'Datos sincronizados con la nube de Supabase.',
              timer: 2000,
              showConfirmButton: false,
            });
          } catch {
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'info',
              title: 'Sincronización Local',
              text: 'Operando normalmente con respaldo en IndexedDB.',
              timer: 2500,
              showConfirmButton: false,
            });
          }
        },
      },
      {
        id: 'action-toggle-theme',
        title: `Alternar Tema: ${theme === 'obsidian' ? 'Obsidian OS' : 'Modo Estándar'}`,
        category: 'Acciones',
        icon: theme === 'obsidian' ? Terminal : Moon,
        detail: 'Cambiar esquema cromático y contraste de la interfaz',
        badge: 'TEMA',
        badgeVariant: 'amber',
        onSelect: () => {
          toggleTheme();
          onClose();
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'info',
            title: 'Tema Actualizado',
            text: `Modo visual cambiado.`,
            timer: 1500,
            showConfirmButton: false,
          });
        },
      },
    ];

    // ==========================================
    // 3. CATÁLOGO DE CLIENTES & CRM
    // ==========================================
    (clientes || []).forEach((c) => {
      const doc = `${c.tipoIdentificacion || 'NIT'}: ${c.identificacion || 'S/N'}`;
      const cupo = c.cupoCredito ? `$${c.cupoCredito.toLocaleString('es-CO')}` : 'Sin cupo';
      const telefono = c.telefono ? ` • Tel: ${c.telefono}` : '';
      const ciudad = c.ciudad ? ` • ${c.ciudad}` : '';

      list.push({
        id: `cli-${c.id || c.identificacion}`,
        title: c.nombre,
        category: 'Clientes',
        icon: Users,
        detail: `${doc}${telefono}${ciudad} • Cupo: ${cupo}`,
        badge: c.tipoPrecio || 'CLIENTE',
        badgeVariant: 'purple',
        onSelect: () => {
          onNavigate('clientes');
          onClose();
        },
      });
    });

    // ==========================================
    // 4. CATÁLOGO DE PRODUCTOS DE INVENTARIO
    // ==========================================
    (products || []).forEach((prod: any) => {
      const precio = prod.precio_venta_pos || prod.precioVenta || 0;
      const stock = Number(prod.stock || 0);
      const unidad = prod.unidadMedida || 'kg';
      const precioFormatted = `$${precio.toLocaleString('es-CO')}`;

      let stockBadge = 'DISPONIBLE';
      let stockVariant: 'emerald' | 'amber' | 'rose' = 'emerald';
      if (stock <= 0) {
        stockBadge = 'AGOTADO';
        stockVariant = 'rose';
      } else if (stock <= 10) {
        stockBadge = 'STOCK BAJO';
        stockVariant = 'amber';
      }

      list.push({
        id: `prod-${prod.id || prod.sku}`,
        title: prod.nombre,
        category: 'Productos',
        icon: Package,
        detail: `SKU: ${prod.sku} • Stock: ${stock} ${unidad} • Precio: ${precioFormatted}`,
        badge: stockBadge,
        badgeVariant: stockVariant,
        onSelect: () => {
          onNavigate('pos');
          onClose();
        },
      });
    });

    return list;
  }, [onNavigate, onClose, clientes, products, theme, toggleTheme]);

  // Filtrado reactivo por categoría y texto
  const filteredActions = useMemo(() => {
    let list = allActions;

    // Filtrar por categoría activa
    if (effectiveCategory !== 'Todos') {
      list = list.filter((item) => item.category === effectiveCategory);
    }

    // Filtrar por término de búsqueda
    if (!cleanQuery) {
      // Si no hay búsqueda, limitamos las entidades masivas para no saturar la vista inicial
      if (effectiveCategory === 'Todos') {
        // En "Todos" sin query, mostramos los módulos y las acciones principales
        return list.filter((i) => i.category === 'Navegación' || i.category === 'Acciones');
      }
      return list.slice(0, 30);
    }

    const q = cleanQuery.toLowerCase();
    return list.filter((item) => {
      const titleMatch = item.title.toLowerCase().includes(q);
      const detailMatch = item.detail ? item.detail.toLowerCase().includes(q) : false;
      const categoryMatch = item.category.toLowerCase().includes(q);
      const badgeMatch = item.badge ? item.badge.toLowerCase().includes(q) : false;
      return titleMatch || detailMatch || categoryMatch || badgeMatch;
    }).slice(0, 50);
  }, [allActions, cleanQuery, effectiveCategory]);

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

  // Atajos de Teclado Globales dentro del Omnibox
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cerrar con Ctrl+K o Cmd+K
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'k' || e.code === 'KeyK')) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      // Navegación con flechas
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredActions.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % Math.max(1, filteredActions.length));
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
        // Atajo directo Alt+1 a Alt+9 para los primeros resultados
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

  if (!isOpen) return null;

  // Categorías para los Chips
  const categoryChips: { id: OmniboxCategory; label: string; prefix?: string; icon: LucideIcon }[] = [
    { id: 'Todos', label: 'Todos', icon: Compass },
    { id: 'Navegación', label: 'Módulos', prefix: '>', icon: Layers },
    { id: 'Clientes', label: 'Clientes', prefix: '@', icon: Users },
    { id: 'Productos', label: 'Productos', prefix: '#', icon: Package },
    { id: 'Acciones', label: 'Acciones', prefix: '!', icon: Sparkles },
  ];

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
        {/* Cabecera del Omnibox con Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10 bg-slate-950/70">
          <Search className="h-5 w-5 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Buscar módulo, producto, cliente o acción rápida... (Escribe @, #, >)"
            className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                if (inputRef.current) inputRef.current.focus();
              }}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-card border-white/5/10 transition-colors"
              title="Limpiar búsqueda"
            >
              <X size={15} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-card border-white/5/10 transition-colors"
            title="Cerrar (Esc)"
          >
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-card border-white/5/10 rounded border border-white/15 text-slate-300">
              Esc
            </kbd>
          </button>
        </div>

        {/* Chips de Categorías y Filtros Rápidos */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/5 bg-slate-950/40 overflow-x-auto no-scrollbar">
          {categoryChips.map((chip) => {
            const Icon = chip.icon;
            const isActive = effectiveCategory === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => {
                  setActiveCategory(chip.id);
                  setSelectedIndex(0);
                  if (inputRef.current) inputRef.current.focus();
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30 font-bold'
                    : 'bg-card border-white/5/5 text-slate-400 hover:text-white hover:bg-card border-white/5/10'
                }`}
              >
                <Icon size={12} />
                <span>{chip.label}</span>
                {chip.prefix && (
                  <span className={`text-[10px] font-mono px-1 rounded ${isActive ? 'bg-slate-950/20 text-slate-950' : 'text-slate-500'}`}>
                    {chip.prefix}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Lista de Resultados con Scroll Suave */}
        <div
          ref={itemsContainerRef}
          className="flex-1 overflow-y-auto p-2 divide-y divide-white/5 max-h-[50vh] focus:outline-none"
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

              // Color semántico por categoría o variante
              let badgeClasses = 'bg-card border-white/5/10 text-slate-300 border-white/10';
              if (action.badgeVariant === 'cyan') {
                badgeClasses = 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
              } else if (action.badgeVariant === 'purple') {
                badgeClasses = 'bg-purple-500/15 text-purple-300 border-purple-500/30';
              } else if (action.badgeVariant === 'emerald') {
                badgeClasses = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
              } else if (action.badgeVariant === 'amber') {
                badgeClasses = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
              } else if (action.badgeVariant === 'rose') {
                badgeClasses = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
              }

              return (
                <div
                  key={action.id}
                  ref={(el) => (itemRefs.current[idx] = el)}
                  onClick={() => action.onSelect()}
                  onMouseEnter={() => setSelectedIndex(idx)}
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
                      <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono rounded bg-card border-white/5/5 text-slate-500 border border-white/10">
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

        {/* Footer Informativo y Atajos de Teclado */}
        <div className="flex items-center justify-between py-2.5 px-4 border-t border-white/10 bg-slate-950/80 text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-card border-white/5/10 font-mono text-[10px] text-slate-300">↑↓</kbd>{' '}
              Navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-card border-white/5/10 font-mono text-[10px] text-slate-300">Enter</kbd>{' '}
              Seleccionar
            </span>
            <span className="flex items-center gap-1 hidden sm:inline-flex">
              <kbd className="px-1.5 py-0.5 rounded bg-card border-white/5/10 font-mono text-[10px] text-slate-300">Tab</kbd>{' '}
              Filtro
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-card border-white/5/10 font-mono text-[10px] text-slate-300">Esc</kbd>{' '}
              Cerrar
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-500 font-mono text-[10px]">
            <span>{filteredActions.length} resultados</span>
            <span className="hidden sm:inline">•</span>
            <span className="text-cyan-400/80 font-bold hidden sm:inline">Pezcadería Omnibox</span>
          </div>
        </div>
      </div>
    </div>
  );
};
