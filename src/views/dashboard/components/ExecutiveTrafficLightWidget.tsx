import React, { useMemo } from 'react';
import {
  Wallet,
  Truck,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../../../store/useAppStore';
import { useOrderStore } from '../../../store/useOrderStore';
import { useInventoryStore } from '../../../store/useInventoryStore';
import { cashService } from '../../../services/cashService';
import { AppRouteId } from '../../../routes/AppRoute';

export interface ExecutiveTrafficLightWidgetProps {
  cajaDisponibleOverride?: number;
  pedidosListosOverride?: number;
  pedidosEnRutaOverride?: number;
  stockCriticoOverride?: number;
  onNavigate?: (route: AppRouteId) => void;
}

export function ExecutiveTrafficLightWidget({
  cajaDisponibleOverride,
  pedidosListosOverride,
  pedidosEnRutaOverride,
  stockCriticoOverride,
  onNavigate,
}: ExecutiveTrafficLightWidgetProps) {
  const setCurrentView = useAppStore((s) => s.setCurrentView);
  const quotations = useOrderStore((s) => s.quotations);
  const products = useInventoryStore((s) => s.products);
  const stock = useInventoryStore((s) => s.stock);

  const handleNavigate = (route: AppRouteId) => {
    if (onNavigate) {
      onNavigate(route);
    } else {
      setCurrentView(route);
    }
  };

  // 1. Cálculo de Caja Disponible
  const cajaDisponible = useMemo(() => {
    if (cajaDisponibleOverride !== undefined) {
      return cajaDisponibleOverride;
    }
    try {
      const turnos = cashService.getTurnos();
      const turnoActivo = turnos.find((t) => t.estado === 'ABIERTO');
      if (turnoActivo) {
        return turnoActivo.saldoTeoricoGlobal || turnoActivo.totalEfectivo || turnoActivo.baseInicial || 0;
      }
    } catch {
      // Fallback seguro
    }
    return 0;
  }, [cajaDisponibleOverride]);

  // 2. Cálculo de Pedidos Listos y En Ruta
  const { pedidosListos, pedidosEnRuta, totalTransito } = useMemo(() => {
    if (pedidosListosOverride !== undefined && pedidosEnRutaOverride !== undefined) {
      return {
        pedidosListos: pedidosListosOverride,
        pedidosEnRuta: pedidosEnRutaOverride,
        totalTransito: pedidosListosOverride + pedidosEnRutaOverride,
      };
    }
    const listos = quotations.filter((q) => q.estado && ['LISTO', 'Listo', 'listo'].includes(q.estado)).length;
    const enRuta = quotations.filter((q) =>
      q.estado && ['EN_DESPACHO', 'En Despacho', 'en_despacho'].includes(q.estado)
    ).length;
    return {
      pedidosListos: listos,
      pedidosEnRuta: enRuta,
      totalTransito: listos + enRuta,
    };
  }, [quotations, pedidosListosOverride, pedidosEnRutaOverride]);

  // 3. Cálculo de Productos con Stock Crítico
  const stockCriticoCount = useMemo(() => {
    if (stockCriticoOverride !== undefined) {
      return stockCriticoOverride;
    }
    if (!products || products.length === 0) return 0;

    let criticos = 0;
    products.forEach((p) => {
      if (!p.activo || p.control_inventario === false) return;
      const buffer = p.buffer_seguridad ?? 10;
      const totalStock = Object.values(stock || {}).reduce(
        (acc, bodegaMap) => acc + (bodegaMap[p.sku] || 0),
        0
      );
      if (totalStock <= buffer) {
        criticos++;
      }
    });
    return criticos;
  }, [products, stock, stockCriticoOverride]);

  return (
    <div
      data-testid="executive-traffic-light-widget"
      className="bg-white border-2 border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col gap-4 animate-fade-in"
    >
      {/* Cabecera del Semáforo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-slate-100 text-slate-700 rounded-xl border border-slate-200">
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-black text-slate-900 tracking-tight m-0">
              Semáforo Operativo Ejecutivo
            </h3>
            <p className="text-xs text-slate-500 font-medium m-0">
              Toma de decisiones en 1-toque bajo la Regla del Niño de 12 Años.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            En Vivo
          </span>
        </div>
      </div>

      {/* Grid de 3 Tarjetas de Semáforo Táctil (>= 56px de altura táctil) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        {/* SEMÁFORO 1: CAJA DISPONIBLE HOY */}
        <button
          type="button"
          data-testid="traffic-light-caja"
          onClick={() => handleNavigate(AppRouteId.CASH_DESK)}
          className={`min-h-[100px] p-5 rounded-2xl border-2 transition-all cursor-pointer touch-manipulation active:scale-95 text-left flex flex-col justify-between group ${
            cajaDisponible > 0
              ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-400 hover:shadow-md hover:bg-emerald-50'
              : 'bg-amber-50/50 border-amber-200 hover:border-amber-400 hover:shadow-md hover:bg-amber-50'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  cajaDisponible > 0
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                    : 'bg-amber-100 text-amber-700 border-amber-300'
                }`}
              >
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 block">
                  1. Caja Disponible Hoy
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    cajaDisponible > 0
                      ? 'bg-emerald-100/80 text-emerald-800'
                      : 'bg-amber-100/80 text-amber-800'
                  }`}
                >
                  {cajaDisponible > 0 ? (
                    <>
                      <CheckCircle className="w-3 h-3 text-emerald-600" /> Caja Operativa
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3 text-amber-600" /> Sin Movimientos
                    </>
                  )}
                </span>
              </div>
            </div>

            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-1 transition-all" />
          </div>

          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tracking-tight">
              ${cajaDisponible.toLocaleString('es-CO')}
            </div>
            <span className="text-xs text-slate-500 font-semibold mt-0.5 block">
              Efectivo y bancos en turno activo
            </span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Abrir Arqueo & Caja</span>
            <span className="text-emerald-700 group-hover:underline">Ir a Caja ➔</span>
          </div>
        </button>

        {/* SEMÁFORO 2: PEDIDOS B2B LISTOS / EN RUTA */}
        <button
          type="button"
          data-testid="traffic-light-despachos"
          onClick={() => handleNavigate(AppRouteId.ORDERS_KANBAN)}
          className={`min-h-[100px] p-5 rounded-2xl border-2 transition-all cursor-pointer touch-manipulation active:scale-95 text-left flex flex-col justify-between group ${
            totalTransito > 0
              ? 'bg-indigo-50/50 border-indigo-200 hover:border-indigo-400 hover:shadow-md hover:bg-indigo-50'
              : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 hover:shadow-md hover:bg-slate-50'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  totalTransito > 0
                    ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
              >
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 block">
                  2. Despachos B2B
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    totalTransito > 0
                      ? 'bg-indigo-100/80 text-indigo-800'
                      : 'bg-emerald-100/80 text-emerald-800'
                  }`}
                >
                  {totalTransito > 0 ? (
                    <>
                      <Clock className="w-3 h-3 text-indigo-600" /> En Alistamiento / Ruta
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> Despachos al Día
                    </>
                  )}
                </span>
              </div>
            </div>

            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-1 transition-all" />
          </div>

          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {totalTransito} Pedidos
            </div>
            <span className="text-xs text-slate-500 font-semibold mt-0.5 block">
              {pedidosListos} listos en cava · {pedidosEnRuta} en furgón
            </span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Ver Tablero Táctil (3 Pasos)</span>
            <span className="text-indigo-700 group-hover:underline">Ir a Despachos ➔</span>
          </div>
        </button>

        {/* SEMÁFORO 3: ALERTAS DE STOCK CRÍTICO */}
        <button
          type="button"
          data-testid="traffic-light-stock"
          onClick={() => handleNavigate(AppRouteId.INVENTORY)}
          className={`min-h-[100px] p-5 rounded-2xl border-2 transition-all cursor-pointer touch-manipulation active:scale-95 text-left flex flex-col justify-between group ${
            stockCriticoCount > 0
              ? 'bg-rose-50/50 border-rose-200 hover:border-rose-400 hover:shadow-md hover:bg-rose-50'
              : 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-400 hover:shadow-md hover:bg-emerald-50'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  stockCriticoCount > 0
                    ? 'bg-rose-100 text-rose-700 border-rose-300'
                    : 'bg-emerald-100 text-emerald-700 border-emerald-300'
                }`}
              >
                {stockCriticoCount > 0 ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 block">
                  3. Stock en Cuarto Frío
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    stockCriticoCount > 0
                      ? 'bg-rose-100/80 text-rose-800'
                      : 'bg-emerald-100/80 text-emerald-800'
                  }`}
                >
                  {stockCriticoCount > 0 ? (
                    <>
                      <AlertTriangle className="w-3 h-3 text-rose-600" /> Reposición Requerida
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3 h-3 text-emerald-600" /> Nivel Óptimo
                    </>
                  )}
                </span>
              </div>
            </div>

            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-1 transition-all" />
          </div>

          <div className="mt-3">
            <div
              className={`text-2xl sm:text-3xl font-black tracking-tight ${
                stockCriticoCount > 0 ? 'text-rose-700' : 'text-slate-900'
              }`}
            >
              {stockCriticoCount > 0
                ? `${stockCriticoCount} Productos Bajo Buffer`
                : 'Sin Quiebres de Stock'}
            </div>
            <span className="text-xs text-slate-500 font-semibold mt-0.5 block">
              {stockCriticoCount > 0
                ? 'Requieren compra o traslado urgente'
                : 'Inventario suficiente para operación'}
            </span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Inspeccionar Cuarto Frío</span>
            <span
              className={stockCriticoCount > 0 ? 'text-rose-700 group-hover:underline' : 'text-emerald-700 group-hover:underline'}
            >
              Ir a Inventario ➔
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
