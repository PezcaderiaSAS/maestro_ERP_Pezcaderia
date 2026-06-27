import { test, expect } from '@playwright/test';
import { SEED_DATA as CASH_SEED_DATA } from '../../src/dev/seeds/seedCash';

test.describe('Caja - Flujo de Egresos, Traslados y Arqueo (FASE 7)', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Inyectar SEED_DATA de seedCash.ts (turno ya abierto para caja menor y caja fuerte)
    await page.evaluate((seedData) => {
      for (const [key, value] of Object.entries(seedData)) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    }, CASH_SEED_DATA);
    await page.reload();
    await page.click('[data-testid="nav-caja"]');
  });

  test('Debe registrar un egreso rápido correctamente', async ({ page }) => {
    // 1. Clic en botón de registrar egreso
    await page.click('[data-testid="btn-egreso-rapido"]');

    // 2. Esperar que SweetAlert aparezca y llenar datos
    await expect(page.locator('.swal2-popup')).toBeVisible();
    await page.selectOption('#swal-metodo', 'EFECTIVO');
    await page.fill('#swal-monto', '15000');
    await page.fill('#swal-concepto', 'Compra de papelería');

    // 3. Confirmar
    await page.click('.swal2-confirm');

    // 4. Validar mensaje de éxito
    await expect(page.locator('.swal2-title')).toHaveText(/Éxito/i);
    await expect(page.locator('.swal2-popup')).toBeHidden({ timeout: 3000 });

    // 5. Validar estado en localStorage
    const movimientosStr = await page.evaluate(() => localStorage.getItem('pezcaderia_movimientos_caja'));
    const movimientos = JSON.parse(movimientosStr || '[]');
    // Seed already had 3 movs, so now it should have 4
    expect(movimientos.length).toBeGreaterThan(3);
    const lastMov = movimientos[movimientos.length - 1];
    expect(lastMov.monto).toBe(15000);
    expect(lastMov.concepto).toBe('Compra de papelería');
    expect(lastMov.tipo).toBe('EGRESO_GASTO');
  });

  test('Debe realizar un traslado de dinero correctamente a otra caja abierta', async ({ page }) => {
    // 1. Clic en botón de trasladar dinero
    await page.click('[data-testid="btn-traslado-dinero"]');

    // 2. Esperar modal de traslado
    const modalTitle = page.locator('h2', { hasText: 'Traslado de Dinero' });
    await expect(modalTitle).toBeVisible();

    // 3. Llenar formulario
    await page.selectOption('[data-testid="select-metodo-traslado"]', 'EFECTIVO');
    
    // Select the destination box (caja-fuerte-test)
    await page.selectOption('[data-testid="select-caja-destino"]', 'caja-fuerte-test');
    
    await page.fill('[data-testid="input-monto-traslado"]', '100000');
    await page.fill('[data-testid="input-concepto-traslado"]', 'Remesa a caja fuerte');

    // 4. Procesar
    await page.click('[data-testid="btn-procesar-traslado"]');

    // 5. Confirmar en SweetAlert
    await expect(page.locator('.swal2-title')).toHaveText(/¿Confirmar traslado?/i);
    await page.click('.swal2-confirm');

    // 6. Validar mensaje de éxito
    await expect(page.locator('.swal2-title')).toHaveText(/¡Traslado Exitoso!/i);
    await expect(page.locator('.swal2-popup')).toBeHidden({ timeout: 3000 });

    // 7. Validar estado en localStorage
    const trasladosStr = await page.evaluate(() => localStorage.getItem('pezcaderia_traslados_dinero'));
    const traslados = JSON.parse(trasladosStr || '[]');
    expect(traslados.length).toBe(1);
    expect(traslados[0].monto).toBe(100000);
    expect(traslados[0].cajaOrigenId).toBe('caja-cash-test');
    expect(traslados[0].cajaDestinoId).toBe('caja-fuerte-test');

    const turnosStr = await page.evaluate(() => localStorage.getItem('pezcaderia_turnos_caja'));
    const turnos = JSON.parse(turnosStr || '[]');
    const turnoOrigen = turnos.find((t: any) => t.cajaId === 'caja-cash-test');
    const turnoDestino = turnos.find((t: any) => t.cajaId === 'caja-fuerte-test');

    // Check balance deductions/additions if needed (optional depending on how cashService is mocked/works)
    expect(turnoOrigen.totalEfectivo).toBe(255000 - 100000);
    expect(turnoDestino.totalEfectivo).toBe(1000000 + 100000);
  });

  test('Debe requerir justificación obligatoria (RN-44) si el arqueo tiene descuadre', async ({ page }) => {
    // 1. Iniciar cierre de caja
    await page.click('[data-testid="btn-cierre-caja"]');

    // 2. Esperar modal de arqueo
    await expect(page.locator('h2', { hasText: 'Arqueo y Cierre de Caja' })).toBeVisible();

    // 3. Ingresar un valor de efectivo con diferencia (saldo real esperado es 255000, ingresamos 250000 -> -5000)
    await page.fill('[data-testid="input-efectivo-arqueo"]', '250000');

    // 4. Intentar confirmar sin justificación
    await page.click('[data-testid="btn-confirmar-arqueo"]');

    // 5. Validar que SweetAlert pide justificación
    await expect(page.locator('.swal2-title')).toHaveText(/Error/i);
    await expect(page.locator('.swal2-html-container')).toContainText(/Debe justificar/i);
    await page.click('.swal2-confirm'); // Cerrar error

    // 6. Ingresar justificación
    await page.fill('[data-testid="input-justificacion-arqueo"]', 'Se detectó faltante de un billete falso reportado a gerencia');

    // 7. Confirmar de nuevo
    await page.click('[data-testid="btn-confirmar-arqueo"]');

    // 8. Confirmar advertencia final
    await expect(page.locator('.swal2-title')).toHaveText(/¿Confirmar Arqueo y Cierre?/i);
    await page.click('.swal2-confirm');

    // 9. Validar éxito
    await expect(page.locator('.swal2-title')).toHaveText(/¡Caja Cerrada!/i);
    await expect(page.locator('.swal2-popup')).toBeHidden({ timeout: 3000 });

    // 10. Validar localStorage turno CERRADO y diferencia guardada
    const turnosStr = await page.evaluate(() => localStorage.getItem('pezcaderia_turnos_caja'));
    const turnos = JSON.parse(turnosStr || '[]');
    const turnoCerrado = turnos.find((t: any) => t.cajaId === 'caja-cash-test');
    
    expect(turnoCerrado.estado).toBe('CERRADO');
    expect(turnoCerrado.diferenciaEfectivo).toBe(-5000);
    expect(turnoCerrado.justificacion).toBe('Se detectó faltante de un billete falso reportado a gerencia');
  });

});
