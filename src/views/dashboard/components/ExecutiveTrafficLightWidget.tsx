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
      className="bg-slate-900/85 backdrop-blur-2xl border border-white/12 rounded-3xl p-5 md:p-6 shadow-xl flex flex-col gap-4 animate-fade-in text-slate-200"
    >
      {/* Cabecera del Semáforo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-white/5 text-amber-400 rounded-xl border border-white/10 shadow-xs">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-black text-white tracking-tight m-0">
              Semáforo Operativo Ejecutivo
            </h3>
            <p className="text-xs text-slate-400 font-medium m-0">
              Toma de decisiones en 1-toque bajo la Regla del Niño de 12 Años.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
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
          className={`min-h-[100px] p-5 rounded-2xl border transition-all cursor-pointer touch-manipulation active:scale-95 text-left flex flex-col justify-between group shadow-lg ${
            cajaDisponible > 0
              ? 'bg-emerald-950/40 border-emerald-500/30 hover:border-emerald-400/50 hover:bg-emerald-950/60'
              : 'bg-amber-950/40 border-amber-500/30 hover:border-amber-400/50 hover:bg-amber-950/60'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs ${
                  cajaDisponible > 0
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                }`}
              >
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                  1. Caja Disponible Hoy
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    cajaDisponible > 0
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {cajaDisponible > 0 ? (
                    <>
                      <CheckCircle className="w-3 h-3 text-emerald-400" /> Caja Operativa
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3 text-amber-400" /> Sin Movimientos
                    </>
                  )}
                </span>
              </div>
            </div>

            <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>

          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
              ${cajaDisponible.toLocaleString('es-CO')}
            </div>
            <span className="text-xs text-slate-400 font-semibold mt-0.5 block">
              Efectivo y bancos en turno activo
            </span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Abrir Arqueo & Caja</span>
            <span className="text-emerald-400 group-hover:underline">Ir a Caja ➔</span>
          </div>
        </button>

        {/* SEMÁFORO 2: PEDIDOS B2B LISTOS / EN RUTA */}
        <button
          type="button"
          data-testid="traffic-light-despachos"
          onClick={() => handleNavigate(AppRouteId.ORDERS_KANBAN)}
          className={`min-h-[100px] p-5 rounded-2xl border transition-all cursor-pointer touch-manipulation active:scale-95 text-left flex flex-col justify-between group shadow-lg ${
            totalTransito > 0
              ? 'bg-indigo-950/40 border-indigo-500/30 hover:border-indigo-400/50 hover:bg-indigo-950/60'
              : 'bg-slate-900/60 border-white/10 hover:border-white/20 hover:bg-slate-900/80'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs ${
                  totalTransito > 0
                    ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                    : 'bg-white/5 text-slate-300 border-white/10'
                }`}
              >
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                  2. Despachos B2B
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    totalTransito > 0
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {totalTransito > 0 ? (
                    <>
                      <Clock className="w-3 h-3 text-indigo-400" /> En Alistamiento / Ruta
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3 h-3 text-emerald-400" /> Despachos al Día
                    </>
                  )}
                </span>
              </div>
            </div>

            <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>

          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
              {totalTransito} Pedidos
            </div>
            <span className="text-xs text-slate-400 font-semibold mt-0.5 block">
              {pedidosListos} listos en cava · {pedidosEnRuta} en furgón
            </span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Ver Tablero Táctil (3 Pasos)</span>
            <span className="text-indigo-400 group-hover:underline">Ir a Despachos ➔</span>
          </div>
        </button>

        {/* SEMÁFORO 3: ALERTAS DE STOCK CRÍTICO */}
        <button
          type="button"
          data-testid="traffic-light-stock"
          onClick={() => handleNavigate(AppRouteId.INVENTORY)}
          className={`min-h-[100px] p-5 rounded-2xl border transition-all cursor-pointer touch-manipulation active:scale-95 text-left flex flex-col justify-between group shadow-lg ${
            stockCriticoCount > 0
              ? 'bg-rose-950/40 border-rose-500/30 hover:border-rose-400/50 hover:bg-rose-950/60'
              : 'bg-emerald-950/40 border-emerald-500/30 hover:border-emerald-400/50 hover:bg-emerald-950/60'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs ${
                  stockCriticoCount > 0
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}
              >
                {stockCriticoCount > 0 ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                  3. Stock en Cuarto Frío
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    stockCriticoCount > 0
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {stockCriticoCount > 0 ? (
                    <>
                      <AlertTriangle className="w-3 h-3 text-rose-400" /> Reposición Requerida
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3 h-3 text-emerald-400" /> Nivel Óptimo
                    </>
                  )}
                </span>
              </div>
            </div>

            <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>

          <div className="mt-3">
            <div
              className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                stockCriticoCount > 0 ? 'text-rose-400' : 'text-white'
              }`}
            >
              {stockCriticoCount > 0
                ? `${stockCriticoCount} Productos Bajo Buffer`
                : 'Sin Quiebres de Stock'}
            </div>
            <span className="text-xs text-slate-400 font-semibold mt-0.5 block">
              {stockCriticoCount > 0
                ? 'Requieren compra o traslado urgente'
                : 'Inventario suficiente para operación'}
            </span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Inspeccionar Cuarto Frío</span>
            <span
              className={stockCriticoCount > 0 ? 'text-rose-400 group-hover:underline' : 'text-emerald-400 group-hover:underline'}
            >
              Ir a Inventario ➔
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
