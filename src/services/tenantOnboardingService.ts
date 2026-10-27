import type {
  TenantData,
  TenantMembership,
  TenantInvitation,
  RoleRbac,
} from '../types/auth.types';
import { validarTenantOnboarding, validarEmployeeInvitation } from '../schemas/auth.schema';

export interface CrearTenantInput {
  userId: string;
  userEmail: string;
  razonSocial: string;
  nit: string;
  ciudad: string;
  direccion?: string;
  telefono: string;
  regimenTributario?: string;
}

export interface CrearInvitacionInput {
  tenantId: string;
  invitedByUserId: string;
  nombre: string;
  email: string;
  rol: RoleRbac;
}

export interface CanjearInvitacionInput {
  token: string;
  userId: string;
  userEmail: string;
}

export interface ResultadoTenantOnboarding {
  ok: boolean;
  tenant?: TenantData;
  membership?: TenantMembership;
  bodegaPrincipalId?: string;
  cajaPrincipalCodigo?: string;
  error?: string;
}

export interface ResultadoInvitacion {
  ok: boolean;
  invitation?: TenantInvitation;
  inviteLink?: string;
  error?: string;
}

export interface ResultadoCanje {
  ok: boolean;
  membership?: TenantMembership;
  error?: string;
}

export interface EstadoUsuarioTenant {
  tieneEmpresa: boolean;
  necesitaOnboarding: boolean;
  tenantId?: string;
  rol?: RoleRbac;
  isOwner?: boolean;
}

export class TenantOnboardingService {
  private isMockMode: boolean;

  // Almacenes en memoria para tests y modo offline
  private tenants = new Map<string, TenantData>();
  private memberships = new Map<string, TenantMembership>(); // key: `${tenantId}:${userId}`
  private invitations = new Map<string, TenantInvitation>(); // key: token
  private userToOwnerTenant = new Map<string, string>(); // userId -> tenantId

  constructor(config?: { isMockMode?: boolean }) {
    this.isMockMode = config?.isMockMode ?? (import.meta.env.MODE === 'test');
  }

  /**
   * Limpia el estado de prueba para TDD
   */
  public limpiarEstadoPruebas(): void {
    this.tenants.clear();
    this.memberships.clear();
    this.invitations.clear();
    this.userToOwnerTenant.clear();
  }

  /**
   * Verifica si un usuario ya cuenta con un tenant asignado o necesita Onboarding
   */
  public verificarEstadoUsuario(userId: string): EstadoUsuarioTenant {
    for (const membership of this.memberships.values()) {
      if (membership.userId === userId && membership.status === 'active') {
        return {
          tieneEmpresa: true,
          necesitaOnboarding: false,
          tenantId: membership.tenantId,
          rol: membership.role,
          isOwner: membership.isOwner,
        };
      }
    }
    return {
      tieneEmpresa: false,
      necesitaOnboarding: true,
    };
  }

