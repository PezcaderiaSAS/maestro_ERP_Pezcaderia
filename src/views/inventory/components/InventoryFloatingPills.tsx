// src/views/inventory/components/InventoryFloatingPills.tsx
// Barra de Pestañas Flotante Ergonómica (SPEC-048: TASK-048-02)
// Dark Glassmorphism 60-30-10, Ley de Miller (7 Chunks), Ley de Fitts (>= 44px) y Selector Móvil WCAG AAA

import React, { useState } from 'react';
import {
  Boxes,
  Snowflake,
  Clock,
  Scissors,
  ArrowRightLeft,
  BarChart3,
  FileText,
  ChevronDown,
  Layers,
  ShoppingBag,
  RotateCcw,
  Warehouse,
  FileSpreadsheet,
} from 'lucide-react';

export type InventoryTabId =
  | 'operaciones'
  | 'cuarto_frio'
  | 'wms_avanzado'
  | 'despiece'
  | 'traslados'
  | 'analisis_abc'
  | 'kardex'
  | 'compras_muelle'
  | 'reportes_compra'
  | 'catalogo'
  | 'categorias'
  | 'recepcion_devoluciones'
  | 'configuracion_bodegas'
  | 'reportes_sucursales';

export interface InventoryFloatingPillsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  pendingPrepCount?: number;
  fefoAlertsCount?: number;
  pendingDevCount?: number;
  bodegasCount?: number;
  className?: string;
}

