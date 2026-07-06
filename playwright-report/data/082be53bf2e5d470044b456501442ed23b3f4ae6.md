# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pos.spec.ts >> POS - Flujo de Apertura, Venta y Cierre (FASE 6) >> FASE 5: Optimizaciones UX/UI >> 5.2 Test Caja Cerrada: Botón cobrar debe estar deshabilitado y mostrar advertencia
- Location: tests\e2e\pos.spec.ts:301:5

# Error details

```
Error: expect(locator).toBeDisabled() failed

Locator: locator('[data-testid="btn-cobrar"]')
Expected: disabled
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeDisabled" with timeout 5000ms
  - waiting for locator('[data-testid="btn-cobrar"]')

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
  - heading "Turno de Caja Cerrado" [level=3]
  - paragraph: No puedes realizar cobros hasta abrir un nuevo turno.
  - button "Abrir Turno Ahora"
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
  - text: "Salmón Fresco $35.000 Categoría Descriptiva (Grupo): General Bod. Principal: 500 uds Bod. Secundaria: 0 uds Bod. Averías: 0 uds"
  - img "Trucha Arcoiris"
  - text: "Trucha Arcoiris $25.000 Categoría Descriptiva (Grupo): General Bod. Principal: 85 uds Bod. Secundaria: 0 uds Bod. Averías: 0 uds"
  - img "Tilapia Roja"
  - text: "Tilapia Roja $15.000 Categoría Descriptiva (Grupo): General Bod. Principal: 120 uds Bod. Secundaria: 0 uds Bod. Averías: 0 uds"
  - img
  - text: Consumidor Final (222222222222)
  - img
  - button "Borradores"
  - text: 🛒 El carrito está vacío ⚠️ Abre un turno para habilitar los pagos Subtotal (0 ítems) $0 Impuestos (0%) $0 Descuento
  - img
  - text: "-$0"
  - img
  - heading "Caja Cerrada" [level=4]
  - paragraph: El flujo de ventas está pausado. Abra un turno para reanudar.
  - button "Abrir Turno de Caja":
    - img
    - text: Abrir Turno de Caja
- button "Panel de Pruebas Dev":
  - img
```

# Test source

```ts
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
  220 |       await expect(swalTitle).toHaveText(/Venta Bloqueada: Stock Insuficiente|Sin stock|Error/i, { timeout: 4000 });
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
> 303 |       await expect(btnCobrar).toBeDisabled();
      |                               ^ Error: expect(locator).toBeDisabled() failed
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
  321 |       await toggle.check();
  322 | 
  323 |       // La tarjeta con stock 0 ya no debe estar en el grid
  324 |       await expect(outOfStockCard).toBeHidden();
  325 |     });
  326 |   });
  327 | });
  328 | 
```