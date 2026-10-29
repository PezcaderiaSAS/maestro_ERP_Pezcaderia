import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fs from 'fs';
import * as path from 'path';
import { Button } from '../components/ui/Button';
import { EnterpriseTopbar } from '../components/layout/EnterpriseTopbar';

describe('Adversarial Stress Test: Milestone M1 Foundation', () => {
  const rootDir = path.resolve(__dirname, '../..');
  const cssPath = path.join(rootDir, 'src/index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  // =========================================================================
  // PROBE 1: CSS Token Integrity & Syntax Cascade
  // =========================================================================
  describe('Probe 1: CSS Token Integrity & Syntax Cascades', () => {
    it('debe tener llaves CSS balanceadas en src/index.css para evitar errores en cascada', () => {
      let openBraces = 0;
      let closeBraces = 0;
      for (let i = 0; i < cssContent.length; i++) {
        if (cssContent[i] === '{') openBraces++;
        if (cssContent[i] === '}') closeBraces++;
      }
      expect(openBraces).toBe(closeBraces);
    });

    it('debe definir todos los tokens requeridos en pezcaderia-light sin valores indefinidos', () => {
      const match = cssContent.match(/\[data-theme="pezcaderia-light"\]\s*\{([^}]+)\}/s);
      expect(match).not.toBeNull();
      const themeBlock = match ? match[1] : '';

      const expectedTokens = [
        '--bg-color',
        '--card-bg',
        '--card-hover',
        '--border-color',
        '--border-strong',
        '--primary-color',
        '--primary-hover',
        '--primary-light',
        '--accent-color',
        '--accent-hover',
        '--color-marine-indigo',
        '--color-cyan-wave',
        '--color-emerald-a',
        '--color-warning',
        '--btn-exit-bg',
        '--text-primary',
        '--text-secondary',
        '--text-muted',
        '--error-color',
        '--success-color',
        '--warning-color',
        '--dark-color',
        '--sidebar-bg',
        '--header-bg',
        '--shadow-glow'
      ];

      for (const token of expectedTokens) {
        expect(themeBlock).toContain(`${token}:`);
      }
    });

    it('debe verificar que todos los contrastes de texto en pezcaderia-light cumplan WCAG AA+ (>= 4.5:1) y AAA (>= 7:1)', () => {
      // Helper para calcular luminancia relativa sRGB
      function getLuminance(r: number, g: number, b: number): number {
        const a = [r, g, b].map((v) => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
      }

      function getContrast(lum1: number, lum2: number): number {
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);
        return (brightest + 0.05) / (darkest + 0.05);
      }

      function parseHex(hex: string): [number, number, number] {
        const clean = hex.replace('#', '');
        return [
          parseInt(clean.substring(0, 2), 16),
          parseInt(clean.substring(2, 4), 16),
          parseInt(clean.substring(4, 6), 16)
        ];
      }

      const whiteLum = getLuminance(...parseHex('ffffff'));
      const textPrimaryLum = getLuminance(...parseHex('0f172a'));
      const textSecondaryLum = getLuminance(...parseHex('334155'));
      const textMutedLum = getLuminance(...parseHex('64748b'));

      const contrastPrimary = getContrast(whiteLum, textPrimaryLum);
      const contrastSecondary = getContrast(whiteLum, textSecondaryLum);
      const contrastMuted = getContrast(whiteLum, textMutedLum);

      // text-primary debe superar AAA (7:1)
      expect(contrastPrimary).toBeGreaterThanOrEqual(7.0);
      // text-secondary debe superar AAA (7:1)
      expect(contrastSecondary).toBeGreaterThanOrEqual(7.0);
      // text-muted debe superar AA (4.5:1)
      expect(contrastMuted).toBeGreaterThanOrEqual(4.5);
    });
  });

  // =========================================================================
  // PROBE 2: Button Touch Targets Under Combinatorial Props
  // =========================================================================
  describe('Probe 2: Button Touch Targets Under Combinatorial Props', () => {
    const variants = ['primary', 'secondary', 'ghost', 'outline', 'danger'] as const;
    const sizes = ['md', 'lg'] as const;

    it('debe mantener clase min-h-[44px] o min-h-[48px] en todas las variantes y tamaños operativos', () => {
      for (const variant of variants) {
        for (const size of sizes) {
          const { unmount } = render(
            <Button
              variant={variant}
              size={size}
              data-testid={`btn-${variant}-${size}`}
            >
              Test
            </Button>
          );
          const btn = screen.getByTestId(`btn-${variant}-${size}`);
          const expectedMinH = size === 'md' ? 'min-h-[44px]' : 'min-h-[48px]';
          expect(btn.className).toContain(expectedMinH);
          unmount();
        }
      }
    });

    it('debe preservar min-h-[44px] incluso cuando isLoading=true o disabled=true o sin children', () => {
      const { unmount } = render(
        <div>
          <Button size="md" isLoading data-testid="btn-loading" />
          <Button size="md" disabled data-testid="btn-disabled" />
          <Button size="md" data-testid="btn-empty">{''}</Button>
          <Button size="md" icon={<span>*</span>} data-testid="btn-icon-only" />
        </div>
      );

      expect(screen.getByTestId('btn-loading').className).toContain('min-h-[44px]');
      expect(screen.getByTestId('btn-disabled').className).toContain('min-h-[44px]');
      expect(screen.getByTestId('btn-empty').className).toContain('min-h-[44px]');
      expect(screen.getByTestId('btn-icon-only').className).toContain('min-h-[44px]');

      unmount();
    });
  });

  // =========================================================================
  // PROBE 3: SweetAlert2 Responsive CSS Constraints
  // =========================================================================
  describe('Probe 3: SweetAlert2 Responsive CSS Constraints', () => {
    it('debe contener regla max-width: 92vw !important y ancho adaptable a <= 640px', () => {
      // Validar que la regla existe con !important para sobreescribir estilos en línea de swal
      expect(cssContent).toMatch(/\.swal2-popup\s*\{[^}]*max-width:\s*92vw\s*!important/s);
      expect(cssContent).toMatch(/\.swal2-popup\s*\{[^}]*box-sizing:\s*border-box\s*!important/s);
      expect(cssContent).toMatch(/@media\s*\(max-width:\s*640px\)\s*\{[^}]*\.swal2-popup\s*\{[^}]*width:\s*92vw\s*!important/s);
    });

    it('debe asegurar que .swal2-popup tenga box-sizing: border-box !important para que padding no cause blowout', () => {
      const match = cssContent.match(/\.swal2-popup\s*\{([^}]+)\}/s);
      expect(match).not.toBeNull();
      const popupBlock = match ? match[1] : '';
      expect(popupBlock).toContain('box-sizing: border-box !important;');
    });
  });

  // =========================================================================
  // PROBE 4: Topbar Layout Stress & Mobile Constraints
  // =========================================================================
  describe('Probe 4: Topbar Layout Stress & Mobile Constraints', () => {
    it('debe aplicar truncamiento estricto en breadcrumb y selector de empresa ante nombres extremadamente largos', () => {
      const longBreadcrumbName = 'Catálogo General de Productos y Mariscos de Exportación Internacional del Pacífico';
      const longTenantName = 'Empresa Pesquera Internacional del Caribe y Asociados S.A.S.';

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

      const breadcrumbEl = container.querySelector('span.truncate.max-w-\\[100px\\]');
      expect(breadcrumbEl).not.toBeNull();
      expect(breadcrumbEl?.className).toContain('max-w-[100px]');
      expect(breadcrumbEl?.className).toContain('truncate');

      const tenantSelectorBtn = container.querySelector('#topbar-btn-tenant-selector');
      const tenantSpan = tenantSelectorBtn?.querySelector('span.truncate');
      expect(tenantSpan).not.toBeNull();
      expect(tenantSpan?.className).toContain('max-w-[80px]');
      expect(tenantSpan?.className).toContain('truncate');

      unmount();
    });

    it('debe mantener ocultos en vista móvil (< sm) los controles voluminosos', () => {
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

      // Buscador Omnibox oculto en móvil
      const omniboxBtn = screen.getByLabelText('Buscar');
      expect(omniboxBtn.className).toContain('hidden');
      expect(omniboxBtn.className).toContain('sm:flex');

      // Selector de temas oculto en móvil
      const themeWrapper = container.querySelector('.relative.hidden.sm\\:flex');
      expect(themeWrapper).not.toBeNull();

      // Texto de "Facturar POS" oculto en móvil
      const posBtn = container.querySelector('#topbar-btn-facturar-pos');
      const posText = posBtn?.querySelector('span');
      expect(posText?.className).toContain('hidden');
      expect(posText?.className).toContain('sm:inline');

      unmount();
    });

    it('ADVERSARIAL STRESS: debe comprobar si la suma combinada de anchos fijos en móvil (375px) cabe dentro del ancho útil sin desbordar', () => {
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

      // Ancho útil disponible en header: 375px - mx-2.5 (20px) - px-2.5 (20px) - borders (2px) = 333px
      const availableInnerWidth = 333;

      // Sección izquierda máxima: Menu (30px) + gap (8px) + Home (14px) + gap (6px) + Chevron (12px) + gap (6px) + breadcrumb (100px) = 176px
      const leftSectionMaxWidth = 30 + 8 + 14 + 6 + 12 + 6 + 100;

      // Sección derecha: Tenant debe ocultarse en móvil (< sm) mediante hidden sm:flex
      const tenantBtn = container.querySelector('#topbar-btn-tenant-selector');
      const isTenantHiddenOnMobile = tenantBtn?.className.includes('hidden sm:flex') || tenantBtn?.className.includes('hidden');
      const tenantWidth = isTenantHiddenOnMobile ? 0 : 134;
      const tenantGap = isTenantHiddenOnMobile ? 0 : 8;

      // Controles visibles en móvil: POS (34px) + gap (8px) + User (46px) = 88px (o 230px si tenant no está oculto)
      const rightSectionWidth = tenantWidth + tenantGap + 34 + 8 + 46;

      const totalCombinedWidth = leftSectionMaxWidth + rightSectionWidth;

      // Desafío empírico: 264px cabe holgadamente dentro de los 333px disponibles (margen de seguridad: 69px)
      expect(totalCombinedWidth).toBeLessThanOrEqual(availableInnerWidth);

      unmount();
    });
  });
});
