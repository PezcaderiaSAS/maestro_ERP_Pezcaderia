import React from 'react';
import { FileText, Edit, Send, CheckCircle2, PauseCircle, Truck, DollarSign, XCircle, Eye } from 'lucide-react';
import { DenseTableRow } from '../../../components/ui/DenseTableRow';
import { DenseBadge, DenseBadgeVariant } from '../../../components/ui/DenseBadge';
import { FluidResponsiveCard } from '../../../components/ui/FluidResponsiveCard';

interface QuoteHistoryTabProps {
  quotations: any[];
  onSelectQuoteForPrint: (q: any) => void;
  onEditQuote: (q: any) => void;
  onTransitionQuote: (id: string, newStatus: string) => void;
}

export const QuoteHistoryTab: React.FC<QuoteHistoryTabProps> = ({
  quotations,
  onSelectQuoteForPrint,
  onEditQuote,
  onTransitionQuote,
}) => {
  const getBadgeVariant = (estado: string): DenseBadgeVariant => {
    switch (estado) {
      case 'Approved': return 'emerald';
      case 'Sent': return 'sky';
      case 'Pausado': return 'amber';
      case 'Listo': return 'purple';
      case 'Sold':
      case 'Facturado': return 'emerald';
      case 'Expired': return 'rose';
      default: return 'zinc';
    }
  };

  return (
    <div className="w-full bg-zinc-950 border border-zinc-800/80 rounded-sm p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <span>Cotizaciones Registradas</span>
            <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.2 rounded-sm">
              {quotations.length}
            </span>
          </h3>
          <p className="text-[11px] text-zinc-400">
            Historial de flujo de trabajo documental, aprobaciones y facturación
          </p>
        </div>
      </div>

      {quotations.length === 0 ? (
        <div className="py-12 text-center text-zinc-500 flex flex-col items-center justify-center gap-2 bg-zinc-900/30 rounded-sm border border-dashed border-zinc-800">
          <FileText className="w-8 h-8 text-zinc-600" />
          <span className="font-medium text-xs text-zinc-300">No hay cotizaciones registradas</span>
          <span className="text-[11px] text-zinc-500">Usa la pestaña "Nuevo Cotizador" para emitir una nueva propuesta.</span>
        </div>
      ) : (
        <>
          {/* VISTA MÓVIL / TABLET (Tarjetas Fluidas Antifugas) */}
          <div className="grid grid-cols-1 md:hidden gap-2">
            {quotations.map((q: any) => (
              <FluidResponsiveCard
                key={`card-${q.id}`}
                title={`#${q.no || 'COT'} - ${q.clientName}`}
                subtitle={`Fecha: ${q.fecha} | NIT: ${q.clientIdent || 'N/A'}`}
                badge={<DenseBadge label={q.estado} variant={getBadgeVariant(q.estado)} />}
                rightAction={
                  <span className="font-mono font-bold text-zinc-100 text-xs">
                    ${q.total.toLocaleString('es-CO')}
                  </span>
                }
              >
                <div className="flex items-center justify-between text-[11px] text-zinc-400 border-t border-zinc-800/60 pt-2 mt-1">
                  <span>{q.clientType || 'Canal General'}</span>
                  <span>{q.items?.reduce((sum: number, i: any) => sum + i.cantidad, 0)} uds</span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2 mt-1 border-t border-zinc-800/40">
                  <button
                    onClick={() => onSelectQuoteForPrint(q)}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] rounded-sm transition-colors"
                  >
                    <Eye className="w-3 h-3 text-sky-400" />
                    <span>PDF</span>
                  </button>

                  {q.estado !== 'Sold' && q.estado !== 'Facturado' && (
                    <button
                      onClick={() => onEditQuote(q)}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-amber-950/40 border border-amber-800/50 hover:bg-amber-900/60 text-amber-300 text-[10px] rounded-sm transition-colors"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Editar</span>
                    </button>
                  )}

                  {['Creado', 'Draft'].includes(q.estado) && (
                    <button
                      onClick={() => onTransitionQuote(q.id, 'Sent')}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-sky-900/50 border border-sky-700/50 hover:bg-sky-800 text-sky-200 text-[10px] rounded-sm transition-colors"
                    >
                      <Send className="w-3 h-3" />
                      <span>Enviar</span>
                    </button>
                  )}

                  {['Creado', 'Sent'].includes(q.estado) && (
                    <button
                      onClick={() => onTransitionQuote(q.id, 'Approved')}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-900/50 border border-emerald-700/50 hover:bg-emerald-800 text-emerald-200 text-[10px] rounded-sm transition-colors"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Aprobar</span>
                    </button>
                  )}

                  {q.estado === 'Approved' && (
                    <button
                      onClick={() => onTransitionQuote(q.id, 'Listo')}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-purple-900/50 border border-purple-700/50 hover:bg-purple-800 text-purple-200 text-[10px] rounded-sm transition-colors"
                    >
                      <Truck className="w-3 h-3" />
                      <span>Listo Despacho</span>
                    </button>
                  )}

                  {q.estado === 'Listo' && (
                    <button
                      onClick={() => onTransitionQuote(q.id, 'Sold')}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[10px] rounded-sm transition-colors"
                    >
                      <DollarSign className="w-3 h-3" />
                      <span>Facturar</span>
                    </button>
                  )}
                </div>
              </FluidResponsiveCard>
            ))}
          </div>

          {/* VISTA ESCRITORIO (Tabla Quirúrgica de Alta Densidad Linear) */}
          <div className="hidden md:block overflow-x-auto border border-zinc-800/80 rounded-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="h-7 bg-zinc-900/90 border-b border-zinc-800 text-[11px] font-mono uppercase tracking-wider text-zinc-400 select-none">
                  <th className="px-2.5 py-0 font-medium w-16">Doc #</th>
                  <th className="px-2 py-0 font-medium w-24">Fecha</th>
                  <th className="px-2 py-0 font-medium">Cliente</th>
                  <th className="px-2 py-0 font-medium w-24">Canal</th>
                  <th className="px-2 py-0 font-medium text-right w-16">Items</th>
                  <th className="px-2.5 py-0 font-medium text-right w-28">Total Neto</th>
                  <th className="px-2 py-0 font-medium text-center w-28">Estado</th>
                  <th className="px-2.5 py-0 font-medium text-right w-44">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/40">
                {quotations.map((q: any) => (
                  <DenseTableRow key={`table-${q.id}`}>
                    <td className="px-2.5 py-0 font-mono font-semibold text-sky-400 whitespace-nowrap">
                      {q.no}
                    </td>
                    <td className="px-2 py-0 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                      {q.fecha}
                    </td>
                    <td className="px-2 py-0">
                      <div className="font-medium text-zinc-200 truncate max-w-[200px]">{q.clientName}</div>
                      <div className="text-[10px] font-mono text-zinc-500">NIT: {q.clientIdent || 'N/A'}</div>
                    </td>
                    <td className="px-2 py-0">
                      <span className="text-[10px] px-1.5 py-0.2 rounded-sm bg-zinc-900 border border-zinc-800 text-zinc-300">
                        {q.clientType || 'General'}
                      </span>
                    </td>
                    <td className="px-2 py-0 text-right font-mono text-zinc-300">
                      {q.items?.reduce((sum: number, i: any) => sum + i.cantidad, 0)} uds
                    </td>
                    <td className="px-2.5 py-0 text-right font-mono font-bold text-zinc-100">
                      ${q.total.toLocaleString('es-CO')}
                    </td>
                    <td className="px-2 py-0 text-center">
                      <DenseBadge label={q.estado} variant={getBadgeVariant(q.estado)} />
                    </td>
                    <td className="px-2.5 py-0 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onSelectQuoteForPrint(q)}
                          title="Ver PDF"
                          className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-sm transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {q.estado !== 'Sold' && q.estado !== 'Facturado' && (
                          <button
                            onClick={() => onEditQuote(q)}
                            title="Editar"
                            className="p-1 hover:bg-zinc-800 text-amber-400 hover:text-amber-300 rounded-sm transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {['Creado', 'Draft'].includes(q.estado) && (
                          <button
                            onClick={() => onTransitionQuote(q.id, 'Sent')}
                            title="Enviar al cliente"
                            className="px-1.5 py-0.5 text-[10px] bg-sky-950/60 border border-sky-800/60 hover:bg-sky-900/60 text-sky-400 rounded-sm transition-colors"
                          >
                            Enviar
                          </button>
                        )}

                        {['Creado', 'Sent'].includes(q.estado) && (
                          <button
                            onClick={() => onTransitionQuote(q.id, 'Approved')}
                            title="Aprobar Cotización"
                            className="px-1.5 py-0.5 text-[10px] bg-emerald-950/60 border border-emerald-800/60 hover:bg-emerald-900/60 text-emerald-400 rounded-sm transition-colors"
                          >
                            Aprobar
                          </button>
                        )}

                        {q.estado === 'Approved' && (
                          <button
                            onClick={() => onTransitionQuote(q.id, 'Listo')}
                            title="Listo para Despacho"
                            className="px-1.5 py-0.5 text-[10px] bg-purple-950/60 border border-purple-800/60 hover:bg-purple-900/60 text-purple-400 rounded-sm transition-colors"
                          >
                            Listo
                          </button>
                        )}

                        {q.estado === 'Listo' && (
                          <button
                            onClick={() => onTransitionQuote(q.id, 'Sold')}
                            title="Facturar y Liquidar"
                            className="px-1.5 py-0.5 text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-sm transition-colors"
                          >
                            Facturar
                          </button>
                        )}
                      </div>
                    </td>
                  </DenseTableRow>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
