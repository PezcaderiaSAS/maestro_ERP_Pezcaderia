/**
 * src/tests/ferreteriaJosaseIngestionIsolation.test.ts
 * Pruebas de Ingesta ETL, Sanitización Zod y Aislamiento Multi-Tenant de Ferretería Josase (R1, R3)
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const importScript = require('../../scripts/data/import-ferreteria-josase.cjs');
const { FerreteriaClientSchema, FerreteriaItemSchema, TENANT_ID, TENANT_UUID } = importScript;

describe('R1: Ferretería Josase Ingestion & Multi-Tenant Isolation', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const clientesSqlPath = path.join(rootDir, 'database/40_seed_clientes_ferreteria_josase.sql');
  const itemsSqlPath = path.join(rootDir, 'database/41_seed_items_ferreteria_josase.sql');
  const clientesJsonPath = path.join(rootDir, 'src/data/clientes_ferreteria_josase.json');
  const itemsJsonPath = path.join(rootDir, 'src/data/items_ferreteria_josase.json');
  const stockJsonPath = path.join(rootDir, 'src/data/stock_ferreteria_josase.json');

  it('1. Valida que los scripts SQL generen inserciones con empresa_id estricto para aislamiento multi-tenant', () => {
    expect(fs.existsSync(clientesSqlPath)).toBe(true);
    expect(fs.existsSync(itemsSqlPath)).toBe(true);

    const clientesSql = fs.readFileSync(clientesSqlPath, 'utf-8');
    const itemsSql = fs.readFileSync(itemsSqlPath, 'utf-8');

    // 1.1 El script de clientes debe inyectar empresa_id = 'e3a1f820-2c7b-4d9a-9e1f-8a0b1c2d3e4f'
    expect(clientesSql).toContain('INSERT INTO public.terceros (id, empresa_id, nombre, identificacion, tipo_identificacion, tipo_tercero, activo)');
    expect(clientesSql).toContain(`'${TENANT_UUID}'`);

    // 1.2 El script de ítems debe inyectar empresa_id = 'e3a1f820-2c7b-4d9a-9e1f-8a0b1c2d3e4f'
    expect(itemsSql).toContain('INSERT INTO public.productos_catalogo (id, empresa_id, sku, nombre, categoria, unidad_medida, iva, iva_incluido, control_inventario, activo, categoria_abc, metadata)');
    expect(itemsSql).toContain(`'${TENANT_UUID}'`);

    // 1.3 Ningún INSERT debe omitir la columna empresa_id
    expect(clientesSql).not.toMatch(/INSERT INTO public\.terceros \(id, nombre/);
    expect(itemsSql).not.toMatch(/INSERT INTO public\.productos_catalogo \(id, sku/);
  });

  it('2. El esquema Zod FerreteriaClientSchema filtra el ID espurio "0" y rechaza datos basura', () => {
    // Casos inválidos: ID "0", duplicados vacíos o cadenas de ceros
    const casoZero1 = FerreteriaClientSchema.safeParse({ identificacion: '0', nombre: 'NO SIRVE' });
    expect(casoZero1.success).toBe(false);

    const casoZero2 = FerreteriaClientSchema.safeParse({ identificacion: '0', nombre: 'NN' });
    expect(casoZero2.success).toBe(false);

    const casoZero3 = FerreteriaClientSchema.safeParse({ identificacion: '0000', nombre: 'Prueba Ficticia' });
    expect(casoZero3.success).toBe(false);

    const casoVacio = FerreteriaClientSchema.safeParse({ identificacion: '', nombre: 'Sin Identificación' });
    expect(casoVacio.success).toBe(false);

    // Casos inválidos: Notación científica y cadenas de caracteres basura en identificación
    const casoCientifico = FerreteriaClientSchema.safeParse({ identificacion: '1.11111111111111e+46', nombre: 'CLIENTE PRUEBA' });
    expect(casoCientifico.success).toBe(false);

    const casoMashAlpha = FerreteriaClientSchema.safeParse({
      identificacion: 'FGMEDFGHEKJNGDLKMNHDFLFKGHNFLGKHNMFLGKHMNDLKMN',
      nombre: 'CLIENTE PRUEBA',
    });
    expect(casoMashAlpha.success).toBe(false);

    // Casos inválidos: Nombres basura y de prueba ("NO SIRVE", "NN", repeticiones)
    const casoNoSirve1 = FerreteriaClientSchema.safeParse({ identificacion: '2212', nombre: 'NO SIRVE NO SIRVE' });
    expect(casoNoSirve1.success).toBe(false);

    const casoNoSirve2 = FerreteriaClientSchema.safeParse({ identificacion: '999999999', nombre: 'NOSIRVE' });
    expect(casoNoSirve2.success).toBe(false);

    const casoNN = FerreteriaClientSchema.safeParse({ identificacion: '100000', nombre: 'NNNNNN NN' });
    expect(casoNN.success).toBe(false);

    const casoRepetido = FerreteriaClientSchema.safeParse({ identificacion: '888888', nombre: 'nnnnnn' });
    expect(casoRepetido.success).toBe(false);

    // Casos válidos de clientes reales
    const casoValido1 = FerreteriaClientSchema.safeParse({
      identificacion: '901475457',
      nombre: 'MFL INGENIEROS CONSULTORES CONSTRUCTORES S.A.S.',
    });
    expect(casoValido1.success).toBe(true);

    const casoValidoNitGuion = FerreteriaClientSchema.safeParse({
      identificacion: '900658832-0',
      nombre: 'CONSTRUCCIONES Y SUMINISTROS DE COLOMBIA SAS',
    });
    expect(casoValidoNitGuion.success).toBe(true);
    if (casoValidoNitGuion.success) {
      expect(casoValidoNitGuion.data.identificacion).toBe('900658832-0');
    }
  });

  it('3. El esquema Zod FerreteriaItemSchema preserva ceros a la izquierda en SKUs numéricos', () => {
    // Casos críticos con ceros a la izquierda que se romperían si se interpretan como Number
    const item1 = FerreteriaItemSchema.safeParse({
      sku: '0000',
      nombre: 'PARARRAYO / VARILLA COBRE 5/8',
      categoria: 'FERRETERIA',
    });
    expect(item1.success).toBe(true);
    if (item1.success) {
      expect(item1.data.sku).toBe('0000');
      expect(typeof item1.data.sku).toBe('string');
      expect(item1.data.sku.length).toBe(4);
    }

    const item2 = FerreteriaItemSchema.safeParse({
      sku: '00001102',
      nombre: 'TORNILLO DRYWALL 6X1',
      categoria: 'TORNILLERIA',
    });
    expect(item2.success).toBe(true);
    if (item2.success) {
      expect(item2.data.sku).toBe('00001102');
      expect(item2.data.sku.startsWith('0000')).toBe(true);
    }
  });

  it('4. Valida aislamiento multi-tenant estricto en los datasets JSON serializados', () => {
    expect(fs.existsSync(clientesJsonPath)).toBe(true);
    expect(fs.existsSync(itemsJsonPath)).toBe(true);
    expect(fs.existsSync(stockJsonPath)).toBe(true);

    const clientes = JSON.parse(fs.readFileSync(clientesJsonPath, 'utf-8'));
    const items = JSON.parse(fs.readFileSync(itemsJsonPath, 'utf-8'));
    const stock = JSON.parse(fs.readFileSync(stockJsonPath, 'utf-8'));

    // 4.1 Conteo exacto: 9.538 clientes y 5.351 ítems
    expect(clientes.length).toBe(9538);
    expect(items.length).toBe(5351);

    // 4.2 Cero contaminación: Ningún registro tiene tenant distinto a 'tenant-03'
    const clientesOtroTenant = clientes.filter((c: any) => c.tenantId !== 'tenant-03');
    expect(clientesOtroTenant.length).toBe(0);

    const itemsOtroTenant = items.filter((it: any) => it.tenantId !== 'tenant-03');
    expect(itemsOtroTenant.length).toBe(0);

    // 4.3 Cero presencia de ID "0" en clientes sanitizados
    const clientesConIdCero = clientes.filter((c: any) => c.identificacion === '0' || c.identificacion === '000');
    expect(clientesConIdCero.length).toBe(0);

    // 4.4 Cero presencia de registros de prueba basura ("NO SIRVE", "NN", repeticiones) o notación científica
    const clientesNoSirve = clientes.filter((c: any) => /NO\s*SIRVE|\bNN\b|^\s*(.)\1{4,}\s*$/i.test(c.nombre));
    expect(clientesNoSirve.length).toBe(0);

    const clientesCientificos = clientes.filter((c: any) => /[eE]\+\d+/.test(c.identificacion));
    expect(clientesCientificos.length).toBe(0);

    // 4.5 Todos los ítems tienen stockInicial = 100 asignado para Bodega Josase
    const todosConStock100 = items.every((it: any) => it.stockInicial === 100);
    expect(todosConStock100).toBe(true);

    expect(stock['bodega-josase-01']).toBeDefined();
    expect(Object.keys(stock['bodega-josase-01']).length).toBe(5351);
  });
});
