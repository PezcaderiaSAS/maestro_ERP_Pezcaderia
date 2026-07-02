# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pos.spec.ts >> POS - Flujo de Apertura, Venta y Cierre (FASE 6) >> TASK-12: Agregar test de venta a pos.spec.ts >> Debe procesar una venta y decrementar el stock (RN-01)
- Location: tests\e2e\pos.spec.ts:137:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 1
Received: 0

Call Log:
- Timeout 5000ms exceeded while waiting on the predicate
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
                - checkbox "Ocultar agotados" [ref=e181]
                - text: Ocultar agotados
              - generic [ref=e182] [cursor=pointer]:
                - checkbox "⭐ Más vendidos" [ref=e183]
                - text: ⭐ Más vendidos
            - generic [ref=e184]:
              - generic [ref=e185] [cursor=pointer]:
                - img "Salmón Fresco" [ref=e188]
                - generic [ref=e189]:
                  - generic [ref=e190]: Salmón Fresco
                  - generic [ref=e192]: $35.000
                  - generic [ref=e193]:
                    - generic [ref=e194]: "Categoría Descriptiva (Grupo):"
                    - generic [ref=e195]: General
                  - generic [ref=e196]:
                    - generic [ref=e197]:
                      - generic [ref=e198]: "Bod. Principal:"
                      - generic [ref=e199]: 499 uds
                    - generic [ref=e200]:
                      - generic [ref=e201]: "Bod. Secundaria:"
                      - generic [ref=e202]: 0 uds
                    - generic [ref=e203]:
                      - generic [ref=e204]: "Bod. Averías:"
                      - generic [ref=e205]: 0 uds
              - generic [ref=e206] [cursor=pointer]:
                - img "Trucha Arcoiris" [ref=e209]
                - generic [ref=e210]:
                  - generic [ref=e211]: Trucha Arcoiris
                  - generic [ref=e213]: $25.000
                  - generic [ref=e214]:
                    - generic [ref=e215]: "Categoría Descriptiva (Grupo):"
                    - generic [ref=e216]: General
                  - generic [ref=e217]:
                    - generic [ref=e218]:
                      - generic [ref=e219]: "Bod. Principal:"
                      - generic [ref=e220]: 85 uds
                    - generic [ref=e221]:
                      - generic [ref=e222]: "Bod. Secundaria:"
                      - generic [ref=e223]: 0 uds
                    - generic [ref=e224]:
                      - generic [ref=e225]: "Bod. Averías:"
                      - generic [ref=e226]: 0 uds
              - generic [ref=e227] [cursor=pointer]:
                - img "Tilapia Roja" [ref=e230]
                - generic [ref=e231]:
                  - generic [ref=e232]: Tilapia Roja
                  - generic [ref=e234]: $15.000
                  - generic [ref=e235]:
                    - generic [ref=e236]: "Categoría Descriptiva (Grupo):"
                    - generic [ref=e237]: General
                  - generic [ref=e238]:
                    - generic [ref=e239]:
                      - generic [ref=e240]: "Bod. Principal:"
                      - generic [ref=e241]: 120 uds
                    - generic [ref=e242]:
                      - generic [ref=e243]: "Bod. Secundaria:"
                      - generic [ref=e244]: 0 uds
                    - generic [ref=e245]:
                      - generic [ref=e246]: "Bod. Averías:"
                      - generic [ref=e247]: 0 uds
          - generic [ref=e249]:
            - heading "Venta Realizada con Éxito" [level=3] [ref=e250]
            - generic [ref=e251]:
              - generic [ref=e252]:
                - generic [ref=e253]: Previsualización de Ticket
                - button "Imprimir" [ref=e254] [cursor=pointer]:
                  - img [ref=e255]
                  - generic [ref=e259]: Imprimir
              - generic [ref=e260]: "*** ERP MAESTRO PESCADERIA *** PESCADERIA S.A.S. NIT: 900.123.456-1 Dirección: Calle 72 # 15-23, Bogotá Teléfono: 310 123 4567 ======================================== Factura: VTA-3EF93D47 Fecha : 2/7/2026, 12:43:03 p. m. Cajero : admin ---------------------------------------- Cliente: CONSUMIDOR FINAL NIT/CC : 222222222222 ======================================== PRODUCTO/CANT TOTAL ---------------------------------------- Salmón Fresco 1 UNIDAD x $35.000 $35.000 ======================================== SUBTOTAL: $35.000 TOTAL FINAL: $35.000 ---------------------------------------- Método Pago: CONTADO Efectivo Recibido: $35.000 ======================================== ¡GRACIAS POR SU COMPRA! Pescado fresco del día"
            - button "Nueva Venta" [ref=e261] [cursor=pointer]
  - button "Panel de Pruebas Dev" [ref=e262]:
    - img [ref=e263]
```

# Test source

```ts
  89  |       await expect(btnConfirmar).toBeVisible({ timeout: 5000 });
  90  |       await btnConfirmar.click();
  91  | 
  92  |       // 10. Esperar SweetAlert2 de éxito ("Caja Abierta")
  93  |       const swalTitle = page.locator('.swal2-title');
  94  |       await expect(swalTitle).toContainText('Caja Abierta', { timeout: 10000 });
  95  | 
  96  |       // 11. Esperar que el SweetAlert se cierre completamente del DOM
  97  |       const swalContainer = page.locator('.swal2-container');
  98  |       await expect(swalContainer).not.toBeAttached({ timeout: 15000 });
  99  | 
  100 |       // 12. Asertión final: el selector desaparece y la caja queda lista para buscar producto
  101 |       await expect(selectCaja).toBeHidden({ timeout: 10000 });
  102 |       
  103 |       const searchInput = page.getByPlaceholder('Buscar por nombre o SKU...');
  104 |       // Implementamos waitFor para la visibilidad del DOM y validamos que este habilitado
  105 |       await searchInput.waitFor({ state: 'visible', timeout: 15000 });
  106 |       await expect(searchInput).toBeEnabled({ timeout: 5000 });
  107 |     });
  108 |   });
  109 | 
  110 |   test.describe('TASK-12: Agregar test de venta a pos.spec.ts', () => {
  111 |     test.beforeEach(async ({ page }) => {
  112 |       await page.setViewportSize({ width: 1440, height: 900 });
  113 |       await page.goto('/');
  114 |       // Inyectar SEED_DATA de seedCash.ts (turno ya abierto) y productos
  115 |       await page.evaluate((seedData) => {
  116 |         localStorage.clear();
  117 |         for (const [key, value] of Object.entries(seedData)) {
  118 |           localStorage.setItem(key, JSON.stringify(value));
  119 |         }
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
> 189 |       }).toPass({ timeout: 5000 });
      |          ^ Error: expect(received).toBe(expected) // Object.is equality
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
```