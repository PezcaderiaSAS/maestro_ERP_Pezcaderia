const { chromium } = require('@playwright/test');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\USUARIO\\.gemini\\antigravity-ide\\brain\\0b4722cf-523c-4949-a1a4-dabf2647714a';

async function captureModal() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(2000);
  const consent = page.locator('button:has-text("Acepto"), button:has-text("Entendido")');
  if (await consent.isVisible()) await consent.click();

  await page.click('[data-testid="nav-despachos"]');
  await page.waitForTimeout(1500);
  await page.click('button:has-text("Rutas en Curso")');
  await page.waitForTimeout(1500);

  const btnPortal = page.locator('button:has-text("Abrir Portal Conductor")').first();
  if (await btnPortal.isVisible()) {
    await btnPortal.click();
    await page.waitForTimeout(1500);

    const btnCarga = page.locator('button:has-text("Confirmar Carga & Salir a Ruta")');
    if (await btnCarga.isVisible()) {
      await btnCarga.click();
      await page.waitForTimeout(1500);
      const swal = page.locator('.swal2-confirm');
      if (await swal.isVisible()) await swal.click();
      await page.waitForTimeout(1500);
    }

    const btnEntregar = page.locator('button:has-text("Entregar & Cobrar")').first();
    if (await btnEntregar.isVisible()) {
      await btnEntregar.click();
      await page.waitForTimeout(1500);
      const btnMixto = page.locator('button:has-text("Pago Mixto")');
      if (await btnMixto.isVisible()) await btnMixto.click();
      await page.waitForTimeout(500);

      const shot = path.join(ARTIFACTS_DIR, 'delivery_live_4_driver_waypoints_delivery.png');
      await page.screenshot({ path: shot });
      console.log('[OK] Captura 4 generada exitosamente:', shot);
    }
  }
  await browser.close();
}

captureModal();
