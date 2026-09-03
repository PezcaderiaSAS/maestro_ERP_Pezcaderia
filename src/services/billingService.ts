import { B2BOrderState, Venta, Cliente } from '../types/erp.types';
import { generateId } from '../lib/utils';
import { B2BSalesService } from './b2bSalesService';

export interface OrdenProformaItem {
  sku: string;
  nombre: string;
  cantidadOriginal: number;
  cantidadAceptada: number;
  precioUnitario: number;
}

export interface OrdenProforma {
  id: string;
  cliente: Cliente;
  estado: B2BOrderState;
  items: OrdenProformaItem[];
}

export class BillingService {
  /**
   * Genera la Factura Definitiva (Venta) basándose ÚNICAMENTE en las cantidades aceptadas.
   * Valida que la orden esté en estado 'ENTREGADO_CON_ACEPTACION'.
   * 
   * @param orden La orden de entrega con las cantidades reales aceptadas por el cliente
   * @param actor El usuario que registra la facturación
   */
  static generarFacturaDesdeAceptacion(orden: OrdenProforma, actor: string): Venta {
    if (orden.estado !== 'ENTREGADO_CON_ACEPTACION') {
      throw new Error(`La orden no puede facturarse. Estado actual: ${orden.estado}. Se requiere ENTREGADO_CON_ACEPTACION.`);
    }

    const itemsVenta = orden.items
      .filter(item => item.cantidadAceptada > 0)
      .map(item => ({
        sku: item.sku,
        nombre: item.nombre,
        cantidad: item.cantidadAceptada,
        precioUnitario: item.precioUnitario,
        descuento: 0
      }));

    if (itemsVenta.length === 0) {
      throw new Error('No se puede generar una factura con 0 ítems aceptados.');
    }

    const subtotal = itemsVenta.reduce((acc, item) => acc + (item.cantidad * item.precioUnitario), 0);
    // Para simplificar, asumimos un IVA del 19% si no se especifica. Sin embargo, usaremos el NIIF.
    const ivaEstimado = subtotal * 0.19;
    
    // Calculamos retenciones exactas para el cliente
    const totales = B2BSalesService.calcularTotalesCotizacionNIIF(subtotal, ivaEstimado, orden.cliente);

    const factura: Venta = {
      id: generateId('fac'),
      clienteId: orden.cliente.id,
      clienteNombre: orden.cliente.nombre,
      clienteIdentificacion: orden.cliente.identificacion,
      fecha: new Date().toISOString(),
      items: itemsVenta,
      subtotal: subtotal,
      total: totales.valor_neto_a_cobrar, // Total neto después de retenciones
      metodoPago: 'CREDITO', // B2B por defecto es crédito
      actor: actor
    };

    return factura;
  }
}
