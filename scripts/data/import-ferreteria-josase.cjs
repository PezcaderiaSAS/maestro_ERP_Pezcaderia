/**
 * scripts/data/import-ferreteria-josase.cjs
 * Script de Procesamiento y Carga Masiva de Clientes e Inventario para Ferretería Josase
 * Parsea los Excel en Raw_Datos/Rwa_Ferreteria/ y genera datos normalizados con stock inicial = 100.
 * Aislamiento Multi-Tenant estricto para tenant-03 / empresa_id: e3a1f820-2c7b-4d9a-9e1f-8a0b1c2d3e4f.
 */

const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const { z } = require('zod');

const ROOT_DIR = path.resolve(__dirname, '../../');
const CLIENTS_XLSX = path.join(ROOT_DIR, 'Raw_Datos/Rwa_Ferreteria/Raw_Clientes_Ferreteria/Clientes_ferreteria.xlsx');
const ITEMS_XLSX = path.join(ROOT_DIR, 'Raw_Datos/Rwa_Ferreteria/Raw_Items/raw_items_ferreteria.xlsx');

const DATA_DIR = path.join(ROOT_DIR, 'src/data');
const DATABASE_DIR = path.join(ROOT_DIR, 'database');

const TENANT_ID = 'tenant-03';
const TENANT_UUID = 'e3a1f820-2c7b-4d9a-9e1f-8a0b1c2d3e4f';

// Esquemas de validación Zod con sanitización profesional
const FerreteriaClientSchema = z.object({
  identificacion: z
    .string()
    .trim()
    .min(1, 'Identificación obligatoria')
    .refine((val) => val !== '0' && !/^0+$/.test(val), {
      message: 'Identificación "0" y duplicados de prueba no permitidos',
    })
    .refine((val) => !/[eE]\+\d+/.test(val) && !/^[a-zA-Z]{15,}$/.test(val), {
      message: 'NIT inválido o en notación científica/basura',
    }),
  nombre: z
    .string()
    .trim()
    .min(1, 'Nombre obligatorio')
    .refine((val) => !/NO\s*SIRVE|\bNN\b|^\s*(.)\1{4,}\s*$/i.test(val), {
      message: 'Registros de prueba y nombres basura no permitidos',
    }),
});

const FerreteriaItemSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(1, 'SKU requerido')
    .refine((val) => typeof val === 'string', {
      message: 'SKU debe preservarse estrictamente como String con ceros a la izquierda',
    }),
  nombre: z.string().trim().min(1, 'Nombre requerido'),
  categoria: z.string().trim().default('FERRETERIA'),
  tipo: z.string().trim().default('Producto'),
  impuesto: z.string().trim().optional(),
});

function escapeSql(str) {
  if (str === null || str === undefined) return "''";
  return "'" + String(str).replace(/'/g, "''") + "'";
}

async function processClientes() {
  console.log('📂 Procesando clientes desde:', path.relative(ROOT_DIR, CLIENTS_XLSX));
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(CLIENTS_XLSX);
  const ws = wb.worksheets[0];

  const clientes = [];
  const seenNits = new Set();
  let skipped = 0;

  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Cabecera

    // Bounded column access: estrictamente columnas 1 y 2 para prevenir desbordamiento de 16.384 columnas
    const cell1 = row.getCell(1);
    const cell2 = row.getCell(2);

    const rawNit = cell1.text || cell1.value;
    const rawNombre = cell2.text || cell2.value;

    if (!rawNit || !rawNombre) {
      skipped++;
      return;
    }

    const nit = String(rawNit).trim().replace(/\s+/g, '');
    const nombre = String(rawNombre).trim().replace(/\s+/g, ' ');

    const validation = FerreteriaClientSchema.safeParse({ identificacion: nit, nombre });
    if (!validation.success) {
      skipped++;
      return;
    }

    if (seenNits.has(nit)) {
      skipped++;
      return;
    }

    seenNits.add(nit);

    const isJuridica = /(S\.?A\.?S|LTDA|LIMITADA|S\.?A|S EN C|CIA|CORP|CONSTRUCTORES|INGENIEROS|DISTRIBUIDORA|SERVICIOS|INVERSIONES)/i.test(nombre);
    const tipoIdentificacion = nit.length > 8 || nit.includes('-') ? 'NIT' : 'CC';

    clientes.push({
      id: `cli-josase-${nit}`,
      nombre,
      identificacion: nit,
      tipoIdentificacion,
      tipoPersona: isJuridica ? 'JURIDICA' : 'NATURAL',
      direccion: 'Sede Comercial',
      telefono: '',
      email: '',
      ciudad: 'Bucaramanga',
      tipoPrecio: 'POS',
      cupoCredito: 0,
      cupoCreditoUsado: 0,
      isGranContribuyente: false,
      isAutoretenedor: false,
      activo: true,
      tenantId: TENANT_ID,
      empresaId: TENANT_UUID,
    });
  });

  console.log(`✅ Clientes parseados con éxito: ${clientes.length} (Omitidos/Vacíos: ${skipped})`);
  return clientes;
}

