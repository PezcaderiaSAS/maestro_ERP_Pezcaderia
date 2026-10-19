/**
 * Tarjeta de Cabecera y Acciones Rápidas 1-Toque para la Parada
 * Especificación: SPEC-023 (TASK-023-04)
 * Principios: "Regla del Niño de 12 Años", botones >= 48px, WCAG AA+
 */

import React from 'react';
import { Phone, Navigation, ArrowLeft } from 'lucide-react';
import type { DriverDeliveryStop } from '../../../types/driverDeliveryPwa.types';

interface DriverStopHeaderCardProps {
  stop: DriverDeliveryStop;
  onVolver: () => void;
}

export const DriverStopHeaderCard: React.FC<DriverStopHeaderCardProps> = ({
  stop,
  onVolver
}) => {
  return (
    <div className="space-y-3">
      {/* Botón Volver y Número de Pedido */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onVolver}
          className="min-h-[48px] px-3.5 py-2 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-xs hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la Ruta</span>
        </button>

        <span className="text-xs font-mono font-bold text-slate-500">
          Pedido: {stop.numeroPedido}
        </span>
      </div>

      {/* Tarjeta del Cliente y Dirección */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-4 sm:p-5 space-y-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            Destino de Entrega • {stop.formaPago}
          </span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
            {stop.clienteNombre}
          </h2>
          <p className="text-xs text-slate-600 font-medium">{stop.clienteDireccion}</p>
        </div>

        {/* Acciones Rápidas de 1 Toque (Llamar y Waze/Maps >= 48px) */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <a
            href={`tel:${stop.clienteTelefono || '+573120000000'}`}
            className="min-h-[48px] rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center gap-1.5 text-xs font-bold transition-colors active:scale-95"
            aria-label="Llamar al cliente"
          >
            <Phone className="w-4 h-4 text-emerald-600" />
            <span>Llamar</span>
          </a>

          <a
            href={`https://waze.com/ul?q=${encodeURIComponent(stop.clienteDireccion)}`}
            target="_blank"
            rel="noreferrer"
            className="min-h-[48px] rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-800 flex items-center justify-center gap-1.5 text-xs font-bold transition-colors active:scale-95"
            aria-label="Abrir Waze"
          >
            <Navigation className="w-4 h-4 text-blue-600" />
            <span>Waze</span>
          </a>

          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(stop.clienteDireccion)}`}
            target="_blank"
            rel="noreferrer"
            className="min-h-[48px] rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 flex items-center justify-center gap-1.5 text-xs font-bold transition-colors active:scale-95"
            aria-label="Abrir Google Maps"
          >
            <Navigation className="w-4 h-4 text-slate-600" />
            <span>Maps</span>
          </a>
        </div>
      </div>
    </div>
  );
};
