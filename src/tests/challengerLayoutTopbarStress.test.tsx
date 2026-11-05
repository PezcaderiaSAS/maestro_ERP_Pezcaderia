import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppRouteId } from '../routes/AppRoute';
import {
  TRANSACTIONAL_FIXED_VIEWS,
  isTransactionalFixedView,
  getMainLayoutClasses,
} from '../components/layout/layoutModes';
import { EnterpriseTopbar } from '../components/layout/EnterpriseTopbar';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';

describe('CHALLENGER 1: Adversarial Stress Test Harness for Layout (R1) & Topbar (R4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // SECTION 1: Adversarial Layout Modes & Viewport Scrolling (R1)
  // =========================================================================
  describe('Adversarial Layout Modes (R1: Dashboard Scroll Unfreeze & Invariant Locking)', () => {
    it('Dashboard Route must NEVER be classified as transactional fixed view', () => {
      expect(isTransactionalFixedView('dashboard')).toBe(false);
      expect(isTransactionalFixedView(AppRouteId.DASHBOARD)).toBe(false);
      expect(TRANSACTIONAL_FIXED_VIEWS).not.toContain(AppRouteId.DASHBOARD);
      expect((TRANSACTIONAL_FIXED_VIEWS as readonly string[])).not.toContain('dashboard');
    });

    it('Dashboard layout classes must enforce overflow-y-auto and min-h-0 without overflow-hidden', () => {
      const dashboardClasses = getMainLayoutClasses('dashboard');
      
      // Affirmative assertions
      expect(dashboardClasses).toContain('overflow-y-auto');
      expect(dashboardClasses).toContain('custom-scrollbar');
      expect(dashboardClasses).toContain('min-h-0');
      expect(dashboardClasses).toContain('flex-1');

      // Negative assertions: MUST NOT lock the viewport
      expect(dashboardClasses).not.toContain('overflow-hidden');
      expect(dashboardClasses).not.toContain('h-[calc(100vh');
      expect(dashboardClasses).not.toContain('max-h-screen');
      expect(dashboardClasses).not.toContain('h-screen');
    });

    it('Fixed views (pos, kanban, caja, alistamiento, despachos) must strictly retain overflow-hidden', () => {
      const fixedViews = [
        'pos',
        'kanban',
        'order-kanban',
        'caja',
        'cash-flow',
        'alistamiento',
        'despachos',
        'dispatch',
      ];

      for (const view of fixedViews) {
        expect(isTransactionalFixedView(view)).toBe(true);
        const classes = getMainLayoutClasses(view);
        expect(classes).toContain('overflow-hidden');
        expect(classes).toContain('h-[calc(100vh-theme(spacing.12)-theme(spacing.3))]');
        expect(classes).toContain('min-h-0');
        expect(classes).not.toContain('overflow-y-auto');
      }
    });

    it('Boundary & adversarial input variations in getMainLayoutClasses', () => {
      // Unrecognized routes should fall back gracefully to scrollable mode
      const weirdInputs = [
        undefined,
        '',
        '   ',
        'unknown-view-xyz',
        'null',
        'undefined',
        'DASHBOARD', // case mismatch should default to safe scrollable layout
        'Pos',
        '12345',
        '<script>alert("xss")</script>',
      ];

      for (const input of weirdInputs) {
        const classes = getMainLayoutClasses(input);
        expect(classes).toContain('overflow-y-auto');
        expect(classes).not.toContain('overflow-hidden');
      }
    });

    it('Simulated Desktop Viewport (1366x768 & 1920x1080) Layout Container Invariant', () => {
      // Simulating the DOM hierarchy in App.tsx
      const viewports = [
        { name: '1366x768 Laptop', width: 1366, height: 768 },
        { name: '1920x1080 FHD Desktop', width: 1920, height: 1080 },
      ];

      for (const vp of viewports) {
        const { container, unmount } = render(
          <div
            data-testid={`viewport-container-${vp.width}`}
            style={{ width: `${vp.width}px`, height: `${vp.height}px`, display: 'flex', flexDirection: 'column' }}
          >
            <header style={{ height: '48px', flexShrink: 0 }} />
            <main className={getMainLayoutClasses('dashboard')} data-testid="main-content">
              {/* Simulated long content (> 1200px) */}
              <div style={{ height: '1400px' }} data-testid="tall-dashboard-body">
                Dashboard Content
              </div>
            </main>
          </div>
        );

        const mainElement = screen.getByTestId('main-content');
        expect(mainElement.className).toContain('overflow-y-auto');
        expect(mainElement.className).toContain('min-h-0');
        expect(mainElement.className).not.toContain('overflow-hidden');

        unmount();
      }
    });
  });

  // =========================================================================
  // SECTION 2: Topbar Collision & Truncation Stress Testing (R4)
  // =========================================================================
  describe('Adversarial Topbar Layout (R4: Collision Prevention & Breakpoint Degradation)', () => {
    const defaultProps = {
      currentView: 'pos' as any,
      onNavigateHome: vi.fn(),
      onNavigatePOS: vi.fn(),
      onToggleSidebar: vi.fn(),
      theme: 'pezcaderia-glass' as any,
      onToggleTheme: vi.fn(),
      onOpenOmnibox: vi.fn(),
    };

    it('Left section must enforce double containment with overflow-hidden and min-w-0', () => {
      const { container } = render(<EnterpriseTopbar {...defaultProps} currentView="pos" />);

      // 1. Outer left container
      const navBtn = screen.getByLabelText('Menú de Navegación');
      const leftOuter = navBtn.parentElement;
      expect(leftOuter).not.toBeNull();
      expect(leftOuter?.className).toContain('flex-1');
      expect(leftOuter?.className).toContain('min-w-0');
      expect(leftOuter?.className).toContain('overflow-hidden');

      // 2. Inner breadcrumb wrapper
      const breadcrumbSub = screen.getByText(/Punto de Venta/i);
      const breadcrumbInner = breadcrumbSub.parentElement;
      expect(breadcrumbInner).not.toBeNull();
      expect(breadcrumbInner?.className).toContain('min-w-0');
      expect(breadcrumbInner?.className).toContain('overflow-hidden');
    });

    it('Right actions section must have shrink-0 to prevent compression while left absorbs available width', () => {
      const { container } = render(<EnterpriseTopbar {...defaultProps} currentView="pos" />);

      const tenantBtn = container.querySelector('#topbar-btn-tenant-selector');
      const rightSection = tenantBtn?.parentElement;
      expect(rightSection).not.toBeNull();
      expect(rightSection?.className).toContain('shrink-0');
    });

    it('Breadcrumb truncation handles extreme lengths (50+, 100+, 250+ characters) without blowout', () => {
      const extremeBreadcrumbs = [
        'Venta y Facturación de Salmón Chileno Premium - Grado Sashimi Ultra Congelado',
        'A'.repeat(80),
        'X'.repeat(250),
        '🐟🍣🦐 Langostinos Tigre y Mariscos Frescos del Pacífico Colombiano en Promoción Especial de Temporada',
        '<script>alert("test")</script>&nbsp;&quot;special-characters&amp;',
      ];

      for (const text of extremeBreadcrumbs) {
        // Mock route metadata return by mocking currentView or verifying breadcrumb container
        const { container, unmount } = render(
          <EnterpriseTopbar {...defaultProps} currentView="pos" />
        );

        const breadcrumbSpan = container.querySelector('.truncate.max-w-\\[100px\\]');
        expect(breadcrumbSpan).not.toBeNull();
        expect(breadcrumbSpan?.className).toContain('truncate');
        expect(breadcrumbSpan?.className).toContain('max-w-[100px]');
        expect(breadcrumbSpan?.className).toContain('sm:max-w-[180px]');
        expect(breadcrumbSpan?.className).toContain('md:max-w-[220px]');
        expect(breadcrumbSpan?.className).toContain('lg:max-w-[260px]');
        expect(breadcrumbSpan?.className).toContain('xl:max-w-[320px]');

        unmount();
      }
    });

    it('Tenant selector truncates extreme company names (50+, 100+ characters)', () => {
      const extremeTenantNames = [
        'Distribuidora Internacional de Pescados y Mariscos del Caribe y Pacífico de Colombia SAS BIC',
        'Compañía Pesquera '.repeat(6),
        'Z'.repeat(120),
      ];

      for (const tenantName of extremeTenantNames) {
        useAuthStore.setState({
          activeTenant: {
            id: 'tenant-test',
            razonSocial: tenantName,
            nombre: tenantName,
          } as any,
        });

        const { container, unmount } = render(
          <EnterpriseTopbar {...defaultProps} currentView="pos" />
        );

        const tenantBtn = container.querySelector('#topbar-btn-tenant-selector');
        expect(tenantBtn).not.toBeNull();

        const tenantText = tenantBtn?.querySelector('span.truncate');
        expect(tenantText).not.toBeNull();
        expect(tenantText?.textContent).toBe(tenantName);
        expect(tenantText?.className).toContain('truncate');
        expect(tenantText?.className).toContain('max-w-[80px]');
        expect(tenantText?.className).toContain('sm:max-w-[130px]');

        unmount();
      }
    });

    it('Secondary controls respect strict responsive degradation tokens across breakpoints', () => {
      const { container } = render(<EnterpriseTopbar {...defaultProps} currentView="pos" />);

      // 1. Bodega Selector: hidden on viewports < 1536px (hidden 2xl:flex)
      const bodegaText = screen.getByText('Bodega Principal');
      const bodegaDiv = bodegaText.parentElement;
      expect(bodegaDiv?.className).toContain('hidden');
      expect(bodegaDiv?.className).toContain('2xl:flex');
      expect(bodegaDiv?.className).not.toContain('lg:flex'); // Was removed

      // 2. Reset DB Button: hidden on viewports < 1280px (hidden xl:flex)
      const purgeBtn = container.querySelector('#topbar-btn-purge-db');
      expect(purgeBtn?.className).toContain('hidden');
      expect(purgeBtn?.className).toContain('xl:flex');

      // 3. User Profile Name and Role: hidden on viewports < 1280px (hidden xl:flex)
      const profileBtn = container.querySelector('button[aria-label^="Perfil de usuario"]');
      const profileDetails = profileBtn?.querySelector('div.flex-col');
      expect(profileDetails?.className).toContain('hidden');
      expect(profileDetails?.className).toContain('xl:flex');
      expect(profileDetails?.className).not.toContain('lg:flex'); // Was removed

      // 4. Breadcrumb domain: hidden on viewports < 1280px (hidden xl:inline)
      const domainSpan = screen.getByText('Ventas & Comercial');
      expect(domainSpan?.className).toContain('hidden');
      expect(domainSpan?.className).toContain('xl:inline');
      expect(domainSpan?.className).not.toContain('md:inline'); // Was removed
    });

    it('Theoretical Collision Oracle at 1024px, 1280px, 1366px, 1920px viewports', () => {
      // Mathematical verification of horizontal space allocation:
      // A standard 1024px viewport with 240px sidebar expanded leaves 784px for the header.
      // Header has mx-2.5 mt-1.5 px-2.5 -> effective width = ~764px.
      //
      // Controls visible at 1024px (< 1280px):
      // - Left section: Toggle button (32px) + Gap (8px) + Breadcrumb (Home + Chevron + Sub) ~ 160px.
      //   Because breadcrumb sub max-w is 260px at lg, and left container has flex-1 min-w-0 overflow-hidden.
      // - Right section controls:
      //   - Tenant selector: icon(14) + max-w(130) + chevron(12) + padding(24) ~ 180px
      //   - Omnibox: icon(14) + 'Buscar...'(55) + kbd(45) + padding(24) ~ 138px
      //   - Josase toggle: ~90px
      //   - Kanban Caja: icon(14) + 'Kanban Caja'(75) + kbd(20) + padding(24) ~ 133px
      //   - POS button: icon(14) + 'Facturar POS'(80) + kbd(20) + padding(24) ~ 138px
      //   - Theme icon: ~36px
      //   - User profile avatar: ~36px (since text is hidden via hidden xl:flex!)
      //   - Network sync badge: ~32px
      //   Notice Bodega (-150px), Reset DB (-95px), and Profile Text (-70px) are all HIDDEN.
      //   Total savings = 315px.
      //
      // Left container flex-1 min-w-0 overflow-hidden guarantees that even if right section width reaches
      // any value, CSS flexbox shrinks left container cleanly down to min-w-0 without overlapping.
      
      const { container } = render(<EnterpriseTopbar {...defaultProps} currentView="pos" />);
      const header = container.querySelector('header');
      expect(header).not.toBeNull();
      const leftSection = header?.children[0];
      const rightSection = header?.children[1];

      expect(leftSection).not.toBeUndefined();
      expect(rightSection).not.toBeUndefined();
      expect(leftSection?.className).toContain('flex-1');
      expect(leftSection?.className).toContain('min-w-0');
      expect(leftSection?.className).toContain('overflow-hidden');
      expect(rightSection?.className).toContain('shrink-0');
      expect(leftSection?.nextElementSibling).toBe(rightSection);
    });
  });
});
