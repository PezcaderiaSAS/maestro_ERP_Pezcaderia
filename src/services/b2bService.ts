import { load, save } from './localDb';
import { Pedido, EstadoPedido, LineaPedido } from '../types/orders.types';
import { ResultadoOperacion } from '../types/common.types';

const DB_KEY = 'quotations'; // Usando quotations para mantener compatibilidad con localDb

export const b2bService = {
  /**
   * Obtiene todos los pedidos B2B
   */
  obtenerPedidos(): Pedido[] {
    return load<Pedido[]>(DB_KEY, []);
  },

  /**
   * Obtiene un pedido B2B por ID
   */
  obtenerPedidoPorId(id: string): Pedido | null {
    const pedidos = this.obtenerPedidos();
    return pedidos.find(p => p.id === id) || null;
  },

  /**
   * Crea un nuevo pedido B2B en estado CREADO o PAUSADO_POR_CREDITO
   * TODO: Integrar validación real con clientService (RN-33)
   */
  crearPedidoB2B(pedido: Omit<Pedido, 'id' | 'numeroPedido' | 'estado'>): ResultadoOperacion<Pedido> {
    try {
      const pedidos = this.obtenerPedidos();
      
      // Validación básica de cupo (Simulada para RN-33)
      const cupoExcedido = false; // Aquí iría la llamada a clientService.validarCupo()
      
      const nuevoPedido: Pedido = {
        ...pedido,
        id: crypto.randomUUID(),
        numeroPedido: `PED-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
        estado: cupoExcedido ? 'PAUSADO_POR_CREDITO' : 'CREADO'
      };

      pedidos.push(nuevoPedido);
      save(DB_KEY, pedidos);

      return { data: nuevoPedido, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  /**
   * Cambia el estado de un pedido validando la máquina de estados unidireccional (RN-04)
   */
  cambiarEstadoPedido(pedidoId: string, nuevoEstado: EstadoPedido): ResultadoOperacion<Pedido> {
    try {
      const pedidos = this.obtenerPedidos();
      const index = pedidos.findIndex(p => p.id === pedidoId);
      
      if (index === -1) throw new Error('Pedido no encontrado');
      
      const pedido = pedidos[index];
      const estadoActual = pedido.estado;

      // RN-04: Transiciones válidas
      const transicionesValidas: Record<EstadoPedido, EstadoPedido[]> = {
        'CREADO': ['LISTO', 'ANULADO', 'PAUSADO_POR_CREDITO'],
        'LISTO': ['EN_DESPACHO', 'ANULADO'],
        'EN_DESPACHO': ['ENTREGADO'],
        'ENTREGADO': ['FACTURADO', 'PAGADO'], // Se puede pagar de contado directo sin facturar, o facturar primero
        'FACTURADO': ['PAGADO'],
        'PAGADO': [],
        'PAUSADO': ['LISTO', 'ANULADO'], // Requiere bypass manual
        'PAUSADO_POR_CREDITO': ['CREADO', 'ANULADO'], // Tras abono de cartera o bypass
        'ANULADO': []
      };

      if (!transicionesValidas[estadoActual].includes(nuevoEstado)) {
        throw new Error(`Transición no permitida: ${estadoActual} -> ${nuevoEstado}`);
      }

      pedido.estado = nuevoEstado;
      save(DB_KEY, pedidos);

      return { data: pedido, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  /**
   * Confirma el alistamiento de un pedido registrando los pesos reales (RN-18)
   */
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

      // RN-18: Validar diferencia de peso > 5%
      pedido.lineas = pedido.lineas.map(linea => {
        const pesoReal = pesosReales.find(p => p.productoId === linea.productoId)?.cantidadAlistada || 0;
        
        const diferenciaAbsoluta = Math.abs(linea.cantidadSolicitada - pesoReal);
        const porcentajeDiferencia = (diferenciaAbsoluta / linea.cantidadSolicitada) * 100;

        if (porcentajeDiferencia > 5) {
          requierePausa = true;
        }

        // Recalcular el total de la línea basado en el peso real
        const nuevoTotalLinea = pesoReal * linea.precioPactado;

        return {
          ...linea,
          cantidadAlistada: pesoReal,
          totalLinea: nuevoTotalLinea
        };
      });

      // Recalcular totales del pedido
      pedido.subtotal = pedido.lineas.reduce((sum, linea) => sum + linea.totalLinea, 0);
      pedido.totalFinal = pedido.subtotal - pedido.descuentoGlobalValor;

      // Aplicar estado según reglas
      if (requierePausa) {
        pedido.estado = 'PAUSADO';
      } else {
        pedido.estado = 'LISTO';
        // TODO: Descontar stock aquí vía inventoryService (Solo cuando pasa a LISTO directo)
      }

      save(DB_KEY, pedidos);

      return { data: pedido, error: requierePausa ? 'Pedido PAUSADO: Diferencia de peso mayor al 5%' : null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }
};
