const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function runDevToolsAudit() {
  const screenshotsDir = path.join(__dirname, '..', 'docs', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('🚀 Iniciando Auditoría DevTools en vivo con Playwright...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  const warnings = [];

  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    if (type === 'error') {
      errors.push(text);
    } else if (type === 'warning') {
      warnings.push(text);
    }
  });

  page.on('pageerror', err => {
    errors.push(err.message || String(err));
  });

  // 1. Navegar a localhost:3000
  console.log('🌐 Navegando a http://localhost:3000/ ...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  // 2. Aceptar Habeas Data
  const btnAcepto = page.locator('button:has-text("Acepto Términos")');
  if (await btnAcepto.count() > 0) {
    await btnAcepto.first().click();
    await page.waitForTimeout(800);
  }

  // 3. Emular ingreso rápido como Mostrador Ferretería Josase
  const btnMostrador = page.locator('button:has-text("Mostrador Ferretería Josase")');
  if (await btnMostrador.count() > 0) {
    await btnMostrador.first().click();
    await page.waitForTimeout(1500);
  }

  // 4. Hacer clic en "Facturar POS" para abrir la vista POS con CartPanel
  const btnFacturar = page.locator('button:has-text("Facturar POS"), a:has-text("Facturar POS")');
  if (await btnFacturar.count() > 0) {
    console.log('🛒 Abriendo vista POS (Facturar POS)...');
    await btnFacturar.first().click();
    await page.waitForTimeout(1500);
  }

  // 5. Desktop View (1280x800)
  console.log('🖥️ Capturando vista POS Desktop / Mostrador (1280x800)...');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(1000);
  const desktopScreenshot = path.join(screenshotsDir, 'pos_cart_desktop_audit.png');
  await page.screenshot({ path: desktopScreenshot, fullPage: false });
  console.log(`📸 Captura desktop guardada en: ${desktopScreenshot}`);

  // 6. Mobile View (375x812)
  console.log('📱 Capturando vista POS Móvil (375x812)...');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(1000);
  const mobileScreenshot = path.join(screenshotsDir, 'pos_cart_mobile_audit.png');
  await page.screenshot({ path: mobileScreenshot, fullPage: false });
  console.log(`📸 Captura móvil guardada en: ${mobileScreenshot}`);

  // 7. Evaluar botones táctiles dentro de CartPanel y POS
  const touchTargets = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('.pos-cart-panel button, button[data-testid], button'));
    return buttons.slice(0, 15).map(b => {
      const rect = b.getBoundingClientRect();
      return {
        text: (b.innerText || b.getAttribute('aria-label') || b.title || 'button').slice(0, 35).trim().replace(/\n/g, ' '),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        isTouchTarget48: rect.height >= 44 && rect.width >= 44,
      };
    });
  });

  await browser.close();

  console.log('\n======================================================');
  console.log('📊 REPORTE DE AUDITORÍA DEVTOOLS EN VIVO (POS & CART)');
  console.log('======================================================');
  console.log(`  • Errores en Consola JS: ${errors.length}`);
  if (errors.length > 0) {
    errors.forEach(e => console.log(`    ❌ ${e}`));
  } else {
    console.log('    ✅ 0 errores detectados en la consola.');
  }

  console.log(`  • Advertencias en Consola: ${warnings.length}`);
  console.log(`  • Objetivos táctiles analizados (${touchTargets.length}):`);
  touchTargets.forEach(t => {
    console.log(`    - [${t.isTouchTarget48 ? 'APROBADO' : 'ALERTA'}] "${t.text}" -> ${t.width}x${t.height}px`);
  });
  console.log('======================================================');
}

runDevToolsAudit().catch(err => {
  console.error('Fallo en auditoría:', err);
  process.exit(1);
});
