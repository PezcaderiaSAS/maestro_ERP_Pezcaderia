import React, { useEffect } from 'react';
import {
  type LucideIcon,
  ShoppingBag,
  Store,
  Anchor,
  Scissors,
  Warehouse,
  Building2,
  PackageCheck,
  Truck,
  Snowflake,
  ShoppingCart,
  BarChart3,
  Database,
  Wallet,
  BookOpen,
  Users,
  DollarSign,
  PieChart,
  PanelLeftClose,
  Shield,
} from 'lucide-react';

import { AppRouteId, type ERPViewKey } from '../../routes/AppRoute';
import { MacWindowControls } from './components/MacWindowControls';

export type { ERPViewKey };
export { AppRouteId };

interface NavItem {
  key: ERPViewKey;
  label: string;
  icon: LucideIcon;
  badge?: number | string;
  badgeVariant?: 'cyan' | 'emerald' | 'amber' | 'rose';
  testId: string;
  roles?: string[];
}

interface NavCategory {
  id: string;
  title: string;
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
  onCloseSession?: () => void;
}

/**
 * EnterpriseSidebar - Versión Definitiva Premium Glassmorphism & macOS Style (SPEC-030).
 * Inspirado en el diseño Code XR 'SideBar UI', Apple Pro UI y tokens Rico UI Brands.
 */
