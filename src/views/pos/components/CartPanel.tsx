import React, { useState, useEffect } from 'react';
import { Check, X, Plus, PauseCircle, Clock, Trash2, Archive } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { LineaVenta, CartDraft } from '../../../types/pos.types';
import type { ClientePOS } from '../../../hooks/usePOSCart';
import { PosDraftService } from '../../../services/posDraftService';
import { LineaVentaRow } from './LineaVentaRow';
import { DiscountPanel } from './DiscountPanel';
import { PaymentPanel, type MetodoCobroPos } from './PaymentPanel';
import { ParkedOrdersBar } from './ParkedOrdersBar';
import { OnScreenKeypadModal } from './OnScreenKeypadModal';
import { GlassCard } from '../../../components/layout/components/GlassCard';
import { useAuthStore } from '../../../store/useAuthStore';
import { useAppStore } from '../../../store/useAppStore';
import Swal from 'sweetalert2';

interface CartPanelProps {
  // Datos del carrito
  lineas: LineaVenta[];
    cliente: ClientePOS | null;
  descuentoGlobalPct: number;
  descuentoGlobalValor: number;
  totales: {
    subtotal: number;
    descuento: number;
    totalFinal: number;
    totalIva?: number;
    subtotalBaseGravable?: number;
  };
  drafts: CartDraft[];
  activeDraftId: string | null;

  stock: any;
  bodegaActivaId: string;
  bodegaActivaNombre: string;
  lastClientPrices: Record<string, Record<string, number>>;

  // Callbacks de escritura al carrito
  onUpdateCantidad: (productoId: string, cantidad: number) => void;
  onUpdateDescuentoLinea: (productoId: string, pct: number) => void;
  onRemoveLinea: (productoId: string) => void;
  onWeightRead: (productoId: string, peso: number) => void;
  onLimpiarCarrito: () => void;
  onSetLineas: (lineas: LineaVenta[]) => void;
  onUpdatePrecio?: (productoId: string, precio: number) => void;
  onResetItemPrice?: (productoId: string) => void;

  // Callbacks de interacción UI
  onSelectCliente: () => void;
  onClearCliente: () => void;
  onDescuentoClick: () => void;
  onPagar: (pagos: { metodo: MetodoCobroPos; monto: number }[], options?: { requiereFacturaElectronica?: boolean }) => Promise<any> | void;
  onGuardarBorrador: () => void;
  onSetActiveDraftId: (id: string | null) => void;
  onSetDrafts: (fn: (prev: any[]) => any[]) => void;
  onSetDescuentoGlobal: (val: number) => void;

  // Props de caja
  isTurnoAbierto: boolean;
  onAbrirTurnoRequest?: () => void;
  onCerrarTurnoClick?: () => void;
  saldoEfectivoGaveta?: number;
  topeMaximoGaveta?: number;
  onRetiroParcialRequest?: () => void;
  isAsesorMostrador?: boolean;
}

