// src/tests/multiVendorCashierSync.test.tsx
// Pruebas de Integración para el Flujo Multivendedor con Caja Única de Recaudo (SPEC-041 / TASK-041-04)

import { describe, it, expect, beforeEach } from 'vitest';
import { useOutboxSyncStore } from '../stores/useOutboxSyncStore';
import { TenantIndexedDbService } from '../services/tenantIndexedDbService';

describe('TASK-041-04: Integración Multivendedor y Caja Única de Recaudo', () => {
  let dbService: TenantIndexedDbService;
  const testTenantId = 'tenant-03';

  beforeEach(async () => {
    dbService = new TenantIndexedDbService();
    await dbService.init(testTenantId);
    await dbService.clearAll();
    useOutboxSyncStore.getState().init(testTenantId, dbService);
  });

  it('debe orquestar el flujo completo: 2 vendedores de mostrador emiten comandas y la Caja Única las procesa', async () => {
    const store = useOutboxSyncStore.getState();

    // 1. Asesor Diego Díaz en TERM-01 emite comanda
    const resDiego = await store.emitirPreventaVendedor({
      tenantId: testTenantId,
      terminalId: 'TERM-01',
      vendedorId: 'vend-diego',
      vendedorNombre: 'Diego Díaz',
      clienteDocumento: '1098765432',
      clienteNombre: 'Constructora Bolívar',
      items: [
        {
          productoId: 'prod-pvc',
          sku: 'TUB-PVC-12',
          nombre: 'Tubo PVC 1/2 Pavco',
          cantidad: 10,
          precioUnitario: 12000,
          descuentoPct: 0,
          subtotal: 120000,
        },
      ],
      subtotal: 120000,
      descuentoTotal: 0,
      total: 120000,
    });

    expect(resDiego.ok).toBe(true);
    const comandaDiegoId = resDiego.preventa!.id;

    // 2. Asesor Santiago Pallares en TERM-02 emite comanda
    const resSantiago = await store.emitirPreventaVendedor({
      tenantId: testTenantId,
      terminalId: 'TERM-02',
      vendedorId: 'vend-santiago',
      vendedorNombre: 'Santiago Pallares',
      clienteNombre: 'Ferretería El Tornillo',
      items: [
        {
          productoId: 'prod-mart',
          sku: 'MART-16',
          nombre: 'Martillo Galponero 16oz',
          cantidad: 2,
          precioUnitario: 35000,
          descuentoPct: 0,
          subtotal: 70000,
        },
      ],
      subtotal: 70000,
      descuentoTotal: 0,
      total: 70000,
    });

    expect(resSantiago.ok).toBe(true);
    const comandaSantiagoId = resSantiago.preventa!.id;

    // 3. Taquilla de Caja Única inspecciona comandas pendientes
    let comandas = store.getComandasCajaUnica();
    expect(comandas).toHaveLength(2);

    const comandaDiego = comandas.find((c) => c.id === comandaDiegoId);
    expect(comandaDiego).toBeDefined();
    expect(comandaDiego?.vendedorNombre).toBe('Diego Díaz');
    expect(comandaDiego?.terminalId).toBe('TERM-01');
    expect(comandaDiego?.montoTotal).toBe(120000);

    const comandaSantiago = comandas.find((c) => c.id === comandaSantiagoId);
    expect(comandaSantiago).toBeDefined();
    expect(comandaSantiago?.vendedorNombre).toBe('Santiago Pallares');
    expect(comandaSantiago?.terminalId).toBe('TERM-02');
    expect(comandaSantiago?.montoTotal).toBe(70000);

    // 4. Cajera Central cobra la comanda de Diego Díaz
    const cobroDiego = await store.cobrarComandaCajaUnica(comandaDiegoId, {
      cajeroId: 'cajero-principal',
      turnoCentralId: 'turno-001',
      metodoPago: 'DATAFONO_TARJETA',
    });

    expect(cobroDiego.ok).toBe(true);

    // 5. La comanda de Diego desaparece de pendientes; la de Santiago permanece
    comandas = store.getComandasCajaUnica();
    expect(comandas).toHaveLength(1);
    expect(comandas[0].id).toBe(comandaSantiagoId);
    expect(comandas[0].vendedorNombre).toBe('Santiago Pallares');

    // 6. Verificar que la transacción de cobro está en la cola Outbox
    const activeOutbox = store.getTransaccionesActivas();
    const cobroTx = activeOutbox.find(
      (t) => t.tipoOperacion === 'COBRAR_PREVENTA_CAJA_UNICA' && t.entidadId === comandaDiegoId
    );
    expect(cobroTx).toBeDefined();
    expect(cobroTx?.payload.metodoPago).toBe('DATAFONO_TARJETA');
  });

  it('debe registrar un ítem en DLQ cuando ocurre un error fatal y reflejarlo en store', async () => {
    const store = useOutboxSyncStore.getState();

    const txId = await store.encolarTransaccion(
      'VENTA_POS_DIRECTA',
      'vta-fatal-test',
      { datosIncompletos: true },
      1
    );

    // Marcar como error fatal (HTTP 422)
    await store.marcarTransaccionError(txId, 'Error 422 Unprocessable', true);

    expect(store.getTransaccionesDlq()).toHaveLength(1);
    expect(store.getTransaccionesActivas().find((t) => t.id === txId)).toBeUndefined();
  });
});

