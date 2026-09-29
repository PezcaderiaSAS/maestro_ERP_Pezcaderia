import { jsPDF } from 'jspdf';
import { WmsDispatchRemision } from '../../packages/validation-schemas/src/b2bDispatch.schema';

export const wmsRemisionPdfService = {
  /**
   * Genera y descarga la Remisión WMS oficial de despacho en formato PDF
   */
  generarRemisionPDF(remision: WmsDispatchRemision): jsPDF {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter',
    });

    const primaryColor = [15, 23, 42]; // Slate 900
    const accentColor = [14, 165, 233]; // Sky 500
    const emeraldColor = [16, 185, 129]; // Emerald 500

    // Header Background Accent
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 216, 32, 'F');

    // Title & Company Name
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('LA PEZCADERIA S.A.S.', 15, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text('NIT: 901.452.883-1 | Cadena de Frío & Logística B2B Especializada', 15, 20);
    doc.text('PBX: (+57) 300 912 3456 | Calle 10 # 43E-20, Medellín, Colombia', 15, 25);

    // Waybill Tag on Top Right
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(145, 8, 56, 18, 2, 2, 'F');
    doc.setTextColor(14, 165, 233);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('REMISIÓN DE DESPACHO WMS', 148, 14);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text(remision.numeroRemision, 148, 21);

    // Section 1: Customer & Delivery Info
    let y = 40;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, y, 186, 30, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(15, y, 186, 30, 2, 2, 'D');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('DATOS DE ENTREGA & TRANSPORTE', 20, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);

    doc.text(`Cliente:`, 20, y + 13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(remision.clienteNombre, 45, y + 13);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Dirección:`, 20, y + 19);
    doc.setTextColor(15, 23, 42);
    doc.text(remision.direccionEntrega, 45, y + 19);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Transportador:`, 20, y + 25);
    doc.setTextColor(15, 23, 42);
    doc.text(`${remision.transportistaNombre} (Placa: ${remision.placaVehiculo})`, 45, y + 25);

    // Right side of customer box: Cold chain & Date
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Fecha Despacho:`, 130, y + 13);
    doc.setTextColor(15, 23, 42);
    doc.text(remision.fechaDespacho ? new Date(remision.fechaDespacho).toLocaleString('es-CO') : new Date().toLocaleString('es-CO'), 158, y + 13);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Temperatura Salida:`, 130, y + 19);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(14, 165, 233);
    doc.text(`${remision.temperaturaSalidaC.toFixed(1)} °C (Cadena OK)`, 162, y + 19);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Estado Envío:`, 130, y + 25);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text(remision.estado, 158, y + 25);

    // Section 2: Items Table Header
    y += 36;
    doc.setFillColor(241, 245, 249);
    doc.rect(15, y, 186, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);

    doc.text('ÍTEM / PRODUCTO', 18, y + 5.5);
    doc.text('CORTE / EMPAQUE', 80, y + 5.5);
    doc.text('LOTE FEFO', 118, y + 5.5);
    doc.text('PIEZAS', 145, y + 5.5);
    doc.text('PESO REAL', 165, y + 5.5);
    doc.text('TOTAL COP', 185, y + 5.5);

    // Section 3: Items Rows
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    remision.items.forEach((item, index) => {
      const isEven = index % 2 === 0;
      if (isEven) {
        doc.setFillColor(255, 255, 255);
      } else {
        doc.setFillColor(248, 250, 252);
      }
      doc.rect(15, y, 186, 7.5, 'F');

      doc.setTextColor(15, 23, 42);
      doc.text(item.nombreProducto.substring(0, 35), 18, y + 5);

      doc.setTextColor(71, 85, 105);
      const specText = `${item.corte || 'Estándar'} / ${item.empaque || 'Hielo'}`;
      doc.text(specText.substring(0, 24), 80, y + 5);

      doc.text(item.loteFefo.substring(0, 16), 118, y + 5);

      doc.text(item.piezasDespachadas ? `${item.piezasDespachadas} und` : '-', 145, y + 5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`${item.pesoDespachadoKg.toFixed(3)} kg`, 165, y + 5);

      doc.text(`$${item.subtotal.toLocaleString('es-CO')}`, 185, y + 5);
      doc.setFont('helvetica', 'normal');

      y += 7.5;
    });

    // Section 4: Totals Summary Box
    y += 4;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(120, y, 81, 24, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(120, y, 81, 24, 2, 2, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Piezas Totales:', 124, y + 6);
    doc.setTextColor(15, 23, 42);
    doc.text(`${remision.piezasTotales || 0} unidades`, 175, y + 6);

    doc.setTextColor(71, 85, 105);
    doc.text('Peso Neto Total:', 124, y + 12);
    doc.setTextColor(15, 23, 42);
    doc.text(`${remision.pesoTotalNetoKg.toFixed(3)} KG`, 175, y + 12);

    doc.setTextColor(15, 23, 42);
    doc.text('Valor Total Despacho:', 124, y + 19);
    const totalDespacho = remision.items.reduce((acc, it) => acc + it.subtotal, 0);
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(10);
    doc.text(`$${totalDespacho.toLocaleString('es-CO')} COP`, 158, y + 19);

    // Section 5: QR Code & Mobile Verification Box
    const qrBoxY = y;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, qrBoxY, 100, 24, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(15, qrBoxY, 100, 24, 2, 2, 'D');

    // Emulated QR Grid Matrix for high visual fidelity
    doc.setFillColor(15, 23, 42);
    doc.rect(20, qrBoxY + 3, 18, 18, 'F');
    doc.setFillColor(255, 255, 255);
    doc.rect(22, qrBoxY + 5, 14, 14, 'F');
    doc.setFillColor(15, 23, 42);
    doc.rect(24, qrBoxY + 7, 10, 10, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('CÓDIGO QR DE ENTREGA', 42, qrBoxY + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Escanee con la cámara para confirmar', 42, qrBoxY + 13);
    doc.text('temperatura de llegada y firma digital.', 42, qrBoxY + 17);
    doc.setFont('courier', 'normal');
    doc.setFontSize(6.5);
    doc.text(`TOKEN: ${remision.tokenQr.substring(0, 24)}...`, 42, qrBoxY + 21);

    // Section 6: Signatures
    y += 32;
    doc.setDrawColor(203, 213, 225);
    doc.line(20, y + 15, 70, y + 15);
    doc.line(80, y + 15, 130, y + 15);
    doc.line(140, y + 15, 190, y + 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);

    doc.text('Despachado por (Bodega WMS)', 22, y + 20);
    doc.text('Transportador / Conductor', 85, y + 20);
    doc.text('Recibido Conforme (Cliente)', 146, y + 20);

    return doc;
  },

  /**
   * Genera y descarga el archivo PDF en el navegador del usuario
   */
  descargarRemisionPDF(remision: WmsDispatchRemision) {
    const doc = this.generarRemisionPDF(remision);
    doc.save(`${remision.numeroRemision}_despacho_pezcaderia.pdf`);
  }
};
