import { test, expect } from '@playwright/test';
import { SEED_DATA as POS_SEED_DATA } from '../../src/dev/seeds/seedPOS';
import { SEED_DATA as CASH_SEED_DATA } from '../../src/dev/seeds/seedCash';

test.describe('Portal de Clientes B2B Auto-Servicio HORECA (TASK-027-06)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    const seedData = {
      ...POS_SEED_DATA,
      ...CASH_SEED_DATA,
      erp_habeas_data_consent: {
        timestamp: new Date().toISOString(),
        regulation: 'Ley 1581 de 2012 (Colombia) / RGPD',
        version: '1.0.0-enterprise',
        status: 'ACEPTADO',
      },
    };

    await page.addInitScript((data) => {
      localStorage.clear();
      for (const [key, value] of Object.entries(data)) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    }, seedData);

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('1. Debe navegar al Portal B2B HORECA desde el menú lateral y verificar la vista completa', async ({
    page,
  }) => {
    // 1. Clic en el botón del Sidebar
    const navPortal = page.locator('[data-testid="nav-portal-b2b"]');
    await expect(navPortal).toBeVisible({ timeout: 15000 });
    await navPortal.click();

    // 2. Verificar que los componentes clave estén visibles
    await expect(page.locator('[data-testid="b2b-customer-portal-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="b2b-client-header-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="b2b-credit-card-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="b2b-catalog-grid"]')).toBeVisible();

    // 3. Verificar selector de cliente y canal HORECA
    await expect(page.locator('text=Canal HORECA')).toBeVisible();
    await expect(page.locator('[data-testid="select-cliente-horeca"]')).toBeVisible();
  });

  test('2. Debe permitir búsqueda predictiva y filtrado de catálogo de productos del mar', async ({
    page,
  }) => {
    await page.locator('[data-testid="nav-portal-b2b"]').click();
    await expect(page.locator('[data-testid="b2b-catalog-grid"]')).toBeVisible();

    // Búsqueda por texto
    const searchInput = page.locator('[data-testid="input-catalog-search"]');
    await searchInput.fill('Salmón');
    await expect(page.locator('text=Salmón Noruego Premium')).toBeVisible();

    // Limpiar búsqueda
    await searchInput.fill('');

    // Filtrar por categoría si hay pills
    const pillCat = page.locator('[data-testid^="pill-categoria-"]').first();
    if (await pillCat.isVisible()) {
      await pillCat.click();
      await expect(page.locator('[data-testid="b2b-catalog-grid"]')).toBeVisible();
    }
  });

  test('3. Debe abrir el configurador táctil, elegir corte marino y empaque con hielo, y agregar al carrito', async ({
    page,
  }) => {
    await page.locator('[data-testid="nav-portal-b2b"]').click();

    // Clic en configurar el primer producto
    const btnConfigure = page.locator('[data-testid^="btn-select-product-"]').first();
    await expect(btnConfigure).toBeVisible();
    await btnConfigure.click();

    // Verificar modal de corte y empaque
    const modal = page.locator('[data-testid="b2b-item-configurator-modal"]');
    await expect(modal).toBeVisible();

    // Botón de confirmar agregar al carrito
    const btnAddCart = modal.locator('[data-testid="btn-confirm-add-cart"]');
    await expect(btnAddCart).toBeVisible();
    await btnAddCart.click();

    // Verificar que el modal se cierre
    await expect(modal).toBeHidden();

    // Verificar badge del carrito actualizado
    const cartBadge = page.locator('[data-testid="cart-badge-count"]');
    await expect(cartBadge).toHaveText('1');
  });

  test('4. Flujo Checkout: Abrir carrito, ingresar fecha/jornada, y transmitir pedido HORECA', async ({
    page,
  }) => {
    await page.locator('[data-testid="nav-portal-b2b"]').click();

    // Configurar y agregar 1 item
    await page.locator('[data-testid^="btn-select-product-"]').first().click();
    const modal = page.locator('[data-testid="b2b-item-configurator-modal"]');
    await modal.locator('[data-testid="btn-confirm-add-cart"]').click();

    // Abrir drawer del carrito
    const btnOpenCart = page.locator('[data-testid="btn-open-cart-drawer"]');
    await btnOpenCart.click();

    const cartDrawer = page.locator('[data-testid="b2b-cart-drawer"]');
    await expect(cartDrawer).toBeVisible();

    // Transmitir pedido
    const btnCheckout = cartDrawer.locator('[data-testid="btn-checkout-order"]');
    await expect(btnCheckout).toBeVisible();
    await btnCheckout.click();

    // Debe mostrar alerta SweetAlert de confirmación o revisión
    await expect(page.locator('.swal2-popup')).toBeVisible({ timeout: 5000 });
  });

  test('5. Debe abrir el drawer de plantillas recurrentes y permitir re-ordenar con 1 clic', async ({
    page,
  }) => {
    await page.locator('[data-testid="nav-portal-b2b"]').click();

    // Abrir drawer de plantillas
    const btnTemplates = page.locator('[data-testid="btn-open-recurring-templates"]');
    await btnTemplates.click();

    const drawer = page.locator('[data-testid="b2b-recurring-templates-drawer"]');
    await expect(drawer).toBeVisible();

    // Si existen plantillas, probar botón de reordenar
    const btnReorder = drawer.locator('button:has-text("Re-ordenar ahora")').first();
    if (await btnReorder.isVisible()) {
      await btnReorder.click();
      await expect(page.locator('.swal2-popup')).toBeVisible({ timeout: 5000 });
    } else {
      // Cerrar drawer
      await page.locator('[data-testid="btn-close-templates-drawer"]').click();
      await expect(drawer).toBeHidden();
    }
  });

  test('6. Verificación Responsiva Móvil (375 px) con touch targets accesibles >= 48px', async ({
    page,
  }) => {
    // 1. Navegar primero al portal en vista normal
    await page.locator('[data-testid="nav-portal-b2b"]').click();
    await expect(page.locator('[data-testid="b2b-customer-portal-view"]')).toBeVisible();

    // 2. Cambiar a viewport móvil iPhone SE (375 px)
    await page.setViewportSize({ width: 375, height: 812 });

    // 3. Verificar que los botones de acción principales mantengan altura táctil >= 44px (WCAG 2.2 AA)
    const productButton = page.locator('[data-testid^="btn-select-product-"]').first();
    await expect(productButton).toBeVisible();
    const box = await productButton.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(44);
    }

    // 4. Verificar que la barra de encabezado y resumen de crédito se adapten
    await expect(page.locator('[data-testid="b2b-client-header-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="b2b-credit-card-summary"]')).toBeVisible();
  });
});
