import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../lib/supabase';
import { queryClient as defaultQueryClient } from '../lib/queryClient';
import type { Cliente } from '../types/erp.types';
import * as localDb from '../services/localDb';

export const CLIENT_QUERY_KEYS = {
  all: ['clientes'] as const,
  list: (empresaId?: string) => [...CLIENT_QUERY_KEYS.all, 'list', empresaId] as const,
  detail: (id: string) => [...CLIENT_QUERY_KEYS.all, 'detail', id] as const,
  prices: (clientId?: string) => [...CLIENT_QUERY_KEYS.all, 'prices', clientId] as const,
};

/**
 * Hook para consultar el directorio de clientes con TanStack Query v5.
 * Proporciona caché multinivel y fallback offline transparente.
 */
export function useClientsQuery(empresaId = '00000000-0000-0000-0000-000000000001') {
  return useQuery(
    {
      queryKey: CLIENT_QUERY_KEYS.list(empresaId),
      queryFn: async (): Promise<Cliente[]> => {
        try {
          const supabase = getSupabaseClient();
          const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .eq('empresa_id', empresaId)
            .order('nombre', { ascending: true });

          if (error) throw new Error(error.message);
          return (data as unknown as Cliente[]) ?? [];
        } catch {
          // Fallback offline a localDb / localStorage
          const localClientes = localDb.load<Cliente[]>('clientes', []);
          return localClientes ?? [];
        }
      },
      staleTime: 1000 * 60, // 1 minuto de frescura
      gcTime: 1000 * 60 * 10, // 10 minutos de recolección de basura
    },
    defaultQueryClient
  );
}

/**
 * Hook para invalidar y refrescar clientes reactivamente
 */
export function useInvalidateClients() {
  return () => {
    defaultQueryClient.invalidateQueries({ queryKey: CLIENT_QUERY_KEYS.all });
  };
}
