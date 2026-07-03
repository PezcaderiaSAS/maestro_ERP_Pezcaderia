import { describe, it, expect, beforeEach } from 'vitest';
import { cajaService } from '../services/cajaService';
import { remove, save } from '../services/localDb';

describe('Caja Integration', () => {
  beforeEach(() => {
    // Limpiar base de datos local para el entorno de pruebas
    remove('turnos');
    remove('cajas');
    remove('transacciones_caja');
    remove('usuarios');
    remove('audit_logs');
    
    // Seed básico
    cajaService.seedCajas();
    save('usuarios', [{ id: 'user-123', nombre: 'Test', rol: 'vendedor' }]);
  });

  it('flujo completo de apertura y cierre con desglose de denominaciones', () => {
    // 1. Obtener caja
    const cajas = cajaService.getCajas();
    const caja = cajas[0];
    const usuarioId = 'user-123';

    // 2. Abrir turno con base calculada
    const saldoApertura = 150000;
    const resApertura = cajaService.abrirTurno(caja.id, usuarioId, saldoApertura);
    expect(resApertura.error).toBeNull();
    
    const turnoActivo = resApertura.data;
    expect(turnoActivo).not.toBeNull();
    
    // 3. Vender (registrar transacción de ingreso)
    const resTx = cajaService.registrarTransaccion({
      turnoId: turnoActivo!.id,
      cajaId: caja.id,
      tipo: 'INGRESO',
      monto: 50000,
      metodoPago: 'EFECTIVO',
      categoria: 'VENTA_POS'
    });
    expect(resTx.error).toBeNull();

    // 4. Cerrar Turno inyectando desglose desde el calculador
    const desglose = { '50000': 4 }; // 4 billetes de 50.000 = 200.000
    const resCierre = cajaService.cerrarTurno(turnoActivo!.id, {
      efectivo: 200000,
      transferencia: 0,
      tarjeta: 0,
      desgloseDenominaciones: desglose
    }, 'Caja cuadrada');

    expect(resCierre.error).toBeNull();
    
    // 5. Validar desgloseDenominaciones en la persistencia del turno cerrado
    const turnoCerrado = resCierre.data!;
    expect(turnoCerrado.estado).toBe('CERRADA');
    expect(turnoCerrado.desgloseDenominaciones).toEqual(desglose);
    
    // Comprobar diferencias
    // Esperado en Gaveta = saldoApertura (150k) + ventas (50k) = 200k
    // Ingresado Efectivo = 200k
    // Diferencia esperada = 0
    expect(turnoCerrado.diferencia).toBe(0);
  });
});
