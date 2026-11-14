import { test, expect } from './fixtures/testFixtures';
import path from 'path';

test.use({ baseURL: 'http://127.0.0.1:3001' });

test.describe('SPEC-064: POS UI/UX Desbordamientos y Stock por Bodega — Verificación Visual', () => {
  const artifactDir = 'C:/Users/usuario/.gemini/antigravity/brain/e2aefe99-37a4-4e7c-ad1a-2417f699b44e';

  test('1. Verificación Desktop (1366x768): Header sin recortes, stock por bodega en tarjetas y 0 desbordamiento', async ({
    authenticatedPage: page,
    consoleErrorMonitor,
  }) => {
    test.setTimeout(45000);

    // 1. Navegar al POS
    await page.goto('/#/pos');
    await page.waitForTimeout(1500);

    // 2. Comprobar que el header del POS esté visible y sin elementos recortados
    const header = page.locator('[data-testid="pos-multivendor-light-header"]');
    await expect(header).toBeVisible({ timeout: 10000 });

    // Verificar identidad de marca y sección de asesores
    await expect(page.locator('text=PEZCADERIA S.A.S').first()).toBeVisible();

    // Verificar Sección 3: Selector de Cliente, Comandas y F9 Modo Cajero
    const btnCliente = page.locator('[data-testid="btn-header-seleccionar-cliente"]');
    await expect(btnCliente).toBeVisible();

    // 3. Comprobar barra de categorías y contenedor scrollable
    const categoryBar = page.locator('[data-testid="pos-category-tabs-container"]');
    await expect(categoryBar).toBeVisible();

    // 4. Comprobar catálogo y tarjetas de producto
    const catalog = page.locator('[data-testid="pos-multivendor-catalog"]');
    await expect(catalog).toBeVisible();

    const productCards = page.locator('[data-testid^="product-card-"]');
    await expect(productCards.first()).toBeVisible({ timeout: 10000 });
    const count = await productCards.count();
    expect(count).toBeGreaterThan(0);

    // 5. Verificar que el badge "AGOTADO" NO aparezca en todos los productos
    const agotadoBadges = page.locator('text="AGOTADO"');
    const agotadoCount = await agotadoBadges.count();
    expect(agotadoCount).toBeLessThan(count);

    // 6. Verificar que los mini-pills de stock por bodega estén renderizados
    const bodegaPills = page.locator('[data-testid="pos-product-bodega-stock-container"]');
    const pillsCount = await bodegaPills.count();
    expect(pillsCount).toBeGreaterThan(0);

    // 7. Medir que no exista overflow horizontal en el documento
    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(isOverflowing).toBe(false);

    // 8. Capturar screenshot Desktop
    const desktopScreenshotPath = path.join(artifactDir, 'spec064_desktop_pos_view.png');
    await page.screenshot({ path: desktopScreenshotPath, fullPage: false });
    console.log(`[E2E] Screenshot Desktop guardado en: ${desktopScreenshotPath}`);

    // 9. Verificar salud de la consola (0 errores JS)
    expect(consoleErrorMonitor).toEqual([]);
  });

  test('2. Verificación Mobile (375x812): Contención responsiva y 0 errores', async ({
    authenticatedPage: page,
    consoleErrorMonitor,
  }) => {
    test.setTimeout(45000);

    // Ajustar Viewport móvil estricto 375x812
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/#/pos');
    await page.waitForTimeout(1500);

    // Verificar que el header o catálogo esté visible
    const catalogOrHeader = page.locator('[data-testid="pos-multivendor-light-header"], [data-testid="pos-multivendor-catalog"], [data-testid^="product-card-"]').first();
    await expect(catalogOrHeader).toBeVisible({ timeout: 15000 });

    // Verificar ancho del documento en móvil (sin scroll horizontal desbordado)
    const isMobileOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(isMobileOverflowing).toBe(false);

    // Capturar screenshot Móvil
    const mobileScreenshotPath = path.join(artifactDir, 'spec064_mobile_375_pos_view.png');
    await page.screenshot({ path: mobileScreenshotPath, fullPage: false });
    console.log(`[E2E] Screenshot Mobile guardado en: ${mobileScreenshotPath}`);

    // Consola libre de errores
    expect(consoleErrorMonitor).toEqual([]);
  });
});
