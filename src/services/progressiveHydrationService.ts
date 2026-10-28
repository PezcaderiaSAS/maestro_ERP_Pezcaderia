// src/services/progressiveHydrationService.ts
// Servicio de Ingesta Progresiva por Lotes (Chunks) con Prioridad Pareto ABC (80/20)

import type { TenantIndexedDbService } from './tenantIndexedDbService';
import type { LocalIndexedDbProduct, LocalIndexedDbClient } from '../types/indexedDb.types';

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
}

