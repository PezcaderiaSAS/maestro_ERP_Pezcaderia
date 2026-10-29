import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fs from 'fs';
import * as path from 'path';
import { useAppStore } from '../store/useAppStore';
import { Button } from '../components/ui/Button';
import { EnterpriseTopbar, THEMES_CONFIG } from '../components/layout/EnterpriseTopbar';

describe('Milestone M1: Design Tokens, Light Mode & Shell Foundation', () => {
  const rootDir = path.resolve(__dirname, '../..');

  describe('1. Canonical Design Tokens & Light Mode (src/index.css)', () => {
    const cssPath = path.join(rootDir, 'src/index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    it('debe definir el tema canónico pezcaderia-light con variables de alto contraste WCAG AA+', () => {
      expect(cssContent).toContain('[data-theme="pezcaderia-light"]');
      expect(cssContent).toContain('--bg-color: #f8fafc;');
      expect(cssContent).toContain('--card-bg: #ffffff;');
      expect(cssContent).toContain('--card-hover: #f1f5f9;');
      expect(cssContent).toContain('--text-primary: #0f172a;');
      expect(cssContent).toContain('--text-secondary: #334155;');
      expect(cssContent).toContain('--text-muted: #64748b;');
      expect(cssContent).toContain('--border-color: #e2e8f0;');
      expect(cssContent).toContain('--border-strong: #cbd5e1;');
    });

    it('debe contener reglas responsivas para SweetAlert2 limitando el ancho a 92vw en móvil', () => {
      expect(cssContent).toMatch(/\.swal2-popup\s*\{[^}]*max-width:\s*92vw\s*!important/s);
      expect(cssContent).toMatch(/@media\s*\(max-width:\s*640px\)\s*\{[^}]*\.swal2-popup\s*\{[^}]*width:\s*92vw\s*!important/s);
    });
  });

  describe('2. Registro de Tema en Store Global (src/store/useAppStore.ts)', () => {
    it('debe registrar pezcaderia-light en el store y soportar alternancia y persistencia', () => {
      const state = useAppStore.getState();
      state.setTheme('pezcaderia-light');
      expect(useAppStore.getState().theme).toBe('pezcaderia-light');

      // Alternar al siguiente tema del ciclo
      state.toggleTheme();
      expect(useAppStore.getState().theme).toBe('hyper-cobalt');

      // Restaurar tema pezcaderia-light
      state.setTheme('pezcaderia-light');
      expect(useAppStore.getState().theme).toBe('pezcaderia-light');
    });
  });

  describe('3. Ley de Fitts y Dimensiones Táctiles en Botones (src/components/ui/Button.tsx)', () => {
    it('debe aplicar min-height ergonómico según el tamaño seleccionado', () => {
      const { unmount } = render(
        <div>
          <Button size="sm" data-testid="btn-sm">Pequeño</Button>
          <Button size="md" data-testid="btn-md">Mediano</Button>
          <Button size="lg" data-testid="btn-lg">Grande</Button>
        </div>
      );

      const btnSm = screen.getByTestId('btn-sm');
      const btnMd = screen.getByTestId('btn-md');
      const btnLg = screen.getByTestId('btn-lg');

      expect(btnSm.className).toContain('min-h-[36px]');
      expect(btnMd.className).toContain('min-h-[44px]');
      expect(btnLg.className).toContain('min-h-[48px]');

      unmount();
    });
  });

  describe('4. Shell Responsivo y Prevención de Blowout en Header (src/components/layout/EnterpriseTopbar.tsx)', () => {
    it('debe incluir pezcaderia-light en THEMES_CONFIG', () => {
      const lightTheme = THEMES_CONFIG.find((t) => t.id === 'pezcaderia-light');
      expect(lightTheme).toBeDefined();
      expect(lightTheme?.label).toContain('Light');
    });

    it('debe limitar el ancho de breadcrumbs a 100px y selector de tenant a 80px en móvil', () => {
      const { container } = render(
        <EnterpriseTopbar
          currentView="pos"
          onNavigateHome={() => {}}
          onNavigatePOS={() => {}}
          onToggleSidebar={() => {}}
          theme="pezcaderia-light"
          onToggleTheme={() => {}}
        />
      );

      const breadcrumbSub = screen.getByText(/Punto de Venta/i);
      expect(breadcrumbSub.className).toContain('max-w-[100px]');
      expect(breadcrumbSub.className).toContain('truncate');

      const tenantSelectorBtn = container.querySelector('#topbar-btn-tenant-selector');
      expect(tenantSelectorBtn).toBeInTheDocument();
      const tenantText = tenantSelectorBtn?.querySelector('span');
      expect(tenantText?.className).toContain('max-w-[80px]');
    });

    it('debe ocultar controles secundarios en pantallas móviles (< sm)', () => {
      const { container } = render(
        <EnterpriseTopbar
          currentView="pos"
          onNavigateHome={() => {}}
          onNavigatePOS={() => {}}
          onToggleSidebar={() => {}}
          theme="pezcaderia-light"
          onToggleTheme={() => {}}
          onOpenOmnibox={() => {}}
        />
      );

      // Selector de temas oculto en < sm
      const themeSelectorWrapper = container.querySelector('.relative.hidden.sm\\:flex');
      expect(themeSelectorWrapper).toBeInTheDocument();

      // Omnibox oculto en < sm
      const omniboxBtn = screen.getByLabelText('Buscar');
      expect(omniboxBtn.className).toContain('hidden');
      expect(omniboxBtn.className).toContain('sm:flex');
    });
  });
});
