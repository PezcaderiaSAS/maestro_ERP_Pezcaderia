// src/tests/differentialPricing.schema.test.ts
// Suite TDD para Validación de Contratos y Esquemas Zod: SPEC-040
// Fase RED: Pruebas unitarias de Precios Diferenciales, Perfiles B2B, Cotizaciones e IndexedDB

import { describe, it, expect } from 'vitest';
import {
  DifferentialPricingSchema,
  CustomerPricingProfileSchema,
  B2BQuotationItemSchema,
  B2BQuotationSchema,
  QuotationToPosConversionSchema,
  TenantLocalDbConfigSchema,
} from '../schemas/differentialPricing.schema';

describe('TASK-040-01: Esquemas Zod de Precios Diferenciales y Cotizaciones B2B', () => {
  describe('1. DifferentialPricingSchema (Precios Duales y Umbrales)', () => {
    it('debe validar un esquema de precios duales correcto', () => {
      const validPricing = {
        sku: 'FERR-001',
        precioDetal: 45000,
        precioMayorista: 38000,
        cantidadMinimaMayorista: 6,
        costoBase: 28000,
        margenMinimoPct: 15,
      };

      const result = DifferentialPricingSchema.safeParse(validPricing);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.precioDetal).toBe(45000);
        expect(result.data.precioMayorista).toBe(38000);
        expect(result.data.cantidadMinimaMayorista).toBe(6);
      }
    });

    it('debe rechazar precios negativos o cantidad mínima menor a 1', () => {
      const invalidData = {
        sku: 'FERR-002',
        precioDetal: -100,
        precioMayorista: 30000,
        cantidadMinimaMayorista: 0,
      };

      const result = DifferentialPricingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.precioDetal).toBeDefined();
        expect(errors.cantidadMinimaMayorista).toBeDefined();
      }
    });

    it('debe rechazar precio mayorista superior al precio detal', () => {
      const invalidPricing = {
        sku: 'FERR-003',
        precioDetal: 20000,
        precioMayorista: 25000, // Mayorista no puede ser más caro que detal
        cantidadMinimaMayorista: 12,
      };

      const result = DifferentialPricingSchema.safeParse(invalidPricing);
      expect(result.success).toBe(false);
    });
  });

  describe('2. CustomerPricingProfileSchema (Perfiles Tarifarios de Clientes)', () => {
    it('debe validar perfiles válidos: DETAL, MAYORISTA, CONTRATISTA, INSTITUCIONAL', () => {
      const validProfiles = ['DETAL', 'MAYORISTA', 'CONTRATISTA', 'INSTITUCIONAL'];
      validProfiles.forEach((perfil) => {
        const result = CustomerPricingProfileSchema.safeParse({
          clienteId: 'cli-9550',
          perfil,
          limiteCredito: 5000000,
          diasPlazoCredito: 30,
        });
        expect(result.success).toBe(true);
      });
    });

    it('debe rechazar perfiles no reconocidos o límites de crédito negativos', () => {
      const result = CustomerPricingProfileSchema.safeParse({
        clienteId: 'cli-001',
        perfil: 'DESCONOCIDO',
        limiteCredito: -5000,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('3. B2BQuotationItemSchema (Ítems de Cotización B2B)', () => {
    it('debe validar un ítem con tarifa mayorista aplicada y descuento', () => {
      const validItem = {
        id: 'item-cot-01',
        productoSku: '0000',
        nombre: 'CANDADO YALE 50MM',
        cantidad: 12,
        precioUnitarioPactado: 38000,
        tarifaAplicada: 'MAYORISTA',
        descuentoPct: 5,
        subtotalItem: 433200, // 12 * 38000 * 0.95
      };

      const result = B2BQuotationItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
    });

    it('debe rechazar cantidades menores a 1 o descuentos mayores a 100%', () => {
      const invalidItem = {
        id: 'item-cot-02',
        productoSku: '0000',
        nombre: 'CANDADO YALE',
        cantidad: 0,
        precioUnitarioPactado: 40000,
        tarifaAplicada: 'DETAL',
        descuentoPct: 110,
        subtotalItem: 0,
      };

      const result = B2BQuotationItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });
  });

  describe('4. B2BQuotationSchema (Cotización Formal Completa)', () => {
    it('debe validar una cotización completa en estado EMITIDA con código COT-YYYY-XXXXX', () => {
      const validQuotation = {
        id: 'cot-2026-001',
        tenantId: 'tenant-03',
        codigoCotizacion: 'COT-2026-00042',
        clienteId: 'cli-mfl-ingenieros',
        asesorUsuarioId: 'usr-jeymy-vendedora',
        estado: 'EMITIDA',
        items: [
          {
            id: 'item-01',
            productoSku: '0000',
            nombre: 'CANDADO YALE',
            cantidad: 10,
            precioUnitarioPactado: 35000,
            tarifaAplicada: 'MAYORISTA',
            descuentoPct: 0,
            subtotalItem: 350000,
          },
        ],
        subtotal: 350000,
        totalDescuentos: 0,
        totalImpuestos: 66500,
        totalGeneral: 416500,
        diasVigencia: 15,
        fechaEmision: '2026-10-28T10:00:00Z',
        fechaVencimiento: '2026-11-12T10:00:00Z',
      };

      const result = B2BQuotationSchema.safeParse(validQuotation);
      expect(result.success).toBe(true);
    });

    it('debe rechazar cotizaciones con lista de ítems vacía', () => {
      const invalidQuotation = {
        id: 'cot-empty',
        tenantId: 'tenant-03',
        codigoCotizacion: 'COT-2026-00000',
        clienteId: 'cli-1',
        asesorUsuarioId: 'usr-1',
        estado: 'BORRADOR',
        items: [], // Vacío
        subtotal: 0,
        totalDescuentos: 0,
        totalImpuestos: 0,
        totalGeneral: 0,
        diasVigencia: 10,
        fechaEmision: new Date().toISOString(),
        fechaVencimiento: new Date().toISOString(),
      };

      const result = B2BQuotationSchema.safeParse(invalidQuotation);
      expect(result.success).toBe(false);
    });
  });

  describe('5. QuotationToPosConversionSchema (Conversión Atómica a Venta POS)', () => {
    it('debe validar el payload de conversión a preventa POS', () => {
      const conversionPayload = {
        cotizacionId: 'cot-2026-001',
        tenantId: 'tenant-03',
        bodegaId: 'bodega-josase-01',
        vendedorId: 'usr-jeymy',
        tipoPreventa: 'MOSTRADOR_B2B',
      };

      const result = QuotationToPosConversionSchema.safeParse(conversionPayload);
      expect(result.success).toBe(true);
    });
  });

  describe('6. TenantLocalDbConfigSchema (Configuración IndexedDB Multi-Tenant)', () => {
    it('debe validar el nombre determinista PezcaderiaERP_{tenantId}', () => {
      const config = {
        tenantId: 'tenant-03',
        dbName: 'PezcaderiaERP_tenant-03',
        version: 1,
      };

      const result = TenantLocalDbConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('debe rechazar nombres de base de datos que no sigan el formato PezcaderiaERP_{tenantId}', () => {
      const invalidConfig = {
        tenantId: 'tenant-03',
        dbName: 'base_de_datos_compartida',
        version: 1,
      };

      const result = TenantLocalDbConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });
  });
});

