import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GlassCard } from '../components/layout/components/GlassCard';
import { EnterpriseTopbar } from '../components/layout/EnterpriseTopbar';

describe('Layout Shell Global V8 & Glassmorphism (SPEC-031)', () => {
  describe('Componente Atómico GlassCard', () => {
    it('debe renderizar con panel flotante Dark Glassmorphism (rounded-3xl y backdrop-blur-2xl)', () => {
      const { container } = render(
        <GlassCard data-testid="test-glass-card">
          <p>Contenido interior</p>
        </GlassCard>
      );

      const card = container.firstElementChild as HTMLElement;
      expect(card).toBeInTheDocument();
      expect(card.className).toMatch(/rounded-3xl|rounded-2xl/);
      expect(card.className).toMatch(/backdrop-blur-2xl|backdrop-blur-xl/);
      expect(card.className).toMatch(/bg-slate-900\/85|bg-slate-900/);
    });

    it('debe renderizar los tres controles macOS cuando showMacControls sea true', () => {
      render(
        <GlassCard
          showMacControls={true}
          title="MÉTRICAS EN VIVO"
          badge="ONLINE"
        >
          <p>Cuerpo de prueba</p>
        </GlassCard>
      );

      expect(screen.getByTestId('mac-control-close')).toBeInTheDocument();
      expect(screen.getByTestId('mac-control-minimize')).toBeInTheDocument();
      expect(screen.getByTestId('mac-control-fullscreen')).toBeInTheDocument();
      expect(screen.getByText('MÉTRICAS EN VIVO')).toBeInTheDocument();
      expect(screen.getByText('ONLINE')).toBeInTheDocument();
    });

    it('debe invocar callbacks de controles macOS si se proveen', () => {
      const onClose = vi.fn();
      const onMinimize = vi.fn();
      const onFullscreen = vi.fn();

      render(
        <GlassCard
          showMacControls={true}
          onClose={onClose}
          onMinimize={onMinimize}
          onFullscreen={onFullscreen}
        >
          <p>Cuerpo</p>
        </GlassCard>
      );

      fireEvent.click(screen.getByTestId('mac-control-close'));
      expect(onClose).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByTestId('mac-control-minimize'));
      expect(onMinimize).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByTestId('mac-control-fullscreen'));
      expect(onFullscreen).toHaveBeenCalledTimes(1);
    });
  });

  describe('Barra Superior Flotante EnterpriseTopbar V8', () => {
    it('debe flotar con estética Dark Glassmorphism (rounded-2xl, backdrop-blur-2xl y bg-slate-900/85)', () => {
      const { container } = render(
        <EnterpriseTopbar
          currentView="pos"
          onNavigateHome={() => {}}
          onNavigatePOS={() => {}}
          onToggleSidebar={() => {}}
          theme="pezcaderia-glass"
          onToggleTheme={() => {}}
        />
      );

      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
      expect(header?.className).toMatch(/rounded-2xl|rounded-3xl/);
      expect(header?.className).toMatch(/backdrop-blur-2xl|backdrop-blur-xl/);
      expect(header?.className).toMatch(/bg-slate-900\/85|bg-slate-900/);
    });

    it('debe proveer acceso rápido al buscador Omnibox y botón Facturar POS', () => {
      const onOpenOmnibox = vi.fn();
      const onNavigatePOS = vi.fn();

      render(
        <EnterpriseTopbar
          currentView="inventario"
          onNavigateHome={() => {}}
          onNavigatePOS={onNavigatePOS}
          onToggleSidebar={() => {}}
          theme="pezcaderia-glass"
          onToggleTheme={() => {}}
          onOpenOmnibox={onOpenOmnibox}
        />
      );

      expect(screen.getByText(/Buscar/i)).toBeInTheDocument();
      expect(screen.getByText(/Facturar/i)).toBeInTheDocument();
    });
  });
});
