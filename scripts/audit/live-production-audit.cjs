/**
 * scripts/audit/live-production-audit.cjs
 * Suite Automatizada de Auditoría en Vivo con Chrome DevTools Protocol (CDP)
 * para Producción Vercel: https://maestro-erp-pezcaderia.vercel.app
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const PROD_URL = 'https://maestro-erp-pezcaderia.vercel.app';
const ARTIFACT_DIR = path.resolve('C:/Users/usuario/.gemini/antigravity/brain/e2aefe99-37a4-4e7c-ad1a-2417f699b44e');
const SCREENSHOTS_DIR = path.join(ARTIFACT_DIR, 'screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function runLiveAudit() {
  console.log('======================================================================');
  console.log('🔍 [DEVTOOLS MCP] Auditoría Integral en Vivo de Producción Vercel');
  console.log('🌐 URL Objetivo:', PROD_URL);
  console.log('📁 Directorio de Screenshots:', SCREENSHOTS_DIR);
  console.log('======================================================================\n');

  const browser = await chromium.launch({
    headless: true,
  });

  const auditResults = {
    url: PROD_URL,
    timestamp: new Date().toISOString(),
    consoleLogs: [],
    consoleErrors: [],
    consoleWarnings: [],
    unhandledExceptions: [],
    failedRequests: [],
    probes: {},
    summary: {
      passed: true,
      totalProbes: 0,
      passedProbes: 0,
      failedProbes: 0,
    },
  };

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  });

  // Pre-seed consentimiento legal Habeas Data para no bloquear la automatización
  await context.addInitScript(() => {
    try {
      localStorage.setItem(
        'erp_habeas_data_consent',
        JSON.stringify({
          timestamp: new Date().toISOString(),
          regulation: 'Ley 1581 de 2012 (Colombia) / RGPD',
          version: '1.0.0-enterprise',
          status: 'ACEPTADO',
          persistedInDb: true,
        })
      );
    } catch (e) {}
  });

  const page = await context.newPage();

  // Escuchar todos los eventos DevTools de consola
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    const entry = { type, text, location: msg.location() };
    auditResults.consoleLogs.push(entry);

    if (type === 'error') {
      console.error(`🚨 [DevTools Console Error]: ${text}`);
      auditResults.consoleErrors.push(entry);
    } else if (type === 'warning') {
      auditResults.consoleWarnings.push(entry);
    }
  });

  page.on('pageerror', (err) => {
    console.error(`💥 [Unhandled JS Exception]: ${err.message}`);
    auditResults.unhandledExceptions.push({ message: err.message, stack: err.stack });
  });

  page.on('requestfailed', (req) => {
    if (req.failure()?.errorText !== 'net::ERR_ABORTED') {
      console.warn(`⚠️ [Failed Network Request]: ${req.url()} - ${req.failure()?.errorText}`);
      auditResults.failedRequests.push({ url: req.url(), error: req.failure()?.errorText });
    }
  });

  function recordProbe(name, passed, details = {}) {
    auditResults.summary.totalProbes++;
    if (passed) {
      auditResults.summary.passedProbes++;
      console.log(`  ✅ PROBE PASSED: [${name}]`, details);
    } else {
      auditResults.summary.failedProbes++;
      auditResults.summary.passed = false;
      console.error(`  ❌ PROBE FAILED: [${name}]`, details);
    }
    auditResults.probes[name] = { passed, details };
  }

  try {
    // ── FASE 1: Carga Inicial de Landing & 1-Clic Demo Josase ──
    console.log('\n--- FASE 1: Verificación de Landing & Login 1-Clic Mostrador ---');
    await page.goto(PROD_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(1000);

    const initialTitle = await page.title();
    recordProbe('Landing Page Title', initialTitle.includes('La Pezcadería ERP'), { title: initialTitle });

    // Descartar modal de Habeas Data si está visible
    const btnConsent = page.locator('button:has-text("Acepto Términos")').first();
    if (await btnConsent.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log('⚡ Aceptando acuerdo de Habeas Data interactivo...');
      await btnConsent.click({ force: true });
      await page.waitForTimeout(600);
    }

    // Localizar botón demo Ferretería Josase
    const btnJosase = page.locator('[data-testid="btn-fast-demo-josase"]');
    const btnJosaseVisible = await btnJosase.isVisible();
    recordProbe('Boton 1-Clic Demo Josase Visible', btnJosaseVisible);

    if (!btnJosaseVisible) {
      throw new Error('No se encontró el botón data-testid="btn-fast-demo-josase" en la landing.');
    }

    console.log('⚡ Haciendo clic en Mostrador Ferretería Josase (1-CLIC FULL)...');
    await btnJosase.click({ force: true });
    await page.waitForTimeout(2500);

    // ── FASE 2: Verificación de POS View (Resolución Desktop 1280x800) ──
    console.log('\n--- FASE 2: Auditoría POS View & Ergonomía del Carrito (1280x800) ---');

    // 2.1 Verificar que "CORTE Y PREPARACIÓN DE MOSTRADOR" NO exista en el DOM
    const corteMostradorCount = await page.locator('text="CORTE Y PREPARACIÓN DE MOSTRADOR"').count();
    const corteTextCount = await page.locator('text="Corte y preparación de mostrador"').count();
    const hasStaticCorteSection = corteMostradorCount > 0 || corteTextCount > 0;
    recordProbe('Ausencia de Seccion Estatica Corte y Preparacion', !hasStaticCorteSection, {
      corteMostradorCount,
      corteTextCount,
    });

    // 2.2 Verificar dimensiones del contenedor CartPanel (data-testid="cart-glass-panel")
    const cartContainer = page.locator('[data-testid="cart-glass-panel"]');
    const isCartVisible = await cartContainer.isVisible();
    recordProbe('CartPanel Visible', isCartVisible);

    const cartBox = await cartContainer.boundingBox();
    recordProbe('CartPanel Dimensiones Adecuadas', cartBox && cartBox.height >= 400, {
      cartBox,
    });

    // 2.3 Verificar visibilidad y accesibilidad de botones inferiores de acción
    const btnEmitirPreventa = page.locator('[data-testid="btn-emitir-preventa-mostrador"], button:has-text("EMITIR PREVENTA")').first();
    const btnCerrarTurno = page.locator('button:has-text("Cerrar Turno")').first();
    const isEmitirVisible = await btnEmitirPreventa.isVisible();
    const isCerrarTurnoVisible = await btnCerrarTurno.isVisible();
    
    let btnEmitirBox = null;
    let btnCerrarBox = null;
    if (isEmitirVisible) btnEmitirBox = await btnEmitirPreventa.boundingBox();
    if (isCerrarTurnoVisible) btnCerrarBox = await btnCerrarTurno.boundingBox();

    const viewportHeight = 800;
    const isActionButtonsWithinViewport =
      btnEmitirBox && btnEmitirBox.y + btnEmitirBox.height <= viewportHeight;

    recordProbe('Boton Emitir Preventa F6 Visible y Dentro de Viewport', !!isActionButtonsWithinViewport, {
      isEmitirVisible,
      isCerrarTurnoVisible,
      btnEmitirBox,
      btnCerrarBox,
      viewportHeight,
    });

    // 2.4 Probar Modal Bajo Demanda: Notas de Despacho (data-testid="btn-open-despacho-modal")
    const btnNotasDespacho = page.locator('[data-testid="btn-open-despacho-modal"]');
    const hasBtnNotas = await btnNotasDespacho.isVisible().catch(() => false);
    recordProbe('Boton Notas de Despacho Bajo Demanda Visible', hasBtnNotas);

    if (hasBtnNotas) {
      console.log('⚡ Abriendo modal de notas de despacho bajo demanda...');
      await btnNotasDespacho.click({ force: true });
      await page.waitForTimeout(600);

      const modalDespacho = page.locator('[data-testid="modal-despacho-notas"]');
      const isModalOpen = await modalDespacho.isVisible().catch(() => false);
      recordProbe('Modal DespachoNotas Abre Exitosamente', isModalOpen);

      if (isModalOpen) {
        // Seleccionar un chip de corte rápido y escribir una nota
        const chipFileteado = page.locator('button:has-text("Fileteado")').first();
        if (await chipFileteado.isVisible().catch(() => false)) {
          await chipFileteado.click({ force: true });
        }

        const textarea = modalDespacho.locator('textarea');
        if (await textarea.isVisible().catch(() => false)) {
          await textarea.fill('Empaque al vacío doble bolsa para despacho urgente');
        }

        // Cerrar modal vía botón de cierre
        const btnClose = page.locator('[data-testid="btn-close-despacho-modal"]');
        if (await btnClose.isVisible().catch(() => false)) {
          await btnClose.click({ force: true });
        } else {
          await page.keyboard.press('Escape');
        }
        await page.waitForTimeout(400);

        const isModalClosed = !(await modalDespacho.isVisible().catch(() => false));
        recordProbe('Modal DespachoNotas Cierra Limpiamente', isModalClosed);
      }
    }

    // Captura screenshot POS Desktop
    const posScreenshotPath = path.join(SCREENSHOTS_DIR, '01_pos_view_desktop_1280.png');
    await page.screenshot({ path: posScreenshotPath, fullPage: false });
    console.log(`  📸 Screenshot POS guardado en: ${posScreenshotPath}`);

    // ── FASE 3: Auditoría de Prevención de Colisiones en Topbar (1024, 1280, 1366) ──
    console.log('\n--- FASE 3: Auditoría de Contención y Colisiones en Topbar ---');

    const resolutions = [
      { name: 'Laptop 1366x768', width: 1366, height: 768 },
      { name: 'Desktop 1280x800', width: 1280, height: 800 },
      { name: 'Compact 1024x768', width: 1024, height: 768 },
    ];

    for (const res of resolutions) {
      await page.setViewportSize({ width: res.width, height: res.height });
      await page.waitForTimeout(400);

      const topbar = page.locator('header').first();

      // Contenedor Izquierdo (Tenant + Breadcrumb)
      const leftContainer = topbar.locator('div.flex.items-center.gap-2\\.5, div.flex.items-center').first();
      const leftBox = await leftContainer.boundingBox();

      // Contenedor Derecho (Botones de acción rápida: ONLINE, Josase, etc.)
      const rightContainer = topbar.locator('div.flex.items-center.gap-1, div.flex.items-center.gap-1\\.5, div.flex.items-center.gap-2').last();
      const rightBox = await rightContainer.boundingBox();

      // Verificar que el contenedor izquierdo no colisione con el derecho
      const noOverlap = leftBox && rightBox ? (leftBox.x + leftBox.width <= rightBox.x + 2) : true;
      recordProbe(`Topbar Sin Solapamiento (${res.name})`, noOverlap, {
        leftBox,
        rightBox,
        width: res.width,
      });

      const shotPath = path.join(SCREENSHOTS_DIR, `02_topbar_${res.width}x${res.height}.png`);
      await topbar.screenshot({ path: shotPath });
      console.log(`  📸 Screenshot Topbar (${res.name}) guardado.`);
    }

    // Restaurar viewport a 1280x800
    await page.setViewportSize({ width: 1280, height: 800 });

    // ── FASE 4: Auditoría de Dashboard View & Calendario (Descongelado) ──
    console.log('\n--- FASE 4: Auditoría de Dashboard View & Calendario ---');
    console.log('⚡ Navegando a #/dashboard...');
    await page.evaluate(() => {
      window.location.hash = '#/dashboard';
    });
    await page.waitForTimeout(1500);

    const isDashboardInDOM = await page.locator('[data-testid="executive-traffic-light-widget"]').first().isVisible();
    recordProbe('Dashboard View Montado en DOM', isDashboardInDOM);

    // Verificar scroll vertical del contenedor principal
    const scrollInfo = await page.evaluate(() => {
      const mainEl = document.querySelector('main');

      const mainScrollable = mainEl ? {
        scrollHeight: mainEl.scrollHeight,
        clientHeight: mainEl.clientHeight,
        overflowY: window.getComputedStyle(mainEl).overflowY,
      } : null;

      if (mainEl && mainEl.scrollHeight > mainEl.clientHeight) {
        mainEl.scrollTop = 350;
      } else {
        window.scrollBy(0, 350);
      }

      return {
        mainScrollable,
        windowScrollY: window.scrollY,
        mainScrollTop: mainEl ? mainEl.scrollTop : 0,
      };
    });

    const isVerticallyFluid =
      (scrollInfo.mainScrollable && scrollInfo.mainScrollable.overflowY === 'auto') ||
      scrollInfo.windowScrollY > 0 ||
      scrollInfo.mainScrollTop > 0;

    recordProbe('Dashboard Desplazamiento Vertical Fluido (No Congelado)', isVerticallyFluid, scrollInfo);

    // Captura screenshot Dashboard Desktop
    const dashScreenshotPath = path.join(SCREENSHOTS_DIR, '03_dashboard_view_desktop_1280.png');
    await page.screenshot({ path: dashScreenshotPath, fullPage: false });
    console.log(`  📸 Screenshot Dashboard guardado en: ${dashScreenshotPath}`);

    // ── FASE 5: Auditoría de Flujo de Caja & Multiventas (Kanban Caja F7) ──
    console.log('\n--- FASE 5: Auditoría de Flujo de Caja & Multiventas Kanban ---');
    console.log('⚡ Navegando a #/comandas_kanban...');
    await page.evaluate(() => {
      window.location.hash = '#/comandas_kanban';
    });
    await page.waitForTimeout(1500);

    const kanbanVisible = await page.locator('text=/Comandas|Preventas|Kanban|COLA EN VIVO/i').first().isVisible().catch(() => false);
    recordProbe('Bandeja de Comandas / Kanban Accesible', kanbanVisible);

    const kanbanScreenshotPath = path.join(SCREENSHOTS_DIR, '04_kanban_comandas_desktop.png');
    await page.screenshot({ path: kanbanScreenshotPath, fullPage: false });
    console.log(`  📸 Screenshot Kanban guardado en: ${kanbanScreenshotPath}`);

    // ── FASE 6: Auditoría Responsiva Móvil Estricta (Viewport 375x667) ──
    console.log('\n--- FASE 6: Auditoría Responsiva Móvil 375px (Regla del Niño de 12 Años) ---');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(800);

    // 6.1 Test en Dashboard Móvil
    const mobileDashOverflow = await page.evaluate(() => {
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });

    recordProbe('Dashboard Móvil 375px Sin Desbordamiento Horizontal', !mobileDashOverflow.hasOverflow, mobileDashOverflow);

    const mobileDashPath = path.join(SCREENSHOTS_DIR, '05_dashboard_mobile_375.png');
    await page.screenshot({ path: mobileDashPath, fullPage: false });
    console.log(`  📸 Screenshot Dashboard Móvil guardado.`);

    // 6.2 Test en POS Móvil
    await page.evaluate(() => {
      window.location.hash = '#/pos';
    });
    await page.waitForTimeout(1000);

    const mobilePosOverflow = await page.evaluate(() => {
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });

    recordProbe('POS Móvil 375px Sin Desbordamiento Horizontal', !mobilePosOverflow.hasOverflow, mobilePosOverflow);

    const mobilePosPath = path.join(SCREENSHOTS_DIR, '06_pos_mobile_375.png');
    await page.screenshot({ path: mobilePosPath, fullPage: false });
    console.log(`  📸 Screenshot POS Móvil guardado.`);

    // ── FASE 7: Verificación Cero Errores DevTools en Producción ──
    console.log('\n--- FASE 7: Verificación Final de Errores de Consola JS ---');
    const zeroConsoleErrors = auditResults.consoleErrors.length === 0;
    const zeroUnhandledExceptions = auditResults.unhandledExceptions.length === 0;

    recordProbe('Cero Errores de Consola (console.error = 0)', zeroConsoleErrors, {
      errorsCount: auditResults.consoleErrors.length,
      errors: auditResults.consoleErrors,
    });

    recordProbe('Cero Excepciones JS No Controladas (unhandled = 0)', zeroUnhandledExceptions, {
      exceptionsCount: auditResults.unhandledExceptions.length,
      exceptions: auditResults.unhandledExceptions,
    });

  } catch (err) {
    console.error('❌ Excepción fatal durante la ejecución de la auditoría en vivo:', err);
    auditResults.summary.passed = false;
    auditResults.fatalError = err.message;
  } finally {
    await browser.close();

    const reportPath = path.join(ARTIFACT_DIR, 'live_production_audit_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2), 'utf-8');
    console.log(`\n📄 Reporte de auditoría generado en: ${reportPath}`);

    console.log('\n======================================================================');
    console.log(`🏁 RESUMEN AUDITORÍA PRODUCCIÓN VERCEL: ${auditResults.summary.passed ? '✅ APROBADO' : '❌ REVISIÓN REQUERIDA'}`);
    console.log(`   Probes Totales: ${auditResults.summary.totalProbes}`);
    console.log(`   Probes Aprobados: ${auditResults.summary.passedProbes}`);
    console.log(`   Probes Fallidos: ${auditResults.summary.failedProbes}`);
    console.log(`   Errores de Consola: ${auditResults.consoleErrors.length}`);
    console.log(`   Excepciones JS: ${auditResults.unhandledExceptions.length}`);
    console.log('======================================================================\n');
  }
}

runLiveAudit().catch((e) => {
  console.error('Error no controlado en runLiveAudit:', e);
  process.exit(1);
});
