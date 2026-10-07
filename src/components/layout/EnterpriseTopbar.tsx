import React, { useState, useEffect } from 'react';
import {
  Menu,
  ChevronRight,
  Terminal,
  Moon,
  Sun,
  Home,
  ShoppingCart,
  PlusCircle,
  HelpCircle,
  Sparkles,
  Store,
  Search,
  Palette,
  Check,
} from 'lucide-react';
import type { ERPViewKey } from './EnterpriseSidebar';
import { NetworkSyncStatusBadge } from './NetworkSyncStatusBadge';

export const THEMES_CONFIG = [
  {
    id: 'pezcaderia-glass',
    label: 'Dark Glass',
    badge: 'PEZCADERIA S.A.S',
    primaryColor: '#4f46e5',
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
  const currentThemeConfig = THEMES_CONFIG.find((t) => t.id === theme) || THEMES_CONFIG[0];

  // Breadcrumb dinámico por dominio
  const getBreadcrumb = (): { domain: string; sub: string } => {
    switch (currentView) {
      case 'inventario':
        return { domain: 'Operaciones & WMS', sub: 'Bodegas & WMS (Inventario Multibodega)' };
      case 'configuracion_bodegas':
        return { domain: 'Operaciones & WMS', sub: 'Gestión de Bodegas & Cuartos Fríos' };
      case 'kardex':
        return { domain: 'Operaciones & WMS', sub: 'Kardex Contable Multibodega (NIIF)' };
      case 'alistamiento':
        return { domain: 'Operaciones & WMS', sub: 'Alistamiento de Pedidos B2B' };
      case 'despachos':
        return { domain: 'Operaciones & WMS', sub: 'Despachos, Rutas & Liquidación OTIF' };
      case 'alquiler_cf':
        return { domain: 'Operaciones & WMS', sub: 'Alquiler de Cuartos Fríos (3PL)' };
      case 'compras_muelle':
        return { domain: 'Abastecimiento & Planta', sub: 'Compras de Muelle & Liquidación' };
      case 'despiece':
        return { domain: 'Abastecimiento & Planta', sub: 'Transformación, Fileteo & Yield KPI' };
      case 'compras':
        return { domain: 'Abastecimiento & Planta', sub: 'Órdenes de Compra a Proveedores' };
      case 'pos':
        return { domain: 'Ventas & Comercial', sub: 'Punto de Venta (POS Mostrador)' };
      case 'precios':
        return { domain: 'Ventas & Comercial', sub: 'Cotizaciones B2B & Precios' };
      case 'clientes':
        return { domain: 'Ventas & Comercial', sub: 'Directorio de Clientes' };
      case 'crm':
        return { domain: 'Ventas & Comercial', sub: 'CRM Comercial' };
      case 'caja':
        return { domain: 'Finanzas & Admin', sub: 'Control de Cajas & Arqueo Ciego' };
      case 'cartera':
        return { domain: 'Finanzas & Admin', sub: 'Cartera & Cuentas por Cobrar' };
      case 'contabilidad':
        return { domain: 'Finanzas & Admin', sub: 'Contabilidad NIIF (Libro Mayor)' };
      case 'rrhh':
        return { domain: 'Finanzas & Admin', sub: 'Personal & Nómina (RRHH)' };
      default:
        return { domain: 'Panel General', sub: 'Dashboard Ejecutivo' };
    }
  };

  const breadcrumb = getBreadcrumb();

  return (
    <header className="h-16 flex items-center justify-between px-4 lg:px-6 bg-[#090D16]/90 backdrop-blur-xl border-b border-white/10 select-none z-30 sticky top-0 shadow-lg">
      {/* Sección Izquierda: Toggle + Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-card border-white/5/5 transition-colors cursor-pointer"
          title="Menú de Navegación"
        >
          <Menu size={20} />
        </button>

        {/* Breadcrumb sutil estilo Atlassian */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={onNavigateHome}
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 font-medium"
          >
            <Home size={14} />
            <span className="hidden sm:inline">ERP</span>
          </button>
          <ChevronRight size={12} className="text-slate-500" />
          <span className="text-slate-400 hidden md:inline font-medium">{breadcrumb.domain}</span>
          <ChevronRight size={12} className="text-slate-500 hidden md:inline" />
          <span className="text-white font-bold truncate max-w-[200px] sm:max-w-none">
            {breadcrumb.sub}
          </span>
        </div>
      </div>

      {/* Sección Derecha: Omnibox, Selector de Bodega, Botón POS, Tema y Perfil */}
      <div className="flex items-center gap-2.5">
        {/* Buscador Rápido Omnibox (Ctrl + K) */}
        <button
          onClick={onOpenOmnibox}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-white/10 text-xs text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
          title="Buscador Universal (Ctrl + K)"
        >
          <Search size={14} className="text-cyan-400" />
          <span className="hidden md:inline font-medium">Buscar...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-card border-white/5/10 rounded border border-white/15 text-slate-300">
            Ctrl+K
          </kbd>
        </button>

        {/* Selector de Bodega / Sucursal Activa */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/40 border border-white/5 text-xs text-slate-300">
          <Store size={14} className="text-cyan-400" />
          <span className="font-semibold text-white">{activeBodega}</span>
        </div>

        {/* Indicador de Conectividad Outbox / Red con Sincronización en Tiempo Real */}
        <NetworkSyncStatusBadge className="hidden sm:inline-flex" />

        {/* Nombre de Empresa / Sistema / Badge de Tema */}
        <span className="hidden xl:inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
          {currentThemeConfig.badge}
        </span>

        {/* Botón Destacado Facturar POS */}
        <button
          id="topbar-btn-facturar-pos"
          onClick={onNavigatePOS}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <ShoppingCart size={14} />
          <span className="hidden sm:inline">Facturar POS</span>
        </button>

        {/* Selector y Alternador Multi-Tema Glass */}
        <div className="relative">
          <button
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            className="flex items-center gap-1.5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 border border-white/10 transition-colors cursor-pointer"
            title={`Tema actual: ${currentThemeConfig.label} (Click para cambiar)`}
          >
            <Palette size={17} className="text-cyan-400" />
            <span
              className="w-2.5 h-2.5 rounded-full ring-1 ring-white/20"
              style={{ backgroundColor: currentThemeConfig.primaryColor }}
            />
          </button>

          {isThemeMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900/95 backdrop-blur-xl border border-white/15 shadow-2xl p-1.5 z-50 text-xs font-sans"
              style={{ isolation: 'isolate' }}
            >
              <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10 mb-1 flex items-center justify-between">
                <span>Temas Glass</span>
                <span className="text-[9px] text-cyan-400 font-mono">WCAG AA</span>
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
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white/10 text-white font-semibold'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                        style={{ backgroundColor: t.primaryColor }}
                      />
                      <span>{t.label}</span>
                    </div>
                    {isActive && <Check size={14} className="text-cyan-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Avatar Usuario Compacto */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold text-xs flex items-center justify-center ring-2 ring-white/10 shrink-0">
          Yu
        </div>
      </div>
    </header>
  );
};
