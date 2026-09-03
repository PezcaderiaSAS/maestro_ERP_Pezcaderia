import { Cliente, Product } from '../types/erp.types';
import { generateId } from '../lib/utils';

export interface BulkUploadResult<T> {
  success: boolean;
  imported: T[];
  errors: string[];
}

export class BulkUploadService {
  /**
   * Procesa un CSV de clientes y lo mapea al formato estricto de la base de datos.
   * Valida campos requeridos y tipos.
   */
  static parseClientesCSV(csvText: string): BulkUploadResult<Cliente> {
    const lines = csvText.split('\n').filter(l => l.trim() !== '');
    const imported: Cliente[] = [];
    const errors: string[] = [];

    // Asumimos formato CSV: nombre,identificacion,tipoIdentificacion,tipoPersona,direccion,telefono,email,ciudad,tipoPrecio,cupoCredito
    for (let i = 1; i < lines.length; i++) { // Salta header
      const cols = lines[i].split(',').map(c => c.trim());
      if (cols.length < 10) {
        errors.push(`Línea ${i + 1}: Faltan columnas. Se esperaban al menos 10.`);
        continue;
      }

      const [nombre, identificacion, tipoId, tipoPer, direccion, telefono, email, ciudad, tipoPrecio, cupoStr] = cols;
      
      if (!nombre || !identificacion) {
        errors.push(`Línea ${i + 1}: Nombre o Identificación no pueden estar vacíos.`);
        continue;
      }

      const cupo = parseFloat(cupoStr) || 0;

      imported.push({
        id: generateId('c'),
        nombre,
        identificacion,
        tipoIdentificacion: (tipoId as any) || 'NIT',
        tipoPersona: (tipoPer as any) || 'JURIDICA',
        direccion,
        telefono,
        email,
        ciudad,
        tipoPrecio: (tipoPrecio as any) || 'POS',
        cupoCredito: cupo,
        cupoCreditoUsado: 0,
        isGranContribuyente: false,
        isAutoretenedor: false,
        activo: true
      });
    }

    return {
      success: imported.length > 0,
      imported,
      errors
    };
  }

  /**
   * Procesa un CSV de productos y lo mapea al formato estricto de la base de datos.
   */
  static parseProductsCSV(csvText: string): BulkUploadResult<Product> {
    const lines = csvText.split('\n').filter(l => l.trim() !== '');
    const imported: Product[] = [];
    const errors: string[] = [];

    // Asumimos formato CSV: sku,nombre,categoria,unidad,precio_compra,precio_venta_pos
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      if (cols.length < 6) {
        errors.push(`Línea ${i + 1}: Faltan columnas. Se esperaban 6.`);
        continue;
      }

      const [sku, nombre, categoria, unidad, pCompra, pVenta] = cols;

      if (!sku || !nombre) {
        errors.push(`Línea ${i + 1}: SKU o Nombre no pueden estar vacíos.`);
        continue;
      }

      const compra = parseFloat(pCompra) || 0;
      const venta = parseFloat(pVenta) || 0;

      imported.push({
        id: generateId('p'),
        sku,
        nombre,
        categoria,
        unidadMedida: (unidad as any) || 'kg',
        precio_compra: compra,
        precio_venta_pos: venta,
        precio_venta_restaurante: venta,
        precio_venta_mayorista: venta,
        buffer_seguridad: 0,
        activo: true
      });
    }

    return {
      success: imported.length > 0,
      imported,
      errors
    };
  }
}
