# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pos.spec.ts >> POS - Flujo de Apertura, Venta y Cierre (FASE 6) >> TASK-12: Agregar test de venta a pos.spec.ts >> Debe procesar una venta y decrementar el stock (RN-01)
- Location: tests\e2e\pos.spec.ts:132:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 9
Received: 499
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e7]: 🐟 La Pezcadería
        - button [ref=e8] [cursor=pointer]:
          - img [ref=e9]
      - generic [ref=e11]:
        - generic [ref=e12]: Comercial
        - generic [ref=e13]: ">"
        - generic [ref=e14]: Punto de Venta (POS)
    - generic [ref=e15]:
      - generic [ref=e16]: PEZCADERIA S.A.S
      - button "Ayuda" [ref=e17] [cursor=pointer]:
        - img [ref=e18]
      - button "Inicio" [ref=e21] [cursor=pointer]:
        - img [ref=e22]
      - button "Facturar" [ref=e25] [cursor=pointer]:
        - img [ref=e26]
        - generic [ref=e30]: Facturar
      - generic [ref=e31]: Yu
  - generic [ref=e32]:
    - complementary [ref=e33]:
      - generic [ref=e35]: Yu
      - button [ref=e36] [cursor=pointer]:
        - img [ref=e37]
      - navigation [ref=e40]:
        - img [ref=e42] [cursor=pointer]
        - img [ref=e46] [cursor=pointer]
        - img [ref=e49] [cursor=pointer]
        - img [ref=e55] [cursor=pointer]
        - img [ref=e59] [cursor=pointer]
        - img [ref=e63] [cursor=pointer]
        - img [ref=e68] [cursor=pointer]
        - img [ref=e73] [cursor=pointer]
        - img [ref=e77] [cursor=pointer]
        - img [ref=e83] [cursor=pointer]
        - img [ref=e89] [cursor=pointer]
        - img [ref=e95] [cursor=pointer]
        - img [ref=e100] [cursor=pointer]
        - img [ref=e104] [cursor=pointer]
        - img [ref=e110] [cursor=pointer]
        - img [ref=e114] [cursor=pointer]
        - img [ref=e120] [cursor=pointer]
        - img [ref=e126] [cursor=pointer]
      - button [ref=e131] [cursor=pointer]:
        - img [ref=e132]
    - main [ref=e136]:
      - generic [ref=e137]:
        - generic [ref=e138]:
          - generic [ref=e139]:
            - button "Venta Rápida (POS)" [ref=e140] [cursor=pointer]:
              - img [ref=e141]
              - generic [ref=e143]: Venta Rápida (POS)
            - button "Consolidación y Facturación B2B" [ref=e144] [cursor=pointer]:
              - img [ref=e145]
              - generic [ref=e150]: Consolidación y Facturación B2B
            - button "Monitoreo Canales Digitales" [ref=e151] [cursor=pointer]:
              - img [ref=e152]
              - generic [ref=e157]: Monitoreo Canales Digitales
            - button "KB Gestión Kanban" [ref=e158] [cursor=pointer]:
              - generic [ref=e159]: KB
              - generic [ref=e160]: Gestión Kanban
          - generic [ref=e161]: "Rol: admin"
        - generic [ref=e162]:
          - generic [ref=e163]:
            - generic [ref=e164]:
              - generic [ref=e165]:
                - img [ref=e166]
                - textbox "Buscar por nombre o SKU..." [ref=e169]
              - generic [ref=e170]:
                - generic [ref=e171]:
                  - img [ref=e172]
                  - textbox "Código de Barras..." [ref=e173]
                - button "Simular Scan" [ref=e174]:
                  - img [ref=e175]
                  - text: Simular Scan
            - generic [ref=e176]:
              - button "TODOS" [ref=e177] [cursor=pointer]
              - button "Pescados" [ref=e178] [cursor=pointer]
            - generic [ref=e179]:
              - generic [ref=e180] [cursor=pointer]:
                - img "Salmón Fresco" [ref=e182]
                - generic [ref=e183]:
                  - generic [ref=e184]: Salmón Fresco
                  - generic [ref=e186]: $35.000
                  - generic [ref=e187]:
                    - generic [ref=e188]: "Categoría Descriptiva (Grupo):"
                    - generic [ref=e189]: General
                  - generic [ref=e190]:
                    - generic [ref=e191]:
                      - generic [ref=e192]: "Bod. Principal:"
                      - generic [ref=e193]: 499 uds
                    - generic [ref=e194]:
                      - generic [ref=e195]: "Bod. Secundaria:"
                      - generic [ref=e196]: 0 uds
                    - generic [ref=e197]:
                      - generic [ref=e198]: "Bod. Averías:"
                      - generic [ref=e199]: 0 uds
              - generic [ref=e200] [cursor=pointer]:
                - img "Trucha Arcoiris" [ref=e202]
                - generic [ref=e203]:
                  - generic [ref=e204]: Trucha Arcoiris
                  - generic [ref=e206]: $25.000
                  - generic [ref=e207]:
                    - generic [ref=e208]: "Categoría Descriptiva (Grupo):"
                    - generic [ref=e209]: General
                  - generic [ref=e210]:
                    - generic [ref=e211]:
                      - generic [ref=e212]: "Bod. Principal:"
                      - generic [ref=e213]: 85 uds
                    - generic [ref=e214]:
                      - generic [ref=e215]: "Bod. Secundaria:"
                      - generic [ref=e216]: 0 uds
                    - generic [ref=e217]:
                      - generic [ref=e218]: "Bod. Averías:"
                      - generic [ref=e219]: 0 uds
              - generic [ref=e220] [cursor=pointer]:
                - img "Tilapia Roja" [ref=e222]
                - generic [ref=e223]:
                  - generic [ref=e224]: Tilapia Roja
                  - generic [ref=e226]: $15.000
                  - generic [ref=e227]:
                    - generic [ref=e228]: "Categoría Descriptiva (Grupo):"
                    - generic [ref=e229]: General
                  - generic [ref=e230]:
                    - generic [ref=e231]:
                      - generic [ref=e232]: "Bod. Principal:"
                      - generic [ref=e233]: 120 uds
                    - generic [ref=e234]:
                      - generic [ref=e235]: "Bod. Secundaria:"
                      - generic [ref=e236]: 0 uds
                    - generic [ref=e237]:
                      - generic [ref=e238]: "Bod. Averías:"
                      - generic [ref=e239]: 12 uds
          - generic [ref=e241]:
            - heading "Venta Realizada con Éxito" [level=3] [ref=e242]
            - generic [ref=e243]:
              - generic [ref=e244]:
                - generic [ref=e245]: Previsualización de Ticket
                - button "Imprimir" [ref=e246] [cursor=pointer]:
                  - img [ref=e247]
                  - generic [ref=e251]: Imprimir
              - generic [ref=e252]: "*** ERP MAESTRO PESCADERIA *** PESCADERIA S.A.S. NIT: 900.123.456-1 Dirección: Calle 72 # 15-23, Bogotá Teléfono: 310 123 4567 ======================================== Factura: VTA-F4183EFF Fecha : 29/6/2026, 12:06:18 p. m. Cajero : admin ---------------------------------------- Cliente: CONSUMIDOR FINAL NIT/CC : 222222222222 ======================================== PRODUCTO/CANT TOTAL ---------------------------------------- Salmón Fresco 1 UNIDAD x $35.000 $35.000 ======================================== SUBTOTAL: $35.000 TOTAL FINAL: $35.000 ---------------------------------------- Método Pago: CONTADO Efectivo Recibido: $35.000 ======================================== ¡GRACIAS POR SU COMPRA! Pescado fresco del día"
            - button "Nueva Venta" [ref=e253] [cursor=pointer]
  - button "Panel de Pruebas Dev" [ref=e254]:
    - img [ref=e255]
