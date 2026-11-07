import React, { useState } from 'react';
import { Clock, RefreshCw, Scissors, Search, User, Receipt, AlertCircle } from 'lucide-react';
import type { CartDraft } from '../../../types/pos.types';

export interface LiveComandasQueuePanelProps {
  comandas: CartDraft[];
  selectedComandaId: string | null;
  onSelectComanda: (comanda: CartDraft) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const LiveComandasQueuePanel: React.FC<LiveComandasQueuePanelProps> = ({
  comandas,
  selectedComandaId,
  onSelectComanda,
  onRefresh,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredComandas = comandas.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const alias = (c.alias || '').toLowerCase();
    const cliente = (c.cliente?.nombre || '').toLowerCase();
    const asesor = (c.asesorNombre || '').toLowerCase();
    const notas = (c.notas || c.detallesDespacho || '').toLowerCase();
    return alias.includes(term) || cliente.includes(term) || asesor.includes(term) || notas.includes(term);
  });

  return (
    <div
      data-testid="live-comandas-queue-panel"
      className="flex flex-col h-full min-h-0 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl select-none"
    >
      {/* ── Encabezado de la Cola FIFO ── */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Receipt size={18} />
            {comandas.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            )}
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-black tracking-wide text-white uppercase flex items-center gap-2">
              <span>Cola en Vivo</span>
              <span
                data-testid="comandas-counter-badge"
                className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/30"
              >
                {comandas.length} {comandas.length === 1 ? 'comanda' : 'comandas'}
              </span>
            </h2>
            <p className="text-[10px] text-slate-400">Preventas emitidas por asesores de mostrador</p>
          </div>
        </div>

        {onRefresh && (
          <button
            type="button"
            data-testid="btn-refresh-comandas"
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-white/10 transition-all active:scale-95 cursor-pointer"
            title="Refrescar cola de comandas"
            aria-label="Refrescar cola de comandas"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin text-cyan-400' : ''} />
          </button>
        )}
      </div>

      {/* ── Barra de Búsqueda Rápida ── */}
      <div className="pt-2 pb-1.5 shrink-0">
        <div className="relative flex items-center">
          <Search size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            data-testid="input-filter-comandas"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por turno, asesor, cliente..."
            className="w-full h-8 pl-8 pr-3 text-xs rounded-xl bg-slate-950/60 border border-white/10 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
          />
        </div>
      </div>

      {/* ── Listado FIFO de Tarjetas Táctiles ── */}
      <div
        data-testid="comandas-list-container"
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1 py-1 space-y-2 custom-scrollbar"
      >
        {filteredComandas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-4 rounded-xl border border-dashed border-white/10 bg-white/5 my-auto">
            <AlertCircle size={28} className="text-slate-500 mb-2" />
            <span className="text-xs font-bold text-slate-300">
              {searchTerm ? 'No hay comandas que coincidan' : 'Sin comandas en espera'}
            </span>
            <span className="text-[10px] text-slate-500 mt-1 max-w-[200px]">
              {searchTerm
                ? 'Prueba borrando el término de búsqueda.'
                : 'Las preventas emitidas desde mostrador aparecerán aquí en orden de llegada.'}
            </span>
          </div>
        ) : (
          filteredComandas.map((c, index) => {
            const isSelected = selectedComandaId === c.id;
            const total = Number(c.totalFinal ?? c.total ?? 0);
            const itemsCount = (c.lineas || []).length;
            const time = c.fechaGuardado || c.fecha;
            const formattedTime = time
              ? new Date(time).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
              : '';
            const notas = c.notas || c.detallesDespacho;

            return (
              <div
                key={c.id}
                data-testid={`comanda-card-${c.id}`}
                onClick={() => onSelectComanda(c)}
                className={`group relative flex flex-col gap-1.5 p-2.5 rounded-xl border transition-all cursor-pointer min-h-[58px] ${
                  isSelected
                    ? 'bg-cyan-950/50 border-cyan-400 shadow-lg shadow-cyan-950/50 ring-2 ring-cyan-500/40'
                    : 'bg-slate-800/60 hover:bg-slate-800/90 border-white/10 hover:border-cyan-500/30 shadow-md'
                }`}
              >
                {/* Fila 1: Turno / Consecutivo + Hora */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="flex items-center justify-center w-5 h-5 rounded-md bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-black shrink-0">
                      #{index + 1}
                    </span>
                    <span className="font-mono font-black text-xs text-white tracking-tight truncate">
                      {c.alias || `PRE-${c.id.slice(0, 6)}`}
                    </span>
                  </div>

                  {formattedTime && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono shrink-0">
                      <Clock size={11} />
                      <span>{formattedTime}</span>
                    </div>
                  )}
                </div>

                {/* Fila 2: Asesor y Cliente */}
                <div className="flex items-center justify-between gap-1 text-[11px] text-slate-300">
                  <div className="flex items-center gap-1 truncate">
                    <User size={12} className="text-cyan-400 shrink-0" />
                    <span className="font-semibold truncate">
                      {c.asesorNombre || 'Asesor Mostrador'}
                    </span>
                    {c.cliente?.nombre && (
                      <span className="text-slate-400 truncate">
                        • {c.cliente.nombre}
                      </span>
                    )}
                  </div>

                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-900/80 text-slate-300 border border-white/5 shrink-0">
                    {itemsCount} {itemsCount === 1 ? 'ítem' : 'ítems'}
                  </span>
                </div>

                {/* Fila 3: Notas de corte / despacho (si existen) */}
                {notas && (
                  <div className="flex items-center gap-1 text-[10px] text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-lg truncate">
                    <Scissors size={11} className="shrink-0" />
                    <span className="truncate">{notas}</span>
                  </div>
                )}

                {/* Fila 4: Total a Cobrar */}
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Total a Liquidar:
                  </span>
                  <span className="font-mono font-black text-sm text-emerald-400 tabular-nums">
                    ${total.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

