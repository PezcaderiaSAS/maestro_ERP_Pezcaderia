// src/services/siigoPayloadMapper.ts
import type { ResolucionVenta, SiigoInvoicePayload } from '../types/resoluciones.types';
import type { VentaPOS } from '../types/pos.types';

export interface BuildInvoicePayloadArgs {
  venta: VentaPOS | any;
  cliente: {
    identificacion?: string;
    nombre?: string;
    email?: string;
    direccion?: string;
    ciudadDane?: string;
  } | null;
  resolucion: ResolucionVenta;
  consecutivoInterno: string;
  sellerId?: number;
}

/**
 * Mapeo de métodos de pago POS a IDs de catálogo de Siigo Nube API
 */
export const SIIGO_PAYMENT_METHOD_IDS: Record<string, number> = {
  EFECTIVO: 1,       // Efectivo caja general
  TRANSFERENCIA: 2,  // Bancos / Nequi / Daviplata / QR
  TARJETA: 3,        // Datáfono crédito/débito
  CREDITO: 4,        // Crédito comercial clientes
  MIXTO: 1,
};

class SiigoPayloadMapper {
  /**
   * Construye el payload oficial para SIIGO Nube API v2
   */
  buildInvoicePayload({
    venta,
    cliente,
    resolucion,
    consecutivoInterno,
    sellerId = 1,
  }: BuildInvoicePayloadArgs): SiigoInvoicePayload {
    const documentId = resolucion.siigoDocumentId || 2458;
    const fechaFormatted = venta.fecha
      ? venta.fecha.split('T')[0]
      : new Date().toISOString().split('T')[0];

    const customerIdentification =
      cliente?.identificacion && cliente.identificacion.trim().length > 0
        ? cliente.identificacion.trim()
        : '222222222222'; // Consumidor final estándar DIAN

    const items = (venta.lineas || venta.items || []).map((linea: any) => {
      const itemCode = linea.sku || linea.productoId || 'PROD-GEN';
      const itemDescription = linea.nombre || linea.descripcion || 'Producto del mar';
      const quantity = Number(linea.cantidad) || 1;
      const unitPrice = Math.round(Number(linea.precioFinal || linea.precioUnitario || linea.precioLista || 0));
      const discount = Number(linea.descuentoPct || 0);

      const taxes = linea.ivaPct && linea.ivaPct > 0
        ? [
            {
              id: linea.ivaPct === 19 ? 1 : 2, // ID de impuesto configurable en Siigo
              percentage: linea.ivaPct,
            },
          ]
        : [];

      return {
        code: itemCode,
        description: itemDescription,
        quantity,
        price: unitPrice,
        discount: discount > 0 ? discount : undefined,
        taxes: taxes.length > 0 ? taxes : undefined,
      };
    });

    const paymentMethodKey = (venta.formaPago || venta.metodoPago || 'EFECTIVO').toUpperCase();
    const paymentMethodId = SIIGO_PAYMENT_METHOD_IDS[paymentMethodKey] || 1;
    const totalAmount = Math.round(Number(venta.totalFinal || venta.total || 0));

    const payments = [
      {
        id: paymentMethodId,
        value: totalAmount,
        due_date: fechaFormatted,
      },
    ];

    return {
      document: {
        id: documentId,
      },
      date: fechaFormatted,
      customer: {
        identification: customerIdentification,
        branch_office: 0,
      },
      seller: sellerId,
      items,
      payments,
      observations: `ERP Ref: ${venta.id} | Control Interno: ${consecutivoInterno}`,
      send_dian: true,
    };
  }
}

export const siigoPayloadMapper = new SiigoPayloadMapper();
