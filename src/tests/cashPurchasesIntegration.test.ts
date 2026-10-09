import { describe, it, expect, beforeEach } from 'vitest';
import { cashService } from '../services/cashService';
import {
  liquidarEgresoCajaRecepcion,
  obtenerRecepcionesBucaramanga,
  registrarRecepcionBucaramanga,
} from '../services/purchasesBucaramangaService';
import * as localDb from '../services/localDb';

describe('Integración Flujo de Caja y Compras Bucaramanga (Módulo 004)', () => {
  let turnoActivoId: string;
  const testCajaId = 'CAJA-TEST-BCM';

  beforeEach(() => {
    // Resetear base local de pruebas
    localDb.save('cajas', [
      { id: testCajaId, bodegaId: 'Bodega Principal', nombre: 'Caja Operativa Bucaramanga', tipo: 'MENOR', activa: true },
    ]);
    localDb.save('turnosCaja', []);
    localDb.save('movimientosCaja', []);

    // Abrir turno con base inicial de $500.000 COP en efectivo
    const resApertura = cashService.abrirTurno(testCajaId, 'cajero-test', 500000);
    expect(resApertura.error).toBeNull();
    turnoActivoId = resApertura.data!.id;
  });

  it('debe registrar un egreso operativo de Flete de Camión descontando del efectivo de la caja', () => {
    const resEgreso = cashService.registrarEgresoOperativo({
      turnoId: turnoActivoId,
      cajaId: testCajaId,
      categoriaEgreso: 'FLETE_TRANSPORTE',
      metodoPago: 'EFECTIVO',
      monto: 150000,
      concepto: 'Pago Flete Furgón WDF-452 (Cartagena)',
      referenciaId: 'REC-BCM-20261009-001',
      usuarioId: 'cajero-test',
      metadata: {
        placaCamion: 'WDF-452',
        numeroGuia: 'GUIA-CARTAGENA-998',
      },
    });

    expect(resEgreso.error).toBeNull();
    expect(resEgreso.data).toBeDefined();
    expect(resEgreso.data?.monto).toBe(150000);
    expect(resEgreso.data?.categoriaEgreso).toBe('FLETE_TRANSPORTE');
    expect(resEgreso.data?.metadata?.placaCamion).toBe('WDF-452');

    // Verificar actualización de saldos en el turno
    const turno = cashService.getTurnoActivo(testCajaId);
    expect(turno?.totalEfectivo).toBe(350000); // 500.000 - 150.000
    expect(turno?.saldoTeoricoGlobal).toBe(350000);
  });

  it('debe bloquear el egreso en efectivo si el monto supera el saldo disponible (EARS-W01)', () => {
    // Intentar pagar $800.000 COP cuando solo hay $500.000 COP
    const resEgreso = cashService.registrarEgresoOperativo({
      turnoId: turnoActivoId,
      cajaId: testCajaId,
      categoriaEgreso: 'PAGO_PROVEEDOR_PESCADO',
      metodoPago: 'EFECTIVO',
      monto: 800000,
      concepto: 'Pago Contado Proveedor Cartagena',
      referenciaId: 'REC-BCM-20261009-002',
      usuarioId: 'cajero-test',
      metadata: {
        proveedorNombre: 'Comercializadora Pesquera del Caribe',
      },
    });

    expect(resEgreso.error).not.toBeNull();
    expect(resEgreso.error).toContain('insuficiente');
    expect(resEgreso.data).toBeNull();

    // El saldo debe permanecer intacto
    const turno = cashService.getTurnoActivo(testCajaId);
    expect(turno?.totalEfectivo).toBe(500000);
  });

  it('debe permitir pagar por TRANSFERENCIA bancaria aunque el efectivo físico en caja sea inferior', () => {
    // Pagar $1.200.000 COP por transferencia
    const resEgreso = cashService.registrarEgresoOperativo({
      turnoId: turnoActivoId,
      cajaId: testCajaId,
      categoriaEgreso: 'PAGO_PROVEEDOR_PESCADO',
      metodoPago: 'TRANSFERENCIA',
      monto: 1200000,
      concepto: 'Transferencia Bancolombia Proveedor Cartagena',
      referenciaId: 'REC-BCM-20261009-003',
      usuarioId: 'cajero-test',
      metadata: {
        proveedorNombre: 'Comercializadora Pesquera del Caribe',
      },
    });

    expect(resEgreso.error).toBeNull();
    expect(resEgreso.data?.metodoPago).toBe('TRANSFERENCIA');

    // El efectivo físico sigue siendo $500.000 COP
    const turno = cashService.getTurnoActivo(testCajaId);
    expect(turno?.totalEfectivo).toBe(500000);
    // Pero el global y transferencias reflejan la transacción
    expect(turno?.totalTransferencias).toBe(-1200000);
  });

  it('debe conectar liquidarEgresoCajaRecepcion con una recepción de furgón Bucaramanga', async () => {
    const resRecepcion = await registrarRecepcionBucaramanga({
      receptionNumber: 'REC-BCM-TEST-004',
      supplierId: 'prov-caribe-01',
      supplierName: 'Comercializadora Pesquera del Caribe',
      truckPlate: 'XDF-123',
      refrigerationTempC: 1.5,
      tipoProducto: 'FRESCO',
      sensoryStatus: 'ACEPTADO',
      inspectorName: 'Yurgen Inspector',
      crates: [
        {
          crateNumber: 1,
          sku: 'PARGO-01',
          productName: 'Pargo Rojo',
          grossWeightKg: 22,
          crateTareKg: 2,
          iceDeductionPct: 5,
          unitCostOriginKg: 30000,
          warehouseId: 'cava-principal',
          shelfLifeDays: 8,
        },
      ],
      totalFreightCost: 100000,
      advancePaymentDeducted: 0,
      paymentStatus: 'PAGADO_CONTADO',
    });

    expect(resRecepcion.error).toBeNull();
    const recepcion = resRecepcion.data!.recepcion;

    // Liquidar flete contra la caja activa
    const resLiquidacion = liquidarEgresoCajaRecepcion({
      cajaId: testCajaId,
      turnoId: turnoActivoId,
      recepcion,
      pagarFlete: true,
      metodoPagoFlete: 'EFECTIVO',
      pagarProveedor: false,
      usuarioId: 'cajero-test',
    });

    expect(resLiquidacion.error).toBeNull();
    expect(resLiquidacion.egresosRegistrados.length).toBe(1);
    expect(resLiquidacion.egresosRegistrados[0].monto).toBe(100000);
    expect(resLiquidacion.egresosRegistrados[0].categoriaEgreso).toBe('FLETE_TRANSPORTE');

    // Saldo en caja actualizado a $400.000 COP
    const turno = cashService.getTurnoActivo(testCajaId);
    expect(turno?.totalEfectivo).toBe(400000);
  });

  it('debe alertar y bloquear si el efectivo es insuficiente al liquidar flete y proveedor juntos', async () => {
    const resRecepcion = await registrarRecepcionBucaramanga({
      receptionNumber: 'REC-BCM-TEST-005',
      supplierId: 'prov-caribe-01',
      supplierName: 'Comercializadora Pesquera del Caribe',
      truckPlate: 'WDF-452',
      refrigerationTempC: 1.0,
      tipoProducto: 'FRESCO',
      sensoryStatus: 'ACEPTADO',
      inspectorName: 'Yurgen Inspector',
      crates: [
        {
          crateNumber: 1,
          sku: 'SIERRA-01',
          productName: 'Sierra Fresca',
          grossWeightKg: 50,
          crateTareKg: 2,
          iceDeductionPct: 0,
          unitCostOriginKg: 20000,
          warehouseId: 'cava-principal',
          shelfLifeDays: 8,
        },
      ],
      totalFreightCost: 350000,
      advancePaymentDeducted: 0,
      paymentStatus: 'PAGADO_CONTADO',
    });

    const recepcion = resRecepcion.data!.recepcion;
    // Total compra: $960.000 + flete $350.000 = $1.310.000 COP (Caja solo tiene $500.000 COP)
    const resLiquidacion = liquidarEgresoCajaRecepcion({
      cajaId: testCajaId,
      turnoId: turnoActivoId,
      recepcion,
      pagarFlete: true,
      metodoPagoFlete: 'EFECTIVO',
      pagarProveedor: true,
      metodoPagoProveedor: 'EFECTIVO',
      usuarioId: 'cajero-test',
    });

    expect(resLiquidacion.error).not.toBeNull();
    expect(resLiquidacion.error).toContain('insuficiente');
  });

  it('debe permitir liquidar flete en efectivo y proveedor por transferencia sin bloqueo', async () => {
    const resRecepcion = await registrarRecepcionBucaramanga({
      receptionNumber: 'REC-BCM-TEST-006',
      supplierId: 'prov-caribe-01',
      supplierName: 'Comercializadora Pesquera del Caribe',
      truckPlate: 'WDF-452',
      refrigerationTempC: 1.0,
      tipoProducto: 'FRESCO',
      sensoryStatus: 'ACEPTADO',
      inspectorName: 'Yurgen Inspector',
      crates: [
        {
          crateNumber: 1,
          sku: 'SIERRA-01',
          productName: 'Sierra Fresca',
          grossWeightKg: 50,
          crateTareKg: 2,
          iceDeductionPct: 0,
          unitCostOriginKg: 20000,
          warehouseId: 'cava-principal',
          shelfLifeDays: 8,
        },
      ],
      totalFreightCost: 200000,
      advancePaymentDeducted: 0,
      paymentStatus: 'PAGADO_CONTADO',
    });

    const recepcion = resRecepcion.data!.recepcion;
    // Flete $200.000 en efectivo (alcanza de los $500k), y proveedor $960.000 por transferencia
    const resLiquidacion = liquidarEgresoCajaRecepcion({
      cajaId: testCajaId,
      turnoId: turnoActivoId,
      recepcion,
      pagarFlete: true,
      metodoPagoFlete: 'EFECTIVO',
      pagarProveedor: true,
      metodoPagoProveedor: 'TRANSFERENCIA',
      usuarioId: 'cajero-test',
    });

    expect(resLiquidacion.error).toBeNull();
    expect(resLiquidacion.egresosRegistrados.length).toBe(2);

    const turno = cashService.getTurnoActivo(testCajaId);
    expect(turno?.totalEfectivo).toBe(300000); // 500.000 - 200.000
    expect(turno?.totalTransferencias).toBe(-960000);
  });
});

