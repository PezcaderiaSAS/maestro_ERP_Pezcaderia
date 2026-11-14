import { useState, useCallback } from 'react';
import type React from 'react';
import { generateId } from '../../lib/utils';
import type { ClientPriceType, QuoteItem, QuoteEstadoTransition } from './pricing.types';
import { useQuoteLogistics } from './useQuoteLogistics';
import { useProductLineModal } from './useProductLineModal';
import { useQuoteCalculations } from './useQuoteCalculations';

export interface UseQuoteDraftProps {
  clientType: ClientPriceType;
  setClientType: React.Dispatch<React.SetStateAction<ClientPriceType>>;
  products: any[];
  clientes: any[];
  conductores: any[];
  userRole: string;
  setQuotations: (updater: (prev: any[]) => any[]) => void;
  publishEvent: (type: any, userRole: string, description: string, metadata?: any) => void;
  setStock: (updater: (prev: any) => any) => void;
  updateLastClientPrice: (clientKey: string, sku: string, price: number) => void;
  setQuoteSubTab: (tab: any) => void;
  getQuoteItemUnitPrice: (item: any) => number;
}

/**
 * Hook modular para la gestión del borrador de cotizaciones, ítems de producto,
 * wizard en 3 pasos, persistencia y transiciones de estado.
 */
