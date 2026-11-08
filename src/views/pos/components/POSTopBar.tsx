import React from 'react';
import { Search, Barcode, Plus } from 'lucide-react';
import { Input } from '../../../components/ui/Input';

export interface POSTopBarProps {
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  barcodeInput: string;
  onBarcodeInput: (val: string) => void;
  onBarcodeSubmit: (e: React.FormEvent) => void;
  onSimulateScan: () => void;
  onOpenCrearProducto: () => void;
  hideOutOfStock: boolean;
  onToggleHideOutOfStock: (val: boolean) => void;
  showTopSellers: boolean;
  onToggleTopSellers: (val: boolean) => void;
  searchRef?: React.RefObject<HTMLInputElement>;
}

export const POSTopBar: React.FC<POSTopBarProps> = ({
  searchTerm,
  onSearchChange,
  barcodeInput,
  onBarcodeInput,
  onBarcodeSubmit,
  onSimulateScan,
  onOpenCrearProducto,
  hideOutOfStock,
  onToggleHideOutOfStock,
  showTopSellers,
  onToggleTopSellers,
  searchRef,
}) => {
  return (
    <div className="pos-top-bar flex flex-col gap-2 mb-2 shrink-0">
      {/* Fila Principal de Búsqueda, Código de Barras y Botón Crear Producto */}
      <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
        {/* Búsqueda por Texto */}
        <div className="flex-1 min-w-[180px] w-full lg:w-auto">
          <Input
            ref={searchRef}
            type="text"
            id="pos-product-search-input"
            data-testid="pos-product-search-input"
            placeholder="Buscar por nombre o SKU..."
            defaultValue={searchTerm}
            onChange={onSearchChange}
            leftIcon={<Search size={18} className="text-emerald-400" />}
            fullWidth
            className="min-h-[48px] text-sm font-semibold bg-slate-950/70 border border-white/12 text-white placeholder-slate-400 rounded-xl shadow-inner focus-within:border-emerald-500/50"
          />
        </div>

        {/* Búsqueda por Código de Barras */}
        <form onSubmit={onBarcodeSubmit} className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
          <div className="flex-1 sm:w-[160px] min-w-[130px]">
            <Input
              type="text"
              id="pos-barcode-input"
              data-testid="pos-barcode-input"
              placeholder="Código de Barras..."
              value={barcodeInput}
              onChange={(e) => onBarcodeInput(e.target.value)}
              leftIcon={<Barcode size={18} className="text-emerald-400" />}
              fullWidth
              className="min-h-[48px] text-sm bg-slate-950/70 border border-white/12 text-white placeholder-slate-400 rounded-xl"
            />
          </div>
          <button
            type="button"
            onClick={onSimulateScan}
            className="min-h-[44px] sm:min-h-[48px] px-3 whitespace-nowrap text-xs font-bold active:scale-95 transition-all bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-200 hover:text-white rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shrink-0"
            title="Simular lectura de escáner láser de código de barras"
          >
            <Barcode size={16} className="text-emerald-400" />
            <span>Simular Scan</span>
          </button>
        </form>

        {/* Botón "+ Crear Producto" (Estilo SaaS Maduro Emerald) */}
        <button
          type="button"
          data-testid="btn-crear-producto-rapido"
          onClick={onOpenCrearProducto}
          className="min-h-[44px] sm:min-h-[48px] px-3.5 py-2 whitespace-nowrap text-xs sm:text-sm font-bold active:scale-95 transition-all bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/25 border border-emerald-400/30 shrink-0"
          title="Crear un nuevo producto rápido en catálogo"
        >
          <Plus size={16} className="text-white" />
          <span>+ Crear Producto</span>
        </button>
      </div>

      {/* Fila Secundaria: Filtros de Stock y Productos Más Vendidos */}
      <div className="flex items-center gap-3.5 px-0.5 text-xs select-none">
        <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-400 hover:text-slate-200 transition-colors">
          <input
            type="checkbox"
            checked={!hideOutOfStock}
            onChange={(e) => onToggleHideOutOfStock(!e.target.checked)}
            className="rounded bg-slate-950 border-white/20 text-emerald-600 focus:ring-0 cursor-pointer"
          />
          <span>Ver agotados</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-400 hover:text-slate-200 transition-colors">
          <input
            type="checkbox"
            checked={showTopSellers}
            onChange={(e) => onToggleTopSellers(e.target.checked)}
            className="rounded bg-slate-950 border-white/20 text-emerald-600 focus:ring-0 cursor-pointer"
          />
          <span>⭐ Más vendidos</span>
        </label>
      </div>
    </div>
  );
};
