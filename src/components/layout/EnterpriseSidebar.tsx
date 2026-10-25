import React, { useState, useEffect } from 'react';
import {
  type LucideIcon,
  Boxes,
  PackageCheck,
  Truck,
  Snowflake,
  Anchor,
  Scissors,
  ShoppingCart,
  ShoppingBag,
  DollarSign,
  Users,
  PieChart,
  Database,
  Wallet,
  BookOpen,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  FileText,
  PanelLeftClose,
  PanelLeft,
  Sparkles,
  Warehouse,
  Building2,
  BarChart3,
  Store,
} from 'lucide-react';

import { AppRouteId, type ERPViewKey } from '../../routes/AppRoute';

export type { ERPViewKey };
export { AppRouteId };

interface NavItem {
  key: ERPViewKey;
  label: string;
  icon: LucideIcon;
  badge?: number | string;
  badgeVariant?: 'cyan' | 'emerald' | 'amber' | 'rose';
  testId: string;
}

interface NavDomain {
  id: string;
  title: string;
  icon: LucideIcon;
  items: NavItem[];
}

interface EnterpriseSidebarProps {
  currentView: ERPViewKey;
  onSelectView: (view: ERPViewKey) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  userRole: string;
  onChangeRole: (role: string) => void;
  pendingPrepCount?: number;
  activeRoutesCount?: number;
}

