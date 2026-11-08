import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Swal from 'sweetalert2';
import { POSTopBar } from './POSTopBar';
import { POSCategoryTabs } from './POSCategoryTabs';
import { POSProductGrid } from './POSProductGrid';
import { POSPagination } from './POSPagination';
import { CrearProductoRapidoModal } from '../../inventory/components/CrearProductoRapidoModal';

export interface ProductSearchPanelProps {
  activeProducts: any[];
  dynamicFields: any[];
  cliente: any | null;
  getProductPrice: (product: any) => number;
  getProductStock: (sku: string, bodega: string) => number;
  onAddProduct: (producto: any) => void;
  onOpenCrearProducto?: () => void;
}

const PAGE_SIZE = 18;

/**
 * Panel de Búsqueda y Navegación de Catálogo POS (Benchmark SaaS Maduro)
 * Arquitectura modular: POSTopBar, POSCategoryTabs, POSProductGrid (grid-cols-2 a grid-cols-6), POSProductCard (pos-product-card) y POSPagination.
 */
export const ProductSearchPanel: React.FC<ProductSearchPanelProps> = ({
  activeProducts,
  dynamicFields,
  cliente,
  getProductPrice,
  getProductStock,
  onAddProduct,
  onOpenCrearProducto,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODOS');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [hideOutOfStock, setHideOutOfStock] = useState(true);
  const [showTopSellers, setShowTopSellers] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedStockSkus, setExpandedStockSkus] = useState<Record<string, boolean>>({});
  const [showFallbackCrearModal, setShowFallbackCrearModal] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleStockDetails = (sku: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedStockSkus((prev) => ({ ...prev, [sku]: !prev[sku] }));
  };

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setSearchTerm(val);
      setCurrentPage(1);
    }, 200);
  }, []);

  useEffect(() => {
    if (searchRef.current) {
      searchRef.current.focus();
    }
  }, []);

  // Categorías calculadas dinámicamente preservando 'TODOS' como primera opción
  const CATEGORIAS = useMemo(() => {
    const set = new Set<string>();
    activeProducts.forEach((p) => {
      if (p.categoria) set.add(p.categoria);
    });
    return ['TODOS', ...Array.from(set)];
  }, [activeProducts]);

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleBarcodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!barcodeInput.trim()) return;

    const prod = activeProducts.find(
      (p) => p.sku.toLowerCase() === barcodeInput.trim().toLowerCase()
    );
    if (prod) {
      onAddProduct(prod);
      setBarcodeInput('');
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `Agregado: ${prod.nombre}`,
        showConfirmButton: false,
        timer: 1200,
      });
    } else {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Código de barras no válido',
        showConfirmButton: false,
        timer: 1500,
      });
    }
  };

  const simulateBarcodeScan = () => {
    if (activeProducts.length === 0) return;
    const randomProduct = activeProducts[Math.floor(Math.random() * activeProducts.length)];
    if (randomProduct) {
      onAddProduct(randomProduct);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `Escaneado: ${randomProduct.nombre}`,
        showConfirmButton: false,
        timer: 1500,
      });
    }
  };

  const handleOpenCrear = () => {
    if (onOpenCrearProducto) {
      onOpenCrearProducto();
    } else {
      setShowFallbackCrearModal(true);
    }
  };

  // Filtrado de productos según búsqueda, categoría y stock
  const filteredProducts = useMemo(() => {
    let list = activeProducts.filter((p) => {
      const matchesSearch =
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'TODOS' || p.categoria === selectedCategory;

      const totalStock =
        getProductStock(p.sku, 'Bodega Principal') + getProductStock(p.sku, 'Bodega Secundaria');
      const matchesStock = !hideOutOfStock || totalStock > 0;

      return matchesSearch && matchesCategory && matchesStock;
    });

    if (showTopSellers || (searchTerm === '' && selectedCategory === 'TODOS')) {
      const topKeywords = ['salmon', 'salmón', 'camaron', 'camarón', 'trucha', 'robalo', 'róbalo', 'langostino'];
      list = [...list].sort((a, b) => {
        const aTop = topKeywords.some((k) => a.nombre.toLowerCase().includes(k)) ? 1 : 0;
        const bTop = topKeywords.some((k) => b.nombre.toLowerCase().includes(k)) ? 1 : 0;
        return bTop - aTop;
      });
    }

    return list;
  }, [activeProducts, searchTerm, selectedCategory, hideOutOfStock, showTopSellers, getProductStock]);

  // Paginación de catálogo: 18 productos por página
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedProducts = useMemo(() => {
    const start = (validCurrentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, validCurrentPage]);

  return (
    <div className="pos-catalog flex-1 flex flex-col overflow-hidden min-h-0 bg-slate-900/80">
      {/* 1. Barra Superior con Buscador, Código de Barras y + Crear Producto */}
      <POSTopBar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        barcodeInput={barcodeInput}
        onBarcodeInput={setBarcodeInput}
        onBarcodeSubmit={handleBarcodeSubmit}
        onSimulateScan={simulateBarcodeScan}
        onOpenCrearProducto={handleOpenCrear}
        hideOutOfStock={hideOutOfStock}
        onToggleHideOutOfStock={setHideOutOfStock}
        showTopSellers={showTopSellers}
        onToggleTopSellers={setShowTopSellers}
        searchRef={searchRef}
      />

      {/* 2. Pestañas Horizontales de Categorías con Flechas ← → */}
      <POSCategoryTabs
        categories={CATEGORIAS}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
      />

      {/* 3. Cuadrícula de Productos de 6 Columnas (18 Productos / Página) */}
      <POSProductGrid
        products={paginatedProducts}
        cliente={cliente}
        dynamicFields={dynamicFields}
        expandedStockSkus={expandedStockSkus}
        onToggleStock={toggleStockDetails}
        getProductPrice={getProductPrice}
        getProductStock={getProductStock}
        onAddProduct={onAddProduct}
      />

      {/* 4. Paginador de Catálogo */}
      <POSPagination
        currentPage={validCurrentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredProducts.length}
        pageSize={PAGE_SIZE}
      />

      {/* Modal Fallback para Creación Rápida si se usa en aislamiento */}
      {showFallbackCrearModal && (
        <CrearProductoRapidoModal
          isOpen={showFallbackCrearModal}
          onClose={() => setShowFallbackCrearModal(false)}
          onProductCreated={(newProd) => {
            onAddProduct(newProd);
            setShowFallbackCrearModal(false);
          }}
          categoriasExistentes={CATEGORIAS.filter((c) => c !== 'TODOS')}
        />
      )}
    </div>
  );
};
