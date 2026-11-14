import type React from 'react';
import type { ProductPricing } from '../../types/erp.types';

export type PricingTab = 'catalog' | 'pricing' | 'quotes' | 'simulator' | 'config';
export type QuoteSubTab = 'create' | 'history' | 'devoluciones' | 'b2b_mesa';
export type ClientPriceType = 'POS' | 'RESTAURANTE' | 'MAYORISTA';
export type LogisticsTipo = 'EN_RUTA' | 'INMEDIATA' | 'RECOGEN';
export type LogisticsJornada = 'MANANA' | 'TARDE';
export type QuoteEstadoTransition = 'Sent' | 'Approved' | 'Pausado' | 'Listo' | 'Sold' | 'Expired';

export interface ProductFormData {
  sku: string;
  nombre: string;
  categoria: string;
  unidadMedida: 'kg' | 'und' | 'lb' | 'gr';
  precio_compra: number;
  buffer_seguridad: number;
}

export interface PriceFormData {
  precio_compra: number;
  buffer_seguridad: number;
  precio_venta_pos: number;
  precio_venta_restaurante: number;
  precio_venta_mayorista: number;
}

export interface QuoteItem {
  product: any;
  cantidad: number;
  descuento: number;
  precioOverride?: number;
  detalle?: string;
  listo?: boolean;
  esDevolucion?: boolean;
  devolucionId?: string;
}

export interface CurrentProductLineState {
  product: any | null;
  cantidad: number | string;
  descuento: number | string;
  precioOverride: number | string;
  detalle: string;
  listo: boolean;
  esDevolucion: boolean;
  devolucionId: string;
}

export interface DevolucionDraftItem {
  sku: string;
  nombre: string;
  cantidad: number;
  precio: number;
  motivo: string;
}

/**
 * Contrato público unificado y exhaustivo retornado por el hook usePricing
 */
export interface UsePricingReturn {
  // Estados generales
  activeTab: PricingTab;
  setActiveTab: React.Dispatch<React.SetStateAction<PricingTab>>;
  quoteSubTab: QuoteSubTab;
  setQuoteSubTab: React.Dispatch<React.SetStateAction<QuoteSubTab>>;
  selectedQuoteForPrint: any;
  setSelectedQuoteForPrint: React.Dispatch<React.SetStateAction<any>>;

  // Catálogo
  editingProductId: string | null;
  setEditingProductId: React.Dispatch<React.SetStateAction<string | null>>;
  productForm: ProductFormData;
  setProductForm: React.Dispatch<React.SetStateAction<ProductFormData>>;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  categoryFilter: string;
  setCategoryFilter: React.Dispatch<React.SetStateAction<string>>;
  categoriasUnicas: string[];
  filteredProducts: any[];

  // Precios
  editingPriceId: string | null;
  setEditingPriceId: React.Dispatch<React.SetStateAction<string | null>>;
  priceForm: PriceFormData;
  setPriceForm: React.Dispatch<React.SetStateAction<PriceFormData>>;
  selectedProductHistory: string | null;
  setSelectedProductHistory: React.Dispatch<React.SetStateAction<string | null>>;

  // Cotización
  clientType: ClientPriceType;
  setClientType: React.Dispatch<React.SetStateAction<ClientPriceType>>;
  clientName: string;
  setClientName: React.Dispatch<React.SetStateAction<string>>;
  clientIdent: string;
  setClientIdent: React.Dispatch<React.SetStateAction<string>>;
  quoteItems: QuoteItem[];
  setQuoteItems: React.Dispatch<React.SetStateAction<QuoteItem[]>>;
  wizardStep: 1 | 2 | 3;
  setWizardStep: React.Dispatch<React.SetStateAction<1 | 2 | 3>>;
  origenPedido: string;
  setOrigenPedido: React.Dispatch<React.SetStateAction<string>>;
  origenesDisponibles: string[];
  nuevoOrigen: string;
  setNuevoOrigen: React.Dispatch<React.SetStateAction<string>>;
  facturaElectronica: boolean;
  setFacturaElectronica: React.Dispatch<React.SetStateAction<boolean>>;
  formaPago: 'CREDITO' | 'CONTADO';
  setFormaPago: React.Dispatch<React.SetStateAction<'CREDITO' | 'CONTADO'>>;
  quoteDiscountGlobal: number;
  setQuoteDiscountGlobal: React.Dispatch<React.SetStateAction<number>>;
  quoteSearchTerm: string;
  setQuoteSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  editingQuoteId: string | null;
  setEditingQuoteId: React.Dispatch<React.SetStateAction<string | null>>;

