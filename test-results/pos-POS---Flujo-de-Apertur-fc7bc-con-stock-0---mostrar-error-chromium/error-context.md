# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pos.spec.ts >> POS - Flujo de Apertura, Venta y Cierre (FASE 6) >> TASK-12: Agregar test de venta a pos.spec.ts >> Debe validar RN-01: Intentar vender producto con stock=0 -> mostrar error
- Location: tests\e2e\pos.spec.ts:187:5

# Error details

```
Error: expect(locator).toBeEnabled() failed

Locator: locator('[data-testid="btn-cobrar"]')
Expected: enabled
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeEnabled" with timeout 5000ms
  - waiting for locator('[data-testid="btn-cobrar"]')

```

# Test source

```ts
  112 |         for (const [key, value] of Object.entries(seedData)) {
  113 |           localStorage.setItem(key, JSON.stringify(value));
  114 |         }
  115 |         // Fix for dynamic warehouse architecture stock structure (dictionary format by SKU)
  116 |         const pezcaderiaStock = {
  117 |           "Bodega Principal": {
  118 |             "PES-ENT-001": 10,
  119 |             "FIL-LIM-002": 5,
  120 |             "CAM-TIG-003": 8
  121 |           },
  122 |           "caja-test-menor": {
  123 |             "PES-ENT-001": 10,
  124 |             "FIL-LIM-002": 5,
  125 |             "CAM-TIG-003": 8
  126 |           }
  127 |         };
  128 |         localStorage.setItem('pezcaderia_stock', JSON.stringify(pezcaderiaStock));
  129 |       }, { ...POS_SEED_DATA, ...CASH_SEED_DATA }); // Merge to get products AND open shift
  130 |       await page.reload();
  131 |       await page.waitForLoadState('domcontentloaded');
  132 |       await page.waitForLoadState('networkidle');
  133 |       await expect(page.locator('.sidebar-menu')).toBeVisible({ timeout: 15000 });
  134 |       await page.click('[data-testid="nav-pos"]');
  135 |     });
  136 | 
  137 |     test('Debe procesar una venta y decrementar el stock (RN-01)', async ({ page }) => {
  138 |       page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  139 |       
  140 |       const turnosStr = await page.evaluate(() => localStorage.getItem('pezcaderia_turnos_caja'));
  141 |       console.log('TURNOS EN LOCALSTORAGE AL INICIO:', turnosStr);
  142 |       
  143 |       const paymentPanelHTML = await page.evaluate(() => {
  144 |         const el = document.querySelector('.pos-cart-footer');
  145 |         return el ? el.innerHTML : 'No cart footer found';
  146 |       });
  147 |       console.log('PAYMENT PANEL HTML:', paymentPanelHTML);
  148 | 
  149 |       // Agregar producto al carrito vía clic
  150 |       // 1. Esperar EXPLÍCITAMENTE a que el producto sea visible en el DOM.
  151 |       const productItem = page.locator('text=Salmón Fresco').first();
  152 |       await expect(productItem).toBeVisible({ timeout: 15000 });
  153 |       
  154 |       const btnCobrar = page.locator('[data-testid="btn-cobrar"]');
  155 |       
  156 |       // Retry clicking the product until the 'Cobrar' button becomes enabled.
  157 |       // This solves race conditions where the click is lost because React is re-rendering the list.
  158 |       await expect(async () => {
  159 |         if (await btnCobrar.isDisabled()) {
  160 |           await productItem.click({ force: true });
  161 |         }
  162 |         await expect(btnCobrar).toBeEnabled({ timeout: 1000 });
  163 |       }).toPass({ timeout: 15000 });
  164 |       
  165 |       await btnCobrar.click();
  166 | 
  167 |       // En este flujo, COBRAR procesa directamente la venta si es Efectivo.
  168 |       // Verify SweetAlert success
  169 |       const swalTitle = page.locator('.swal2-title');
  170 |       await expect(swalTitle).toHaveText(/Venta procesada/i);
  171 |       
  172 |       // Wait for it to close
  173 |       await expect(page.locator('.swal2-popup')).toBeHidden({ timeout: 3000 });
  174 | 
  175 |       // Asertión: localStorage pezcaderia_ventas tiene 1 venta; stock del producto decrementó
  176 |       const ventasStr = await page.evaluate(() => localStorage.getItem('pezcaderia_ventas'));
  177 |       const ventas = JSON.parse(ventasStr || '[]');
  178 |       expect(ventas.length).toBe(1);
  179 | 
  180 |       // We should check stock in localStorage as well
  181 |       const stockStr = await page.evaluate(() => localStorage.getItem('pezcaderia_stock'));
  182 |       const stock = JSON.parse(stockStr || '{}');
  183 |       const salmonStock = stock['Bodega Principal']?.['PES-ENT-001'];
  184 |       expect(salmonStock).toBe(9); // Decremented by 1
  185 |     });
  186 | 
  187 |     test('Debe validar RN-01: Intentar vender producto con stock=0 -> mostrar error', async ({ page }) => {
  188 |       // First let's set stock of Salmón to 0
  189 |       await page.evaluate(() => {
  190 |         const stockData = JSON.parse(localStorage.getItem('pezcaderia_stock') || '{}');
  191 |         const setStockZero = (location: string, sku: string) => {
  192 |           if (stockData[location] && stockData[location][sku] !== undefined) {
  193 |             stockData[location][sku] = 0;
  194 |           }
  195 |         };
  196 |         setStockZero('Bodega Principal', 'PES-ENT-001');
  197 |         setStockZero('caja-test-menor', 'PES-ENT-001');
  198 |         localStorage.setItem('pezcaderia_stock', JSON.stringify(stockData));
  199 |       });
  200 |       await page.reload();
  201 |       await page.waitForLoadState('domcontentloaded');
  202 |       await page.waitForLoadState('networkidle');
  203 |       await expect(page.locator('.sidebar-menu')).toBeVisible({ timeout: 15000 });
  204 |       await page.click('[data-testid="nav-pos"]');
  205 | 
  206 |       const productItem = page.locator('text=Salmón Fresco').first();
  207 |       await expect(productItem).toBeVisible({ timeout: 15000 });
  208 |       await productItem.click({ force: true });
  209 |       
  210 |       // Click cobrar to trigger the stock validation
  211 |       const btnCobrar = page.locator('[data-testid="btn-cobrar"]');
> 212 |       await expect(btnCobrar).toBeEnabled({ timeout: 5000 });
      |                               ^ Error: expect(locator).toBeEnabled() failed
  213 |       await btnCobrar.click();
  214 | 
  215 |       const swalTitle = page.locator('.swal2-title');
  216 |       await expect(swalTitle).toHaveText(/Venta Bloqueada: Stock Insuficiente|Sin stock|Error/i, { timeout: 4000 });
  217 |     });
  218 |   });
  219 | 
  220 |   test.describe('TASK-13: Agregar test de cierre a pos.spec.ts', () => {
  221 |     test.beforeEach(async ({ page }) => {
  222 |       await page.setViewportSize({ width: 1440, height: 900 });
  223 |       await page.goto('/');
  224 |       await page.evaluate((seedData) => {
  225 |         localStorage.clear();
  226 |         for (const [key, value] of Object.entries(seedData)) {
  227 |           localStorage.setItem(key, JSON.stringify(value));
  228 |         }
  229 |       }, CASH_SEED_DATA);
  230 |       await page.reload();
  231 |       await page.waitForLoadState('domcontentloaded');
  232 |       await page.waitForLoadState('networkidle');
  233 |       await expect(page.locator('.sidebar-menu')).toBeVisible({ timeout: 15000 });
  234 |       // Navegar a módulo Caja para cerrar
  235 |       await page.click('[data-testid="nav-caja"]');
  236 |     });
  237 | 
  238 |     test('Debe cerrar la caja y registrar el arqueo (RN-44)', async ({ page }) => {
  239 |       // Hacer clic en data-testid="btn-cierre-caja" o su equivalente visual
  240 |       const btnCierreCaja = page.locator('[data-testid="btn-cierre-caja"], [data-testid="btn-cerrar-turno"], button:has-text("Cerrar Turno"), button:has-text("Cierre de Caja")').first();
  241 |       await expect(btnCierreCaja).toBeVisible({ timeout: 15000 });
  242 |       await btnCierreCaja.click({ force: true });
  243 | 
  244 |       // Ingresar monto en data-testid="input-efectivo-arqueo"
  245 |       // Seed sets totalEfectivo to 255000. Let's enter 255000
  246 |       await page.fill('[data-testid="input-efectivo-arqueo"]', '255000');
  247 | 
  248 |       // Clic en data-testid="btn-confirmar-arqueo"
  249 |       await page.click('[data-testid="btn-confirmar-arqueo"]');
  250 | 
  251 |       // Check first dialog: ¿Confirmar Arqueo y Cierre?
  252 |       const confirmDialogTitle = page.locator('.swal2-title');
  253 |       await expect(confirmDialogTitle).toHaveText(/Confirmar Arqueo/i, { timeout: 10000 });
  254 |       
  255 |       // Click Yes to confirm
  256 |       await page.click('.swal2-confirm');
  257 | 
  258 |       // Check success
  259 |       await expect(page.locator('.swal2-title')).toHaveText(/Cierre Exitoso|Caja Cerrada/i, { timeout: 10000 });
  260 | 
  261 |       // Asertión: turno en pezcaderia_turnos_caja tiene estado: 'CERRADO'
  262 |       const turnosStr = await page.evaluate(() => localStorage.getItem('pezcaderia_turnos_caja'));
  263 |       const turnos = JSON.parse(turnosStr || '[]');
  264 |       expect(turnos.length).toBeGreaterThan(0);
  265 |       expect(turnos[0].estado).toBe('CERRADO');
  266 |       expect(turnos[0].diferenciaEfectivo).toBe(0);
  267 |     });
  268 |   });
  269 | });
  270 | 
```