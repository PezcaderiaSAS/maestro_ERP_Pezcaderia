import { test, expect } from '@playwright/test';
import { SEED_DATA as POS_SEED_DATA } from '../../src/dev/seeds/seedPOS';
import { SEED_DATA as CASH_SEED_DATA } from '../../src/dev/seeds/seedCash';

test.describe('POS - Flujo de Apertura, Venta y Cierre (FASE 6)', () => {

  test.describe('TASK-11: Flujo apertura de caja (3 pasos)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/');
      // Inyectar SEED_DATA de seedPOS.ts vía page.evaluate()
      await page.evaluate((seedData) => {
        for (const [key, value] of Object.entries(seedData)) {
          localStorage.setItem(key, JSON.stringify(value));
        }
      }, POS_SEED_DATA);
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.sidebar-menu')).toBeVisible();
    });

    test('Debe abrir la caja correctamente (flujo 3 pasos)', async ({ page }) => {
      // 1. Navegar a vista POS (asumiendo que inicia en Dashboard o similar)
      await page.click('[data-testid="nav-pos"]');

      // 2. Hacer clic en el botón de apertura de caja
      await page.click('[data-testid="btn-abrir-turno"]');

      // 3. [PASO 1] Esperar select#select-caja visible
      const selectCaja = page.locator('[data-testid="select-caja"]');
      await expect(selectCaja).toBeVisible();

      // 4. [PASO 1] Seleccionar "Caja Menor - Bodega Principal"
      // Wait for options to populate
      await page.waitForTimeout(500); 
      // Select by label. The value is likely the ID 'caja-test-menor'
      await selectCaja.selectOption({ label: 'Caja Menor - Bodega Principal' });

      // 5. [PASO 1] Clic en data-testid="btn-siguiente-paso1"
      await page.click('[data-testid="btn-siguiente-paso1"]');

      // 6. [PASO 2] Clic en data-testid="btn-siguiente-paso2" (base = $0 es válida)
      await page.click('[data-testid="btn-siguiente-paso2"]');

      // 7. [PASO 3] Clic en data-testid="btn-confirmar-apertura"
      await page.click('[data-testid="btn-confirmar-apertura"]');

      // 8. Esperar SweetAlert2 de éxito ("Caja Abierta")
      const swalTitle = page.locator('.swal2-title');
      await expect(swalTitle).toHaveText('Caja Abierta');

      // 9. Clic en OK del SweetAlert2 (por si no se cierra automáticamente rápido)
      // Timer is 1500ms, but we wait for it to close
      await expect(page.locator('.swal2-popup')).toBeHidden({ timeout: 3000 });

      // 10. Asertión: modal desaparece, POS muestra estado activo
      await expect(selectCaja).toBeHidden();
      
      // Check if POS view is active by checking the search input
      const searchInput = page.getByPlaceholder('Buscar producto (F2)...');
      await expect(searchInput).toBeVisible();
    });
  });

  test.describe('TASK-12: Agregar test de venta a pos.spec.ts', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/');
      // Inyectar SEED_DATA de seedCash.ts (turno ya abierto) y productos
      await page.evaluate((seedData) => {
        for (const [key, value] of Object.entries(seedData)) {
          localStorage.setItem(key, JSON.stringify(value));
        }
      }, { ...POS_SEED_DATA, ...CASH_SEED_DATA }); // Merge to get products AND open shift
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.sidebar-menu')).toBeVisible();
      await page.click('[data-testid="nav-pos"]');
    });

    test('Debe procesar una venta y decrementar el stock (RN-01)', async ({ page }) => {
      // Agregar producto al carrito vía clic
      // In seedPOS, 'Salmón Fresco' is 'prod-salmon' with 10 stock
      await page.click('text=Salmón Fresco');

      // Confirmar venta
      await page.click('text=Confirmar Venta');

      // Pagar (asumiendo que hay un botón de cobrar/pagar o es directo)
      // Needs verification of POSView payment flow
      await page.click('text=Registrar Pago');

      // Verify SweetAlert success
      const swalTitle = page.locator('.swal2-title');
      await expect(swalTitle).toHaveText(/Venta exitosa/i);
      
      // Wait for it to close
      await expect(page.locator('.swal2-popup')).toBeHidden({ timeout: 3000 });

      // Asertión: localStorage pezcaderia_ventas tiene 1 venta; stock del producto decrementó
      const ventasStr = await page.evaluate(() => localStorage.getItem('pezcaderia_ventas'));
      const ventas = JSON.parse(ventasStr || '[]');
      expect(ventas.length).toBe(1);

      // We should check stock in localStorage as well
      const stockStr = await page.evaluate(() => localStorage.getItem('pezcaderia_stock'));
      const stock = JSON.parse(stockStr || '{}');
      expect(stock['Bodega Principal']['prod-salmon']).toBe(9); // Decremented by 1
    });

    test('Debe validar RN-01: Intentar vender producto con stock=0 -> mostrar error', async ({ page }) => {
      // First let's set stock of Salmón to 0
      await page.evaluate(() => {
        const stockData = JSON.parse(localStorage.getItem('pezcaderia_stock') || '{}');
        if (stockData['Bodega Principal']) stockData['Bodega Principal']['prod-salmon'] = 0;
        if (stockData['caja-cash-test']) stockData['caja-cash-test']['prod-salmon'] = 0;
        localStorage.setItem('pezcaderia_stock', JSON.stringify(stockData));
      });
      await page.reload();

      // Attempt to add to cart
      await page.click('text=Salmón Fresco');

      // Should show Swal error or not add to cart
      const swalTitle = page.locator('.swal2-title');
      await expect(swalTitle).toHaveText(/Sin stock|Error/i);
    });
  });

  test.describe('TASK-13: Agregar test de cierre a pos.spec.ts', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/');
      await page.evaluate((seedData) => {
        for (const [key, value] of Object.entries(seedData)) {
          localStorage.setItem(key, JSON.stringify(value));
        }
      }, CASH_SEED_DATA);
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.sidebar-menu')).toBeVisible();
      // Navegar a módulo Caja para cerrar
      await page.click('[data-testid="nav-caja"]');
    });

    test('Debe cerrar la caja y registrar el arqueo (RN-44)', async ({ page }) => {
      // Hacer clic en data-testid="btn-cierre-caja"
      await page.click('[data-testid="btn-cierre-caja"]');

      // Ingresar monto en data-testid="input-efectivo-arqueo"
      // Seed sets totalEfectivo to 255000. Let's enter 255000
      await page.fill('[data-testid="input-efectivo-arqueo"]', '255000');

      // Clic en data-testid="btn-confirmar-arqueo"
      await page.click('[data-testid="btn-confirmar-arqueo"]');

      // Check success
      await expect(page.locator('.swal2-title')).toHaveText(/Cierre Exitoso|Caja Cerrada/i);

      // Asertión: turno en pezcaderia_turnos_caja tiene estado: 'CERRADO'
      const turnosStr = await page.evaluate(() => localStorage.getItem('pezcaderia_turnos_caja'));
      const turnos = JSON.parse(turnosStr || '[]');
      expect(turnos.length).toBeGreaterThan(0);
      expect(turnos[0].estado).toBe('CERRADO');
      expect(turnos[0].diferenciaEfectivo).toBe(0);
    });
  });
});
