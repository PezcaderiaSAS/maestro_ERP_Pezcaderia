import React from 'react';
import { ShoppingCart, PauseCircle, Plus, X, Clock, User, ChevronRight } from 'lucide-react';
import type { CartDraft, LineaVenta } from '../../../types/pos.types';

interface ParkedOrdersBarProps {
  drafts: CartDraft[];
  activeDraftId: string | null;
  currentItemsCount: number;
  currentTotal: number;
  onSelectDraft: (draft: CartDraft) => void;
  onDeleteDraft: (draftId: string, e: React.MouseEvent) => void;
  onNewParkedSale: () => void;
}

export const ParkedOrdersBar: React.FC<ParkedOrdersBarProps> = ({
  drafts,
  activeDraftId,
  currentItemsCount,
  currentTotal,
  onSelectDraft,
  onDeleteDraft,
  onNewParkedSale,
}) => {
  return (
    <div className="flex flex-col gap-1.5 px-3 py-2 bg-slate-950/70 border-b border-white/10 shrink-0">
      <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
        <div className="flex items-center gap-1.5">
          <PauseCircle size={13} className="text-cyan-400" />
          <span className="text-slate-300">Ventas en Espera & Multicliente</span>
          {drafts.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold">
              {drafts.length}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onNewParkedSale}
          className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600 text-cyan-200 hover:text-white border border-cyan-500/30 transition-all text-[11px] font-bold cursor-pointer active:scale-95"
          title="Poner venta actual en espera e iniciar nueva venta limpia (F6)"
        >
          <Plus size={12} />
          <span>Suspender & Nueva Venta</span>
        </button>
      </div>

      {/* Pestañas de Carritos Horizontales */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {/* Pestaña de Carrito Activo */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all shrink-0 cursor-default ${
            activeDraftId === null
              ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40 shadow-sm shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-400 border-white/5'
          }`}
        >
          <ShoppingCart size={13} className="text-cyan-400" />
          <span>Venta Activa</span>
          <span className="font-mono text-[10px] bg-slate-950/50 px-1.5 py-0.5 rounded text-white">
            {currentItemsCount} ítems (${currentTotal.toLocaleString('es-CO')})
          </span>
        </div>

        {/* Pestañas de Pedidos en Espera (Borradores de Clientes Anteriores) */}
        {drafts.map((d) => {
          const isSelected = activeDraftId === d.id;
          const alias = d.alias || (d.cliente ? d.cliente.nombre : 'Cliente Mostrador');
          const itemsCount = d.lineas ? d.lineas.length : (d.cart ? d.cart.length : 0);
          const totalFormatted = Number(d.total ?? d.totalFinal ?? 0).toLocaleString('es-CO');

          // Cálculo sutil de hora guardada
          const time = d.fechaGuardado || d.fecha;
          const timeFormatted = time
            ? new Date(time).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
            : '';

          return (
            <div
              key={d.id}
              onClick={() => onSelectDraft(d)}
              className={`group flex items-center gap-2 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-amber-500/20 text-amber-200 border-amber-500/50 shadow-sm shadow-amber-500/20 ring-1 ring-amber-400/40'
                  : 'bg-slate-900/90 text-slate-300 border-white/10 hover:border-amber-500/30 hover:bg-slate-800'
              }`}
              title={`Clic para retomar el pedido de ${alias}`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <PauseCircle size={12} className={isSelected ? 'text-amber-400' : 'text-slate-400'} />
                <span className="truncate max-w-[110px]">{alias}</span>
                <span className="font-mono text-[10px] text-amber-300 bg-amber-500/10 px-1 py-0.2 rounded">
                  ${totalFormatted}
                </span>
                {timeFormatted && (
                  <span className="text-[9px] text-slate-500 font-mono hidden sm:inline">
                    {timeFormatted}
                  </span>
                )}
              </div>

              {/* Botón de descartar borrador con confirmación */}
              <button
                type="button"
                onClick={(e) => onDeleteDraft(d.id, e)}
                className="p-0.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-1"
                title="Descartar este pedido en espera"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}

        {drafts.length === 0 && (
          <span className="text-[11px] text-slate-500 italic pl-1">
            Ningún cliente en espera en este momento
          </span>
        )}
      </div>
    </div>
  );
};
