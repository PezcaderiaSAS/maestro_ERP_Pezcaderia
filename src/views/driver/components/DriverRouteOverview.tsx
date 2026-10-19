/**
 * Vista Táctil de Hoja de Ruta del Día para Repartidores
 * Especificación: SPEC-023 (TASK-023-04)
 * Principios: "Regla del Niño de 12 Años", botones >= 56px, WCAG AA+
 */

import React, { useState } from 'react';
import {
  Truck,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronRight,
  LogOut,
  RefreshCw,
  CreditCard,
  Smartphone,
  FileText
} from 'lucide-react';
import { useDriverDeliveryPwaStore } from '../../../store/useDriverDeliveryPwaStore';
import type { DriverDeliveryStop } from '../../../types/driverDeliveryPwa.types';

export const DriverRouteOverview: React.FC = () => {
  const {
    session,
    activeRoute,
    recaudoResumen,
    seleccionarParada,
    logout,
    cargarRutaActiva,
    isLoading
  } = useDriverDeliveryPwaStore();

  const [filtro, setFiltro] = useState<'TODAS' | 'PENDIENTES' | 'COMPLETADAS'>('TODAS');

  if (!activeRoute) {
    return (
      <div className="p-6 text-center space-y-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
          <Truck className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-slate-900">No hay ruta activa asignada</h2>
        <p className="text-xs text-slate-500">
          Actualmente no tienes un manifiesto de entrega en curso para tu vehículo.
        </p>
        <button
          type="button"
          onClick={() => cargarRutaActiva()}
          className="h-12 px-6 rounded-2xl bg-blue-600 text-white font-bold text-xs shadow-md"
        >
          Consultar Nuevas Rutas
        </button>
      </div>
    );
  }

  const paradasFiltradas = activeRoute.paradas.filter((p) => {
    if (filtro === 'PENDIENTES') return p.estadoEntrega === 'PENDIENTE';
    if (filtro === 'COMPLETADAS') return p.estadoEntrega !== 'PENDIENTE';
    return true;
  });

  const getFormaPagoIcon = (formaPago: string) => {
    switch (formaPago) {
      case 'EFECTIVO':
        return <DollarSign className="w-3.5 h-3.5 text-emerald-600" />;
      case 'TRANSFERENCIA_DIGITAL':
        return <Smartphone className="w-3.5 h-3.5 text-blue-600" />;
      case 'CREDITO_B2B':
        return <FileText className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <CreditCard className="w-3.5 h-3.5 text-purple-600" />;
    }
  };

  const getBadgeEstado = (estado: string) => {
    switch (estado) {
      case 'ENTREGADO_TOTAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Entregado Total
          </span>
        );
      case 'ENTREGADO_PARCIAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5" />
            Parcial / Merma
          </span>
        );
      case 'NO_ENTREGADO_RECHAZADO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5" />
            Rechazado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-slate-100 text-slate-700 border border-slate-300">
            <Clock className="w-3.5 h-3.5" />
            Pendiente
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 p-3 sm:p-5">
      {/* Cabecera de Conductor y Vehículo */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-4 sm:p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-600/20">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                {session?.conductorNombre || 'Conductor en Ruta'}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300">
                {session?.vehiculoPlaca || activeRoute.vehiculoPlaca}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Manifiesto: {activeRoute.numeroManifiesto}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => cargarRutaActiva()}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center min-h-[44px] min-w-[44px]"
            title="Refrescar ruta"
            aria-label="Refrescar ruta"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={logout}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 flex items-center justify-center min-h-[44px] min-w-[44px]"
            title="Cerrar turno"
            aria-label="Cerrar turno"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tarjeta de Progreso de la Ruta */}
      <div className="bg-linear-to-br from-blue-700 to-indigo-800 rounded-3xl p-4 sm:p-5 text-white shadow-lg space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-blue-100">
          <span>AVANCE DE ENTREGAS</span>
          <span className="font-mono text-white text-sm">
            {activeRoute.paradasCompletadas} de {activeRoute.paradasTotales} completadas
          </span>
        </div>

        {/* Barra de Progreso */}
        <div className="w-full h-3 bg-blue-950/40 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${activeRoute.progresoPorcentaje}%` }}
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-2xl font-black">{activeRoute.progresoPorcentaje}%</span>
          <span className="text-xs text-blue-200 font-medium">
            {activeRoute.paradasTotales - activeRoute.paradasCompletadas} paradas restantes
          </span>
        </div>
      </div>

      {/* Pestañas de Filtro Táctiles (>= 48px) */}
      <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl">
        {(['TODAS', 'PENDIENTES', 'COMPLETADAS'] as const).map((tab) => {
          const isActive = filtro === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setFiltro(tab)}
              className={`min-h-[44px] rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'TODAS' && `Todas (${activeRoute.paradasTotales})`}
              {tab === 'PENDIENTES' &&
                `Pendientes (${activeRoute.paradasTotales - activeRoute.paradasCompletadas})`}
              {tab === 'COMPLETADAS' && `Listas (${activeRoute.paradasCompletadas})`}
            </button>
          );
        })}
      </div>

      {/* Lista de Paradas Táctiles (>= 56px por tarjeta) */}
      <div className="space-y-3">
        {paradasFiltradas.map((parada, index) => {
          const isDone = parada.estadoEntrega !== 'PENDIENTE';
          return (
            <div
              key={parada.id}
              onClick={() => seleccionarParada(parada)}
              className={`w-full bg-white rounded-3xl border p-4 sm:p-5 flex items-center justify-between gap-3 text-left transition-all active:scale-99 cursor-pointer min-h-[72px] shadow-sm hover:shadow-md ${
                isDone
                  ? 'border-slate-200 bg-slate-50/70 opacity-90'
                  : 'border-blue-300 ring-1 ring-blue-500/10 hover:border-blue-500'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 mt-0.5 ${
                    isDone
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {index + 1}
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black text-slate-900 truncate">
                      {parada.clienteNombre}
                    </span>
                    {getBadgeEstado(parada.estadoEntrega)}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600 truncate">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{parada.clienteDireccion}</span>
                  </div>

                  <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1 font-bold text-slate-700">
                      {getFormaPagoIcon(parada.formaPago)}
                      {parada.formaPago}
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      ${(parada.montoCobradoFinal || parada.montoPedidoOriginal).toLocaleString('es-CO')}
                    </span>
                    <span>• {parada.items?.length || 0} ítems</span>
                  </div>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
            </div>
          );
        })}
      </div>

      {/* Resumen de Cobranzas del Turno */}
      {recaudoResumen && (
        <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Recaudo Total en Ruta</span>
            <span className="text-emerald-400">Arqueo en Vivo</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Efectivo Físico</div>
              <div className="text-base font-black font-mono text-emerald-400">
                ${recaudoResumen.totalEfectivo.toLocaleString('es-CO')}
              </div>
            </div>

            <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Transferencias</div>
              <div className="text-base font-black font-mono text-blue-400">
                ${recaudoResumen.totalTransferencia.toLocaleString('es-CO')}
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-slate-800/80 rounded-2xl p-3 border border-slate-700">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Mermas / Rechazo</div>
              <div className="text-base font-black font-mono text-amber-400">
                {recaudoResumen.totalDevolucionesKg} Kg
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
