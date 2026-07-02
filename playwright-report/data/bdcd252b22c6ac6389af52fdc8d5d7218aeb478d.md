# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pos.spec.ts >> POS - Flujo de Apertura, Venta y Cierre (FASE 6) >> TASK-12: Agregar test de venta a pos.spec.ts >> Debe validar RN-01: Intentar vender producto con stock=0 -> mostrar error
- Location: tests\e2e\pos.spec.ts:192:5

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator: locator('.swal2-title')
Expected pattern: /Venta Bloqueada: Stock Insuficiente|Sin stock|Error/i
Timeout: 4000ms
Error: element(s) not found

Call log:
  - Expect "toHaveText" with timeout 4000ms
  - waiting for locator('.swal2-title')
    7 × locator resolved to <h2 id="swal2-title" class="swal2-title">Venta Procesada</h2>
      - unexpected value "Venta Procesada"

```

```yaml
- banner:
  - text: 🐟 La Pezcadería
  - button:
    - img
  - text: Comercial > Punto de Venta (POS) PEZCADERIA S.A.S
  - button "Ayuda":
    - img
  - button "Inicio":
    - img
  - button "Facturar":
    - img
    - text: Facturar
  - text: Yu
- complementary:
  - text: Yu
  - button:
    - img
  - navigation:
    - img
    - img
    - img
    - img
    - img
    - img
    - img
    - img
    - img
    - img
    - img
    - img
    - img
    - img
    - img
    - img
    - img
    - img
  - button:
    - img
- main:
  - button "Venta Rápida (POS)":
    - img
    - text: Venta Rápida (POS)
  - button "Consolidación y Facturación B2B":
    - img
    - text: Consolidación y Facturación B2B
  - button "Monitoreo Canales Digitales":
    - img
    - text: Monitoreo Canales Digitales
  - button "KB Gestión Kanban"
  - text: "Rol: admin"
  - img
  - textbox "Buscar por nombre o SKU..."
  - img
  - textbox "Código de Barras..."
  - button "Simular Scan":
    - img
    - text: Simular Scan
  - button "TODOS"
  - button "Pescados"
  - checkbox "Ocultar agotados"
  - text: Ocultar agotados
  - checkbox "⭐ Más vendidos"
  - text: ⭐ Más vendidos
  - img "Salmón Fresco"
  - text: "Salmón Fresco $35.000 Categoría Descriptiva (Grupo): General Bod. Principal: 499 uds Bod. Secundaria: 0 uds Bod. Averías: 0 uds"
  - img "Trucha Arcoiris"
  - text: "Trucha Arcoiris $25.000 Categoría Descriptiva (Grupo): General Bod. Principal: 85 uds Bod. Secundaria: 0 uds Bod. Averías: 0 uds"
  - img "Tilapia Roja"
  - text: "Tilapia Roja $15.000 Categoría Descriptiva (Grupo): General Bod. Principal: 120 uds Bod. Secundaria: 0 uds Bod. Averías: 0 uds"
  - heading "Venta Realizada con Éxito" [level=3]
  - text: Previsualización de Ticket
  - button "Imprimir":
    - img
    - text: Imprimir
  - text: "*** ERP MAESTRO PESCADERIA *** PESCADERIA S.A.S. NIT: 900.123.456-1 Dirección: Calle 72 # 15-23, Bogotá Teléfono: 310 123 4567 ======================================== Factura: VTA-14F6E9AF Fecha : 2/7/2026, 12:43:10 p. m. Cajero : admin ---------------------------------------- Cliente: CONSUMIDOR FINAL NIT/CC : 222222222222 ======================================== PRODUCTO/CANT TOTAL ---------------------------------------- Salmón Fresco 1 UNIDAD x $35.000 $35.000 ======================================== SUBTOTAL: $35.000 TOTAL FINAL: $35.000 ---------------------------------------- Método Pago: CONTADO Efectivo Recibido: $35.000 ======================================== ¡GRACIAS POR SU COMPRA! Pescado fresco del día"
  - button "Nueva Venta"
- button "Panel de Pruebas Dev":
  - img
