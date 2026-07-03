import { describe, it, expect, beforeEach } from 'vitest';
import { cajaService } from '../services/cajaService';
import { authService } from '../services/authService';
import * as localDb from '../services/localDb';

describe('Caja Service', () => {
  beforeEach(async () => {
    localStorage.clear();
    await authService.seedUsuarios();
    cajaService.seedCajas();
  });

  it('T-CAJA-01: permite abrir turno a vendedor en Caja MENOR', () => {
    const cajas = localDb.load<any[]>('cajas', []);
    const usuarios = localDb.load<any[]>('usuarios', []);
    const vendedor = usuarios.find(u => u.rol === 'vendedor');
    const cajaMenor = cajas.find(c => c.tipo === 'MENOR');

    const res = cajaService.abrirTurno(cajaMenor.id, vendedor.id, 50000);
    expect(res.error).toBeNull();
    expect(res.data?.estado).toBe('ABIERTA');
  });

  it('T-CAJA-02: impide a vendedor abrir Caja MAYOR (RBAC)', () => {
    const cajas = localDb.load<any[]>('cajas', []);
    const usuarios = localDb.load<any[]>('usuarios', []);
    const vendedor = usuarios.find(u => u.rol === 'vendedor');
    const cajaMayor = cajas.find(c => c.tipo === 'MAYOR');

    const res = cajaService.abrirTurno(cajaMayor.id, vendedor.id, 0);
    expect(res.error).toBe('No tiene permisos para abrir una Caja Mayor');
  });

  it('T-CAJA-05: previene abrir dos turnos simultáneos', () => {
    const cajas = localDb.load<any[]>('cajas', []);
    const usuarios = localDb.load<any[]>('usuarios', []);
    const vendedor = usuarios.find(u => u.rol === 'vendedor');
    const cajaMenor = cajas.find(c => c.tipo === 'MENOR');

    cajaService.abrirTurno(cajaMenor.id, vendedor.id, 50000);
    const resDoble = cajaService.abrirTurno(cajaMenor.id, vendedor.id, 10000);
    
    expect(resDoble.error).toBe('Ya existe un turno abierto para este usuario');
  });
});
