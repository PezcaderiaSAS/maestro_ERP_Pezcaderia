// src/views/pos/components/CashierSupermarketTerminal.tsx
// Terminal Tabular de Supermercado para Caja Única (SPEC-047)
// Lista ultradensa con navegación por teclado F1-F12, selección ágil y Dark Glassmorphism 60-30-10

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  Clock,
  User,
  ShoppingBag,
  CreditCard,
  Banknote,
  QrCode,
  Layers,
  ChevronRight,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { usePOSKeyboardShortcuts } from '../../../hooks/usePOSKeyboardShortcuts';

export interface SupermarketOrder {
  id: string;
  consecutivoTicket: string;
  clienteNombre?: string;
  vendedorNombre?: string;
  montoTotal: number;
  itemsCount: number;
  createdAt: string;
  estado?: string;
  terminalId?: string;
  notasCorte?: string;
}

export interface CashierSupermarketTerminalProps {
  orders: SupermarketOrder[];
  selectedOrderId?: string | null;
  onSelectOrder?: (order: SupermarketOrder) => void;
  onOpenPayment?: (order: SupermarketOrder, method?: string) => void;
  onRefresh?: () => void;
  onVoidOrder?: (order: SupermarketOrder) => void;
  className?: string;
}

export const CashierSupermarketTerminal: React.FC<CashierSupermarketTerminalProps> = ({
  orders = [],
  selectedOrderId,
  onSelectOrder,
  onOpenPayment,
  onRefresh,
  onVoidOrder,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filtrado reactivo de comandas
  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return orders;
    const term = searchTerm.toLowerCase();
    return orders.filter(
      (o) =>
        o.consecutivoTicket.toLowerCase().includes(term) ||
        (o.clienteNombre && o.clienteNombre.toLowerCase().includes(term)) ||
        (o.vendedorNombre && o.vendedorNombre.toLowerCase().includes(term))
    );
  }, [orders, searchTerm]);

  // Sincronizar índice seleccionado con selectedOrderId externo
  useEffect(() => {
    if (selectedOrderId) {
      const idx = filteredOrders.findIndex((o) => o.id === selectedOrderId);
      if (idx !== -1) setSelectedIndex(idx);
    }
  }, [selectedOrderId, filteredOrders]);

  // Asegurar que el índice se mantenga dentro de los límites
  useEffect(() => {
    if (selectedIndex >= filteredOrders.length && filteredOrders.length > 0) {
      setSelectedIndex(filteredOrders.length - 1);
    }
  }, [filteredOrders.length, selectedIndex]);

  const activeOrder = filteredOrders[selectedIndex] || null;

  // Manejo de atajos F1 a F12 y navegación
  usePOSKeyboardShortcuts({
    onArrowDown: () => {
      setSelectedIndex((prev) => {
        const next = Math.min(prev + 1, filteredOrders.length - 1);
        if (filteredOrders[next]) onSelectOrder?.(filteredOrders[next]);
        return next;
      });
    },
    onArrowUp: () => {
      setSelectedIndex((prev) => {
        const next = Math.max(prev - 1, 0);
        if (filteredOrders[next]) onSelectOrder?.(filteredOrders[next]);
        return next;
      });
    },
    onEnter: () => {
      if (activeOrder) {
        onSelectOrder?.(activeOrder);
        onOpenPayment?.(activeOrder, 'EFECTIVO');
      }
    },
    onF1Help: () => {
      // Modal o alerta rápida de ayuda
    },
    onF2Cash: () => {
      if (activeOrder) onOpenPayment?.(activeOrder, 'EFECTIVO');
    },
    onF3Card: () => {
      if (activeOrder) onOpenPayment?.(activeOrder, 'TARJETA');
    },
    onF4Transfer: () => {
      if (activeOrder) onOpenPayment?.(activeOrder, 'TRANSFERENCIA');
    },
    onF5Refresh: () => {
      onRefresh?.();
    },
    onF6Search: () => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    },
    onF8Void: () => {
      if (activeOrder) onVoidOrder?.(activeOrder);
    },
    onF9SplitPayment: () => {
      if (activeOrder) onOpenPayment?.(activeOrder, 'MIXTO');
    },
    onF12Checkout: () => {
      if (activeOrder) onOpenPayment?.(activeOrder, 'MIXTO');
    },
  });

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const getMinutesAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    return Math.max(0, diff);
  };

  return (
    <div
      role="region"
      aria-label="Terminal de Caja Supermercado"
      className={`flex flex-col flex-1 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl ${className}`}
    >
      {/* Barra Superior de Herramientas y Búsqueda */}
      <div className="flex items-center justify-between gap-3 p-3 bg-slate-950/60 border-b border-slate-800/70">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar comanda por turno, cliente o vendedor... [F6]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/60 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">
            {filteredOrders.length} {filteredOrders.length === 1 ? 'comanda' : 'comandas'}
          </span>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              aria-label="Refrescar lista de comandas"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/60 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">[F5]</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabla Ultradensa de Comandas */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-950/90 backdrop-blur border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider select-none z-10">
            <tr>
              <th className="py-2 px-3 w-12 text-center">#</th>
              <th className="py-2 px-3 w-28">Turno</th>
              <th className="py-2 px-3">Cliente</th>
              <th className="py-2 px-3">Vendedor</th>
              <th className="py-2 px-3 w-20 text-center">Ítems</th>
              <th className="py-2 px-3 w-28 text-center">Espera</th>
              <th className="py-2 px-3 w-36 text-right">Total</th>
              <th className="py-2 px-3 w-24 text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 text-xs">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-500 opacity-60" />
                  <p className="text-sm font-medium">No hay comandas pendientes en cola</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Las comandas enviadas desde el mostrador aparecerán automáticamente aquí.
                  </p>
                </td>
              </tr>
            ) : (
              filteredOrders.map((order, idx) => {
                const isSelected = idx === selectedIndex;
                const minutesAgo = getMinutesAgo(order.createdAt);

                return (
                  <tr
                    key={order.id}
                    onClick={() => {
                      setSelectedIndex(idx);
                      onSelectOrder?.(order);
                    }}
                    onDoubleClick={() => onOpenPayment?.(order, 'MIXTO')}
                    className={`h-11 transition-colors cursor-pointer select-none ${
                      isSelected
                        ? 'bg-cyan-950/60 border-l-4 border-cyan-400 text-white font-medium shadow-inner'
                        : 'hover:bg-slate-800/40 text-slate-200'
                    }`}
                  >
                    <td className="py-1 px-3 text-center font-mono text-[11px] text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-1 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-800/60 font-mono text-xs font-bold text-cyan-300">
                        {order.consecutivoTicket}
                      </span>
                    </td>
                    <td className="py-1 px-3 truncate max-w-xs font-medium text-slate-100">
                      {order.clienteNombre || 'Consumidor Final'}
                    </td>
                    <td className="py-1 px-3 text-slate-300 truncate max-w-xs">
                      {order.vendedorNombre || 'Mostrador'}
                    </td>
                    <td className="py-1 px-3 text-center font-mono text-slate-300">
                      {order.itemsCount}
                    </td>
                    <td className="py-1 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                          minutesAgo > 15
                            ? 'bg-rose-950/50 text-rose-400 border border-rose-800/40'
                            : minutesAgo > 5
                            ? 'bg-amber-950/50 text-amber-400 border border-amber-800/40'
                            : 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/40'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {minutesAgo} min
                      </span>
                    </td>
                    <td className="py-1 px-3 text-right font-mono font-bold text-sm text-emerald-400">
                      {formatCOP(order.montoTotal)}
                    </td>
                    <td className="py-1 px-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenPayment?.(order, 'MIXTO');
                        }}
                        aria-label={`Cobrar ${order.consecutivoTicket}`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-transform active:scale-95"
                      >
                        <span>Cobrar</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pie de Página con Leyenda de Atajos de Teclado F1-F12 */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 select-none">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 font-mono text-slate-300 font-semibold">
            F1 Ayuda
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 font-mono text-slate-300 font-semibold">
            F2 Efectivo
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 font-mono text-slate-300 font-semibold">
            F3 Datáfono
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 font-mono text-slate-300 font-semibold">
            F4 QR
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 font-mono text-slate-300 font-semibold">
            F5 Refrescar
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 font-mono text-cyan-300 font-semibold">
            F9 Dividido
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-700/60 font-mono text-emerald-300 font-bold">
            F12 Cobrar
          </span>
        </div>
        <div className="text-[11px] text-slate-500 font-mono hidden md:inline">
          [↑ / ↓] Navegar | [Enter] Abrir
        </div>
      </div>
    </div>
  );
};