export const EnterpriseSidebar: React.FC<EnterpriseSidebarProps> = ({
  currentView,
  onSelectView,
  isOpen,
  onToggleOpen,
  userRole,
  onChangeRole,
  pendingPrepCount = 0,
  activeRoutesCount = 0,
  onCloseSession,
}) => {
  // Atajo de teclado: Ctrl+B o Cmd+B para alternar colapso/expansión
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

  // Las 3 Categorías Canónicas en mayúsculas y alto tracking (SPEC-030)
  const categories: NavCategory[] = [
    {
      id: 'menu',
      title: 'MENU',
      items: [
        {
          key: 'pos',
          label: 'Punto de Venta (POS)',
          icon: ShoppingBag,
          testId: 'nav-pos',
          roles: ['admin', 'vendedor', 'cajero', 'supervisor'],
        },
        {
          key: 'ventas_b2b',
          label: 'Ventas B2B Bodega',
          icon: Store,
          testId: 'nav-ventas-b2b',
          roles: ['admin', 'vendedor', 'supervisor'],
        },
        {
          key: 'compras_muelle',
          label: 'Compras en Muelle',
          icon: Anchor,
          testId: 'nav-compras-muelle',
          roles: ['admin', 'bodega', 'bodeguero'],
        },
        {
          key: 'despiece',
          label: 'Producción & Yield',
          icon: Scissors,
          testId: 'nav-despiece',
          roles: ['admin', 'bodega', 'bodeguero'],
        },
      ],
    },
    {
      id: 'operaciones',
      title: 'OPERACIONES',
      items: [
        {
          key: 'inventario',
          label: 'Bodegas & WMS',
          icon: Warehouse,
          testId: 'nav-inventario',
          roles: ['admin', 'bodega', 'bodeguero', 'supervisor'],
        },
        {
          key: 'configuracion_bodegas',
          label: 'Gestión de Bodegas',
          icon: Building2,
          testId: 'nav-config-bodegas',
          roles: ['admin', 'bodega', 'bodeguero'],
        },
        {
          key: 'alistamiento',
          label: 'Alistamiento B2B',
          icon: PackageCheck,
          badge: pendingPrepCount > 0 ? pendingPrepCount : undefined,
          badgeVariant: 'cyan',
          testId: 'nav-alistamiento',
          roles: ['admin', 'bodega', 'bodeguero'],
        },
        {
          key: 'despachos',
          label: 'Despachos & Rutas',
          icon: Truck,
          badge: activeRoutesCount > 0 ? activeRoutesCount : undefined,
          badgeVariant: 'amber',
          testId: 'nav-despachos',
          roles: ['admin', 'bodega', 'bodeguero', 'supervisor'],
        },
        {
          key: 'alquiler_cf',
          label: 'Alquiler Cuarto Frío',
          icon: Snowflake,
          testId: 'nav-alquiler-cf',
          roles: ['admin', 'bodega', 'bodeguero'],
        },
        {
          key: 'compras',
          label: 'Órdenes de Compra',
          icon: ShoppingCart,
          testId: 'nav-compras',
          roles: ['admin', 'bodega', 'bodeguero'],
        },
        {
          key: AppRouteId.OTIF_DASHBOARD,
          label: 'Métricas OTIF & SLA',
          icon: BarChart3,
          testId: 'nav-metricas-otif',
          roles: ['admin', 'supervisor', 'contador', 'administrativo'],
        },
      ],
    },
    {
      id: 'general',
      title: 'GENERAL',
      items: [
        {
          key: 'caja',
          label: 'Control de Cajas',
          icon: Database,
          testId: 'nav-caja',
          roles: ['admin', 'cajero', 'supervisor', 'contador', 'administrativo'],
        },
        {
          key: 'cartera',
          label: 'Cartera & Cobranzas',
          icon: Wallet,
          testId: 'nav-cartera',
          roles: ['admin', 'cajero', 'supervisor', 'contador', 'administrativo'],
        },
        {
          key: 'contabilidad',
          label: 'Contabilidad NIIF',
          icon: BookOpen,
          testId: 'nav-contabilidad',
          roles: ['admin', 'contador', 'administrativo'],
        },
        {
          key: 'rrhh',
          label: 'Personal & Nómina',
          icon: Users,
          testId: 'nav-rrhh',
          roles: ['admin', 'contador', 'administrativo'],
        },
        {
          key: 'precios',
          label: 'Cotizaciones B2B',
          icon: DollarSign,
          testId: 'nav-precios',
          roles: ['admin', 'vendedor', 'contador', 'administrativo'],
        },
        {
          key: 'clientes',
          label: 'Directorio Clientes',
          icon: Users,
          testId: 'nav-clientes',
          roles: ['admin', 'vendedor', 'supervisor'],
        },
        {
          key: 'crm',
          label: 'CRM Comercial',
          icon: PieChart,
          testId: 'nav-crm',
          roles: ['admin', 'vendedor'],
        },
        {
          key: AppRouteId.B2B_PORTAL,
          label: 'Portal Clientes HORECA',
          icon: Store,
          testId: 'nav-portal-b2b',
          roles: ['admin', 'vendedor'],
        },
        ...(userRole === 'admin'
          ? [
              {
                key: AppRouteId.SUPERADMIN,
                label: 'Master Super Admin',
                icon: Shield,
                badge: 'GOD',
                badgeVariant: 'amber' as const,
                testId: 'nav-superadmin',
                roles: ['admin'],
              },
            ]
          : []),
      ],
    },
  ];

  const normalizedRole = (userRole || 'admin').toLowerCase().trim();

  // Filtrar categorías e ítems según la matriz de roles RBAC
  const visibleCategories = categories
    .map((category) => {
      const items = category.items.filter((item) => {
        if (normalizedRole === 'admin') return true;
        if (!item.roles || item.roles.length === 0) return true;
        return (
          item.roles.includes(normalizedRole) ||
          (normalizedRole === 'bodeguero' && item.roles.includes('bodega')) ||
          (normalizedRole === 'bodega' && item.roles.includes('bodeguero'))
        );
      });
      return { ...category, items };
    })
    .filter((category) => category.items.length > 0);

  return (
    <>
      {/* Overlay translúcido para móvil */}
      <div
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onToggleOpen}
      />

      {/* Tarjeta Flotante Glassmorphism (SPEC-030 & SPEC-037: Rail Ultra-Compacto 64px con Leyes de UX) */}
      <aside
        id="enterprise-sidebar"
        style={{ transform: 'translateZ(0)' }}
        className={`fixed top-3 bottom-3 left-3 z-50 flex flex-col bg-slate-900/85 backdrop-blur-2xl border border-white/12 shadow-2xl shadow-black/60 rounded-3xl select-none transition-all duration-300 ease-in-out text-slate-300 ${
          isOpen ? 'w-64 translate-x-0' : 'w-16 -translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Cabecera Superior con Controles macOS */}
        <div
          className={`flex items-center pt-4 pb-2 ${
            isOpen ? 'justify-between px-4' : 'justify-center px-1'
          }`}
        >
          <MacWindowControls onToggleOpen={onToggleOpen} onCloseSession={onCloseSession} />

          {isOpen && (
            <button
              onClick={onToggleOpen}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors hidden lg:flex items-center justify-center cursor-pointer"
              title="Colapsar menú (Ctrl+B)"
              aria-label="Colapsar menú"
            >
              <PanelLeftClose size={16} />
            </button>
          )}
        </div>

        {/* Módulo de Usuario Superior (Directamente bajo los Controles macOS) */}
        <div
          data-testid="sidebar-user-header"
          className={`mx-2 mb-3 p-2 rounded-2xl bg-white/5 border border-white/10 shadow-inner flex items-center gap-2.5 transition-all ${
            !isOpen ? 'justify-center p-1 mx-1' : ''
          }`}
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-600 to-red-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20">
            Yu
          </div>
          {isOpen && (
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-white block truncate leading-tight tracking-tight">
                Yurgen Moreno
              </span>
              <select
                value={userRole}
                onChange={(e) => onChangeRole(e.target.value)}
                className="w-full text-[10px] bg-transparent text-slate-300 font-medium border-0 p-0 outline-none cursor-pointer hover:text-red-400 transition-colors"
                aria-label="Seleccionar rol de usuario"
              >
                <option value="admin" className="bg-slate-900 text-white">Super administrador</option>
                <option value="vendedor" className="bg-slate-900 text-white">Vendedor Comercial</option>
                <option value="cajero" className="bg-slate-900 text-white">Cajero Principal</option>
                <option value="bodega" className="bg-slate-900 text-white">Jefe de Bodega</option>
                <option value="supervisor" className="bg-slate-900 text-white">Supervisor</option>
                <option value="contador" className="bg-slate-900 text-white">Contador</option>
                <option value="administrativo" className="bg-slate-900 text-white">Administrativo</option>
              </select>
            </div>
          )}
        </div>

        {/* Lista de Navegación Categorizada */}
        <div className={`flex-1 overflow-y-auto py-1 space-y-4 custom-scrollbar ${isOpen ? 'px-3' : 'px-1'}`}>
          {visibleCategories.map((category) => (
            <div key={category.id} className="space-y-1">
              {/* Título de Categoría en Mayúsculas y Alto Tracking */}
              {isOpen ? (
                <div className="px-2 py-1 flex items-center justify-between text-[10px] font-extrabold tracking-widest text-slate-400 uppercase select-none">
                  <span>{category.title}</span>
                  <span className="text-[9px] font-mono text-slate-400/80 bg-white/5 px-1.5 py-0.5 rounded-md border border-white/5">
                    {category.items.length}
                  </span>
                </div>
              ) : (
                <div className="h-px bg-white/10 my-2 mx-1" />
              )}

              {/* Lista de Ítems */}
              <div className="space-y-1">
                {category.items.map((item) => {
                  const isActive = currentView === item.key;
                  return (
                    <button
                      key={item.key}
                      data-testid={item.testId}
                      id={item.testId}
                      onClick={() => onSelectView(item.key)}
                      className={`transition-all duration-200 cursor-pointer relative group flex items-center ${
                        isOpen
                          ? `w-full h-9 gap-3 px-3 rounded-xl text-xs ${
                              isActive
                                ? 'bg-red-600 text-white font-bold shadow-lg shadow-red-600/30'
                                : 'text-slate-400 hover:text-white hover:bg-white/10 font-medium'
                            }`
                          : `w-11 h-11 mx-auto justify-center rounded-2xl ${
                              isActive
                                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                                : 'text-slate-400 hover:text-white hover:bg-white/10'
                            }`
                      }`}
                      title={item.label}
                      aria-label={item.label}
                    >
                      <item.icon
                        size={isOpen ? 16 : 18}
                        className={`shrink-0 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                        }`}
                      />

                      {isOpen && <span className="truncate flex-1 text-left">{item.label}</span>}

                      {/* Contador Dinámico en Modo Expandido */}
                      {isOpen && item.badge !== undefined && (
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-black font-mono shrink-0 ${
                            isActive
                              ? 'bg-white text-red-600'
                              : 'bg-white/10 text-white border border-white/10'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}

                      {/* Tooltip Flotante Translúcido (Progressive Disclosure en modo Rail 64px) */}
                      {!isOpen && (
                        <div className="sidebar-tooltip opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all duration-150 absolute left-full ml-3 px-3 py-1.5 bg-slate-900/95 text-white border border-white/10 rounded-xl text-xs font-semibold whitespace-nowrap shadow-2xl shadow-black/80 z-50 flex items-center gap-2">
                          <span>{item.label}</span>
                          {item.badge !== undefined && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-white/20 text-white font-mono">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Glassmorphism */}
        {isOpen ? (
          <div className="p-3 mx-3 mb-3 border-t border-white/10 text-[10px] text-slate-400 flex items-center justify-between font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
              Sistema Conectado
            </span>
            <span className="font-mono text-slate-400/80 font-bold">v3.2.0</span>
          </div>
        ) : (
          <div className="p-2 mb-2 flex justify-center">
            <span
              className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50"
              title="Sistema Conectado v3.2.0"
            />
          </div>
        )}
      </aside>
    </>
  );
};
