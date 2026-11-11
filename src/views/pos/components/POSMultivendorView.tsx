import React, { useState } from 'react';
import { Search, ShoppingCart } from 'lucide-react';
import type { Product, Cliente } from '../../../types/erp.types';
import { 
  POSMultivendorLightHeader, 
  type VendorOption 
} from './POSMultivendorLightHeader';
import { POSMultivendorCatalog } from './POSMultivendorCatalog';
import { 
  POSMultivendorCart, 
  type MultivendorCartItem 
} from './POSMultivendorCart';
import { ManualWeightModal } from './ManualWeightModal';
import { usePOSKeyboardShortcuts } from '../../../hooks/usePOSKeyboardShortcuts';

/**
 * Función canónica para determinar si un producto es pesable (Balanza / KG)
 */
export const isProductPesable = (p: Product): boolean => {
  if (!p) return false;
  if ((p as any).es_pesable === true || (p as any).esPesable === true) return true;
  if ((p as any).es_pesable === false || (p as any).esPesable === false) return false;
  if ((p as any).tipo_venta === 'granel' || (p as any).tipo_venta === 'balanza' || (p as any).tipo_venta === 'peso') return true;
  if ((p as any).tipo_venta === 'unidad' || (p as any).tipo_venta === 'empaque') return false;

  const rawUnit = (p.unidadMedida || (p as any).unidad_medida || (p as any).unidad || '').toString().toLowerCase().trim();
  if (['kg', 'kilo', 'kilos', 'kilogramo', 'kilogramos', 'gr', 'g', 'gramo', 'gramos', 'lb', 'libra', 'libras'].includes(rawUnit)) {
    return true;
  }
  if (['und', 'unidad', 'unidades', 'pz', 'pieza', 'piezas', 'pq', 'paquete', 'paquetes', 'lata', 'latas', 'caja', 'cajas'].includes(rawUnit)) {
    return false;
  }
  return false;
};

export interface POSMultivendorViewProps {
  products: Product[];
  stockMap: Record<string, number>;
  cartItems: MultivendorCartItem[];
  onAddToCart: (product: Product, cantidad?: number) => void;
  onUpdateQuantity: (index: number, delta: number) => void;
  onSetQuantity?: (index: number, quantity: number) => void;
  onUpdatePrice?: (index: number, newPrice: number) => void;
  onUpdateDiscount?: (index: number, discountPct: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  subtotal: number;
  descuento?: number;
  total: number;
  descuentoGlobalTipo?: 'porcentaje' | 'monto';
  descuentoGlobalValor?: number;
  onApplyGlobalDiscount?: (tipo: 'porcentaje' | 'monto', valor: number) => void;
  onRemoveGlobalDiscount?: () => void;
  onEmitirComanda: () => void;
  onCobrarCaja?: () => void;
  selectedVendorId: string;
  onSelectVendor: (id: string) => void;
  vendedores: VendorOption[];
  cliente?: any;
  onOpenClientModal: () => void;
  comandasPendientesCount?: number;
  onOpenComandasQueue?: () => void;
  isModoCajero?: boolean;
  onToggleModoCajero?: () => void;
  onOpenScaleModal?: (product: Product) => void;
  notasDespacho?: string;
  onNotasDespachoChange?: (val: string) => void;
  isSubmitting?: boolean;
  modoCajeroWorkspace?: React.ReactNode;
  // Props Hito M4 (Atajos Globales de Teclado):
  onSaveDraft?: () => void;
  onToggleView?: () => void;
  onCheckout?: () => void;
  isKeyboardShortcutsEnabled?: boolean;
  onEscape?: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement>;
}

export const POSMultivendorView: React.FC<POSMultivendorViewProps> = ({
  products,
  stockMap,
  cartItems,
  onAddToCart,
  onUpdateQuantity,
  onSetQuantity,
  onUpdatePrice,
  onUpdateDiscount,
  onRemoveItem,
  onClearCart,
  subtotal,
  descuento = 0,
  total,
  descuentoGlobalTipo,
  descuentoGlobalValor,
  onApplyGlobalDiscount,
  onRemoveGlobalDiscount,
  onEmitirComanda,
  onCobrarCaja,
  selectedVendorId,
  onSelectVendor,
  vendedores,
  cliente,
  onOpenClientModal,
  comandasPendientesCount = 0,
  onOpenComandasQueue,
  isModoCajero = false,
  onToggleModoCajero,
  onOpenScaleModal,
  notasDespacho = '',
  onNotasDespachoChange,
  isSubmitting = false,
  modoCajeroWorkspace,
  onSaveDraft: propsOnSaveDraft,
  onToggleView: propsOnToggleView,
  onCheckout: propsOnCheckout,
  isKeyboardShortcutsEnabled = true,
  onEscape: propsOnEscape,
  searchInputRef,
}) => {
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileTab, setMobileTab] = useState<'catalogo' | 'carrito'>('catalogo');
  const [scaleModalProduct, setScaleModalProduct] = useState<Product | null>(null);
  const [isSupervisorModalOpen, setIsSupervisorModalOpen] = useState(false);

