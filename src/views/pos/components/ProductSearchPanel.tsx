import React, { useState } from 'react';
import { Search, Barcode } from 'lucide-react';
import Swal from 'sweetalert2';

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
    return matchesSearch && matchesCategory;
  });

  // Productos más vendidos por defecto
  if (searchTerm === '' && selectedCategory === 'TODOS') {
    const topKeywords = ['salmon', 'salmón', 'camaron', 'camarón', 'trucha', 'robalo', 'róbalo', 'langostino'];
    filteredProducts = [...filteredProducts].sort((a, b) => {
       const aTop = topKeywords.some(k => a.nombre.toLowerCase().includes(k)) ? 1 : 0;
       const bTop = topKeywords.some(k => b.nombre.toLowerCase().includes(k)) ? 1 : 0;
       return bTop - aTop;
    });
  }

  return (
    <div className="pos-catalog">
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        {/* Búsqueda por Texto */}
        <div className="pos-search-bar" style={{ flex: 1, marginBottom: 0 }}>
          <Search size={18} color="#64748B" />
          <input
            type="text"
            className="pos-search-input"
            placeholder="Buscar por nombre o SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Búsqueda por Código de Barras */}
        <form onSubmit={handleBarcodeSubmit} style={{ display: 'flex', gap: '8px' }}>
          <div className="pos-search-bar" style={{ width: '220px', marginBottom: 0 }}>
            <Barcode size={18} color="#64748B" />
            <input
              type="text"
              className="pos-search-input"
              placeholder="Código de Barras..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
            onClick={simulateBarcodeScan}
          >
            <Barcode size={16} />
            Simular Scan
          </button>
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

      <div className="pos-products-grid">
        {filteredProducts.map(prod => {
          const stockPrincipal = getProductStock(prod.sku, 'Bodega Principal');
          const stockSecundaria = getProductStock(prod.sku, 'Bodega Secundaria');
          const stockAverias = getProductStock(prod.sku, 'Bodega Averías');
          return (
            <div key={prod.id} className="product-card" onClick={() => onAddProduct(prod)}>
              <div className="product-image-container">
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
                      color: stockPrincipal === 0 ? '#EF4444' : stockPrincipal <= prod.buffer_seguridad ? '#F59E0B' : '#10B981'
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
