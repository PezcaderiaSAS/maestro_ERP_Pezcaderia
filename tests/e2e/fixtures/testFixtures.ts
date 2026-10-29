import { test as base, expect, Page } from '@playwright/test';
import { SEED_DATA as POS_SEED_DATA } from '../../../src/dev/seeds/seedPOS';
import { SEED_DATA as CASH_SEED_DATA } from '../../../src/dev/seeds/seedCash';

export interface CustomFixtures {
  authenticatedPage: Page;
  consoleErrorMonitor: string[];
}

export const BASE_SEED_DATA: Record<string, unknown> = {
  ...POS_SEED_DATA,
  ...CASH_SEED_DATA,
  pezcaderia_auth_session: {
    status: 'authenticated',
    currentUser: {
      id: 'usr-admin-01',
      email: 'admin.dueno@pezcaderia.com',
      nombre: 'Don Fernando',
      rol: 'admin',
      activo: true,
      authProvider: 'mock',
    },
    activeTenant: {
      id: 'tenant-01',
      razonSocial: 'La Pezcadería S.A.S.',
      nit: '900123456-1',
      ciudad: 'Bogotá',
      activo: true,
    },
  },
  erp_habeas_data_consent: {
    timestamp: new Date().toISOString(),
    regulation: 'Ley 1581 de 2012 (Colombia) / RGPD',
    version: '1.0.0-enterprise',
    status: 'ACEPTADO',
  },
  pezcaderia_role: 'admin',
  pezcaderia_currentUser: {
    id: 'usr-admin-01',
    empleadoId: 'usr-admin-01',
    nombre: 'Don Fernando',
    rol: 'admin',
    activo: true,
  },
  pezcaderia_bodegas: [
    { id: 'b1', nombre: 'Bodega Principal', activa: true },
  ],
  pezcaderia_cajas: [
    { id: 'caja-test-menor', bodegaId: 'b1', nombre: 'Caja Menor - Bodega Principal', activa: true, tipo: 'MENOR' },
    { id: 'caja-test-mayor', bodegaId: 'b1', nombre: 'Caja Fuerte', activa: true, tipo: 'MAYOR' },
  ],
  pezcaderia_turnos_caja: [
    {
      id: 'trn-test-01',
      cajaId: 'caja-test-menor',
      cajeroId: 'usr-admin-01',
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
      justificacion: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin',
    },
  ],
  pezcaderia_stock: {
    b1: {
      'PES-ENT-001': 25,
      'FIL-LIM-002': 18,
      'CAM-TIG-003': 12,
    },
  },
  pezcaderia_pos_drafts_v1: [],
  pezcaderia_quotations: [
    {
      id: 'quote-k-1',
      numeroPedido: 'PED-K-001',
      clienteId: 'cli-consumidor-final',
      clientName: 'Restaurante El Muelle',
      cliente: 'Restaurante El Muelle',
      total: 400000,
      totalFinal: 400000,
      estado: 'CREADO',
      fecha: new Date().toISOString(),
      lineas: [
        { id: 'l-1', nombre: 'Salmón Fresco', cantidadSolicitada: 10, precioPactado: 40000 },
      ],
    },
  ],
  pezcaderia_ventas: [],
};

export const test = base.extend<CustomFixtures>({
  consoleErrorMonitor: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore known harmless network tracking failures in offline test environments
        if (
          !text.includes('sentry') &&
          !text.includes('logrocket') &&
          !text.includes('favicon.ico')
        ) {
          errors.push(text);
        }
      }
    });
    page.on('pageerror', (err) => {
      const message = err.message || String(err);
      if (
        !message.includes('sentry') &&
        !message.includes('logrocket')
      ) {
        errors.push(message);
      }
    });

    await use(errors);
  },

  authenticatedPage: async ({ page, consoleErrorMonitor }, use) => {
    // 1. Inyectar datos semilla antes de que la aplicación monte el DOM
    await page.addInitScript((seed) => {
      try {
        for (const [key, value] of Object.entries(seed)) {
          localStorage.setItem(key, JSON.stringify(value));
        }
      } catch (e) {
        console.warn('Error in addInitScript seed injection:', e);
      }
    }, BASE_SEED_DATA);

    // 2. Establecer Viewport de escritorio por defecto
    await page.setViewportSize({ width: 1366, height: 768 });

    // 3. Navegar a la raíz con commit para evitar cuelgues por fuentes remotas offline
    await page.goto('/', { waitUntil: 'commit' });

    // Asegurar que localStorage esté sembrado directamente en el origen activo
    await page.evaluate((seed) => {
      for (const [key, value] of Object.entries(seed)) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    }, BASE_SEED_DATA);

    // 4. Esperar que la aplicación monte el shell principal (main o header o aside)
    const shell = page.locator('main, header, aside, #enterprise-sidebar');
    const isShellVisible = await shell.first().isVisible({ timeout: 4000 }).catch(() => false);
    if (!isShellVisible) {
      await page.reload({ waitUntil: 'commit' });
    }
    await expect(shell.first()).toBeVisible({ timeout: 15000 });

    await use(page);
  },
});

