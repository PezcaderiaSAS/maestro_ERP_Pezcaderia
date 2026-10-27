import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EnterpriseTopbar } from '../components/layout/EnterpriseTopbar';

describe('TASK-039-03: EnterpriseTopbar - Ergonomía, Acotamiento de Breadcrumb y Zona Segura', () => {
  const defaultProps = {
    currentView: 'pos' as any,
    onNavigateHome: vi.fn(),
    onNavigatePOS: vi.fn(),
    onToggleSidebar: vi.fn(),
    theme: 'pezcaderia-glass' as any,
    onToggleTheme: vi.fn(),
    onOpenOmnibox: vi.fn(),
  };

  it('el breadcrumb de la vista activa debe acotarse responsivamente sin utilizar sm:max-w-none para no desbordar en laptops', () => {
    render(<EnterpriseTopbar {...defaultProps} currentView="pos" />);

    // El texto del subdominio de POS es "Punto de Venta (POS) (Venta Mostrador y Báscula)"
    const breadcrumbSub = screen.getByText(/Punto de Venta/i);
    expect(breadcrumbSub).toBeInTheDocument();

    // Debe contener clase truncate y max-w delimitado
    expect(breadcrumbSub.className).toContain('truncate');
    expect(breadcrumbSub.className).toContain('max-w-');
    // NO debe contener sm:max-w-none porque empujaba los controles de la derecha
    expect(breadcrumbSub.className).not.toContain('sm:max-w-none');
  });

  it('el breadcrumb debe contener el atributo title nativo con el texto completo para inspección accesible (WCAG 2.2)', () => {
    render(<EnterpriseTopbar {...defaultProps} currentView="pos" />);

    const breadcrumbSub = screen.getByText(/Punto de Venta/i);
    expect(breadcrumbSub).toHaveAttribute('title');
    expect(breadcrumbSub.getAttribute('title')).toContain('Punto de Venta (POS)');
  });

  it('el contenedor de acciones rápidas de la derecha debe mantener un espaciado ergonómico seguro (gap-2 sm:gap-3)', () => {
    const { container } = render(<EnterpriseTopbar {...defaultProps} />);

    // Localizar el contenedor de controles de la derecha
    const btnFacturar = container.querySelector('#topbar-btn-facturar-pos');
    const rightContainer = btnFacturar?.parentElement;

    expect(rightContainer).toBeInTheDocument();
    expect(rightContainer?.className).toContain('flex');
    expect(rightContainer?.className).toContain('items-center');
    // Verificamos que tenga la separación ergonómica calibrada
    expect(rightContainer?.className).toMatch(/gap-2(\.5)?\s+sm:gap-3|gap-2\s+sm:gap-3/);
  });
});
