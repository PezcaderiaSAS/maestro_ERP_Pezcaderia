// src/tests/differentialPricing.test.ts
// Pruebas TDD para el Motor de Precios Diferenciales y Reglas de Negocio: SPEC-040
// Fase RED: Pruebas unitarias de cálculo de tarifas, umbrales de volumen y margen mínimo

import { describe, it, expect } from 'vitest';
import { DifferentialPricingService } from '../services/differentialPricingService';
import type { LocalIndexedDbProduct } from '../types/indexedDb.types';

describe('TASK-040-05: DifferentialPricingService (Motor de Precios Duales)', () => {
  const service = new DifferentialPricingService();

  const productoEjemplo: LocalIndexedDbProduct = {
    sku: 'YALE-50MM',
    tenantId: 'tenant-03',
    nombre: 'CANDADO YALE HIERRO 50MM',
    categoria: 'CANDADOS',
    precioDetal: 50000,
    precioMayorista: 42000,
    cantidadMinimaMayorista: 6,
    costoBase: 35000,
    margenMinimoPct: 10, // Margen mínimo 10% sobre costo = $38.500
    stockDisponible: 100,
    activo: true,
    updatedAt: '2026-10-28T00:00:00Z',
  };

  describe('1. Resolución Automática Detal vs Mayorista por Cantidad', () => {
    it('debe aplicar precio detal si la cantidad es menor al umbral mayorista', () => {
      const calculo = service.calcularPrecioItem({
        producto: productoEjemplo,
        cantidad: 3, // < 6
        perfilCliente: 'DETAL',
      });

      expect(calculo.precioUnitarioFinal).toBe(50000);
      expect(calculo.tarifaAplicada).toBe('DETAL');
      expect(calculo.ahorroTotal).toBe(0);
      expect(calculo.subtotal).toBe(150000);
      expect(calculo.violaMargenMinimo).toBe(false);
    });

    it('debe conmutar automáticamente a precio mayorista al alcanzar o superar la cantidad mínima', () => {
      const calculo = service.calcularPrecioItem({
        producto: productoEjemplo,
        cantidad: 6, // == 6
        perfilCliente: 'DETAL',
      });

      expect(calculo.precioUnitarioFinal).toBe(42000);
      expect(calculo.tarifaAplicada).toBe('MAYORISTA');
      expect(calculo.ahorroTotal).toBe((50000 - 42000) * 6); // $48.000
      expect(calculo.subtotal).toBe(252000); // 6 * 42.000
      expect(calculo.violaMargenMinimo).toBe(false);
    });
  });

  describe('2. Aplicación de Tarifa por Perfil de Cliente B2B', () => {
    it('debe aplicar precio mayorista desde 1 sola unidad a clientes con perfil MAYORISTA o CONTRATISTA', () => {
      const perfilesMayoristas: ('MAYORISTA' | 'CONTRATISTA')[] = ['MAYORISTA', 'CONTRATISTA'];

      perfilesMayoristas.forEach((perfil) => {
        const calculo = service.calcularPrecioItem({
          producto: productoEjemplo,
          cantidad: 1, // 1 sola unidad
          perfilCliente: perfil,
        });

        expect(calculo.precioUnitarioFinal).toBe(42000);
        expect(calculo.tarifaAplicada).toBe('MAYORISTA');
        expect(calculo.ahorroTotal).toBe(8000);
        expect(calculo.subtotal).toBe(42000);
      });
    });
  });

  describe('3. Validación de Margen Mínimo y Control de Descuentos', () => {
    it('debe permitir descuentos manuales siempre que respeten el margen mínimo', () => {
      // Costo base = $35.000 + 10% = $38.500
      // Precio mayorista $42.000 con 5% desc = $39.900 (> $38.500) -> OK
      const calculo = service.calcularPrecioItem({
        producto: productoEjemplo,
        cantidad: 10,
        perfilCliente: 'MAYORISTA',
        descuentoManualPct: 5,
      });

      expect(calculo.precioUnitarioFinal).toBe(39900);
      expect(calculo.violaMargenMinimo).toBe(false);
      expect(calculo.requierePinSupervisor).toBe(false);
    });

    it('debe alertar y exigir PIN de supervisor si un descuento reduce el precio por debajo del margen mínimo', () => {
      // Precio mayorista $42.000 con 20% desc = $33.600 (< Costo base de $35.000) -> Alerta
      const calculo = service.calcularPrecioItem({
        producto: productoEjemplo,
        cantidad: 10,
        perfilCliente: 'MAYORISTA',
        descuentoManualPct: 20,
      });

      expect(calculo.precioUnitarioFinal).toBe(33600);
      expect(calculo.violaMargenMinimo).toBe(true);
      expect(calculo.requierePinSupervisor).toBe(true);
      expect(calculo.alertaMargen).toContain('Margen mínimo comprometido');
    });
  });

  describe('4. Productos sin Precio Mayorista Configurado', () => {
    it('debe mantener precio detal sin importar la cantidad si no tiene precio mayorista', () => {
      const productoSinMayorista: LocalIndexedDbProduct = {
        ...productoEjemplo,
        precioMayorista: 0, // no configurado
      };

      const calculo = service.calcularPrecioItem({
        producto: productoSinMayorista,
        cantidad: 100,
        perfilCliente: 'MAYORISTA',
      });

      expect(calculo.precioUnitarioFinal).toBe(50000);
      expect(calculo.tarifaAplicada).toBe('DETAL');
      expect(calculo.ahorroTotal).toBe(0);
    });
  });
});

