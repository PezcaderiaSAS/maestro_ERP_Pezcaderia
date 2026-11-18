import React, { useRef, useEffect } from 'react';
import { 
  Barcode, 
  Search, 
  User, 
  Users, 
  Receipt, 
  ChevronDown, 
  X, 
  Zap, 
  ClipboardList 
} from 'lucide-react';
import type { Cliente } from '../../../types/erp.types';
import { useAuthStore } from '../../../store/useAuthStore';

export interface VendorOption {
  id: string;
  nombre: string;
  corto: string;
}

export interface POSMultivendorLightHeaderProps {
  vendedores: VendorOption[];
  selectedVendorId: string;
  onSelectVendor: (id: string) => void;
  barcodeInput: string;
  onBarcodeChange: (val: string) => void;
  onBarcodeSubmit: () => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  clienteSeleccionado?: any;
  onOpenClientModal: () => void;
  comandasPendientesCount?: number;
  onOpenComandasQueue?: () => void;
  isModoCajero?: boolean;
  onToggleModoCajero?: () => void;
  onOpenManualProduct?: () => void;
}

export const POSMultivendorLightHeader: React.FC<POSMultivendorLightHeaderProps> = ({
  vendedores,
  selectedVendorId,
  onSelectVendor,
  barcodeInput,
  onBarcodeChange,
  onBarcodeSubmit,
  searchQuery,
  onSearchChange,
  clienteSeleccionado,
  onOpenClientModal,
  comandasPendientesCount = 0,
  onOpenComandasQueue,
  isModoCajero = false,
  onToggleModoCajero,
  onOpenManualProduct,
}) => {
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const activeTenant = useAuthStore((s) => s.activeTenant);
  const isFerreteria =
    activeTenant?.id === 'tenant-03' ||
    activeTenant?.razonSocial?.toLowerCase().includes('josase') ||
    activeTenant?.razonSocial?.toLowerCase().includes('ferreter');
  const tenantRazonSocial =
    activeTenant?.razonSocial || activeTenant?.nombre || 'La Pezcadería';

  // Escuchar atajos globales de teclado F8 (Búsqueda) y F9 (Caja Única)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F8') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onBarcodeSubmit();
    }
  };

  return (
    <header 
      data-testid="pos-multivendor-light-header"
      className="h-14 sm:h-16 px-2 sm:px-3 bg-emerald-600 text-white flex items-center justify-between gap-1.5 sm:gap-2 shadow-md shrink-0 select-none z-20 border-b border-emerald-700/40 w-full min-w-0 overflow-hidden"
    >
      {/* SECCIÓN 1: Identidad Corporativa y Selector de Asesor Mostrador */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0 max-w-[42%]">
        <div className="flex items-center gap-1.5 pr-1.5 sm:pr-2 border-r border-emerald-500/50 shrink-0 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center font-black text-white text-sm shadow-inner shrink-0">
            {isFerreteria ? '🔧' : '🐟'}
          </div>
          <div className="hidden lg:block leading-tight min-w-0 max-w-[130px] xl:max-w-[180px]">
            <span 
              data-testid="pos-header-tenant-name"
              className="text-[11px] font-black uppercase tracking-wider text-emerald-100 block truncate"
              title={tenantRazonSocial}
            >
              {tenantRazonSocial}
            </span>
            <span className="text-[9px] font-semibold text-emerald-200 hidden 2xl:block truncate">
              {isFerreteria ? 'Terminal Ferretería' : 'Terminal Mostrador'}
            </span>
          </div>
        </div>

        {/* Chips de Asesores de Mostrador (Scroll Táctil Suave y Flexible sin recortes rígidos) */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 scroll-smooth min-w-0">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-200 hidden 2xl:inline pr-1 shrink-0">
            Asesor:
          </span>
          {vendedores.map((v) => {
            const isSelected = v.id === selectedVendorId;
            return (
              <button
                key={v.id}
                type="button"
                id={`btn-vendedor-${v.id}`}
                data-testid={`btn-vendedor-${v.id}`}
                onClick={() => onSelectVendor(v.id)}
                className={`min-h-[44px] px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-white text-emerald-900 shadow-md font-black ring-2 ring-emerald-300'
                    : 'bg-emerald-700/60 hover:bg-emerald-700 text-emerald-100 border border-emerald-500/40'
                }`}
                title={`Emitir preventa como ${v.nombre}`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-emerald-600' : 'bg-emerald-300/60'}`} />
                <span>{v.corto}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECCIÓN 2: Inputs Operativos — Pistola de Código de Barras & Buscador de Productos */}
      <div className="flex-1 flex items-center gap-1.5 sm:gap-2 min-w-0 max-w-xl mx-1 sm:mx-2">
        {/* Input Código de Barras (Pistola Escáner) */}
        <div className="relative w-28 sm:w-36 lg:w-40 shrink-0">
          <Barcode className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
          <input
            ref={barcodeInputRef}
            type="text"
            id="pos-light-barcode-input"
            data-testid="pos-light-barcode-input"
            value={barcodeInput}
            onChange={(e) => onBarcodeChange(e.target.value)}
            onKeyDown={handleBarcodeKeyDown}
            placeholder="Código barras..."
            className="w-full min-h-[38px] sm:min-h-[42px] pl-7 sm:pl-8 pr-2 py-1.5 rounded-lg bg-white text-slate-900 text-xs sm:text-sm font-mono placeholder-slate-400 border border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-white focus:border-white shadow-xs"
          />
        </div>

        {/* Input Buscador de Productos */}
        <div className="relative flex-1 min-w-[80px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
          <input
            ref={searchInputRef}
            type="text"
            id="pos-light-product-search-input"
            data-testid="pos-light-product-search-input"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar productos (F8)..."
            className="w-full min-h-[38px] sm:min-h-[42px] pl-7 sm:pl-8 pr-7 py-1.5 rounded-lg bg-white text-slate-900 text-xs sm:text-sm font-medium placeholder-slate-400 border border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-white focus:border-white shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* SECCIÓN 3: Selector de Cliente y Acciones Rápidas (Preservación estricta sin recortes) */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Selector de Cliente Rápido */}
        <button
          type="button"
          id="btn-header-seleccionar-cliente"
          data-testid="btn-header-seleccionar-cliente"
          onClick={onOpenClientModal}
          className="min-h-[44px] px-2 sm:px-2.5 py-1.5 rounded-lg bg-emerald-700/80 hover:bg-emerald-700 text-white text-xs font-semibold border border-emerald-500/50 flex items-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-95 shrink-0"
          title="Seleccionar o cambiar cliente asignado"
        >
          <User size={15} className="text-emerald-200 shrink-0" />
          <span className="max-w-[90px] sm:max-w-[130px] xl:max-w-[170px] truncate font-bold text-left">
            {clienteSeleccionado ? (clienteSeleccionado.nombre || clienteSeleccionado.razonSocial || clienteSeleccionado.razonSocialONombre) : 'CONSUMIDOR FINAL'}
          </span>
          <ChevronDown size={13} className="text-emerald-200 shrink-0" />
        </button>

        {/* Acceso a Comandas en Espera (Caja Central) */}
        {onOpenComandasQueue && (
          <button
            type="button"
            id="btn-open-comandas-drawer"
            data-testid="btn-open-comandas-drawer"
            onClick={onOpenComandasQueue}
            className="relative min-h-[44px] px-2 sm:px-2.5 py-1.5 rounded-lg bg-emerald-700/80 hover:bg-emerald-700 text-white text-xs font-bold border border-emerald-500/50 flex items-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-95 shrink-0"
            title="Ver cola central de comandas y preventas"
          >
            <ClipboardList size={16} className="text-emerald-200 shrink-0" />
            <span className="hidden lg:inline">Comandas</span>
            {comandasPendientesCount > 0 && (
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-xs">
                {comandasPendientesCount}
              </span>
            )}
          </button>
        )}

        {/* Toggle Modo Cajero Único (F9) */}
        {onToggleModoCajero && (
          <button
            type="button"
            id="btn-toggle-modo-cajero"
            data-testid="btn-toggle-modo-cajero"
            onClick={onToggleModoCajero}
            className={`min-h-[44px] px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-95 shrink-0 ${
              isModoCajero
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'bg-emerald-800/80 hover:bg-emerald-800 text-emerald-100 border border-emerald-500/40'
            }`}
            title="Alternar entre modo Mostrador (Preventa F6) y Caja Única (Cobro F9)"
          >
            <Receipt size={15} className="shrink-0" />
            <span className="hidden xl:inline">{isModoCajero ? 'Caja Única' : 'Mostrador'}</span>
            <kbd className="px-1 py-0.2 text-[9px] font-mono bg-black/30 rounded text-emerald-100 hidden sm:inline">
              F9
            </kbd>
          </button>
        )}

        {/* Dropdown de Más Acciones (SPEC-043 / M2) */}
        <div data-testid="pos-more-actions-dropdown" className="relative shrink-0">
          <button
            type="button"
            className="min-h-[44px] px-2 py-1.5 rounded-lg bg-emerald-700/80 hover:bg-emerald-700 text-white text-xs font-bold border border-emerald-500/50 flex items-center gap-1 cursor-pointer transition-all shadow-xs active:scale-95"
            title="Más Opciones del POS"
          >
            <span className="hidden sm:inline">Más</span>
            <ChevronDown size={13} className="text-emerald-200" />
          </button>
        </div>
      </div>
    </header>
  );
};

