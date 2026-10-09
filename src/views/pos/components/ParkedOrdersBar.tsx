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
    <div className="flex flex-col gap-1.5 px-3 py-2 bg-slate-50 border-b border-slate-200 shrink-0">
      <div className="flex items-center justify-between text-[11px] text-slate-600 font-semibold">
        <div className="flex items-center gap-1.5">
          <PauseCircle size={13} className="text-indigo-600" />
          <span className="text-slate-800 font-bold">Ventas en Espera & Multicliente</span>
          {drafts.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 font-mono text-[10px] font-bold">
              {drafts.length}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onNewParkedSale}
          className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-900 border border-indigo-200 transition-all text-[11px] font-bold cursor-pointer active:scale-95"
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
              ? 'bg-indigo-100 text-indigo-900 border-indigo-300 shadow-sm'
              : 'bg-white text-slate-600 border-slate-200'
          }`}
        >
          <ShoppingCart size={13} className="text-indigo-600" />
          <span>Venta Activa</span>
          <span className="font-mono text-[10px] bg-indigo-50 px-1.5 py-0.5 rounded text-indigo-800 border border-indigo-200">
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
                  ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-sm ring-1 ring-amber-400'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300 hover:bg-amber-50/50'
              }`}
              title={`Clic para retomar el pedido de ${alias}`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <PauseCircle size={12} className={isSelected ? 'text-amber-600' : 'text-slate-400'} />
                <span className="truncate max-w-[110px]">{alias}</span>
                <span className="font-mono text-[10px] text-amber-800 bg-amber-100 px-1 py-0.2 rounded border border-amber-200">
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
                className="p-0.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors ml-1"
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
