import React from 'react';
import {
  ThermometerSnowflake,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Truck,
  RotateCcw,
  Clock,
} from 'lucide-react';
import type { OtifStopRecord } from '../../../types/otif.types';

interface ColdChainAuditTimelineProps {
  paradas: OtifStopRecord[];
}

export const ColdChainAuditTimeline: React.FC<ColdChainAuditTimelineProps> = ({
  paradas,
}) => {
  // Filtramos paradas que tuvieron advertencia térmica, rotura de frío o devolución
  const incidentesTermicos = paradas.filter(
    (p) =>
      p.estadoCadenaFrio === 'CRITICO' ||
      p.estadoCadenaFrio === 'ALERTA' ||
      (p.temperaturaEntregaCelsius !== undefined && p.temperaturaEntregaCelsius > 4.0) ||
      (p.tieneDevolucion && p.totalKilosDevueltos > 0)
  );

  const totalConformes = paradas.filter((p) => p.estadoCadenaFrio === 'CONFORME').length;
  const totalAlerta = paradas.filter((p) => p.estadoCadenaFrio === 'ALERTA').length;
  const totalCriticos = paradas.filter((p) => p.estadoCadenaFrio === 'CRITICO').length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ThermometerSnowflake className="w-5 h-5 text-cyan-600" />
            Control y Auditoría de Cadena de Frío (HACCP)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Supervisión térmica de perecederos marítimos en ruta (Estándar ≤ 4.0 °C)
          </p>
        </div>

        {/* Mini contadores de semáforo */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            {totalConformes} Conformes
          </span>
          {totalAlerta > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5" />
              {totalAlerta} Alerta
            </span>
          )}
          {totalCriticos > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200">
              <XCircle className="w-3.5 h-3.5" />
              {totalCriticos} Críticos
            </span>
          )}
        </div>
      </div>

      {/* Contenido: Si no hay incidentes, estado perfecto */}
      {incidentesTermicos.length === 0 ? (
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-emerald-900 mb-1">
            Cadena de Frío 100% Conforme y Garantizada
          </h4>
          <p className="text-xs text-emerald-700 max-w-md mx-auto">
            Todas las {paradas.length} entregas auditadas mantuvieron temperaturas óptimas dentro de los límites microbiológicos normativos.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Detalle de Desviaciones ({incidentesTermicos.length} eventos registrados)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
            {incidentesTermicos.map((p) => {
              const isCritico =
                p.estadoCadenaFrio === 'CRITICO' ||
                (p.temperaturaEntregaCelsius !== undefined && p.temperaturaEntregaCelsius > 7.0);

              return (
                <div
                  key={p.pedidoId}
                  className={`p-4 rounded-xl border transition-all ${
                    isCritico
                      ? 'bg-rose-50/50 border-rose-200'
                      : 'bg-amber-50/50 border-amber-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        {p.clienteNombre}
                      </div>
                      <div className="text-xs text-slate-500">
                        Pedido: <span className="font-semibold text-slate-700">{p.numeroPedido}</span> | Manifiesto: {p.numeroManifiesto}
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full border ${
                        isCritico
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}
                    >
                      {isCritico ? 'Rotura de Frío' : 'Temperatura Al Límite'}
                    </span>
                  </div>

                  {/* Datos del conductor y temperatura */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mt-2 pt-2 border-t border-slate-200/60">
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-slate-400" />
                      <span>{p.conductorNombre}</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end font-semibold text-slate-800">
                      <ThermometerSnowflake className="w-3.5 h-3.5 text-cyan-600" />
                      <span>
                        Entrega:{' '}
                        {p.temperaturaEntregaCelsius !== undefined
                          ? `${p.temperaturaEntregaCelsius} °C`
                          : 'N/R'}
                      </span>
                    </div>
                  </div>

                  {/* Devolución si aplica */}
                  {p.tieneDevolucion && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 font-semibold text-rose-700">
                        <RotateCcw className="w-3.5 h-3.5" />
                        Devolución: {p.totalKilosDevueltos} kg
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        {p.estadoEntrega.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