  // Hook central de atajos de teclado POS (Hito M4: F8, Ctrl+K, F6, F4, F2, F9, Esc)
  const handleToggleViewAction = () => {
    if (propsOnToggleView) {
      propsOnToggleView();
    } else if (onToggleModoCajero) {
      onToggleModoCajero();
    } else if (onOpenComandasQueue) {
      onOpenComandasQueue();
    } else {
      setMobileTab((prev) => (prev === 'catalogo' ? 'carrito' : 'catalogo'));
    }
  };

  const handleSaveDraftAction = () => {
    if (propsOnSaveDraft) {
      propsOnSaveDraft();
      return;
    }
    if (cartItems.length > 0 && !isSubmitting) {
      onEmitirComanda();
    }
  };

  const handleCheckoutAction = () => {
    if (propsOnCheckout) {
      propsOnCheckout();
      return;
    }
    if (cartItems.length > 0 && !isSubmitting) {
      if (onCobrarCaja) {
        onCobrarCaja();
      } else {
        onEmitirComanda();
      }
    }
  };

  usePOSKeyboardShortcuts(
    {
      onFocusSearch: () => {
        if (mobileTab !== 'catalogo') {
          setMobileTab('catalogo');
        }
        const el =
          searchInputRef?.current ||
          document.querySelector<HTMLInputElement>('#pos-light-product-search-input') ||
          document.querySelector<HTMLInputElement>('[data-testid="pos-light-product-search-input"]') ||
          document.querySelector<HTMLInputElement>('#pos-light-barcode-input');
        if (el) {
          el.focus();
          el.select?.();
        }
      },
      onToggleView: handleToggleViewAction,
      onCtrlK: handleToggleViewAction,
      onOpenCustomerSelector: () => {
        onOpenClientModal();
      },
      onSaveDraft: handleSaveDraftAction,
      onF2: handleSaveDraftAction,
      onCheckout: handleCheckoutAction,
      onF9: handleCheckoutAction,
      onEscape: () => {
        // Prioridad 1: Cerrar modal de balanza si está abierto
        if (scaleModalProduct) {
          setScaleModalProduct(null);
          return;
        }
        // Prioridad 2: Callback personalizado si fue inyectado
        if (propsOnEscape) {
          propsOnEscape();
          return;
        }
        // Prioridad 3: Limpiar buscador y pistola si tienen contenido
        if (searchQuery || barcodeInput) {
          setSearchQuery('');
          setBarcodeInput('');
          return;
        }
        // Prioridad 4: Desenfocar input activo y normalizar vista
        if (document.activeElement && typeof (document.activeElement as HTMLElement).blur === 'function') {
          (document.activeElement as HTMLElement).blur();
        }
      },
    },
    {
      isEnabled: isKeyboardShortcutsEnabled,
      isModalOpen: Boolean(scaleModalProduct || isSupervisorModalOpen),
      customerSelectorKey: 'F6',
    }
  );

  // Obtener nombre corto del asesor activo
  const activeVendor = vendedores.find((v) => v.id === selectedVendorId);
  const activeVendorName = activeVendor ? activeVendor.corto : 'Asesor Mostrador';

  // Manejar apertura de pesaje manual (Hito M3): evitar doble modal si el host delega externamente
  const handleOpenScaleModal = (product: Product) => {
    if (onOpenScaleModal) {
      onOpenScaleModal(product);
      return;
    }
    setScaleModalProduct(product);
  };

  // Manejar escaneo de código de barras
  const handleBarcodeSubmit = () => {
    if (!barcodeInput.trim()) return;
    const cleanCode = barcodeInput.trim().toLowerCase();
    const found = products.find((p) => {
      const code = (p.codigo_barras || (p as any).barcode || '').toLowerCase();
      const sku = (p.sku || '').toLowerCase();
      return code === cleanCode || sku === cleanCode;
    });

    if (found) {
      if (isProductPesable(found)) {
        handleOpenScaleModal(found);
      } else {
        onAddToCart(found, 1);
      }
      setBarcodeInput('');
    } else {
      // Si no es coincidencia exacta, pasar al filtro de búsqueda
      setSearchQuery(barcodeInput.trim());
      setBarcodeInput('');
    }
  };

