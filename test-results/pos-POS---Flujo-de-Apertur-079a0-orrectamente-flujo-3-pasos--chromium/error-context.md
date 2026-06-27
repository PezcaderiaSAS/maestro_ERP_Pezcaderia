# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pos.spec.ts >> POS - Flujo de Apertura, Venta y Cierre (FASE 6) >> TASK-11: Flujo apertura de caja (3 pasos) >> Debe abrir la caja correctamente (flujo 3 pasos)
- Location: tests\e2e\pos.spec.ts:22:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.sidebar-menu')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.sidebar-menu')

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { SEED_DATA as POS_SEED_DATA } from '../../src/dev/seeds/seedPOS';
  3   | import { SEED_DATA as CASH_SEED_DATA } from '../../src/dev/seeds/seedCash';
  4   | 
  5   | test.describe('POS - Flujo de Apertura, Venta y Cierre (FASE 6)', () => {
  6   | 
  7   |   test.describe('TASK-11: Flujo apertura de caja (3 pasos)', () => {
  8   |     test.beforeEach(async ({ page }) => {
  9   |       await page.setViewportSize({ width: 1440, height: 900 });
  10  |       await page.goto('/');
  11  |       // Inyectar SEED_DATA de seedPOS.ts vía page.evaluate()
  12  |       await page.evaluate((seedData) => {
  13  |         for (const [key, value] of Object.entries(seedData)) {
  14  |           localStorage.setItem(key, JSON.stringify(value));
  15  |         }
  16  |       }, POS_SEED_DATA);
  17  |       await page.reload();
  18  |       await page.waitForLoadState('networkidle');
> 19  |       await expect(page.locator('.sidebar-menu')).toBeVisible();
      |                                                   ^ Error: expect(locator).toBeVisible() failed
  20  |     });
  21  | 
  22  |     test('Debe abrir la caja correctamente (flujo 3 pasos)', async ({ page }) => {
  23  |       // 1. Navegar a vista POS (asumiendo que inicia en Dashboard o similar)
  24  |       await page.click('[data-testid="nav-pos"]');
  25  | 
  26  |       // 2. Hacer clic en el botón de apertura de caja
  27  |       await page.click('[data-testid="btn-abrir-turno"]');
  28  | 
  29  |       // 3. [PASO 1] Esperar select#select-caja visible
  30  |       const selectCaja = page.locator('[data-testid="select-caja"]');
  31  |       await expect(selectCaja).toBeVisible();
  32  | 
  33  |       // 4. [PASO 1] Seleccionar "Caja Menor - Bodega Principal"
  34  |       // Wait for options to populate
  35  |       await page.waitForTimeout(500); 
  36  |       // Select by label. The value is likely the ID 'caja-test-menor'
  37  |       await selectCaja.selectOption({ label: 'Caja Menor - Bodega Principal' });
  38  | 
  39  |       // 5. [PASO 1] Clic en data-testid="btn-siguiente-paso1"
  40  |       await page.click('[data-testid="btn-siguiente-paso1"]');
  41  | 
  42  |       // 6. [PASO 2] Clic en data-testid="btn-siguiente-paso2" (base = $0 es válida)
  43  |       await page.click('[data-testid="btn-siguiente-paso2"]');
  44  | 
  45  |       // 7. [PASO 3] Clic en data-testid="btn-confirmar-apertura"
  46  |       await page.click('[data-testid="btn-confirmar-apertura"]');
  47  | 
  48  |       // 8. Esperar SweetAlert2 de éxito ("Caja Abierta")
  49  |       const swalTitle = page.locator('.swal2-title');
  50  |       await expect(swalTitle).toHaveText('Caja Abierta');
  51  | 
  52  |       // 9. Clic en OK del SweetAlert2 (por si no se cierra automáticamente rápido)
  53  |       // Timer is 1500ms, but we wait for it to close
  54  |       await expect(page.locator('.swal2-popup')).toBeHidden({ timeout: 3000 });
  55  | 
  56  |       // 10. Asertión: modal desaparece, POS muestra estado activo
  57  |       await expect(selectCaja).toBeHidden();
  58  |       
  59  |       // Check if POS view is active by checking the search input
  60  |       const searchInput = page.getByPlaceholder('Buscar producto (F2)...');
  61  |       await expect(searchInput).toBeVisible();
  62  |     });
  63  |   });
  64  | 
  65  |   test.describe('TASK-12: Agregar test de venta a pos.spec.ts', () => {
  66  |     test.beforeEach(async ({ page }) => {
  67  |       await page.setViewportSize({ width: 1440, height: 900 });
  68  |       await page.goto('/');
  69  |       // Inyectar SEED_DATA de seedCash.ts (turno ya abierto) y productos
  70  |       await page.evaluate((seedData) => {
  71  |         for (const [key, value] of Object.entries(seedData)) {
  72  |           localStorage.setItem(key, JSON.stringify(value));
  73  |         }
  74  |       }, { ...POS_SEED_DATA, ...CASH_SEED_DATA }); // Merge to get products AND open shift
  75  |       await page.reload();
  76  |       await page.waitForLoadState('networkidle');
  77  |       await expect(page.locator('.sidebar-menu')).toBeVisible();
  78  |       await page.click('[data-testid="nav-pos"]');
  79  |     });
  80  | 
  81  |     test('Debe procesar una venta y decrementar el stock (RN-01)', async ({ page }) => {
  82  |       // Agregar producto al carrito vía clic
  83  |       // In seedPOS, 'Salmón Fresco' is 'prod-salmon' with 10 stock
  84  |       await page.click('text=Salmón Fresco');
  85  | 
  86  |       // Confirmar venta
  87  |       await page.click('text=Confirmar Venta');
  88  | 
  89  |       // Pagar (asumiendo que hay un botón de cobrar/pagar o es directo)
  90  |       // Needs verification of POSView payment flow
  91  |       await page.click('text=Registrar Pago');
  92  | 
  93  |       // Verify SweetAlert success
  94  |       const swalTitle = page.locator('.swal2-title');
  95  |       await expect(swalTitle).toHaveText(/Venta exitosa/i);
  96  |       
  97  |       // Wait for it to close
  98  |       await expect(page.locator('.swal2-popup')).toBeHidden({ timeout: 3000 });
  99  | 
  100 |       // Asertión: localStorage pezcaderia_ventas tiene 1 venta; stock del producto decrementó
  101 |       const ventasStr = await page.evaluate(() => localStorage.getItem('pezcaderia_ventas'));
  102 |       const ventas = JSON.parse(ventasStr || '[]');
  103 |       expect(ventas.length).toBe(1);
  104 | 
  105 |       // We should check stock in localStorage as well
  106 |       const stockStr = await page.evaluate(() => localStorage.getItem('pezcaderia_stock'));
  107 |       const stock = JSON.parse(stockStr || '{}');
  108 |       expect(stock['Bodega Principal']['prod-salmon']).toBe(9); // Decremented by 1
  109 |     });
  110 | 
  111 |     test('Debe validar RN-01: Intentar vender producto con stock=0 -> mostrar error', async ({ page }) => {
  112 |       // First let's set stock of Salmón to 0
  113 |       await page.evaluate(() => {
  114 |         const stockData = JSON.parse(localStorage.getItem('pezcaderia_stock') || '{}');
  115 |         if (stockData['Bodega Principal']) stockData['Bodega Principal']['prod-salmon'] = 0;
  116 |         if (stockData['caja-cash-test']) stockData['caja-cash-test']['prod-salmon'] = 0;
  117 |         localStorage.setItem('pezcaderia_stock', JSON.stringify(stockData));
  118 |       });
  119 |       await page.reload();
```