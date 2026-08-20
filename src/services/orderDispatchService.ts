import { useOrderStore } from '../store/useOrderStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { useMovementStore } from '../store/useMovementStore';
import { useEventStore } from '../store/useEventStore';

export const orderDispatchService = {
  dispatchOrder: (pedido: any, conductor: string, userRole: string): { success: boolean; error?: string } => {
    try {
      if (pedido.inventarioDescontado) {
        return { success: false, error: 'Este pedido ya generó una salida de inventario previamente.' };
      }

      const { products, stock, setStock } = useInventoryStore.getState();
      const { addMovimiento } = useMovementStore.getState();
      const { updateVenta } = useOrderStore.getState();
      const { publishEvent } = useEventStore.getState();

      const newStock = { ...stock };
      const bodegaId = pedido.bodegaId || 'Bodega Principal';
      
      if (!newStock[bodegaId]) newStock[bodegaId] = {};

      pedido.lineas.forEach((linea: any) => {
        const producto = products.find((p: any) => p.id === linea.productoId);
        if (!producto) return;

        const sku = producto.sku;
        const cantidadADescontar = linea.pesoReal || linea.cantidadAlistada || linea.cantidadSolicitada;

        if (newStock[bodegaId][sku] === undefined) newStock[bodegaId][sku] = 0;
        newStock[bodegaId][sku] -= cantidadADescontar;

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
          notas: `Despacho de Pedido ${pedido.numeroPedido || pedido.id} (Conductor: ${conductor})`
        });
      });

      setStock(newStock);

      const observacionesOriginales = pedido.observaciones ? `${pedido.observaciones}\n` : '';
      
      const pedidoActualizado = {
        ...pedido,
        estado: 'EN_DESPACHO',
        inventarioDescontado: true,
        fechaActualizacionKanban: new Date().toISOString(),
        observaciones: `${observacionesOriginales}Despachado con: ${conductor}`
      };

      updateVenta(pedido.id, pedidoActualizado);
      
      publishEvent('QUOTE_STATUS_CHANGED', userRole, `Pedido despachado con ${conductor}`, { quoteId: pedido.id, nuevoEstado: 'EN_DESPACHO' });
      
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Error desconocido al despachar el pedido' };
    }
  }
};
