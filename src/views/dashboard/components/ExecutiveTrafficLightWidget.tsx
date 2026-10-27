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
      className="bg-slate-900/85 backdrop-blur-2xl border border-white/12 rounded-2xl p-3.5 md:p-4 shadow-xl flex flex-col gap-3 animate-fade-in text-slate-200"
    >
      {/* Cabecera del Semáforo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white/5 text-amber-400 rounded-lg border border-white/10 shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-black text-white tracking-tight m-0">
              Semáforo Operativo Ejecutivo
            </h3>
            <p className="text-[11px] text-slate-400 font-medium m-0">
              Toma de decisiones en 1-toque bajo la Regla del Niño de 12 Años.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            En Vivo
          </span>
        </div>
      </div>

      {/* Grid de 3 Tarjetas de Semáforo Táctil (>= 56px de altura táctil) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 md:gap-3">
        {/* SEMÁFORO 1: CAJA DISPONIBLE HOY */}
        <button
          type="button"
          data-testid="traffic-light-caja"
          onClick={() => handleNavigate(AppRouteId.CASH_DESK)}
          className={`min-h-[100px] p-3.5 rounded-xl border transition-all cursor-pointer touch-manipulation active:scale-95 text-left flex flex-col justify-between group shadow-md ${
            cajaDisponible > 0
              ? 'bg-emerald-950/40 border-emerald-500/30 hover:border-emerald-400/50 hover:bg-emerald-950/60'
              : 'bg-amber-950/40 border-amber-500/30 hover:border-amber-400/50 hover:bg-amber-950/60'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center border shadow-xs shrink-0 ${
                  cajaDisponible > 0
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                }`}
              >
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                  1. Caja Disponible Hoy
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
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

            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
          </div>

          <div className="my-2">
            <div className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
              ${cajaDisponible.toLocaleString('es-CO')}
            </div>
            <span className="text-[11px] text-slate-400 font-medium block">
              Efectivo y bancos en turno activo
            </span>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-bold text-slate-300">
            <span>Abrir Arqueo & Caja</span>
            <span className="text-emerald-400 group-hover:underline">Ir a Caja ➔</span>
          </div>
        </button>

        {/* SEMÁFORO 2: PEDIDOS B2B LISTOS / EN RUTA */}
        <button
          type="button"
          data-testid="traffic-light-despachos"
          onClick={() => handleNavigate(AppRouteId.ORDERS_KANBAN)}
          className={`min-h-[100px] p-3.5 rounded-xl border transition-all cursor-pointer touch-manipulation active:scale-95 text-left flex flex-col justify-between group shadow-md ${
            totalTransito > 0
              ? 'bg-indigo-950/40 border-indigo-500/30 hover:border-indigo-400/50 hover:bg-indigo-950/60'
              : 'bg-slate-900/60 border-white/10 hover:border-white/20 hover:bg-slate-900/80'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center border shadow-xs shrink-0 ${
                  totalTransito > 0
                    ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                    : 'bg-white/5 text-slate-300 border-white/10'
                }`}
              >
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                  2. Despachos B2B
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
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

            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
          </div>

          <div className="my-2">
            <div className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
              {totalTransito} Pedidos
            </div>
            <span className="text-[11px] text-slate-400 font-medium block">
              {pedidosListos} listos en cava · {pedidosEnRuta} en furgón
            </span>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-bold text-slate-300">
            <span>Ver Tablero Táctil (3 Pasos)</span>
            <span className="text-indigo-400 group-hover:underline">Ir a Despachos ➔</span>
          </div>
        </button>

        {/* SEMÁFORO 3: ALERTAS DE STOCK CRÍTICO (WCAG 2.2 AAA HIGH CONTRAST) */}
        <button
          type="button"
          data-testid="traffic-light-stock"
          onClick={() => handleNavigate(AppRouteId.INVENTORY)}
          className={`min-h-[100px] p-3.5 rounded-xl border transition-all cursor-pointer touch-manipulation active:scale-95 text-left flex flex-col justify-between group shadow-md bg-slate-900/90 backdrop-blur-xl ${
            stockCriticoCount > 0
              ? 'border-rose-500/40 hover:border-rose-400/60'
              : 'border-emerald-500/40 hover:border-emerald-400/60'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center border shadow-xs shrink-0 ${
                  stockCriticoCount > 0
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {stockCriticoCount > 0 ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 block">
                  3. Stock en Cuarto Frío
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    stockCriticoCount > 0
                      ? 'bg-rose-500/20 text-rose-200 border border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {stockCriticoCount > 0 ? (
                    <>
                      <AlertTriangle className="w-3 h-3 text-rose-300" /> Reposición Requerida
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3 h-3 text-emerald-400" /> Nivel Óptimo
                    </>
                  )}
                </span>
              </div>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
          </div>

          <div className="my-2">
            <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white">
              {stockCriticoCount > 0
                ? `${stockCriticoCount} Productos Bajo Buffer`
                : 'Sin Quiebres de Stock'}
            </div>
            <span className="text-[11px] text-slate-300 font-medium block">
              {stockCriticoCount > 0
                ? 'Requieren compra o traslado urgente'
                : 'Inventario suficiente para operación'}
            </span>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-bold text-slate-200">
            <span>Inspeccionar Cuarto Frío</span>
            <span
              className={stockCriticoCount > 0 ? 'text-rose-300 group-hover:underline' : 'text-emerald-400 group-hover:underline'}
            >
              Ir a Inventario ➔
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
