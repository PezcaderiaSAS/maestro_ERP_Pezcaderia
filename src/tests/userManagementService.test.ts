import { describe, it, expect, beforeEach } from 'vitest';
import { userManagementService } from '../services/userManagementService';
import type { UserCreationInput } from '../schemas/auth.schema';

describe('TASK-036-02: userManagementService & Gestión de Credenciales con Supabase Auth', () => {
  const TENANT_A = 'tenant-pezcaderia-01';
  const TENANT_B = 'tenant-ferreon-02';

  beforeEach(() => {
    userManagementService.limpiarEnMemoria();
  });

  describe('1. Creación de Usuario con Cédula como Contraseña Inicial', () => {
    it('debe crear un usuario exitosamente con password = identificacion y mustChangePassword = true', async () => {
      const input: UserCreationInput = {
        nombre: 'Yurgen Martinez',
        identificacion: '1098765432',
        email: 'yurgen@pezcaderia.com',
        telefono: '3151234567',
        rol: 'ADMINISTRADOR',
        permisosPersonalizados: {
          'pos.access': true,
          'pos.apply_discounts': true,
        },
      };

      const resultado = await userManagementService.crearUsuario(TENANT_A, input);

      expect(resultado.ok).toBe(true);
      expect(resultado.usuario).toBeDefined();
      expect(resultado.usuario?.nombre).toBe('Yurgen Martinez');
      expect(resultado.usuario?.identificacion).toBe('1098765432');
      expect(resultado.usuario?.email).toBe('yurgen@pezcaderia.com');
      expect(resultado.usuario?.tenantId).toBe(TENANT_A);
      expect(resultado.usuario?.mustChangePassword).toBe(true);
      expect(resultado.usuario?.permisos['pos.apply_discounts']).toBe(true);
    });

    it('debe rechazar la creación de un usuario con correo o cédula duplicada dentro del mismo tenant', async () => {
      const input: UserCreationInput = {
        nombre: 'Cajero Primero',
        identificacion: '88888888',
        email: 'cajero1@pezcaderia.com',
        telefono: '3001112233',
        rol: 'CAJERO',
        permisosPersonalizados: {},
      };

      await userManagementService.crearUsuario(TENANT_A, input);

      // Intentar crear con la misma cédula
      const resDuplicadoCedula = await userManagementService.crearUsuario(TENANT_A, {
        ...input,
        email: 'otro.email@pezcaderia.com',
      });
      expect(resDuplicadoCedula.ok).toBe(false);
      expect(resDuplicadoCedula.error).toMatch(/identificación|cédula ya registrada/i);

      // Intentar crear con el mismo correo
      const resDuplicadoEmail = await userManagementService.crearUsuario(TENANT_A, {
        ...input,
        identificacion: '99999999',
      });
      expect(resDuplicadoEmail.ok).toBe(false);
      expect(resDuplicadoEmail.error).toMatch(/ya existe un usuario con el correo/i);
    });
  });

  describe('2. Cambio Forzoso de Contraseña en Primer Acceso', () => {
    it('debe permitir cambiar la contraseña provisional y desactivar mustChangePassword', async () => {
      const input: UserCreationInput = {
        nombre: 'Vendedor Novato',
        identificacion: '55555555',
        email: 'vendedor@pezcaderia.com',
        telefono: '3105556677',
        rol: 'VENDEDOR',
        permisosPersonalizados: {},
      };

      const creado = await userManagementService.crearUsuario(TENANT_A, input);
      const userId = creado.usuario!.id;

      expect(creado.usuario?.mustChangePassword).toBe(true);

      const resCambio = await userManagementService.actualizarPasswordInicial(
        userId,
        'NuevaPasswordSegura2026',
        'NuevaPasswordSegura2026'
      );

      expect(resCambio.ok).toBe(true);
      expect(resCambio.usuario?.mustChangePassword).toBe(false);

      // Validar que la información persistida ahora tenga mustChangePassword en false
      const usuarioActualizado = userManagementService.obtenerUsuarioPorId(userId);
      expect(usuarioActualizado?.mustChangePassword).toBe(false);
    });

    it('debe rechazar contraseñas que no coincidan o no cumplan la política de fortaleza', async () => {
      const input: UserCreationInput = {
        nombre: 'Vendedor Dos',
        identificacion: '66666666',
        email: 'vendedor2@pezcaderia.com',
        telefono: '3106667788',
        rol: 'VENDEDOR',
        permisosPersonalizados: {},
      };

      const creado = await userManagementService.crearUsuario(TENANT_A, input);
      const userId = creado.usuario!.id;

      const resNoCoincide = await userManagementService.actualizarPasswordInicial(
        userId,
        'Password1234',
        'Password9999'
      );
      expect(resNoCoincide.ok).toBe(false);
      expect(resNoCoincide.error).toMatch(/no coinciden/i);

      const resDebil = await userManagementService.actualizarPasswordInicial(
        userId,
        'corta',
        'corta'
      );
      expect(resDebil.ok).toBe(false);
      expect(resDebil.error).toMatch(/8 caracteres|mayúscula|número/i);
    });
  });

  describe('3. Aislamiento Multi-Tenant y Matriz de Permisos', () => {
    it('debe filtrar estrictamente los usuarios pertenecientes al tenant consultado', async () => {
      await userManagementService.crearUsuario(TENANT_A, {
        nombre: 'Admin Pezcaderia',
        identificacion: '11111111',
        email: 'admin@pezcaderia.com',
        telefono: '3101111111',
        rol: 'ADMINISTRADOR',
        permisosPersonalizados: {},
      });

      await userManagementService.crearUsuario(TENANT_B, {
        nombre: 'Admin FerreOn',
        identificacion: '22222222',
        email: 'admin@ferreon.com',
        telefono: '3102222222',
        rol: 'ADMINISTRADOR',
        permisosPersonalizados: {},
      });

      const usuariosTenantA = userManagementService.obtenerUsuariosPorTenant(TENANT_A);
      const usuariosTenantB = userManagementService.obtenerUsuariosPorTenant(TENANT_B);

      expect(usuariosTenantA).toHaveLength(1);
      expect(usuariosTenantA[0].nombre).toBe('Admin Pezcaderia');

      expect(usuariosTenantB).toHaveLength(1);
      expect(usuariosTenantB[0].nombre).toBe('Admin FerreOn');
    });

    it('debe actualizar la matriz de permisos de un usuario existente', async () => {
      const creado = await userManagementService.crearUsuario(TENANT_A, {
        nombre: 'Bodeguero Uno',
        identificacion: '33333333',
        email: 'bodega@pezcaderia.com',
        telefono: '3103333333',
        rol: 'BODEGUERO',
        permisosPersonalizados: {
          'inventory.view': true,
        },
      });

      const userId = creado.usuario!.id;

      const resUpdate = userManagementService.actualizarPermisosUsuario(userId, {
        'inventory.view': true,
        'inventory.adjust': true,
        'pos.apply_discounts': false,
      });

      expect(resUpdate.ok).toBe(true);
      expect(resUpdate.usuario?.permisos['inventory.adjust']).toBe(true);
      expect(resUpdate.usuario?.permisos['pos.apply_discounts']).toBe(false);
    });
  });
});
