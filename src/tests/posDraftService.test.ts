import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PosDraftService } from '../services/posDraftService';
import { load, save } from '../services/localDb';
import type { CartDraft, LineaVenta } from '../types/pos.types';

// Mock getSupabaseClient
vi.mock('../lib/supabase', () => ({
  getSupabaseClient: vi.fn(() => ({
    rpc: vi.fn().mockResolvedValue({ data: 'mock-uuid', error: null }),
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'remote-uuid-1',
            alias: 'Cliente Remoto Mostrador',
            lineas: [
              {
                productoId: 'p-1',
                sku: 'SALM-01',
                nombre: 'Salmón Premium',
                cantidad: 2,
                unidad: 'KG',
                precioLista: 45000,
                descuentoPct: 0,
                precioFinal: 45000,
                totalLinea: 90000,
                precioCompra: 30000,
                esPesoManual: false,
              },
            ],
            descuento_global: 5,
            total_estimado: 85500,
            creado_en: '2026-09-30T10:00:00.000Z',
          },
        ],
        error: null,
      }),
    }),
  })),
}));

describe('PosDraftService - Persistencia y Sincronización de Borradores', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const sampleDraft: CartDraft = {
    id: 'local-draft-101',
    alias: 'Mesa 4 Terraza',
    lineas: [
      {
        productoId: 'prod-trucha',
        sku: 'TRUC-01',
        nombre: 'Trucha Arcoíris',
        cantidad: 1.5,
        unidad: 'KG',
        precioLista: 28000,
        descuentoPct: 0,
        precioFinal: 28000,
        totalLinea: 42000,
        precioCompra: 18000,
        esPesoManual: true,
      },
    ],
    descuentoGlobal: 0,
    total: 42000,
    fechaGuardado: new Date().toISOString(),
    cart: [],
  };

  it('guarda un borrador localmente y lo recupera con getLocalDrafts', async () => {
    await PosDraftService.saveDraft(sampleDraft);

    const drafts = PosDraftService.getLocalDrafts();
    expect(drafts).toHaveLength(1);
    expect(drafts[0].alias).toBe('Mesa 4 Terraza');
    expect(drafts[0].total).toBe(42000);
  });

  it('actualiza un borrador existente si se llama saveDraft con el mismo ID', async () => {
    await PosDraftService.saveDraft(sampleDraft);

    const updatedDraft: CartDraft = {
      ...sampleDraft,
      alias: 'Mesa 4 Terraza (Modificado)',
      total: 50000,
    };

    await PosDraftService.saveDraft(updatedDraft);

    const drafts = PosDraftService.getLocalDrafts();
    expect(drafts).toHaveLength(1);
    expect(drafts[0].alias).toBe('Mesa 4 Terraza (Modificado)');
    expect(drafts[0].total).toBe(50000);
  });

  it('elimina un borrador cuando se resuelve como descartado', async () => {
    await PosDraftService.saveDraft(sampleDraft);
    expect(PosDraftService.getLocalDrafts()).toHaveLength(1);

    await PosDraftService.resolveDraft(sampleDraft.id, 'DESCARTADO');
    expect(PosDraftService.getLocalDrafts()).toHaveLength(0);
  });

  it('sincroniza pedidos remotos desde Supabase y los combina con la base local', async () => {
    await PosDraftService.saveDraft(sampleDraft);

    const allDrafts = await PosDraftService.fetchRemoteDrafts();
    expect(allDrafts.length).toBeGreaterThanOrEqual(2);

    const remoteFound = allDrafts.find((d) => d.id === 'remote-uuid-1');
    expect(remoteFound).toBeDefined();
    expect(remoteFound?.alias).toBe('Cliente Remoto Mostrador');
  });
});
