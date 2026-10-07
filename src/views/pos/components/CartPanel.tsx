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
import Swal from 'sweetalert2';

interface CartPanelProps {
  // Datos del carrito
  lineas: LineaVenta[];
    cliente: ClientePOS | null;
  descuentoGlobalPct: number;
  descuentoGlobalValor: number;
  totales: { subtotal: number; descuento: number; totalFinal: number };
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

  // Callbacks de interacción UI
  onSelectCliente: () => void;
  onClearCliente: () => void;
  onDescuentoClick: () => void;
  onPagar: (pagos: { metodo: MetodoCobroPos; monto: number }[]) => Promise<any> | void;
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
  isTurnoAbierto,
  onAbrirTurnoRequest,
  onCerrarTurnoClick,
  saldoEfectivoGaveta,
  topeMaximoGaveta,
  onRetiroParcialRequest,
}) => {
  const [isBouncing, setIsBouncing] = useState(false);
  const totalItems = lineas.reduce((sum, l) => sum + Number(l.cantidad), 0);

  useEffect(() => {
    if (totalItems <= 0) return;
    setIsBouncing(true);
    const timer = setTimeout(() => setIsBouncing(false), 300);
    return () => clearTimeout(timer);
  }, [totalItems]);

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
    <div className="pos-cart-panel flex flex-col h-full min-h-0 overflow-y-auto pr-1">
      {/* ── HEADER: Selector de cliente + Borradores + En Espera ── */}
      <div
        className="pos-cart-header flex flex-wrap justify-between items-center gap-2 py-2 px-3 border-b border-white/10 bg-slate-900/60 shrink-0 rounded-t-xl"
      >
        {/* Selector de cliente */}
        {cliente ? (
          <Button
            variant="outline"
            onClick={onSelectCliente}
            leftIcon={<Check size={16} />}
            rightIcon={
              <X
                size={14}
                className="hover:text-red-500 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearCliente();
                }}
              />
            }
            className="text-xs h-9 py-1 px-2.5 max-w-[200px]"
          >
            <span className="truncate">
              {cliente.nombre.slice(0, 18)} ({cliente.identificacion})
            </span>
          </Button>
        ) : (
          <Button 
            variant="outline" 
            onClick={onSelectCliente} 
            rightIcon={<Plus size={16} />}
            className="text-xs h-9 py-1 px-2.5"
          >
            Agregar Cliente
          </Button>
        )}

        <div className="flex items-center gap-2">
          {/* Botón Cerrar Turno (solo si está abierto) */}
          {isTurnoAbierto && onCerrarTurnoClick && (
            <Button
              variant="danger"
              onClick={onCerrarTurnoClick}
              className="text-xs py-1 px-2.5 h-9"
            >
              Cerrar Turno
            </Button>
          )}

          {/* Botón Poner en Espera Rápido */}
          <button
            type="button"
            onClick={onGuardarBorrador}
            disabled={lineas.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 h-9 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            title="Poner pedido actual en espera (Atajo: F6)"
            aria-label="Poner pedido actual en espera (Atajo F6)"
          >
            <PauseCircle size={15} />
            <span className="hidden sm:inline">En Espera</span>
          </button>

          {/* Badge / Botón Ver Pedidos en Espera */}
          <button
            type="button"
            onClick={handleOpenBorradores}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 h-9 rounded-xl border text-xs font-bold transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
              drafts.length > 0
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25 shadow-md shadow-amber-500/10'
                : 'bg-slate-800/80 border-white/10 text-slate-400 hover:text-white'
            }`}
            title="Ver pedidos guardados en espera"
            aria-label={`Ver ${drafts.length} pedidos guardados en espera`}
          >
            <Archive size={14} className={drafts.length > 0 ? 'text-amber-400' : 'text-slate-400'} />
            <span>Borradores</span>
            {drafts.length > 0 && (
              <span 
                className="flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-amber-500 text-slate-950 font-black rounded-full text-[10px] animate-pulse"
                aria-live="polite"
              >
                {drafts.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── BARRA MULTI-CLIENTE: Carritos en Espera / Conmutación Rápida ── */}
      <ParkedOrdersBar
        drafts={drafts}
        activeDraftId={activeDraftId}
        currentItemsCount={lineas.length}
        currentTotal={totales.totalFinal}
        onSelectDraft={handleSelectDraftDirectly}
        onDeleteDraft={handleDeleteDraftDirectly}
        onNewParkedSale={onGuardarBorrador}
      />

      {/* ── LISTA DE ÍTEMS: scroll táctil vertical ── */}
      <div
        className="pos-cart-items-list flex-1 overflow-y-auto"
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'y proximity',
        }}
      >
        {lineas.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: '120px',
              color: '#64748B',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '32px' }}>🛒</span>
            <span style={{ fontSize: '13px', fontWeight: 500 }}>El carrito está vacío</span>
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
              />
            );
          })
        )}
      </div>

      {/* ── FOOTER STICKY: Total + Descuento + Pago ── */}
      <div
        className="pos-cart-footer shrink-0 sticky bottom-0 bg-slate-900/95 backdrop-blur-md p-2.5 border-t border-white/10 flex flex-col gap-2 rounded-b-xl"
      >
        {/* Total prominente táctil */}
        {lineas.length > 0 && (
          <div className="flex justify-between items-center py-1 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">TOTAL</span>
              <span 
                className={`bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold px-2 py-0.5 rounded-full ${isBouncing ? 'animate-bounce' : ''}`}
              >
                {totalItems} ítems
              </span>
            </div>
            <strong className="text-2xl font-black text-cyan-400 font-mono tracking-tight tabular-nums">
              ${totales.totalFinal.toLocaleString('es-CO')}
            </strong>
          </div>
        )}

        <DiscountPanel
          subtotal={totales.subtotal}
          totalItems={totalItems}
          descuentoPct={descuentoGlobalPct}
          descuentoValor={descuentoGlobalValor}
          onDescuentoClick={onDescuentoClick}
        />

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
      </div>
    </div>
  );
};