/**
 * Abre la barra lateral en móvil si está colapsada.
 */
async function ensureSidebarOpen(page: Page): Promise<void> {
  const isAsideVisible = await page.locator('aside#enterprise-sidebar').isVisible().catch(() => false);
  if (!isAsideVisible) {
    const hamburger = page.locator('button[aria-label="Menú de Navegación"], header button').first();
    if (await hamburger.isVisible({ timeout: 1500 }).catch(() => false)) {
      await hamburger.click();
      await page.waitForTimeout(300);
    }
  }
}

/**
 * Helper de navegación rápida entre las 4 pantallas operativas clave.
 */
export async function navigateToOperationalScreen(
  page: Page,
  screen: 'pos' | 'caja' | 'kanban' | 'clientes' | 'inventario'
): Promise<void> {
  await ensureSidebarOpen(page);

  switch (screen) {
    case 'pos': {
      const navPos = page.locator('[data-testid="nav-pos"]');
      if (await navPos.isVisible({ timeout: 3000 }).catch(() => false)) {
        await navPos.click();
      } else {
        await page.goto('/#/pos');
      }
      await page.waitForTimeout(300);
      break;
    }
    case 'caja': {
      const navCaja = page.locator('[data-testid="nav-caja"]');
      if (await navCaja.isVisible({ timeout: 3000 }).catch(() => false)) {
        await navCaja.click();
      } else {
        await page.goto('/#/caja');
      }
      await page.waitForTimeout(300);
      break;
    }
    case 'clientes': {
      const navClientes = page.locator('[data-testid="nav-clientes"]');
      if (await navClientes.isVisible({ timeout: 3000 }).catch(() => false)) {
        await navClientes.click();
      } else {
        await page.goto('/#/clientes');
      }
      await page.waitForTimeout(300);
      break;
    }
    case 'inventario': {
      const navInv = page.locator('[data-testid="nav-inventario"]');
      if (await navInv.isVisible({ timeout: 3000 }).catch(() => false)) {
        await navInv.click();
      } else {
        await page.goto('/#/inventario');
      }
      await page.waitForTimeout(300);
      break;
    }
    case 'kanban': {
      // Intenta vía nav-kanban o a través de sub-pestaña Kanban en POS
      const navKanban = page.locator('[data-testid="nav-kanban"]');
      if (await navKanban.isVisible({ timeout: 2000 }).catch(() => false)) {
        await navKanban.click();
      } else {
        // En POS, el botón de sub-pestaña 'Kanban' abre OrderKanbanView
        await navigateToOperationalScreen(page, 'pos');
        const posKanbanBtn = page.locator('button:has-text("Kanban")').first();
        if (await posKanbanBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
          await posKanbanBtn.click();
        }
      }
      await page.waitForTimeout(300);
      break;
    }
  }
}

/**
 * Helper para verificar ausencia de desbordamiento horizontal en el viewport actual.
 */
export async function assertNoHorizontalOverflow(page: Page, tolerance = 2): Promise<{
  scrollWidth: number;
  clientWidth: number;
  hasOverflow: boolean;
}> {
  const result = await page.evaluate(() => {
    const docEl = document.documentElement;
    const body = document.body;
    const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
    const clientWidth = Math.max(docEl.clientWidth, body.clientWidth);
    return {
      scrollWidth,
      clientWidth,
      hasOverflow: scrollWidth > clientWidth,
    };
  });

  expect(
    result.scrollWidth,
    `Desbordamiento horizontal detectado: scrollWidth (${result.scrollWidth}px) > clientWidth (${result.clientWidth}px) + tolerancia (${tolerance}px)`
  ).toBeLessThanOrEqual(result.clientWidth + tolerance);

  return result;
}

export { expect };
