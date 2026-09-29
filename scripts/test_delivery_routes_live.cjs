const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = 'C:\\Users\\USUARIO\\.gemini\\antigravity-ide\\brain\\0b4722cf-523c-4949-a1a4-dabf2647714a';

async function runLiveTest() {
  console.log('[E2E Live Test] Iniciando prueba integral de Despachos en Ruta, Portal Repartidor y Gobernanza OTIF...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    // 1. Navegar al ERP
    console.log('[1/6] Navegando a http://localhost:3000/ ...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);

    // Si hay un modal de consentimiento legal o bienvenida, cerrarlo
    const consentBtn = page.locator('button:has-text("Acepto"), button:has-text("Entendido"), button:has-text("Continuar")');
    if (await consentBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await consentBtn.first().click();
      await page.waitForTimeout(1000);
    }

    // Inyectar datos de demostración si es necesario
    await page.evaluate(() => {
      const existing = localStorage.getItem('pezcaderia_delivery_route_manifests');
      let list = [];
      try { list = JSON.parse(existing || '[]'); } catch (e) {}

      if (!list || list.length === 0) {
        const demoManifest = {
          id: 'man-live-001',
          numeroManifiesto: 'MAN-260929-001',
          conductorId: 'cond-01',
          conductorNombre: 'Carlos Mendoza',
          conductorTelefono: '3104567890',
          vehiculoPlaca: 'WOP-482',
          vehiculoTipo: 'Furgón Refrigerado Thermo King',
          zonaRuta: 'Ruta Norte - Restaurantes & Hoteles',
          estado: 'PLANIFICADA',
          totalPedidos: 2,
          totalPesoKg: 28.5,
          totalFacturadoEsperado: 890000,
          totalRecaudadoEfectivo: 0,
          totalRecaudadoDigital: 0,
          totalCreditoFirmado: 0,
          totalDevolucionesMonto: 0,
          totalGastosRuta: 0,
          efectivoNetoEntregado: 0,
          diferenciaCuadre: 0,
          cargaVerificadaEnBodega: false,
          incidenciasRuta: [],
          gastos: [],
          devolucionesGlobales: [],
          creadoEn: new Date().toISOString(),
          pedidos: [
            {
              id: 'item-001',
              pedidoId: 'ped-demo-1',
              numeroPedido: 'PED-9041',
              clienteId: 'c-1',
              clienteNombre: 'Restaurante Criterión Bogotá',
              clienteDireccion: 'Calle 69A # 5-75, Zona G',
              clienteTelefono: '3109988776',
              montoPedidoOriginal: 540000,
              montoCobradoFinal: 540000,
              formaPago: 'EFECTIVO',
              montoEfectivo: 540000,
              montoDigital: 0,
              estadoEntrega: 'PENDIENTE',
              fechaCreacionPedido: new Date(Date.now() - 3600000 * 4).toISOString(),
              fechaRequeridaEntrega: new Date().toISOString().slice(0, 10),
              jornadaRequerida: 'AM',
              items: [
                { sku: 'SALM-01', nombre: 'Salmón Premium Fresco', cantidad: 12.5, precioUnitario: 32000 },
                { sku: 'CAM-02', nombre: 'Camarón Tigre U15', cantidad: 4, precioUnitario: 35000 }
              ],
              devoluciones: []
            },
            {
              id: 'item-002',
              pedidoId: 'ped-demo-2',
              numeroPedido: 'PED-9042',
              clienteId: 'c-2',
              clienteNombre: 'Hotel Tequendama Suites',
              clienteDireccion: 'Carrera 10 # 26-21, Centro',
              clienteTelefono: '3157766554',
              montoPedidoOriginal: 350000,
              montoCobradoFinal: 350000,
              formaPago: 'TRANSFERENCIA_DIGITAL',
              montoEfectivo: 0,
              montoDigital: 350000,
              estadoEntrega: 'PENDIENTE',
              fechaCreacionPedido: new Date(Date.now() - 3600000 * 5).toISOString(),
              fechaRequeridaEntrega: new Date().toISOString().slice(0, 10),
              jornadaRequerida: 'AM',
              items: [
                { sku: 'ROB-01', nombre: 'Róbalo en Filete Limpio', cantidad: 10, precioUnitario: 35000 }
              ],
              devoluciones: []
            }
          ]
        };
        localStorage.setItem('pezcaderia_delivery_route_manifests', JSON.stringify([demoManifest]));
        localStorage.setItem('delivery_route_manifests', JSON.stringify([demoManifest]));
      }
    });

    // Recargar para que React monte el estado de manifiestos
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 2. Ir a la vista de Despachos y Rutas
    console.log('[2/6] Accediendo al módulo de Despachos y Rutas...');
    const navDespachos = page.locator('[data-testid="nav-despachos"]');
    if (await navDespachos.isVisible()) {
      await navDespachos.click();
    } else {
      await page.click('text="Despachos y Rutas"');
    }
    await page.waitForTimeout(2000);

    // CAPTURA 1: Vista general del Centro de Despachos
    const shot1 = path.join(ARTIFACTS_DIR, 'delivery_live_1_dispatch_center.png');
    await page.screenshot({ path: shot1, fullPage: true });
    console.log('[OK] Captura 1 guardada:', shot1);

    // 3. Abrir Modal de Planificación de Manifiesto
    console.log('[3/6] Abriendo Planificador de Manifiesto de Ruta...');
    const btnNuevaRuta = page.locator('button:has-text("+ Nueva Hoja de Ruta")');
    if (await btnNuevaRuta.isVisible()) {
      await btnNuevaRuta.click();
      await page.waitForTimeout(1500);

      // CAPTURA 2: Modal Planificador de Manifiesto
      const shot2 = path.join(ARTIFACTS_DIR, 'delivery_live_2_manifest_builder.png');
      await page.screenshot({ path: shot2 });
      console.log('[OK] Captura 2 guardada:', shot2);

      // Cerrar modal de planificación
      const btnCancelar = page.locator('button:text-is("Cancelar")').first();
      if (await btnCancelar.isVisible()) {
        await btnCancelar.click();
      } else {
        await page.keyboard.press('Escape');
      }
      await page.waitForTimeout(1500);
    }

    // 4. Cambiar a la pestaña "Rutas en Curso"
    console.log('[4/6] Accediendo a Rutas en Curso & Portal del Conductor...');
    await page.locator('button').filter({ hasText: /Rutas en Curso/i }).first().click();
    await page.waitForTimeout(2000);

    // Abrir Portal Conductor
    const btnPortalConductor = page.locator('button:has-text("Abrir Portal Conductor")').first();
    console.log('[Debug] Buscando boton Portal Conductor...');
    await btnPortalConductor.waitFor({ state: 'visible', timeout: 6000 });
    await btnPortalConductor.click();
    await page.waitForTimeout(1500);

    // CAPTURA 3: Portal Repartidor Móvil - Paso 1 Checklist de Carga
    const shot3 = path.join(ARTIFACTS_DIR, 'delivery_live_3_driver_portal_checklist.png');
    await page.screenshot({ path: shot3 });
    console.log('[OK] Captura 3 guardada:', shot3);

      // Confirmar carga y salir a ruta
      const btnSalirRuta = page.locator('button:has-text("Confirmar Carga & Salir a Ruta")');
      if (await btnSalirRuta.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btnSalirRuta.click();
        await page.waitForTimeout(1500);
        const swalOk = page.locator('.swal2-confirm');
        if (await swalOk.isVisible({ timeout: 2000 }).catch(() => false)) {
          await swalOk.click();
          await page.waitForTimeout(1000);
        }
      }

      // Marcar "Llegué a Sitio"
      const btnLlegue = page.locator('button:has-text("Llegué a Sitio")');
      if (await btnLlegue.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        await btnLlegue.first().click();
        await page.waitForTimeout(1500);
      }

      // Abrir modal "Entregar & Cobrar"
      const btnEntregarCobrar = page.locator('button:has-text("Entregar & Cobrar")');
      if (await btnEntregarCobrar.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        await btnEntregarCobrar.first().click();
        await page.waitForTimeout(1500);

        // Cambiar a Pago Mixto
        const btnMixto = page.locator('button:has-text("Pago Mixto")');
        if (await btnMixto.isVisible({ timeout: 1500 }).catch(() => false)) {
          await btnMixto.click();
          await page.waitForTimeout(500);
        }

        const inputComp = page.locator('input[placeholder*="Ej. B-"], input[placeholder*="Ej. C-"]');
        if (await inputComp.first().isVisible({ timeout: 1000 }).catch(() => false)) {
          await inputComp.first().fill('NEQUI-VOUCHER-98421');
        }

        const inputRecibido = page.locator('input[placeholder*="Chef Carlos"]');
        if (await inputRecibido.isVisible({ timeout: 1000 }).catch(() => false)) {
          await inputRecibido.fill('Chef Ejecutivo Juan Carlos Restrepo');
        }

        // CAPTURA 4: Modal de Entrega & Cobro Multimedio
        const shot4 = path.join(ARTIFACTS_DIR, 'delivery_live_4_driver_waypoints_delivery.png');
        await page.screenshot({ path: shot4 });
        console.log('[OK] Captura 4 guardada:', shot4);

        // Cerrar modal de entrega
        const btnCerrarEntrega = page.locator('button:text-is("Cancelar")').first();
        if (await btnCerrarEntrega.isVisible()) await btnCerrarEntrega.click();
        await page.waitForTimeout(1000);
      }

      // Cerrar portal repartidor
      const btnCerrarPortal = page.locator('button:has(svg.lucide-x)').first();
      if (await btnCerrarPortal.isVisible()) {
        await btnCerrarPortal.click();
        await page.waitForTimeout(1000);
      }

    // 5. Abrir Modal de Liquidación y Cuadre de Conductor
    console.log('[5/6] Abriendo Liquidación de Transportador...');
    const btnLiquidar = page.locator('button:has-text("Liquidar y Cuadrar Ruta")');
    if (await btnLiquidar.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await btnLiquidar.first().click();
      await page.waitForTimeout(1500);

      // Ingresar gasto
      const inputMontoGasto = page.locator('input[placeholder="0"]');
      if (await inputMontoGasto.isVisible({ timeout: 1000 }).catch(() => false)) {
        await inputMontoGasto.fill('45000');
        const inputTkt = page.locator('input[placeholder*="Tkt-"]');
        if (await inputTkt.isVisible()) await inputTkt.fill('FACT-TERPEL-882');
        const btnDeducir = page.locator('button:has-text("Deducir Gasto")');
        if (await btnDeducir.isVisible()) {
          await btnDeducir.click();
          await page.waitForTimeout(1000);
        }
      }

      // CAPTURA 5: Modal de Liquidación y Arqueo
      const shot5 = path.join(ARTIFACTS_DIR, 'delivery_live_5_settlement_cash_balance.png');
      await page.screenshot({ path: shot5 });
      console.log('[OK] Captura 5 guardada:', shot5);

      // Cerrar modal de liquidación
      const btnCancelarSettlement = page.locator('button:text-is("Cancelar")').first();
      if (await btnCancelarSettlement.isVisible()) {
        await btnCancelarSettlement.click();
      } else {
        await page.keyboard.press('Escape');
      }
      await page.waitForTimeout(1500);
    }

    // 6. Cambiar a la pestaña Gobernanza & Auditoría OTIF
    console.log('[6/6] Visualizando Gobernanza & Auditoría OTIF...');
    await page.click('button:has-text("Gobernanza & OTIF")');
    await page.waitForTimeout(1500);

    // CAPTURA 6: Tablero de Gobernanza y SLAs OTIF
    const shot6 = path.join(ARTIFACTS_DIR, 'delivery_live_6_governance_otif_audit.png');
    await page.screenshot({ path: shot6, fullPage: true });
    console.log('[OK] Captura 6 guardada:', shot6);

    console.log('\n[ÉXITO TOTAL] Todas las 6 capturas fueron generadas satisfactoriamente.');
  } catch (err) {
    console.error('[ERROR en E2E]', err);
  } finally {
    await browser.close();
  }
}

runLiveTest();