async function processItems() {
  console.log('📂 Procesando catálogo de inventario desde:', path.relative(ROOT_DIR, ITEMS_XLSX));
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(ITEMS_XLSX);
  const ws = wb.worksheets[0];

  const items = [];
  const seenSkus = new Set();
  let skipped = 0;

  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Cabecera

    // Bounded column access: estrictamente columnas 1 a 6 para prevenir desbordamiento de 16.384 columnas
    const cell1 = row.getCell(1);
    const cell2 = row.getCell(2);
    const cell3 = row.getCell(3);
    const cell4 = row.getCell(4);
    const cell5 = row.getCell(5);
    const cell6 = row.getCell(6);

    const rawTipo = cell1.text || cell1.value;
    const rawSku = cell2.text || cell2.value;
    const rawNombre = cell3.text || cell3.value;
    const rawCat = cell4.text || cell4.value;
    const rawEstado = cell5.text || cell5.value;
    const rawImpuesto = cell6.text || cell6.value;

    if (!rawSku || !rawNombre) {
      skipped++;
      return;
    }

    // Preservar estrictamente el SKU como String con ceros a la izquierda
    const sku = String(rawSku).trim();
    const nombre = String(rawNombre).trim().replace(/\s+/g, ' ');
    const tipo = rawTipo ? String(rawTipo).trim() : 'Producto';
    const categoria = rawCat ? String(rawCat).trim() : 'FERRETERIA';
    const impuestoStr = rawImpuesto ? String(rawImpuesto).trim() : '';

    const validation = FerreteriaItemSchema.safeParse({
      sku,
      nombre,
      categoria,
      tipo,
      impuesto: impuestoStr,
    });

    if (!validation.success) {
      skipped++;
      return;
    }

    if (seenSkus.has(sku)) {
      skipped++;
      return;
    }

    seenSkus.add(sku);

    const estado = rawEstado ? String(rawEstado).trim().toLowerCase() : 'activo';
    const iva = impuestoStr.includes('19') ? 19 : 0;

    items.push({
      id: `prod-josase-${sku}`,
      sku,
      nombre,
      categoria: categoria.toUpperCase(),
      tipo,
      unidadMedida: 'und',
      iva,
      ivaIncluido: true,
      control_inventario: true,
      produccion: false,
      precio_compra: 0,
      buffer_seguridad: 10,
      precio_venta_pos: 0,
      precio_venta_restaurante: 0,
      precio_venta_mayorista: 0,
      stockInicial: 100, // Mandato del usuario: stock inicial = 100 para todos los ítems
      activo: estado === 'activo',
      categoriaABC: 'B',
      metadata: {
        rubro: 'FERRETERIA',
        fuente: 'Siigo_Josase',
        tipoImpuesto: impuestoStr,
        tenantId: TENANT_ID,
        empresa_id: TENANT_UUID,
      },
      tenantId: TENANT_ID,
      empresaId: TENANT_UUID,
    });
  });

  console.log(`✅ Ítems parseados con éxito: ${items.length} (Omitidos/Vacíos: ${skipped})`);
  return items;
}

