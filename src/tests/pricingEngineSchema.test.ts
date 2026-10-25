import { describe, it, expect } from 'vitest';
import {
  CategoryWasteConfigSchema,
  ChannelMarginConfigSchema,
  PricingGlobalConfigSchema,
  ProductPricingSimulationInputSchema,
  PricingRecordSnapshotSchema,
} from '../../packages/validation-schemas/src/pricingEngine.schema';

describe('TASK-028-01: Esquemas Zod del Motor de Precios Dinámicos y Mermas', () => {
  describe('1. CategoryWasteConfigSchema', () => {
    it('debe validar exitosamente una configuración de merma por especie válida', () => {
      const validData = {
        id: 'waste-salmon-01',
        categoriaId: 'cat-salmon',
        nombreCategoria: 'Salmón y Pescado Graso',
        bufferDefaultPct: 10,
        mermaDespiecePct: 7,
        mermaDescongelacionGlaseoPct: 3,
        mermaCocinaViscerasPct: 0,
        descripcion: 'Buffer para salmón fresco importado',
      };

      const result = CategoryWasteConfigSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.bufferDefaultPct).toBe(10);
        expect(result.data.nombreCategoria).toBe('Salmón y Pescado Graso');
      }
    });

    it('debe rechazar un buffer de merma negativo o superior al 50%', () => {
      const negativeResult = CategoryWasteConfigSchema.safeParse({
        id: 'waste-err',
        categoriaId: 'cat-err',
        nombreCategoria: 'Inválido',
        bufferDefaultPct: -5,
      });
      expect(negativeResult.success).toBe(false);

      const excessiveResult = CategoryWasteConfigSchema.safeParse({
        id: 'waste-err',
        categoriaId: 'cat-err',
        nombreCategoria: 'Inválido',
        bufferDefaultPct: 55,
      });
      expect(excessiveResult.success).toBe(false);
    });
  });

  describe('2. ChannelMarginConfigSchema', () => {
    it('debe validar márgenes maestros por canal con valores por defecto', () => {
      const defaultData = {};
      const result = ChannelMarginConfigSchema.safeParse(defaultData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.margenPosPct).toBe(40);
        expect(result.data.margenRestaurantePct).toBe(30);
        expect(result.data.margenMayoristaPct).toBe(15);
        expect(result.data.margenMinimoSeguridadPct).toBe(10);
      }
    });

    it('debe rechazar márgenes menores a 1% o margen de seguridad negativo', () => {
      const invalidMargin = ChannelMarginConfigSchema.safeParse({
        margenPosPct: 0,
      });
      expect(invalidMargin.success).toBe(false);

      const invalidSecurity = ChannelMarginConfigSchema.safeParse({
        margenMinimoSeguridadPct: -1,
      });
      expect(invalidSecurity.success).toBe(false);
    });
  });

  describe('3. PricingGlobalConfigSchema', () => {
    it('debe validar una configuración global administrable completa', () => {
      const globalConfig = {
        id: 'cfg-pricing-global',
        version: '1.0.0',
        ultimaActualizacion: new Date().toISOString(),
        actualizadoPorUsuarioId: 'user-admin-01',
        redondeoEnteroCop: true,
        bloquearVentaBajoCosto: true,
        canales: {
          margenPosPct: 45,
          margenRestaurantePct: 35,
          margenMayoristaPct: 18,
          margenMinimoSeguridadPct: 12,
        },
        categoriasWaste: [
          {
            id: 'waste-1',
            categoriaId: 'cat-blanco',
            nombreCategoria: 'Pescado Blanco',
            bufferDefaultPct: 8,
          },
        ],
      };

      const result = PricingGlobalConfigSchema.safeParse(globalConfig);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.canales.margenPosPct).toBe(45);
        expect(result.data.categoriasWaste.length).toBe(1);
      }
    });
  });

  describe('4. ProductPricingSimulationInputSchema', () => {
    it('debe aceptar un input de simulación válido con régimen de IVA', () => {
      const input = {
        productoId: 'prod-salmon-01',
        costoCompraCop: 25000,
        categoriaId: 'cat-salmon',
        bufferPersonalizadoPct: 12,
        regimenIva: 'EXENTO_O_EXCLUIDO' as const,
      };

      const result = ProductPricingSimulationInputSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.costoCompraCop).toBe(25000);
        expect(result.data.bufferPersonalizadoPct).toBe(12);
        expect(result.data.regimenIva).toBe('EXENTO_O_EXCLUIDO');
      }
    });

    it('debe rechazar costos de compra menores o iguales a cero', () => {
      const zeroCost = ProductPricingSimulationInputSchema.safeParse({
        productoId: 'prod-01',
        costoCompraCop: 0,
        categoriaId: 'cat-01',
      });
      expect(zeroCost.success).toBe(false);

      const negativeCost = ProductPricingSimulationInputSchema.safeParse({
        productoId: 'prod-01',
        costoCompraCop: -100,
        categoriaId: 'cat-01',
      });
      expect(negativeCost.success).toBe(false);
    });
  });

  describe('5. PricingRecordSnapshotSchema', () => {
    it('debe validar un snapshot inmutable de auditoría completo', () => {
      const snapshot = {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        productoId: 'prod-salmon-01',
        sku: 'SALM-001',
        nombreProducto: 'Salmón Fresco Chileno',
        vigenciaDesde: new Date().toISOString(),
        costoCompraCop: 20000,
        bufferEfectivoPct: 10,
        costoAjustadoCop: 22000,
        regimenIva: 'EXENTO_O_EXCLUIDO' as const,
        precioPosCop: 30800,
        precioRestauranteCop: 28600,
        precioMayoristaCop: 25300,
        margenPosCop: 8800,
        margenRestauranteCop: 6600,
        margenMayoristaCop: 3300,
        margenPosPct: 28.57,
        margenRestaurantePct: 23.08,
        margenMayoristaPct: 13.04,
        motivoCambio: 'Ajuste de costo base por temporada de captura',
        usuarioId: 'usr-admin-1',
        usuarioNombre: 'Gerente General',
        excepcionAutorizada: false,
      };

      const result = PricingRecordSnapshotSchema.safeParse(snapshot);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.costoAjustadoCop).toBe(22000);
        expect(result.data.precioPosCop).toBe(30800);
      }
    });

    it('debe rechazar un snapshot con motivo de cambio menor a 3 caracteres', () => {
      const invalidSnapshot = {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        productoId: 'prod-01',
        sku: 'SKU-01',
        nombreProducto: 'Test',
        vigenciaDesde: new Date().toISOString(),
        costoCompraCop: 10000,
        bufferEfectivoPct: 5,
        costoAjustadoCop: 10500,
        regimenIva: 'EXENTO_O_EXCLUIDO' as const,
        precioPosCop: 15000,
        precioRestauranteCop: 14000,
        precioMayoristaCop: 12000,
        margenPosCop: 4500,
        margenRestauranteCop: 3500,
        margenMayoristaCop: 1500,
        margenPosPct: 30,
        margenRestaurantePct: 25,
        margenMayoristaPct: 12.5,
        motivoCambio: 'ok', // Demasiado corto (<3)
        usuarioId: 'usr-1',
        usuarioNombre: 'Admin',
      };

      const result = PricingRecordSnapshotSchema.safeParse(invalidSnapshot);
      expect(result.success).toBe(false);
    });
  });
});