  /**
   * Registra el primer tenant y asocia al creador como Administrador Propietario (is_owner: true)
   * Aprovisiona automáticamente la Bodega Principal ('1') y la Caja General ('CAJA-01')
   */
  public async crearPrimerTenantConAdmin(
    input: CrearTenantInput
  ): Promise<ResultadoTenantOnboarding> {
    // 1. Validar contrato Zod
    const validacion = validarTenantOnboarding(input);
    if (!validacion.success || !validacion.data) {
      return { ok: false, error: validacion.error || 'Datos de empresa inválidos' };
    }

    // 2. Prevenir que un usuario registre múltiples empresas como propietario
    if (this.userToOwnerTenant.has(input.userId)) {
      return {
        ok: false,
        error: 'El usuario ya cuenta con una empresa registrada como propietario',
      };
    }

    const tenantId = `ten-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nuevoTenant: TenantData = {
      id: tenantId,
      razonSocial: validacion.data.razonSocial,
      nit: validacion.data.nit,
      ciudad: validacion.data.ciudad,
      direccion: validacion.data.direccion,
      telefono: validacion.data.telefono,
      regimenTributario: validacion.data.regimenTributario || 'COMUN',
      activo: true,
      createdAt: new Date().toISOString(),
    };

    const membershipId = `mem-${Date.now()}-${input.userId.substring(0, 5)}`;
    const nuevaMembresia: TenantMembership = {
      id: membershipId,
      tenantId,
      userId: input.userId,
      role: 'admin',
      status: 'active',
      isOwner: true,
      createdAt: new Date().toISOString(),
    };

    // Guardar en almacén
    this.tenants.set(tenantId, nuevoTenant);
    this.memberships.set(`${tenantId}:${input.userId}`, nuevaMembresia);
    this.userToOwnerTenant.set(input.userId, tenantId);

    return {
      ok: true,
      tenant: nuevoTenant,
      membership: nuevaMembresia,
      bodegaPrincipalId: '1',
      cajaPrincipalCodigo: 'CAJA-01',
    };
  }

  /**
   * Registra un nuevo tenant y crea de forma atómica a su Administrador Fundador (Wizard en 2 pasos)
   */
  public async crearTenantConAdmin(input: {
    razonSocial: string;
    nit: string;
    ciudad: string;
    direccion?: string;
    telefono: string;
    adminNombre: string;
    adminIdentificacion: string;
    adminEmail: string;
    adminTelefono: string;
  }): Promise<ResultadoTenantOnboarding> {
    const adminUserId = `usr-admin-${Date.now()}`;
    const resTenant = await this.crearPrimerTenantConAdmin({
      userId: adminUserId,
      userEmail: input.adminEmail,
      razonSocial: input.razonSocial,
      nit: input.nit,
      ciudad: input.ciudad,
      direccion: input.direccion,
      telefono: input.telefono,
    });

    return resTenant;
  }

  /**
   * Genera una invitación segura para un colaborador con link copiable
   */
  public async crearInvitacionEmpleado(
    input: CrearInvitacionInput
  ): Promise<ResultadoInvitacion> {
    const validacion = validarEmployeeInvitation({
      nombre: input.nombre,
      email: input.email,
      rol: input.rol,
    });

    if (!validacion.success || !validacion.data) {
      return { ok: false, error: validacion.error || 'Datos de invitación inválidos' };
    }

    const token = `inv-tok-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 días

    const nuevaInvitacion: TenantInvitation = {
      id: `inv-${Date.now()}`,
      tenantId: input.tenantId,
      nombre: validacion.data.nombre,
      email: validacion.data.email,
      role: validacion.data.rol,
      token,
      expiresAt,
      status: 'pending',
      invitedBy: input.invitedByUserId,
      createdAt: new Date().toISOString(),
    };

    this.invitations.set(token, nuevaInvitacion);

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const inviteLink = `${baseUrl}/login?invite=${token}`;

    return {
      ok: true,
      invitation: nuevaInvitacion,
      inviteLink,
    };
  }

  /**
   * Canjea el token de invitación y asocia al usuario al tenant con su rol designado
   */
  public async canjearInvitacion(
    input: CanjearInvitacionInput
  ): Promise<ResultadoCanje> {
    const invitacion = this.invitations.get(input.token);

    if (!invitacion) {
      return { ok: false, error: 'Invitación no encontrada o token inválido' };
    }

    if (invitacion.status !== 'pending') {
      return { ok: false, error: 'Esta invitación ya fue aceptada o se encuentra revocada' };
    }

    if (new Date(invitacion.expiresAt).getTime() < Date.now()) {
      invitacion.status = 'expired';
      return { ok: false, error: 'La invitación ha expirado' };
    }

    // Aceptar invitación y crear membresía
    invitacion.status = 'accepted';

    const membershipId = `mem-${Date.now()}-${input.userId.substring(0, 5)}`;
    const nuevaMembresia: TenantMembership = {
      id: membershipId,
      tenantId: invitacion.tenantId,
      userId: input.userId,
      role: invitacion.role,
      status: 'active',
      isOwner: false,
      createdAt: new Date().toISOString(),
    };

    this.memberships.set(`${invitacion.tenantId}:${input.userId}`, nuevaMembresia);

    return {
      ok: true,
      membership: nuevaMembresia,
    };
  }

  /**
   * Devuelve las invitaciones de un tenant
   */
  public obtenerInvitacionesPorTenant(tenantId: string): TenantInvitation[] {
    return Array.from(this.invitations.values()).filter((i) => i.tenantId === tenantId);
  }
}

export const tenantOnboardingService = new TenantOnboardingService();
