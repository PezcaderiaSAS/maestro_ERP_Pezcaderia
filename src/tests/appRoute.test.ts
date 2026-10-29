import { describe, it, expect } from 'vitest';
import {
  AppRouteId,
  RouteDomain,
  COMMERCIAL_ROUTES,
  WMS_ROUTES,
  FINANCIAL_ROUTES,
  ADMIN_ROUTES,
  APP_ROUTES_METADATA,
  routeToPath,
  pathToRoute,
  isValidAppRouteId,
  isRouteAllowedForRole,
  getRouteBreadcrumbs,
} from '../routes/AppRoute';
import type { UserRole } from '../store/useAppStore';

describe('AppRoute — Arquitectura Central de Rutas SDD', () => {
  it('debe contener exactamente las 27 rutas oficiales del ERP sin duplicados', () => {
    const routeValues = Object.values(AppRouteId);
    expect(routeValues.length).toBe(27);

    const uniqueValues = new Set(routeValues);
    expect(uniqueValues.size).toBe(27);
  });

  it('debe tener metadatos completos y válidos para cada AppRouteId, incluyendo OTIF_DASHBOARD y B2B_PORTAL', () => {
    expect(AppRouteId.OTIF_DASHBOARD).toBe('metricas_otif');
    const otifMeta = APP_ROUTES_METADATA[AppRouteId.OTIF_DASHBOARD];
    expect(otifMeta).toBeDefined();
    expect(otifMeta.path).toBe('/operaciones/metricas-otif');
    expect(otifMeta.domain).toBe(RouteDomain.WMS);

    expect(AppRouteId.B2B_PORTAL).toBe('portal_b2b');
    const b2bMeta = APP_ROUTES_METADATA[AppRouteId.B2B_PORTAL];
    expect(b2bMeta).toBeDefined();
    expect(b2bMeta.path).toBe('/ventas/portal-b2b');
    expect(b2bMeta.domain).toBe(RouteDomain.COMMERCIAL);

    Object.values(AppRouteId).forEach((routeId) => {
      const meta = APP_ROUTES_METADATA[routeId];
      expect(meta).toBeDefined();
      expect(meta.id).toBe(routeId);
      expect(meta.path.startsWith('/')).toBe(true);
      expect(meta.title.trim().length).toBeGreaterThan(0);
      expect(meta.subtitle.trim().length).toBeGreaterThan(0);
      expect(meta.description.trim().length).toBeGreaterThan(0);
      expect(meta.iconName.trim().length).toBeGreaterThan(0);
      expect(meta.allowedRoles.length).toBeGreaterThan(0);
      expect(meta.testId.startsWith('nav-')).toBe(true);
    });
  });

  it('debe segmentar limpiamente las rutas en los 4 dominios de negocio', () => {
    const allCategorized = [
      ...COMMERCIAL_ROUTES,
      ...WMS_ROUTES,
      ...FINANCIAL_ROUTES,
      ...ADMIN_ROUTES,
    ];

    expect(allCategorized.length).toBe(27);
    const uniqueCategorized = new Set(allCategorized);
    expect(uniqueCategorized.size).toBe(27);

    // Verificar correspondencia de dominio en metadatos
    COMMERCIAL_ROUTES.forEach((id) => {
      expect(APP_ROUTES_METADATA[id].domain).toBe(RouteDomain.COMMERCIAL);
    });
    WMS_ROUTES.forEach((id) => {
      expect(APP_ROUTES_METADATA[id].domain).toBe(RouteDomain.WMS);
    });
    FINANCIAL_ROUTES.forEach((id) => {
      expect(APP_ROUTES_METADATA[id].domain).toBe(RouteDomain.FINANCIAL);
    });
    ADMIN_ROUTES.forEach((id) => {
      expect(APP_ROUTES_METADATA[id].domain).toBe(RouteDomain.ADMIN);
    });
  });

  describe('Deep Linking Declarativo', () => {
    it('debe generar URLs limpias sin parámetros', () => {
      const url = routeToPath(AppRouteId.POS);
      expect(url).toBe('/ventas/pos');

      const urlKardex = routeToPath(AppRouteId.KARDEX);
      expect(urlKardex).toBe('/bodega/kardex');
    });

    it('debe serializar parámetros tipados en la query string de forma segura', () => {
      const url = routeToPath(AppRouteId.POS, {
        quoteId: 'COT-8942',
        customerId: 'CLI-001',
      });
      expect(url).toBe('/ventas/pos?quoteId=COT-8942&customerId=CLI-001');

      const urlDispatches = routeToPath(AppRouteId.DISPATCHES, {
        routeId: 'ROUTE-NORTE-01',
        activeTab: 'settlement',
      });
      expect(urlDispatches).toBe('/operaciones/despachos?routeId=ROUTE-NORTE-01&activeTab=settlement');
    });

    it('debe resolver URLs entrantes al AppRouteId y extraer sus parámetros', () => {
      const resolved = pathToRoute('/ventas/pos', '?quoteId=COT-8942&customerId=CLI-001');
      expect(resolved.routeId).toBe(AppRouteId.POS);
      expect(resolved.params).toEqual({
        quoteId: 'COT-8942',
        customerId: 'CLI-001',
      });

      const resolvedSlash = pathToRoute('/bodega/inventario/');
      expect(resolvedSlash.routeId).toBe(AppRouteId.INVENTORY);

      const unknownFallback = pathToRoute('/ruta-inexistente');
      expect(unknownFallback.routeId).toBe(AppRouteId.DASHBOARD);
    });
  });

  describe('Seguridad RBAC y Type Guards', () => {
    it('debe validar si un string es un AppRouteId válido', () => {
      expect(isValidAppRouteId('pos')).toBe(true);
      expect(isValidAppRouteId('kardex')).toBe(true);
      expect(isValidAppRouteId('ruta_falsa')).toBe(false);
      expect(isValidAppRouteId(null)).toBe(false);
      expect(isValidAppRouteId(123)).toBe(false);
    });

    it('debe aplicar la matriz de roles estricta RBAC', () => {
      const adminRole: UserRole = 'admin';
      const vendedorRole: UserRole = 'vendedor';
      const bodegaRole: UserRole = 'bodega';

      // Admin tiene acceso universal a todas las rutas
      Object.values(AppRouteId).forEach((routeId) => {
        expect(isRouteAllowedForRole(routeId, adminRole)).toBe(true);
      });

      // Vendedor tiene acceso a POS y Caja, pero NO a Kardex o Compras de Muelle
      expect(isRouteAllowedForRole(AppRouteId.POS, vendedorRole)).toBe(true);
      expect(isRouteAllowedForRole(AppRouteId.CASH_DESK, vendedorRole)).toBe(true);
      expect(isRouteAllowedForRole(AppRouteId.KARDEX, vendedorRole)).toBe(false);
      expect(isRouteAllowedForRole(AppRouteId.DOCK_PURCHASES, vendedorRole)).toBe(false);

      // Bodega tiene acceso a Inventario, Kardex, Picking y Despachos, pero NO a Cartera o Contabilidad
      expect(isRouteAllowedForRole(AppRouteId.INVENTORY, bodegaRole)).toBe(true);
      expect(isRouteAllowedForRole(AppRouteId.KARDEX, bodegaRole)).toBe(true);
      expect(isRouteAllowedForRole(AppRouteId.ACCOUNTS_RECEIVABLE, bodegaRole)).toBe(false);
      expect(isRouteAllowedForRole(AppRouteId.ACCOUNTING, bodegaRole)).toBe(false);
    });

    it('debe generar breadcrumbs consistentes con Ubiquitous Language', () => {
      const posCrumbs = getRouteBreadcrumbs(AppRouteId.POS);
      expect(posCrumbs.domain).toBe(RouteDomain.COMMERCIAL);
      expect(posCrumbs.sub).toContain('Punto de Venta (POS)');

      const kardexCrumbs = getRouteBreadcrumbs(AppRouteId.KARDEX);
      expect(kardexCrumbs.domain).toBe(RouteDomain.WMS);
      expect(kardexCrumbs.sub).toContain('Kardex Contable (NIIF)');
    });
  });
});
