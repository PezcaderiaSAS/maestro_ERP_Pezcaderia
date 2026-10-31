import { describe, it, expect } from 'vitest';
import { SEED_LIGHT_CLIENTES, SEED_LIGHT_PRODUCTOS, getSeedLightStock } from '../data/seedLightData.ts';
import { purgeConfigSchema, type PurgeConfig } from '../schemas/purgeConfig.schema.ts';

describe('TASK-049-01: Dataset Semilla Ligero Canónico y Esquemas Zod', () => {
  it('1. Debe contener exactamente 25 productos y 10 clientes canónicos (< 15KB en memoria)', () => {
    expect(SEED_LIGHT_CLIENTES).toHaveLength(10);
    expect(SEED_LIGHT_PRODUCTOS).toHaveLength(25);

    // Calcular tamaño aproximado en memoria JSON
    const jsonSize = JSON.stringify({ clientes: SEED_LIGHT_CLIENTES, productos: SEED_LIGHT_PRODUCTOS }).length;
    expect(jsonSize).toBeLessThan(15000); // Menos de 15 KB
  });

  it('2. Todos los clientes deben tener campos canónicos obligatorios y tipo de precio válido', () => {
    const tiposPermitidos = ['DETAL', 'RESTAURANTE', 'MAYORISTA'];
    for (const cli of SEED_LIGHT_CLIENTES) {
      expect(cli.id).toBeTruthy();
      expect(cli.nombre).toBeTruthy();
      expect(cli.identificacion).toBeTruthy();
      expect(tiposPermitidos).toContain(cli.tipoPrecio);
      expect(cli.activo).toBe(true);
    }

    // Verificar presencia de cliente consumidor final
    const consumidor = SEED_LIGHT_CLIENTES.find((c: any) => c.identificacion === '22222222');
    expect(consumidor).toBeDefined();
    expect(consumidor?.nombre).toContain('Consumidor Final');
  });

  it('3. Todos los productos deben tener SKU único, precios diferenciados y stock positivo asignado', () => {
    const skus = new Set<string>();
    const stockMap = getSeedLightStock();

    for (const prod of SEED_LIGHT_PRODUCTOS) {
      expect(prod.id).toBeTruthy();
      expect(prod.sku).toBeTruthy();
      expect(skus.has(prod.sku)).toBe(false);
      skus.add(prod.sku);

      expect(prod.precio_venta_pos).toBeGreaterThan(0);
      expect(prod.precio_venta_restaurante).toBeGreaterThan(0);
      expect(prod.precio_venta_mayorista).toBeGreaterThan(0);
      expect(prod.activo).toBe(true);

      // Stock asignado en almacén
      expect(stockMap[prod.sku]).toBeGreaterThanOrEqual(10);
    }
  });

  it('4. El esquema Zod purgeConfigSchema valida correctamente las opciones de purga', () => {
    const validConfig: PurgeConfig = {
      tenantId: 'tenant-03',
      limpiarRemotoSupabase: true,
      conservarSesionTurno: false,
      motivo: 'Reset manual de pruebas en desarrollo',
    };

    const parseResult = purgeConfigSchema.safeParse(validConfig);
    expect(parseResult.success).toBe(true);

    // Debe fallar con tenantId vacío
    const invalidConfig = { tenantId: '' };
    const failResult = purgeConfigSchema.safeParse(invalidConfig);
    expect(failResult.success).toBe(false);
  });
});
