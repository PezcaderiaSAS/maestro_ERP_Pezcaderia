import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PricingView } from '../views/PricingView';
import { useInventoryStore } from '../store/useInventoryStore';
import { useAppStore } from '../store/useAppStore';

// Mock de SweetAlert2
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: true }),
  },
}));

describe('TASK-028-06: PricingView Integración Modular y Flujo Multicanal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ userRole: 'admin' });
    useInventoryStore.setState({
      products: [
        {
          id: 'prod-int-01',
          sku: 'SALM-INT',
          nombre: 'Salmón Atlántico Fresco',
          categoria: 'cat-salmon',
          unidadMedida: 'kg',
          precio_compra: 25000,
          buffer_seguridad: 10,
          precio_venta_pos: 38500,
          precio_venta_restaurante: 35750,
          precio_venta_mayorista: 31625,
          activo: true,
        },
      ],
      productPricings: [],
    });
  });

  it('debe renderizar PricingView con los 5 botones de navegación de pestañas', () => {
    render(<PricingView />);

    expect(screen.getByText('Catálogo')).toBeInTheDocument();
    expect(screen.getByText('Gestor de Precios')).toBeInTheDocument();
    expect(screen.getByText('Cotizador')).toBeInTheDocument();
    expect(screen.getByTestId('tab-btn-simulator')).toBeInTheDocument();
    expect(screen.getByTestId('tab-btn-config')).toBeInTheDocument();
  });

  it('debe navegar a la pestaña Simulador Multicanal al hacer clic en su botón', () => {
    render(<PricingView />);

    const btnSim = screen.getByTestId('tab-btn-simulator');
    fireEvent.click(btnSim);

    expect(screen.getByTestId('pricing-simulator-tab')).toBeInTheDocument();
    expect(screen.getByTestId('select-simulator-product')).toBeInTheDocument();
  });

  it('debe navegar a la pestaña Configuración Mermas y permitir edición como ADMIN', () => {
    useAppStore.setState({ userRole: 'admin' });
    render(<PricingView />);

    const btnConfig = screen.getByTestId('tab-btn-config');
    fireEvent.click(btnConfig);

    expect(screen.getByTestId('pricing-config-manager')).toBeInTheDocument();
    expect(screen.getByTestId('input-margen-pos')).toBeInTheDocument();
  });

  it('debe bloquear el acceso a Configuración Mermas si el rol no es ADMIN', () => {
    useAppStore.setState({ userRole: 'vendedor' });
    render(<PricingView />);

    const btnConfig = screen.getByTestId('tab-btn-config');
    fireEvent.click(btnConfig);

    expect(screen.getByTestId('pricing-config-access-denied')).toBeInTheDocument();
    expect(screen.getByText(/Acceso Restringido/i)).toBeInTheDocument();
  });

  it('debe simular tarifas en tiempo real al seleccionar un producto en el simulador', () => {
    render(<PricingView />);

    // Navegar a simulador
    fireEvent.click(screen.getByTestId('tab-btn-simulator'));

    // Seleccionar producto
    const select = screen.getByTestId('select-simulator-product');
    fireEvent.change(select, { target: { value: 'prod-int-01' } });

    // Verificar tarjetas de los 3 canales
    expect(screen.getByTestId('channel-card-pos')).toBeInTheDocument();
    expect(screen.getByTestId('channel-card-restaurante')).toBeInTheDocument();
    expect(screen.getByTestId('channel-card-mayorista')).toBeInTheDocument();
  });
});
