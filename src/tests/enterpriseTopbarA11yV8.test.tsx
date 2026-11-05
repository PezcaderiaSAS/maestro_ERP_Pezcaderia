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

  describe('SPEC-052 R4: Prevención de Colisiones y Desbordamientos en Topbar (1024px, 1280px, 1366px)', () => {
    it('el contenedor izquierdo y el wrapper del breadcrumb deben contener overflow-hidden para prevenir blowout horizontal', () => {
      render(<EnterpriseTopbar {...defaultProps} currentView="pos" />);

      // Contenedor izquierdo principal (toggle + breadcrumb)
      const toggleBtn = screen.getByLabelText('Menú de Navegación');
      const leftContainer = toggleBtn.parentElement;
      expect(leftContainer).toBeInTheDocument();
      expect(leftContainer?.className).toContain('overflow-hidden');
      expect(leftContainer?.className).toContain('min-w-0');

      // Contenedor específico del breadcrumb
      const breadcrumbSub = screen.getByText(/Punto de Venta/i);
      const breadcrumbWrapper = breadcrumbSub.parentElement;
      expect(breadcrumbWrapper).toBeInTheDocument();
      expect(breadcrumbWrapper?.className).toContain('overflow-hidden');
      expect(breadcrumbWrapper?.className).toContain('min-w-0');
    });

    it('el dominio del breadcrumb debe ocultarse en viewports menores a 1280px (hidden xl:inline)', () => {
      render(<EnterpriseTopbar {...defaultProps} currentView="pos" />);

      const domainSpan = screen.getByText('Ventas & Comercial');
      expect(domainSpan).toBeInTheDocument();
      expect(domainSpan.className).toContain('hidden');
      expect(domainSpan.className).toContain('xl:inline');
    });

    it('el texto del subdominio del breadcrumb debe mantener truncado con max-w escalonado iniciando en max-w-[100px]', () => {
      render(<EnterpriseTopbar {...defaultProps} currentView="pos" />);

      const breadcrumbSub = screen.getByText(/Punto de Venta/i);
      expect(breadcrumbSub.className).toContain('truncate');
      expect(breadcrumbSub.className).toContain('max-w-[100px]');
      expect(breadcrumbSub.className).toContain('sm:max-w-[180px]');
      expect(breadcrumbSub.className).toContain('md:max-w-[220px]');
      expect(breadcrumbSub.className).toContain('lg:max-w-[260px]');
      expect(breadcrumbSub.className).toContain('xl:max-w-[320px]');
    });

    it('el selector de empresa / tenant debe truncar el nombre y mantener max-w-[80px]', () => {
      const { container } = render(<EnterpriseTopbar {...defaultProps} currentView="pos" />);

      const tenantBtn = container.querySelector('#topbar-btn-tenant-selector');
      expect(tenantBtn).toBeInTheDocument();

      const tenantText = tenantBtn?.querySelector('span.truncate');
      expect(tenantText).toBeInTheDocument();
      expect(tenantText?.className).toContain('truncate');
      expect(tenantText?.className).toContain('max-w-[80px]');
      expect(tenantText?.className).toContain('sm:max-w-[130px]');
    });

    it('el selector de bodega debe ocultarse en pantallas menores a 1536px (hidden 2xl:flex) liberando espacio en 1024px-1366px', () => {
      render(<EnterpriseTopbar {...defaultProps} currentView="pos" />);

      const bodegaText = screen.getByText('Bodega Principal');
      const bodegaContainer = bodegaText.parentElement;
      expect(bodegaContainer).toBeInTheDocument();
      expect(bodegaContainer?.className).toContain('hidden');
      expect(bodegaContainer?.className).toContain('2xl:flex');
    });

    it('el botón de Reset DB debe ocultarse en pantallas menores a 1280px (hidden xl:flex)', () => {
      const { container } = render(<EnterpriseTopbar {...defaultProps} currentView="pos" />);

      const resetBtn = container.querySelector('#topbar-btn-purge-db');
      expect(resetBtn).toBeInTheDocument();
      expect(resetBtn?.className).toContain('hidden');
      expect(resetBtn?.className).toContain('xl:flex');
    });

    it('los textos de nombre y rol del perfil de usuario deben ocultarse en pantallas menores a 1280px (hidden xl:flex)', () => {
      const { container } = render(<EnterpriseTopbar {...defaultProps} currentView="pos" />);

      const profileBtn = container.querySelector('button[aria-label^="Perfil de usuario"]');
      expect(profileBtn).toBeInTheDocument();

      const profileTextContainer = profileBtn?.querySelector('div.flex-col');
      expect(profileTextContainer).toBeInTheDocument();
      expect(profileTextContainer?.className).toContain('hidden');
      expect(profileTextContainer?.className).toContain('xl:flex');
    });
  });
});
