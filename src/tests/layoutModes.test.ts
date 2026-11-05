import { describe, it, expect } from 'vitest';
import { AppRouteId } from '../routes/AppRoute';
import {
  TRANSACTIONAL_FIXED_VIEWS,
  isTransactionalFixedView,
  getMainLayoutClasses
} from '../components/layout/layoutModes';

describe('Layout Modes & Viewport Constraints (SPEC-052 / SPEC-038)', () => {
  describe('R1: Dashboard Scroll Unfreeze', () => {
    it('debe excluir AppRouteId.DASHBOARD de TRANSACTIONAL_FIXED_VIEWS', () => {
      expect(TRANSACTIONAL_FIXED_VIEWS).not.toContain(AppRouteId.DASHBOARD);
      expect((TRANSACTIONAL_FIXED_VIEWS as readonly string[])).not.toContain('dashboard');
    });

    it('debe retornar false en isTransactionalFixedView para dashboard', () => {
      expect(isTransactionalFixedView('dashboard')).toBe(false);
      expect(isTransactionalFixedView(AppRouteId.DASHBOARD)).toBe(false);
    });

    it('debe asignar overflow-y-auto y min-h-0 a dashboard sin overflow-hidden ni altura fija', () => {
      const classes = getMainLayoutClasses('dashboard');

      // Clases requeridas para scroll vertical fluido
      expect(classes).toContain('overflow-y-auto');
      expect(classes).toContain('custom-scrollbar');
      expect(classes).toContain('min-h-0');
      expect(classes).toContain('flex-1');
      expect(classes).toContain('px-2.5 pb-2 lg:px-3 lg:pb-2.5 pt-0');

      // Invariante estricto: NO debe contener overflow-hidden ni cálculo restrictivo de viewport
      expect(classes).not.toContain('overflow-hidden');
      expect(classes).not.toContain('h-[calc(100vh');

      // Verificación de contrato exacto
      const expectedClasses = 'flex-1 px-2.5 pb-2 lg:px-3 lg:pb-2.5 pt-0 overflow-y-auto custom-scrollbar min-h-0';
      expect(classes).toBe(expectedClasses);
      expect(getMainLayoutClasses(AppRouteId.DASHBOARD)).toBe(expectedClasses);
    });
  });

  describe('Preservación de Vistas Transaccionales Fijas', () => {
    const fixedViewCases = [
      { name: 'POS', rawKey: 'pos', routeId: AppRouteId.POS },
      { name: 'Kanban Pedidos (canónico)', rawKey: 'kanban', routeId: AppRouteId.ORDERS_KANBAN },
      { name: 'Kanban Pedidos (alias legacy)', rawKey: 'order-kanban', routeId: AppRouteId.ORDERS_KANBAN },
      { name: 'Caja / Flujo de Efectivo (canónico)', rawKey: 'caja', routeId: AppRouteId.CASH_DESK },
      { name: 'Caja / Flujo de Efectivo (alias legacy)', rawKey: 'cash-flow', routeId: AppRouteId.CASH_DESK },
      { name: 'Alistamiento / Picking', rawKey: 'alistamiento', routeId: AppRouteId.ORDER_PICKING },
      { name: 'Despachos (canónico)', rawKey: 'despachos', routeId: AppRouteId.DISPATCHES },
      { name: 'Despachos (alias legacy)', rawKey: 'dispatch', routeId: AppRouteId.DISPATCHES },
    ];

    it.each(fixedViewCases)(
      'debe mantener isTransactionalFixedView=true para $name',
      ({ rawKey }) => {
        expect(isTransactionalFixedView(rawKey)).toBe(true);
      }
    );

    it.each(fixedViewCases)(
      'debe asignar overflow-hidden y altura fija a $name',
      ({ rawKey }) => {
        const classes = getMainLayoutClasses(rawKey);

        expect(classes).toContain('overflow-hidden');
        expect(classes).toContain('h-[calc(100vh-theme(spacing.12)-theme(spacing.3))]');
        expect(classes).toContain('min-h-0');
        expect(classes).not.toContain('overflow-y-auto');
      }
    );
  });

  describe('Vistas Documentales y Administrativas', () => {
    it('debe mantener scroll natural para vistas no transaccionales', () => {
      const administrativeViews = ['clientes', 'proveedores', 'nomina', 'reportes', 'inventario', 'kardex'];

      for (const view of administrativeViews) {
        expect(isTransactionalFixedView(view)).toBe(false);
        const classes = getMainLayoutClasses(view);
        expect(classes).toContain('overflow-y-auto');
        expect(classes).not.toContain('overflow-hidden');
      }

      // Casos límites y vacíos
      expect(isTransactionalFixedView(undefined)).toBe(false);
      expect(isTransactionalFixedView('')).toBe(false);
      expect(getMainLayoutClasses(undefined)).toContain('overflow-y-auto');
    });
  });
});
