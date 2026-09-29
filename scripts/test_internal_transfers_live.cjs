const { chromium } = require('@playwright/test');
const path = require('path');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const outDir = 'C:/Users/USUARIO/.gemini/antigravity-ide/brain/0b4722cf-523c-4949-a1a4-dabf2647714a';

  console.log('1. Navegando a http://localhost:3000/...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Aceptar Habeas Data si aparece
  const btnHabeas = page.locator('button').filter({ hasText: /Acepto Términos/i }).first();
  if (await btnHabeas.isVisible()) {
    console.log('Aceptando Habeas Data...');
    await btnHabeas.click();
    await page.waitForTimeout(1000);
  }

  // Navegar a Inventario usando data-testid="nav-inventario"
  console.log('2. Navegando a Inventario via [data-testid="nav-inventario"]...');
  const navInventario = page.locator('[data-testid="nav-inventario"]').first();
  if (await navInventario.isVisible()) {
    await navInventario.click();
    await page.waitForTimeout(1500);
  } else {
    // Si la barra lateral está contraída, hacer clic en el botón de hamburguesa
    const btnMenu = page.locator('header button').first();
    if (await btnMenu.isVisible()) {
      await btnMenu.click();
      await page.waitForTimeout(500);
      await page.locator('[data-testid="nav-inventario"]').first().click();
      await page.waitForTimeout(1500);
    }
  }

  // Activar vista Traslado Bodega
  console.log('3. Activando vista Traslado Bodega...');
  const btnTrasladoBodega = page.locator('button').filter({ hasText: /Traslado Bodega/i }).first();
  if (await btnTrasladoBodega.isVisible()) {
    await btnTrasladoBodega.click();
    await page.waitForTimeout(1200);
  }

  // Activar pestaña "Flujo Kanban (Bodega ➔ POS)"
  console.log('4. Activando pestaña Flujo Kanban (Bodega ➔ POS)...');
  const btnKanban = page.locator('button').filter({ hasText: /Flujo Kanban/i }).first();
  if (await btnKanban.isVisible()) {
    await btnKanban.click();
    await page.waitForTimeout(1200);
  }

  // 1. Screenshot del Tablero Kanban Inicial
  console.log('5. Capturando Screenshot 1: Tablero Kanban Inicial');
  await page.screenshot({ path: path.join(outDir, 'internal_transfer_1_kanban_initial.png') });

  // 2. Abrir Modal de Solicitud de Reabastecimiento
  console.log('6. Abriendo Modal de Solicitud de Reabastecimiento...');
  const btnSolicitar = page.locator('button').filter({ hasText: /Solicitar Reabastecimiento/i }).first();
  await btnSolicitar.click();
  await page.waitForTimeout(1000);

  // Cargar Sugeridos con 1 Clic
  console.log('7. Clic en Cargar Sugeridos con 1 Clic...');
  const btnCargarSugeridos = page.locator('button').filter({ hasText: /Cargar Sugeridos/i }).first();
  if (await btnCargarSugeridos.isVisible()) {
    await btnCargarSugeridos.click();
    await page.waitForTimeout(800);
  }

  // Seleccionar producto manual si la lista está vacía
  const selectManual = page.locator('#select-prod-manual');
  if (await selectManual.isVisible()) {
    const options = await selectManual.locator('option').all();
    if (options.length > 1) {
      await selectManual.selectOption({ index: 1 });
      await page.waitForTimeout(500);
    }
  }

  console.log('8. Capturando Screenshot 2: Modal de Solicitud');
  await page.screenshot({ path: path.join(outDir, 'internal_transfer_2_request_modal.png') });

  // Enviar Solicitud a Bodega
  console.log('9. Enviando Solicitud a Bodega...');
  const btnEnviar = page.locator('button').filter({ hasText: /Enviar Solicitud a Bodega/i }).first();
  await btnEnviar.click();
  await page.waitForTimeout(1500);

  // Cerrar alerta SweetAlert
  const btnSwalOk = page.locator('.swal2-confirm');
  if (await btnSwalOk.isVisible()) {
    await btnSwalOk.click();
    await page.waitForTimeout(1000);
  }

  // 3. En Kanban, Columna 1: Iniciar Alistamiento
  console.log('10. Iniciando alistamiento en Columna 1...');
  const btnAlistar = page.locator('button').filter({ hasText: /Iniciar Alistamiento Bodega/i }).first();
  if (await btnAlistar.isVisible()) {
    await btnAlistar.click();
    await page.waitForTimeout(1200);
  }

  console.log('11. Capturando Screenshot 3: Modal de Alistamiento en Báscula');
  await page.screenshot({ path: path.join(outDir, 'internal_transfer_3_picking_modal.png') });

  // Completar Alistamiento y Despachar
  console.log('12. Despachando pedido hacia POS...');
  const btnDespachar = page.locator('button').filter({ hasText: /Completar Alistamiento y Despachar/i }).first();
  if (await btnDespachar.isVisible()) {
    await btnDespachar.click();
    await page.waitForTimeout(1500);
  }

  if (await btnSwalOk.isVisible()) {
    await btnSwalOk.click();
    await page.waitForTimeout(1000);
  }

  // 4. En Kanban, Columna 3: Recibir en POS
  console.log('13. Abriendo Checklist de Recepción en Mostrador POS...');
  const btnRecibir = page.locator('button').filter({ hasText: /Recibir en POS/i }).first();
  if (await btnRecibir.isVisible()) {
    await btnRecibir.click();
    await page.waitForTimeout(1200);
  }

  // Simular discrepancia y detalle de novedad
  console.log('14. Simulando discrepancia de pesaje y novedad...');
  const btnConforme = page.locator('button').filter({ hasText: /Conforme/i }).first();
  if (await btnConforme.isVisible()) {
    await btnConforme.click(); // Alternar a "Con Novedad"
    await page.waitForTimeout(500);
  }

  const inputDetalleNovedad = page.locator('input[placeholder*="merma de descongelamiento"]').first();
  if (await inputDetalleNovedad.isVisible()) {
    await inputDetalleNovedad.fill('Se recibe con 0.5 kg de merma física por descongelamiento durante el traslado interno.');
    await page.waitForTimeout(500);
  }

  console.log('15. Capturando Screenshot 4: Checklist con Línea de Novedades');
  await page.screenshot({ path: path.join(outDir, 'internal_transfer_4_checklist_novedad.png') });

  // Confirmar recepción en POS
  console.log('16. Confirmando recepción e ingresando stock a POS...');
  const btnConfirmarRecepcion = page.locator('button').filter({ hasText: /Confirmar Recepción/i }).first();
  if (await btnConfirmarRecepcion.isVisible()) {
    await btnConfirmarRecepcion.click();
    await page.waitForTimeout(1500);
  }

  if (await btnSwalOk.isVisible()) {
    await btnSwalOk.click();
    await page.waitForTimeout(1000);
  }

  // 5. Screenshot Final del Tablero Kanban
  console.log('17. Capturando Screenshot 5: Tablero Kanban Finalizado');
  await page.screenshot({ path: path.join(outDir, 'internal_transfer_5_kanban_completed.png') });

  console.log('¡Prueba E2E completada con éxito!');
  await browser.close();
}

run().catch((err) => {
  console.error('Error en prueba E2E:', err);
  process.exit(1);
});
