// src/services/progressiveHydrationService.ts
// Servicio de Ingesta Progresiva por Lotes (Chunks) con Prioridad Pareto ABC (80/20)

import type { TenantIndexedDbService } from './tenantIndexedDbService';
import type { LocalIndexedDbProduct, LocalIndexedDbClient } from '../types/indexedDb.types';
import { getSupabaseClient } from '../lib/supabase';

export interface HydrationProgress {
  loaded: number;
  total?: number;
  percentage: number;
}

export class ProgressiveHydrationService {
  constructor(private dbService: TenantIndexedDbService) {}

  /**
   * Hidrata progresivamente los ítems y clientes en IndexedDB en lotes de 1.000 sin bloquear el hilo principal
   */
  public async hydrateFromRawData(
    tenantId: string,
    rawItems: any[],
    rawClients: any[],
    onProgress?: (porcentaje: number) => void,
    chunkSize = 1000
  ): Promise<{
    productsCount: number;
    clientsCount: number;
    paretoCount: number;
  }> {
    const totalOps = rawItems.length + rawClients.length;
    let processedOps = 0;
    let paretoCount = 0;

    const reportProgress = () => {
      if (onProgress && totalOps > 0) {
        const pct = Math.min(100, Math.round((processedOps / totalOps) * 100));
        onProgress(pct);
      }
    };

    // 1. Normalización e Ingesta de Productos
    for (let i = 0; i < rawItems.length; i += chunkSize) {
      const slice = rawItems.slice(i, i + chunkSize);
      const normalizedProducts: LocalIndexedDbProduct[] = slice.map((item, idx) => {
        const absoluteIndex = i + idx;
        const isPareto = absoluteIndex < 100;
        if (isPareto) paretoCount++;

        return {
          sku: item.sku || `SKU-${absoluteIndex}`,
          tenantId,
          nombre: item.nombre || item.name || 'Sin Nombre',
          codigoBarras: item.codigo_barras || item.barcode || undefined,
          categoria: item.categoria || item.category || 'GENERAL',
          precioDetal: Number(item.precio_venta_pos || item.precioDetal || 0),
          precioMayorista: Number(
            item.precio_venta_mayorista || item.precioMayorista || item.precio_venta_pos || 0
          ),
          cantidadMinimaMayorista: Number(item.cantidad_minima_mayorista || 6),
          costoBase: item.costo_unitario ? Number(item.costo_unitario) : undefined,
          stockDisponible: Number(item.stock || item.stockInicial || 100),
          ubicacionPasillo: item.pasillo || item.ubicacion || undefined,
          esParetoTop100: isPareto,
          activo: item.activo !== false,
          updatedAt: new Date().toISOString(),
        };
      });

      await this.dbService.bulkUpsertProducts(normalizedProducts);
      processedOps += slice.length;
      reportProgress();

      // Ceder el control al event loop para no degradar la UI
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    // 2. Normalización e Ingesta de Clientes
    for (let i = 0; i < rawClients.length; i += chunkSize) {
      const slice = rawClients.slice(i, i + chunkSize);
      const normalizedClients: LocalIndexedDbClient[] = slice.map((cli, idx) => {
        const absoluteIndex = i + idx;
        const isPareto = absoluteIndex < 100;

        return {
          id: String(cli.id || cli.nit_o_cedula || `cli-${absoluteIndex}`),
          tenantId,
          razonSocialONombre: cli.razon_social || cli.nombre || 'Cliente General',
          nitOCedula: String(cli.nit || cli.documento || cli.cedula || `900${absoluteIndex}`),
          perfilPrecio: (cli.perfilPrecio as any) || (cli.tipo_cliente === 'MAYORISTA' ? 'MAYORISTA' : 'DETAL'),
          limiteCredito: cli.limiteCredito ? Number(cli.limiteCredito) : 0,
          contactoTelefono: cli.telefono || cli.celular || undefined,
          contactoEmail: cli.correo || cli.email || undefined,
          esParetoTop100: isPareto,
          updatedAt: new Date().toISOString(),
        };
      });

      await this.dbService.bulkUpsertClients(normalizedClients);
      processedOps += slice.length;
      reportProgress();

      // Ceder el control al event loop
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    if (onProgress) {
      onProgress(100);
    }

    return {
      productsCount: rawItems.length,
      clientsCount: rawClients.length,
      paretoCount,
    };
  }

  /**
   * Carga progresiva desde Supabase en bloques (chunks) para evitar el límite de 1.000 filas de PostgREST
   */
  public async hydrateProductsFromSupabase(
    tenantId: string,
    options?: {
      batchSize?: number;
      onProgress?: (progress: HydrationProgress) => void;
      tableOrView?: string;
      supabaseClient?: any;
    }
  ): Promise<{ totalLoaded: number; paretoCount: number }> {
    const supabase = options?.supabaseClient || getSupabaseClient();
    const batchSize = Math.min(options?.batchSize ?? 1000, 1000);
    const targetTable = options?.tableOrView || 'productos_unified';

    let offset = 0;
    let hasMore = true;
    let totalLoaded = 0;
    let paretoCount = 0;
    let totalCount: number | undefined;

    while (hasMore) {
      const from = offset;
      const to = offset + batchSize - 1;

      // Consulta paginada con rango HTTP PostgREST y orden determinista
      let query = supabase
        .from(targetTable)
        .select('*', offset === 0 ? { count: 'exact' } : undefined)
        .order('sku', { ascending: true })
        .range(from, to);

      let { data, count, error } = await query;

      // Fallback a productos_catalogo si productos_unified no está disponible
      if (error && targetTable === 'productos_unified') {
        console.warn('productos_unified no disponible, reintentando con productos_catalogo:', error);
        const fallbackRes = await supabase
          .from('productos_catalogo')
          .select('*', offset === 0 ? { count: 'exact' } : undefined)
          .order('sku', { ascending: true })
          .range(from, to);
        data = fallbackRes.data;
        count = fallbackRes.count;
        error = fallbackRes.error;
      }

      if (error) {
        throw new Error(`Error en hidratación de Supabase [${from}..${to}]: ${error.message || error}`);
      }

      if (offset === 0 && typeof count === 'number') {
        totalCount = count;
      }

      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }

      // Normalización de registros al contrato LocalIndexedDbProduct
      const normalizedProducts: LocalIndexedDbProduct[] = data.map((item: any, idx: number) => {
        const absoluteIndex = offset + idx;
        const isPareto = item.esParetoTop100 ?? (item.categoria_abc === 'A' || item.categoriaABC === 'A' || absoluteIndex < 100);
        if (isPareto) paretoCount++;

        return {
          sku: item.sku || `SKU-${absoluteIndex}`,
          tenantId,
          nombre: item.nombre || item.name || 'Sin Nombre',
          codigoBarras: item.codigo_barras || item.barcode || undefined,
          categoria: item.categoria || item.category || 'GENERAL',
          precioDetal: Number(item.precio_venta_pos || item.precioDetal || 0),
          precioMayorista: Number(
            item.precio_venta_mayorista || item.precioMayorista || item.precio_venta_pos || 0
          ),
          precioRestaurante: Number(
            item.precio_venta_restaurante || item.precioRestaurante || item.precio_venta_pos || 0
          ),
          cantidadMinimaMayorista: Number(item.cantidad_minima_mayorista || 6),
          costoBase: item.precio_compra || item.costo_unitario ? Number(item.precio_compra || item.costo_unitario) : undefined,
          margenMinimoPct: item.margenMinimoPct ? Number(item.margenMinimoPct) : undefined,
          stockDisponible: Number(item.stock || item.stockInicial || 0),
          ubicacionPasillo: item.pasillo || item.ubicacion || undefined,
          esParetoTop100: isPareto,
          tarifaIva: item.iva !== undefined ? Number(item.iva) : 19,
          ivaIncluido: item.iva_incluido !== false,
          unidadMedida: item.unidad_medida || 'und',
          activo: item.activo !== false,
          updatedAt: item.actualizado_en || new Date().toISOString(),
        };
      });

      // Inserción masiva del lote en IndexedDB
      await this.dbService.bulkUpsertProducts(normalizedProducts);

      totalLoaded += data.length;
      offset += data.length;

      // Reporte de progreso
      if (options?.onProgress) {
        const pct = totalCount && totalCount > 0
          ? Math.min(100, Math.round((totalLoaded / totalCount) * 100))
          : Math.min(100, Math.round((totalLoaded / 10000) * 100));
        options.onProgress({ loaded: totalLoaded, total: totalCount, percentage: pct });
      }

      if (data.length < batchSize) {
        hasMore = false;
      }

      // Ceder el hilo de ejecución para garantizar 60 FPS
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    return { totalLoaded, paretoCount };
  }
}

