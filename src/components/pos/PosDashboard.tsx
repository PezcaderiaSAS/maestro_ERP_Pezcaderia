import React, { useState } from 'react';
import { Wifi, WifiOff, UploadCloud, ShoppingCart, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useOutboxSync } from '../../hooks/useOutboxSync';

export const PosDashboard: React.FC = () => {
  const EMPRESA_ID = '00000000-0000-0000-0000-000000000000';
  const CAJA_ID = '00000000-0000-0000-0000-000000000004';
  
  const { isOnline, pendingCount, isSyncing, enqueueOperation, triggerSync } = useOutboxSync(EMPRESA_ID, CAJA_ID);
  
  const [totalVenta, setTotalVenta] = useState<string>('');

  const handleVenta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totalVenta) return;

    // Persistir atómicamente en local (IndexedDB)
    await enqueueOperation('VENTA', {
      total: parseFloat(totalVenta),
      articulos: 3, // Mock data
      metodoPago: 'EFECTIVO'
    });

    setTotalVenta('');
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-slate-50 min-h-screen">
      
      {/* Header / Network Status */}
      <header className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-100">
            <ShoppingCart className="w-6 h-6 text-indigo-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">POS Pescadería</h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <span className="flex items-center text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <Wifi className="w-4 h-4 mr-1.5" /> En línea
              </span>
            ) : (
              <span className="flex items-center text-sm font-medium text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                <WifiOff className="w-4 h-4 mr-1.5 animate-pulse" /> Fuera de línea
              </span>
            )}
          </div>

          <button
            onClick={triggerSync}
            disabled={pendingCount === 0 || isSyncing || !isOnline}
            className={`flex items-center px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              pendingCount > 0 && isOnline
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <UploadCloud className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-bounce' : ''}`} />
            {isSyncing ? 'Sincronizando...' : `Sincronizar (${pendingCount})`}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Formulario de Venta Simulada */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Nueva Venta Rápida</h2>
          
          <form onSubmit={handleVenta} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Total Venta ($)</label>
              <input
                type="number"
                value={totalVenta}
                onChange={(e) => setTotalVenta(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-xl"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            <button
              type="submit"
              disabled={!totalVenta}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-lg shadow-md shadow-emerald-500/20 transition-all transform active:scale-95 disabled:opacity-50"
            >
              Cobrar
            </button>
          </form>
        </div>

        {/* Panel de Estado Offline/Outbox */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Estado del Motor Offline</h2>
            <div className="space-y-4">
              <div className="flex items-start p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-indigo-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">CajaOutbox Activo</p>
                  <p className="text-xs text-slate-500 mt-1">Las ventas se guardan en IndexedDB si no hay conexión a internet.</p>
                </div>
              </div>
              
              <div className="flex items-start p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Transacciones Pendientes: {pendingCount}</p>
                  <p className="text-xs text-amber-700 mt-1">Esperando a recuperar la red para empujar a Supabase.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
