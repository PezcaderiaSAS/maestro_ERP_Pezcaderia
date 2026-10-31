import React, { useState } from 'react';
import { Clock, CheckCircle2, AlertCircle, XCircle, RefreshCw, ChevronRight, ChevronLeft, Receipt, UserCheck } from 'lucide-react';

export type EstadoTicket = 'EN_COLA' | 'EN_PROCESO' | 'COBRADO' | 'CANCELADO';

export interface VendorTicket {
  id: string;
  codigoPreventa: string;
  clienteNombre: string;
  clienteDocumento?: string;
  total: number;
  itemsCount: number;
  estado: EstadoTicket;
  notas?: string;
  detallesDespacho?: string;
  fechaCreacion: string;
  vendedorId?: string;
  vendedorNombre?: string;
}

export interface VendorTicketSidebarProps {
  tickets: VendorTicket[];
  vendedorNombre?: string;
  onRecuperarTicket: (ticketId: string) => void;
  onCancelarTicket: (ticketId: string) => void;
  isOpen?: boolean;
  onToggleOpen?: () => void;
}

export const VendorTicketSidebar: React.FC<VendorTicketSidebarProps> = ({
  tickets,
  vendedorNombre = 'Asesor Mostrador',
  onRecuperarTicket,
  onCancelarTicket,
  isOpen = true,
  onToggleOpen,
}) => {
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | EstadoTicket>('TODOS');

  const filteredTickets = tickets.filter((t) => {
    if (filtroEstado === 'TODOS') return true;
    return t.estado === filtroEstado;
  });

  const getStatusBadge = (estado: EstadoTicket) => {
    switch (estado) {
      case 'EN_COLA':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock size={11} className="animate-pulse" />
            EN COLA
          </span>
        );
      case 'EN_PROCESO':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <RefreshCw size={11} className="animate-spin" />
            EN CAJA
          </span>
        );
      case 'COBRADO':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 size={11} />
            COBRADO
          </span>
        );
      case 'CANCELADO':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/30">
            <XCircle size={11} />
            CANCELADO
          </span>
        );
    }
  };

  const countEnCola = tickets.filter((t) => t.estado === 'EN_COLA').length;
  const countCobrados = tickets.filter((t) => t.estado === 'COBRADO').length;

  return (
    <aside
      data-testid="vendor-ticket-sidebar"
      className={`relative flex flex-col bg-slate-900/95 border-l border-white/10 backdrop-blur-2xl transition-all duration-300 z-20 ${
        isOpen ? 'w-80 sm:w-88' : 'w-12'
      } h-full select-none shadow-2xl`}
    >
      {/* Botón Flotante Toggle Colapso */}
      <button
        type="button"
        onClick={onToggleOpen}
        aria-label={isOpen ? 'Contraer panel de preventas' : 'Expandir panel de preventas'}
        className="absolute -left-3.5 top-6 w-7 h-7 bg-slate-800 border border-white/20 text-cyan-400 hover:text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-105 active:scale-95 transition-all z-30"
      >
        {isOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Vista Colapsada */}
      {!isOpen && (
        <div className="flex flex-col items-center py-6 gap-6 h-full text-slate-400">
          <div className="rotate-90 origin-center text-xs font-black uppercase tracking-widest text-cyan-400 whitespace-nowrap mt-8">
            Preventas ({countEnCola})
          </div>
          <div className="flex flex-col gap-3 mt-auto mb-4 items-center">
            {countEnCola > 0 && (
              <span
                className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500 text-amber-400 text-xs font-black flex items-center justify-center animate-pulse"
                title={`${countEnCola} preventas en cola`}
              >
                {countEnCola}
              </span>
            )}
            {countCobrados > 0 && (
              <span
                className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 text-xs font-black flex items-center justify-center"
                title={`${countCobrados} preventas cobradas hoy`}
              >
                {countCobrados}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Vista Expandida */}
      {isOpen && (
        <div className="flex flex-col h-full min-h-0">
          {/* Header */}
          <div className="p-3.5 border-b border-white/10 bg-slate-950/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="text-cyan-400" size={18} />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-100">
                  Mis Preventas Activas
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                {tickets.length} Hoy
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-400">
              <UserCheck size={13} className="text-cyan-400/80" />
              <span className="truncate font-semibold">Asesor: {vendedorNombre}</span>
            </div>

            {/* Micro-Filtro de Estados */}
            <div className="flex gap-1 mt-2.5">
              {(['TODOS', 'EN_COLA', 'COBRADO'] as const).map((est) => (
                <button
                  key={est}
                  type="button"
                  onClick={() => setFiltroEstado(est)}
                  className={`flex-1 py-1 text-[10px] font-black rounded-lg border transition-all cursor-pointer ${
                    filtroEstado === est
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-sm'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {est === 'TODOS' ? 'Todos' : est === 'EN_COLA' ? `Cola (${countEnCola})` : `Listos (${countCobrados})`}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Tickets con scroll */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0 divide-y divide-white/5">
            {filteredTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500 text-xs p-4">
                <Clock size={28} className="mb-2 opacity-40 text-cyan-400" />
                <p className="font-semibold">Sin preventas registradas</p>
                <p className="text-[10px] text-slate-600 mt-0.5">
                  Las órdenes emitidas con F6 aparecerán aquí en tiempo real.
                </p>
              </div>
            ) : (
              filteredTickets.map((ticket) => {
                const canEdit = ticket.estado === 'EN_COLA';
                const isCobrado = ticket.estado === 'COBRADO';

                return (
                  <div
                    key={ticket.id}
                    data-testid={`card-ticket-${ticket.id}`}
                    className={`p-2.5 rounded-xl border transition-all ${
                      isCobrado
                        ? 'bg-emerald-950/20 border-emerald-500/30'
                        : ticket.estado === 'EN_PROCESO'
                        ? 'bg-blue-950/20 border-blue-500/30'
                        : 'bg-slate-950/40 border-white/10 hover:border-cyan-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <strong className="text-xs font-mono font-black text-cyan-300">
                            {ticket.codigoPreventa}
                          </strong>
                          {getStatusBadge(ticket.estado)}
                        </div>
                        <p className="text-[11px] font-bold text-slate-200 truncate mt-0.5 max-w-[170px]" title={ticket.clienteNombre}>
                          {ticket.clienteNombre}
                        </p>
                      </div>

                      <div className="text-right">
                        <strong className="text-xs font-mono font-black text-emerald-400">
                          ${ticket.total.toLocaleString('es-CO')}
                        </strong>
                        <span className="block text-[10px] text-slate-500 font-mono">
                          {ticket.itemsCount} {ticket.itemsCount === 1 ? 'ítem' : 'ítems'}
                        </span>
                      </div>
                    </div>

                    {ticket.notas && (
                      <p className="text-[10px] italic text-slate-400 bg-white/5 p-1 rounded mt-1.5 border border-white/5 truncate" title={ticket.notas}>
                        📝 {ticket.notas}
                      </p>
                    )}

                    {/* Acciones del Vendedor */}
                    <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-white/5">
                      <button
                        type="button"
                        data-testid={`btn-recuperar-${ticket.id}`}
                        disabled={!canEdit}
                        onClick={() => onRecuperarTicket(ticket.id)}
                        className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                          canEdit
                            ? 'bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 cursor-pointer active:scale-95'
                            : 'bg-white/5 text-slate-600 border border-white/5 cursor-not-allowed opacity-50'
                        }`}
                        title={
                          canEdit
                            ? 'Retomar pedido en mostrador para modificar ítems o cantidades'
                            : 'En proceso de recaudo en caja o ya finalizado'
                        }
                      >
                        <RefreshCw size={11} />
                        <span>{canEdit ? 'Editar en Carrito' : 'En Taquilla'}</span>
                      </button>

                      {canEdit && (
                        <button
                          type="button"
                          data-testid={`btn-cancelar-${ticket.id}`}
                          onClick={() => onCancelarTicket(ticket.id)}
                          className="py-1 px-2 rounded-lg text-[10px] font-bold bg-red-500/10 hover:bg-red-500/30 text-red-300 border border-red-500/30 transition-all cursor-pointer active:scale-95"
                          title="Anular preventa"
                        >
                          <XCircle size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
