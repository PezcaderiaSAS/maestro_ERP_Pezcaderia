// src/services/superAdminService.ts
// Servicio de Administración Global Multi-Tenant (Super Admin / Desarrollador)

import type { TenantConfig, RubroEmpresa } from '../types/multiVendorCash.types';
import { userManagementService } from './userManagementService';

export interface SuperAdminUser {
  id: string;
  tenantId: string;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'VENDEDOR' | 'CAJERO' | 'SUPERVISOR';
  activo: boolean;
  ultimoAcceso?: string;
  identificacion?: string;
  telefono?: string;
}

export class SuperAdminService {
  private tenants: TenantConfig[] = [
    {
      id: 'tenant-01',
      nombre: 'La Pezcaderia SAS',
      nit: '901.246.730',
      razonSocial: 'La Pezcadería S.A.S.',
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
    {
      id: 'tenant-03',
      nombre: 'Ferretería Josase',
      nit: '901.954.321-8',
      razonSocial: 'Ferretería Josase S.A.S.',
      rubro: 'FERRETERIA',
      activo: true,
      maxTerminales: 8,
      createdAt: '2026-10-28T07:00:00Z',
      contactoEmail: 'FERRETERIAJOSASE@HOTMAIL.COM',
      contactoTelefono: '+57 316 469 6581',
      sucursalesCount: 1,
    },
  ];

  private users: SuperAdminUser[] = [
    {
      id: 'user-01',
      tenantId: 'tenant-01',
      nombre: 'Yurgen Administrador',
      email: 'pezcaderia.2022@gmail.com',
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
    // Colaboradores de Ferretería Josase (tenant-03)
    {
      id: 'user-josase-01',
      tenantId: 'tenant-03',
      nombre: 'DIEGO IVAN DIAZ ANAYA',
      identificacion: '1099373207',
      email: 'DiegoDiazJosase@gmail.com',
      telefono: '3184291362',
      rol: 'VENDEDOR',
      activo: true,
      ultimoAcceso: '2026-10-28T07:00:00Z',
    },
    {
      id: 'user-josase-02',
      tenantId: 'tenant-03',
      nombre: 'LUIS EDUARDO BANQUEZ MEJIA',
      identificacion: '1050548644',
      email: 'LuisEduardoJosase@gmail.com',
      telefono: '3185660739',
      rol: 'VENDEDOR',
      activo: true,
      ultimoAcceso: '2026-10-28T07:00:00Z',
    },
    {
      id: 'user-josase-03',
      tenantId: 'tenant-03',
      nombre: 'DAVID SANTIAGO PALLARES',
      identificacion: '1001047015',
      email: 'SantiagoPallaresJosase@gmail.com',
      telefono: '3184291386',
      rol: 'VENDEDOR',
      activo: true,
      ultimoAcceso: '2026-10-28T07:00:00Z',
    },
    {
      id: 'user-josase-04',
      tenantId: 'tenant-03',
      nombre: 'JUAN MANUEL MORA MORA',
      identificacion: '1005078068',
      email: 'ManuelMoraJosase@gmail.com',
      telefono: '3185660733',
      rol: 'VENDEDOR',
      activo: true,
      ultimoAcceso: '2026-10-28T07:00:00Z',
    },
    {
      id: 'user-josase-05',
      tenantId: 'tenant-03',
      nombre: 'JEYMY KATERINE MONSALVE CACERES',
      identificacion: '1098812420',
      email: 'FERRETERIAJOSASE@HOTMAIL.COM',
      telefono: '3164696581',
      rol: 'VENDEDOR',
      activo: true,
      ultimoAcceso: '2026-10-28T07:00:00Z',
    },
    {
      id: 'user-josase-06',
      tenantId: 'tenant-03',
      nombre: 'LADY YURANI GALVIS GALVIS',
      identificacion: '1005369392',
      email: 'YuraniGalvisJosase@gmail.com',
      telefono: '3164696581',
      rol: 'CAJERO',
      activo: true,
      ultimoAcceso: '2026-10-28T07:00:00Z',
    },
    {
      id: 'user-josase-07',
      tenantId: 'tenant-03',
      nombre: 'LINA MARIA SOTO',
      identificacion: '1098000001',
      email: 'LinaSotoJosase@gmail.com',
      telefono: '3164696581',
      rol: 'ADMIN',
      activo: true,
      ultimoAcceso: '2026-10-28T07:00:00Z',
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
    const staticUsers = tenantId ? this.users.filter((u) => u.tenantId === tenantId) : [...this.users];

    // Obtener usuarios dinámicos creados en el tenant
    const dynamicUsers: SuperAdminUser[] = (
      tenantId ? userManagementService.obtenerUsuariosPorTenant(tenantId) : []
    ).map((u) => {
      let roleMapped: 'ADMIN' | 'VENDEDOR' | 'CAJERO' | 'SUPERVISOR' = 'VENDEDOR';
      if (u.rol === 'ADMINISTRADOR' || u.rol === 'GERENTE') roleMapped = 'ADMIN';
      else if (u.rol === 'CAJERO') roleMapped = 'CAJERO';
      else if (u.rol === 'SUPERVISOR') roleMapped = 'SUPERVISOR';
      else roleMapped = 'VENDEDOR';

      return {
        id: u.id,
        tenantId: u.tenantId,
        nombre: u.nombre,
        identificacion: u.identificacion,
        email: u.email,
        telefono: u.telefono,
        rol: roleMapped,
        activo: u.activo,
        ultimoAcceso: u.updatedAt,
      };
    });

    const combined = [...staticUsers];
    for (const d of dynamicUsers) {
      if (!combined.some((c) => c.id === d.id || c.email === d.email)) {
        combined.push(d);
      }
    }

    return combined;
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
