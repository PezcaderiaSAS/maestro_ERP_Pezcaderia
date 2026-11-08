import React from 'react';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  FileText, 
  Receipt, 
  Send, 
  User, 
  Tag, 
  CreditCard 
} from 'lucide-react';
import type { Product, Cliente } from '../../../types/erp.types';

export interface MultivendorCartItem {
  id?: string;
  product: Product;
  cantidad: number | string;
  precioOverride?: number;
  notas?: string;
}

export interface POSMultivendorCartProps {
  items: MultivendorCartItem[];
  onUpdateQuantity: (index: number, delta: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  subtotal: number;
  descuento?: number;
  total: number;
  onEmitirComanda: () => void;
  onCobrarCaja?: () => void;
  isSubmitting?: boolean;
  activeVendorName?: string;
  cliente?: Cliente | null;
  notasDespacho?: string;
  onNotasDespachoChange?: (val: string) => void;
  isModoCajero?: boolean;
}

export const POSMultivendorCart: React.FC<POSMultivendorCartProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  subtotal,
  descuento = 0,
  total,
  onEmitirComanda,
  onCobrarCaja,
  isSubmitting = false,
  activeVendorName = 'Mostrador',
  cliente,
  notasDespacho = '',
  onNotasDespachoChange,
  isModoCajero = false,
}) => {
  const getProductPrice = (item: MultivendorCartItem) => {
    if (typeof item.precioOverride === 'number') return item.precioOverride;
    const p = item.product;
    return p.precio_venta_pos || (p as any).precioVenta || (p as any).precio || 0;
  };

  const getProductName = (p: Product) => {
    return p.nombre || (p as any).name || 'Producto';
  };

  const getProductUnit = (p: Product) => {
    return p.unidadMedida || (p as any).unidad || 'kg';
  };

  const totalItemsCount = items.reduce((acc, it) => acc + (Number(it.cantidad) || 0), 0);

  return (
    <aside 
      data-testid="pos-multivendor-cart"
      className="w-80 sm:w-96 md:w-[380px] lg:w-[420px] bg-white flex flex-col justify-between h-full border-l border-slate-200 select-none shrink-0 shadow-lg z-10"
    >
      {/* 1. CABECERA COMPACTA DEL CARRITO (48px) */}
      <div className="h-12 px-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <ShoppingCart size={16} />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 block leading-none">
              Carrito de Ventas
            </span>
            <span className="text-[10px] font-medium text-slate-400">
              Asesor: <strong className="text-slate-600">{activeVendorName}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            {items.length} {items.length === 1 ? 'ítem' : 'ítems'}
          </span>

          {items.length > 0 && (
            <button
              type="button"
              data-testid="btn-vaciar-carrito"
              onClick={onClearCart}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Vaciar carrito actual"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* 2. LISTA DE ÍTEMS (85% Altura Vertical de Productos) */}
      <div 
        data-testid="pos-cart-items-list"
        className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5"
      >
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-300">
              <ShoppingCart size={32} />
            </div>
            <p className="text-sm font-bold text-slate-700">El carrito está vacío</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
              Toca productos en el catálogo o escanea con la pistola de código de barras
            </p>
          </div>
        ) : (
          items.map((item, index) => {
            const name = getProductName(item.product);
            const unitPrice = getProductPrice(item);
            const unit = getProductUnit(item.product);
            const qty = Number(item.cantidad) || 0;
            const lineSubtotal = unitPrice * qty;

            return (
              <div 
                key={item.id || `${item.product.id}_${index}`}
                data-testid={`cart-row-${index}`}
                className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-100 transition-all flex flex-col gap-1.5 shadow-xs"
              >
                {/* Nivel 1: Nombre en texto oscuro de alto contraste (line-clamp-1) */}
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 leading-snug flex-1">
                    {name}
                  </h4>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(index)}
                    className="p-1 text-slate-300 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                    title="Eliminar producto"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Nivel 2: Controles Táctiles (>=48px) y Subtotal Esmeralda */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <div className="text-[11px] font-mono text-slate-400">
                    ${unitPrice.toLocaleString('es-CO')} × {unit}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Botonera de incremento/decremento táctil ergonómica */}
                    <div className="flex items-center bg-slate-100 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        data-testid={`btn-cart-dec-${index}`}
                        onClick={() => onUpdateQuantity(index, -1)}
                        className="min-h-[44px] min-w-[44px] sm:min-h-[48px] sm:min-w-[48px] flex items-center justify-center rounded-l-lg hover:bg-slate-200 text-slate-700 font-bold active:scale-90 transition-all cursor-pointer"
                        title="Disminuir cantidad"
                      >
                        <Minus size={14} className="stroke-[2.5]" />
                      </button>

                      <span 
                        data-testid={`cart-qty-${index}`}
                        className="min-w-[36px] text-center font-mono font-black text-xs sm:text-sm text-slate-900 px-1"
                      >
                        {qty}
                      </span>

                      <button
                        type="button"
                        data-testid={`btn-cart-inc-${index}`}
                        onClick={() => onUpdateQuantity(index, 1)}
                        className="min-h-[44px] min-w-[44px] sm:min-h-[48px] sm:min-w-[48px] flex items-center justify-center rounded-r-lg hover:bg-slate-200 text-slate-700 font-bold active:scale-90 transition-all cursor-pointer"
                        title="Aumentar cantidad"
                      >
                        <Plus size={14} className="stroke-[2.5]" />
                      </button>
                    </div>

                    {/* Subtotal de Línea */}
                    <span className="font-mono font-black text-xs sm:text-sm text-emerald-700 text-right min-w-[65px]">
                      ${lineSubtotal.toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 3. FOOTER FIJO INFERIOR CON ACCIÓN DE COMANDA / COBRO */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 shrink-0 space-y-2">
        {/* Campo opcional de Notas / Instrucciones de Corte */}
        {onNotasDespachoChange && items.length > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-lg">
            <FileText size={14} className="text-slate-400 shrink-0" />
            <input
              type="text"
              value={notasDespacho}
              onChange={(e) => onNotasDespachoChange(e.target.value)}
              placeholder="Instrucciones de corte / despacho..."
              className="w-full text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
            />
          </div>
        )}

        {/* Resumen Financiero */}
        <div className="space-y-1 py-1">
          <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
            <span>Subtotal ({totalItemsCount} uds):</span>
            <span className="font-mono font-bold text-slate-700">${subtotal.toLocaleString('es-CO')}</span>
          </div>

          {descuento > 0 && (
            <div className="flex justify-between items-center text-xs text-amber-600 font-medium">
              <span>Descuento aplicado:</span>
              <span className="font-mono font-bold">-${descuento.toLocaleString('es-CO')}</span>
            </div>
          )}

          <div className="flex justify-between items-baseline pt-1 border-t border-slate-200">
            <span className="text-xs font-black uppercase tracking-wider text-slate-800">
              Total a Pagar
            </span>
            <span 
              data-testid="pos-cart-total-amount"
              className="text-2xl sm:text-3xl font-mono font-black text-emerald-600 leading-none"
            >
              ${total.toLocaleString('es-CO')}
            </span>
          </div>
        </div>

        {/* BOTÓN PRIMARIO GIGANTE: EMITIR COMANDA / PREVENTA (F6) */}
        <button
          type="button"
          id="btn-emitir-preventa-f6"
          data-testid="btn-emitir-preventa-f6"
          disabled={items.length === 0 || isSubmitting}
          onClick={onEmitirComanda}
          className="w-full min-h-[52px] sm:min-h-[56px] py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm sm:text-base flex items-center justify-between shadow-lg shadow-emerald-600/25 active:scale-98 transition-all cursor-pointer"
          title="Emitir Comanda y enviar a Caja Central (Atajo: F6)"
        >
          <div className="flex items-center gap-2">
            <Send size={18} className="stroke-[2.5]" />
            <span>EMITIR COMANDA (F6)</span>
          </div>
          <span className="font-mono text-emerald-100 text-sm">
            ${total.toLocaleString('es-CO')}
          </span>
        </button>

        {/* BOTÓN SECUNDARIO: COBRAR DIRECTO EN CAJA (Si aplica modo cajero) */}
        {onCobrarCaja && (
          <button
            type="button"
            id="btn-cart-cobrar-caja"
            data-testid="btn-cart-cobrar-caja"
            disabled={items.length === 0 || isSubmitting}
            onClick={onCobrarCaja}
            className="w-full min-h-[40px] py-2 px-3 rounded-lg bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            title="Cobrar directamente en esta terminal (Atajo: F2)"
          >
            <CreditCard size={14} />
            <span>Cobrar en Esta Terminal (F2)</span>
          </button>
        )}
      </div>
    </aside>
  );
};

