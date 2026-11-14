import { jsPDF } from 'jspdf';
import type {
  ReciboPagoAlquilerPdfParams,
  TicketTermicoAlquilerPdfParams,
} from './coldStoragePdf.types';
import {
  EMPRESA_NOMBRE,
  EMPRESA_NIT,
  aplicarEncabezado,
  aplicarPiePagina,
} from './coldStoragePdfBase';

/**
 * Genera el Recibo Oficial de Caja y Paz y Salvo de Servicio Frigorífico (Formato Carta Ejecutivo)
 */
export function generarPdfReciboPagoAlquiler(params: ReciboPagoAlquilerPdfParams): jsPDF {
  const {
    consecutivo,
    cliente,
    contrato,
    concepto,
    periodo,
    modalidadTiempo = 'MESES',
    diasLiquidacion,
    kilosLiquidacion,
    subtotal,
    iva,
    retefuente = 0,
    totalPagar,
    metodoPago,
    referenciaCaja = 'CAJA-POS-01',
    cajeroNombre = 'Cajero de Turno',
    fechaPago = new Date().toLocaleString('es-CO'),
  } = params;

  const doc = new jsPDF();
  aplicarEncabezado(doc, 'RECIBO OFICIAL DE CAJA - SERVICIO DE CUSTODIA Y CUARTO FRÍO', consecutivo);

  let y = 48;
  // Caja Depositante y Pago
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 182, 38, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('DATOS DEL CLIENTE (DEPOSITANTE):', 18, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Razón Social: ${cliente.razon_social}`, 18, y + 14);
  doc.text(`Identificación: ${cliente.tipo_identificacion} ${cliente.numero_identificacion}`, 18, y + 21);
  doc.text(`Teléfono / Contacto: ${cliente.telefono || 'N/A'} - ${cliente.responsable_contacto || 'N/A'}`, 18, y + 28);

  doc.setFont('helvetica', 'bold');
  doc.text('DETALLE DEL PAGO EN CAJA:', 115, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha y Hora: ${fechaPago}`, 115, y + 14);
  doc.text(`Método de Pago: ${metodoPago}`, 115, y + 21);
  doc.text(`Caja / Ref: ${referenciaCaja} (${cajeroNombre})`, 115, y + 28);

  y += 46;

  // Tabla de Liquidación
  doc.setFillColor(15, 23, 42);
  doc.rect(14, y, 182, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('CONCEPTO / DESCRIPCIÓN DEL SERVICIO', 18, y + 5.5);
  doc.text('MODALIDAD', 105, y + 5.5);
  doc.text('CANTIDAD', 135, y + 5.5);
  doc.text('TOTAL COP', 170, y + 5.5);

  y += 8;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 14, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(concepto.substring(0, 48), 18, y + 6);
  if (periodo) {
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(`Periodo liquidado: ${periodo}`, 18, y + 10.5);
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
  }
  doc.text(modalidadTiempo, 105, y + 6);
  doc.text(
    diasLiquidacion
      ? `${diasLiquidacion} días (${kilosLiquidacion ?? 'N/A'} Kg)`
      : `${contrato?.posiciones_contratadas ?? 1} Pos.`,
    135,
    y + 6
  );
  doc.setFont('helvetica', 'bold');
  doc.text(`$${Number(subtotal).toLocaleString('es-CO')}`, 170, y + 6);

  y += 22;

  // Caja de Totales y Retenciones
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(105, y, 91, 38, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal Servicio Alquiler:', 110, y + 8);
  doc.text(`$${Number(subtotal).toLocaleString('es-CO')}`, 190, y + 8, { align: 'right' });

  doc.text('IVA 19% Generado (Cuenta 2408):', 110, y + 15);
  doc.text(`$${Number(iva).toLocaleString('es-CO')}`, 190, y + 15, { align: 'right' });

  if (retefuente > 0) {
    doc.text('Retención en la Fuente Practicada:', 110, y + 22);
    doc.text(`-$${Number(retefuente).toLocaleString('es-CO')}`, 190, y + 22, { align: 'right' });
  }

  doc.setDrawColor(203, 213, 225);
  doc.line(110, y + 26, 190, y + 26);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL CANCELADO:', 110, y + 33);
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text(`$${Number(totalPagar).toLocaleString('es-CO')} COP`, 190, y + 33, { align: 'right' });

  // Sello de Paz y Salvo Visual
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(14, y, 82, 38, 2, 2, 'F');
  doc.setTextColor(6, 95, 70);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('✓ PAGADO Y A PAZ Y SALVO', 20, y + 14);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Transacción aprobada y asentada en caja.', 20, y + 22);
  doc.text('Mercancía amparada autorizada para retiro.', 20, y + 28);

  y += 50;

  // Firmas
  y = 230;
  doc.setDrawColor(100, 116, 139);
  doc.line(20, y, 90, y);
  doc.line(120, y, 190, y);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`RECIBIDO EN CAJA: ${cajeroNombre}`, 20, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text('LA PEZCADERIA S.A.S. - Operaciones WMS', 20, y + 10);

  doc.setFont('helvetica', 'bold');
  doc.text(`PAGADO POR: ${cliente.razon_social.substring(0, 30)}`, 120, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIT / C.C. ${cliente.numero_identificacion}`, 120, y + 10);

  aplicarPiePagina(doc);
  const nombreArchivoFinal =
    (params as any).nombreArchivo ||
    ((params as any).modalidadTiempo
      ? `Recibo_Alquiler_CF_${consecutivo}.pdf`
      : `Recibo_Caja_${consecutivo}.pdf`);
  doc.save(nombreArchivoFinal);
  return doc;
}

/**
 * Genera el Ticket Térmico de Caja POS (Formato Rollo 80mm)
 */
export function generarPdfTicketTermicoAlquiler(params: TicketTermicoAlquilerPdfParams): jsPDF {
  const {
    consecutivo,
    cliente,
    concepto,
    totalPagar,
    metodoPago,
    fechaPago = new Date().toLocaleString('es-CO'),
    cajeroNombre = 'Caja 01',
  } = params;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 140],
  });

  let y = 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(EMPRESA_NOMBRE, 40, y, { align: 'center' });
  y += 4;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(EMPRESA_NIT, 40, y, { align: 'center' });
  y += 4;
  doc.text('Alquiler de Cuarto Frío & Custodia', 40, y, { align: 'center' });
  y += 5;

  if (typeof (doc as any).setLineDashPattern === 'function') {
    (doc as any).setLineDashPattern([1, 1], 0);
  }
  doc.line(5, y, 75, y);
  y += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`RECIBO: ${consecutivo}`, 5, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Fecha: ${fechaPago}`, 5, y);
  y += 4;
  doc.text(`Cajero: ${cajeroNombre}`, 5, y);
  y += 5;

  doc.line(5, y, 75, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE:', 5, y);
  doc.setFont('helvetica', 'normal');
  doc.text(cliente.razon_social.substring(0, 35), 5, y + 4);
  doc.text(`NIT/CC: ${cliente.numero_identificacion}`, 5, y + 8);
  y += 13;

  doc.line(5, y, 75, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.text('CONCEPTO:', 5, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  const lineasConcepto = doc.splitTextToSize(concepto, 70);
  doc.text(lineasConcepto, 5, y);
  y += lineasConcepto.length * 3.5 + 4;

  doc.line(5, y, 75, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('TOTAL PAGADO:', 5, y);
  doc.text(`$${Number(totalPagar).toLocaleString('es-CO')}`, 75, y, { align: 'right' });
  y += 5;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Método: ${metodoPago}`, 5, y);
  y += 8;

  doc.line(5, y, 75, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('*** PAZ Y SALVO ***', 40, y, { align: 'center' });
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Gracias por su confianza.', 40, y, { align: 'center' });

  const nombreArchivoTicket =
    (params as any).nombreArchivo ||
    (consecutivo.startsWith('TCK')
      ? `Ticket_${consecutivo}.pdf`
      : `Ticket_Termico_${consecutivo}.pdf`);
  doc.save(nombreArchivoTicket);
  return doc;
}

