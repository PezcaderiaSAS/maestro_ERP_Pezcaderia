import { Cliente } from '../types/erp.types';

export const RETEFUENTE_PCT = 2.5; // 2.5% general
export const RETEICA_PCT = 0.414; // 4.14 x 1000

export class B2BSalesService {
  /**
   * Verifica si el cliente tiene cupo de crédito suficiente para el pedido.
   * @param cliente El cliente con su límite y uso de crédito
   * @param quoteTotal Valor total del pedido actual
   * @returns Un objeto con el estado de la aprobación
   */
  static verificarCupoCredito(cliente: Cliente, quoteTotal: number): { aprobado: boolean; cupoDisponible: number; mensaje: string } {
    const cupoUsado = cliente.cupoCreditoUsado || 0;
    const cupoDisponible = cliente.cupoCredito - cupoUsado;
    const aprobado = cupoDisponible >= quoteTotal;

    if (!aprobado) {
      return {
        aprobado: false,
        cupoDisponible,
        mensaje: `Crédito insuficiente. Cupo disponible: $${cupoDisponible.toLocaleString()} COP. Pedido: $${quoteTotal.toLocaleString()} COP.`
      };
    }

    return {
      aprobado: true,
      cupoDisponible,
      mensaje: 'Crédito aprobado.'
    };
  }

  /**
   * Calcula los totales de una cotización/pedido B2B aplicando retenciones NIIF si el cliente aplica.
   * Si el cliente es Gran Contribuyente, retendrá Retefuente/ReteICA de su pago hacia nosotros.
   * @param baseSinIva Total base del pedido
   * @param totalIva Total IVA del pedido
   * @param cliente El cliente a evaluar
   */
  static calcularTotalesCotizacionNIIF(baseSinIva: number, totalIva: number, cliente: Cliente) {
    const totalFactura = baseSinIva + totalIva;
    let valorRetefuente = 0;
    let valorReteIca = 0;

    if (cliente.isGranContribuyente || cliente.isAutoretenedor) {
      valorRetefuente = baseSinIva * (RETEFUENTE_PCT / 100);
      valorReteIca = baseSinIva * (RETEICA_PCT / 100);
    }

    const totalRetenciones = valorRetefuente + valorReteIca;
    const valorAPagar = totalFactura - totalRetenciones;

    return {
      subtotal_base: baseSinIva,
      total_iva: totalIva,
      total_factura: totalFactura,
      retefuente: valorRetefuente,
      reteica: valorReteIca,
      total_retenciones: totalRetenciones,
      valor_neto_a_cobrar: valorAPagar
    };
  }

  /**
   * Calcula la merma de picking (alistamiento en cuarto frío) 
   * cuando el peso real del picking difiere del peso teórico de la orden B2B.
   * @param pesoTeorico El peso (kg) reservado originalmente
   * @param pesoReal El peso (kg) realmente empacado
   * @param costoUnitario El costo por kg del producto
   */
  static calcularAjusteMermasPicking(pesoTeorico: number, pesoReal: number, costoUnitario: number) {
    const diferencia = pesoTeorico - pesoReal;
    const isMerma = diferencia > 0;
    const mermaKg = isMerma ? diferencia : 0;
    const costoMerma = mermaKg * costoUnitario;

    return {
      peso_teorico: pesoTeorico,
      peso_real: pesoReal,
      merma_kg: mermaKg,
      costo_merma_asumida: costoMerma,
      requiere_ajuste_inventario: isMerma
    };
  }
}
