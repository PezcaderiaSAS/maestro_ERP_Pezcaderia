import { useState, useEffect, useMemo, useCallback } from 'react';
import { generateId } from '../lib/utils';
import { useInventoryStore } from '../store/useInventoryStore.ts';
import { useOrderStore } from '../store/useOrderStore.ts';
import { useEventStore } from '../store/useEventStore.ts';
import { useAppStore } from '../store/useAppStore.ts';
import { useClientStore } from '../store/useClientStore.ts';
import { useDriverStore } from '../store/useDriverStore.ts';
import { useReturnStore } from '../store/useReturnStore.ts';
import type { ProductPricing } from '../types/erp.types';

export function usePricing() {
  const {
    products,
    setProducts,
    setProductsCatalog,
    productPricings,
    setProductPricings,
    setStock,
  } = useInventoryStore();

  const { quotations, setQuotations } = useOrderStore();
  const publishEvent = useEventStore((s) => s.publishEvent);
  const userRole = useAppStore((s) => s.userRole);
  const { clientes, lastClientPrices, loadLastClientPrices, updateLastClientPrice } = useClientStore();
  const conductores = useDriverStore((s) => s.conductores);
  const { devoluciones, setDevoluciones } = useReturnStore();

  // Carga de precios históricos al montar
  useEffect(() => {
    loadLastClientPrices();
  }, [loadLastClientPrices]);

  // --- ESTADO GENERAL ---
  const [activeTab, setActiveTab] = useState<'catalog' | 'pricing' | 'quotes'>('quotes');
  const [quoteSubTab, setQuoteSubTab] = useState<'create' | 'history' | 'devoluciones'>('create');
  const [selectedQuoteForPrint, setSelectedQuoteForPrint] = useState<any>(null);

  // --- ESTADO PESTAÑA CATALOGO (CRUD) ---
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

  // --- ESTADO PESTAÑA PRECIOS ---
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [priceForm, setPriceForm] = useState({
    precio_compra: 0,
    buffer_seguridad: 0,
    precio_venta_pos: 0,
    precio_venta_restaurante: 0,
    precio_venta_mayorista: 0,
  });
  const [selectedProductHistory, setSelectedProductHistory] = useState<string | null>(null);

  // --- ESTADO COTIZACIONES ---
  const [clientType, setClientType] = useState<'POS' | 'RESTAURANTE' | 'MAYORISTA'>('POS');
  const [clientName, setClientName] = useState('');
  const [clientIdent, setClientIdent] = useState('');
  const [quoteItems, setQuoteItems] = useState<{
    product: any;
    cantidad: number;
    descuento: number;
    precioOverride?: number;
    detalle?: string;
    listo?: boolean;
    esDevolucion?: boolean;
    devolucionId?: string;
  }[]>([]);

  // Wizard
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [origenPedido, setOrigenPedido] = useState('WHATSAPP');
  const [origenesDisponibles] = useState(['VISITA', 'LLAMADA', 'WHATSAPP']);
  const [nuevoOrigen, setNuevoOrigen] = useState('');
  const [facturaElectronica, setFacturaElectronica] = useState(false);
  const [formaPago, setFormaPago] = useState<'CREDITO' | 'CONTADO'>('CREDITO');

  // Modal de Detalle de Línea de Producto
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [currentProductLine, setCurrentProductLine] = useState<{
    product: any | null;
    cantidad: number | string;
    descuento: number | string;
    precioOverride: number | string;
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
    devolucionId: '',
  });

  const [quoteDiscountGlobal, setQuoteDiscountGlobal] = useState(0);
  const [quoteSearchTerm, setQuoteSearchTerm] = useState('');
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);

  // Logística de entrega
  const [logisticaTipo, setLogisticaTipo] = useState<'EN_RUTA' | 'INMEDIATA' | 'RECOGEN'>('EN_RUTA');
  const [logisticaDireccion, setLogisticaDireccion] = useState('');
  const [logisticaFecha, setLogisticaFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [logisticaJornada, setLogisticaJornada] = useState<'MANANA' | 'TARDE'>('MANANA');
  const [logisticaConductorId, setLogisticaConductorId] = useState('');
  const [observacionesPedido, setObservacionesPedido] = useState('');

  // Solicitud de devolución
  const [devClienteId, setDevClienteId] = useState('');
  const [devConductorId, setDevConductorId] = useState('');
  const [devFechaProg, setDevFechaProg] = useState(() => new Date().toISOString().split('T')[0]);
  const [devPedidoId, setDevPedidoId] = useState('');
  const [devItems, setDevItems] = useState<{ sku: string; nombre: string; cantidad: number; precio: number; motivo: string }[]>([]);
  const [devSelProductSku, setDevSelProductSku] = useState('');
  const [devSelProductCant, setDevSelProductCant] = useState<number | string>(1);
  const [devSelProductMotivo, setDevSelProductMotivo] = useState('MAL_ESTADO');

  // Categorías
  const categoriasUnicas = useMemo(() => {
    return ['TODAS', ...Array.from(new Set(products.map((p) => p.categoria)))];
  }, [products]);

  // Manejadores catálogo
  const handleSaveProduct = useCallback(
    (e: React.FormEvent, callbacks: { onSuccess: (msg: string) => void; onWarn: (title: string, text: string) => void }) => {
      e.preventDefault();
      if (!productForm.sku || !productForm.nombre || !productForm.categoria) {
        callbacks.onWarn('Campos incompletos', 'Por favor complete todos los campos obligatorios.');
        return;
      }

      if (editingProductId) {
        setProducts((prev: any[]) =>
          prev.map((p: any) => {
            if (p.id === editingProductId) {
              const compra = productForm.precio_compra;
              const buffer = productForm.buffer_seguridad;
              const sugPos = Math.round(compra * (1 + buffer / 100 + 0.4));
              const sugRest = Math.round(compra * (1 + buffer / 100 + 0.3));
              const sugMay = Math.round(compra * (1 + buffer / 100 + 0.15));

              return {
                ...p,
                sku: productForm.sku.toUpperCase(),
                nombre: productForm.nombre.toUpperCase(),
                categoria: productForm.categoria.toUpperCase(),
                precio_compra: compra,
                buffer_seguridad: buffer,
                precio_venta_pos: p.precio_compra === compra && p.buffer_seguridad === buffer ? p.precio_venta_pos : sugPos,
                precio_venta_restaurante:
                  p.precio_compra === compra && p.buffer_seguridad === buffer ? p.precio_venta_restaurante : sugRest,
                precio_venta_mayorista:
                  p.precio_compra === compra && p.buffer_seguridad === buffer ? p.precio_venta_mayorista : sugMay,
              };
            }
            return p;
          })
        );
        setEditingProductId(null);
        callbacks.onSuccess('Producto actualizado exitosamente.');
      } else {
        const skuExists = products.some((p) => p.sku.toUpperCase() === productForm.sku.toUpperCase());
        if (skuExists) {
          callbacks.onWarn('SKU duplicado', 'Ya existe un producto con el SKU digitado.');
          return;
        }

        const compra = productForm.precio_compra;
        const buffer = productForm.buffer_seguridad;
        const sugPos = Math.round(compra * (1 + buffer / 100 + 0.4));
        const sugRest = Math.round(compra * (1 + buffer / 100 + 0.3));
        const sugMay = Math.round(compra * (1 + buffer / 100 + 0.15));

        const nuevoProd: any = {
          id: `p-${Date.now()}`,
          sku: productForm.sku.toUpperCase(),
          nombre: productForm.nombre.toUpperCase(),
          categoria: productForm.categoria.toUpperCase(),
          precio_compra: compra,
          buffer_seguridad: buffer,
          precio_venta_pos: sugPos,
          precio_venta_restaurante: sugRest,
          precio_venta_mayorista: sugMay,
          activo: true,
        };

        setProducts((prev: any[]) => [...prev, nuevoProd]);
        callbacks.onSuccess('Producto creado con éxito.');
      }

      setProductForm({ sku: '', nombre: '', categoria: '', unidadMedida: 'kg', precio_compra: 0, buffer_seguridad: 5 });
    },
    [productForm, editingProductId, products, setProducts]
  );

  const handleEditProduct = useCallback((prod: any) => {
    setEditingProductId(prod.id);
    setProductForm({
      sku: prod.sku,
      nombre: prod.nombre,
      categoria: prod.categoria,
      unidadMedida: prod.unidadMedida || 'kg',
      precio_compra: prod.precio_compra,
      buffer_seguridad: prod.buffer_seguridad,
    });
  }, []);

  const handleToggleStatus = useCallback(
    (id: string) => {
      setProductsCatalog((prev: any[]) => prev.map((p: any) => (p.id === id ? { ...p, activo: !p.activo } : p)));
    },
    [setProductsCatalog]
  );

  // Manejadores precios
  const handleStartEditPrice = useCallback((prod: any) => {
    setEditingPriceId(prod.id);
    setPriceForm({
      precio_compra: prod.precio_compra,
      buffer_seguridad: prod.buffer_seguridad,
      precio_venta_pos: prod.precio_venta_pos,
      precio_venta_restaurante: prod.precio_venta_restaurante,
      precio_venta_mayorista: prod.precio_venta_mayorista,
    });
  }, []);

  const handleSavePrices = useCallback(
    (prodId: string, callbacks: { onSuccess: () => void }) => {
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
          actualizadoPor: userRole,
        };
        setProductPricings((prev: any[]) => [...prev, newPricing]);
        publishEvent('PRICE_CHANGED', userRole, `Actualización de precios para el producto ${prodId}`);
      }

      setEditingPriceId(null);
      callbacks.onSuccess();
    },
    [priceForm, userRole, setProductPricings, publishEvent]
  );

  const getProductPriceByClientType = useCallback(
    (prod: any) => {
      switch (clientType) {
        case 'RESTAURANTE':
          return prod.precio_venta_restaurante;
        case 'MAYORISTA':
          return prod.precio_venta_mayorista;
        default:
          return prod.precio_venta_pos;
      }
    },
    [clientType]
  );

  const getQuoteItemUnitPrice = useCallback(
    (item: any) => {
      return item.precioOverride !== undefined ? item.precioOverride : getProductPriceByClientType(item.product);
    },
    [getProductPriceByClientType]
  );

  // Cálculos financieros
  const quoteSubtotal = useMemo(() => {
    return quoteItems.reduce((sum, item) => {
      if (item.esDevolucion) return sum;
      const unitPrice = getQuoteItemUnitPrice(item);
      return sum + unitPrice * item.cantidad;
    }, 0);
  }, [quoteItems, getQuoteItemUnitPrice]);

  const quoteLineDiscountsTotal = useMemo(() => {
    return quoteItems.reduce((sum, item) => {
      if (item.esDevolucion) return sum;
      const unitPrice = getQuoteItemUnitPrice(item);
      const lineSubtotal = unitPrice * item.cantidad;
      return sum + lineSubtotal * ((item.descuento || 0) / 100);
    }, 0);
  }, [quoteItems, getQuoteItemUnitPrice]);

  const quoteDevolucionesTotal = useMemo(() => {
    return quoteItems.reduce((sum, item) => {
      if (!item.esDevolucion) return sum;
      const unitPrice = getQuoteItemUnitPrice(item);
      return sum + unitPrice * item.cantidad;
    }, 0);
  }, [quoteItems, getQuoteItemUnitPrice]);

  const quoteSubtotalAfterLineDiscounts = useMemo(() => {
    return quoteSubtotal - quoteLineDiscountsTotal;
  }, [quoteSubtotal, quoteLineDiscountsTotal]);

  const quoteGlobalDiscountValue = useMemo(() => {
    return quoteSubtotalAfterLineDiscounts * (quoteDiscountGlobal / 100);
  }, [quoteSubtotalAfterLineDiscounts, quoteDiscountGlobal]);

  const totalPrevio = useMemo(() => {
    return quoteSubtotalAfterLineDiscounts - quoteGlobalDiscountValue - quoteDevolucionesTotal;
  }, [quoteSubtotalAfterLineDiscounts, quoteGlobalDiscountValue, quoteDevolucionesTotal]);

  const quoteTotalFinal = useMemo(() => {
    return Math.max(0, totalPrevio);
  }, [totalPrevio]);

  // Guardar cotización
  const handleSaveQuotation = useCallback(
    (callbacks: { onSuccess: (isEdit: boolean, no: string, estado: string) => void; onWarn: (title: string, text: string) => void }) => {
      if (!clientName) {
        callbacks.onWarn('Falta Cliente', 'Ingrese el nombre o razón social del cliente.');
        return;
      }
      if (quoteItems.length === 0) {
        callbacks.onWarn('Sin productos', 'Añada al menos un producto al pedido.');
        return;
      }

      const randomNo = 'COT-' + Math.floor(100000 + Math.random() * 900000);
      const clienteRegistrado = clientes.find(
        (c) => c.identificacion === clientIdent || c.nombre === clientName.toUpperCase()
      );

      let estadoCalculado = 'Creado';
      const normalizedRole = (userRole || '').trim().toLowerCase();
      if (normalizedRole === 'admin' || normalizedRole === 'bodega') {
        estadoCalculado = 'Listo';
      }

      const origenFinal = origenPedido === 'OTRO' ? nuevoOrigen : origenPedido;

      if (editingQuoteId) {
        setQuotations((prev: any[]) =>
          prev.map((q: any) => {
            if (q.id === editingQuoteId) {
              publishEvent('QUOTE_STATUS_CHANGED', userRole, `Pedido ${q.no} editado y actualizado por ${userRole}`, {
                quoteId: q.id,
                total: Math.round(quoteTotalFinal),
              });
              return {
                ...q,
                clienteId: clienteRegistrado?.id || null,
                clientName,
                clientIdent,
                clientType,
                origenPedido: origenFinal,
                facturaElectronica,
                formaPago,
                descuentoGlobal: quoteDiscountGlobal,
                items: quoteItems.map((i) => ({
                  sku: i.product.sku,
                  nombre: i.product.nombre,
                  cantidad: i.cantidad,
                  precio: getQuoteItemUnitPrice(i),
                  descuento: i.descuento,
                  detalle: i.detalle || '',
                  listo: i.listo || false,
                  esDevolucion: i.esDevolucion || false,
                  devolucionId: i.devolucionId || '',
                  cantidad_real: (q.items.find((x: any) => x.sku === i.product.sku) as any)?.cantidad_real,
                })),
                subtotal: quoteSubtotal,
                descuentos: quoteLineDiscountsTotal + quoteGlobalDiscountValue,
                total: Math.round(quoteTotalFinal),
                observaciones: observacionesPedido,
                logistica: {
                  tipoEntrega: logisticaTipo,
                  direccionEntrega: logisticaTipo === 'RECOGEN' ? 'Retira en Punto de Venta' : logisticaDireccion,
                  fechaEntrega: logisticaFecha,
                  jornada: logisticaJornada,
                  conductorId: logisticaConductorId,
                  conductorNombre: conductores.find((c) => c.id === logisticaConductorId)?.nombre || '',
                },
              };
            }
            return q;
          })
        );
        const finalId = editingQuoteId;
        setEditingQuoteId(null);
        callbacks.onSuccess(true, finalId, estadoCalculado);
      } else {
        const newQuote = {
          id: generateId('q'),
          no: randomNo,
          clienteId: clienteRegistrado?.id || null,
          clientName,
          clientIdent,
          clientType,
          origenPedido: origenFinal,
          facturaElectronica,
          formaPago,
          descuentoGlobal: quoteDiscountGlobal,
          items: quoteItems.map((i) => ({
            sku: i.product.sku,
            nombre: i.product.nombre,
            cantidad: i.cantidad,
            precio: getQuoteItemUnitPrice(i),
            descuento: i.descuento,
            detalle: i.detalle || '',
            listo: i.listo || false,
            esDevolucion: i.esDevolucion || false,
            devolucionId: i.devolucionId || '',
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
            conductorNombre: conductores.find((c) => c.id === logisticaConductorId)?.nombre || '',
          },
        };

        setQuotations((prev: any[]) => [newQuote, ...prev]);

        publishEvent(
          'QUOTE_STATUS_CHANGED',
          userRole,
          `Nuevo pedido ${randomNo} creado en estado ${estadoCalculado} para ${clientName}`,
          { quoteId: newQuote.id, total: newQuote.total }
        );
        callbacks.onSuccess(false, randomNo, estadoCalculado);
      }

      // Reset
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
    },
    [
      clientName,
      quoteItems,
      clientes,
      clientIdent,
      userRole,
      origenPedido,
      nuevoOrigen,
      editingQuoteId,
      quoteTotalFinal,
      facturaElectronica,
      formaPago,
      quoteDiscountGlobal,
      quoteSubtotal,
      quoteLineDiscountsTotal,
      quoteGlobalDiscountValue,
      observacionesPedido,
      logisticaTipo,
      logisticaDireccion,
      logisticaFecha,
      logisticaJornada,
      logisticaConductorId,
      conductores,
      publishEvent,
      setQuotations,
      getQuoteItemUnitPrice,
    ]
  );

  const handleEditQuote = useCallback(
    (quote: any, callbacks: { onWarn: (title: string, text: string) => void }) => {
      if (quote.estado === 'Sold' || quote.estado === 'Facturado') {
        callbacks.onWarn('Acceso Denegado', 'No se puede editar un pedido que ya ha sido facturado o vendido.');
        return;
      }

      setEditingQuoteId(quote.id);
      setClientName(quote.clientName || '');
      setClientIdent(quote.clientIdent || '');
      setClientType(quote.clientType || 'POS');
      setOrigenPedido(quote.origenPedido || 'WHATSAPP');
      setFacturaElectronica(quote.facturaElectronica || false);
      setFormaPago(quote.formaPago || 'CREDITO');
      setQuoteDiscountGlobal(quote.descuentoGlobal || 0);

      setLogisticaTipo(quote.logistica?.tipoEntrega || 'EN_RUTA');
      setLogisticaDireccion(quote.logistica?.direccionEntrega || '');
      setLogisticaFecha(quote.logistica?.fechaEntrega || new Date().toISOString().split('T')[0]);
      setLogisticaJornada(quote.logistica?.jornada || 'MANANA');
      setLogisticaConductorId(quote.logistica?.conductorId || '');
      setObservacionesPedido(quote.observaciones || '');

      const loadedItems = (quote.items || []).map((item: any) => {
        const prod = products.find((p) => p.sku === item.sku);
        return {
          product: prod || {
            id: item.sku,
            sku: item.sku,
            nombre: item.nombre,
            precio_base: item.precio,
            precio_venta_pos: item.precio,
            precio_venta_restaurante: item.precio,
            precio_venta_mayorista: item.precio,
            categoria: 'Otros',
            activo: true,
            buffer_seguridad: 0,
            imagen: '',
          },
          cantidad: item.cantidad,
          descuento: item.descuento || 0,
          precioOverride: item.precio,
          detalle: item.detalle || '',
          listo: item.listo || false,
          esDevolucion: item.esDevolucion || false,
          devolucionId: item.devolucionId || '',
        };
      });

      setQuoteItems(loadedItems);
      setWizardStep(1);
      setQuoteSubTab('create');
    },
    [products]
  );

  const handleTransitionQuote = useCallback(
    (
      quoteId: string,
      nuevoEstado: 'Sent' | 'Approved' | 'Pausado' | 'Listo' | 'Sold' | 'Expired',
      callbacks: { onSuccess: (estado: string) => void; onWarn: (title: string, text: string) => void }
    ) => {
      const role = (userRole || '').trim().toLowerCase();

      if (nuevoEstado === 'Approved') {
        if (role !== 'admin' && role !== 'administrativo' && role !== 'vendedor') {
          callbacks.onWarn('Acceso Denegado', 'Solo los roles de Super Administrador, Administrativo o Vendedor pueden aprobar pedidos.');
          return;
        }
      }

      if (nuevoEstado === 'Sold') {
        if (role !== 'admin' && role !== 'administrativo' && role !== 'vendedor') {
          callbacks.onWarn('Acceso Denegado', 'Solo los roles de Super Administrador, Administrativo o Vendedor pueden facturar y completar ventas.');
          return;
        }
      }

      if (nuevoEstado === 'Listo' || nuevoEstado === 'Pausado') {
        if (role !== 'admin' && role !== 'bodega' && role !== 'administrativo') {
          callbacks.onWarn('Acceso Denegado', 'Solo los roles de Super Administrador, Bodega o Administrativo pueden gestionar el alistamiento de pedidos.');
          return;
        }
      }

      if (nuevoEstado === 'Sent' || nuevoEstado === 'Expired') {
        if (role !== 'admin' && role !== 'vendedor' && role !== 'administrativo') {
          callbacks.onWarn('Acceso Denegado', 'Solo los roles de Super Administrador, Vendedor o Administrativo pueden modificar la vigencia y envío del pedido.');
          return;
        }
      }

      setQuotations((prev: any[]) =>
        prev.map((q: any) => {
          if (q.id === quoteId) {
            publishEvent('QUOTE_STATUS_CHANGED', userRole, `Cotización ${q.no} cambió de estado ${q.estado} a ${nuevoEstado}`, {
              quoteId,
              oldEstado: q.estado,
              nuevoEstado,
            });

            if (nuevoEstado === 'Sold') {
              setStock((prevStock: any) => {
                const newStock = { ...prevStock };
                const mainBodega = 'Bodega Principal';
                if (newStock[mainBodega]) {
                  newStock[mainBodega] = { ...newStock[mainBodega] };
                  q.items.forEach((quoteItem: any) => {
                    const sku = quoteItem.sku;
                    if (newStock[mainBodega][sku] !== undefined) {
                      const cantADescontar =
                        quoteItem.cantidad_real !== undefined ? quoteItem.cantidad_real : quoteItem.cantidad;
                      newStock[mainBodega][sku] = Math.max(0, newStock[mainBodega][sku] - cantADescontar);
                    }
                  });
                }
                return newStock;
              });

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
        })
      );

      callbacks.onSuccess(nuevoEstado);
    },
    [userRole, setQuotations, publishEvent, setStock, updateLastClientPrice]
  );

  // Manejadores de línea de producto
  const saveProductLine = useCallback(() => {
    if (!currentProductLine.product) return;

    const qty = parseFloat(currentProductLine.cantidad as string) || 0;
    const discount = parseFloat(currentProductLine.descuento as string) || 0;
    const override = parseFloat(currentProductLine.precioOverride as string) || 0;

    const newLineItem = {
      product: currentProductLine.product,
      cantidad: qty,
      descuento: discount,
      precioOverride: override > 0 ? override : undefined,
      detalle: currentProductLine.detalle,
      listo: currentProductLine.listo,
      esDevolucion: currentProductLine.esDevolucion,
      devolucionId: currentProductLine.devolucionId,
    };

    setQuoteItems((prev) => {
      const updated = [...prev];
      if (editingItemIndex !== null) {
        updated[editingItemIndex] = newLineItem;
      } else {
        const normalizedNewDetail = (newLineItem.detalle || '').trim().toLowerCase();
        const existingIndex = updated.findIndex(
          (item) =>
            item.product.sku === newLineItem.product.sku &&
            (item.detalle || '').trim().toLowerCase() === normalizedNewDetail &&
            Boolean(item.esDevolucion) === Boolean(newLineItem.esDevolucion)
        );

        if (existingIndex !== -1) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            cantidad: updated[existingIndex].cantidad + qty,
          };
        } else {
          updated.push(newLineItem);
        }
      }
      return updated;
    });

    setIsProductModalOpen(false);
    setEditingItemIndex(null);
  }, [currentProductLine, editingItemIndex]);

  const removeProductLine = useCallback((index: number) => {
    setQuoteItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const openAddItemModal = useCallback((product: any) => {
    setCurrentProductLine({
      product,
      cantidad: 1,
      descuento: 0,
      precioOverride: 0,
      detalle: '',
      listo: false,
      esDevolucion: false,
      devolucionId: '',
    });
    setEditingItemIndex(null);
    setIsProductModalOpen(true);
  }, []);

  const openEditItemModal = useCallback((index: number) => {
    const item = quoteItems[index];
    setCurrentProductLine({
      product: item.product,
      cantidad: item.cantidad,
      descuento: item.descuento,
      precioOverride: item.precioOverride || 0,
      detalle: item.detalle || '',
      listo: item.listo || false,
      esDevolucion: item.esDevolucion || false,
      devolucionId: item.devolucionId || '',
    });
    setEditingItemIndex(index);
    setIsProductModalOpen(true);
  }, [quoteItems]);

  const handleSaveDevolucion = useCallback(
    (callbacks: { onSuccess: () => void; onWarn: (title: string, text: string) => void }) => {
      if (!devClienteId || !devConductorId || devItems.length === 0) {
        callbacks.onWarn(
          'Campos incompletos',
          'Por favor complete todos los campos requeridos (Cliente, Conductor y al menos un producto).'
        );
        return;
      }

      const cli = clientes.find((c) => c.id === devClienteId);
      const cond = conductores.find((c) => c.id === devConductorId);
      const newDev: any = {
        id: generateId('dev'),
        pedidoId: devPedidoId || '',
        pedidoNo: (quotations.find((q) => q.id === devPedidoId) as any)?.no || 'S/O',
        clienteId: devClienteId,
        clienteNombre: cli?.nombre || '',
        conductorId: devConductorId,
        conductorNombre: cond?.nombre || '',
        estado: 'PROGRAMADA',
        fechaProgramacion: devFechaProg,
        items: devItems.map((i) => ({
          sku: i.sku,
          nombre: i.nombre,
          cantidadSolicitada: i.cantidad,
          precioUnitarioVenta: i.precio,
          motivo: i.motivo,
        })),
      };

      setDevoluciones((prev: any[]) => [newDev, ...prev]);
      publishEvent(
        'QUOTE_STATUS_CHANGED',
        userRole,
        `Solicitud de devolución programada para cliente ${newDev.clienteNombre} asignada a conductor ${newDev.conductorNombre}`
      );

      // Reset
      setDevClienteId('');
      setDevConductorId('');
      setDevFechaProg(new Date().toISOString().split('T')[0]);
      setDevPedidoId('');
      setDevItems([]);
      setDevSelProductSku('');
      setDevSelProductCant(1);
      setDevSelProductMotivo('MAL_ESTADO');

      callbacks.onSuccess();
    },
    [
      devClienteId,
      devConductorId,
      devItems,
      clientes,
      conductores,
      devPedidoId,
      quotations,
      devFechaProg,
      setDevoluciones,
      publishEvent,
      userRole,
    ]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'TODAS' || p.categoria === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, categoryFilter]);

  return {
    // Estados generales
    activeTab,
    setActiveTab,
    quoteSubTab,
    setQuoteSubTab,
    selectedQuoteForPrint,
    setSelectedQuoteForPrint,

    // Catálogo
    editingProductId,
    setEditingProductId,
    productForm,
    setProductForm,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    categoriasUnicas,
    filteredProducts,

    // Precios
    editingPriceId,
    setEditingPriceId,
    priceForm,
    setPriceForm,
    selectedProductHistory,
    setSelectedProductHistory,

    // Cotización
    clientType,
    setClientType,
    clientName,
    setClientName,
    clientIdent,
    setClientIdent,
    quoteItems,
    setQuoteItems,
    wizardStep,
    setWizardStep,
    origenPedido,
    setOrigenPedido,
    origenesDisponibles,
    nuevoOrigen,
    setNuevoOrigen,
    facturaElectronica,
    setFacturaElectronica,
    formaPago,
    setFormaPago,
    quoteDiscountGlobal,
    setQuoteDiscountGlobal,
    quoteSearchTerm,
    setQuoteSearchTerm,
    editingQuoteId,
    setEditingQuoteId,

    // Modal de línea
    isProductModalOpen,
    setIsProductModalOpen,
    currentProductLine,
    setCurrentProductLine,
    editingItemIndex,
    setEditingItemIndex,

    // Entrega y logística
    logisticaTipo,
    setLogisticaTipo,
    logisticaDireccion,
    setLogisticaDireccion,
    logisticaFecha,
    setLogisticaFecha,
    logisticaJornada,
    setLogisticaJornada,
    logisticaConductorId,
    setLogisticaConductorId,
    observacionesPedido,
    setObservacionesPedido,

    // Devoluciones
    devClienteId,
    setDevClienteId,
    devConductorId,
    setDevConductorId,
    devFechaProg,
    setDevFechaProg,
    devPedidoId,
    setDevPedidoId,
    devItems,
    setDevItems,
    devSelProductSku,
    setDevSelProductSku,
    devSelProductCant,
    setDevSelProductCant,
    devSelProductMotivo,
    setDevSelProductMotivo,

    // Datos stores
    products,
    productPricings,
    quotations,
    devoluciones,
    clientes,
    conductores,
    lastClientPrices,
    userRole,

    // Cálculos
    quoteSubtotal,
    quoteLineDiscountsTotal,
    quoteDevolucionesTotal,
    quoteSubtotalAfterLineDiscounts,
    quoteGlobalDiscountValue,
    quoteTotalFinal,

    // Manejadores
    handleSaveProduct,
    handleEditProduct,
    handleToggleStatus,
    handleStartEditPrice,
    handleSavePrices,
    handleSaveQuotation,
    handleEditQuote,
    handleTransitionQuote,
    getProductPriceByClientType,
    getQuoteItemUnitPrice,
    saveProductLine,
    removeProductLine,
    openAddItemModal,
    openEditItemModal,
    handleSaveDevolucion,
  };
}
