import { jsPDF } from 'jspdf';
import type { ActaRecepcionPdfParams, ActaDespachoPdfParams } from './coldStoragePdf.types';
import { aplicarEncabezado, aplicarPiePagina } from './coldStoragePdfBase';

/**
 * Genera el Acta Oficial de Recepción e Ingreso en Custodia (1 a 1)
 */
export function generarPdfActaRecepcion(params: ActaRecepcionPdfParams): jsPDF {
  const { movimiento, inventario, cliente, producto, cuartoFrioNombre = 'Cuarto Frío Principal' } = params;
  const doc = new jsPDF();
  aplicarEncabezado(doc, 'ACTA DE RECEPCIÓN E INGRESO EN CUSTODIA (WMS 3PL)', movimiento.consecutivo_acta);

  let y = 48;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 182, 34, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS GENERALES DE INGRESO:', 18, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cliente: ${cliente.razon_social} (NIT: ${cliente.numero_identificacion})`, 18, y + 14);
  doc.text(`Fecha y Hora: ${new Date(movimiento.fecha_movimiento).toLocaleString('es-CO')}`, 18, y + 21);
  doc.text(`Ubicación de Custodia: ${cuartoFrioNombre}`, 18, y + 28);

  doc.setFont('helvetica', 'bold');
  doc.text('TRANSPORTE Y CONDUCTOR:', 115, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Conductor: ${movimiento.transportador_nombre}`, 115, y + 14);
  doc.text(`Cédula: ${movimiento.transportador_cedula}`, 115, y + 21);
  doc.text(`Placa Vehículo: ${movimiento.placa_vehiculo}`, 115, y + 28);

  y += 42;

  // Tabla de Detalle del Pesaje
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DETALLE DE PESAJE EN BÁSCULA CALIBRADA:', 14, y);
  y += 6;

  doc.setFillColor(15, 23, 42);
  doc.rect(14, y, 182, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('PRODUCTO', 18, y + 5.5);
  doc.text('LOTE CLIENTE', 75, y + 5.5);
  doc.text('BULTOS', 110, y + 5.5);
  doc.text('BRUTO (KG)', 132, y + 5.5);
  doc.text('TARA (KG)', 155, y + 5.5);
  doc.text('NETO (KG)', 176, y + 5.5);

  y += 8;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 10, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(producto.nombre.substring(0, 28), 18, y + 6.5);
  doc.text(inventario.lote_cliente, 75, y + 6.5);
  doc.text(movimiento.bultos.toString(), 110, y + 6.5);
  doc.text(Number(movimiento.peso_bruto_kg).toFixed(2), 132, y + 6.5);
  doc.text(Number(movimiento.peso_tara_kg).toFixed(2), 155, y + 6.5);
  doc.setFont('helvetica', 'bold');
  doc.text(Number(movimiento.peso_neto_kg).toFixed(2), 176, y + 6.5);

  y += 18;

  // Condiciones de Inocuidad
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.roundedRect(14, y, 182, 26, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(6, 95, 70); // emerald-800
  doc.text('CONDICIONES DE CALIDAD E INOCUIDAD AL INGRESO:', 18, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`• Temperatura Medida en Termometría de Vehículo: ${movimiento.temperatura_medida ?? 'N/A'} °C`, 18, y + 14);
  doc.text(`• Modalidad de Empaque: ${producto.tipo_empaque} (${producto.modalidad_medicion})`, 18, y + 20);
  if (inventario.fecha_vencimiento) {
    doc.text(`• Fecha de Vencimiento de Lote: ${inventario.fecha_vencimiento}`, 115, y + 14);
  }
  if (movimiento.observaciones) {
    doc.text(`• Observaciones: ${movimiento.observaciones}`, 115, y + 20);
  }

  // Firmas
  y = 220;
  doc.setDrawColor(100, 116, 139);
  doc.line(20, y, 90, y);
  doc.line(120, y, 190, y);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('ENTREGADO POR (CONDUCTOR / CLIENTE):', 20, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${movimiento.transportador_nombre}`, 20, y + 10);
  doc.text(`Cédula: ${movimiento.transportador_cedula}`, 20, y + 15);

  doc.setFont('helvetica', 'bold');
  doc.text('RECIBIDO A CONFORMIDAD (OPERADOR WMS):', 120, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text('Firma y Sello de Recepción Bodega Fría', 120, y + 10);
  doc.text('LA PEZCADERIA S.A.S.', 120, y + 15);

  aplicarPiePagina(doc);
  doc.save(`Acta_Recepcion_${movimiento.consecutivo_acta}.pdf`);
  return doc;
}

/**
 * Genera el Acta Oficial de Despacho y Salida de Custodia (1 a 1)
 */
export function generarPdfActaDespacho(params: ActaDespachoPdfParams): jsPDF {
  const { movimiento, inventario, cliente, producto, remanenteBultos, remanentePesoKg } = params;
  const doc = new jsPDF();
  aplicarEncabezado(doc, 'ACTA DE DESPACHO Y SALIDA DE CUSTODIA (WMS 3PL)', movimiento.consecutivo_acta);

  let y = 48;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 182, 34, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL DESPACHO:', 18, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cliente: ${cliente.razon_social}`, 18, y + 14);
  doc.text(`Identificación: ${cliente.numero_identificacion}`, 18, y + 21);
  doc.text(`Fecha/Hora: ${new Date(movimiento.fecha_movimiento).toLocaleString('es-CO')}`, 18, y + 28);

  doc.setFont('helvetica', 'bold');
  doc.text('DESTINO Y RETIRO:', 115, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Conductor: ${movimiento.transportador_nombre}`, 115, y + 14);
  doc.text(`Cédula: ${movimiento.transportador_cedula}`, 115, y + 21);
  doc.text(`Placa Vehículo: ${movimiento.placa_vehiculo}`, 115, y + 28);

  y += 42;

  // Tabla de Detalle del Despacho
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DETALLE DE PESOS RETIRADOS:', 14, y);
  y += 6;

  doc.setFillColor(15, 23, 42);
  doc.rect(14, y, 182, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('PRODUCTO', 18, y + 5.5);
  doc.text('LOTE', 75, y + 5.5);
  doc.text('BULTOS', 105, y + 5.5);
  doc.text('BRUTO (KG)', 125, y + 5.5);
  doc.text('TARA (KG)', 148, y + 5.5);
  doc.text('NETO RETIRO', 170, y + 5.5);

  y += 8;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 10, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(producto.nombre.substring(0, 26), 18, y + 6.5);
  doc.text(inventario.lote_cliente, 75, y + 6.5);
  doc.text(movimiento.bultos.toString(), 105, y + 6.5);
  doc.text(Number(movimiento.peso_bruto_kg).toFixed(2), 125, y + 6.5);
  doc.text(Number(movimiento.peso_tara_kg).toFixed(2), 148, y + 6.5);
  doc.setFont('helvetica', 'bold');
  doc.text(Number(movimiento.peso_neto_kg).toFixed(2), 170, y + 6.5);

  y += 18;

  // Control de Merma y Saldo Remanente
  doc.setFillColor(254, 242, 242); // red-50
  doc.roundedRect(14, y, 182, 34, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(153, 27, 27); // red-800
  doc.text('BALANCE DE INVENTARIO Y CONTROL DE MERMA:', 18, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  doc.text(`• Merma por Frío Registrada: ${Number(movimiento.merma_kg).toFixed(2)} Kg`, 18, y + 15);
  doc.text(`• Saldo Remanente en Bultos: ${remanenteBultos} bultos`, 18, y + 22);
  doc.text(`• Saldo Remanente en Kilos: ${Number(remanentePesoKg).toFixed(2)} Kg`, 18, y + 29);

  doc.text(`Estado del Lote: ${remanenteBultos === 0 && remanentePesoKg === 0 ? 'AGOTADO' : 'CON SALDO'}`, 115, y + 15);
  if (movimiento.observaciones) {
    doc.text(`Observaciones: ${movimiento.observaciones}`, 115, y + 22);
  }

  // Firmas
  y = 220;
  doc.setDrawColor(100, 116, 139);
  doc.line(20, y, 90, y);
  doc.line(120, y, 190, y);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('AUTORIZADO POR (DESPACHO WMS):', 20, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text('LA PEZCADERIA S.A.S. - Bodega Fría', 20, y + 10);

  doc.setFont('helvetica', 'bold');
  doc.text('RECIBIDO A SATISFACCIÓN (CONDUCTOR):', 120, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${movimiento.transportador_nombre}`, 120, y + 10);
  doc.text(`Cédula: ${movimiento.transportador_cedula}`, 120, y + 15);

  aplicarPiePagina(doc);
  doc.save(`Acta_Despacho_${movimiento.consecutivo_acta}.pdf`);
  return doc;
}

