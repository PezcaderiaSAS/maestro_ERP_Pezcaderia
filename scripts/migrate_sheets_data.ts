// scripts/migrate_sheets_data.ts
// Script de migración y normalización de datos históricos desde Google Sheets a Supabase

import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Cargar variables de entorno (pueden venir de un archivo .env o del entorno)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tu-proyecto.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SPREADSHEET_ID = '1iHL1yGxnJ27v2s393vAPyABQZ4Lb9Fo0BZ181FlPIZg';

// Inicializar cliente de Supabase con Service Role Key (para bypass RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface ClienteRow {
    identificacion: string;
    nombre: string;
    tipoPersona: 'NATURAL' | 'JURIDICA';
    tipoIdentificacion: 'CC' | 'NIT' | 'CE';
    direccion: string;
    celular: string;
    email: string;
    ciudad: string;
    tipoPrecio: 'POS' | 'RESTAURANTE' | 'MAYORISTA';
    vendedorEmail?: string;
}

interface ProductoRow {
    sku: string;
    nombre: string;
    categoria: string;
    precioCompra: number;
    precioVentaPos: number;
    precioVentaRestaurante: number;
    precioVentaMayorista: number;
}

// Función auxiliar para normalizar identificaciones fiscales (limpiar espacios, guiones, puntos)
function normalizarIdentificacion(idStr: string): string {
    return idStr.replace(/[\s\.\-\,]/g, '').trim();
}

// Helper para parsear CSV manual robusto (evitando dependencias externas pesadas)
function parseCSV(csvText: string): string[][] {
    const lines = csvText.split('\n');
    return lines.map(line => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    }).filter(row => row.length > 0 && row.some(cell => cell !== ''));
}

