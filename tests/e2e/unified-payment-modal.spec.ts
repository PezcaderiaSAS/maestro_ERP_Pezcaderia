import { test, expect } from './fixtures/testFixtures';
import path from 'path';

test.use({ baseURL: 'http://127.0.0.1:3001' });

test.describe('SPEC-060: UnifiedPaymentModal E2E & Visual Verification', () => {
  const artifactDir = 'C:/Users/usuario/.gemini/antigravity/brain/e2aefe99-37a4-4e7c-ad1a-2417f699b44e';

  test('1. Flujo Completo Desktop: Agregar producto al carrito, abrir Modal Unificado y probar métodos de pago', async ({
    authenticatedPage: page,
    consoleErrorMonitor,
  }) => {
    test.setTimeout(45000);

    // 1. Navegar directamente al módulo POS
    await page.goto('/#/pos');
    await page.waitForTimeout(1000);

    // 2. Agregar un producto al carrito
    const productCard = page.locator('[data-testid^="product-card-"]').first();
    await expect(productCard).toBeVisible({ timeout: 15000 });
    await productCard.click({ force: true });

    // Si abre el modal de báscula manual, confirmar 1kg
    const modalPeso = page.locator('[data-testid="modal-manual-weight"]');
    if (await modalPeso.isVisible({ timeout: 2000 }).catch(() => false)) {
      const chip1k = page.locator('[data-testid="chip-weight-1"], button:has-text("1 kg")').first();
      if (await chip1k.isVisible()) await chip1k.click();
      const btnConfirmPeso = page.locator('[data-testid="manual-weight-confirm-btn"]');
      if (await btnConfirmPeso.isVisible()) await btnConfirmPeso.click();
    }

    // 3. Botón Cobrar debe quedar habilitado en el carrito
    const btnCobrar = page.locator('[data-testid="btn-cobrar"]');
    await expect(btnCobrar).toBeEnabled({ timeout: 5000 });

    // 4. Clic en Cobrar para desplegar UnifiedPaymentModal (SPEC-060)
    await btnCobrar.click();

    // 5. Verificar que el modal unificado esté visible
    const modal = page.locator('[data-testid="unified-payment-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // 6. Validar pestañas de métodos de pago
    await expect(page.locator('button:has-text("Efectivo"), [role="tab"]:has-text("Efectivo")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Datáfono"), [role="tab"]:has-text("Datáfono")').first()).toBeVisible();
    await expect(page.locator('button:has-text("QR / Transf."), [role="tab"]:has-text("QR / Transf.")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Mixto"), [role="tab"]:has-text("Mixto")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Crédito"), [role="tab"]:has-text("Crédito")').first()).toBeVisible();

    // 7. Tomar captura de pantalla en Desktop
    await page.screenshot({
      path: path.join(artifactDir, 'spec060_desktop_unified_payment.png'),
      fullPage: false,
    });

    // 8. Interacción con denominaciones sugeridas en Efectivo (Billete $50.000)
    const btn50k = page.locator('button:has-text("Billete $50.000"), button:has-text("+$50.000")').first();
    if (await btn50k.isVisible()) {
      await btn50k.click();
      await page.waitForTimeout(300);
    }

    // 9. Probar cambio a pestaña Mixto
    const tabMixto = page.locator('button:has-text("Mixto"), [role="tab"]:has-text("Mixto")').first();
    await tabMixto.click();
    await expect(page.locator('button:has-text("Agregar Método"), button:has-text("Agregar método")').first()).toBeVisible();

    // 10. Probar cambio a pestaña Crédito
    const tabCredito = page.locator('button:has-text("Crédito"), [role="tab"]:has-text("Crédito")').first();
    await tabCredito.click();
    await expect(page.locator('text=Plazo de Pago Acordado')).toBeVisible();

    // 11. Cerrar modal con tecla Escape
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // 12. Validar que no existan errores críticos en la consola JS
    expect(consoleErrorMonitor).toHaveLength(0);
  });

  test('2. Responsividad Móvil (375x812): El modal no debe desbordarse horizontalmente en móvil', async ({
    authenticatedPage: page,
    consoleErrorMonitor,
  }) => {
    test.setTimeout(45000);

    // 1. Ajustar Viewport móvil estricto 375x812
    await page.setViewportSize({ width: 375, height: 812 });

    // 2. Navegar directamente a POS
    await page.goto('/#/pos');
    await page.waitForTimeout(1000);

    // 3. Agregar producto
    const productCard = page.locator('[data-testid^="product-card-"]').first();
    if (await productCard.isVisible({ timeout: 5000 })) {
      await productCard.click({ force: true });
    }

    const modalPeso = page.locator('[data-testid="modal-manual-weight"]');
    if (await modalPeso.isVisible({ timeout: 2000 }).catch(() => false)) {
      const chip1k = page.locator('[data-testid="chip-weight-1"], button:has-text("1 kg")').first();
      if (await chip1k.isVisible()) await chip1k.click();
      const btnConfirmPeso = page.locator('[data-testid="manual-weight-confirm-btn"]');
      if (await btnConfirmPeso.isVisible()) await btnConfirmPeso.click();
    }

    // 4. Cambiar a pestaña Carrito en móvil
    const tabMobileCarrito = page.locator('[data-testid="pos-mobile-tab-carrito"]');
    if (await tabMobileCarrito.isVisible()) {
      await tabMobileCarrito.click();
      await page.waitForTimeout(300);
    }

    // 5. Abrir modal de cobro
    const btnCobrar = page.locator('[data-testid="btn-cobrar"]');
    await expect(btnCobrar).toBeEnabled({ timeout: 5000 });
    await btnCobrar.click();

    const modal = page.locator('[data-testid="unified-payment-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // 6. Verificar que el modal no desborde horizontalmente los 375px
    const boundingBox = await modal.boundingBox();
    if (boundingBox) {
      expect(boundingBox.width).toBeLessThanOrEqual(375);
    }

    // 7. Tomar captura de pantalla en Móvil
    await page.screenshot({
      path: path.join(artifactDir, 'spec060_mobile_375_unified_payment.png'),
      fullPage: false,
    });

    // 8. Cerrar modal con tecla Escape
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    expect(consoleErrorMonitor).toHaveLength(0);
  });
});
