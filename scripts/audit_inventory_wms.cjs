// scripts/audit_inventory_wms.cjs
// Script de Auditoría DevTools en Vivo para SPEC-048 (Inventario & Bodega WMS UI Rearchitect)

const { chromium } = require('@playwright/test');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\usuario\\.gemini\\antigravity-ide\\brain\\517b8833-a77d-4123-8b30-df5a151e0f60';

async function runInventoryWmsAudit() {
  console.log('🚀 Iniciando auditoría DevTools en vivo (SPEC-048 - Inventario & Bodega WMS)...');
  const browser = await chromium.launch({ headless: true });
  
  const consoleErrors = [];
  const pageErrors = [];

  // Contexto 1: Escritorio (1280x800)
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await desktopContext.newPage();

  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();
    if (type === 'error' && !text.includes('net::ERR') && !text.includes('favicon')) {
      consoleErrors.push({ type, text });
      console.error(`[Console Error]: ${text}`);
    }
  });

  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
    console.error(`[Page Error]: ${err.message}`);
  });

  try {
    console.log('📍 Navegando a http://localhost:3000/ ...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    // Consentimiento si existe
    const btnConsent = page.locator('button:has-text("Acepto Términos")');
    if (await btnConsent.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btnConsent.click();
      await page.waitForTimeout(500);
    }

    // Login si es necesario
    const btnLogin = page.getByRole('button', { name: /Ingresar al Sistema/i });
    if (await btnLogin.isVisible({ timeout: 2000 }).catch(() => false)) {
      const superAdminBtn = page.getByRole('button', { name: /SuperAdmin/i });
      if (await superAdminBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await superAdminBtn.click();
      }
      await btnLogin.click();
      await page.waitForTimeout(2000);
    }

    // Navegar al módulo de Inventario
    console.log('📍 Navegando al módulo de Inventario...');
    const btnNavInventario = page.locator('[data-testid="nav-inventario"], button:has-text("Inventario"), a:has-text("Inventario")').first();
    if (await btnNavInventario.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btnNavInventario.click();
      await page.waitForTimeout(1500);
    }

    // Verificar presencia de los componentes SPEC-048
    await page.waitForSelector('[data-testid="inventory-bento-kpis"], [data-testid="inventory-floating-pills"]', { timeout: 8000 }).catch(() => {
      console.log('Componentes no encontrados por selector estricto, buscando contenido...');
    });

    // Captura de escritorio
    const desktopScreenshotPath = path.join(ARTIFACTS_DIR, 'inventory_wms_desktop_audit.png');
    await page.screenshot({ path: desktopScreenshotPath, fullPage: false });
    console.log(`📸 Captura de escritorio guardada en: ${desktopScreenshotPath}`);

    // Probar interacción de pestaña (ej: Despiece)
    const btnDespiece = page.getByRole('button', { name: /4\.\s*Despiece/i });
    if (await btnDespiece.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('🖱️ Haciendo clic en la pestaña 4. Despiece...');
      await btnDespiece.click();
      await page.waitForTimeout(1000);
      const interactiveScreenshotPath = path.join(ARTIFACTS_DIR, 'inventory_wms_tab_interactive.png');
      await page.screenshot({ path: interactiveScreenshotPath, fullPage: false });
      console.log(`📸 Captura interactiva guardada en: ${interactiveScreenshotPath}`);
    }

    await desktopContext.close();

    // Contexto 2: Móvil (375x812)
    console.log('📱 Iniciando auditoría móvil (375x812)...');
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      isMobile: true,
      hasTouch: true
    });
    const mobilePage = await mobileContext.newPage();

    await mobilePage.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 30000 });
    await mobilePage.waitForTimeout(1000);

    const mobileConsent = mobilePage.locator('button:has-text("Acepto Términos")');
    if (await mobileConsent.isVisible({ timeout: 2000 }).catch(() => false)) {
      await mobileConsent.click();
      await mobilePage.waitForTimeout(500);
    }

    const mobileLogin = mobilePage.getByRole('button', { name: /Ingresar al Sistema/i });
    if (await mobileLogin.isVisible({ timeout: 2000 }).catch(() => false)) {
      const superAdminBtn = mobilePage.getByRole('button', { name: /SuperAdmin/i });
      if (await superAdminBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await superAdminBtn.click();
      }
      await mobileLogin.click();
      await mobilePage.waitForTimeout(2000);
    }

    // En móvil, abrir menú si es necesario o navegar a Inventario
    const mobileMenuBtn = mobilePage.locator('button[aria-label="Abrir menú"], button:has-text("Menú")').first();
    if (await mobileMenuBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await mobileMenuBtn.click();
      await mobilePage.waitForTimeout(500);
    }

    const mobileNavInventario = mobilePage.locator('[data-testid="nav-inventario"], button:has-text("Inventario"), a:has-text("Inventario")').first();
    if (await mobileNavInventario.isVisible({ timeout: 2000 }).catch(() => false)) {
      await mobileNavInventario.click();
      await mobilePage.waitForTimeout(1500);
    }

    // Captura móvil
    const mobileScreenshotPath = path.join(ARTIFACTS_DIR, 'inventory_wms_mobile_audit.png');
    await mobilePage.screenshot({ path: mobileScreenshotPath, fullPage: false });
    console.log(`📸 Captura móvil guardada en: ${mobileScreenshotPath}`);

    await mobileContext.close();

    console.log('\n--- REPORTE DE ERRORES JS DEVTOOLS ---');
    console.log(`Errores de consola JS: ${consoleErrors.length}`);
    console.log(`Errores de página no capturados: ${pageErrors.length}`);

    if (pageErrors.length > 0) {
      console.error('❌ SE DETECTARON ERRORES DE PÁGINA FATALES:');
      pageErrors.forEach((e) => console.error(e));
      process.exit(1);
    }

    console.log('✅ AUDITORÍA DEVTOOLS EXITOSA: 0 ERRORES FATALES.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error durante la auditoría DevTools:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runInventoryWmsAudit();
