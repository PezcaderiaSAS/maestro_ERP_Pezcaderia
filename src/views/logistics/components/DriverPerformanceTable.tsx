import React from 'react';
import { User, Truck, Clock, Award, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import type { DriverPerformanceRecord } from '../../../types/otif.types';

interface DriverPerformanceTableProps {
  scorecard: DriverPerformanceRecord[];
  alSeleccionarConductor?: (conductorId: string) => void;
  conductorSeleccionadoId?: string;
}

export const DriverPerformanceTable: React.FC<DriverPerformanceTableProps> = ({
  scorecard,
  alSeleccionarConductor,
  conductorSeleccionadoId,
}) => {
  const getBadgeClasificacion = (tasa: number) => {
    if (tasa >= 95) {
      return {
        badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        label: 'Excelente',
        icon: CheckCircle2,
      };
    }
    if (tasa >= 90) {
      return {
        badge: 'bg-amber-50 text-amber-800 border-amber-200',
        label: 'En Riesgo',
        icon: AlertTriangle,
      };
    }
    return {
      badge: 'bg-rose-50 text-rose-800 border-rose-200',
      label: 'Crítico',
      icon: XCircle,
    };
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Encabezado de la Tarjeta */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            Ranking y Scorecard de Conductores
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluación operativa del cumplimiento OTIF individual por ruta despachada
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg self-start sm:self-auto">
          {scorecard.length} conductores activos
        </span>
      </div>

      {/* Tabla con scroll horizontal responsivo */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Conductor / Placa</th>
              <th className="py-3 px-3 text-center">Asignados</th>
              <th className="py-3 px-3 text-center">Entregados</th>
              <th className="py-3 px-4">Cumplimiento OTIF</th>
              <th className="py-3 px-3 text-center">A Tiempo</th>
              <th className="py-3 px-3 text-center">Completo</th>
              <th className="py-3 px-4 text-center">Atención Prom.</th>
              <th className="py-3 px-4 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
            {scorecard.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400 text-sm">
                  No hay conductores registrados para el período seleccionado.
                </td>
              </tr>
            ) : (
              scorecard.map((cond) => {
                const clasificacion = getBadgeClasificacion(cond.tasaOtifPorcentaje);
                const IconStatus = clasificacion.icon;
                const isSelected = conductorSeleccionadoId === cond.conductorId;

                return (
                  <tr
                    key={cond.conductorId}
                    onClick={() =>
                      alSeleccionarConductor && alSeleccionarConductor(cond.conductorId)
                    }
                    className={`min-h-[52px] transition-colors cursor-pointer hover:bg-slate-50/80 ${
                      isSelected ? 'bg-blue-50/70' : ''
                    }`}
                  >
                    {/* Conductor y Vehículo */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 leading-tight">
                            {cond.conductorNombre}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Truck className="w-3.5 h-3.5" />
                            <span>{cond.vehiculoPlaca}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Asignados */}
                    <td className="py-3.5 px-3 text-center font-semibold text-slate-800">
                      {cond.pedidosAsignados}
                    </td>

                    {/* Entregados */}
                    <td className="py-3.5 px-3 text-center font-semibold text-slate-800">
                      {cond.pedidosEntregados}
                    </td>

                    {/* Cumplimiento OTIF con Barra */}
                    <td className="py-3.5 px-4">
                      <div className="w-36">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-slate-900">
                            {cond.tasaOtifPorcentaje}%
                          </span>
                          <span className="text-slate-500 text-[11px]">
                            {cond.pedidosOtifConformes}/{cond.pedidosEntregados}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              cond.tasaOtifPorcentaje >= 95
                                ? 'bg-emerald-600'
                                : cond.tasaOtifPorcentaje >= 90
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{
                              width: `${Math.min(100, Math.max(0, cond.tasaOtifPorcentaje))}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* A Tiempo */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-semibold text-slate-800">
                        {cond.tasaOnTimePorcentaje}%
                      </span>
                    </td>

                    {/* Completo */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-semibold text-slate-800">
                        {cond.tasaInFullPorcentaje}%
                      </span>
                    </td>

                    {/* Tiempo Promedio de Atención */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1 text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{cond.tiempoPromedioAtencionMinutos} min</span>
                      </div>
                    </td>

                    {/* Estado Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${clasificacion.badge}`}
                      >
                        <IconStatus className="w-3.5 h-3.5" />
                        {clasificacion.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
