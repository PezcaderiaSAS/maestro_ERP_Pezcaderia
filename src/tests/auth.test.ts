import { describe, it, expect, beforeEach } from 'vitest';
import { authService } from '../services/authService';
import * as localDb from '../services/localDb';

describe('Auth Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('T-AUTH-01: seedUsuarios crea administrador y cajero base', async () => {
    await authService.seedUsuarios();
    const usuarios = localDb.load<any[]>('usuarios', []);
    expect(usuarios.length).toBe(2);
    expect(usuarios[0].rol).toBe('admin');
    expect(usuarios[1].rol).toBe('vendedor');
  });

  it('T-AUTH-02: login falla con contraseña incorrecta', async () => {
    await authService.seedUsuarios();
    const res = await authService.login('admin', 'mala-password');
    expect(res.error).toBe('Credenciales incorrectas');
    expect(res.data).toBeNull();
  });

  it('T-AUTH-03: login exitoso genera SesionActiva', async () => {
    await authService.seedUsuarios();
    const res = await authService.login('cajero1', 'caja123');
    expect(res.error).toBeNull();
    expect(res.data?.rol).toBe('vendedor');
    expect(res.data?.cajaId).toBe('caja-01');
    
    const storedSesion = authService.getSesionActiva();
    expect(storedSesion?.usuarioId).toBe(res.data?.usuarioId);
  });
});
