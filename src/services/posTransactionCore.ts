import { Venta } from '../types/erp.types';

export interface MetodoPagoRecibido {
  metodo: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA';
  monto: number;
}

export class POSTransactionCore {
  /**
   * Procesa un pago multicanal, sumando los métodos de pago y validando si cubren el total.
   * Retorna el cambio a entregar si hay exceso en efectivo, o el monto pendiente.
   * @param montoTotal El monto total a cobrar (factura)
   * @param pagos Arreglo de métodos de pago recibidos en mostrador
   */
  static procesarPagoMulticanal(montoTotal: number, pagos: MetodoPagoRecibido[]) {
    let totalRecibido = 0;
    let efectivoRecibido = 0;
    let tarjetaRecibido = 0;
    let transferenciaRecibida = 0;

    pagos.forEach(p => {
      totalRecibido += p.monto;
      if (p.metodo === 'EFECTIVO') efectivoRecibido += p.monto;
      if (p.metodo === 'TARJETA') tarjetaRecibido += p.monto;
      if (p.metodo === 'TRANSFERENCIA') transferenciaRecibida += p.monto;
    });

    const saldoPendiente = montoTotal - totalRecibido;
    const isPagado = saldoPendiente <= 0;
    
    // Solo se da cambio físico sobre la parte pagada en efectivo.
    // Si la suma de pagos supera el total, el excedente es cambio.
    const cambio = saldoPendiente < 0 ? Math.abs(saldoPendiente) : 0;

    return {
      totalRecibido,
      efectivoRecibido,
      tarjetaRecibido,
      transferenciaRecibida,
      isPagado,
      saldoPendiente: isPagado ? 0 : saldoPendiente,
      cambioEntregado: cambio
    };
  }

  /**
   * Genera el payload de datos formateados para impresión de recibo térmico POS de 80mm.
   * Cumple con la estética y espaciado de impresoras ESC/POS estándar.
   */
  static generarReciboTermicoData(venta: Venta): string {
    const separador = '--------------------------------';
    const lineas: string[] = [];
    
    lineas.push('      MAESTRO PESCADERIA      ');
    lineas.push('        NIT: 900.XXX.XXX-X      ');
    lineas.push('     Régimen Responsable IVA    ');
    lineas.push(separador);
    lineas.push(`Fecha: ${new Date(venta.fecha).toLocaleString()}`);
    lineas.push(`Cliente: ${venta.clienteNombre}`);
    lineas.push(`Doc: ${venta.clienteIdentificacion || '222222222222'}`);
    lineas.push(separador);
    
    lineas.push('CANT DESC             TOTAL');
    
    venta.items.forEach(item => {
      const cantidad = item.cantidad.toString().padEnd(4);
      const nombre = item.nombre.substring(0, 15).padEnd(15);
      const totalItem = (item.cantidad * item.precioUnitario).toLocaleString();
      lineas.push(`${cantidad} ${nombre} $${totalItem}`);
    });
    
    lineas.push(separador);
    lineas.push(`SUBTOTAL:         $${venta.subtotal.toLocaleString()}`);
    lineas.push(`TOTAL:            $${venta.total.toLocaleString()}`);
    lineas.push(separador);
    
    if (venta.montoPagadoEfectivo) lineas.push(`EFECTIVO:         $${venta.montoPagadoEfectivo.toLocaleString()}`);
    if (venta.montoPagadoTarjeta) lineas.push(`TARJETA:          $${venta.montoPagadoTarjeta.toLocaleString()}`);
    if (venta.montoPagadoTransferencia) lineas.push(`TRANSF:           $${venta.montoPagadoTransferencia.toLocaleString()}`);
    if (venta.cambioEntregado) lineas.push(`CAMBIO:           $${venta.cambioEntregado.toLocaleString()}`);
    
    lineas.push(separador);
    lineas.push('   ¡GRACIAS POR SU COMPRA!    ');

    return lineas.join('\n');
  }
}
