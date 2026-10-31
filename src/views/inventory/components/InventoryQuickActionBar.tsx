// src/views/inventory/components/InventoryQuickActionBar.tsx
// Barra de Acciones Rápidas Ergonómica (SPEC-048: TASK-048-03)
// Ley de Fitts (botones >= 48px), Dark Glassmorphism 60-30-10, micro-animaciones y WCAG AAA

import React, { useState } from 'react';
import {
  Package,
  PlusCircle,
  Scissors,
  ArrowRightLeft,
  FileText,
  ChevronDown,
  UploadCloud,
  FileSpreadsheet,
  Truck,
  Warehouse,
} from 'lucide-react';

export interface InventoryQuickActionBarProps {
  onNewProduct: () => void;
  onReceivePurchase: () => void;
  onNewDissection: () => void;
  onTransferWarehouse?: () => void;
  onViewKardex?: () => void;
  onBulkUpload?: () => void;
  onBulkHardware?: () => void;
  onDockArrival?: () => void;
  onManageWarehouses?: () => void;
  bodegasCount?: number;
  className?: string;
}

export const InventoryQuickActionBar: React.FC<InventoryQuickActionBarProps> = ({
  onNewProduct,
  onReceivePurchase,
  onNewDissection,
  onTransferWarehouse,
  onViewKardex,
  onBulkUpload,
  onBulkHardware,
  onDockArrival,
  onManageWarehouses,
  bodegasCount = 1,
  className = '',
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  return (
    <div
      data-testid="inventory-quick-action-bar"
      className={`flex flex-wrap items-center justify-between gap-3 p-3 bg-[#131C2E]/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-lg shadow-black/20 ${className}`}
    >
      {/* Botones de Acción Primarios (Ergonomía Ley de Fitts >= 44px - 48px) */}
      <div className="flex flex-wrap items-center gap-2">
        {/* 1. Nuevo Producto */}
        <button
          onClick={onNewProduct}
          className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/25 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Package className="w-4 h-4" />
          <span>Nuevo Producto</span>
        </button>

        {/* 2. Recibir Compra */}
        <button
          onClick={onReceivePurchase}
          className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/25 active:scale-[0.98] transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Recibir Compra</span>
        </button>

        {/* 3. Nuevo Despiece */}
        <button
          onClick={onNewDissection}
          className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold text-xs shadow-sm active:scale-[0.98] transition-all cursor-pointer"
        >
          <Scissors className="w-4 h-4 text-amber-400" />
          <span>Nuevo Despiece</span>
        </button>

        {/* 4. Traslado Bodega */}
        {onTransferWarehouse && (
          <button
            onClick={onTransferWarehouse}
            className="hidden md:flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-900/60 hover:bg-slate-800/80 text-blue-300 border border-blue-500/30 font-bold text-xs shadow-sm active:scale-[0.98] transition-all cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4 text-blue-400" />
            <span>Traslado Bodega</span>
          </button>
        )}

        {/* 5. Ver Kardex NIIF */}
        {onViewKardex && (
          <button
            onClick={onViewKardex}
            className="hidden lg:flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-900/60 hover:bg-slate-800/80 text-purple-300 border border-purple-500/30 font-bold text-xs shadow-sm active:scale-[0.98] transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4 text-purple-400" />
            <span>Ver Kardex NIIF</span>
          </button>
        )}
      </div>

      {/* Menú Desplegable "Más Opciones" */}
      <div className="relative">
        <button
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          className="flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-xl bg-slate-900/70 hover:bg-slate-800/80 text-slate-300 border border-white/10 font-bold text-xs transition-all cursor-pointer active:scale-[0.98]"
          title="Acciones secundarias de inventario"
        >
          <span>Más Opciones</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMoreOpen ? 'rotate-180' : ''}`} />
        </button>

        {isMoreOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsMoreOpen(false)}
            />
            <div
              className="absolute right-0 top-full mt-2 w-64 bg-[#131C2E]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-50 p-1.5 divide-y divide-slate-800"
              onClick={() => setIsMoreOpen(false)}
            >
              <div className="py-1">
                {onBulkUpload && (
                  <button
                    onClick={onBulkUpload}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/70 rounded-xl transition-colors cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4 text-cyan-400" />
                    <span>Importar CSV</span>
                  </button>
                )}
                {onBulkHardware && (
                  <button
                    data-testid="btn-open-bulk-hardware"
                    onClick={onBulkHardware}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-xs font-semibold text-amber-400 hover:text-amber-300 hover:bg-slate-800/70 rounded-xl transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                    <span>Carga Masiva Ferretería</span>
                  </button>
                )}
                {onDockArrival && (
                  <button
                    id="btn-quick-recepcion-muelle"
                    onClick={onDockArrival}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/70 rounded-xl transition-colors cursor-pointer"
                  >
                    <Truck className="w-4 h-4 text-cyan-400" />
                    <span>Llegada Furgón</span>
                  </button>
                )}
              </div>

              {/* Acciones en móvil si no están en la barra principal visible */}
              <div className="py-1">
                {onTransferWarehouse && (
                  <button
                    onClick={onTransferWarehouse}
                    className="md:hidden w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/70 rounded-xl transition-colors cursor-pointer"
                  >
                    <ArrowRightLeft className="w-4 h-4 text-blue-400" />
                    <span>Traslado Bodega</span>
                  </button>
                )}
                {onViewKardex && (
                  <button
                    onClick={onViewKardex}
                    className="lg:hidden w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/70 rounded-xl transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-purple-400" />
                    <span>Ver Kardex NIIF</span>
                  </button>
                )}
                {onManageWarehouses && (
                  <button
                    id="btn-quick-config-bodegas"
                    onClick={onManageWarehouses}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/70 rounded-xl transition-colors cursor-pointer"
                  >
                    <Warehouse className="w-4 h-4 text-emerald-400" />
                    <span>Gestión de Bodegas ({bodegasCount})</span>
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InventoryQuickActionBar;
