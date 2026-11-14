import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { POSMultivendorLightHeader } from '../views/pos/components/POSMultivendorLightHeader';

describe('POSMultivendorLightHeader Responsive Layout (TDD)', () => {
  const dummyVendors = [
    { id: 'v1', nombre: 'DIEGO IVAN DIAZ ANAYA', corto: 'Diego Díaz' },
    { id: 'v2', nombre: 'LUIS EDUARDO BANQUEZ MEJIA', corto: 'Luis Banquez' },
    { id: 'v3', nombre: 'DAVID SANTIAGO PALLARES', corto: 'Santiago Pallares' },
    { id: 'v4', nombre: 'MANUEL SEGUNDO ARROYO', corto: 'Manuel Arroyo' },
  ];

  it('debe renderizar todos los elementos de acción sin truncar controles críticos', () => {
    render(
      <POSMultivendorLightHeader
        vendedores={dummyVendors}
        selectedVendorId="v1"
        onSelectVendor={vi.fn()}
        barcodeInput=""
        onBarcodeChange={vi.fn()}
        onBarcodeSubmit={vi.fn()}
        searchQuery=""
        onSearchChange={vi.fn()}
        onOpenClientModal={vi.fn()}
        onOpenComandasQueue={vi.fn()}
        comandasPendientesCount={3}
        onToggleModoCajero={vi.fn()}
        isModoCajero={false}
      />
    );

    // Los 4 asesores deben existir en el DOM
    expect(screen.getByTestId('btn-vendedor-v1')).toBeInTheDocument();
    expect(screen.getByTestId('btn-vendedor-v2')).toBeInTheDocument();
    expect(screen.getByTestId('btn-vendedor-v3')).toBeInTheDocument();
    expect(screen.getByTestId('btn-vendedor-v4')).toBeInTheDocument();

    // Inputs
    expect(screen.getByTestId('pos-light-barcode-input')).toBeInTheDocument();
    expect(screen.getByTestId('pos-light-product-search-input')).toBeInTheDocument();

    // Todos los botones de la Sección 3 deben estar presentes en el DOM
    expect(screen.getByTestId('btn-header-seleccionar-cliente')).toBeInTheDocument();
    expect(screen.getByTestId('btn-open-comandas-drawer')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // Contador de comandas
    expect(screen.getByTestId('btn-toggle-modo-cajero')).toBeInTheDocument();
    expect(screen.getByTestId('pos-more-actions-dropdown')).toBeInTheDocument();
  });
});

