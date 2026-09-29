import { jsPDF } from 'jspdf';
import type { ContratoAlquilerCf, ClienteCustodia, ProductoCustodia, CuartoFrio } from '../../packages/validation-schemas/src/coldStorageRental.schema';
import type { InventarioCustodiaItem, MovimientoCustodiaItem } from './coldStorageRentalService';

const EMPRESA_NOMBRE = 'LA PEZCADERIA S.A.S.';
const EMPRESA_NIT = 'NIT: 901.234.567-8';
const EMPRESA_ACTIVIDAD = 'Operador Logístico WMS 3PL & Almacenamiento Frigorífico';

function aplicarEncabezado(doc: jsPDF, titulo: string, consecutivo?: string) {
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

function aplicarPiePagina(doc: jsPDF, paginaActual: number = 1) {
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

export const coldStoragePdfService = {
  /**
   * 1. Contrato de Alquiler de Espacio Frigorífico
   */
  generarPdfContratoAlquiler(
    contrato: ContratoAlquilerCf,
    cliente: ClienteCustodia,
    cuartoFrio?: CuartoFrio
  ) {
    const doc = new jsPDF();
    aplicarEncabezado(doc, 'CONTRATO DE ALQUILER DE ESPACIO FRIGORÍFICO (WMS 3PL)', contrato.consecutivo);

    let y = 48;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);

    // Caja Cliente y Cuarto Frío
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y, 182, 38, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL CLIENTE (DEPOSITANTE):', 18, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.text(`Razón Social: ${cliente.razon_social}`, 18, y + 14);
    doc.text(`Identificación: ${cliente.tipo_identificacion} ${cliente.numero_identificacion}`, 18, y + 21);
    doc.text(`Contacto / Tel: ${cliente.responsable_contacto || 'N/A'} - ${cliente.telefono || 'N/A'}`, 18, y + 28);

    doc.setFont('helvetica', 'bold');
    doc.text('UBICACIÓN ASIGNADA:', 115, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cuarto Frío: ${cuartoFrio?.nombre || 'General'} (${cuartoFrio?.codigo || 'CF-01'})`, 115, y + 14);
    doc.text(`Setpoint Temp: ${cuartoFrio?.temperatura_setpoint ?? -18.0} °C`, 115, y + 21);
    doc.text(`Modalidad Fact: ${contrato.modalidad_facturacion}`, 115, y + 28);

    y += 46;

    // Caja Términos Comerciales y Capacidad
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, y, 182, 42, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('TÉRMINOS DE CAPACIDAD Y TARIFA:', 18, y + 8);
    doc.setFont('helvetica', 'normal');

    const capacidadKg = contrato.posiciones_contratadas * 800;
    doc.text(`• Posiciones Contratadas: ${contrato.posiciones_contratadas} pos. (800 kg c/u nominal)`, 18, y + 16);
    doc.text(`• Capacidad Total Asegurada: ${capacidadKg.toLocaleString('es-CO')} Kilogramos Netos`, 18, y + 23);
    doc.text(
      `• Tarifa Pactada: $${Number(contrato.tarifa_unitaria).toLocaleString('es-CO')} COP por posición / ${contrato.modalidad_tiempo}`,
      18,
      y + 30
    );
    doc.text(
      `• Recargo Sobrecupo: $${Number(contrato.tarifa_recargo_sobrepeso_kg).toLocaleString('es-CO')} COP por Kg adicional`,
      18,
      y + 37
    );

    doc.text(`Vigencia Desde: ${contrato.fecha_inicio}`, 115, y + 16);
    doc.text(`Vigencia Hasta: ${contrato.fecha_fin}`, 115, y + 23);
    doc.text(`Estado: ${contrato.estado}`, 115, y + 30);
    doc.text(`Cuentas de Orden: ${contrato.requiere_cuentas_orden ? 'SÍ (8105/8405)' : 'NO'}`, 115, y + 37);

    y += 50;

    // Cláusulas Principales
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('CLÁUSULAS DEL SERVICIO DE ALMACENAMIENTO EN CUSTODIA:', 14, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const clausulas = [
      '1. OBJETO: LA PEZCADERIA S.A.S. se compromete a prestar el servicio de almacenamiento y custodia de mercancía congelada en las posiciones pactadas, garantizando una temperatura de setpoint controlada (-18°C a -22°C).',
      '2. INDEPENDENCIA CONTABLE Y PROPIEDAD: La mercancía almacenada bajo este contrato es de exclusiva propiedad del DEPOSITANTE. En ningún caso ingresará al inventario comercial de LA PEZCADERIA S.A.S. (Cuenta 1435) ni formará parte de su costo de ventas.',
      '3. CONTROL DE BÁSCULA: Todo ingreso y retiro será verificado mediante báscula calibrada registrando peso bruto, tara y neto, emitiéndose las respectivas Actas de Recepción y Despacho.',
      '4. MERMAS NATURALES: Las partes reconocen que los productos cárnicos y pesqueros pueden presentar deshidratación por congelación (merma por frío) de entre 0.5% y 2.0%, calculada objetivamente al momento de la salida.',
      '5. SOBRECUPO: Cualquier mercancía que exceda los 800 kg por posición contratada generará el cobro automático por kilogramo adicional estipulado en este contrato.',
    ];

    clausulas.forEach((c) => {
      const splitLines = doc.splitTextToSize(c, 182);
      doc.text(splitLines, 14, y);
      y += splitLines.length * 4 + 2;
    });

    // Firmas
    y = 230;
    doc.setDrawColor(100, 116, 139);
    doc.line(20, y, 90, y);
    doc.line(120, y, 190, y);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('POR: LA PEZCADERIA S.A.S.', 20, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text('Prestador del Servicio WMS 3PL', 20, y + 10);

    doc.setFont('helvetica', 'bold');
    doc.text(`POR: ${cliente.razon_social.substring(0, 30)}`, 120, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Representante Legal / Autorizado - NIT ${cliente.numero_identificacion}`, 120, y + 10);

    aplicarPiePagina(doc);
    doc.save(`Contrato_Alquiler_${contrato.consecutivo}.pdf`);
    return doc;
  },

  /**
   * 2. Acta de Recepción e Ingreso en Custodia
   */
  generarPdfActaRecepcion(params: {
    movimiento: MovimientoCustodiaItem;
    inventario: InventarioCustodiaItem;
    cliente: ClienteCustodia;
    producto: ProductoCustodia;
    cuartoFrioNombre?: string;
  }) {
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
  },

  /**
   * 3. Acta de Despacho y Salida de Custodia
   */
  generarPdfActaDespacho(params: {
    movimiento: MovimientoCustodiaItem;
    inventario: InventarioCustodiaItem;
    cliente: ClienteCustodia;
    producto: ProductoCustodia;
    remanenteBultos: number;
    remanentePesoKg: number;
  }) {
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
  },

  /**
   * 4. Certificado Oficial de Existencias en Custodia
   */
  generarPdfCertificadoCustodia(params: {
    cliente: ClienteCustodia;
    inventarioItems: InventarioCustodiaItem[];
    fechaCorte: string;
  }) {
    const { cliente, inventarioItems, fechaCorte } = params;
    const doc = new jsPDF();
    aplicarEncabezado(
      doc,
      'CERTIFICADO OFICIAL DE EXISTENCIAS EN CUSTODIA (WMS 3PL)',
      `CERT-${fechaCorte.replace(/-/g, '')}`
    );

    let y = 48;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y, 182, 28, 2, 2, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('TITULAR DEL INVENTARIO CERTIFICADO:', 18, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.text(`Razón Social: ${cliente.razon_social}`, 18, y + 14);
    doc.text(`NIT / Identificación: ${cliente.tipo_identificacion} ${cliente.numero_identificacion}`, 18, y + 21);

    doc.setFont('helvetica', 'bold');
    doc.text('FECHA DE CORTE:', 130, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.text(`${fechaCorte} (23:59 hrs)`, 130, y + 14);
    doc.text(`Lotes en Custodia: ${inventarioItems.length}`, 130, y + 21);

    y += 36;

    // Tabla de Existencias
    doc.setFillColor(15, 23, 42);
    doc.rect(14, y, 182, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('LOTE', 18, y + 5.5);
    doc.text('PRODUCTO', 50, y + 5.5);
    doc.text('FECHA INGRESO', 105, y + 5.5);
    doc.text('BULTOS', 140, y + 5.5);
    doc.text('PESO NETO (KG)', 165, y + 5.5);

    y += 8;
    doc.setFont('helvetica', 'normal');
    let totalBultos = 0;
    let totalKilos = 0;

    inventarioItems.forEach((item, index) => {
      totalBultos += item.bultos_actuales;
      totalKilos += Number(item.peso_neto_actual_kg);

      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y, 182, 7, 'F');
      }

      doc.setTextColor(15, 23, 42);
      doc.text(item.lote_cliente, 18, y + 5);
      doc.text((item.producto?.nombre || 'Producto').substring(0, 28), 50, y + 5);
      doc.text(item.fecha_ingreso ? item.fecha_ingreso.substring(0, 10) : 'N/A', 105, y + 5);
      doc.text(item.bultos_actuales.toString(), 140, y + 5);
      doc.text(Number(item.peso_neto_actual_kg).toFixed(2), 165, y + 5);

      y += 7;
    });

    // Fila Totalizadora
    doc.setFillColor(226, 232, 240);
    doc.rect(14, y, 182, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('TOTAL EXISTENCIAS EN CUSTODIA:', 50, y + 5.5);
    doc.text(totalBultos.toString(), 140, y + 5.5);
    doc.text(`${totalKilos.toFixed(2)} KG`, 165, y + 5.5);

    y += 20;

    // Declaración de Aislamiento
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(71, 85, 105);
    const notaLegal =
      'Se certifica que los productos detallados se encuentran bajo régimen de depósito y custodia en los cuartos fríos de LA PEZCADERIA S.A.S. a temperaturas controladas de congelación (-18°C a -22°C), sin que constituyan inventario comercial propio del prestador ni afecten sus cuentas de balance de mercancías.';
    const splitLegal = doc.splitTextToSize(notaLegal, 182);
    doc.text(splitLegal, 14, y);

    // Firma Oficial
    y = 230;
    doc.setDrawColor(100, 116, 139);
    doc.line(65, y, 145, y);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('DIRECCIÓN DE OPERACIONES Y LOGÍSTICA WMS', 105, y + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text('LA PEZCADERIA S.A.S. - NIT 901.234.567-8', 105, y + 10, { align: 'center' });

    aplicarPiePagina(doc);
    doc.save(`Certificado_Custodia_${cliente.numero_identificacion}_${fechaCorte}.pdf`);
    return doc;
  },
};
