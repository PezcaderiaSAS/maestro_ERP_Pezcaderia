import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Package,
  ThermometerSnowflake,
  CreditCard,
  Banknote,
  RotateCcw,
  Truck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { OtifStopRecord } from '../../../types/otif.types';

interface OtifAuditDetailTableProps {
  paradas: OtifStopRecord[];
}

const ITEMS_POR_PAGINA = 10;

export const OtifAuditDetailTable: React.FC<OtifAuditDetailTableProps> = ({
  paradas,
}) => {
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);

  // Filtrado reactivo en memoria por texto de búsqueda
  const paradasFiltradas = useMemo(() => {
    if (!terminoBusqueda.trim()) return paradas;
    const query = terminoBusqueda.toLowerCase();
    return paradas.filter(
      (p) =>
        p.numeroPedido.toLowerCase().includes(query) ||
        p.clienteNombre.toLowerCase().includes(query) ||
        p.conductorNombre.toLowerCase().includes(query) ||
        p.numeroManifiesto.toLowerCase().includes(query) ||
        p.zonaRuta.toLowerCase().includes(query)
    );
  }, [paradas, terminoBusqueda]);

  // Paginación
  const totalPaginas = Math.ceil(paradasFiltradas.length / ITEMS_POR_PAGINA) || 1;
  const indiceInicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
  const paradasPaginadas = paradasFiltradas.slice(
    indiceInicio,
    indiceInicio + ITEMS_POR_PAGINA
  );

  const formatearHora = (isoDate?: string) => {
    if (!isoDate) return 'N/R';
    try {
      return new Date(isoDate).toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/R';
    }
  };

  const getFormaPagoIcon = (forma?: string) => {
    if (forma === 'EFECTIVO') return <Banknote className="w-3.5 h-3.5 text-emerald-600" />;
    return <CreditCard className="w-3.5 h-3.5 text-blue-600" />;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Barra Superior con Título y Buscador */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Auditoría Detallada de Paradas y Entregas
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Trazabilidad punto a punto de órdenes, tiempos de arribo, cobros y novedades
          </p>
        </div>

        {/* Buscador Táctil */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar pedido, cliente, chofer..."
            value={terminoBusqueda}
            onChange={(e) => {
              setTerminoBusqueda(e.target.value);
              setPaginaActual(1);
            }}
            className="w-full min-h-[44px] pl-10 pr-4 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Pedido / Cliente</th>
              <th className="py-3 px-3">Conductor & Zona</th>
              <th className="py-3 px-3 text-center">Horario Pactado vs Real</th>
              <th className="py-3 px-3 text-center">Atención</th>
              <th className="py-3 px-3 text-center">Cumplimiento OTIF</th>
              <th className="py-3 px-3 text-center">Temp. (°C)</th>
              <th className="py-3 px-4 text-right">Monto Cobrado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
            {paradasPaginadas.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 text-sm">
                  No se encontraron paradas que coincidan con los criterios de búsqueda.
                </td>
              </tr>
            ) : (
              paradasPaginadas.map((parada) => {
                const tieneDevolucion = parada.tieneDevolucion && parada.totalKilosDevueltos > 0;

                return (
                  <tr
                    key={parada.pedidoId}
                    className="hover:bg-slate-50/70 transition-colors min-h-[50px]"
                  >
                    {/* Pedido y Cliente */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-xs">
                        {parada.clienteNombre}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="font-semibold text-blue-600">
                          {parada.numeroPedido}
                        </span>
                        <span>•</span>
                        <span>Manifiesto: {parada.numeroManifiesto}</span>
                      </div>
                    </td>

                    {/* Conductor y Zona */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">
                        {parada.conductorNombre}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Truck className="w-3 h-3 text-slate-400" />
                        <span>{parada.zonaRuta}</span>
                      </div>
                    </td>

                    {/* Horarios */}
                    <td className="py-3 px-3 text-center">
                      <div className="inline-block text-left text-[11px]">
                        <div>
                          <span className="text-slate-400">Pactada: </span>
                          <span className="font-medium">
                            {formatearHora(parada.horaLimitePactada)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Entrega: </span>
                          <span
                            className={`font-bold ${
                              parada.onTime ? 'text-slate-800' : 'text-rose-600'
                            }`}
                          >
                            {formatearHora(parada.horaEntregaEfectiva)}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Tiempo de Atención */}
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {parada.tiempoAtencionMinutos || 0} min
                      </span>
                    </td>

                    {/* Cumplimiento OTIF Badges */}
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex flex-col gap-1 items-center">
                        {parada.isOtif ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            OTIF Conforme
                          </span>
                        ) : (
                          <div className="flex flex-wrap items-center justify-center gap-1">
                            {!parada.onTime && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                                Demorado
                              </span>
                            )}
                            {!parada.inFull && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                Incompleto
                              </span>
                            )}
                            {parada.estadoEntrega === 'NO_ENTREGADO_RECHAZADO' && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-800 border border-red-300">
                                Rechazado
                              </span>
                            )}
                          </div>
                        )}
                        {tieneDevolucion && (
                          <span className="text-[10px] text-rose-600 font-semibold flex items-center gap-0.5">
                            <RotateCcw className="w-2.5 h-2.5" />
                            {parada.totalKilosDevueltos} kg devueltos
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Temperatura */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-lg border ${
                          parada.estadoCadenaFrio === 'CONFORME'
                            ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                            : parada.estadoCadenaFrio === 'ALERTA'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        <ThermometerSnowflake className="w-3 h-3" />
                        {parada.temperaturaEntregaCelsius !== undefined
                          ? `${parada.temperaturaEntregaCelsius}°C`
                          : 'N/R'}
                      </span>
                    </td>

                    {/* Monto Cobrado */}
                    <td className="py-3 px-4 text-right">
                      <div className="font-bold text-slate-900">
                        ${(parada.montoCobrado || 0).toLocaleString('es-CO')}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center justify-end gap-1 mt-0.5">
                        {getFormaPagoIcon(parada.formaPago)}
                        <span>{parada.formaPago || 'PENDIENTE'}</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pie de Tabla: Paginación */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
        <div>
          Mostrando{' '}
          <strong className="text-slate-900">
            {paradasFiltradas.length > 0 ? indiceInicio + 1 : 0}
          </strong>{' '}
          a{' '}
          <strong className="text-slate-900">
            {Math.min(indiceInicio + ITEMS_POR_PAGINA, paradasFiltradas.length)}
          </strong>{' '}
          de <strong className="text-slate-900">{paradasFiltradas.length}</strong> paradas
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
            disabled={paginaActual === 1}
            className="min-h-[38px] px-3 bg-white border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>
          <span className="font-semibold text-slate-800 px-2">
            {paginaActual} / {totalPaginas}
          </span>
          <button
            type="button"
            onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
            disabled={paginaActual >= totalPaginas}
            className="min-h-[38px] px-3 bg-white border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
