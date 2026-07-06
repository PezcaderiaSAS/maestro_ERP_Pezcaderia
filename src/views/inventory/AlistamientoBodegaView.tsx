import React, { useState } from 'react';
import { PackageSearch, Clock, ChevronRight, AlertTriangle } from 'lucide-react';
import { useOrderStore } from '../../store/useOrderStore';
import { Pedido } from '../../types/orders.types';
import { FulfillmentChecklist } from './components/FulfillmentChecklist';
import { useClientStore } from '../../store/useClientStore';

export const AlistamientoBodegaView: React.FC = () => {
  const { ventas } = useOrderStore();
  const { getClienteById } = useClientStore();
  const [selectedOrder, setSelectedOrder] = useState<Pedido | null>(null);

  // Solo mostrar pedidos que necesitan alistamiento
  const pedidosPendientes = ventas.filter(
    o => o.estado === 'CREADO' || o.estado === 'EN_ALISTAMIENTO'
  ).sort((a, b) => new Date(a.fechaEntrega).getTime() - new Date(b.fechaEntrega).getTime());

  if (selectedOrder) {
    return (
      <div className="h-full flex flex-col p-6 max-w-5xl mx-auto w-full">
        <FulfillmentChecklist 
          pedido={selectedOrder} 
          onComplete={() => setSelectedOrder(null)}
          onCancel={() => setSelectedOrder(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <PackageSearch className="w-8 h-8 text-blue-500" />
          Alistamiento de Bodega
        </h1>
        <p className="text-slate-400 text-lg">
          Gestiona el pesaje y preparación de los pedidos antes del despacho.
        </p>
      </div>

      {pedidosPendientes.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-12 text-center">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
            <PackageSearch className="w-10 h-10 text-slate-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No hay pedidos pendientes</h3>
          <p className="text-slate-400">Todos los pedidos han sido alistados o no hay nuevos pedidos creados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {pedidosPendientes.map(pedido => {
            const cliente = getClienteById(pedido.clienteId);
            const isUrgent = new Date(pedido.fechaEntrega).getTime() - new Date().getTime() < 86400000; // Menos de 24h
            
            return (
              <div 
                key={pedido.id}
                onClick={() => setSelectedOrder(pedido)}
                className="bg-slate-800 rounded-2xl border border-slate-700 p-6 hover:border-blue-500/50 transition-all cursor-pointer group hover:shadow-xl hover:shadow-blue-900/20 relative overflow-hidden"
              >
                {/* Indicador de estado superior */}
                <div className={`absolute top-0 inset-x-0 h-1 ${pedido.estado === 'EN_ALISTAMIENTO' ? 'bg-amber-500' : 'bg-blue-500'}`} />

                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                      Pedido #{pedido.numeroPedido}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1">
                      {cliente?.nombre || 'Cliente Desconocido'}
                    </h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold
                    ${pedido.estado === 'EN_ALISTAMIENTO' 
                      ? 'bg-amber-500/20 text-amber-400' 
                      : 'bg-blue-500/20 text-blue-400'}`}
                  >
                    {pedido.estado.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-slate-300">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span className="text-sm">Entrega: {new Date(pedido.fechaEntrega).toLocaleDateString()} ({pedido.jornada})</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-slate-300">
                    <PackageSearch className="w-4 h-4 text-slate-500" />
                    <span className="text-sm">{pedido.lineas.length} líneas de productos</span>
                  </div>

                  {isUrgent && (
                    <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-2 rounded-lg mt-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">Entrega Urgente</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                  <span className="text-sm font-medium text-slate-400">
                    {pedido.origen} • {pedido.tipoEntrega.replace('_', ' ')}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors text-slate-400">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
