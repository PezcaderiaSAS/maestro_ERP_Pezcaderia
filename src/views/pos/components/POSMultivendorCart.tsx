import React, { useState, useRef, useEffect } from 'react';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  FileText, 
  Send, 
  Tag, 
  CreditCard,
  X 
} from 'lucide-react';
import type { Product, Cliente } from '../../../types/erp.types';
import { SupervisorPinModal, type SupervisorAuthResult } from './SupervisorPinModal';
import { useEmployeeStore, type Empleado } from '../../../store/useEmployeeStore';

export interface MultivendorCartItem {
  id?: string;
  product: Product;
  cantidad: number | string;
  precioOverride?: number;
  descuentoPct?: number;
  descuentoMonto?: number;
  notas?: string;
}

export interface POSMultivendorCartProps {
  items: MultivendorCartItem[];
  onUpdateQuantity: (index: number, delta: number) => void;
  onSetQuantity?: (index: number, quantity: number) => void;
  onUpdatePrice?: (index: number, newPrice: number) => void;
  onUpdateDiscount?: (index: number, discountPct: number) => void;
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

  // Props Hito M2: Descuento Global
  descuentoGlobalTipo?: 'porcentaje' | 'monto';
  descuentoGlobalValor?: number;
  currentDiscountTipo?: 'porcentaje' | 'monto';
  currentDiscountValor?: number;
  onApplyGlobalDiscount?: (tipo: 'porcentaje' | 'monto', valor: number) => void;
  onRemoveGlobalDiscount?: () => void;
  isDiscountOpen?: boolean;
  onToggleDiscountOpen?: (isOpen: boolean) => void;

  // Props Hito M5: Validación Comercial y Supervisor
  onSupervisorModalChange?: (isOpen: boolean) => void;
}

