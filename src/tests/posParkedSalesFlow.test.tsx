import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ParkedOrdersBar } from '../views/pos/components/ParkedOrdersBar';
import { CartPanel } from '../views/pos/components/CartPanel';
import { PosDraftService } from '../services/posDraftService';
import type { CartDraft, LineaVenta } from '../types/pos.types';

describe('Flujo de Ventas en Espera (Parked Orders & Multi-Client)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('debe renderizar la barra ParkedOrdersBar con la venta activa y los clientes en espera', () => {
    const mockDrafts: CartDraft[] = [
      {
        id: 'DRAFT-1',
        alias: 'Cliente 1 (Don Pedro)',
        total: 45000,
        fechaGuardado: new Date().toISOString(),
        descuentoGlobal: 0,
        lineas: [
          {
            productoId: 'p-1',
            sku: 'SAL-001',
            nombre: 'Salmón Noruego',
            cantidad: 1.5,
            unidad: 'KG',
            precioLista: 30000,
            descuentoPct: 0,
            precioFinal: 30000,
            totalLinea: 45000,
            precioCompra: 20000,
            esPesoManual: false,
          },
        ],
      },
    ];

    render(
      <ParkedOrdersBar
        drafts={mockDrafts}
        activeDraftId={null}
        currentItemsCount={2}
        currentTotal={80000}
        onSelectDraft={() => {}}
        onDeleteDraft={() => {}}
        onNewParkedSale={() => {}}
      />
    );

    expect(screen.getByText('Ventas en Espera & Multicliente')).toBeInTheDocument();
    expect(screen.getByText(/Venta Activa/i)).toBeInTheDocument();
    expect(screen.getByText(/2 ítems/i)).toBeInTheDocument();
    expect(screen.getByText('Cliente 1 (Don Pedro)')).toBeInTheDocument();
    expect(screen.getByText('$45.000')).toBeInTheDocument();
  });

  it('debe permitir hacer clic en una venta en espera para seleccionarla y retomarla', () => {
    const onSelectDraft = vi.fn();
    const mockDraft: CartDraft = {
      id: 'DRAFT-ABC',
      alias: 'Mesa 4 Terraza',
      total: 120000,
      descuentoGlobal: 0,
      fechaGuardado: new Date().toISOString(),
      lineas: [],
    };

    render(
      <ParkedOrdersBar
        drafts={[mockDraft]}
        activeDraftId={null}
        currentItemsCount={0}
        currentTotal={0}
        onSelectDraft={onSelectDraft}
        onDeleteDraft={() => {}}
        onNewParkedSale={() => {}}
      />
    );

    const draftChip = screen.getByText('Mesa 4 Terraza');
    fireEvent.click(draftChip);

    expect(onSelectDraft).toHaveBeenCalledWith(mockDraft);
  });

  it('debe permitir solicitar suspender la venta actual e iniciar una nueva venta limpia', () => {
    const onNewParkedSale = vi.fn();

    render(
      <ParkedOrdersBar
        drafts={[]}
        activeDraftId={null}
        currentItemsCount={3}
        currentTotal={65000}
        onSelectDraft={() => {}}
        onDeleteDraft={() => {}}
        onNewParkedSale={onNewParkedSale}
      />
    );

    const newSaleBtn = screen.getByRole('button', { name: /suspender & nueva venta/i });
    fireEvent.click(newSaleBtn);

    expect(onNewParkedSale).toHaveBeenCalled();
  });

  it('debe persistir un borrador usando PosDraftService y poder recuperarlo en el ciclo de compra de 2 clientes', async () => {
    // 1. Cliente 1 compra 2 kg de Corvina y no paga todavía
    const cliente1Draft: CartDraft = {
      id: 'CLI-1-CORV',
      alias: 'Cliente 1 (Esperando efectivo)',
      total: 56000,
      descuentoGlobal: 0,
      fechaGuardado: new Date().toISOString(),
      lineas: [
        {
          productoId: 'p-corv',
          sku: 'CORV-001',
          nombre: 'Corvina Entera',
          cantidad: 2,
          unidad: 'KG',
          precioLista: 28000,
          descuentoPct: 0,
          precioFinal: 28000,
          totalLinea: 56000,
          precioCompra: 18000,
          esPesoManual: false,
        },
      ],
    };

    await PosDraftService.saveDraft(cliente1Draft);

    // Verificamos que se guardó localmente
    const draftsGuardados = PosDraftService.getLocalDrafts();
    expect(draftsGuardados.some((d) => d.id === 'CLI-1-CORV')).toBe(true);

    // 2. Llega Cliente 2, se atiende y se cobra (mostrador libre)
    // 3. Regresa Cliente 1, se retoma el borrador y se resuelve como RECUPERADO
    await PosDraftService.resolveDraft('CLI-1-CORV', 'RECUPERADO');

    const draftsRestantes = PosDraftService.getLocalDrafts();
    expect(draftsRestantes.some((d) => d.id === 'CLI-1-CORV')).toBe(false);
  });
});
