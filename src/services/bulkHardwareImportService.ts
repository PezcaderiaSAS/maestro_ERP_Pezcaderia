// src/services/bulkHardwareImportService.ts
// Servicio de Carga Masiva de Ítems e Inventario para Ferretería (SPEC-032 / TASK-032-04)
// Parser tolerante a CSV/JSON, normalización numérica colombiana y cálculo de precios mayorista/detal.

import { useInventoryStore, type Producto } from '../store/useInventoryStore';
import * as localDb from './localDb';

export interface RawHardwareItem {
  sku: string;
  nombre: string;
  categoria: string;
  marca?: string;
  pasillo?: string;
  unidadMedida?: string;
  costo: number | string;
  precioVenta?: number | string;
  stockInicial?: number | string;
}

export interface ParsedHardwareItem {
  id: string;
  sku: string;
  nombre: string;
  categoria: string;
  marca: string;
  pasillo: string;
  unidadMedida: 'und' | 'kg' | 'lb' | 'gr' | string;
  precio_compra: number;
  precio_venta_pos: number;
  precio_venta_mayorista: number;
  stockInicial: number;
  isValid: boolean;
  errors: string[];
}

export interface BulkImportResult {
  totalRows: number;
  validRows: ParsedHardwareItem[];
  invalidRows: ParsedHardwareItem[];
  importedCount: number;
}

export class BulkHardwareImportService {
  /**
   * Limpia y parsea valores monetarios o numéricos con formato latino/pesos
   * Ejemplos: "$ 12.500", "12500.50", "$ 1.200.000", "15,5"
   */
  public parseNumber(val: any): number {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;

    let str = String(val).trim().replace(/\$/g, '').trim();
    if (!str) return 0;

    // Detectar si usa coma como decimal (ej: 12.500,50 o 15,5)
    if (str.includes(',') && str.includes('.')) {
      // Formato 1.500,50 -> quitar puntos de miles y reemplazar coma por punto
      str = str.replace(/\./g, '').replace(',', '.');
    } else if (str.includes(',')) {
      // Formato latino con coma: 15,5 o 4,500
      if (/,\d{3}$/.test(str)) {
        str = str.replace(/,/g, '');
      } else {
        str = str.replace(',', '.');
      }
    } else if (str.includes('.')) {
      // Formato latino con punto de miles: 4.500 o 25.000 o 1.500.000
      if (/\.\d{3}$/.test(str) || str.split('.').length > 2) {
        str = str.replace(/\./g, '');
      }
    }

    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Parsea contenido de texto delimitado (CSV o TSV) con detección de cabeceras
   */
  public parseCsv(csvContent: string): RawHardwareItem[] {
    if (!csvContent || typeof csvContent !== 'string') return [];

    const lines = csvContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) return [];

    // Detectar separador (, o ; o \t) en la primera línea
    const headerLine = lines[0];
    let delimiter = ',';
    const semicolons = (headerLine.match(/;/g) || []).length;
    const commas = (headerLine.match(/,/g) || []).length;
    const tabs = (headerLine.match(/\t/g) || []).length;

    if (semicolons > commas && semicolons > tabs) {
      delimiter = ';';
    } else if (tabs > commas && tabs > semicolons) {
      delimiter = '\t';
    }

    const headers = headerLine
      .split(delimiter)
      .map((h) =>
        h
          .trim()
          .toLowerCase()
          .replace(/["']/g, '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
      );

    const items: RawHardwareItem[] = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      const cols = row.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length === 0 || (cols.length === 1 && !cols[0])) continue;

      const rowObj: any = {};
      headers.forEach((h, colIdx) => {
        const val = cols[colIdx] || '';
        if (h.includes('sku') || h.includes('codigo')) {
          rowObj.sku = val;
        } else if (h.includes('nombre') || h.includes('descripcion') || h.includes('producto')) {
          rowObj.nombre = val;
        } else if (h.includes('categoria') || h.includes('rubro')) {
          rowObj.categoria = val;
        } else if (h.includes('marca') || h.includes('fabricante')) {
          rowObj.marca = val;
        } else if (h.includes('pasillo') || h.includes('ubicacion') || h.includes('estante')) {
          rowObj.pasillo = val;
        } else if (h.includes('unidad') || h.includes('medida')) {
          rowObj.unidadMedida = val;
        } else if (h.includes('costo') || h.includes('compra')) {
          rowObj.costo = val;
        } else if (h.includes('precio') || h.includes('venta')) {
          rowObj.precioVenta = val;
        } else if (h.includes('stock') || h.includes('cantidad') || h.includes('inicial')) {
          rowObj.stockInicial = val;
        }
      });

      if (rowObj.sku || rowObj.nombre) {
        items.push({
          sku: rowObj.sku || `FER-${Date.now()}-${i}`,
          nombre: rowObj.nombre || 'Artículo sin nombre',
          categoria: rowObj.categoria || 'FERRETERIA GENERAL',
          marca: rowObj.marca || 'Genérica',
          pasillo: rowObj.pasillo || 'Sin asignar',
          unidadMedida: rowObj.unidadMedida || 'und',
          costo: rowObj.costo || 0,
          precioVenta: rowObj.precioVenta || 0,
          stockInicial: rowObj.stockInicial || 0,
        });
      }
    }

    return items;
  }

