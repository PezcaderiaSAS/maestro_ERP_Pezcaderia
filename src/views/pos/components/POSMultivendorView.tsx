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

export interface POSMultivendorViewProps {
  products: Product[];
  stockMap: Record<string, number>;
  cartItems: MultivendorCartItem[];
  onAddToCart: (product: Product, cantidad?: number) => void;
  onUpdateQuantity: (index: number, delta: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  subtotal: number;
  descuento?: number;
  total: number;
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
}

export const POSMultivendorView: React.FC<POSMultivendorViewProps> = ({
  products,
  stockMap,
  cartItems,
  onAddToCart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  subtotal,
  descuento = 0,
  total,
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
}) => {
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileTab, setMobileTab] = useState<'catalogo' | 'carrito'>('catalogo');

  // Obtener nombre corto del asesor activo
  const activeVendor = vendedores.find((v) => v.id === selectedVendorId);
  const activeVendorName = activeVendor ? activeVendor.corto : 'Asesor Mostrador';

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
      onAddToCart(found, 1);
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
      className="h-screen w-screen flex flex-col bg-slate-100 text-slate-900 font-sans overflow-hidden select-none"
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
      <div className="flex lg:hidden bg-white border-b border-slate-200 p-1 shrink-0">
        <button
          type="button"
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
          type="button"
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

      {/* 3. ESPACIO DE TRABAJO PRINCIPAL (75% Catálogo / 25% Carrito) */}
      <main className="flex-1 flex flex-row overflow-hidden min-h-0">
        {/* COLUMNA CATÁLOGO (75% de ancho en Desktop) */}
        <div 
          className={`flex-1 min-h-0 flex flex-col overflow-hidden ${
            mobileTab === 'catalogo' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <POSMultivendorCatalog
            products={products}
            stockMap={stockMap}
            onAddToCart={onAddToCart}
            onOpenScaleModal={onOpenScaleModal}
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
            onRemoveItem={onRemoveItem}
            onClearCart={onClearCart}
            subtotal={subtotal}
            descuento={descuento}
            total={total}
            onEmitirComanda={onEmitirComanda}
            onCobrarCaja={onCobrarCaja}
            isSubmitting={isSubmitting}
            activeVendorName={activeVendorName}
            cliente={cliente}
            notasDespacho={notasDespacho}
            onNotasDespachoChange={onNotasDespachoChange}
            isModoCajero={isModoCajero}
          />
        </div>
      </main>
    </div>
  );
};

