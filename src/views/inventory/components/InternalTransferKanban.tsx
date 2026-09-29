import React, { useState, useMemo } from 'react';
import {
  Truck,
  ArrowRight,
  PlusCircle,
  CheckCircle2,
  Clock,
  Building2,
  Package,
  Scale,
  Search,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Send,
  PackageCheck,
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
  internalTransferService,
  InternalTransferRecord,
} from '../../../services/internalTransferService';
import { RestockRequestModal } from './RestockRequestModal';
import { TransferPickingModal } from './TransferPickingModal';
import { TransferReceivingChecklistModal } from './TransferReceivingChecklistModal';
import type { Product } from '../../../types/erp.types';

interface InternalTransferKanbanProps {
  products?: Product[];
  bodegaDestinoId?: string;
  bodegaDestinoNombre?: string;
}

export const InternalTransferKanban: React.FC<InternalTransferKanbanProps> = ({
  products = [],
  bodegaDestinoId = 'bodega-pos',
  bodegaDestinoNombre = 'Punto de Venta Mostrador',
}) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Modales
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [pickingTraslado, setPickingTraslado] = useState<InternalTransferRecord | null>(null);
  const [receivingTraslado, setReceivingTraslado] = useState<InternalTransferRecord | null>(null);

  // Obtener traslados
  const traslados = useMemo(() => {
    return internalTransferService.obtenerTraslados();
  }, [refreshTrigger]);

  // Filtrado por buscador
  const filteredTraslados = useMemo(() => {
    if (!searchTerm.trim()) return traslados;
    const term = searchTerm.toLowerCase();
    return traslados.filter(
      (t) =>
        t.numeroGuia.toLowerCase().includes(term) ||
        t.solicitadoPor.toLowerCase().includes(term) ||
        t.items.some((i) => i.nombre.toLowerCase().includes(term) || i.sku.toLowerCase().includes(term))
    );
  }, [traslados, searchTerm]);

  // Agrupamiento de 4 columnas
  const columnSolicitados = filteredTraslados.filter((t) => t.estado === 'SOLICITADO');
  const columnAlistamiento = filteredTraslados.filter((t) => t.estado === 'EN_ALISTAMIENTO');
  const columnTransito = filteredTraslados.filter((t) => t.estado === 'EN_TRANSITO');
  const columnRecibidos = filteredTraslados.filter(
    (t) => t.estado === 'RECIBIDO' || t.estado === 'RECIBIDO_CON_NOVEDAD'
  );

  const handleIniciarAlistamiento = (traslado: InternalTransferRecord) => {
    internalTransferService.iniciarAlistamiento(traslado.id, 'Bodeguero Central');
    setRefreshTrigger((prev) => prev + 1);
    setPickingTraslado(traslado);
  };

  const handleVerDetalleActa = (traslado: InternalTransferRecord) => {
    Swal.fire({
      title: `Detalle Guía ${traslado.numeroGuia}`,
      html: `
        <div class="text-left text-xs space-y-2 text-slate-300">
          <p><strong>Origen:</strong> ${traslado.bodegaOrigenNombre} ➔ <strong>Destino:</strong> ${traslado.bodegaDestinoNombre}</p>
          <p><strong>Solicitado por:</strong> ${traslado.solicitadoPor} (${traslado.pesoSolitadoTotalKg} KG)</p>
          <p><strong>Despachado por:</strong> ${traslado.despachadoPor || 'N/A'} (${traslado.pesoDespachadoTotalKg} KG)</p>
          <p><strong>Recibido por:</strong> ${traslado.recibidoPor || 'N/A'} (${traslado.pesoRecibidoTotalKg} KG)</p>
          ${traslado.tieneNovedades ? `<div class="p-2 bg-amber-500/10 border border-amber-500/30 rounded text-amber-300 font-semibold">⚠️ Traslado recibido con novedades en pesaje o faltantes.</div>` : ''}
          <div class="mt-2 border-t border-white/10 pt-2">
            <strong>Ítems:</strong>
            <ul class="list-disc pl-4 mt-1">
              ${traslado.items.map((i) => `<li>${i.nombre} - Solicitado: ${i.cantidadSolicitada} | Recibido: ${i.cantidadRecibida} ${i.novedadDetalle ? `(${i.novedadDetalle})` : ''}</li>`).join('')}
            </ul>
          </div>
        </div>
      `,
      background: '#0f172a',
      color: '#f8fafc',
      confirmButtonColor: '#0ea5e9',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Barra Superior con Controles */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide">
              Traslados Internos de Inventario (Bodega ➔ POS)
            </h3>
            <p className="text-xs text-slate-400">
              Flujo Pull: Solicitud ➔ Picking Báscula (FEFO) ➔ Tránsito ➔ Checklist con Novedades
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Buscador */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar guía o producto..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Botón de Nueva Solicitud Rápida */}
          <button
            type="button"
            onClick={() => setShowRequestModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            ⚡ Solicitar Reabastecimiento
          </button>
        </div>
      </div>

      {/* Tablero Kanban de 4 Columnas */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {/* COLUMNA 1: SOLICITADOS (POS) */}
        <div className="flex flex-col rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl overflow-hidden min-h-[500px]">
          <div className="p-3.5 border-b border-white/10 bg-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                1. Solicitados (POS)
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-white/10 text-xs font-mono font-bold text-amber-400">
              {columnSolicitados.length}
            </span>
          </div>

          <div className="p-3 space-y-3 flex-1 overflow-y-auto">
            {columnSolicitados.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs italic">
                Sin pedidos pendientes de atención
              </div>
            ) : (
              columnSolicitados.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl border border-white/10 bg-slate-800/60 hover:border-amber-500/40 transition-all space-y-2.5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-400">{t.numeroGuia}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        t.prioridad === 'CRITICA'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : t.prioridad === 'URGENTE'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {t.prioridad}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300">
                    <div className="font-medium text-white">{t.bodegaDestinoNombre}</div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between mt-1">
                      <span>{t.items.length} productos</span>
                      <strong className="text-cyan-400 font-mono">
                        {t.pesoSolitadoTotalKg.toFixed(2)} KG
                      </strong>
                    </div>
                  </div>

                  {t.observaciones && (
                    <div className="text-[11px] text-slate-400 italic line-clamp-2 bg-slate-900/60 p-1.5 rounded">
                      "{t.observaciones}"
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleIniciarAlistamiento(t)}
                    className="w-full py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-xs border border-amber-500/40 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    Iniciar Alistamiento Bodega
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMNA 2: EN ALISTAMIENTO (BODEGA) */}
        <div className="flex flex-col rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl overflow-hidden min-h-[500px]">
          <div className="p-3.5 border-b border-white/10 bg-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                2. En Alistamiento (Bodega)
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-white/10 text-xs font-mono font-bold text-blue-400">
              {columnAlistamiento.length}
            </span>
          </div>

          <div className="p-3 space-y-3 flex-1 overflow-y-auto">
            {columnAlistamiento.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs italic">
                Sin pedidos en preparación actualmente
              </div>
            ) : (
              columnAlistamiento.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl border border-blue-500/30 bg-slate-800/60 hover:border-blue-500/50 transition-all space-y-2.5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-400">{t.numeroGuia}</span>
                    <span className="text-[10px] text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full font-semibold">
                      Pesando en Báscula
                    </span>
                  </div>

                  <div className="text-xs text-slate-300">
                    <div className="font-medium text-white">{t.bodegaDestinoNombre}</div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between mt-1">
                      <span>{t.items.length} productos</span>
                      <strong className="text-blue-400 font-mono">
                        {t.pesoSolitadoTotalKg.toFixed(2)} KG
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPickingTraslado(t)}
                    className="w-full py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    Pesar y Despachar
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMNA 3: EN TRÁNSITO / ENTREGA */}
        <div className="flex flex-col rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl overflow-hidden min-h-[500px]">
          <div className="p-3.5 border-b border-white/10 bg-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                3. En Tránsito / Entrega
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-white/10 text-xs font-mono font-bold text-cyan-400">
              {columnTransito.length}
            </span>
          </div>

          <div className="p-3 space-y-3 flex-1 overflow-y-auto">
            {columnTransito.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs italic">
                Sin pedidos en tránsito al mostrador
              </div>
            ) : (
              columnTransito.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl border border-cyan-500/30 bg-slate-800/60 hover:border-cyan-500/50 transition-all space-y-2.5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-400">{t.numeroGuia}</span>
                    <span className="text-[10px] text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <Truck className="w-3 h-3" /> En Camino
                    </span>
                  </div>

                  <div className="text-xs text-slate-300">
                    <div className="font-medium text-white">{t.bodegaDestinoNombre}</div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between mt-1">
                      <span>Despachado:</span>
                      <strong className="text-emerald-400 font-mono">
                        {t.pesoDespachadoTotalKg.toFixed(2)} KG
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setReceivingTraslado(t)}
                    className="w-full py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all"
                  >
                    <PackageCheck className="w-3.5 h-3.5" />
                    Recibir en POS (Checklist)
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMNA 4: RECIBIDOS CONFORMES */}
        <div className="flex flex-col rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl overflow-hidden min-h-[500px]">
          <div className="p-3.5 border-b border-white/10 bg-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                4. Recibidos Conformes
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-white/10 text-xs font-mono font-bold text-emerald-400">
              {columnRecibidos.length}
            </span>
          </div>

          <div className="p-3 space-y-3 flex-1 overflow-y-auto">
            {columnRecibidos.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs italic">
                Sin traslados finalizados recientemente
              </div>
            ) : (
              columnRecibidos.map((t) => (
                <div
                  key={t.id}
                  className={`p-3.5 rounded-xl border transition-all space-y-2 shadow-sm ${
                    t.tieneNovedades
                      ? 'border-amber-500/30 bg-amber-500/5'
                      : 'border-emerald-500/30 bg-emerald-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-400">{t.numeroGuia}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                        t.tieneNovedades
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {t.tieneNovedades ? (
                        <>
                          <ShieldAlert className="w-3 h-3 text-amber-400" /> Con Novedades
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Conforme 100%
                        </>
                      )}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300">
                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Ingresado a POS:</span>
                      <strong className="text-emerald-400 font-mono">
                        {t.pesoRecibidoTotalKg.toFixed(2)} KG
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleVerDetalleActa(t)}
                    className="w-full py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold border border-white/10 transition-colors"
                  >
                    Ver Resumen y Novedades
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modales Bidireccionales */}
      <RestockRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        products={products}
        bodegaDestinoId={bodegaDestinoId}
        bodegaDestinoNombre={bodegaDestinoNombre}
        onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
      />

      <TransferPickingModal
        isOpen={!!pickingTraslado}
        onClose={() => setPickingTraslado(null)}
        traslado={pickingTraslado}
        onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
      />

      <TransferReceivingChecklistModal
        isOpen={!!receivingTraslado}
        onClose={() => setReceivingTraslado(null)}
        traslado={receivingTraslado}
        onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
      />
    </div>
  );
};
