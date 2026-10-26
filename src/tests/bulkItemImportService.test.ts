import { describe, it, expect, beforeEach } from 'vitest';
import { BulkItemImportService } from '../services/bulkItemImportService';

describe('TASK-034-05: BulkItemImportService (Importación Masiva Modelo Ferretero)', () => {
  let service: BulkItemImportService;

  beforeEach(() => {
    service = new BulkItemImportService();
  });

  it('debe procesar exitosamente un lote de filas válidas con atributos ferreteros', () => {
    const rawRows = [
      {
        sku: 'FERR-001',
        codigoBarras: '7701112223334',
        nombre: 'Llave Expansiva 10 pulg Cromada',
        marca: 'Stanley',
        categoria: 'Herramientas Manuales',
        unidadMedida: 'UND',
        ubicacionPasillo: 'Pasillo 2 - Estante A',
        costoUnitario: 28000,
        precioDetal: 45000,
        precioMayorista: 38000,
        stockMinimo: 5,
        stockInicial: 25,
      },
      {
        sku: 'FERR-002',
        codigoBarras: '7709998887776',
        nombre: 'Caja Tornillos Drywall 6x1 (1000 und)',
        marca: 'Mamut',
        categoria: 'Fijaciones',
        unidadMedida: 'CAJA',
        ubicacionPasillo: 'Pasillo 5 - Gaveta 12',
        costoUnitario: '18.500',
        precioDetal: '28.000',
        stockMinimo: '10',
        stockInicial: '50',
      },
    ];

    const resultado = service.procesarLoteItems(rawRows);

    expect(resultado.resumen.total).toBe(2);
    expect(resultado.resumen.exitososCount).toBe(2);
    expect(resultado.resumen.fallidosCount).toBe(0);
    expect(resultado.exitosos[0].marca).toBe('Stanley');
    expect(resultado.exitosos[1].costoUnitario).toBe(18500);
    expect(resultado.exitosos[1].precioDetal).toBe(28000);
    expect(resultado.exitosos[1].stockInicial).toBe(50);
  });

  it('debe identificar y aislar filas con errores de validación sin abortar el lote', () => {
    const rawRows = [
      {
        sku: 'FERR-OK',
        nombre: 'Cinta Métrica 5m',
        costoUnitario: 8000,
        precioDetal: 15000,
      },
      {
        // Fila inválida: sin SKU ni nombre
        sku: '',
        nombre: '',
        costoUnitario: 5000,
        precioDetal: 10000,
      },
      {
        // Fila inválida: precio negativo
        sku: 'FERR-NEG',
        nombre: 'Broca Concreto 1/4',
        costoUnitario: 3000,
        precioDetal: -500,
      },
    ];

    const resultado = service.procesarLoteItems(rawRows);

    expect(resultado.resumen.total).toBe(3);
    expect(resultado.resumen.exitososCount).toBe(1);
    expect(resultado.resumen.fallidosCount).toBe(2);
    expect(resultado.fallidos[0].fila).toBe(2);
    expect(resultado.fallidos[1].fila).toBe(3);
    expect(resultado.fallidos[1].error).toContain('negativo');
  });

  it('debe parsear un archivo CSV ferretero con delimitador de punto y coma (;)', () => {
    const csvContent = `SKU;CODIGO_BARRAS;NOMBRE;MARCA;CATEGORIA;COSTO;PRECIO_DETAL;STOCK_INICIAL
FERR-100;770123;Martillo Uña 16oz;Truper;Herramientas;15000;25000;10
FERR-101;770124;Serrucho Carpintero 18";Bellota;Herramientas;22000;34000;8`;

    const resultado = service.parsearCsv(csvContent);

    expect(resultado.resumen.exitososCount).toBe(2);
    expect(resultado.exitosos[0].sku).toBe('FERR-100');
    expect(resultado.exitosos[0].nombre).toBe('Martillo Uña 16oz');
    expect(resultado.exitosos[0].precioDetal).toBe(25000);
    expect(resultado.exitosos[1].marca).toBe('Bellota');
  });

  it('debe generar una plantilla CSV ferretera estandarizada con codificación UTF-8', () => {
    const plantilla = service.generarPlantillaCsv('FERRETERIA');

    expect(plantilla).toContain('SKU;CODIGO_BARRAS;NOMBRE;MARCA;CATEGORIA');
    expect(plantilla).toContain('UBICACION_PASILLO;COSTO_UNITARIO;PRECIO_DETAL');
    expect(plantilla).toContain('Disco Corte Metal');
  });

  it('debe ser de alto rendimiento y procesar 2.000 filas en menos de 1.000 ms', () => {
    const lotesGrandes = Array.from({ length: 2000 }, (_, i) => ({
      sku: `SKU-${i}`,
      codigoBarras: `770000000${i}`,
      nombre: `Producto Industrial Ferretero #${i}`,
      marca: 'Generic Brand',
      categoria: 'Tornillería y Fijaciones',
      costoUnitario: 1000 + i,
      precioDetal: 2000 + i,
      stockInicial: 100,
    }));

    const t0 = performance.now();
    const resultado = service.procesarLoteItems(lotesGrandes);
    const duracionMs = performance.now() - t0;

    expect(resultado.resumen.exitososCount).toBe(2000);
    expect(duracionMs).toBeLessThan(1000); // Menos de 1 segundo
  });
});
