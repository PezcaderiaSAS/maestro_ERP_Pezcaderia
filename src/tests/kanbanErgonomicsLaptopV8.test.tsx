import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import OrderKanbanView from '../views/OrderKanbanView';
import { CashierKanbanView } from '../views/pos/components/CashierKanbanView';
import { useOrderStore, setOrderDataService } from '../store/useOrderStore';
import { useCashierKanbanStore } from '../stores/useCashierKanbanStore';

describe('Kanban Ergonomics & Laptop Scroll Suite (TASK-038-08)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    setOrderDataService({
      getAll: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue(undefined),
    } as any);

    useOrderStore.setState({
      quotations: [
        {
          id: 'quote-k-1',
          numeroPedido: 'PED-K-001',
          clientName: 'Restaurante El Muelle',
          cliente: 'Restaurante El Muelle',
          total: 400000,
          estado: 'CREADO',
          fecha: '2026-10-27',
          lineas: [
            { id: 'l-1', nombre: 'Filete Corvina', cantidadSolicitada: 10, precioPactado: 40000 },
          ],
          totalFinal: 400000,
        } as any,
      ],
      ventas: [],
    });

    useCashierKanbanStore.setState({
      preventas: [
        {
          id: 'pref-k-1',
          codigoPreventa: 'PV-001',
          clienteNombre: 'Restaurante Mar',
          total: 150000,
          estado: 'PENDIENTE_COBRO',
          vendedorId: 'v-1',
          vendedorNombre: 'Carlos Asesor',
          terminalId: 'TERM-01',
          items: [],
          createdAt: new Date().toISOString(),
        } as any,
      ],
      filtroAsesorId: 'TODOS',
    });
  });

  describe('OrderKanbanView - Ergonomía Laptop (1366x768)', () => {
    it('el contenedor raíz debe tener flex-col, h-full, min-h-0 y no desbordar con paddings excesivos', () => {
      const { container } = render(<OrderKanbanView onEditOrder={vi.fn()} />);
      const root = container.firstElementChild as HTMLElement;
      expect(root).toBeInTheDocument();
      expect(root.className).toContain('flex flex-col');
      expect(root.className).toContain('h-full');
      expect(root.className).toMatch(/min-h-0|overflow-hidden/);
      // Debe usar paddings compactos para laptop (no p-6 ni space-y-5)
      expect(root.className).not.toMatch(/p-6/);
      expect(root.className).not.toMatch(/space-y-5/);
    });

    it('el contenedor de columnas Kanban debe tener flex-1, min-h-0 y overflow-x-auto', () => {
      const { container } = render(<OrderKanbanView onEditOrder={vi.fn()} />);
      const columnsContainer = container.querySelector('div.overflow-x-auto.select-none') as HTMLElement;
      expect(columnsContainer).toBeInTheDocument();
      expect(columnsContainer.className).toContain('flex-1');
      expect(columnsContainer.className).toContain('min-h-0');
      expect(columnsContainer.className).toContain('overflow-x-auto');
    });

    it('cada columna debe tener flex-col, h-full y su lista de tarjetas debe usar overflow-y-auto con min-h-0', () => {
      const { container } = render(<OrderKanbanView onEditOrder={vi.fn()} />);
      const columnCards = container.querySelectorAll('div.w-80.flex.flex-col');
      expect(columnCards.length).toBeGreaterThan(0);

      columnCards.forEach((col) => {
        expect(col.className).toMatch(/h-full|max-h-full/);
        const cardList = col.querySelector('div.overflow-y-auto') as HTMLElement;
        expect(cardList).toBeInTheDocument();
        expect(cardList.className).toContain('flex-1');
        expect(cardList.className).toContain('min-h-0');
        // No debe tener min-h-[350px] estático que desborde laptops
        expect(cardList.className).not.toContain('min-h-[350px]');
      });
    });
  });

  describe('CashierKanbanView - Scroll Independiente y Viewport Acotado', () => {
    it('el contenedor principal de CashierKanbanView debe tener h-full, min-h-0 y overflow-hidden', () => {
      const { container } = render(<CashierKanbanView />);
      const root = container.firstElementChild as HTMLElement;
      expect(root).toBeInTheDocument();
      expect(root.className).toContain('h-full');
      expect(root.className).toContain('overflow-hidden');
    });

    it('el grid de 3 columnas debe usar min-h-0 y cada columna lista debe usar overflow-y-auto', () => {
      const { container } = render(<CashierKanbanView />);
      const grid = container.querySelector('div.grid.grid-cols-1.md\\:grid-cols-3') as HTMLElement;
      expect(grid).toBeInTheDocument();
      expect(grid.className).toContain('min-h-0');

      const cardLists = container.querySelectorAll('div.overflow-y-auto');
      expect(cardLists.length).toBe(3);
      cardLists.forEach((list) => {
        expect(list.className).toContain('flex-1');
      });
    });
  });
});
