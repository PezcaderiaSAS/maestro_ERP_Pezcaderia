// src/services/siigoExportService.ts

export interface FacturaExportable {
  consecutivoFiscal: string;
  consecutivoInterno: string;
  fecha: string;
  clienteIdentificacion: string;
  clienteNombre: string;
  productoCodigo: string;
  productoNombre: string;
  cantidad: number;
  valorUnitario: number;
  descuentoPct: number;
  total: number;
  formaPago: string;
}

class SiigoExportService {
  /**
   * Genera el contenido CSV plano compatible con el importador contable de Siigo Nube
   */
  generarCsvSiigo(facturas: FacturaExportable[]): string {
    const headers = [
      'Tipo Comprobante',
      'Consecutivo',
      'Fecha Elaboracion',
      'Identificacion Tercero',
      'Nombre Tercero',
      'Codigo Producto',
      'Descripcion Producto',
      'Cantidad',
      'Valor Unitario',
      'Porcentaje Descuento',
      'Valor Total',
      'Forma Pago',
      'Control Interno ERP',
    ];

    const rows = facturas.map((f) => {
      const escape = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
      return [
        escape('Factura de Venta'),
        escape(f.consecutivoFiscal),
        escape(f.fecha),
        escape(f.clienteIdentificacion),
        escape(f.clienteNombre),
        escape(f.productoCodigo),
        escape(f.productoNombre),
        f.cantidad,
        f.valorUnitario,
        f.descuentoPct,
        f.total,
        escape(f.formaPago),
        escape(f.consecutivoInterno),
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Descarga el archivo CSV en el navegador cliente
   */
  descargarCsvFacturas(filename: string, csvContent: string): void {
    if (typeof window === 'undefined') return;

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const siigoExportService = new SiigoExportService();
