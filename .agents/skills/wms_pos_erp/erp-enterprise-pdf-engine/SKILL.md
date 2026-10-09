---
name: erp-enterprise-pdf-engine
description: Motor de generación de documentos PDF empresariales limpios, facturas comerciales/DIAN, remisiones WMS, nómina, reportes ejecutivos y tickets térmicos (80mm/58mm) con jsPDF en cliente sin costo de servidor.
---

# ERP Enterprise PDF Document Engine Skill

Esta skill define la arquitectura, estándares visuales, normativos y patrones de código para la **generación de documentos PDF empresariales de nivel profesional** en **MaestroPescaderia ERP**.

---

## 1. Principios de Diseño Editorial y Legibilidad Corporativa

Todo documento generado por el ERP debe cumplir con los siguientes estándares de diseño editorial:

1. **Tipografía y Jerarquía Visual**:
   - Títulos principales en `Helvetica Bold` (14-16pt).
   - Subencabezados de sección con fondo contrastante o acento corporativo (10-11pt).
   - Datos tabulares en `Helvetica Regular` (8.5-9.5pt) con interlineado adecuado para evitar saturación visual.
   - Números y montos monetarios siempre alineados a la derecha (`align: 'right'`) con formato `$#.##0,00` y tipografía monoespaciada o alineación estricta.

2. **Paleta de Color para Impresión**:
   - **Tinta Primaria**: Azul Marino Corporativo (`#0F172A` o `#1E3A8A`) para encabezados y líneas divisoras.
   - **Fondos de Tabla**: Alternancia sutil de filas (`#F8FAFC` vs `#FFFFFF`).
   - **Bordes y Rejillas**: Líneas finas en gris claro (`#E2E8F0`, 0.2mm - 0.5mm).
   - **Acentos de Estado**: Verde esmeralda (`#059669`) para Pagado/Aprobado, Ámbar (`#D97706`) para Pendiente, Rojo carmesí (`#DC2626`) para Anulado/Vencido.

3. **Cero Costo de Servidor (Client-Side Vector Rendering)**:
   - Todo el renderizado se ejecuta en el navegador usando `jspdf` y cálculo de posiciones vectoriales puras.
   - Se evita la conversión de HTML a Canvas pesado (que degrada la nitidez del texto e infla el tamaño del archivo a megabytes innecesarios). Los documentos generados vectorialmente pesan menos de 100 KB y mantienen nitidez vectorial al 100% de zoom.

---

## 2. Catálogo de Plantillas Estandarizadas

El motor cuenta con 5 tipos de documentos principales:

### A. Factura Comercial / Facturación Electrónica (Formato Carta / A4)
- **Encabezado**: Logo corporativo, Razón Social, NIT, Dirección, Teléfono, Resolución DIAN/Fiscal, Número Consecutivo y Código QR/CUFE.
- **Bloque Emisor y Cliente**: Dos columnas simétricas con datos fiscales completos, fecha de emisión, fecha de vencimiento y condición de pago (Contado/Crédito 30 días).
- **Tabla de Ítems**: Código SKU, Descripción, Cantidad (kg o und), Valor Unitario, Descuento %, IVA/Impuesto %, Subtotal.
- **Pie de Factura**: Totales discriminados (Subtotal, Descuentos, Base Gravable, IVA, Total a Pagar), Valor en letras, Notas legales y firma.

### B. Remisión de Despacho & Picking WMS (Cuarto Frío)
- **Datos de Origen y Destino**: Cuarto frío / Bahía de despacho, transportador, placa de vehículo, temperatura de salida (°C).
- **Detalle de Lotes FEFO**: Tabla con número de lote (`lot_number`), fecha de faena/captura, fecha de vencimiento, peso bruto, peso tara y peso neto.
- **Control de Firmas**: Recibido a conformidad con espacio para firma, cédula y sello.

### C. Desprendible de Nómina y Liquidación
- **Información del Colaborador**: Nombre, Cédula, Cargo, Centro de Costos, Salario Base y Período Liquidado.
- **Grilla Comparativa en 2 Columnas**: 
  - Columna Izquierda: *Devengados* (Salario básico, Auxilio transporte, Horas extras, Bonificaciones, Recargos nocturnos).
  - Columna Derecha: *Deducciones* (Salud 4%, Pensión 4%, Libranzas, Anticipos, Retenciones).
