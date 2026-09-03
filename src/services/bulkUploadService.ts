import { Cliente, Product } from '../types/erp.types';
import { generateId } from '../lib/utils';

export interface BulkUploadResult<T> {
  success: boolean;
  imported: T[];
  errors: string[];
}

export class BulkUploadService {
  /**
   * Procesa un Excel de clientes (convertido a JSON) y lo mapea al formato estricto de la base de datos.
   */
  static parseClientesExcel(rows: any[]): BulkUploadResult<Cliente> {
    const imported: Cliente[] = [];
    const errors: string[] = [];

    if (!Array.isArray(rows) || rows.length === 0) {
      errors.push("El archivo está vacío o no tiene un formato válido.");
      return { success: false, imported: [], errors };
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      // Claves esperadas (insensibles a mayúsculas idealmente, pero asumimos nombres limpios)
      const nombre = row['Nombre'] || row['nombre'];
      const identificacion = row['Identificacion'] || row['Identificación'] || row['identificacion'] || row['identificación'];
      const tipoId = row['TipoIdentificacion'] || row['Tipo Identificacion'] || row['tipoIdentificacion'] || 'NIT';
      const tipoPer = row['TipoPersona'] || row['Tipo Persona'] || row['tipoPersona'] || 'JURIDICA';
      const direccion = row['Direccion'] || row['Dirección'] || row['direccion'];
      const telefono = row['Telefono'] || row['Teléfono'] || row['telefono'];
      const email = row['Email'] || row['Correo'] || row['email'];
      const ciudad = row['Ciudad'] || row['ciudad'] || 'Bogotá';
      const tipoPrecio = row['TipoPrecio'] || row['Tipo Precio'] || row['tipoPrecio'] || 'POS';
      const cupoStr = row['CupoCredito'] || row['Cupo Credito'] || row['cupoCredito'] || 0;

      if (!nombre || !identificacion) {
        errors.push(`Fila ${i + 1}: Nombre o Identificación faltantes.`);
        continue;
      }

      const cupo = parseFloat(cupoStr) || 0;

      imported.push({
        id: generateId('c'),
        nombre: String(nombre).trim(),
        identificacion: String(identificacion).trim(),
        tipoIdentificacion: String(tipoId).trim().toUpperCase() as any,
        tipoPersona: String(tipoPer).trim().toUpperCase() as any,
        direccion: direccion ? String(direccion).trim() : '',
        telefono: telefono ? String(telefono).trim() : '',
        email: email ? String(email).trim() : '',
        ciudad: ciudad ? String(ciudad).trim() : '',
        tipoPrecio: String(tipoPrecio).trim().toUpperCase() as any,
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
   * Procesa un Excel de productos (convertido a JSON) y lo mapea al formato estricto de la base de datos.
   */
  static parseProductsExcel(rows: any[]): BulkUploadResult<Product> {
    const imported: Product[] = [];
    const errors: string[] = [];

    if (!Array.isArray(rows) || rows.length === 0) {
      errors.push("El archivo está vacío o no tiene un formato válido.");
      return { success: false, imported: [], errors };
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const sku = row['SKU'] || row['sku'];
      const nombre = row['Nombre'] || row['nombre'];
      const categoria = row['Categoria'] || row['Categoría'] || row['categoria'];
      const unidad = row['Unidad'] || row['unidad'] || 'kg';
      const pCompra = row['PrecioCompra'] || row['Precio Compra'] || row['precio_compra'] || 0;
      const pVenta = row['PrecioVenta'] || row['Precio Venta'] || row['precio_venta_pos'] || 0;
      const buffer = row['BufferSeguridad'] || row['Buffer'] || row['buffer_seguridad'] || 5;

      if (!sku || !nombre) {
        errors.push(`Fila ${i + 1}: SKU o Nombre faltantes.`);
        continue;
      }

      const compra = parseFloat(pCompra) || 0;
      const venta = parseFloat(pVenta) || 0;
      const bufferSeguridad = parseFloat(buffer) || 5;

      imported.push({
        id: generateId('p'),
        sku: String(sku).trim().toUpperCase(),
        nombre: String(nombre).trim(),
        categoria: categoria ? String(categoria).trim().toUpperCase() : 'GENERAL',
        unidadMedida: String(unidad).trim().toLowerCase() as any,
        precio_compra: compra,
        precio_venta_pos: venta,
        precio_venta_restaurante: venta,
        precio_venta_mayorista: venta,
        buffer_seguridad: bufferSeguridad,
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
