# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pos.spec.ts >> POS - Flujo de Apertura, Venta y Cierre (FASE 6) >> TASK-13: Agregar test de cierre a pos.spec.ts >> Debe cerrar la caja y registrar el arqueo (RN-44)
- Location: tests\e2e\pos.spec.ts:245:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="btn-cierre-caja"], [data-testid="btn-cerrar-turno"], button:has-text("Cerrar Turno"), button:has-text("Cierre de Caja")').first()
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('[data-testid="btn-cierre-caja"], [data-testid="btn-cerrar-turno"], button:has-text("Cerrar Turno"), button:has-text("Cierre de Caja")').first()

```

```yaml
- banner:
  - text: 🐟 La Pezcadería
  - button:
    - img
  - text: Comercial > Gestión de Cajas PEZCADERIA S.A.S
  - button "Ayuda":
    - img
  - button "Inicio":
    - img
  - button "Facturar":
    - img
    - text: Facturar
  - text: Yu
- complementary:
  - text: Yu Yurgen Moreno
  - combobox:
    - option "Super administrador" [selected]
    - option "Vendedor"
    - option "Jefe de bodega"
    - option "Administrativo"
  - button "Facturar":
    - img
    - text: Facturar
  - navigation:
    - img
    - text: POS
    - img
    - text: Cotizacion
    - img
    - text: Clientes
    - img
    - text: CRM (Twenty)
    - img
    - text: Documentos
    - img
    - text: Compras y Gastos
    - img
    - text: Cartera
    - img
    - text: Inventario
    - img
    - text: Alistamiento Bodega
    - img
    - text: Traslados
    - img
    - text: Ajuste
    - img
    - text: Caja
    - img
    - text: Cuentas
    - img
    - text: Personal (RRHH)
    - img
    - text: Nómina
    - img
    - text: Despachos / Kanban
    - img
    - text: Produccion
    - img
    - text: Panel de Control
  - button "Salir":
    - img
    - text: Salir
- main:
  - heading "Gestión de Cajas" [level=1]
  - paragraph: Control de flujo de efectivo por bodega
  - text: "Bodega:"
  - combobox:
    - option "Bodega Principal" [selected]
  - text: "Caja:"
  - combobox:
    - option "Caja Menor - Bodega Principal" [selected]
    - option "Caja Mayor - Bodega Principal"
  - img
  - heading "La caja está cerrada" [level=2]
  - paragraph: Debe abrir un turno para procesar ventas y registrar movimientos de efectivo en esta caja.
  - button "Abrir Turno de Caja":
    - img
    - text: Abrir Turno de Caja
- button "Panel de Pruebas Dev":
  - img
