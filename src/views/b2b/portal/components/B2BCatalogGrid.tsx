/**
 * ============================================================================
 * LA PEZCADERIA ERP — COMPONENTE: B2BCatalogGrid
 * ============================================================================
 * Catálogo táctil de pescados y mariscos para compras HORECA.
 * Muestra tarifas preferenciales, stock disponible, cortes marítimos y botón
 * directo para configurar cortes, empaques y pesos con Catch Weight.
 */

import React from 'react';
import { Search, Fish, Scissors, Box, PlusCircle, Check } from 'lucide-react';
import type { B2BCatalogProductItem } from '../../../../types/b2bCustomerPortal.types';

export interface B2BCatalogGridProps {
  catalogo: B2BCatalogProductItem[];
  categorias: string[];
  categoriaSeleccionada: string;
  onSelectCategoria: (categoria: string) => void;
  busqueda: string;
  onSearchChange: (busqueda: string) => void;
  onSelectProduct: (producto: B2BCatalogProductItem) => void;
}

export const B2BCatalogGrid: React.FC<B2BCatalogGridProps> = ({
  catalogo,
  categorias,
  categoriaSeleccionada,
  onSelectCategoria,
  busqueda,
  onSearchChange,
  onSelectProduct,
}) => {
  return (
    <div data-testid="b2b-catalog-grid" className="space-y-4">
      {/* Barra de Filtros: Categorías y Búsqueda */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        {/* Pills de Categorías */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
          {categorias.map((cat) => {
            const isSelected = categoriaSeleccionada === cat;
            return (
              <button
                key={cat}
                type="button"
                data-testid={`pill-categoria-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => onSelectCategoria(cat)}
                className={`px-3 py-2 min-h-[44px] rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Campo de Búsqueda */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            data-testid="input-catalog-search"
            placeholder="Buscar por especie o SKU..."
            value={busqueda}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 min-h-[44px] bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Grid de Productos */}
      {catalogo.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center">
          <Fish className="w-12 h-12 text-slate-400 mx-auto mb-2" />
          <h3 className="font-bold text-slate-700 text-base">No se encontraron productos</h3>
          <p className="text-slate-500 text-sm mt-1">
            Intenta con otro término de búsqueda o selecciona otra categoría.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {catalogo.map((producto) => {
            const tieneDescuento = producto.precioPactadoCop < producto.precioBaseCop;
            const ahorro = producto.precioBaseCop - producto.precioPactadoCop;

            return (
              <div
                key={producto.productoId}
                data-testid={`catalog-card-${producto.sku}`}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between hover:border-blue-400 transition-all"
              >
                <div>
                  {/* Encabezado del Producto */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {producto.sku}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {producto.origen}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base leading-tight mb-0.5">
                    {producto.nombre}
                  </h3>
                  <p className="text-xs italic text-slate-500 mb-3">
                    {producto.especie} · {producto.categoria}
                  </p>

                  {/* Precios (Base vs Preferencial) */}
                  <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 mb-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-blue-900">
                        ${producto.precioPactadoCop.toLocaleString('es-CO')}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">/ kg o pza</span>
                    </div>

                    {tieneDescuento && (
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-emerald-700 font-medium">
                        <span className="line-through text-slate-400">
                          ${producto.precioBaseCop.toLocaleString('es-CO')}
                        </span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded-sm">
                          Tarifa HORECA (-${ahorro.toLocaleString('es-CO')})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Disponibilidad y Cortes */}
                  <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Fish className="w-3.5 h-3.5 text-slate-400" />
                      <span>Stock disponible: </span>
                      <strong className="text-slate-900">{producto.stockDisponibleKg} kg</strong>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Scissors className="w-3.5 h-3.5 text-slate-400" />
                      <span>Cortes: </span>
                      {producto.cortesDisponibles.slice(0, 3).map((corte) => (
                        <span
                          key={corte}
                          className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.5 rounded-sm font-medium"
                        >
                          {corte.replace(/_/g, ' ').toLowerCase()}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Box className="w-3.5 h-3.5 text-slate-400" />
                      <span>Empaques térmicos disponibles</span>
                    </div>
                  </div>
                </div>

                {/* Botón Táctil de Configuración */}
                <button
                  type="button"
                  data-testid={`btn-select-product-${producto.sku}`}
                  onClick={() => onSelectProduct(producto)}
                  className="w-full min-h-[48px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Configurar Pedido</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
