// src/hooks/usePOSPrinter.ts

import { useState } from 'react';
import type { VentaPOS, LineaVenta } from '../types/pos.types';

export interface ClientePrinter {
  nombre: string;
  identificacion: string;
}

export function usePOSPrinter() {
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Da formato a una cadena de texto a un ancho fijo de 40 columnas para impresoras térmicas
   */
  const formatearTextoTicket = (venta: VentaPOS, cliente: ClientePrinter | null): string => {
    const width = 40;
    const center = (text: string) => {
      const pad = Math.max(0, Math.floor((width - text.length) / 2));
      return ' '.repeat(pad) + text;
    };
    
    const justify = (left: string, right: string) => {
      const space = Math.max(1, width - (left.length + right.length));
      return left + ' '.repeat(space) + right;
    };

    const separator = () => '='.repeat(width);
    const lineDash = () => '-'.repeat(width);

    let ticket = '';
    
    // Encabezado
    ticket += center('*** ERP MAESTRO PESCADERIA ***') + '\n';
    ticket += center('PESCADERIA S.A.S.') + '\n';
    ticket += center('NIT: 900.123.456-1') + '\n';
    ticket += center('Dirección: Calle 72 # 15-23, Bogotá') + '\n';
    ticket += center('Teléfono: 310 123 4567') + '\n';
    ticket += separator() + '\n';
    
    // Info Factura
    const fecha = venta.fecha ? new Date(venta.fecha).toLocaleString('es-CO') : new Date().toLocaleString('es-CO');
    ticket += `Factura: ${venta.id.toUpperCase()}\n`;
    ticket += `Fecha  : ${fecha}\n`;
    ticket += `Cajero : ${venta.actor || 'Sistema'}\n`;
    ticket += lineDash() + '\n';

    // Info Cliente
    if (cliente) {
      ticket += `Cliente: ${cliente.nombre.toUpperCase()}\n`;
      ticket += `NIT/CC : ${cliente.identificacion}\n`;
    } else {
      ticket += `Cliente: CONSUMIDOR FINAL\n`;
    }
    ticket += separator() + '\n';

    // Cabecera de Items
    ticket += justify('PRODUCTO/CANT', 'TOTAL') + '\n';
    ticket += lineDash() + '\n';

    // Items
    const items = venta.items || venta.lineas || [];
    items.forEach((item: LineaVenta) => {
      // Cortar nombre largo
      const truncatedName = item.nombre.substring(0, 25);
      ticket += truncatedName + '\n';
      
      const priceStr = `$${item.precioFinal.toLocaleString('es-CO')}`;
      const qtyStr = `${item.cantidad} ${item.unidad}`;
      const rightStr = `$${item.totalLinea.toLocaleString('es-CO')}`;
      
      ticket += justify(`  ${qtyStr} x ${priceStr}`, rightStr) + '\n';
    });
    
    ticket += separator() + '\n';

    // Totales
    ticket += justify('SUBTOTAL:', `$${venta.subtotal.toLocaleString('es-CO')}`) + '\n';
    const descuento = venta.descuento !== undefined ? venta.descuento : (venta.descuentoGlobalValor || 0);
    if (descuento > 0) {
      ticket += justify('DESCUENTO:', `-$${descuento.toLocaleString('es-CO')}`) + '\n';
    }
    const total = venta.total !== undefined ? venta.total : (venta.totalFinal || 0);
    ticket += justify('TOTAL FINAL:', `$${total.toLocaleString('es-CO')}`) + '\n';
    ticket += lineDash() + '\n';

    // Detalle Pago
    ticket += `Método Pago: ${venta.metodoPago || 'CONTADO'}\n`;
    if (venta.montoPagadoEfectivo && venta.montoPagadoEfectivo > 0) {
      ticket += justify('  Efectivo Recibido:', `$${venta.montoPagadoEfectivo.toLocaleString('es-CO')}`) + '\n';
    }
    if (venta.cambioEntregado && venta.cambioEntregado > 0) {
      ticket += justify('  Cambio Devuelto:', `$${venta.cambioEntregado.toLocaleString('es-CO')}`) + '\n';
    }
    if (venta.montoPagadoCredito && venta.montoPagadoCredito > 0) {
      ticket += justify('  Cargado a Crédito:', `$${venta.montoPagadoCredito.toLocaleString('es-CO')}`) + '\n';
    }

    ticket += separator() + '\n';
    ticket += center('¡GRACIAS POR SU COMPRA!') + '\n';
    ticket += center('Pescado fresco del día') + '\n';
    ticket += '\n\n\n'; // Feed lines

    return ticket;
  };

  /**
   * Simula o realiza la impresión del ticket en consola o mediante el driver del navegador
   */
  const imprimirTicket = async (venta: VentaPOS, cliente: ClientePrinter | null): Promise<boolean> => {
    setPrinting(true);
    setError(null);

    const ticketText = formatearTextoTicket(venta, cliente);

    try {
      // Simulación de delay de hardware
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      // Imprimir en consola de desarrollo
      console.log('%c--- TICKET TÉRMICO (40 COLUMNAS) ---', 'color: #0ea5e9; font-weight: bold;');
      console.log(ticketText);
      
      // Si el navegador soporta Web Serial, podríamos abrir un puerto y enviarlo.
      // Como fallback de producción, también podemos abrir un iframe oculto para impresión nativa del sistema.
      setPrinting(false);
      return true;
    } catch (err: any) {
      setPrinting(false);
      setError(err.message || 'Error al imprimir ticket');
      return false;
    }
  };

  return {
    printing,
    error,
    formatearTextoTicket,
    imprimirTicket,
  };
}
