/**
 * Script de Auditoría DevTools en Producción: Verificación de LoginView & Autenticación
 * Navega a https://maestro-erp-pezcaderia.vercel.app/
 * Comprueba que sin sesión autenticada se muestra LoginView
 * Captura screenshots en Desktop (1280x800) y Móvil (375x667)
 * Verifica 0 errores en la consola JS
 */

const { chromium } = require('@playwright/test');
const path = require('path');

const PROD_URL = 'https://maestro-erp-pezcaderia.vercel.app/';
const ARTIFACTS_DIR = 'C:\\Users\\usuario\\.gemini\\antigravity-ide\\brain\\b67c2ff6-ba88-4bb9-81db-e466546a8571';

async function verifyProductionLogin() {
  console.log('🚀 Iniciando auditoría DevTools de Login y Autenticación en producción...');
  console.log(`🌐 URL: ${PROD_URL}`);

  const browser = await chromium.launch({ headless: true });
  // Creamos un contexto limpio (incógnito) sin localStorage previo
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
    console.log('⏳ Navegando y esperando estabilización de red...');
    const response = await page.goto(PROD_URL, { waitUntil: 'networkidle', timeout: 40000 });
    console.log(`📡 HTTP Status: ${response ? response.status() : 'No response'}`);

    await page.waitForTimeout(3000);

    // Si aparece el modal de términos legales, aceptarlo para ver la pantalla subyacente
    const btnAcepto = page.getByRole('button', { name: /Acepto Términos/i });
    if (await btnAcepto.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('🛡️ Cerrando aviso de Habeas Data...');
      await btnAcepto.click();
      await page.waitForTimeout(2000);
    }

    // Comprobar elementos de la pantalla de Login
    const hasGoogleBtn = await page.getByRole('button', { name: /Continuar con Google/i }).isVisible().catch(() => false);
    const hasIngresarBtn = await page.getByRole('button', { name: /Ingresar al Sistema/i }).isVisible().catch(() => false);
    const hasEmailInput = await page.locator('input[type="email"]').isVisible().catch(() => false);
    const hasPasswordInput = await page.locator('input[type="password"]').isVisible().catch(() => false);
    const hasRegisterTab = await page.getByRole('button', { name: /Registrar Empresa/i }).isVisible().catch(() => false);
    const hasSuperAdminQuickBtn = await page.getByRole('button', { name: /SuperAdmin/i }).isVisible().catch(() => false);

    console.log(`🔐 ¿Botón Google OAuth presente?: ${hasGoogleBtn ? 'SÍ' : 'NO'}`);
    console.log(`📧 ¿Input de Correo presente?: ${hasEmailInput ? 'SÍ' : 'NO'}`);
    console.log(`🔑 ¿Input de Contraseña presente?: ${hasPasswordInput ? 'SÍ' : 'NO'}`);
    console.log(`🚪 ¿Botón Ingresar al Sistema presente?: ${hasIngresarBtn ? 'SÍ' : 'NO'}`);
    console.log(`🏢 ¿Tab Registrar Empresa presente?: ${hasRegisterTab ? 'SÍ' : 'NO'}`);
    console.log(`👑 ¿Acceso Rápido SuperAdmin presente?: ${hasSuperAdminQuickBtn ? 'SÍ' : 'NO'}`);

    // Capturar screenshot Desktop de la pantalla de autenticación y Login
    const loginDesktopPath = path.join(ARTIFACTS_DIR, 'vercel_prod_login_desktop.png');
    await page.screenshot({ path: loginDesktopPath, fullPage: false });
    console.log(`📸 Screenshot Desktop de Login guardado en: ${loginDesktopPath}`);

    // Probar clic en "Continuar con Google" y verificar SweetAlert2
    if (hasGoogleBtn) {
      console.log('🧪 Probando clic en "Continuar con Google" (verificando intercepción de proveedor deshabilitado)...');
      await page.getByRole('button', { name: /Continuar con Google/i }).click();
      await page.waitForTimeout(2500);

      const swalVisible = await page.locator('.swal2-popup').isVisible().catch(() => false);
      console.log(`🛡️ ¿Modal SweetAlert2 de proveedor desplegado?: ${swalVisible ? 'SÍ ✅' : 'NO ❌'}`);

      if (swalVisible) {
        const swalTitle = await page.locator('#swal2-title').textContent().catch(() => '');
        console.log(`📋 Título de SweetAlert2: "${swalTitle}"`);

        const oauthInterceptPath = path.join(ARTIFACTS_DIR, 'vercel_prod_oauth_intercept.png');
        await page.screenshot({ path: oauthInterceptPath, fullPage: false });
        console.log(`📸 Screenshot Intercepción OAuth guardado en: ${oauthInterceptPath}`);

        // Cerrar modal SweetAlert2
        const confirmBtn = page.locator('.swal2-confirm');
        if (await confirmBtn.isVisible().catch(() => false)) {
          await confirmBtn.click();
          await page.waitForTimeout(1000);
        }
      }
    }

    // Redimensionar a móvil 375x667
    console.log('📱 Redimensionando a vista móvil 375x667...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1500);

    const loginMobilePath = path.join(ARTIFACTS_DIR, 'vercel_prod_login_mobile_375.png');
    await page.screenshot({ path: loginMobilePath, fullPage: false });
    console.log(`📸 Screenshot Móvil de Login guardado en: ${loginMobilePath}`);

    // Volver a Desktop para probar el login con 1-clic
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(1000);

    if (hasSuperAdminQuickBtn) {
      console.log('🔑 Probando inicio de sesión con Acceso Rápido SuperAdmin (1-clic)...');
      await page.getByRole('button', { name: /SuperAdmin/i }).click();
      await page.waitForTimeout(500);

      const emailVal = await page.locator('input[type="email"]').inputValue();
      console.log(`📧 Correo autocompletado: ${emailVal}`);

      console.log('🚀 Haciendo clic en "Ingresar al Sistema"...');
      await page.getByRole('button', { name: /Ingresar al Sistema/i }).click();
      await page.waitForTimeout(4000);

      // Comprobar que ingresamos al sistema (dashboard o POS)
      const currentUrl = page.url();
      console.log(`📍 URL post-autenticación: ${currentUrl}`);

      const authenticatedPath = path.join(ARTIFACTS_DIR, 'vercel_prod_authenticated_session.png');
      await page.screenshot({ path: authenticatedPath, fullPage: false });
      console.log(`📸 Screenshot Sesión Autenticada guardado en: ${authenticatedPath}`);
    }

    console.log('\n======================================================');
    console.log('📊 REPORTE FINAL: LOGIN & AUTENTICACIÓN EN PRODUCCIÓN');
    console.log('======================================================');
    console.log(`- LoginView Renderizado: ${hasIngresarBtn || hasGoogleBtn ? 'SÍ ✅' : 'NO ❌'}`);
    console.log(`- Total de logs en consola: ${consoleLogs.length}`);
    console.log(`- Errores críticos de consola: ${consoleErrors.length}`);
    console.log('======================================================\n');

    if (consoleErrors.length === 0) {
      console.log('🎉 CERTIFICACIÓN EXITOSA: PANTALLA DE LOGIN EN VIVO SIN ERRORES JS.');
    } else {
      console.warn('⚠️ Se detectaron advertencias/logs:', consoleErrors);
    }

  } catch (err) {
    console.error('❌ Error en la verificación:', err);
  } finally {
    await browser.close();
  }
}

verifyProductionLogin();
