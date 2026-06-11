// src/views/PricingView.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Save, Printer, Search, DollarSign, ShoppingCart, FileText, Check, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { Product, ProductCatalog, ProductPricing, Cliente, generateId, Conductor, DevolucionPedido } from '../App.tsx';

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
  conductores?: Conductor[];
  devoluciones?: DevolucionPedido[];
  setDevoluciones?: React.Dispatch<React.SetStateAction<DevolucionPedido[]>>;
}

export default function PricingView({
  products,
  setProducts,
  setProductsCatalog,
  productPricings,
  setProductPricings,
  quotations,
  setQuotations,
  publishEvent,
  userRole,
  stock,
  setStock,
  updateLastClientPrice,
  clientes,
  conductores = [],
  devoluciones = [],
  setDevoluciones
}: PricingViewProps) {
  const [activeTab, setActiveTab] = useState<'catalog' | 'pricing' | 'quotes'>('quotes');
  const [quoteSubTab, setQuoteSubTab] = useState<'create' | 'history' | 'devoluciones'>('create');
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
  const [quoteItems, setQuoteItems] = useState<{ 
    product: Product; 
    cantidad: number; 
    descuento: number; 
    precioOverride?: number;
    detalle?: string;
    listo?: boolean;
    esDevolucion?: boolean;
    devolucionId?: string;
  }[]>([]);
  
  // --- ESTADOS NUEVOS DEL WIZARD ---
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [origenPedido, setOrigenPedido] = useState('WHATSAPP');
  const [origenesDisponibles] = useState(['VISITA', 'LLAMADA', 'WHATSAPP']);
  const [nuevoOrigen, setNuevoOrigen] = useState('');
  const [facturaElectronica, setFacturaElectronica] = useState(false);
  const [formaPago, setFormaPago] = useState<'CREDITO' | 'CONTADO'>('CREDITO');
  
  // Modal de Detalle de Producto
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [currentProductLine, setCurrentProductLine] = useState<{
    product: Product | null;
    cantidad: number;
    descuento: number;
    precioOverride: number;
    detalle: string;
    listo: boolean;
    esDevolucion: boolean;
    devolucionId: string;
  }>({
    product: null,
    cantidad: 1,
    descuento: 0,
    precioOverride: 0,
    detalle: '',
    listo: false,
    esDevolucion: false,
    devolucionId: ''
  });
  const [quoteDiscountGlobal, setQuoteDiscountGlobal] = useState(0); // Porcentaje
  const [quoteSearchTerm, setQuoteSearchTerm] = useState('');

  // --- ESTADO: LOGÍSTICA DE ENTREGA B2B ---
  const [logisticaTipo, setLogisticaTipo] = useState<'EN_RUTA' | 'INMEDIATA' | 'RECOGEN'>('EN_RUTA');
  const [logisticaDireccion, setLogisticaDireccion] = useState('');
  const [logisticaFecha, setLogisticaFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [logisticaJornada, setLogisticaJornada] = useState<'MANANA' | 'TARDE'>('MANANA');
  const [logisticaConductorId, setLogisticaConductorId] = useState('');
  const [observacionesPedido, setObservacionesPedido] = useState('');

  // --- ESTADO: SOLICITUD DE DEVOLUCIÓN ---
  const [devClienteId, setDevClienteId] = useState('');
  const [devConductorId, setDevConductorId] = useState('');
  const [devFechaProg, setDevFechaProg] = useState(() => new Date().toISOString().split('T')[0]);
  const [devPedidoId, setDevPedidoId] = useState('');
  const [devItems, setDevItems] = useState<{ sku: string; nombre: string; cantidad: number; precio: number; motivo: string }[]>([]);
  
  const [devSelProductSku, setDevSelProductSku] = useState('');
  const [devSelProductCant, setDevSelProductCant] = useState(1);
  const [devSelProductMotivo, setDevSelProductMotivo] = useState('MAL_ESTADO');

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

    setProductForm({ sku: '', nombre: '', categoria: '', unidadMedida: 'kg', precio_compra: 0, buffer_seguridad: 5 });
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



  // Cálculos financieros cotización
  const quoteSubtotal = quoteItems.reduce((sum, item) => {
    if (item.esDevolucion) return sum;
    const unitPrice = getQuoteItemUnitPrice(item);
    return sum + (unitPrice * item.cantidad);
  }, 0);

  const quoteLineDiscountsTotal = quoteItems.reduce((sum, item) => {
    if (item.esDevolucion) return sum;
    const unitPrice = getQuoteItemUnitPrice(item);
    const lineSubtotal = unitPrice * item.cantidad;
    return sum + (lineSubtotal * ((item.descuento || 0) / 100));
  }, 0);

  const quoteDevolucionesTotal = quoteItems.reduce((sum, item) => {
    if (!item.esDevolucion) return sum;
    const unitPrice = getQuoteItemUnitPrice(item);
    return sum + (unitPrice * item.cantidad);
  }, 0);

  const quoteSubtotalAfterLineDiscounts = quoteSubtotal - quoteLineDiscountsTotal;
  const quoteGlobalDiscountValue = quoteSubtotalAfterLineDiscounts * (quoteDiscountGlobal / 100);
  const totalPrevio = quoteSubtotalAfterLineDiscounts - quoteGlobalDiscountValue - quoteDevolucionesTotal;
  const quoteTotalFinal = Math.max(0, totalPrevio);

  const handleSaveQuotation = () => {
    if (!clientName) {
      Swal.fire({ icon: 'warning', title: 'Falta Cliente', text: 'Ingrese el nombre o razón social del cliente.', confirmButtonColor: 'var(--primary-color)' });
      return;
    }
    if (quoteItems.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Sin productos', text: 'Añada al menos un producto al pedido.', confirmButtonColor: 'var(--primary-color)' });
      return;
    }

    const randomNo = 'COT-' + Math.floor(100000 + Math.random() * 900000);
    // Buscar clienteId en la base de datos — null si el cliente no está registrado
    const clienteRegistrado = clientes.find(
      c => c.identificacion === clientIdent || c.nombre === clientName.toUpperCase()
    );
    
    // Estado automático por rol
    let estadoCalculado = 'Creado';
    if (userRole === 'Administrador' || userRole === 'Jefe de Bodega') {
        estadoCalculado = 'Listo';
    } else {
        estadoCalculado = 'Creado';
    }

    const origenFinal = origenPedido === 'OTRO' ? nuevoOrigen : origenPedido;

    const newQuote = {
      id: generateId('q'),
      no: randomNo,
      clienteId: clienteRegistrado?.id || null,  // FK formal (DEF-02 corregido)
      clientName,
      clientIdent,
      clientType,
      origenPedido: origenFinal,
      facturaElectronica,
      formaPago,
      items: quoteItems.map(i => ({
        sku: i.product.sku,
        nombre: i.product.nombre,
        cantidad: i.cantidad,
        precio: getQuoteItemUnitPrice(i),
        descuento: i.descuento,
        detalle: i.detalle,
        listo: i.listo,
        esDevolucion: i.esDevolucion,
        devolucionId: i.devolucionId
      })),
      subtotal: quoteSubtotal,
      descuentos: quoteLineDiscountsTotal + quoteGlobalDiscountValue,
      total: Math.round(quoteTotalFinal),
      estado: estadoCalculado,
      observaciones: observacionesPedido,
      fecha: new Date().toLocaleDateString('es-CO'),
      vencimiento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('es-CO'),
      logistica: {
        tipoEntrega: logisticaTipo,
        direccionEntrega: logisticaTipo === 'RECOGEN' ? 'Retira en Punto de Venta' : logisticaDireccion,
        fechaEntrega: logisticaFecha,
        jornada: logisticaJornada,
        conductorId: logisticaConductorId,
        conductorNombre: conductores.find(c => c.id === logisticaConductorId)?.nombre || ''
      }
    };

    setQuotations(prev => [newQuote, ...prev]);

    publishEvent(
      'QUOTE_STATUS_CHANGED',
      userRole,
      `Nuevo pedido ${randomNo} creado en estado ${estadoCalculado} para ${clientName}`,
      { quoteId: newQuote.id, total: newQuote.total }
    );

    // Reset form wizard
    setWizardStep(1);
    setClientName('');
    setClientIdent('');
    setOrigenPedido('WHATSAPP');
    setNuevoOrigen('');
    setFacturaElectronica(false);
    setFormaPago('CREDITO');
    setQuoteItems([]);
    setQuoteDiscountGlobal(0);
    setLogisticaTipo('EN_RUTA');
    setLogisticaDireccion('');
    setLogisticaFecha(new Date().toISOString().split('T')[0]);
    setLogisticaJornada('MANANA');
    setLogisticaConductorId('');
    setObservacionesPedido('');
    setQuoteSubTab('history');

    Swal.fire({
      icon: 'success',
      title: 'Pedido Creado',
      text: `Pedido ${randomNo} registrado como ${estadoCalculado}.`,
      confirmButtonColor: 'var(--primary-color)'
    });
  };

  const handleTransitionQuote = (quoteId: string, nuevoEstado: 'Sent' | 'Approved' | 'Pausado' | 'Listo' | 'Sold' | 'Expired') => {
    if (nuevoEstado === 'Approved') {
      if (userRole !== 'admin' && userRole !== 'administrativo' && userRole !== 'vendedor') {
        Swal.fire({
          icon: 'error',
          title: 'Acceso Denegado',
          text: 'Solo roles de Super Administrador, Administrativo o Vendedor pueden aprobar cotizaciones.',
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
                // If it was prepared, we deduct the quantity_real; otherwise the quantity_solicitada
                const quoteItem = q.items.find((i: any) => i.sku === stockItem.sku);
                if (quoteItem) {
                  const cantADescontar = quoteItem.cantidad_real !== undefined ? quoteItem.cantidad_real : quoteItem.cantidad;
                  return { ...stockItem, stock: Math.max(0, stockItem.stock - cantADescontar) };
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
                      setProductForm({ sku: '', nombre: '', categoria: '', unidadMedida: 'kg', precio_compra: 0, buffer_seguridad: 5 });
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
            <button
              onClick={() => setQuoteSubTab('devoluciones')}
              className={`pos-category-tab ${quoteSubTab === 'devoluciones' ? 'active' : ''}`}
              style={{ margin: 0, padding: '8px 16px', borderRadius: '8px', fontSize: '13px' }}
            >
              Devoluciones B2B ({devoluciones.length})
            </button>
          </div>

          {quoteSubTab === 'create' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Wizard Header / Tabs */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '16px 24px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingCart size={20} color="var(--primary-color)" />
                  Nuevo Pedido B2B
                </h3>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={() => setWizardStep(1)}
                    className={`btn-secondary ${wizardStep >= 1 ? 'active' : ''}`}
                    style={{ padding: '8px 16px', borderRadius: '24px', border: wizardStep === 1 ? '2px solid var(--primary-color)' : '1px solid #E2E8F0', backgroundColor: wizardStep >= 1 ? 'var(--primary-color)' : 'white', color: wizardStep >= 1 ? 'white' : '#64748B', fontWeight: 700 }}
                  >
                    1. Datos Cliente
                  </button>
                  <button 
                    onClick={() => { if(wizardStep >= 1 && clientName) setWizardStep(2); }}
                    className={`btn-secondary ${wizardStep >= 2 ? 'active' : ''}`}
                    style={{ padding: '8px 16px', borderRadius: '24px', border: wizardStep === 2 ? '2px solid var(--primary-color)' : '1px solid #E2E8F0', backgroundColor: wizardStep >= 2 ? 'var(--primary-color)' : 'white', color: wizardStep >= 2 ? 'white' : '#64748B', fontWeight: 700, cursor: clientName ? 'pointer' : 'not-allowed' }}
                    disabled={!clientName}
                  >
                    2. Datos Envío
                  </button>
                  <button 
                    onClick={() => { if(wizardStep >= 2) setWizardStep(3); }}
                    className={`btn-secondary ${wizardStep >= 3 ? 'active' : ''}`}
                    style={{ padding: '8px 16px', borderRadius: '24px', border: wizardStep === 3 ? '2px solid var(--primary-color)' : '1px solid #E2E8F0', backgroundColor: wizardStep >= 3 ? 'var(--primary-color)' : 'white', color: wizardStep >= 3 ? 'white' : '#64748B', fontWeight: 700, cursor: clientName ? 'pointer' : 'not-allowed' }}
                    disabled={!clientName}
                  >
                    3. Datos del Pedido
                  </button>
                </div>
              </div>

              <div className="hr-table-card" style={{ padding: '24px', minHeight: '400px' }}>
                
                {/* --- PASO 1: DATOS CLIENTE --- */}
                {wizardStep === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', marginBottom: '8px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>Paso 1: Información Comercial</h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>Buscar Cliente en BD</label>
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
                              setLogisticaDireccion(selected.direccion || '');
                            } else {
                              setClientName('');
                              setClientIdent('');
                              setClientType('POS');
                              setLogisticaDireccion('');
                            }
                          }}
                        >
                          <option value="">-- Seleccionar cliente --</option>
                          {clientes.filter(c => c.activo).map(c => (
                            <option key={c.id} value={c.id}>
                              {c.nombre} ({c.identificacion}) [Tarifa: {c.tipoPrecio}]
                            </option>
                          ))}
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
                        <label className="form-label">Lista de Precios a Aplicar</label>
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
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '8px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Origen de Pedido</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <select 
                            className="form-control" 
                            value={origenPedido} 
                            onChange={e => setOrigenPedido(e.target.value)}
                            style={{ flex: 1 }}
                          >
                            {origenesDisponibles.map(origen => (
                              <option key={origen} value={origen}>{origen}</option>
                            ))}
                            <option value="OTRO">Otro (Especificar)</option>
                          </select>
                          {origenPedido === 'OTRO' && (
                            <input 
                              type="text" 
                              className="form-control" 
                              placeholder="Nuevo origen..."
                              value={nuevoOrigen}
                              onChange={e => setNuevoOrigen(e.target.value.toUpperCase())}
                              style={{ flex: 1 }}
                            />
                          )}
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Forma de Pago</label>
                        <select className="form-control" value={formaPago} onChange={e => setFormaPago(e.target.value as any)}>
                          <option value="CREDITO">Crédito (Cartera)</option>
                          <option value="CONTADO">Contado (Pago Inmediato)</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Factura Electrónica</label>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                          <button
                            onClick={() => setFacturaElectronica(true)}
                            className={`btn-secondary ${facturaElectronica ? 'active' : ''}`}
                            style={{ flex: 1, padding: '8px', borderRadius: '6px', border: facturaElectronica ? '2px solid var(--primary-color)' : '1px solid #E2E8F0', backgroundColor: facturaElectronica ? '#EFF6FF' : 'white', color: facturaElectronica ? 'var(--primary-color)' : '#64748B', fontWeight: 600 }}
                          >
                            Sí
                          </button>
                          <button
                            onClick={() => setFacturaElectronica(false)}
                            className={`btn-secondary ${!facturaElectronica ? 'active' : ''}`}
                            style={{ flex: 1, padding: '8px', borderRadius: '6px', border: !facturaElectronica ? '2px solid var(--primary-color)' : '1px solid #E2E8F0', backgroundColor: !facturaElectronica ? '#EFF6FF' : 'white', color: !facturaElectronica ? 'var(--primary-color)' : '#64748B', fontWeight: 600 }}
                          >
                            No
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- PASO 2: DATOS ENVÍO --- */}
                {wizardStep === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', marginBottom: '8px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>Paso 2: Logística de Entrega</h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Tipo de Entrega</label>
                        <select className="form-control" value={logisticaTipo} onChange={e => setLogisticaTipo(e.target.value as any)}>
                          <option value="EN_RUTA">En Ruta (Domicilio programado)</option>
                          <option value="INMEDIATA">Entrega Inmediata (Express)</option>
                          <option value="RECOGEN">Cliente Recoge en Punto de Venta</option>
                        </select>
                      </div>
                      
                      {logisticaTipo !== 'RECOGEN' && (
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Dirección de Entrega</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Dirección completa del cliente"
                            value={logisticaDireccion}
                            onChange={e => setLogisticaDireccion(e.target.value)}
                          />
                        </div>
                      )}
                      
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Fecha Programada</label>
                        <input
                          type="date"
                          className="form-control"
                          value={logisticaFecha}
                          onChange={e => setLogisticaFecha(e.target.value)}
                        />
                      </div>
                      
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Jornada</label>
                        <select className="form-control" value={logisticaJornada} onChange={e => setLogisticaJornada(e.target.value as any)}>
                          <option value="MANANA">Mañana (6:00 AM - 12:00 PM)</option>
                          <option value="TARDE">Tarde (12:00 PM - 6:00 PM)</option>
                        </select>
                      </div>
                      
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Conductor Asignado (Opcional)</label>
                        <select className="form-control" value={logisticaConductorId} onChange={e => setLogisticaConductorId(e.target.value)}>
                          <option value="">-- Sin asignar por ahora --</option>
                          {conductores.map(c => (
                            <option key={c.id} value={c.id}>{c.nombre} ({c.celular})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- PASO 3: DATOS DEL PEDIDO --- */}
                {wizardStep === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', margin: 0 }}>Paso 3: Productos y Descuentos</h4>
                      <button 
                        onClick={() => {
                          setCurrentProductLine({
                            product: null,
                            cantidad: 1,
                            descuento: 0,
                            precioOverride: 0,
                            detalle: '',
                            listo: false,
                            esDevolucion: false,
                            devolucionId: ''
                          });
                          setEditingItemIndex(null);
                          setIsProductModalOpen(true);
                        }}
                        className="btn-primary"
                        style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Plus size={16} /> Añadir Producto
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {quoteItems.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1' }}>
                          <span style={{ fontSize: '32px' }}>🛍️</span>
                          <p style={{ marginTop: '8px', fontWeight: 500 }}>Aún no hay productos en este pedido.</p>
                          <p style={{ fontSize: '13px' }}>Haz clic en "Añadir Producto" para comenzar a armar la lista.</p>
                        </div>
                      ) : (
                        <div style={{ overflowX: 'auto' }}>
                          <table className="hr-table">
                            <thead>
                              <tr>
                                <th>Estado</th>
                                <th>Producto</th>
                                <th>Cant.</th>
                                <th>Precio Unit.</th>
                                <th>Dcto.</th>
                                <th>Subtotal Línea</th>
                                <th>Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {quoteItems.map((item, index) => {
                                const unitPrice = getQuoteItemUnitPrice(item);
                                const lineTotal = unitPrice * item.cantidad * (1 - (item.descuento || 0) / 100);
                                
                                return (
                                  <tr key={`${item.product.id}-${index}`} style={{ backgroundColor: item.esDevolucion ? '#FEF2F2' : 'white' }}>
                                    <td>
                                      {item.listo ? (
                                        <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#D1FAE5', color: '#065F46', fontSize: '11px', fontWeight: 'bold' }}>LISTO</span>
                                      ) : (
                                        <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#FEF3C7', color: '#D97706', fontSize: '11px', fontWeight: 'bold' }}>PNDT</span>
                                      )}
                                      {item.esDevolucion && (
                                        <span style={{ display: 'block', marginTop: '4px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#FEE2E2', color: '#B91C1C', fontSize: '10px', fontWeight: 'bold' }}>DEVOLUCIÓN</span>
                                      )}
                                    </td>
                                    <td>
                                      <div style={{ fontWeight: 600 }}>{item.product.nombre}</div>
                                      <div style={{ fontSize: '11px', color: '#64748B' }}>SKU: {item.product.sku}</div>
                                      {item.detalle && (
                                        <div style={{ fontSize: '11px', color: '#0EA5E9', marginTop: '2px', fontStyle: 'italic' }}>Nota: {item.detalle}</div>
                                      )}
                                    </td>
                                    <td>
                                      <span style={{ fontWeight: 600 }}>{item.cantidad}</span> <span style={{ fontSize: '11px', color: '#64748B' }}>{item.product.unidadMedida || 'kg'}</span>
                                    </td>
                                    <td>${unitPrice.toLocaleString('es-CO')}</td>
                                    <td>
                                      {item.descuento > 0 ? (
                                        <span style={{ color: '#EF4444', fontWeight: 600 }}>{item.descuento}%</span>
                                      ) : '-'}
                                    </td>
                                    <td style={{ fontWeight: 700, color: item.esDevolucion ? '#B91C1C' : '#1E293B' }}>
                                      {item.esDevolucion ? '-' : ''}${Math.round(lineTotal).toLocaleString('es-CO')}
                                    </td>
                                    <td>
                                      <div style={{ display: 'flex', gap: '8px' }}>
                                        <button 
                                          onClick={() => {
                                            setEditingItemIndex(index);
                                            setCurrentProductLine({
                                              product: item.product,
                                              cantidad: item.cantidad,
                                              descuento: item.descuento || 0,
                                              precioOverride: item.precioOverride || unitPrice,
                                              detalle: item.detalle || '',
                                              listo: item.listo || false,
                                              esDevolucion: item.esDevolucion || false,
                                              devolucionId: item.devolucionId || ''
                                            });
                                            setIsProductModalOpen(true);
                                          }}
                                          style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer' }}
                                        >
                                          <Edit2 size={16} />
                                        </button>
                                        <button 
                                          onClick={() => {
                                            setQuoteItems(prev => prev.filter((_, i) => i !== index));
                                          }}
                                          style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                                        >
                                          <X size={16} />
                                        </button>
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

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', gap: '24px' }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <label className="form-label" style={{ fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Observaciones sobre el pedido</label>
                        <textarea
                          className="form-control"
                          placeholder="Instrucciones especiales, notas para entrega, etc..."
                          value={observacionesPedido}
                          onChange={e => setObservacionesPedido(e.target.value)}
                          style={{ minHeight: '120px', resize: 'vertical', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                        />
                      </div>

                      <div style={{ width: '350px', backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B' }}>
                          <span>Subtotal Venta Bruta</span>
                          <span>${Math.round(quoteSubtotal).toLocaleString('es-CO')}</span>
                        </div>
                        {quoteLineDiscountsTotal > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#EF4444' }}>
                            <span>Descuentos (por línea)</span>
                            <span>-${Math.round(quoteLineDiscountsTotal).toLocaleString('es-CO')}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 600, color: '#1E293B', borderBottom: '1px dashed #CBD5E1', paddingBottom: '8px' }}>
                          <span>Subtotal Neto Venta</span>
                          <span>${Math.round(quoteSubtotalAfterLineDiscounts).toLocaleString('es-CO')}</span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                          <span style={{ fontSize: '13px', color: '#64748B' }}>Descuento Global Adicional:</span>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            className="form-control"
                            style={{ width: '70px', padding: '4px 8px', fontSize: '12px' }}
                            value={quoteDiscountGlobal}
                            onChange={e => setQuoteDiscountGlobal(parseInt(e.target.value) || 0)}
                          />
                          <span style={{ fontSize: '12px' }}>%</span>
                        </div>
                        
                        {quoteGlobalDiscountValue > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#EF4444' }}>
                            <span>Valor Descuento Global</span>
                            <span>-${Math.round(quoteGlobalDiscountValue).toLocaleString('es-CO')}</span>
                          </div>
                        )}

                        {quoteDevolucionesTotal > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#10B981', fontWeight: 600, backgroundColor: '#D1FAE5', padding: '4px 8px', borderRadius: '4px' }}>
                            <span>Cruce Devoluciones (Saldo)</span>
                            <span>-${Math.round(quoteDevolucionesTotal).toLocaleString('es-CO')}</span>
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 800, color: 'var(--primary-color)', borderTop: '2px solid #E2E8F0', paddingTop: '12px', marginTop: '4px' }}>
                          <span>TOTAL A PAGAR</span>
                          <span>${Math.round(quoteTotalFinal).toLocaleString('es-CO')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- BOTONES DE NAVEGACIÓN --- */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
                  <button 
                    onClick={() => {
                      setWizardStep(1);
                      setClientName('');
                      setQuoteItems([]);
                      setQuoteSubTab('history');
                    }}
                    style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: 'white', color: '#64748B', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {wizardStep > 1 && (
                      <button 
                        onClick={() => setWizardStep(prev => (prev - 1) as any)}
                        style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Anterior
                      </button>
                    )}
                    
                    {wizardStep < 3 ? (
                      <button 
                        onClick={() => {
                          if (wizardStep === 1 && !clientName) {
                            Swal.fire({ icon: 'warning', title: 'Falta Cliente', text: 'Debe ingresar el nombre del cliente para continuar.', confirmButtonColor: 'var(--primary-color)' });
                            return;
                          }
                          setWizardStep(prev => (prev + 1) as any);
                        }}
                        className="btn-primary"
                        style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary-color)', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Siguiente
                      </button>
                    ) : (
                      <button 
                        onClick={handleSaveQuotation}
                        className="btn-primary"
                        style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#10B981', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <Save size={18} /> Guardar Pedido
                      </button>
                    )}
                  </div>
                </div>

              </div>

              {/* --- MODAL DETALLE DE PRODUCTO --- */}
              {isProductModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ width: '450px', backgroundColor: 'white', height: '100%', display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.3s ease-out', boxShadow: '-5px 0 15px rgba(0,0,0,0.1)' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1E293B' }}>{editingItemIndex !== null ? 'Editar Producto' : 'Añadir Producto'}</h3>
                      <button onClick={() => setIsProductModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                        <X size={24} />
                      </button>
                    </div>
                    
                    <div style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontWeight: 'bold' }}>Producto *</label>
                        {!currentProductLine.product ? (
                          <div style={{ position: 'relative' }}>
                            <Search size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Buscar por SKU o Nombre..."
                              value={quoteSearchTerm}
                              onChange={e => setQuoteSearchTerm(e.target.value)}
                              style={{ paddingLeft: '36px' }}
                            />
                            {quoteSearchTerm && (
                              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '0 0 8px 8px', maxHeight: '200px', overflowY: 'auto', zIndex: 10, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                {products.filter(p => p.activo && (p.nombre.toLowerCase().includes(quoteSearchTerm.toLowerCase()) || p.sku.toLowerCase().includes(quoteSearchTerm.toLowerCase()))).map(p => (
                                  <div 
                                    key={p.id}
                                    onClick={() => {
                                      setCurrentProductLine(prev => ({
                                        ...prev,
                                        product: p,
                                        precioOverride: getProductPriceByClientType(p)
                                      }));
                                      setQuoteSearchTerm('');
                                    }}
                                    style={{ padding: '10px 12px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                                  >
                                    <div>
                                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{p.nombre}</div>
                                      <div style={{ fontSize: '11px', color: '#64748B' }}>SKU: {p.sku} | Costo: ${p.precio_compra.toLocaleString('es-CO')}</div>
                                    </div>
                                    <div style={{ fontWeight: 700, color: 'var(--primary-color)' }}>
                                      ${getProductPriceByClientType(p).toLocaleString('es-CO')}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ padding: '12px', border: '1px solid #E2E8F0', borderRadius: '8px', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{currentProductLine.product.nombre}</div>
                              <div style={{ fontSize: '12px', color: '#64748B' }}>SKU: {currentProductLine.product.sku}</div>
                            </div>
                            <button 
                              onClick={() => setCurrentProductLine(prev => ({ ...prev, product: null }))}
                              style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #CBD5E1', backgroundColor: 'white', cursor: 'pointer' }}
                            >
                              Cambiar
                            </button>
                          </div>
                        )}
                      </div>

                      {currentProductLine.product && (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label">Cantidad ({currentProductLine.product.unidadMedida || 'kg'}) *</label>
                              <input
                                type="number"
                                min="0.1"
                                step="0.1"
                                className="form-control"
                                value={currentProductLine.cantidad}
                                onChange={e => setCurrentProductLine(prev => ({ ...prev, cantidad: parseFloat(e.target.value) || 1 }))}
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label">Precio Venta (Unit)</label>
                              <input
                                type="number"
                                className="form-control"
                                value={currentProductLine.precioOverride}
                                onChange={e => setCurrentProductLine(prev => ({ ...prev, precioOverride: parseInt(e.target.value) || 0 }))}
                              />
                            </div>
                          </div>

                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Detalle / Observación</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Ej. Sin cabeza, fileteado..."
                              value={currentProductLine.detalle}
                              onChange={e => setCurrentProductLine(prev => ({ ...prev, detalle: e.target.value }))}
                            />
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Descuento (%)</span>
                                <span style={{ color: '#EF4444', fontWeight: 'bold' }}>{currentProductLine.descuento}%</span>
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                className="form-control"
                                value={currentProductLine.descuento}
                                onChange={e => setCurrentProductLine(prev => ({ ...prev, descuento: parseInt(e.target.value) || 0 }))}
                              />
                            </div>
                            
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label">Estado Preparación</label>
                              <button
                                onClick={() => setCurrentProductLine(prev => ({ ...prev, listo: !prev.listo }))}
                                style={{
                                  width: '100%',
                                  padding: '10px',
                                  borderRadius: '8px',
                                  border: currentProductLine.listo ? '2px solid #10B981' : '1px solid #CBD5E1',
                                  backgroundColor: currentProductLine.listo ? '#D1FAE5' : 'white',
                                  color: currentProductLine.listo ? '#065F46' : '#64748B',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '8px'
                                }}
                              >
                                {currentProductLine.listo ? <><Check size={16}/> Listo</> : 'Pendiente'}
                              </button>
                            </div>
                          </div>

                          <div className="form-group" style={{ marginBottom: 0, padding: '16px', backgroundColor: currentProductLine.esDevolucion ? '#FEF2F2' : '#F1F5F9', borderRadius: '8px', border: currentProductLine.esDevolucion ? '1px dashed #EF4444' : '1px dashed #CBD5E1' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <label className="form-label" style={{ margin: 0, fontWeight: 'bold', color: currentProductLine.esDevolucion ? '#B91C1C' : '#475569' }}>¿Es Devolución?</label>
                                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#64748B' }}>Marca si esta línea cruza un saldo a favor de devolución.</p>
                              </div>
                              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                <input 
                                  type="checkbox" 
                                  checked={currentProductLine.esDevolucion}
                                  onChange={e => setCurrentProductLine(prev => ({ ...prev, esDevolucion: e.target.checked, descuento: e.target.checked ? 0 : prev.descuento }))}
                                  style={{ width: '20px', height: '20px', accentColor: '#EF4444' }}
                                />
                              </label>
                            </div>
                          </div>

                          <div style={{ marginTop: 'auto', padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '18px', fontWeight: 800, color: 'var(--primary-color)' }}>
                              <span>Total Línea:</span>
                              <span>${Math.round(currentProductLine.cantidad * currentProductLine.precioOverride * (1 - currentProductLine.descuento / 100)).toLocaleString('es-CO')}</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div style={{ padding: '20px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '12px' }}>
                      <button 
                        onClick={() => setIsProductModalOpen(false)}
                        style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: 'white', color: '#64748B', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={() => {
                          if (!currentProductLine.product) {
                            Swal.fire({ icon: 'warning', title: 'Producto Requerido', text: 'Debe seleccionar un producto.', confirmButtonColor: 'var(--primary-color)' });
                            return;
                          }
                          
                          setQuoteItems(prev => {
                            const newItems = [...prev];
                            const itemToSave = {
                              product: currentProductLine.product!,
                              cantidad: currentProductLine.cantidad,
                              descuento: currentProductLine.descuento,
                              precioOverride: currentProductLine.precioOverride,
                              detalle: currentProductLine.detalle,
                              listo: currentProductLine.listo,
                              esDevolucion: currentProductLine.esDevolucion,
                              devolucionId: currentProductLine.devolucionId
                            };

                            if (editingItemIndex !== null) {
                              newItems[editingItemIndex] = itemToSave;
                            } else {
                              newItems.push(itemToSave);
                            }
                            return newItems;
                          });
                          setIsProductModalOpen(false);
                        }}
                        className="btn-primary"
                        style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary-color)', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                      >
                        {editingItemIndex !== null ? 'Actualizar' : 'Añadir a Pedido'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : quoteSubTab === 'history' ? (
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
          ) : (
            /* --- DEVOLUCIONES B2B --- */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px' }}>
                
                {/* Formulario Nueva Devolución */}
                <div className="hr-table-card" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px' }}>Programar Nueva Devolución</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Cliente B2B *</label>
                      <select
                        className="form-control"
                        value={devClienteId}
                        onChange={e => {
                          setDevClienteId(e.target.value);
                          setDevPedidoId('');
                          setDevItems([]);
                        }}
                      >
                        <option value="">Seleccione un cliente...</option>
                        {clientes.filter(c => c.tipoPrecio === 'MAYORISTA' || c.tipoPrecio === 'RESTAURANTE').map(c => (
                          <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Asociar a Pedido / Factura (Opcional)</label>
                      <select
                        className="form-control"
                        value={devPedidoId}
                        onChange={e => {
                          const pId = e.target.value;
                          setDevPedidoId(pId);
                          // Auto-fill items from this quote if selected
                          const q = quotations.find(qt => qt.id === pId);
                          if (q && q.items) {
                            setDevItems(q.items.map((i: any) => ({
                              sku: i.sku,
                              nombre: i.nombre,
                              cantidad: i.cantidad,
                              precio: i.precio,
                              motivo: 'MAL_ESTADO'
                            })));
                          } else {
                            setDevItems([]);
                          }
                        }}
                        disabled={!devClienteId}
                      >
                        <option value="">Seleccione un pedido...</option>
                        {quotations
                          .filter(q => q.clienteId === devClienteId && (q.estado === 'Sold' || q.estado === 'Listo' || q.estado === 'FACTURADO'))
                          .map(q => (
                            <option key={q.id} value={q.id}>{q.no} ({q.fecha} - ${q.total.toLocaleString('es-CO')})</option>
                          ))
                        }
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Conductor Asignado para Recogida *</label>
                      <select
                        className="form-control"
                        value={devConductorId}
                        onChange={e => setDevConductorId(e.target.value)}
                      >
                        <option value="">Seleccione un conductor...</option>
                        {conductores.map(c => (
                          <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Fecha de Recogida Programada</label>
                      <input
                        type="date"
                        className="form-control"
                        value={devFechaProg}
                        onChange={e => setDevFechaProg(e.target.value)}
                      />
                    </div>

                    {/* Agregar productos individualmente si no se asocia pedido */}
                    {!devPedidoId && (
                      <div style={{ border: '1px solid #E2E8F0', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Agregar Producto Individual</span>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <select
                            className="form-control"
                            value={devSelProductSku}
                            onChange={e => setDevSelProductSku(e.target.value)}
                          >
                            <option value="">Seleccione producto...</option>
                            {products.map(p => (
                              <option key={p.id} value={p.sku}>{p.nombre} ({p.sku})</option>
                            ))}
                          </select>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                            <input
                              type="number"
                              className="form-control"
                              placeholder="Cant (kg)"
                              value={devSelProductCant}
                              onChange={e => setDevSelProductCant(parseFloat(e.target.value) || 1)}
                            />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0, flex: 1.5 }}>
                            <select
                              className="form-control"
                              value={devSelProductMotivo}
                              onChange={e => setDevSelProductMotivo(e.target.value)}
                            >
                              <option value="MAL_ESTADO">Mal Estado / Caducado</option>
                              <option value="CAMBIO">Cambio / Devolución Comercial</option>
                              <option value="EXCESO_PEDIDO">Exceso en Pedido</option>
                            </select>
                          </div>
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ border: 'none', backgroundColor: 'var(--primary-color)', color: 'white', padding: '8px 12px', borderRadius: '8px' }}
                            onClick={() => {
                              const prod = products.find(p => p.sku === devSelProductSku);
                              if (!prod) {
                                Swal.fire({ icon: 'warning', title: 'Seleccione Producto', text: 'Por favor seleccione un producto del catálogo.', confirmButtonColor: 'var(--primary-color)' });
                                return;
                              }
                              if (devItems.some(i => i.sku === devSelProductSku)) {
                                Swal.fire({ icon: 'warning', title: 'Producto duplicado', text: 'El producto ya está en la lista de devolución.', confirmButtonColor: 'var(--primary-color)' });
                                return;
                              }
                              // Get unit price based on client type
                              const cli = clientes.find(c => c.id === devClienteId);
                              const cliType = cli?.tipoPrecio || 'POS';
                              let price = prod.precio_venta_pos;
                              if (cliType === 'RESTAURANTE') price = prod.precio_venta_restaurante;
                              else if (cliType === 'MAYORISTA') price = prod.precio_venta_mayorista;

                              setDevItems(prev => [...prev, {
                                sku: prod.sku,
                                nombre: prod.nombre,
                                cantidad: devSelProductCant,
                                precio: price,
                                motivo: devSelProductMotivo
                              }]);
                              setDevSelProductSku('');
                              setDevSelProductCant(1);
                            }}
                            disabled={!devClienteId}
                          >
                            Agregar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Detalle Devolución */}
                    <div style={{ marginTop: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '8px' }}>Ítems a Recoger</span>
                      {devItems.length === 0 ? (
                        <div style={{ padding: '12px', border: '1px dashed #CBD5E1', borderRadius: '8px', textAlign: 'center', fontSize: '11px', color: '#64748B' }}>
                          No hay ítems para devolución
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                          {devItems.map((item, index) => (
                            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '11px' }}>
                              <div>
                                <span style={{ fontWeight: 700 }}>{item.nombre}</span> ({item.sku})<br />
                                <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>Cant: {item.cantidad} kg</span> | Motivo: {item.motivo}
                              </div>
                              <button
                                type="button"
                                style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                                onClick={() => setDevItems(prev => prev.filter((_, idx) => idx !== index))}
                                disabled={!!devPedidoId}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      className="btn-primary"
                      style={{ border: 'none', backgroundColor: 'var(--primary-color)', color: 'white', padding: '12px', borderRadius: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '12px' }}
                      onClick={() => {
                        if (!devClienteId || !devConductorId || devItems.length === 0) {
                          Swal.fire({ icon: 'warning', title: 'Campos incompletos', text: 'Por favor complete todos los campos requeridos (Cliente, Conductor y al menos un producto).', confirmButtonColor: 'var(--primary-color)' });
                          return;
                        }
                        const cli = clientes.find(c => c.id === devClienteId);
                        const cond = conductores.find(c => c.id === devConductorId);
                        const newDev: DevolucionPedido = {
                          id: generateId('dev'),
                          pedidoId: devPedidoId || '',
                          pedidoNo: quotations.find(q => q.id === devPedidoId)?.no || 'S/O',
                          clienteId: devClienteId,
                          clienteNombre: cli?.nombre || '',
                          conductorId: devConductorId,
                          conductorNombre: cond?.nombre || '',
                          estado: 'PROGRAMADA',
                          fechaProgramacion: devFechaProg,
                          items: devItems.map(i => ({
                            sku: i.sku,
                            nombre: i.nombre,
                            cantidadSolicitada: i.cantidad,
                            precioUnitarioVenta: i.precio,
                            motivo: i.motivo
                          }))
                        };

                        if (setDevoluciones) {
                          setDevoluciones(prev => [newDev, ...prev]);
                        }
                        publishEvent(
                          'QUOTE_STATUS_CHANGED',
                          userRole,
                          `Solicitud de devolución programada para cliente ${newDev.clienteNombre} asignada a conductor ${newDev.conductorNombre}`
                        );

                        // Reset
                        setDevClienteId('');
                        setDevPedidoId('');
                        setDevConductorId('');
                        setDevItems([]);

                        Swal.fire({
                          icon: 'success',
                          title: 'Devolución Programada',
                          text: 'La orden de recogida ha sido registrada y notificada al conductor.',
                          confirmButtonColor: 'var(--primary-color)'
                        });
                      }}
                    >
                      Programar Recogida
                    </button>

                  </div>
                </div>

                {/* Listado de Devoluciones Programadas */}
                <div className="hr-table-card" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px' }}>Estado de Devoluciones B2B</h3>
                  {devoluciones.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#64748B', gap: '8px' }}>
                      <span style={{ fontSize: '32px' }}>🔄</span>
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>No hay devoluciones programadas</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '550px', overflowY: 'auto' }}>
                      {devoluciones.map(dev => {
                        const totalEstimado = dev.items.reduce((sum, i) => sum + (i.precioUnitarioVenta * i.cantidadSolicitada), 0);
                        return (
                          <div key={dev.id} style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B' }}>{dev.clienteNombre}</span>
                              <span style={{
                                fontSize: '11px',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontWeight: 700,
                                backgroundColor: dev.estado === 'PROGRAMADA' ? '#FEF3C7' : dev.estado === 'RECIBIDA_BODEGA' ? '#DBEAFE' : dev.estado === 'VALIDADA_FINANZAS' ? '#D1FAE5' : '#F1F5F9',
                                color: dev.estado === 'PROGRAMADA' ? '#D97706' : dev.estado === 'RECIBIDA_BODEGA' ? '#2563EB' : dev.estado === 'VALIDADA_FINANZAS' ? '#059669' : '#475569'
                              }}>
                                {dev.estado}
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748B', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                              <span><strong>Pedido:</strong> {dev.pedidoNo}</span>
                              <span><strong>Fecha Prog:</strong> {dev.fechaProgramacion}</span>
                              <span style={{ gridColumn: 'span 2' }}><strong>Conductor:</strong> {dev.conductorNombre}</span>
                            </div>
                            
                            {/* Items preview */}
                            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '8px', marginTop: '4px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Productos:</span>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
                                {dev.items.map((it, idx) => (
                                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569' }}>
                                    <span>{it.nombre}</span>
                                    <span>{it.cantidadRecibida !== undefined ? `${it.cantidadRecibida} / ${it.cantidadSolicitada}` : it.cantidadSolicitada} kg</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '8px', marginTop: '4px' }}>
                              <span style={{ fontSize: '11px', color: '#64748B' }}>Total Estimado:</span>
                              <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary-color)' }}>${totalEstimado.toLocaleString('es-CO')}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
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
