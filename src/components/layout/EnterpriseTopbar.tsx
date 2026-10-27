import React, { useState } from 'react';
import {
  Menu,
  ChevronRight,
  Home,
  ShoppingCart,
  Store,
  Search,
  Palette,
  Check,
} from 'lucide-react';
import type { ERPViewKey } from './EnterpriseSidebar';
import { getRouteBreadcrumbs, AppRouteId } from '../../routes/AppRoute';
import { NetworkSyncStatusBadge } from './NetworkSyncStatusBadge';
import { useAppStore } from '../../store/useAppStore';
import { getInitials } from '../../utils/roleMapper';
import { UserSwitchModal } from './UserSwitchModal';

export const THEMES_CONFIG = [
  {
    id: 'pezcaderia-glass',
    label: 'Dark Glass V8',
    badge: 'PEZCADERIA V8',
    primaryColor: '#ef4444',
    accentColor: '#06b6d4',
  },
  {
    id: 'hyper-cobalt',
    label: 'Hyper Cobalt',
    badge: 'COBALT & SAND',
    primaryColor: '#0038FF',
    accentColor: '#FFD8B8',
  },
  {
    id: 'carbon-teal',
    label: 'Carbon Teal',
    badge: 'TEAL & MINT',
    primaryColor: '#042F32',
    accentColor: '#D6FFCB',
  },
  {
    id: 'chrome-violet',
    label: 'Chrome Violet',
    badge: 'VIOLET & BLUE',
    primaryColor: '#5F2CFF',
    accentColor: '#DFF6FF',
  },
];

interface EnterpriseTopbarProps {
  currentView: ERPViewKey;
  onNavigateHome: () => void;
  onNavigatePOS: () => void;
  onToggleSidebar: () => void;
  theme: string;
  onToggleTheme: () => void;
  onSelectTheme?: (theme: string) => void;
  activeBodega?: string;
  onSelectBodega?: (bodega: string) => void;
  onOpenOmnibox?: () => void;
}

/**
 * EnterpriseTopbar - Barra Superior Flotante Oficial Dark Glassmorphism V8.
 * Incorpora specular highlight superior, desenfoque de 24px y controles semánticos.
 */
