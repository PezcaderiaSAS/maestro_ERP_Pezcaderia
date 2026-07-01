import { load, save } from './localDb';
import type { IDataService } from '../types/services.types';
import { LocalDataService } from './LocalDataService';
import { Pedido, EstadoPedido } from '../types/orders.types';
import { ResultadoOperacion } from '../types/common.types';

const DB_KEY = 'quotations';

// ── Legacy sync API (preservada) ──
export const transicionesValidas: Record<EstadoPedido, EstadoPedido[]> = {
  'CREADO': ['EN_ALISTAMIENTO', 'ANULADO', 'PAUSADO_POR_CREDITO'],
  'EN_ALISTAMIENTO': ['LISTO', 'PAUSADO', 'ANULADO'],
  'LISTO': ['EN_DESPACHO', 'ANULADO'],
  'EN_DESPACHO': ['ENTREGADO'],
  'ENTREGADO': ['FACTURADO', 'PAGADO'],
  'FACTURADO': ['PAGADO'],
  'PAGADO': [],
  'PAUSADO': ['LISTO', 'ANULADO'],
  'PAUSADO_POR_CREDITO': ['CREADO', 'ANULADO'],
  'ANULADO': [],
};

export const b2bService = {
  obtenerPedidos(): Pedido[] {
    return load<Pedido[]>(DB_KEY, []);
  },

  obtenerPedidoPorId(id: string): Pedido | null {
    const pedidos = this.obtenerPedidos();
    return pedidos.find(p => p.id === id) || null;
  },

  crearPedidoB2B(pedido: Omit<Pedido, 'id' | 'numeroPedido' | 'estado'>): ResultadoOperacion<Pedido> {
    try {
      const pedidos = this.obtenerPedidos();
      const cupoExcedido = false;

      const nuevoPedido: Pedido = {
        ...pedido,
        id: crypto.randomUUID(),
        numeroPedido: `PED-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
        estado: cupoExcedido ? 'PAUSADO_POR_CREDITO' : 'CREADO',
      };

      pedidos.push(nuevoPedido);
      save(DB_KEY, pedidos);
      return { data: nuevoPedido, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  cambiarEstadoPedido(pedidoId: string, nuevoEstado: EstadoPedido): ResultadoOperacion<Pedido> {
    try {
      const pedidos = this.obtenerPedidos();
      const index = pedidos.findIndex(p => p.id === pedidoId);
      if (index === -1) throw new Error('Pedido no encontrado');

      const pedido = pedidos[index];
      if (!transicionesValidas[pedido.estado].includes(nuevoEstado)) {
        throw new Error(`Transición no permitida: ${pedido.estado} -> ${nuevoEstado}`);
      }

      pedido.estado = nuevoEstado;
      save(DB_KEY, pedidos);
      return { data: pedido, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  confirmarAlistamiento(pedidoId: string, pesosReales: { productoId: string; cantidadAlistada: number }[]): ResultadoOperacion<Pedido> {
    try {
      const pedidos = this.obtenerPedidos();
      const index = pedidos.findIndex(p => p.id === pedidoId);
      if (index === -1) throw new Error('Pedido no encontrado');

      const pedido = pedidos[index];
      if (pedido.estado !== 'CREADO' && pedido.estado !== 'PAUSADO') {
        throw new Error('El pedido debe estar en CREADO o PAUSADO para alistarse');
      }

      let requierePausa = false;
      pedido.lineas = pedido.lineas.map(linea => {
        const pesoReal = pesosReales.find(p => p.productoId === linea.productoId)?.cantidadAlistada || 0;
        const diferenciaAbsoluta = Math.abs(linea.cantidadSolicitada - pesoReal);
        const porcentajeDiferencia = (diferenciaAbsoluta / linea.cantidadSolicitada) * 100;
        if (porcentajeDiferencia > 5) requierePausa = true;

        return {
          ...linea,
          cantidadAlistada: pesoReal,
          totalLinea: pesoReal * linea.precioPactado,
        };
      });

      pedido.subtotal = pedido.lineas.reduce((sum, linea) => sum + linea.totalLinea, 0);
      pedido.totalFinal = pedido.subtotal - pedido.descuentoGlobalValor;
      pedido.estado = requierePausa ? 'PAUSADO' : 'LISTO';
      save(DB_KEY, pedidos);

      return { data: pedido, error: requierePausa ? 'Pedido PAUSADO: Diferencia de peso mayor al 5%' : null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },
};

// ── Nueva API async basada en IDataService ──
export class B2bService {
  constructor(private dataService: IDataService = new LocalDataService()) {}

  async obtenerPedidos(): Promise<Pedido[]> {
    return this.dataService.getAll<Pedido>('cotizaciones');
  }

  async crearPedidoB2B(pedido: Omit<Pedido, 'id' | 'numeroPedido' | 'estado'>): Promise<ResultadoOperacion<Pedido>> {
    try {
      const cupoExcedido = false;
      const nuevoPedido: Pedido = {
        ...pedido,
        id: crypto.randomUUID(),
        numeroPedido: `PED-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
        estado: cupoExcedido ? 'PAUSADO_POR_CREDITO' : 'CREADO',
      };
      await this.dataService.create('cotizaciones', nuevoPedido);
      return { data: nuevoPedido, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  async cambiarEstadoPedido(pedidoId: string, nuevoEstado: EstadoPedido): Promise<ResultadoOperacion<Pedido>> {
    try {
      const pedido = await this.dataService.getById<Pedido>('cotizaciones', pedidoId);
      if (!pedido) return { data: null, error: 'Pedido no encontrado' };

      if (!transicionesValidas[pedido.estado].includes(nuevoEstado)) {
        return { data: null, error: `Transición no permitida: ${pedido.estado} -> ${nuevoEstado}` };
      }

      const updated = await this.dataService.update('cotizaciones', pedidoId, { estado: nuevoEstado } as any);
      return { data: updated as Pedido, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  async confirmarAlistamiento(pedidoId: string, pesosReales: { productoId: string; cantidadAlistada: number }[]): Promise<ResultadoOperacion<Pedido>> {
    try {
      const pedido = await this.dataService.getById<Pedido>('cotizaciones', pedidoId);
      if (!pedido) return { data: null, error: 'Pedido no encontrado' };
      if (pedido.estado !== 'CREADO' && pedido.estado !== 'PAUSADO') {
        return { data: null, error: 'El pedido debe estar en CREADO o PAUSADO para alistarse' };
      }

      let requierePausa = false;
      pedido.lineas = pedido.lineas.map(linea => {
        const pesoReal = pesosReales.find(p => p.productoId === linea.productoId)?.cantidadAlistada || 0;
        const diff = Math.abs(linea.cantidadSolicitada - pesoReal) / linea.cantidadSolicitada * 100;
        if (diff > 5) requierePausa = true;
        return { ...linea, cantidadAlistada: pesoReal, totalLinea: pesoReal * linea.precioPactado };
      });

      pedido.subtotal = pedido.lineas.reduce((sum, l) => sum + l.totalLinea, 0);
      pedido.totalFinal = pedido.subtotal - pedido.descuentoGlobalValor;
      pedido.estado = requierePausa ? 'PAUSADO' : 'LISTO';

      await this.dataService.update('cotizaciones', pedidoId, pedido as any);
      return { data: pedido, error: requierePausa ? 'Pedido PAUSADO: Diferencia de peso mayor al 5%' : null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }
}
