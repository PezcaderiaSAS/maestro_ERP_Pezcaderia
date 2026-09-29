import { test, expect } from '@playwright/test';
import { SEED_DATA as POS_SEED_DATA } from '../../src/dev/seeds/seedPOS';
import { SEED_DATA as CASH_SEED_DATA } from '../../src/dev/seeds/seedCash';

test.describe('B2B Picking, Packing & Despachos - Catch Weight y Remisiones WMS', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    const seedData = {
      ...POS_SEED_DATA,
      ...CASH_SEED_DATA,
      erp_habeas_data_consent: {
        timestamp: new Date().toISOString(),
        regulation: 'Ley 1581 de 2012 (Colombia) / RGPD',
        version: '1.0.0-enterprise',
        status: 'ACEPTADO',
      },
      // Inyectar orden B2B con Catch Weight (5 truchas de 450-500g)
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
              nombre: 'Trucha Arcoiris',
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
              nombre: 'Trucha Arcoiris',
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

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.sidebar-menu')).toBeVisible({ timeout: 15000 });
    await page.click('[data-testid="nav-kanban"]');
    await page.waitForLoadState('domcontentloaded');
  });

  test('Debe visualizar el Tablero Kanban B2B con sus 2 pestañas operativas', async ({ page }) => {
    // 1. Título principal y badges de la vista
    await expect(page.locator('h2:has-text("Picking, Packing & Despachos B2B")')).toBeVisible();
    await expect(page.locator('text=Catch Weight & QR')).toBeVisible();

    // 2. Ambas pestañas operativas disponibles
    const tabBodega = page.locator('button:has-text("1. Logística de Bodega")');
    const tabDespacho = page.locator('button:has-text("2. Despachos & Remisiones WMS")');
    await expect(tabBodega).toBeVisible();
    await expect(tabDespacho).toBeVisible();

    // 3. Verificar columnas de la pestaña de Bodega por defecto
    await expect(page.locator('h3:has-text("Por Alistar")')).toBeVisible();
    await expect(page.locator('h3:has-text("En Fileteo & Corte")')).toBeVisible();
    await expect(page.locator('h3:has-text("Pesaje & Packing Báscula")')).toBeVisible();

    // 4. Cambiar a la pestaña de Despachos
    await tabDespacho.click();
    await expect(page.locator('h3:has-text("Listos para Despacho")')).toBeVisible();
    await expect(page.locator('h3:has-text("En Ruta / Despachados")')).toBeVisible();
    await expect(page.locator('h3:has-text("Entregados en Destino")')).toBeVisible();
  });

  test('Debe abrir el modal de pesaje y báscula táctil con validación Catch Weight', async ({ page }) => {
    // 1. Localizar la tarjeta del pedido de prueba y hacer clic en "Pesar"
    const btnPesar = page.locator('button:has-text("Pesar")').first();
    await expect(btnPesar).toBeVisible();
    await btnPesar.click();

    // 2. Comprobar que se abre el modal de pesaje
    await expect(page.locator('h3:has-text("Báscula y Conciliación de Packing")')).toBeVisible();
    await expect(page.locator('text=PESO EN BÁSCULA (KG)')).toBeVisible();

    // 3. Probar el botón para copiar el peso nominal
    const btnCopiarNominal = page.locator('button:has-text("Copiar Peso Nominal")');
    await expect(btnCopiarNominal).toBeVisible();
    await btnCopiarNominal.click();

    // 4. Verificar que el visor muestra el peso y calcula la tolerancia dentro de ±10%
    await expect(page.locator('text=Dentro de Tolerancia ±10%')).toBeVisible();

    // 5. Botón de confirmación habilitado
    const btnConfirmar = page.locator('button:has-text("Confirmar Pesaje & Empaque")');
    await expect(btnConfirmar).toBeEnabled();
  });
});
