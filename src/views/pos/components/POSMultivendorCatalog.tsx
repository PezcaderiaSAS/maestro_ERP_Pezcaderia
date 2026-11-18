import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Layers, 
  Package, 
  Scale 
} from 'lucide-react';
import type { Product } from '../../../types/erp.types';
import { ProductAvatar } from '../../../components/common/ProductAvatar';
import { POSProductBodegaStock } from './POSProductBodegaStock';
import type { BodegaStockItem } from '../posWarehouseStock.utils';

export interface POSMultivendorCatalogProps {
  products: Product[];
  stockMap: Record<string, number>;
  warehouseStockMap?: Record<string, BodegaStockItem[]>;
  onAddToCart: (product: Product, cantidad?: number) => void;
  onOpenScaleModal?: (product: Product) => void;
  searchFilter: string;
}

const ITEMS_PER_PAGE = 18; // Matriz 6x3 canónica de alta densidad

export const POSMultivendorCatalog: React.FC<POSMultivendorCatalogProps> = ({
  products,
  stockMap,
  warehouseStockMap,
  onAddToCart,
  onOpenScaleModal,
  searchFilter,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(true);
  const categoryContainerRef = useRef<HTMLDivElement>(null);

  // Extraer categorías únicas disponibles
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      const cat = p.categoria || (p as any).category;
      if (cat && typeof cat === 'string') set.add(cat.trim());
    });
    return ['TODOS', ...Array.from(set)];
  }, [products]);

  // Si la categoría seleccionada no existe en el catálogo actual tras conmutación, resetear a 'TODOS'
  useEffect(() => {
    if (selectedCategory !== 'TODOS' && !categories.some((c) => c.toUpperCase() === selectedCategory.toUpperCase())) {
      setSelectedCategory('TODOS');
      setCurrentPage(1);
    }
  }, [categories, selectedCategory]);

  const checkScrollability = useCallback(() => {
    const el = categoryContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
  }, []);

  useEffect(() => {
    checkScrollability();
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, [checkScrollability, categories]);

  const handleScrollLeft = () => {
    categoryContainerRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const handleScrollRight = () => {
    categoryContainerRef.current?.scrollBy({ left: 200, behavior: 'smooth' });
  };

  // Filtrar productos por búsqueda y categoría
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const name = (p.nombre || (p as any).name || '').toLowerCase();
      const sku = (p.sku || (p as any).codigo || '').toLowerCase();
      const cat = (p.categoria || (p as any).category || '').toLowerCase();
      const barcode = (p.codigo_barras || (p as any).barcode || '').toLowerCase();

      // Filtro de texto
      if (searchFilter) {
        const query = searchFilter.toLowerCase().trim();
        const matchesText = name.includes(query) || sku.includes(query) || barcode.includes(query) || cat.includes(query);
        if (!matchesText) return false;
      }

      // Filtro de categoría
      if (selectedCategory !== 'TODOS') {
        const prodCat = (p.categoria || (p as any).category || '').toUpperCase();
        if (prodCat !== selectedCategory.toUpperCase()) return false;
      }

      return true;
    });
  }, [products, searchFilter, selectedCategory]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedProducts = useMemo(() => {
    const start = (validCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, validCurrentPage]);

  // Reset a página 1 cuando cambia el filtro
  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const getProductPrice = (p: Product) => {
    return p.precio_venta_pos || (p as any).precioVenta || (p as any).precio || 0;
  };

  const getProductName = (p: Product) => {
    return p.nombre || (p as any).name || 'Producto';
  };

  const getProductUnit = (p: Product) => {
    return p.unidadMedida || (p as any).unidad || 'kg';
  };

  const isProductPesable = (p: Product) => {
    const u = getProductUnit(p).toUpperCase();
    return u === 'KG' || u === 'KILO' || u === 'KILOS' || u === 'GR' || u === 'GRAMOS';
  };

  return (
    <section 
      data-testid="pos-multivendor-catalog"
      className="flex-1 min-w-0 flex flex-col bg-slate-50 border-r border-slate-200 overflow-hidden select-none"
    >
      {/* 1. BARRA DE CATEGORÍAS (Pills Horizontales con Flechas de Navegación Suave) */}
      <div className="relative h-11 bg-white border-b border-slate-200 flex items-center shrink-0 overflow-hidden">
        {/* Botón Scroll Izquierdo */}
        <button
          type="button"
          data-testid="btn-category-scroll-left"
          aria-label="Desplazar categorías a la izquierda"
          onClick={handleScrollLeft}
          className={`absolute left-0 z-10 h-full px-1.5 flex items-center justify-center bg-white/95 hover:bg-slate-100 text-slate-600 hover:text-emerald-700 shadow-xs border-r border-slate-200/80 transition-all cursor-pointer ${
            canScrollLeft ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
          }`}
        >
          <ChevronLeft size={16} />
        </button>

        {/* Contenedor desplazable de Categorías */}
        <div
          ref={categoryContainerRef}
          data-testid="pos-category-tabs-container"
          onScroll={checkScrollability}
          className="h-full px-8 sm:px-9 flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth"
        >
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline shrink-0">
            Categoría:
          </span>
          {categories.map((cat) => {
            const isSelected = selectedCategory.toUpperCase() === cat.toUpperCase();
            return (
              <button
                key={cat}
                type="button"
                data-testid={`btn-cat-${cat}`}
                onClick={() => handleSelectCategory(cat)}
                title={cat}
                className={`min-h-[32px] px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 shrink-0 max-w-[200px] truncate ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80'
                }`}
              >
                <span className="truncate">{cat}</span>
              </button>
            );
          })}
        </div>

        {/* Botón Scroll Derecho */}
        <button
          type="button"
          data-testid="btn-category-scroll-right"
          aria-label="Desplazar categorías a la derecha"
          onClick={handleScrollRight}
          className={`absolute right-0 z-10 h-full px-1.5 flex items-center justify-center bg-white/95 hover:bg-slate-100 text-slate-600 hover:text-emerald-700 shadow-xs border-l border-slate-200/80 transition-all cursor-pointer ${
            canScrollRight ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
          }`}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* 2. MATRIZ DE PRODUCTOS (6x3 Tarjetas - SaaS Light Mode) */}
      <div className="flex-1 p-2 sm:p-2.5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400">
        {paginatedProducts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <Package size={48} className="mb-2 opacity-30 text-slate-500" />
            <p className="text-sm font-semibold text-slate-600">No se encontraron productos coincidentes</p>
            <p className="text-xs text-slate-400 mt-1">Prueba con otro término de búsqueda o selecciona "TODOS"</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-2.5">
            {paginatedProducts.map((product) => {
              const name = getProductName(product);
              const price = getProductPrice(product);
              const unit = getProductUnit(product);
              const pesable = isProductPesable(product);
              
              const bodegasStock = warehouseStockMap?.[product.id] || warehouseStockMap?.[product.sku] || [];
              
              let stock = 0;
              if (typeof stockMap?.[product.id] === 'number') {
                stock = stockMap[product.id];
              } else if (typeof stockMap?.[product.sku] === 'number') {
                stock = stockMap[product.sku];
              } else if (bodegasStock.length > 0) {
                stock = bodegasStock.reduce((acc, b) => acc + (b.cantidad || 0), 0);
              }

              const isNoControl = product.control_inventario === false || (product as any).controlInventario === false;
              const sinStock = !isNoControl && stock <= 0;

              return (
                <div
                  key={product.id || product.sku}
                  data-testid={`product-card-${product.sku || product.id}`}
                  onClick={() => {
                    if (pesable && onOpenScaleModal) {
                      onOpenScaleModal(product);
                    } else {
                      onAddToCart(product, 1);
                    }
                  }}
                  className={`bg-white border rounded-xl p-2 flex flex-col justify-between transition-all cursor-pointer active:scale-98 shadow-xs hover:shadow-md hover:border-emerald-500 min-h-[120px] sm:min-h-[130px] relative group ${
                    sinStock ? 'border-slate-200 opacity-60' : 'border-slate-200'
                  }`}
                  title={`${name} - $${price.toLocaleString('es-CO')} / ${unit}`}
                >
                  {/* Badge de Unidad, Modo Pesaje y Estado Agotado */}
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {unit}
                    </span>
                    <div className="flex flex-wrap items-center justify-end gap-1 min-w-0">
                      {pesable && (
                        <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center gap-0.5">
                          <Scale size={9} /> Balanza
                        </span>
                      )}
                      {sinStock && (
                        <span 
                          data-testid={`badge-agotado-${product.sku || product.id}`}
                          className="text-[8px] font-black uppercase px-1 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200 tracking-wider shadow-2xs"
                        >
                          AGOTADO
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Icono / Avatar Vectorial Local (Cero <img> rotas) */}
                  <div className="flex items-center justify-center my-0.5 py-0.5">
                    <ProductAvatar
                      nombre={name}
                      categoria={product.categoria}
                      size="sm"
                      darkTheme={false}
                    />
                  </div>

                  {/* Nombre del Producto (Legibilidad WCAG AAA en 2 líneas) */}
                  <div className="min-h-[26px] flex items-center justify-center">
                    <h3 className="text-slate-800 text-[11px] sm:text-xs font-bold text-center line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors break-words">
                      {name}
                    </h3>
                  </div>

                  {/* Mini-Pills de Stock por Bodega (SaaS Light Mode WCAG AA+) */}
                  {bodegasStock.length > 0 && (
                    <POSProductBodegaStock
                      bodegas={bodegasStock}
                      unit={unit}
                      maxVisible={3}
                    />
                  )}

                  {/* Precio Grande Destacado en Esmeralda & Stock */}
                  <div className="mt-0.5 pt-0.5 border-t border-slate-100 flex items-end justify-between">
                    <div className="flex flex-col">
                      <span className="text-[8px] sm:text-[9px] font-medium text-slate-400">
                        {sinStock ? 'Agotado' : isNoControl ? 'Venta libre' : `Stock: ${stock} ${unit}`}
                      </span>
                      <span className="text-emerald-600 font-mono font-black text-xs sm:text-sm leading-none">
                        ${price.toLocaleString('es-CO')}
                      </span>
                    </div>

                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-emerald-50 group-hover:bg-emerald-600 text-emerald-600 group-hover:text-white flex items-center justify-center transition-all">
                      <Plus size={13} className="stroke-[3]" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. PAGINACIÓN INFERIOR (Estilo Sistema POS Maduro) */}
      <footer className="h-12 px-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
        <div className="text-xs text-slate-500 font-medium">
          Mostrando <span className="font-bold text-slate-800">{paginatedProducts.length}</span> de <span className="font-bold text-slate-800">{filteredProducts.length}</span> productos
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            data-testid="btn-catalog-prev-page"
            disabled={validCurrentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronLeft size={14} />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          {/* Números de página */}
          <div className="flex items-center gap-1 px-1">
            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              // Mostrar máximo 5 botones numéricos
              if (pageNum < validCurrentPage - 2 || pageNum > validCurrentPage + 2) return null;
              const isActive = pageNum === validCurrentPage;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`min-w-[32px] min-h-[32px] rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs font-black'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            data-testid="btn-catalog-next-page"
            disabled={validCurrentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <span className="hidden sm:inline">Siguiente</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </footer>
    </section>
  );
};

