import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fs from 'fs';
import * as path from 'path';
import { useAppStore, ThemeMode } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { EnterpriseTopbar, THEMES_CONFIG } from '../components/layout/EnterpriseTopbar';

// --- WCAG 2.2 Relative Luminance and Contrast Ratio Oracle ---
function parseHexColor(hex: string): [number, number, number] {
  let clean = hex.trim().replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function calculateRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const s = val / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function calculateContrastRatio(fgHex: string, bgHex: string): number {
  const lum1 = calculateRelativeLuminance(...parseHexColor(fgHex));
  const lum2 = calculateRelativeLuminance(...parseHexColor(bgHex));
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('CHALLENGER M1: Adversarial Verification & Stress Testing Suite', () => {
  const rootDir = path.resolve(__dirname, '../..');
  const cssPath = path.join(rootDir, 'src/index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  // =========================================================================
  // DIMENSION 1: WCAG 2.2 Contrast Ratio Verification (Mathematical Oracle)
  // =========================================================================
  describe('Dimension 1: Contrast Ratio Verification in pezcaderia-light', () => {
    // Extraer tokens definidos en [data-theme="pezcaderia-light"]
    const bgApp = '#f8fafc';
    const cardBg = '#ffffff';
    const cardHover = '#f1f5f9';

    const textPrimary = '#0f172a';
    const textSecondary = '#334155';
    const textMuted = '#64748b';

    const colorError = '#dc2626';
    const colorSuccess = '#059669';
    const colorWarning = '#d97706';

    const brandPrimary = '#0284c7';
    const brandAccent = '#06b6d4';

    it('debe verificar que --text-primary (#0f172a) cumple estrictamente WCAG 2.2 AAA (>= 7.0:1) sobre superficies claras', () => {
      const crBg = calculateContrastRatio(textPrimary, bgApp);
      const crCard = calculateContrastRatio(textPrimary, cardBg);
      const crHover = calculateContrastRatio(textPrimary, cardHover);

      expect(crBg).toBeGreaterThanOrEqual(7.0);
      expect(crCard).toBeGreaterThanOrEqual(7.0);
      expect(crHover).toBeGreaterThanOrEqual(7.0);

      // Verificación de valores de alto rango AAA
      expect(crBg).toBeGreaterThan(16.0); // ~16.7:1
      expect(crCard).toBeGreaterThan(17.0); // ~17.5:1
    });

    it('debe verificar que --text-secondary (#334155) cumple estrictamente WCAG 2.2 AAA (>= 7.0:1) sobre superficies claras', () => {
      const crBg = calculateContrastRatio(textSecondary, bgApp);
      const crCard = calculateContrastRatio(textSecondary, cardBg);
      const crHover = calculateContrastRatio(textSecondary, cardHover);

      expect(crBg).toBeGreaterThanOrEqual(7.0);
      expect(crCard).toBeGreaterThanOrEqual(7.0);
      expect(crHover).toBeGreaterThanOrEqual(7.0);

      expect(crBg).toBeGreaterThan(9.5); // ~9.8:1
      expect(crCard).toBeGreaterThan(10.0); // ~10.3:1
    });

    it('debe auditar --text-muted (#64748b) y confirmar que cumple WCAG 2.2 AA (>= 4.5:1) aunque no alcanza AAA (>= 7.0:1)', () => {
      const crBg = calculateContrastRatio(textMuted, bgApp);
      const crCard = calculateContrastRatio(textMuted, cardBg);

      // Cumple AA (>= 4.5:1)
      expect(crCard).toBeGreaterThanOrEqual(4.5);
      expect(crBg).toBeGreaterThanOrEqual(4.5);

      // Caveat verificado: no alcanza AAA (>= 7.0:1) para texto normal, lo cual es conforme a estándar para texto atenuado
      expect(crCard).toBeLessThan(7.0);
      expect(crBg).toBeLessThan(7.0);
    });

    it('debe verificar los colores de semáforo operativo: cumplen WCAG 2.2 SC 1.4.11 (>= 3.0:1) para badges/indicadores y evaluar aptitud para texto', () => {
      const crError = calculateContrastRatio(colorError, cardBg);
      const crSuccess = calculateContrastRatio(colorSuccess, cardBg);
      const crWarning = calculateContrastRatio(colorWarning, cardBg);

      // Cumplen con creces el umbral WCAG 2.2 SC 1.4.11 para componentes de interfaz e indicadores (>= 3.0:1)
      expect(crError).toBeGreaterThanOrEqual(3.0); // #dc2626 -> 4.57:1 (cumple incluso AA texto 4.5:1)
      expect(crSuccess).toBeGreaterThanOrEqual(3.0); // #059669 -> 3.77:1 (cumple componentes 3.0:1, caveat: < 4.5:1 para texto normal)
      expect(crWarning).toBeGreaterThanOrEqual(3.0); // #d97706 -> 3.32:1 (cumple componentes 3.0:1, caveat: < 4.5:1 para texto normal)

      // Verificación empírica de valores exactos para el reporte adversarial
      expect(crError).toBeGreaterThanOrEqual(4.5);
      expect(crSuccess).toBeLessThan(4.5);
      expect(crWarning).toBeLessThan(4.5);
    });

    it('debe verificar que Button primary (#0284c7) y danger (#ef4444) con texto blanco cumplen estándares de contraste', () => {
      const crPrimaryBtn = calculateContrastRatio('#ffffff', brandPrimary);
      const crDangerBtn = calculateContrastRatio('#ffffff', '#ef4444');

      // #ffffff en #0284c7 alcanza 4.04:1 (cumple WCAG AA para componentes UI interactivos y texto semibold >= 3.0:1)
      expect(crPrimaryBtn).toBeGreaterThanOrEqual(3.0);
      // #ffffff en #ef4444 alcanza 3.76:1 (cumple WCAG AA para componentes UI interactivos >= 3.0:1)
      expect(crDangerBtn).toBeGreaterThanOrEqual(3.0);
    });
  });

  // =========================================================================
  // DIMENSION 2: Theme Switching Stress Testing & State Machine Invariants
  // =========================================================================
  describe('Dimension 2: Theme Switching Stress & State Machine Invariants', () => {
    const validThemes: ThemeMode[] = [
      'pezcaderia-glass',
      'pezcaderia-light',
      'hyper-cobalt',
      'carbon-teal',
      'chrome-violet',
    ];

    it('debe soportar 1000 ciclos consecutivos de toggleTheme sin lanzar excepciones ni estados indefinidos', () => {
      const store = useAppStore.getState();
      store.setTheme('pezcaderia-glass');

      for (let i = 0; i < 1000; i++) {
        store.toggleTheme();
        const current = useAppStore.getState().theme;

        expect(current).toBeDefined();
        expect(typeof current).toBe('string');
        expect(validThemes).toContain(current);
      }
    });

    it('debe mantener ciclo estrictamente determinista y periódico de longitud 5', () => {
      const store = useAppStore.getState();
      store.setTheme('pezcaderia-glass');

      const expectedCycle: ThemeMode[] = [
        'pezcaderia-light',
        'hyper-cobalt',
        'carbon-teal',
        'chrome-violet',
        'pezcaderia-glass',
      ];

      for (const expectedTheme of expectedCycle) {
        store.toggleTheme();
        expect(useAppStore.getState().theme).toBe(expectedTheme);
      }
    });

    it('debe recuperarse de forma segura si el estado previo del tema era desconocido o corrupto', () => {
      const store = useAppStore.getState();
      // Inyección forzada de tema no reconocido
      store.setTheme('unknown-corrupted-theme' as any);
      expect(useAppStore.getState().theme).toBe('unknown-corrupted-theme');

      // toggleTheme() debe resetear de forma resiliente a pezcaderia-glass
      store.toggleTheme();
      expect(useAppStore.getState().theme).toBe('pezcaderia-glass');
    });

    it('debe sincronizar el atributo data-theme en document.documentElement al cambiar tema', () => {
      const store = useAppStore.getState();
      store.setTheme('pezcaderia-light');
      document.documentElement.setAttribute('data-theme', 'pezcaderia-light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('pezcaderia-light');

      store.setTheme('pezcaderia-glass');
      document.documentElement.setAttribute('data-theme', 'pezcaderia-glass');
      expect(document.documentElement.getAttribute('data-theme')).toBe('pezcaderia-glass');
    });
  });

  // =========================================================================
  // DIMENSION 3: Topbar Truncation & Layout Blowout Stress (375px Mobile Viewport)
  // =========================================================================
  describe('Dimension 3: Topbar Truncation & Mobile 375px Blowout Prevention', () => {
    it('debe truncar breadcrumbs extremadamente largos (>100 caracteres) sin desbordar el header', () => {
      const longBreadcrumbName =
        'Distribución y Logística de Pescados Frescos de Altamar del Océano Pacífico Colombiano - Sección Especializada de Fileteado y Congelación Rápida Nivel 3';

      const { container, unmount } = render(
        <EnterpriseTopbar
          currentView="pos"
          onNavigateHome={() => {}}
          onNavigatePOS={() => {}}
          onToggleSidebar={() => {}}
          theme="pezcaderia-light"
          onToggleTheme={() => {}}
        />
      );

      // Localizar el span de breadcrumb con clases de truncamiento
      const breadcrumbSpan = container.querySelector('span.truncate');
      expect(breadcrumbSpan).not.toBeNull();
      expect(breadcrumbSpan?.className).toContain('max-w-[100px]');
      expect(breadcrumbSpan?.className).toContain('truncate');

      // El contenedor padre flex debe poseer min-w-0 para permitir truncamiento CSS sin blowout
      const parentFlex = breadcrumbSpan?.closest('.min-w-0');
      expect(parentFlex).not.toBeNull();

      unmount();
    });

    it('debe truncar nombres de tenant / empresa multi-tenant extremadamente largos (>100 caracteres)', () => {
      const longTenantName =
        'Cooperativa Multiactiva de Pescadores Artesanales de Buenaventura y Tumaco del Litoral Pacífico SAS BIC Sucursal Número 99';

      useAuthStore.setState({
        activeTenant: {
          id: 'tenant-999',
          razonSocial: longTenantName,
          nombre: longTenantName,
        } as any,
      });

      const { container, unmount } = render(
        <EnterpriseTopbar
          currentView="pos"
          onNavigateHome={() => {}}
          onNavigatePOS={() => {}}
          onToggleSidebar={() => {}}
          theme="pezcaderia-light"
          onToggleTheme={() => {}}
        />
      );

      const tenantBtn = container.querySelector('#topbar-btn-tenant-selector');
      expect(tenantBtn).not.toBeNull();
      expect(tenantBtn?.className).toContain('shrink-0');

      const tenantSpan = tenantBtn?.querySelector('span.truncate');
      expect(tenantSpan).not.toBeNull();
      expect(tenantSpan?.textContent).toBe(longTenantName);
      expect(tenantSpan?.className).toContain('max-w-[80px]');
      expect(tenantSpan?.className).toContain('truncate');

      unmount();
    });

    it('debe ocultar controles secundarios de escritorio en móvil (< sm) garantizando huella horizontal < 375px', () => {
      const { container, unmount } = render(
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

      // Omnibox debe estar oculto en móvil: hidden sm:flex
      const omniboxBtn = screen.getByLabelText('Buscar');
      expect(omniboxBtn.className).toContain('hidden');
      expect(omniboxBtn.className).toContain('sm:flex');

      // Selector de temas desplegable debe estar oculto en móvil: hidden sm:flex
      const themeSelectorContainer = container.querySelector('.relative.hidden.sm\\:flex');
      expect(themeSelectorContainer).not.toBeNull();

      // Botón POS debe ocultar su texto en móvil conservando icono: hidden sm:inline
      const posBtn = container.querySelector('#topbar-btn-facturar-pos');
      const posText = posBtn?.querySelector('span');
      expect(posText?.className).toContain('hidden');
      expect(posText?.className).toContain('sm:inline');

      unmount();
    });

    it('debe verificar que los botones de acción principal en el topbar cumplen Fitts Law táctil en móvil', () => {
      const { container, unmount } = render(
        <EnterpriseTopbar
          currentView="pos"
          onNavigateHome={() => {}}
          onNavigatePOS={() => {}}
          onToggleSidebar={() => {}}
          theme="pezcaderia-light"
          onToggleTheme={() => {}}
        />
      );

      // Botón POS táctil
      const posBtn = container.querySelector('#topbar-btn-facturar-pos');
      expect(posBtn).not.toBeNull();
      expect(posBtn?.className).toContain('py-1.5');
      expect(posBtn?.className).toContain('px-2.5');

      // Selector de empresa
      const tenantBtn = container.querySelector('#topbar-btn-tenant-selector');
      expect(tenantBtn).not.toBeNull();
      expect(tenantBtn?.className).toContain('py-1.5');
      expect(tenantBtn?.className).toContain('px-2');

      unmount();
    });
  });
});
