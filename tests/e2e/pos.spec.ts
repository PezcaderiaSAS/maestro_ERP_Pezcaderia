import { test, expect } from '@playwright/test';
import { SEED_DATA as POS_SEED_DATA } from '../../src/dev/seeds/seedPOS';
import { SEED_DATA as CASH_SEED_DATA } from '../../src/dev/seeds/seedCash';

// Timeout aumentado para el ciclo completo de apertura
const TASK11_TIMEOUT = 60_000;

test.describe('POS - Flujo de Apertura, Venta y Cierre (FASE 6)', () => {

  test.describe('TASK-11: Flujo apertura de caja (3 pasos)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Inyectar seed garantizando turnos_caja vacíos (sin turno abierto)
      // para que el btn-abrir-turno aparezca en PaymentPanel
      const seedData = {
        ...POS_SEED_DATA,
        pezcaderia_bodegas: [
          { id: 'b1', nombre: 'Bodega Principal', activa: true }
        ],
        pezcaderia_cajas: [
          { id: 'caja-test-menor', bodegaId: 'Bodega Principal', nombre: 'Caja Menor - Bodega Principal', activa: true },
          { id: 'caja-test-mayor', bodegaId: 'Bodega Principal', nombre: 'Caja Mayor - Bodega Principal', activa: true }
        ],
        pezcaderia_turnos_caja: [], // Ningún turno abierto: forzamos estado 'Caja Cerrada'
      };

      await page.evaluate((data) => {
        // Limpiar TODO el localStorage para evitar que persist states de Zustand (como 'inventory-storage') contaminen los mocks
        localStorage.clear();
        for (const [key, value] of Object.entries(data)) {
          localStorage.setItem(key, JSON.stringify(value));
        }
      }, seedData);

      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.sidebar-menu')).toBeVisible({ timeout: 15000 });
    });

    test('Debe abrir la caja correctamente (flujo 3 pasos)', async ({ page }) => {
      test.setTimeout(TASK11_TIMEOUT);

      // 1. Navegar a vista POS
      await page.click('[data-testid="nav-pos"]');

      // 2. Esperar a que los elementos del POS carguen y estabilicen
      await page.waitForLoadState('domcontentloaded');

      // Esperar EXPLÍCITAMENTE a que el botón "Abrir Turno" sea visible y clickeable
      const btnAbrirTurno = page.locator('[data-testid="btn-abrir-turno"]');
      await expect(btnAbrirTurno).toBeVisible({ timeout: 20000 });

      // 3. Hacer clic en el botón de apertura de caja, forzándolo en caso de que alguna
      // transición CSS o un Toast/SweetAlert residual esté bloqueando el puntero
      await btnAbrirTurno.click({ force: true });

      // 4. [PASO 1] Esperar modal con select-caja visible
      const selectCaja = page.locator('[data-testid="select-caja"]');
      await expect(selectCaja).toBeVisible({ timeout: 10000 });

      // 5. Esperar a que el select tenga opciones 
      await page.waitForFunction(() => {
        const sel = document.querySelector('[data-testid="select-caja"]') as HTMLSelectElement;
        return sel && sel.options.length > 1;
      }, { timeout: 10000 });

      // 6. Seleccionar caja por label
      await selectCaja.selectOption({ label: 'Caja Menor - Bodega Principal' });

      // 7. [PASO 1] Clic en Siguiente
      const btnSig1 = page.locator('[data-testid="btn-siguiente-paso1"]');
      await expect(btnSig1).toBeEnabled({ timeout: 5000 });
      await btnSig1.click();

      // 8. [PASO 2] Ingresar base con denominaciones y avanzar
      const input100k = page.locator('input[data-denominacion="billetes100k"]');
      if (await input100k.isVisible({ timeout: 3000 }).catch(() => false)) {
        await input100k.fill('2');
      }
      await page.locator('[data-testid="btn-siguiente-paso2"]').click();

      // 9. [PASO 3] Confirmar apertura
      await page.locator('[data-testid="btn-confirmar-apertura"]').click();

      // 10. Esperar SweetAlert2 de éxito ("Caja Abierta")
      const swalTitle = page.locator('.swal2-title');
      await expect(swalTitle).toContainText('Caja Abierta', { timeout: 10000 });

      // 11. Esperar que el SweetAlert se cierre (esperar a que desaparezca del DOM)
      const swalPopup = page.locator('.swal2-popup');
      await swalPopup.waitFor({ state: 'hidden', timeout: 8000 });

      // 12. Asertión final: el selector desaparece y la caja queda lista para buscar producto
      await expect(selectCaja).toBeHidden({ timeout: 5000 });
      
      const searchInput = page.getByPlaceholder('Buscar por nombre o SKU...');
      // Usar un poll para darle tiempo a React de re-evaluar isTurnoAbierto tras el modal
      await expect(searchInput).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('TASK-12: Agregar test de venta a pos.spec.ts', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/');
      // Inyectar SEED_DATA de seedCash.ts (turno ya abierto) y productos
      await page.evaluate((seedData) => {
        localStorage.clear();
        for (const [key, value] of Object.entries(seedData)) {
          localStorage.setItem(key, JSON.stringify(value));
        }
        // Fix for dynamic warehouse architecture stock structure (dictionary format by SKU)
        const pezcaderiaStock = {
          "Bodega Principal": {
            "PES-ENT-001": 10,
            "FIL-LIM-002": 5,
            "CAM-TIG-003": 8
          },
          "caja-test-menor": {
            "PES-ENT-001": 10,
            "FIL-LIM-002": 5,
            "CAM-TIG-003": 8
          }
        };
        localStorage.setItem('pezcaderia_stock', JSON.stringify(pezcaderiaStock));
      }, { ...POS_SEED_DATA, ...CASH_SEED_DATA }); // Merge to get products AND open shift
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.sidebar-menu')).toBeVisible({ timeout: 15000 });
      await page.click('[data-testid="nav-pos"]');
    });

    test('Debe procesar una venta y decrementar el stock (RN-01)', async ({ page }) => {
      page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
      
      const turnosStr = await page.evaluate(() => localStorage.getItem('pezcaderia_turnos_caja'));
      console.log('TURNOS EN LOCALSTORAGE AL INICIO:', turnosStr);
      
      const paymentPanelHTML = await page.evaluate(() => {
        const el = document.querySelector('.pos-cart-footer');
        return el ? el.innerHTML : 'No cart footer found';
      });
      console.log('PAYMENT PANEL HTML:', paymentPanelHTML);

      // Agregar producto al carrito vía clic
      // 1. Esperar EXPLÍCITAMENTE a que el producto sea visible en el DOM.
      const productItem = page.locator('text=Salmón Fresco').first();
      await expect(productItem).toBeVisible({ timeout: 15000 });
      
      const btnCobrar = page.locator('[data-testid="btn-cobrar"]');
      
      // Retry clicking the product until the 'Cobrar' button becomes enabled.
      // This solves race conditions where the click is lost because React is re-rendering the list.
      await expect(async () => {
        if (await btnCobrar.isDisabled()) {
          await productItem.click({ force: true });
        }
        await expect(btnCobrar).toBeEnabled({ timeout: 1000 });
      }).toPass({ timeout: 15000 });
      
      await btnCobrar.click();

      // En este flujo, COBRAR procesa directamente la venta si es Efectivo.
      // Verify SweetAlert success
      const swalTitle = page.locator('.swal2-title');
      await expect(swalTitle).toHaveText(/Venta procesada/i);
      
      // Wait for it to close
      await expect(page.locator('.swal2-popup')).toBeHidden({ timeout: 3000 });

      // Asertión: localStorage pezcaderia_ventas tiene 1 venta; stock del producto decrementó
      const ventasStr = await page.evaluate(() => localStorage.getItem('pezcaderia_ventas'));
      const ventas = JSON.parse(ventasStr || '[]');
      expect(ventas.length).toBe(1);

      // We should check stock in localStorage as well
      const stockStr = await page.evaluate(() => localStorage.getItem('pezcaderia_stock'));
      const stock = JSON.parse(stockStr || '{}');
      const salmonStock = stock['Bodega Principal']?.['PES-ENT-001'];
      expect(salmonStock).toBe(9); // Decremented by 1
    });

    test('Debe validar RN-01: Intentar vender producto con stock=0 -> mostrar error', async ({ page }) => {
      // First let's set stock of Salmón to 0
      await page.evaluate(() => {
        const stockData = JSON.parse(localStorage.getItem('pezcaderia_stock') || '{}');
        const setStockZero = (location: string, sku: string) => {
          if (stockData[location] && stockData[location][sku] !== undefined) {
            stockData[location][sku] = 0;
          }
        };
        setStockZero('Bodega Principal', 'PES-ENT-001');
        setStockZero('caja-test-menor', 'PES-ENT-001');
        localStorage.setItem('pezcaderia_stock', JSON.stringify(stockData));
      });
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.sidebar-menu')).toBeVisible({ timeout: 15000 });
      await page.click('[data-testid="nav-pos"]');

      const productItem = page.locator('text=Salmón Fresco').first();
      await expect(productItem).toBeVisible({ timeout: 15000 });
      await productItem.click({ force: true });
      
      // Click cobrar to trigger the stock validation
      const btnCobrar = page.locator('[data-testid="btn-cobrar"]');
      await expect(btnCobrar).toBeEnabled({ timeout: 5000 });
      await btnCobrar.click();

      const swalTitle = page.locator('.swal2-title');
      await expect(swalTitle).toHaveText(/Venta Bloqueada: Stock Insuficiente|Sin stock|Error/i, { timeout: 4000 });
    });
  });

  test.describe('TASK-13: Agregar test de cierre a pos.spec.ts', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/');
      await page.evaluate((seedData) => {
        localStorage.clear();
        for (const [key, value] of Object.entries(seedData)) {
          localStorage.setItem(key, JSON.stringify(value));
        }
      }, CASH_SEED_DATA);
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.sidebar-menu')).toBeVisible({ timeout: 15000 });
      // Navegar a módulo Caja para cerrar
      await page.click('[data-testid="nav-caja"]');
    });

    test('Debe cerrar la caja y registrar el arqueo (RN-44)', async ({ page }) => {
      // Hacer clic en data-testid="btn-cierre-caja" o su equivalente visual
      const btnCierreCaja = page.locator('[data-testid="btn-cierre-caja"], [data-testid="btn-cerrar-turno"], button:has-text("Cerrar Turno"), button:has-text("Cierre de Caja")').first();
      await expect(btnCierreCaja).toBeVisible({ timeout: 15000 });
      await btnCierreCaja.click({ force: true });

      // Ingresar monto en data-testid="input-efectivo-arqueo"
      // Seed sets totalEfectivo to 255000. Let's enter 255000
      await page.fill('[data-testid="input-efectivo-arqueo"]', '255000');

      // Clic en data-testid="btn-confirmar-arqueo"
      await page.click('[data-testid="btn-confirmar-arqueo"]');

      // Check first dialog: ¿Confirmar Arqueo y Cierre?
      const confirmDialogTitle = page.locator('.swal2-title');
      await expect(confirmDialogTitle).toHaveText(/Confirmar Arqueo/i, { timeout: 10000 });
      
      // Click Yes to confirm
      await page.click('.swal2-confirm');

      // Check success
      await expect(page.locator('.swal2-title')).toHaveText(/Cierre Exitoso|Caja Cerrada/i, { timeout: 10000 });

      // Asertión: turno en pezcaderia_turnos_caja tiene estado: 'CERRADO'
      const turnosStr = await page.evaluate(() => localStorage.getItem('pezcaderia_turnos_caja'));
      const turnos = JSON.parse(turnosStr || '[]');
      expect(turnos.length).toBeGreaterThan(0);
      expect(turnos[0].estado).toBe('CERRADO');
      expect(turnos[0].diferenciaEfectivo).toBe(0);
    });
  });
});
