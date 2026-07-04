import React, { useState, useEffect, useRef } from 'react';
import { Search, Barcode } from 'lucide-react';
import Swal from 'sweetalert2';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

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
    <div className="pos-catalog flex-1 lg:flex-none h-full lg:h-full flex flex-col overflow-hidden">
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        {/* Búsqueda por Texto */}
        <div style={{ flex: 1 }}>
          <Input
            ref={searchRef}
            type="text"
            id="search-input-f2"
            placeholder="Buscar por nombre o SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search size={18} />}
            fullWidth
          />
        </div>

        {/* Búsqueda por Código de Barras */}
        <form onSubmit={handleBarcodeSubmit} style={{ display: 'flex', gap: '8px' }}>
          <div style={{ width: '220px' }}>
            <Input
              type="text"
              placeholder="Código de Barras..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              leftIcon={<Barcode size={18} />}
              fullWidth
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={simulateBarcodeScan}
            leftIcon={<Barcode size={16} />}
            className="whitespace-nowrap"
          >
            Simular Scan
          </Button>
        </form>
      </div>

      <div className="pos-categories">
        {CATEGORIAS.map(cat => (
          <button
            key={cat}
            className={`pos-category-tab ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Barra de Controles: Filtros de Stock y Más Vendidos */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#475569', fontWeight: 600 }}>
          <input type="checkbox" checked={!hideOutOfStock} onChange={e => setHideOutOfStock(!e.target.checked)} style={{ cursor: 'pointer' }} />
          Ver agotados
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#475569', fontWeight: 600 }}>
          <input type="checkbox" checked={showTopSellers} onChange={e => setShowTopSellers(e.target.checked)} style={{ cursor: 'pointer' }} />
          ⭐ Más vendidos
        </label>
      </div>

      <div className="pos-products-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto flex-1 pb-4" data-testid="product-grid">
        {filteredProducts.map(prod => {
          const stockPrincipal = getProductStock(prod.sku, 'Bodega Principal');
          const stockSecundaria = getProductStock(prod.sku, 'Bodega Secundaria');
          const stockAverias = getProductStock(prod.sku, 'Bodega Averías');
          const totalStock = stockPrincipal + stockSecundaria;
          const isOutOfStock = totalStock <= 0;
          return (
            <div key={prod.id} className={`product-card border border-gray-300 shadow-sm hover:shadow-md transition-all ${isOutOfStock ? 'opacity-50 grayscale pointer-events-none' : ''}`} onClick={() => onAddProduct(prod)}>
              <div className="product-image-container" style={{ position: 'relative' }}>
                {/* Semáforo de Stock usando buffer_seguridad dinámico */}
                <div data-testid={stockPrincipal === 0 ? 'stock-badge-red' : stockPrincipal <= (prod.buffer_seguridad || 4) ? 'stock-badge-yellow' : 'stock-badge-green'} style={{ position: 'absolute', top: '8px', right: '8px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: stockPrincipal === 0 ? '#EF4444' : stockPrincipal <= (prod.buffer_seguridad || 4) ? '#F59E0B' : '#10B981', border: '2px solid white', zIndex: 10 }} />
                <img
                  src={prod.imagen || 'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'}
                  alt={prod.nombre}
                  className="product-image"
                />
              </div>
              <div className="product-info-panel">
                <span className="product-card-name">{prod.nombre}</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '4px' }}>
                  <span className="product-card-price-tag">${(getProductPrice(prod) || 0).toLocaleString('es-CO')}</span>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%', marginTop: '6px', borderTop: '1px dashed #E2E8F0', paddingTop: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                    <span style={{ color: '#64748B', fontWeight: 500 }}>Bod. Principal:</span>
                    <span style={{
                      fontWeight: 700,
                      color: stockPrincipal === 0 ? '#EF4444' : stockPrincipal <= (prod.buffer_seguridad || 4) ? '#F59E0B' : '#10B981'
                    }}>
                      {stockPrincipal} uds
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                    <span style={{ color: '#64748B', fontWeight: 500 }}>Bod. Secundaria:</span>
                    <span style={{ color: '#475569', fontWeight: 600 }}>
                      {stockSecundaria} uds
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                    <span style={{ color: '#64748B', fontWeight: 500 }}>Bod. Averías:</span>
                    <span style={{ color: '#E11D48', fontWeight: 600 }}>
                      {stockAverias} uds
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
