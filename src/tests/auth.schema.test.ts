import { describe, it, expect } from 'vitest';
import {
  validarTenantOnboarding,
  validarEmployeeInvitation,
  validarAcceptInvitation,
  validarLoginEmail,
  SUPPORTED_RBAC_ROLES,
} from '../schemas/auth.schema';

describe('TASK-035-01: Contratos Zod de Autenticación, Onboarding e Invitaciones', () => {
  describe('1. Validar Onboarding de Empresa (TenantOnboardingSchema)', () => {
    it('debe aceptar datos válidos de registro de empresa', () => {
      const payload = {
        razonSocial: 'Pescados y Mariscos del Caribe S.A.S.',
        nit: '900.123.456-7',
        ciudad: 'Cartagena',
        direccion: 'Muelle La Bodeguita Local 4',
        telefono: '3101234567',
        regimenTributario: 'COMUN',
      };

      const result = validarTenantOnboarding(payload);
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.razonSocial).toBe('Pescados y Mariscos del Caribe S.A.S.');
        expect(result.data.nit).toBe('900.123.456-7');
        expect(result.data.ciudad).toBe('Cartagena');
      }
    });

    it('debe rechazar razón social menor a 3 caracteres o vacía', () => {
      const payload = {
        razonSocial: 'AB',
        nit: '900.123.456-7',
        ciudad: 'Bogotá',
        telefono: '3101234567',
      };

      const result = validarTenantOnboarding(payload);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/razón social|mínimo 3/i);
    });

    it('debe rechazar NIT vacío o con formato inválido', () => {
      const payload = {
        razonSocial: 'Distribuidora Pescamar',
        nit: '123',
        ciudad: 'Medellín',
        telefono: '3101234567',
      };

      const result = validarTenantOnboarding(payload);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/nit|válido/i);
    });

    it('debe rechazar teléfono menor a 7 dígitos', () => {
      const payload = {
        razonSocial: 'Distribuidora Pescamar',
        nit: '901.444.555-1',
        ciudad: 'Medellín',
        telefono: '12345',
      };

      const result = validarTenantOnboarding(payload);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/teléfono|mínimo 7/i);
    });
  });

  describe('2. Validar Invitación de Empleados (EmployeeInvitationSchema)', () => {
    it('debe aceptar invitación con email válido y rol soportado', () => {
      const payload = {
        nombre: 'Carlos Vendedor Mostrador',
        email: 'carlos.mostrador@pezcaderia.com',
        rol: 'vendedor',
      };

      const result = validarEmployeeInvitation(payload);
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.nombre).toBe('Carlos Vendedor Mostrador');
        expect(result.data.email).toBe('carlos.mostrador@pezcaderia.com');
        expect(result.data.rol).toBe('vendedor');
      }
    });

    it('debe rechazar correo electrónico con sintaxis inválida', () => {
      const payload = {
        nombre: 'Ana Cajera',
        email: 'correo-sin-arroba.com',
        rol: 'cajero',
      };

      const result = validarEmployeeInvitation(payload);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/correo|email/i);
    });

    it('debe rechazar rol desconocido no presente en SUPPORTED_RBAC_ROLES', () => {
      const payload = {
        nombre: 'Pedro Intruso',
        email: 'pedro@empresa.com',
        rol: 'hacker_role',
      };

      const result = validarEmployeeInvitation(payload as any);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/rol/i);
    });

    it('debe soportar los 6 roles oficiales del ERP', () => {
      SUPPORTED_RBAC_ROLES.forEach((rol) => {
        const payload = {
          nombre: `Empleado ${rol}`,
          email: `${rol}@empresa.com`,
          rol,
        };
        const result = validarEmployeeInvitation(payload);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('3. Validar Canje de Invitación (AcceptInvitationSchema)', () => {
    it('debe aceptar token y userId con formato adecuado', () => {
      const payload = {
        token: 'inv-tok-99283-abc-7712',
        userId: '11111111-2222-3333-4444-555555555555',
      };

      const result = validarAcceptInvitation(payload);
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.token).toBe('inv-tok-99283-abc-7712');
      }
    });

    it('debe rechazar token vacío', () => {
      const payload = {
        token: '',
        userId: '11111111-2222-3333-4444-555555555555',
      };

      const result = validarAcceptInvitation(payload);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/token/i);
    });
  });

  describe('4. Validar Login con Correo (LoginEmailSchema)', () => {
    it('debe aceptar correo y contraseña válidos', () => {
      const payload = {
        email: 'admin@pezcaderia.com',
        password: 'PasswordSegura2026*',
      };

      const result = validarLoginEmail(payload);
      expect(result.success).toBe(true);
    });

    it('debe rechazar contraseña menor a 6 caracteres', () => {
      const payload = {
        email: 'admin@pezcaderia.com',
        password: '123',
      };

      const result = validarLoginEmail(payload);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/contraseña|mínimo 6/i);
    });
  });
});
