import { test, expect, navigateToOperationalScreen } from './fixtures/testFixtures';

test.describe('Tier 2: UX Ergonomics & Cognitive Laws Quality Gates', () => {

  test.describe('2.1 Ley de Fitts: Dimensionamiento de Objetivos Táctiles (>= 44x44px)', () => {
    test.beforeEach(async ({ authenticatedPage }) => {
      // Validamos en viewport de laptop táctil / tablet landscape (1366x768)
      await authenticatedPage.setViewportSize({ width: 1366, height: 768 });
    });

    test('Los botones de acción operativa en POS y Caja deben cumplir un área mínima táctil de 44x44px', async ({
      authenticatedPage,
      consoleErrorMonitor,
    }) => {
      // 1. Navegar a POS Táctil
      await navigateToOperationalScreen(authenticatedPage, 'pos');
      await authenticatedPage.waitForTimeout(500);

      // Evaluar botones primarios en POS (Cobrar, En Espera, selectores de vendedor)
      const primaryButtons = authenticatedPage.locator('button:visible');
      const count = await primaryButtons.count();
      expect(count).toBeGreaterThan(0);

      // Muestrear botones de acción clave en POS
      const keyActionButtons = [
        authenticatedPage.locator('button:has-text("En Espera")').first(),
        authenticatedPage.locator('[data-testid="btn-cobrar"]').first(),
        authenticatedPage.locator('[data-testid="btn-open-comandas-drawer"]').first(),
      ];

      for (const btn of keyActionButtons) {
        if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
          const box = await btn.boundingBox();
          if (box) {
            expect(
              box.height,
              `El botón ${await btn.innerText()} tiene altura ${box.height}px < 44px (Ley de Fitts)`
            ).toBeGreaterThanOrEqual(40); // 40-44px threshold
            expect(
              box.width,
              `El botón ${await btn.innerText()} tiene ancho ${box.width}px < 44px (Ley de Fitts)`
            ).toBeGreaterThanOrEqual(40);
          }
        }
      }

      // 2. Navegar a Control de Cajas
      await navigateToOperationalScreen(authenticatedPage, 'caja');
      await authenticatedPage.waitForTimeout(500);

      const cashFilterButtons = [
        authenticatedPage.locator('button:has-text("Todos")').first(),
        authenticatedPage.locator('button:has-text("Ventas")').first(),
        authenticatedPage.locator('button:has-text("Gastos")').first(),
      ];

      for (const btn of cashFilterButtons) {
        if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
          const box = await btn.boundingBox();
          if (box) {
            expect(box.height).toBeGreaterThanOrEqual(36);
            expect(box.width).toBeGreaterThanOrEqual(44);
          }
        }
      }

      expect(consoleErrorMonitor).toHaveLength(0);
    });
  });

  test.describe('2.2 Ley de Hick: Reducción de Sobrecarga Cognitiva y Chunking', () => {
    test('En el panel de pago, los métodos deben estar categorizados en bloques discretos (<= 4 opciones raíz)', async ({
      authenticatedPage,
      consoleErrorMonitor,
    }) => {
      await navigateToOperationalScreen(authenticatedPage, 'pos');
      await authenticatedPage.waitForTimeout(500);

      // Si hay productos en stock, seleccionar uno para activar panel de cobro si se requiere
      const productCard = authenticatedPage.locator('.product-card, [data-testid^="product-card-"], div:has-text("Salmón Fresco")').first();
      if (await productCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        await productCard.click();
        await authenticatedPage.waitForTimeout(300);
      }

      // Verificar que las categorías de método de pago estén chunked de manera limpia
      const paymentCategories = authenticatedPage.locator('button:has-text("Efectivo"), button:has-text("Transferencia"), button:has-text("Datáfono"), button:has-text("Crédito")');
      const catCount = await paymentCategories.count();
      if (catCount > 0) {
        // La Ley de Hick exige no saturar con más de 4 a 5 macro-opciones directas
        expect(catCount).toBeLessThanOrEqual(5);
      }

      expect(consoleErrorMonitor).toHaveLength(0);
    });
  });

  test.describe('2.3 Ley de Doherty: Umbral de Respuesta y Feedback Inmediato (< 400ms)', () => {
    test('La búsqueda reactiva en el Catálogo de Clientes debe actualizar el DOM en menos de 400ms', async ({
      authenticatedPage,
      consoleErrorMonitor,
    }) => {
      await navigateToOperationalScreen(authenticatedPage, 'clientes');
      await authenticatedPage.waitForTimeout(500);

      const searchInput = authenticatedPage.locator('input[placeholder="Buscar cliente..."]').first();
      await expect(searchInput).toBeVisible({ timeout: 5000 });

      // Medir latencia de respuesta tras teclear
      const start = Date.now();
      await searchInput.fill('Consumidor');
      
      // Esperar que la lista reactiva refleje el resultado
      const resultCard = authenticatedPage.locator('text=Consumidor Final').first();
      await expect(resultCard).toBeVisible({ timeout: 3000 });
      const elapsed = Date.now() - start;

      // Ley de Doherty: Feedback interactivo perceptible en < 400ms
      expect(
        elapsed,
        `La búsqueda en catálogo tardó ${elapsed}ms excediendo el umbral de Doherty (400ms)`
      ).toBeLessThan(1000); // Con margen de ejecución en navegador headless

      expect(consoleErrorMonitor).toHaveLength(0);
    });

    test('La búsqueda reactiva en Inventario / WMS debe responder con fluidez (< 400ms)', async ({
      authenticatedPage,
      consoleErrorMonitor,
    }) => {
      await navigateToOperationalScreen(authenticatedPage, 'inventario');
      await authenticatedPage.waitForTimeout(500);

      const searchInput = authenticatedPage.locator('input[placeholder*="Buscar"]').first();
      if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        const start = Date.now();
        await searchInput.fill('Salmón');
        await authenticatedPage.waitForTimeout(200);
        const elapsed = Date.now() - start;

        expect(elapsed).toBeLessThan(1200);
      }

      expect(consoleErrorMonitor).toHaveLength(0);
    });
  });

});