  return (
    <div 
      data-testid="pos-multivendor-saas-root"
      className="h-full w-full flex-1 min-h-0 min-w-0 flex flex-col rounded-xl bg-slate-100 text-slate-900 font-sans overflow-hidden select-none"
    >
      {/* 1. CABECERA ÚNICA COMPACTA (56px) — Elimina las 5 barras apiladas */}
      <POSMultivendorLightHeader
        vendedores={vendedores}
        selectedVendorId={selectedVendorId}
        onSelectVendor={onSelectVendor}
        barcodeInput={barcodeInput}
        onBarcodeChange={setBarcodeInput}
        onBarcodeSubmit={handleBarcodeSubmit}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        clienteSeleccionado={cliente}
        onOpenClientModal={onOpenClientModal}
        comandasPendientesCount={comandasPendientesCount}
        onOpenComandasQueue={onOpenComandasQueue}
        isModoCajero={isModoCajero}
        onToggleModoCajero={onToggleModoCajero}
      />

      {/* 2. PESTAÑAS MÓVILES (Solo visibles en pantallas pequeñas < 1024px) */}
      <div 
        data-testid="pos-mobile-switcher"
        className="flex lg:hidden bg-white border-b border-slate-200 p-1 shrink-0"
      >
        <button
          role="tab"
          type="button"
          aria-selected={mobileTab === 'catalogo'}
          data-testid="pos-mobile-tab-catalogo"
          onClick={() => setMobileTab('catalogo')}
          className={`flex-1 min-h-[44px] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === 'catalogo'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Search size={15} />
          <span>Catálogo</span>
        </button>
        <button
          role="tab"
          type="button"
          aria-selected={mobileTab === 'carrito'}
          data-testid="pos-mobile-tab-carrito"
          onClick={() => setMobileTab('carrito')}
          className={`flex-1 min-h-[44px] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === 'carrito'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ShoppingCart size={15} />
          <span>Carrito ({cartItems.length})</span>
        </button>
      </div>

      {/* 3. ESPACIO DE TRABAJO PRINCIPAL (75% Catálogo / 25% Carrito o Modo Cajero) */}
      {isModoCajero && modoCajeroWorkspace ? (
        modoCajeroWorkspace
      ) : (
        <main className="flex-1 flex flex-row overflow-hidden min-h-0">
          {/* COLUMNA CATÁLOGO (75% de ancho en Desktop) */}
          <div 
            data-testid="pos-catalog-glass-card"
            className={`flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden ${
              mobileTab === 'catalogo' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            <POSMultivendorCatalog
              products={products}
              stockMap={stockMap}
              onAddToCart={onAddToCart}
              onOpenScaleModal={handleOpenScaleModal}
              searchFilter={searchQuery}
            />
          </div>

          {/* COLUMNA CARRITO (25% / 400px en Desktop) */}
          <div 
            className={`h-full min-h-0 overflow-hidden ${
              mobileTab === 'carrito' ? 'flex flex-1 w-full' : 'hidden lg:flex'
            }`}
          >
            <POSMultivendorCart
              items={cartItems}
              onUpdateQuantity={onUpdateQuantity}
              onSetQuantity={onSetQuantity}
              onUpdatePrice={onUpdatePrice}
              onUpdateDiscount={onUpdateDiscount}
              onRemoveItem={onRemoveItem}
              onClearCart={onClearCart}
              subtotal={subtotal}
              descuento={descuento}
              total={total}
              descuentoGlobalTipo={descuentoGlobalTipo}
              descuentoGlobalValor={descuentoGlobalValor}
              onApplyGlobalDiscount={onApplyGlobalDiscount}
              onRemoveGlobalDiscount={onRemoveGlobalDiscount}
              onEmitirComanda={onEmitirComanda}
              onCobrarCaja={onCobrarCaja}
              isSubmitting={isSubmitting}
              activeVendorName={activeVendorName}
              cliente={cliente}
              notasDespacho={notasDespacho}
              onNotasDespachoChange={onNotasDespachoChange}
              isModoCajero={isModoCajero}
              onSupervisorModalChange={setIsSupervisorModalOpen}
            />
          </div>
        </main>
      )}

      {/* 4. MODAL TÁCTIL DE PESAJE MANUAL (Hito M3: Trigger Balanza KG) */}
      {scaleModalProduct && (
        <ManualWeightModal
          isOpen={Boolean(scaleModalProduct)}
          producto={scaleModalProduct}
          precioUnitario={
            scaleModalProduct
              ? Number(
                  scaleModalProduct.precio_venta_pos ||
                  (scaleModalProduct as any).precioVenta ||
                  (scaleModalProduct as any).precio ||
                  0
                )
              : 0
          }
          pesoInicial={1.0}
          onClose={() => setScaleModalProduct(null)}
          onConfirm={(product, pesoKg) => {
            onAddToCart(product, pesoKg);
            setScaleModalProduct(null);
          }}
        />
      )}
    </div>
  );
};