- **Resumen Financiero**: Total Devengado, Total Deducido, Neto a Pagar en cuenta bancaria y Costo Total para la Empresa.

### D. Comprobante de Arqueo de Caja Ciega (Auditoría de Tesorería)
- **Datos del Turno**: Número de Turno, Cajero, Fecha/Hora Apertura, Fecha/Hora Cierre.
- **Desglose Físico**: Tabla detallada por denominación de billetes ($100k, $50k, $20k, etc.), monedas, vouchers datáfono y transferencias.
- **Conciliación**: Saldo Teórico vs Saldo Real Declarado, Descuadre (Sobrante/Faltante) y firma del supervisor.

### E. Ticket POS Térmico (80mm y 58mm)
- Documento de ancho fijo (`80mm` o `58mm`) y altura dinámica.
- Formato compacto, fuentes condensadas de alto contraste apto para cabezales de impresión térmica ESC/POS.

---

## 3. Arquitectura del Helper de Utilidades PDF

```typescript
// src/services/pdf/pdfEngine.ts
import { jsPDF } from 'jspdf';

export interface PDFHeaderConfig {
  title: string;
  documentNumber: string;
  date: string;
  statusBadge?: { label: string; color: [number, number, number] };
  companyInfo?: {
    name: string;
    nit: string;
    address: string;
    phone: string;
  };
}

export class EnterprisePDFBuilder {
  private doc: jsPDF;
  private currentY: number = 20;

  constructor(orientation: 'p' | 'l' = 'p', format: 'letter' | 'a4' | [number, number] = 'letter') {
    this.doc = new jsPDF({
      orientation,
      unit: 'mm',
      format,
    });
  }

  public addHeader(config: PDFHeaderConfig): this {
    // 1. Franja decorativa o logo
    this.doc.setFillColor(15, 23, 42); // slate-900
    this.doc.rect(14, 10, 3, 22, 'F');

    // 2. Datos de la empresa
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(14);
    this.doc.setTextColor(15, 23, 42);
    this.doc.text(config.companyInfo?.name || 'LA PEZCADERÍA S.A.S.', 20, 16);

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8.5);
    this.doc.setTextColor(100, 116, 139); // slate-500
    this.doc.text(`NIT: ${config.companyInfo?.nit || '901.XXX.XXX-X'} | Tel: ${config.companyInfo?.phone || '+57 (4) 444-XXXX'}`, 20, 22);
    this.doc.text(config.companyInfo?.address || 'Medellín, Colombia', 20, 27);

    // 3. Bloque del documento (Derecha)
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(13);
    this.doc.setTextColor(30, 58, 138); // blue-900
    this.doc.text(config.title.toUpperCase(), 196, 16, { align: 'right' });

    this.doc.setFontSize(10);
    this.doc.setTextColor(15, 23, 42);
    this.doc.text(`No. ${config.documentNumber}`, 196, 22, { align: 'right' });
    this.doc.setFontSize(8);
    this.doc.setTextColor(100, 116, 139);
    this.doc.text(`Fecha: ${config.date}`, 196, 27, { align: 'right' });

    this.currentY = 40;
    return this;
  }

  public addSeparator(): this {
    this.doc.setDrawColor(226, 232, 240); // slate-200
    this.doc.setLineWidth(0.3);
    this.doc.line(14, this.currentY, 196, this.currentY);
    this.currentY += 6;
    return this;
  }

  public save(filename: string) {
    this.doc.save(filename);
  }
}
```

---

## 4. Checklist para Nuevos Documentos

- [ ] ¿El documento maneja paginación automática (`Página X de Y`) si el contenido supera 1 página?
- [ ] ¿Los montos y cantidades numéricas están estrictamente alineados a la derecha con formato de moneda local (`$`)?
- [ ] ¿El archivo exportado es liviano (<150 KB) y con texto vectorial seleccionable?
- [ ] ¿Incluye los textos legales, resoluciones fiscales o cláusulas de garantía según corresponda?
