import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { POSProductBodegaStock } from '../views/pos/components/POSProductBodegaStock';
import type { BodegaStockItem } from '../views/pos/posWarehouseStock.utils';

describe('POSProductBodegaStock Component (TDD)', () => {
  const sampleBodegas: BodegaStockItem[] = [
    { bodegaId: 'b1', bodegaNombre: 'Bodega Principal', bodegaAbrev: 'Princ', cantidad: 10, disponible: true },
    { bodegaId: 'b2', bodegaNombre: 'Cuarto Frío 1', bodegaAbrev: 'Frío', cantidad: 25.5, disponible: true },
    { bodegaId: 'b3', bodegaNombre: 'Mostrador', bodegaAbrev: 'Most', cantidad: 0, disponible: false },
  ];

  it('debe renderizar mini-pills para cada bodega con existencias formateadas', () => {
    render(<POSProductBodegaStock bodegas={sampleBodegas} unit="kg" />);

    expect(screen.getByTestId('bodega-pill-Princ')).toBeDefined();
    expect(screen.getByText('Princ:')).toBeDefined();
    expect(screen.getByText('10')).toBeDefined();

    expect(screen.getByTestId('bodega-pill-Frío')).toBeDefined();
    expect(screen.getByText('Frío:')).toBeDefined();
    expect(screen.getByText('25.5')).toBeDefined();

    expect(screen.getByTestId('bodega-pill-Most')).toBeDefined();
    expect(screen.getByText('Most:')).toBeDefined();
    expect(screen.getByText('0')).toBeDefined();
  });

  it('debe aplicar estilos diferenciados entre bodegas con y sin stock', () => {
    render(<POSProductBodegaStock bodegas={sampleBodegas} unit="kg" />);

    const pillPrinc = screen.getByTestId('bodega-pill-Princ');
    const pillMost = screen.getByTestId('bodega-pill-Most');

    // Con stock: clase de tono esmeralda accesible
    expect(pillPrinc.className).toContain('text-emerald-800');
    // Sin stock: clase gris atenuada
    expect(pillMost.className).toContain('text-slate-400');
  });

  it('debe limitar a maxVisible y mostrar badge +N cuando hay bodegas adicionales', () => {
    const multipleBodegas: BodegaStockItem[] = [
      { bodegaId: '1', bodegaNombre: 'Bodega 1', bodegaAbrev: 'B1', cantidad: 10, disponible: true },
      { bodegaId: '2', bodegaNombre: 'Bodega 2', bodegaAbrev: 'B2', cantidad: 5, disponible: true },
      { bodegaId: '3', bodegaNombre: 'Bodega 3', bodegaAbrev: 'B3', cantidad: 2, disponible: true },
      { bodegaId: '4', bodegaNombre: 'Bodega 4', bodegaAbrev: 'B4', cantidad: 1, disponible: true },
    ];

    render(<POSProductBodegaStock bodegas={multipleBodegas} maxVisible={2} unit="kg" />);

    expect(screen.getByTestId('bodega-pill-B1')).toBeDefined();
    expect(screen.getByTestId('bodega-pill-B2')).toBeDefined();
    expect(screen.queryByTestId('bodega-pill-B3')).toBeNull();
    expect(screen.queryByTestId('bodega-pill-B4')).toBeNull();

    const moreBadge = screen.getByTestId('bodega-more-badge');
    expect(moreBadge.textContent).toContain('+2');
  });

  it('debe renderizar mensaje o nada si la lista de bodegas está vacía (servicio)', () => {
    const { container } = render(<POSProductBodegaStock bodegas={[]} />);
    expect(container.firstChild).toBeNull();
  });
});

