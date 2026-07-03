import { load, save, remove } from './localDb';
import type { Usuario, SesionActiva } from '../types/auth.types';
import type { ResultadoOperacion } from '../types/pos.types';

export const authService = {
  async hashPassword(plain: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  async login(usuario: string, plain: string): Promise<ResultadoOperacion<SesionActiva>> {
    const usuarios = load<Usuario[]>('usuarios', []);
    const user = usuarios.find(u => u.usuario === usuario && u.activo);
    
    if (!user) {
      return { data: null, error: 'Credenciales incorrectas o usuario inactivo' };
    }

    const hash = await this.hashPassword(plain);
    if (user.passwordHash !== hash) {
      return { data: null, error: 'Credenciales incorrectas' };
    }

    const sesion: SesionActiva = {
      usuarioId: user.id,
      nombre: user.nombre,
      rol: user.rol,
      cajaId: user.cajaPermitidaId,
    };

    save('sesionActiva', sesion);
    return { data: sesion, error: null };
  },

  logout(): void {
    remove('sesionActiva');
  },

  getSesionActiva(): SesionActiva | null {
    return load<SesionActiva | null>('sesionActiva', null);
  },

  async seedUsuarios(): Promise<void> {
    const usuarios = load<Usuario[]>('usuarios', []);
    if (usuarios.length > 0) return;

    const adminHash = await this.hashPassword('admin123');
    const cajeroHash = await this.hashPassword('caja123');

    const seed: Usuario[] = [
      {
        id: 'usr-admin',
        nombre: 'Administrador',
        usuario: 'admin',
        passwordHash: adminHash,
        rol: 'admin',
        activo: true
      },
      {
        id: 'usr-cajero1',
        nombre: 'Cajero Principal',
        usuario: 'cajero1',
        passwordHash: cajeroHash,
        rol: 'vendedor',
        cajaPermitidaId: 'caja-01',
        activo: true
      }
    ];

    save('usuarios', seed);
  }
};
