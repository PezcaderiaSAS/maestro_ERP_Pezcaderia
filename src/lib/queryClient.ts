import { QueryClient } from '@tanstack/react-query';

/**
 * Cliente global de TanStack Query v5 configurado para Enterprise ERP.
 * Optimizado para minimizar consumo de memoria RAM en terminales de bajo costo (POS / Bodegas)
 * y prevenir desincronizaciones en tiempo real.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 30 segundos de datos considerados "frescos" antes de re-validar
      staleTime: 1000 * 30,
      // 5 minutos de tiempo de retención en memoria RAM antes de recolectar basura (gcTime)
      gcTime: 1000 * 60 * 5,
      // Reintentar solo una vez antes de reportar error para no bloquear la UI
      retry: 1,
      // No re-consultar al cambiar de pestaña por defecto, salvo en tablas críticas
      refetchOnWindowFocus: false,
      // Reintentar automáticamente cuando se recupere la conexión a internet
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