```

# Test source

```ts
  148 |         return el ? el.innerHTML : 'No cart footer found';
  149 |       });
  150 |       console.log('PAYMENT PANEL HTML:', paymentPanelHTML);
  151 | 
  152 |       // Agregar producto al carrito vía clic
  153 |       // 1. Esperar EXPLÍCITAMENTE a que el producto sea visible en el DOM.
  154 |       const productItem = page.locator('text=Salmón Fresco').first();
  155 |       await expect(productItem).toBeVisible({ timeout: 15000 });
  156 |       
  157 |       const btnCobrar = page.locator('[data-testid="btn-cobrar"]');
  158 |       
  159 |       // Retry clicking the product until the 'Cobrar' button becomes enabled.
  160 |       // This solves race conditions where the click is lost because React is re-rendering the list.
  161 |       await expect(async () => {
  162 |         if (await btnCobrar.isDisabled()) {
  163 |           await productItem.click({ force: true });
  164 |         }
  165 |         await expect(btnCobrar).toBeEnabled({ timeout: 1000 });
  166 |       }).toPass({ timeout: 15000 });
  167 |       
  168 |       await btnCobrar.click();
  169 | 
  170 |       // En este flujo, COBRAR procesa directamente la venta si es Efectivo.
  171 |       // Verify SweetAlert success
  172 |       const swalTitle = page.locator('.swal2-title');
  173 |       await expect(swalTitle).toHaveText(/Venta procesada/i);
  174 |       
  175 |       // Wait for it to close completely del DOM
  176 |       await expect(page.locator('.swal2-container')).not.toBeAttached({ timeout: 15000 });
  177 | 
  178 |       // Asertión: localStorage pezcaderia_ventas tiene 1 venta; stock del producto decrementó
  179 |       // Usamos toPass porque la escritura a localStorage (en App.tsx) puede ser asíncrona (useEffect)
  180 |       await expect(async () => {
  181 |         const ventasStr = await page.evaluate(() => localStorage.getItem('pezcaderia_ventas'));
  182 |         const ventas = JSON.parse(ventasStr || '[]');
  183 |         expect(ventas.length).toBe(1);
  184 | 
  185 |         const stockStr = await page.evaluate(() => localStorage.getItem('pezcaderia_stock'));
  186 |         const stock = JSON.parse(stockStr || '{}');
  187 |         const salmonStock = stock['b1']?.['PES-ENT-001'];
  188 |         
  189 |         // Calculamos la cantidad vendida real, ya que el test pudo haber hecho varios clics
  190 |         const cantVendida = ventas[0].items[0].cantidad;
  191 |         expect(salmonStock).toBe(10 - cantVendida);
  192 |       }).toPass({ timeout: 5000 });
  193 |     });
  194 | 
  195 |     test('Debe validar RN-01: Intentar vender producto con stock=0 -> mostrar error', async ({ page }) => {
  196 |       // First let's set stock of Salmón to 0
  197 |       await page.evaluate(() => {
  198 |         const stockData = JSON.parse(localStorage.getItem('pezcaderia_stock') || '{}');
  199 |         const setStockZero = (location: string, sku: string) => {
  200 |           if (stockData[location] && stockData[location][sku] !== undefined) {
  201 |             stockData[location][sku] = 0;
  202 |           }
  203 |         };
  204 |         setStockZero('b1', 'PES-ENT-001');
  205 |         localStorage.setItem('pezcaderia_stock', JSON.stringify(stockData));
  206 |       });
  207 |       await page.reload();
  208 |       await page.waitForLoadState('domcontentloaded');
  209 |       await page.waitForLoadState('networkidle');
  210 |       await expect(page.locator('.sidebar-menu')).toBeVisible({ timeout: 15000 });
  211 |       await page.click('[data-testid="nav-pos"]');
  212 | 
  213 |       const productItem = page.locator('text=Salmón Fresco').first();
  214 |       await expect(productItem).toBeVisible({ timeout: 15000 });
  215 |       await productItem.click({ force: true });
  216 |       
  217 |       // Click cobrar to trigger the stock validation
  218 |       const btnCobrar = page.locator('[data-testid="btn-cobrar"]');
  219 |       await expect(btnCobrar).toBeEnabled({ timeout: 5000 });
  220 |       await btnCobrar.click();
  221 | 
  222 |       const swalTitle = page.locator('.swal2-title');
  223 |       await expect(swalTitle).toHaveText(/Venta Bloqueada: Stock Insuficiente|Sin stock|Error/i, { timeout: 4000 });
  224 |     });
  225 |   });
  226 | 
  227 |   test.describe('TASK-13: Agregar test de cierre a pos.spec.ts', () => {
  228 |     test.beforeEach(async ({ page }) => {
  229 |       await page.setViewportSize({ width: 1440, height: 900 });
  230 |       await page.goto('/');
  231 |       await page.evaluate((seedData) => {
  232 |         localStorage.clear();
  233 |         for (const [key, value] of Object.entries(seedData)) {
  234 |           localStorage.setItem(key, JSON.stringify(value));
  235 |         }
  236 |       }, CASH_SEED_DATA);
  237 |       await page.reload();
  238 |       await page.waitForLoadState('domcontentloaded');
  239 |       await page.waitForLoadState('networkidle');
  240 |       await expect(page.locator('.sidebar-menu')).toBeVisible({ timeout: 15000 });
  241 |       // Navegar a módulo Caja para cerrar
  242 |       await page.click('[data-testid="nav-caja"]');
  243 |     });
  244 | 
  245 |     test('Debe cerrar la caja y registrar el arqueo (RN-44)', async ({ page }) => {
  246 |       // Hacer clic en data-testid="btn-cierre-caja" o su equivalente visual
  247 |       const btnCierreCaja = page.locator('[data-testid="btn-cierre-caja"], [data-testid="btn-cerrar-turno"], button:has-text("Cerrar Turno"), button:has-text("Cierre de Caja")').first();
> 248 |       await expect(btnCierreCaja).toBeVisible({ timeout: 15000 });
      |                                   ^ Error: expect(locator).toBeVisible() failed
  249 |       await btnCierreCaja.click({ force: true });
  250 | 
  251 |       // Ingresar monto en data-testid="input-efectivo-arqueo"
  252 |       // Seed sets totalEfectivo to 255000. Let's enter 255000
  253 |       await page.fill('[data-testid="input-efectivo-arqueo"]', '255000');
  254 | 
  255 |       // Clic en data-testid="btn-confirmar-arqueo"
  256 |       await page.click('[data-testid="btn-confirmar-arqueo"]');
  257 | 
  258 |       // Check first dialog: ¿Confirmar Arqueo y Cierre?
  259 |       const confirmDialogTitle = page.locator('.swal2-title');
  260 |       await expect(confirmDialogTitle).toHaveText(/Confirmar Arqueo/i, { timeout: 10000 });
  261 |       
  262 |       // Click Yes to confirm
  263 |       await page.click('.swal2-confirm');
  264 | 
  265 |       // Check success
  266 |       await expect(page.locator('.swal2-title')).toHaveText(/Cierre Exitoso|Caja Cerrada/i, { timeout: 10000 });
  267 | 
  268 |       // Asertión: turno en pezcaderia_turnos_caja tiene estado: 'CERRADO'
  269 |       const turnosStr = await page.evaluate(() => localStorage.getItem('pezcaderia_turnos_caja'));
  270 |       const turnos = JSON.parse(turnosStr || '[]');
  271 |       expect(turnos.length).toBeGreaterThan(0);
  272 |       expect(turnos[0].estado).toBe('CERRADO');
  273 |       expect(turnos[0].diferenciaEfectivo).toBe(0);
  274 |     });
  275 |   });
  276 | });
  277 | 
```