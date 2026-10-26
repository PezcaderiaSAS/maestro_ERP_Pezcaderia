import { describe, it, expect, beforeEach } from 'vitest';
import { MultiVendorCashService } from '../services/multiVendorCashService';
import type { VentaConcurrentePayload } from '../types/multiVendorCash.types';

describe('TASK-034-02: Motor de Concurrencia de Caja Única (8 Puntos de Venta)', () => {
  let service: MultiVendorCashService;
  const tenantId = 'tenant-pezcaderia-01';
  const cajaId = 'caja-central-01';
  const sucursalId = 'sucursal-principal';

  beforeEach(() => {
    service = new MultiVendorCashService();
    // Reiniciar estado y abrir turno central común con base de $300.000
    service.abrirTurnoCentral({
      id: 'turno-central-101',
      cajaId,
      sucursalId,
      tenantId,
      cajeroAperturaId: 'emp-cajero-general',
      baseInicial: 300000,
      estado: 'ABIERTO',
      fechaApertura: '2026-10-26T08:00:00-05:00',
      terminalesAutorizadas: [
        'TERM-01', 'TERM-02', 'TERM-03', 'TERM-04',
        'TERM-05', 'TERM-06', 'TERM-07', 'TERM-08',
      ],
    });

    // Sembrar stock inicial para pruebas
    service.seedStock('prod-cable-10m', 100);
    service.seedStock('prod-ultimo-taladro', 1); // Solo 1 unidad para prueba de colisión
  });

  it('debe registrar una venta individual y actualizar el saldo acumulado de caja', async () => {
    const payload: VentaConcurrentePayload = {
      idempotencyKey: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
      tenantId,
      turnoId: 'turno-central-101',
      terminalId: 'TERM-01',
      vendedorId: 'emp-vendedor-01',
      items: [
        {
          productoId: 'prod-cable-10m',
          nombre: 'Cable Encauchetado 10m',
          cantidad: 2,
          precioUnitario: 25000,
          subtotal: 50000,
        },
      ],
      pagos: [{ metodoPago: 'EFECTIVO', monto: 50000 }],
      montoTotal: 50000,
    };

    const resultado = await service.registrarVentaConcurrente(payload);

    expect(resultado.ok).toBe(true);
    expect(resultado.consecutivoFactura).toBeDefined();
    expect(resultado.consecutivoFactura).toMatch(/^FAC-\d{6}$/);
    expect(resultado.efectivoCajaAfectado).toBe(50000);
    expect(resultado.saldoTurnoActualizado).toBe(350000); // 300.000 base + 50.000 venta

    const movimientos = service.obtenerMovimientosTurno('turno-central-101');
    expect(movimientos).toHaveLength(1);
    expect(movimientos[0].terminalId).toBe('TERM-01');
    expect(movimientos[0].vendedorId).toBe('emp-vendedor-01');
  });

  it('debe soportar 8 terminales vendiendo en simultáneo (Promise.all) sin colisiones de consecutivos ni lost updates', async () => {
    // 8 terminales vendiendo al mismo milisegundo
    const montos = [10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000];
    const sumaEsperadaVentas = montos.reduce((a, b) => a + b, 0); // 360.000

    const promesas = montos.map((monto, index) => {
      const numTerminal = String(index + 1).padStart(2, '0');
      const payload: VentaConcurrentePayload = {
        idempotencyKey: `a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a${numTerminal}`,
        tenantId,
        turnoId: 'turno-central-101',
        terminalId: `TERM-${numTerminal}`,
        vendedorId: `emp-vendedor-${numTerminal}`,
        items: [
          {
            productoId: 'prod-cable-10m',
            nombre: `Ítem Terminal ${numTerminal}`,
            cantidad: 1,
            precioUnitario: monto,
            subtotal: monto,
          },
        ],
        pagos: [{ metodoPago: 'EFECTIVO', monto }],
        montoTotal: monto,
      };

      return service.registrarVentaConcurrente(payload);
    });

    const resultados = await Promise.all(promesas);

    // 1. Todas las 8 transacciones deben haber sido exitosas
    expect(resultados).toHaveLength(8);
    for (const res of resultados) {
      expect(res.ok).toBe(true);
      expect(res.error).toBeUndefined();
    }

    // 2. Consecutivos deben ser 8 valores únicos y correlativos (CERO DUPLICADOS)
    const consecutivos = resultados.map((r) => r.consecutivoFactura);
    const consecutivosUnicos = new Set(consecutivos);
    expect(consecutivosUnicos.size).toBe(8);

    // 3. Saldo consolidado de la caja debe ser exactamente: 300.000 (base) + 360.000 = 660.000
    const saldoFinal = service.obtenerSaldoCajaAgregado('turno-central-101');
    expect(saldoFinal).toBe(300000 + sumaEsperadaVentas);

    // 4. Se deben haber generado exactamente 8 movimientos en el ledger inmutable
    const movimientos = service.obtenerMovimientosTurno('turno-central-101');
    expect(movimientos).toHaveLength(8);

    // Verificar que cada terminal_id haya quedado registrada
    const terminalesRegistradas = movimientos.map((m) => m.terminalId);
    for (let i = 1; i <= 8; i++) {
      const termId = `TERM-${String(i).padStart(2, '0')}`;
      expect(terminalesRegistradas).toContain(termId);
    }
  });

  it('debe rechazar ventas en efectivo si el turno de caja central está CERRADO', async () => {
    service.cerrarTurnoCentral('turno-central-101');

    const payload: VentaConcurrentePayload = {
      idempotencyKey: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a99',
      tenantId,
      turnoId: 'turno-central-101',
      terminalId: 'TERM-03',
      vendedorId: 'emp-vendedor-03',
      items: [
        {
          productoId: 'prod-cable-10m',
          nombre: 'Cable',
          cantidad: 1,
          precioUnitario: 10000,
          subtotal: 10000,
        },
      ],
      pagos: [{ metodoPago: 'EFECTIVO', monto: 10000 }],
      montoTotal: 10000,
    };

    const resultado = await service.registrarVentaConcurrente(payload);

    expect(resultado.ok).toBe(false);
    expect(resultado.codigoError).toBe('CAJA_CERRADA');
    expect(resultado.error).toContain('cerrado');
  });

  it('debe respetar la idempotencia ante reenvío del mismo UUID sin duplicar saldo en caja', async () => {
    const payload: VentaConcurrentePayload = {
      idempotencyKey: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a77',
      tenantId,
      turnoId: 'turno-central-101',
      terminalId: 'TERM-05',
      vendedorId: 'emp-vendedor-05',
      items: [
        {
          productoId: 'prod-cable-10m',
          nombre: 'Cable',
          cantidad: 1,
          precioUnitario: 15000,
          subtotal: 15000,
        },
      ],
      pagos: [{ metodoPago: 'EFECTIVO', monto: 15000 }],
      montoTotal: 15000,
    };

    // Primer envío
    const res1 = await service.registrarVentaConcurrente(payload);
    expect(res1.ok).toBe(true);
    const saldoTrasVenta1 = service.obtenerSaldoCajaAgregado('turno-central-101');
    expect(saldoTrasVenta1).toBe(315000);

    // Reenvío del mismo payload con idéntico idempotencyKey
    const res2 = await service.registrarVentaConcurrente(payload);
    expect(res2.ok).toBe(true);
    expect(res2.consecutivoFactura).toBe(res1.consecutivoFactura);

    // El saldo NO debe duplicarse (debe seguir en 315.000)
    const saldoTrasReintento = service.obtenerSaldoCajaAgregado('turno-central-101');
    expect(saldoTrasReintento).toBe(315000);

    // Solo debe existir 1 movimiento en el ledger
    expect(service.obtenerMovimientosTurno('turno-central-101')).toHaveLength(1);
  });

  it('debe gestionar colisión de stock pesimista (SELECT FOR UPDATE) cuando 2 terminales compiten por la última unidad', async () => {
    // prod-ultimo-taladro tiene stock = 1
    const intentoTerminal1 = service.registrarVentaConcurrente({
      idempotencyKey: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380b01',
      tenantId,
      turnoId: 'turno-central-101',
      terminalId: 'TERM-01',
      vendedorId: 'emp-vendedor-01',
      items: [
        {
          productoId: 'prod-ultimo-taladro',
          nombre: 'Último Taladro',
          cantidad: 1,
          precioUnitario: 200000,
          subtotal: 200000,
        },
      ],
      pagos: [{ metodoPago: 'EFECTIVO', monto: 200000 }],
      montoTotal: 200000,
    });

    const intentoTerminal2 = service.registrarVentaConcurrente({
      idempotencyKey: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380b02',
      tenantId,
      turnoId: 'turno-central-101',
      terminalId: 'TERM-02',
      vendedorId: 'emp-vendedor-02',
      items: [
        {
          productoId: 'prod-ultimo-taladro',
          nombre: 'Último Taladro',
          cantidad: 1,
          precioUnitario: 200000,
          subtotal: 200000,
        },
      ],
      pagos: [{ metodoPago: 'EFECTIVO', monto: 200000 }],
      montoTotal: 200000,
    });

    const [res1, res2] = await Promise.all([intentoTerminal1, intentoTerminal2]);

    // Exactamente 1 debe haber ganado y 1 debe haber fallado por stock insuficiente
    const exito = [res1, res2].filter((r) => r.ok);
    const fallido = [res1, res2].filter((r) => !r.ok);

    expect(exito).toHaveLength(1);
    expect(fallido).toHaveLength(1);
    expect(fallido[0].codigoError).toBe('STOCK_INSUFICIENTE');

    // El stock final debe ser exactamente 0
    expect(service.obtenerStock('prod-ultimo-taladro')).toBe(0);
  });
});
