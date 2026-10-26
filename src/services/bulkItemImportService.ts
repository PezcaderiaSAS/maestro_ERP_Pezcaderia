// src/services/bulkItemImportService.ts
// Servicio de Carga Masiva de Ítems Optimizado (Soporte Modelo Ferretero y General)

import { validarBulkItemHardwareRow } from '../schemas/multiVendorCash.schema';
import type { BulkItemHardwareRow } from '../types/multiVendorCash.types';

export interface FilaFallida {
  fila: number;
  raw: Record<string, any>;
  error: string;
}

export interface ResultadoProcesamientoLote {
  exitosos: BulkItemHardwareRow[];
  fallidos: FilaFallida[];
  resumen: {
    total: number;
    exitososCount: number;
    fallidosCount: number;
  };
}

export class BulkItemImportService {
  /**
   * Procesa un arreglo de objetos crudos y los valida con contratos Zod en memoria de alta velocidad
   */
  public procesarLoteItems(rawRows: Record<string, any>[]): ResultadoProcesamientoLote {
    const exitosos: BulkItemHardwareRow[] = [];
    const fallidos: FilaFallida[] = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const validacion = validarBulkItemHardwareRow(row);

      if (validacion.success && validacion.data) {
        exitosos.push(validacion.data);
      } else {
        fallidos.push({
          fila: i + 1,
          raw: row,
          error: validacion.error || 'Error de validación en la fila',
        });
      }
    }

    return {
      exitosos,
      fallidos,
      resumen: {
        total: rawRows.length,
        exitososCount: exitosos.length,
        fallidosCount: fallidos.length,
      },
    };
  }

  /**
   * Parsea contenido de texto CSV (con soporte para separadores ',' o ';') y ejecuta el procesamiento del lote
   */
  public parsearCsv(csvText: string, delimiter?: string): ResultadoProcesamientoLote {
    const cleanText = csvText.replace(/^\uFEFF/, '').trim(); // Quitar BOM si existe
    const lines = cleanText.split(/\r?\n/).filter((l) => l.trim().length > 0);

    if (lines.length < 2) {
      return {
        exitosos: [],
        fallidos: [],
        resumen: { total: 0, exitososCount: 0, fallidosCount: 0 },
      };
    }

    // Auto-detectar delimitador (; o ,) si no se especifica
    const headerLine = lines[0];
    const sep = delimiter || (headerLine.includes(';') ? ';' : ',');

    const rawHeaders = headerLine
      .split(sep)
      .map((h) => h.replace(/["']/g, '').trim().toUpperCase());

    const rows: Record<string, any>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values = line.split(sep).map((v) => v.replace(/^["']|["']$/g, '').trim());

      const rowObj: Record<string, any> = {};
      rawHeaders.forEach((header, idx) => {
        const val = values[idx] || '';
        // Mapeo flexible de encabezados comunes
        if (header.includes('SKU') || header === 'CODIGO') rowObj.sku = val;
        else if (header.includes('BARRA') || header.includes('BARCODE')) rowObj.codigoBarras = val;
        else if (header.includes('NOMBRE') || header.includes('DESCRIPCION') || header === 'ITEM') rowObj.nombre = val;
        else if (header.includes('MARCA') || header.includes('FABRICANTE')) rowObj.marca = val;
        else if (header.includes('CATEGORIA') || header.includes('RUBRO')) rowObj.categoria = val;
        else if (header.includes('UNIDAD') || header === 'MEDIDA') rowObj.unidadMedida = val;
        else if (header.includes('PASILLO') || header.includes('UBICACION') || header.includes('ESTANTE')) rowObj.ubicacionPasillo = val;
        else if (header.includes('COSTO')) rowObj.costoUnitario = val;
        else if (header.includes('PRECIO_DETAL') || header.includes('DETAL') || header === 'PRECIO') rowObj.precioDetal = val;
        else if (header.includes('MAYORISTA')) rowObj.precioMayorista = val;
        else if (header.includes('STOCK_MIN') || header.includes('MINIMO')) rowObj.stockMinimo = val;
        else if (header.includes('STOCK_INI') || header.includes('INICIAL') || header === 'STOCK') rowObj.stockInicial = val;
        else rowObj[header] = val;
      });

      rows.push(rowObj);
    }

    return this.procesarLoteItems(rows);
  }

  /**
   * Genera una plantilla CSV estandarizada con BOM UTF-8 y delimitador ';' para Excel
   */
  public generarPlantillaCsv(rubro: 'FERRETERIA' | 'PESCADERIA'): string {
    const BOM = '\uFEFF';

    if (rubro === 'FERRETERIA') {
      const header = 'SKU;CODIGO_BARRAS;NOMBRE;MARCA;CATEGORIA;UNIDAD_MEDIDA;UBICACION_PASILLO;COSTO_UNITARIO;PRECIO_DETAL;PRECIO_MAYORISTA;STOCK_MINIMO;STOCK_INICIAL\r\n';
      const sample1 = 'FERR-001;7701234567890;Disco Corte Metal 4 1/2;DeWalt;Abrasivos;UND;Pasillo 3 - Estante B;4200;7500;6000;20;100\r\n';
      const sample2 = 'FERR-002;7709876543210;Taladro Percutor 1/2 650W;Black&Decker;Herramientas;UND;Pasillo 1 - Vitrina 02;150000;220000;190000;5;15\r\n';
      return `${BOM}${header}${sample1}${sample2}`;
    }

    const header = 'SKU;CODIGO_BARRAS;NOMBRE;CATEGORIA;UNIDAD_MEDIDA;COSTO_UNITARIO;PRECIO_DETAL;STOCK_MINIMO;STOCK_INICIAL\r\n';
    const sample1 = 'PEZ-001;7700000000001;Filete de Salmón Premium;Pescados;KG;45000;65000;10;50\r\n';
    const sample2 = 'PEZ-002;7700000000002;Camarón Tigre 16/20;Mariscos;KG;38000;55000;15;80\r\n';
    return `${BOM}${header}${sample1}${sample2}`;
  }
}

export const bulkItemImportService = new BulkItemImportService();
