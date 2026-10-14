/**
 * ============================================================================
 * LA PEZCADERIA ERP — MAPEO DE ROLES Y SESIÓN DE USUARIO (SPEC-013)
 * ============================================================================
 * Homologación determinista entre los roles de RRHH (Empleado) y los roles
 * operativos del sistema (UserRole) para gobernar navegación y trazabilidad POS.
 */

import type { UserRole } from '../store/useAppStore';

export type RolAccesoEmpleado =
  | 'ADMINISTRADOR'
  | 'VENDEDOR'
  | 'BODEGUERO'
  | 'REPARTIDOR'
  | 'GERENTE';

export interface ActiveUserSession {
  empleadoId: string;
  nombre: string;
  identificacion: string;
  cargo: string;
  rol: UserRole;
  avatarColor?: string;
  turnoIniciadoAt: string;
}

/**
 * Traduce el rol administrativo de RRHH al UserRole canónico del ERP.
 */
export function mapRolAccesoToUserRole(rol: RolAccesoEmpleado | string): UserRole {
  const normalized = (rol || '').trim().toUpperCase();

  switch (normalized) {
    case 'ADMINISTRADOR':
    case 'GERENTE':
    case 'ADMIN':
      return 'admin';
    case 'VENDEDOR':
      return 'vendedor';
    case 'BODEGUERO':
    case 'BODEGA':
      return 'bodega';
    case 'REPARTIDOR':
    case 'ADMINISTRATIVO':
    default:
      return 'administrativo';
  }
}

/**
 * Genera iniciales visuales para avatares táctiles de 2 letras (Regla 12 Años).
 */
export function getInitials(nombre: string): string {
  if (!nombre) return 'US';
  const parts = nombre.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

/**
 * Empleados predeterminados con PIN inicial seguro para arranques limpios o demo.
 */
export const DEFAULT_INITIAL_SELLERS: ActiveUserSession[] = [
  {
    empleadoId: 'emp-admin-01',
    nombre: 'Yurgen Administrador',
    identificacion: '1098765432',
    cargo: 'Gerente General',
    rol: 'admin',
    avatarColor: 'from-blue-600 to-indigo-700',
    turnoIniciadoAt: new Date().toISOString(),
  },
  {
    empleadoId: 'emp-vend-01',
    nombre: 'Carlos Mostrador',
    identificacion: '1098765433',
    cargo: 'Vendedor Senior Mostrador',
    rol: 'vendedor',
    avatarColor: 'from-emerald-500 to-teal-700',
    turnoIniciadoAt: new Date().toISOString(),
  },
  {
    empleadoId: 'emp-vend-02',
    nombre: 'Diana Ventas',
    identificacion: '1098765434',
    cargo: 'Asesora Comercial POS',
    rol: 'vendedor',
    avatarColor: 'from-amber-500 to-orange-600',
    turnoIniciadoAt: new Date().toISOString(),
  },
  {
    empleadoId: 'emp-bod-01',
    nombre: 'Marta Bodega',
    identificacion: '1098765435',
    cargo: 'Jefa de Cuartos Fríos',
    rol: 'bodega',
    avatarColor: 'from-cyan-600 to-blue-800',
    turnoIniciadoAt: new Date().toISOString(),
  },
];