export const EnterpriseTopbar: React.FC<EnterpriseTopbarProps> = ({
  currentView,
  onNavigateHome,
  onNavigatePOS,
  onToggleSidebar,
  theme,
  onToggleTheme,
  onSelectTheme,
  activeBodega = 'Bodega Principal',
  onSelectBodega,
  onOpenOmnibox,
}) => {
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isUserSwitchOpen, setIsUserSwitchOpen] = useState(false);
  const currentUser = useAppStore((s) => s.currentUser);
  const currentThemeConfig = THEMES_CONFIG.find((t) => t.id === theme) || THEMES_CONFIG[0];

  const breadcrumb = getRouteBreadcrumbs(currentView as AppRouteId);

  return (
    <header
      style={{
        transform: 'translateZ(0)',
        boxShadow:
          '0 20px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)',
      }}
      className="h-12 mx-2.5 mt-1.5 mb-1 flex items-center justify-between px-3.5 lg:px-5 rounded-2xl bg-slate-900/85 backdrop-blur-2xl border border-white/12 text-slate-200 select-none z-30 sticky top-1.5 shadow-xl transition-all duration-200"
    >
      {/* Sección Izquierda: Toggle + Breadcrumb Flotante */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Menú de Navegación (Ctrl+B)"
          aria-label="Menú de Navegación"
        >
          <Menu size={18} />
        </button>

        {/* Breadcrumb estilo Glassmorphism V8 */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={onNavigateHome}
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 font-semibold"
          >
            <Home size={14} />
            <span className="hidden sm:inline">ERP</span>
          </button>
          <ChevronRight size={12} className="text-slate-500" />
          <span className="text-slate-400 hidden md:inline font-semibold">{breadcrumb.domain}</span>
          <ChevronRight size={12} className="text-slate-500 hidden md:inline" />
          <span 
            className="text-white font-black truncate max-w-[140px] sm:max-w-[200px] md:max-w-[260px] lg:max-w-[340px]"
            title={breadcrumb.sub}
          >
            {breadcrumb.sub}
          </span>
        </div>
      </div>

      {/* Sección Derecha: Omnibox, Selector de Bodega, Botón POS, Tema y Perfil */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Buscador Rápido Omnibox (F8 / Ctrl+K) */}
        <button
          onClick={onOpenOmnibox}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition-all cursor-pointer shadow-xs font-medium"
          title="Buscador Universal Omnibox (F8 / Ctrl+K)"
          aria-label="Buscar"
        >
          <Search size={14} className="text-cyan-400" />
          <span className="hidden md:inline font-medium">Buscar...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono bg-white/10 rounded border border-white/10 text-slate-300 font-bold">
            Ctrl+K
          </kbd>
        </button>

        {/* Selector de Bodega / Sucursal Activa */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">
          <Store size={14} className="text-cyan-400" />
          <span className="font-bold text-white">{activeBodega}</span>
        </div>

        {/* Indicador de Conectividad Outbox / Red */}
        <NetworkSyncStatusBadge className="hidden sm:inline-flex" />

        {/* Badge de Versión V8 */}
        <span className="hidden xl:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-white/5 text-slate-300 border border-white/10 font-mono">
          {currentThemeConfig.badge}
        </span>

        {/* Botón Destacado Facturar POS con Bloque Rojo Code XR */}
        <button
          id="topbar-btn-facturar-pos"
          onClick={onNavigatePOS}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs text-white shadow-md transition-all cursor-pointer ${
            currentView === 'pos'
              ? 'bg-red-600 ring-2 ring-red-500/50 shadow-red-600/30'
              : 'bg-red-600/90 hover:bg-red-600 shadow-red-600/20'
          }`}
          title="Abrir Punto de Venta (POS)"
        >
          <ShoppingCart size={14} />
          <span className="hidden sm:inline">Facturar POS</span>
        </button>

        {/* Selector y Alternador Multi-Tema Glass */}
        <div className="relative">
          <button
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            className="flex items-center gap-1.5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
            title={`Tema actual: ${currentThemeConfig.label} (Click para cambiar)`}
            aria-label="Selector de temas"
          >
            <Palette size={16} className="text-cyan-400" />
            <span
              className="w-2.5 h-2.5 rounded-full ring-1 ring-white/20"
              style={{ backgroundColor: currentThemeConfig.primaryColor }}
            />
          </button>

          {isThemeMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-48 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-white/12 shadow-2xl p-1.5 z-50 text-xs font-sans text-slate-200"
              style={{ isolation: 'isolate' }}
            >
              <div className="px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-white/10 mb-1 flex items-center justify-between">
                <span>Temas V8</span>
                <span className="text-[9px] text-cyan-400 font-mono font-bold">GLASS V8</span>
              </div>
              {THEMES_CONFIG.map((t) => {
                const isActive = t.id === theme;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      if (onSelectTheme) {
                        onSelectTheme(t.id);
                      } else {
                        onToggleTheme();
                      }
                      setIsThemeMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-red-600 text-white font-bold shadow-md shadow-red-600/20'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                        style={{ backgroundColor: t.primaryColor }}
                      />
                      <span>{t.label}</span>
                    </div>
                    {isActive && <Check size={14} className="text-white shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Botón Perfil de Usuario y Cambio Rápido de Sesión */}
        <button
          type="button"
          aria-label={`Perfil de usuario: ${currentUser?.nombre || 'Usuario'}`}
          onClick={() => setIsUserSwitchOpen(true)}
          className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer shadow-xs active:scale-95 group"
          title={`Usuario activo: ${currentUser?.nombre || 'Desconocido'} (${currentUser?.rol || 'Sin Rol'}). Clic para cambiar de usuario.`}
        >
          <div
            className={`w-7 h-7 rounded-full bg-gradient-to-tr ${
              currentUser?.avatarColor || 'from-indigo-600 to-blue-700'
            } text-white font-bold text-xs flex items-center justify-center ring-2 ring-white/20 shrink-0 shadow-sm group-hover:scale-105 transition-transform`}
          >
            {getInitials(currentUser?.nombre || 'US')}
          </div>
          <div className="hidden lg:flex flex-col text-left leading-none pr-1">
            <span className="text-xs font-bold text-white truncate max-w-[100px]">
              {currentUser?.nombre ? currentUser.nombre.split(' ')[0] : 'Usuario'}
            </span>
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase mt-0.5">
              {currentUser?.rol || 'vendedor'}
            </span>
          </div>
        </button>

        {/* Modal Táctil de Conmutación de Usuario */}
        <UserSwitchModal
          isOpen={isUserSwitchOpen}
          onClose={() => setIsUserSwitchOpen(false)}
        />
      </div>
    </header>
  );
};
