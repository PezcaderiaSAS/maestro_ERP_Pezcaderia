import React, { useState } from 'react';
import { Search, ShoppingBag, Clock, User, X } from 'lucide-react';
import { MacWindowControls } from '../../../components/layout/components/MacWindowControls';

export interface PendingOrderComanda {
  id: string;
  consecutivoTicket: string;
  terminalId: string;
  vendedorId: string;
  vendedorNombre: string;
  clienteNombre?: string;
  montoTotal: number;
  itemsCount: number;
  createdAt: string;
  estado: 'PENDIENTE_PAGO' | 'PAGADO' | 'ANULADO';
  items?: any[];
}

export interface PendingOrdersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  orders: PendingOrderComanda[];
  onSelectOrder: (order: PendingOrderComanda) => void;
}

/**
 * PendingOrdersDrawer - Cola Central de Preventas para Taquilla de Caja Única (SPEC-032).
 * Permite al cajero principal visualizar, buscar y cobrar comandas generadas por las 8 terminales.
 */
export const PendingOrdersDrawer: React.FC<PendingOrdersDrawerProps> = ({
  isOpen,
  onClose,
  orders,
  onSelectOrder,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredOrders = orders.filter(
    (o) =>
      o.estado === 'PENDIENTE_PAGO' &&
      (o.consecutivoTicket.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.vendedorNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.clienteNombre && o.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
        o.terminalId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pending-orders-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in"
    >
      <div
        style={{
          transform: 'translateZ(0)',
          boxShadow:
            '0 25px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)',
        }}
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-900/95 backdrop-blur-2xl border border-white/12 shadow-2xl text-slate-100 overflow-hidden select-none"
      >
        {/* Cabecera macOS Glassmorphism */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <MacWindowControls onToggleOpen={onClose} onCloseSession={onClose} />
            <h2
              id="pending-orders-title"
              className="text-xs font-black tracking-widest text-slate-300 uppercase ml-2 flex items-center gap-2"
            >
              <ShoppingBag size={15} className="text-red-500" />
              Cola Central de Preventas ({filteredOrders.length})
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar ventana"
            aria-label="Cerrar ventana"
          >
            <X size={18} />
          </button>
        </div>

        {/* Buscador de Comandas / Tickets */}
        <div className="p-4 border-b border-white/10 bg-slate-900/50">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por ticket (ej. 0042), vendedor o cliente..."
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 text-xs font-medium outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-all"
              autoFocus
            />
          </div>
        </div>

        {/* Lista de Comandas Pendientes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {filteredOrders.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Clock size={36} className="text-slate-500/60" />
              <p className="text-sm font-semibold">No hay comandas pendientes de cobro</p>
              <p className="text-xs text-slate-500">
                Las preventas emitidas desde las 8 terminales aparecerán aquí en tiempo real.
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black font-mono bg-red-600 text-white shadow-xs">
                      {order.consecutivoTicket}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black font-mono bg-white/10 text-cyan-400 border border-white/10">
                      {order.terminalId}
                    </span>
                    <span className="text-xs font-bold text-white truncate max-w-[200px]">
                      {order.clienteNombre || 'Consumidor Final'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <User size={12} className="text-slate-400" />
                      {order.vendedorNombre}
                    </span>
                    <span>•</span>
                    <span>{order.itemsCount} productos</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                  <span className="text-base font-black font-mono text-emerald-400">
                    ${order.montoTotal.toLocaleString('es-CO')}
                  </span>

                  <button
                    onClick={() => onSelectOrder(order)}
                    className="min-h-[44px] px-4 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    aria-label={`Cobrar en Caja comanda ${order.consecutivoTicket}`}
                  >
                    <span>Cobrar en Caja</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
