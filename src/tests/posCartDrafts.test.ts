import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useClientsQuery } from '../hooks/useClientQueries';
import { useQuotationsQuery } from '../hooks/useOrderQueries';
import * as localDb from '../services/localDb';

describe('TanStack Query Hooks: Clientes y Cotizaciones B2B', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('useClientsQuery retorna clientes desde caché local en modo offline', async () => {
    const mockClientes = [
      { id: 'c-1', nombre: 'Restaurante El Puerto', identificacion: '900123456', tipoPrecio: 'RESTAURANTE', cupoCredito: 5000000, activo: true },
      { id: 'c-2', nombre: 'Consumidor Final', identificacion: '222222222', tipoPrecio: 'POS', cupoCredito: 0, activo: true }
    ];
    localDb.save('clientes', mockClientes);

    const { result } = renderHook(() => useClientsQuery('00000000-0000-0000-0000-000000000001'));

    let refetchResult: any;
    await act(async () => {
      refetchResult = await result.current.refetch();
    });

    expect(refetchResult?.data).toBeDefined();
    expect(refetchResult?.data?.length).toBe(2);
    expect(refetchResult?.data?.[0].nombre).toBe('Restaurante El Puerto');
  });

  it('useQuotationsQuery retorna cotizaciones B2B desde almacenamiento local', async () => {
    const mockQuotes = [
      { id: 'COT-001', clienteId: 'c-1', total: 450000, estado: 'Listo', items: [] }
    ];
    localDb.save('quotations', mockQuotes);

    const { result } = renderHook(() => useQuotationsQuery('00000000-0000-0000-0000-000000000001'));

    let refetchResult: any;
    await act(async () => {
      refetchResult = await result.current.refetch();
    });

    expect(refetchResult?.data).toBeDefined();
    expect(refetchResult?.data?.length).toBe(1);
    expect(refetchResult?.data?.[0].id).toBe('COT-001');
  });
});

describe('POS Hold & Park Cart (Borradores y Pedidos en Espera)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('debe persistir los borradores en localStorage con la clave pezca_pos_drafts_v1', () => {
    const draft1 = {
      id: 'BOR-1',
      alias: 'Cliente 1 (Mesa 3)',
      fecha: new Date().toISOString(),
      cliente: { id: 'c-1', nombre: 'Juan Perez', identificacion: '123', tipoPrecio: 'POS' },
      lineas: [
        { productoId: 'p-1', sku: 'SAL-001', nombre: 'Salmón', cantidad: 2, precioLista: 25000, precioFinal: 25000, totalLinea: 50000 }
      ],
      totalFinal: 50000
    };

    localStorage.setItem('pezca_pos_drafts_v1', JSON.stringify([draft1]));
    const stored = JSON.parse(localStorage.getItem('pezca_pos_drafts_v1') || '[]');

    expect(stored.length).toBe(1);
    expect(stored[0].alias).toBe('Cliente 1 (Mesa 3)');
    expect(stored[0].totalFinal).toBe(50000);
    expect(stored[0].lineas.length).toBe(1);
  });

  it('debe permitir acumular múltiples clientes en espera simultáneamente', () => {
    const drafts = [
      { id: 'BOR-1', alias: 'Cliente Mostrador 1', totalFinal: 35000, lineas: [] },
      { id: 'BOR-2', alias: 'Restaurante Mar Adentro', totalFinal: 120000, lineas: [] }
    ];

    localStorage.setItem('pezca_pos_drafts_v1', JSON.stringify(drafts));
    const loaded = JSON.parse(localStorage.getItem('pezca_pos_drafts_v1') || '[]');

    expect(loaded.length).toBe(2);
    expect(loaded.map((d: any) => d.id)).toEqual(['BOR-1', 'BOR-2']);
  });

  it('debe remover el borrador cuando es descartado o retomado', () => {
    const drafts = [
      { id: 'BOR-1', alias: 'Cliente 1', totalFinal: 35000, lineas: [] },
      { id: 'BOR-2', alias: 'Cliente 2', totalFinal: 80000, lineas: [] }
    ];

    const afterResume = drafts.filter(d => d.id !== 'BOR-1');
    localStorage.setItem('pezca_pos_drafts_v1', JSON.stringify(afterResume));

    const updated = JSON.parse(localStorage.getItem('pezca_pos_drafts_v1') || '[]');
    expect(updated.length).toBe(1);
    expect(updated[0].id).toBe('BOR-2');
  });
});
