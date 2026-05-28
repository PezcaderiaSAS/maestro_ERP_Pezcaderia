// src/views/POSView.tsx
import React, { useState } from 'react';
import { Search, Plus, Minus, X, Check, Barcode, Save, CreditCard } from 'lucide-react';
import Swal from 'sweetalert2';
import { Product, DynamicField } from '../App.tsx';

interface CartItem {
  product: Product;
  cantidad: number;
  precioOverride?: number;
}

interface POSViewProps {
  products: Product[];
  dynamicFields: DynamicField[];
  publishEvent: (
    tipo: 'SALE_COMPLETED' | 'PRICE_CHANGED' | 'MERMA_ALERT' | 'QUOTE_STATUS_CHANGED' | 'METADATA_CONFIGURED',
    actor: string,
    descripcion: string,
    metadata?: any,
    enqueueSync?: boolean
  ) => void;
  userRole: string;
  setCurrentView: (view: string) => void;
  stock: Record<string, any[]>;
  setStock: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  lastClientPrices: Record<string, Record<string, number>>;
  updateLastClientPrice: (clientKey: string, sku: string, price: number) => void;
}

export default function POSView({
  products,
  dynamicFields,
  publishEvent,
  userRole,
  setCurrentView,
  stock,
  setStock,
  lastClientPrices,
  updateLastClientPrice
}: POSViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODOS');
  const [barcodeInput, setBarcodeInput] = useState('');
  
  // Filtrar productos activos
  const activeProducts = products.filter(p => p.activo);
  
  // Categorías calculadas dinámicamente
  const CATEGORIAS = ['TODOS', ...Array.from(new Set(activeProducts.map(p => p.categoria)))];

  const [cart, setCart] = useState<CartItem[]>(() => {
    const defaultItems = activeProducts.filter(p => p.sku.startsWith('BAT-') || p.sku.startsWith('ENS-')).slice(0, 3);
    return defaultItems.map(p => ({ product: p, cantidad: 1 }));
  });
  const [cliente, setCliente] = useState<{ nombre: string; identificacion: string } | null>(null);
  const [descuentoGlobal, setDescuentoGlobal] = useState(0); // Porcentaje

  const handleAddProduct = (product: Product) => {
    setCart(prevCart => {
      const exists = prevCart.find(item => item.product.id === product.id);
      if (exists) {
        return prevCart.map(item =>
          item.product.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...prevCart, { product, cantidad: 1 }];
    });
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setCart(prevCart =>
      prevCart
        .map(item => {
          if (item.product.id === productId) {
            const nuevaCantidad = item.cantidad + delta;
            return { ...item, cantidad: nuevaCantidad };
          }
          return item;
        })
        .filter(item => item.cantidad > 0)
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const handleAgregarCliente = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Vincular Cliente al Pedido',
      html:
        '<input id="swal-input1" class="swal2-input" placeholder="Nombre completo o Razón Social">' +
        '<input id="swal-input2" class="swal2-input" placeholder="Identificación / NIT">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'var(--primary-color)',
      preConfirm: () => {
        return {
          nombre: (document.getElementById('swal-input1') as HTMLInputElement).value,
          identificacion: (document.getElementById('swal-input2') as HTMLInputElement).value
        };
      }
    });

    if (formValues && formValues.nombre && formValues.identificacion) {
      setCliente(formValues);
      Swal.fire({
        icon: 'success',
        title: 'Cliente Vinculado',
        text: `${formValues.nombre} agregado al pedido.`,
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  const handleDescuentoGlobal = async () => {
    const { value: desc } = await Swal.fire({
      title: 'Aplicar Descuento Global',
      input: 'number',
      inputLabel: 'Porcentaje de descuento (0% - 100%)',
      inputPlaceholder: 'Ingresa porcentaje',
      inputValue: descuentoGlobal,
      showCancelButton: true,
      confirmButtonText: 'Aplicar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'var(--primary-color)',
      inputAttributes: {
        min: '0',
        max: '100',
        step: '1'
      }
    });

    if (desc !== undefined) {
      const val = parseInt(desc);
      if (val >= 0 && val <= 100) {
        setDescuentoGlobal(val);
      }
    }
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput) return;
    const prod = activeProducts.find(p => p.sku.toLowerCase() === barcodeInput.toLowerCase());
    if (prod) {
      handleAddProduct(prod);
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
      handleAddProduct(randomProduct);
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

  const handleGuardarBorrador = () => {
    if (cart.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Carrito vacío',
        text: 'Agrega productos al pedido antes de guardarlo.',
        confirmButtonColor: 'var(--primary-color)'
      });
      return;
    }
    publishEvent(
      'SALE_COMPLETED',
      userRole,
      `Pedido guardado en borrador por valor de $${totalFinal.toLocaleString('es-CO')}`,
      { itemsCount: cart.length, total: totalFinal, draft: true },
      false
    );
    Swal.fire({
      icon: 'success',
      title: 'Borrador Guardado',
      text: 'El pedido se ha guardado como borrador localmente.',
      confirmButtonColor: 'var(--primary-color)'
    });
  };

  // Helper to query stock for a given product and warehouse
  const getProductStock = (sku: string, bodega: string) => {
    const list = stock[bodega] || [];
    const matched = list.find((item: any) => item.sku === sku);
    return matched ? matched.stock : 0;
  };

  const handlePagar = () => {
    if (cart.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Carrito vacío',
        text: 'Agrega productos al pedido antes de proceder al cobro.',
        confirmButtonColor: 'var(--primary-color)'
      });
      return;
    }

    Swal.fire({
      title: 'Confirmar Cobro',
      text: `¿Desea liquidar el pedido por un total de $${totalFinal.toLocaleString('es-CO')}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Liquidar y Facturar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'var(--primary-color)',
    }).then((result) => {
      if (result.isConfirmed) {
        // Decrease stock in Bodega Principal
        setStock(prev => {
          const newStock = { ...prev };
          if (newStock['Bodega Principal']) {
            newStock['Bodega Principal'] = newStock['Bodega Principal'].map((stockItem: any) => {
              const cartItem = cart.find(i => i.product.sku === stockItem.sku);
              if (cartItem) {
                return { ...stockItem, stock: Math.max(0, stockItem.stock - cartItem.cantidad) };
              }
              return stockItem;
            });
          }
          return newStock;
        });

        // Record last prices per client if client is selected
        if (cliente) {
          cart.forEach(item => {
            const finalUnitPrice = item.precioOverride !== undefined ? item.precioOverride : item.product.precio_venta_pos;
            updateLastClientPrice(cliente.identificacion || cliente.nombre, item.product.sku, finalUnitPrice);
          });
        }

        publishEvent(
          'SALE_COMPLETED',
          userRole,
          `Venta liquidada para ${cliente ? cliente.nombre : 'Consumidor Final'} por un total de $${totalFinal.toLocaleString('es-CO')}`,
          { cliente, total: totalFinal, items: cart.map(i => ({ sku: i.product.sku, cantidad: i.cantidad })) }
        );

        Swal.fire({
          icon: 'success',
          title: 'Venta Realizada',
          text: 'Se ha registrado la transacción de forma exitosa, se descontó del inventario y se encoló la sincronización con Siigo.',
          confirmButtonColor: 'var(--primary-color)'
        });
        setCart([]);
        setCliente(null);
        setDescuentoGlobal(0);
      }
    });
  };

  // Filtrado de productos
  const filteredProducts = activeProducts.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'TODOS' || p.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Cálculos financieros
  const subtotal = cart.reduce((acc, item) => {
    const unitPrice = item.precioOverride !== undefined ? item.precioOverride : item.product.precio_venta_pos;
    return acc + unitPrice * item.cantidad;
  }, 0);
  const totalDescuento = subtotal * (descuentoGlobal / 100);
  const totalFinal = subtotal - totalDescuento;

  return (
    <div className="pos-layout animate-fade-in">
      {/* Catálogo de Productos */}
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
              <div key={prod.id} className="product-card" onClick={() => handleAddProduct(prod)}>
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
                    <span className="product-card-price-tag">${prod.precio_venta_pos.toLocaleString('es-CO')}</span>
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

      {/* Carrito de Compras / Factura */}
      <div className="pos-sidebar-cart">
        <div className="pos-cart-header">
          {cliente ? (
            <div className="add-client-btn" onClick={handleAgregarCliente}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} />
                <span style={{ fontSize: '12px' }}>{cliente.nombre.slice(0, 18)} ({cliente.identificacion})</span>
              </div>
              <X size={14} onClick={(e) => { e.stopPropagation(); setCliente(null); }} />
            </div>
          ) : (
            <button className="add-client-btn" onClick={handleAgregarCliente}>
              <span>Agregar Cliente</span>
              <Plus size={16} />
            </button>
          )}
        </div>

        <div className="pos-cart-items-list">
          {cart.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748B', gap: '8px' }}>
              <span style={{ fontSize: '32px' }}>🛒</span>
              <span style={{ fontSize: '13px', fontWeight: 500 }}>El carrito está vacío</span>
            </div>
          ) : (
            cart.map(item => {
              const stockPrincipal = getProductStock(item.product.sku, 'Bodega Principal');
              const finalUnitPrice = item.precioOverride !== undefined ? item.precioOverride : item.product.precio_venta_pos;
              const isInsufficient = stockPrincipal < item.cantidad;
              const clientKey = cliente ? (cliente.identificacion || cliente.nombre).trim().toLowerCase() : '';
              const historicalPrice = (cliente && clientKey) ? lastClientPrices[clientKey]?.[item.product.sku] : undefined;

              return (
                <div key={item.product.id} className="cart-item-row" style={{ height: 'auto', minHeight: '64px', padding: '10px 12px' }}>
                  <div className="cart-item-left" style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                    <span className="cart-item-name" style={{ fontWeight: 700 }}>{item.product.nombre}</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                      <span className="cart-item-price" style={{ color: 'var(--primary-color)', fontWeight: 700 }}>
                        ${(finalUnitPrice * item.cantidad).toLocaleString('es-CO')}
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>
                        (${finalUnitPrice.toLocaleString('es-CO')} c/u)
                      </span>
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: isInsufficient ? '#FEE2E2' : '#F1F5F9',
                        color: isInsufficient ? '#EF4444' : '#64748B',
                        fontWeight: 600
                      }}>
                        Stock: {stockPrincipal} {isInsufficient && '⚠️ Insuficiente'}
                      </span>
                    </div>

                    {historicalPrice !== undefined && (
                      <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {historicalPrice === finalUnitPrice ? (
                          <span style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#D1FAE5',
                            color: '#065F46',
                            fontWeight: 'bold',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}>
                            ✓ Tarifa histórica aplicada
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setCart(prev => prev.map(i => i.product.id === item.product.id ? { ...i, precioOverride: historicalPrice } : i));
                              Swal.fire({
                                toast: true,
                                position: 'top-end',
                                icon: 'success',
                                title: `Tarifa histórica aplicada: $${historicalPrice.toLocaleString('es-CO')}`,
                                showConfirmButton: false,
                                timer: 1500
                              });
                            }}
                            className="btn-warning"
                            style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid #F59E0B',
                              backgroundColor: '#FEF3C7',
                              color: '#D97706',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}
                          >
                            💡 Último precio: ${historicalPrice.toLocaleString('es-CO')} (Aplicar)
                          </button>
                        )}
                        
                        {item.precioOverride !== undefined && (
                          <button
                            onClick={() => {
                              setCart(prev => prev.map(i => i.product.id === item.product.id ? { ...i, precioOverride: undefined } : i));
                            }}
                            style={{
                              fontSize: '10px',
                              padding: '2px 4px',
                              background: 'none',
                              border: 'none',
                              color: '#EF4444',
                              textDecoration: 'underline',
                              cursor: 'pointer'
                            }}
                          >
                            Restablecer
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="cart-item-controls" style={{ alignSelf: 'center' }}>
                    <button className="qty-btn" onClick={() => handleUpdateQty(item.product.id, -1)}>
                      <Minus size={14} />
                    </button>
                    <span className="qty-number">{item.cantidad}</span>
                    <button className="qty-btn" onClick={() => handleUpdateQty(item.product.id, 1)}>
                      <Plus size={14} />
                    </button>
                    <button className="delete-cart-item-btn" onClick={() => handleRemoveItem(item.product.id)}>
                      <X size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pos-cart-footer">
          <div className="summary-row">
            <span>Subtotal ({cart.reduce((sum, item) => sum + item.cantidad, 0)} ítems)</span>
            <span>${subtotal.toLocaleString('es-CO')}</span>
          </div>
          <div className="summary-row">
            <span>Impuestos (0%)</span>
            <span>$0</span>
          </div>
          <div className="summary-row" style={{ cursor: 'pointer' }} onClick={handleDescuentoGlobal}>
            <span style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Descuento {descuentoGlobal > 0 && `(${descuentoGlobal}%)`} <Plus size={12} />
            </span>
            <span style={{ color: descuentoGlobal > 0 ? 'var(--primary-color)' : 'inherit' }}>
              -${totalDescuento.toLocaleString('es-CO')}
            </span>
          </div>
          
          {/* Dual Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button 
              className="btn-secondary" 
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '12px 8px' }}
              onClick={handleGuardarBorrador}
            >
              <Save size={16} />
              <span>Guardar</span>
            </button>
            <button 
              className="btn-primary" 
              style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 8px', backgroundColor: 'var(--primary-color)' }}
              onClick={handlePagar}
            >
              <CreditCard size={16} />
              <span>Cobrar: ${totalFinal.toLocaleString('es-CO')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
