const { chromium } = require('@playwright/test');
const path = require('path');

const PROD_URL = 'https://maestro-erp-pezcaderia.vercel.app/';
const ARTIFACTS_DIR = 'C:\\Users\\usuario\\.gemini\\antigravity-ide\\brain\\b67c2ff6-ba88-4bb9-81db-e466546a8571';

async function capturePosView() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  try {
    await page.goto(PROD_URL, { waitUntil: 'networkidle', timeout: 35000 });
    await page.waitForTimeout(2000);

    // Si aparece Habeas data
    const btnAcepto = page.getByRole('button', { name: /Acepto Términos/i });
    if (await btnAcepto.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btnAcepto.click();
      await page.waitForTimeout(1000);
    }

    // Login si es necesario
    const isLogin = await page.getByRole('button', { name: /Ingresar al Sistema/i }).isVisible().catch(() => false);
    if (isLogin) {
      await page.getByRole('button', { name: /SuperAdmin/i }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: /Ingresar al Sistema/i }).click();
      await page.waitForTimeout(3000);
    }

    // Cambiar a tenant Josase
    await page.evaluate(() => {
      if (window.localStorage) {
        const session = JSON.parse(window.localStorage.getItem('pezcaderia_auth_session') || '{}');
        session.activeTenant = {
          id: 'tenant-03',
          nombre: 'Ferretería Josase',
          razonSocial: 'Ferretería Josase S.A.S.',
          nit: '901.954.321-8',
          ciudad: 'Bucaramanga',
          telefono: '3164696581',
          activo: true,
        };
        window.localStorage.setItem('pezcaderia_auth_session', JSON.stringify(session));
      }
    });

    // Clic en Facturar POS
    const btnPos = page.locator('#topbar-btn-facturar-pos');
    if (await btnPos.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btnPos.click();
      await page.waitForTimeout(3000);
    }

    // Screenshot del POS
    const posPath = path.join(ARTIFACTS_DIR, 'vercel_prod_pos_ferreteria_live.png');
    await page.screenshot({ path: posPath });
    console.log('✅ Screenshot POS Ferretería Josase guardado en:', posPath);

    // Clic en Comandas para mostrar el drawer
    const btnComandas = page.locator('#btn-open-comandas-drawer');
    if (await btnComandas.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btnComandas.click();
      await page.waitForTimeout(1500);
      const comandasPath = path.join(ARTIFACTS_DIR, 'vercel_prod_pos_comandas_live.png');
      await page.screenshot({ path: comandasPath });
      console.log('✅ Screenshot Drawer Comandas guardado en:', comandasPath);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}

capturePosView();
