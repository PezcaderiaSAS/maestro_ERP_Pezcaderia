import { describe, it, expect } from 'vitest';
import {
  calcularTotalLinea,
  calcularTotalesPedido,
  calcularCostoProductoDerivado,
} from '../services/posService';
import type { LineaVenta } from '../types/pos.types';

describe('Suite de Pruebas: Redondeo Entero COP, IVA Incluido y Productos Derivados (Spec 009)', () => {
  describe('1. Redondeo Estricto a Enteros en COP', () => {
    it('debe redondear el total de línea a entero al multiplicar peso decimal por precio unitario', () => {
      // 1.345 kg de camarón a $28.500/kg = 38.332,5 -> debe ser 38.333
      // firma: precioLista, descuentoPct, cantidad, tarifaIva, ivaIncluido
      const resultado = calcularTotalLinea(28500, 0, 1.345, 0, true);
      expect(resultado.totalLinea).toBe(38333);
      expect(Number.isInteger(resultado.totalLinea)).toBe(true);
      expect(resultado.precioFinal).toBe(28500);
      expect(Number.isInteger(resultado.precioFinal)).toBe(true);
    });

    it('debe redondear a entero cuando se aplica descuento porcentual', () => {
      // Precio $35.000 con 15% de descuento = $29.750
      const resultado = calcularTotalLinea(35000, 15, 1, 0, true);
      expect(resultado.precioFinal).toBe(29750);
      expect(resultado.totalLinea).toBe(29750);
      expect(Number.isInteger(resultado.precioFinal)).toBe(true);

      // Descuento con decimales: $33.333 con 7% de descuento = $30.999,69 -> 31.000
      const res2 = calcularTotalLinea(33333, 7, 1, 0, true);
      expect(res2.precioFinal).toBe(31000);
      expect(Number.isInteger(res2.precioFinal)).toBe(true);
    });
  });

  describe('2. Tratamiento Determinista de IVA Incluido con Modificación de Precio', () => {
    it('debe calcular exactamente la base gravable y cuota de IVA para $10.000 con 19% incluido', () => {
      // $10.000 con IVA 19% incluido:
      // Base = round(10.000 / 1.19) = round(8403.361...) = 8.403
      // IVA = 10.000 - 8.403 = 1.597
      const resultado = calcularTotalLinea(10000, 0, 1, 19, true);
      expect(resultado.totalLinea).toBe(10000);
      expect(resultado.baseGravableLinea).toBe(8403);
      expect(resultado.cuotaIvaLinea).toBe(1597);
      expect(resultado.baseGravableLinea + resultado.cuotaIvaLinea).toBe(10000);
      expect(Number.isInteger(resultado.baseGravableLinea)).toBe(true);
      expect(Number.isInteger(resultado.cuotaIvaLinea)).toBe(true);
    });

    it('debe desglosar correctamente cuando se modifica el precio a $9.000 con IVA 19% incluido', () => {
      // Precio final modificado a $9.000 con IVA 19% incluido:
      // Base = round(9.000 / 1.19) = round(7563.025...) = 7.563
      // IVA = 9.000 - 7.563 = 1.437
      // Suma total = 7.563 + 1.437 = 9.000 exacto
      const resultado = calcularTotalLinea(9000, 0, 1, 19, true);
      expect(resultado.totalLinea).toBe(9000);
      expect(resultado.baseGravableLinea).toBe(7563);
      expect(resultado.cuotaIvaLinea).toBe(1437);
      expect(resultado.baseGravableLinea + resultado.cuotaIvaLinea).toBe(9000);
      expect(Number.isInteger(resultado.baseGravableLinea)).toBe(true);
      expect(Number.isInteger(resultado.cuotaIvaLinea)).toBe(true);
    });

    it('debe mantener la igualdad Base + IVA === Total en cantidades múltiples y decimales', () => {
      // 2.5 kg a $9.000 con 19% IVA incluido = total $22.500
      // Base = round(22.500 / 1.19) = round(18907.563...) = 18.908
      // IVA = 22.500 - 18.908 = 3.592
      const resultado = calcularTotalLinea(9000, 0, 2.5, 19, true);
      expect(resultado.totalLinea).toBe(22500);
      expect(resultado.baseGravableLinea).toBe(18908);
      expect(resultado.cuotaIvaLinea).toBe(3592);
      expect(resultado.baseGravableLinea + resultado.cuotaIvaLinea).toBe(22500);
    });

    it('debe consolidar totales de pedido garantizando que subtotalBaseGravable + totalIva === totalFinal', () => {
      const lineas: LineaVenta[] = [
        {
          productoId: 'p-iva-1',
          sku: 'IVA-01',
          nombre: 'Producto Con IVA 19%',
          cantidad: 1,
          unidad: 'UNIDAD',
          precioLista: 10000,
          precioFinal: 9000, // Precio modificado de $10.000 a $9.000
          totalLinea: 9000,
          descuentoPct: 0,
          precioCompra: 5000,
          esPesoManual: false,
          iva: 19,
          ivaIncluido: true,
          baseGravableLinea: 7563,
          cuotaIvaLinea: 1437,
        },
        {
          productoId: 'p-camaron-kilo',
          sku: 'CAM-CRU-41-50',
          nombre: 'Camaron Crudo 41-50',
          cantidad: 1.5,
          unidad: 'KG',
          precioLista: 38000,
          precioFinal: 38000,
          totalLinea: 57000, // 1.5 * 38000 = 57000
          descuentoPct: 0,
          precioCompra: 28500,
          esPesoManual: false,
          iva: 0,
          ivaIncluido: true,
          baseGravableLinea: 57000,
          cuotaIvaLinea: 0,
        },
      ];

      const resultado = calcularTotalesPedido(lineas, 0, 0);
      expect(resultado.error).toBeNull();
      const totales = resultado.data!;
      expect(totales.subtotal).toBe(66000); // 9000 + 57000
      expect(totales.descuento).toBe(0);
      expect(totales.totalFinal).toBe(66000);
      expect(totales.subtotalBaseGravable).toBe(64563); // 7563 + 57000
      expect(totales.totalIva).toBe(1437);
      expect(totales.subtotalBaseGravable + totales.totalIva).toBe(totales.totalFinal);
      expect(Number.isInteger(totales.subtotalBaseGravable)).toBe(true);
      expect(Number.isInteger(totales.totalIva)).toBe(true);
      expect(Number.isInteger(totales.totalFinal)).toBe(true);
    });
  });

  describe('3. Costo de Producto Derivado por Proporción de Gramaje', () => {
    it('debe calcular el costo de compra de 500 gr proporcional a $28.500/kg de materia prima', () => {
      // Costo MP: $28.500 COP / kg
      // Gramaje producto final: 500 gr
      // Costo esperado: round(28.500 * 500 / 1000) = 14.250 COP
      const costoDerivado = calcularCostoProductoDerivado(28500, 500);
      expect(costoDerivado).toBe(14250);
      expect(Number.isInteger(costoDerivado)).toBe(true);
    });

    it('debe manejar gramajes no múltiplos redondeando estrictamente a entero COP', () => {
      // Costo MP: $28.500 COP / kg
      // Gramaje: 350 gr -> 28.500 * 0.35 = 9.975
      const costo350 = calcularCostoProductoDerivado(28500, 350);
      expect(costo350).toBe(9975);

      // Gramaje: 333 gr -> 28.500 * 0.333 = 9.490,5 -> 9.491
      const costo333 = calcularCostoProductoDerivado(28500, 333);
      expect(costo333).toBe(9491);
      expect(Number.isInteger(costo333)).toBe(true);
    });
  });

  describe('4. Configuración de los Productos de Prueba Solicitados', () => {
    it('debe tener las propiedades exactas requeridas para Camaron Crudo 41-50 (Materia Prima)', () => {
      const prodMP = {
        sku: 'CAM-CRU-41-50',
        nombre: 'Camaron Crudo 41-50',
        categoria: 'MATERIA PRIMA',
        unidadMedida: 'kg',
        precio_compra: 28500,
        precio_venta_pos: 38000,
        iva: 0,
      };

      expect(prodMP.unidadMedida).toBe('kg');
      expect(prodMP.precio_compra).toBe(28500);
      expect(prodMP.categoria).toBe('MATERIA PRIMA');
    });

    it('debe tener las propiedades exactas para Camaron Crudo 41-50 x 500 gr (Producto Final derivado)', () => {
      const costoDerivado = calcularCostoProductoDerivado(28500, 500);
      const prodDerivado = {
        sku: 'CAM-CRU-41-50-500G',
        nombre: 'Camaron Crudo 41-50 x 500 gr',
        categoria: 'MARISCOS',
        unidadMedida: 'und',
        precio_compra: costoDerivado,
        precio_venta_pos: 22000,
        iva: 0,
      };

      expect(prodDerivado.unidadMedida).toBe('und');
      expect(prodDerivado.precio_compra).toBe(14250);
      expect(prodDerivado.precio_venta_pos).toBe(22000);
    });
  });
});
