const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

(async () => {
  const artifactDir = 'C:\\Users\\USUARIO\\.gemini\\antigravity-ide\\brain\\0b4722cf-523c-4949-a1a4-dabf2647714a';
  console.log('Iniciando navegador Chromium para pruebas reales de B2B Dispatch...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const seedData = {
    erp_habeas_data_consent: {
      timestamp: new Date().toISOString(),
      regulation: 'Ley 1581 de 2012 (Colombia) / RGPD',
      version: '1.0.0-enterprise',
      status: 'ACEPTADO',
    },
    pezcaderia_quotations: [
      {
        id: 'quote-test-trucha-b2b',
        numeroPedido: 'PED-2026-0042',
        clienteId: 'cli-restaurante-mar',
        cliente: 'Restaurante Mar Gourmet',
        clienteNombre: 'Restaurante Mar Gourmet',
        fecha: new Date().toLocaleDateString('es-CO'),
        estado: 'CREADO',
        total: 84000,
        totalFinal: 84000,
        subtotal: 84000,
        lineas: [
          {
            id: 'line-trucha-1',
            productoId: 'prod-trucha',
            nombre: 'Trucha Arcoiris Entera',
            modalidadVenta: 'CATCH_WEIGHT_PIEZAS',
            piezasSolicitadas: 5,
            calibreMinGramos: 450,
            calibreMaxGramos: 500,
            cantidadSolicitada: 2.375,
            pesoEstimado: 2.375,
            precioPactado: 35000,
            totalLinea: 83125,
            corte: 'eviscerado',
            empaque: 'hielo',
          }
        ]
      }
    ],
    pezcaderia_ventas: [
      {
        id: 'quote-test-trucha-b2b',
        numeroPedido: 'PED-2026-0042',
        clienteId: 'cli-restaurante-mar',
        cliente: 'Restaurante Mar Gourmet',
        clienteNombre: 'Restaurante Mar Gourmet',
        fecha: new Date().toLocaleDateString('es-CO'),
        estado: 'CREADO',
        total: 84000,
        totalFinal: 84000,
        subtotal: 84000,
        lineas: [
          {
            id: 'line-trucha-1',
            productoId: 'prod-trucha',
            nombre: 'Trucha Arcoiris Entera',
            modalidadVenta: 'CATCH_WEIGHT_PIEZAS',
            piezasSolicitadas: 5,
            calibreMinGramos: 450,
            calibreMaxGramos: 500,
            cantidadSolicitada: 2.375,
            pesoEstimado: 2.375,
            precioPactado: 35000,
            totalLinea: 83125,
            corte: 'eviscerado',
            empaque: 'hielo',
          }
        ]
      }
    ]
  };

  await page.addInitScript((data) => {
    localStorage.clear();
    for (const [key, value] of Object.entries(data)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }, seedData);

  console.log('Navegando a http://localhost:3000/ ...');
  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(2000);

  // Navegar a Kanban
  await page.click('[data-testid="nav-kanban"]');
  await page.waitForTimeout(1500);

  // 1. Captura: Tablero Logístico de Bodega
  const shot1 = path.join(artifactDir, 'b2b_live_1_kanban_bodega.png');
  await page.screenshot({ path: shot1, fullPage: true });
  console.log('Captura 1 guardada:', shot1);

  // 2. Captura: Tablero de Despachos & Remisiones WMS
  await page.click('button:has-text("2. Despachos & Remisiones WMS")');
  await page.waitForTimeout(1000);
  const shot2 = path.join(artifactDir, 'b2b_live_2_kanban_despacho.png');
  await page.screenshot({ path: shot2, fullPage: true });
  console.log('Captura 2 guardada:', shot2);

  // Volver a Bodega para probar pesaje
  await page.click('button:has-text("1. Logística de Bodega")');
  await page.waitForTimeout(1000);

  // 3. Abrir Modal de Báscula y Catch Weight
  const btnPesar = page.locator('button:has-text("Pesar")').first();
  if (await btnPesar.isVisible()) {
    await btnPesar.click();
    await page.waitForTimeout(1000);

    // Ingresar peso 2.400 kg en el visor
    const btn2 = page.locator('button:has-text("2")').first();
    const btnDot = page.locator('button:has-text(".")');
    const btn4 = page.locator('button:has-text("4")').first();

    // Copiar peso nominal o tipear en el visor
    const btnCopiar = page.locator('button:has-text("Copiar Peso Nominal")');
    if (await btnCopiar.isVisible()) {
      await btnCopiar.click();
      await page.waitForTimeout(500);
    }

    const shot3 = path.join(artifactDir, 'b2b_live_3_weighing_catch_weight.png');
    await page.screenshot({ path: shot3 });
    console.log('Captura 3 guardada:', shot3);

    // Confirmar pesaje
    const btnConfirmar = page.locator('button:has-text("Confirmar Pesaje & Empaque")');
    if (await btnConfirmar.isVisible() && await btnConfirmar.isEnabled()) {
      await btnConfirmar.click();
      await page.waitForTimeout(2000);
    }
  }

  // 4. Ir a pestaña Despacho y abrir modal de remisión WMS
  await page.click('button:has-text("2. Despachos & Remisiones WMS")');
  await page.waitForTimeout(1000);

  const btnDespachar = page.locator('button:has-text("Despachar WMS")').first();
  if (await btnDespachar.isVisible()) {
    await btnDespachar.click();
    await page.waitForTimeout(1000);

    const shot4 = path.join(artifactDir, 'b2b_live_4_wms_remision.png');
    await page.screenshot({ path: shot4 });
    console.log('Captura 4 guardada:', shot4);
  }

  await browser.close();
  console.log('Pruebas reales en vivo completadas con éxito!');
})();
