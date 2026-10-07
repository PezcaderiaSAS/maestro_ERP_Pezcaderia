import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WeighingModal } from '../views/inventory/components/WeighingModal';
import { RouteManifestBuilderModal } from '../views/inventory/components/RouteManifestBuilderModal';

describe('B2B Fulfillment Tactile & Bucaramanga Routes Suite', () => {
  const dummyProduct = {
    id: 'prod-01',
    sku: 'PES-COR-001',
    nombre: 'Corvina Entera Fresca',
    categoria: 'PESCADOS',
    unidadMedida: 'kg',
    precio_compra: 18000,
    precio_venta: 28000,
    control_inventario: true,
    activo: true,
  };

  const dummyLine = {
    productoId: 'prod-01',
    cantidadSolicitada: 15,
    cantidadAlistada: 0,
    precioPactado: 28000,
    totalLinea: 420000,
    estadoLinea: 'PENDIENTE' as const,
  };

  it('debe renderizar WeighingModal con opciones táctiles de báscula y tara', () => {
    render(
      <WeighingModal
        isOpen={true}
        onClose={vi.fn()}
        linea={dummyLine}
        producto={dummyProduct as any}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText(/Pesaje de Producto/i)).toBeInTheDocument();
    expect(screen.getByText(/Corvina Entera Fresca/i)).toBeInTheDocument();
    expect(screen.getByText(/Capturar Peso de Báscula/i)).toBeInTheDocument();
    expect(screen.getByText(/Sin Tara \(0 kg\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Canastilla \(-2\.0 kg\)/i)).toBeInTheDocument();
  });

  it('debe descontar la tara de canastilla plástica automáticamente en el peso neto', () => {
    const handleConfirm = vi.fn();
    render(
      <WeighingModal
        isOpen={true}
        onClose={vi.fn()}
        linea={dummyLine}
        producto={dummyProduct as any}
        onConfirm={handleConfirm}
      />
    );

    // Ingresar 22 kg de peso bruto
    const inputPeso = screen.getByPlaceholderText('0.00');
    fireEvent.change(inputPeso, { target: { value: '22' } });

    // Seleccionar tara de canastilla (-2.0 kg)
    const btnCanastilla = screen.getByText(/Canastilla \(-2\.0 kg\)/i);
    fireEvent.click(btnCanastilla);

    // Peso neto a facturar debe ser 20.00 kg
    expect(screen.getByText('20.00 kg')).toBeInTheDocument();

    // Confirmar peso
    const btnConfirmar = screen.getByText(/Confirmar Peso/i);
    fireEvent.click(btnConfirmar);

    expect(handleConfirm).toHaveBeenCalledWith(20, expect.stringContaining('LOT-BCM'));
  });

  it('debe listar las zonas metropolitanas de Bucaramanga en RouteManifestBuilderModal', () => {
    render(
      <RouteManifestBuilderModal
        isOpen={true}
        onClose={vi.fn()}
        pedidosDisponibles={[]}
        getClientName={() => 'Cliente Test'}
        getClientAddress={() => 'Calle 36 # 20-10'}
        onManifestCreated={vi.fn()}
      />
    );

    // Verificar zonas de Bucaramanga y Santander
    expect(screen.getByText(/Cabecera & Cañaveral/i)).toBeInTheDocument();
    expect(screen.getByText(/Floridablanca & Ruitoque/i)).toBeInTheDocument();
    expect(screen.getByText(/Girón & Centro/i)).toBeInTheDocument();
    expect(screen.getByText(/Piedecuesta & Mensulí/i)).toBeInTheDocument();
  });
});
