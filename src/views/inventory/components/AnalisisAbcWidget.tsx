import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Layers, 
  Award, 
  RefreshCw, 
  AlertCircle, 
  BarChart3, 
  CheckCircle2, 
  HelpCircle,
  Sparkles,
  Server
} from 'lucide-react';
import Swal from 'sweetalert2';
import { springAnalisisAbcService } from '../../../services/inventario/SpringAnalisisAbcService';
import { AnalisisAbcItemDTO, ClasificacionAbc } from '../../../types/inventarioAbc';
import { useInventoryStore } from '../../../store/useInventoryStore';
import { useMovementStore } from '../../../store/useMovementStore';
import { calcularParetoAbcLocal } from '../../../utils/paretoAbcCalculator';

export const AnalisisAbcWidget: React.FC = () => {
  const [items, setItems] = useState<readonly AnalisisAbcItemDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [diasHistorial, setDiasHistorial] = useState<number>(30);
  const [modoServidor, setModoServidor] = useState<'spring-boot' | 'fallback-local'>('fallback-local');

  const products = useInventoryStore((s) => s.products);
  const stock = useInventoryStore((s) => s.stock);
  const movimientos = useMovementStore((s) => s.movimientos);

  const cargarAnalisisAbc = async (dias: number) => {
    setLoading(true);
    try {
      const data = await springAnalisisAbcService.obtenerAnalisisPareto(dias);
      setItems(data);
      setModoServidor('spring-boot');
    } catch {
      // Cálculo dinámico real en el cliente (100% Serverless y Determinista)
      setModoServidor('fallback-local');
      const dataLocal = calcularParetoAbcLocal({
        products,
        movimientos,
        stock: stock as any,
        diasHistorial: dias,
      });
      setItems(dataLocal);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarAnalisisAbc(diasHistorial);
  }, [diasHistorial, products, movimientos]);

  const handleRecalcular = async () => {
    await cargarAnalisisAbc(diasHistorial);
    Swal.fire({
      title: '¡Análisis Pareto Actualizado!',
      text: `Se procesaron las ventas de los últimos ${diasHistorial} días con reglas 80/20 Pareto.`,
      icon: 'success',
      confirmButtonColor: '#0284c7',
      timer: 2500
    });
  };

  const countCatA = items.filter(i => i.clasificacion === ClasificacionAbc.A).length;
  const countCatB = items.filter(i => i.clasificacion === ClasificacionAbc.B).length;
  const countCatC = items.filter(i => i.clasificacion === ClasificacionAbc.C).length;
  const totalVentasSum = items.reduce((acc, curr) => acc + curr.valorTotalVentas, 0);

  const getBadgeStyle = (cat: ClasificacionAbc) => {
    switch (cat) {
      case ClasificacionAbc.A:
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case ClasificacionAbc.B:
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case ClasificacionAbc.C:
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Análisis ABC de Inventario (Pareto 80/20)
            </h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Clasificación inteligente de productos de mayor impacto en ingresos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
            <Server className="w-3.5 h-3.5 text-cyan-500" />
            <span>Engine: <strong>{modoServidor === 'spring-boot' ? 'Spring Boot 4 (Java 21)' : 'Pareto Engine Local'}</strong></span>
          </div>

          <select
            value={diasHistorial}
            onChange={(e) => setDiasHistorial(Number(e.target.value))}
            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium focus:ring-2 focus:ring-cyan-500"
          >
            <option value={7}>Últimos 7 días</option>
            <option value={30}>Últimos 30 días</option>
            <option value={60}>Últimos 60 días</option>
            <option value={90}>Últimos 90 días</option>
          </select>

          <button
            onClick={handleRecalcular}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 text-white font-medium text-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Recalcular</span>
          </button>
        </div>
      </div>

      {/* Tarjetas Metric Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Categoria A */}
        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-slate-900">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <Award className="w-4 h-4" /> Categoría A (80% Ingresos)
            </span>
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
              {countCatA} Productos
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            Alta Prioridad
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Revisión diaria de stock. Generan la mayor rentabilidad del negocio.
          </p>
        </div>

        {/* Categoria B */}
        <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-950/20 dark:to-slate-900">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" /> Categoría B (15% Ingresos)
            </span>
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300">
              {countCatB} Productos
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            Rotación Media
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Revisión semanal. Control moderado de existencias.
          </p>
        </div>

        {/* Categoria C */}
        <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-50/50 to-white dark:from-amber-950/20 dark:to-slate-900">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <Layers className="w-4 h-4" /> Categoría C (5% Ingresos)
            </span>
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
              {countCatC} Productos
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            Baja Rotación
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Revisión mensual. Evitar sobrestock o capital inmovilizado.
          </p>
        </div>
      </div>

      {/* Tabla de Productos Pareto */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <th className="px-4 py-3">Código SKU</th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3 text-right">Ventas Totales ($)</th>
              <th className="px-4 py-3 text-right">% Acumulado</th>
              <th className="px-4 py-3 text-center">Clasificación ABC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm text-slate-700 dark:text-slate-300">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500 dark:text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-cyan-600" />
                    <span>Calculando ordenación Pareto 80/20...</span>
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500 dark:text-slate-400">
                  No se registraron ventas en el periodo seleccionado.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr 
                  key={item.productoId}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                    {item.codigoSku}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    {item.nombreProducto}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                    ${item.valorTotalVentas.toLocaleString('es-CO')}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-slate-600 dark:text-slate-400">
                    {item.porcentajeAcumulado.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border ${getBadgeStyle(item.clasificacion)}`}>
                      Categoría {item.clasificacion}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