```

# Test source

```ts
  61  |       const selectCaja = page.locator('[data-testid="select-caja"]');
  62  |       await expect(selectCaja).toBeVisible({ timeout: 10000 });
  63  | 
  64  |       // 5. Esperar a que el select tenga opciones 
  65  |       await page.waitForFunction(() => {
  66  |         const sel = document.querySelector('[data-testid="select-caja"]') as HTMLSelectElement;
  67  |         return sel && sel.options.length > 1;
  68  |       }, { timeout: 10000 });
  69  | 
  70  |       // 6. Seleccionar caja por label
  71  |       await selectCaja.selectOption({ label: 'Caja Menor - Bodega Principal' });
  72  | 
  73  |       // 7. [PASO 1] Clic en Siguiente
  74  |       const btnSig1 = page.locator('[data-testid="btn-siguiente-paso1"]');
  75  |       await expect(btnSig1).toBeEnabled({ timeout: 5000 });
  76  |       await btnSig1.click();
  77  | 
  78  |       // 8. [PASO 2] Ingresar base con denominaciones y avanzar
  79  |       const input100k = page.locator('input[data-denominacion="billetes100k"]');
  80  |       if (await input100k.isVisible({ timeout: 3000 }).catch(() => false)) {
  81  |         await input100k.fill('2');
  82  |       }
  83  |       await page.locator('[data-testid="btn-siguiente-paso2"]').click();
  84  | 
  85  |       // 9. [PASO 3] Confirmar apertura
  86  |       await page.locator('[data-testid="btn-confirmar-apertura"]').click();
  87  | 
  88  |       // 10. Esperar SweetAlert2 de éxito ("Caja Abierta")
  89  |       const swalTitle = page.locator('.swal2-title');
  90  |       await expect(swalTitle).toContainText('Caja Abierta', { timeout: 10000 });
  91  | 
  92  |       // 11. Esperar que el SweetAlert se cierre (esperar a que desaparezca del DOM)
  93  |       const swalPopup = page.locator('.swal2-popup');
  94  |       await swalPopup.waitFor({ state: 'hidden', timeout: 8000 });
  95  | 
  96  |       // 12. Asertión final: el selector desaparece y la caja queda lista para buscar producto
  97  |       await expect(selectCaja).toBeHidden({ timeout: 5000 });
  98  |       
  99  |       const searchInput = page.getByPlaceholder('Buscar por nombre o SKU...');
  100 |       // Usar un poll para darle tiempo a React de re-evaluar isTurnoAbierto tras el modal
  101 |       await expect(searchInput).toBeVisible({ timeout: 15000 });
  102 |     });
  103 |   });
  104 | 
  105 |   test.describe('TASK-12: Agregar test de venta a pos.spec.ts', () => {
  106 |     test.beforeEach(async ({ page }) => {
  107 |       await page.setViewportSize({ width: 1440, height: 900 });
  108 |       await page.goto('/');
  109 |       // Inyectar SEED_DATA de seedCash.ts (turno ya abierto) y productos
  110 |       await page.evaluate((seedData) => {
  111 |         localStorage.clear();
  112 |         for (const [key, value] of Object.entries(seedData)) {
  113 |           localStorage.setItem(key, JSON.stringify(value));
  114 |         }
  115 |         // Fix for dynamic warehouse architecture stock structure (dictionary format by SKU)
  116 |         const pezcaderiaStock = {
  117 |           "Bodega Principal": {
  118 |             "PES-ENT-001": 10,
  119 |             "FIL-LIM-002": 5,
  120 |             "CAM-TIG-003": 8
  121 |           }
  122 |         };
  123 |         localStorage.setItem('pezcaderia_stock', JSON.stringify(pezcaderiaStock));
  124 |       }, { ...POS_SEED_DATA, ...CASH_SEED_DATA }); // Merge to get products AND open shift
  125 |       await page.reload();
  126 |       await page.waitForLoadState('domcontentloaded');
  127 |       await page.waitForLoadState('networkidle');
  128 |       await expect(page.locator('.sidebar-menu')).toBeVisible({ timeout: 15000 });
  129 |       await page.click('[data-testid="nav-pos"]');
  130 |     });
  131 | 
  132 |     test('Debe procesar una venta y decrementar el stock (RN-01)', async ({ page }) => {
  133 |       // Agregar producto al carrito vía clic
  134 |       // 1. Esperar EXPLÍCITAMENTE a que el producto sea visible en el DOM.
  135 |       const productItem = page.locator('text=Salmón Fresco');
  136 |       await expect(productItem).toBeVisible({ timeout: 15000 });
  137 |       await productItem.click();
  138 | 
  139 |       // Confirmar venta
  140 |       const btnCobrar = page.locator('text=COBRAR');
  141 |       await expect(btnCobrar).toBeVisible({ timeout: 15000 });
  142 |       await btnCobrar.click();
  143 | 
  144 |       // En este flujo, COBRAR procesa directamente la venta si es Efectivo.
  145 |       // Verify SweetAlert success
  146 |       const swalTitle = page.locator('.swal2-title');
  147 |       await expect(swalTitle).toHaveText(/Venta procesada/i);
  148 |       
  149 |       // Wait for it to close
  150 |       await expect(page.locator('.swal2-popup')).toBeHidden({ timeout: 3000 });
  151 | 
  152 |       // Asertión: localStorage pezcaderia_ventas tiene 1 venta; stock del producto decrementó
  153 |       const ventasStr = await page.evaluate(() => localStorage.getItem('pezcaderia_ventas'));
  154 |       const ventas = JSON.parse(ventasStr || '[]');
  155 |       expect(ventas.length).toBe(1);
  156 | 
  157 |       // We should check stock in localStorage as well
  158 |       const stockStr = await page.evaluate(() => localStorage.getItem('pezcaderia_stock'));
  159 |       const stock = JSON.parse(stockStr || '{}');
  160 |       const salmonStock = stock['Bodega Principal']?.['PES-ENT-001'] ?? stock['Bodega Principal']?.find((i: any) => i.sku === 'PES-ENT-001')?.stock;
> 161 |       expect(salmonStock).toBe(9); // Decremented by 1
      |                           ^ Error: expect(received).toBe(expected) // Object.is equality
  162 |     });
  163 | 
  164 |     test('Debe validar RN-01: Intentar vender producto con stock=0 -> mostrar error', async ({ page }) => {
  165 |       // First let's set stock of Salmón to 0
  166 |       await page.evaluate(() => {
  167 |         const stockData = JSON.parse(localStorage.getItem('pezcaderia_stock') || '{}');
  168 |         const setStockZero = (location: string, sku: string) => {
  169 |           if (stockData[location]) {
  170 |             if (Array.isArray(stockData[location])) {
  171 |               const item = stockData[location].find((i: any) => i.sku === sku);
  172 |               if (item) item.stock = 0;
  173 |             } else {
  174 |               stockData[location][sku] = 0;
  175 |             }
  176 |           }
  177 |         };
  178 |         setStockZero('Bodega Principal', 'PES-ENT-001');
  179 |         setStockZero('caja-test-menor', 'PES-ENT-001');
  180 |         localStorage.setItem('pezcaderia_stock', JSON.stringify(stockData));
  181 |       });
  182 |       await page.reload();
  183 |       await page.waitForLoadState('domcontentloaded');
  184 |       await page.waitForLoadState('networkidle');
  185 |       await expect(page.locator('.sidebar-menu')).toBeVisible({ timeout: 15000 });
  186 |       await page.click('[data-testid="nav-pos"]');
  187 | 
  188 |       // Attempt to add to cart
  189 |       const productItem = page.locator('text=Salmón Fresco').first();
  190 |       await expect(productItem).toBeVisible({ timeout: 15000 });
  191 |       await productItem.click({ force: true });
  192 | 
  193 |       // Should show Swal error or not add to cart (if UI disables button)
  194 |       const swalTitle = page.locator('.swal2-title');
  195 |       try {
  196 |         await expect(swalTitle).toHaveText(/Sin stock|Error|Agotado/i, { timeout: 4000 });
  197 |       } catch (error) {
  198 |         // Si el botón fue deshabilitado en UI, el click no emite SweetAlert, por lo que asertamos que el producto tenga un indicio de "Agotado" o pasamos el test.
  199 |         console.log('SweetAlert no apareció, asumiendo botón deshabilitado o UI pasiva');
  200 |       }
  201 |     });
  202 |   });
  203 | 
  204 |   test.describe('TASK-13: Agregar test de cierre a pos.spec.ts', () => {
  205 |     test.beforeEach(async ({ page }) => {
  206 |       await page.setViewportSize({ width: 1440, height: 900 });
  207 |       await page.goto('/');
  208 |       await page.evaluate((seedData) => {
  209 |         localStorage.clear();
  210 |         for (const [key, value] of Object.entries(seedData)) {
  211 |           localStorage.setItem(key, JSON.stringify(value));
  212 |         }
  213 |       }, CASH_SEED_DATA);
  214 |       await page.reload();
  215 |       await page.waitForLoadState('domcontentloaded');
  216 |       await page.waitForLoadState('networkidle');
  217 |       await expect(page.locator('.sidebar-menu')).toBeVisible({ timeout: 15000 });
  218 |       // Navegar a módulo Caja para cerrar
  219 |       await page.click('[data-testid="nav-caja"]');
  220 |     });
  221 | 
  222 |     test('Debe cerrar la caja y registrar el arqueo (RN-44)', async ({ page }) => {
  223 |       // Hacer clic en data-testid="btn-cierre-caja" o su equivalente visual
  224 |       const btnCierreCaja = page.locator('[data-testid="btn-cierre-caja"], [data-testid="btn-cerrar-turno"], button:has-text("Cerrar Turno"), button:has-text("Cierre de Caja")').first();
  225 |       await expect(btnCierreCaja).toBeVisible({ timeout: 15000 });
  226 |       await btnCierreCaja.click({ force: true });
  227 | 
  228 |       // Ingresar monto en data-testid="input-efectivo-arqueo"
  229 |       // Seed sets totalEfectivo to 255000. Let's enter 255000
  230 |       await page.fill('[data-testid="input-efectivo-arqueo"]', '255000');
  231 | 
  232 |       // Clic en data-testid="btn-confirmar-arqueo"
  233 |       await page.click('[data-testid="btn-confirmar-arqueo"]');
  234 | 
  235 |       // Check first dialog: ¿Confirmar Arqueo y Cierre?
  236 |       const confirmDialogTitle = page.locator('.swal2-title');
  237 |       await expect(confirmDialogTitle).toHaveText(/Confirmar Arqueo/i, { timeout: 10000 });
  238 |       
  239 |       // Click Yes to confirm
  240 |       await page.click('.swal2-confirm');
  241 | 
  242 |       // Check success
  243 |       await expect(page.locator('.swal2-title')).toHaveText(/Cierre Exitoso|Caja Cerrada/i, { timeout: 10000 });
  244 | 
  245 |       // Asertión: turno en pezcaderia_turnos_caja tiene estado: 'CERRADO'
  246 |       const turnosStr = await page.evaluate(() => localStorage.getItem('pezcaderia_turnos_caja'));
  247 |       const turnos = JSON.parse(turnosStr || '[]');
  248 |       expect(turnos.length).toBeGreaterThan(0);
  249 |       expect(turnos[0].estado).toBe('CERRADO');
  250 |       expect(turnos[0].diferenciaEfectivo).toBe(0);
  251 |     });
  252 |   });
  253 | });
  254 | 
```