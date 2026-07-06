import { test, expect } from '@playwright/test';
import { SEED_DATA as POS_SEED_DATA } from '../../src/dev/seeds/seedPOS';
import { SEED_DATA as CASH_SEED_DATA } from '../../src/dev/seeds/seedCash';

// Timeout aumentado para el ciclo completo de apertura
const TASK11_TIMEOUT = 60_000;

test.describe('POS - Flujo de Apertura, Venta y Cierre (FASE 6)', () => {

  test.describe('TASK-11: Flujo apertura de caja', () => {
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
          { id: 'caja-test-menor', bodegaId: 'b1', nombre: 'Caja Menor - Bodega Principal', activa: true },
          { id: 'caja-test-mayor', bodegaId: 'b1', nombre: 'Caja Mayor - Bodega Principal', activa: true }
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

    test('Debe abrir la caja correctamente', async ({ page }) => {
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

      // 4. Esperar select de bodega (Paso 1: Selección de Ubicación)
      // Como el usuario inyectado es admin, se debe seleccionar la bodega primero.
      const selectBodega = page.locator('[data-testid="select-bodega"]');
      await expect(selectBodega).toBeVisible({ timeout: 10000 });
      await selectBodega.selectOption({ label: 'Bodega Principal' });

      // 5. Esperar modal con select-caja visible
      const selectCaja = page.locator('[data-testid="select-caja"]');
      await expect(selectCaja).toBeVisible({ timeout: 10000 });

      // 6. Esperar a que el select de caja tenga opciones 
      await page.waitForFunction(() => {
        const sel = document.querySelector('[data-testid="select-caja"]') as HTMLSelectElement;
        return sel && sel.options.length > 1;
      }, { timeout: 10000 });

      // 7. Seleccionar caja por label
      await selectCaja.selectOption({ label: 'Caja Menor - Bodega Principal' });

      // Cambiar a modo Ingreso Directo
      await page.locator('button', { hasText: 'Ingreso Directo' }).click();

      // Ingresar base en el input NumericFormat
      const inputBaseDirecta = page.locator('[data-testid="input-base-directa"]');
      await expect(inputBaseDirecta).toBeVisible({ timeout: 5000 });
      await inputBaseDirecta.fill('100000');

      // 8. Confirmar apertura
      const btnConfirmar = page.locator('[data-testid="btn-abrir-caja"]');
      await expect(btnConfirmar).toBeVisible({ timeout: 5000 });
      await btnConfirmar.click();

      // 10. Esperar SweetAlert2 de éxito ("Caja Abierta")
      const swalTitle = page.locator('.swal2-title');
      await expect(swalTitle).toContainText('Caja Abierta', { timeout: 10000 });

      // 11. Esperar que el SweetAlert se cierre completamente del DOM
      const swalContainer = page.locator('.swal2-container');
      await expect(swalContainer).not.toBeAttached({ timeout: 15000 });

      // 12. Asertión final: el selector desaparece y la caja queda lista para buscar producto
      await expect(selectCaja).toBeHidden({ timeout: 10000 });
      
      const searchInput = page.getByPlaceholder('Buscar por nombre o SKU...');
      // Implementamos waitFor para la visibilidad del DOM y validamos que este habilitado
      await searchInput.waitFor({ state: 'visible', timeout: 15000 });
      await expect(searchInput).toBeEnabled({ timeout: 5000 });
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
          "b1": {
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
      // Los console.log excesivos fueron removidos para no truncar la salida

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
      
      // Wait for it to close completely del DOM
      await expect(page.locator('.swal2-container')).not.toBeAttached({ timeout: 15000 });

      // Asertión: localStorage pezcaderia_ventas tiene 1 venta; stock del producto decrementó
      // Usamos toPass porque la escritura a localStorage (en App.tsx) puede ser asíncrona (useEffect)
      await expect(async () => {
        const ventasStr = await page.evaluate(() => localStorage.getItem('pezcaderia_ventas'));
        const ventas = JSON.parse(ventasStr || '[]');
        expect(ventas.length).toBe(1);

        const stockStr = await page.evaluate(() => localStorage.getItem('pezcaderia_stock'));
        const stock = JSON.parse(stockStr || '{}');
        const salmonStock = stock['b1']?.['PES-ENT-001'];
        
        // Calculamos la cantidad vendida real, ya que el test pudo haber hecho varios clics
        const cantVendida = ventas[0].items[0].cantidad;
        expect(salmonStock).toBe(10 - cantVendida);
      }).toPass({ timeout: 5000 });
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
        setStockZero('b1', 'PES-ENT-001');
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
  test.describe('FASE 5: Optimizaciones UX/UI', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/');
      // Inyectar estado CON un turno cerrado para testear caja cerrada
      await page.evaluate((data) => {
        localStorage.clear();
        for (const [key, value] of Object.entries(data)) {
          localStorage.setItem(key, JSON.stringify(value));
        }
        // Configurar stock específico para probar semáforos y toggle
        const pezcaderiaStock = {
          "b1": {
            "PES-ENT-001": 10, // verde
            "FIL-LIM-002": 2,  // amarillo (buffer por defecto es 4)
            "CAM-TIG-003": 0   // rojo
          }
        };
        localStorage.setItem('pezcaderia_stock', JSON.stringify(pezcaderiaStock));
      }, { ...POS_SEED_DATA, pezcaderia_turnos_caja: [] }); 

      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.sidebar-menu')).toBeVisible({ timeout: 15000 });
      await page.click('[data-testid="nav-pos"]');
    });

    test('5.2 Test Caja Cerrada: Botón cobrar debe estar deshabilitado y mostrar advertencia', async ({ page }) => {
      const btnCobrar = page.locator('[data-testid="btn-cobrar"]');
      await expect(btnCobrar).toBeDisabled();
      const footerMsg = page.locator('text=Abre un turno para habilitar los pagos');
      await expect(footerMsg).toBeVisible();
    });

    test('5.3 y 5.4 Semáforos y Toggle Ocultar Agotados', async ({ page }) => {
      const productGrid = page.locator('[data-testid="product-grid"]');
      await expect(productGrid).toBeVisible();

      // Verificar semáforo rojo (stock 0)
      const redBadge = productGrid.locator('[data-testid="stock-badge-red"]').first();
      await expect(redBadge).toBeVisible();
      
      const outOfStockCard = page.locator('.product-card').filter({ has: page.locator('[data-testid="stock-badge-red"]') }).first();
      await expect(outOfStockCard).toHaveClass(/opacity-50/); // Grayscale y opacity aplicadas
      
      // Test Toggle
      const toggle = page.locator('label', { hasText: 'Ocultar agotados' }).locator('input[type="checkbox"]');
      await toggle.check();

      // La tarjeta con stock 0 ya no debe estar en el grid
      await expect(outOfStockCard).toBeHidden();
    });
  });
});