export const EnterpriseSidebar: React.FC<EnterpriseSidebarProps> = ({
  currentView,
  onSelectView,
  isOpen,
  onToggleOpen,
  userRole,
  onChangeRole,
  pendingPrepCount = 0,
  activeRoutesCount = 0,
}) => {
  // Estado de acordeones de dominios: solo el dominio activo expandido por defecto para erradicar saturación
  const [collapsedDomains, setCollapsedDomains] = useState<Record<string, boolean>>(() => {
    // Si currentView pertenece a un dominio, se abre ese y se colapsan los demás
    const isOperaciones = ['inventario', 'configuracion_bodegas', 'alistamiento', 'despachos', 'alquiler_cf', AppRouteId.OTIF_DASHBOARD].includes(currentView as any);
    const isAbastecimiento = ['compras_muelle', 'despiece', 'compras'].includes(currentView as any);
    const isVentas = ['pos', 'ventas_b2b', AppRouteId.B2B_PORTAL, 'precios', 'clientes', 'crm'].includes(currentView as any);
    const isFinanzas = ['caja', 'cartera', 'contabilidad', 'rrhh'].includes(currentView as any);

    return {
      operaciones: !isOperaciones,
      abastecimiento: !isAbastecimiento,
      ventas: !isVentas,
      finanzas: !isFinanzas,
    };
  });

  const toggleDomain = (domainId: string) => {
    setCollapsedDomains((prev) => ({
      ...prev,
      [domainId]: !prev[domainId],
    }));
  };

  // Atajo de teclado: Ctrl+B para colapsar/expandir el sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        onToggleOpen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleOpen]);

  // Definición de los 4 Dominios Clave (Enterprise Design System)
  const domains: NavDomain[] = [
    {
      id: 'operaciones',
      title: 'OPERACIONES & WMS',
      icon: Boxes,
      items: [
        {
          key: 'inventario',
          label: 'Bodegas & WMS',
          icon: Warehouse,
          testId: 'nav-inventario',
        },
        {
          key: 'configuracion_bodegas',
          label: 'Gestión de Bodegas',
          icon: Building2,
          testId: 'nav-config-bodegas',
        },
        {
          key: 'alistamiento',
          label: 'Alistamiento B2B',
          icon: PackageCheck,
          badge: pendingPrepCount > 0 ? pendingPrepCount : undefined,
          badgeVariant: 'cyan',
          testId: 'nav-alistamiento',
        },
        {
          key: 'despachos',
          label: 'Despachos & Rutas',
          icon: Truck,
          badge: activeRoutesCount > 0 ? activeRoutesCount : undefined,
          badgeVariant: 'amber',
          testId: 'nav-despachos',
        },
        {
          key: 'alquiler_cf',
          label: 'Alquiler Cuarto Frío',
          icon: Snowflake,
          testId: 'nav-alquiler-cf',
        },
        {
          key: AppRouteId.OTIF_DASHBOARD,
          label: 'Métricas OTIF & SLA',
          icon: BarChart3,
          testId: 'nav-metricas-otif',
        },
      ],
    },
    {
      id: 'abastecimiento',
      title: 'ABASTECIMIENTO & PLANTA',
      icon: Anchor,
      items: [
        {
          key: 'compras_muelle',
          label: 'Compras en Muelle',
          icon: Anchor,
          testId: 'nav-compras-muelle',
        },
        {
          key: 'despiece',
          label: 'Producción & Yield',
          icon: Scissors,
          testId: 'nav-despiece',
        },
        {
          key: 'compras',
          label: 'Órdenes de Compra',
          icon: ShoppingCart,
          testId: 'nav-compras',
        },
      ],
    },
    {
      id: 'ventas',
      title: 'VENTAS & COMERCIAL',
      icon: ShoppingBag,
      items: [
        {
          key: 'pos',
          label: 'Punto de Venta (POS)',
          icon: ShoppingBag,
          testId: 'nav-pos',
        },
        {
          key: 'ventas_b2b',
          label: 'Ventas B2B Bodega',
          icon: ShoppingBag,
          testId: 'nav-ventas-b2b',
        },
        {
          key: AppRouteId.B2B_PORTAL,
          label: 'Portal Clientes HORECA',
          icon: Store,
          testId: 'nav-portal-b2b',
        },
        {
          key: 'precios',
          label: 'Cotizaciones B2B',
          icon: DollarSign,
          testId: 'nav-precios',
        },
        {
          key: 'clientes',
          label: 'Directorio Clientes',
          icon: Users,
          testId: 'nav-clientes',
        },
        {
          key: 'crm',
          label: 'CRM Comercial',
          icon: PieChart,
          testId: 'nav-crm',
        },
      ],
    },
    {
      id: 'finanzas',
      title: 'FINANZAS & ADMIN',
      icon: Wallet,
      items: [
        {
          key: 'caja',
          label: 'Control de Cajas',
          icon: Database,
          testId: 'nav-caja',
        },
        {
          key: 'cartera',
          label: 'Cartera & Cobranzas',
          icon: Wallet,
          testId: 'nav-cartera',
        },
        {
          key: 'contabilidad',
          label: 'Contabilidad NIIF',
          icon: BookOpen,
          testId: 'nav-contabilidad',
        },
        {
          key: 'rrhh',
          label: 'Personal & Nómina',
          icon: Users,
          testId: 'nav-rrhh',
        },
      ],
    },
  ];

  return (
    <>
      {/* Overlay para móvil */}
      <div
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onToggleOpen}
      />

      <aside
        id="enterprise-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white border-r border-slate-200 text-slate-700 transition-all duration-300 ease-in-out select-none shadow-lg ${
          isOpen ? 'w-64 translate-x-0' : 'w-20 lg:w-20 -translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header del Sidebar */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
              <span className="text-lg">🐟</span>
            </div>
            {isOpen && (
              <div className="flex flex-col truncate">
                <span className="text-sm font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                  La Pezcadería
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono font-bold">
                    ERP
                  </span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono font-semibold">ENTERPRISE V3.1</span>
              </div>
            )}
          </div>

          <button
            onClick={onToggleOpen}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors hidden lg:flex items-center justify-center"
            title={isOpen ? 'Colapsar menú (Ctrl+B)' : 'Expandir menú (Ctrl+B)'}
          >
            {isOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
          </button>
        </div>

        {/* Perfil Compacto y Botón POS */}
        <div className="p-2.5 border-b border-slate-200 space-y-2 bg-slate-50/40">
          {/* Card de Usuario Compacta */}
          <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white border border-slate-200 shadow-xs">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-xs">
              Yu
            </div>
            {isOpen && (
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-slate-900 block truncate leading-tight">Yurgen Moreno</span>
                <select
                  value={userRole}
                  onChange={(e) => onChangeRole(e.target.value)}
                  className="w-full text-[10px] bg-transparent text-slate-600 font-semibold border-0 p-0 outline-none cursor-pointer hover:text-indigo-600 transition-colors"
                >
                  <option value="admin" className="bg-white text-slate-900">Super administrador</option>
                  <option value="vendedor" className="bg-white text-slate-900">Vendedor Comercial</option>
                  <option value="bodega" className="bg-white text-slate-900">Jefe de Bodega</option>
                  <option value="administrativo" className="bg-white text-slate-900">Administrativo</option>
                </select>
              </div>
            )}
          </div>

          {/* Botón Destacado Facturar POS Compacto */}
          <button
            id="sidebar-btn-facturar-pos"
            onClick={() => onSelectView('pos')}
            className={`w-full h-8 flex items-center justify-center gap-2 rounded-lg font-bold text-xs text-white shadow-xs transition-all duration-200 cursor-pointer ${
              currentView === 'pos'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 ring-2 ring-emerald-500/50 shadow-emerald-500/20'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
            }`}
            title="Abrir Punto de Venta (POS)"
          >
            <FileText size={14} />
            {isOpen && <span>Facturar POS</span>}
          </button>
        </div>

        {/* Lista de Navegación por Dominios (Espaciado Compacto Anti-Saturación) */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2">
          {domains.map((domain) => {
            const isCollapsed = collapsedDomains[domain.id];
            const hasActiveChild = domain.items.some((item) => item.key === currentView);

            return (
              <div key={domain.id} className="space-y-0.5">
                {/* Cabecera de Dominio Limpia */}
                {isOpen ? (
                  <button
                    onClick={() => toggleDomain(domain.id)}
                    className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer group"
                  >
                    <span className="flex items-center gap-1.5">
                      <domain.icon size={13} className="text-indigo-600 group-hover:scale-110 transition-transform" />
                      {domain.title}
                    </span>
                    <div className="flex items-center gap-1">
                      {isCollapsed && (
                        <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1 rounded">
                          {domain.items.length}
                        </span>
                      )}
                      {isCollapsed ? <ChevronRight size={11} className="text-slate-400" /> : <ChevronDown size={11} className="text-slate-400" />}
                    </div>
                  </button>
                ) : (
                  <div className="h-px bg-slate-200 my-1 mx-1" />
                )}

                {/* Ítems del Dominio (Filas compactas de 32px; ocultas con hidden si colapsado para no saturar) */}
                <div className={`${isCollapsed && isOpen ? 'hidden' : 'space-y-0.5'}`}>
                  {domain.items.map((item) => {
                    const isActive = currentView === item.key;
                    return (
                      <button
                        key={item.key}
                        data-testid={item.testId}
                        id={item.testId}
                        onClick={() => onSelectView(item.key)}
                        className={`w-full h-8 flex items-center gap-2 px-2.5 rounded-lg text-xs transition-all duration-150 cursor-pointer relative group ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs font-bold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
                        }`}
                        title={item.label}
                        aria-label={item.label}
                      >
                        {/* Indicador Activo Lateral */}
                        {isActive && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-indigo-600" />
                        )}

                        <item.icon
                          size={15}
                          className={`shrink-0 transition-transform group-hover:scale-110 ${
                            isActive ? 'text-indigo-600' : 'text-slate-500 group-hover:text-slate-900'
                          }`}
                        />

                        {isOpen && <span className="truncate flex-1 text-left">{item.label}</span>}

                        {/* Badge de Estado o Contador Dinámico */}
                        {isOpen && item.badge !== undefined && (
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] font-black font-mono shrink-0 ${
                              item.badgeVariant === 'cyan'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : item.badgeVariant === 'emerald'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : item.badgeVariant === 'rose'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer del Sidebar */}
        {isOpen && (
          <div className="p-3 border-t border-slate-200 bg-slate-50 text-[10px] text-slate-600 flex items-center justify-between font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Sistema Conectado
            </span>
            <span className="font-mono text-slate-500 font-bold">v3.1.0</span>
          </div>
        )}
      </aside>
    </>
  );
};
