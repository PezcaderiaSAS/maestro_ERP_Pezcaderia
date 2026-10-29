import { test, expect, navigateToOperationalScreen, assertNoHorizontalOverflow } from './fixtures/testFixtures';

test.describe('Tier 1: Visual Integrity & Smoke Quality Gates', () => {

  test.describe('1.1 Smoke Navigation & Zero Console Errors', () => {
    test('Debe navegar por todas las pantallas prioritarias sin errores en consola (0 console.error)', async ({
      authenticatedPage,
      consoleErrorMonitor,
    }) => {
      // 1. Navegar a POS Táctil
      await navigateToOperationalScreen(authenticatedPage, 'pos');
      await expect(authenticatedPage.locator('body')).toBeVisible();
      await authenticatedPage.waitForTimeout(500);

      // 2. Navegar a Control de Cajas
      await navigateToOperationalScreen(authenticatedPage, 'caja');
      await expect(authenticatedPage.locator('body')).toBeVisible();
      await authenticatedPage.waitForTimeout(500);

      // 3. Navegar a Catálogo de Clientes
      await navigateToOperationalScreen(authenticatedPage, 'clientes');
      await expect(authenticatedPage.locator('body')).toBeVisible();
      await authenticatedPage.waitForTimeout(500);

      // 4. Navegar a Inventario y WMS
      await navigateToOperationalScreen(authenticatedPage, 'inventario');
      await expect(authenticatedPage.locator('body')).toBeVisible();
      await authenticatedPage.waitForTimeout(500);

      // 5. Navegar a Tablero Kanban
      await navigateToOperationalScreen(authenticatedPage, 'kanban');
      await expect(authenticatedPage.locator('body')).toBeVisible();
      await authenticatedPage.waitForTimeout(500);

      // Verificación estricta: Cero errores en consola de JavaScript o excepciones no capturadas
      expect(
        consoleErrorMonitor,
        `Se detectaron ${consoleErrorMonitor.length} errores en la consola: \n${consoleErrorMonitor.join('\n')}`
      ).toHaveLength(0);
    });
  });

  test.describe('1.2 Mobile Responsive Layout Integrity (375x667 Viewport)', () => {
    test.beforeEach(async ({ authenticatedPage }) => {
      // Viewport móvil canónico (iPhone SE / estándar 375px)
      await authenticatedPage.setViewportSize({ width: 375, height: 667 });
    });

    test('Pantalla 1 (POS Táctil): No debe desbordar horizontalmente en viewport de 375px', async ({
      authenticatedPage,
      consoleErrorMonitor,
    }) => {
      await navigateToOperationalScreen(authenticatedPage, 'pos');
      await authenticatedPage.waitForTimeout(600);

      const overflow = await assertNoHorizontalOverflow(authenticatedPage);
      expect(overflow.hasOverflow).toBe(false);
      expect(consoleErrorMonitor).toHaveLength(0);
    });

    test('Pantalla 2 (Caja Única de Recaudo): No debe desbordar horizontalmente en viewport de 375px', async ({
      authenticatedPage,
      consoleErrorMonitor,
    }) => {
      await navigateToOperationalScreen(authenticatedPage, 'caja');
      await authenticatedPage.waitForTimeout(600);

      const overflow = await assertNoHorizontalOverflow(authenticatedPage);
      expect(overflow.hasOverflow).toBe(false);
      expect(consoleErrorMonitor).toHaveLength(0);
    });

    test('Pantalla 3 (Directorio de Clientes): No debe desbordar horizontalmente en viewport de 375px', async ({
      authenticatedPage,
      consoleErrorMonitor,
    }) => {
      await navigateToOperationalScreen(authenticatedPage, 'clientes');
      await authenticatedPage.waitForTimeout(600);

      const overflow = await assertNoHorizontalOverflow(authenticatedPage);
      expect(overflow.hasOverflow).toBe(false);
      expect(consoleErrorMonitor).toHaveLength(0);
    });

    test('Pantalla 4 (Catálogo de Inventario & WMS): No debe desbordar horizontalmente en viewport de 375px', async ({
      authenticatedPage,
      consoleErrorMonitor,
    }) => {
      await navigateToOperationalScreen(authenticatedPage, 'inventario');
      await authenticatedPage.waitForTimeout(600);

      const overflow = await assertNoHorizontalOverflow(authenticatedPage);
      expect(overflow.hasOverflow).toBe(false);
      expect(consoleErrorMonitor).toHaveLength(0);
    });

    test('Pantalla 5 (Tablero Kanban de Comandas): No debe desbordar horizontalmente en viewport de 375px', async ({
      authenticatedPage,
      consoleErrorMonitor,
    }) => {
      await navigateToOperationalScreen(authenticatedPage, 'kanban');
      await authenticatedPage.waitForTimeout(600);

      const overflow = await assertNoHorizontalOverflow(authenticatedPage);
      expect(overflow.hasOverflow).toBe(false);
      expect(consoleErrorMonitor).toHaveLength(0);
    });
  });

  test.describe('1.3 Desktop Layout Integrity (1366x768 Viewport)', () => {
    test.beforeEach(async ({ authenticatedPage }) => {
      // Viewport laptop estándar (1366x768)
      await authenticatedPage.setViewportSize({ width: 1366, height: 768 });
    });

    test('Verifica maquetación fluida y ausencia de scrollbars rotos en escritorio para todas las pantallas', async ({
      authenticatedPage,
      consoleErrorMonitor,
    }) => {
      const screens: Array<'pos' | 'caja' | 'clientes' | 'inventario' | 'kanban'> = [
        'pos',
        'caja',
        'clientes',
        'inventario',
        'kanban',
      ];

      for (const screen of screens) {
        await navigateToOperationalScreen(authenticatedPage, screen);
        await authenticatedPage.waitForTimeout(400);

        const overflow = await assertNoHorizontalOverflow(authenticatedPage);
        expect(overflow.hasOverflow).toBe(false);
      }

      expect(consoleErrorMonitor).toHaveLength(0);
    });
  });

});
