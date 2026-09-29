import React, { useState, useMemo } from 'react';
import { 
  Award, Clock, AlertTriangle, ShieldCheck, Thermometer, Filter, 
  Search, ArrowUpRight, CheckCircle2, XCircle, TrendingUp, 
  MapPin, User, Calendar, Truck, ShieldAlert, FileSpreadsheet
} from 'lucide-react';
import { deliveryRouteService } from '../../../services/deliveryRouteService';

export const DeliveryGovernanceTab: React.FC = () => {
  const [filtroSLA, setFiltroSLA] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const metricas = useMemo(() => {
    return deliveryRouteService.obtenerMetricasGobernanzaOTIF();
  }, []);

  const registrosFiltrados = useMemo(() => {
    return metricas.registrosAuditoria.filter((reg) => {
      const matchSLA = filtroSLA === 'TODOS' || reg.cumplimientoSLA === filtroSLA;
      const q = searchTerm.toLowerCase();
      const matchSearch =
        reg.numeroPedido.toLowerCase().includes(q) ||
        reg.clienteNombre.toLowerCase().includes(q) ||
        reg.conductor.toLowerCase().includes(q) ||
        reg.zonaRuta.toLowerCase().includes(q) ||
        reg.numeroManifiesto.toLowerCase().includes(q);
      return matchSLA && matchSearch;
    });
  }, [metricas, filtroSLA, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header y Resumen Ejecutivo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-indigo-400" />
            Gobernanza de Entregas & Auditoría OTIF (On-Time In-Full)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Métricas de cumplimiento de tiempos pactados con el cliente, control de frío y trazabilidad de eventualidades.
          </p>
        </div>
      </div>

      {/* KPI Cards de Gobernanza */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: OTIF */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/20 shadow-lg">
          <div className="flex items-center justify-between text-indigo-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Cumplimiento OTIF</span>
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-white">
              {metricas.porcentajeOTIF}%
            </span>
            <span className="text-xs text-emerald-400 font-semibold">
              ({metricas.entregadosATiempo}/{metricas.totalEntregados} a tiempo)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Entregas ejecutadas exactamente en la fecha y jornada pactada con el cliente.
          </p>
        </div>

        {/* KPI 2: Tiempos de Ciclo */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-950/40 via-slate-900 to-slate-900 border border-sky-500/20 shadow-lg">
          <div className="flex items-center justify-between text-sky-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tiempos de Ciclo Promedio</span>
            <Clock className="w-5 h-5" />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div>
              <span className="text-[11px] text-slate-400 block">Tránsito</span>
              <span className="text-xl font-bold font-mono text-sky-300">
                {metricas.promedioTransitoMin} min
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">En Cliente</span>
              <span className="text-xl font-bold font-mono text-teal-300">
                {metricas.promedioAtencionMin} min
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Desde salida de bodega hasta descarga y cobro.
          </p>
        </div>

        {/* KPI 3: Control de Devoluciones a Cuarentena */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/20 shadow-lg">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Devoluciones en Cuarentena</span>
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-amber-400">
              {metricas.totalDevolucionesCuarentena}
            </span>
            <span className="text-xs text-slate-400">
              unid/Kg (-${metricas.montoTotalDevoluciones.toLocaleString('es-CO')})
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Mercancía rechazada retenida en aislamiento sanitario para inspección.
          </p>
        </div>

        {/* KPI 4: Eventualidades de Ruta */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/20 shadow-lg">
          <div className="flex items-center justify-between text-rose-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Eventualidades en Ruta</span>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-rose-400">
              {metricas.totalIncidencias}
            </span>
            <span className="text-xs text-slate-400">reportes auditados</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Incidencias de tráfico, demoras en muelle o vehículos en tránsito.
          </p>
        </div>
      </div>

      {/* Filtros y Buscador */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-300">Estatus SLA:</span>
          {['TODOS', 'A_TIEMPO', 'DEMORADO', 'ANTICIPADO'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFiltroSLA(s)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                filtroSLA === s
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, conductor o pedido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Tabla de Trazabilidad y Auditoría Enterprise */}
      <div className="rounded-2xl border border-white/10 overflow-hidden bg-slate-900/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-white/10 text-slate-400 uppercase tracking-wider font-bold">
              <tr>
                <th className="p-3.5">Pedido & Cliente</th>
                <th className="p-3.5">Manifiesto & Conductor</th>
                <th className="p-3.5">Fecha Requerida</th>
                <th className="p-3.5">Cronología de Entrega</th>
                <th className="p-3.5">Tiempos Ciclo</th>
                <th className="p-3.5">Estatus SLA</th>
                <th className="p-3.5">Recaudo / Medio</th>
                <th className="p-3.5">Novedades</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {registrosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No hay registros de auditoría que coincidan con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                registrosFiltrados.map((reg, idx) => (
                  <tr key={`${reg.pedidoId}-${idx}`} className="hover:bg-slate-800/30 transition-colors">
                    {/* Pedido & Cliente */}
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-indigo-400 block">
                        #{reg.numeroPedido}
                      </span>
                      <span className="font-bold text-white text-sm block">
                        {reg.clienteNombre}
                      </span>
                      <span className="text-[10px] text-slate-400">{reg.zonaRuta}</span>
                    </td>

                    {/* Manifiesto & Conductor */}
                    <td className="p-3.5">
                      <span className="text-slate-300 font-semibold block">{reg.conductor}</span>
                      <span className="text-[11px] font-mono text-emerald-400">
                        {reg.vehiculoPlaca}
                      </span>
                      {reg.temperaturaSalida !== undefined && (
                        <span className="text-[10px] text-sky-400 block">
                          Frío: {reg.temperaturaSalida}°C
                        </span>
                      )}
                    </td>

                    {/* Fecha Requerida Cliente */}
                    <td className="p-3.5">
                      <span className="text-white font-medium block">
                        {reg.fechaRequerida || 'No esp.'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Jornada: {reg.jornadaRequerida || 'AM'}
                      </span>
                    </td>

                    {/* Cronología */}
                    <td className="p-3.5 space-y-0.5 text-[11px]">
                      {reg.horaSalida && (
                        <div className="text-slate-400">
                          Salida: <span className="text-slate-200">{new Date(reg.horaSalida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                      {reg.horaLlegada && (
                        <div className="text-sky-400">
                          Puerta: <span className="font-bold">{new Date(reg.horaLlegada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                      {reg.horaEntrega && (
                        <div className="text-emerald-400">
                          Entrega: <span className="font-bold">{new Date(reg.horaEntrega).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                    </td>

                    {/* Tiempos de Ciclo */}
                    <td className="p-3.5 text-[11px]">
                      <div>
                        Tránsito: <b className="text-sky-300">{reg.tiempoTransitoMin ? `${reg.tiempoTransitoMin} min` : '-'}</b>
                      </div>
                      <div>
                        Atención: <b className="text-teal-300">{reg.tiempoAtencionMin ? `${reg.tiempoAtencionMin} min` : '-'}</b>
                      </div>
                    </td>

                    {/* Estatus SLA */}
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          reg.cumplimientoSLA === 'A_TIEMPO'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : reg.cumplimientoSLA === 'ANTICIPADO'
                            ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                            : reg.cumplimientoSLA === 'DEMORADO'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {reg.cumplimientoSLA === 'A_TIEMPO' && <CheckCircle2 className="w-3 h-3" />}
                        {reg.cumplimientoSLA === 'DEMORADO' && <XCircle className="w-3 h-3" />}
                        {reg.cumplimientoSLA}
                      </span>
                    </td>

                    {/* Recaudo */}
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-white block">
                        ${(reg.montoCobrado || 0).toLocaleString('es-CO')}
                      </span>
                      <span className="text-[10px] text-slate-400">{reg.formaPago || 'PENDIENTE'}</span>
                    </td>

                    {/* Novedades / Devolución */}
                    <td className="p-3.5">
                      {reg.tieneDevolucion && (
                        <span className="inline-block px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold mr-1 mb-1">
                          En Cuarentena
                        </span>
                      )}
                      {reg.incidencias.length > 0 ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold">
                          {reg.incidencias.length} Incidencia(s)
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">Sin novedad</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
