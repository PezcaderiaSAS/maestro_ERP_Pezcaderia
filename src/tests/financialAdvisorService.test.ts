import { describe, it, expect, vi } from 'vitest';
import { FinancialAdvisorService } from '../services/financialAdvisorService';

describe('FinancialAdvisorService', () => {
  describe('calcularCostoAprovechable', () => {
    it('debe calcular el costo real correctamente con merma', () => {
      const cpp = 10000;
      const merma = 20; // 20%
      const costoAprovechable = FinancialAdvisorService.calcularCostoAprovechable(cpp, merma);
      expect(costoAprovechable).toBe(12500); // 10000 / (1 - 0.2) = 12500
    });

    it('debe devolver el mismo cpp si no hay merma', () => {
      expect(FinancialAdvisorService.calcularCostoAprovechable(10000, 0)).toBe(10000);
    });

    it('debe arrojar error si la merma es mayor o igual a 100', () => {
      expect(() => FinancialAdvisorService.calcularCostoAprovechable(10000, 100)).toThrow();
    });
  });

  describe('obtenerMargenObjetivo', () => {
    it('debe devolver margenes correctos según política ABC y Canal', () => {
      expect(FinancialAdvisorService.obtenerMargenObjetivo('A', 'POS')).toBe(50);
      expect(FinancialAdvisorService.obtenerMargenObjetivo('B', 'RESTAURANTE')).toBe(30);
      expect(FinancialAdvisorService.obtenerMargenObjetivo('C', 'MAYORISTA')).toBe(15);
    });
  });

  describe('desglosarIva', () => {
    it('debe desglosar IVA cuando está incluido (19%)', () => {
      // Precio 119, IVA 19%
      const { precio_base_sin_iva, cuota_iva } = FinancialAdvisorService.desglosarIva(119, 19, true);
      expect(precio_base_sin_iva).toBe(100);
      expect(cuota_iva).toBe(19);
    });

    it('debe calcular IVA cuando NO está incluido (5%)', () => {
      // Precio base 100, IVA 5%
      const { precio_base_sin_iva, cuota_iva, precio_total_con_iva } = FinancialAdvisorService.desglosarIva(100, 5, false);
      expect(precio_base_sin_iva).toBe(100);
      expect(cuota_iva).toBe(5);
      expect(precio_total_con_iva).toBe(105);
    });
  });

  describe('evaluarOfertaAvanzada', () => {
    it('debe evaluar correctamente una promoción 12+1', () => {
      const precioNormal = 13000;
      const costo = 10000;
      const resultado = FinancialAdvisorService.evaluarOfertaAvanzada('12_MAS_1', 0, precioNormal, costo);
      
      expect(resultado.precio_unitario_efectivo).toBe(12000); // 13000 * 12/13
      expect(resultado.utilidad_efectiva_cop).toBe(2000);
      expect(resultado.estado).not.toBe('PERDIDA');
    });

    it('debe alertar venta a pérdida en 2x1 si el costo es alto', () => {
      const precioNormal = 15000;
      const costo = 10000;
      // 2x1 significa precio efectivo = 7500.
      // Costo 10000 -> Utilidad -2500
      const resultado = FinancialAdvisorService.evaluarOfertaAvanzada('2X1', 0, precioNormal, costo);
      
      expect(resultado.precio_unitario_efectivo).toBe(7500);
      expect(resultado.utilidad_efectiva_cop).toBe(-2500);
      expect(resultado.estado).toBe('PERDIDA');
      expect(resultado.advertencia).toContain('pérdida');
    });
  });
});
