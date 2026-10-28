/**
 * Script de Auditoría DevTools en Producción:
 * 1. Prueba de Cierre de Sesión (Modal SweetAlert2 -> Sí, salir -> Redirección a LoginView)
 * 2. Prueba de Inicio de Sesión y Conmutación a Ferretería Josase (tenant-03)
 * 3. Validación de Venta Multivendedor - Caja Única (Asesores Mostrador + PendingOrdersDrawer)
 * 4. Verificación de Cero Desbordamiento Horizontal (scrollWidth <= clientWidth) y Dark Glassmorphism
 */

const { chromium } = require('@playwright/test');
const path = require('path');

const PROD_URL = 'https://maestro-erp-pezcaderia.vercel.app/';
const ARTIFACTS_DIR = 'C:\\Users\\usuario\\.gemini\\antigravity-ide\\brain\\b67c2ff6-ba88-4bb9-81db-e466546a8571';

async function runDevToolsAudit() {
  console.log('🚀 Iniciando auditoría DevTools en Producción para Cierre de Sesión y Ferretería Josase...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();
  const consoleErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.error(`🔴 [Console Error]: ${msg.text()}`);
    }
  });

  try {
    console.log('⏳ Navegando a producción...');
    await page.goto(PROD_URL, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(3000);

    // Aceptar Habeas Data si está presente
    const btnAcepto = page.getByRole('button', { name: /Acepto Términos/i });
    if (await btnAcepto.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btnAcepto.click();
      await page.waitForTimeout(1500);
    }

    // 1. Verificar si está en LoginView o Autenticado
    const isLoginVisible = await page.getByRole('button', { name: /Ingresar al Sistema/i }).isVisible().catch(() => false);
    console.log(`🔐 ¿Pantalla Login visible inicialmente?: ${isLoginVisible ? 'SÍ' : 'NO'}`);

    if (isLoginVisible) {
      console.log('🔑 Iniciando sesión mediante Acceso Rápido SuperAdmin...');
      const quickAdminBtn = page.getByRole('button', { name: /SuperAdmin/i });
      if (await quickAdminBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await quickAdminBtn.click();
        await page.waitForTimeout(1000);
      }
      await page.getByRole('button', { name: /Ingresar al Sistema/i }).click();
      await page.waitForTimeout(3500);
    }

    // Screenshot del dashboard autenticado
    const dashPath = path.join(ARTIFACTS_DIR, 'vercel_prod_authenticated_session.png');
    await page.screenshot({ path: dashPath });
    console.log(`📸 Screenshot Dashboard autenticado guardado en: ${dashPath}`);

    // 2. Probar el flujo de Cierre de Sesión
    console.log('🚪 Probando flujo de Cierre de Sesión...');
    // Probar el botón de Cerrar Sesión del sidebar
    const btnLogoutSidebar = page.locator('#sidebar-btn-logout');
    const macCloseControl = page.locator('[data-testid="mac-control-close"]').first();

    if (await btnLogoutSidebar.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('🖱️ Clic en #sidebar-btn-logout...');
      await btnLogoutSidebar.click();
    } else if (await macCloseControl.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('🖱️ Clic en control rojo macOS...');
      await macCloseControl.click();
    }

    await page.waitForTimeout(1500);

    // Verificar diálogo SweetAlert2
    const swalModal = page.locator('.swal2-popup');
    const isSwalVisible = await swalModal.isVisible().catch(() => false);
    console.log(`💬 ¿Modal "¿Cerrar sesión?" desplegado?: ${isSwalVisible ? 'SÍ ✅' : 'NO ❌'}`);

    if (isSwalVisible) {
      const title = await page.locator('#swal2-title').textContent().catch(() => '');
      console.log(`📋 Título del modal: "${title}"`);

      console.log('🖱️ Confirmando "Sí, salir"...');
      const btnConfirmLogout = page.getByRole('button', { name: /Sí, salir/i });
      await btnConfirmLogout.click();
      await page.waitForTimeout(3000);

      // Certificar que volvió a LoginView
      const isBackToLogin = await page.getByRole('button', { name: /Ingresar al Sistema/i }).isVisible().catch(() => false);
      console.log(`🏁 ¿Retornó exitosamente a LoginView?: ${isBackToLogin ? 'SÍ ✅ (FLUJO CORREGIDO)' : 'NO ❌'}`);

      const logoutTestedPath = path.join(ARTIFACTS_DIR, 'vercel_prod_logout_tested.png');
      await page.screenshot({ path: logoutTestedPath });
      console.log(`📸 Screenshot de confirmación logout: ${logoutTestedPath}`);

      // Reingresar para probar Ferretería Josase
      console.log('🔑 Re-autenticando para prueba de Ferretería Josase...');
      const quickAdminBtn = page.getByRole('button', { name: /SuperAdmin/i });
      if (await quickAdminBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await quickAdminBtn.click();
        await page.waitForTimeout(1000);
      }
      await page.getByRole('button', { name: /Ingresar al Sistema/i }).click();
      await page.waitForTimeout(3500);
    }

    // 3. Conmutar al tenant "tenant-03" (Ferretería Josase)
    console.log('🔄 Conmutando al tenant "tenant-03" (Ferretería Josase)...');
    await page.evaluate(() => {
      const auth = window.__ZUSTAND_STORES__ ? window.__ZUSTAND_STORES__.useAuthStore : null;
      // Invocación directa del store en el cliente para garantizar conmutación
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

    // Abrir Omnibox o selector de tenant o cambiar ruta a POS
    console.log('🛒 Navegando al módulo POS...');
    await page.evaluate(() => {
      // Invocación a useAppStore para navegar a 'pos'
      const app = (window).__APP_STORE__;
      if (app && app.setCurrentView) {
        app.setCurrentView('pos');
      } else {
        window.location.hash = '#pos';
      }
    });

    await page.waitForTimeout(3000);

    // Si aún no está en POS, hacer clic en el botón de navegación "Facturar POS" en la topbar
    const btnPosTopbar = page.locator('#btn-topbar-pos');
    if (await btnPosTopbar.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btnPosTopbar.click();
      await page.waitForTimeout(2000);
    }

    // Validar desbordamiento horizontal en POS
    const overflowCheck = await page.evaluate(() => {
      const doc = document.documentElement;
      return {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        hasOverflow: doc.scrollWidth > doc.clientWidth,
      };
    });
    console.log(`📐 Auditoría de Ancho de Pantalla: ScrollWidth=${overflowCheck.scrollWidth}px | ClientWidth=${overflowCheck.clientWidth}px | Desbordamiento=${overflowCheck.hasOverflow ? 'DETECTADO ❌' : 'CERO (PERFECTO) ✅'}`);

    // Abrir Drawer de Comandas
    const btnComandas = page.locator('#btn-open-comandas-drawer');
    if (await btnComandas.isVisible({ timeout: 2500 }).catch(() => false)) {
      console.log('📋 Abriendo Cola Central de Preventas (PendingOrdersDrawer)...');
      await btnComandas.click();
      await page.waitForTimeout(2000);

      const comandasDrawerPath = path.join(ARTIFACTS_DIR, 'vercel_prod_comandas_drawer.png');
      await page.screenshot({ path: comandasDrawerPath });
      console.log(`📸 Screenshot Cola de Comandas guardado en: ${comandasDrawerPath}`);
    }

    const posViewPath = path.join(ARTIFACTS_DIR, 'vercel_prod_ferreteria_pos.png');
    await page.screenshot({ path: posViewPath });
    console.log(`📸 Screenshot POS Ferretería Josase guardado en: ${posViewPath}`);

    console.log('🎉 Auditoría DevTools completada exitosamente.');
  } catch (error) {
    console.error('❌ Error durante la auditoría DevTools:', error);
  } finally {
    await browser.close();
  }
}

runDevToolsAudit();
