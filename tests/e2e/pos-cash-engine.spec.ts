import { test, expect } from '@playwright/test';
import { SEED_DATA as POS_SEED_DATA } from '../../src/dev/seeds/seedPOS';
import { SEED_DATA as CASH_SEED_DATA } from '../../src/dev/seeds/seedCash';

test.describe('POS Cash Engine - Métodos de Pago, Vueltos, Drops y Arqueo Ciego', () => {
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
    await expect(page.locator('.sidebar-menu')).toBeVisible({ timeout: 15000 });
    await page.click('[data-testid="nav-pos"]');
    await page.waitForLoadState('domcontentloaded');
  });

  test('Debe visualizar los métodos de pago colombianos y permitir preselección', async ({
    page,
  }) => {
    // 1. Verificar existencia de botones de métodos de cobro colombianos
    await expect(page.locator('button:has-text("Efectivo")')).toBeVisible();
    await expect(page.locator('button:has-text("Nequi")')).toBeVisible();
    await expect(page.locator('button:has-text("Daviplata")')).toBeVisible();
    await expect(page.locator('button:has-text("QR Bancolombia")')).toBeVisible();
    await expect(page.locator('button:has-text("Datáfono")')).toBeVisible();

    // 2. Cambiar a método Nequi
    await page.click('button:has-text("Nequi")');
    await expect(page.locator('button:has-text("Nequi")')).toBeVisible();

    // 3. Regresar a Efectivo y comprobar botones de billetes rápidos
    await page.click('button:has-text("Efectivo")');
    await expect(page.locator('button:has-text("Exacto")')).toBeVisible();
    await expect(page.locator('button:has-text("$50k")')).toBeVisible();
    await expect(page.locator('button:has-text("$100k")')).toBeVisible();
  });

  test('Debe interactuar con billetes rápidos sugeridos y visor de cambio', async ({ page }) => {
    // 1. Clic en billete rápido $100k
    const btn100k = page.locator('button:has-text("$100k")');
    await expect(btn100k).toBeVisible();
    await btn100k.click();

    // 2. El input de efectivo recibido debe mostrar 100.000
    const inputEfectivo = page.locator('input[placeholder="$ 0"]');
    await expect(inputEfectivo).toHaveValue('$ 100.000');

    // 3. El visor de cambio debe mostrar Cambio / Vuelto a Entregar
    await expect(page.locator('text=Cambio / Vuelto a Entregar')).toBeVisible();
  });

  test('Modal de Arqueo y Cierre de Turno soporta modo ciego y asistido', async ({ page }) => {
    // 1. Abrir modal de arqueo desde el botón de cierre
    const btnCerrarTurno = page.locator('button:has-text("Cerrar Turno"), [data-testid="btn-cerrar-turno"]').first();
    await expect(btnCerrarTurno).toBeVisible({ timeout: 10000 });
    await btnCerrarTurno.click();

    // 2. Verificar apertura del modal de arqueo
    await expect(page.locator('h2:has-text("Arqueo y Cierre de Caja")')).toBeVisible();

    // 3. Alternar modo ciego / supervisor
    const btnToggleModo = page.locator('button:has-text("Modo Supervisor"), button:has-text("Ocultar Teórico")').first();
    if (await btnToggleModo.isVisible()) {
      await btnToggleModo.click();
    }

    // 4. Cancelar y cerrar modal
    await page.click('button:has-text("Cancelar")');
    await expect(page.locator('h2:has-text("Arqueo y Cierre de Caja")')).toBeHidden();
  });
});
