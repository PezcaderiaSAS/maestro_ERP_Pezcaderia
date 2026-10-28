/**
 * Script de Verificación Integral de Despliegue en Producción Vercel & Supabase
 * Interacción completa: aceptación de términos, navegación por la app e inspección DevTools
 */

const { chromium } = require('@playwright/test');
const path = require('path');

const PROD_URL = 'https://maestro-erp-pezcaderia.vercel.app/';
const ARTIFACTS_DIR = 'C:\\Users\\usuario\\.gemini\\antigravity-ide\\brain\\b67c2ff6-ba88-4bb9-81db-e466546a8571';

async function verifyProductionInteraction() {
  console.log('🚀 Iniciando auditoría interactiva DevTools en producción...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  const consoleErrors = [];
  const consoleLogs = [];

  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    consoleLogs.push({ type, text });
    if (type === 'error') {
      consoleErrors.push(text);
      console.error(`🔴 [Browser Console Error]: ${text}`);
    } else {
      console.log(`💬 [Browser Console ${type}]: ${text.substring(0, 100)}`);
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.message);
    console.error(`💥 [Browser Unhandled Exception]: ${err.message}`);
  });

  try {
    console.log(`🌐 Navegando a ${PROD_URL}...`);
    await page.goto(PROD_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Buscar y hacer clic en el botón de aceptación de términos si está presente
    const btnAcepto = page.getByRole('button', { name: /Acepto Términos/i });
    if (await btnAcepto.isVisible()) {
      console.log('🛡️ Haciendo clic en "Acepto Términos, Políticas de Tratamiento y Continuar"...');
      await btnAcepto.click();
      await page.waitForTimeout(2000);
    } else {
      console.log('ℹ️ Modal de términos no visible o ya aceptado.');
    }

    // Capturar screenshot Desktop de la aplicación abierta
    const posDesktopPath = path.join(ARTIFACTS_DIR, 'vercel_prod_pos_desktop.png');
    await page.screenshot({ path: posDesktopPath, fullPage: false });
    console.log(`📸 Screenshot Desktop de la App guardado en: ${posDesktopPath}`);

    // Redimensionar a móvil 375x667
    console.log('📱 Redimensionando a vista móvil 375x667...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1500);

    const posMobilePath = path.join(ARTIFACTS_DIR, 'vercel_prod_pos_mobile_375.png');
    await page.screenshot({ path: posMobilePath, fullPage: false });
    console.log(`📸 Screenshot Móvil de la App guardado en: ${posMobilePath}`);

    // Inspección de elementos clave en el DOM
    const appState = await page.evaluate(() => {
      const sidebar = document.querySelector('nav, aside');
      const buttons = document.querySelectorAll('button').length;
      const inputs = document.querySelectorAll('input').length;
      return {
        hasSidebar: !!sidebar,
        totalButtons: buttons,
        totalInputs: inputs,
      };
    });

    console.log('\n======================================================');
    console.log('📊 REPORTE DE INTERACCIÓN DEVTOOLS EN PRODUCCIÓN (VERCEL)');
    console.log('======================================================');
    console.log(`- Elementos interactivos montados: ${appState.totalButtons} botones, ${appState.totalInputs} inputs`);
    console.log(`- Barra de navegación / Sidebar detectado: ${appState.hasSidebar ? 'SÍ' : 'NO'}`);
    console.log(`- Total de logs en consola: ${consoleLogs.length}`);
    console.log(`- Errores críticos de consola: ${consoleErrors.length}`);
    console.log('======================================================\n');

    if (consoleErrors.length === 0) {
      console.log('✅ AUDITORÍA DE PRODUCCIÓN COMPLETADA CON ÉXITO: 0 ERRORES JS.');
    } else {
      console.warn('⚠️ Se detectaron errores durante la interacción:', consoleErrors);
    }

  } catch (error) {
    console.error('❌ Error durante la interacción en producción:', error);
  } finally {
    await browser.close();
  }
}

verifyProductionInteraction();
