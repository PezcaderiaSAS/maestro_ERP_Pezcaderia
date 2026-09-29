import React from 'react';
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
} from 'lucide-react';
import type { ERPViewKey } from './EnterpriseSidebar';

interface EnterpriseTopbarProps {
  currentView: ERPViewKey;
  onNavigateHome: () => void;
  onNavigatePOS: () => void;
  onToggleSidebar: () => void;
  theme: string;
  onToggleTheme: () => void;
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
  activeBodega = 'Bodega Principal',
  onSelectBodega,
  onOpenOmnibox,
}) => {
  // Breadcrumb dinámico por dominio
  const getBreadcrumb = (): { domain: string; sub: string } => {
    switch (currentView) {
      case 'inventario':
        return { domain: 'Operaciones & WMS', sub: 'Existencias & Kardex Multibodega' };
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
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
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
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white/10 rounded border border-white/15 text-slate-300">
            Ctrl+K
          </kbd>
        </button>

        {/* Selector de Bodega / Sucursal Activa */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/40 border border-white/5 text-xs text-slate-300">
          <Store size={14} className="text-cyan-400" />
          <span className="font-semibold text-white">{activeBodega}</span>
        </div>

        {/* Nombre de Empresa / Sistema */}
        <span className="hidden xl:inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
          {theme === 'obsidian' ? 'OBSIDIAN_OS V2.4' : 'PEZCADERIA S.A.S'}
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

        {/* Alternador de Tema */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          title="Alternar Tema Obsidian / Slate"
        >
          {theme === 'obsidian' ? <Terminal size={17} className="text-cyan-400" /> : <Moon size={17} />}
        </button>

        {/* Avatar Usuario Compacto */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold text-xs flex items-center justify-center ring-2 ring-white/10 shrink-0">
          Yu
        </div>
      </div>
    </header>
  );
};