  // Modal de línea
  isProductModalOpen: boolean;
  setIsProductModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  currentProductLine: CurrentProductLineState;
  setCurrentProductLine: React.Dispatch<React.SetStateAction<CurrentProductLineState>>;
  editingItemIndex: number | null;
  setEditingItemIndex: React.Dispatch<React.SetStateAction<number | null>>;

  // Entrega y logística
  logisticaTipo: LogisticsTipo;
  setLogisticaTipo: React.Dispatch<React.SetStateAction<LogisticsTipo>>;
  logisticaDireccion: string;
  setLogisticaDireccion: React.Dispatch<React.SetStateAction<string>>;
  logisticaFecha: string;
  setLogisticaFecha: React.Dispatch<React.SetStateAction<string>>;
  logisticaJornada: LogisticsJornada;
  setLogisticaJornada: React.Dispatch<React.SetStateAction<LogisticsJornada>>;
  logisticaConductorId: string;
  setLogisticaConductorId: React.Dispatch<React.SetStateAction<string>>;
  observacionesPedido: string;
  setObservacionesPedido: React.Dispatch<React.SetStateAction<string>>;

  // Devoluciones
  devClienteId: string;
  setDevClienteId: React.Dispatch<React.SetStateAction<string>>;
  devConductorId: string;
  setDevConductorId: React.Dispatch<React.SetStateAction<string>>;
  devFechaProg: string;
  setDevFechaProg: React.Dispatch<React.SetStateAction<string>>;
  devPedidoId: string;
  setDevPedidoId: React.Dispatch<React.SetStateAction<string>>;
  devItems: DevolucionDraftItem[];
  setDevItems: React.Dispatch<React.SetStateAction<DevolucionDraftItem[]>>;
  devSelProductSku: string;
  setDevSelProductSku: React.Dispatch<React.SetStateAction<string>>;
  devSelProductCant: number | string;
  setDevSelProductCant: React.Dispatch<React.SetStateAction<number | string>>;
  devSelProductMotivo: string;
  setDevSelProductMotivo: React.Dispatch<React.SetStateAction<string>>;

  // Datos stores
  products: any[];
  productPricings: ProductPricing[];
  quotations: any[];
  devoluciones: any[];
  clientes: any[];
  conductores: any[];
  lastClientPrices: Record<string, Record<string, number>>;
  userRole: string;

  // Cálculos
  quoteSubtotal: number;
  quoteLineDiscountsTotal: number;
  quoteDevolucionesTotal: number;
  quoteSubtotalAfterLineDiscounts: number;
  quoteGlobalDiscountValue: number;
  quoteTotalFinal: number;

  // Manejadores
  handleSaveProduct: (
    e: React.FormEvent,
    callbacks: { onSuccess: (msg: string) => void; onWarn: (title: string, text: string) => void }
  ) => void;
  handleEditProduct: (prod: any) => void;
  handleToggleStatus: (id: string) => void;
  handleStartEditPrice: (prod: any) => void;
  handleSavePrices: (prodId: string, callbacks: { onSuccess: () => void }) => void;
  handleSaveQuotation: (callbacks: {
    onSuccess: (isEdit: boolean, no: string, estado: string) => void;
    onWarn: (title: string, text: string) => void;
  }) => void;
  handleEditQuote: (quote: any, callbacks: { onWarn: (title: string, text: string) => void }) => void;
  handleTransitionQuote: (
    quoteId: string,
    nuevoEstado: QuoteEstadoTransition,
    callbacks: { onSuccess: (estado: string) => void; onWarn: (title: string, text: string) => void }
  ) => void;
  getProductPriceByClientType: (prod: any) => number;
  getQuoteItemUnitPrice: (item: any) => number;
  saveProductLine: () => void;
  removeProductLine: (index: number) => void;
  openAddItemModal: (product: any) => void;
  openEditItemModal: (index: number) => void;
  handleSaveDevolucion: (callbacks: { onSuccess: () => void; onWarn: (title: string, text: string) => void }) => void;
}

