import React from 'react';

// Interfaces mockeadas para demostración, ya que wms_batches no está en store global de stock
interface ExpiryAlert {
  id: string;
  sku: string;
  daysRemaining: number;
  quantity: number;
}

const mockAlerts: ExpiryAlert[] = [
  { id: '1', sku: 'SALMON-FILETE-500G', daysRemaining: 2, quantity: 45.5 },
  { id: '2', sku: 'CAMARON-TIGRE-16-20', daysRemaining: 5, quantity: 120.0 },
];

export const ExpiryAlertCards: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {mockAlerts.map(alert => (
        <div key={alert.id} className="relative overflow-hidden bg-slate-900/60 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-xl flex flex-col gap-2">
          {/* Fondo gradiente sutil para urgencia */}
          <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl -z-10 rounded-full opacity-20 ${alert.daysRemaining <= 3 ? 'bg-rose-500' : 'bg-amber-500'}`} />
          
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Alerta FEFO</p>
              <h3 className="text-sm font-mono text-slate-200 mt-1">{alert.sku}</h3>
            </div>
            <span className={`px-2 py-1 text-xs font-bold rounded-lg border ${
              alert.daysRemaining <= 3 
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              {alert.daysRemaining} días
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tabular-nums">{alert.quantity}</span>
            <span className="text-xs text-slate-400">Kg en riesgo</span>
          </div>

          {/* Sparkline falso simulando consumo */}
          <div className="mt-3 flex items-end gap-1 h-6 w-full opacity-50">
            {[40, 35, 45, 20, 60, 25, 10].map((h, i) => (
              <div key={i} className="flex-1 bg-slate-600 rounded-sm" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
