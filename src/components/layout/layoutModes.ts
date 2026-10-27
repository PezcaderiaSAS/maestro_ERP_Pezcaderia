import { AppRouteId, type ERPViewKey } from '../../routes/AppRoute';

/**
 * Vistas transaccionales y operativas de alta densidad que se fijan a la altura de la pantalla (100vh)
 * sin scroll exterior de ventana en laptops y escritorios, delegando el scroll a paneles internos.
 */
export const TRANSACTIONAL_FIXED_VIEWS: readonly ERPViewKey[] = [
  AppRouteId.POS,
  AppRouteId.ORDERS_KANBAN, // 'kanban'
  AppRouteId.DASHBOARD,     // 'dashboard'
  AppRouteId.CASH_DESK,     // 'caja'
  AppRouteId.ORDER_PICKING, // 'alistamiento'
  AppRouteId.DISPATCHES     // 'despachos'
] as const;

/**
 * Mapeo de normalización para alias heredados.
 */
function normalizeViewKey(viewKey: string | undefined): string | undefined {
  if (!viewKey) return undefined;
  if (viewKey === 'order-kanban') return AppRouteId.ORDERS_KANBAN;
  if (viewKey === 'cash-flow') return AppRouteId.CASH_DESK;
  if (viewKey === 'dispatch') return AppRouteId.DISPATCHES;
  return viewKey;
}

/**
 * Determina si una vista debe renderizarse con layout rígido sin scroll exterior de ventana.
 */
export function isTransactionalFixedView(viewKey: string | undefined): boolean {
  const normalized = normalizeViewKey(viewKey);
  if (!normalized) return false;
  return (TRANSACTIONAL_FIXED_VIEWS as readonly string[]).includes(normalized);
}

/**
 * Genera las clases CSS óptimas de Tailwind para el contenedor <main> según la vista.
 * Optimizado para pantallas de laptop (1366x768 / 1080p).
 */
export function getMainLayoutClasses(viewKey: string | undefined): string {
  const isFixed = isTransactionalFixedView(viewKey);

  // Clases base ergonómicas para laptop
  const paddingClasses = 'px-2.5 pb-2 lg:px-3 lg:pb-2.5 pt-0';

  if (isFixed) {
    return `flex-1 ${paddingClasses} overflow-hidden flex flex-col h-[calc(100vh-theme(spacing.12)-theme(spacing.3))] min-h-0`;
  }

  // Vistas documentales / administrativas con scroll fluido
  return `flex-1 ${paddingClasses} overflow-y-auto custom-scrollbar min-h-0`;
}
