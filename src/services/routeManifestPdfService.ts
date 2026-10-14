import { jsPDF } from 'jspdf';
import { DeliveryRouteRecord } from './deliveryRouteService';

export const routeManifestPdfService = {
  /**
   * Genera la Hoja de Ruta / Planilla de Carga oficial en formato PDF
   */
  generarManifiestoPDF(manifiesto: DeliveryRouteRecord): jsPDF {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter',
    });

    const primaryColor = [15, 23, 42]; // Slate 900
    const accentIndigo = [99, 102, 241]; // Indigo 500
    const emeraldColor = [16, 185, 129]; // Emerald 500

    // Header Background
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 216, 32, 'F');

    // Title & Company
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('LA PEZCADERIA S.A.S.', 15, 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225);
    doc.text('NIT: 901.452.883-1 | Cadena de Frío & Logística B2B Especializada', 15, 19);
    doc.text('Centro de Distribución & Cuartos Fríos | PBX: (+57) 300 912 3456', 15, 24);

    // Badge Manifiesto
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(135, 7, 66, 18, 2, 2, 'F');
    doc.setTextColor(accentIndigo[0], accentIndigo[1], accentIndigo[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('MANIFIESTO DE RUTA B2B', 138, 13);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10.5);
    doc.text(manifiesto.numeroManifiesto, 138, 20);

    // Sección 1: Datos de Vehículo y Conductor
    let y = 38;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, y, 186, 26, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(15, y, 186, 26, 2, 2, 'D');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('DATOS DE LA RUTA Y VEHÍCULO', 20, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);

    doc.text(`Conductor: ${manifiesto.conductorNombre}`, 20, y + 12);
    doc.text(`Teléfono: ${manifiesto.conductorTelefono || 'No registrado'}`, 20, y + 17);
    doc.text(`Zona Asignada: ${manifiesto.zonaRuta}`, 20, y + 22);

    doc.text(`Placa Vehículo: ${manifiesto.vehiculoPlaca}`, 115, y + 12);
    doc.text(`Tipo de Furgón: ${manifiesto.vehiculoTipo || 'Refrigerado'}`, 115, y + 17);
    const tempText = manifiesto.temperaturaSalidaCelsius !== undefined
      ? `${manifiesto.temperaturaSalidaCelsius}°C`
      : 'Controlado (0-4°C)';
    doc.text(`Temp. Salida Cava: ${tempText}`, 115, y + 22);

    // Sección 2: KPIs de Carga Consolidada
    y = 69;
    const boxW = 44;
    const boxH = 14;

    // Pedidos
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(15, y, boxW, boxH, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('TOTAL PEDIDOS', 18, y + 5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`${manifiesto.totalPedidos}`, 18, y + 11);

    // Kilos
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(62, y, boxW, boxH, 2, 2, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('PESO TOTAL CARGA', 65, y + 5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`${manifiesto.totalPesoKg.toFixed(1)} Kg`, 65, y + 11);

    // Facturado Esperado
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(109, y, boxW, boxH, 2, 2, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('FACTURADO ESPERADO', 112, y + 5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
    doc.text(`$${Math.round(manifiesto.totalFacturadoEsperado).toLocaleString('es-CO')}`, 112, y + 11);

    // Estado
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(156, y, boxW + 1, boxH, 2, 2, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('ESTADO RUTA', 159, y + 5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(accentIndigo[0], accentIndigo[1], accentIndigo[2]);
    doc.text(manifiesto.estado, 159, y + 11);

    // Sección 3: Tabla de Paradas de Entrega
    y = 89;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('SECUENCIA DE PARADAS Y ENTREGAS', 15, y);

    y += 4;
    // Table Header
    doc.setFillColor(15, 23, 42);
    doc.rect(15, y, 186, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('#', 17, y + 4.5);
    doc.text('PEDIDO', 25, y + 4.5);
    doc.text('CLIENTE & DESTINO', 45, y + 4.5);
    doc.text('FORMA PAGO', 105, y + 4.5);
    doc.text('COBRO COP', 130, y + 4.5);
    doc.text('FIRMA / RECIBIDO', 160, y + 4.5);

    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);

    manifiesto.pedidos.forEach((p, idx) => {
      // Row background
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, y, 186, 9, 'F');
      }

      doc.setDrawColor(226, 232, 240);
      doc.line(15, y + 9, 201, y + 9);

      doc.setTextColor(15, 23, 42);
      doc.text(`${idx + 1}`, 17, y + 6);
      doc.setFont('helvetica', 'bold');
      doc.text(p.numeroPedido, 25, y + 6);

      doc.setFont('helvetica', 'normal');
      const clienteDesc = `${p.clienteNombre.slice(0, 32)} - ${(p.clienteDireccion || '').slice(0, 25)}`;
      doc.text(clienteDesc, 45, y + 6);

      const formaPago = p.formaPago || 'EFECTIVO';
      doc.text(formaPago, 105, y + 6);

      doc.setFont('helvetica', 'bold');
      const cobro = `$${Math.round(p.montoPedidoOriginal || p.montoCobradoFinal || 0).toLocaleString('es-CO')}`;
      doc.text(cobro, 130, y + 6);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(p.estadoEntrega === 'ENTREGADO_TOTAL' ? '✔ ENTREGADO' : '__________________', 160, y + 6);

      y += 9;

      // Si se excede la página, agregar salto
      if (y > 235) {
        doc.addPage();
        y = 20;
      }
    });

    // Sección 4: Arqueo Físico de Retorno y Firmas
    y = Math.max(y + 8, 220);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, y, 186, 32, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(15, y, 186, 32, 2, 2, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('CIERRE Y LIQUIDACIÓN EN BODEGA / TESORERÍA', 20, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Hora Retorno: [               ]   Odómetro Final: [               ] Km   Gastos Ruta: $ [               ]', 20, y + 12);
    doc.text('Efectivo Recibido en Caja: $ [                                ]   Novedades / Averías: [                 ]', 20, y + 17);

    // Firmas
    doc.line(25, y + 27, 85, y + 27);
    doc.text('Firma Repartidor / Conductor', 30, y + 30);

    doc.line(125, y + 27, 185, y + 27);
    doc.text('Firma Recibido Tesorería / Bodega', 130, y + 30);

    // Footer
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generado el ${new Date().toLocaleString('es-CO')} | Documento de Control Operativo Interno - La Pezcadería ERP`, 15, 270);

    return doc;
  },

  /**
   * Genera y descarga directamente el archivo PDF
   */
  descargarManifiestoPDF(manifiesto: DeliveryRouteRecord): void {
    const doc = this.generarManifiestoPDF(manifiesto);
    doc.save(`Manifiesto_Ruta_${manifiesto.numeroManifiesto}.pdf`);
  },
};
