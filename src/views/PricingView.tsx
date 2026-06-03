// src/views/PricingView.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Save, Printer, Search, DollarSign, ShoppingCart, FileText, Check, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { Product, ProductCatalog, ProductPricing, Cliente, generateId } from '../App.tsx';

interface PricingViewProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  productsCatalog?: ProductCatalog[];
  setProductsCatalog?: React.Dispatch<React.SetStateAction<ProductCatalog[]>>;
  productPricings?: ProductPricing[];
  setProductPricings?: React.Dispatch<React.SetStateAction<ProductPricing[]>>;
  quotations: any[];
  setQuotations: React.Dispatch<React.SetStateAction<any[]>>;
  publishEvent: (
    tipo: 'SALE_COMPLETED' | 'PRICE_CHANGED' | 'MERMA_ALERT' | 'QUOTE_STATUS_CHANGED' | 'METADATA_CONFIGURED',
    actor: string,
    descripcion: string,
    metadata?: any,
    enqueueSync?: boolean
  ) => void;
  userRole: string;
  stock: Record<string, any[]>;
  setStock: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  lastClientPrices: Record<string, Record<string, number>>;
  updateLastClientPrice: (clientKey: string, sku: string, price: number) => void;
  clientes: Cliente[];
}

export default function PricingView({
  products,
  setProducts,
  productsCatalog,
  setProductsCatalog,
  productPricings,
  setProductPricings,
  quotations,
  setQuotations,
  publishEvent,
  userRole,
  stock,
  setStock,
  lastClientPrices,
  updateLastClientPrice,
  clientes
}: PricingViewProps) {
  const [activeTab, setActiveTab] = useState<'catalog' | 'pricing' | 'quotes'>('catalog');
  const [quoteSubTab, setQuoteSubTab] = useState<'create' | 'history'>('create');
  const [selectedQuoteForPrint, setSelectedQuoteForPrint] = useState<any>(null);

  // --- ESTADO: PESTAÑA CATALOGO (CRUD) ---
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({
    sku: '',
    nombre: '',
    categoria: '',
    unidadMedida: 'kg' as 'kg' | 'und' | 'lb' | 'gr',
    precio_compra: 0,
    buffer_seguridad: 5,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('TODAS');

  // --- ESTADO: PESTAÑA PRECIOS ---
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [priceForm, setPriceForm] = useState({
    precio_compra: 0,
    buffer_seguridad: 0,
    precio_venta_pos: 0,
    precio_venta_restaurante: 0,
    precio_venta_mayorista: 0,
  });
  const [selectedProductHistory, setSelectedProductHistory] = useState<string | null>(null);

  // --- ESTADO: PESTAÑA COTIZACIONES ---
  const [clientType, setClientType] = useState<'POS' | 'RESTAURANTE' | 'MAYORISTA'>('POS');
  const [clientName, setClientName] = useState('');
  const [clientIdent, setClientIdent] = useState('');
  const [quoteItems, setQuoteItems] = useState<{ product: Product; cantidad: number; descuento: number; precioOverride?: number }[]>([]);
  const [quoteDiscountGlobal, setQuoteDiscountGlobal] = useState(0); // Porcentaje
  const [quoteSearchTerm, setQuoteSearchTerm] = useState('');

  // Obtener categorías únicas
  const categoriasUnicas = ['TODAS', ...Array.from(new Set(products.map(p => p.categoria)))];

  // --- MANEJADORES CATALOGO ---
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.sku || !productForm.nombre || !productForm.categoria) {
      Swal.fire({ icon: 'warning', title: 'Campos incompletos', text: 'Por favor complete todos los campos obligatorios.', confirmButtonColor: 'var(--primary-color)' });
      return;
    }

    if (editingProductId) {
      // Editar existente
      setProducts(prev => prev.map(p => {
        if (p.id === editingProductId) {
          // Recalcular sugeridos si el costo o buffer cambió
          const compra = productForm.precio_compra;
          const buffer = productForm.buffer_seguridad;
          const sugPos = Math.round(compra * (1 + (buffer / 100) + 0.40));
          const sugRest = Math.round(compra * (1 + (buffer / 100) + 0.30));
          const sugMay = Math.round(compra * (1 + (buffer / 100) + 0.15));

          return {
            ...p,
            sku: productForm.sku.toUpperCase(),
            nombre: productForm.nombre.toUpperCase(),
            categoria: productForm.categoria.toUpperCase(),
            precio_compra: compra,
            buffer_seguridad: buffer,
            precio_venta_pos: p.precio_compra === compra && p.buffer_seguridad === buffer ? p.precio_venta_pos : sugPos,
            precio_venta_restaurante: p.precio_compra === compra && p.buffer_seguridad === buffer ? p.precio_venta_restaurante : sugRest,
            precio_venta_mayorista: p.precio_compra === compra && p.buffer_seguridad === buffer ? p.precio_venta_mayorista : sugMay,
          };
        }
        return p;
      }));
      setEditingProductId(null);
      Swal.fire({ icon: 'success', title: 'Producto actualizado', text: 'Los cambios se han guardado exitosamente.', confirmButtonColor: 'var(--primary-color)' });
    } else {
      // Crear nuevo
      const skuExists = products.some(p => p.sku.toUpperCase() === productForm.sku.toUpperCase());
      if (skuExists) {
        Swal.fire({ icon: 'error', title: 'SKU duplicado', text: 'Ya existe un producto con el SKU digitado.', confirmButtonColor: 'var(--primary-color)' });
        return;
      }

      const compra = productForm.precio_compra;
      const buffer = productForm.buffer_seguridad;
      const sugPos = Math.round(compra * (1 + (buffer / 100) + 0.40));
      const sugRest = Math.round(compra * (1 + (buffer / 100) + 0.30));
      const sugMay = Math.round(compra * (1 + (buffer / 100) + 0.15));

      const nuevoProd: Product = {
        id: `p-${Date.now()}`,
        sku: productForm.sku.toUpperCase(),
        nombre: productForm.nombre.toUpperCase(),
        categoria: productForm.categoria.toUpperCase(),
        precio_compra: compra,
        buffer_seguridad: buffer,
        precio_venta_pos: sugPos,
        precio_venta_restaurante: sugRest,
        precio_venta_mayorista: sugMay,
        activo: true
      };

      setProducts(prev => [...prev, nuevoProd]);
      Swal.fire({ icon: 'success', title: 'Producto creado', text: 'El producto se ha añadido con éxito.', confirmButtonColor: 'var(--primary-color)' });
    }

    setProductForm({ sku: '', nombre: '', categoria: '', precio_compra: 0, buffer_seguridad: 5 });
  };

  const handleEditProduct = (prod: Product) => {
    setEditingProductId(prod.id);
    setProductForm({
      sku: prod.sku,
      nombre: prod.nombre,
      categoria: prod.categoria,
      unidadMedida: prod.unidadMedida || 'kg',
      precio_compra: prod.precio_compra,
      buffer_seguridad: prod.buffer_seguridad,
    });
  };

  const handleToggleStatus = (id: string) => {
    if (setProductsCatalog) {
      setProductsCatalog(prev => prev.map(p => p.id === id ? { ...p, activo: !p.activo } : p));
    }
  };

  // --- MANEJADORES PRECIOS ---
  const handleStartEditPrice = (prod: Product) => {
    setEditingPriceId(prod.id);
    setPriceForm({
      precio_compra: prod.precio_compra,
      buffer_seguridad: prod.buffer_seguridad,
      precio_venta_pos: prod.precio_venta_pos,
      precio_venta_restaurante: prod.precio_venta_restaurante,
      precio_venta_mayorista: prod.precio_venta_mayorista
    });
  };

  // Auto-calcular cuando cambian compra o buffer en el formulario de precios
  useEffect(() => {
    if (editingPriceId) {
      const compra = priceForm.precio_compra;
      const buffer = priceForm.buffer_seguridad;
      setPriceForm(prev => ({
        ...prev,
        precio_venta_pos: Math.round(compra * (1 + (buffer / 100) + 0.40)),
        precio_venta_restaurante: Math.round(compra * (1 + (buffer / 100) + 0.30)),
        precio_venta_mayorista: Math.round(compra * (1 + (buffer / 100) + 0.15))
      }));
    }
  }, [priceForm.precio_compra, priceForm.buffer_seguridad]);

  const handleSavePrices = (prodId: string) => {
    if (setProductPricings) {
      const newPricing: ProductPricing = {
        id: generateId('prc'),
        productoId: prodId,
        vigenciaDesde: new Date().toISOString(),
        precio_compra: priceForm.precio_compra,
        buffer_seguridad: priceForm.buffer_seguridad,
        precio_venta_pos: priceForm.precio_venta_pos,
        precio_venta_restaurante: priceForm.precio_venta_restaurante,
        precio_venta_mayorista: priceForm.precio_venta_mayorista,
        actualizadoPor: userRole
      };
      setProductPricings(prev => [...prev, newPricing]);
      publishEvent('PRICE_CHANGED', userRole, `Actualización de precios para el producto ${prodId}`);
    }

    setEditingPriceId(null);
    Swal.fire({
      icon: 'success',
      title: 'Precios Actualizados',
      text: 'Los nuevos precios de venta y costos han sido guardados en el historial.',
      timer: 1500,
      showConfirmButton: false
    });
  };

  // --- MANEJADORES COTIZACIONES ---
  const handleAddToQuote = (prod: Product) => {
    setQuoteItems(prev => {
      const exists = prev.find(item => item.product.id === prod.id);
      if (exists) {
        return prev.map(item => item.product.id === prod.id ? { ...item, cantidad: item.cantidad + 1 } : item);
      }
      return [...prev, { product: prod, cantidad: 1, descuento: 0 }];
    });
  };

  const handleRemoveFromQuote = (prodId: string) => {
    setQuoteItems(prev => prev.filter(item => item.product.id !== prodId));
  };

  const handleUpdateQuoteQty = (prodId: string, qty: number) => {
    setQuoteItems(prev => prev.map(item => item.product.id === prodId ? { ...item, cantidad: Math.max(1, qty) } : item));
  };

  const handleUpdateQuoteItemDiscount = (prodId: string, desc: number) => {
    setQuoteItems(prev => prev.map(item => item.product.id === prodId ? { ...item, descuento: Math.min(100, Math.max(0, desc)) } : item));
  };

  // Obtener el precio correspondiente al tipo de cliente
  const getProductPriceByClientType = (prod: Product) => {
    switch (clientType) {
      case 'RESTAURANTE':
        return prod.precio_venta_restaurante;
      case 'MAYORISTA':
        return prod.precio_venta_mayorista;
      default:
        return prod.precio_venta_pos;
    }
  };

  const getQuoteItemUnitPrice = (item: { product: Product; precioOverride?: number }) => {
    return item.precioOverride !== undefined ? item.precioOverride : getProductPriceByClientType(item.product);
  };

  const getProductStock = (sku: string, bodega: string) => {
    const list = stock[bodega] || [];
    const matched = list.find((item: any) => item.sku === sku);
    return matched ? matched.stock : 0;
  };

  // Cálculos financieros cotización
  const quoteSubtotal = quoteItems.reduce((sum, item) => {
    const unitPrice = getQuoteItemUnitPrice(item);
    return sum + (unitPrice * item.cantidad);
  }, 0);

  const quoteLineDiscountsTotal = quoteItems.reduce((sum, item) => {
    const unitPrice = getQuoteItemUnitPrice(item);
    const lineSubtotal = unitPrice * item.cantidad;
    return sum + (lineSubtotal * (item.descuento / 100));
  }, 0);

  const quoteSubtotalAfterLineDiscounts = quoteSubtotal - quoteLineDiscountsTotal;
  const quoteGlobalDiscountValue = quoteSubtotalAfterLineDiscounts * (quoteDiscountGlobal / 100);
  const quoteTotalFinal = quoteSubtotalAfterLineDiscounts - quoteGlobalDiscountValue;

  const handleSaveQuotation = (estadoInicial: 'Draft' | 'Sent') => {
    if (!clientName) {
      Swal.fire({ icon: 'warning', title: 'Falta Cliente', text: 'Ingrese el nombre o razón social del cliente.', confirmButtonColor: 'var(--primary-color)' });
      return;
    }
    if (quoteItems.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Sin productos', text: 'Añada al menos un producto a la cotización.', confirmButtonColor: 'var(--primary-color)' });
      return;
    }

    const randomNo = 'COT-' + Math.floor(100000 + Math.random() * 900000);
    // Buscar clienteId en la base de datos — null si el cliente no está registrado
    const clienteRegistrado = clientes.find(
      c => c.identificacion === clientIdent || c.nombre === clientName.toUpperCase()
    );
    const newQuote = {
      id: generateId('q'),
      no: randomNo,
      clienteId: clienteRegistrado?.id || null,  // FK formal (DEF-02 corregido)
      clientName,
      clientIdent,
      clientType,
      items: quoteItems.map(i => ({
        sku: i.product.sku,
        nombre: i.product.nombre,
        cantidad: i.cantidad,
        precio: getQuoteItemUnitPrice(i),
        descuento: i.descuento
      })),
      subtotal: quoteSubtotal,
      descuentos: quoteLineDiscountsTotal + quoteGlobalDiscountValue,
      total: Math.round(quoteTotalFinal),
      estado: estadoInicial,
      fecha: new Date().toLocaleDateString('es-CO'),
      vencimiento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('es-CO')
    };

    setQuotations(prev => [newQuote, ...prev]);

    publishEvent(
      'QUOTE_STATUS_CHANGED',
      userRole,
      `Nueva cotización ${randomNo} creada en estado ${estadoInicial} para ${clientName}`,
      { quoteId: newQuote.id, total: newQuote.total }
    );

    // Reset form
    setClientName('');
    setClientIdent('');
    setQuoteItems([]);
    setQuoteDiscountGlobal(0);
    setQuoteSubTab('history');

    Swal.fire({
      icon: 'success',
      title: 'Cotización Creada',
      text: `Cotización ${randomNo} registrada como ${estadoInicial}.`,
      confirmButtonColor: 'var(--primary-color)'
    });
  };

  const handleTransitionQuote = (quoteId: string, nuevoEstado: 'Sent' | 'Approved' | 'Sold' | 'Expired') => {
    if (nuevoEstado === 'Approved') {
      if (userRole !== 'admin' && userRole !== 'administrativo') {
        Swal.fire({
          icon: 'error',
          title: 'Acceso Denegado',
          text: 'Solo roles de Super Administrador o Administrativo pueden aprobar cotizaciones.',
          confirmButtonColor: 'var(--primary-color)'
        });
        return;
      }
    }

    setQuotations(prev => prev.map(q => {
      if (q.id === quoteId) {
        publishEvent(
          'QUOTE_STATUS_CHANGED',
          userRole,
          `Cotización ${q.no} cambió de estado ${q.estado} a ${nuevoEstado}`,
          { quoteId, oldEstado: q.estado, nuevoEstado }
        );

        if (nuevoEstado === 'Sold') {
          // Decrease stock in Bodega Principal
          setStock(prev => {
            const newStock = { ...prev };
            if (newStock['Bodega Principal']) {
              newStock['Bodega Principal'] = newStock['Bodega Principal'].map((stockItem: any) => {
                const quoteItem = q.items.find((i: any) => i.sku === stockItem.sku);
                if (quoteItem) {
                  return { ...stockItem, stock: Math.max(0, stockItem.stock - quoteItem.cantidad) };
                }
                return stockItem;
              });
            }
            return newStock;
          });

          // Record last prices per client
          const clientKey = (q.clientIdent || q.clientName).trim().toLowerCase();
          q.items.forEach((item: any) => {
            updateLastClientPrice(clientKey, item.sku, item.precio);
          });

          publishEvent(
            'SALE_COMPLETED',
            userRole,
            `Cotización aprobada ${q.no} ha sido facturada (Venta Realizada) y se actualizó el stock`,
            { quoteNo: q.no, clientName: q.clientName, total: q.total }
          );
        }

        return { ...q, estado: nuevoEstado };
      }
      return q;
    }));

    Swal.fire({
      icon: 'success',
      title: 'Estado Actualizado',
      text: `Cotización actualizada a ${nuevoEstado} exitosamente.`,
      timer: 1500,
      showConfirmButton: false
    });
  };

  const handlePrintQuote = () => {
    window.print();
  };

  // Filtrado de productos para el catálogo y el buscador del cotizador
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'TODAS' || p.categoria === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const quoteFilteredProducts = products.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(quoteSearchTerm.toLowerCase()) || p.sku.toLowerCase().includes(quoteSearchTerm.toLowerCase());
    return matchesSearch && p.activo;
  });

  return (
    <div className="hr-layout animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', overflowY: 'auto', padding: '24px' }}>
      
      {/* Cabecera / Pestañas */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 500 }}>Políticas de Venta</span>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.5px' }}>Precios y Cotizaciones</h2>
        </div>

        <div style={{ display: 'flex', gap: '8px', backgroundColor: '#E2E8F0', padding: '4px', borderRadius: '12px' }}>
          <button
            onClick={() => { setActiveTab('catalog'); }}
            className={`pos-category-tab ${activeTab === 'catalog' ? 'active' : ''}`}
            style={{ margin: 0, padding: '8px 16px', borderRadius: '8px' }}
          >
            <FileText size={16} style={{ marginRight: '6px', display: 'inline', verticalAlign: 'middle' }} />
            Catálogo
          </button>
          <button
            onClick={() => { setActiveTab('pricing'); }}
            className={`pos-category-tab ${activeTab === 'pricing' ? 'active' : ''}`}
            style={{ margin: 0, padding: '8px 16px', borderRadius: '8px' }}
          >
            <DollarSign size={16} style={{ marginRight: '6px', display: 'inline', verticalAlign: 'middle' }} />
            Gestor de Precios
          </button>
          <button
            onClick={() => { setActiveTab('quotes'); }}
            className={`pos-category-tab ${activeTab === 'quotes' ? 'active' : ''}`}
            style={{ margin: 0, padding: '8px 16px', borderRadius: '8px' }}
          >
            <ShoppingCart size={16} style={{ marginRight: '6px', display: 'inline', verticalAlign: 'middle' }} />
            Cotizador
          </button>
        </div>
      </div>

      {/* Contoda Alert banner */}
      <div className="contoda-alert animate-fade-in">
        <div style={{ fontSize: '18px' }}>⚠️</div>
        <div style={{ flex: 1 }}>
          <h4 className="contoda-alert-title">VINCULACIÓN E INTEGRACIÓN AUTOMÁTICA CON SIIGO Y SUPERBOS</h4>
          <p className="contoda-alert-desc">
            Los precios modificados en este módulo se verán reflejados en tiempo real en la facturación del POS y la valorización de stock. 
            Las cotizaciones generadas quedan registradas con estado <span className="badge-vigente" style={{ padding: '2px 6px', fontSize: '10px' }}>VIGENTE</span> por un periodo de 15 días.
          </p>
        </div>
      </div>

      {/* --- PESTAÑA 1: CATALOGO Y CRUD --- */}
      {activeTab === 'catalog' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '24px' }}>
          {/* Formulario */}
          <div className="hr-table-card" style={{ padding: '24px', height: 'fit-content' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px' }}>
              {editingProductId ? 'Editar Producto' : 'Crear Nuevo Producto'}
            </h3>
            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">SKU (Código Único) *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: FIL-ROB-004"
                  value={productForm.sku}
                  onChange={e => setProductForm({ ...productForm, sku: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Nombre del Producto *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: FILETE DE RÓBALO LIMPIO"
                  value={productForm.nombre}
                  onChange={e => setProductForm({ ...productForm, nombre: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Categoría *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: PESCADOS, MARISCOS, BATIDOS"
                  value={productForm.categoria}
                  onChange={e => setProductForm({ ...productForm, categoria: e.target.value })}
                  list="categorias-list"
                />
                <datalist id="categorias-list">
                  {categoriasUnicas.filter(c => c !== 'TODAS').map(c => <option key={c} value={c} />)}
                </datalist>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Costo de Compra ($)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="0"
                    value={productForm.precio_compra || ''}
                    onChange={e => setProductForm({ ...productForm, precio_compra: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Margen de Buffer (%)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="5"
                    value={productForm.buffer_seguridad}
                    onChange={e => setProductForm({ ...productForm, buffer_seguridad: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="submit" className="btn-primary" style={{ border: 'none', flex: 1, justifyContent: 'center', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px' }}>
                  <Save size={16} />
                  <span>{editingProductId ? 'Guardar Cambios' : 'Registrar Producto'}</span>
                </button>
                {editingProductId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProductId(null);
                      setProductForm({ sku: '', nombre: '', categoria: '', precio_compra: 0, buffer_seguridad: 5 });
                    }}
                    className="btn-secondary"
                    style={{ flex: 0.5, justifyContent: 'center', display: 'flex', alignItems: 'center', padding: '12px' }}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Tabla y Listado */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div className="pos-search-bar" style={{ marginBottom: 0, flex: 1 }}>
                <Search size={18} color="#64748B" />
                <input
                  type="text"
                  className="pos-search-input"
                  placeholder="Buscar producto por nombre o SKU..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="form-control"
                style={{ width: '180px', height: '48px', borderRadius: '12px' }}
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
              >
                {categoriasUnicas.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="hr-table-card">
              <table className="hr-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Nombre</th>
                    <th>Categoría</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => (
                    <tr key={p.id} style={{ opacity: p.activo ? 1 : 0.6 }}>
                      <td style={{ fontWeight: 700, color: '#64748B' }}>{p.sku}</td>
                      <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                      <td>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '12px', backgroundColor: '#F1F5F9', color: '#475569' }}>
                          {p.categoria}
                        </span>
                      </td>
                      <td>
                        <span
                          onClick={() => handleToggleStatus(p.id)}
                          className={`badge-status ${p.activo ? 'activo' : 'inactivo'}`}
                          style={{ cursor: 'pointer' }}
                        >
                          {p.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => handleEditProduct(p)} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', marginRight: '12px' }}>
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>
                        No se encontraron productos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- PESTAÑA 2: GESTOR DE PRECIOS --- */}
      {activeTab === 'pricing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="pos-search-bar" style={{ marginBottom: 0, flex: 1 }}>
              <Search size={18} color="#64748B" />
              <input
                type="text"
                className="pos-search-input"
                placeholder="Buscar por SKU o Nombre para cotizar/costear..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="form-control"
              style={{ width: '180px', height: '48px', borderRadius: '12px' }}
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              {categoriasUnicas.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="hr-table-card" style={{ overflowX: 'auto' }}>
            <table className="hr-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '130px' }}>SKU</th>
                  <th style={{ minWidth: '180px' }}>Producto</th>
                  <th style={{ minWidth: '120px' }}>Costo Compra</th>
                  <th style={{ minWidth: '100px' }}>Buffer Seg.</th>
                  <th style={{ minWidth: '130px', backgroundColor: 'rgba(9, 103, 177, 0.05)' }}>Precio POS</th>
                  <th style={{ minWidth: '130px', backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>Precio Restaurante</th>
                  <th style={{ minWidth: '130px', backgroundColor: 'rgba(107, 114, 128, 0.05)' }}>Precio Mayorista</th>
                  <th style={{ minWidth: '100px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => {
                  const isEditing = editingPriceId === p.id;
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 700, color: '#64748B' }}>{p.sku}</td>
                      <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            className="form-control"
                            style={{ width: '100px', padding: '6px' }}
                            value={priceForm.precio_compra}
                            onChange={e => setPriceForm({ ...priceForm, precio_compra: parseInt(e.target.value) || 0 })}
                          />
                        ) : (
                          `$${p.precio_compra.toLocaleString('es-CO')}`
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <input
                              type="number"
                              className="form-control"
                              style={{ width: '60px', padding: '6px' }}
                              value={priceForm.buffer_seguridad}
                              onChange={e => setPriceForm({ ...priceForm, buffer_seguridad: parseInt(e.target.value) || 0 })}
                            />
                            <span style={{ fontSize: '12px' }}>%</span>
                          </div>
                        ) : (
                          `${p.buffer_seguridad}%`
                        )}
                      </td>
                      <td style={{ backgroundColor: 'rgba(9, 103, 177, 0.02)', fontWeight: 700 }}>
                        {isEditing ? (
                          <input
                            type="number"
                            className="form-control"
                            style={{ width: '110px', padding: '6px', borderColor: 'var(--primary-color)' }}
                            value={priceForm.precio_venta_pos}
                            onChange={e => setPriceForm({ ...priceForm, precio_venta_pos: parseInt(e.target.value) || 0 })}
                          />
                        ) : (
                          `$${p.precio_venta_pos.toLocaleString('es-CO')}`
                        )}
                      </td>
                      <td style={{ backgroundColor: 'rgba(59, 130, 246, 0.02)', fontWeight: 700 }}>
                        {isEditing ? (
                          <input
                            type="number"
                            className="form-control"
                            style={{ width: '110px', padding: '6px', borderColor: '#3B82F6' }}
                            value={priceForm.precio_venta_restaurante}
                            onChange={e => setPriceForm({ ...priceForm, precio_venta_restaurante: parseInt(e.target.value) || 0 })}
                          />
                        ) : (
                          `$${p.precio_venta_restaurante.toLocaleString('es-CO')}`
                        )}
                      </td>
                      <td style={{ backgroundColor: 'rgba(107, 114, 128, 0.02)', fontWeight: 700 }}>
                        {isEditing ? (
                          <input
                            type="number"
                            className="form-control"
                            style={{ width: '110px', padding: '6px', borderColor: '#6B7280' }}
                            value={priceForm.precio_venta_mayorista}
                            onChange={e => setPriceForm({ ...priceForm, precio_venta_mayorista: parseInt(e.target.value) || 0 })}
                          />
                        ) : (
                          `$${p.precio_venta_mayorista.toLocaleString('es-CO')}`
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleSavePrices(p.id)}
                              style={{ background: 'var(--primary-color)', border: 'none', color: 'white', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                              title="Guardar"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => setEditingPriceId(null)}
                              style={{ background: '#EF4444', border: 'none', color: 'white', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                              title="Cancelar"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => handleStartEditPrice(p)}
                              className="btn-primary"
                              style={{ padding: '6px 10px', fontSize: '12px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none' }}
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => setSelectedProductHistory(p.id)}
                              className="btn-secondary"
                              style={{ padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="Ver historial de cambios"
                            >
                              <FileText size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- PESTAÑA 3: COTIZADOR --- */}
      {activeTab === 'quotes' && !selectedQuoteForPrint && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Subnavegación de Cotizaciones */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <button
              onClick={() => setQuoteSubTab('create')}
              className={`pos-category-tab ${quoteSubTab === 'create' ? 'active' : ''}`}
              style={{ margin: 0, padding: '8px 16px', borderRadius: '8px', fontSize: '13px' }}
            >
              Nuevo Cotizador
            </button>
            <button
              onClick={() => setQuoteSubTab('history')}
              className={`pos-category-tab ${quoteSubTab === 'history' ? 'active' : ''}`}
              style={{ margin: 0, padding: '8px 16px', borderRadius: '8px', fontSize: '13px' }}
            >
              Historial y Workflows ({quotations.length})
            </button>
          </div>

          {quoteSubTab === 'create' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '24px' }}>
              {/* Formulario Cliente y Selección de Precios */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="hr-table-card" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px' }}>Datos de la Cotización</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>Buscar/Vincular Cliente Registrado</label>
                      <select
                        className="form-control"
                        style={{ border: '2px solid var(--primary-color)', borderRadius: '8px' }}
                        value={clientes.find(c => c.identificacion === clientIdent)?.id || ''}
                        onChange={e => {
                          const selected = clientes.find(c => c.id === e.target.value);
                          if (selected) {
                            setClientName(selected.nombre);
                            setClientIdent(selected.identificacion);
                            setClientType(selected.tipoPrecio as any);
                          } else {
                            setClientName('');
                            setClientIdent('');
                            setClientType('POS');
                          }
                        }}
                      >
                        <option value="">-- Seleccionar cliente de base de datos --</option>
                        {clientes.filter(c => c.activo).map(c => (
                          <option key={c.id} value={c.id}>
                            {c.nombre} ({c.identificacion}) [Tarifa: {c.tipoPrecio}]
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Lista de Precios del Cliente</label>
                      <select
                        className="form-control"
                        value={clientType}
                        onChange={e => setClientType(e.target.value as any)}
                        style={{ fontWeight: 700, color: 'var(--primary-color)' }}
                      >
                        <option value="POS">Lista POS (Venta Directa)</option>
                        <option value="RESTAURANTE">Lista Restaurante (Margen intermedio)</option>
                        <option value="MAYORISTA">Lista Mayorista / B2B (Mejor Precio)</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Cliente (Nombre o Razón Social) *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ej. Restaurante Puerto Mar"
                        value={clientName}
                        onChange={e => setClientName(e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">NIT / Cédula</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ej. 900.123.456-1"
                        value={clientIdent}
                        onChange={e => setClientIdent(e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Descuento Global Adicional</span>
                        <span style={{ color: 'var(--primary-color)', fontWeight: 700 }}>{quoteDiscountGlobal}%</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        step="1"
                        className="form-control"
                        value={quoteDiscountGlobal}
                        onChange={e => setQuoteDiscountGlobal(parseInt(e.target.value) || 0)}
                      />
                    </div>

                  </div>
                </div>

                {/* Listado de items del carrito de la cotización */}
                <div className="hr-table-card" style={{ padding: '24px', flex: 1, minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShoppingCart size={18} color="var(--primary-color)" /> Detalle de la Cotización
                  </h3>
                  
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '350px', marginBottom: '16px' }}>
                    {quoteItems.length === 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748B', gap: '8px', flex: 1 }}>
                        <span style={{ fontSize: '32px' }}>📝</span>
                        <span style={{ fontSize: '13px', fontWeight: 500 }}>No hay productos agregados</span>
                      </div>
                    ) : (
                      quoteItems.map(item => {
                        const stockPrincipal = getProductStock(item.product.sku, 'Bodega Principal');
                        const isInsufficient = stockPrincipal < item.cantidad;
                        const clientKey = (clientIdent || clientName).trim().toLowerCase();
                        const historicalPrice = clientKey ? lastClientPrices[clientKey]?.[item.product.sku] : undefined;
                        const unitPrice = getQuoteItemUnitPrice(item);
                        const lineTotal = unitPrice * item.cantidad * (1 - item.descuento / 100);

                        return (
                          <div key={item.product.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '8px', animation: 'fadeIn 0.2s' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700 }}>{item.product.nombre}</span>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                  <span style={{ fontSize: '11px', color: '#64748B' }}>SKU: {item.product.sku}</span>
                                  <span style={{
                                    fontSize: '10px',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    backgroundColor: isInsufficient ? '#FEE2E2' : '#F1F5F9',
                                    color: isInsufficient ? '#EF4444' : '#64748B',
                                    fontWeight: 600
                                  }}>
                                    P: {stockPrincipal} {isInsufficient && '⚠️ Insuficiente'}
                                  </span>
                                </div>
                                <span style={{ fontSize: '11px', color: 'var(--primary-color)', fontWeight: 600 }}>
                                  Unitario: ${unitPrice.toLocaleString('es-CO')}
                                </span>
                              </div>
                              <button onClick={() => handleRemoveFromQuote(item.product.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>
                                <X size={16} />
                              </button>
                            </div>

                            {/* Alerta de Precio Histórico y Botón de Variación */}
                            {historicalPrice !== undefined && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {historicalPrice === unitPrice ? (
                                  <span style={{
                                    fontSize: '9px',
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
                                      setQuoteItems(prev => prev.map(i => i.product.id === item.product.id ? { ...i, precioOverride: historicalPrice } : i));
                                      Swal.fire({
                                        toast: true,
                                        position: 'top-end',
                                        icon: 'success',
                                        title: `Precio histórico aplicado: $${historicalPrice.toLocaleString('es-CO')}`,
                                        showConfirmButton: false,
                                        timer: 1500
                                      });
                                    }}
                                    className="btn-warning"
                                    style={{
                                      fontSize: '9px',
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
                                    💡 Último: ${historicalPrice.toLocaleString('es-CO')} (Aplicar)
                                  </button>
                                )}

                                {item.precioOverride !== undefined && (
                                  <button
                                    onClick={() => {
                                      setQuoteItems(prev => prev.map(i => i.product.id === item.product.id ? { ...i, precioOverride: undefined } : i));
                                    }}
                                    style={{
                                      fontSize: '9px',
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

                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
                                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Cant:</span>
                                <input
                                  type="number"
                                  className="form-control"
                                  style={{ padding: '4px 8px', fontSize: '12px' }}
                                  value={item.cantidad}
                                  onChange={e => handleUpdateQuoteQty(item.product.id, parseInt(e.target.value) || 1)}
                                />
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
                                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Desc:</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  className="form-control"
                                  style={{ padding: '4px 8px', fontSize: '12px' }}
                                  value={item.descuento}
                                  onChange={e => handleUpdateQuoteItemDiscount(item.product.id, parseInt(e.target.value) || 0)}
                                />
                                <span style={{ fontSize: '12px' }}>%</span>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '80px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>${Math.round(lineTotal).toLocaleString('es-CO')}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B' }}>
                      <span>Subtotal bruto</span>
                      <span>${quoteSubtotal.toLocaleString('es-CO')}</span>
                    </div>
                    {quoteLineDiscountsTotal > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#EF4444' }}>
                        <span>Descuentos de línea</span>
                        <span>-${Math.round(quoteLineDiscountsTotal).toLocaleString('es-CO')}</span>
                      </div>
                    )}
                    {quoteDiscountGlobal > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#EF4444' }}>
                        <span>Descuento global ({quoteDiscountGlobal}%)</span>
                        <span>-${Math.round(quoteGlobalDiscountValue).toLocaleString('es-CO')}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, color: '#1E293B', borderTop: '2px solid #E2E8F0', paddingTop: '8px' }}>
                      <span>TOTAL COTIZADO</span>
                      <span>${Math.round(quoteTotalFinal).toLocaleString('es-CO')}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                      <button 
                        onClick={() => handleSaveQuotation('Draft')} 
                        className="btn-secondary" 
                        style={{ flex: 1, justifyContent: 'center', padding: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Save size={16} />
                        <span>Borrador</span>
                      </button>
                      <button 
                        onClick={() => handleSaveQuotation('Sent')} 
                        className="btn-primary" 
                        style={{ flex: 2, border: 'none', justifyContent: 'center', padding: '12px', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <FileText size={18} />
                        <span>Crear y Enviar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Buscador y listado para añadir rápidamente */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="pos-search-bar" style={{ marginBottom: 0 }}>
                  <Search size={18} color="#64748B" />
                  <input
                    type="text"
                    className="pos-search-input"
                    placeholder="Buscar productos activos para la cotización..."
                    value={quoteSearchTerm}
                    onChange={e => setQuoteSearchTerm(e.target.value)}
                  />
                </div>

                <div className="hr-table-card">
                  <table className="hr-table">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Nombre</th>
                        <th>Categoría</th>
                        <th>Precio ({clientType})</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                       {quoteFilteredProducts.map(p => {
                        const stockPrincipal = getProductStock(p.sku, 'Bodega Principal');
                        const stockSecundaria = getProductStock(p.sku, 'Bodega Secundaria');
                        const stockAverias = getProductStock(p.sku, 'Bodega Averías');
                        return (
                          <tr key={p.id}>
                            <td style={{ fontWeight: 700, color: '#64748B' }}>{p.sku}</td>
                            <td style={{ fontWeight: 600 }}>
                              <div>{p.nombre}</div>
                              <div style={{ display: 'flex', gap: '8px', fontSize: '10px', color: '#64748B', marginTop: '2px' }}>
                                <span>P: <strong style={{ color: stockPrincipal === 0 ? '#EF4444' : stockPrincipal <= p.buffer_seguridad ? '#F59E0B' : '#10B981' }}>{stockPrincipal}</strong></span>
                                <span>S: <strong>{stockSecundaria}</strong></span>
                                <span>A: <strong style={{ color: '#E11D48' }}>{stockAverias}</strong></span>
                              </div>
                            </td>
                            <td>
                              <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '12px', backgroundColor: '#F1F5F9' }}>
                                {p.categoria}
                              </span>
                            </td>
                            <td style={{ fontWeight: 700, color: 'var(--primary-color)' }}>
                              ${getProductPriceByClientType(p).toLocaleString('es-CO')}
                            </td>
                            <td>
                              <button
                                onClick={() => handleAddToQuote(p)}
                                className="btn-primary"
                                style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary-color)', color: 'white' }}
                              >
                                <Plus size={12} /> Añadir
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {quoteFilteredProducts.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>
                            No se encontraron productos activos.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* Historial de Cotizaciones y Estados de Flujo */
            <div className="hr-table-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px' }}>Cotizaciones Registradas en el Sistema</h3>
              
              {quotations.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', color: '#64748B', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '48px' }}>📂</span>
                  <span style={{ fontWeight: 500 }}>No hay cotizaciones registradas</span>
                  <span style={{ fontSize: '12px' }}>Usa la pestaña "Nuevo Cotizador" para registrar una cotización.</span>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="hr-table">
                    <thead>
                      <tr>
                        <th>Nro Doc</th>
                        <th>Fecha</th>
                        <th>Cliente</th>
                        <th>Canal</th>
                        <th>Items</th>
                        <th>Total Neto</th>
                        <th>Estado</th>
                        <th>Flujo de Trabajo (Workflow)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotations.map(q => {
                        let statusColor = '#64748B';
                        let statusBg = '#F1F5F9';
                        if (q.estado === 'Sent') { statusColor = 'var(--primary-color)'; statusBg = 'var(--primary-light)'; }
                        else if (q.estado === 'Approved') { statusColor = '#10B981'; statusBg = '#D1FAE5'; }
                        else if (q.estado === 'Sold') { statusColor = '#0EA5E9'; statusBg = '#E0F2FE'; }
                        else if (q.estado === 'Expired') { statusColor = '#EF4444'; statusBg = '#FEE2E2'; }

                        return (
                          <tr key={q.id}>
                            <td style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{q.no}</td>
                            <td>{q.fecha}</td>
                            <td>
                              <div style={{ fontWeight: 700 }}>{q.clientName}</div>
                              <div style={{ fontSize: '11px', color: '#64748B' }}>NIT: {q.clientIdent || 'N/A'}</div>
                            </td>
                            <td>
                              <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '12px', backgroundColor: '#F1F5F9' }}>
                                {q.clientType}
                              </span>
                            </td>
                            <td>{q.items.reduce((sum: number, i: any) => sum + i.cantidad, 0)} uds</td>
                            <td style={{ fontWeight: 'bold' }}>${q.total.toLocaleString('es-CO')}</td>
                            <td>
                              <span style={{
                                padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold',
                                color: statusColor, backgroundColor: statusBg, display: 'inline-flex', alignItems: 'center', gap: '6px'
                              }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: statusColor }}></span>
                                {q.estado}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                <button
                                  className="btn-secondary"
                                  style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                  onClick={() => setSelectedQuoteForPrint(q)}
                                >
                                  Ver PDF
                                </button>

                                {q.estado === 'Draft' && (
                                  <button
                                    className="btn-primary"
                                    style={{ padding: '6px 10px', fontSize: '11px', border: 'none', backgroundColor: 'var(--primary-color)', color: 'white' }}
                                    onClick={() => handleTransitionQuote(q.id, 'Sent')}
                                  >
                                    Enviar Cliente
                                  </button>
                                )}

                                {q.estado === 'Sent' && (
                                  <>
                                    <button
                                      className="btn-primary"
                                      style={{ padding: '6px 10px', fontSize: '11px', border: 'none', backgroundColor: '#10B981', color: 'white' }}
                                      onClick={() => handleTransitionQuote(q.id, 'Approved')}
                                    >
                                      Aprobar
                                    </button>
                                    <button
                                      className="btn-secondary"
                                      style={{ padding: '6px 10px', fontSize: '11px', color: '#EF4444', borderColor: '#EF4444' }}
                                      onClick={() => handleTransitionQuote(q.id, 'Expired')}
                                    >
                                      Vencer
                                    </button>
                                  </>
                                )}

                                {q.estado === 'Approved' && (
                                  <button
                                    className="btn-primary"
                                    style={{ padding: '6px 10px', fontSize: '11px', border: 'none', backgroundColor: '#0EA5E9', color: 'white' }}
                                    onClick={() => handleTransitionQuote(q.id, 'Sold')}
                                  >
                                    Facturar Venta
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* --- FACTURA PROFORMA / VISTA IMPRIMIBLE DE COTIZACIÓN --- */}
      {activeTab === 'quotes' && selectedQuoteForPrint && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '800px', justifyContent: 'flex-end' }} className="no-print">
            <button
              onClick={() => setSelectedQuoteForPrint(null)}
              className="btn-secondary"
              style={{ padding: '10px 20px' }}
            >
              Volver al Editor
            </button>
            <button
              onClick={handlePrintQuote}
              className="btn-primary"
              style={{ border: 'none', padding: '10px 20px', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Printer size={18} />
              Imprimir / Guardar PDF
            </button>
          </div>

          {/* Formato Proforma */}
          <div id="quotation-print-sheet" style={{
            backgroundColor: 'white', width: '100%', maxWidth: '800px', border: '1px solid #E2E8F0',
            boxShadow: 'var(--shadow-lg)', padding: '40px', borderRadius: '16px', display: 'flex',
            flexDirection: 'column', gap: '24px', color: '#0F172A'
          }}>
            
            {/* Encabezado Cotización */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #E2E8F0', paddingBottom: '20px' }}>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: 900, color: 'var(--primary-color)', letterSpacing: '-0.5px' }}>LA PEZCADERÍA S.A.S.</h1>
                <p style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                  NIT: 901.482.911-5<br />
                  Dirección: Carrera 15 # 85-32, Bogotá D.C.<br />
                  Teléfono: +57 (312) 485-9921 | Email: ventas@lapezcaderia.com
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={`badge-${selectedQuoteForPrint.estado.toLowerCase()}`} style={{
                  padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold',
                  color: selectedQuoteForPrint.estado === 'Approved' ? '#10B981' : selectedQuoteForPrint.estado === 'Sent' ? 'var(--primary-color)' : '#64748B',
                  backgroundColor: selectedQuoteForPrint.estado === 'Approved' ? '#D1FAE5' : selectedQuoteForPrint.estado === 'Sent' ? 'var(--primary-light)' : '#F1F5F9',
                  display: 'inline-flex', alignItems: 'center', gap: '6px'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: selectedQuoteForPrint.estado === 'Approved' ? '#10B981' : selectedQuoteForPrint.estado === 'Sent' ? 'var(--primary-color)' : '#64748B' }}></span>
                  Estado: {selectedQuoteForPrint.estado}
                </span>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1E293B', marginTop: '12px' }}>{selectedQuoteForPrint.no}</h2>
                <p style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                  Fecha: {selectedQuoteForPrint.fecha}<br />
                  Vencimiento: {selectedQuoteForPrint.vencimiento} (15 días)
                </p>
              </div>
            </div>

            {/* Datos Tercero */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Cotizado A:</span>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', marginTop: '4px' }}>{selectedQuoteForPrint.clientName.toUpperCase()}</h3>
                {selectedQuoteForPrint.clientIdent && <p style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>NIT/CC: {selectedQuoteForPrint.clientIdent}</p>}
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Canal de Ventas:</span>
                <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-color)', marginTop: '4px' }}>
                  Lista Especial: {selectedQuoteForPrint.clientType === 'POS' ? 'VENTA DIRECTA POS' : selectedQuoteForPrint.clientType === 'RESTAURANTE' ? 'RESTAURANTES / HORECA' : 'MAYORISTA / DISTRIBUIDORES'}
                </p>
                <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Vendedor: Administrador ERP</p>
              </div>
            </div>

            {/* Tabla Productos */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', color: '#64748B', fontWeight: 700 }}>SKU</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', color: '#64748B', fontWeight: 700 }}>DESCRIPCIÓN</th>
                  <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '12px', color: '#64748B', fontWeight: 700 }}>CANTIDAD</th>
                  <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '12px', color: '#64748B', fontWeight: 700 }}>PRECIO UNIT.</th>
                  {selectedQuoteForPrint.items.some((i: any) => i.descuento > 0) && (
                    <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '12px', color: '#64748B', fontWeight: 700 }}>DESC.</th>
                  )}
                  <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '12px', color: '#64748B', fontWeight: 700 }}>SUBTOTAL</th>
                </tr>
              </thead>
              <tbody>
                {selectedQuoteForPrint.items.map((item: any) => {
                  const lineTotal = item.precio * item.cantidad * (1 - item.descuento / 100);
                  return (
                    <tr key={item.sku} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 8px', fontSize: '12px', fontWeight: 700, color: '#64748B' }}>{item.sku}</td>
                      <td style={{ padding: '12px 8px', fontSize: '13px', fontWeight: 600 }}>{item.nombre}</td>
                      <td style={{ padding: '12px 8px', fontSize: '13px', textAlign: 'right' }}>{item.cantidad}</td>
                      <td style={{ padding: '12px 8px', fontSize: '13px', textAlign: 'right' }}>${item.precio.toLocaleString('es-CO')}</td>
                      {selectedQuoteForPrint.items.some((i: any) => i.descuento > 0) && (
                        <td style={{ padding: '12px 8px', fontSize: '13px', textAlign: 'right', color: '#EF4444' }}>
                          {item.descuento > 0 ? `${item.descuento}%` : '-'}
                        </td>
                      )}
                      <td style={{ padding: '12px 8px', fontSize: '13px', fontWeight: 700, textAlign: 'right' }}>
                        ${Math.round(lineTotal).toLocaleString('es-CO')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Desglose Totales */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B' }}>
                  <span>Subtotal Bruto:</span>
                  <span>${selectedQuoteForPrint.subtotal.toLocaleString('es-CO')}</span>
                </div>
                {selectedQuoteForPrint.descuentos > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#EF4444' }}>
                    <span>Descuentos Aplicados:</span>
                    <span>-${Math.round(selectedQuoteForPrint.descuentos).toLocaleString('es-CO')}</span>
                  </div>
                )}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 900,
                  color: 'var(--primary-color)', borderTop: '2px solid var(--primary-color)', paddingTop: '12px', marginTop: '4px'
                }}>
                  <span>TOTAL NETO:</span>
                  <span>${selectedQuoteForPrint.total.toLocaleString('es-CO')}</span>
                </div>
              </div>
            </div>

            {/* Términos y Firmas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '40px', marginTop: '40px', borderTop: '1px solid #E2E8F0', paddingTop: '24px' }}>
              <div>
                <h4 style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Términos y Condiciones:</h4>
                <ol style={{ fontSize: '11px', color: '#64748B', paddingLeft: '14px', marginTop: '6px', lineHeight: 1.6 }}>
                  <li>Los precios cotizados no incluyen IVA (productos de pesca exentos/excluidos según estatuto).</li>
                  <li>Esta proforma no representa una reserva de inventario físico hasta ser confirmada con orden de compra.</li>
                  <li>El despacho se realizará de acuerdo al cronograma de rutas de La Pezcadería.</li>
                </ol>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100px' }}>
                <div style={{ width: '80%', borderBottom: '1px solid #94A3B8' }}></div>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, marginTop: '8px' }}>Firma Autorizada</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL DE HISTORIAL DE PRECIOS */}
      {selectedProductHistory && productPricings && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '800px' }}>
            <div className="modal-header">
              <h2>Historial de Precios</h2>
              <button className="btn-icon" onClick={() => setSelectedProductHistory(null)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <p style={{ marginBottom: '16px', color: '#475569' }}>
                Producto: <strong>{products.find(p => p.id === selectedProductHistory)?.nombre || 'Desconocido'}</strong>
              </p>
              <table className="hr-table">
                <thead>
                  <tr>
                    <th>Fecha Vigencia</th>
                    <th>Costo</th>
                    <th>Buffer</th>
                    <th>Precio POS</th>
                    <th>Precio Rest.</th>
                    <th>Precio Mayor.</th>
                    <th>Actor</th>
                  </tr>
                </thead>
                <tbody>
                  {productPricings
                    .filter(pr => pr.productoId === selectedProductHistory)
                    .sort((a, b) => new Date(b.vigenciaDesde).getTime() - new Date(a.vigenciaDesde).getTime())
                    .map((pr, i) => (
                    <tr key={pr.id}>
                      <td>
                        {new Date(pr.vigenciaDesde).toLocaleDateString('es-CO')}
                        <br/>
                        <span style={{ fontSize: '11px', color: '#64748B' }}>
                          {new Date(pr.vigenciaDesde).toLocaleTimeString('es-CO')}
                          {i === 0 && <span style={{ marginLeft: '6px', color: 'green', fontWeight: 'bold' }}>(Vigente)</span>}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>${pr.precio_compra.toLocaleString('es-CO')}</td>
                      <td>{pr.buffer_seguridad}%</td>
                      <td>${pr.precio_venta_pos.toLocaleString('es-CO')}</td>
                      <td>${pr.precio_venta_restaurante.toLocaleString('es-CO')}</td>
                      <td>${pr.precio_venta_mayorista.toLocaleString('es-CO')}</td>
                      <td>
                        <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', backgroundColor: '#F1F5F9' }}>
                          {pr.actualizadoPor}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {productPricings.filter(pr => pr.productoId === selectedProductHistory).length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>No hay historial para este producto.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setSelectedProductHistory(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
