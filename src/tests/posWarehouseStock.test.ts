import { describe, it, expect } from 'vitest';
import { 
  getBodegaAbrev, 
  getProductBodegaStock, 
  buildAllProductsStockMap,
  type BodegaStockItem
} from '../views/pos/posWarehouseStock.utils';
import type { Product } from '../types/erp.types';
import type { Bodega } from '../store/useWarehouseStore';

describe('posWarehouseStock.utils (TDD)', () => {
  const mockBodegas: Bodega[] = [
    { id: 'b1', nombre: 'Bodega Principal', activa: true, tipo: 'PRINCIPAL' },
    { id: 'b2', nombre: 'Cuarto Frío 1', activa: true, tipo: 'SECUNDARIA' },
    { id: 'b3', nombre: 'Mostrador y Punto de Venta', activa: true, esPuntoVenta: true, tipo: 'PUNTO_VENTA' },
    { id: 'b4', nombre: 'Bodega Averías', activa: true, tipo: 'AVERIAS' },
    { id: 'b5', nombre: 'Bodega Inactiva', activa: false, tipo: 'SECUNDARIA' },
  ];

  const mockProductPesable: Product = {
    id: 'prod-salmon',
    sku: 'SALMON-01',
    nombre: 'Filete de Salmón Premium',
    categoria: 'Pescados',
    unidadMedida: 'kg',
    precio_venta_pos: 54000,
    precio_venta_restaurante: 52000,
    precio_venta_mayorista: 48000,
    precio_compra: 35000,
    buffer_seguridad: 2,
    activo: true,
    control_inventario: true,
  };

  const mockProductSinControl: Product = {
    id: 'prod-servicio',
    sku: 'SERV-CORTE',
    nombre: 'Servicio de Descamado y Porcionado',
    categoria: 'Servicios',
    unidadMedida: 'und',
    precio_venta_pos: 5000,
    precio_venta_restaurante: 5000,
    precio_venta_mayorista: 4500,
    precio_compra: 0,
    buffer_seguridad: 0,
    activo: true,
    control_inventario: false,
  };

  describe('getBodegaAbrev', () => {
    it('debe abreviar bodegas reconocidas correctamente', () => {
      expect(getBodegaAbrev('Bodega Principal')).toBe('Princ');
      expect(getBodegaAbrev('Cuarto Frío 1')).toBe('Frío');
      expect(getBodegaAbrev('Mostrador Ventas')).toBe('Most');
      expect(getBodegaAbrev('Punto de Venta')).toBe('Most');
      expect(getBodegaAbrev('Bodega Averías')).toBe('Aver');
    });

    it('debe retornar las primeras 4-5 letras en nombres desconocidos', () => {
      expect(getBodegaAbrev('Almacén Bucaramanga')).toBe('Alma');
    });
  });

  describe('getProductBodegaStock', () => {
    it('debe calcular correctamente el stock de cada bodega y el total comercial', () => {
      // Stock estructurado anidado { bodegaId o nombre: { sku: qty } }
      const stockNested = {
        'b1': { 'SALMON-01': 10 },
        'b2': { 'SALMON-01': 25 },
        'Mostrador y Punto de Venta': { 'SALMON-01': 5 },
        'b4': { 'SALMON-01': 8 }, // Averías: no debe sumarse al total comercial
        'b5': { 'SALMON-01': 100 }, // Inactiva: no debe incluirse
      };

      const result = getProductBodegaStock(mockProductPesable, stockNested, mockBodegas);

      expect(result.sinStock).toBe(false);
      // Total comercial = 10 (b1) + 25 (b2) + 5 (b3) = 40 kg (excluye averías e inactivas)
      expect(result.totalStock).toBe(40);

      // Desglose por bodegas activas comerciales
      expect(result.bodegas.length).toBe(3);
      
      const princ = result.bodegas.find((b: BodegaStockItem) => b.bodegaAbrev === 'Princ');
      expect(princ).toBeDefined();
      expect(princ?.cantidad).toBe(10);
      expect(princ?.disponible).toBe(true);

      const frio = result.bodegas.find((b: BodegaStockItem) => b.bodegaAbrev === 'Frío');
      expect(frio).toBeDefined();
      expect(frio?.cantidad).toBe(25);

      const most = result.bodegas.find((b: BodegaStockItem) => b.bodegaAbrev === 'Most');
      expect(most).toBeDefined();
      expect(most?.cantidad).toBe(5);
    });

    it('debe marcar sinStock = true cuando el total comercial es <= 0', () => {
      const stockVacio = {
        'b1': { 'SALMON-01': 0 },
        'b2': { 'SALMON-01': 0 },
      };

      const result = getProductBodegaStock(mockProductPesable, stockVacio, mockBodegas);
      expect(result.totalStock).toBe(0);
      expect(result.sinStock).toBe(true);
    });

    it('debe manejar productos con control_inventario = false como siempre disponibles', () => {
      const stockVacio = {};
      const result = getProductBodegaStock(mockProductSinControl, stockVacio, mockBodegas);

      expect(result.sinStock).toBe(false);
      expect(result.totalStock).toBe(Infinity);
      expect(result.bodegas.length).toBe(0);
    });
  });

  describe('buildAllProductsStockMap', () => {
    it('debe construir flatStockMap y breakdownMap para todos los productos', () => {
      const stockNested = {
        'b1': { 'SALMON-01': 12 },
        'b2': { 'SALMON-01': 8 },
      };

      const { flatStockMap, breakdownMap } = buildAllProductsStockMap(
        [mockProductPesable, mockProductSinControl],
        stockNested,
        mockBodegas
      );

      // Por id y por sku para acceso O(1) infalible
      expect(flatStockMap['prod-salmon']).toBe(20);
      expect(flatStockMap['SALMON-01']).toBe(20);

      expect(breakdownMap['prod-salmon']).toBeDefined();
      expect(breakdownMap['prod-salmon'].length).toBe(3); // Las 3 comerciales activas
      expect(breakdownMap['SALMON-01']).toBeDefined();

      // Producto sin control
      expect(flatStockMap['prod-servicio']).toBe(Infinity);
      expect(flatStockMap['SERV-CORTE']).toBe(Infinity);
    });
  });
});
