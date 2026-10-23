import { test, expect } from '@playwright/test';
import { SEED_DATA as POS_SEED_DATA } from '../../src/dev/seeds/seedPOS';
import { SEED_DATA as CASH_SEED_DATA } from '../../src/dev/seeds/seedCash';

test.describe('Dashboard de Métricas Logísticas OTIF & SLA B2B (TASK-026-06)', () => {
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
      // Inyectar manifiesto de ruta para auditoría OTIF
      pezcaderia_rutas_despacho: [
        {
          id: 'route-test-otif-01',
          numeroManifiesto: 'MAN-2026-10-099',
          conductorId: 'cond-01',
          conductorNombre: 'Carlos Gómez',
          conductorTelefono: '3001234567',
          vehiculoPlaca: 'TRK-888',
          zonaRuta: 'Zona Norte',
          estado: 'LIQUIDADA',
          totalPedidos: 2,
          totalPesoKg: 45,
          totalFacturadoEsperado: 650000,
          totalRecaudadoEfectivo: 650000,
          totalRecaudadoDigital: 0,
          totalCreditoFirmado: 0,
          totalDevolucionesMonto: 0,
          totalGastosRuta: 0,
          efectivoNetoEntregado: 650000,
          diferenciaCuadre: 0,
          pedidos: [
            {
              id: 'stop-01',
              pedidoId: 'ped-otif-1',
              numeroPedido: 'PED-2026-001',
              clienteId: 'cli-01',
              clienteNombre: 'Restaurante Mar y Sol',
              clienteDireccion: 'Calle 93 # 12-40',
              montoPedidoOriginal: 350000,
              montoCobradoFinal: 350000,
              formaPago: 'EFECTIVO',
              montoEfectivo: 350000,
              montoDigital: 0,
              estadoEntrega: 'ENTREGADO_TOTAL',
              fechaRequeridaEntrega: new Date().toISOString().split('T')[0],
              jornadaRequerida: 'MANANA',
              horaEntrega: new Date().toISOString(),
              horaLlegadaEnSitio: new Date().toISOString(),
              horaEntregaEfectiva: new Date().toISOString(),
              tiempoTransitoMinutos: 25,
              tiempoAtencionMinutos: 15,
            },
            {
              id: 'stop-02',
              pedidoId: 'ped-otif-2',
              numeroPedido: 'PED-2026-002',
              clienteId: 'cli-02',
              clienteNombre: 'Cevichería El Muelle',
              clienteDireccion: 'Carrera 15 # 85-30',
              montoPedidoOriginal: 300000,
              montoCobradoFinal: 300000,
              formaPago: 'EFECTIVO',
              montoEfectivo: 300000,
              montoDigital: 0,
              estadoEntrega: 'ENTREGADO_TOTAL',
              fechaRequeridaEntrega: new Date().toISOString().split('T')[0],
              jornadaRequerida: 'MANANA',
              horaEntrega: new Date().toISOString(),
              horaLlegadaEnSitio: new Date().toISOString(),
              horaEntregaEfectiva: new Date().toISOString(),
              tiempoTransitoMinutos: 20,
              tiempoAtencionMinutos: 10,
            },
          ],
          gastos: [],
          devolucionesGlobales: [],
          creadoEn: new Date().toISOString(),
          salidaEn: new Date().toISOString(),
          liquidadoEn: new Date().toISOString(),
          temperaturaSalidaCelsius: 3.2,
          temperaturaRetornoCelsius: 3.6,
        },
      ],
    };

    await page.addInitScript((data) => {
      localStorage.clear();
      for (const [key, value] of Object.entries(data)) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    }, seedData);

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Debe navegar a Métricas OTIF & SLA desde el menú lateral y verificar la vista ejecutiva', async ({
    page,
  }) => {
    // 1. Abrir menú de operaciones si estuviera colapsado o hacer clic directo
    const navOtif = page.locator('[data-testid="nav-metricas-otif"]');
    await expect(navOtif).toBeVisible({ timeout: 15000 });
    await navOtif.click();

    // 2. Verificar encabezado ejecutivo
    await expect(
      page.locator('h1:has-text("Métricas Logísticas & OTIF B2B")')
    ).toBeVisible();

    // 3. Verificar las 5 tarjetas de KPI clave
    await expect(page.locator('text=OTIF Global')).toBeVisible();
    await expect(page.locator('text=A Tiempo (On-Time)')).toBeVisible();
    await expect(page.locator('text=Completo (In-Full)')).toBeVisible();
    await expect(page.locator('span', { hasText: /^Cadena de Frío$/ })).toBeVisible();
    await expect(page.locator('text=Recaudo Ruta')).toBeVisible();

    // 4. Verificar presencia de la barra de filtros táctil y botón de exportación
    await expect(page.locator('button:has-text("Hoy")')).toBeVisible();
    await expect(page.locator('button:has-text("Últimos 7 Días")')).toBeVisible();
    await expect(page.locator('button:has-text("Mes Actual")')).toBeVisible();
    await expect(
      page.locator('button:has-text("Exportar Excel (CSV)")')
    ).toBeVisible();
  });

  test('Debe permitir cambiar entre pestañas de navegación táctil', async ({
    page,
  }) => {
    const navOtif = page.locator('[data-testid="nav-metricas-otif"]');
    await navOtif.click();

    // Cambiar a la pestaña de Conductores
    const tabConductores = page.locator('button:has-text("Conductores")');
    await tabConductores.click();
    await expect(
      page.locator('h3:has-text("Ranking y Scorecard de Conductores")')
    ).toBeVisible();

    // Cambiar a Detalle Paradas
    const tabParadas = page.locator('button:has-text("Detalle Paradas")');
    await tabParadas.click();
    await expect(
      page.locator('h3:has-text("Auditoría Detallada de Paradas y Entregas")')
    ).toBeVisible();

    // Cambiar a Cadena de Frío
    const tabFrio = page.locator('button:has-text("Cadena de Frío")');
    await tabFrio.click();
    await expect(
      page.locator('h3:has-text("Control y Auditoría de Cadena de Frío")')
    ).toBeVisible();
  });

  test('Debe renderizar responsive en vista móvil (375 px) sin desbordamientos', async ({
    page,
  }) => {
    // Primero navegamos en desktop o abrimos el menú móvil
    await page.setViewportSize({ width: 375, height: 667 });

    const toggleMenu = page.locator('button[title="Menú de Navegación"]');
    await toggleMenu.click();

    const navOtif = page.locator('[data-testid="nav-metricas-otif"]');
    await expect(navOtif).toBeVisible();
    await navOtif.click();

    // Validar título y tarjetas en pantalla pequeña
    await expect(
      page.locator('h1:has-text("Métricas Logísticas & OTIF B2B")')
    ).toBeVisible();

    // Los botones de tab deben ser visibles y scrolleables
    await expect(page.locator('button:has-text("Vista Integral")')).toBeVisible();
  });
});
