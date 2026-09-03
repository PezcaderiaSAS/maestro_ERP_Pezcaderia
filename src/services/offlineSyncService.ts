import { Cliente, Product } from '../types/erp.types';
import { B2BSalesService } from './b2bSalesService';

export interface PreOrdenItem {
  sku: string;
  qty: number;
  precioUnitarioOffline: number;
}

export interface PreOrdenOffline {
  idOffline: string;
  clienteId: string;
  fechaCreacion: string;
  items: PreOrdenItem[];
}

export interface SyncResult {
  exito: boolean;
  motivoRechazo?: string;
  totalCalculado?: number;
}

export class OfflineSyncService {
  /**
   * Valida una orden offline creada por el vendedor.
   * Rechaza la orden si hay variaciones de precio o si el cupo de crédito del cliente se superó
   * entre el momento de la creación offline y la sincronización (Opción A).
   * 
   * @param orden La orden creada en modo offline
   * @param cliente El cliente con los datos actualizados (cupo, etc.)
   * @param catalogo El catálogo actualizado de productos con los precios vigentes
   * @param canal El canal de precios aplicable ('POS', 'RESTAURANTE', 'MAYORISTA')
   */
  static validarSincronizacionOffline(
    orden: PreOrdenOffline, 
    cliente: Cliente, 
    catalogo: Product[],
    canal: 'POS' | 'RESTAURANTE' | 'MAYORISTA'
  ): SyncResult {
    let totalCalculado = 0;

    for (const item of orden.items) {
      const producto = catalogo.find(p => p.sku === item.sku);
      if (!producto) {
        return { exito: false, motivoRechazo: `Producto discontinuado o no encontrado: ${item.sku}` };
      }

      let precioVigente = 0;
      switch (canal) {
        case 'RESTAURANTE': precioVigente = producto.precio_venta_restaurante; break;
        case 'MAYORISTA': precioVigente = producto.precio_venta_mayorista; break;
        default: precioVigente = producto.precio_venta_pos; break;
      }

      // Validar si el precio cambió drásticamente (cualquier cambio requiere renegociar según Opción A)
      if (item.precioUnitarioOffline !== precioVigente) {
        return { 
          exito: false, 
          motivoRechazo: `Cambio de precio detectado en ${producto.nombre}. Precio Offline: $${item.precioUnitarioOffline}, Precio Actual: $${precioVigente}. Renegociación requerida.` 
        };
      }

      totalCalculado += (precioVigente * item.qty);
    }

    // Validar el límite de crédito con el total calculado
    const chequeoCredito = B2BSalesService.verificarCupoCredito(cliente, totalCalculado);
    if (!chequeoCredito.aprobado) {
      return {
        exito: false,
        motivoRechazo: `Crédito excedido durante el modo offline. ${chequeoCredito.mensaje}`
      };
    }

    return { exito: true, totalCalculado };
  }
}