export const InventoryFloatingPills: React.FC<InventoryFloatingPillsProps> = ({
  activeTab,
  onTabChange,
  pendingPrepCount = 0,
  fefoAlertsCount = 0,
  pendingDevCount = 0,
  bodegasCount = 1,
  className = '',
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // 7 Pestañas Principales canónicas (Ley de Miller 7 Chunks & Ley de Hick)
  const mainTabs = [
    {
      id: 'operaciones',
      label: '1. Existencias',
      shortLabel: 'Existencias',
      icon: Boxes,
      badge: 0,
      badgeColor: 'cyan',
    },
    {
      id: 'cuarto_frio',
      label: '2. Cuartos Fríos',
      shortLabel: 'Cuartos Fríos',
      icon: Snowflake,
      badge: pendingPrepCount,
      badgeColor: 'cyan',
    },
    {
      id: 'wms_avanzado',
      label: '3. Caducidad FEFO',
      shortLabel: 'FEFO',
      icon: Clock,
      badge: fefoAlertsCount,
      badgeColor: 'rose',
    },
    {
      id: 'despiece',
      label: '4. Despiece',
      shortLabel: 'Despiece',
      icon: Scissors,
      badge: 0,
      badgeColor: 'amber',
    },
    {
      id: 'traslados',
      label: '5. Traslados',
      shortLabel: 'Traslados',
      icon: ArrowRightLeft,
      badge: 0,
      badgeColor: 'emerald',
    },
    {
      id: 'analisis_abc',
      label: '6. Pareto ABC',
      shortLabel: 'Pareto ABC',
      icon: BarChart3,
      badge: 0,
      badgeColor: 'amber',
    },
    {
      id: 'kardex',
      label: '7. Kardex NIIF',
      shortLabel: 'Kardex NIIF',
      icon: FileText,
      badge: 0,
      badgeColor: 'cyan',
    },
  ];

  // Pestañas secundarias desplegables
  const secondaryTabs = [
    { id: 'compras_muelle', label: 'Recepción Furgón / Muelle', icon: Warehouse },
    { id: 'reportes_compra', label: 'Compras & Abastecimiento', icon: ShoppingBag },
    { id: 'catalogo', label: 'Catálogo de Productos', icon: Layers },
    { id: 'categorias', label: 'Categorías de Inventario', icon: FileSpreadsheet },
    { id: 'recepcion_devoluciones', label: `Devoluciones (${pendingDevCount})`, icon: RotateCcw },
    { id: 'configuracion_bodegas', label: `Configuración Bodegas (${bodegasCount})`, icon: Warehouse },
    { id: 'reportes_sucursales', label: 'Reportes Sucursales POS', icon: BarChart3 },
  ];

  const isSecondaryActive = secondaryTabs.some((t) => t.id === activeTab);

  return (
    <div
      data-testid="inventory-floating-pills"
      className={`sticky top-3 z-30 mb-4 transition-all duration-300 ${className}`}
    >
      {/* ── Vista Móvil (Selector Táctil Ley de Fitts >= 44px) ── */}
      <div className="block sm:hidden bg-[#0F172A]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-2.5 shadow-xl shadow-black/50">
        <label
          htmlFor="inventory-mobile-tabs"
          className="block text-[11px] font-black uppercase tracking-wider text-cyan-400 mb-1.5"
        >
          Módulo de Inventario & WMS
        </label>
        <select
          id="inventory-mobile-tabs"
          data-testid="inventory-mobile-tabs-selector"
          value={activeTab}
          onChange={(e) => onTabChange(e.target.value)}
          className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-xs font-bold shadow-inner focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
        >
          <optgroup label="1. Operaciones & Almacén (7 Principales)">
            <option value="operaciones">1. Existencias Multibodega</option>
            <option value="cuarto_frio">
              2. Cuartos Fríos {pendingPrepCount > 0 ? `(${pendingPrepCount} pend.)` : ''}
            </option>
            <option value="wms_avanzado">
              3. Caducidad FEFO & Lotes {fefoAlertsCount > 0 ? `(${fefoAlertsCount} alertas)` : ''}
            </option>
            <option value="despiece">4. Despiece & Mermas</option>
            <option value="traslados">5. Traslados Internos</option>
            <option value="analisis_abc">6. Análisis Pareto ABC</option>
            <option value="kardex">7. Kardex Contable NIIF</option>
          </optgroup>
          <optgroup label="2. Abastecimiento & Muelle">
            <option value="compras_muelle">Recepción Furgón (Bucaramanga)</option>
            <option value="reportes_compra">Compras & Entradas</option>
            <option value="recepcion_devoluciones">
              Devoluciones {pendingDevCount > 0 ? `(${pendingDevCount})` : ''}
            </option>
          </optgroup>
          <optgroup label="3. Catálogos & Configuración">
            <option value="catalogo">Catálogo de Productos</option>
            <option value="categorias">Categorías de Inventario</option>
            <option value="configuracion_bodegas">Bodegas & Cuartos Fríos ({bodegasCount})</option>
            <option value="reportes_sucursales">Reportes Sucursales POS</option>
          </optgroup>
        </select>
      </div>

      {/* ── Vista Desktop / Tablet: Barra Flotante de Pastillas (Pills) ── */}
      <div className="hidden sm:flex items-center gap-1.5 p-1.5 bg-[#0F172A]/85 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-xl shadow-cyan-950/20 overflow-x-auto scrollbar-none">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[44px] cursor-pointer select-none active:scale-[0.98] ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-500/10'
                  : 'bg-slate-900/50 hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent hover:border-white/5'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-black ${
                    tab.badgeColor === 'rose'
                      ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50 animate-pulse'
                      : tab.badgeColor === 'amber'
                      ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                      : 'bg-cyan-500/30 text-cyan-200 border border-cyan-500/40'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Dropdown "Más Módulos" para vistas secundarias */}
        <div className="relative ml-auto">
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[44px] cursor-pointer active:scale-[0.98] ${
              isSecondaryActive
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'bg-slate-900/50 hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent hover:border-white/5'
            }`}
          >
            <span>Más</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMoreMenu ? 'rotate-180' : ''}`} />
          </button>

          {showMoreMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMoreMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-64 bg-[#131C2E]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-1.5 z-50 space-y-0.5">
                {secondaryTabs.map((secTab) => {
                  const SecIcon = secTab.icon;
                  const isSecActive = activeTab === secTab.id;

                  return (
                    <button
                      key={secTab.id}
                      onClick={() => {
                        onTabChange(secTab.id);
                        setShowMoreMenu(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left min-h-[40px] cursor-pointer ${
                        isSecActive
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
                      }`}
                    >
                      <SecIcon className="w-4 h-4 text-slate-400" />
                      <span>{secTab.label}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryFloatingPills;
