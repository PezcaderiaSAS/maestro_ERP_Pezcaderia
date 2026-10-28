import React, { useState, useEffect, useRef } from 'react';
import { Search, Barcode } from 'lucide-react';
import Swal from 'sweetalert2';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ProductAvatar } from '../../../components/common/ProductAvatar';

interface ProductSearchPanelProps {
  activeProducts: any[];
  dynamicFields: any[];
  cliente: any | null;
  getProductPrice: (product: any) => number;
  getProductStock: (sku: string, bodega: string) => number;
  onAddProduct: (producto: any) => void;
}

export const ProductSearchPanel: React.FC<ProductSearchPanelProps> = ({
  activeProducts,
  dynamicFields,
  cliente,
  getProductPrice,
  getProductStock,
  onAddProduct
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODOS');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [hideOutOfStock, setHideOutOfStock] = useState(true);
  const [showTopSellers, setShowTopSellers] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchRef.current) {
      searchRef.current.focus();
    }
  }, []);

  // Categorías calculadas dinámicamente
  const CATEGORIAS = ['TODOS', ...Array.from(new Set(activeProducts.map(p => p.categoria)))];

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput) return;
    const prod = activeProducts.find(p => p.sku.toLowerCase() === barcodeInput.toLowerCase());
    if (prod) {
      onAddProduct(prod);
      setBarcodeInput('');
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `Agregado: ${prod.nombre}`,
        showConfirmButton: false,
        timer: 1200
      });
    } else {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Código de barras no válido',
        showConfirmButton: false,
        timer: 1500
      });
    }
  };

  const simulateBarcodeScan = () => {
    const randomProduct = activeProducts[Math.floor(Math.random() * activeProducts.length)];
    if (randomProduct) {
      onAddProduct(randomProduct);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `Escaneado: ${randomProduct.nombre}`,
        showConfirmButton: false,
        timer: 1500
      });
    }
  };

  // Filtrado de productos
  let filteredProducts = activeProducts.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'TODOS' || p.categoria === selectedCategory;
    
    // Ocultar agotados suma bodegas principal y secundaria
    const totalStock = getProductStock(p.sku, 'Bodega Principal') + getProductStock(p.sku, 'Bodega Secundaria');
    const matchesStock = !hideOutOfStock || totalStock > 0;

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Productos más vendidos (activado por toggle o por defecto si no hay búsqueda)
  if (showTopSellers || (searchTerm === '' && selectedCategory === 'TODOS')) {
    const topKeywords = ['salmon', 'salmón', 'camaron', 'camarón', 'trucha', 'robalo', 'róbalo', 'langostino'];
    filteredProducts = [...filteredProducts].sort((a, b) => {
       const aTop = topKeywords.some(k => a.nombre.toLowerCase().includes(k)) ? 1 : 0;
       const bTop = topKeywords.some(k => b.nombre.toLowerCase().includes(k)) ? 1 : 0;
       return bTop - aTop;
    });
  }

  return (
    <div className="pos-catalog flex-1 flex flex-col overflow-hidden min-h-0">
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        {/* Búsqueda por Texto */}
        <div style={{ flex: 1 }}>
          <Input
            ref={searchRef}
            type="text"
            id="pos-product-search-input"
            data-testid="pos-product-search-input"
            placeholder="Buscar por nombre o SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search size={18} className="text-cyan-400" />}
            fullWidth
            className="min-h-[40px] h-10 text-sm font-semibold bg-slate-950/70 border border-white/12 text-white placeholder-slate-400 rounded-xl shadow-inner focus-within:border-cyan-500/50"
          />
        </div>

        {/* Búsqueda por Código de Barras */}
        <form onSubmit={handleBarcodeSubmit} style={{ display: 'flex', gap: '6px' }}>
          <div style={{ width: '180px' }}>
            <Input
              type="text"
              placeholder="Código de Barras..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              leftIcon={<Barcode size={18} className="text-cyan-400" />}
              fullWidth
              className="min-h-[40px] h-10 text-sm bg-slate-950/70 border border-white/12 text-white placeholder-slate-400 rounded-xl"
            />
          </div>
          <button
            type="button"
            onClick={simulateBarcodeScan}
            className="min-h-[40px] h-10 px-3 whitespace-nowrap text-xs font-bold active:scale-95 transition-all bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-200 hover:text-white rounded-xl flex items-center gap-1 cursor-pointer shadow-sm"
          >
            <Barcode size={16} className="text-cyan-400" />
            <span>Simular Scan</span>
          </button>
        </form>
      </div>

      <div className="pos-categories" style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px' }}>
        {CATEGORIAS.map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`min-h-[36px] md:min-h-[48px] h-9 px-3.5 py-1 text-xs font-bold whitespace-nowrap rounded-xl transition-all active:scale-95 cursor-pointer ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/50'
                : 'bg-slate-800/80 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Barra de Controles: Filtros de Stock y Más Vendidos */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '8px', alignItems: 'center' }}>
        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-400 hover:text-slate-200 select-none">
          <input type="checkbox" checked={!hideOutOfStock} onChange={e => setHideOutOfStock(!e.target.checked)} className="rounded bg-slate-950 border-white/20 text-indigo-600 focus:ring-0 cursor-pointer" />
          Ver agotados
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-400 hover:text-slate-200 select-none">
          <input type="checkbox" checked={showTopSellers} onChange={e => setShowTopSellers(e.target.checked)} className="rounded bg-slate-950 border-white/20 text-indigo-600 focus:ring-0 cursor-pointer" />
          ⭐ Más vendidos
        </label>
      </div>

      <div className="pos-products-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 overflow-y-auto flex-1 pb-2 min-h-0" data-testid="product-grid">
        {filteredProducts.slice(0, 80).map(prod => {
          const stockPrincipal = getProductStock(prod.sku, 'Bodega Principal');
          const stockSecundaria = getProductStock(prod.sku, 'Bodega Secundaria');
          const stockAverias = getProductStock(prod.sku, 'Bodega Averías');
          const totalStock = stockPrincipal + stockSecundaria;
          const isOutOfStock = totalStock <= 0;
          const unidadNormalizada = (prod.unidadMedida || prod.unidad || '').toString().trim().toUpperCase();
          const isWeight = unidadNormalizada === 'KG' || unidadNormalizada === 'KILO' || unidadNormalizada === 'KILOS';
          const unitLabel = isWeight ? 'kg' : 'und';

          return (
            <Card glass key={prod.id} className={`product-card min-h-[72px] flex flex-col p-0 overflow-hidden cursor-pointer active:scale-95 transition-all duration-200 bg-slate-900/80 border border-white/10 hover:border-cyan-500/40 rounded-xl shadow-md ${isOutOfStock ? 'opacity-50 grayscale pointer-events-none' : ''}`} onClick={() => onAddProduct(prod)}>
              <div className="product-image-container h-20 sm:h-22 overflow-hidden flex items-center justify-center relative bg-slate-950/40" style={{ position: 'relative' }}>
                {/* Badge visual distintivo Kilos vs Unidad */}
                <div style={{ position: 'absolute', top: '6px', left: '6px', zIndex: 10 }}>
                  {isWeight ? (
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '1.5px 6px',
                        borderRadius: '5px',
                        backgroundColor: '#0284C7',
                        color: '#FFFFFF',
                        border: '1px solid #38BDF8',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px',
                      }}
                      title="Producto vendido por peso en kilos (pesaje balanza)"
                    >
                      ⚖️ KILOS
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '1.5px 6px',
                        borderRadius: '5px',
                        backgroundColor: '#059669',
                        color: '#FFFFFF',
                        border: '1px solid #34D399',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px',
                      }}
                      title="Producto vendido por unidades (conteo entero)"
                    >
                      📦 UNIDAD
                    </span>
                  )}
                </div>

                {/* Semáforo de Stock usando buffer_seguridad dinámico */}
                <div data-testid={stockPrincipal === 0 ? 'stock-badge-red' : stockPrincipal <= (prod.buffer_seguridad || 4) ? 'stock-badge-yellow' : 'stock-badge-green'} style={{ position: 'absolute', top: '6px', right: '6px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: stockPrincipal === 0 ? '#EF4444' : stockPrincipal <= (prod.buffer_seguridad || 4) ? '#F59E0B' : '#10B981', border: '1.5px solid white', zIndex: 10 }} />
                <ProductAvatar
                  nombre={prod.nombre}
                  categoria={prod.categoria}
                  imagen={prod.imagen}
                  size="full"
                  vectorOnly={true}
                  className="product-image max-h-16 w-auto object-contain"
                  alt={prod.nombre}
                />
              </div>
              <div className="product-info-panel p-2 sm:p-2.5 bg-transparent flex flex-col justify-between">
                <span className="product-card-name text-xs sm:text-sm font-bold text-slate-100 line-clamp-1">{prod.nombre}</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '2px', marginTop: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                    <span className="product-card-price-tag font-black text-sm sm:text-base text-white">
                      ${(Math.round(getProductPrice(prod)) || 0).toLocaleString('es-CO')}
                    </span>
                    <span style={{ fontSize: '10px', color: isWeight ? '#38BDF8' : '#34D399', fontWeight: 700 }}>
                      / {unitLabel}
                    </span>
                  </div>
                  {cliente && (cliente.tipoPrecio === 'RESTAURANTE' || cliente.tipoPrecio === 'MAYORISTA') && (
                    <span style={{ fontSize: '9px', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                      {cliente.tipoPrecio}
                    </span>
                  )}
                </div>
                {dynamicFields.map(field => {
                  const val = prod.metadata?.[field.key] || field.defaultValue;
                  return (
                    <div key={field.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)', width: '100%', marginTop: '2px' }}>
                      <span style={{ fontWeight: 600 }}>{field.label}:</span>
                      <span style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', padding: '1px 6px', borderRadius: '3px', fontWeight: 'bold' }}>{val}</span>
                    </div>
                  );
                })}
                
                {/* Stock por Bodega */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%', marginTop: '6px', borderTop: '1px dashed rgba(255, 255, 255, 0.12)', paddingTop: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                    <span style={{ color: '#94A3B8', fontWeight: 500 }}>Bod. Principal:</span>
                    <span style={{
                      fontWeight: 700,
                      color: stockPrincipal === 0 ? '#EF4444' : stockPrincipal <= (prod.buffer_seguridad || 4) ? '#F59E0B' : '#10B981'
                    }}>
                      {stockPrincipal} {unitLabel}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                    <span style={{ color: '#94A3B8', fontWeight: 500 }}>Bod. Secundaria:</span>
                    <span style={{ color: '#CBD5E1', fontWeight: 600 }}>
                      {stockSecundaria} {unitLabel}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                    <span style={{ color: '#94A3B8', fontWeight: 500 }}>Bod. Averías:</span>
                    <span style={{ color: '#FB7185', fontWeight: 600 }}>
                      {stockAverias} {unitLabel}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
