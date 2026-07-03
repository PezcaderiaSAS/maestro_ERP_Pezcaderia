import { describe, it, expect, beforeEach } from 'vitest';
import { authService } from '../services/authService';
import { cajaService } from '../services/cajaService';
import * as localDb from '../services/localDb';

describe('Integración: Login -> Turno -> Ventas -> Arqueo', () => {
  beforeEach(async () => {
    localStorage.clear();
    await authService.seedUsuarios();
    cajaService.seedCajas();
  });

  it('T-INT-01: flujo completo de caja cuadra perfectamente', async () => {
    // 1. Login
    const loginRes = await authService.login('cajero1', 'caja123');
    expect(loginRes.error).toBeNull();
    const vendedor = loginRes.data!;

    // 2. Abrir Turno
    const cajaRes = cajaService.abrirTurno(vendedor.cajaId!, vendedor.usuarioId, 100000); // base $100.000
    expect(cajaRes.error).toBeNull();
    const turno = cajaRes.data!;

    // 3. Registrar Ventas (Simulando lo que hace App.tsx)
    cajaService.registrarTransaccion({
      turnoId: turno.id,
      cajaId: turno.cajaId,
      tipo: 'INGRESO',
      monto: 25000,
      metodoPago: 'EFECTIVO',
      categoria: 'VENTA_POS'
    });
    
    cajaService.registrarTransaccion({
      turnoId: turno.id,
      cajaId: turno.cajaId,
      tipo: 'INGRESO',
      monto: 50000,
      metodoPago: 'TRANSFERENCIA',
      categoria: 'VENTA_POS'
    });

    // 4. Arqueo y Cierre
    // Efectivo Esperado: 100.000 (base) + 25.000 (venta efectivo) = 125.000
    // Transferencia Esperada: 50.000
    const arqueo = { efectivo: 125000, transferencia: 50000, tarjeta: 0 };
    const cierreRes = cajaService.cerrarTurno(turno.id, arqueo);

    expect(cierreRes.error).toBeNull();
    expect(cierreRes.data?.diferencia).toBe(0);
    expect(cierreRes.data?.estado).toBe('CERRADA');
  });
});
