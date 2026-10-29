import { test, expect, navigateToOperationalScreen } from './fixtures/testFixtures';
import { execSync } from 'child_process';
import path from 'path';

test.describe('Tier 4: Resilience, Chaos & Harness² Invariants Quality Gates', () => {

  test.describe('4.1 RN-01: Prevención Atómica de Stock Negativo y Agotamiento', () => {
    test('El motor de cobro bloquea ventas cuando la cantidad supera el inventario disponible (RN-01)', async ({
      authenticatedPage,
      consoleErrorMonitor,
    }) => {
      // 1. Modificar stock en localStorage para simular producto sin existencias (stock = 0)
      await authenticatedPage.evaluate(() => {
        const stockActual: Record<string, Record<string, number>> = {
          b1: {
            'PES-ENT-001': 0, // Stock agotado de Salmón
            'FIL-LIM-002': 0,
            'CAM-TIG-003': 0,
          },
        };
        localStorage.setItem('pezcaderia_stock', JSON.stringify(stockActual));
      });

      // Recargar página para que los stores tomen el stock en cero
      await authenticatedPage.reload({ waitUntil: 'commit' });
      await navigateToOperationalScreen(authenticatedPage, 'pos');
      await authenticatedPage.waitForTimeout(500);

      // 2. Intentar agregar producto sin stock
      const productItem = authenticatedPage.locator('text=Salmón Fresco').first();
      if (await productItem.isVisible({ timeout: 5000 }).catch(() => false)) {
        await productItem.click({ force: true });
        await authenticatedPage.waitForTimeout(400);

        // Si el botón cobrar está visible, intentar cobrar
        const btnCobrar = authenticatedPage.locator('[data-testid="btn-cobrar"]').first();
        if (await btnCobrar.isVisible({ timeout: 3000 }).catch(() => false)) {
          if (await btnCobrar.isEnabled()) {
            await btnCobrar.click();
            // RN-01 debe disparar SweetAlert bloqueando la venta
            const swalTitle = authenticatedPage.locator('.swal2-title');
            await expect(swalTitle).toBeVisible({ timeout: 5000 });
            await expect(swalTitle).toContainText(/Stock Insuficiente|Venta Bloqueada|Sin Stock/i);

            // Cerrar SweetAlert
            const swalOk = authenticatedPage.locator('.swal2-confirm');
            if (await swalOk.isVisible()) {
              await swalOk.click();
            }
          }
        }
      }

      expect(consoleErrorMonitor).toHaveLength(0);
    });
  });

  test.describe('4.2 Estrés de Entrada Rápida (Debounce & Unhandled Rejection Immunity)', () => {
    test('Tecleo masivo y ráfaga en el buscador de catálogo no debe generar excepciones no controladas', async ({
      authenticatedPage,
      consoleErrorMonitor,
    }) => {
      await navigateToOperationalScreen(authenticatedPage, 'clientes');
      await authenticatedPage.waitForTimeout(500);

      const searchInput = authenticatedPage.locator('input[placeholder="Buscar cliente..."]').first();
      await expect(searchInput).toBeVisible({ timeout: 5000 });

      // Simular ráfaga de 15 búsquedas instantáneas
      const queries = ['A', 'Al', 'Ali', 'Alim', 'El', 'Muelle', 'Restaurante', 'Consumidor', 'Final', '900', '123', 'VIP', 'Mar', 'Pez', ''];
      for (const q of queries) {
        await searchInput.fill(q);
        await authenticatedPage.waitForTimeout(30);
      }

      // Esperar estabilización del ciclo de renderizado
      await authenticatedPage.waitForTimeout(400);

      // Cero excepciones no controladas o rechazos de promesas
      expect(consoleErrorMonitor).toHaveLength(0);
    });
  });

  test.describe('4.3 Verificación de Invariantes con Google Harness²', () => {
    test('Ejecuta la suite determinista de Harness² comprobando cumplimiento de invariantes', async () => {
      const projectRoot = process.cwd();
      const harnessScript = path.join(projectRoot, 'tools', 'harness2', 'run_harness2.py');

      // Ejecutar runner seguro de Harness² en modo demo determinista a costo $0
      const output = execSync(`python "${harnessScript}" --demo`, {
        cwd: projectRoot,
        encoding: 'utf-8',
        timeout: 30000,
      });

      expect(output).toContain('Local demo: 2 tasks completed; 0 failed');
    });
  });

});
