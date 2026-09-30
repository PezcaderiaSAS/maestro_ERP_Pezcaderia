import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../lib/supabase';
import { queryClient as defaultQueryClient } from '../lib/queryClient';
import type { Cotizacion } from '../store/useOrderStore';
export type Quotation = Cotizacion;
import * as localDb from '../services/localDb';

export const ORDER_QUERY_KEYS = {
  all: ['orders'] as const,
  quotations: (empresaId?: string) => [...ORDER_QUERY_KEYS.all, 'quotations', empresaId] as const,
  quotation: (id: string) => [...ORDER_QUERY_KEYS.all, 'quotation', id] as const,
};

/**
 * Hook para consultar cotizaciones y pedidos B2B con TanStack Query v5.
 */
export function useQuotationsQuery(empresaId = '00000000-0000-0000-0000-000000000001') {
  return useQuery(
    {
      queryKey: ORDER_QUERY_KEYS.quotations(empresaId),
      queryFn: async (): Promise<Quotation[]> => {
        try {
          const supabase = getSupabaseClient();
          const { data, error } = await supabase
            .from('quotations')
            .select('*')
            .eq('empresa_id', empresaId)
            .order('fecha', { ascending: false });

          if (error) throw new Error(error.message);
          return (data as unknown as Quotation[]) ?? [];
        } catch {
          // Fallback offline a localDb
          const localQuotations = localDb.load<Quotation[]>('quotations', []);
          return localQuotations ?? [];
        }
      },
      staleTime: 1000 * 30, // 30 segundos
      gcTime: 1000 * 60 * 5,
    },
    defaultQueryClient
  );
}

/**
 * Hook para invalidar y refrescar cotizaciones y pedidos B2B
 */
export function useInvalidateOrders() {
  return () => {
    defaultQueryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.all });
  };
}