export const CartPanel: React.FC<CartPanelProps> = ({
  lineas,
  cliente,
  descuentoGlobalPct,
  descuentoGlobalValor,
  totales,
  drafts,
  activeDraftId,
  stock,
  bodegaActivaId,
  bodegaActivaNombre,
  lastClientPrices,
  onUpdateCantidad,
  onUpdateDescuentoLinea,
  onRemoveLinea,
  onWeightRead,
  onSetLineas,
  onSelectCliente,
  onClearCliente,
  onDescuentoClick,
  onPagar,
  onGuardarBorrador,
  onSetActiveDraftId,
  onSetDrafts,
  onSetDescuentoGlobal,
  onLimpiarCarrito,
  onUpdatePrecio,
  onResetItemPrice,
  isTurnoAbierto,
  onAbrirTurnoRequest,
  onCerrarTurnoClick,
  saldoEfectivoGaveta,
  topeMaximoGaveta,
  onRetiroParcialRequest,
  isAsesorMostrador,
}) => {
  const activeTenant = useAuthStore((s) => s.activeTenant);
  const currentUser = useAppStore((s) => s.currentUser);
  const userRole = useAppStore((s) => s.userRole);

  const isMostradorAuto =
    isAsesorMostrador !== undefined
      ? isAsesorMostrador
      : Boolean(activeTenant?.id === 'tenant-03' ||
         activeTenant?.razonSocial?.toLowerCase().includes('josase') ||
         userRole === 'vendedor' ||
         currentUser?.cargo?.toLowerCase().includes('mostrador'));
  const [isBouncing, setIsBouncing] = useState(false);
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [isConfirmComandaOpen, setIsConfirmComandaOpen] = useState(false);
  const totalItems = lineas.reduce((sum, l) => sum + Number(l.cantidad), 0);

  useEffect(() => {
    if (totalItems <= 0) return;
    setIsBouncing(true);
    const timer = setTimeout(() => setIsBouncing(false), 300);
    return () => clearTimeout(timer);
  }, [totalItems]);

  const [keypadLinea, setKeypadLinea] = useState<LineaVenta | null>(null);

  // Helpers para resolver datos por fila dentro del .map()
  const getStockDisponible = (sku: string): number => {
    const targetWarehouseKey = stock[bodegaActivaId] ? bodegaActivaId : bodegaActivaNombre;
    return stock[targetWarehouseKey]?.[sku] || 0;
  };

  const getLastClientPrice = (sku: string): number | undefined => {
    if (!cliente) return undefined;
    const clientKey = (cliente.identificacion || cliente.nombre).trim().toLowerCase();
    return lastClientPrices[clientKey]?.[sku];
  };

  const handleAplicarPrecioHistorico = (productoId: string, precio: number) => {
    const linea = lineas.find((l) => l.productoId === productoId);
    if (!linea) return;

    // Regla de Obsequios
    if (precio === 0) {
      if (totales.subtotal < 20000) {
        Swal.fire({ title: 'Obsequio Denegado', text: 'El subtotal del carrito debe ser mayor a $20,000.', icon: 'error', confirmButtonColor: 'var(--primary-color)' });
        return;
      }
      const countGifts = lineas.filter(l => l.productoId !== productoId && l.precioFinal === 0).length;
      if (countGifts >= 1) {
        Swal.fire({ title: 'Obsequio Denegado', text: 'Solo se permite 1 obsequio por transacción.', icon: 'error', confirmButtonColor: 'var(--primary-color)' });
        return;
      }
    } 
    // Guardia de Rentabilidad
    else if (precio < linea.precioCompra) {
      Swal.fire({ title: 'Rentabilidad Comprometida', text: `El precio histórico ($${precio}) es menor al costo de compra actual ($${linea.precioCompra}).`, icon: 'error', confirmButtonColor: 'var(--primary-color)' });
      return;
    }

    onSetLineas(
      lineas.map((l) =>
        l.productoId === productoId
          ? {
              ...l,
              precioFinal: precio,
              totalLinea: l.cantidad * precio,
              descuentoPct: Math.round(((l.precioLista - precio) / l.precioLista) * 100),
            }
          : l
      )
    );
  };

  const handleUpdateDescuentoLineaWrapper = (productoId: string, pct: number) => {
    const linea = lineas.find((l) => l.productoId === productoId);
    if (!linea) return;

    const precioFinalCalculado = linea.precioLista * (1 - pct / 100);

    // Regla de Obsequios
    if (pct === 100 || precioFinalCalculado === 0) {
      if (totales.subtotal < 20000) {
        Swal.fire({ title: 'Obsequio Denegado', text: 'El subtotal del carrito debe ser mayor a $20,000.', icon: 'error', confirmButtonColor: 'var(--primary-color)' });
        return;
      }
      const countGifts = lineas.filter(l => l.productoId !== productoId && l.precioFinal === 0).length;
      if (countGifts >= 1) {
        Swal.fire({ title: 'Obsequio Denegado', text: 'Solo se permite 1 obsequio por transacción.', icon: 'error', confirmButtonColor: 'var(--primary-color)' });
        return;
      }
    } 
    // Guardia de Rentabilidad
    else if (precioFinalCalculado < linea.precioCompra) {
      Swal.fire({ title: 'Rentabilidad Comprometida', text: `El precio final ($${precioFinalCalculado}) no puede ser menor al costo de compra ($${linea.precioCompra}).`, icon: 'error', confirmButtonColor: 'var(--primary-color)' });
      return;
    }

    onUpdateDescuentoLinea(productoId, pct);
  };

  const handleResetPrecio = (productoId: string) => {
    handleUpdateDescuentoLineaWrapper(productoId, 0);
  };

  const handleOpenBorradores = () => {
    if (drafts.length === 0) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: 'No hay pedidos en espera',
        text: 'Puedes poner compras en espera con el botón "En Espera" (F6).',
        showConfirmButton: false,
        timer: 2000,
      });
      return;
    }

    let html = `
      <div style="display:flex; flex-direction:column; gap:10px; max-height:360px; overflow-y:auto; padding:4px 2px; text-align:left;">
    `;

    drafts.forEach((d) => {
      const isSelected = activeDraftId === d.id;
      const alias = d.alias || (d.cliente ? d.cliente.nombre : 'Consumidor Final');
      const itemsCount = (d.lineas ? d.lineas.length : (d.cart ? d.cart.length : 0));
      const formattedTotal = Number(d.total ?? d.totalFinal ?? 0).toLocaleString('es-CO');
      const timeStr = new Date(d.fechaGuardado || d.fecha || new Date()).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

      html += `
        <div style="display:flex; align-items:stretch; background: #0f172a; border: 1px solid ${isSelected ? '#0ea5e9' : 'rgba(255,255,255,0.12)'}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);">
          <div style="flex: 1; padding: 12px 14px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 4px;">
              <span style="font-weight: 800; font-size: 14px; color: #f8fafc; letter-spacing: -0.2px;">${alias}</span>
              <span style="font-size: 10px; font-family: monospace; color: #94a3b8; background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 4px;">⏰ ${timeStr}</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top: 6px;">
              <span style="font-size: 12px; color: #94a3b8;">${itemsCount} productos</span>
              <span style="font-size: 16px; font-weight: 800; color: #38bdf8; font-family: monospace;">$${formattedTotal}</span>
            </div>
          </div>
          <div style="display:flex; flex-direction:column; border-left: 1px solid rgba(255,255,255,0.1);">
            <button 
              id="draft-select-${d.id}" 
              title="Recuperar Pedido al Carrito" 
              style="flex: 1; min-height: 44px; padding: 0 16px; background: rgba(16, 185, 129, 0.15); border: none; cursor: pointer; color: #34d399; font-weight: bold; font-size: 12px; display: flex; align-items: center; gap: 4px; transition: background 0.2s;"
            >
              <span>Recuperar</span>
            </button>
            <button 
              id="draft-delete-${d.id}" 
              title="Descartar Pedido en Espera" 
              style="height: 38px; padding: 0 16px; background: rgba(239, 68, 68, 0.1); border: none; border-top: 1px solid rgba(255,255,255,0.08); cursor: pointer; color: #f87171; display: flex; align-items: center; justify-content: center; transition: background 0.2s;"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
      `;
    });

    html += '</div>';

    Swal.fire({
      title: 'Pedidos en Espera (Borradores)',
      html,
      background: '#090d16',
      color: '#f8fafc',
      showConfirmButton: false,
      showCloseButton: true,
      customClass: {
        container: 'z-50 isolate',
        popup: 'border border-white/10 rounded-2xl shadow-2xl',
      },
      didOpen: () => {
        drafts.forEach((d) => {
          const selectBtn = document.getElementById(`draft-select-${d.id}`);
          if (selectBtn) {
            selectBtn.onclick = async () => {
              // 1. Si el carrito actual tiene productos, ofrecer resguardarlo
              if (lineas.length > 0) {
                const promptRes = await Swal.fire({
                  title: '¿Guardar Carrito Actual?',
                  text: 'Actualmente hay productos en mostrador. ¿Deseas ponerlos en espera para no perderlos?',
                  icon: 'question',
                  showCancelButton: true,
                  showDenyButton: true,
                  confirmButtonText: 'Sí, poner en espera y recuperar',
                  denyButtonText: 'Reemplazar sin guardar',
                  cancelButtonText: 'Cancelar',
                  confirmButtonColor: '#0EA5E9',
                  denyButtonColor: '#EF4444',
                  background: '#090d16',
                  color: '#f8fafc',
                });

                if (promptRes.isDismissed) return;
                if (promptRes.isConfirmed) {
                  onGuardarBorrador();
                }
              }

              // 2. Mapear líneas del borrador seleccionado
              let mappedLineas: LineaVenta[] = [];
              if (Array.isArray(d.lineas) && d.lineas.length > 0) {
                mappedLineas = d.lineas;
              } else if (Array.isArray(d.cart) && d.cart.length > 0) {
                mappedLineas = d.cart.map((item: any) => {
                  if (item.productoId) return item as LineaVenta;
                  const prod = item.product || {};
                  const precio = item.precioOverride !== undefined ? item.precioOverride : (prod.precioVentaPOS || 0);
                  return {
                    productoId: prod.id || `p-${Date.now()}`,
                    sku: prod.sku || '',
                    nombre: prod.nombre || 'Producto',
                    cantidad: Number(item.cantidad) || 1,
                    unidad: (prod.unidadMedida === 'KG' ? 'KG' : 'UNIDAD') as 'KG' | 'UNIDAD',
                    precioLista: prod.precioVentaPOS || 0,
                    descuentoPct: item.precioOverride !== undefined
                      ? Math.round(((prod.precioVentaPOS - item.precioOverride) / prod.precioVentaPOS) * 100)
                      : 0,
                    precioFinal: precio,
                    totalLinea: Number(item.cantidad || 1) * precio,
                    precioCompra: prod.precioCompra || 0,
                    esPesoManual: false,
                  } satisfies LineaVenta;
                });
              }

              onSetLineas(mappedLineas);
              onSetActiveDraftId(d.id);
              onSetDescuentoGlobal(d.descuentoGlobal || 0);

              // 3. Validar stock Just-in-Time
              const sinStock = mappedLineas.filter(l => getStockDisponible(l.sku) < l.cantidad);
              if (sinStock.length > 0) {
                Swal.fire({
                  toast: true,
                  position: 'top-end',
                  icon: 'warning',
                  title: 'Aviso de Inventario',
                  text: `${sinStock.length} producto(s) del pedido tienen stock inferior a la cantidad registrada.`,
                  timer: 3500,
                  showConfirmButton: false,
                });
              }

              // 4. Remover el borrador retomado de la lista y marcar como RECUPERADO en base de datos
              onSetDrafts((prev) => prev.filter((x) => x.id !== d.id));
              await PosDraftService.resolveDraft(d.id, 'RECUPERADO');

              Swal.close();
              Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Pedido Retomado',
                text: `"${d.alias || 'Borrador'}" cargado al carrito.`,
                timer: 2000,
                showConfirmButton: false,
              });
            };
          }

          const deleteBtn = document.getElementById(`draft-delete-${d.id}`);
          if (deleteBtn) {
            deleteBtn.onclick = async () => {
              const confirmRes = await Swal.fire({
                title: '¿Descartar este pedido en espera?',
                text: 'Esta acción no se puede deshacer.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, descartar',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#EF4444',
                background: '#090d16',
                color: '#f8fafc',
              });

              if (confirmRes.isConfirmed) {
                onSetDrafts((prev) => prev.filter((x) => x.id !== d.id));
                if (activeDraftId === d.id) onSetActiveDraftId(null);
                await PosDraftService.resolveDraft(d.id, 'DESCARTADO');
                Swal.close();
                Swal.fire({
                  toast: true,
                  position: 'top-end',
                  icon: 'info',
                  title: 'Pedido descartado',
                  timer: 1500,
                  showConfirmButton: false,
                });
              }
            };
          }
        });
      },
    });
  };

  const handleSelectDraftDirectly = async (d: CartDraft) => {
    // Si el carrito actual tiene productos, ofrecer resguardarlo
    if (lineas.length > 0) {
      const promptRes = await Swal.fire({
        title: '¿Guardar Carrito Actual?',
        text: 'Actualmente hay productos en el mostrador. ¿Deseas ponerlos en espera para atender este pedido?',
        icon: 'question',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: 'Sí, poner en espera y recuperar',
        denyButtonText: 'Reemplazar sin guardar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#0EA5E9',
        denyButtonColor: '#EF4444',
        background: '#090d16',
        color: '#f8fafc',
      });

      if (promptRes.isDismissed) return;
      if (promptRes.isConfirmed) {
        onGuardarBorrador();
      }
    }

    let mappedLineas: LineaVenta[] = [];
    if (Array.isArray(d.lineas) && d.lineas.length > 0) {
      mappedLineas = d.lineas;
    } else if (Array.isArray(d.cart) && d.cart.length > 0) {
      mappedLineas = d.cart.map((item: any) => {
        if (item.productoId) return item as LineaVenta;
        const prod = item.product || {};
        const precio = item.precioOverride !== undefined ? item.precioOverride : (prod.precioVentaPOS || 0);
        return {
          productoId: prod.id || `p-${Date.now()}`,
          sku: prod.sku || '',
          nombre: prod.nombre || 'Producto',
          cantidad: Number(item.cantidad) || 1,
          unidad: (prod.unidadMedida === 'KG' ? 'KG' : 'UNIDAD') as 'KG' | 'UNIDAD',
          precioLista: prod.precioVentaPOS || 0,
          descuentoPct: item.precioOverride !== undefined
            ? Math.round(((prod.precioVentaPOS - item.precioOverride) / prod.precioVentaPOS) * 100)
            : 0,
          precioFinal: precio,
          totalLinea: Number(item.cantidad || 1) * precio,
          precioCompra: prod.precioCompra || 0,
          esPesoManual: false,
        } satisfies LineaVenta;
      });
    }

    onSetLineas(mappedLineas);
    onSetActiveDraftId(d.id);
    onSetDescuentoGlobal(d.descuentoGlobal || 0);

    onSetDrafts((prev) => prev.filter((x) => x.id !== d.id));
    await PosDraftService.resolveDraft(d.id, 'RECUPERADO');

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Pedido Retomado',
      text: `"${d.alias || 'Borrador'}" cargado al carrito.`,
      timer: 2000,
      showConfirmButton: false,
    });
  };

  const handleDeleteDraftDirectly = async (draftId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmRes = await Swal.fire({
      title: '¿Descartar este pedido en espera?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, descartar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#EF4444',
      background: '#090d16',
      color: '#f8fafc',
    });

    if (confirmRes.isConfirmed) {
      onSetDrafts((prev) => prev.filter((x) => x.id !== draftId));
      if (activeDraftId === draftId) onSetActiveDraftId(null);
      await PosDraftService.resolveDraft(draftId, 'DESCARTADO');
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: 'Pedido descartado',
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  return (
    <GlassCard
      data-testid="cart-glass-panel"
      showMacControls={true}
      title="CARRITO DE VENTAS"
      badge={`${totalItems} ${totalItems === 1 ? 'ítem' : 'ítems'}`}
      badgeVariant="cyan"
      onMinimize={() => setIsCompactMode((prev) => !prev)}
      className="pos-cart-panel flex flex-col h-full min-h-0 overflow-hidden pr-1 p-4 select-none"
    >
      {/* ── HEADER: Selector de cliente + Borradores + En Espera (Targets >= 48px) ── */}
      <div
        className="pos-cart-header flex flex-wrap justify-between items-center gap-2 py-2.5 px-3 border-b border-white/10 bg-slate-900/60 shrink-0 rounded-2xl backdrop-blur-xl"
      >
        {/* Selector de cliente en Dark Glassmorphism V8 */}
        {cliente ? (
          <button
            type="button"
            onClick={onSelectCliente}
            className="flex items-center gap-2 px-3 min-h-[48px] h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-white font-bold text-xs transition-all max-w-[220px] truncate shadow-sm cursor-pointer"
            title={`${cliente.nombre} (${cliente.identificacion})`}
          >
            <Check size={16} className="text-emerald-400 shrink-0" />
            <span className="truncate text-left">
              {cliente.nombre.slice(0, 18)} ({cliente.identificacion})
            </span>
            <span
              title="Quitar cliente"
              className="text-slate-400 hover:text-red-400 transition-colors shrink-0 ml-auto p-0.5 rounded-lg hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation();
                onClearCliente();
              }}
            >
              <X size={15} />
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onSelectCliente}
            className="flex items-center gap-1.5 px-3 min-h-[48px] h-12 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-white/10 text-slate-200 hover:text-white font-bold text-xs transition-all cursor-pointer shadow-sm"
          >
            <Plus size={16} className="text-cyan-400" />
            <span>Agregar Cliente</span>
          </button>
        )}

        <div className="flex items-center gap-2">
          {/* Botón Cerrar Turno (solo si está abierto) */}
          {isTurnoAbierto && onCerrarTurnoClick && (
            <button
              type="button"
              onClick={onCerrarTurnoClick}
              className="text-xs min-h-[48px] h-12 py-1 px-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-bold transition-all cursor-pointer"
            >
              Cerrar Turno
            </button>
          )}

          {/* Botón Poner en Espera Rápido */}
          <button
            type="button"
            onClick={onGuardarBorrador}
            disabled={lineas.length === 0}
            className="flex items-center gap-1.5 px-3.5 min-h-[48px] h-12 rounded-xl border border-indigo-500/30 bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm"
            title="Poner pedido actual en espera (Atajo: F6)"
            aria-label="Poner pedido actual en espera (Atajo F6)"
          >
            <PauseCircle size={18} />
            <span className="hidden sm:inline">En Espera</span>
          </button>

          {/* Badge / Botón Ver Pedidos en Espera */}
          <button
            type="button"
            onClick={handleOpenBorradores}
            className={`relative flex items-center gap-1.5 px-3.5 min-h-[48px] h-12 rounded-xl border text-xs font-bold transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
              drafts.length > 0
                ? 'bg-amber-950/40 border-amber-500/30 text-amber-300 hover:bg-amber-900/60 shadow-sm'
                : 'bg-slate-800/80 border-white/10 text-slate-300 hover:bg-slate-700/80 hover:text-white shadow-sm'
            }`}
            title="Ver pedidos guardados en espera"
            aria-label={`Ver ${drafts.length} pedidos guardados en espera`}
          >
            <Archive size={16} className={drafts.length > 0 ? 'text-amber-400' : 'text-slate-400'} />
            <span>Borradores</span>
            {drafts.length > 0 && (
              <span 
                className="flex items-center justify-center min-w-[20px] h-[20px] px-1 bg-amber-500 text-slate-950 font-black rounded-full text-[11px] animate-pulse"
                aria-live="polite"
              >
                {drafts.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── BARRA MULTI-CLIENTE: Carritos en Espera / Conmutación Rápida ── */}
      {drafts.length > 0 && (
        <ParkedOrdersBar
          drafts={drafts}
          activeDraftId={activeDraftId}
          currentItemsCount={lineas.length}
          currentTotal={totales.totalFinal}
          onSelectDraft={handleSelectDraftDirectly}
          onDeleteDraft={handleDeleteDraftDirectly}
          onNewParkedSale={onGuardarBorrador}
        />
      )}

      {/* ── LISTA DE ÍTEMS: scroll táctil vertical ── */}
      <div
        data-testid="cart-items-container"
        className={`pos-cart-items-list flex-1 overflow-y-auto ${isCompactMode ? 'hidden' : ''}`}
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'y proximity',
        }}
      >
        {lineas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 px-4 text-center my-auto rounded-2xl border border-dashed border-white/10 bg-white/5 mx-1">
            <span className="text-2xl mb-1 opacity-70">🛒</span>
            <span className="text-xs font-bold text-slate-300">El carrito está vacío</span>
            <span className="text-[11px] text-slate-400 mt-0.5">
              Selecciona productos del catálogo o presiona <kbd className="px-1 py-0.5 font-mono text-[10px] bg-white/10 rounded text-cyan-300 border border-white/10">F2</kbd>
            </span>
          </div>
        ) : (
          lineas.map((linea) => {
            const stockDisponible = getStockDisponible(linea.sku);
            const lastClientPrice = getLastClientPrice(linea.sku);
            return (
              <LineaVentaRow
                key={linea.productoId}
                linea={linea}
                stockDisponible={stockDisponible}
                precioFinalDisplay={linea.precioFinal}
                lastClientPrice={lastClientPrice}
                onUpdateCantidad={onUpdateCantidad}
                onUpdateDescuentoLinea={handleUpdateDescuentoLineaWrapper}
                onRemove={onRemoveLinea}
                onWeightRead={onWeightRead}
                onAplicarPrecioHistorico={handleAplicarPrecioHistorico}
                onResetPrecio={handleResetPrecio}
                onUpdatePrecio={onUpdatePrecio}
                onResetItemPrice={onResetItemPrice}
                onOpenKeypad={setKeypadLinea}
              />
            );
          })
        )}
      </div>

      {/* ── FOOTER STICKY: Total + Descuento + Pago ── */}
      <div
        className="pos-cart-footer shrink-0 mt-auto bg-slate-900/90 backdrop-blur-2xl p-3 border-t border-white/10 flex flex-col gap-2 rounded-2xl shadow-2xl"
      >
        {/* Total prominente táctil con micro-animación y alto contraste */}
        {lineas.length > 0 && (
          <div className="flex justify-between items-center py-2 px-3 bg-slate-950/80 rounded-xl border border-white/10 shadow-sm transition-all duration-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">TOTAL</span>
              <span 
                className={`bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-black px-2.5 py-0.5 rounded-full ${isBouncing ? 'animate-bounce' : ''}`}
              >
                {totalItems} {totalItems === 1 ? 'ítem' : 'ítems'}
              </span>
            </div>
            <strong className="text-3xl font-black text-emerald-400 font-mono tracking-tight tabular-nums transition-transform duration-150 active:scale-95">
              ${totales.totalFinal.toLocaleString('es-CO')}
            </strong>
          </div>
        )}

        <DiscountPanel
          subtotal={totales.subtotal}
          totalItems={totalItems}
          descuentoPct={descuentoGlobalPct}
          descuentoValor={descuentoGlobalValor}
          totalIva={totales.totalIva}
          subtotalBaseGravable={totales.subtotalBaseGravable}
          onDescuentoClick={onDescuentoClick}
        />

        {isMostradorAuto ? (
          <div className="p-4 bg-slate-900/90 border border-cyan-500/30 rounded-2xl backdrop-blur-xl shadow-xl space-y-3 select-none">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                  Puesto de Mostrador
                </span>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 font-bold bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-lg">
                Cobro en Ventanilla
              </span>
            </div>

            <button
              type="button"
              data-testid="btn-emitir-preventa-mostrador"
              disabled={lineas.length === 0}
              onClick={() => { if (lineas.length > 0) setIsConfirmComandaOpen(true); }}
              className={`w-full min-h-[50px] py-3 px-4 rounded-xl font-black text-sm tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
                lineas.length > 0
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-600/30 border border-cyan-400/40'
                  : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
              }`}
            >
              <PauseCircle size={18} />
              <span>EMITIR PREVENTA / COMANDA (F6)</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={lineas.length === 0}
                onClick={onLimpiarCarrito}
                className="flex-1 min-h-[44px] py-2 px-3 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 text-xs font-bold transition-all border border-white/10 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 size={14} />
                <span>Vaciar Carrito</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-400 bg-cyan-950/20 border border-cyan-500/20 rounded-xl p-2.5 text-center leading-relaxed">
              ℹ️ Los asesores de mostrador generan la preventa y envían al cliente a la <strong>Caja Única (Ventanilla)</strong> para realizar el pago y posterior despacho de bodega.
            </div>
          </div>
        ) : (
          <PaymentPanel
            totalFinal={totales.totalFinal}
            lineas={lineas}
            cliente={cliente}
            stock={stock}
            bodegaActivaId={bodegaActivaId}
            bodegaActivaNombre={bodegaActivaNombre}
            onPagar={onPagar}
            onGuardarBorrador={onGuardarBorrador}
            onLimpiarCarrito={onLimpiarCarrito}
            isDisabled={lineas.length === 0}
            isTurnoAbierto={isTurnoAbierto}
            onAbrirTurnoRequest={onAbrirTurnoRequest}
            onRetiroParcialRequest={onRetiroParcialRequest}
            saldoEfectivoGaveta={saldoEfectivoGaveta}
            topeMaximoGaveta={topeMaximoGaveta}
          />
        )}
      </div>

      {/* Modal Táctil On-Screen Keypad para Ajuste Rápido de Cantidad / Peso (Regla 12 Años) */}
      {keypadLinea && (
        <OnScreenKeypadModal
          isOpen={true}
          titulo={`Ajustar ${keypadLinea.unidad === 'KG' ? 'Peso' : 'Cantidad'}`}
          subtitulo={keypadLinea.nombre}
          valorInicial={keypadLinea.cantidad}
          unidad={keypadLinea.unidad}
          precioUnitario={keypadLinea.precioFinal}
          onConfirm={(val) => {
            onUpdateCantidad(keypadLinea.productoId, val);
            setKeypadLinea(null);
          }}
          onClose={() => setKeypadLinea(null)}
        />
      )}

      {/* Modal de Confirmación de Emisión de Preventa / Comanda para Asesor de Mostrador */}
      {isConfirmComandaOpen && (
        <div 
          data-testid="modal-confirmar-comanda"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 shadow-2xl shadow-cyan-950/50 space-y-4 select-none">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <PauseCircle size={18} className="text-cyan-400" />
                  <span>Confirmar Emisión de Preventa / Comanda</span>
                </h3>
                <span className="text-xs text-cyan-300 font-mono">Puesto de Mostrador ➔ Ventanilla de Caja</span>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmComandaOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Cliente Asignado:</span>
                <strong className="text-white font-bold">{cliente?.nombre || 'Consumidor Final'}</strong>
              </div>
              <div className="flex justify-between text-xs text-slate-300">
                <span>Total Ítems:</span>
                <span className="font-mono font-bold text-slate-200">{totalItems} {totalItems === 1 ? 'ítem' : 'ítems'}</span>
              </div>
              <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total a Cobrar:</span>
                <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                  ${totales.totalFinal.toLocaleString('es-CO')}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-cyan-300/90 bg-cyan-950/40 border border-cyan-500/20 rounded-xl p-3 leading-relaxed">
              ℹ️ Esta comanda se enviará en tiempo real a la <strong>Caja Única (Ventanilla)</strong>. El cliente podrá pagar en efectivo o a crédito con su documento de identidad.
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsConfirmComandaOpen(false)}
                className="flex-1 min-h-[44px] py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all border border-white/10 cursor-pointer"
              >
                Corregir Pedido
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsConfirmComandaOpen(false);
                  await onGuardarBorrador();
                }}
                className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-black tracking-wide transition-all shadow-lg shadow-cyan-600/30 border border-cyan-400/40 cursor-pointer active:scale-95"
              >
                Confirmar y Emitir (F6)
              </button>
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );
};
