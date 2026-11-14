import { jsPDF } from 'jspdf';
import type {
  ActaRecepcionMultiplePdfParams,
  ActaDespachoMultiplePdfParams,
} from './coldStoragePdf.types';
import { aplicarEncabezado, aplicarPiePagina } from './coldStoragePdfBase';

/**
 * Genera el Acta Oficial Consolidada de Recepción e Ingreso con Múltiples Partidas de Pesaje
 */
export function generarPdfActaRecepcionMultiple(params: ActaRecepcionMultiplePdfParams): jsPDF {
  const {
    actaConsecutivo,
    cliente,
    cuartoFrioNombre = 'Cuarto Frío Principal',
    transportadorNombre,
    transportadorCedula,
    placaVehiculo,
    temperaturaC,
    observaciones,
    items,
  } = params;

  const doc = new jsPDF();
  aplicarEncabezado(doc, 'ACTA CONSOLIDADA DE RECEPCIÓN E INGRESO EN CUSTODIA (WMS 3PL)', actaConsecutivo);

  let y = 48;
  // Caja encabezado datos
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 182, 34, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS GENERALES DE INGRESO:', 18, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cliente: ${cliente.razon_social} (NIT: ${cliente.numero_identificacion})`, 18, y + 14);
  doc.text(`Fecha y Hora: ${new Date().toLocaleString('es-CO')}`, 18, y + 21);
  doc.text(`Ubicación: ${cuartoFrioNombre} | Setpoint: ${temperaturaC} °C`, 18, y + 28);

  doc.setFont('helvetica', 'bold');
  doc.text('TRANSPORTE Y CONDUCTOR:', 115, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Conductor: ${transportadorNombre}`, 115, y + 14);
  doc.text(`Cédula: ${transportadorCedula}`, 115, y + 21);
  doc.text(`Placa Vehículo: ${placaVehiculo}`, 115, y + 28);

  y += 42;

  // Encabezado tabla partidas
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`PLANILLA DE PESAJE EN BÁSCULA (${items.length} PARTIDAS REGISTRADAS):`, 14, y);
  y += 6;

  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(14, y, 182, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.text('#', 16, y + 5.5);
  doc.text('PRODUCTO', 24, y + 5.5);
  doc.text('EMPAQUE', 72, y + 5.5);
  doc.text('BULTOS', 98, y + 5.5);
  doc.text('TARA U.', 118, y + 5.5);
  doc.text('TARA TOT', 138, y + 5.5);
  doc.text('BRUTO (KG)', 158, y + 5.5);
  doc.text('NETO (KG)', 180, y + 5.5);

  y += 8;

  let totBultos = 0;
  let totBruto = 0;
  let totTara = 0;
  let totNeto = 0;

  items.forEach((item, idx) => {
    totBultos += item.cantidad_bultos;
    totBruto = Math.round((totBruto + item.peso_bruto_kg + Number.EPSILON) * 100) / 100;
    totTara = Math.round((totTara + item.peso_tara_total_kg + Number.EPSILON) * 100) / 100;
    totNeto = Math.round((totNeto + item.peso_neto_kg + Number.EPSILON) * 100) / 100;

    const filaBg = idx % 2 === 0 ? 255 : 248;
    doc.setFillColor(filaBg, filaBg, filaBg);
    doc.rect(14, y, 182, 6.5, 'F');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`${idx + 1}`, 16, y + 4.8);
    doc.text(item.producto_nombre.substring(0, 24), 24, y + 4.8);
    doc.text(item.tipo_empaque, 72, y + 4.8);
    doc.text(item.cantidad_bultos.toString(), 98, y + 4.8);
    doc.text(Number(item.tara_unitaria_kg).toFixed(2), 118, y + 4.8);
    doc.text(Number(item.peso_tara_total_kg).toFixed(2), 138, y + 4.8);
    doc.text(Number(item.peso_bruto_kg).toFixed(2), 158, y + 4.8);
    doc.setFont('helvetica', 'bold');
    doc.text(Number(item.peso_neto_kg).toFixed(2), 180, y + 4.8);

    y += 6.5;
  });

  // Fila de Totales
  doc.setFillColor(224, 242, 254); // sky-100
  doc.rect(14, y, 182, 8, 'F');
  doc.setTextColor(3, 105, 161); // sky-700
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('TOTALES CONSOLIDADOS:', 24, y + 5.5);
  doc.text(totBultos.toString(), 98, y + 5.5);
  doc.text(totTara.toFixed(2), 138, y + 5.5);
  doc.text(totBruto.toFixed(2), 158, y + 5.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${totNeto.toFixed(2)} KG`, 178, y + 5.5);

  y += 14;

  // Observaciones e Inocuidad
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.roundedRect(14, y, 182, 22, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(6, 95, 70);
  doc.text('CERTIFICACIÓN DE INGRESO Y CADENA DE FRÍO:', 18, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`• Temperatura de ingreso verificada en vehículo: ${temperaturaC} °C`, 18, y + 12);
  doc.text(`• Observaciones: ${observaciones || 'Mercancía ingresa en óptimas condiciones de congelación y empaque.'}`, 18, y + 17);

  // Firmas
  y = 230;
  doc.setDrawColor(100, 116, 139);
  doc.line(20, y, 90, y);
  doc.line(120, y, 190, y);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('ENTREGADO POR (CONDUCTOR):', 20, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${transportadorNombre}`, 20, y + 10);
  doc.text(`Cédula: ${transportadorCedula}`, 20, y + 15);

  doc.setFont('helvetica', 'bold');
  doc.text('RECIBIDO A CONFORMIDAD (OPERADOR WMS):', 120, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text('Báscula y Operaciones Frigorífico', 120, y + 10);
  doc.text('LA PEZCADERIA S.A.S.', 120, y + 15);

  aplicarPiePagina(doc);
  doc.save(`Acta_Recepcion_Consolidada_${actaConsecutivo}.pdf`);
  return doc;
}

/**
 * Genera el Acta Oficial Consolidada de Despacho y Salida para Múltiples Lotes
 */
export function generarPdfActaDespachoMultiple(params: ActaDespachoMultiplePdfParams): jsPDF {
  const {
    actaConsecutivo,
    cliente,
    transportadorNombre,
    transportadorCedula,
    placaVehiculo,
    observaciones,
    items,
  } = params;

  const doc = new jsPDF();
  aplicarEncabezado(doc, 'ACTA CONSOLIDADA DE DESPACHO Y SALIDA DE CUSTODIA (WMS 3PL)', actaConsecutivo);

  let y = 48;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 182, 34, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS GENERALES DE DESPACHO:', 18, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cliente: ${cliente.razon_social} (NIT: ${cliente.numero_identificacion})`, 18, y + 14);
  doc.text(`Fecha y Hora de Salida: ${new Date().toLocaleString('es-CO')}`, 18, y + 21);

  doc.setFont('helvetica', 'bold');
  doc.text('TRANSPORTE Y CONDUCTOR RECEPTOR:', 115, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Conductor: ${transportadorNombre}`, 115, y + 14);
  doc.text(`Cédula: ${transportadorCedula}`, 115, y + 21);
  doc.text(`Placa Vehículo: ${placaVehiculo}`, 115, y + 28);

  y += 42;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`DETALLE DE MERCANCÍA ENTREGADA (${items.length} LOTES/PARTIDAS):`, 14, y);
  y += 6;

  doc.setFillColor(15, 23, 42);
  doc.rect(14, y, 182, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('#', 18, y + 5.5);
  doc.text('PRODUCTO', 30, y + 5.5);
  doc.text('EMPAQUE', 95, y + 5.5);
  doc.text('BULTOS RETIRADOS', 125, y + 5.5);
  doc.text('PESO NETO (KG)', 158, y + 5.5);
  doc.text('MODALIDAD', 182, y + 5.5, { align: 'right' });

  y += 8;

  let totBultos = 0;
  let totPeso = 0;

  items.forEach((item, idx) => {
    totBultos += item.bultos_a_retirar;
    totPeso = Math.round((totPeso + item.peso_neto_a_retirar + Number.EPSILON) * 100) / 100;

    const filaBg = idx % 2 === 0 ? 255 : 248;
    doc.setFillColor(filaBg, filaBg, filaBg);
    doc.rect(14, y, 182, 7, 'F');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`${idx + 1}`, 18, y + 5);
    doc.text(item.producto_nombre.substring(0, 30), 30, y + 5);
    doc.text(item.tipo_empaque || 'ESTÁNDAR', 95, y + 5);
    doc.text(item.bultos_a_retirar.toString(), 130, y + 5);
    doc.setFont('helvetica', 'bold');
    doc.text(Number(item.peso_neto_a_retirar).toFixed(2), 165, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(item.es_retiro_total ? 'TOTAL' : 'PARCIAL', 182, y + 5, { align: 'right' });

    y += 7;
  });

  // Fila Totales
  doc.setFillColor(254, 243, 199); // amber-100
  doc.rect(14, y, 182, 8, 'F');
  doc.setTextColor(146, 64, 14); // amber-800
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('TOTAL DESPACHADO:', 30, y + 5.5);
  doc.text(totBultos.toString(), 130, y + 5.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${totPeso.toFixed(2)} KG`, 165, y + 5.5);

  y += 16;

  if (observaciones) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`Observaciones: ${observaciones}`, 14, y);
    y += 10;
  }

  // Cláusula de entrega
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'El receptor declara recibir la mercancía descrita a entera conformidad en cantidad, peso y estado higiénico.',
    14,
    y
  );

  // Firmas
  y = 230;
  doc.setDrawColor(100, 116, 139);
  doc.line(20, y, 90, y);
  doc.line(120, y, 190, y);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('RECIBIDO POR (CONDUCTOR):', 20, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${transportadorNombre}`, 20, y + 10);
  doc.text(`Cédula: ${transportadorCedula}`, 20, y + 15);

  doc.setFont('helvetica', 'bold');
  doc.text('ENTREGADO POR (OPERADOR WMS):', 120, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text('Despacho Bodega Frigorífica', 120, y + 10);
  doc.text('LA PEZCADERIA S.A.S.', 120, y + 15);

  aplicarPiePagina(doc);
  doc.save(`Acta_Despacho_Consolidada_${actaConsecutivo}.pdf`);
  return doc;
}

/**
 * Alias de compatibilidad para Acta Consolidada de Recepción
 */
export function generarActaRecepcionConsolidadaPdf(params: any): jsPDF {
  return generarPdfActaRecepcionMultiple({
    ...params,
    temperaturaC: params.temperaturaC ?? params.temperaturaCamionC ?? -18,
  });
}

/**
 * Alias de compatibilidad para Acta Consolidada de Despacho
 */
export function generarActaDespachoConsolidadaPdf(params: any): jsPDF {
  return generarPdfActaDespachoMultiple(params);
}