export function useQuoteDraft({
  clientType,
  setClientType,
  products,
  clientes,
  conductores,
  userRole,
  setQuotations,
  publishEvent,
  setStock,
  updateLastClientPrice,
  setQuoteSubTab,
  getQuoteItemUnitPrice,
}: UseQuoteDraftProps) {
  // Estado de cliente y cotización
  const [clientName, setClientName] = useState('');
  const [clientIdent, setClientIdent] = useState('');
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [origenPedido, setOrigenPedido] = useState('WHATSAPP');
  const [origenesDisponibles] = useState(['VISITA', 'LLAMADA', 'WHATSAPP']);
  const [nuevoOrigen, setNuevoOrigen] = useState('');
  const [facturaElectronica, setFacturaElectronica] = useState(false);
  const [formaPago, setFormaPago] = useState<'CREDITO' | 'CONTADO'>('CREDITO');
  const [quoteDiscountGlobal, setQuoteDiscountGlobal] = useState(0);
  const [quoteSearchTerm, setQuoteSearchTerm] = useState('');
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);

  // Submódulos desacoplados
  const logistics = useQuoteLogistics();
  const lineModal = useProductLineModal({ quoteItems, setQuoteItems });
  const calculations = useQuoteCalculations({
    quoteItems,
    quoteDiscountGlobal,
    getQuoteItemUnitPrice,
  });

  // Guardar o actualizar cotización
  const handleSaveQuotation = useCallback(
    (callbacks: {
      onSuccess: (isEdit: boolean, no: string, estado: string) => void;
      onWarn: (title: string, text: string) => void;
    }) => {
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
              publishEvent(
                'QUOTE_STATUS_CHANGED',
                userRole,
                `Pedido ${q.no} editado y actualizado por ${userRole}`,
                { quoteId: q.id, total: Math.round(calculations.quoteTotalFinal) }
              );
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
                  cantidad_real: (q.items?.find((x: any) => x.sku === i.product.sku) as any)?.cantidad_real,
                })),
                subtotal: calculations.quoteSubtotal,
                descuentos: calculations.quoteLineDiscountsTotal + calculations.quoteGlobalDiscountValue,
                total: Math.round(calculations.quoteTotalFinal),
                observaciones: logistics.observacionesPedido,
                logistica: {
                  tipoEntrega: logistics.logisticaTipo,
                  direccionEntrega:
                    logistics.logisticaTipo === 'RECOGEN'
                      ? 'Retira en Punto de Venta'
                      : logistics.logisticaDireccion,
                  fechaEntrega: logistics.logisticaFecha,
                  jornada: logistics.logisticaJornada,
                  conductorId: logistics.logisticaConductorId,
                  conductorNombre:
                    conductores.find((c) => c.id === logistics.logisticaConductorId)?.nombre || '',
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
          subtotal: calculations.quoteSubtotal,
          descuentos: calculations.quoteLineDiscountsTotal + calculations.quoteGlobalDiscountValue,
          total: Math.round(calculations.quoteTotalFinal),
          estado: estadoCalculado,
          observaciones: logistics.observacionesPedido,
          fecha: new Date().toLocaleDateString('es-CO'),
          vencimiento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('es-CO'),
          logistica: {
            tipoEntrega: logistics.logisticaTipo,
            direccionEntrega:
              logistics.logisticaTipo === 'RECOGEN'
                ? 'Retira en Punto de Venta'
                : logistics.logisticaDireccion,
            fechaEntrega: logistics.logisticaFecha,
            jornada: logistics.logisticaJornada,
            conductorId: logistics.logisticaConductorId,
            conductorNombre:
              conductores.find((c) => c.id === logistics.logisticaConductorId)?.nombre || '',
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
      logistics.resetLogistics();
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
      calculations,
      facturaElectronica,
      formaPago,
      quoteDiscountGlobal,
      logistics,
      conductores,
      publishEvent,
      setQuotations,
      getQuoteItemUnitPrice,
      clientType,
      setQuoteSubTab,
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

      logistics.setLogisticaTipo(quote.logistica?.tipoEntrega || 'EN_RUTA');
      logistics.setLogisticaDireccion(quote.logistica?.direccionEntrega || '');
      logistics.setLogisticaFecha(quote.logistica?.fechaEntrega || new Date().toISOString().split('T')[0]);
      logistics.setLogisticaJornada(quote.logistica?.jornada || 'MANANA');
      logistics.setLogisticaConductorId(quote.logistica?.conductorId || '');
      logistics.setObservacionesPedido(quote.observaciones || '');

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
    [products, setQuoteSubTab, logistics, setClientType]
  );

  const handleTransitionQuote = useCallback(
    (
      quoteId: string,
      nuevoEstado: QuoteEstadoTransition,
      callbacks: { onSuccess: (estado: string) => void; onWarn: (title: string, text: string) => void }
    ) => {
      const role = (userRole || '').trim().toLowerCase();

      if (nuevoEstado === 'Approved') {
        if (role !== 'admin' && role !== 'administrativo' && role !== 'vendedor') {
          callbacks.onWarn(
            'Acceso Denegado',
            'Solo los roles de Super Administrador, Administrativo o Vendedor pueden aprobar pedidos.'
          );
          return;
        }
      }

      if (nuevoEstado === 'Sold') {
        if (role !== 'admin' && role !== 'administrativo' && role !== 'vendedor') {
          callbacks.onWarn(
            'Acceso Denegado',
            'Solo los roles de Super Administrador, Administrativo o Vendedor pueden facturar y completar ventas.'
          );
          return;
        }
      }

      if (nuevoEstado === 'Listo' || nuevoEstado === 'Pausado') {
        if (role !== 'admin' && role !== 'bodega' && role !== 'administrativo') {
          callbacks.onWarn(
            'Acceso Denegado',
            'Solo los roles de Super Administrador, Bodega o Administrativo pueden gestionar el alistamiento de pedidos.'
          );
          return;
        }
      }

      if (nuevoEstado === 'Sent' || nuevoEstado === 'Expired') {
        if (role !== 'admin' && role !== 'vendedor' && role !== 'administrativo') {
          callbacks.onWarn(
            'Acceso Denegado',
            'Solo los roles de Super Administrador, Vendedor o Administrativo pueden modificar la vigencia y envío del pedido.'
          );
          return;
        }
      }

      setQuotations((prev: any[]) =>
        prev.map((q: any) => {
          if (q.id === quoteId) {
            publishEvent(
              'QUOTE_STATUS_CHANGED',
              userRole,
              `Cotización ${q.no} cambió de estado ${q.estado} a ${nuevoEstado}`,
              { quoteId, oldEstado: q.estado, nuevoEstado }
            );

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

  return {
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
    // Delegados de lineModal
    isProductModalOpen: lineModal.isProductModalOpen,
    setIsProductModalOpen: lineModal.setIsProductModalOpen,
    currentProductLine: lineModal.currentProductLine,
    setCurrentProductLine: lineModal.setCurrentProductLine,
    editingItemIndex: lineModal.editingItemIndex,
    setEditingItemIndex: lineModal.setEditingItemIndex,
    saveProductLine: lineModal.saveProductLine,
    removeProductLine: lineModal.removeProductLine,
    openAddItemModal: lineModal.openAddItemModal,
    openEditItemModal: lineModal.openEditItemModal,
    // Delegados de logistics
    logisticaTipo: logistics.logisticaTipo,
    setLogisticaTipo: logistics.setLogisticaTipo,
    logisticaDireccion: logistics.logisticaDireccion,
    setLogisticaDireccion: logistics.setLogisticaDireccion,
    logisticaFecha: logistics.logisticaFecha,
    setLogisticaFecha: logistics.setLogisticaFecha,
    logisticaJornada: logistics.logisticaJornada,
    setLogisticaJornada: logistics.setLogisticaJornada,
    logisticaConductorId: logistics.logisticaConductorId,
    setLogisticaConductorId: logistics.setLogisticaConductorId,
    observacionesPedido: logistics.observacionesPedido,
    setObservacionesPedido: logistics.setObservacionesPedido,
    // Cálculos
    quoteSubtotal: calculations.quoteSubtotal,
    quoteLineDiscountsTotal: calculations.quoteLineDiscountsTotal,
    quoteDevolucionesTotal: calculations.quoteDevolucionesTotal,
    quoteSubtotalAfterLineDiscounts: calculations.quoteSubtotalAfterLineDiscounts,
    quoteGlobalDiscountValue: calculations.quoteGlobalDiscountValue,
    quoteTotalFinal: calculations.quoteTotalFinal,
    // Manejadores de cotización
    handleSaveQuotation,
    handleEditQuote,
    handleTransitionQuote,
  };
}
