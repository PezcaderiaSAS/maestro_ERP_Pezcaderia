import type { jsPDF } from 'jspdf';

export const EMPRESA_NOMBRE = 'LA PEZCADERIA S.A.S.';
export const EMPRESA_NIT = 'NIT: 901.234.567-8';
export const EMPRESA_ACTIVIDAD = 'Operador Logístico WMS 3PL & Almacenamiento Frigorífico';

/**
 * Aplica el encabezado corporativo oficial en formato Carta/A4 con barra superior slate-900,
 * textos en blanco, distintivo de consecutivo y título centrado con línea divisoria.
 */
export function aplicarEncabezado(doc: jsPDF, titulo: string, consecutivo?: string): void {
  // Fondo barra superior
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 26, 'F');

  // Textos encabezado
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(EMPRESA_NOMBRE, 14, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`${EMPRESA_NIT} | ${EMPRESA_ACTIVIDAD}`, 14, 18);

  if (consecutivo) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(56, 189, 248); // sky-400
    doc.text(`DOC: ${consecutivo}`, 196, 15, { align: 'right' });
  }

  // Título del documento
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(titulo, 105, 36, { align: 'center' });

  // Línea divisoria
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(14, 40, 196, 40);
}

/**
 * Aplica el pie de página oficial con línea de separación, fecha/hora de expedición y número de página.
 */
export function aplicarPiePagina(doc: jsPDF, paginaActual: number = 1): void {
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 280, 196, 280);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Documento oficial generado por La Pezcaderia ERP WMS 3PL - Fecha de impresión: ${new Date().toLocaleString('es-CO')}`,
    14,
    285
  );
  doc.text(`Página ${paginaActual}`, 196, 285, { align: 'right' });
}

/**
 * Formatea un número como moneda en pesos colombianos ($ COP)
 */
export function formatCOP(val: number): string {
  return `$${Number(val || 0).toLocaleString('es-CO')}`;
}

/**
 * Formatea un número en formato estándar colombiano con separadores de miles
 */
export function formatNum(val: number, maxDecimals: number = 2): string {
  return Number(val || 0).toLocaleString('es-CO', { maximumFractionDigits: maxDecimals });
}

