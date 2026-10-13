import { jsPDF } from 'jspdf';
import type {
  ContratoAlquilerCf,
  ClienteCustodia,
  ProductoCustodia,
  CuartoFrio,
  PartidaRecepcion,
  ItemDespacho,
} from '../../packages/validation-schemas/src/coldStorageRental.schema';
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

  /**
   * 5. Recibo Oficial de Caja y Paz y Salvo de Servicio Frigorífico (Formato Carta Ejecutivo)
   */
  generarPdfReciboPagoAlquiler(params: {
    consecutivo: string;
    cliente: ClienteCustodia;
    contrato?: ContratoAlquilerCf;
    concepto: string;
    periodo?: string;
    modalidadTiempo?: 'DIAS' | 'MESES';
    diasLiquidacion?: number;
    kilosLiquidacion?: number;
    subtotal: number;
    iva: number;
    retefuente?: number;
    totalPagar: number;
    metodoPago: string;
    referenciaCaja?: string;
    cajeroNombre?: string;
    fechaPago?: string;
  }) {
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
    doc.save(`Recibo_Caja_${consecutivo}.pdf`);
    return doc;
  },

  /**
   * 6. Ticket Térmico de Caja POS (Formato Rollo 80mm)
   */
  generarPdfTicketTermicoAlquiler(params: {
    consecutivo: string;
    cliente: ClienteCustodia;
    concepto: string;
    totalPagar: number;
    metodoPago: string;
    fechaPago?: string;
    cajeroNombre?: string;
  }) {
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

    doc.save(`Ticket_${consecutivo}.pdf`);
    return doc;
  },

  /**
   * Genera el Acta Oficial Consolidada de Recepción e Ingreso con Múltiples Partidas de Pesaje
   */
  generarPdfActaRecepcionMultiple(params: {
    actaConsecutivo: string;
    cliente: ClienteCustodia;
    contrato?: ContratoAlquilerCf;
    cuartoFrioNombre?: string;
    transportadorNombre: string;
    transportadorCedula: string;
    placaVehiculo: string;
    temperaturaC: number;
    observaciones?: string | null;
    items: PartidaRecepcion[];
  }) {
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
  },

  /**
   * Genera el Acta Oficial Consolidada de Despacho y Salida para Múltiples Lotes
   */
  generarPdfActaDespachoMultiple(params: {
    actaConsecutivo: string;
    cliente: ClienteCustodia;
    transportadorNombre: string;
    transportadorCedula: string;
    placaVehiculo: string;
    observaciones?: string | null;
    items: ItemDespacho[];
  }) {
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
  },
};

