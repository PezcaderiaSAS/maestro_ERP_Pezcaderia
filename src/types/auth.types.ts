export interface Usuario {
  id: string;
  nombre: string;
  usuario: string;
  passwordHash: string;
  rol: 'admin' | 'vendedor';
  cajaPermitidaId?: string; // ID de la caja asignada
  activo: boolean;
}

export interface SesionActiva {
  usuarioId: string;
  nombre: string;
  rol: 'admin' | 'vendedor';
  cajaId?: string;
  turnoId?: string;
}
