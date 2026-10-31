// src/tests/inventoryFloatingPills.test.tsx
// TDD Suite para InventoryFloatingPills (SPEC-048: TASK-048-02)

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InventoryFloatingPills } from '../views/inventory/components/InventoryFloatingPills.tsx';

describe('InventoryFloatingPills Component Suite - TASK-048-02', () => {
  it('debe renderizar las 7 pestañas principales de inventario y WMS', () => {
    const handleTabChange = vi.fn();
    render(
      <InventoryFloatingPills
        activeTab="operaciones"
        onTabChange={handleTabChange}
        pendingPrepCount={3}
        fefoAlertsCount={2}
      />
    );

    // Verificación de existencia de las 7 pastillas
    expect(screen.getByRole('button', { name: /1\.\s*Existencias/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /2\.\s*Cuartos Fríos/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /3\.\s*Caducidad FEFO/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /4\.\s*Despiece/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /5\.\s*Traslados/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /6\.\s*Pareto ABC/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /7\.\s*Kardex NIIF/i })).toBeDefined();
  });

  it('debe disparar onTabChange al hacer clic en una pastilla', () => {
    const handleTabChange = vi.fn();
    render(
      <InventoryFloatingPills
        activeTab="operaciones"
        onTabChange={handleTabChange}
      />
    );

    const btnDespiece = screen.getByRole('button', { name: /4\.\s*Despiece/i });
    fireEvent.click(btnDespiece);

    expect(handleTabChange).toHaveBeenCalledWith('despiece');
  });

  it('debe mostrar badges con conteos cuando se proporcionan', () => {
    render(
      <InventoryFloatingPills
        activeTab="operaciones"
        onTabChange={() => {}}
        pendingPrepCount={5}
        fefoAlertsCount={8}
      />
    );

    expect(screen.getByText('5')).toBeDefined();
    expect(screen.getByText('8')).toBeDefined();
  });

  it('debe permitir seleccionar opciones a través del selector móvil', () => {
    const handleTabChange = vi.fn();
    render(
      <InventoryFloatingPills
        activeTab="operaciones"
        onTabChange={handleTabChange}
      />
    );

    const select = screen.getByTestId('inventory-mobile-tabs-selector');
    fireEvent.change(select, { target: { value: 'kardex' } });

    expect(handleTabChange).toHaveBeenCalledWith('kardex');
  });
});
