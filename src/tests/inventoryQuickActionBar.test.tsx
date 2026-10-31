// src/tests/inventoryQuickActionBar.test.tsx
// TDD Suite para InventoryQuickActionBar (SPEC-048: TASK-048-03)

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InventoryQuickActionBar } from '../views/inventory/components/InventoryQuickActionBar.tsx';

describe('InventoryQuickActionBar Component Suite - TASK-048-03', () => {
  it('debe renderizar los botones de acción primarios de acuerdo a la Ley de Fitts', () => {
    render(
      <InventoryQuickActionBar
        onNewProduct={() => {}}
        onReceivePurchase={() => {}}
        onNewDissection={() => {}}
        onTransferWarehouse={() => {}}
        onViewKardex={() => {}}
      />
    );

    expect(screen.getByText('Nuevo Producto')).toBeDefined();
    expect(screen.getByText('Recibir Compra')).toBeDefined();
    expect(screen.getByText('Nuevo Despiece')).toBeDefined();
    expect(screen.getByText('Traslado Bodega')).toBeDefined();
    expect(screen.getByText('Ver Kardex NIIF')).toBeDefined();
  });

  it('debe invocar los callbacks correspondientes al hacer clic', () => {
    const handleNewProduct = vi.fn();
    const handleReceivePurchase = vi.fn();
    const handleNewDissection = vi.fn();
    const handleTransfer = vi.fn();
    const handleKardex = vi.fn();

    render(
      <InventoryQuickActionBar
        onNewProduct={handleNewProduct}
        onReceivePurchase={handleReceivePurchase}
        onNewDissection={handleNewDissection}
        onTransferWarehouse={handleTransfer}
        onViewKardex={handleKardex}
      />
    );

    fireEvent.click(screen.getByText('Nuevo Producto'));
    expect(handleNewProduct).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Recibir Compra'));
    expect(handleReceivePurchase).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Nuevo Despiece'));
    expect(handleNewDissection).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Traslado Bodega'));
    expect(handleTransfer).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Ver Kardex NIIF'));
    expect(handleKardex).toHaveBeenCalledTimes(1);
  });

  it('debe abrir el menú de más opciones y ejecutar acciones secundarias', () => {
    const handleBulkUpload = vi.fn();
    const handleDockArrival = vi.fn();

    render(
      <InventoryQuickActionBar
        onNewProduct={() => {}}
        onReceivePurchase={() => {}}
        onNewDissection={() => {}}
        onBulkUpload={handleBulkUpload}
        onDockArrival={handleDockArrival}
      />
    );

    const btnMore = screen.getByText('Más Opciones');
    fireEvent.click(btnMore);

    const btnBulk = screen.getByText('Importar CSV');
    fireEvent.click(btnBulk);
    expect(handleBulkUpload).toHaveBeenCalledTimes(1);
  });
});
