import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../lib/supabase';
import { queryClient as defaultQueryClient } from '../lib/queryClient';
import type { Product } from '../types/erp.types';

export const INVENTORY_QUERY_KEYS = {
  all: ['inventory'] as const,
  products: (empresaId?: string) => [...INVENTORY_QUERY_KEYS.all, 'products', empresaId] as const,
  stock: (bodegaId?: string) => [...INVENTORY_QUERY_KEYS.all, 'stock', bodegaId] as const,
  kardex: (productoId?: string) => [...INVENTORY_QUERY_KEYS.all, 'kardex', productoId] as const,
};

/**
 * Hook para consultar el catálogo de productos con sincronización en segundo plano.
 * Elimina la duplicación de miles de registros en la memoria RAM del navegador.
 */
export function useProductsQuery(empresaId = '00000000-0000-0000-0000-000000000001') {
  return useQuery(
    {
      queryKey: INVENTORY_QUERY_KEYS.products(empresaId),
      queryFn: async (): Promise<Product[]> => {
        try {
          const supabase = getSupabaseClient();
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('empresa_id', empresaId)
            .order('name', { ascending: true });

          if (error) {
            throw new Error(error.message);
          }

          return (data as unknown as Product[]) ?? [];
        } catch {
          // En entorno local/offline, fallback a localStorage/mock
          const cached = localStorage.getItem('erp_products_cache');
          if (cached) {
            try {
              return JSON.parse(cached);
            } catch {
              return [];
            }
          }
          return [];
        }
      },
      staleTime: 1000 * 30, // 30 segundos de frescura
      gcTime: 1000 * 60 * 5, // 5 minutos de retención en memoria
    },
    defaultQueryClient
  );
}

/**
 * Hook para consultar el stock disponible por bodega
 */
export function useStockQuery(bodegaId = 'Bodega Principal') {
  return useQuery(
    {
      queryKey: INVENTORY_QUERY_KEYS.stock(bodegaId),
      queryFn: async (): Promise<Record<string, number>> => {
        try {
          const supabase = getSupabaseClient();
          const { data, error } = await supabase
            .from('stock_bodegas')
            .select('producto_id, cantidad_disponible')
            .eq('bodega_id', bodegaId);

          if (error) throw new Error(error.message);

          const stockMap: Record<string, number> = {};
          for (const item of data || []) {
            stockMap[item.producto_id] = item.cantidad_disponible;
          }
          return stockMap;
        } catch {
          return {};
        }
      },
      staleTime: 1000 * 15, // Stock rota más rápido: 15s
      refetchOnWindowFocus: true, // Re-validar si el cajero regresa a la pestaña
    },
    defaultQueryClient
  );
}

/**
 * Hook utilitario para invalidar caché de inventario tras una mutación (ej. venta o recepción de compra)
 */
export function useInvalidateInventory() {
  return () => {
    defaultQueryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.all });
  };
}