```

# Test source

```ts
  120 |         // Fix for dynamic warehouse architecture stock structure (dictionary format by SKU)
  121 |         const pezcaderiaStock = {
  122 |           "b1": {
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
  172 |       // Wait for it to close completely del DOM
  173 |       await expect(page.locator('.swal2-container')).not.toBeAttached({ timeout: 15000 });
  174 | 
  175 |       // Asertión: localStorage pezcaderia_ventas tiene 1 venta; stock del producto decrementó
  176 |       // Usamos toPass porque la escritura a localStorage (en App.tsx) puede ser asíncrona (useEffect)
  177 |       await expect(async () => {
  178 |         const ventasStr = await page.evaluate(() => localStorage.getItem('pezcaderia_ventas'));
  179 |         const ventas = JSON.parse(ventasStr || '[]');
  180 |         expect(ventas.length).toBe(1);
  181 | 
  182 |         const stockStr = await page.evaluate(() => localStorage.getItem('pezcaderia_stock'));
  183 |         const stock = JSON.parse(stockStr || '{}');
  184 |         const salmonStock = stock['b1']?.['PES-ENT-001'];
  185 |         
  186 |         // Calculamos la cantidad vendida real, ya que el test pudo haber hecho varios clics
  187 |         const cantVendida = ventas[0].items[0].cantidad;
  188 |         expect(salmonStock).toBe(10 - cantVendida);
  189 |       }).toPass({ timeout: 5000 });
  190 |     });
  191 | 
  192 |     test('Debe validar RN-01: Intentar vender producto con stock=0 -> mostrar error', async ({ page }) => {
  193 |       // First let's set stock of Salmón to 0
  194 |       await page.evaluate(() => {
  195 |         const stockData = JSON.parse(localStorage.getItem('pezcaderia_stock') || '{}');
  196 |         const setStockZero = (location: string, sku: string) => {
  197 |           if (stockData[location] && stockData[location][sku] !== undefined) {
  198 |             stockData[location][sku] = 0;
  199 |           }
  200 |         };
  201 |         setStockZero('b1', 'PES-ENT-001');
  202 |         localStorage.setItem('pezcaderia_stock', JSON.stringify(stockData));
  203 |       });
  204 |       await page.reload();
  205 |       await page.waitForLoadState('domcontentloaded');
  206 |       await page.waitForLoadState('networkidle');
  207 |       await expect(page.locator('.sidebar-menu')).toBeVisible({ timeout: 15000 });
  208 |       await page.click('[data-testid="nav-pos"]');
  209 | 
  210 |       const productItem = page.locator('text=Salmón Fresco').first();
  211 |       await expect(productItem).toBeVisible({ timeout: 15000 });
  212 |       await productItem.click({ force: true });
  213 |       
  214 |       // Click cobrar to trigger the stock validation
  215 |       const btnCobrar = page.locator('[data-testid="btn-cobrar"]');
  216 |       await expect(btnCobrar).toBeEnabled({ timeout: 5000 });
  217 |       await btnCobrar.click();
  218 | 
  219 |       const swalTitle = page.locator('.swal2-title');
> 220 |       await expect(swalTitle).toHaveText(/Venta Bloqueada: Stock Insuficiente|Sin stock|Error/i, { timeout: 4000 });
      |                               ^ Error: expect(locator).toHaveText(expected) failed
  221 |     });
  222 |   });
  223 | 
  224 |   test.describe('TASK-13: Agregar test de cierre a pos.spec.ts', () => {
  225 |     test.beforeEach(async ({ page }) => {
  226 |       await page.setViewportSize({ width: 1440, height: 900 });
  227 |       await page.goto('/');
  228 |       await page.evaluate((seedData) => {
  229 |         localStorage.clear();
  230 |         for (const [key, value] of Object.entries(seedData)) {
  231 |           localStorage.setItem(key, JSON.stringify(value));
  232 |         }
  233 |       }, CASH_SEED_DATA);
  234 |       await page.reload();
  235 |       await page.waitForLoadState('domcontentloaded');
  236 |       await page.waitForLoadState('networkidle');
  237 |       await expect(page.locator('.sidebar-menu')).toBeVisible({ timeout: 15000 });
  238 |       // Navegar a módulo Caja para cerrar
  239 |       await page.click('[data-testid="nav-caja"]');
  240 |     });
  241 | 
  242 |     test('Debe cerrar la caja y registrar el arqueo (RN-44)', async ({ page }) => {
  243 |       // Hacer clic en data-testid="btn-cierre-caja" o su equivalente visual
  244 |       const btnCierreCaja = page.locator('[data-testid="btn-cierre-caja"], [data-testid="btn-cerrar-turno"], button:has-text("Cerrar Turno"), button:has-text("Cierre de Caja")').first();
  245 |       await expect(btnCierreCaja).toBeVisible({ timeout: 15000 });
  246 |       await btnCierreCaja.click({ force: true });
  247 | 
  248 |       // Ingresar monto en data-testid="input-efectivo-arqueo"
  249 |       // Seed sets totalEfectivo to 255000. Let's enter 255000
  250 |       await page.fill('[data-testid="input-efectivo-arqueo"]', '255000');
  251 | 
  252 |       // Clic en data-testid="btn-confirmar-arqueo"
  253 |       await page.click('[data-testid="btn-confirmar-arqueo"]');
  254 | 
  255 |       // Check first dialog: ¿Confirmar Arqueo y Cierre?
  256 |       const confirmDialogTitle = page.locator('.swal2-title');
  257 |       await expect(confirmDialogTitle).toHaveText(/Confirmar Arqueo/i, { timeout: 10000 });
  258 |       
  259 |       // Click Yes to confirm
  260 |       await page.click('.swal2-confirm');
  261 | 
  262 |       // Check success
  263 |       await expect(page.locator('.swal2-title')).toHaveText(/Cierre Exitoso|Caja Cerrada/i, { timeout: 10000 });
  264 | 
  265 |       // Asertión: turno en pezcaderia_turnos_caja tiene estado: 'CERRADO'
  266 |       const turnosStr = await page.evaluate(() => localStorage.getItem('pezcaderia_turnos_caja'));
  267 |       const turnos = JSON.parse(turnosStr || '[]');
  268 |       expect(turnos.length).toBeGreaterThan(0);
  269 |       expect(turnos[0].estado).toBe('CERRADO');
  270 |       expect(turnos[0].diferenciaEfectivo).toBe(0);
  271 |     });
  272 |   });
  273 |   test.describe('FASE 5: Optimizaciones UX/UI', () => {
  274 |     test.beforeEach(async ({ page }) => {
  275 |       await page.setViewportSize({ width: 1440, height: 900 });
  276 |       await page.goto('/');
  277 |       // Inyectar estado CON un turno cerrado para testear caja cerrada
  278 |       await page.evaluate((data) => {
  279 |         localStorage.clear();
  280 |         for (const [key, value] of Object.entries(data)) {
  281 |           localStorage.setItem(key, JSON.stringify(value));
  282 |         }
  283 |         // Configurar stock específico para probar semáforos y toggle
  284 |         const pezcaderiaStock = {
  285 |           "b1": {
  286 |             "PES-ENT-001": 10, // verde
  287 |             "FIL-LIM-002": 2,  // amarillo (buffer por defecto es 4)
  288 |             "CAM-TIG-003": 0   // rojo
  289 |           }
  290 |         };
  291 |         localStorage.setItem('pezcaderia_stock', JSON.stringify(pezcaderiaStock));
  292 |       }, { ...POS_SEED_DATA, pezcaderia_turnos_caja: [] }); 
  293 | 
  294 |       await page.reload();
  295 |       await page.waitForLoadState('domcontentloaded');
  296 |       await page.waitForLoadState('networkidle');
  297 |       await expect(page.locator('.sidebar-menu')).toBeVisible({ timeout: 15000 });
  298 |       await page.click('[data-testid="nav-pos"]');
  299 |     });
  300 | 
  301 |     test('5.2 Test Caja Cerrada: Botón cobrar debe estar deshabilitado y mostrar advertencia', async ({ page }) => {
  302 |       const btnCobrar = page.locator('[data-testid="btn-cobrar"]');
  303 |       await expect(btnCobrar).toBeDisabled();
  304 |       const footerMsg = page.locator('text=Abre un turno para habilitar los pagos');
  305 |       await expect(footerMsg).toBeVisible();
  306 |     });
  307 | 
  308 |     test('5.3 y 5.4 Semáforos y Toggle Ocultar Agotados', async ({ page }) => {
  309 |       const productGrid = page.locator('[data-testid="product-grid"]');
  310 |       await expect(productGrid).toBeVisible();
  311 | 
  312 |       // Verificar semáforo rojo (stock 0)
  313 |       const redBadge = productGrid.locator('[data-testid="stock-badge-red"]').first();
  314 |       await expect(redBadge).toBeVisible();
  315 |       
  316 |       const outOfStockCard = page.locator('.product-card').filter({ has: page.locator('[data-testid="stock-badge-red"]') }).first();
  317 |       await expect(outOfStockCard).toHaveClass(/opacity-50/); // Grayscale y opacity aplicadas
  318 |       
  319 |       // Test Toggle
  320 |       const toggle = page.locator('label', { hasText: 'Ocultar agotados' }).locator('input[type="checkbox"]');
```