import React, { useState } from 'react';
import { Truck, Package, Clock, MapPin, CheckCircle, Search, User } from 'lucide-react';
import { useOrderStore } from '../../store/useOrderStore';
import { useClientStore } from '../../store/useClientStore';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useMovementStore } from '../../store/useMovementStore';
import { useAppStore } from '../../store/useAppStore';
import { Pedido } from '../../types/orders.types';
import Swal from 'sweetalert2';

export const DispatchView: React.FC = () => {
  const { ventas, updateVenta } = useOrderStore();
  const { getClienteById } = useClientStore();
  const { products, stock, setStock } = useInventoryStore();
  const { addMovimiento } = useMovementStore();
  const userRole = useAppStore((s) => s.userRole);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConductor, setSelectedConductor] = useState<Record<string, string>>({});

  // Filtrar pedidos en estado LISTO
  const pedidosListos = ventas
    .filter(o => o.estado === 'LISTO')
    .filter(o => o.numeroPedido.toLowerCase().includes(searchTerm.toLowerCase()) || 
                 getClienteById(o.clienteId)?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => new Date(a.fechaEntrega).getTime() - new Date(b.fechaEntrega).getTime());

  const handleConductorChange = (pedidoId: string, value: string) => {
    setSelectedConductor(prev => ({ ...prev, [pedidoId]: value }));
  };

  const handleDespachar = (pedido: Pedido) => {
    const conductor = selectedConductor[pedido.id] || 'Conductor Predeterminado';

    if (pedido.inventarioDescontado) {
      Swal.fire({
        title: 'Error de Sincronización',
        text: 'Este pedido ya generó una salida de inventario previamente.',
        icon: 'error',
        confirmButtonColor: 'var(--primary-color)'
      });
      return;
    }

    Swal.fire({
      title: '¿Confirmar Despacho?',
      html: `¿Estás seguro de despachar el pedido <b>#${pedido.numeroPedido}</b> con el conductor <b>${conductor}</b>?<br/><br/>Esta acción <b>descontará el stock</b> de la bodega principal de forma irrevocable.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Confirmar y Descontar Stock',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3B82F6',
      cancelButtonColor: '#94A3B8'
    }).then((result) => {
      if (result.isConfirmed) {
        try {
          // 1. Descontar Stock y generar Movimientos
          const newStock = { ...stock };
          const bodegaId = pedido.bodegaId || 'Bodega Principal'; // Fallback a una bodega por defecto
          
          if (!newStock[bodegaId]) {
            newStock[bodegaId] = {};
          }

          pedido.lineas.forEach(linea => {
            const producto = products.find(p => p.id === linea.productoId);
            if (!producto) return;

            const sku = producto.sku;
            const cantidadADescontar = linea.pesoReal || linea.cantidadAlistada || linea.cantidadSolicitada;

            // Actualizar Stock local
            if (newStock[bodegaId][sku] === undefined) {
              newStock[bodegaId][sku] = 0;
            }
            newStock[bodegaId][sku] -= cantidadADescontar;

            // Generar Movimiento de Inventario
            addMovimiento({
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              tipo: 'VENTA',
              sku: sku,
              nombreProducto: producto.nombre,
              bodegaOrigen: bodegaId,
              cantidad: cantidadADescontar,
              lote: linea.loteSeleccionado || 'DESPACHO',
              referenciaId: pedido.id,
              referenciaTipo: 'DESPACHO_B2B',
              actor: userRole,
              notas: `Despacho de Pedido ${pedido.numeroPedido} (Conductor: ${conductor})`
            });
          });

          // Actualizar Stock State
          setStock(newStock);

          // 2. Actualizar Estado del Pedido
          const pedidoActualizado: Pedido = {
            ...pedido,
            estado: 'EN_DESPACHO',
            inventarioDescontado: true,
            observaciones: `${pedido.observaciones || ''}\nDespachado con: ${conductor}`
          };

          updateVenta(pedido.id, pedidoActualizado);

          Swal.fire({
            title: 'Despacho Exitoso',
            text: 'El pedido está en ruta y el stock ha sido descontado correctamente.',
            icon: 'success',
            confirmButtonColor: '#10B981'
          });

        } catch (error: any) {
          Swal.fire({
            title: 'Error Crítico',
            text: `Ocurrió un error al despachar: ${error.message}`,
            icon: 'error',
            confirmButtonColor: '#EF4444'
          });
        }
      }
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Truck className="w-8 h-8 text-indigo-400" />
          Despachos y Rutas
        </h1>
        <p className="text-slate-400 text-lg">
          Gestiona los pedidos listos, asigna conductores y realiza las salidas de inventario.
        </p>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por número o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {pedidosListos.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-12 text-center flex-1 flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-700">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No hay pedidos pendientes de despacho</h3>
          <p className="text-slate-400">Todos los pedidos listos han sido procesados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto">
          {pedidosListos.map(pedido => {
            const cliente = getClienteById(pedido.clienteId);
            
            return (
              <div 
                key={pedido.id}
                className="bg-slate-800 rounded-2xl border border-slate-700 p-6 flex flex-col justify-between hover:border-indigo-500/50 transition-all relative overflow-hidden"
              >
                <div className="absolute top-0 inset-x-0 h-1 bg-indigo-500" />

                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                        Pedido #{pedido.numeroPedido}
                      </span>
                      <h3 className="text-xl font-bold text-white mt-1">
                        {cliente?.nombre || 'Cliente Desconocido'}
                      </h3>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400">
                      LISTO PARA DESPACHO
                    </span>
                  </div>

                  <div className="space-y-3 mb-6 bg-slate-900/50 p-4 rounded-xl">
                    <div className="flex items-center justify-between text-slate-300">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-500" />
                        <span className="text-sm truncate w-48" title={cliente?.direccion}>{cliente?.direccion || 'Sin dirección'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium">{pedido.jornada}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-slate-300">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-slate-500" />
                        <span className="text-sm">{pedido.lineas.length} ítems</span>
                      </div>
                      <span className="font-bold text-white">
                        $ {(pedido.totalFinal || 0).toLocaleString('es-CO')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Asignar Conductor
                    </label>
                    <select 
                      value={selectedConductor[pedido.id] || ''}
                      onChange={(e) => handleConductorChange(pedido.id, e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Seleccione un conductor...</option>
                      <option value="Conductor Interno 1">Conductor Interno 1</option>
                      <option value="Conductor Interno 2">Conductor Interno 2</option>
                      <option value="Servicio Tercerizado">Servicio Tercerizado</option>
                    </select>
                  </div>

                  <button
                    onClick={() => handleDespachar(pedido)}
                    disabled={!selectedConductor[pedido.id]}
                    className="w-full py-3 rounded-xl font-bold transition-all bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                  >
                    <Truck className="w-5 h-5" />
                    Registrar Salida y Despachar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
