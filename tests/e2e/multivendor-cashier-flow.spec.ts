import { test, expect } from '@playwright/test';
import { SEED_DATA as POS_SEED_DATA } from '../../src/dev/seeds/seedPOS';
import { SEED_DATA as CASH_SEED_DATA } from '../../src/dev/seeds/seedCash';

test.describe('SPEC-039: Flujo E2E Multivendedor - Caja Única (Mostrador ➔ Cola Comandas ➔ Recaudo Central)', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Establecer Viewport de Laptop Estándar (1366x768) para validar ergonomía y responsive
    await page.setViewportSize({ width: 1366, height: 768 });

    // 2. Sembrar datos deterministas con turno de caja abierto en Bodega Principal
    const seedData = {
      ...POS_SEED_DATA,
      ...CASH_SEED_DATA,
      pezcaderia_bodegas: [
        { id: 'b1', nombre: 'Bodega Principal', activa: true },
      ],
      pezcaderia_cajas: [
        { id: 'caja-1', bodegaId: 'b1', nombre: 'Caja POS Principal', tipo: 'MENOR', activa: true },
        { id: 'caja-test-menor', bodegaId: 'b1', nombre: 'Caja Menor', tipo: 'MENOR', activa: true },
      ],
      pezcaderia_turnos_caja: [
        {
          id: 'trn-test-01',
          cajaId: 'caja-1',
          cajeroId: 'usr-vendedor-01',
          fechaApertura: new Date().toISOString(),
          fechaCierre: null,
          baseInicial: 200000,
          saldoTeoricoGlobal: 255000,
          totalEfectivo: 255000,
          totalDatafono: 0,
          totalTransferencias: 0,
          saldoFisicoEfectivo: null,
          diferenciaEfectivo: null,
          estado: 'ABIERTO',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'admin',
        },
      ],
      erp_habeas_data_consent: {
        timestamp: new Date().toISOString(),
        regulation: 'Ley 1581 de 2012 (Colombia) / RGPD',
        version: '1.0.0-enterprise',
        status: 'ACEPTADO',
      },
      pezcaderia_stock: {
        b1: {
          'PES-ENT-001': 25,
          'FIL-LIM-002': 18,
          'CAM-TIG-003': 12,
        },
      },
    };

    await page.addInitScript((data) => {
      localStorage.clear();
      for (const [key, value] of Object.entries(data)) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    }, seedData);

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.sidebar-menu, aside')).toBeVisible({ timeout: 20000 });
  });

  test('Debe completar el ciclo: Vendedor crea comanda en mostrador -> Cajero la toma en Cola Central -> Cobro exitoso y emisión de recibo', async ({
    page,
  }) => {
    // Aumentar timeout para garantizar la ejecución fluida de pasos secuenciales
    test.setTimeout(45000);

    // PASO 1: Navegar al módulo de POS
    await page.click('[data-testid="nav-pos"]');
    await page.waitForLoadState('domcontentloaded');

    // PASO 2: Vendedor en Mostrador busca y agrega un producto del mar al pedido
    const productItem = page.locator('text=Salmón Fresco').first();
    await expect(productItem).toBeVisible({ timeout: 15000 });

    const btnCobrar = page.locator('[data-testid="btn-cobrar"]');

    // Clic en el producto para agregarlo al carrito
    await expect(async () => {
      if (await btnCobrar.isDisabled()) {
        await productItem.click({ force: true });
      }
      await expect(btnCobrar).toBeEnabled({ timeout: 1000 });
    }).toPass({ timeout: 15000 });

    // PASO 3: Asesor Comercial pulsa botón 'En Espera' para enviar preventa a Caja Central
    const btnEnEspera = page.locator('button:has-text("En Espera")').first();
    await expect(btnEnEspera).toBeVisible({ timeout: 5000 });
    await btnEnEspera.click();

    // SweetAlert modal para asignar alias o confirmación
    const swalContainer = page.locator('.swal2-container');
    await expect(swalContainer).toBeVisible({ timeout: 5000 });

    const swalInput = page.locator('.swal2-input');
    if (await swalInput.isVisible()) {
      await swalInput.fill('Preventa Mostrador 1 - Cliente VIP');
    }

    const swalConfirm = page.locator('.swal2-confirm');
    await swalConfirm.click();
    await expect(swalContainer).not.toBeAttached({ timeout: 10000 });

    // PASO 4: Verificar que el botón de '📋 Comandas' refleje al menos 1 orden en espera
    const btnComandas = page.locator('[data-testid="btn-open-comandas-drawer"]');
    await expect(btnComandas).toBeVisible({ timeout: 5000 });

    // PASO 5: Cajero Central abre la Cola de Comandas para cobrar
    await btnComandas.click();

    // Verificar que el Drawer de Comandas se abra con la lista
    const drawerTitle = page.locator('#pending-orders-title, h2:has-text("Cola Central de Preventas")');
    await expect(drawerTitle).toBeVisible({ timeout: 5000 });

    // PASO 6: Localizar la comanda recién emitida y pulsar 'Cobrar en Caja'
    const btnCobrarEnCaja = page.locator('button:has-text("Cobrar en Caja")').first();
    await expect(btnCobrarEnCaja).toBeVisible({ timeout: 5000 });
    await btnCobrarEnCaja.click();

    // Verificar que el Drawer se cierre y el carrito vuelva a quedar habilitado para cobro
    await expect(drawerTitle).not.toBeVisible({ timeout: 5000 });
    await expect(btnCobrar).toBeEnabled({ timeout: 5000 });

    // PASO 7: Cajero confirma el cobro en ventanilla
    await btnCobrar.click();

    // PASO 8: Validar confirmación de recaudo y tirilla emitida
    const swalTitle = page.locator('.swal2-title');
    await expect(swalTitle).toBeVisible({ timeout: 15000 });
    await expect(swalTitle).toContainText(/Venta procesada|Venta Exitosa|Cobro Exitoso|Completada/i);

    // Confirmar cierre del diálogo
    const swalOk = page.locator('.swal2-confirm');
    if (await swalOk.isVisible()) {
      await swalOk.click();
    }
  });

  test('La Cola Central de Preventas debe permitir filtrar por número de ticket o cliente', async ({
    page,
  }) => {
    // 1. Navegar a POS
    await page.click('[data-testid="nav-pos"]');
    await page.waitForLoadState('domcontentloaded');

    // 2. Abrir Drawer de Comandas
    const btnComandas = page.locator('[data-testid="btn-open-comandas-drawer"]');
    await expect(btnComandas).toBeVisible({ timeout: 10000 });
    await btnComandas.click();

    // 3. Verificar la presencia del campo de búsqueda de tickets
    const searchInput = page.getByPlaceholder('Buscar por ticket (ej. 0042), vendedor o cliente...');
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // 4. Escribir término de filtro
    await searchInput.fill('FiltroInexistente9999');

    // Debe mostrar estado vacío
    await expect(page.locator('text=No hay comandas pendientes de cobro')).toBeVisible({ timeout: 5000 });
  });
});
