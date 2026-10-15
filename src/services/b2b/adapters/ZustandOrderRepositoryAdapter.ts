import { IOrderRepository } from '../../../contracts/b2b.contracts';
import { Pedido, Cotizacion } from '../../../types/orders.types';
import { useOrderStore } from '../../../store/useOrderStore';

/**
 * Adaptador de Infraestructura para Repositorio de Pedidos y Cotizaciones respaldado por Zustand.
 * Cumple con el principio de Inversión de Dependencias (DIP).
 */
export class ZustandOrderRepositoryAdapter implements IOrderRepository {
  obtenerPedidoPorId(id: string): Pedido | undefined {
    const { ventas } = useOrderStore.getState();
    return ventas.find(v => v.id === id || v.numeroPedido === id);
  }

  obtenerCotizacionPorId(id: string): Cotizacion | undefined {
    const { quotations } = useOrderStore.getState();
    return quotations.find(q => q.id === id);
  }

  guardarPedido(pedido: Pedido): void {
    const store = useOrderStore.getState();
    try {
      store.addVenta(pedido);
    } catch {
      useOrderStore.setState(state => ({
        ventas: [...state.ventas.filter(v => v.id !== pedido.id), pedido],
      }));
    }
  }

  actualizarPedido(id: string, parcial: Partial<Pedido> | Pedido): void {
    const store = useOrderStore.getState();
    const pedidoActual = store.ventas.find(v => v.id === id);
    if (!pedidoActual) {
      throw new Error(`Pedido con id ${id} no encontrado en el repositorio`);
    }

    const pedidoActualizado: Pedido = {
      ...pedidoActual,
      ...parcial,
    };

    try {
      store.updateVenta(id, pedidoActualizado);
    } catch {
      useOrderStore.setState(state => ({
        ventas: state.ventas.map(v => (v.id === id ? pedidoActualizado : v)),
      }));
    }
  }

  actualizarCotizacion(id: string, parcial: Partial<Cotizacion>): void {
    const store = useOrderStore.getState();
    const cotizacionActual = store.quotations.find(q => q.id === id);
    if (!cotizacionActual) {
      throw new Error(`Cotización con id ${id} no encontrada en el repositorio`);
    }

    try {
      store.updateQuotation(id, parcial);
    } catch {
      useOrderStore.setState(state => ({
        quotations: state.quotations.map(q =>
          q.id === id ? { ...q, ...parcial } : q
        ),
      }));
    }
  }

  obtenerPedidos(): Pedido[] {
    return useOrderStore.getState().ventas;
  }

  obtenerCotizaciones(): Cotizacion[] {
    return useOrderStore.getState().quotations;
  }
}

export const zustandOrderRepository = new ZustandOrderRepositoryAdapter();
