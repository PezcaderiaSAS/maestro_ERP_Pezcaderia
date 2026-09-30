import { describe, it, expect, vi } from 'vitest';
import { queryClient } from '../lib/queryClient';
import { INVENTORY_QUERY_KEYS } from '../hooks/useInventoryQueries';
import { edgeFunctionService } from '../services/edgeFunctionService';

// Mock de Supabase para pruebas aisladas
vi.mock('../lib/supabase', () => ({
  getSupabaseClient: vi.fn(() => ({
    functions: {
      invoke: vi.fn().mockImplementation((fnName: string) => {
        if (fnName === 'pos-checkout-orchestrator') {
          return Promise.resolve({
            data: {
              venta_id: '01923e45-789a-7b3c-8d1e-2f3a4b5c6d7e',
              consecutivo: 'POS-001',
              fecha_transaccion: '2026-09-30T14:00:00Z',
              total: 55000,
              factura_electronica_estado: 'ENCOLADA',
            },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    },
  })),
}));

describe('Arquitectura SaaS: TanStack Query & Edge Functions Integration', () => {
  describe('QueryClient Global Configuration', () => {
    it('debe tener configurado staleTime de 30 segundos para optimizar RAM', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      expect(defaultOptions.queries?.staleTime).toBe(30000);
    });

    it('debe tener configurado gcTime de 5 minutos para recolección de basura de memoria', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      expect(defaultOptions.queries?.gcTime).toBe(300000);
    });

    it('debe limitar los reintentos automáticos a 1 para evitar saturar redes POS', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      expect(defaultOptions.queries?.retry).toBe(1);
    });
  });

  describe('INVENTORY_QUERY_KEYS Namespace', () => {
    it('debe generar jerarquías de claves de consulta consistentes y aisladas por tenant', () => {
      const tenantId = '00000000-0000-0000-0000-000000000001';
      const key = INVENTORY_QUERY_KEYS.products(tenantId);
      expect(key).toEqual(['inventory', 'products', tenantId]);
    });

    it('debe segmentar claves de stock por bodega', () => {
      const key = INVENTORY_QUERY_KEYS.stock('Cuarto Frio 1');
      expect(key).toEqual(['inventory', 'stock', 'Cuarto Frio 1']);
    });
  });

  describe('EdgeFunctionService: Desacople de Lógica Comercial', () => {
    it('debe invocar la Edge Function pos-checkout-orchestrator y retornar payload estructurado', async () => {
      const payload = {
        empresa_id: '00000000-0000-0000-0000-000000000001',
        caja_id: 'caja-principal',
        turno_id: 'turno-001',
        items: [
          {
            producto_id: 'p1',
            sku: 'ROB-01',
            nombre: 'Róbalo Entero',
            cantidad: 2,
            precio_unitario: 25000,
            subtotal: 50000,
            descuento: 0,
            iva: 5000,
          },
        ],
        metodo_pago: 'EFECTIVO' as const,
        monto_recibido: 60000,
        cambio: 5000,
        total_venta: 55000,
        requiere_factura_electronica: true,
      };

      const result = await edgeFunctionService.procesarVentaPOS(payload);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.data?.consecutivo).toBe('POS-001');
      expect(result.data?.factura_electronica_estado).toBe('ENCOLADA');
    });
  });
});
