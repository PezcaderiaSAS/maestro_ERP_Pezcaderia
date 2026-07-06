import { describe, it, expect, beforeEach } from 'vitest';
import { calcularTotalLinea, calcularTotalesPedido } from '../services/posService';
import { save, load } from '../services/localDb';
import { crearProducto, crearLineaVenta, crearVentaPOS } from './utils/testFactories';
import { PosService } from '../services/posService';
import { LocalDataService } from '../services/LocalDataService';
import { validarStock, registrarSalida } from '../services/inventoryService';

interface StockItem {
  bodegaId: string;
  productoId: string;
  cantidad: number;
}

const dataService = new LocalDataService();
const posService = new PosService(dataService);

const registrarVenta = async (venta: any, bodegaId: string) => {
  return posService.registrarVenta(
    venta,
    bodegaId,
    (productoId, bId, qty) => {
      return validarStock(productoId, bId, qty);
    },
    (params) => {
      return registrarSalida(params);
    }
  );
};

describe('POS: Cálculo de Descuentos (RN-06)', () => {
  it('debería calcular precioFinal con descuento por línea', () => {
    const precioLista = 22000;
    const descuentoPct = 10;

    const resultado = calcularTotalLinea(precioLista, descuentoPct, 1.5);

    expect(resultado.precioFinal).toBe(19800);   // 22000 * 0.90
    expect(resultado.totalLinea).toBe(29700);    // 19800 * 1.5
  });

  it('debería manejar inputs undefined o nulos como 0 (Regresión NaN T-POS-NAN-01)', () => {
    const resultado = calcularTotalLinea(undefined as any, 0, 1);
    expect(resultado.precioFinal).toBe(0);
    expect(resultado.totalLinea).toBe(0);
  });

  it('debería manejar inputs nulos como 0 (Regresión NaN T-POS-NAN-02)', () => {
    const resultado = calcularTotalLinea(null as any, 0, 1);
    expect(resultado.precioFinal).toBe(0);
    expect(resultado.totalLinea).toBe(0);
  });

  it('debería bloquear si el descuento global supera el subtotal (RN-06)', () => {
    const lineas = [{ totalLinea: 10000 }];
    const descuentoGlobalValor = 15000;

    const resultado = calcularTotalesPedido(lineas, 0, descuentoGlobalValor);

    expect(resultado.error).toBe('El descuento no puede superar el total del pedido');
    expect(resultado.data).toBeNull();
  });

  it('debería retornar data sin error en venta válida', () => {
    const lineas = [{ totalLinea: 22000 }];

    const resultado = calcularTotalesPedido(lineas, 0, 0);

    expect(resultado.error).toBeNull();
    expect(resultado.data?.totalFinal).toBe(22000);
  });
});

describe('POS: Registro de Ventas e Idempotencia (RN-01, RN-07)', () => {
  const BODEGA_ID = 'bod-001';

  beforeEach(() => {
    localStorage.clear();
    // Preparar catálogo de productos y stock inicial
    save('productsCatalog', [crearProducto({ id: 'prod-001', sku: 'SAL-001', unidadMedida: 'KG' })]);
    save('stock', {
      [BODEGA_ID]: {
        'SAL-001': 10
      }
    });
  });

  it('debería registrar venta exitosamente si hay stock suficiente', async () => {
    const linea = crearLineaVenta({ productoId: 'prod-001', cantidad: 4 });
    const venta = crearVentaPOS({
      id: 'venta-101',
      lineas: [linea],
      subtotal: 88000,
      totalFinal: 88000,
      idempotencyKey: 'idemp-001'
    });

    const result = await registrarVenta(venta, BODEGA_ID);

    expect(result.error).toBeNull();
    expect(result.data?.id).toBe('venta-101');

    // Verificar que el stock se haya decrementado
    const stockDict = load<any>('stock', {});
    expect(stockDict[BODEGA_ID]?.['SAL-001']).toBe(6); // 10 - 4
  });

  it('debería bloquear venta si el stock es insuficiente (RN-01)', async () => {
    const linea = crearLineaVenta({ productoId: 'prod-001', cantidad: 12 });
    const venta = crearVentaPOS({
      id: 'venta-102',
      lineas: [linea],
      idempotencyKey: 'idemp-002'
    });

    const result = await registrarVenta(venta, BODEGA_ID);

    expect(result.error).toBe('Stock insuficiente. Disponible: 10 KG');
    expect(result.data).toBeNull();
  });

  it('debería retornar venta existente ante peticiones duplicadas (RN-07)', async () => {
    const linea = crearLineaVenta({ productoId: 'prod-001', cantidad: 1 });
    const venta = crearVentaPOS({
      id: 'venta-103',
      lineas: [linea],
      idempotencyKey: 'idemp-003'
    });

    // Primera ejecución
    const result1 = await registrarVenta(venta, BODEGA_ID);
    expect(result1.error).toBeNull();

    // Segunda ejecución (duplicada)
    const result2 = await registrarVenta(venta, BODEGA_ID);
    expect(result2.error).toBeNull();
    expect(result2.data?.id).toBe(result1.data?.id);

    // Verificar que no se volvió a restar el stock (debería quedar en 9, no 8)
    const stockDict = load<any>('stock', {});
    expect(stockDict[BODEGA_ID]?.['SAL-001']).toBe(9); // 10 - 1
  });
});
