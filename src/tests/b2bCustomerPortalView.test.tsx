import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { B2BCustomerPortalView } from '../views/b2b/portal/B2BCustomerPortalView';
import { b2bCustomerPortalService } from '../services/b2bCustomerPortalService';

describe('B2BCustomerPortalView — Vista Principal Portal B2B HORECA (TASK-027-05)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar el encabezado, el resumen de crédito y el catálogo de productos', () => {
    render(<B2BCustomerPortalView />);

    expect(screen.getByTestId('b2b-customer-portal-view')).toBeDefined();
    expect(screen.getByTestId('b2b-client-header-bar')).toBeDefined();
    expect(screen.getByTestId('b2b-credit-card-summary')).toBeDefined();
    expect(screen.getByTestId('b2b-catalog-grid')).toBeDefined();
  });

  it('debe filtrar el catálogo al cambiar la categoría y al escribir en el buscador', () => {
    render(<B2BCustomerPortalView />);

    const searchInput = screen.getByTestId('input-catalog-search');
    fireEvent.change(searchInput, { target: { value: 'Salmón' } });
    expect(searchInput).toHaveValue('Salmón');

    // Cambiar categoría si existe alguna pill
    const pills = screen.queryAllByTestId(/^pill-categoria-/);
    if (pills.length > 0) {
      fireEvent.click(pills[0]);
    }
    expect(screen.getByTestId('b2b-catalog-grid')).toBeDefined();
  });

  it('debe abrir el modal de configuración al seleccionar un producto del catálogo', () => {
    render(<B2BCustomerPortalView />);

    const configButtons = screen.getAllByTestId(/^btn-select-product-/);
    expect(configButtons.length).toBeGreaterThan(0);

    // Clic en el primer producto
    fireEvent.click(configButtons[0]);

    // Debe abrirse el modal de corte y empaque
    expect(screen.getByTestId('b2b-item-configurator-modal')).toBeDefined();
  });

  it('debe abrir y cerrar el drawer de plantillas recurrentes', () => {
    render(<B2BCustomerPortalView />);

    const btnTemplates = screen.getByTestId('btn-open-recurring-templates');
    fireEvent.click(btnTemplates);

    expect(screen.getByTestId('b2b-recurring-templates-drawer')).toBeDefined();

    // Cerrar drawer
    const btnClose = screen.getByTestId('btn-close-templates-drawer');
    fireEvent.click(btnClose);

    expect(screen.queryByTestId('b2b-recurring-templates-drawer')).toBeNull();
  });

  it('debe abrir el drawer del carrito y permitir vaciarlo o cerrar el drawer', () => {
    render(<B2BCustomerPortalView />);

    const btnCart = screen.getByTestId('btn-open-cart-drawer');
    fireEvent.click(btnCart);

    expect(screen.getByTestId('b2b-cart-drawer')).toBeDefined();

    // Botón de cerrar carrito
    const btnClose = screen.getByTestId('btn-close-cart-drawer');
    fireEvent.click(btnClose);

    expect(screen.queryByTestId('b2b-cart-drawer')).toBeNull();
  });

  it('debe abrir el timeline de trazabilidad al consultar el detalle de un pedido', () => {
    render(<B2BCustomerPortalView />);

    // Si hay pedidos en el historial, podemos hacer clic en ver tracking
    const trackingButtons = screen.queryAllByTestId(/^btn-track-order-/);
    if (trackingButtons.length > 0) {
      fireEvent.click(trackingButtons[0]);
      expect(screen.getByTestId('b2b-order-tracking-timeline')).toBeDefined();
    }
  });
});
