import { useEffect, useMemo } from 'react';
import { createLogger } from '../lib/consoleLogger';
import { useAppStore } from '../store/useAppStore';
import { AppRouteId, type ERPViewKey } from './AppRoute';

const VALID_ROUTES: (ERPViewKey | string)[] = [
  AppRouteId.DASHBOARD,
  AppRouteId.POS,
  AppRouteId.POS_OFFLINE,
  AppRouteId.CASHIER_KANBAN,
  AppRouteId.CASH_DESK,
  AppRouteId.INVENTORY,
  AppRouteId.WAREHOUSE_CONFIG,
  AppRouteId.KARDEX,
  AppRouteId.DOCK_PURCHASES,
  AppRouteId.MEAT_CUTTING,
  AppRouteId.ORDER_PICKING,
  AppRouteId.DISPATCHES,
  AppRouteId.OTIF_DASHBOARD,
  AppRouteId.PRICES,
  AppRouteId.HR,
  AppRouteId.PAYROLL,
  AppRouteId.ACCOUNTS_RECEIVABLE,
  AppRouteId.CLIENTS,
  AppRouteId.SUPPLIERS,
  AppRouteId.ORDERS_KANBAN,
  AppRouteId.CRM,
  AppRouteId.ACCOUNTING,
  AppRouteId.COLD_STORAGE_RENTAL,
  AppRouteId.B2B_EXTERNAL_SALES,
  AppRouteId.B2B_PORTAL,
  AppRouteId.DRIVER_PORTAL,
  AppRouteId.SUPERADMIN,
  AppRouteId.MOSTRADOR,
];

/**
 * Hook para la sincronización reactiva de URL hash con useAppStore.setCurrentView.
 * Soporta navegación fluida por deep-linking y PWA (SPEC-052 / SPEC-053).
 */
export function useHashRouting() {
  const log = useMemo(() => createLogger('HashRouting'), []);
  const currentView = useAppStore((s) => s.currentView);
  const setCurrentView = useAppStore((s) => s.setCurrentView);

  useEffect(() => {
    const syncHashRoute = () => {
      const hash = window.location.hash.replace('#', '').replace('/', '');
      const pathname = window.location.pathname.replace(/^\//, '');
      const candidate = (hash || pathname || '').toLowerCase().trim();

      if (VALID_ROUTES.includes(candidate)) {
        setCurrentView(candidate as any);
      }
    };

    syncHashRoute();
    window.addEventListener('hashchange', syncHashRoute);
    return () => window.removeEventListener('hashchange', syncHashRoute);
  }, [setCurrentView]);

  useEffect(() => {
    log.info('navegacion', { vista: currentView });
  }, [currentView, log]);
}
