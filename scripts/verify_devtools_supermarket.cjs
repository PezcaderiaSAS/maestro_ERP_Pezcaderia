const { chromium } = require('@playwright/test');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\usuario\\.gemini\\antigravity-ide\\brain\\517b8833-a77d-4123-8b30-df5a151e0f60';

async function runDevToolsAudit() {
  console.log('🚀 Iniciando auditoría DevTools en vivo (SPEC-047)...');
  const browser = await chromium.launch({ headless: true });
  
  const consoleMessages = [];
  const pageErrors = [];

  // Contexto 1: Escritorio (1280x800)
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await desktopContext.newPage();

  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();
    if (type === 'error') {
      consoleMessages.push({ type, text });
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

    // Habeas Data si está visible
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

    // Navegar a POS
    console.log('📍 Navegando al módulo POS...');
    const btnPos = page.locator('[data-testid="nav-pos"]');
    if (await btnPos.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btnPos.click();
      await page.waitForTimeout(2000);
    }

    // Navegar a Taquilla / Kanban Caja (F7)
    console.log('📍 Navegando a Kanban Caja / Taquilla...');
    const btnKanban = page.locator('button:has-text("Kanban Caja")').first();
    if (await btnKanban.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btnKanban.click();
      await page.waitForTimeout(1500);

      // Cambiar a modo Terminal Supermercado
      const btnSupermarketMode = page.locator('[data-testid="btn-mode-supermarket"]');
      if (await btnSupermarketMode.isVisible({ timeout: 3000 }).catch(() => false)) {
        await btnSupermarketMode.click();
        await page.waitForTimeout(1000);
      }

      // Screenshot de Terminal de Supermercado
      const terminalScreenshot = path.join(ARTIFACTS_DIR, 'cashier_supermarket_terminal_live.png');
      await page.screenshot({ path: terminalScreenshot, fullPage: false });
      console.log(`📸 Captura de Terminal Supermercado guardada: ${terminalScreenshot}`);
    }

    // Screenshot Desktop
    const desktopScreenshot = path.join(ARTIFACTS_DIR, 'cashier_supermarket_desktop_audit.png');
    await page.screenshot({ path: desktopScreenshot, fullPage: false });
    console.log(`📸 Captura de pantalla de Escritorio guardada: ${desktopScreenshot}`);

    // Contexto 2: Móvil (375x812 - iPhone SE / 13 mini)
    console.log('📱 Verificando vista móvil a 375px...');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(1000);

    const mobileScreenshot = path.join(ARTIFACTS_DIR, 'cashier_supermarket_mobile_audit.png');
    await page.screenshot({ path: mobileScreenshot, fullPage: false });
    console.log(`📸 Captura de pantalla Móvil guardada: ${mobileScreenshot}`);

    console.log('\n--- RESUMEN DE AUDITORÍA DEVTOOLS ---');
    console.log(`Errores fatales de página (pageerror): ${pageErrors.length}`);
    console.log(`Errores de consola JS (console.error): ${consoleMessages.length}`);
    
    if (pageErrors.length === 0) {
      console.log('✅ Bucle DevTools validado: 0 errores fatales en tiempo de ejecución.');
    } else {
      console.error('❌ Se detectaron errores fatales en consola.');
    }

  } catch (error) {
    console.error('Error durante la auditoría DevTools:', error);
  } finally {
    await browser.close();
  }
}

runDevToolsAudit();
