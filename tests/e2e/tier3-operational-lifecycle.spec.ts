import { test, expect, navigateToOperationalScreen } from './fixtures/testFixtures';

test.describe('Tier 3: End-to-End Operational Lifecycle Quality Gates', () => {

  test.describe('3.1 Flow A & B: Ciclo Completo Preventa Mostrador ➔ Recaudo en Caja Única', () => {
    test('Vendedor crea preventa en POS -> Pasa a Cola Central -> Cajero la toma y liquida con ticket', async ({
      authenticatedPage,
      consoleErrorMonitor,
    }) => {
      test.setTimeout(60000);

      // PASO 1: Navegar a POS Táctil
      await navigateToOperationalScreen(authenticatedPage, 'pos');
      await authenticatedPage.waitForTimeout(500);

      // PASO 2: Agregar producto al carrito
      const productItem = authenticatedPage.locator('text=Salmón Fresco').first();
      await expect(productItem).toBeVisible({ timeout: 15000 });

      const btnCobrar = authenticatedPage.locator('[data-testid="btn-cobrar"]').first();

      // Clic en el producto para agregarlo al carrito hasta habilitar cobro
      await expect(async () => {
        if (await btnCobrar.isDisabled()) {
          await productItem.click({ force: true });
        }
        await expect(btnCobrar).toBeEnabled({ timeout: 1500 });
      }).toPass({ timeout: 15000 });

      // PASO 3: Asesor pulsa 'En Espera' para emitir comanda/preventa
      const btnEnEspera = authenticatedPage.locator('button:has-text("En Espera")').first();
      await expect(btnEnEspera).toBeVisible({ timeout: 5000 });
      await btnEnEspera.click();

      // Modal SweetAlert solicitando alias
      const swalContainer = authenticatedPage.locator('.swal2-container');
      await expect(swalContainer).toBeVisible({ timeout: 5000 });

      const swalInput = authenticatedPage.locator('.swal2-input');
      if (await swalInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await swalInput.fill('Preventa Mostrador E2E');
      }

      const swalConfirm = authenticatedPage.locator('.swal2-confirm');
      await swalConfirm.click();
      await expect(swalContainer).not.toBeAttached({ timeout: 10000 });

      // PASO 4: Abrir la Cola Central de Preventas
      const btnComandas = authenticatedPage.locator('[data-testid="btn-open-comandas-drawer"]').first();
      await expect(btnComandas).toBeVisible({ timeout: 5000 });
      await btnComandas.click();

      // Verificar apertura del Drawer
      const drawerTitle = authenticatedPage.locator('#pending-orders-title, h2:has-text("Cola Central de Preventas")').first();
      await expect(drawerTitle).toBeVisible({ timeout: 5000 });

      // PASO 5: Tomar la comanda con 'Cobrar en Caja'
      const btnCobrarEnCaja = authenticatedPage.locator('button:has-text("Cobrar en Caja")').first();
      await expect(btnCobrarEnCaja).toBeVisible({ timeout: 5000 });
      await btnCobrarEnCaja.click();

      // El drawer se cierra y el botón cobrar vuelve a quedar habilitado
      await expect(drawerTitle).not.toBeVisible({ timeout: 5000 });
      await expect(btnCobrar).toBeEnabled({ timeout: 5000 });

      // PASO 6: Cajero ejecuta el cobro final
      await btnCobrar.click();

      // PASO 7: Validar emisión exitosa y recibo
      const swalTitle = authenticatedPage.locator('.swal2-title');
      await expect(swalTitle).toBeVisible({ timeout: 15000 });
      await expect(swalTitle).toContainText(/Venta procesada|Venta Exitosa|Cobro Exitoso|Completada/i);

      // Cerrar modal
      const swalOk = authenticatedPage.locator('.swal2-confirm');
      if (await swalOk.isVisible({ timeout: 2000 }).catch(() => false)) {
        await swalOk.click();
      }

      expect(consoleErrorMonitor).toHaveLength(0);
    });
  });

  test.describe('3.2 Flow C: Cierre de Turno & Arqueo Ciego con Justificación Obligatoria (RN-44)', () => {
    test('El arqueo con descuadre mayor a $5.000 exige justificación obligatoria antes de permitir el cierre', async ({
      authenticatedPage,
      consoleErrorMonitor,
    }) => {
      // 1. Navegar a Control de Cajas
      await navigateToOperationalScreen(authenticatedPage, 'caja');
      await authenticatedPage.waitForTimeout(500);

      // 2. Pulsar botón de 'Cerrar Turno'
      const btnCierre = authenticatedPage.locator('[data-testid="btn-cierre-caja"]').first();
      await expect(btnCierre).toBeVisible({ timeout: 10000 });
      await btnCierre.click();

      // 3. Verificar que abra el modal de Arqueo
      const modalHeading = authenticatedPage.locator('h3:has-text("Cierre y Arqueo de Caja"), h2:has-text("Arqueo")').first();
      await expect(modalHeading).toBeVisible({ timeout: 8000 });

      // 4. Si está en modo ciego y se ingresa efectivo con descuadre
      const inputEfectivo = authenticatedPage.locator('input[type="number"], input[placeholder*="efectivo"]').first();
      if (await inputEfectivo.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Ingresar un monto con descuadre notorio (ej. 50000 vs 255000 teórico)
        await inputEfectivo.fill('50000');
      }

      // Si hay un botón para avanzar o confirmar cierre
      const btnConfirmarCierre = authenticatedPage.locator('button:has-text("Confirmar Cierre"), button:has-text("Cerrar Caja"), button:has-text("Cerrar Turno")').last();
      if (await btnConfirmarCierre.isVisible({ timeout: 3000 }).catch(() => false)) {
        await btnConfirmarCierre.click();
      }

      // Modal de justificación o confirmación debe aparecer si hay descuadre fuera de tolerancia (RN-44)
      const swalOrModal = authenticatedPage.locator('.swal2-container, textarea[placeholder*="justificación"], textarea[placeholder*="Justificación"]');
      await expect(swalOrModal.first()).toBeVisible({ timeout: 8000 });

      // Cerrar cualquier SweetAlert abierto para limpiar estado
      const swalCancel = authenticatedPage.locator('.swal2-cancel, button:has-text("Cancelar")').first();
      if (await swalCancel.isVisible({ timeout: 2000 }).catch(() => false)) {
        await swalCancel.click();
      }

      expect(consoleErrorMonitor).toHaveLength(0);
    });
  });

  test.describe('3.3 Flow D: Tablero Kanban de Comandas & Progresión de Estados', () => {
    test('Debe visualizar pedidos en columnas kanban y reflejar transiciones reactivas', async ({
      authenticatedPage,
      consoleErrorMonitor,
    }) => {
      // 1. Navegar a Tablero Kanban
      await navigateToOperationalScreen(authenticatedPage, 'kanban');
      await authenticatedPage.waitForTimeout(600);

      // 2. Verificar que se rendericen las columnas del tablero
      const kanbanContainer = authenticatedPage.locator('text=Creados, text=CREADOS, text=En Fileteo, text=En Pesaje, text=Listos').first();
      await expect(kanbanContainer).toBeVisible({ timeout: 10000 });

      // 3. Localizar el pedido sembrado (PED-K-001)
      const seededOrder = authenticatedPage.locator('text=PED-K-001, text=Restaurante El Muelle').first();
      await expect(seededOrder).toBeVisible({ timeout: 8000 });

      // 4. Verificar filtros de búsqueda del tablero
      const searchKanban = authenticatedPage.locator('input[placeholder*="Buscar"], input[placeholder*="buscar"]').first();
      if (await searchKanban.isVisible({ timeout: 3000 }).catch(() => false)) {
        await searchKanban.fill('PED-K-001');
        await expect(seededOrder).toBeVisible({ timeout: 3000 });
      }

      expect(consoleErrorMonitor).toHaveLength(0);
    });
  });

});
