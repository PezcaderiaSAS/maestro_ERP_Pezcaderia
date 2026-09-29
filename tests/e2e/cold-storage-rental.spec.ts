import { test, expect } from '@playwright/test';

test.describe('E2E Alquiler de Cuarto Frío y Custodia WMS 3PL', () => {
  test.beforeEach(async ({ page }) => {
    // Aceptar consentimiento de Habeas Data para evitar modales bloqueantes
    await page.addInitScript(() => {
      localStorage.setItem('erp_habeas_data_consent', 'true');
    });
  });

  test('1. Navegación al módulo de Alquiler de Cuarto Frío desde la Barra Lateral', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();

    // Localizar y hacer clic en el botón de menú lateral
    const navCuartoFrio = page.locator('[data-testid="nav-alquiler-cf"]');
    await expect(navCuartoFrio).toBeVisible();
    await navCuartoFrio.click();

    // Validar encabezado y título principal del módulo
    const titulo = page.getByRole('heading', { name: /Alquiler de Cuarto Frío y Custodia 3PL/i });
    await expect(titulo).toBeVisible();

    // Validar badge de capacidad nominal
    await expect(page.getByText('800 Kg / Posición')).toBeVisible();
  });

  test('2. Verificación de Pestañas y Métricas de Capacidad en el Dashboard', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="nav-alquiler-cf"]').click();

    // Verificar las 6 pestañas
    await expect(page.getByRole('button', { name: /Dashboard & Capacidad/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Contratos de Alquiler/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Clientes & Catálogo 3PL/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Báscula & Movimientos/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Existencias en Custodia/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Causación Contable \(4155\)/i })).toBeVisible();

    // Verificar tarjetas KPI del Dashboard
    await expect(page.getByText(/Capacidad Total Cuartos/i)).toBeVisible();
    await expect(page.getByText(/Posiciones Contratadas/i)).toBeVisible();
    await expect(page.getByText(/Kilos Reales en Custodia/i)).toBeVisible();
    await expect(page.getByText(/Ingresos Acumulados \(4155\)/i)).toBeVisible();
  });

  test('3. Modal de Registro de Contrato: Regla de 800 Kg por Posición y Fechas', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="nav-alquiler-cf"]').click();

    // Abrir modal de nuevo contrato
    const btnNuevoContrato = page.getByRole('button', { name: /Nuevo Contrato/i }).first();
    await btnNuevoContrato.click();

    // Validar presencia del modal
    await expect(page.getByText('Nuevo Contrato de Alquiler de Cuarto Frío')).toBeVisible();

    // Verificar campo de posiciones y cálculo en tiempo real
    const inputPosiciones = page.locator('input[type="number"]').first();
    await expect(inputPosiciones).toBeVisible();
    await inputPosiciones.fill('3');

    // Debe mostrar la capacidad asegurada (3 * 800 = 2400 Kg)
    await expect(page.getByText(/2400 Kg asegurados/i)).toBeVisible();

    // Cerrar modal
    await page.getByRole('button', { name: /Cancelar/i }).click();
    await expect(page.getByText('Nuevo Contrato de Alquiler de Cuarto Frío')).not.toBeVisible();
  });

  test('4. Operación de Báscula: Verificación de Pesaje Bruto, Tara y Neto', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="nav-alquiler-cf"]').click();

    // Abrir modal de recepción de báscula
    const btnRecepcion = page.getByRole('button', { name: /Recepción Báscula \(Entrada\)/i }).first();
    await btnRecepcion.click();

    await expect(page.getByText(/Operación de Báscula: Recepción \/ Ingreso en Custodia/i)).toBeVisible();

    // Localizar inputs de peso bruto y tara
    const pesoBrutoInput = page.locator('input[type="number"]').nth(2); // Bruto
    const pesoTaraInput = page.locator('input[type="number"]').nth(3); // Tara

    await pesoBrutoInput.fill('850');
    await pesoTaraInput.fill('50');

    // Verificar cálculo automático del neto (850 - 50 = 800.00 Kg)
    await expect(page.getByText('800.00 Kg')).toBeVisible();

    // Cerrar modal
    await page.getByRole('button', { name: /Cancelar/i }).click();
  });

  test('5. Existencias en Custodia: Aislamiento Contable y Certificado Oficial', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="nav-alquiler-cf"]').click();

    // Cambiar a la pestaña Existencias en Custodia
    await page.getByRole('button', { name: /Existencias en Custodia/i }).click();

    // Validar encabezado de aislamiento
    await expect(page.getByText(/Inventario de Terceros en Custodia \(Aislado de Cuenta 1435\)/i)).toBeVisible();

    // Validar presencia del botón de emisión del Certificado Oficial PDF
    const btnCertificado = page.getByRole('button', { name: /Certificado Oficial PDF/i });
    await expect(btnCertificado).toBeVisible();
  });

  test('6. Transición a Causación Contable (Cuenta 4155)', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="nav-alquiler-cf"]').click();

    // Cambiar a la pestaña de Causación Contable
    await page.getByRole('button', { name: /Causación Contable \(4155\)/i }).click();

    // Validar columnas contables
    await expect(page.getByText(/Causaciones Contables de Almacenamiento/i)).toBeVisible();
    await expect(page.getByText('Subtotal (4155)')).toBeVisible();
    await expect(page.getByText('IVA 19% (2408)')).toBeVisible();
    await expect(page.getByText('Total a Cobrar (1305)')).toBeVisible();
  });
});
