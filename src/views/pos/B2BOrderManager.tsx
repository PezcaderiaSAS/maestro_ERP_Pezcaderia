import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { B2BOrderState, Cliente } from '../../types/erp.types';
import { B2BSalesService } from '../../services/b2bSalesService';
import { useInventoryStore } from '../../store/useInventoryStore';
import { Search, CheckCircle, Package, Truck, Clock } from 'lucide-react';
import Swal from 'sweetalert2';

// Mock data para órdenes
const MOCK_ORDERS = [
  { id: 'ORD-001', cliente: 'Restaurante El Mar', total: 1500000, estado: 'PENDING_APPROVAL' as B2BOrderState, fecha: '2026-09-03', items: [{ sku: 'SALMON-01', qty: 20 }] },
  { id: 'ORD-002', cliente: 'Hotel Dorado', total: 500000, estado: 'PICKING' as B2BOrderState, fecha: '2026-09-02', items: [{ sku: 'PARGO-01', qty: 10 }] }
];

const MOCK_CLIENT: Cliente = {
  id: 'C-001', nombre: 'Restaurante El Mar', identificacion: '900123456', tipoIdentificacion: 'NIT', tipoPersona: 'JURIDICA',
  direccion: 'Calle 1', telefono: '123', email: 'test@test.com', ciudad: 'Bogota', tipoPrecio: 'RESTAURANTE',
  cupoCredito: 2000000, cupoCreditoUsado: 1800000, isGranContribuyente: false, activo: true
};

export const B2BOrderManager: React.FC = () => {
  const { userRole } = useAppStore();
  const { confirmarDespacho } = useInventoryStore();
  const [orders, setOrders] = useState(MOCK_ORDERS);

  const getStatusBadge = (state: B2BOrderState) => {
    switch(state) {
      case 'PENDING_APPROVAL': return <span className="flex items-center gap-1 w-max text-amber-500 bg-amber-500/10 px-2 py-1 rounded text-xs border border-amber-500/20"><Clock size={12}/> Aprobación Pdte</span>;
      case 'PICKING': return <span className="flex items-center gap-1 w-max text-cyan-500 bg-cyan-500/10 px-2 py-1 rounded text-xs border border-cyan-500/20"><Package size={12}/> En Alistamiento</span>;
      case 'DISPATCHED': return <span className="flex items-center gap-1 w-max text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded text-xs border border-emerald-500/20"><Truck size={12}/> Despachado</span>;
      default: return <span className="text-slate-400">{state}</span>;
    }
  };

  const handleApprove = (order: typeof MOCK_ORDERS[0]) => {
    const check = B2BSalesService.verificarCupoCredito(MOCK_CLIENT, order.total);
    if (!check.aprobado) {
      if (userRole === 'admin') {
        Swal.fire({
          title: 'Cupo Excedido',
          text: `${check.mensaje}\n¿Desea hacer un OVERRIDE y aprobar bajo su responsabilidad?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sí, Aprobar',
          confirmButtonColor: '#f59e0b',
          background: '#1e293b',
          color: '#fff'
        }).then((result) => {
          if (result.isConfirmed) {
            updateOrderState(order.id, 'PICKING');
            Swal.fire({ title: 'Aprobado', icon: 'success', background: '#1e293b', color: '#fff' });
          }
        });
      } else {
        Swal.fire({
          title: 'Aprobación Rechazada',
          text: check.mensaje,
          icon: 'error',
          background: '#1e293b',
          color: '#fff'
        });
      }
    } else {
      updateOrderState(order.id, 'PICKING');
    }
  };

  const handleConfirmPicking = (order: typeof MOCK_ORDERS[0]) => {
    Swal.fire({
      title: 'Confirmar Peso Real (Picking)',
      input: 'number',
      inputLabel: `Peso teórico reservado: ${order.items[0].qty} kg. Ingrese peso real empacado:`,
      inputValue: order.items[0].qty.toString(),
      showCancelButton: true,
      background: '#1e293b',
      color: '#fff',
      confirmButtonText: 'Confirmar Despacho'
    }).then((result) => {
      if (result.isConfirmed) {
        const pesoReal = Number(result.value);
        confirmarDespacho(order.items[0].sku, 'Bodega Central', order.items[0].qty, pesoReal);
        updateOrderState(order.id, 'DISPATCHED');
        Swal.fire({ title: 'Despachado con éxito', icon: 'success', background: '#1e293b', color: '#fff' });
      }
    });
  };

  const updateOrderState = (id: string, newState: B2BOrderState) => {
    setOrders(orders.map(o => o.id === id ? { ...o, estado: newState } : o));
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-800/40">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Package className="text-cyan-400" /> B2B Order Manager
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input 
            type="text" 
            placeholder="Buscar orden o cliente..." 
            className="pl-9 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-cyan-500 text-white w-64 transition-colors"
          />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/80 text-slate-300 text-sm uppercase tracking-wider">
              <th className="p-4 font-medium">ID Orden</th>
              <th className="p-4 font-medium">Cliente</th>
              <th className="p-4 font-medium">Fecha</th>
              <th className="p-4 font-medium">Total</th>
              <th className="p-4 font-medium">Estado</th>
              <th className="p-4 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-700/50">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-4 font-medium text-white">{order.id}</td>
                <td className="p-4 text-slate-300">{order.cliente}</td>
                <td className="p-4 text-slate-400">{order.fecha}</td>
                <td className="p-4 text-emerald-400 font-medium tabular-nums">${order.total.toLocaleString()}</td>
                <td className="p-4">{getStatusBadge(order.estado)}</td>
                <td className="p-4 text-right">
                  {order.estado === 'PENDING_APPROVAL' && (
                    <button 
                      onClick={() => handleApprove(order)}
                      className="px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors border border-amber-500/30 text-xs font-medium"
                    >
                      Aprobar Crédito
                    </button>
                  )}
                  {order.estado === 'PICKING' && (
                    <button 
                      onClick={() => handleConfirmPicking(order)}
                      className="px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors border border-cyan-500/30 text-xs font-medium"
                    >
                      Confirmar Picking
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <CheckCircle className="h-8 w-8 text-slate-600" />
                    <span>No hay órdenes B2B activas</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
