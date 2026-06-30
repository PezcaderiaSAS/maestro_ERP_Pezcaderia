export const SEED_DATA: Record<string, unknown> = {
  pezcaderia_bodegas: [
    { id: 'b1', nombre: 'Bodega Principal', activa: true }
  ],
  pezcaderia_cajas: [
    { id: 'caja-cash-test', bodegaId: 'Bodega Principal', nombre: 'Caja Menor - Bodega Principal', activa: true },
    { id: 'caja-fuerte-test', bodegaId: 'Bodega Principal', nombre: 'Caja Fuerte', activa: true }
  ],
  pezcaderia_turnos_caja: [
    {
      id: 'trn-test-01',
      cajaId: 'caja-cash-test',
      cajeroId: 'admin',
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
      createdBy: 'admin'
    },
    {
      id: 'trn-test-02',
      cajaId: 'caja-fuerte-test',
      cajeroId: 'admin',
      fechaApertura: new Date().toISOString(),
      fechaCierre: null,
      baseInicial: 1000000,
      saldoTeoricoGlobal: 1000000,
      totalEfectivo: 1000000,
      totalDatafono: 0,
      totalTransferencias: 0,
      saldoFisicoEfectivo: null,
      diferenciaEfectivo: null,
      estado: 'ABIERTO',
      justificacion: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin'
    }
  ],
  pezcaderia_movimientos_caja: [
    {
      id: 'mov-1',
      turnoId: 'trn-test-01',
      tipo: 'INGRESO_VENTA',
      monto: 70000,
      metodoPago: 'EFECTIVO',
      referencia: 'Venta #001',
      fecha: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      createdBy: 'admin'
    },
    {
      id: 'mov-2',
      turnoId: 'trn-test-01',
      tipo: 'INGRESO_VENTA',
      monto: 35000,
      metodoPago: 'EFECTIVO',
      referencia: 'Venta #002',
      fecha: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      createdBy: 'admin'
    },
    {
      id: 'mov-3',
      turnoId: 'trn-test-01',
      tipo: 'EGRESO_GASTO',
      monto: 50000,
      metodoPago: 'EFECTIVO',
      referencia: 'Compra insumos',
      fecha: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      createdBy: 'admin'
    }
  ],
  pezcaderia_traslados_dinero: []
};

export function applySeed(): void {
  for (const [key, value] of Object.entries(SEED_DATA)) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  console.log('✅ Cash Seed applied successfully');
}
