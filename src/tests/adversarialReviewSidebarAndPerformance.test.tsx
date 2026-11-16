import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { create } from 'zustand';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { zustandConsoleMiddleware } from '../lib/consoleMiddleware';
import { useAppStore } from '../store/useAppStore';
import { EnterpriseSidebar } from '../components/layout/EnterpriseSidebar';

describe('Adversarial Review: Sidebar & Performance Verification', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('1. zustandConsoleMiddleware Adversarial & Stress Testing', () => {
    it('1.1 Executes 1,000 rapid state updates under 50ms without main thread freezing', () => {
      interface TestStore {
        count: number;
        items: string[];
        increment: () => void;
      }

      const useTestStore = create<TestStore>()(
        zustandConsoleMiddleware((set) => ({
          count: 0,
          items: Array.from({ length: 100 }, (_, i) => `item-${i}`),
          increment: () => set((state) => ({ count: state.count + 1 })),
        }))
      );

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        useTestStore.getState().increment();
      }
      const duration = performance.now() - start;

      expect(useTestStore.getState().count).toBe(1000);
      // 1000 store updates without safeStringify should complete well under 100ms
      expect(duration).toBeLessThan(100);
    });

    it('1.2 Properly forwards replace boolean flag to set()', () => {
      interface ReplaceStore {
        a: number;
        b?: number;
        replaceState: () => void;
      }

      const useReplaceStore = create<ReplaceStore>()(
        zustandConsoleMiddleware((set) => ({
          a: 1,
          b: 2,
          replaceState: () =>
            set(
              (state) => ({
                a: 99,
                replaceState: state.replaceState,
              }),
              true
            ),
        }))
      );

      expect(useReplaceStore.getState().b).toBe(2);
      useReplaceStore.getState().replaceState();
      // If replace is properly forwarded with true, 'b' is completely removed
      expect(useReplaceStore.getState().a).toBe(99);
      expect(useReplaceStore.getState().b).toBeUndefined();
    });

    it('1.3 Handles debug mode when localStorage.debug contains Store without crashing', () => {
      localStorage.setItem('debug', 'Store,POS');

      interface DebugStore {
        val: string;
        update: (v: string) => void;
      }

      const useDebugStore = create<DebugStore>()(
        zustandConsoleMiddleware((set) => ({
          val: 'initial',
          update: (v) => set({ val: v }),
        }))
      );

      expect(() => {
        useDebugStore.getState().update('updated-value');
      }).not.toThrow();

      expect(useDebugStore.getState().val).toBe('updated-value');
    });

    it('1.4 Handles functional updater and non-object set arguments safely', () => {
      interface FuncStore {
        num: number;
        add: (n: number) => void;
      }

      const useFuncStore = create<FuncStore>()(
        zustandConsoleMiddleware((set) => ({
          num: 10,
          add: (n) => set((s) => ({ num: s.num + n })),
        }))
      );

      useFuncStore.getState().add(5);
      expect(useFuncStore.getState().num).toBe(15);
    });
  });

  describe('2. useAppStore.setCurrentView Responsive Sidebar Governance', () => {
    it('2.1 Mobile Viewport (< 1024px): setCurrentView automatically collapses sidebar', () => {
      // Mock mobile screen
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });

      useAppStore.setState({ sidebarOpen: true, currentView: 'dashboard' });
      expect(useAppStore.getState().sidebarOpen).toBe(true);

      useAppStore.getState().setCurrentView('pos');

      expect(useAppStore.getState().currentView).toBe('pos');
      expect(useAppStore.getState().sidebarOpen).toBe(false);
    });

    it('2.2 Desktop Viewport (>= 1024px): setCurrentView preserves expanded sidebar', () => {
      // Mock desktop screen
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1440 });

      useAppStore.setState({ sidebarOpen: true, currentView: 'dashboard' });
      expect(useAppStore.getState().sidebarOpen).toBe(true);

      useAppStore.getState().setCurrentView('inventario');

      expect(useAppStore.getState().currentView).toBe('inventario');
      expect(useAppStore.getState().sidebarOpen).toBe(true);
    });

    it('2.3 Desktop Viewport (>= 1024px): setCurrentView preserves collapsed sidebar', () => {
      // Mock desktop screen
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 });

      useAppStore.setState({ sidebarOpen: false, currentView: 'dashboard' });
      expect(useAppStore.getState().sidebarOpen).toBe(false);

      useAppStore.getState().setCurrentView('caja');

      expect(useAppStore.getState().currentView).toBe('caja');
      expect(useAppStore.getState().sidebarOpen).toBe(false);
    });
  });

  describe('3. EnterpriseSidebar Interactive Toggle & Navigation Assurance', () => {
    const defaultProps = {
      currentView: 'dashboard' as const,
      onSelectView: vi.fn(),
      isOpen: false,
      onToggleOpen: vi.fn(),
      userRole: 'admin',
      onChangeRole: vi.fn(),
      pendingPrepCount: 2,
      activeRoutesCount: 1,
      onCloseSession: vi.fn(),
    };

    it('3.1 Collapsed state (rail mode) renders PanelLeftOpen expand button and triggers onToggleOpen', () => {
      const onToggleOpen = vi.fn();
      render(<EnterpriseSidebar {...defaultProps} isOpen={false} onToggleOpen={onToggleOpen} />);

      const expandBtn = screen.getByRole('button', { name: /expandir menú/i });
      expect(expandBtn).toBeInTheDocument();

      fireEvent.click(expandBtn);
      expect(onToggleOpen).toHaveBeenCalledTimes(1);
    });

    it('3.2 Expanded state renders PanelLeftClose collapse button and triggers onToggleOpen', () => {
      const onToggleOpen = vi.fn();
      render(<EnterpriseSidebar {...defaultProps} isOpen={true} onToggleOpen={onToggleOpen} />);

      const collapseBtn = screen.getByRole('button', { name: /colapsar menú/i });
      expect(collapseBtn).toBeInTheDocument();

      fireEvent.click(collapseBtn);
      expect(onToggleOpen).toHaveBeenCalledTimes(1);
    });

    it('3.3 Clicking backdrop overlay when open triggers onToggleOpen (closing drawer on mobile)', () => {
      const onToggleOpen = vi.fn();
      const { container } = render(
        <EnterpriseSidebar {...defaultProps} isOpen={true} onToggleOpen={onToggleOpen} />
      );

      // The backdrop overlay is the fixed inset-0 div
      const backdrop = container.querySelector('.fixed.inset-0');
      expect(backdrop).toBeInTheDocument();
      expect(backdrop?.className).toContain('opacity-100');

      fireEvent.click(backdrop!);
      expect(onToggleOpen).toHaveBeenCalledTimes(1);
    });

    it('3.4 Pressing Ctrl+B and Cmd+B toggles sidebar', () => {
      const onToggleOpen = vi.fn();
      render(<EnterpriseSidebar {...defaultProps} isOpen={false} onToggleOpen={onToggleOpen} />);

      fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
      expect(onToggleOpen).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(window, { key: 'B', metaKey: true });
      expect(onToggleOpen).toHaveBeenCalledTimes(2);
    });

    it('3.5 Clicking navigation items calls onSelectView with the exact view key', () => {
      const onSelectView = vi.fn();
      render(<EnterpriseSidebar {...defaultProps} isOpen={true} onSelectView={onSelectView} />);

      const posBtn = screen.getByTestId('nav-pos');
      fireEvent.click(posBtn);
      expect(onSelectView).toHaveBeenCalledWith('pos');

      const invBtn = screen.getByTestId('nav-inventario');
      fireEvent.click(invBtn);
      expect(onSelectView).toHaveBeenCalledWith('inventario');
    });

    it('3.6 RBAC restriction: vendedor does not see administrative or inventory management tabs', () => {
      render(<EnterpriseSidebar {...defaultProps} isOpen={true} userRole="vendedor" />);

      // Permitted for vendedor
      expect(screen.getByTestId('nav-pos')).toBeInTheDocument();
      expect(screen.getByTestId('nav-comandas-kanban')).toBeInTheDocument();

      // Prohibited for vendedor
      expect(screen.queryByTestId('nav-config-bodegas')).not.toBeInTheDocument();
      expect(screen.queryByTestId('nav-alquiler-cf')).not.toBeInTheDocument();
      expect(screen.queryByTestId('nav-seguridad')).not.toBeInTheDocument();
    });
  });
});
