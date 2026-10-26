// src/services/superAdminService.ts
// Servicio de Administración Global Multi-Tenant (Super Admin / Desarrollador)

import type { TenantConfig, RubroEmpresa } from '../types/multiVendorCash.types';

export interface SuperAdminUser {
  id: string;
  tenantId: string;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'VENDEDOR' | 'CAJERO' | 'SUPERVISOR';
  activo: boolean;
  ultimoAcceso?: string;
}

export class SuperAdminService {
  private tenants: TenantConfig[] = [
    {
      id: 'tenant-01',
      nombre: 'La Pezcaderia SAS',
      nit: '900.123.456-1',
      razonSocial: 'La Pezcadería del Mar S.A.S.',
      rubro: 'PESCADERIA',
      activo: true,
      maxTerminales: 8,
      createdAt: '2026-10-01T08:00:00Z',
      contactoEmail: 'gerencia@pezcaderia.com',
      contactoTelefono: '+57 310 123 4567',
      sucursalesCount: 2,
    },
    {
      id: 'tenant-02',
      nombre: 'Ferretería El Tornillo de Oro',
      nit: '901.789.012-3',
      razonSocial: 'Ferretería & Suministros S.A.S.',
      rubro: 'FERRETERIA',
      activo: true,
      maxTerminales: 8,
      createdAt: '2026-10-15T09:30:00Z',
      contactoEmail: 'ventas@tornillodeoro.com',
      contactoTelefono: '+57 315 987 6543',
      sucursalesCount: 1,
    },
  ];

  private users: SuperAdminUser[] = [
    {
      id: 'user-01',
      tenantId: 'tenant-01',
      nombre: 'Yurani Administradora',
      email: 'yurani@pezcaderia.com',
      rol: 'ADMIN',
      activo: true,
      ultimoAcceso: '2026-10-26T16:30:00Z',
    },
    {
      id: 'user-02',
      tenantId: 'tenant-02',
      nombre: 'Pedro Ferretero',
      email: 'pedro@ferreteria.com',
      rol: 'VENDEDOR',
      activo: true,
      ultimoAcceso: '2026-10-26T15:45:00Z',
    },
    {
      id: 'user-03',
      tenantId: 'tenant-01',
      nombre: 'Carlos Cajero Principal',
      email: 'carlos@pezcaderia.com',
      rol: 'CAJERO',
      activo: true,
      ultimoAcceso: '2026-10-26T16:50:00Z',
    },
  ];

  public getTenants(): TenantConfig[] {
    return [...this.tenants];
  }

  public getTenantById(id: string): TenantConfig | null {
    return this.tenants.find((t) => t.id === id) || null;
  }

  public createTenant(data: {
    nombre: string;
    nit: string;
    razonSocial: string;
    rubro: RubroEmpresa;
    maxTerminales?: number;
    contactoEmail?: string;
  }): TenantConfig {
    const newTenant: TenantConfig = {
      id: `tenant-${Date.now().toString(36)}`,
      nombre: data.nombre,
      nit: data.nit,
      razonSocial: data.razonSocial,
      rubro: data.rubro,
      activo: true,
      maxTerminales: data.maxTerminales || 8,
      createdAt: new Date().toISOString(),
      contactoEmail: data.contactoEmail,
      sucursalesCount: 1,
    };
    this.tenants.push(newTenant);
    return newTenant;
  }

  public toggleTenantStatus(tenantId: string): TenantConfig | null {
    const tenant = this.tenants.find((t) => t.id === tenantId);
    if (tenant) {
      tenant.activo = !tenant.activo;
      return { ...tenant };
    }
    return null;
  }

  public getUsersByTenant(tenantId?: string): SuperAdminUser[] {
    if (!tenantId) return [...this.users];
    return this.users.filter((u) => u.tenantId === tenantId);
  }

  public updateUserRole(
    userId: string,
    nuevoRol: 'ADMIN' | 'VENDEDOR' | 'CAJERO' | 'SUPERVISOR'
  ): boolean {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      user.rol = nuevoRol;
      return true;
    }
    return false;
  }
}

export const superAdminService = new SuperAdminService();
