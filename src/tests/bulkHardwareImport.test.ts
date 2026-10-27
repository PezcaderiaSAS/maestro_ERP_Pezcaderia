import { describe, it, expect, beforeEach } from 'vitest';
import {
  bulkHardwareImportService,
  type RawHardwareItem,
} from '../services/bulkHardwareImportService';
import { useInventoryStore } from '../store/useInventoryStore';

describe('BulkHardwareImportService - Carga Masiva de Ferretería (SPEC-032: TASK-032-04)', () => {
  beforeEach(() => {
    useInventoryStore.setState({
      products: [],
      productsCatalog: [],
      productPricings: [],
      stock: {},
    });
  });

  it('1. Debe parsear un string CSV estándar y estructurar los ítems ferreteros', () => {
    const csvContent = `SKU,NOMBRE,CATEGORIA,MARCA,PASILLO,COSTO,PRECIO_VENTA,STOCK
TORN-001,Tornillo Drywall 6x1,TORNILLERIA,Mamut,Pasillo 1 - Gaveta 4,50,100,500
MART-002,Martillo de Uña 16oz,HERRAMIENTAS,Stanley,Pasillo 4 - Estante A,18000,28000,24`;

    const rawItems = bulkHardwareImportService.parseCsv(csvContent);
    expect(rawItems).toHaveLength(2);
    expect(rawItems[0].sku).toBe('TORN-001');
    expect(rawItems[0].nombre).toBe('Tornillo Drywall 6x1');
    expect(rawItems[0].categoria).toBe('TORNILLERIA');
    expect(rawItems[0].marca).toBe('Mamut');
    expect(rawItems[0].pasillo).toBe('Pasillo 1 - Gaveta 4');
  });

  it('2. Debe soportar separadores por punto y coma (;) y formato monetario con signo pesos', () => {
    const csvSemicolon = `SKU;NOMBRE;CATEGORIA;COSTO;PRECIO_VENTA
BROC-010;Broca Concreto 1/4;ACCESORIOS;$ 4.500;$ 8.000`;

    const rawItems = bulkHardwareImportService.parseCsv(csvSemicolon);
    expect(rawItems).toHaveLength(1);
    expect(rawItems[0].sku).toBe('BROC-010');

    const { valid, invalid } = bulkHardwareImportService.validateAndTransform(rawItems);
    expect(invalid).toHaveLength(0);
    expect(valid).toHaveLength(1);
    expect(valid[0].precio_compra).toBe(4500);
    expect(valid[0].precio_venta_pos).toBe(8000);
  });

  it('3. Debe identificar filas inválidas (SKU vacío, duplicados o costo <= 0)', () => {
    const badItems: RawHardwareItem[] = [
      {
        sku: '',
        nombre: 'Sin Código',
        categoria: 'VARIOS',
        costo: 1000,
      },
      {
        sku: 'DUPL-01',
        nombre: 'Item Original',
        categoria: 'VARIOS',
        costo: 2000,
      },
      {
        sku: 'DUPL-01',
        nombre: 'Item Duplicado',
        categoria: 'VARIOS',
        costo: 2500,
      },
      {
        sku: 'VAL-01',
        nombre: 'Item Válido',
        categoria: 'VARIOS',
        costo: 5000,
      },
    ];

    const { valid, invalid } = bulkHardwareImportService.validateAndTransform(badItems);
    expect(invalid).toHaveLength(2); // Vacío + duplicado
    expect(valid).toHaveLength(2); // Original + Válido
  });

  it('4. Debe inyectar los ítems válidos en useInventoryStore con catálogo, precios y stock', () => {
    const validRaw: RawHardwareItem[] = [
      {
        sku: 'PINT-BLA-GL',
        nombre: 'Pintura Vinilo Blanco Galón',
        categoria: 'PINTURAS',
        marca: 'Pintuco',
        pasillo: 'Pasillo 2',
        unidadMedida: 'und',
        costo: 35000,
        precioVenta: 55000,
        stockInicial: 15,
      },
    ];

    const { valid } = bulkHardwareImportService.validateAndTransform(validRaw);
    const result = bulkHardwareImportService.commitImport(valid, 'bodega-pos');

    expect(result.importedCount).toBe(1);

    const storeState = useInventoryStore.getState();
    expect(storeState.products).toHaveLength(1);
    expect(storeState.products[0].sku).toBe('PINT-BLA-GL');
    expect(storeState.products[0].metadata?.marca).toBe('Pintuco');
    expect(storeState.products[0].metadata?.pasillo).toBe('Pasillo 2');
    expect(storeState.stock['bodega-pos']?.['PINT-BLA-GL']).toBe(15);
  });
});