export const POSMultivendorCart: React.FC<POSMultivendorCartProps> = ({
  items,
  onUpdateQuantity,
  onSetQuantity,
  onUpdatePrice,
  onUpdateDiscount,
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
  descuentoGlobalTipo,
  descuentoGlobalValor,
  currentDiscountTipo: propCurrentDiscountTipo,
  currentDiscountValor: propCurrentDiscountValor,
  onApplyGlobalDiscount,
  onRemoveGlobalDiscount,
  isDiscountOpen: externalIsDiscountOpen,
  onToggleDiscountOpen,
  onSupervisorModalChange,
}) => {
  // Estado local para popover de descuento global
  const [internalDiscountOpen, setInternalDiscountOpen] = useState(false);
  const isDiscountOpen = externalIsDiscountOpen !== undefined ? externalIsDiscountOpen : internalDiscountOpen;
  const setIsDiscountOpen = (open: boolean) => {
    if (onToggleDiscountOpen) {
      onToggleDiscountOpen(open);
    } else {
      setInternalDiscountOpen(open);
    }
  };

  const currentDiscountTipo = propCurrentDiscountTipo || descuentoGlobalTipo || 'porcentaje';
  const currentDiscountValor = propCurrentDiscountValor !== undefined ? propCurrentDiscountValor : (descuentoGlobalValor !== undefined ? descuentoGlobalValor : 0);

  const [localTipo, setLocalTipo] = useState<'porcentaje' | 'monto'>('porcentaje');
  const [localValor, setLocalValor] = useState<number | ''>('');
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleToggleDiscountPopover = () => {
    if (items.length === 0) return;
    if (!isDiscountOpen) {
      setLocalTipo(currentDiscountTipo);
      setLocalValor(currentDiscountValor > 0 ? currentDiscountValor : '');
    }
    setIsDiscountOpen(!isDiscountOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('#btn-descuento-global-f4')
      ) {
        setIsDiscountOpen(false);
      }
    };

    if (isDiscountOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDiscountOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDiscountOpen) {
        setIsDiscountOpen(false);
      } else if (e.key === 'F4' && items.length > 0) {
        e.preventDefault();
        handleToggleDiscountPopover();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDiscountOpen, items.length, currentDiscountTipo, currentDiscountValor]);

  const handleCustomValueChange = (valStr: string) => {
    if (valStr === '') {
      setLocalValor('');
      return;
    }
    const num = Math.max(0, Number(valStr) || 0);
    setLocalValor(num);
  };

  // Estado Hito M5: Validación Comercial y Modal de Supervisor
  const [editingPriceMap, setEditingPriceMap] = useState<Record<number, string>>({});
  const [activeDiscountRowIndex, setActiveDiscountRowIndex] = useState<number | null>(null);
  const [supervisorModal, setSupervisorModal] = useState<{
    isOpen: boolean;
    accion: string;
    descripcion: string;
    tipo: 'precio' | 'descuento_linea' | 'descuento_global';
    itemIndex?: number;
    valorPropuesto: number;
    valorAnterior: number;
    tipoGlobal?: 'porcentaje' | 'monto';
  }>({
    isOpen: false,
    accion: '',
    descripcion: '',
    tipo: 'precio',
    valorPropuesto: 0,
    valorAnterior: 0,
  });

  const empleados = useEmployeeStore((s) => s.empleados) as Empleado[] || [];
  const hasSupervisorsConfigured = (empleados || []).some((e) => {
    const rolUpper = (e.rolAcceso || '').toUpperCase();
    const cargoLower = (e.cargo || '').toLowerCase();
    return (
      rolUpper === 'ADMINISTRADOR' ||
      rolUpper === 'GERENTE' ||
      cargoLower.includes('supervisor') ||
      cargoLower.includes('administrador') ||
      cargoLower.includes('gerente') ||
      cargoLower.includes('jefe')
    );
  });

  const getBaseCost = (item: MultivendorCartItem) => {
    const p = item.product;
    return p.costo_promedio_ponderado || p.costo_ultima_compra || p.precio_compra || (p as any).costo || 0;
  };

  const handleApplyDiscount = () => {
    const numVal = Number(localValor) || 0;
    if (numVal <= 0) {
      if (onRemoveGlobalDiscount) {
        onRemoveGlobalDiscount();
      }
      setIsDiscountOpen(false);
      return;
    }

    let finalValor = numVal;
    if (localTipo === 'porcentaje') {
      finalValor = Math.min(100, numVal);
    } else {
      finalValor = Math.min(subtotal, numVal);
    }

    const pctEquivalente =
      localTipo === 'porcentaje'
        ? finalValor
        : subtotal > 0
        ? (finalValor / subtotal) * 100
        : 0;

    if (hasSupervisorsConfigured && pctEquivalente > 10) {
      setSupervisorModal({
        isOpen: true,
        accion: 'AUTORIZAR_DESCUENTO_GLOBAL',
        descripcion: `El descuento global propuesto (${
          localTipo === 'porcentaje' ? `${finalValor}%` : `$${finalValor.toLocaleString('es-CO')}`
        }) supera el 10% permitido al asesor. Requiere autorización de supervisor.`,
        tipo: 'descuento_global',
        valorPropuesto: finalValor,
        valorAnterior: currentDiscountValor || 0,
        tipoGlobal: localTipo,
      });
      onSupervisorModalChange?.(true);
      setIsDiscountOpen(false);
      return;
    }

    if (onApplyGlobalDiscount) {
      onApplyGlobalDiscount(localTipo, finalValor);
    }
    setIsDiscountOpen(false);
  };

  const handleRemoveDiscount = () => {
    setLocalValor('');
    if (onRemoveGlobalDiscount) {
      onRemoveGlobalDiscount();
    }
    setIsDiscountOpen(false);
  };
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

  const handleQtyChange = (index: number, rawVal: string) => {
    const val = parseFloat(rawVal);
    if (!isNaN(val)) {
      if (onSetQuantity) {
        onSetQuantity(index, val);
      } else {
        const currentQty = Number(items[index]?.cantidad) || 0;
        onUpdateQuantity(index, val - currentQty);
      }
    }
  };

  const handlePriceChange = (index: number, rawVal: string) => {
    setEditingPriceMap((prev) => ({ ...prev, [index]: rawVal }));
    const val = parseFloat(rawVal);
    if (isNaN(val)) return;

    const item = items[index];
    if (!item) return;

    const baseCost = getBaseCost(item);
    const minAllowedPrice = Math.round(baseCost * 1.15);

    // Si no hay supervisores configurados, o el precio respeta el margen mínimo (>= costo * 1.15) o no tiene costo base, se propaga directo
    if (!hasSupervisorsConfigured || baseCost <= 0 || val >= minAllowedPrice) {
      if (onUpdatePrice) {
        onUpdatePrice(index, val);
      }
    }
  };

  const handlePriceBlur = (index: number, rawVal: string) => {
    const val = parseFloat(rawVal);
    const item = items[index];
    if (!item) return;

    const currentPrice = getProductPrice(item);
    if (isNaN(val) || val <= 0) {
      setEditingPriceMap((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
      return;
    }

    const baseCost = getBaseCost(item);
    const minAllowedPrice = Math.round(baseCost * 1.15);

    if (hasSupervisorsConfigured && baseCost > 0 && val < minAllowedPrice) {
      // Infracción de margen comercial: se requiere autorización de supervisor
      setSupervisorModal({
        isOpen: true,
        accion: 'AUTORIZAR_PRECIO_BAJO_MARGEN',
        descripcion: `El precio propuesto ($${val.toLocaleString('es-CO')}) deja un margen inferior al 15% sobre el costo base ($${baseCost.toLocaleString('es-CO')}) para "${getProductName(item.product)}". Requiere autorización de supervisor.`,
        tipo: 'precio',
        itemIndex: index,
        valorPropuesto: val,
        valorAnterior: currentPrice,
      });
      onSupervisorModalChange?.(true);
    } else {
      setEditingPriceMap((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
      if (onUpdatePrice) {
        onUpdatePrice(index, val);
      }
    }
  };

  const handleDiscountClick = (index: number) => {
    const item = items[index];
    const currentDiscount = item?.descuentoPct || 0;
    if (onUpdateDiscount) {
      onUpdateDiscount(index, currentDiscount);
    }
    setActiveDiscountRowIndex((prev) => (prev === index ? null : index));
  };

  const handleLineDiscountBlur = (index: number, rawVal: string) => {
    const val = Math.max(0, Math.min(100, parseFloat(rawVal) || 0));
    const item = items[index];
    if (!item) return;

    const currentDiscount = item.descuentoPct || 0;
    if (val === currentDiscount) {
      setActiveDiscountRowIndex(null);
      return;
    }

    if (hasSupervisorsConfigured && val > 10) {
      // Exigir PIN de supervisor para descuento mayor al 10%
      setSupervisorModal({
        isOpen: true,
        accion: 'AUTORIZAR_DESCUENTO_LINEA',
        descripcion: `El descuento propuesto (${val}%) supera el 10% permitido al asesor para "${getProductName(item.product)}". Requiere autorización de supervisor.`,
        tipo: 'descuento_linea',
        itemIndex: index,
        valorPropuesto: val,
        valorAnterior: currentDiscount,
      });
      onSupervisorModalChange?.(true);
      setActiveDiscountRowIndex(null);
    } else {
      setActiveDiscountRowIndex(null);
      if (onUpdateDiscount) {
        onUpdateDiscount(index, val);
      }
    }
  };

  const handleSupervisorAuthorized = (result: SupervisorAuthResult) => {
    if (supervisorModal.tipo === 'precio' && supervisorModal.itemIndex !== undefined) {
      setEditingPriceMap((prev) => {
        const next = { ...prev };
        delete next[supervisorModal.itemIndex!];
        return next;
      });
      if (onUpdatePrice) {
        onUpdatePrice(supervisorModal.itemIndex, supervisorModal.valorPropuesto);
      }
    } else if (supervisorModal.tipo === 'descuento_linea' && supervisorModal.itemIndex !== undefined) {
      if (onUpdateDiscount) {
        onUpdateDiscount(supervisorModal.itemIndex, supervisorModal.valorPropuesto);
      }
    } else if (supervisorModal.tipo === 'descuento_global' && supervisorModal.tipoGlobal) {
      if (onApplyGlobalDiscount) {
        onApplyGlobalDiscount(supervisorModal.tipoGlobal, supervisorModal.valorPropuesto);
      }
    }

    setSupervisorModal((prev) => ({ ...prev, isOpen: false }));
    onSupervisorModalChange?.(false);
  };

  const handleSupervisorCancel = () => {
    if (supervisorModal.tipo === 'precio' && supervisorModal.itemIndex !== undefined) {
      setEditingPriceMap((prev) => {
        const next = { ...prev };
        delete next[supervisorModal.itemIndex!];
        return next;
      });
    }

    setSupervisorModal((prev) => ({ ...prev, isOpen: false }));
    onSupervisorModalChange?.(false);
  };

  return (
    <aside 
      data-testid="pos-multivendor-cart"
      className="flex-1 lg:flex-none min-w-0 max-w-full w-80 sm:w-96 md:w-[380px] lg:w-[420px] bg-white flex flex-col h-full min-h-0 border-l border-slate-200 select-none shrink-0 shadow-lg z-10"
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
              Asesor: <strong className="text-slate-600">Asesor {activeVendorName}</strong>
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
              tabIndex={-1}
              onClick={onClearCart}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Vaciar carrito actual"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* 2. LISTA DE ÍTEMS (85% Altura Vertical de Productos con scroll independiente) */}
      <div 
        data-testid="pos-cart-items-list"
        className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5"
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
            const unitPrice = editingPriceMap[index] !== undefined ? editingPriceMap[index] : getProductPrice(item);
            const numericUnitPrice = typeof unitPrice === 'number' ? unitPrice : (parseFloat(unitPrice) || 0);
            const unit = getProductUnit(item.product);
            const qty = Number(item.cantidad) || 0;
            const discountPct = Number(item.descuentoPct) || 0;
            const effectivePrice = discountPct > 0 ? numericUnitPrice * (1 - discountPct / 100) : numericUnitPrice;
            const lineSubtotal = Math.round(effectivePrice * qty);

            return (
              <div 
                key={item.id || `${item.product.id}_${index}`}
                data-testid={`cart-row-${index}`}
                className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-100 transition-all flex flex-col gap-1.5 shadow-xs"
              >
                {/* Nivel 1: Nombre en texto oscuro de alto contraste, Micro-botón [+ Desc] y Botón Eliminar */}
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <h4 
                    className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 leading-snug flex-1 min-w-0 truncate"
                    title={name}
                  >
                    {name}
                  </h4>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Micro-botón [+ Desc] */}
                    <button
                      type="button"
                      data-testid={`btn-cart-desc-${index}`}
                      tabIndex={-1}
                      onClick={() => handleDiscountClick(index)}
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                        discountPct > 0 
                          ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100' 
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700'
                      }`}
                      title={discountPct > 0 ? `Descuento: ${discountPct}%. Clic para editar.` : 'Aplicar descuento por ítem'}
                    >
                      <Tag size={11} className={discountPct > 0 ? 'text-amber-600' : 'text-slate-400'} />
                      <span>{discountPct > 0 ? `-${discountPct}%` : '+ Desc'}</span>
                    </button>

                    {/* Botón eliminar con data-testid y tabIndex=-1 */}
                    <button
                      type="button"
                      data-testid={`btn-cart-remove-${index}`}
                      tabIndex={-1}
                      onClick={() => onRemoveItem(index)}
                      className="p-1 text-slate-300 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                      title="Eliminar producto"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Mini-panel inline de descuento por ítem (Hito M5) */}
                {activeDiscountRowIndex === index && (
                  <div className="flex items-center gap-1.5 p-1.5 bg-amber-50 rounded-lg border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-800">Desc %:</span>
                    <input
                      type="number"
                      data-testid={`cart-item-discount-input-${index}`}
                      min="0"
                      max="100"
                      defaultValue={item.descuentoPct || ''}
                      placeholder="%"
                      autoFocus
                      onBlur={(e) => handleLineDiscountBlur(index, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleLineDiscountBlur(index, (e.target as HTMLInputElement).value);
                        } else if (e.key === 'Escape') {
                          setActiveDiscountRowIndex(null);
                        }
                      }}
                      className="w-14 h-7 px-1.5 text-center font-mono font-bold text-xs bg-white border border-amber-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-900"
                    />
                    <div className="flex items-center gap-1">
                      {[5, 10, 15, 20].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleLineDiscountBlur(index, String(preset))}
                          className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 cursor-pointer"
                        >
                          {preset}%
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleLineDiscountBlur(index, '0')}
                        className="px-1 text-[9px] text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="Quitar descuento"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Nivel 2: Stepper con Input Cantidad + Input Precio Unitario + Subtotal */}
                <div className="flex items-center justify-between gap-1.5 pt-0.5">
                  {/* Stepper Cantidad con Input Directo y Span retrocompatible */}
                  <div className="flex items-center bg-slate-100 rounded-lg border border-slate-200 overflow-hidden">
                    <button
                      type="button"
                      data-testid={`btn-cart-dec-${index}`}
                      tabIndex={-1}
                      onClick={() => onUpdateQuantity(index, -1)}
                      className="min-h-[36px] min-w-[32px] sm:min-h-[40px] sm:min-w-[36px] flex items-center justify-center hover:bg-slate-200 text-slate-700 font-bold active:scale-90 transition-all cursor-pointer"
                      title="Disminuir cantidad"
                    >
                      <Minus size={13} className="stroke-[2.5]" />
                    </button>

                    {/* Input Cantidad con auto-selección en foco y Tab continuo */}
                    <input
                      type="number"
                      data-testid={`cart-qty-input-${index}`}
                      tabIndex={index * 2 + 1}
                      value={item.cantidad}
                      onChange={(e) => handleQtyChange(index, e.target.value)}
                      onFocus={(e) => e.target.select()}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      step={unit.toLowerCase() === 'kg' ? 'any' : '1'}
                      min={unit.toLowerCase() === 'kg' ? '0.001' : '1'}
                      className="w-12 sm:w-14 h-8 sm:h-9 text-center font-mono font-bold text-xs sm:text-sm bg-white border-x border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900"
                      title="Cantidad / Peso"
                      aria-label={`Cantidad de ${name}`}
                    />

                    {/* Span retrocompatible para suites existentes */}
                    <span 
                      data-testid={`cart-qty-${index}`}
                      className="sr-only"
                    >
                      {qty}
                    </span>

                    <button
                      type="button"
                      data-testid={`btn-cart-inc-${index}`}
                      tabIndex={-1}
                      onClick={() => onUpdateQuantity(index, 1)}
                      className="min-h-[36px] min-w-[32px] sm:min-h-[40px] sm:min-w-[36px] flex items-center justify-center hover:bg-slate-200 text-slate-700 font-bold active:scale-90 transition-all cursor-pointer"
                      title="Aumentar cantidad"
                    >
                      <Plus size={13} className="stroke-[2.5]" />
                    </button>
                  </div>

                  {/* Input Precio Unitario Editable con auto-selección en foco y Tab continuo */}
                  <div className="flex items-center gap-1">
                    <div className="relative flex items-center">
                      <span className="absolute left-1.5 text-[11px] font-mono text-slate-400 select-none">$</span>
                      <input
                        type="number"
                        data-testid={`cart-unit-price-input-${index}`}
                        tabIndex={index * 2 + 2}
                        value={unitPrice}
                        onChange={(e) => handlePriceChange(index, e.target.value)}
                        onBlur={(e) => handlePriceBlur(index, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handlePriceBlur(index, (e.target as HTMLInputElement).value);
                          }
                        }}
                        onFocus={(e) => e.target.select()}
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                        step="any"
                        min="0"
                        className="w-16 sm:w-20 h-8 sm:h-9 pl-4 pr-1 text-right font-mono font-bold text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900"
                        title="Precio unitario"
                        aria-label={`Precio unitario de ${name}`}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">/{unit}</span>
                  </div>

                  {/* Subtotal de Línea */}
                  <span className="font-mono font-black text-xs sm:text-sm text-emerald-700 text-right min-w-[65px] shrink-0">
                    ${lineSubtotal.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 3. FOOTER FIJO INFERIOR CON ACCIÓN DE COMANDA / COBRO */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 shrink-0 mt-auto space-y-2">
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

        {/* Resumen Financiero con Botón Permanente F4 y Desglose */}
        <div className="space-y-1.5 py-1">
          {/* Fila 1: Subtotal */}
          <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
            <span>Subtotal ({totalItemsCount} uds):</span>
            <span className="font-mono font-bold text-slate-700">${subtotal.toLocaleString('es-CO')}</span>
          </div>

          {/* Fila 2: Botón Permanente Anclado + Descuento (F4) con Popover Flotante */}
          <div className="relative">
            <button
              type="button"
              id="btn-descuento-global-f4"
              data-testid="btn-descuento-global-f4"
              disabled={items.length === 0}
              onClick={handleToggleDiscountPopover}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                items.length === 0
                  ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                  : currentDiscountValor > 0
                  ? 'border-amber-300 bg-amber-100/80 text-amber-900 hover:bg-amber-100 shadow-xs'
                  : 'border-dashed border-amber-300 bg-amber-50/70 text-amber-800 hover:bg-amber-100/80'
              }`}
              title={items.length === 0 ? 'Agrega productos para aplicar descuento' : 'Aplicar o editar descuento global de comanda (Atajo: F4)'}
            >
              <div className="flex items-center gap-1.5">
                <Tag size={13} className={currentDiscountValor > 0 ? 'text-amber-700' : 'text-amber-600'} />
                <span>+ Descuento (F4)</span>
              </div>
              {currentDiscountValor > 0 ? (
                <span className="font-mono text-[10px] bg-amber-200/90 text-amber-950 px-1.5 py-0.5 rounded font-black">
                  {currentDiscountTipo === 'porcentaje' ? `-${currentDiscountValor}%` : `-$${currentDiscountValor.toLocaleString('es-CO')}`}
                </span>
              ) : (
                <span className="text-[10px] text-amber-600 font-medium">
                  {items.length === 0 ? 'Inactivo' : 'Comanda'}
                </span>
              )}
            </button>

            {/* Popover Flotante Reactivo (No afecta la altura del footer) */}
            {isDiscountOpen && (
              <div 
                ref={popoverRef}
                data-testid="pos-discount-popover"
                className="absolute bottom-full left-0 right-0 mb-2 z-30 bg-white border border-slate-200 shadow-2xl rounded-xl p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-150"
              >
                {/* Cabecera del Popover */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                    <Tag size={14} className="text-amber-600" />
                    <span>Descuento de Comanda</span>
                    <kbd className="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 px-1 py-0.5 rounded font-mono">F4</kbd>
                  </div>
                  <button
                    type="button"
                    data-testid="btn-cerrar-popover-descuento"
                    onClick={() => setIsDiscountOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Alternador de Modo: [%] vs [$] */}
                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    data-testid="btn-modo-porcentaje"
                    onClick={() => setLocalTipo('porcentaje')}
                    className={`py-1 text-xs font-bold rounded-md transition-all ${
                      localTipo === 'porcentaje'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    % Porcentaje
                  </button>
                  <button
                    type="button"
                    data-testid="btn-modo-monto"
                    onClick={() => setLocalTipo('monto')}
                    className={`py-1 text-xs font-bold rounded-md transition-all ${
                      localTipo === 'monto'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    $ Monto Fijo
                  </button>
                </div>

                {/* Chips de Presets Rápidos */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Presets Rápidos
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {localTipo === 'porcentaje' ? (
                      <>
                        <button
                          type="button"
                          data-testid="btn-preset-desc-5"
                          onClick={() => setLocalValor(5)}
                          className={`py-1 px-1.5 text-xs font-mono font-bold rounded-md border transition-all ${
                            localValor === 5
                              ? 'bg-amber-100 border-amber-400 text-amber-900'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          5%
                        </button>
                        <button
                          type="button"
                          data-testid="btn-preset-desc-10"
                          onClick={() => setLocalValor(10)}
                          className={`py-1 px-1.5 text-xs font-mono font-bold rounded-md border transition-all ${
                            localValor === 10
                              ? 'bg-amber-100 border-amber-400 text-amber-900'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          10%
                        </button>
                        <button
                          type="button"
                          data-testid="btn-preset-desc-15"
                          onClick={() => setLocalValor(15)}
                          className={`py-1 px-1.5 text-xs font-mono font-bold rounded-md border transition-all ${
                            localValor === 15
                              ? 'bg-amber-100 border-amber-400 text-amber-900'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          15%
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          data-testid="btn-preset-desc-2000"
                          onClick={() => setLocalValor(2000)}
                          className={`py-1 px-1.5 text-xs font-mono font-bold rounded-md border transition-all ${
                            localValor === 2000
                              ? 'bg-amber-100 border-amber-400 text-amber-900'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          $2.000
                        </button>
                        <button
                          type="button"
                          data-testid="btn-preset-desc-5000"
                          onClick={() => setLocalValor(5000)}
                          className={`py-1 px-1.5 text-xs font-mono font-bold rounded-md border transition-all ${
                            localValor === 5000
                              ? 'bg-amber-100 border-amber-400 text-amber-900'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          $5.000
                        </button>
                        <button
                          type="button"
                          data-testid="btn-preset-desc-10000"
                          onClick={() => setLocalValor(10000)}
                          className={`py-1 px-1.5 text-xs font-mono font-bold rounded-md border transition-all ${
                            localValor === 10000
                              ? 'bg-amber-100 border-amber-400 text-amber-900'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          $10.000
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Input Numérico Manual */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Valor Personalizado
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {localTipo === 'porcentaje' ? 'Máx 100%' : `Máx $${subtotal.toLocaleString('es-CO')}`}
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <span className="absolute left-2.5 text-xs font-mono font-bold text-slate-400 select-none">
                      {localTipo === 'porcentaje' ? '%' : '$'}
                    </span>
                    <input
                      type="number"
                      data-testid="input-descuento-global-valor"
                      value={localValor === '' ? '' : localValor}
                      onChange={(e) => handleCustomValueChange(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      min="0"
                      max={localTipo === 'porcentaje' ? 100 : subtotal}
                      step={localTipo === 'porcentaje' ? '1' : '500'}
                      placeholder="0"
                      className="w-full h-9 pl-7 pr-3 text-right font-mono font-bold text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
                    />
                  </div>
                </div>

                {/* Botonera de Acciones (Remover / Aplicar) */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  {(currentDiscountValor > 0 || descuento > 0) && (
                    <button
                      type="button"
                      data-testid="btn-remover-descuento-global"
                      onClick={handleRemoveDiscount}
                      className="flex-1 py-2 px-2.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Remover
                    </button>
                  )}
                  <button
                    type="button"
                    data-testid="btn-aplicar-descuento-global"
                    onClick={handleApplyDiscount}
                    className="flex-1 py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-black text-xs shadow-md shadow-amber-600/20 active:scale-98 transition-all cursor-pointer"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Fila 3: Desglose Visual de Descuento Comanda */}
          {(descuento > 0 || currentDiscountValor > 0) && (
            <div 
              data-testid="cart-discount-breakdown-row"
              className="flex justify-between items-center text-xs bg-amber-50/90 border border-amber-200/80 px-2.5 py-1 rounded-lg"
            >
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-amber-900">Descuento aplicado:</span>
                <span 
                  data-testid="badge-descuento-global"
                  className="px-1.5 py-0.5 rounded bg-amber-200 text-amber-950 text-[10px] font-black tracking-tight font-mono"
                >
                  {currentDiscountValor > 0 
                    ? (currentDiscountTipo === 'porcentaje'
                        ? `-${currentDiscountValor}%`
                        : `-$${currentDiscountValor.toLocaleString('es-CO')}`)
                    : `-$${descuento.toLocaleString('es-CO')}`}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-amber-800">
                  -${descuento.toLocaleString('es-CO')}
                </span>
                <button
                  type="button"
                  data-testid="btn-quick-remove-discount"
                  onClick={handleRemoveDiscount}
                  className="p-0.5 text-amber-500 hover:text-amber-800 hover:bg-amber-200/60 rounded transition-colors cursor-pointer"
                  title="Quitar descuento de comanda"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          )}

          {/* Fila 4: Total a Pagar */}
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

      {/* 4. MODAL DE AUTORIZACIÓN CON PIN DE SUPERVISOR (Hito M5) */}
      {supervisorModal.isOpen && (
        <SupervisorPinModal
          isOpen={supervisorModal.isOpen}
          onClose={handleSupervisorCancel}
          accion={supervisorModal.accion}
          descripcion={supervisorModal.descripcion}
          onAuthorized={handleSupervisorAuthorized}
        />
      )}
    </aside>
  );
};
