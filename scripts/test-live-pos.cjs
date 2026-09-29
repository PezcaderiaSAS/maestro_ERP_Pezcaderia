const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = 'C:/Users/USUARIO/.gemini/antigravity-ide/brain/0b4722cf-523c-4949-a1a4-dabf2647714a';

async function runLiveTest() {
  console.log('🚀 Iniciando navegador Chromium para prueba real en vivo...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const report = [];

  try {
    // 1. Navegar a localhost:3000
    console.log('📍 Navegando a http://localhost:3000...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    report.push('✅ Conexión exitosa a http://localhost:3000');

    // 2. Gestionar Habeas Data Consent si aparece
    const btnConsent = page.locator('button:has-text("Acepto Términos, Políticas de Tratamiento y Continuar")');
    if (await btnConsent.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btnConsent.click();
      console.log('✅ Aceptado aviso legal de Habeas Data');
      report.push('✅ Consentimiento legal aceptado');
      await page.waitForTimeout(500);
    }

    // 3. Navegar a POS
    console.log('📍 Navegando al módulo POS...');
    const btnPos = page.locator('[data-testid="nav-pos"]');
    await btnPos.waitFor({ state: 'visible', timeout: 10000 });
    await btnPos.click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    report.push('✅ Módulo POS cargado');

    // Screenshot 1: Vista general del POS
    const ss1Path = path.join(ARTIFACTS_DIR, 'pos_live_1_initial.png');
    await page.screenshot({ path: ss1Path });
    report.push(`📸 Captura 1 guardada: ${ss1Path}`);

    // 4. Verificar si se requiere abrir turno
    const btnAbrirTurno = page.locator('button:has-text("Abrir Turno"), button:has-text("Abrir Caja Primero"), [data-testid="btn-abrir-turno"]').first();
    if (await btnAbrirTurno.isVisible().catch(() => false)) {
      console.log('🔑 Abriendo turno de caja...');
      await btnAbrirTurno.click({ force: true });
      await page.waitForTimeout(1000);

      // Si pide bodega
      const selectBodega = page.locator('[data-testid="select-bodega"]');
      if (await selectBodega.isVisible().catch(() => false)) {
        await selectBodega.selectOption({ index: 1 });
      }

      // Input base
      const inputBase = page.locator('[data-testid="input-base-directa"], input[placeholder="0"]');
      if (await inputBase.isVisible().catch(() => false)) {
        await inputBase.fill('200000');
      }

      const btnConfirmarApertura = page.locator('button:has-text("Abrir Turno de Caja"), button:has-text("Confirmar Apertura")').first();
      if (await btnConfirmarApertura.isVisible().catch(() => false)) {
        await btnConfirmarApertura.click();
        await page.waitForTimeout(1500);
        report.push('✅ Turno de caja abierto con base de $200.000 COP');
      }
    } else {
      report.push('✅ Turno de caja ya se encontraba abierto');
    }

    // 5. Agregar producto mediante Simular Scan o clic en tarjeta
    console.log('🛒 Agregando producto al carrito...');
    const btnSimularScan = page.locator('button:has-text("Simular Scan")');
    if (await btnSimularScan.isVisible().catch(() => false)) {
      await btnSimularScan.click();
      await page.waitForTimeout(800);
      report.push('✅ Producto agregado vía Simular Scan');
    } else {
      const card = page.locator('.product-card').first();
      if (await card.isVisible().catch(() => false)) {
        await card.click();
        await page.waitForTimeout(800);
        report.push('✅ Producto agregado vía clic de catálogo');
      }
    }

    // 6. Probar métodos de pago colombianos
    console.log('💳 Probando métodos de pago colombianos...');
    const btnNequi = page.locator('button:has-text("Nequi")');
    if (await btnNequi.isVisible().catch(() => false)) {
      await btnNequi.click();
      report.push('✅ Método Nequi seleccionado');
      await page.waitForTimeout(400);
    }

    const btnDaviplata = page.locator('button:has-text("Daviplata")');
    if (await btnDaviplata.isVisible().catch(() => false)) {
      await btnDaviplata.click();
      report.push('✅ Método Daviplata seleccionado');
      await page.waitForTimeout(400);
    }

    const btnEfectivo = page.locator('button:has-text("Efectivo")');
    await btnEfectivo.click();
    report.push('✅ Método Efectivo seleccionado');

    // 7. Probar billetes rápidos y visor de cambio
    console.log('💵 Probando billetes rápidos ($100k) y cálculo de vuelto...');
    const btn100k = page.locator('button:has-text("$100k")');
    if (await btn100k.isVisible().catch(() => false)) {
      await btn100k.click();
      await page.waitForTimeout(500);
      const visorTexto = await page.locator('text=Cambio / Vuelto a Entregar, text=Pago Exacto').first().innerText().catch(() => '');
      report.push(`✅ Billete $100k presionado. Estado del visor: "${visorTexto}"`);
    }

    // Screenshot 2: Panel de pago con vuelto
    const ss2Path = path.join(ARTIFACTS_DIR, 'pos_live_2_payment_panel.png');
    await page.screenshot({ path: ss2Path });
    report.push(`📸 Captura 2 guardada: ${ss2Path}`);

    // 8. Abrir modal de Arqueo y Cierre de Turno
    console.log('📊 Probando modal de Arqueo Ciego / Asistido...');
    const btnCerrarTurno = page.locator('button:has-text("Cerrar Turno"), [data-testid="btn-cerrar-turno"]').first();
    if (await btnCerrarTurno.isVisible().catch(() => false)) {
      await btnCerrarTurno.click();
      await page.waitForTimeout(800);

      const modalTitle = page.locator('h2:has-text("Arqueo y Cierre de Caja")');
      await modalTitle.waitFor({ state: 'visible', timeout: 5000 });
      report.push('✅ Modal de Arqueo y Cierre de Caja abierto');

      // Screenshot 3: Modal de arqueo en modo ciego
      const ss3Path = path.join(ARTIFACTS_DIR, 'pos_live_3_arqueo_ciego.png');
      await page.screenshot({ path: ss3Path });
      report.push(`📸 Captura 3 (Arqueo Ciego) guardada: ${ss3Path}`);

      // Desplegar calculador físico de billetes y monedas
      const btnCalculador = page.locator('button:has-text("Usar Calculador Físico")');
      if (await btnCalculador.isVisible().catch(() => false)) {
        await btnCalculador.click();
        await page.waitForTimeout(500);
        report.push('✅ Desplegado Calculador Físico de Denominaciones Colombianas');

        // Screenshot 4: Calculador de billetes colombianos
        const ss4Path = path.join(ARTIFACTS_DIR, 'pos_live_4_calculador_denominaciones.png');
        await page.screenshot({ path: ss4Path });
        report.push(`📸 Captura 4 (Desglose Físico) guardada: ${ss4Path}`);
      }

      // Cerrar modal con Cancelar
      await page.click('button:has-text("Cancelar")');
      await page.waitForTimeout(500);
      report.push('✅ Modal de arqueo cerrado correctamente');
    }

    console.log('\n================ RESUMEN DE PRUEBAS REALES ================');
    report.forEach(r => console.log(r));
    console.log('===========================================================\n');

  } catch (err) {
    console.error('❌ Error durante la prueba en vivo:', err);
    const ssErrPath = path.join(ARTIFACTS_DIR, 'pos_live_error.png');
    await page.screenshot({ path: ssErrPath }).catch(() => {});
    console.log(`📸 Captura de error guardada: ${ssErrPath}`);
  } finally {
    await browser.close();
    console.log('🏁 Navegador cerrado.');
  }
}

runLiveTest();
