import React from 'react';
import { ShoppingCart, PauseCircle, Plus, X } from 'lucide-react';
import type { CartDraft } from '../../../types/pos.types';

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
    <div className="flex flex-col gap-1.5 px-3 py-2 bg-slate-900/80 border-b border-white/10 shrink-0 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300 font-semibold">
        <div className="flex items-center gap-1.5">
          <PauseCircle size={13} className="text-cyan-400" />
          <span className="text-white font-bold">Ventas en Espera & Multicliente</span>
          {drafts.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono text-[10px] font-bold">
              {drafts.length}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onNewParkedSale}
          className="flex items-center gap-1 min-h-[36px] px-2.5 py-1 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 transition-all text-[11px] font-bold cursor-pointer active:scale-95 shadow-sm"
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
              ? 'bg-cyan-950/60 text-cyan-200 border-cyan-500/40 shadow-sm'
              : 'bg-slate-800/60 text-slate-400 border-white/10'
          }`}
        >
          <ShoppingCart size={13} className="text-cyan-400" />
          <span>Venta Activa</span>
          <span className="font-mono text-[10px] bg-slate-900/80 px-1.5 py-0.5 rounded text-cyan-300 border border-white/10">
            {currentItemsCount} ítems (${currentTotal.toLocaleString('es-CO')})
          </span>
        </div>

        {/* Pestañas de Pedidos en Espera (Borradores de Clientes Anteriores) */}
        {drafts.map((d) => {
          const isSelected = activeDraftId === d.id;
          const alias = d.alias || (d.cliente ? d.cliente.nombre : 'Cliente Mostrador');
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
                  ? 'bg-amber-950/60 text-amber-200 border-amber-500/50 shadow-sm ring-1 ring-amber-400/40'
                  : 'bg-slate-800/80 text-slate-300 border-white/10 hover:border-amber-400/40 hover:bg-slate-700/80'
              }`}
              title={`Clic para retomar el pedido de ${alias}`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <PauseCircle size={12} className={isSelected ? 'text-amber-400' : 'text-slate-400'} />
                <span className="truncate max-w-[110px]">{alias}</span>
                <span className="font-mono text-[10px] text-amber-300 bg-amber-950/80 px-1 py-0.2 rounded border border-amber-500/30">
                  ${totalFormatted}
                </span>
                {timeFormatted && (
                  <span className="text-[9px] text-slate-400 font-mono hidden sm:inline">
                    {timeFormatted}
                  </span>
                )}
              </div>

              {/* Botón de descartar borrador con confirmación */}
              <button
                type="button"
                onClick={(e) => onDeleteDraft(d.id, e)}
                className="p-0.5 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/20 transition-colors ml-1"
                title="Descartar este pedido en espera"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