  /**
   * Valida y transforma los ítems crudos calculando márgenes y precios
   */
  public validateAndTransform(rawItems: RawHardwareItem[]): {
    valid: ParsedHardwareItem[];
    invalid: ParsedHardwareItem[];
  } {
    const valid: ParsedHardwareItem[] = [];
    const invalid: ParsedHardwareItem[] = [];
    const seenSkus = new Set<string>();

    rawItems.forEach((item, index) => {
      const errors: string[] = [];
      const cleanSku = (item.sku || '').trim().toUpperCase();

      if (!cleanSku) {
        errors.push('SKU no puede estar vacío');
      } else if (seenSkus.has(cleanSku)) {
        errors.push(`SKU duplicado en el archivo: ${cleanSku}`);
      } else {
        seenSkus.add(cleanSku);
      }

      if (!item.nombre || !item.nombre.trim()) {
        errors.push('El nombre del producto es requerido');
      }

      const costo = this.parseNumber(item.costo);
      if (costo <= 0) {
        errors.push('El costo de compra debe ser mayor a 0');
      }

      let precioVenta = this.parseNumber(item.precioVenta);
      if (precioVenta <= 0) {
        // Margen sugerido del 35% en ferretería si no se especifica
        precioVenta = Math.round(costo * 1.35);
      }

      // Precio mayorista estándar con 10% de descuento sobre el precio al detal
      const precioMayorista = Math.round(precioVenta * 0.9);
      const stockInicial = Math.max(0, this.parseNumber(item.stockInicial));

      const parsed: ParsedHardwareItem = {
        id: `prod-fer-${cleanSku.toLowerCase() || index}`,
        sku: cleanSku || `ERR-${index}`,
        nombre: item.nombre?.trim() || 'Ítem sin nombre',
        categoria: (item.categoria || 'FERRETERIA').toUpperCase(),
        marca: item.marca?.trim() || 'Genérica',
        pasillo: item.pasillo?.trim() || 'Sin ubicación',
        unidadMedida: item.unidadMedida?.trim().toLowerCase() || 'und',
        precio_compra: costo,
        precio_venta_pos: precioVenta,
        precio_venta_mayorista: precioMayorista,
        stockInicial,
        isValid: errors.length === 0,
        errors,
      };

      if (parsed.isValid) {
        valid.push(parsed);
      } else {
        invalid.push(parsed);
      }
    });

    return { valid, invalid };
  }

  /**
   * Aplica la importación de ítems válidos en useInventoryStore
   */
  public commitImport(
    validItems: ParsedHardwareItem[],
    bodegaKey = 'bodega-pos'
  ): BulkImportResult {
    const store = useInventoryStore.getState();
    const currentProducts = [...store.products];
    const currentCatalog = [...(store.productsCatalog || [])];
    const currentPricings = [...(store.productPricings || [])];
    const currentStock = { ...store.stock };

    if (!currentStock[bodegaKey]) {
      currentStock[bodegaKey] = {};
    }

    validItems.forEach((item) => {
      // 1. Estructurar Producto Unificado
      const nuevoProducto: Producto = {
        id: item.id,
        sku: item.sku,
        nombre: item.nombre,
        categoria: item.categoria,
        unidadMedida: item.unidadMedida as any,
        precio_compra: item.precio_compra,
        buffer_seguridad: 5,
        precio_venta_pos: item.precio_venta_pos,
        precio_venta_restaurante: item.precio_venta_pos,
        precio_venta_mayorista: item.precio_venta_mayorista,
        activo: true,
        control_inventario: true,
        produccion: false,
        iva: 0,
        ivaIncluido: true,
        metadata: {
          marca: item.marca,
          pasillo: item.pasillo,
          rubro: 'FERRETERIA',
        },
      };

      // 2. Insertar o actualizar en `products`
      const prodIdx = currentProducts.findIndex((p) => p.sku === item.sku);
      if (prodIdx >= 0) {
        currentProducts[prodIdx] = nuevoProducto;
      } else {
        currentProducts.push(nuevoProducto);
      }

      // 3. Insertar o actualizar en `productsCatalog`
      const catIdx = currentCatalog.findIndex((p) => p.sku === item.sku);
      const catItem = {
        id: item.id,
        sku: item.sku,
        nombre: item.nombre,
        categoria: item.categoria,
        unidadMedida: item.unidadMedida,
        activo: true,
        control_inventario: true,
        metadata: {
          marca: item.marca,
          pasillo: item.pasillo,
          rubro: 'FERRETERIA',
        },
      };
      if (catIdx >= 0) {
        currentCatalog[catIdx] = catItem;
      } else {
        currentCatalog.push(catItem);
      }

      // 4. Insertar o actualizar en `productPricings`
      const prcIdx = currentPricings.findIndex((p) => p.productoId === item.id);
      const prcItem = {
        id: `prc-${item.sku.toLowerCase()}`,
        productoId: item.id,
        vigenciaDesde: new Date().toISOString(),
        precio_compra: item.precio_compra,
        buffer_seguridad: 5,
        precio_venta_pos: item.precio_venta_pos,
        precio_venta_restaurante: item.precio_venta_pos,
        precio_venta_mayorista: item.precio_venta_mayorista,
        actualizadoPor: 'bulk_import',
      };
      if (prcIdx >= 0) {
        currentPricings[prcIdx] = prcItem;
      } else {
        currentPricings.push(prcItem);
      }

      // 5. Asignar Stock Inicial en bodega
      if (item.stockInicial > 0) {
        currentStock[bodegaKey][item.sku] = item.stockInicial;
      }
    });

    // Actualizar estado del Store
    store.setProducts(currentProducts);
    store.setProductsCatalog(currentCatalog);
    store.setProductPricings(currentPricings);
    store.setStock(currentStock);

    // Persistencia Local
    localDb.save('productsCatalog', currentCatalog);
    localDb.save('productPricings', currentPricings);
    localDb.save('stock', currentStock);

    return {
      totalRows: validItems.length,
      validRows: validItems,
      invalidRows: [],
      importedCount: validItems.length,
    };
  }
}

export const bulkHardwareImportService = new BulkHardwareImportService();
