/**
 * scripts/data/import-ferreteria-josase.cjs
 * Script de Procesamiento y Carga Masiva de Clientes e Inventario para Ferretería Josase
 * Parsea los Excel en Raw_Datos/Rwa_Ferreteria/ y genera datos normalizados con stock inicial = 100.
 */

const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const ROOT_DIR = path.resolve(__dirname, '../../');
const CLIENTS_XLSX = path.join(ROOT_DIR, 'Raw_Datos/Rwa_Ferreteria/Raw_Clientes_Ferreteria/Clientes_ferreteria.xlsx');
const ITEMS_XLSX = path.join(ROOT_DIR, 'Raw_Datos/Rwa_Ferreteria/Raw_Items/raw_items_ferreteria.xlsx');

const DATA_DIR = path.join(ROOT_DIR, 'src/data');
const DATABASE_DIR = path.join(ROOT_DIR, 'database');

const TENANT_ID = 'tenant-03';
const TENANT_UUID = 'e3a1f820-2c7b-4d9a-9e1f-8a0b1c2d3e4f';

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

    const rawNit = row.getCell(1).value;
    const rawNombre = row.getCell(2).value;

    if (!rawNit || !rawNombre) {
      skipped++;
      return;
    }

    const nit = String(rawNit).trim().replace(/\s+/g, '');
    const nombre = String(rawNombre).trim().replace(/\s+/g, ' ');

    if (!nit || !nombre || seenNits.has(nit)) {
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

    const tipo = String(row.getCell(1).value || 'Producto').trim();
    const rawSku = row.getCell(2).value;
    const rawNombre = row.getCell(3).value;
    const rawCat = row.getCell(4).value;
    const rawEstado = row.getCell(5).value;
    const rawImpuesto = row.getCell(6).value;

    if (!rawSku || !rawNombre) {
      skipped++;
      return;
    }

    const sku = String(rawSku).trim();
    const nombre = String(rawNombre).trim().replace(/\s+/g, ' ');

    if (!sku || !nombre || seenSkus.has(sku)) {
      skipped++;
      return;
    }

    seenSkus.add(sku);

    const categoria = rawCat ? String(rawCat).trim() : 'FERRETERIA';
    const estado = rawEstado ? String(rawEstado).trim().toLowerCase() : 'activo';
    const impuestoStr = rawImpuesto ? String(rawImpuesto).trim() : '';
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
      },
      tenantId: TENANT_ID,
    });
  });

  console.log(`✅ Ítems parseados con éxito: ${items.length} (Omitidos/Vacíos: ${skipped})`);
  return items;
}

function generateSqlSeeds(clientes, items) {
  console.log('📝 Generando scripts SQL para Supabase...');

  // 1. SQL Clientes
  let sqlClientes = `-- ==============================================================================
-- SEED 40: CLIENTES FERRETERÍA JOSASE (TOTAL: ${clientes.length})
-- ==============================================================================

`;
  
  const CHUNK_SIZE = 500;
  for (let i = 0; i < clientes.length; i += CHUNK_SIZE) {
    const chunk = clientes.slice(i, i + CHUNK_SIZE);
    sqlClientes += `INSERT INTO public.terceros (id, nombre, identificacion, tipo_identificacion, tipo_tercero, activo) VALUES\n`;
    const rows = chunk.map(c => 
      `  (gen_random_uuid(), ${escapeSql(c.nombre)}, ${escapeSql(c.identificacion)}, ${escapeSql(c.tipoIdentificacion)}, 'CLIENTE', true)`
    );
    sqlClientes += rows.join(',\n') + '\nON CONFLICT (identificacion) DO NOTHING;\n\n';
  }

  const clientesSqlPath = path.join(DATABASE_DIR, '40_seed_clientes_ferreteria_josase.sql');
  fs.writeFileSync(clientesSqlPath, sqlClientes, 'utf-8');
  console.log('  ✓ Archivo SQL generado:', path.relative(ROOT_DIR, clientesSqlPath));

  // 2. SQL Items / Productos Catálogo
  let sqlItems = `-- ==============================================================================
-- SEED 41: PRODUCTOS E INVENTARIO FERRETERÍA JOSASE (TOTAL: ${items.length})
-- STOCK INICIAL: 100 PARA TODOS LOS ÍTEMS
-- ==============================================================================

`;

  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE);
    sqlItems += `INSERT INTO public.productos_catalogo (id, sku, nombre, categoria, unidad_medida, iva, iva_incluido, control_inventario, activo, categoria_abc, metadata) VALUES\n`;
    const rows = chunk.map(it => 
      `  (gen_random_uuid(), ${escapeSql(it.sku)}, ${escapeSql(it.nombre)}, ${escapeSql(it.categoria)}, 'und', ${it.iva}, true, true, ${it.activo}, 'B', ${escapeSql(JSON.stringify(it.metadata))}::jsonb)`
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

main().catch(err => {
  console.error('❌ Error durante la importación:', err);
  process.exit(1);
});

