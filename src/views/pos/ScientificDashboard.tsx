import React from 'react';
import { Activity, AlertTriangle, TrendingUp, PackageMinus } from 'lucide-react';

export const ScientificDashboard: React.FC = () => {
  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl p-6 text-white h-full">
      <div className="flex items-center gap-2 border-b border-white/10 pb-4 mb-6">
        <Activity className="text-purple-400" size={24} />
        <h2 className="text-2xl font-semibold">Análisis Científico y Mermas</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800/50 rounded-lg p-5 border border-slate-700/50 hover:border-purple-500/30 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">Costo Mermas (Hoy)</p>
              <h3 className="text-3xl font-bold text-red-400 tabular-nums">$145.500</h3>
            </div>
            <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
              <PackageMinus size={20} />
            </div>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <AlertTriangle size={12} className="text-amber-500" />
            Impacto en 4 productos (Categoría A)
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-5 border border-slate-700/50 hover:border-emerald-500/30 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">Variación CPP Promedio</p>
              <h3 className="text-3xl font-bold text-emerald-400 tabular-nums">+1.2%</h3>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-xs text-slate-500">Costo Promedio Ponderado ajustado en tiempo real</p>
        </div>
      </div>

      <div className="bg-slate-800/30 rounded-lg border border-slate-700/30 p-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/80 text-slate-300 text-xs uppercase tracking-wider">
              <th className="p-3 font-medium">SKU</th>
              <th className="p-3 font-medium">Producto</th>
              <th className="p-3 font-medium">Clasificación ABC</th>
              <th className="p-3 font-medium">Merma (Kg)</th>
              <th className="p-3 font-medium text-right">CPP Actualizado</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-700/50">
            <tr className="hover:bg-slate-800/40 transition-colors">
              <td className="p-3 font-medium text-slate-400">SAL-001</td>
              <td className="p-3 text-white">Salmón Fresco (Entero)</td>
              <td className="p-3"><span className="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">A</span></td>
              <td className="p-3 text-red-400">2.5 kg</td>
              <td className="p-3 text-right font-medium">$42,500</td>
            </tr>
            <tr className="hover:bg-slate-800/40 transition-colors">
              <td className="p-3 font-medium text-slate-400">CAM-002</td>
              <td className="p-3 text-white">Camarón Tigre</td>
              <td className="p-3"><span className="px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-400 border border-amber-500/20">B</span></td>
              <td className="p-3 text-red-400">0.8 kg</td>
              <td className="p-3 text-right font-medium">$65,200</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
