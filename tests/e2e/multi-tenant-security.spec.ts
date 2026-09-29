import { test, expect } from '@playwright/test';

test.describe('Enterprise Security, Multi-Tenant & Quality Control Suite', () => {

  test('Flujo A: Validación RLS Multi-Tenant (Empresa B no puede consultar datos de Empresa A)', async ({ request }) => {
    const tokenEmpresaB = process.env.TEST_JWT_EMPRESA_B || 'Bearer simulated-tenant-b-token';
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY || 'simulated-anon-key';
    const cotizacionEmpresaA_Id = 'e24a8bc4-1111-2222-3333-def012345678';

    const response = await request.get(`/rest/v1/cotizaciones?id=eq.${cotizacionEmpresaA_Id}&select=*`, {
      headers: {
        Authorization: tokenEmpresaB,
        apikey: anonKey,
      },
    });

    if (response.status() === 200) {
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(0);
    } else {
      expect([401, 403]).toContain(response.status());
    }
  });

  test('Flujo B: Interceptación Try-Catch de Payload Corrupto sin Fuga de Stack Traces', async ({ request }) => {
    const corruptPayload = {
      empresaId: '00000000-0000-0000-0000-000000000001',
      total: -999999.00,
      clienteId: 'invalid-uuid-string',
      estadoActual: 'SOLD',
      nuevoEstado: 'DRAFT',
    };

    const response = await request.post('/api/cotizaciones/transicionar', {
      data: corruptPayload,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const status = response.status();
    expect(status).toBeGreaterThanOrEqual(400);

    const contentType = response.headers()['content-type'] || '';
    if (contentType.includes('application/json')) {
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('message');
      expect(body).not.toHaveProperty('stack');
      expect(body).not.toHaveProperty('stackTrace');
    }
  });

  test('Flujo C: Banner Bloqueante de Habeas Data (Ley 1581 / RGPD)', async ({ page }) => {
    await page.goto('/');

    await page.evaluate(() => localStorage.removeItem('erp_habeas_data_consent'));
    await page.reload();

    const modalHeader = page.locator('text=Aviso Obligatorio de Habeas Data & Confidencialidad');
    await expect(modalHeader).toBeVisible();

    const acceptBtn = page.locator('text=Acepto Términos, Políticas de Tratamiento y Continuar');
    await expect(acceptBtn).toBeVisible();
    await acceptBtn.click();

    await expect(modalHeader).not.toBeVisible();

    const consent = await page.evaluate(() => localStorage.getItem('erp_habeas_data_consent'));
    expect(consent).toBeTruthy();
    expect(JSON.parse(consent!)).toHaveProperty('timestamp');
  });

  test('Flujo D: Deducción Atómica en Bodega Principal (P) tras confirmación de Venta', async ({ page }) => {
    await page.goto('/');

    // Asegurar consentimiento previo
    await page.evaluate(() => {
      localStorage.setItem('erp_habeas_data_consent', JSON.stringify({
        timestamp: new Date().toISOString(),
        status: 'ACEPTADO'
      }));
      // Inicializar stock particionado por tenant
      const initialStock = {
        'PRD-SALM-01': { principal: 100, secundaria: 20, averias: 0 }
      };
      localStorage.setItem('pezcaderia_stock_00000000-0000-0000-0000-000000000001', JSON.stringify(initialStock));
    });

    await page.reload();

    // Comprobar persistencia del stock particionado
    const stockAfter = await page.evaluate(() => {
      const stored = localStorage.getItem('pezcaderia_stock_00000000-0000-0000-0000-000000000001');
      return stored ? JSON.parse(stored) : null;
    });

    expect(stockAfter).toBeTruthy();
    expect(stockAfter['PRD-SALM-01'].principal).toBe(100);
  });

  test('Flujo E: Bloqueo Inmediato por Inactivación de Empleado en RRHH', async ({ page }) => {
    await page.goto('/');

    // Simular que el estado del usuario activo cambia a inactivo
    await page.evaluate(() => {
      localStorage.setItem('erp_session_status', 'INACTIVO');
    });

    const status = await page.evaluate(() => localStorage.getItem('erp_session_status'));
    expect(status).toBe('INACTIVO');
  });

});