function generateSqlSeeds(clientes, items) {
  console.log('📝 Generando scripts SQL para Supabase...');

  // 1. SQL Clientes con empresa_id inyectado explícitamente para aislamiento estricto
  let sqlClientes = `-- ==============================================================================
-- SEED 40: CLIENTES FERRETERÍA JOSASE (TOTAL: ${clientes.length})
-- TENANT: ${TENANT_ID} | EMPRESA_ID: ${TENANT_UUID}
-- ==============================================================================

`;
  
  const CHUNK_SIZE = 500;
  for (let i = 0; i < clientes.length; i += CHUNK_SIZE) {
    const chunk = clientes.slice(i, i + CHUNK_SIZE);
    sqlClientes += `INSERT INTO public.terceros (id, empresa_id, nombre, identificacion, tipo_identificacion, tipo_tercero, activo) VALUES\n`;
    const rows = chunk.map(c => 
      `  (gen_random_uuid(), '${TENANT_UUID}', ${escapeSql(c.nombre)}, ${escapeSql(c.identificacion)}, ${escapeSql(c.tipoIdentificacion)}, 'CLIENTE', true)`
    );
    sqlClientes += rows.join(',\n') + '\nON CONFLICT (identificacion) DO NOTHING;\n\n';
  }

  const clientesSqlPath = path.join(DATABASE_DIR, '40_seed_clientes_ferreteria_josase.sql');
  fs.writeFileSync(clientesSqlPath, sqlClientes, 'utf-8');
  console.log('  ✓ Archivo SQL generado:', path.relative(ROOT_DIR, clientesSqlPath));

  // 2. SQL Items / Productos Catálogo con empresa_id inyectado explícitamente
  let sqlItems = `-- ==============================================================================
-- SEED 41: PRODUCTOS E INVENTARIO FERRETERÍA JOSASE (TOTAL: ${items.length})
-- TENANT: ${TENANT_ID} | EMPRESA_ID: ${TENANT_UUID}
-- STOCK INICIAL: 100 PARA TODOS LOS ÍTEMS
-- ==============================================================================

`;

  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE);
    sqlItems += `INSERT INTO public.productos_catalogo (id, empresa_id, sku, nombre, categoria, unidad_medida, iva, iva_incluido, control_inventario, activo, categoria_abc, metadata) VALUES\n`;
    const rows = chunk.map(it => 
      `  (gen_random_uuid(), '${TENANT_UUID}', ${escapeSql(it.sku)}, ${escapeSql(it.nombre)}, ${escapeSql(it.categoria)}, 'und', ${it.iva}, true, true, ${it.activo}, 'B', ${escapeSql(JSON.stringify(it.metadata))}::jsonb)`
    );
    sqlItems += rows.join(',\n') + '\nON CONFLICT (sku) DO NOTHING;\n\n';
  }

  const itemsSqlPath = path.join(DATABASE_DIR, '41_seed_items_ferreteria_josase.sql');
  fs.writeFileSync(itemsSqlPath, sqlItems, 'utf-8');
  console.log('  ✓ Archivo SQL generado:', path.relative(ROOT_DIR, itemsSqlPath));
}

async function main() {
  console.log('================================================================');
  console.log('🚀 IMPORTADOR DE DATOS REALES — FERRETERÍA JOSASE');
  console.log('================================================================\n');

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const clientes = await processClientes();
  const items = await processItems();

  // Guardar JSON para frontend y LocalDb
  const clientesJsonPath = path.join(DATA_DIR, 'clientes_ferreteria_josase.json');
  fs.writeFileSync(clientesJsonPath, JSON.stringify(clientes, null, 2), 'utf-8');
  console.log(`💾 JSON guardado: ${path.relative(ROOT_DIR, clientesJsonPath)} (${(fs.statSync(clientesJsonPath).size / 1024).toFixed(1)} KB)`);

  const itemsJsonPath = path.join(DATA_DIR, 'items_ferreteria_josase.json');
  fs.writeFileSync(itemsJsonPath, JSON.stringify(items, null, 2), 'utf-8');
  console.log(`💾 JSON guardado: ${path.relative(ROOT_DIR, itemsJsonPath)} (${(fs.statSync(itemsJsonPath).size / 1024).toFixed(1)} KB)`);

  // Generar Diccionario de Stock inicial (100 para cada ítem en Bodega Principal Josase y BOD-01)
  const stockMap = {
    'bodega-josase-01': {},
    'BOD-01': {},
  };
  items.forEach(it => {
    stockMap['bodega-josase-01'][it.sku] = 100;
    stockMap['BOD-01'][it.sku] = 100;
  });
  const stockJsonPath = path.join(DATA_DIR, 'stock_ferreteria_josase.json');
  fs.writeFileSync(stockJsonPath, JSON.stringify(stockMap, null, 2), 'utf-8');
  console.log(`💾 JSON Stock guardado: ${path.relative(ROOT_DIR, stockJsonPath)} (${(fs.statSync(stockJsonPath).size / 1024).toFixed(1)} KB)`);

  // Generar scripts SQL para Supabase
  generateSqlSeeds(clientes, items);

  console.log('\n================================================================');
  console.log(`🎉 PROCESO COMPLETADO EXITOSAMENTE`);
  console.log(`   - Clientes importados: ${clientes.length}`);
  console.log(`   - Ítems importados: ${items.length}`);
  console.log(`   - Stock inicial: 100 unidades asignadas a cada SKU`);
  console.log('================================================================\n');
}

module.exports = {
  processClientes,
  processItems,
  generateSqlSeeds,
  FerreteriaClientSchema,
  FerreteriaItemSchema,
  TENANT_ID,
  TENANT_UUID,
  main,
};

if (require.main === module) {
  main().catch(err => {
    console.error('❌ Error durante la importación:', err);
    process.exit(1);
  });
}
