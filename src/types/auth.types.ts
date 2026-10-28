/**
 * Tipos TypeScript Oficiales: Ecosistema de Autenticación OAuth 2.0 & Multi-Tenant RBAC
 * Módulo: SPEC-035 (La Pezcadería ERP)
 */

export type RoleRbac = 'admin' | 'vendedor' | 'cajero' | 'bodeguero' | 'supervisor' | 'contador';

export type TenantMembershipStatus = 'active' | 'suspended' | 'invited';

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface TenantData {
  id: string;
  razonSocial: string;
  nombre?: string;
  nit: string;
  ciudad: string;
  direccion?: string;
  telefono: string;
  regimenTributario?: string;
  activo: boolean;
  createdAt: string;
}

export interface TenantMembership {
  id: string;
  tenantId: string;
  userId: string;
  role: RoleRbac;
  status: TenantMembershipStatus;
  isOwner: boolean;
  createdAt: string;
}

export interface TenantInvitation {
  id: string;
  tenantId: string;
  nombre: string;
  email: string;
  role: RoleRbac;
  token: string;
  expiresAt: string;
  status: InvitationStatus;
  invitedBy?: string;
  createdAt: string;
}

export interface AuthUserProfile {
  id: string;
  email: string;
  nombre: string;
  avatarUrl?: string;
  authProvider: 'google' | 'azure' | 'email' | 'mock';
  tenantId?: string;
  rol?: RoleRbac;
  isOwner?: boolean;
  isSuperAdmin?: boolean;
}

/**
 * Correo oficial del UltraAdministrador Global del sistema ERP (GOD_MODE)
 * Tiene acceso irrestricto a todos los tenants y omite onboarding.
 */
export const SUPER_ADMIN_EMAIL = 'pezcaderia.2022@gmail.com';

/**
 * Determina si un correo electrónico corresponde al UltraAdministrador Global
 */
export function isSuperAdmin(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

export type AuthStateStatus = 'unauthenticated' | 'needs_onboarding' | 'authenticated';

export interface AuthSessionState {
  status: AuthStateStatus;
  user: AuthUserProfile | null;
  activeTenant: TenantData | null;
  availableTenants: TenantData[];
  token: string | null;
  expiresAt?: number;
}
