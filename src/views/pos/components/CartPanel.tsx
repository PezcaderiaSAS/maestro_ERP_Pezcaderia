import React from 'react';
import { Check, X, Plus } from 'lucide-react';
import type { LineaVenta } from '../../../types/pos.types';
import type { ClientePOS } from '../../../hooks/usePOSCart';
import { LineaVentaRow } from './LineaVentaRow';
import { DiscountPanel } from './DiscountPanel';
import { PaymentPanel } from './PaymentPanel';
import Swal from 'sweetalert2';

interface CartPanelProps {
  // Datos del carrito
  lineas: LineaVenta[];
    cliente: ClientePOS | null;
  descuentoGlobalPct: number;
  descuentoGlobalValor: number;
  totales: { subtotal: number; descuento: number; totalFinal: number };
  drafts: any[];
  activeDraftId: string | null;

  // Datos de contexto para resolver stock y precio histórico por fila
  stock: Record<string, any[]>;
  bodegaActiva: string;
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
  onPagar: (metodo: 'EFECTIVO' | 'TRANSFERENCIA' | 'CREDITO') => Promise<any> | void;
  onGuardarBorrador: () => void;
  onSetActiveDraftId: (id: string | null) => void;
  onSetDrafts: (fn: (prev: any[]) => any[]) => void;
  onSetDescuentoGlobal: (val: number) => void;