// 1. OBTENER Y PROCESAR CLIENTES
async function migrarClientes() {
    console.log('--- Iniciando Migración de Clientes ---');
    try {
        // Consultar exportación CSV de la pestaña 'CLIENTES'
        // NOTA: Se asume que la hoja está compartida para lectura. Si no, se puede leer un archivo local.
        const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=CLIENTES`;
        const response = await axios.get(url);
        const rows = parseCSV(response.data);

        if (rows.length <= 1) {
            console.log('No se encontraron filas de clientes para migrar.');
            return;
        }

        // Buscar correspondencia de columnas basadas en el header
        const header = rows[0].map(h => h.toLowerCase().replace(/[\"]/g, ''));
        console.log('Cabeceras encontradas en Clientes:', header);

        const idxIdentificacion = header.findIndex(h => h.includes('identi') || h.includes('nit') || h.includes('cedula'));
        const idxNombre = header.findIndex(h => h.includes('nombre') || h.includes('razon'));
        const idxDireccion = header.findIndex(h => h.includes('direc'));
        const idxCelular = header.findIndex(h => h.includes('cel') || h.includes('tel'));
        const idxEmail = header.findIndex(h => h.includes('mail') || h.includes('correo'));
        const idxCiudad = header.findIndex(h => h.includes('ciudad') || h.includes('municip'));
        const idxPrecio = header.findIndex(h => h.includes('precio') || h.includes('tarifa'));
        const idxVendedor = header.findIndex(h => h.includes('vendedor') || h.includes('respons'));

        let contadorExito = 0;
        let contadorIgnorados = 0;

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i].map(cell => cell.replace(/^"|"$/g, '')); // Quitar comillas
            
            const rawId = row[idxIdentificacion] || '';
            const nombre = row[idxNombre] || '';
            
            if (!rawId || !nombre) {
                console.log(`Fila ${i} omitida por falta de Identificación o Nombre.`);
                continue;
            }

            const identificacion = normalizarIdentificacion(rawId);
            const tipoIdentificacion = identificacion.length >= 10 ? 'NIT' : 'CC';
            const tipoPersona = tipoIdentificacion === 'NIT' ? 'JURIDICA' : 'NATURAL';

            // Estandarizar tipo de precio
            let tipoPrecio: 'POS' | 'RESTAURANTE' | 'MAYORISTA' = 'POS';
            const rawPrecio = (row[idxPrecio] || '').toUpperCase();
            if (rawPrecio.includes('REST')) tipoPrecio = 'RESTAURANTE';
            if (rawPrecio.includes('MAYOR') || rawPrecio.includes('DISTRIB')) tipoPrecio = 'MAYORISTA';

            const clienteData: ClienteRow = {
                identificacion,
                nombre,
                tipoPersona,
                tipoIdentificacion,
                direccion: row[idxDireccion] || 'Sin dirección',
                celular: row[idxCelular] || '',
                email: row[idxEmail] || `${identificacion}@pezcaderia.com`,
                ciudad: row[idxCiudad] || 'Medellín',
                tipoPrecio,
                vendedorEmail: row[idxVendedor] || undefined
            };

            // 1. Buscar si ya existe el tercero
            const { data: existente } = await supabase
                .from('terceros')
                .select('id')
                .eq('identificacion', clienteData.identificacion)
                .single();

            let terceroId: string;

            if (existente) {
                console.log(`Tercero ya existe: ${clienteData.nombre} (${clienteData.identificacion}). Saltando inserción base.`);
                terceroId = existente.id;
            } else {
                // Insertar en tabla base terceros
                const { data: nuevoTercero, error: errTercero } = await supabase
                    .from('terceros')
                    .insert({
                        tipo_persona: clienteData.tipoPersona,
                        tipo_identificacion: clienteData.tipoIdentificacion,
                        identificacion: clienteData.identificacion,
                        nombre_razon_social: clienteData.nombre,
                        direccion: clienteData.direccion,
                        celular: clienteData.celular,
                        email: clienteData.email,
                        ciudad: clienteData.ciudad
                    })
                    .select('id')
                    .single();

                if (errTercero) {
                    console.error(`Error insertando tercero ${clienteData.nombre}:`, errTercero.message);
                    continue;
                }
                terceroId = nuevoTercero.id;
            }

            // 2. Insertar en tabla clientes si no está registrado
            const { data: clienteExistente } = await supabase
                .from('clientes')
                .select('id')
                .eq('id', terceroId)
                .single();

            if (!clienteExistente) {
                const { error: errCliente } = await supabase
                    .from('clientes')
                    .insert({
                        id: terceroId,
                        tipo_precio: clienteData.tipoPrecio
                    });

                if (errCliente) {
                    console.error(`Error registrando cliente ${clienteData.nombre}:`, errCliente.message);
                } else {
                    contadorExito++;
                }
            } else {
                contadorIgnorados++;
            }
        }

        console.log(`Migración de Clientes finalizada. Exitosos: ${contadorExito}, Ignorados/Duplicados: ${contadorIgnorados}`);

    } catch (error: any) {
        console.error('Falla crítica en migración de clientes:', error.message);
    }
}

// 2. OBTENER Y PROCESAR PRODUCTOS
async function migrarProductos() {
    console.log('--- Iniciando Migración de Productos ---');
    try {
        const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=PRODUCTOS`;
        const response = await axios.get(url);
        const rows = parseCSV(response.data);

        if (rows.length <= 1) {
            console.log('No se encontraron filas de productos para migrar.');
            return;
        }

        const header = rows[0].map(h => h.toLowerCase().replace(/[\"]/g, ''));
        console.log('Cabeceras encontradas en Productos:', header);

        const idxSku = header.findIndex(h => h.includes('sku') || h.includes('cod') || h.includes('id'));
        const idxNombre = header.findIndex(h => h.includes('nombre') || h.includes('descrip'));
        const idxCategoria = header.findIndex(h => h.includes('categ'));
        const idxCosto = header.findIndex(h => h.includes('costo') || h.includes('compra'));
        const idxPrecioPos = header.findIndex(h => h.includes('pos') || h.includes('venta'));
        const idxPrecioRest = header.findIndex(h => h.includes('rest'));
        const idxPrecioMayor = header.findIndex(h => h.includes('mayor'));

        let contadorExito = 0;
        let contadorIgnorados = 0;

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i].map(cell => cell.replace(/^"|"$/g, ''));

            const sku = row[idxSku] || '';
            const nombre = row[idxNombre] || '';

            if (!sku || !nombre) {
                console.log(`Fila ${i} omitida por falta de SKU o Nombre.`);
                continue;
            }

            // Convertir precios numéricos removiendo signos de pesos o separadores
            const parsePrecio = (val: string) => {
                const limpio = val.replace(/[\$\s\.\,\'\"]/g, '').trim();
                return limpio ? parseFloat(limpio) : 0.00;
            };

            const productoData: ProductoRow = {
                sku: sku.toUpperCase().trim(),
                nombre: nombre.trim(),
                categoria: row[idxCategoria] || 'General',
                precioCompra: parsePrecio(row[idxCosto] || '0'),
                precioVentaPos: parsePrecio(row[idxPrecioPos] || '0'),
                precioVentaRestaurante: parsePrecio(row[idxPrecioRest] || '0'),
                precioVentaMayorista: parsePrecio(row[idxPrecioMayor] || '0')
            };

            // Verificar si el SKU ya existe
            const { data: existente } = await supabase
                .from('productos')
                .select('id')
                .eq('sku', productoData.sku)
                .single();

            if (existente) {
                console.log(`Producto ya existe: SKU ${productoData.sku}. Saltando.`);
                contadorIgnorados++;
                continue;
            }

            // Insertar producto
            const { error: errProd } = await supabase
                .from('productos')
                .insert({
                    sku: productoData.sku,
                    nombre: productoData.nombre,
                    categoria: productoData.categoria,
                    precio_compra: productoData.precioCompra,
                    precio_venta_pos: productoData.precioVentaPos,
                    precio_venta_restaurante: productoData.precioVentaRestaurante,
                    precio_venta_mayorista: productoData.precioVentaMayorista
                });

            if (errProd) {
                console.error(`Error insertando producto ${productoData.sku}:`, errProd.message);
            } else {
                contadorExito++;
            }
        }

        console.log(`Migración de Productos finalizada. Exitosos: ${contadorExito}, Ignorados/Duplicados: ${contadorIgnorados}`);

    } catch (error: any) {
        console.error('Falla crítica en migración de productos:', error.message);
    }
}

// EJECUTAR MIGRACIONES CONSECUTIVAMENTE
async function ejecutarMigracion() {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY no configurado en variables de entorno.');
        process.exit(1);
    }
    await migrarClientes();
    await migrarProductos();
    console.log('--- Migración completa de La Pezcadería ERP finalizada ---');
}

ejecutarMigracion();