  // Props de caja
  isTurnoAbierto: boolean;
  onAbrirTurnoRequest?: () => void;
  onCerrarTurnoClick?: () => void;
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
  bodegaActiva,
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
}) => {
  // Helpers para resolver datos por fila dentro del .map()
  const getStockDisponible = (sku: string): number => {
    return stock[bodegaActiva]?.[sku] || 0;
  };

  const getLastClientPrice = (sku: string): number | undefined => {
    if (!cliente) return undefined;
    const clientKey = (cliente.identificacion || cliente.nombre).trim().toLowerCase();
    return lastClientPrices[clientKey]?.[sku];
  };

  const handleAplicarPrecioHistorico = (productoId: string, precio: number) => {
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

  const handleResetPrecio = (productoId: string) => {
    onUpdateDescuentoLinea(productoId, 0);
  };

  const handleOpenBorradores = () => {
    if (drafts.length === 0) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: 'No hay borradores',
        showConfirmButton: false,
        timer: 1500,
      });
      return;
    }

    let html = '<div style="display:flex;flex-direction:column;gap:8px;max-height:300px;overflow-y:auto;">';
    drafts.forEach((d) => {
      const isSelected = activeDraftId === d.id;
      html += `<div style="display:flex; align-items:stretch; background-color: white; border: 1px solid ${isSelected ? 'var(--primary-color)' : '#CBD5E1'}; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
        <div id="draft-select-${d.id}" style="flex: 1; padding: 10px; cursor: pointer; text-align: left; background-color: ${isSelected ? 'var(--primary-light)' : 'transparent'};">
          <div style="font-weight:bold;color:#0F172A; display:flex; justify-content:space-between;">
            <span>${d.cliente ? d.cliente.nombre : 'Consumidor Final'}</span>
            ${isSelected ? '<span style="font-size:10px; background:var(--primary-color); color:white; padding:2px 6px; border-radius:4px; font-weight:bold;">ACTIVO</span>' : ''}
          </div>
          <div style="font-size:11px;color:#64748B;">${new Date(d.fecha).toLocaleTimeString()} - $${d.totalFinal.toLocaleString('es-CO')} (${d.cart.length} ítems)</div>
        </div>
        <button id="draft-delete-${d.id}" title="Eliminar Borrador" style="width: 44px; display: flex; align-items: center; justify-content: center; background: #FEF2F2; border: none; border-left: 1px solid #FEE2E2; cursor: pointer; color: #EF4444; transition: background 0.2s;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
        </button>
      </div>`;
    });
    html += '</div>';

    Swal.fire({
      title: 'Facturas en Borrador',
      html,
      showConfirmButton: false,
      showCloseButton: true,
      didOpen: () => {
        drafts.forEach((d) => {
          const selectBtn = document.getElementById(`draft-select-${d.id}`);
          if (selectBtn) {
            selectBtn.onclick = () => {
              // Restaurar carrito desde borrador
              const mappedLineas: LineaVenta[] = (d.cart || []).map((item: any) => {
                if (item.productoId) return item as LineaVenta;
                // Compatibilidad con formato legacy (item.product)
                const prod = item.product;
                const precio = item.precioOverride !== undefined ? item.precioOverride : (prod.precioVentaPOS || 0);
                return {
                  productoId: prod.id,
                  sku: prod.sku,
                  nombre: prod.nombre,
                  cantidad: Number(item.cantidad),
                  unidad: (prod.unidadMedida === 'KG' ? 'KG' : 'UNIDAD') as 'KG' | 'UNIDAD',
                  precioLista: prod.precioVentaPOS || 0,
                  descuentoPct: item.precioOverride !== undefined
                    ? Math.round(((prod.precioVentaPOS - item.precioOverride) / prod.precioVentaPOS) * 100)
                    : 0,
                  precioFinal: precio,
                  totalLinea: Number(item.cantidad) * precio,
                  esPesoManual: false,
                } satisfies LineaVenta;
              });
              onSetLineas(mappedLineas);
              onSetActiveDraftId(d.id);
              onSetDescuentoGlobal(d.descuentoGlobal || 0);
              Swal.close();
            };
          }
          const deleteBtn = document.getElementById(`draft-delete-${d.id}`);
          if (deleteBtn) {
            deleteBtn.onclick = () => {
              onSetDrafts((prev) => prev.filter((x) => x.id !== d.id));
              if (activeDraftId === d.id) onSetActiveDraftId(null);
              Swal.close();
            };
          }
        });
      },
    });
  };

  const totalItems = lineas.reduce((sum, l) => sum + Number(l.cantidad), 0);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        gap: 0,
      }}
    >
      {/* ── HEADER: Selector de cliente + Borradores ── */}
      <div
        className="pos-cart-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '56px',
          padding: '8px 12px',
          borderBottom: '1px solid #F1F5F9',
          flexShrink: 0,
        }}
      >
        {/* Selector de cliente */}
        {cliente ? (
          <div className="add-client-btn" onClick={onSelectCliente} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Check size={16} />
              <span style={{ fontSize: '12px' }}>
                {cliente.nombre.slice(0, 18)} ({cliente.identificacion})
              </span>
            </div>
            <X
              size={14}
              onClick={(e) => {
                e.stopPropagation();
                onClearCliente();
              }}
            />
          </div>
        ) : (
          <button className="add-client-btn" onClick={onSelectCliente}>
            <span>Agregar Cliente</span>
            <Plus size={16} />
          </button>
        )}

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Botón Cerrar Turno (solo si está abierto) */}
          {isTurnoAbierto && onCerrarTurnoClick && (
            <button
              onClick={onCerrarTurnoClick}
              style={{
                background: '#FEF2F2',
                color: '#EF4444',
                border: '1px solid #FCA5A5',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Cerrar Turno
            </button>
          )}

          {/* Botón Borradores */}
        <button
          onClick={handleOpenBorradores}
          style={{
            position: 'relative',
            background: 'none',
            border: '1px solid #CBD5E1',
            borderRadius: '6px',
            padding: '6px 10px',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            color: '#475569',
            backgroundColor: '#F8FAFC',
          }}
        >
          Borradores
          {drafts.length > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                background: '#EF4444',
                color: 'white',
                borderRadius: '50%',
                width: '16px',
                height: '16px',
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {drafts.length}
            </span>
          )}
        </button>
        </div>
      </div>

      {/* ── LISTA DE ÍTEMS: scroll táctil vertical ── */}
      <div
        className="pos-cart-items-list"
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'y proximity',
          maxHeight: 'calc(100vh - 380px)',
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
                onUpdateDescuentoLinea={onUpdateDescuentoLinea}
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
        className="pos-cart-footer"
        style={{
          flexShrink: 0,
          position: 'sticky',
          bottom: 0,
          background: 'white',
          padding: '12px',
          borderTop: '2px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {/* Total prominente táctil */}
        {lineas.length > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 4px',
            }}
          >
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>TOTAL</span>
            <strong
              style={{
                fontSize: '24px',
                fontWeight: 900,
                color: 'var(--primary-color)',
                textAlign: 'right',
              }}
            >
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
          bodegaActiva={bodegaActiva}
          onPagar={onPagar}
          onGuardarBorrador={onGuardarBorrador}
          onLimpiarCarrito={onLimpiarCarrito}
          isDisabled={lineas.length === 0}
          isTurnoAbierto={isTurnoAbierto}
          onAbrirTurnoRequest={onAbrirTurnoRequest}
        />
      </div>
    </div>
  );
};
